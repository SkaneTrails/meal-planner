"""
Recipe Enhancer - Enhance recipes with Gemini AI and save to Firestore.

Usage:
    uv run python scripts/recipe_enhancer.py <recipe_id>           # Enhance and save
    uv run python scripts/recipe_enhancer.py <recipe_id> --dry-run # Preview only
    uv run python scripts/recipe_enhancer.py --list                # List all recipes
    uv run python scripts/recipe_enhancer.py --batch 10            # Batch process 10 recipes
    uv run python scripts/recipe_enhancer.py --batch               # Batch process all unenhanced

Options:
    --dry-run       Preview changes without saving
    --batch [N]     Process N unenhanced recipes (or all if N not specified)
    --include-enhanced  Include already-enhanced recipes in batch mode
    --delay SECONDS Delay between API calls in batch mode (default: 4.0 for free tier)

Setup:
1. Get free API key from https://aistudio.google.com/apikey
2. Add to .env file: GOOGLE_API_KEY=your-key-here
"""

import json
import os
import sys
import time
from pathlib import Path

# Load .env file
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

try:
    from google import genai
    from google.genai import types
except ImportError as exc:
    msg = "google-genai is not installed. Install it with: uv add google-genai"
    raise ImportError(msg) from exc

from google.cloud import firestore

# Default Gemini model for recipe enhancement
DEFAULT_MODEL = "gemini-2.5-flash"

# System prompt for recipe enhancement
SYSTEM_PROMPT = """Du är en expert på att förbättra recept för ett svenskt hushåll. Du optimerar för smak, timing och praktisk matlagning.

## Hushållet
- 2 personer: en äter kött, en är vegetarian
- Båda äter fisk och skaldjur (inga ändringar för fisk/skaldjursrecept)

## TILLGÄNGLIG UTRUSTNING

### Airfryer: Xiaomi Smart Air Fryer 4.5L
- **Kapacitet**: 2-3 kycklingbröst eller ~400g protein per omgång
- **För 4 portioner**: Planera för 2 omgångar (kyckling först, vila medan Quorn tillagas)

**Airfryer-tider (använd dessa istället för ugn för protein!):**
- Kycklingbröst: 180°C i 10-12 min, sedan 200°C i 2-3 min för krispigt
- Kycklinglår: 180°C i 15-18 min, vänd halvvägs
- Quorn filé/bitar: 180°C i 6-8 min (redan kokt, behöver bara värmas + yta)
- Oumph: 200°C i 8-10 min
- Lax/fisk: 180°C i 8-10 min

### Ugn: IKEA FRILLESÅS
- **Varmluft**: Sänk temp 20-25°C jämfört med recept (175°C istället för 200°C)
- Använd ugnen för: grönsaker, gratänger, bakningar - INTE för enskilda proteiner

### Spis
- Standard, inga begränsningar

### FINNS INTE (föreslå aldrig):
- Slow cooker, sous vide, instant pot, brödmaskin

## KRITISKA REGLER

### Proteinsubstitution
- **Kyckling** → 50% kyckling + 50% Quorn (filéer, strimlor, bitar - matcha formen!)
- **Annat kött (nöt, fläsk, lamm)** → 50% originalkött + 50% Oumph (The Chunk, Pulled, Kebab)
- **Färs (alla typer)** → 100% sojafärs för alla (ingen uppdelning)
- **Fisk/skaldjur** → Ingen ändring!

**Matcha proteinformen!**
- "Strimlad kycklingbröstfilé" → Quorn filéstrimlor (INTE Quornbitar eller sojafärs)
- "Kycklingbröst" → Quorn filé
- "Köttfärs" → Sojafärs

### Quorn/Oumph tillagning
- **Quorn är förtillagat** - behöver bara värmas och få yta (6-8 min i airfryer)
- **Lägg till Quorn/Oumph senare** i ugnsrätter - de torkar ut om de är med hela tiden
- **Separata omgångar** i airfryer pga kapacitet
- **Vila kyckling** medan vegetariskt tillagas (håller värmen i 5 min under folie)

### Sojafärs-justering
- Mindre fett → lägg till 1-2 msk olja vid stekning
- Steks snabbare → sänk värmen, överkok inte
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

## INSTRUKTIONSFORMAT

### För enkla recept
Skriv instruktioner som löpande text med tydliga steg.

### För komplexa recept (parallell tillagning, flera komponenter)
Använd TIDSLINJE-format för att koordinera:

```
⏱️ 0 min: [Förberedelse - vad som startas först]
⏱️ 5 min: [Nästa steg]
⏱️ 15 min: [Parallella aktiviteter]
...
⏱️ X min: Servera!
```

Använd tidslinje när:
- Ugn + airfryer används samtidigt
- Kyckling och Quorn tillagas separat
- Flera komponenter som måste koordineras
- Total tillagningstid > 20 min

## INGREDIENSFORMATERING

### Bråktal
- Använd ½, ⅓, ¼ - ALDRIG "0.5", "0.33", "0.25"
- Skriv "½ msk" inte "0.5 msk"

### Duplicering
- Duplicera INTE samma ingrediens flera gånger
- Om samma krydda/olja används för olika komponenter → summera till EN rad
- Exempel: "3 msk rapsolja" (inte "1 msk rapsolja" + "2 msk rapsolja")

### Ingrediensordning
Organisera ingredienser i denna ordning:
1. **Proteiner** (kyckling, Quorn, fisk, etc.)
2. **Grönsaker & rotfrukter**
3. **Kolhydrater** (pasta, ris, potatis, bröd)
4. **Mejeri** (yoghurt, grädde, ost)
5. **Oljor & fetter**
6. **Kryddor & smaksättare** (ALLTID SIST)

### Kryddor sist
Alla kryddor grupperas i slutet av ingredienslistan:
- Torkade kryddor
- Färska örter
- Salt, peppar
- Buljong

## FÖRBJUDET
- Skriv ALDRIG hygienvarningar ("Tvätta händer efter rå kyckling", "VIKTIGT: Hantera rå kött", etc.) - vi vet hur man hanterar mat
- Hitta INTE på hygienregler för Quorn (det är redan kokt/värmebehandlat)
- Föreslå INTE utrustning vi inte har (slow cooker, sous vide, instant pot)
- Ändra INTE kokosmjölk till "laktosfri kokosmjölk" (redan mjölkfri)
- Byt INTE proteinform (strimlor till bitar, färs till bitar, etc.)
- Skriv INTE "Quorn behöver tvättas" eller liknande (det är färdigberett)

## Output JSON
{
  "title": "Uppdaterad titel som reflekterar proteinändringen",
  "ingredients": ["ingrediens 1 med mängd och enhet", ...],
  "instructions": "Fullständiga instruktioner - använd tidslinje för komplexa recept",
  "tips": "Praktiska tips inkl. kryddsubstitut-referens och airfryer-fördelar",
  "metadata": {
    "cuisine": "Swedish/Italian/Indian/etc",
    "category": "Huvudrätt/Förrätt/Dessert/etc",
    "tags": ["relevanta", "taggar"]
  },
  "changes_made": ["Konkret lista på alla ändringar inklusive utrustningsoptimeringar"]
}
"""


def get_firestore_client() -> firestore.Client:
    """Get Firestore client for the default database."""
    return firestore.Client(database="(default)")


def get_unenhanced_recipes(limit: int | None = None, *, include_enhanced: bool = False) -> list[tuple[str, dict]]:
    """Get recipes that haven't been enhanced yet.

    Note: Firestore inequality queries exclude documents missing the field,
    so we use client-side filtering to include recipes without 'enhanced' field.
    """
    db = get_firestore_client()
    query = db.collection("recipes")

    if limit and include_enhanced:
        # When including all, we can use server-side limit
        query = query.limit(limit)

    recipes: list[tuple[str, dict]] = []
    for doc in query.stream():
        data = doc.to_dict()
        data["id"] = doc.id

        # Client-side filtering: include if enhanced=False or field missing
        if not include_enhanced and data.get("enhanced", False):
            continue

        recipes.append((doc.id, data))

        # Apply limit client-side when filtering
        if limit and not include_enhanced and len(recipes) >= limit:
            break

    return recipes


def list_recipes(limit: int = 20) -> None:
    """List recipes from Firestore."""
    db = get_firestore_client()
    recipes = db.collection("recipes").limit(limit).stream()

    print(f"\n📚 Recipes (first {limit}):")
    print("-" * 60)
    for doc in recipes:
        data = doc.to_dict()
        title = data.get("title", "Untitled")[:50]
        print(f"  {doc.id}: {title}")
    print("-" * 60)


def get_recipe(recipe_id: str) -> dict | None:
    """Fetch a single recipe by ID."""
    db = get_firestore_client()
    doc = db.collection("recipes").document(recipe_id).get()  # type: ignore[union-attr]

    if doc.exists:
        data = doc.to_dict()
        if data is not None:
            data["id"] = doc.id
            return data
    return None


def enhance_recipe(recipe: dict) -> dict | None:
    """Enhance recipe using Gemini AI."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not set in .env file")
        return None

    client = genai.Client(api_key=api_key)

    recipe_text = f"""
Förbättra detta recept enligt reglerna:

**Titel**: {recipe.get("title", "Okänd")}

**Ingredienser**:
{chr(10).join(f"- {ing}" for ing in recipe.get("ingredients", []))}

**Instruktioner**:
{recipe.get("instructions", "Inga instruktioner")}

**Tips** (om finns):
{recipe.get("tips", "Inga tips")}
"""

    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=recipe_text,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT, response_mime_type="application/json", temperature=0.3
            ),
        )
    except TimeoutError as e:
        print(f"❌ Gemini API request timed out: {e}")
        return None
    except Exception as e:
        status = getattr(e, "status", None)
        message = str(e)
        if status == 429 or "429" in message:
            print(
                "❌ Gemini API rate limit exceeded (HTTP 429). "
                "Consider reducing batch size or increasing the --delay between calls."
            )
        else:
            print(f"❌ Gemini API error while generating content: {e}")
        return None

    if not hasattr(response, "text") or response.text is None:
        print("❌ Gemini API returned an invalid response (missing text content).")
        return None

    try:
        return json.loads(response.text)
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse Gemini API JSON response: {e}")
        print(f"Raw response text: {getattr(response, 'text', '')!r}")
        return None


def save_recipe(recipe_id: str, enhanced: dict) -> bool:
    """Save enhanced recipe back to Firestore, replacing the original."""
    from datetime import UTC, datetime

    db = get_firestore_client()
    now = datetime.now(tz=UTC)

    # Get metadata from the enhanced recipe (may be nested or top-level)
    metadata = enhanced.get("metadata", {})

    # Prepare the document data - all fields at top level, no nesting
    doc_data = {
        "title": enhanced.get("title"),
        "ingredients": enhanced.get("ingredients", []),
        "instructions": enhanced.get("instructions", []),  # Must be list, not string
        "tips": enhanced.get("tips", ""),
        "cuisine": metadata.get("cuisine") or enhanced.get("cuisine", ""),
        "category": metadata.get("category") or enhanced.get("category", ""),
        "tags": metadata.get("tags") or enhanced.get("tags", []),
        "changes_made": enhanced.get("changes_made", []),
        # Required timestamps
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.collection("recipes").document(recipe_id).set(doc_data, merge=True)
        return True
    except Exception as e:
        print(f"❌ Firestore error: {e}")
        return False


def display_diff(original: dict, enhanced: dict) -> None:
    """Display changes between original and enhanced recipe."""
    print("\n" + "=" * 60)
    print("📋 ORIGINAL → ENHANCED")
    print("=" * 60)

    # Title
    print("\n📌 Title:")
    print(f"   Before: {original.get('title', 'N/A')}")
    print(f"   After:  {enhanced.get('title', 'N/A')}")

    # Ingredients comparison
    orig_ings = set(original.get("ingredients", []))
    new_ings = set(enhanced.get("ingredients", []))

    removed = orig_ings - new_ings
    added = new_ings - orig_ings

    if removed or added:
        print("\n🥗 Ingredients:")
        for ing in sorted(removed):
            print(f"   - {ing}")
        for ing in sorted(added):
            print(f"   + {ing}")

    # Changes made
    print("\n✏️  Changes Made:")
    for change in enhanced.get("changes_made", []):
        print(f"   • {change}")

    # Metadata
    meta = enhanced.get("metadata", {})
    print("\n🏷️  Metadata:")
    print(f"   Cuisine:  {meta.get('cuisine', 'N/A')}")
    print(f"   Category: {meta.get('category', 'N/A')}")
    print(f"   Tags:     {', '.join(meta.get('tags', []))}")

    print("\n" + "=" * 60)


def process_batch(limit: int | None, *, include_enhanced: bool, delay: float, dry_run: bool) -> None:
    """Process multiple recipes in batch mode."""
    print("\n🔄 Batch Processing Mode")
    print("-" * 60)

    # Get recipes to process
    recipes = get_unenhanced_recipes(limit, include_enhanced=include_enhanced)

    if not recipes:
        print("✅ No recipes to process!")
        return

    total = len(recipes)
    print(f"📚 Found {total} recipes to process")
    if delay > 0:
        print(f"⏱️  Delay between requests: {delay}s")
    if dry_run:
        print("🔍 DRY RUN - No changes will be saved")
    print("-" * 60)

    # Stats
    success = 0
    failed = 0
    skipped = 0

    for i, (recipe_id, recipe) in enumerate(recipes):
        progress = f"[{i + 1}/{total}]"
        title = recipe.get("title", "Unknown")[:40]

        print(f"\n{progress} {title}")
        print(f"         ID: {recipe_id}")

        # Enhance
        try:
            enhanced = enhance_recipe(recipe)

            if not enhanced:
                print("         ❌ Enhancement failed")
                failed += 1
                continue

            # Show brief changes
            changes = enhanced.get("changes_made", [])
            if changes:
                print(f"         ✏️  {len(changes)} changes")

            if dry_run:
                print("         🔍 Would save (dry-run)")
                success += 1
            elif save_recipe(recipe_id, enhanced):
                print("         ✅ Saved")
                success += 1
            else:
                print("         ❌ Save failed")
                failed += 1

        except Exception as e:
            print(f"         ❌ Error: {e}")
            failed += 1

        # Rate limiting
        if i < total - 1 and delay > 0:
            time.sleep(delay)

    # Summary
    print("\n" + "=" * 60)
    print("📊 BATCH SUMMARY")
    print("=" * 60)
    print(f"   ✅ Success: {success}")
    print(f"   ❌ Failed:  {failed}")
    print(f"   ⏭️  Skipped: {skipped}")
    print(f"   📚 Total:   {total}")
    if dry_run:
        print("\n   🔍 This was a DRY RUN - no changes were saved")
    print("=" * 60)


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        return

    arg = sys.argv[1]
    dry_run = "--dry-run" in sys.argv
    include_enhanced = "--include-enhanced" in sys.argv

    # Parse delay (default 4.0s for free tier: 15 req/min)
    delay = 4.0
    if "--delay" in sys.argv:
        delay_idx = sys.argv.index("--delay")
        if delay_idx + 1 < len(sys.argv):
            try:
                delay = float(sys.argv[delay_idx + 1])
            except ValueError:
                invalid_value = sys.argv[delay_idx + 1]
                print(f"⚠️  Invalid value for --delay: {invalid_value!r}. Using default delay of {delay} seconds.")

    # List command
    if arg == "--list":
        limit = 50
        if len(sys.argv) > 2 and sys.argv[2].isdigit():
            limit = int(sys.argv[2])
        list_recipes(limit)
        return

    # Batch command
    if arg == "--batch":
        limit = None
        # Check for optional limit
        for a in sys.argv[2:]:
            if a.isdigit():
                limit = int(a)
                break
        process_batch(limit, include_enhanced=include_enhanced, delay=delay, dry_run=dry_run)
        return

    # Get recipe by ID
    recipe_id = arg
    print(f"\n📖 Loading recipe: {recipe_id}")

    original = get_recipe(recipe_id)
    if not original:
        print(f"❌ Recipe not found: {recipe_id}")
        return

    print(f"   Title: {original.get('title', 'Unknown')}")

    # Check if already enhanced
    if original.get("enhanced"):
        print("⚠️  This recipe has already been enhanced.")
        response = input("   Continue anyway? [y/N]: ")
        if response.lower() != "y":
            return

    # Enhance with Gemini
    print("\n🤖 Enhancing with Gemini 2.5 Flash...")
    enhanced = enhance_recipe(original)

    if not enhanced:
        return

    # Display diff
    display_diff(original, enhanced)

    if dry_run:
        print("\n🔍 DRY RUN - No changes saved")
        # Save to file for inspection
        output_file = Path(f"data/enhanced_{recipe_id}.json")
        with output_file.open("w", encoding="utf-8") as f:
            json.dump(enhanced, f, ensure_ascii=False, indent=2)
        print(f"   Preview saved to: {output_file}")
        return

    # Confirm save
    response = input("\n💾 Save changes to Firestore? [y/N]: ")
    if response.lower() != "y":
        print("   Cancelled.")
        return

    # Save
    if save_recipe(recipe_id, enhanced):
        print(f"✅ Recipe saved: {recipe_id}")
    else:
        print("❌ Failed to save recipe")


if __name__ == "__main__":
    main()
