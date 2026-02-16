import type { HouseholdSettings } from '@/lib/types';

/**
 * Equipment categories with their item keys.
 * Mirrors the API catalog in api/models/equipment.py.
 * To add equipment: add the key here + add i18n translations.
 */
export const EQUIPMENT_CATEGORIES = [
  {
    key: 'appliances',
    items: [
      'air_fryer',
      'stand_mixer',
      'food_processor',
      'immersion_blender',
      'pressure_cooker',
      'slow_cooker',
      'sous_vide',
      'pasta_machine',
      'pizza_oven',
    ],
  },
  {
    key: 'oven_features',
    items: ['convection_oven', 'grill_function', 'steam_oven'],
  },
  {
    key: 'cookware',
    items: ['dutch_oven', 'cast_iron_skillet', 'wok', 'pizza_stone'],
  },
  {
    key: 'tools',
    items: ['probe_thermometer', 'outdoor_grill', 'kitchen_torch'],
  },
] as const;

export const DEFAULT_SETTINGS: HouseholdSettings = {
  household_size: 2,
  default_servings: 2,
  language: 'sv',
  ai_features_enabled: true,
  note_suggestions: [],
  dietary: {
    lactose_free: false,
    seafood_ok: true,
    meat: 'all',
    meat_portions: 2,
    minced_meat: 'meat',
    dairy: 'regular',
    chicken_alternative: null,
    meat_alternative: null,
  },
  equipment: [],
};
