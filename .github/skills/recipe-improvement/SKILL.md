---
name: recipe-improvement
description: Improve recipes with cooking techniques, timing optimization, equipment-specific instructions, and household dietary preferences.
license: MIT
---

# Skill: Recipe Improvement

You are a culinary expert assistant helping to improve recipes in a meal planning app. Your goal is to make recipes more practical, flavorful, and adaptable for home cooking.

---

## Activation Context

This skill activates when:

- The developer asks to review, improve, or optimize a recipe
- Working with recipe data from the Firestore database
- The developer mentions "recipe", "cooking", "ingredients", or "instructions"
- Using the `scripts/recipe_reviewer.py` tool to process recipes

---

## Recipe Reviewer Tool

The `scripts/recipe_reviewer.py` script manages the recipe review workflow:

```bash
uv run python scripts/recipe_reviewer.py <command> [args]
```

| Command                | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `next`                 | Fetch the next unprocessed recipe                            |
| `get <id>`             | Fetch a specific recipe by ID                                |
| `enhanced <id>`        | Fetch the enhanced version of a recipe                       |
| `delete <id>`          | Delete a bad enhanced recipe and unmark from processed       |
| `update <id> '<json>'` | Apply improvements and save to database                      |
| `skip <id>`            | Mark recipe as skipped (no changes needed)                   |
| `upload <id> <file>`   | Upload enhanced recipe from a JSON file                      |
| `status`               | Show progress (processed/skipped/remaining counts)           |

**Database configuration:**

- **Database**: `meal-planner` - all recipes (original and enhanced)
- **Progress file**: `data/recipe_review_progress.json`

**Typical workflow for fixing a bad enhanced recipe:**

```bash
# 1. Check the enhanced version to see what's wrong
uv run python scripts/recipe_reviewer.py enhanced <id>

# 2. Delete the bad version (also unmarks from processed)
uv run python scripts/recipe_reviewer.py delete <id>

# 3. Check the original to see what we're working with
uv run python scripts/recipe_reviewer.py get <id>

# 4. Create and apply the new enhanced version
uv run python scripts/recipe_reviewer.py update <id> '<json>'
```

---

## CRITICAL: Enhancement Data Safety

### Document structure

Enhanced recipes store **both versions in the same Firestore document**:

- **Top-level fields** = enhanced version (what the app displays)
- **`original` nested field** = snapshot of the scraped data (for "view original" toggle)
- **`enhanced: true`** = flag indicating this recipe has been enhanced

```
┌─────────────────────────────────────────────────┐
│ Recipe Document (S74yNqQ0aqV1TghZqHJx)          │
├─────────────────────────────────────────────────┤
│ title: "Enhanced Title"          ← app shows    │
│ ingredients: [enhanced list]     ← app shows    │
│ instructions: [enhanced list]    ← app shows    │
│ enhanced: true                                  │
│ enhanced_at: 2026-02-07T...                     │
│ changes_made: ["change 1", ...]                 │
│                                                 │
│ original: {                      ← view toggle  │
│   title: "Scraped Title"                        │
│   ingredients: [scraped list]                   │
│   instructions: [scraped list]                  │
│   servings: 4                                   │
│   ...                                           │
│ }                                               │
└─────────────────────────────────────────────────┘
```

### Rules

1. **NEVER use `.set()`** on an existing recipe — it destroys all fields not in the payload. Always use `.update()` to merge.
2. **The `original` snapshot is immutable** — set once on first enhancement, never modified after.
3. **Always fetch before modifying** — `recipe_reviewer.py get <id>` to see current state.
4. **The `update` command handles snapshotting automatically** — on first enhancement it creates the `original` snapshot; on re-enhancement it preserves the existing one.

### Enhancement flow

```
Scrape → save original to document → user requests enhancement →
  snapshot original into `original` field →
  write enhanced data to top-level fields →
  set enhanced=true, enhanced_at, changes_made
```

### Common mistakes that destroy data

| ❌ Wrong | ✅ Correct |
| -------- | --------- |
| `doc_ref.set(enhanced_data)` | `doc_ref.update(enhanced_data)` |
| Write inline Python with `.set()` | Use `recipe_reviewer.py update` |
| Fetch original, add timeline, upload | Fetch enhanced, add timeline, upload |
| Scale original to 4P and call it "enhanced" | Apply real cooking improvements (techniques, timing, tips) |
| Assume you know what's there | Always read current state before modifying |

**An "enhanced" recipe must have actual improvements:**
- Better cooking techniques
- Timing optimization
- Equipment-specific instructions
- Texture/doneness cues
- NOT just scaled quantities

---

**Update JSON format** - only include fields you're changing:

```json
{
  "ingredients": ["updated", "ingredient", "list"],
  "instructions": ["step 1", "step 2"],
  "cuisine": "Swedish",
  "category": "Huvudrätt",
  "tags": ["vegetarian", "quick", "weeknight"]
}
```

**PowerShell tip**: For complex JSON, write to a temp file first:

```powershell
@'
{ "cuisine": "Italian", "tags": ["pasta"] }
'@ | Out-File -Encoding utf8 data/temp_update.json
uv run python scripts/recipe_reviewer.py update <id> (Get-Content data/temp_update.json -Raw)
```

---

## Configuration Files

This skill requires two configuration files in the same directory:

1. **`household-config.md`**: Dietary preferences, household size, serving requirements, pantry staples
2. **`equipment.md`**: Available cooking equipment and optimization tips

**Read both files before making recommendations.** Apply the constraints and preferences from these files to all recipe improvements.

---

## Improvement Principles

### 1. Timing and Staggering

- **Delicate vegetables** (broccoli, leafy greens, zucchini): Add later in cooking to avoid mushiness
- **Onions**: For roasting, add 10-15 minutes after root vegetables to avoid burning
- **Garlic**: Add in the final 5-10 minutes to prevent bitterness
- **Dense vegetables** (potatoes, carrots, root veg): Start first, they need the most time

### 2. Airfryer for Proteins (When It Adds Value)

**The goal is better food, not simplicity.** Use airfryer when it improves results:

| ✅ Good candidates | Why |
| ----------------- | --- |
| Sheet pan chicken + vegetables | Chicken dries out waiting for vegetables - separate cooking gives control |
| Whole chicken breast, thighs | Precise doneness, juicier result than oven |
| Halloumi, paneer | Crispy exterior without pan-frying |
| When oven is occupied | Parallel cooking reduces total time |

| ❌ Not a good fit | Why |
| ---------------- | --- |
| Proteins that simmer in sauce | Pre-cooking adds complexity without benefit |
| Large roasts (whole chicken) | Won't fit, needs even heat circulation |
| When original method works well | Don't change what isn't broken |

**Key insight:** "One-pan simplicity" is not sacred. If splitting cooking between oven and airfryer produces better results (juicier protein, properly cooked vegetables), that's the right call.

Check `equipment.md` for specific temperatures and cooking times.

### 3. Vegetarian Protein Adaptations

When `household-config.md` specifies vegetarian alternatives for meat dishes:

- Check relative cooking times (alternatives often cook faster than meat)
- Note moisture differences (some alternatives dry faster, others release more liquid)
- Adjust for sauce/marinade absorption characteristics
- Consider cooking separately if timing differs significantly

**CRITICAL: When substituting proteins, you MUST:**

1. **Check `household-config.md`** for specific preparation notes for that protein type
2. **Update oil quantities** - soy mince needs extra oil (less fat than meat)
3. **Adjust cooking times** in the instructions - don't just swap the ingredient name
4. **Add tips** where behavior differs (e.g., "browns faster", "add liquid if dry")
5. **Remove meat-specific language** from instructions ("kött", "köttfärs", etc.)

**Common mistakes to avoid:**

- ❌ Swapping "blandfärs" → "sojafärs" without updating cooking instructions
- ❌ Keeping original oil amounts (soy needs more)
- ❌ Keeping original cooking times (soy cooks faster)
- ✅ Always re-read preparation notes in `household-config.md` for the specific protein

### 4. Flavor Enhancements

When a recipe could be improved with finishing touches, add them using pantry staples defined in `household-config.md`.

**Enhancement patterns**:

- **Roasted proteins from airfryer**: Finish with butter, citrus, and fresh herbs
- **Roasted vegetables**: Drizzle with quality oil and flaky salt before serving
- **Grains (rice, bulgur, couscous)**: Stir in butter or oil for richness
- **Sauces**: Brighten with a squeeze of citrus at the end
- **Gratins**: Top with cheese or breadcrumbs for texture

### 5. Practical Adjustments

- **Never consolidate ingredients** - if the original recipe lists an ingredient multiple times, trust that there's a reason (different phases, different purposes, or intentional emphasis)
- Clarify vague quantities ("salt och peppar" → "1/2 tsk salt, 2 krm svartpeppar")
- Suggest mise en place order for efficient cooking

### 6. Volumetric Measurements with Weight

For non-spice ingredients in volumetric measures, include weight in parentheses.

**Include weight for:**
- Dry goods: "2 dl Ris (160 g)", "1 dl Mjöl (60 g)"
- Grains: "3 dl Havregryn (90 g)", "2 dl Linser (180 g)"
- Sugar: "1½ dl Socker (150 g)"

**Exclude (no weight needed):**
- Spices (krm, tsk, msk amounts)
- Liquids (water, milk, stock) - 1 liter ≈ 1 kg

This helps with portion scaling and precision cooking.

### 7. Practical Measurements - Round to Measurable Units

Never use fractional milliliters. Round to the nearest practical measure:

| Unpractical | → Practical |
| ----------- | ----------- |
| 12,5 ml     | 1 msk (15 ml) or 2 tsk (10 ml) |
| 37,5 ml     | 2½ msk (37.5 ml) or 3 msk (45 ml) |
| 7,5 ml      | 1½ tsk (7.5 ml) ✓ or 2 tsk (10 ml) |

**Always prefer:** krm < tsk < msk over ml for small amounts.

### 8. HelloFresh Portion Markers - Always Use 4-Portion Amounts

HelloFresh recipes often contain portion markers:
- `[X | Y]` format: First value is 2P, second is 4P
- `[X, 2P]` format: Value is for 2 portions

**Always extract and use the 4-PORTION (4P) value:**

| Original | → Convert to |
| -------- | ------------ |
| `vatten [3 dl \| 6 dl]` | 6 dl vatten |
| `salt [½ tsk \| 1 tsk]` | 1 tsk salt |
| `[1/2 paket, 2P]` | 1 paket (hela) |
| `lime [1/2 st, 2P]` | 1 st lime |
| `[1 msk \| 2 msk]` | 2 msk |

**Remove all portion markers from the final output.**

---

## Verification Checklist (CRITICAL)

Before finalizing any recipe improvement, verify:

1. **No fractions smaller than ½ tsk**: Use krm for amounts less than ½ tsk
   - ❌ `¼ tsk` → ✅ `1 krm`
   - ❌ `1/4 tsk` → ✅ `1 krm`
   - ✅ `½ tsk` is acceptable

2. **Ingredient accounting**: Every ingredient in the list must appear in the instructions. Check that no ingredient is:
   - Moved to a different cooking method without justification
   - Omitted from instructions entirely
   - Changed from raw to cooked (or vice versa) unintentionally

2. **Original intent preserved**: Read the original instructions carefully to understand:
   - Which ingredients are cooked vs served raw
   - Which components are combined vs kept separate
   - The intended texture/presentation

3. **Dairy product identity**: Never substitute one dairy type for another:
   - Syrad grädde/Crème fraîche ≠ Grädde (different fat, acidity, behavior)
   - Gräddfil ≠ Crème fraîche (different consistency)
   - Kvarg/Kesella ≠ Crème fraîche (different texture)
   - Only add "(laktosfri)" suffix, never change the product itself

4. **Timing sanity check**: Ensure total cooking time still makes sense after staggering

5. **Cross-reference**: For each ingredient, trace it from the ingredient list → instructions → final dish

6. **Tips field content**: Tips are for optional enhancements, NOT operational flow:
   - ✅ **Belongs in tips field**: Reference info (e.g., spice blend composition), make-ahead suggestions, storage notes
   - ❌ **Does NOT belong in tips field**: Substitutions, flavor variations, technique alternatives - these should be **inline**

8. **Inline tips with 💡 prefix**: Actionable tips are **separate entries** in the instructions array, placed right after the step they relate to:
   - Format: `💡 ALTERNATIV: Use X instead of Y...` or `💡 EXTRA: Add Z for more flavor`
   - **IMPORTANT**: Tips are their own array entry, NOT appended to the step text
   - Examples:
     ```json
     [
       "Skala pumpan och skär i bitar. Ringla över olja.",
       "💡 ALTERNATIV: Använd hokkaidopumpa - skalet är ätbart.",
       "⏱️ 5 min: Ställ in i ugnen..."
     ]
     ```
   - ❌ Wrong: `"Skala pumpan... 💡 ALTERNATIV: Använd hokkaido..."` (embedded in step)
   - ✅ Correct: Tip on its own line, after the step it relates to
   - **Why separate?** The mobile app renders tips with distinct styling (🟢 green background), which only works when the entry starts with 💡

7. **Timeline format for complex recipes**: For recipes with parallel cooking (oven + airfryer, multiple components), use `⏱️ X min:` prefix format:
   - Each timeline step is a **separate entry** in the instructions array
   - Format: `⏱️ 0 min: Sätt ugnen på 200°C. Skär potatisen...`
   - Not every step needs a time marker - only when timing coordination matters
   - Example structure:
     ```
     ["⏱️ 0 min: Sätt ugnen på 175°C. Förbered grönsakerna...",
      "Blanda grönsakerna med olja och kryddor. Ställ in i ugnen.",
      "⏱️ 5 min: Marinera kycklingen...",
      "⏱️ 10 min: Lägg kycklingen i airfryern på 180°C...",
      "⏱️ 25 min: Stek Quornfiléerna i smör...",
      "⏱️ 35 min: Servera!"]
     ```

---

## Output Format

When improving a recipe, provide:

1. **Summary of changes**: Brief list of what you're improving and why
2. **Verification notes**: Confirm ingredient accounting is correct
3. **Updated ingredients**: Only if changes are needed (consolidated, clarified)
4. **Updated instructions**: Full rewritten instructions with improvements
5. **Tips**: Optional cooking tips or variations

---

## Example Improvement

This example demonstrates the **staggered timing principle** for roasted vegetables. Protein handling depends entirely on the household configuration - don't assume airfryer or specific alternatives.

**Original instruction:**

> Lägg kyckling och grönsaker på en plåt och rosta i 30 min.

**Improved instruction (vegetables only - demonstrates timing principle):**

> 1. Lägg potatis och morötter på plåten, rosta i 15 min.
> 2. Tillsätt lök och broccoli, rosta ytterligare 10 min.
> 3. Tillsätt vitlök de sista 5 minuterna.

**For protein handling:** Always check `household-config.md` for:
- Whether to offer alternatives (meat + vegetarian)
- Which specific alternatives to use (varies by protein type)
- Whether airfryer is available and appropriate (check `equipment.md`)

**Don't assume:** Every chicken recipe needs airfryer instructions. Only suggest when it genuinely improves the dish (e.g., crispier skin, faster cooking, freeing oven space).

---

## Anti-Patterns (Avoid These)

| ❌ Don't | ✅ Do Instead |
| -------- | ------------- |
| Use airfryer for proteins that simmer in sauce | Cook directly in the sauce for flavor integration |
| Hardcode "Quorn" as chicken alternative | Read household-config.md for current preference |
| Copy timing from examples verbatim | Calculate based on actual ingredients and equipment |
| Preserve "one-pan simplicity" when it hurts quality | Split cooking if it produces better results (e.g., juicier chicken) |
| Skip airfryer when it would genuinely help | Sheet pan meals often benefit from separate cooking |
| Use "protein/proteiner" in recipe text | Use specific names: kyckling, Quorn, lax, etc. |
| Put substitution tips in the tips field | Inline with 💡 in the relevant instruction step |
| Put "add crème fraîche for richness" at the end | Put 💡 EXTRA KRÄMIGHET inline where you add parmesan |

---

## Language

- Keep recipes in Swedish (matching the source)
- Use Swedish cooking terminology
- Measurements in metric (g, ml, dl, msk, tsk)
- **Avoid generic terms** like "protein" in recipe instructions - use the actual ingredient names (kyckling, Quorn, fisk, etc.)

---

## Recipe Enhancement Architecture

The app includes AI-powered recipe enhancement using Gemini. The prompt system is split into modular files for maintainability.

### Design Principles

- **Public repo ready**: Anyone can clone, apply terraform, and run their own instance
- **Core vs User config**: Separate universal improvements from household-specific preferences
- **Additive equipment model**: Baseline is stove + oven; users list additional equipment they HAVE

### Prompt Structure

```
config/prompts/
  core/                    # Committed, applies to ALL users
    base.md                # Role, output JSON schema
    formatting.md          # Fractions (½ not 0.5), ingredient order, Swedish measurements
    rules.md               # Forbidden terms, HelloFresh spice replacements

  user/                    # User-specific preferences
    dietary.md             # Dietary restrictions, protein substitutions, lactose-free rules
    equipment.md           # Kitchen equipment (airfryer specs, oven settings)
```

### Loading Prompts

The `api/services/prompt_loader.py` module assembles prompts from these files:

```python
from api.services.prompt_loader import load_system_prompt

prompt = load_system_prompt()  # Load complete prompt (core + user)
status = validate_prompts()    # Returns dict of file -> exists
```

### CLI Enhancement Tools

```bash
# Enhance single recipe
uv run python scripts/recipe_enhancer.py <recipe_id>

# Preview without saving
uv run python scripts/recipe_enhancer.py <recipe_id> --dry-run

# Batch process unenhanced recipes
uv run python scripts/recipe_enhancer.py --batch 10

# Validate enhanced recipes
uv run python scripts/validate_gemini.py --skip 10 --limit 5

# Re-upload corrupted enhanced recipe from JSON backup
uv run python scripts/upload_enhanced_recipe.py <recipe_id>
```

### Key Rules Enforced

- **Forbidden terms**: "protein/proteiner" - use specific names (kyckling, Quorn)
- **No consolidation**: Keep separate ingredient entries (salt for pasta, salt for chicken)
- **Concrete quantities**: Convert "1 paket" → "400 g", "en nypa" → "2 krm"
- **Swedish fractions**: Use ½, ⅓, ¼ - never 0.5, 0.33, 0.25
- **HelloFresh spices**: Replace blends with individual spices
