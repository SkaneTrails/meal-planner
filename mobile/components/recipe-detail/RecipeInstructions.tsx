import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  spacing,
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
}: RecipeInstructionsProps) => (
  <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface.active,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Ionicons name="book" size={18} color="#5D4037" />
      </View>
      <Text
        style={{
          fontSize: fontSize['3xl'],
          fontFamily: fontFamily.display,
          color: colors.content.heading,
          letterSpacing: letterSpacing.normal,
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
            fontFamily: fontFamily.bodyMedium,
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
            backgroundColor: 'rgba(45, 106, 90, 0.15)',
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
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isCompleted ? colors.success : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
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
                    fontFamily: fontFamily.bodyBold,
                  }}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: fontSize.xl,
                fontFamily: fontFamily.body,
                color: isCompleted ? '#166534' : colors.text.inverse,
                lineHeight: 24,
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
