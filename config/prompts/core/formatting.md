# Recipe Enhancement - Formatting Rules

## Fractions

- Use ½, ⅓, ¼, ¾ — NEVER "0.5", "0.33", "0.25"
- Write "½ tbsp" not "0.5 tbsp"

## Measurements

Use the measurement system and units specified in the locale configuration.
Always round to practical, measurable amounts — never use fractional milliliters.

## Vague ingredients — always make concrete

- "Citrus fruit" → "Lemon" (or "Lime" for Asian recipes)
- "Flat-leaf parsley" → "Parsley"
- "1 pc Mint & coriander" → "1 pot Mint" + "1 pot Coriander" (separate ingredients)
- "Onion" → "Yellow onion" or "Red onion" depending on recipe
- Vague amounts ("a pinch", "some") → concrete measurements using the locale's units

## Packages and containers — NEVER use vague units

ALWAYS replace "package", "container", "can" with actual measurements (grams, ml, dl).
Use standard sizes from the locale configuration when exact amounts are unknown.

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
