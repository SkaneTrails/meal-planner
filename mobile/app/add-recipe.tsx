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
      style={{ flex: 1, backgroundColor: '#F5E6D3' }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Instructions */}
        <View style={{ backgroundColor: '#4A3728', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="information-circle" size={22} color="#fff" />
            <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#fff' }}>
              Import from URL
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>
            Paste a recipe URL from any major cooking website. We'll automatically
            extract the title, ingredients, instructions, and more.
          </Text>
        </View>

        {/* URL input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginBottom: 8 }}>
            Recipe URL
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16 }}>
            <Ionicons name="link" size={20} color="#4A3728" />
            <TextInput
              style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 15, color: '#4A3728' }}
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
                <Ionicons name="close-circle" size={20} color="#4A3728" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Import button */}
        <Pressable
          onPress={handleImport}
          disabled={!url || isPending}
          style={{ paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: url && !isPending ? '#4A3728' : '#9CA3AF' }}
        >
          {isPending ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="white" />
              <Text style={{ marginLeft: 8, color: '#fff', fontSize: 15, fontWeight: '600' }}>
                Importing...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={{ marginLeft: 8, color: '#fff', fontSize: 15, fontWeight: '600' }}>
                Import Recipe
              </Text>
            </>
          )}
        </Pressable>

        {/* Supported sites */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12 }}>
            Supported Sites (400+)
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                style={{ backgroundColor: '#E8D5C4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
              >
                <Text style={{ fontSize: 13, color: '#4A3728' }}>{site}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
