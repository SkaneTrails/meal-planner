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
  Button,
  FullScreenLoading,
  ScreenHeader,
  ScreenLayout,
  SurfaceCard,
} from '@/components';
import {
  CreateHouseholdModal,
  HouseholdCard,
  HouseholdDetailModal,
} from '@/components/admin';
import { showNotification } from '@/lib/alert';
import {
  useCreateHousehold,
  useCurrentUser,
  useHouseholds,
} from '@/lib/hooks/use-admin';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { Household } from '@/lib/types';

export default function AdminScreen() {
  const { colors } = useTheme();
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
    return <FullScreenLoading />;
  }

  if (!currentUser || currentUser.role !== 'superuser') {
    return (
      <FullScreenLoading
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
    <ScreenLayout>
      <ScreenHeader
        variant="large"
        title={t('tabs.admin')}
        subtitle={t('admin.subtitle')}
        onBack={() => router.back()}
      />

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
              <Text style={{ color: colors.text.muted, marginTop: spacing.md }}>
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
    </ScreenLayout>
  );
}

const CurrentUserInfo = ({ email, role }: { email: string; role: string }) => {
  const { t } = useTranslation();
  const { colors, borderRadius } = useTheme();

  return (
    <SurfaceCard
      radius="lg"
      padding={spacing.md}
      style={{
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
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
    </SurfaceCard>
  );
};

const HouseholdsListHeader = ({ onCreateNew }: { onCreateNew: () => void }) => {
  const { t } = useTranslation();
  const { colors, borderRadius } = useTheme();

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
      <Button
        variant="text"
        onPress={onCreateNew}
        icon="add"
        label={t('admin.newButton')}
        tone="primary"
        style={{
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.lg,
        }}
      />
    </View>
  );
};
