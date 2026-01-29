/**
 * Recipes screen - Recipe Library with search and filters.
 * Layout matches Streamlit app design.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  Pressable,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes, useEnhancedMode } from '@/lib/hooks';
import { RecipeCard, GradientBackground } from '@/components';
import type { DietLabel, MealLabel, Recipe } from '@/lib/types';

const DIET_OPTIONS: { value: DietLabel | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'veggie', label: 'Veggie' },
  { value: 'fish', label: 'Fish' },
  { value: 'meat', label: 'Meat' },
];

const MEAL_OPTIONS: { value: MealLabel | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'starter', label: 'Starter' },
  { value: 'meal', label: 'Meal' },
  { value: 'dessert', label: 'Dessert' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
];

// Responsive Recipe Grid component
interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  onRefresh: () => void;
  onRecipePress: (id: string) => void;
  onAddRecipe: () => void;
  searchQuery: string;
  dietFilter: DietLabel | null;
  mealFilter: MealLabel | null;
}

function RecipeGrid({ recipes, isLoading, onRefresh, onRecipePress, onAddRecipe, searchQuery, dietFilter, mealFilter }: RecipeGridProps) {
  const { width } = useWindowDimensions();
  
  // Calculate number of columns based on screen width
  // Larger card width (~300px) for bigger tiles
  const minCardWidth = 300;
  const padding = 16;
  const availableWidth = width - padding;
  const numColumns = Math.max(1, Math.floor(availableWidth / minCardWidth));
  const cardWidth = (availableWidth - (numColumns - 1) * 8) / numColumns;

  return (
    <FlatList
      key={numColumns} // Force re-render when columns change
      data={recipes}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      renderItem={({ item }) => (
        <View style={{ width: cardWidth, padding: 4 }}>
          <RecipeCard
            recipe={item}
            onPress={() => onRecipePress(item.id)}
            cardSize={cardWidth - 8}
          />
        </View>
      )}
      contentContainerStyle={{ padding: 8 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#4A3728" />
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 64 }}>
          <Ionicons name="search" size={56} color="#4A3728" />
          <Text style={{ color: '#6b7280', fontSize: 17, marginTop: 16, textAlign: 'center' }}>
            {searchQuery || dietFilter || mealFilter
              ? 'No recipes match your filters'
              : 'No recipes yet'}
          </Text>
          {!searchQuery && !dietFilter && !mealFilter && (
            <Pressable
              onPress={onAddRecipe}
              style={{ backgroundColor: '#4A3728', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Add Your First Recipe</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<DietLabel | null>(null);
  const [mealFilter, setMealFilter] = useState<MealLabel | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  
  // Use global enhanced mode context
  const { isEnhanced, setIsEnhanced } = useEnhancedMode();

  // Fetch recipes with enhanced flag from global context
  const { data: recipes = [], isLoading, refetch } = useRecipes(undefined, isEnhanced);

  // Filter and sort recipes
  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((recipe) => {
      const matchesSearch =
        searchQuery === '' ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesDiet = !dietFilter || recipe.diet_label === dietFilter;
      const matchesMeal = !mealFilter || recipe.meal_label === mealFilter;
      return matchesSearch && matchesDiet && matchesMeal;
    });

    // Sort
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'oldest') {
      result = [...result].reverse();
    }

    return result;
  }, [recipes, searchQuery, dietFilter, mealFilter, sortBy]);

  return (
    <GradientBackground>
      <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="book-outline" size={22} color="#4A3728" />
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#4A3728', marginLeft: 8 }}>Recipe Library</Text>
        </View>

        {/* AI Enhanced toggle */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: isEnhanced ? '#4A3728' : '#fff', 
          borderRadius: 12, 
          paddingHorizontal: 16, 
          paddingVertical: 12,
          marginBottom: 16 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="sparkles" size={20} color={isEnhanced ? '#FFD700' : '#4A3728'} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: isEnhanced ? '#fff' : '#4A3728' }}>
                AI Enhanced Recipes
              </Text>
              <Text style={{ fontSize: 12, color: isEnhanced ? '#E8D5C4' : '#6b7280', marginTop: 2 }}>
                {isEnhanced ? '37 enhanced recipes' : 'Try our AI-improved instructions'}
              </Text>
            </View>
          </View>
          <Switch
            value={isEnhanced}
            onValueChange={setIsEnhanced}
            trackColor={{ false: '#E8D5C4', true: '#8B7355' }}
            thumbColor={isEnhanced ? '#FFD700' : '#fff'}
          />
        </View>

        {/* All Recipes / Add Recipe toggle buttons */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Pressable
            onPress={() => setShowAllRecipes(true)}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: showAllRecipes ? '#4A3728' : '#E8D5C4' }}
          >
            <Ionicons name="book" size={18} color={showAllRecipes ? '#fff' : '#4A3728'} />
            <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '600', color: showAllRecipes ? '#fff' : '#4A3728' }}>
              All Recipes
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/add-recipe')}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff' }}
          >
            <Ionicons name="add" size={18} color="#4A3728" />
            <Text style={{ marginLeft: 4, fontSize: 15, fontWeight: '600', color: '#4A3728' }}>Add Recipe</Text>
          </Pressable>
        </View>
      </View>

      {/* Search and filters */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
        {/* Search bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <Text style={{ marginLeft: 8, fontSize: 15, color: '#6b7280' }}>Search recipes</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 }}>
          <TextInput
            style={{ flex: 1, fontSize: 15, color: '#4A3728' }}
            placeholder="Search by name..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#4A3728" />
            </Pressable>
          )}
        </View>

        {/* Filter dropdowns row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Diet filter */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="leaf-outline" size={14} color="#9ca3af" />
              <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>Diet</Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 }}>
              <Pressable
                onPress={() => {
                  const currentIdx = DIET_OPTIONS.findIndex(o => o.value === dietFilter);
                  const nextIdx = (currentIdx + 1) % DIET_OPTIONS.length;
                  setDietFilter(DIET_OPTIONS[nextIdx].value);
                }}
              >
                <Text style={{ fontSize: 15, color: '#4A3728' }}>
                  {DIET_OPTIONS.find(o => o.value === dietFilter)?.label || 'All'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Meal type filter */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="restaurant-outline" size={14} color="#9ca3af" />
              <Text style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>Meal Type</Text>
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 }}>
              <Pressable
                onPress={() => {
                  const currentIdx = MEAL_OPTIONS.findIndex(o => o.value === mealFilter);
                  const nextIdx = (currentIdx + 1) % MEAL_OPTIONS.length;
                  setMealFilter(MEAL_OPTIONS[nextIdx].value);
                }}
              >
                <Text style={{ fontSize: 15, color: '#4A3728' }}>
                  {MEAL_OPTIONS.find(o => o.value === mealFilter)?.label || 'All'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sort */}
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 4, fontSize: 13, color: '#6b7280' }}>Sort by</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 }}>
              <Pressable
                onPress={() => {
                  const currentIdx = SORT_OPTIONS.findIndex(o => o.value === sortBy);
                  const nextIdx = (currentIdx + 1) % SORT_OPTIONS.length;
                  setSortBy(SORT_OPTIONS[nextIdx].value);
                }}
              >
                <Text style={{ fontSize: 15, color: '#4A3728' }}>
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Newest'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Results count */}
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}>
          Showing {filteredRecipes.length} recipes
        </Text>
      </View>

      {/* Recipe grid */}
      <RecipeGrid
        recipes={filteredRecipes}
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onRecipePress={(id) => router.push(`/recipe/${id}`)}
        onAddRecipe={() => router.push('/add-recipe')}
        searchQuery={searchQuery}
        dietFilter={dietFilter}
        mealFilter={mealFilter}
      />
      </View>
    </GradientBackground>
  );
}
