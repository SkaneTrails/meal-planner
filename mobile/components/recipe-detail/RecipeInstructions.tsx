import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { IconCircle } from '@/components';
import type { TFunction } from '@/lib/i18n';
import {
  fontSize,
  lineHeight,
  spacing,
  typography,
  useTheme,
} from '@/lib/theme';
import type { Recipe } from '@/lib/types';
import { InstructionItem } from './InstructionItem';

interface RecipeInstructionsProps {
  recipe: Recipe;
  completedSteps: Set<number>;
  t: TFunction;
  onToggleStep: (index: number) => void;
}

export const RecipeInstructions = ({
  recipe,
  completedSteps,
  t,
  onToggleStep,
}: RecipeInstructionsProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  return (
    <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <IconCircle
          size="xs"
          bg={colors.surface.active}
          style={{ marginRight: spacing.md }}
        >
          <Ionicons name="book" size={18} color={colors.content.body} />
        </IconCircle>
        <Text
          style={{
            ...typography.displaySmall,
            color: colors.content.heading,
          }}
        >
          {t('recipe.instructions')}
        </Text>
        {completedSteps.size > 0 && recipe.instructions.length > 0 && (
          <Text
            style={{
              marginLeft: 'auto',
              fontSize: fontSize.md,
              color: colors.success,
              fontFamily: fonts.bodyMedium,
            }}
          >
            {t('recipe.stepsDone', {
              completed: completedSteps.size,
              total: recipe.instructions.length,
            })}
          </Text>
        )}
      </View>
      {recipe.instructions.length === 0 ? (
        <Text
          style={{
            color: colors.gray[500],
            fontSize: fontSize.xl,
            fontStyle: 'italic',
          }}
        >
          {t('recipe.noInstructions')}
        </Text>
      ) : recipe.structured_instructions ? (
        <View style={{ position: 'relative' }}>
          <View
            style={{
              position: 'absolute',
              left: 27,
              top: 24,
              bottom: 24,
              width: 2,
              backgroundColor: colors.timeline.line,
              borderRadius: 1,
            }}
          />
          {(() => {
            let stepCounter = 0;
            return recipe.structured_instructions.map((instruction, index) => {
              const isNumbered =
                instruction.type === 'timeline' || instruction.type === 'step';
              if (isNumbered) stepCounter++;
              return (
                <InstructionItem
                  key={index}
                  instruction={instruction}
                  index={index}
                  isCompleted={completedSteps.has(index)}
                  onToggle={() => onToggleStep(index)}
                  stepNumber={isNumbered ? stepCounter : undefined}
                />
              );
            });
          })()}
        </View>
      ) : (
        recipe.instructions.map((instruction, index) => {
          const isCompleted = completedSteps.has(index);
          return (
            <Pressable
              key={index}
              onPress={() => onToggleStep(index)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'flex-start',
                paddingVertical: spacing.md,
                backgroundColor: isCompleted
                  ? colors.successBg
                  : index % 2 === 0
                    ? colors.gray[50]
                    : pressed
                      ? colors.bgMid
                      : 'transparent',
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.xs,
                opacity: isCompleted ? 0.7 : 1,
              })}
            >
              <IconCircle
                size="sm"
                bg={isCompleted ? colors.success : colors.primary}
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
                    {index + 1}
                  </Text>
                )}
              </IconCircle>
              <Text
                style={{
                  flex: 1,
                  fontSize: fontSize.xl,
                  fontFamily: fonts.body,
                  color: isCompleted
                    ? colors.timeline.completedText
                    : colors.text.inverse,
                  lineHeight: lineHeight.xl,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                }}
              >
                {instruction}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
};
