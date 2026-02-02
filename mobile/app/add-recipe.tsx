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
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScrapeRecipe } from '@/lib/hooks';
import type { Recipe } from '@/lib/types';

export default function AddRecipeScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [enhanceWithAI, setEnhanceWithAI] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<Recipe | null>(null);
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
      Alert.alert('Ogiltig URL', 'Ange en giltig recept-URL');
      return;
    }

    try {
      const recipe = await scrapeRecipe.mutateAsync({ url, enhance: enhanceWithAI });
      setImportedRecipe(recipe);

      // Show summary modal if enhanced, otherwise show simple alert
      if (recipe.improved && recipe.changes_made && recipe.changes_made.length > 0) {
        setShowSummaryModal(true);
      } else {
        Alert.alert('Klart!', `"${recipe.title}" har importerats!`, [
          {
            text: 'Visa recept',
            onPress: () => {
              router.back();
              router.push(`/recipe/${recipe.id}${recipe.improved ? '?enhanced=true' : ''}`);
            },
          },
          {
            text: 'Lägg till fler',
            onPress: () => setUrl(''),
          },
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte importera receptet';
      Alert.alert('Import misslyckades', message);
    }
  };

  const handleViewRecipe = () => {
    setShowSummaryModal(false);
    if (importedRecipe) {
      router.back();
      router.push(`/recipe/${importedRecipe.id}${importedRecipe.improved ? '?enhanced=true' : ''}`);
    }
  };

  const handleAddAnother = () => {
    setShowSummaryModal(false);
    setImportedRecipe(null);
    setUrl('');
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
              Importera från URL
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>
            Klistra in en recept-URL från valfri matlagningssajt. Vi extraherar
            automatiskt titel, ingredienser, instruktioner och mer.
          </Text>
        </View>

        {/* URL input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginBottom: 8 }}>
            Recept-URL
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

        {/* AI Enhancement toggle */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F5F3FF',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: enhanceWithAI ? '#7C3AED' : '#E8D5C4',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: enhanceWithAI ? '#DDD6FE' : '#E8D5C4',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}>
              <Ionicons name="sparkles" size={18} color={enhanceWithAI ? '#7C3AED' : '#9CA3AF'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                Förbättra med AI
              </Text>
              <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                Optimera mått, tider och instruktioner
              </Text>
            </View>
          </View>
          <Switch
            value={enhanceWithAI}
            onValueChange={setEnhanceWithAI}
            trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }}
            thumbColor={enhanceWithAI ? '#7C3AED' : '#9CA3AF'}
            disabled={isPending}
          />
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
                {enhanceWithAI ? 'Importerar och förbättrar...' : 'Importerar...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="white" />
              <Text style={{ marginLeft: 8, color: '#fff', fontSize: 15, fontWeight: '600' }}>
                Importera recept
              </Text>
            </>
          )}
        </Pressable>

        {/* Supported sites */}
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 12 }}>
            Stödda sajter (400+)
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
              'och många fler...',
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

      {/* Enhancement Summary Modal */}
      <Modal
        visible={showSummaryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            maxHeight: '80%',
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#DDD6FE',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="sparkles" size={22} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A3728' }}>
                  Recept förbättrat!
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }} numberOfLines={1}>
                  {importedRecipe?.title}
                </Text>
              </View>
            </View>

            {/* Changes list */}
            <ScrollView style={{ maxHeight: 300, marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728', marginBottom: 12 }}>
                AI-förbättringar:
              </Text>
              {importedRecipe?.changes_made?.map((change, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                    backgroundColor: '#F5F3FF',
                    padding: 12,
                    borderRadius: 10,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#7C3AED" style={{ marginRight: 10, marginTop: 1 }} />
                  <Text style={{ flex: 1, fontSize: 14, color: '#4A3728', lineHeight: 20 }}>
                    {change}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={handleAddAnother}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#E8D5C4',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4A3728' }}>
                  Lägg till fler
                </Text>
              </Pressable>
              <Pressable
                onPress={handleViewRecipe}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#4A3728',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
                  Visa recept
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
