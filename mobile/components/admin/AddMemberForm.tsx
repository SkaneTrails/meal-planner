import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '@/components';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';

interface AddMemberFormProps {
  newMemberEmail: string;
  onEmailChange: (email: string) => void;
  newMemberRole: 'admin' | 'member';
  onRoleChange: (role: 'admin' | 'member') => void;
  onSubmit: () => void;
  onClose: () => void;
  isPending: boolean;
}

export const AddMemberForm = ({
  newMemberEmail,
  onEmailChange,
  newMemberRole,
  onRoleChange,
  onSubmit,
  onClose,
  isPending,
}: AddMemberFormProps) => {
  const { t } = useTranslation();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.bgLight,
        padding: spacing.lg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        ...shadows.lg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: '#3D3D3D' }}>
          {t('admin.addMember.title')}
        </Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={24} color="#8B7355" />
        </Pressable>
      </View>

      <TextInput
        value={newMemberEmail}
        onChangeText={onEmailChange}
        placeholder={t('admin.addMember.emailPlaceholder')}
        placeholderTextColor="#8B735580"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          fontSize: fontSize.md,
          color: '#3D3D3D',
          marginBottom: spacing.sm,
        }}
      />

      <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
        {(['member', 'admin'] as const).map((role) => (
          <Pressable
            key={role}
            onPress={() => onRoleChange(role)}
            style={{
              flex: 1,
              padding: spacing.sm,
              marginRight: role === 'member' ? spacing.sm : 0,
              backgroundColor: newMemberRole === role ? '#3D3D3D' : colors.white,
              borderRadius: borderRadius.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: newMemberRole === role ? 'white' : '#3D3D3D',
                fontWeight: fontWeight.medium,
              }}
            >
              {t(`labels.role.${role}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <AnimatedPressable
        onPress={onSubmit}
        disabled={!newMemberEmail.trim() || isPending}
        hoverScale={1.02}
        pressScale={0.97}
        disableAnimation={!newMemberEmail.trim() || isPending}
        style={{
          backgroundColor: !newMemberEmail.trim() ? '#C5B8A8' : '#3D3D3D',
          padding: spacing.md,
          borderRadius: borderRadius.lg,
          alignItems: 'center',
        }}
      >
        {isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
            {t('admin.addMember.button')}
          </Text>
        )}
      </AnimatedPressable>
    </View>
  );
};
