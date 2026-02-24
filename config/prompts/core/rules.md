# Recipe Enhancement - Critical Rules

## FORBIDDEN (CRITICAL — NEVER BREAK THESE RULES)

### The word "protein/proteins" is FORBIDDEN

NEVER write "protein" or "proteins" anywhere in the output, including compound words ("kycklingprotein"). Use the specific ingredient name.

- ❌ "Cook protein in air fryer" / "Kycklingprotein delades upp"
- ✅ "Cook chicken in air fryer" / "Kycklingen delades upp"

**Self-check:** Search your entire output for "protein". If found, replace with the specific name.

### Other forbidden things

- List each ingredient use separately with purpose (see formatting rules for exceptions: salt/pepper limit, same-physical-item rule)
- No hygiene warnings ("wash hands", "handle raw meat") — we know
- No hygiene rules for Quorn (pre-cooked, pre-prepared)
- No equipment not in the equipment list
- No "lactose-free coconut milk" (already dairy-free)
- No changing protein form (strips → pieces, mince → chunks)
- No explanation tips — put substitution rationale in `changes_made`

## Preserve original quantities — CRITICAL

NEVER change a specific amount from the original recipe unless scaling for servings. You may clarify vague terms ("en skvätt" → "1 msk") but a quantity like "0.75 dl" stays "0.75 dl" — do not round up or adjust based on your preference.

When scaling for portion markers, scale ALL quantities proportionally.

**Self-check:** Compare every ingredient quantity in your output against the original. If any specific amount changed (and servings didn't change), revert it.

## Preserve all original ingredients — CRITICAL

NEVER remove an ingredient from the original recipe. Every ingredient in the original MUST appear in the output. You may:

- Clarify vague ingredients ("kryddor" → specific spices)
- Add new ingredients (acid, garnish, seasoning for substitutions)
- Split an ingredient for the protein split (e.g., "300g mince" → "150g beef mince" + "150g soy mince")

You may NOT:

- Drop an ingredient because you think it's unnecessary
- Move an ingredient from the recipe body to a tip
- Replace an ingredient with a different one (unless dietary rules require it)
- Strip an alternative from an ingredient (see below)

### Ingredient alternatives stay in the ingredient list

Ingredient alternatives ("X eller Y") are part of the ingredient — they tell the cook what to buy. NEVER simplify an ingredient by removing its alternative and moving it to a 💡 ALTERNATIVE instruction tip.

- ✅ "2 msk Ättiksprit 12% eller vitvinsvinäger" — cook sees both options while shopping
- ❌ Ingredient: "2 msk Ättiksprit 12%" + Tip: "💡 ALTERNATIVE: Byt ut mot vitvinsvinäger" — alternative hidden from shopping list

**Self-check:** Count ingredients in original vs output. If output has fewer (excluding protein splits which increase count), you dropped something — find it and restore it.

Also check the original instructions: if the original says to use an ingredient in a specific way (e.g., "massage with olive oil"), that ingredient MUST appear in the same role in the output. Do not silently reassign an ingredient from one use to another.

## Preserve ingredient descriptors

Keep qualifiers from original ingredients ("BBQ-marinerad", "rökt", "ekologisk"). These describe what the cook should buy.

## Soy sauce

Specify the type (light, dark, Japanese-style). Chinese dark soy and Japanese soy are not interchangeable.

## Dairy products — preserve type

NEVER substitute one dairy type for another. Lactose-free rules are in the locale and dietary configs.

## Meal kit spice blends

ALWAYS replace proprietary blends (HelloFresh, Gousto, etc.) with individual spices. Replacements are in the locale config.

## Airfryer and equipment capacity

If the equipment list includes an airfryer, consider using it for components that benefit from dry, high heat (meat for crispy exterior, root vegetables for caramelization). Cook other components on stovetop simultaneously for parallel cooking.

The airfryer cooks ONE component at a time (~4 L basket). If food doesn't fit in one batch, prefer oven or large pan — first batch goes cold while second cooks.

- ❌ Veggies in airfryer → then chicken in airfryer (sequential, veggies go cold)
- ❌ Veggies in oven while chicken in airfryer (oven overkill for quick-cooking items)
- ✅ Chicken in airfryer + veggies in pan simultaneously
