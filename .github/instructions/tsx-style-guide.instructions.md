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

Biome auto-organizes imports. Group: React → RN → third-party → project (`@/`), with `type` imports separate.

## TypeScript

- `interface` for props (suffix `Props`), `type` for unions/aliases
- Import types with `type` keyword

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

- Comments only for "why", never "what"
- Extract complex conditionals to named booleans

### Theme & Styling Architecture

- `StyleSheet.create()` at bottom of file — no large inline style objects
- Dynamic styles: use style arrays `[styles.card, { opacity: isActive ? 1 : 0.5 }]`

**Always use theme constants** from `lib/theme/` — never hardcode colors, spacing, sizes, or layout dimensions:

- Colors: `colors.content.body`, `colors.surface.pressed` — not `'#5D4E40'`, `'rgba(93, 78, 64, 0.15)'`
- Spacing: `spacing.lg`, `spacing.xl` — not `16`, `20`
- Layout: `layout.tabBar.height`, `layout.screenPaddingTop` — not magic numbers
- Border radius: `borderRadius.md` — not `16`

**Color token groups** — pick the semantic group that matches the usage context:

| Group              | Purpose                                  | Examples                                                                                |
| ------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `colors.content.*` | Text and icon colors                     | `heading`, `body`, `secondary`, `strong`, `tertiary`, `subtitle`, `icon`, `placeholder` |
| `colors.surface.*` | Backgrounds, borders, interactive states | `overlay`, `border`, `pressed`, `active`, `subtle`, `hover`, `tint`                     |
| `colors.button.*`  | Button-specific colors                   | `primary`, `primaryPressed`, `disabled`                                                 |
| `colors.ai.*`      | AI enhancement theming (sage green)      | `primary`, `primaryDark`, `bg`, `bgPressed`                                             |
| `colors.tabBar.*`  | Tab bar theming                          | `bg`, `active`, `inactive`, `border`                                                    |

Never use a surface token for text color or a content token for backgrounds — semantic correctness matters for future theming.

**When to add new theme constants:**

- A value appears in 2+ files → extract to `lib/theme/`
- A new color appears → add it to the appropriate group in `colors.ts`, never inline it
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

## Testing Gotchas

See `copilot-instructions.md` for coverage thresholds and test file paths. Vitest-specific notes:

- **`vi.hoisted()`** is required for constants used inside `vi.mock()` factory functions — the factory is hoisted above variable declarations
- **`__DEV__`** is defined as `true` in `vitest.config.ts` via `define: { __DEV__: true }`

## When to Split Files

1. File >300 lines → extract components, hooks, or utils
2. Component function >40 lines → extract sub-components or hooks
3. Reused logic → custom hook in `lib/hooks/`
4. Complex state → separate hook or reducer
