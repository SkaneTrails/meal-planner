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

Order ingredients by **when they are first used** in the instructions. Exception: **spices and seasonings always LAST** (dried spices, fresh herbs, salt, pepper, bouillon), even if used early. Multi-use ingredients appear at the position of their first use.

## Ingredient duplication — CRITICAL

If an ingredient is used multiple times, list EACH use as a separate line with its purpose. NEVER merge separate uses into one combined line.

- ✅ "½ tsk Salt (till pasta)" + "½ tsk Salt (till kyckling)" — separate lines
- ❌ "1 tsk Salt" — combined, loses context

**Exception — same physical item:** Different preparations of ONE item (zest + juice + wedges from one citron) stay as a single line: "2 Ekologisk citron (zest, saft och klyftor)"

**Salt/pepper limit:** Max **2 lines each**. If used in 3+ places, combine the minor uses.

**Quantity conservation:** When splitting an ingredient, the total MUST equal the original. If unsure, keep it on one line.

## Instruction format — CRITICAL

### Step count guidance

**Keep instructions concise.** Most recipes need 6-8 cooking steps. 💡 lines (TIP/ALTERNATIVE/EXTRA) do NOT count — they are rendered separately by the app. Avoid splitting simple actions into separate steps, but don't artificially merge steps just to reduce count.

### Header-only steps are FORBIDDEN

Every instruction element MUST contain actionable cooking directions. A timeline marker, phase label, or short header alone is NOT a valid step — merge it into the next step.

- ❌ `"⏱️ 5 min: Tillaga kyckling."` then `"Pensla kycklingen med rapsolja..."` → two steps for one action
- ✅ `"⏱️ 5 min: Pensla kycklingen med 1 msk rapsolja. Tillaga i airfryer på 180°C..."` → merged

**Self-check:** If any element is ≤10 words with no cooking verb (heat, fry, stir, mix, cut, pour), merge it into the next step.

### Simple recipes (default)

Clear sequential steps. Use this unless the recipe qualifies for timeline.

**Do NOT include step numbers in instruction text.** The JSON array index provides numbering — writing `"1. Skala löken..."` causes double-numbering in the app. Write `"Skala löken..."` instead.

### TIMELINE format (parallel cooking only)

Use **ONLY** when 2+ components cook simultaneously on different appliances (e.g. airfryer + stovetop). Start the longest-running item first.

Format: `⏱️ 0 min: [action]` / `⏱️ 5 min: [action]` / ... / `⏱️ X min: Serve!`

Do NOT use timeline for sequential cooking, even if total time > 20 min.

### Inline tips with 💡

Tips are **separate elements** in the instructions array, placed after the step they relate to. The app renders them with distinct styling, so they MUST start with 💡.

Formats: `💡 ALTERNATIVE:` (swaps) / `💡 EXTRA:` (flavor) / `💡 TIP:` (technique)

- ❌ Embedded in step: `"Peel the pumpkin... 💡 TIP: Use Hokkaido..."` — must be its own element
- ❌ Explanation: `"💡 ALTERNATIV: Gräddfil finns inte laktosfri..."` — put rationale in `changes_made`
- ✅ Actionable: `"💡 TIP: Smaka av med extra citronjuice för mer syra."`

### Cooking technique

- **Searing/browning/caramelizing** → always HIGH heat (Maillard reaction requires it)
- **Sweating/softening** (onions for base, garlic) → medium heat
