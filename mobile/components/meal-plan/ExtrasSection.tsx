import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/components';
import { fontFamily, fontSize, spacing, borderRadius } from '@/lib/theme';
import { PLACEHOLDER_IMAGE } from './meal-plan-constants';
import type { Recipe } from '@/lib/types';
import type { TFunction } from '@/lib/i18n';

interface ExtrasSectionProps {
  recipes: Recipe[];
  t: TFunction;
  onAddExtra: () => void;
  onRemoveExtra: (recipeId: string, title: string) => void;
}

export const ExtrasSection = ({
  recipes,
  t,
  onAddExtra,
  onRemoveExtra,
}: ExtrasSectionProps) => {
  return (
    <View
      style={{
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.04)',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="star-outline" size={18} color="#5D4E40" style={{ marginRight: 6 }} />
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.displayBold,
              fontWeight: '600',
              color: '#3D3D3D',
            }}
          >
            {t('mealPlan.extras.headerTitle')}
          </Text>
        </View>
        <AnimatedPressable
          onPress={onAddExtra}
          hoverScale={1.05}
          pressScale={0.95}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            backgroundColor: 'rgba(93, 78, 64, 0.1)',
            borderRadius: borderRadius.full,
          }}
        >
          <Ionicons name="add" size={16} color="#5D4E40" />
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.body,
              color: '#5D4E40',
              marginLeft: 4,
            }}
          >
            {t('mealPlan.extras.add')}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Empty state */}
      {recipes.length === 0 && (
        <Pressable
          onPress={onAddExtra}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(240, 235, 228, 0.5)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(93, 78, 64, 0.1)',
            borderStyle: 'dashed',
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="rgba(93, 78, 64, 0.5)" />
          <Text
            style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.body,
              color: 'rgba(93, 78, 64, 0.6)',
              marginLeft: 8,
            }}
          >
            {t('mealPlan.extras.emptyState')}
          </Text>
        </Pressable>
      )}

      {/* Recipe list */}
      {recipes.map((recipe) => (
        <ExtraRecipeRow
          key={recipe.id}
          recipe={recipe}
          onRemove={() => onRemoveExtra(recipe.id, recipe.title)}
        />
      ))}
    </View>
  );
};

interface ExtraRecipeRowProps {
  recipe: Recipe;
  onRemove: () => void;
}

const ExtraRecipeRow = ({ recipe, onRemove }: ExtraRecipeRowProps) => {
  const router = useRouter();
  const imageUrl = recipe.thumbnail_url || recipe.image_url || PLACEHOLDER_IMAGE;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(240, 235, 228, 0.85)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 6,
      }}
    >
      <Pressable
        onPress={() => router.push(`/recipe/${recipe.id}`)}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 13, fontFamily: fontFamily.bodySemibold, color: '#2D2D2D' }}>
            {recipe.title}
          </Text>
          {recipe.total_time && (
            <Text style={{ fontSize: 11, fontFamily: fontFamily.body, color: 'rgba(93, 78, 64, 0.7)', marginTop: 2 }}>
              {recipe.total_time} min
            </Text>
          )}
        </View>
      </Pressable>

      <AnimatedPressable
        onPress={onRemove}
        hoverScale={1.1}
        pressScale={0.9}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: 'rgba(93, 78, 64, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
        }}
      >
        <Ionicons name="close" size={18} color="#5D4E40" />
      </AnimatedPressable>
    </View>
  );
};
