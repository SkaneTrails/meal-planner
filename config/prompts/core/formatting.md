# Recipe Enhancement - Formatting Rules

## Fractions

- Use ½, ⅓, ¼, ¾ — NEVER "0.5", "0.33", "0.25"
- Write "½ tbsp" not "0.5 tbsp"

## Swedish measurements — CRITICAL

**NEVER use ¼ tsk or 1/4 tsk — use krm instead!**

| ❌ WRONG       | ✅ CORRECT     |
| -------------- | -------------- |
| ¼ tsk salt     | 1 krm salt     |
| 1/4 tsk pepper | 1 krm pepper   |
| ¼ tsk turmeric | 1 krm turmeric |

**½ tsk is OK** — only fractions smaller than ½ should be replaced with krm.

- **krm** (~1 ml) for small amounts — NEVER "1/4 tsk" or "¼ tsk"
- **tsk** (5 ml) for medium amounts
- **msk** (15 ml) for larger amounts

## Practical measurements — round to measurable units

NEVER use fractional milliliters. Round to the nearest practical measure:

| Impractical | → Practical                    |
| ----------- | ------------------------------ |
| 12.5 ml     | 1 msk (15 ml) or 2 tsk (10 ml) |
| 37.5 ml     | 2½ msk or 3 msk                |
| 7.5 ml      | 1½ tsk ✓ or 2 tsk              |

**Always prefer:** krm < tsk < msk over ml for small amounts.

## Volume with weight

For non-spice ingredients in volume measures, include weight in parentheses.

**Exceptions:**

- Spices (krm, tsk, msk) — no weight needed
- Liquids (water, milk, broth) — 1 liter ≈ 1 kg

**Examples:**

- "2 dl Rice (160 g)"
- "3 dl Rolled oats (90 g)"
- "1 dl Flour (60 g)"
- "2 dl Lentils (180 g)"
- "1½ dl Sugar (150 g)"

This helps with portion adjustment and precision cooking.

## Vague ingredients — always make concrete

- "Citrus fruit" → "Lemon" (or "Lime" for Asian recipes)
- "Flat-leaf parsley" → "Parsley"
- "1 pc Mint & coriander" → "1 pot Mint" + "1 pot Coriander" (separate ingredients)
- "Onion" → "Yellow onion" or "Red onion" depending on recipe
- "A pinch of pepper" → "2 krm Black pepper" (use krm, never "pinch")

## HelloFresh portion markers — ALWAYS use 4-portion amounts

HelloFresh recipes often contain portion markers:

- `[X | Y]` format: First value is 2P, second is 4P
- `[X, 2P]` format: Value is for 2 portions

**ALWAYS extract and use the 4-PORTION (4P) value:**

| Original                | → Convert to      |
| ----------------------- | ----------------- |
| `water [3 dl \| 6 dl]`  | 6 dl water        |
| `salt [½ tsk \| 1 tsk]` | 1 tsk salt        |
| `[1/2 package, 2P]`     | 1 package (whole) |
| `lime [1/2 pc, 2P]`     | 1 pc lime         |
| `[1 msk \| 2 msk]`      | 2 msk             |

**Remove all portion markers from the final result.**

## Packages and containers — NEVER use vague units

ALWAYS replace "package", "container", "can" with actual measurements:

- "1 package Crushed tomatoes" → "400 g Crushed tomatoes"
- "1 package Pasta" → "400 g Pasta" (or actual weight)
- "1 package Cooking cream" → "2 dl Cooking cream"
- "1 can Coconut milk" → "400 ml Coconut milk"
- "1 package Tofu" → "300 g Tofu"

If exact amount is unknown, use standard sizes:

- Pasta: 400 g (2 servings)
- Crushed tomatoes: 400 g
- Cream/crème fraîche: 2 dl
- Coconut milk: 400 ml
- Rice: 150-200 g (2 servings)

## Ingredient ordering

Organize ingredients in this order:

1. **Chicken, Quorn, fish, seafood** (main ingredients)
2. **Vegetables & root vegetables**
3. **Carbohydrates** (pasta, rice, potatoes, bread)
4. **Dairy** (yogurt, cream, cheese)
5. **Oils & fats**
6. **Spices & seasonings** (ALWAYS LAST)

### Spices last

All spices are grouped at the end of the ingredient list:

- Dried spices
- Fresh herbs
- Salt, pepper
- Broth/bouillon

## Ingredient duplication — CRITICAL

**NEVER COMBINE INGREDIENTS INTO ONE LINE.**
**NEVER MERGE EXISTING SEPARATE LINES.**

If the recipe already has separate lines for the same ingredient (e.g., "20 g Cheese (for gratin)" and "50 g Cheese (for topping)"), KEEP THEM SEPARATE. NEVER merge them.

If salt, oil, butter, cheese, or any other ingredient is used multiple times in the recipe, LIST EACH USE SEPARATELY:

✅ CORRECT:

- ½ tsk Salt (for pasta water)
- ½ tsk Salt (for the chicken)
- Salt (finishing, to taste)
- 1 msk Rapeseed oil (for frying)
- 1 msk Olive oil (for serving)
- 20 g Cheese (for gratin)
- 50 g Cheese (for topping)

❌ WRONG — combining into one line:

- 1 tsk Salt
- 2 msk Oil
- 70 g Cheese

WHY: Each addition has a specific purpose. Keeping them separate makes the recipe reproducible.

### Quantity conservation — CRITICAL

When splitting an ingredient into multiple uses, the **total quantity MUST equal the original**.

| Original   | ✅ CORRECT split                                   | ❌ WRONG (quantity lost)                           |
| ---------- | -------------------------------------------------- | -------------------------------------------------- |
| 2 msk oil  | 1 msk oil (for frying) + 1 msk oil (for mushrooms) | ½ msk oil (frying) + ½ msk oil (mushrooms) = 1 msk |
| 1 tsk salt | ½ tsk salt (stew) + ½ tsk salt (mash)              | Salt (stew) + Salt (mash) — no amounts             |

NEVER reduce the total when splitting. If unsure, keep the ingredient on a single line.

## Instruction format

### For simple recipes

Write instructions as clear numbered steps.

### For complex recipes (parallel cooking, multiple components)

Use TIMELINE format to coordinate:

```
⏱️ 0 min: [Preparation — what starts first]
⏱️ 5 min: [Next step]
⏱️ 15 min: [Parallel activities]
...
⏱️ X min: Serve!
```

### Every step must contain an action — CRITICAL

**NEVER create steps that are just headers or labels.**

❌ WRONG — empty header step:

```json
[
  "⏱️ 15 min: Fry the mushrooms.",
  "Heat oil in a pan. Fry the mushrooms until golden."
]
```

✅ CORRECT — header merged with action:

```json
[
  "⏱️ 15 min: Heat oil in a pan. Fry the mushrooms until golden, about 3-4 minutes."
]
```

Every element in the instructions array MUST contain actionable cooking directions. A timeline marker alone is not a step.

**IMPORTANT:** Each timeline step must be a **separate element** in the instructions array:

```json
"instructions": [
  "⏱️ 0 min: Preheat the oven to 175°C. Prepare the vegetables...",
  "Toss vegetables with oil. Place in oven.",
  "⏱️ 5 min: Marinate the chicken...",
  "⏱️ 10 min: Place the chicken in the air fryer...",
  "⏱️ 35 min: Serve!"
]
```

❌ WRONG: All steps in a single string with newlines
✅ CORRECT: Each step as a separate array element

Use timeline when:

- Oven + air fryer are used simultaneously
- Chicken and Quorn are cooked separately
- Multiple components that need coordination
- Total cooking time > 20 min

### Inline tips with 💡

Actionable tips (alternatives, extra flavor, technique suggestions) should be **separate elements** in the instructions array, placed directly after the step they belong to:

```json
"instructions": [
  "Peel the pumpkin and cut into pieces. Drizzle with oil.",
  "💡 ALTERNATIVE: Use Hokkaido pumpkin — the skin is edible.",
  "⏱️ 5 min: Place in oven..."
]
```

**Format:**

- `💡 ALTERNATIVE: ...` for ingredient swaps
- `💡 EXTRA: ...` for flavor enhancement
- `💡 TIP: ...` for technique

**IMPORTANT:**

- ❌ WRONG: `"Peel the pumpkin... 💡 ALTERNATIVE: Use Hokkaido..."` (embedded in step)
- ✅ CORRECT: Tip on its own line, after the step it belongs to

**Why separate?** The app renders tips with distinct styling (green background), which only works when the element starts with 💡.

### Cooking technique — high heat for searing

When searing, browning, or caramelizing (mushrooms, meat, onions for color):

- **Always specify HIGH heat** — medium heat won't achieve a proper Maillard reaction
- Mushrooms: "High heat, 3-4 minutes, until golden" — NOT "medium-high heat"
- Searing meat: "High heat, 2 minutes per side" — NOT "medium heat"

The exception is sweating/softening vegetables (onions for base, garlic) — those use medium heat.
