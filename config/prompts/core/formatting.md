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

- ✅ "1½ msk olivolja (till grönkålen)" + "1½ msk olivolja (till dressingen)" — separate lines
- ✅ "½ tsk Salt (till pasta)" + "½ tsk Salt (till kyckling)" — separate lines
- ❌ "3 msk olivolja" — combined, loses which step uses how much
- ❌ "1 tsk Salt" — combined, loses context

**Exception — same physical item:** Different preparations of ONE item (zest + juice + wedges from one citron) stay as a single line: "2 Ekologisk citron (zest, saft och klyftor)"

**Salt/pepper limit:** Max **2 lines each**. If used in 3+ places, combine the minor uses.

**Quantity conservation:** When splitting an ingredient, the total MUST equal the original. If unsure, keep it on one line.

**Self-check:** If an ingredient appears in 2+ instruction steps with different purposes (e.g., oil for massage AND oil for dressing), it MUST be listed as separate ingredient lines. Scan your instructions for ingredients used in multiple steps — each use needs its own line with quantity and purpose.

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

**MUST use** when 2+ components cook simultaneously on different appliances (e.g. oven + stovetop, airfryer + stovetop). Start the longest-running item first. If a recipe has oven-roasting while a sauce/base cooks on the stove — that IS parallel cooking and REQUIRES timeline format.

Format: `⏱️ 0 min: [action]` / `⏱️ 5 min: [action]` / ... / `⏱️ X min: Serve!`

Examples of parallel cooking that REQUIRE timeline:

- Roasting vegetables in oven WHILE making a curry/sauce on stove
- Airfryer cooking WHILE preparing side dish on stove
- Baking/grilling WHILE making a salad or sauce

Do NOT use timeline for sequential cooking, even if total time > 20 min.

### Inline tips with 💡

Tips are **separate elements** in the instructions array, placed after the step they relate to. The app renders them with distinct styling, so they MUST start with 💡.

Formats: `💡 ALTERNATIVE:` (swaps) / `💡 EXTRA:` (flavor) / `💡 TIP:` (technique)

- ❌ Embedded in step: `"Peel the pumpkin... 💡 TIP: Use Hokkaido..."` — must be its own element
- ❌ Explanation: `"💡 ALTERNATIV: Gräddfil finns inte laktosfri..."` — put rationale in `changes_made`
- ❌ Obvious: `"💡 TIP: Använd en non-stick stekpanna."` — adds no value
- ✅ Actionable: `"💡 TIP: Smaka av med extra citronjuice för mer syra."`
- ✅ Teaches technique: `"💡 TIP: Låt smeten vila — chiafrön absorberar vätska och ger fluffigare resultat."`
- ✅ Meaningful alt: `"💡 ALTERNATIVE: Byt mandelmjölk mot havremjölk för fylligare smet."`

**Tips quality bar:** Every tip must either (a) explain _why_ a technique works, (b) offer a meaningful variation, or (c) help the cook recover from a common mistake. If you can't meet this bar, omit the tip.

**Never use 💡 ALTERNATIVE for ingredient swaps already in the ingredient list.** If the original recipe lists "X eller Y", keep it in the ingredient list. 💡 ALTERNATIVE is for technique or equipment variations, not for restating ingredient alternatives that belong on the shopping list.

**Limit tips in instructions.** Maximum 2 💡 lines in the instructions array. If you have more tips to share, put them in the `tips` field instead. Too many inline tips break the cooking flow and make the recipe harder to follow while cooking.

**Tips supplement steps — they never replace them.** A 💡 line must NOT be the only place a technique or action appears. If the original recipe includes a cooking action (e.g., massage kale with oil, roast walnuts), that action MUST appear as a regular instruction step — never demoted to a tip or moved to the ingredients list as a pre-done state (e.g., "rostade valnötter"). A 💡 line may then explain WHY the technique works, but the action itself lives in a step.

**Self-check:** For every cooking verb in the original instructions (roast, fry, toast, massage, bake, simmer, etc.), verify it appears as an instruction step in your output. If it only appears in a 💡 line, in the tips field, or as a pre-done ingredient descriptor — move it back to a step.

### Cooking technique

- **Searing/browning/caramelizing** → always HIGH heat (Maillard reaction requires it)
- **Sweating/softening** (onions for base, garlic) → medium heat
