import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionButton, Button, Chip, ContentCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { fontSize, spacing, useTheme } from '@/lib/theme';
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
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const roleColor =
    member.role === 'admin' ? colors.warning : colors.content.subtitle;

  return (
    <ContentCard
      variant="surface"
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
              fontFamily: fonts.bodyMedium,
              color: colors.content.heading,
            }}
          >
            {member.display_name || member.email}
          </Text>
          {isSelf && (
            <Text
              style={{
                fontSize: fontSize.xs,
                fontFamily: fonts.body,
                color: colors.content.subtitle,
              }}
            >
              (you)
            </Text>
          )}
        </View>
        {member.display_name && (
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
              color: colors.content.strong,
            }}
          >
            {member.email}
          </Text>
        )}
        <View style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}>
          <Chip
            label={t(`labels.role.${member.role}` as 'labels.role.member')}
            variant="display"
            bg={roleColor + '20'}
            color={roleColor}
            uppercase
            size="sm"
          />
        </View>
      </View>
      {canEdit && !isSelf && (
        <ActionButton.Delete onPress={onRemove} iconSize={18} hitSlop={8} />
      )}
    </ContentCard>
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
  const { colors, fonts, borderRadius } = useTheme();
  const { t } = useTranslation();

  return (
    <ContentCard variant="surface" style={{ marginTop: spacing.sm }}>
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
            backgroundColor: colors.input.bg,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: fontSize.md,
            fontFamily: fonts.body,
            color: colors.input.text,
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
                fontFamily: fonts.bodyMedium,
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
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
          }}
        />
      </View>
    </ContentCard>
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
  const { colors, fonts } = useTheme();
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
        <ContentCard variant="surface" style={{ alignItems: 'center' }}>
          <Text
            style={{
              color: colors.content.strong,
              fontSize: fontSize.sm,
              fontFamily: fonts.body,
            }}
          >
            {t('admin.noMembers')}
          </Text>
        </ContentCard>
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
