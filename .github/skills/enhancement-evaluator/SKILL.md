---
name: enhancement-evaluator
description: Evaluate Gemini-enhanced recipes against quality bar, decide action, track failure modes
---

# Skill: Enhancement Evaluator

Systematic evaluation of Gemini-enhanced recipes. Used during benchmark review of all enhanced recipes in the database.

---

## Activation Context

- Running `recipe_manager.py` commands: `next`, `enhanced`, `reenhance`, `done`, `skip`
- Reviewing Gemini output quality after reenhancement
- Deciding whether to apply, keep, or skip a reenhanced recipe

---

## Tool

`tools/recipe_manager.py --project hikes-482104 <command>`

| Command | Purpose |
|---------|---------|
| `next` | Get next unreviewed enhanced recipe |
| `enhanced <id>` | Show current enhanced version |
| `reenhance <id> --household <id>` | Dry-run reenhancement |
| `reenhance <id> --household <id> --apply` | Apply saved reenhanced JSON to Firestore |
| `done <id>` | Mark as reviewed (good) |
| `skip <id>` | Skip (come back later) |
| `status` | Show review progress |

Default household: `IXdzHJ91NZeutylohx1t`

---

## Core Principle: Enhancement Is the Goal

The purpose of Gemini enhancement is to **make the meal better**. This is the number one priority. A recipe that tastes better, teaches more technique, or has better flavor balance is a successful enhancement — even if it changes things from the original.

**Any ingredient change — adding, reducing, or removing — is acceptable** when it genuinely improves the dish. Adding acid for brightness, reducing excess salt, swapping a weaker spice for a better one, introducing umami — these are all valid enhancements. Judge every change by one criterion: does it make the meal better?

**The real failure mode is silent, unjustified loss.** When Gemini quietly drops an ingredient, shrinks a quantity for no reason, or reassigns an ingredient to a different role without explanation — that's a prompt failure. The difference between "I removed X because Y" (intentional improvement) and "X just disappeared" (bug) is what matters.

## Quality Bar

Every enhancement MUST have:

- **Technique**: heat levels, blooming spices, toasting, resting times with explanation
- **Sensory cues**: "until golden and bubbles appear" — not "cook 5 min"
- **Flavor**: brightness (acid), finishing touches, umami compensation for substitutions
- **Tips**: teach technique, NOT obvious ("use non-stick pan")
- **Correct timings**: prep_time, cook_time, total_time must be accurate (no-cook recipes = null cook_time, not 5)

---

## Decision Tree

### 1. Always reenhance first

Every recipe gets reenhanced with current prompts. This is a benchmark — we need to know if the prompt system produces good results, not just whether the existing enhancement is acceptable.

### 2. Compare: reenhanced vs current

Evaluate the reenhanced output against the current version and present a summary to the user.

### 3. Present summary and await decision

**The user always makes the final call.** Never apply, skip, or mark done without explicit user approval. Present the evaluation report (see format below) and wait for go/no-go.

Recommendations to include in the summary:

| Reenhanced is... | Recommendation |
|-------------------|--------|
| **Better** than current | Recommend: apply |
| **Not good enough** (equal, worse, or breaks something) | Recommend: fix prompt, then reenhance again |

There is no "keep current and move on" option. If the reenhancement isn't good enough, the prompt gets fixed and the recipe gets reenhanced again — repeat until the result is good enough to apply. Every recipe must end with a successful `--apply`.

### Sub-par results must be fixed immediately

If Gemini produces a sub-par result, the underlying prompt issue must be addressed **right now** — after getting the user's go. Then reenhance the same recipe again to verify the fix. Do not move to the next recipe until this one produces a good result and gets applied.

### 4. Never modify tags

Tags are never touched — not in the JSON, not manually, not flagged as issues. Whatever Gemini produces stays.

### 5. Never modify reenhanced JSON

Do not manually edit the reenhanced JSON output. If Gemini's output has problems, that IS the benchmark data — it tells us the prompt needs fixing. Manually patching hides prompt failures.

Exception: timings (prep_time, cook_time, total_time) may be corrected if obviously wrong, since timing estimation is a known weak spot being actively tuned.

---

## Evaluation Report Format

After comparing, report concisely and **wait for the user's decision**:

```
**[Recipe title]** (ID)
Reenhanced: [better / equal / worse] than current
Key differences: [1-3 bullet points]
Recommendation: [apply / keep current / skip]
[If failure mode: what went wrong]
```

Then wait. Do not act until the user says go.

---

## Failure Mode Tracking

When Gemini produces bad output, log it in `.copilot-tasks.md` failure modes table:

| Field | What to log |
|-------|-------------|
| Pattern | What went wrong (e.g., "ingredient dropped") |
| Count | Increment if pattern already exists |
| Severity | Low / Medium / **High** |
| Prompt fix? | Whether a prompt change could prevent it |

### Fixing prompts

Sub-par results are never deferred. After presenting the evaluation and getting user go, fix the prompt **immediately** before moving to the next recipe.

**Prompt files** (all in `config/prompts/`):

| File | Contains |
|------|----------|
| `core/base.md` | System prompt: task definition, quality bar, output schema, timing rules |
| `core/rules.md` | Hard constraints: forbidden patterns, quantity/ingredient preservation, equipment rules |
| `core/formatting.md` | Instruction structure, measurement format, tips quality |
| `core/tagging.md` | Tag vocabulary and rules |
| `locales/sv.md` | Swedish-specific: spice blend replacements, dairy subs, fat rules |
| `user/dietary.md` | Household dietary preferences (auto-loaded) |

**How to fix:**
1. Identify which file the rule belongs in (constraint → `rules.md`, technique → `base.md`, format → `formatting.md`)
2. Read the file to understand current structure
3. Add the rule with a self-check pattern where possible ("Self-check: ...")
4. Update the failure modes table in `.copilot-tasks.md` to mark "✅ Fixed"
5. Add entry to the prompt tuning log in `.copilot-tasks.md`

---

## Recipes Without Original Snapshots

Some early enhancements predate the snapshot system. The enhancer needs the original to produce good output.

**Workaround:**
1. Find source URL from the recipe document
2. Fetch original recipe from source
3. Inject original snapshot via script (`tmp/inject_original.py` pattern)
4. Then reenhance normally

---

## Prompt Tuning Log

Track all prompt changes in `.copilot-tasks.md` under the benchmark section. Each entry:

```
- `<file>` — what changed and why (which failure mode triggered it)
```

This creates a record of which prompt changes fixed which problems.
