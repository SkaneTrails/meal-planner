#!/usr/bin/env python3
"""
Quick test script to compare Gemini Flash recipe improvements with manual review.

Setup:
1. Get free API key from https://aistudio.google.com/apikey
2. Copy .env.example to .env and add your key
3. Run: uv run python scripts/test_gemini.py

Free tier limits: 15 requests/minute, 1500 requests/day
"""

import json
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env file
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ google-genai not installed")
    print("   Run: uv add google-genai")
    sys.exit(1)

from google.cloud import firestore


# System prompt based on skill files
SYSTEM_PROMPT = """Du är en expert på att förbättra recept för ett svenskt hushåll.

## Hushållet
- 2 personer: en äter kött, en är vegetarian
- Båda äter fisk och skaldjur (inga ändringar för fisk/skaldjursrecept)

## KRITISKA REGLER

### Proteinsubstitution
- **Kyckling** → 50% kyckling + 50% Quorn (filéer, strimlor, bitar - matcha formen!)
- **Annat kött (nöt, fläsk, lamm)** → 50% originalkött + 50% Oumph (The Chunk, Pulled, Kebab)
- **Färs (alla typer)** → 100% sojafärs för alla (ingen uppdelning)
- **Fisk/skaldjur** → Ingen ändring!

VIKTIGT: Matcha proteinformen! 
- "Strimlad kycklingbröstfilé" → Quorn filéstrimlor (INTE Quornbitar eller sojafärs)
- "Kycklingbröst" → Quorn filé
- "Köttfärs" → Sojafärs

### Sojafärs-justering (endast för färsrecept)
- Mindre fett → lägg till 1-2 msk olja vid stekning
- Steks snabbare → sänk värmen
- Lägg till lite soja eller buljong för umami

### Mejeri
Använd laktosfria alternativ för: mjölk, grädde, crème fraîche, färskost, kesella

**UNDANTAG - ändra INTE till laktosfri:**
- Smör (mycket låg laktoshalt)
- Parmesan, Grana Padano, lagrad ost (naturligt låg laktoshalt)
- Ricotta, mozzarella
- Kokosmjölk, kokosgrädde (redan mjölkfria!)

### Fett
- **Smör → margarin** ENDAST när smörsmak inte spelar roll (vanlig stekning)
- **Behåll smör** för: brynt smör, smörsåser, örtsmör, bakning, finishing
- **Olivolja → matolja/rapsolja** ENDAST för stekning där olivsmak inte spelar roll
- **Behåll olivolja** för: dressingar, finishing, medelhavsrätter

### Vaga ingredienser - konkretisera alltid
- "Citrusfrukt" → "Citron" (eller "Lime" om asiatiskt recept)
- "Bladpersilja" → "Persilja"
- "1 st Mynta & koriander" → "1 kruka Mynta" + "1 kruka Koriander" (separata ingredienser)

### HelloFresh-kryddor
Ersätt ALLTID HelloFresh-blandningar med individuella kryddor som separata ingredienser.

Svenska mått:
- **krm** (~1 ml) för små mängder - ALDRIG "1/4 tsk" eller "¼ tsk"
- **tsk** (5 ml) för mellanstora mängder
- **msk** (15 ml) för större mängder

Exempel - 4 g Milda Mahal blir:
- 1 tsk Garam masala
- ½ tsk Spiskummin
- ½ tsk Koriander (malen)
- 1 krm Gurkmeja

Nämn i tips: "Blanda kryddorna (ersätter HelloFresh Milda Mahal)"

## FÖRBJUDET
- Hitta INTE på hygienregler (Quorn är redan kokt/värmebehandlat)
- Föreslå INTE utrustning vi inte har (slow cooker, sous vide, instant pot)
- Ändra INTE kokosmjölk till "laktosfri kokosmjölk" (redan mjölkfri)
- Byt INTE proteinform (strimlor till bitar, färs till bitar, etc.)

## Output JSON
{
  "title": "Uppdaterad titel som reflekterar proteinändringen",
  "ingredients": ["ingrediens 1 med mängd och enhet", ...],
  "instructions": "Fullständiga instruktioner med parallella tillagningsanvisningar för kött och vegetariskt",
  "tips": "Praktiska tips inkl. kryddsubstitut-referens",
  "metadata": {
    "cuisine": "Swedish/Italian/Indian/etc",
    "category": "Huvudrätt/Förrätt/Dessert/etc", 
    "tags": ["relevanta", "taggar"]
  },
  "changes_made": ["Konkret lista på alla ändringar"]
}
"""


def get_recipe_from_firestore(index: int = 0) -> dict | None:
    """Fetch a recipe from the default Firestore database."""
    db = firestore.Client(database="(default)")
    recipes_ref = db.collection("recipes")
    docs = list(recipes_ref.limit(index + 1).stream())

    if index < len(docs):
        doc = docs[index]
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def enhance_recipe_with_gemini(recipe: dict) -> dict | None:
    """Send recipe to Gemini Flash for enhancement."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY environment variable not set")
        print("   Get a free key from: https://aistudio.google.com/apikey")
        print("   Then run: $env:GOOGLE_API_KEY = 'your-key-here'")
        return None

    client = genai.Client(api_key=api_key)

    # Format recipe for prompt
    recipe_text = f"""
Förbättra detta recept enligt reglerna:

**Titel**: {recipe.get('title', 'Okänd')}

**Ingredienser**:
{chr(10).join(f"- {ing}" for ing in recipe.get('ingredients', []))}

**Instruktioner**:
{recipe.get('instructions', 'Inga instruktioner')}

**Tips** (om finns):
{recipe.get('tips', 'Inga tips')}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",  # Best free model with high limits
            contents=recipe_text,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"❌ Gemini API error: {e}")
        return None


def main():
    print("=" * 60)
    print("🧪 Gemini Flash Recipe Enhancement Test")
    print("=" * 60)

    # Get recipe index from command line or use default
    index = int(sys.argv[1]) if len(sys.argv) > 1 else 4  # Start at #4 like our manual review

    print(f"\n📖 Fetching recipe #{index} from Firestore...")
    recipe = get_recipe_from_firestore(index)

    if not recipe:
        print(f"❌ Could not fetch recipe #{index}")
        return

    print(f"\n📋 Original Recipe: {recipe.get('title', 'Unknown')}")
    print("-" * 40)
    print("Ingredients:")
    for ing in recipe.get("ingredients", [])[:10]:
        print(f"  • {ing}")
    if len(recipe.get("ingredients", [])) > 10:
        print(f"  ... and {len(recipe.get('ingredients', [])) - 10} more")

    print("\n🤖 Sending to Gemini Flash...")
    enhanced = enhance_recipe_with_gemini(recipe)

    if not enhanced:
        return

    print("\n✨ Enhanced Recipe:")
    print("-" * 40)
    print(f"Title: {enhanced.get('title', 'Unknown')}")
    print("\nIngredients:")
    for ing in enhanced.get("ingredients", [])[:15]:
        print(f"  • {ing}")
    if len(enhanced.get("ingredients", [])) > 15:
        print(f"  ... and {len(enhanced.get('ingredients', [])) - 15} more")

    print("\nChanges Made:")
    for change in enhanced.get("changes_made", []):
        print(f"  ✓ {change}")

    print("\nMetadata:")
    meta = enhanced.get("metadata", {})
    print(f"  Cuisine: {meta.get('cuisine', 'N/A')}")
    print(f"  Category: {meta.get('category', 'N/A')}")
    print(f"  Tags: {', '.join(meta.get('tags', []))}")

    # Save full output for comparison
    output_file = f"data/gemini_test_recipe_{index}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(enhanced, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Full output saved to: {output_file}")

    print("\n" + "=" * 60)
    print("Compare this with manual review to evaluate quality!")
    print("=" * 60)


if __name__ == "__main__":
    main()
