/**
 * Recipe detail screen.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipe, useDeleteRecipe, useUpdateRecipe, useEnhancedMode } from '@/lib/hooks';
import { BouncingLoader } from '@/components';
import type { DietLabel, MealLabel } from '@/lib/types';

const DIET_LABELS: Record<DietLabel, { emoji: string; label: string; color: string; bgColor: string }> = {
  veggie: { emoji: '🥬', label: 'Vegetarian', color: '#166534', bgColor: '#DCFCE7' },  // pastel green
  fish: { emoji: '🐟', label: 'Seafood', color: '#1E40AF', bgColor: '#DBEAFE' },       // pastel blue
  meat: { emoji: '🥩', label: 'Meat', color: '#991B1B', bgColor: '#FEE2E2' },          // pastel red/pink
};

const MEAL_LABELS: Record<MealLabel, string> = {
  breakfast: 'Breakfast',
  starter: 'Starter',
  salad: 'Salad',
  meal: 'Main Course',
  dessert: 'Dessert',
  drink: 'Drink',
  sauce: 'Sauce',
  pickle: 'Pickle',
  grill: 'Grill',
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800';

// Thumb Rating component (thumbs up/down)
interface ThumbRatingProps {
  rating: number | null;
  onThumbUp: () => void;
  onThumbDown: () => void;
  size?: number;
}

function ThumbRating({ rating, onThumbUp, onThumbDown, size = 28 }: ThumbRatingProps) {
  // rating: null = no rating, 1 = thumbs down, 5 = thumbs up
  const isThumbUp = rating === 5;
  const isThumbDown = rating === 1;
  
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Pressable
        onPress={onThumbDown}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 20,
          backgroundColor: isThumbDown ? '#FEE2E2' : pressed ? '#F5E6D3' : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbDown ? 'thumbs-down' : 'thumbs-down-outline'}
          size={size}
          color={isThumbDown ? '#DC2626' : '#9CA3AF'}
        />
      </Pressable>
      <Pressable
        onPress={onThumbUp}
        style={({ pressed }) => ({
          padding: 8,
          borderRadius: 20,
          backgroundColor: isThumbUp ? '#DCFCE7' : pressed ? '#F5E6D3' : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbUp ? 'thumbs-up' : 'thumbs-up-outline'}
          size={size}
          color={isThumbUp ? '#16A34A' : '#9CA3AF'}
        />
      </Pressable>
    </View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isEnhanced } = useEnhancedMode();
  const { data: recipe, isLoading, error } = useRecipe(id, isEnhanced);
  const deleteRecipe = useDeleteRecipe();
  const updateRecipe = useUpdateRecipe();

  const handleThumbUp = async () => {
    if (!id) return;
    try {
      await updateRecipe.mutateAsync({
        id,
        updates: { rating: 5 },
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update rating');
    }
  };

  const handleThumbDown = () => {
    if (!id || !recipe) return;
    // If already thumbs down, ask to delete
    if (recipe.rating === 1) {
      Alert.alert(
        'Delete Recipe?',
        `Do you want to delete "${recipe.title}"?`,
        [
          { text: 'No, keep it', style: 'cancel' },
          {
            text: 'Yes, delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe.mutateAsync(id);
                router.back();
              } catch (err) {
                Alert.alert('Error', 'Failed to delete recipe');
              }
            },
          },
        ]
      );
    } else {
      // First thumb down - just mark it
      Alert.alert(
        'Not a favorite?',
        'Do you want to delete this recipe?',
        [
          { 
            text: 'No, just mark as not favorite', 
            onPress: async () => {
              try {
                await updateRecipe.mutateAsync({
                  id,
                  updates: { rating: 1 },
                });
              } catch (err) {
                Alert.alert('Error', 'Failed to update rating');
              }
            }
          },
          {
            text: 'Yes, delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe.mutateAsync(id);
                router.back();
              } catch (err) {
                Alert.alert('Error', 'Failed to delete recipe');
              }
            },
          },
        ]
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!recipe) return;

    try {
      await Share.share({
        title: recipe.title,
        message: `Check out this recipe: ${recipe.title}\n\n${recipe.url || ''}`,
        url: recipe.url,
      });
    } catch (err) {
      // User cancelled
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E6D3' }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 40, 
          backgroundColor: '#E8D5C4', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <BouncingLoader size={14} />
        </View>
        <Text style={{ color: '#4A3728', fontSize: 16, fontWeight: '500' }}>Loading recipe...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E6D3', padding: 32 }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 40, 
          backgroundColor: '#E8D5C4', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name="alert-circle-outline" size={40} color="#4A3728" />
        </View>
        <Text style={{ color: '#4A3728', fontSize: 18, fontWeight: '600' }}>Recipe not found</Text>
        <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8, textAlign: 'center' }}>This recipe may have been deleted or moved</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ 
            marginTop: 20, 
            paddingHorizontal: 28, 
            paddingVertical: 14, 
            backgroundColor: '#4A3728', 
            borderRadius: 14,
            shadowColor: '#4A3728',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const totalTime = recipe.total_time ||
    (recipe.prep_time && recipe.cook_time ? recipe.prep_time + recipe.cook_time : null) ||
    recipe.prep_time ||
    recipe.cook_time;

  return (
    <>
      <Stack.Screen
        options={{
          title: recipe.title,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleShare} style={{ padding: 8 }}>
                <Ionicons name="share-outline" size={24} color="white" />
              </Pressable>
              <Pressable onPress={handleDelete} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={24} color="white" />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView style={{ flex: 1, backgroundColor: '#F5E6D3' }}>
        {/* Hero image */}
        <Image
          source={{ uri: recipe.image_url || PLACEHOLDER_IMAGE }}
          style={{ width: '100%', height: 280 }}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={{ 
          padding: 20, 
          marginTop: -32, 
          backgroundColor: '#fff', 
          borderTopLeftRadius: 28, 
          borderTopRightRadius: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          minHeight: 500,
        }}>
          {/* Title and rating */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3, flex: 1, marginRight: 12 }}>
              {recipe.title}
            </Text>
            <ThumbRating
              rating={recipe.rating}
              onThumbUp={handleThumbUp}
              onThumbDown={handleThumbDown}
              size={24}
            />
          </View>

          {/* Meta info */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 10 }}>
            {recipe.diet_label && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: DIET_LABELS[recipe.diet_label].bgColor,
                paddingHorizontal: 14, 
                paddingVertical: 8, 
                borderRadius: 12,
              }}>
                <Text style={{ marginRight: 6, fontSize: 14 }}>{DIET_LABELS[recipe.diet_label].emoji}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: DIET_LABELS[recipe.diet_label].color }}>
                  {DIET_LABELS[recipe.diet_label].label}
                </Text>
              </View>
            )}
            {recipe.meal_label && (
              <View style={{ backgroundColor: '#E8D5C4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#4A3728' }}>
                  {MEAL_LABELS[recipe.meal_label]}
                </Text>
              </View>
            )}
          </View>

          {/* Time and servings */}
          <View style={{ 
            flexDirection: 'row', 
            marginTop: 20, 
            backgroundColor: '#F5E6D3', 
            borderRadius: 20, 
            padding: 18,
          }}>
            {recipe.prep_time && (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="timer-outline" size={20} color="#4A3728" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Prep</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4A3728' }}>
                  {recipe.prep_time} min
                </Text>
              </View>
            )}
            {recipe.cook_time && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: recipe.prep_time ? 1 : 0, borderLeftColor: '#E8D5C4' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="flame-outline" size={20} color="#4A3728" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Cook</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4A3728' }}>
                  {recipe.cook_time} min
                </Text>
              </View>
            )}
            {totalTime && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time) ? 1 : 0, borderLeftColor: '#E8D5C4' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="time-outline" size={20} color="#4A3728" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Total</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4A3728' }}>
                  {totalTime} min
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: (recipe.prep_time || recipe.cook_time || totalTime) ? 1 : 0, borderLeftColor: '#E8D5C4' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name="people-outline" size={20} color="#4A3728" />
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Serves</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4A3728' }}>
                  {recipe.servings}
                </Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 18, gap: 8 }}>
              {recipe.tags.map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: '#4A3728', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#fff' }}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="list" size={18} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3 }}>
                Ingredients
              </Text>
            </View>
            {recipe.ingredients.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 15, fontStyle: 'italic' }}>No ingredients listed</Text>
            ) : (
              <View style={{ backgroundColor: '#F9F5F0', borderRadius: 16, padding: 16 }}>
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'flex-start', 
                      paddingVertical: 10, 
                      borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0, 
                      borderBottomColor: '#E8D5C4',
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A3728', marginTop: 7, marginRight: 14 }} />
                    <Text style={{ flex: 1, fontSize: 15, color: '#4A3728', lineHeight: 22 }}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={{ marginTop: 28, marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8D5C4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="book" size={18} color="#4A3728" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#4A3728', letterSpacing: -0.3 }}>
                Instructions
              </Text>
            </View>
            {recipe.instructions.length === 0 ? (
              <Text style={{ color: '#6b7280', fontSize: 15, fontStyle: 'italic' }}>No instructions listed</Text>
            ) : (
              recipe.instructions.map((instruction, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  alignItems: 'flex-start', 
                  paddingVertical: 14,
                  backgroundColor: index % 2 === 0 ? '#F9F5F0' : 'transparent',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  marginBottom: 4,
                }}>
                  <View style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 16, 
                    backgroundColor: '#4A3728', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginRight: 14,
                    marginTop: 2,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{index + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: '#4A3728', lineHeight: 24 }}>
                    {instruction}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Source link */}
          {recipe.url && (
            <Pressable
              onPress={() => Linking.openURL(recipe.url).catch(() => {
                Alert.alert('Error', 'Could not open the recipe URL');
              })}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                paddingVertical: 16, 
                marginTop: 8,
                marginBottom: 20,
                backgroundColor: '#F5E6D3',
                borderRadius: 14,
              }}
            >
              <Ionicons name="link-outline" size={18} color="#4A3728" />
              <Text style={{ color: '#4A3728', marginLeft: 8, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                View original recipe
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}
