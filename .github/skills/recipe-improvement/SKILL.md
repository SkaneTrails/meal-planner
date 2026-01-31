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

| Command                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `next`                 | Fetch the next unprocessed recipe from the source database |
| `get <id>`             | Fetch a specific recipe by ID                              |
| `update <id> '<json>'` | Apply improvements and save to target database             |
| `skip <id>`            | Mark recipe as skipped (no changes needed)                 |
| `status`               | Show progress (processed/skipped/remaining counts)         |

**Database configuration:**

- **Source**: `(default)` database - original recipes
- **Target**: `meal-planner` database - improved recipes
- **Progress file**: `data/recipe_review_progress.json`

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
|-------------------|-----|
| Sheet pan chicken + vegetables | Chicken dries out waiting for vegetables - separate cooking gives control |
| Whole chicken breast, thighs | Precise doneness, juicier result than oven |
| Halloumi, paneer | Crispy exterior without pan-frying |
| When oven is occupied | Parallel cooking reduces total time |

| ❌ Not a good fit | Why |
|------------------|-----|
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

---

## Verification Checklist (CRITICAL)

Before finalizing any recipe improvement, verify:

1. **Ingredient accounting**: Every ingredient in the list must appear in the instructions. Check that no ingredient is:
   - Moved to a different cooking method without justification
   - Omitted from instructions entirely
   - Changed from raw to cooked (or vice versa) unintentionally

2. **Original intent preserved**: Read the original instructions carefully to understand:
   - Which ingredients are cooked vs served raw
   - Which components are combined vs kept separate
   - The intended texture/presentation

3. **Timing sanity check**: Ensure total cooking time still makes sense after staggering

4. **Cross-reference**: For each ingredient, trace it from the ingredient list → instructions → final dish

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
|----------|---------------|
| Use airfryer for proteins that simmer in sauce | Cook directly in the sauce for flavor integration |
| Hardcode "Quorn" as chicken alternative | Read household-config.md for current preference |
| Copy timing from examples verbatim | Calculate based on actual ingredients and equipment |
| Preserve "one-pan simplicity" when it hurts quality | Split cooking if it produces better results (e.g., juicier chicken) |
| Skip airfryer when it would genuinely help | Sheet pan meals often benefit from separate cooking |
| Use "protein/proteiner" in recipe text | Use specific names: kyckling, Quorn, lax, etc. |

---

## Language

- Keep recipes in Swedish (matching the source)
- Use Swedish cooking terminology
- Measurements in metric (g, ml, dl, msk, tsk)
- **Avoid generic terms** like "protein" in recipe instructions - use the actual ingredient names (kyckling, Quorn, fisk, etc.)
