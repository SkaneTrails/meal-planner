import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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

interface RecipeEnhancedInfoProps {
  recipe: Recipe;
  showAiChanges: boolean;
  t: TFunction;
  onToggleAiChanges: () => void;
}

export const RecipeEnhancedInfo = ({
  recipe,
  showAiChanges,
  t,
  onToggleAiChanges,
}: RecipeEnhancedInfoProps) => (
  <>
    {recipe.enhanced && recipe.show_enhanced && recipe.tips && (
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(93, 78, 64, 0.12)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
            }}
          >
            <Ionicons name="bulb-outline" size={18} color="#5D4037" />
          </View>
          <Text
            style={{
              fontSize: fontSize['3xl'],
              fontFamily: fontFamily.display,
              color: '#3D3D3D',
              letterSpacing: letterSpacing.normal,
            }}
          >
            {t('recipe.tips')}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: '#C4704B',
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xl,
              fontFamily: fontFamily.body,
              color: colors.text.inverse,
              lineHeight: 24,
            }}
          >
            {recipe.tips}
          </Text>
        </View>
      </View>
    )}

    {recipe.enhanced &&
      recipe.show_enhanced &&
      recipe.changes_made &&
      recipe.changes_made.length > 0 && (
        <View
          style={{
            marginBottom: spacing.xl,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            borderRadius: borderRadius.lg,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 1, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Pressable
            onPress={onToggleAiChanges}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.lg,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(93, 78, 64, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md,
              }}
            >
              <Ionicons name="sparkles" size={18} color="#2D6A5A" />
            </View>
            <Text
              style={{
                fontSize: fontSize['3xl'],
                fontFamily: fontFamily.display,
                color: '#5D4037',
                letterSpacing: letterSpacing.normal,
                flex: 1,
              }}
            >
              {t('recipe.aiImprovements')}
            </Text>
            <Ionicons
              name={showAiChanges ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#5D4037"
            />
          </Pressable>
          {showAiChanges && (
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: 'rgba(139, 115, 85, 0.15)',
                paddingTop: spacing.md,
              }}
            >
              {recipe.changes_made.map((change, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom:
                      index < recipe.changes_made!.length - 1 ? spacing.sm : 0,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#2D6A5A"
                    style={{ marginRight: spacing.sm, marginTop: 2 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: fontSize.lg,
                      fontFamily: fontFamily.body,
                      color: '#5D4037',
                      lineHeight: 20,
                    }}
                  >
                    {change}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
  </>
);
