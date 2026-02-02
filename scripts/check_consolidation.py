"""Check enhanced recipes for incorrectly consolidated phase-specific ingredients."""

from google.cloud import firestore


def main() -> None:
    db = firestore.Client(database="meal-planner")

    print("=== CHECKING ENHANCED RECIPES FOR PHASE-SPECIFIC INGREDIENTS ===")
    print()

    found_issues = False

    for doc in db.collection("recipes").stream():
        data = doc.to_dict()
        if not data.get("improved"):
            continue

        ingredients = data.get("ingredients", [])
        title = data.get("title", "?")[:55]

        # Count specific ingredients
        salt_items = [i for i in ingredients if "salt" in i.lower()]
        oil_items = [i for i in ingredients if "olja" in i.lower()]
        butter_items = [i for i in ingredients if "smör" in i.lower()]

        # Check if instructions mention multiple uses
        instructions = " ".join(str(i) for i in data.get("instructions", []))
        instr_lower = instructions.lower()

        issues = []

        # Check salt - if only 1 entry but instructions mention salt multiple times
        salt_mentions = instr_lower.count("salt")
        if len(salt_items) == 1 and salt_mentions > 2:
            issues.append(f"Salt: {salt_items} but {salt_mentions} mentions in instructions")

        # Check oil - if only 1 entry but used for frying AND dressing
        frying_words = ["stek" in instr_lower, "fräs" in instr_lower, "bryn" in instr_lower]
        if len(oil_items) == 1 and any(frying_words) and "sallad" in instr_lower:
            issues.append(f"Oil: {oil_items} - possibly used for frying AND salad?")

        # Check butter - if only 1 entry but used for searing AND finishing
        butter_mentions = instr_lower.count("smör")
        if len(butter_items) == 1 and butter_items and butter_mentions > 1:
            issues.append(f"Butter: {butter_items} but {butter_mentions} mentions")

        if issues:
            found_issues = True
            print(f"{doc.id}")
            print(f"  {title}")
            for issue in issues:
                print(f"  ⚠️  {issue}")
            print()

    if not found_issues:
        print("✅ No consolidation issues found!")


if __name__ == "__main__":
    main()
