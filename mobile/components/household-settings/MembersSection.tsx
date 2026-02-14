import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable, SectionHeader } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';
import type { HouseholdMember } from '@/lib/types';

interface MembersSectionProps {
  members: HouseholdMember[] | undefined;
  membersLoading: boolean;
  canEdit: boolean;
  currentUserEmail: string | undefined;
  newMemberEmail: string;
  onNewMemberEmailChange: (email: string) => void;
  newMemberRole: 'admin' | 'member';
  onNewMemberRoleChange: (role: 'admin' | 'member') => void;
  onAddMember: () => void;
  onRemoveMember: (member: HouseholdMember) => void;
  isAddPending: boolean;
}

const MemberCard = ({
  member,
  isSelf,
  canEdit,
  onRemove,
}: {
  member: HouseholdMember;
  isSelf: boolean;
  canEdit: boolean;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const roleColor = member.role === 'admin' ? colors.warning : colors.text.muted;

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.medium,
              color: colors.text.inverse,
            }}
          >
            {member.display_name || member.email}
          </Text>
          {isSelf && (
            <Text style={{ fontSize: fontSize.xs, color: colors.text.inverse + '60' }}>
              (you)
            </Text>
          )}
        </View>
        {member.display_name && (
          <Text style={{ fontSize: fontSize.sm, color: colors.text.inverse + '80' }}>
            {member.email}
          </Text>
        )}
        <View
          style={{
            backgroundColor: roleColor + '20',
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: borderRadius.full,
            alignSelf: 'flex-start',
            marginTop: spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xs,
              color: roleColor,
              fontWeight: fontWeight.medium,
              textTransform: 'uppercase',
            }}
          >
            {t(`labels.role.${member.role}` as 'labels.role.member')}
          </Text>
        </View>
      </View>
      {canEdit && !isSelf && (
        <AnimatedPressable
          onPress={onRemove}
          hoverScale={1.1}
          pressScale={0.9}
          style={{ padding: spacing.sm }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </AnimatedPressable>
      )}
    </View>
  );
};

const AddMemberForm = ({
  newMemberEmail,
  onNewMemberEmailChange,
  newMemberRole,
  onNewMemberRoleChange,
  onAddMember,
  isAddPending,
}: Pick<
  MembersSectionProps,
  | 'newMemberEmail'
  | 'onNewMemberEmailChange'
  | 'newMemberRole'
  | 'onNewMemberRoleChange'
  | 'onAddMember'
  | 'isAddPending'
>) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
        ...shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
        <TextInput
          value={newMemberEmail}
          onChangeText={onNewMemberEmailChange}
          placeholder={t('settings.addMemberPlaceholder')}
          placeholderTextColor={colors.text.inverse + '60'}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: fontSize.md,
            color: colors.text.inverse,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['member', 'admin'] as const).map((role) => (
          <Pressable
            key={role}
            onPress={() => onNewMemberRoleChange(role)}
            style={{
              flex: 1,
              paddingVertical: spacing.xs,
              backgroundColor: newMemberRole === role ? colors.primary : colors.white,
              borderRadius: borderRadius.sm,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: newMemberRole === role ? colors.white : colors.text.inverse,
                fontWeight: fontWeight.medium,
                fontSize: fontSize.sm,
              }}
            >
              {t(`labels.role.${role}` as 'labels.role.member')}
            </Text>
          </Pressable>
        ))}

        <AnimatedPressable
          onPress={onAddMember}
          disabled={!newMemberEmail.trim() || isAddPending}
          hoverScale={1.02}
          pressScale={0.97}
          disableAnimation={!newMemberEmail.trim() || isAddPending}
          style={{
            backgroundColor: newMemberEmail.trim() ? colors.primary : colors.bgDark,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isAddPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons
                name="person-add"
                size={14}
                color={newMemberEmail.trim() ? colors.white : colors.text.inverse + '60'}
              />
              <Text
                style={{
                  color: newMemberEmail.trim() ? colors.white : colors.text.inverse + '60',
                  fontWeight: fontWeight.medium,
                  fontSize: fontSize.sm,
                }}
              >
                {t('admin.addMemberButton')}
              </Text>
            </>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
};

export const MembersSection = ({
  members,
  membersLoading,
  canEdit,
  currentUserEmail,
  newMemberEmail,
  onNewMemberEmailChange,
  newMemberRole,
  onNewMemberRoleChange,
  onAddMember,
  onRemoveMember,
  isAddPending,
}: MembersSectionProps) => {
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: spacing['2xl'] }}>
      <SectionHeader
        icon="people"
        title={t('settings.membersSection')}
        subtitle={t('settings.membersSectionDesc')}
      />

      {membersLoading ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{ marginVertical: spacing.md }}
        />
      ) : members && members.length > 0 ? (
        <View style={{ gap: spacing.xs }}>
          {members.map((member) => (
            <MemberCard
              key={member.email}
              member={member}
              isSelf={member.email === currentUserEmail}
              canEdit={canEdit}
              onRemove={() => onRemoveMember(member)}
            />
          ))}
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.glass.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            alignItems: 'center',
            ...shadows.sm,
          }}
        >
          <Text style={{ color: colors.text.inverse + '80', fontSize: fontSize.sm }}>
            {t('admin.noMembers')}
          </Text>
        </View>
      )}

      {canEdit && (
        <AddMemberForm
          newMemberEmail={newMemberEmail}
          onNewMemberEmailChange={onNewMemberEmailChange}
          newMemberRole={newMemberRole}
          onNewMemberRoleChange={onNewMemberRoleChange}
          onAddMember={onAddMember}
          isAddPending={isAddPending}
        />
      )}
    </View>
  );
};
