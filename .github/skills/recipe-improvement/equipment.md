# Kitchen Equipment

## How Equipment Works

Equipment is now **dynamic** — each household selects their available equipment from a standard catalog, and the selection is injected into the Gemini enhancement prompt at runtime.

### Architecture

1. **Catalog**: `api/models/equipment.py` defines `EQUIPMENT_CATALOG` — a dict of equipment keys, each with a `category` and a `prompt_hint` (one-liner for Gemini)
2. **Storage**: Firestore `households/{id}/settings.equipment` stores a `list[str]` of selected keys (e.g., `["air_fryer", "convection_oven", "wok"]`)
3. **Prompt generation**: `get_equipment_prompt(keys)` builds a markdown section listing the selected equipment hints. If no equipment is selected, it tells Gemini "standard kitchen only — do not suggest specialty equipment"
4. **Pipeline**: `enhance_recipe()` → `load_system_prompt(language, equipment=keys)` → Gemini receives the equipment context

### Adding New Equipment

1. Add a key to `EQUIPMENT_CATALOG` in `api/models/equipment.py` with `category` and `prompt_hint`
2. Add i18n translations in `mobile/lib/i18n/locales/{en,sv,it}.ts` under `equipment.items.<key>`
3. Add the key to `EQUIPMENT_CATEGORIES` in `mobile/app/household-settings.tsx` under the correct category
4. That's it — validation, prompt generation, and UI rendering are all derived from the catalog

### Current Catalog (15 items)

| Category | Keys |
|----------|------|
| Appliances | `air_fryer`, `stand_mixer`, `food_processor`, `immersion_blender`, `pressure_cooker`, `slow_cooker`, `sous_vide` |
| Oven features | `convection_oven`, `grill_function`, `steam_oven` |
| Cookware | `dutch_oven`, `cast_iron_skillet`, `wok` |
| Tools | `probe_thermometer`, `kitchen_torch` |

### Design Decisions

- **No backward compat**: Old boolean `{ airfryer: true, ... }` format is silently converted to `[]` on read
- **No equipment API endpoint**: Catalog is a fixed dict, labels come from i18n
- **Prompt hints are English-only**: Gemini input language doesn't need translation
- **Categories are for UI grouping only**: Not stored in Firestore
