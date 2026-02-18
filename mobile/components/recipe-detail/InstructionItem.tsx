import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { IconCircle } from '@/components';
import {
  fontSize,
  letterSpacing,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';
import type { StructuredInstruction } from '@/lib/types';

interface InstructionItemProps {
  instruction: StructuredInstruction;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
  stepNumber?: number;
}

export const InstructionItem = ({
  instruction,
  index,
  isCompleted,
  onToggle,
  stepNumber,
}: InstructionItemProps) => {
  const { colors, fonts, borderRadius, shadows } = useTheme();
  const { type, content, time } = instruction;

  if (type === 'tip') {
    return (
      <View
        style={{
          marginLeft: 44,
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.glass.subtle,
          borderRadius: borderRadius.sm,
          marginBottom: spacing.sm,
          borderLeftWidth: 2,
          borderLeftColor: colors.ai.primary,
          ...shadows.card,
        }}
      >
        <Ionicons
          name="bulb-outline"
          size={15}
          color={colors.ai.primary}
          style={{ marginRight: spacing.sm, marginTop: 2 }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: fontSize.md,
            fontFamily: fonts.body,
            color: colors.content.body,
            lineHeight: lineHeight.md,
            fontStyle: 'italic',
          }}
        >
          {content}
        </Text>
      </View>
    );
  }

  if (type === 'heading') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: index > 0 ? spacing.xl : spacing.sm,
          marginBottom: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: colors.surface.divider,
          }}
        />
        <Text
          style={{
            fontSize: fontSize['2xl'],
            fontFamily: fonts.displayBold,
            color: colors.content.body,
            letterSpacing: letterSpacing.normal,
            paddingHorizontal: spacing.md,
          }}
        >
          {content}
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: colors.surface.divider,
          }}
        />
      </View>
    );
  }

  const hasTime = type === 'timeline' && time !== null && time !== undefined;
  const displayNumber = stepNumber ?? 1;

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: isCompleted
          ? colors.successBg
          : pressed
            ? colors.glass.dark
            : colors.glass.faint,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        opacity: isCompleted ? 0.7 : 1,
        ...shadows.card,
      })}
    >
      <IconCircle
        size="sm"
        bg={isCompleted ? colors.success : colors.content.body}
        style={{
          marginRight: spacing.md,
          marginTop: 2,
        }}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={18} color={colors.white} />
        ) : (
          <Text
            style={{
              color: colors.white,
              fontSize: fontSize.lg,
              fontFamily: fonts.bodyBold,
            }}
          >
            {displayNumber}
          </Text>
        )}
      </IconCircle>
      <View style={{ flex: 1 }}>
        {hasTime && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.timeline.badge,
              paddingHorizontal: spacing['sm-md'],
              paddingVertical: 3,
              borderRadius: borderRadius['sm-md'],
              alignSelf: 'flex-start',
              marginBottom: spacing.xs,
            }}
          >
            <Ionicons name="time-outline" size={11} color={colors.white} />
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fonts.bodySemibold,
                color: colors.white,
                marginLeft: 4,
              }}
            >
              {time} min
            </Text>
          </View>
        )}
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: fonts.body,
            color: isCompleted
              ? colors.timeline.completedText
              : colors.content.body,
            lineHeight: lineHeight.lg,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}
        >
          {content}
        </Text>
      </View>
    </Pressable>
  );
};
