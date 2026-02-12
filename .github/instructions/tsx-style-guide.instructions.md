---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript/React Style Guide

## File Organization

### Size Limits

- **Max 300 lines per component**, **max 40 lines per component function**
- Split into: sub-components, custom hooks, utility functions

### Naming & Structure

- **One component per file** (exceptions: tightly coupled sub-components, local types)
- Components: PascalCase (`RecipeCard.tsx`), Hooks: `use` prefix (`useRecipeQuery.ts`), Utils: camelCase
- File name must match component name

```
app/
  (tabs)/              # Tab navigation screens
  recipe/[id].tsx      # Dynamic route screens
components/            # Reusable UI components
lib/
  api.ts               # API client
  hooks/               # Custom React hooks
  types.ts             # Shared TypeScript types
  utils/               # Pure utility functions
test/
  helpers.ts           # Test utilities (query wrapper, mock user factory)
```

## Component Conventions

### Function Components Only

- Arrow function syntax for shared components
- **Exception:** Expo Router screens require `export default function` for file-based routing

```tsx
// Shared component — named arrow export
export const RecipeCard = ({ recipe, onPress }: RecipeCardProps) => { ... };

// Expo Router screen — default function export
export default function RecipeDetailScreen() { ... }
```

### Component Structure Order

1. Type definitions (props interface)
2. Hooks (`useState`, `useEffect`, custom hooks)
3. Event handlers (`handle` prefix)
4. Derived/computed values
5. Early returns (loading, error)
6. Main JSX return

```tsx
interface RecipeCardProps {
  recipe: Recipe;
  onPress: (id: string) => void;
}

export const RecipeCard = ({ recipe, onPress }: RecipeCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: image } = useRecipeImage(recipe.id);

  const handlePress = () => onPress(recipe.id);
  const totalTime = recipe.prep_time + recipe.cook_time;

  if (!recipe) return null;

  return <View>{/* ... */}</View>;
};
```

### Import Grouping

```tsx
import { useState } from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { RecipeCard } from "@/components/RecipeCard";
import type { Recipe } from "@/lib/types";
import { formatDate } from "@/lib/utils/dateFormatter";
```

## TypeScript

- `interface` for props (suffix `Props`), `type` for unions/aliases
- Import types with `type` keyword
- `T[]` not `Array<T>`, `Record<string, V>` for maps
- No `any` — use `unknown` with type guards

## State Management

- `useState` for local UI state
- React Query (`useQuery`, `useMutation`) for server state — never mix in `useState`
- Extract hooks to `lib/hooks/` when logic >20 lines or reused in 2+ components

### Custom Hook Pattern

```tsx
export const useRecipeForm = (initialRecipe?: Recipe) => {
  const [title, setTitle] = useState(initialRecipe?.title ?? "");
  const [ingredients, setIngredients] = useState<string[]>(
    initialRecipe?.ingredients ?? [],
  );
  const isValid = title.length > 0 && ingredients.length > 0;

  return { title, setTitle, ingredients, setIngredients, isValid };
};
```

## Code Quality

### Before Writing New Code

1. Check `components/` for existing shared components
2. Check `lib/hooks/` for existing hooks
3. Check `lib/utils/` for existing utilities
4. No code blocks >10 lines duplicated across files

### Self-Documenting Code

- Avoid comments — code should explain itself
- Comments only for "why", never "what"
- Extract complex conditionals to named booleans

```tsx
// ❌
// Check if user is admin
if (user.role === "admin") {
}

// ✅
const isAdmin = user.role === "admin";
if (isAdmin) {
}
```

### Immutability

- Never mutate props or state directly
- Spread for updates: `setRecipe({ ...recipe, title: newTitle })`
- Array methods that return new arrays: `.map()`, `.filter()`

### Styling

- `StyleSheet.create()` at bottom of file — no large inline style objects
- Dynamic styles: use style arrays `[styles.card, { opacity: isActive ? 1 : 0.5 }]`

## Testing

- Component tests: `app/__tests__/*.test.tsx`
- Hook tests: `lib/hooks/__tests__/*.test.ts`
- Use `mobile/test/helpers.ts` (query wrapper, mock user factory)
- Test: conditional fetching, enabled guards, auth/permission logic, navigation guards

```tsx
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

## Expo / React Native Specific

- `Platform.select()` for small platform differences
- Expo Router file-based routing with `useLocalSearchParams<{ id: string }>()`
- `router.push()` for navigation

## When to Split Files

1. File >300 lines → extract components, hooks, or utils
2. Component function >40 lines → extract sub-components or hooks
3. Reused logic → custom hook in `lib/hooks/`
4. Complex state → separate hook or reducer
