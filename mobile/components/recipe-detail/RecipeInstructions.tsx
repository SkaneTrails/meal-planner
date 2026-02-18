import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { IconCircle, Section, TerminalFrame } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, lineHeight, spacing, useTheme } from '@/lib/theme';
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
  const { colors, fonts, borderRadius, crt } = useTheme();

  const stepCounter =
    completedSteps.size > 0 && recipe.instructions.length > 0 ? (
      <Text
        style={{
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
    ) : undefined;

  const stepsLabel =
    completedSteps.size > 0 && recipe.instructions.length > 0
      ? `${completedSteps.size}/${recipe.instructions.length}`
      : undefined;

  if (crt) {
    return (
      <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
        <TerminalFrame
          variant="single"
          label={t('recipe.instructions').toUpperCase()}
          rightLabel={stepsLabel}
        >
          <View style={{ backgroundColor: colors.bgBase, padding: spacing.lg }}>
            {recipe.instructions.length === 0 ? (
              <Text
                style={{
                  color: colors.content.secondary,
                  fontSize: fontSize.xl,
                  fontFamily: fonts.body,
                  fontStyle: 'italic',
                }}
              >
                {t('recipe.noInstructions')}
              </Text>
            ) : (
              recipe.instructions.map((instruction, index) => {
                const isCompleted = completedSteps.has(index);
                return (
                  <Pressable
                    key={index}
                    onPress={() => onToggleStep(index)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      paddingVertical: spacing.md,
                      borderBottomWidth:
                        index < recipe.instructions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                      opacity: isCompleted ? 0.5 : 1,
                    }}
                  >
                    <Text
                      style={{
                        color: isCompleted ? colors.success : colors.primary,
                        fontFamily: fonts.bodyBold,
                        fontSize: fontSize.lg,
                        marginRight: spacing.md,
                        minWidth: 24,
                      }}
                    >
                      {isCompleted ? '\u2713' : `${index + 1}.`}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: fontSize.xl,
                        fontFamily: fonts.body,
                        color: colors.content.body,
                        lineHeight: lineHeight.xl,
                        textDecorationLine: isCompleted
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      {instruction}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </TerminalFrame>
      </View>
    );
  }

  return (
    <Section
      title={t('recipe.instructions')}
      icon="book"
      size="sm"
      spacing={0}
      style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}
      rightAccessory={stepCounter}
    >
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
    </Section>
  );
};
