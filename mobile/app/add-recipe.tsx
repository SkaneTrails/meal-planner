/**
 * Add Recipe modal - Import recipe from URL.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScrapeRecipe } from '@/lib/hooks';

export default function AddRecipeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const scrapeRecipe = useScrapeRecipe();

  const isValidUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!isValidUrl(url)) {
      Alert.alert('Invalid URL', 'Please enter a valid recipe URL');
      return;
    }

    try {
      const recipe = await scrapeRecipe.mutateAsync(url);
      Alert.alert('Success', `"${recipe.title}" has been imported!`, [
        {
          text: 'View Recipe',
          onPress: () => {
            router.back();
            router.push(`/recipe/${recipe.id}`);
          },
        },
        {
          text: 'Add Another',
          onPress: () => setUrl(''),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import recipe';
      Alert.alert('Import Failed', message);
    }
  };

  const isPending = scrapeRecipe.isPending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Instructions */}
        <View className="bg-primary-50 rounded-xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={24} color="#22c55e" />
            <Text className="ml-2 font-semibold text-primary-800">
              Import from URL
            </Text>
          </View>
          <Text className="text-primary-700 text-sm">
            Paste a recipe URL from any major cooking website. We'll automatically
            extract the title, ingredients, instructions, and more.
          </Text>
        </View>

        {/* URL input */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Recipe URL
          </Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4">
            <Ionicons name="link" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 py-4 px-3 text-base text-gray-900"
              placeholder="https://example.com/recipe..."
              placeholderTextColor="#9ca3af"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              editable={!isPending}
            />
            {url !== '' && (
              <Pressable onPress={() => setUrl('')} disabled={isPending}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Import button */}
        <Pressable
          onPress={handleImport}
          disabled={!url || isPending}
          className={`py-4 rounded-xl flex-row items-center justify-center ${
            url && !isPending ? 'bg-primary-500' : 'bg-gray-300'
          }`}
        >
          {isPending ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="white" />
              <Text className="ml-2 text-white font-semibold">
                Importing...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text className="ml-2 text-white font-semibold">
                Import Recipe
              </Text>
            </>
          )}
        </Pressable>

        {/* Supported sites */}
        <View className="mt-8">
          <Text className="text-sm font-medium text-gray-500 mb-3">
            Supported Sites (400+)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              'AllRecipes',
              'BBC Good Food',
              'Bon Appétit',
              'Epicurious',
              'Food Network',
              'Serious Eats',
              'NYT Cooking',
              'Tasty',
              'and many more...',
            ].map((site) => (
              <View
                key={site}
                className="bg-white px-3 py-1.5 rounded-full border border-gray-200"
              >
                <Text className="text-xs text-gray-600">{site}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
