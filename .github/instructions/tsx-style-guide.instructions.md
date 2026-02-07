---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript/React Style Guide

## File Organization

### File Size Limits

- **Maximum 300 lines per component file**
- **Maximum 40 lines per component function**
- When approaching limits, split into:
  - Smaller sub-components
  - Custom hooks for logic
  - Utility functions in separate files

### One Component Per File

- Each `.tsx` file should export ONE primary component
- Exceptions allowed for:
  - Tightly coupled sub-components used only within parent
  - Type definitions specific to that component
- File name must match component name: `RecipeCard.tsx` exports `RecipeCard`

### File Naming Conventions

- Components: PascalCase (`RecipeDetail.tsx`, `AddRecipeButton.tsx`)
- Hooks: camelCase with `use` prefix (`useRecipeQuery.ts`, `useAuth.ts`)
- Utils: camelCase (`formatDate.ts`, `parseIngredients.ts`)
- Types: camelCase (`recipe.ts`, `mealPlan.ts`)

### Directory Structure

```
app/
  (tabs)/              # Tab navigation screens
  recipe/[id].tsx      # Dynamic route screens
  add-recipe.tsx       # Modal/standalone screens

components/
  RecipeCard.tsx       # Reusable UI components
  GroceryItem.tsx

lib/
  api.ts               # API client
  hooks/               # Custom React hooks
    useRecipes.ts
    useAuth.ts
  types.ts             # Shared TypeScript types
  utils/               # Pure utility functions
    dateFormatter.ts

test/
  helpers.ts           # Test utilities
  setup.ts             # Test configuration
```

## Component Style

### Function Components Only

- Use function components with hooks
- No class components
- Arrow function syntax for component definition:

```tsx
export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  // component logic
};
```

### Component Structure Order

1. Type definitions (props interface)
2. Component function declaration
3. Hooks (useState, useEffect, custom hooks)
4. Event handlers
5. Derived/computed values
6. Early returns (loading, error states)
7. Main JSX return

```tsx
interface RecipeCardProps {
  recipe: Recipe;
  onPress: (id: string) => void;
}

export const RecipeCard = ({ recipe, onPress }: RecipeCardProps) => {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: image } = useRecipeImage(recipe.id);

  // 2. Event handlers
  const handlePress = () => {
    onPress(recipe.id);
  };

  // 3. Derived values
  const totalTime = recipe.prep_time + recipe.cook_time;

  // 4. Early returns
  if (!recipe) return null;

  // 5. Main JSX
  return <View>{/* component markup */}</View>;
};
```

## TypeScript Patterns

### Props Definition

- Use `interface` for component props
- Suffix with `Props`: `RecipeCardProps`, `HeaderProps`
- Mark optional props with `?`
- Avoid `any` - use `unknown` and narrow with type guards

```tsx
interface RecipeCardProps {
  recipe: Recipe;
  onPress: (id: string) => void;
  showImage?: boolean; // optional
}
```

### Type Imports

- Import types explicitly with `type` keyword
- Group imports: React, third-party, local components, types, utils

```tsx
import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { RecipeCard } from "@/components/RecipeCard";
import type { Recipe } from "@/lib/types";
import { formatDate } from "@/lib/utils/dateFormatter";
```

### Modern Type Syntax

- Use `list[]` not `Array<list>`
- Use `Record<string, value>` for object maps
- Use union types: `'pending' | 'success' | 'error'`

```tsx
// Good
recipes: Recipe[]
statusMap: Record<string, boolean>
status: 'idle' | 'loading' | 'success' | 'error'

// Avoid
recipes: Array<Recipe>
statusMap: { [key: string]: boolean }
```

## React Patterns

### State Management

- Use `useState` for local component state
- Use `useReducer` for complex state with multiple sub-values
- Use React Query (`useQuery`, `useMutation`) for server state
- Never mix server and local state in same `useState`

```tsx
// Local UI state
const [isExpanded, setIsExpanded] = useState(false);

// Server state
const { data: recipes, isLoading } = useQuery({
  queryKey: ["recipes"],
  queryFn: fetchRecipes,
});
```

### Custom Hooks

- Extract when logic exceeds 20 lines
- Extract when logic is reused across 2+ components
- Name with `use` prefix: `useRecipeForm`, `useDebounce`
- One hook per file in `lib/hooks/`

```tsx
// lib/hooks/useRecipeForm.ts
export const useRecipeForm = (initialRecipe?: Recipe) => {
  const [title, setTitle] = useState(initialRecipe?.title ?? "");
  const [ingredients, setIngredients] = useState<string[]>(
    initialRecipe?.ingredients ?? [],
  );

  const isValid = title.length > 0 && ingredients.length > 0;

  return {
    title,
    setTitle,
    ingredients,
    setIngredients,
    isValid,
  };
};
```

### Event Handlers

- Prefix with `handle`: `handlePress`, `handleSubmit`, `handleChange`
- Extract to named functions (avoid inline arrow functions for complex logic)
- Pass callbacks down, not state setters

```tsx
// Good
const handleSubmit = async () => {
  await saveRecipe(formData);
  navigation.goBack();
};

<Button onPress={handleSubmit} />

// Avoid - too complex inline
<Button onPress={async () => {
  await saveRecipe(formData);
  navigation.goBack();
}} />
```

### Conditional Rendering

- Use early returns for loading/error states
- Use `&&` for simple conditions
- Use ternary for if/else
- Extract complex conditionals to computed booleans

```tsx
// Early return
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// Simple condition
{
  hasImage && <Image source={{ uri: recipe.image_url }} />;
}

// If/else
{
  isExpanded ? <FullRecipe /> : <RecipeSummary />;
}

// Complex - extract
const shouldShowButton = isAuthenticated && !isSubmitting && isValid;
{
  shouldShowButton && <Button />;
}
```

## Code Quality

### Avoid Duplication

- Extract repeated JSX into components
- Extract repeated logic into hooks or utils
- No code blocks >10 lines duplicated

### Self-Documenting Code

- Use descriptive variable/function names
- Avoid comments - code should explain itself
- Comments only for "why", never "what"

```tsx
// Bad - comment explains what code does
// Check if user is admin
if (user.role === "admin") {
}

// Good - code explains itself
const isAdmin = user.role === "admin";
if (isAdmin) {
}
```

### Immutability

- Never mutate props or state directly
- Use spread operator for updates
- Use array methods that return new arrays (`.map()`, `.filter()`)

```tsx
// Good
setIngredients([...ingredients, newIngredient]);
setRecipe({ ...recipe, title: newTitle });

// Bad
ingredients.push(newIngredient); // mutation
recipe.title = newTitle; // mutation
```

## Testing Requirements

### What to Test

- **Custom hooks** with conditional logic or enabled guards
- **Auth/permission logic** in components
- **Navigation guards** based on user state
- **Complex computed values** or transformations

### Test Location

- Component tests: `app/__tests__/*.test.tsx`
- Hook tests: `lib/hooks/__tests__/*.test.ts`
- Utility tests: `lib/utils/__tests__/*.test.ts`

### Test Utilities

- Use `mobile/test/helpers.ts` query wrapper
- Use mock user factory from test helpers
- Mock React Query with controlled state

```tsx
// lib/hooks/__tests__/useRecipes.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { createQueryWrapper, mockUser } from "@/test/helpers";
import { useRecipes } from "../useRecipes";

describe("useRecipes", () => {
  it("should only fetch when user is authenticated", async () => {
    const user = mockUser({ id: "123" });
    const { result } = renderHook(() => useRecipes(), {
      wrapper: createQueryWrapper({ user }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

## Performance

### Optimization Patterns

- Use `React.memo()` for expensive components that re-render frequently
- Use `useMemo()` for expensive computations
- Use `useCallback()` for event handlers passed to memoized children
- Don't optimize prematurely - measure first

```tsx
// Only when profiling shows performance issue
const sortedRecipes = useMemo(
  () => recipes.sort((a, b) => a.title.localeCompare(b.title)),
  [recipes],
);

const handlePress = useCallback(
  (id: string) => navigation.navigate("recipe", { id }),
  [navigation],
);
```

### Lazy Loading

- Use `React.lazy()` for route-level code splitting
- Use `Suspense` for loading states

## Expo/React Native Specific

### Platform-Specific Code

- Use `Platform.select()` for small differences
- Use `.ios.tsx` / `.android.tsx` for large differences

```tsx
import { Platform } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({
      ios: 20,
      android: 0,
    }),
  },
});
```

### Navigation

- Use Expo Router file-based routing
- Keep navigation logic in screen components
- Pass route params with proper TypeScript types

```tsx
import { useLocalSearchParams, router } from "expo-router";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleEdit = () => {
    router.push(`/recipe/${id}/edit`);
  };

  // ...
}
```

## When to Split Files

Split when you encounter:

1. **File >300 lines** - extract components, hooks, or utils
2. **Component function >40 lines** - extract sub-components or hooks
3. **Reused logic** - extract to custom hook in `lib/hooks/`
4. **Complex state logic** - extract to reducer or separate hook
5. **Multiple components** - one component per file rule
6. **Utility functions** - move to `lib/utils/` if used in 2+ files
