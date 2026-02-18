import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import type { HouseholdMember } from '@/lib/types';

interface MembersSectionProps {
  members: HouseholdMember[] | undefined;
  membersLoading: boolean;
  canEdit: boolean;
  currentUserEmail: string | null | undefined;
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
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();
  const roleColor =
    member.role === 'admin' ? colors.warning : colors.text.muted;

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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: fontWeight.medium,
              color: colors.content.heading,
            }}
          >
            {member.display_name || member.email}
          </Text>
          {isSelf && (
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.content.subtitle,
              }}
            >
              (you)
            </Text>
          )}
        </View>
        {member.display_name && (
          <Text style={{ fontSize: fontSize.sm, color: colors.content.strong }}>
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
        <Button
          variant="icon"
          tone="destructive"
          onPress={onRemove}
          icon="trash-outline"
          iconSize={18}
          style={{ padding: spacing.sm }}
        />
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
  const { colors, borderRadius, shadows } = useTheme();
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
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <TextInput
          value={newMemberEmail}
          onChangeText={onNewMemberEmailChange}
          placeholder={t('settings.addMemberPlaceholder')}
          placeholderTextColor={colors.content.subtitle}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: fontSize.md,
            color: colors.content.body,
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
              backgroundColor:
                newMemberRole === role ? colors.primary : colors.white,
              borderRadius: borderRadius.sm,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color:
                  newMemberRole === role ? colors.white : colors.content.body,
                fontWeight: fontWeight.medium,
                fontSize: fontSize.sm,
              }}
            >
              {t(`labels.role.${role}` as 'labels.role.member')}
            </Text>
          </Pressable>
        ))}

        <Button
          variant="text"
          onPress={onAddMember}
          disabled={!newMemberEmail.trim()}
          isPending={isAddPending}
          icon="person-add"
          iconSize={14}
          label={t('admin.addMemberButton')}
          textColor={
            newMemberEmail.trim() ? colors.white : colors.content.subtitle
          }
          color={newMemberEmail.trim() ? colors.primary : colors.bgDark}
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
          }}
        />
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
  const { colors, borderRadius, shadows } = useTheme();
  const { t } = useTranslation();

  return (
    <>
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
          <Text style={{ color: colors.content.strong, fontSize: fontSize.sm }}>
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
    </>
  );
};
