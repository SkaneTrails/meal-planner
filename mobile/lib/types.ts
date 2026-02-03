/**
 * TypeScript types for the Meal Planner API.
 * These types match the Pydantic models in api/models/
 */

// Recipe types
export type DietLabel = 'veggie' | 'fish' | 'meat';
export type MealLabel = 'breakfast' | 'starter' | 'salad' | 'meal' | 'dessert' | 'drink' | 'sauce' | 'pickle' | 'grill';

// Instruction types for enhanced UI rendering
export type InstructionType = 'step' | 'timeline' | 'tip' | 'heading';

export interface StructuredInstruction {
  type: InstructionType;
  content: string;
  time?: number | null;  // For timeline entries, the time in minutes
  step_number?: number | null;  // For step entries, 1-indexed
}

export interface Recipe {
  id: string;
  title: string;
  url: string;
  ingredients: string[];
  instructions: string[];
  structured_instructions?: StructuredInstruction[];  // Parsed instructions with types
  image_url: string | null;
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
  // AI enhancement fields
  improved?: boolean;
  original_id?: string;
  tips?: string;
  changes_made?: string[];
}

export interface RecipeCreate {
  title: string;
  url: string;
  ingredients?: string[];
  instructions?: string[];
  image_url?: string | null;
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

export interface RecipeScrapeRequest {
  url: string;
}

export interface RecipeParseRequest {
  url: string;
  html: string;
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
  user_id: string;
  meals: Record<string, string>; // date_mealtype -> recipe_id or custom:text
  notes: Record<string, string>; // date -> note text
}

export interface MealPlanUpdate {
  meals?: Record<string, string | null>; // null to delete
  notes?: Record<string, string | null>; // null to delete
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

// API Response types
export interface ApiError {
  detail: string | { message: string; [key: string]: unknown };
}

export interface HealthCheck {
  status: string;
}
