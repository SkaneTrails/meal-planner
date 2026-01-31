"""
Validate Gemini output against existing enhanced recipes.

This script:
1. Gets enhanced recipes from meal-planner database
2. Re-runs Gemini on the original recipe
3. Compares key aspects for quality issues
4. Stops on first error for prompt adjustment

Usage:
    uv run python scripts/validate_gemini.py           # Validate up to 5 recipes
    uv run python scripts/validate_gemini.py --limit 10  # Validate 10 recipes
    uv run python scripts/validate_gemini.py --all     # Validate all enhanced recipes
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

from google.cloud import firestore


class DateTimeEncoder(json.JSONEncoder):
    """JSON encoder that handles datetime objects."""

    def default(self, o: Any) -> Any:
        if hasattr(o, "isoformat"):
            return o.isoformat()
        return super().default(o)


# Import the enhance function from recipe_enhancer
sys.path.insert(0, str(Path(__file__).parent))
from recipe_enhancer import enhance_recipe, get_recipe


def get_enhanced_recipes(limit: int | None = None) -> list[tuple[str, dict]]:
    """Get recipes from the enhanced database."""
    db = firestore.Client(database="meal-planner")
    query = db.collection("recipes")

    if limit:
        query = query.limit(limit)

    recipes = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id
        recipes.append((doc.id, data))

    return recipes


def check_issues(original: dict, gemini_output: dict) -> list[str]:
    """Check for issues in Gemini output."""
    _ = original  # Used for context but not currently checked
    issues: list[str] = []

    gemini_ingredients = gemini_output.get("ingredients", [])
    gemini_instructions = gemini_output.get("instructions", "")

    # Convert instructions to string if it's a list
    if isinstance(gemini_instructions, list):
        gemini_instructions = " ".join(gemini_instructions)
    gemini_instr_lower = gemini_instructions.lower()

    # 1. Check for forbidden terms
    forbidden_terms = [
        ("protein", "Generic 'protein' term used instead of specific names"),
        ("proteiner", "Generic 'proteiner' term used instead of specific names"),
        ("tvätta händer", "Hygiene warning included"),
        ("hantera rå", "Raw meat handling warning included"),
        ("laktosfri kokosmjölk", "Coconut milk incorrectly marked lactose-free"),
        ("0.5 ", "Decimal fraction instead of ½"),
        ("0.33", "Decimal fraction instead of ⅓"),
        ("0.25", "Decimal fraction instead of ¼"),
    ]

    for term, message in forbidden_terms:
        if term in gemini_instr_lower:
            issues.append(f"❌ FORBIDDEN: {message}")
        issues.extend(
            f"❌ FORBIDDEN in ingredient: {message} - '{ing}'" for ing in gemini_ingredients if term in ing.lower()
        )

    # 2. Check protein substitution for chicken recipes
    orig_ingredients = " ".join(original.get("ingredients", [])).lower()
    if "kyckling" in orig_ingredients and "fisk" not in orig_ingredients and "lax" not in orig_ingredients:
        has_quorn = any("quorn" in ing.lower() for ing in gemini_ingredients)
        if not has_quorn:
            issues.append("❌ MISSING: Quorn alternative for chicken recipe")

    # 3. Check for consolidated salt (single salt entry with multiple uses in instructions)
    salt_ingredients = [i for i in gemini_ingredients if "salt" in i.lower() and "halloumi" not in i.lower()]
    salt_mentions = gemini_instr_lower.count("salt")
    if len(salt_ingredients) == 1 and salt_mentions > 2:
        # Check if the single entry has a phase annotation
        salt_entry = salt_ingredients[0].lower()
        if "(" not in salt_entry and "till" not in salt_entry:
            issues.append(
                f"❌ CONSOLIDATION: Single salt entry '{salt_ingredients[0]}' but {salt_mentions} uses in instructions - must list each use separately"
            )

    # 4. Check HelloFresh spice replacement
    orig_ing_text = " ".join(original.get("ingredients", [])).lower()
    if "hellofresh" in orig_ing_text or "milda mahal" in orig_ing_text or "hello sunrise" in orig_ing_text:
        gemini_ing_text = " ".join(gemini_ingredients).lower()
        if "hellofresh" in gemini_ing_text or "milda mahal" in gemini_ing_text or "hello sunrise" in gemini_ing_text:
            issues.append("❌ MISSING: HelloFresh spice blend not replaced with individual spices")

    # 5. Check soy sauce specificity
    for ing in gemini_ingredients:
        ing_lower = ing.lower()
        if (
            "sojasås" in ing_lower
            and "japansk" not in ing_lower
            and "ljus" not in ing_lower
            and "mörk" not in ing_lower
        ):
            issues.append(f"⚠️  VAGUE: Unspecified soy sauce - should be 'japansk soja' or 'ljus soja': '{ing}'")

    # 6. Check for equipment we don't have
    forbidden_equipment = ["slow cooker", "sous vide", "instant pot", "brödmaskin"]
    issues.extend(f"❌ FORBIDDEN EQUIPMENT: {equip}" for equip in forbidden_equipment if equip in gemini_instr_lower)

    # 7. Check Quorn cooking method (should be pan-fried, not airfryer)
    if (
        "quorn" in gemini_instr_lower
        and "airfryer" in gemini_instr_lower
        and "quorn" in gemini_instr_lower.split("airfryer")[0][-100:]
    ):
        issues.append("❌ WRONG METHOD: Quorn should be pan-fried in butter, not airfryer")

    return issues


def validate_recipes(limit: int | None = 5, delay: float = 4.0) -> dict:
    """Validate Gemini output against enhanced recipes."""
    print("\n" + "=" * 70)
    print("🔍 GEMINI VALIDATION - Comparing output against enhanced recipes")
    print("=" * 70)

    enhanced_recipes = get_enhanced_recipes(limit)

    if not enhanced_recipes:
        print("❌ No enhanced recipes found!")
        return {"success": 0, "failed": 0, "issues": []}

    print(f"\n📚 Found {len(enhanced_recipes)} enhanced recipes to validate")
    print(f"⏱️  Delay between API calls: {delay}s")
    print("-" * 70)

    success = 0
    failed = 0
    issues_found: list[dict] = []
    validated: list[str] = []

    for i, (recipe_id, existing_enhanced) in enumerate(enhanced_recipes):
        title = existing_enhanced.get("title", "Unknown")[:50]
        print(f"\n[{i + 1}/{len(enhanced_recipes)}] {title}")
        print(f"         ID: {recipe_id}")

        # Get original recipe
        original = get_recipe(recipe_id)
        if not original:
            print("         ⚠️  Original recipe not found, skipping...")
            continue

        # Run Gemini
        print("         🤖 Running Gemini...")
        try:
            gemini_output = enhance_recipe(original)
        except Exception as e:
            print(f"         ❌ Gemini error: {e}")
            failed += 1
            continue

        if not gemini_output:
            print("         ❌ Gemini returned empty output")
            failed += 1
            continue

        # Check for issues
        issues = check_issues(original, gemini_output)

        if issues:
            print("         ❌ ISSUES FOUND:")
            for issue in issues:
                print(f"            {issue}")

            # Save the problematic output for inspection
            output_file = Path(f"data/validate_{recipe_id}.json")
            with output_file.open("w", encoding="utf-8") as f:
                json.dump(
                    {"original": original, "gemini_output": gemini_output, "issues": issues},
                    f,
                    ensure_ascii=False,
                    indent=2,
                    cls=DateTimeEncoder,
                )
            print(f"         📁 Saved to: {output_file}")

            # Check if any are critical (❌)
            critical = [i for i in issues if i.startswith("❌")]
            if critical:
                print("\n" + "=" * 70)
                print("🛑 STOPPING - Critical issue found!")
                print("   Fix the Gemini prompt and re-run validation.")
                print("=" * 70)
                issues_found.append({"recipe_id": recipe_id, "title": title, "issues": issues})
                failed += 1
                return {"success": success, "failed": failed, "issues": issues_found, "validated": validated}
            # Warnings only - continue but track
            issues_found.append({"recipe_id": recipe_id, "title": title, "issues": issues})

        print("         ✅ Passed validation")
        success += 1
        validated.append(recipe_id)

        # Rate limiting
        if i < len(enhanced_recipes) - 1:
            time.sleep(delay)

    # Summary
    print("\n" + "=" * 70)
    print("📊 VALIDATION SUMMARY")
    print("=" * 70)
    print(f"   ✅ Passed:  {success}")
    print(f"   ❌ Failed:  {failed}")
    print(f"   ⚠️  Issues: {len(issues_found)}")

    if issues_found:
        print("\n   Issues found in:")
        for item in issues_found:
            print(f"   - {item['title'][:40]}: {len(item['issues'])} issues")

    if success >= 5 and failed == 0:
        print("\n   🎉 All validations passed! Gemini prompt is working correctly.")

    print("=" * 70)

    return {"success": success, "failed": failed, "issues": issues_found, "validated": validated}


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Gemini output against enhanced recipes")
    parser.add_argument("--limit", type=int, default=5, help="Number of recipes to validate (default: 5)")
    parser.add_argument("--all", action="store_true", help="Validate all enhanced recipes")
    parser.add_argument("--delay", type=float, default=4.0, help="Delay between API calls (default: 4.0)")

    args = parser.parse_args()

    limit = None if args.all else args.limit
    validate_recipes(limit=limit, delay=args.delay)


if __name__ == "__main__":
    main()
