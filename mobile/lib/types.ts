/**
 * TypeScript types for the Meal Planner API.
 * These types match the Pydantic models in api/models/
 */

// Recipe types
export type DietLabel = 'veggie' | 'fish' | 'meat';
export type LibraryScope = 'all' | 'mine';
export type MealLabel =
  | 'breakfast'
  | 'starter'
  | 'salad'
  | 'meal'
  | 'dessert'
  | 'drink'
  | 'sauce'
  | 'pickle'
  | 'grill';

// Instruction types for enhanced UI rendering
export type InstructionType = 'step' | 'timeline' | 'tip' | 'heading';

export interface StructuredInstruction {
  type: InstructionType;
  content: string;
  time?: number | null; // For timeline entries, the time in minutes
  step_number?: number | null; // For step entries, 1-indexed
}

export type RecipeVisibility = 'household' | 'shared';

export type EnhancementReviewAction = 'approve' | 'reject';

export interface OriginalRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  image_url: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  url: string;
  ingredients: string[];
  instructions: string[];
  structured_instructions?: StructuredInstruction[]; // Parsed instructions with types
  image_url: string | null;
  thumbnail_url: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  cuisine: string | null;
  category: string | null;
  tags: string[];
  diet_label: DietLabel | null;
  meal_label: MealLabel | null;
  rating: number | null;
  hidden: boolean;
  favorited: boolean;
  // Household ownership fields
  household_id?: string | null; // Owning household (null = legacy/unassigned)
  visibility?: RecipeVisibility; // 'household' = private, 'shared' = public
  created_by?: string | null; // Email of user who created the recipe
  // AI enhancement fields
  enhanced?: boolean; // True if AI-enhanced
  enhanced_at?: string; // ISO timestamp of enhancement
  show_enhanced?: boolean; // User approved the enhancement
  enhancement_reviewed?: boolean; // User has reviewed the enhancement
  tips?: string;
  changes_made?: string[];
  original?: OriginalRecipe | null; // Original data before AI enhancement
}

export interface RecipeCreate {
  title: string;
  url: string;
  ingredients?: string[];
  instructions?: string[];
  image_url?: string | null;
  thumbnail_url?: string | null;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  total_time?: number | null;
  cuisine?: string | null;
  category?: string | null;
  tags?: string[];
  diet_label?: DietLabel | null;
  meal_label?: MealLabel | null;
  rating?: number | null;
}

export interface RecipeUpdate {
  title?: string;
  url?: string;
  ingredients?: string[];
  instructions?: string[];
  image_url?: string | null;
  thumbnail_url?: string | null;
  servings?: number | null;
  prep_time?: number | null;
  cook_time?: number | null;
  total_time?: number | null;
  cuisine?: string | null;
  category?: string | null;
  tags?: string[];
  diet_label?: DietLabel | null;
  meal_label?: MealLabel | null;
  rating?: number | null;
  hidden?: boolean;
  favorited?: boolean;
  visibility?: RecipeVisibility;
}

export interface RecipeScrapeRequest {
  url: string;
}

export interface RecipeParseRequest {
  url: string;
  html: string;
}

export interface RecipePreviewRequest {
  url: string;
  html: string;
  enhance?: boolean;
}

export interface RecipePreview {
  original: RecipeCreate;
  enhanced: RecipeCreate | null;
  changes_made: string[];
  image_url: string | null;
}

export interface PaginatedRecipeList {
  items: Recipe[];
  total_count: number | null;
  next_cursor: string | null;
  has_more: boolean;
}

// Meal Plan types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  date: string; // ISO date string
  meal_type: MealType;
  recipe_id: string | null;
  recipe_title: string | null;
  notes: string | null;
}

export interface MealPlan {
  household_id: string;
  meals: Record<string, string>; // date_mealtype -> recipe_id or custom:text
  notes: Record<string, string>; // date -> note text
  extras: string[]; // recipe IDs for "Other" section
}

export interface MealPlanUpdate {
  meals?: Record<string, string | null>; // null to delete
  notes?: Record<string, string | null>; // null to delete
  extras?: string[];
}

export interface MealUpdateRequest {
  date: string;
  meal_type: string;
  value: string | null;
}

export interface NoteUpdateRequest {
  date: string;
  note: string;
}

export interface ExtrasUpdateRequest {
  extras: string[];
}

// Grocery types
export type GroceryCategory =
  | 'produce'
  | 'meat_seafood'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'other';

export interface QuantitySource {
  quantity: number | null;
  unit: string | null;
  recipe: string;
}

export interface GroceryItem {
  name: string;
  quantity: string | null;
  unit: string | null;
  category: GroceryCategory;
  checked: boolean;
  recipe_sources: string[];
  quantity_sources: QuantitySource[];
}

export interface GroceryList {
  items: GroceryItem[];
}

// Grocery list state (persisted in Firestore, shared across household)
export interface CustomGroceryItem {
  name: string;
  category: GroceryCategory;
}

export interface GroceryListState {
  selected_meals: string[];
  meal_servings: Record<string, number>;
  checked_items: string[];
  custom_items: CustomGroceryItem[];
  updated_at?: string | null;
  created_by?: string | null;
}

export interface GroceryListStateSave {
  selected_meals: string[];
  meal_servings: Record<string, number>;
  checked_items?: string[];
  custom_items?: CustomGroceryItem[];
}

export interface GroceryListStatePatch {
  selected_meals?: string[];
  meal_servings?: Record<string, number>;
  checked_items?: string[];
  custom_items?: CustomGroceryItem[];
}

// API Response types
export interface ApiError {
  detail: string | { message: string; [key: string]: unknown };
}

export interface HealthCheck {
  status: string;
}

// Admin types
export type UserRole = 'superuser' | 'admin' | 'member';

export interface Household {
  id: string;
  name: string;
  created_by: string;
}

export interface HouseholdMember {
  email: string;
  household_id: string;
  role: UserRole;
  display_name: string | null;
}

export interface HouseholdCreate {
  name: string;
}

export interface MemberAdd {
  email: string;
  role: 'admin' | 'member';
  display_name?: string | null;
}

export interface CurrentUser {
  uid: string;
  email: string;
  role: UserRole;
  household_id: string | null;
  household_name?: string;
}

// Household Settings types
export type MeatPreference = 'all' | 'split' | 'none';
export type MincedMeatPreference = 'meat' | 'soy' | 'split';
export type DairyPreference = 'regular' | 'lactose_free' | 'dairy_free';

export interface DietarySettings {
  lactose_free: boolean;
  seafood_ok: boolean;
  meat: MeatPreference;
  meat_portions: number;
  minced_meat: MincedMeatPreference;
  dairy: DairyPreference;
  chicken_alternative?: string | null;
  meat_alternative?: string | null;
}

export interface HouseholdSettings {
  household_size: number;
  default_servings: number;
  language: string;
  week_start?: 'monday' | 'saturday';
  ai_features_enabled?: boolean;
  items_at_home?: string[];
  favorite_recipes?: string[];
  dietary: DietarySettings;
  equipment: string[];
}
