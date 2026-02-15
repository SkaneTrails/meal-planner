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

### Theme & Styling Architecture

- `StyleSheet.create()` at bottom of file — no large inline style objects
- Dynamic styles: use style arrays `[styles.card, { opacity: isActive ? 1 : 0.5 }]`

**Always use theme constants** from `lib/theme/` — never hardcode colors, spacing, sizes, or layout dimensions:

- Colors: `colors.accent`, `colors.tabBar.active` — not `'#5D4E40'`
- Spacing: `spacing.lg`, `spacing.xl` — not `16`, `20`
- Layout: `layout.tabBar.height`, `layout.screenPaddingTop` — not magic numbers
- Border radius: `borderRadius.md` — not `16`

**When to add new theme constants:**

- A value appears in 2+ files → extract to `lib/theme/`
- A value controls shared UI geometry (e.g., nav bar height, content padding) → always a constant
- Platform-specific variants → put in theme with `Platform.select()`, not scattered in components

**Shared visual patterns → reusable components:**

- If 2+ screens use the same visual pattern (e.g., floating bar, glass card, gradient header), extract to `components/`
- Component owns its own styling; consumers pass semantic props, not style overrides
- Platform-specific rendering (blur on iOS, solid on Android) belongs inside the component, not at call sites

**Layout consistency:**

- Bottom padding for scrollable content must use a shared constant when a floating element overlays content
- Screen-level padding uses `layout.screenPaddingHorizontal` and `layout.screenPaddingTop`
- Never duplicate layout math — if a value is derived (e.g., `tabBarHeight + bottomOffset + margin`), compute it once in `lib/theme/layout.ts`

## Testing

### What to Test

- Component tests: `app/__tests__/*.test.tsx`
- Hook tests: `lib/hooks/__tests__/*.test.ts`
- Utility tests: `lib/utils/__tests__/*.test.ts`
- Use `mobile/test/helpers.ts` (query wrapper, mock user factory)
- Test: conditional fetching, enabled guards, auth/permission logic, navigation guards

### Coverage Standards

- **Overall threshold**: 80% stmts / 70% branches enforced by `thresholds` in `vitest.config.ts`
- **Excluded from coverage**: Screen components, API client wrappers, theme constants, Firebase auth, orchestration hooks that only wire already-tested hooks/utils together (see `vitest.config.ts` coverage.exclude for full list)
- Run coverage: `pnpm test:coverage`

### Test Infrastructure Notes

- **`createTestQueryClient()`** uses `gcTime: 0` for fast cleanup. This means unobserved cache entries (e.g., set via mutation `onSuccess`) are garbage-collected immediately. For tests that assert on `queryClient.getQueryData()` after a mutation, create a dedicated `QueryClient` without `gcTime: 0`
- **`vi.hoisted()`** is required for constants used inside `vi.mock()` factory functions — the factory is hoisted above variable declarations
- **`__DEV__`** is defined as `true` in `vitest.config.ts` via `define: { __DEV__: true }`

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
