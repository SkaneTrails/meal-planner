/**
 * Admin screen - Household management for superusers.
 * Shows household list, member management, and creation options.
 * Only visible to users with 'superuser' role.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import {
  AnimatedPressable,
  FullScreenLoading,
  GradientBackground,
} from '@/components';
import {
  CreateHouseholdModal,
  HouseholdCard,
  HouseholdDetailModal,
} from '@/components/admin';
import { ScreenTitle } from '@/components/ScreenTitle';
import { showNotification } from '@/lib/alert';
import {
  useCreateHousehold,
  useCurrentUser,
  useHouseholds,
} from '@/lib/hooks/use-admin';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  circleStyle,
  colors,
  fontSize,
  fontWeight,
  iconContainer,
  shadows,
  spacing,
} from '@/lib/theme';
import type { Household } from '@/lib/types';

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const {
    data: households,
    isLoading: householdsLoading,
    refetch: refetchHouseholds,
  } = useHouseholds();
  const createHousehold = useCreateHousehold();

  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');

  if (userLoading) {
    return <FullScreenLoading background="muted" />;
  }

  if (!currentUser || currentUser.role !== 'superuser') {
    return (
      <FullScreenLoading
        background="muted"
        icon="lock-closed"
        title={t('admin.accessRequired')}
        subtitle={t('admin.accessRequiredMessage')}
      />
    );
  }

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return;
    try {
      await createHousehold.mutateAsync({ name: newHouseholdName.trim() });
      setShowCreateModal(false);
      setNewHouseholdName('');
      refetchHouseholds();
    } catch (error) {
      if (__DEV__) console.error('Failed to create household:', error);
      showNotification(t('common.error'), t('admin.failedToCreateHousehold'));
    }
  };

  return (
    <GradientBackground muted>
      <View style={{ flex: 1 }}>
        <AdminHeader onBack={() => router.back()} />

        <CurrentUserInfo email={currentUser.email} role={currentUser.role} />

        <View style={{ flex: 1 }}>
          <HouseholdsListHeader onCreateNew={() => setShowCreateModal(true)} />

          <FlatList
            data={households || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HouseholdCard
                household={item}
                onPress={() => setSelectedHousehold(item)}
              />
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: 70,
            }}
            refreshControl={
              <RefreshControl
                refreshing={householdsLoading}
                onRefresh={() => refetchHouseholds()}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', padding: spacing.xl }}>
                <Ionicons
                  name="home-outline"
                  size={48}
                  color={colors.text.muted}
                />
                <Text
                  style={{ color: colors.text.muted, marginTop: spacing.md }}
                >
                  {t('admin.noHouseholds')}
                </Text>
              </View>
            }
          />
        </View>

        <CreateHouseholdModal
          visible={showCreateModal}
          householdName={newHouseholdName}
          onHouseholdNameChange={setNewHouseholdName}
          onCreate={handleCreateHousehold}
          onClose={() => setShowCreateModal(false)}
          isPending={createHousehold.isPending}
        />

        {selectedHousehold && (
          <HouseholdDetailModal
            household={selectedHousehold}
            onClose={() => setSelectedHousehold(null)}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const AdminHeader = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <AnimatedPressable
        onPress={onBack}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          ...circleStyle(iconContainer.md),
          backgroundColor: colors.glass.button,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
          ...shadows.sm,
        }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.white} />
      </AnimatedPressable>
      <View style={{ flex: 1 }}>
        <ScreenTitle
          variant="large"
          title={t('tabs.admin')}
          subtitle={t('admin.subtitle')}
        />
      </View>
    </View>
  );
};

const CurrentUserInfo = ({ email, role }: { email: string; role: string }) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
      }}
    >
      <Text
        style={{ fontSize: fontSize.sm, color: colors.text.inverse + '99' }}
      >
        {t('admin.loggedInAs')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.medium,
          color: colors.text.inverse,
        }}
      >
        {email}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.xs,
        }}
      >
        <View
          style={{
            backgroundColor: colors.success + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: borderRadius.full,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.success,
              fontWeight: fontWeight.medium,
              textTransform: 'uppercase',
            }}
          >
            {t(`labels.role.${role}` as 'labels.role.member')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const HouseholdsListHeader = ({ onCreateNew }: { onCreateNew: () => void }) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize['2xl'],
          fontWeight: fontWeight.semibold,
          color: colors.text.inverse,
        }}
      >
        {t('admin.households')}
      </Text>
      <AnimatedPressable
        onPress={onCreateNew}
        hoverScale={1.05}
        pressScale={0.95}
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="add" size={18} color={colors.white} />
        <Text
          style={{
            color: colors.white,
            fontWeight: fontWeight.medium,
            marginLeft: 4,
          }}
        >
          {t('admin.newButton')}
        </Text>
      </AnimatedPressable>
    </View>
  );
};
