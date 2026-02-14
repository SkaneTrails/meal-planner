---
name: recipe-improvement
description: Improve recipes with cooking techniques, timing optimization, equipment-specific instructions, and household dietary preferences.
license: MIT
---

# Skill: Recipe Improvement

Culinary expert assistant for improving recipes in the meal planning app. Goal: more practical, flavorful, and adaptable for home cooking.

---

## Activation Context

- Review, improve, or optimize a recipe
- Working with recipe data from Firestore
- Using `tools/recipe_manager.py` for recipe CRUD
- Developer mentions "recipe", "cooking", "ingredients", or "instructions"

---

## Recipe Manager Tool

```bash
uv run python tools/recipe_manager.py --project <project_id> <command> [args]
```

Key commands: `list`, `get <id>`, `enhanced <id>`, `export <id>`, `delete <id>`, `update <id> '<json>'`, `upload <id> <file>`, `skip <id>`, `next`, `status`. Run without args for interactive menu. Use `--help` for full details.

**Database:** `meal-planner`. **Progress file:** `data/recipe_review_progress.json`.

---

## Enhancement Data Safety

Enhanced recipes store **both versions in the same Firestore document**:

- **Top-level fields** = enhanced version (app displays these)
- **`original` nested field** = immutable snapshot of scraped data (set once on first enhancement)
- **`enhanced: true`** flag, `enhanced_at` (ISO 8601 UTC), `changes_made` (list of strings, same language as recipe)

### Rules

1. **NEVER use `.set()`** — destroys fields not in payload. Always `.update()` to merge
2. **`original` is immutable** — set once on first enhancement, never modified
3. **Always fetch before modifying** — `recipe_manager.py get <id>`
4. **`update` command handles snapshotting** — creates `original` on first enhancement, preserves existing on re-enhancement

### Common mistakes

| ❌ Wrong | ✅ Correct |
| -------- | --------- |
| `doc_ref.set(enhanced_data)` | `doc_ref.update(enhanced_data)` |
| Write inline Python with `.set()` | Use `recipe_manager.py update` |
| Scale original to 4P and call it "enhanced" | Apply real improvements (techniques, timing, tips) |
| Assume you know what's there | Always read current state before modifying |

**Update JSON format** — only include changed fields:

```json
{ "ingredients": ["..."], "instructions": ["..."], "cuisine": "Swedish", "tags": ["vegetarian"] }
```

**PowerShell**: Write complex JSON to a temp file first, then pass with `(Get-Content data/temp_update.json -Raw)`.

---

## Configuration Files

**Read BOTH before making any recommendations:**

1. **`household-config.md`** (this directory): Dietary preferences, household size, serving target, pantry staples
2. **`equipment.md`** (this directory): Available cooking equipment, temperatures, cooking times

---

## Improvement Principles

### 1. Timing and Staggering

| Ingredient Type | When to Add |
|-----------------|-------------|
| Dense vegetables (potatoes, carrots, root veg) | Start first — longest cook time |
| Onions (roasting) | 10–15 min after root vegetables |
| Delicate vegetables (broccoli, zucchini, leafy greens) | Add later to avoid mushiness |
| Garlic | Final 5–10 min to prevent bitterness |

### 2. Component-Level Equipment Optimization

Evaluate each component independently — don't treat equipment as all-or-nothing.

| Principle | Example |
|-----------|---------|
| Best tool per component | Fish stays pan-fried (needs fond for sauce), parsnips → airfryer (faster, crispier) |
| Parallel cooking | Airfryer + stovetop simultaneously saves time |
| Quality over simplicity | Split cooking if it produces better results |

**Check `equipment.md`** for specific temperatures/times. Only suggest airfryer when it genuinely improves the dish.

### 3. Vegetarian Protein Adaptations

When `household-config.md` specifies vegetarian alternatives:

1. **Read preparation notes** in `household-config.md` for the specific protein type
2. **Update oil quantities** — soy mince needs extra oil (less fat than meat)
3. **Adjust cooking times** — don't just swap the ingredient name
4. **Add tips** where behavior differs (e.g., "browns faster", "add liquid if dry")
5. **Remove meat-specific language** from instructions ("kött", "köttfärs")

### 4. Flavor Enhancements

Use pantry staples from `household-config.md`:

- **Roasted proteins from airfryer**: Finish with butter, citrus, fresh herbs
- **Roasted vegetables**: Quality oil + flaky salt before serving
- **Grains**: Stir in butter/oil for richness
- **Sauces**: Brighten with citrus at the end

### 5. Practical Adjustments

- **Never consolidate ingredients** — if listed multiple times, trust there's a reason (different phases/purposes)
- Clarify vague quantities: "salt och peppar" → "1/2 tsk salt, 2 krm svartpeppar"
- Suggest mise en place order

### 6. Measurements

**Volumetric with weight** (non-spice dry goods): "2 dl Ris (160 g)", "1 dl Mjöl (60 g)". Exclude spices and liquids (1 liter ≈ 1 kg, so weight adds no value).

**Round to measurable units:**

| Unpractical | → Practical |
|-------------|-------------|
| 12,5 ml | 1 msk (15 ml) |
| 7,5 ml | 1½ tsk |

Prefer: krm < tsk < msk over ml for small amounts.

### 7. HelloFresh Portion Markers

`[X | Y]` = 2P | 4P. `[X, 2P]` = value for 2 portions. **Always use 4P value.** Remove all markers from output.

---

## Verification Checklist

Before finalizing any improvement, verify ALL of these:

1. **No fractions < ½ tsk** — use krm instead (❌ `¼ tsk` → ✅ `1 krm`)
2. **Ingredient accounting** — every ingredient in the list appears in instructions, none omitted or moved without justification
3. **Ingredient order** — listed in the order they are first used in the instructions (spices always last)
4. **Original intent preserved** — which items are cooked vs raw, combined vs separate, intended texture
5. **Dairy identity preserved** — never substitute dairy types (syrad grädde ≠ grädde, gräddfil ≠ crème fraîche). Only add "(laktosfri)" suffix
6. **Timing sanity** — total cooking time makes sense after staggering
7. **Cross-reference** — trace each ingredient: list → instructions → final dish

### Instruction Formatting

**Tips** use 💡 prefix as **separate array entries** after the step they relate to:

```json
["Skala pumpan och skär i bitar.",
 "💡 ALTERNATIV: Använd hokkaidopumpa - skalet är ätbart.",
 "⏱️ 5 min: Ställ in i ugnen..."]
```

- ❌ Embedded in step text: `"Skala pumpan... 💡 ALTERNATIV: ..."`
- ✅ Own entry starting with 💡 — mobile app renders with distinct green styling
- Tips field is for reference info (spice composition, storage notes) — NOT substitutions or technique alternatives

**Timeline format** for parallel cooking: `⏱️ X min:` prefix. Only when timing coordination matters.

---

## Output Format

1. **Summary of changes**: What you're improving and why
2. **Verification notes**: Confirm ingredient accounting
3. **Updated ingredients**: Only if changes needed
4. **Updated instructions**: Full rewritten instructions
5. **Tips**: Optional cooking tips

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Airfryer for proteins simmering in sauce | Cook in sauce for flavor integration |
| Hardcode "Quorn" as chicken alternative | Read `household-config.md` for current preference |
| Copy timing from examples verbatim | Calculate per actual ingredients + equipment |
| Preserve "one-pan simplicity" when it hurts quality | Split cooking for better results |
| Use "protein/proteiner" in recipe text | Specific names: kyckling, Quorn, lax |
| Put substitution tips in tips field | Inline with 💡 in relevant instruction step |

---

## Language

- Keep recipes in Swedish (matching source)
- Swedish cooking terminology and metric measurements (g, ml, dl, msk, tsk)
- **Avoid generic terms** like "protein" — use actual ingredient names

---

## Prompt System

Modular prompt files in `config/prompts/`:

```
config/prompts/
  core/          # Committed — applies to ALL users
    base.md      # Role, output JSON schema
    formatting.md # Fractions, ingredient order, Swedish measurements
    rules.md     # Forbidden terms, HelloFresh spice replacements
  user/          # User-specific preferences
    dietary.md   # Dietary restrictions, protein substitutions
    equipment.md # Kitchen equipment specs
```

Load via `api/services/prompt_loader.py`:

```python
from api.services.prompt_loader import load_system_prompt, validate_prompts
prompt = load_system_prompt()      # Complete prompt (core + user)
status = validate_prompts()        # Dict of file -> exists
```

### Key Rules Enforced in Prompts

- **Forbidden terms**: "protein/proteiner" → use specific names
- **No consolidation**: Keep separate ingredient entries
- **Concrete quantities**: "1 paket" → "400 g", "en nypa" → "2 krm"
- **Swedish fractions**: ½, ⅓, ¼ — never 0.5, 0.33
- **HelloFresh spices**: Replace blends with individual spices
