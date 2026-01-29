#!/usr/bin/env python3
"""Batch test recipe enhancer on 10 diverse recipes."""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from recipe_enhancer import enhance_recipe, get_recipe

RECIPES = [
    ("0JqDxNKLTNJscYPIvWT6", "Vegetarisk pulled bean bowl"),
    ("0nGmTD8Kv9X7hjHiLdjc", "Linsdhal med strimlad kyckling"),
    ("1Ak7O3eJtvYTkHV7NjyZ", "Fish tacos"),
    ("1F3YYf4yB4hukMgYUdCm", "Thailändsk grön kycklingcurry"),
    ("1JYHMZLHJDCdoMOBDObb", "Auberginegryta (vegetarisk)"),
    ("20lE8vWz6t5Wf3QGpNRw", "Yoghurtmarinerad kyckling"),
    ("2gHczO4asbnDk0x4UMgx", "Halloumisallad"),
    ("4KdyGZeIAVAzoYeHYEKC", "Butter chicken"),
    ("6Vcb62L969jefGIf8XhB", "Thailändsk curry med fisk"),
    ("62epICJPt9Y2t5RajXxX", "Moussaka med vegofärs"),
]


def main():
    results = []

    for i, (recipe_id, name) in enumerate(RECIPES, 1):
        print(f"\n{'=' * 60}")
        print(f"TEST {i}/10: {name}")
        print(f"{'=' * 60}")

        original = get_recipe(recipe_id)
        if not original:
            print("  ERROR: Recipe not found")
            results.append({"id": recipe_id, "name": name, "status": "not_found"})
            continue

        print(f"  Original title: {original.get('title', 'N/A')}")

        enhanced = enhance_recipe(original)
        if not enhanced:
            print("  ERROR: Enhancement failed")
            results.append({"id": recipe_id, "name": name, "status": "failed"})
            continue

        # Analyze results
        result = {
            "id": recipe_id,
            "name": name,
            "status": "success",
            "original_title": original.get("title"),
            "enhanced_title": enhanced.get("title"),
            "changes": enhanced.get("changes_made", []),
            "has_timeline": "⏱️" in enhanced.get("instructions", ""),
            "ingredient_count": len(enhanced.get("ingredients", [])),
            "has_fractions": any(c in str(enhanced.get("ingredients", [])) for c in "½⅓¼¾"),
            "has_decimals": any(f".{d}" in str(enhanced.get("ingredients", [])) for d in "0123456789"),
        }

        # Check ingredient order (kryddor last)
        ings = enhanced.get("ingredients", [])
        spice_words = ["salt", "peppar", "krydda", "vitlök", "timjan", "oregano", "paprika", "spiskummin"]
        last_5 = " ".join(ings[-5:]).lower() if len(ings) >= 5 else ""
        result["spices_at_end"] = any(sw in last_5 for sw in spice_words)

        print(f"  Enhanced title: {result['enhanced_title']}")
        print(f"  Changes: {len(result['changes'])}")
        print(f"  Timeline: {'Yes' if result['has_timeline'] else 'No'}")
        print(f"  Fractions (½): {'Yes' if result['has_fractions'] else 'No'}")
        print(
            f"  Decimals (0.5): {'Yes' if result['has_decimals'] else 'No'} {'(BAD!)' if result['has_decimals'] else ''}"
        )
        print(f"  Spices at end: {'Yes' if result['spices_at_end'] else 'No'}")

        results.append(result)

        # Save individual result
        output_file = f"data/batch_test_{recipe_id}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(enhanced, f, ensure_ascii=False, indent=2)

        # Rate limit pause
        if i < len(RECIPES):
            print("  Waiting 3s for rate limit...")
            time.sleep(3)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    success = [r for r in results if r.get("status") == "success"]
    print(f"\nSuccess: {len(success)}/{len(RECIPES)}")

    with_timeline = [r for r in success if r.get("has_timeline")]
    print(f"With timeline: {len(with_timeline)}/{len(success)}")

    with_fractions = [r for r in success if r.get("has_fractions")]
    print(f"Using ½ fractions: {len(with_fractions)}/{len(success)}")

    with_decimals = [r for r in success if r.get("has_decimals")]
    print(f"Using 0.5 decimals (BAD): {len(with_decimals)}/{len(success)}")

    spices_end = [r for r in success if r.get("spices_at_end")]
    print(f"Spices at end: {len(spices_end)}/{len(success)}")

    # Save summary
    with open("data/batch_test_summary.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("\nDetailed results saved to data/batch_test_*.json")


if __name__ == "__main__":
    main()
