"""Meal Planner - Recipe collector and weekly meal planner inspired by Samsung Food."""

import re
import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import streamlit as st

from app.icons import inject_bootstrap_icons_css, svg_icon
from app.models.grocery_list import GroceryItem, GroceryList, QuantitySource
from app.models.meal_plan import MealType
from app.models.recipe import DietLabel, MealLabel, Recipe
from app.services.ingredient_parser import parse_ingredient
from app.storage.meal_plan_storage import delete_meal, load_day_notes, load_meal_plan, update_day_note, update_meal

# Default placeholder image for recipes without images (food icon from Unsplash)
DEFAULT_RECIPE_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop&auto=format"

# Pantry staples - items likely already at home (English, Swedish, Italian variants)
PANTRY_STAPLES = {
    "sugar",
    "socker",
    "zucchero",
    "olive oil",
    "olivolja",
    "olio d'oliva",
    "olio di oliva",
    "olio",
    "oil",
    "olja",
    "vegetable oil",
    "rapsolja",
    "canola oil",
    "sunflower oil",
    "solrosolja",
    "mayonnaise",
    "mayo",
    "majonnäs",
    "maionese",
    "sesame seeds",
    "sesamfrön",
    "sesamfrö",
    "semi di sesamo",
    "sesame",
    "egg",
    "eggs",
    "ägg",
    "uovo",
    "uova",
    "salt",
    "sale",
    "pepper",
    "black pepper",
    "peppar",
    "svartpeppar",
    "pepe",
    "pepe nero",
    "water",
    "vatten",
    "acqua",
    "butter",
    "smör",
    "burro",
    "stock",
    "broth",
    "bouillon",
    "buljong",
    "chicken stock",
    "beef stock",
    "vegetable stock",
    "kycklingbuljong",
    "grönsaksbuljong",
    "brodo",
    "brodo di pollo",
    "brodo vegetale",
    "flour",
    "mjöl",
    "vetemjöl",
    "farina",
    "milk",
    "mjölk",
    "latte",
    "margarine",
    "margarin",
    "balsamic vinegar",
    "balsamvinäger",
    "aceto balsamico",
    "vinegar",
    "vinäger",
    "ättika",
    "aceto",
    "ketchup",
    "tomato ketchup",
    "chili",
    "chilli",
    "chili flakes",
    "chiliflingor",
    "peperoncino",
    "chili powder",
    "garlic",
    "garlic clove",
    "garlic cloves",
    "vitlök",
    "vitlöksklyfta",
    "aglio",
    "spicchio d'aglio",
    "soy sauce",
    "sojasås",
    "salsa di soia",
    "honey",
    "honung",
    "miele",
    "mustard",
    "senap",
    "senape",
    "worcestershire sauce",
    "worcestersås",
    "rice",
    "ris",
    "riso",
    "pasta",
    "spaghetti",
    "penne",
    "fusilli",
    "onion",
    "onions",
    "lök",
    "gul lök",
    "rödlök",
    "cipolla",
    "white wine",
    "red wine",
    "vitt vin",
    "rött vin",
    "vino bianco",
    "vino rosso",
}


def is_pantry_staple(item_name: str) -> bool:
    """Check if an item is a pantry staple (likely already at home)."""
    name_lower = item_name.lower().strip()
    if name_lower in PANTRY_STAPLES:
        return True
    return any(re.search(rf"\b{re.escape(staple)}\b", name_lower) for staple in PANTRY_STAPLES)


def _count_recent_recipe_usage(meal_plan: dict[tuple[str, str], str], days: int) -> dict[str, int]:
    """Count recipe usage for past meals within the last N days (future meals don't count)."""
    from datetime import UTC, datetime, timedelta

    usage_count: dict[str, int] = {}
    today = datetime.now(tz=UTC).date()
    cutoff_date = today - timedelta(days=days)

    for (date_str, _meal_type), rid in meal_plan.items():
        if rid and not rid.startswith("custom:"):
            try:
                year, month, day = map(int, date_str.split("-"))
                from datetime import date

                meal_date = date(year, month, day)
                # Only count past meals (already eaten), not future planned ones
                if cutoff_date <= meal_date < today:
                    usage_count[rid] = usage_count.get(rid, 0) + 1
            except (ValueError, TypeError):
                continue
    return usage_count


def _render_recipe_edit_form(recipe_id: str, recipe: "Recipe") -> None:
    """Render a form for editing an existing recipe."""
    from app.models.recipe import DietLabel, MealLabel, Recipe
    from app.storage.recipe_storage import update_recipe

    with st.form(key=f"edit_recipe_form_{recipe_id}"):
        col1, col2 = st.columns([1, 2])

        with col1:
            st.markdown("### Recipe Info")
            title = st.text_input("Title", value=recipe.title)
            image_url = st.text_input("Image URL", value=recipe.image_url or "")
            url = st.text_input("Source URL", value=recipe.url or "")

            st.markdown("### Timing")
            servings = st.number_input("Servings", min_value=1, value=recipe.servings or 4)
            prep_time = st.number_input("Prep Time (min)", min_value=0, value=recipe.prep_time or 0)
            cook_time = st.number_input("Cook Time (min)", min_value=0, value=recipe.cook_time or 0)

            st.markdown("### Labels")
            diet_options = ["None", "Veggie", "Fish", "Meat"]
            current_diet = recipe.diet_label.value.title() if recipe.diet_label else "None"
            diet_idx = diet_options.index(current_diet) if current_diet in diet_options else 0
            diet = st.selectbox("Diet Type", diet_options, index=diet_idx)

            meal_options = ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink", "Sauce", "Pickle", "Grill"]
            current_meal = recipe.meal_label.value.title() if recipe.meal_label else "None"
            meal_idx = meal_options.index(current_meal) if current_meal in meal_options else 0
            meal = st.selectbox("Meal Type", meal_options, index=meal_idx)

        with col2:
            st.markdown("### :material/grocery: Ingredients")
            st.caption("One ingredient per line")
            ingredients_text = st.text_area(
                "Ingredients", value="\n".join(recipe.ingredients), height=200, label_visibility="collapsed"
            )

            st.markdown("### :material/format_list_numbered: Instructions")
            st.caption("One step per line")
            instructions_text = st.text_area(
                "Instructions", value="\n".join(recipe.instructions), height=250, label_visibility="collapsed"
            )

        submitted = st.form_submit_button(":material/save: Save Changes", width="stretch", type="primary")

        if submitted:
            if not title.strip():
                st.error("Title is required")
            else:
                ingredients = [ing.strip() for ing in ingredients_text.split("\n") if ing.strip()]
                instructions = [step.strip() for step in instructions_text.split("\n") if step.strip()]

                diet_label = None
                if diet != "None":
                    diet_label = DietLabel(diet.lower())

                meal_label = None
                if meal != "None":
                    meal_label = MealLabel(meal.lower())

                updated_recipe = Recipe(
                    title=title.strip(),
                    url=url.strip() or recipe.url,
                    ingredients=ingredients,
                    instructions=instructions,
                    image_url=image_url.strip() or None,
                    servings=servings if servings > 0 else None,
                    prep_time=prep_time if prep_time > 0 else None,
                    cook_time=cook_time if cook_time > 0 else None,
                    diet_label=diet_label,
                    meal_label=meal_label,
                )

                update_recipe(recipe_id, updated_recipe)
                st.session_state[f"edit_mode_{recipe_id}"] = False
                st.session_state.selected_recipe = (recipe_id, updated_recipe)
                st.success("Recipe updated!")
                st.rerun()


st.set_page_config(page_title="Plate & Plan", page_icon="🍽️", layout="wide", initial_sidebar_state="expanded")


# =============================================================================
# CONFIRMATION DIALOGS
# =============================================================================
@st.dialog("Delete Recipe")
def confirm_delete_recipe(recipe_id: str, recipe_title: str) -> None:
    """Show confirmation dialog for recipe deletion."""
    from app.storage.recipe_storage import delete_recipe

    st.warning(f"Are you sure you want to delete **{recipe_title}**?")
    st.caption("This action cannot be undone.")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Cancel", width="stretch"):
            st.rerun()
    with col2:
        if st.button("Delete", width="stretch", type="primary"):
            with st.spinner("Deleting..."):
                try:
                    delete_recipe(recipe_id)
                    st.session_state.selected_recipe = None
                    st.rerun()
                except Exception as e:
                    st.error(str(e))


@st.dialog("Clear Week")
def confirm_clear_week(week_dates: list, meal_types: list) -> None:
    """Show confirmation dialog for clearing all meals in a week."""
    st.warning("Are you sure you want to clear all meals for this week?")
    st.caption("This will remove all planned meals from the week.")

    col1, col2 = st.columns(2)
    with col1:
        if st.button("Cancel", width="stretch"):
            st.rerun()
    with col2:
        if st.button("Clear All", width="stretch", type="primary"):
            with st.spinner("Clearing meals..."):
                for d in week_dates:
                    for mt in meal_types:
                        key = (d.isoformat(), mt.value)
                        if key in st.session_state.meal_plan:
                            del st.session_state.meal_plan[key]
                            delete_meal(d.isoformat(), mt.value)
                st.rerun()


# Inject Bootstrap Icons CSS for custom icons
st.markdown(inject_bootstrap_icons_css(), unsafe_allow_html=True)

# Custom CSS styling - green theme
st.markdown(
    """
    <style>
    /* Sidebar buttons - darker green to stand out on grey */
    section[data-testid="stSidebar"] button[kind="secondary"] {
        background-color: #c8e6c9 !important;
        border: none !important;
        color: #1b5e20 !important;
    }
    section[data-testid="stSidebar"] button[kind="secondary"]:hover {
        background-color: #a5d6a7 !important;
    }
    section[data-testid="stSidebar"] button[kind="primary"] {
        background-color: #2e7d32 !important;
    }

    /* Secondary buttons (white → light green, no border) */
    button[kind="secondary"] {
        background-color: #e8f5e9 !important;
        border: none !important;
        color: #2e7d32 !important;
    }
    button[kind="secondary"]:hover {
        background-color: #c8e6c9 !important;
        border: none !important;
    }
    button[kind="secondary"] p, button[kind="secondary"] span {
        color: #2e7d32 !important;
    }

    /* Primary buttons (red → dark green with white text) */
    button[kind="primary"],
    button[kind="primaryFormSubmit"] {
        background-color: #2e7d32 !important;
        border: none !important;
        color: white !important;
    }
    button[kind="primary"]:hover,
    button[kind="primaryFormSubmit"]:hover {
        background-color: #1b5e20 !important;
        border: none !important;
    }
    button[kind="primary"] p, button[kind="primary"] span,
    button[kind="primaryFormSubmit"] p, button[kind="primaryFormSubmit"] span {
        color: white !important;
    }

    /* Tabs (All Recipes, Add Recipe) → dark green, no background */
    button[data-baseweb="tab"] {
        color: #2e7d32 !important;
        background-color: transparent !important;
    }
    button[data-baseweb="tab"][aria-selected="true"] {
        color: #2e7d32 !important;
        background-color: transparent !important;
    }
    button[data-baseweb="tab"]:hover {
        background-color: transparent !important;
    }
    div[data-baseweb="tab-highlight"] {
        background-color: #2e7d32 !important;
    }
    div[data-baseweb="tab-border"] {
        background-color: #c8e6c9 !important;
    }

    /* All icons → dark green */
    [data-testid="stIconMaterial"] {
        color: #2e7d32 !important;
    }
    /* SVG icons in markdown → dark green */
    [data-testid="stMarkdownContainer"] svg {
        fill: #2e7d32 !important;
    }
    /* Override for icons inside primary buttons → white */
    button[kind="primary"] [data-testid="stIconMaterial"],
    button[kind="primaryFormSubmit"] [data-testid="stIconMaterial"] {
        color: white !important;
    }

    /* Increase small text sizes */
    /* Captions and small labels */
    [data-testid="stCaptionContainer"],
    .stCaption,
    small {
        font-size: 0.95rem !important;
    }
    /* Selectbox labels and options */
    [data-testid="stSelectbox"] label,
    [data-testid="stMultiSelect"] label,
    [data-baseweb="select"] span {
        font-size: 0.95rem !important;
    }
    /* Expander headers */
    [data-testid="stExpander"] summary span {
        font-size: 1rem !important;
    }
    /* Markdown small text and badges */
    [data-testid="stMarkdownContainer"] p,
    [data-testid="stMarkdownContainer"] span {
        font-size: 0.95rem !important;
    }
    /* Tab labels */
    button[data-baseweb="tab"] p {
        font-size: 1rem !important;
    }
    /* Column metric labels */
    [data-testid="stMetricLabel"] {
        font-size: 0.95rem !important;
    }
    /* Sidebar text */
    section[data-testid="stSidebar"] p,
    section[data-testid="stSidebar"] span,
    section[data-testid="stSidebar"] label {
        font-size: 0.95rem !important;
    }

    /* Recipe/dish titles - bold text in cards */
    [data-testid="stMarkdownContainer"] strong,
    [data-testid="stMarkdownContainer"] b {
        font-size: 1.15rem !important;
        font-weight: 600 !important;
    }
    /* H2 titles (recipe detail view) */
    [data-testid="stMarkdownContainer"] h2 {
        font-size: 1.75rem !important;
    }
    /* H3 titles (preview, week header) */
    [data-testid="stMarkdownContainer"] h3 {
        font-size: 1.4rem !important;
    }

    /* ============================================= */
    /* RESPONSIVE STYLES - Mobile First Approach    */
    /* ============================================= */

    /* MOBILE PHONES (up to 768px) */
    @media (max-width: 768px) {
        /* Larger touch targets for buttons */
        button {
            min-height: 44px !important;
            padding: 10px 16px !important;
        }

        /* Larger text for readability */
        [data-testid="stMarkdownContainer"] p,
        [data-testid="stMarkdownContainer"] span {
            font-size: 1rem !important;
        }

        /* Recipe titles bigger on mobile */
        [data-testid="stMarkdownContainer"] strong,
        [data-testid="stMarkdownContainer"] b {
            font-size: 1.1rem !important;
        }

        /* Headers */
        [data-testid="stMarkdownContainer"] h1 {
            font-size: 1.5rem !important;
        }
        [data-testid="stMarkdownContainer"] h2 {
            font-size: 1.3rem !important;
        }
        [data-testid="stMarkdownContainer"] h3 {
            font-size: 1.15rem !important;
        }

        /* Form inputs taller */
        input, textarea, select {
            min-height: 44px !important;
            font-size: 16px !important; /* Prevents iOS zoom */
        }

        /* Sidebar text adjustments */
        section[data-testid="stSidebar"] p,
        section[data-testid="stSidebar"] span,
        section[data-testid="stSidebar"] label {
            font-size: 1rem !important;
        }

        /* Tab buttons */
        button[data-baseweb="tab"] {
            padding: 12px 8px !important;
        }
        button[data-baseweb="tab"] p {
            font-size: 0.9rem !important;
        }

        /* Card containers - more padding */
        [data-testid="stVerticalBlock"] > div[data-testid="element-container"] {
            padding: 4px !important;
        }

        /* Images in cards */
        [data-testid="stImage"] {
            border-radius: 8px !important;
        }
    }

    /* TABLETS (769px to 1024px) */
    @media (min-width: 769px) and (max-width: 1024px) {
        [data-testid="stMarkdownContainer"] p,
        [data-testid="stMarkdownContainer"] span {
            font-size: 0.95rem !important;
        }

        [data-testid="stMarkdownContainer"] h2 {
            font-size: 1.5rem !important;
        }
        [data-testid="stMarkdownContainer"] h3 {
            font-size: 1.25rem !important;
        }

        button {
            min-height: 40px !important;
        }
    }

    /* LARGE DESKTOPS (1400px+) */
    @media (min-width: 1400px) {
        [data-testid="stMarkdownContainer"] p,
        [data-testid="stMarkdownContainer"] span {
            font-size: 1rem !important;
        }

        [data-testid="stMarkdownContainer"] strong,
        [data-testid="stMarkdownContainer"] b {
            font-size: 1.2rem !important;
        }

        [data-testid="stMarkdownContainer"] h2 {
            font-size: 2rem !important;
        }
        [data-testid="stMarkdownContainer"] h3 {
            font-size: 1.5rem !important;
        }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# Initialize session state
if "meal_plan" not in st.session_state:
    st.session_state.meal_plan = load_meal_plan()  # Load from Firestore
if "meal_portions" not in st.session_state:
    st.session_state.meal_portions = {}  # {(date_str, meal_type): portions}
if "grocery_list" not in st.session_state:
    st.session_state.grocery_list = GroceryList()
if "selected_recipe" not in st.session_state:
    st.session_state.selected_recipe = None
if "week_offset" not in st.session_state:
    st.session_state.week_offset = 0
if "current_page" not in st.session_state:
    st.session_state.current_page = "Home"
if "day_notes" not in st.session_state:
    st.session_state.day_notes = load_day_notes()  # Load from Firestore
if "meal_selector" not in st.session_state:
    st.session_state.meal_selector = None  # (date_str, meal_type) when selecting a meal
if "custom_meal_input" not in st.session_state:
    st.session_state.custom_meal_input = None  # (date_str, meal_type) when entering custom text
if "scroll_to_top" not in st.session_state:
    st.session_state.scroll_to_top = False


def scroll_to_top() -> None:
    """Mark that the page should scroll to top on next render.

    Call this before st.rerun() when navigating to ensure the page starts at top.
    """
    st.session_state.scroll_to_top = True


def _render_scroll_script() -> None:
    """Render the scroll-to-top script if requested."""
    if st.session_state.scroll_to_top:
        import streamlit.components.v1 as components

        components.html(
            """<script>
            window.parent.document.querySelector('section.main').scrollTo(0, 0);
            </script>""",
            height=0,
        )
        st.session_state.scroll_to_top = False


def get_week_dates(offset: int = 0) -> list[date]:
    """Get dates for the current week (Saturday to Friday)."""
    today = datetime.now(tz=UTC).date() + timedelta(weeks=offset)
    # Saturday is weekday 5, so we need to find the most recent Saturday
    days_since_saturday = (today.weekday() + 2) % 7
    saturday = today - timedelta(days=days_since_saturday)
    return [saturday + timedelta(days=i) for i in range(7)]


def load_recipes() -> list[tuple[str, Recipe]]:
    """Load all recipes from Firestore."""
    try:
        from app.storage.recipe_storage import get_all_recipes

        return get_all_recipes()
    except Exception:
        return []


# Logo paths
logo1_path = Path(__file__).parent / "assets" / "images" / "logo1.png"
logo_path = Path(__file__).parent / "assets" / "images" / "logo.png"

# Display logo1 in top-left corner of main content area
if logo1_path.exists():
    import base64

    with logo1_path.open("rb") as f:
        logo1_b64 = base64.b64encode(f.read()).decode()
    st.markdown(
        f"""
        <style>
        .main-logo {{
            position: fixed;
            top: 60px;
            left: 20px;
            z-index: 999;
            width: 70px;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }}
        /* Adjust position when sidebar is expanded */
        [data-testid="stSidebar"][aria-expanded="true"] ~ section .main-logo {{
            left: calc(21rem + 20px);
        }}

        /* Mobile styles (phone) */
        @media (max-width: 768px) {{
            .main-logo {{
                width: 50px;
                top: 50px;
                left: 10px;
            }}
        }}

        /* Tablet styles */
        @media (min-width: 769px) and (max-width: 1024px) {{
            .main-logo {{
                width: 60px;
            }}
        }}
        </style>
        <img src="data:image/png;base64,{logo1_b64}" class="main-logo" alt="Logo">
        """,
        unsafe_allow_html=True,
    )

# Sidebar navigation with logo and sections
if logo_path.exists():
    st.sidebar.image(str(logo_path), width="stretch")
else:
    st.sidebar.markdown(
        f'<h1 style="display: flex; align-items: center; gap: 8px;">{svg_icon("cup-hot", size=28)} Plate & Plan</h1>',
        unsafe_allow_html=True,
    )
st.sidebar.markdown("*Your personal recipe & meal planning assistant*")
st.sidebar.divider()

# Navigation pages with icons
NAV_PAGES = {
    "Home": {"icon": "home", "key": "home"},
    "Recipes": {"icon": "menu_book", "key": "recipes"},
    "Meal Plan": {"icon": "calendar_month", "key": "meal_plan"},
    "Grocery List": {"icon": "shopping_cart", "key": "grocery"},
}

for page_name, page_info in NAV_PAGES.items():
    is_current = st.session_state.current_page == page_name
    if st.sidebar.button(
        page_name,
        key=f"nav_{page_info['key']}",
        width="stretch",
        type="primary" if is_current else "secondary",
        icon=f":material/{page_info['icon']}:" if not is_current else None,
    ):
        st.session_state.current_page = page_name
        # Clear selected recipe when navigating to Recipes page to show the list
        if page_name == "Recipes":
            st.session_state.selected_recipe = None
        # Clear stale recipe preview when navigating away from Recipes page
        if page_name != "Recipes" and "temp_recipe" in st.session_state:
            st.session_state.temp_recipe = None
        scroll_to_top()
        st.rerun()

# Render scroll-to-top script if requested
_render_scroll_script()

page = st.session_state.current_page

st.sidebar.divider()
st.sidebar.markdown(
    f"Made with {svg_icon('heart-fill', size=14, color='#e74c3c')} and Streamlit", unsafe_allow_html=True
)

# =============================================================================
# HOME PAGE
# =============================================================================
if page == "Home":
    st.markdown(f"<h1>{svg_icon('house', size=32)} Welcome to Plate & Plan</h1>", unsafe_allow_html=True)
    st.markdown("Plan your meals, organize recipes, and generate smart grocery lists.")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("### :material/menu_book: Recipe Library")
        recipes = load_recipes()
        st.metric("Saved Recipes", len(recipes))
        if st.button("Browse Recipes", width="stretch"):
            st.session_state.current_page = "Recipes"
            scroll_to_top()
            st.rerun()

    with col2:
        st.markdown("### :material/calendar_month: This Week")
        week_dates = get_week_dates()
        planned_meals = sum(
            1 for d in week_dates for mt in MealType if (d.isoformat(), mt.value) in st.session_state.meal_plan
        )
        total_slots = len(week_dates) * 3  # breakfast, lunch, dinner
        st.metric("Meals Planned", f"{planned_meals}/{total_slots}")
        if st.button("Plan Meals", width="stretch"):
            st.session_state.current_page = "Meal Plan"
            scroll_to_top()
            st.rerun()

    with col3:
        st.markdown("### :material/shopping_cart: Shopping")
        st.metric("Items to Buy", len(st.session_state.grocery_list.get_unchecked()))
        if st.button("View List", width="stretch"):
            st.session_state.current_page = "Grocery List"
            scroll_to_top()
            st.rerun()

    st.divider()

    # Quick actions
    st.subheader(":material/bolt: Quick Actions")
    qcol1, qcol2 = st.columns(2)

    with qcol1:
        st.markdown("#### :material/link: Import Recipe from URL")
        url = st.text_input("Paste a recipe URL", placeholder="https://www.ica.se/recept/...", key="home_url")

        label_col1, label_col2 = st.columns(2)
        with label_col1:
            home_diet_label = st.selectbox(
                ":material/nutrition: Diet Type", ["None", "Veggie", "Fish", "Meat"], key="home_diet_label"
            )
        with label_col2:
            home_meal_label = st.selectbox(
                ":material/restaurant: Meal Type",
                ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink", "Sauce", "Pickle", "Grill"],
                key="home_meal_label",
            )

        if st.button("Import", type="primary", key="home_import") and url:
            with st.spinner("Extracting recipe..."):
                try:
                    from app.services.recipe_scraper import scrape_recipe
                    from app.storage.recipe_storage import find_recipe_by_url, save_recipe

                    # Check if recipe already exists
                    existing = find_recipe_by_url(url)
                    if existing:
                        doc_id, existing_recipe = existing
                        st.warning(f":material/info: Recipe already exists: **{existing_recipe.title}**")
                    else:
                        recipe = scrape_recipe(url)
                        if recipe:
                            # Apply labels
                            if home_diet_label != "None":
                                recipe.diet_label = DietLabel(home_diet_label.lower())
                            if home_meal_label != "None":
                                recipe.meal_label = MealLabel(home_meal_label.lower())
                            save_recipe(recipe)
                            st.success(f":material/check_circle: Imported: **{recipe.title}**")
                        else:
                            st.error("Could not extract recipe from this URL")
                except Exception as e:
                    st.error(f"Error: {e}")

    with qcol2:
        st.markdown("#### :material/dinner_dining: What's for dinner?")
        today = datetime.now(tz=UTC).date()
        dinner_key = (today.isoformat(), MealType.DINNER.value)
        if dinner_key in st.session_state.meal_plan:
            recipe_id = st.session_state.meal_plan[dinner_key]
            recipes = load_recipes()
            recipe_dict = dict(recipes)
            if recipe_id in recipe_dict:
                recipe = recipe_dict[recipe_id]
                st.success(f"Tonight: **{recipe.title}**")
                if st.button("View Recipe", icon=":material/menu_book:"):
                    st.session_state.selected_recipe = (recipe_id, recipe)
                    st.session_state.current_page = "Recipes"
                    scroll_to_top()
                    st.rerun()
        else:
            st.info("No dinner planned for today")
            if st.button("Plan Tonight's Dinner"):
                st.session_state.current_page = "Meal Plan"
                scroll_to_top()
                st.rerun()

# =============================================================================
# RECIPES PAGE
# =============================================================================
elif page == "Recipes":
    st.markdown(f"<h1>{svg_icon('book', size=32)} Recipe Library</h1>", unsafe_allow_html=True)

    # Show success toast if recipe was just saved
    if st.session_state.get("recipe_saved_message"):
        st.toast(st.session_state.recipe_saved_message)
        st.session_state.recipe_saved_message = None

    # Check if we're viewing a specific recipe
    if st.session_state.selected_recipe:
        recipe_id, recipe = st.session_state.selected_recipe

        # Back button
        if st.button("← Back to Recipes"):
            st.session_state.selected_recipe = None
            scroll_to_top()
            st.rerun()

        st.divider()

        # Initialize edit mode state
        edit_mode_key = f"edit_mode_{recipe_id}"
        if edit_mode_key not in st.session_state:
            st.session_state[edit_mode_key] = False

        # Toggle edit mode button
        col_title, col_edit = st.columns([4, 1])
        with col_title:
            st.markdown(f"## {recipe.title}")
        with col_edit:
            if st.session_state[edit_mode_key]:
                if st.button(":material/close: Cancel", key=f"cancel_edit_{recipe_id}", width="stretch"):
                    st.session_state[edit_mode_key] = False
                    st.rerun()
            elif st.button(":material/edit: Edit", key=f"edit_recipe_{recipe_id}", width="stretch"):
                st.session_state[edit_mode_key] = True
                st.rerun()

        if st.session_state[edit_mode_key]:
            # Edit mode
            _render_recipe_edit_form(recipe_id, recipe)
        else:
            # View mode - Recipe detail view
            col1, col2 = st.columns([1, 2])

            with col1:
                st.image(recipe.image_url or DEFAULT_RECIPE_IMAGE, width="stretch")

                st.markdown("### Quick Info")
                if recipe.servings:
                    st.write(f":material/group: Serves: {recipe.servings}")
                if recipe.prep_time:
                    st.write(f":material/timer: Prep: {recipe.prep_time} min")
                if recipe.cook_time:
                    st.write(f":material/skillet: Cook: {recipe.cook_time} min")
                if recipe.total_time_calculated:
                    st.write(f":material/schedule: Total: {recipe.total_time_calculated} min")

                # Show labels
                if recipe.diet_label:
                    diet_icons = {
                        "veggie": ":material/eco:",
                        "fish": ":material/set_meal:",
                        "meat": ":material/kebab_dining:",
                    }
                    st.write(f"{diet_icons.get(recipe.diet_label.value, '')} {recipe.diet_label.value.title()}")
                if recipe.meal_label:
                    meal_icons = {
                        "breakfast": ":material/egg_alt:",
                        "starter": ":material/soup_kitchen:",
                        "meal": ":material/restaurant:",
                        "dessert": ":material/cake:",
                        "drink": ":material/local_cafe:",
                        "sauce": ":material/nutrition:",
                        "pickle": ":material/eco:",
                        "grill": ":material/outdoor_grill:",
                    }
                    st.write(f"{meal_icons.get(recipe.meal_label.value, '')} {recipe.meal_label.value.title()}")

                if recipe.url and recipe.url != "manual-entry":
                    st.markdown(f"[:material/link: Original Recipe]({recipe.url})")

                # Add to Meal Plan section
                st.divider()
                st.markdown("### :material/calendar_add_on: Add to Plan")

                today_date = datetime.now(tz=UTC).date()
                max_date = today_date + timedelta(days=13)

                selected_date = st.date_input(
                    "Date", value=today_date, min_value=today_date, max_value=max_date, key=f"add_plan_date_{recipe_id}"
                )
                meal_options = {"Lunch": MealType.LUNCH, "Dinner": MealType.DINNER}
                selected_meal_str = st.selectbox(
                    "Meal", options=list(meal_options.keys()), key=f"add_plan_meal_{recipe_id}"
                )
                if st.button(":material/add: Add to Plan", key=f"add_to_plan_{recipe_id}", width="stretch"):
                    selected_meal = meal_options[selected_meal_str]
                    key = (selected_date.isoformat(), selected_meal.value)
                    st.session_state.meal_plan[key] = recipe_id
                    update_meal(selected_date.isoformat(), selected_meal.value, recipe_id)
                    st.toast(f"Added to {selected_meal_str} on {selected_date.strftime('%a %b %d')}!")

            with col2:
                st.markdown("### :material/grocery: Ingredients")
                for idx, ing in enumerate(recipe.ingredients):
                    st.checkbox(ing, key=f"ing_{recipe_id}_{idx}_{ing[:20]}")

                st.markdown("### :material/format_list_numbered: Instructions")
                for i, step in enumerate(recipe.instructions, 1):
                    st.markdown(f"**Step {i}:** {step}")

    else:
        # View switcher (using buttons instead of tabs for programmatic control)
        if "recipes_view" not in st.session_state:
            st.session_state.recipes_view = "all"

        view_col1, view_col2, _ = st.columns([1, 1, 4])
        with view_col1:
            if st.button(
                ":material/folder: All Recipes",
                width="stretch",
                type="primary" if st.session_state.recipes_view == "all" else "secondary",
            ):
                st.session_state.recipes_view = "all"
                st.rerun()
        with view_col2:
            if st.button(
                ":material/add: Add Recipe",
                width="stretch",
                type="primary" if st.session_state.recipes_view == "add" else "secondary",
            ):
                st.session_state.recipes_view = "add"
                st.rerun()

        st.divider()

        if st.session_state.recipes_view == "all":
            recipes = load_recipes()

            # Search and filter
            filter_col1, filter_col2, filter_col3, filter_col4, filter_col5 = st.columns([3, 1, 1, 1, 1])
            with filter_col1:
                search = st.text_input(":material/search: Search recipes", placeholder="Search by name...")
            with filter_col2:
                diet_filter = st.selectbox(":material/nutrition:", ["All", "Veggie", "Fish", "Meat"], key="lib_diet")
            with filter_col3:
                meal_filter = st.selectbox(
                    ":material/restaurant:",
                    ["All", "Breakfast", "Starter", "Meal", "Dessert", "Drink", "Sauce", "Pickle", "Grill"],
                    key="lib_meal",
                )
            with filter_col4:
                time_filter = st.selectbox(
                    ":material/schedule:", ["All", "≤15 min", "≤30 min", "≤45 min", "≤60 min"], key="lib_time"
                )
            with filter_col5:
                sort_by = st.selectbox("Sort by", ["Newest", "A-Z", "Z-A", "Quickest"])

            # Filter recipes
            if search:
                recipes = [(rid, r) for rid, r in recipes if search.lower() in r.title.lower()]
            if diet_filter != "All":
                diet_val = diet_filter.lower()
                recipes = [(rid, r) for rid, r in recipes if r.diet_label and r.diet_label.value == diet_val]
            if meal_filter != "All":
                meal_val = meal_filter.lower()
                recipes = [(rid, r) for rid, r in recipes if r.meal_label and r.meal_label.value == meal_val]
            if time_filter != "All":
                time_limits = {"≤15 min": 15, "≤30 min": 30, "≤45 min": 45, "≤60 min": 60}
                max_time = time_limits[time_filter]
                recipes = [
                    (rid, r) for rid, r in recipes if r.total_time_calculated and r.total_time_calculated <= max_time
                ]

            # Sort recipes
            if sort_by == "A-Z":
                recipes = sorted(recipes, key=lambda x: x[1].title)
            elif sort_by == "Z-A":
                recipes = sorted(recipes, key=lambda x: x[1].title, reverse=True)
            elif sort_by == "Quickest":
                recipes = sorted(recipes, key=lambda x: x[1].total_time_calculated or 999)

            st.caption(f"Showing {len(recipes)} recipes")

            if recipes:
                # Display as grid (4 columns for compact view)
                cols = st.columns(4)
                for i, (recipe_id, recipe) in enumerate(recipes):
                    with cols[i % 4], st.container(border=True):
                        st.image(recipe.image_url or DEFAULT_RECIPE_IMAGE, width="stretch")

                        st.markdown(f"**{recipe.title}**")

                        # Show labels
                        labels = []
                        if recipe.diet_label:
                            diet_icons = {
                                "veggie": ":material/eco:",
                                "fish": ":material/set_meal:",
                                "meat": ":material/kebab_dining:",
                            }
                            labels.append(
                                f"{diet_icons.get(recipe.diet_label.value, '')} {recipe.diet_label.value.title()}"
                            )
                        if recipe.meal_label:
                            meal_icons = {
                                "breakfast": ":material/egg_alt:",
                                "starter": ":material/soup_kitchen:",
                                "meal": ":material/restaurant:",
                                "dessert": ":material/cake:",
                                "drink": ":material/local_cafe:",
                            }
                            labels.append(
                                f"{meal_icons.get(recipe.meal_label.value, '')} {recipe.meal_label.value.title()}"
                            )
                        if labels:
                            st.caption(" | ".join(labels))

                        time_info = []
                        if recipe.prep_time:
                            time_info.append(f":material/timer: {recipe.prep_time}m")
                        if recipe.cook_time:
                            time_info.append(f":material/skillet: {recipe.cook_time}m")
                        if time_info:
                            st.caption(" | ".join(time_info))

                        if recipe.servings:
                            st.caption(f":material/group: Serves {recipe.servings}")

                        bcol1, bcol2 = st.columns(2)
                        with bcol1:
                            if st.button("", key=f"view_{recipe_id}", width="stretch", icon=":material/menu_book:"):
                                st.session_state.selected_recipe = (recipe_id, recipe)
                                st.rerun()
                        with bcol2:
                            if st.button("", key=f"del_{recipe_id}", width="stretch", icon=":material/delete:"):
                                confirm_delete_recipe(recipe_id, recipe.title)
            else:
                st.info("No recipes yet! Add your first recipe using the 'Add Recipe' button above.")

        elif st.session_state.recipes_view == "add":
            st.subheader(":material/link: Import from URL")
            url = st.text_input("Recipe URL", placeholder="https://www.allrecipes.com/recipe/...")

            # Label selection for URL import
            label_col1, label_col2 = st.columns(2)
            with label_col1:
                url_diet_label = st.selectbox(
                    ":material/nutrition: Diet Type", ["None", "Veggie", "Fish", "Meat"], key="url_diet_label"
                )
            with label_col2:
                url_meal_label = st.selectbox(
                    ":material/restaurant: Meal Type",
                    ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink", "Sauce", "Pickle", "Grill"],
                    key="url_meal_label",
                )

            if st.button("", type="primary", icon=":material/search:") and url:
                with st.spinner("Extracting recipe..."):
                    try:
                        from app.services.recipe_scraper import scrape_recipe
                        from app.storage.recipe_storage import find_recipe_by_url

                        # Check if recipe already exists
                        existing = find_recipe_by_url(url)
                        if existing:
                            doc_id, existing_recipe = existing
                            st.warning(f":material/info: Recipe already exists: **{existing_recipe.title}**")
                        else:
                            recipe = scrape_recipe(url)
                            if recipe:
                                # Apply labels before storing temp
                                if url_diet_label != "None":
                                    recipe.diet_label = DietLabel(url_diet_label.lower())
                                if url_meal_label != "None":
                                    recipe.meal_label = MealLabel(url_meal_label.lower())
                                st.session_state.temp_recipe = recipe
                                st.success("Recipe extracted! Review below and save.")
                            else:
                                st.error("Could not extract recipe. Try a different URL.")
                    except Exception as e:
                        st.error(f"Error: {e}")

            # Show extracted recipe preview
            if "temp_recipe" in st.session_state and st.session_state.temp_recipe:
                recipe = st.session_state.temp_recipe
                st.divider()
                st.subheader("Preview")

                col1, col2 = st.columns([1, 2])
                with col1:
                    st.image(recipe.image_url or DEFAULT_RECIPE_IMAGE, width=250)
                with col2:
                    st.markdown(f"### {recipe.title}")
                    st.write(f":material/group: Servings: {recipe.servings or 'N/A'}")
                    st.write(
                        f":material/timer: Prep: {recipe.prep_time or 'N/A'} min | :material/skillet: Cook: {recipe.cook_time or 'N/A'} min"
                    )
                    # Show applied labels
                    if recipe.diet_label:
                        st.write(f":material/nutrition: {recipe.diet_label.value.title()}")
                    if recipe.meal_label:
                        st.write(f":material/restaurant: {recipe.meal_label.value.title()}")

                with st.expander("Ingredients"):
                    for ing in recipe.ingredients:
                        st.write(f"- {ing}")

                with st.expander("Instructions"):
                    for i, step in enumerate(recipe.instructions, 1):
                        st.write(f"{i}. {step}")

                col1, col2 = st.columns(2)
                with col1:
                    if st.button("", type="primary", width="stretch", icon=":material/save:"):
                        with st.spinner("Saving recipe..."):
                            try:
                                from app.storage.recipe_storage import save_recipe

                                save_recipe(recipe)
                                st.success("Recipe saved!")
                                st.session_state.temp_recipe = None
                                st.rerun()
                            except Exception as e:
                                st.error(f"Could not save: {e}")
                with col2:
                    if st.button("", width="stretch", icon=":material/delete:"):
                        st.session_state.temp_recipe = None
                        st.rerun()

            st.divider()

            # Manual recipe entry
            st.subheader(":material/edit: Add Recipe Manually")

            with st.form("manual_recipe_form"):
                manual_title = st.text_input("Recipe Title *", placeholder="e.g., Grandma's Apple Pie")
                manual_image_url = st.text_input("Image URL (optional)", placeholder="https://...")

                mcol1, mcol2, mcol3 = st.columns(3)
                with mcol1:
                    manual_servings = st.number_input("Servings", min_value=1, value=4)
                with mcol2:
                    manual_prep_time = st.number_input("Prep Time (min)", min_value=0, value=15)
                with mcol3:
                    manual_cook_time = st.number_input("Cook Time (min)", min_value=0, value=30)

                # Labels for manual entry
                label_col1, label_col2 = st.columns(2)
                with label_col1:
                    manual_diet_label = st.selectbox(
                        ":material/nutrition: Diet Type", ["None", "Veggie", "Fish", "Meat"], key="manual_diet_label"
                    )
                with label_col2:
                    manual_meal_label = st.selectbox(
                        ":material/restaurant: Meal Type",
                        ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink", "Sauce", "Pickle", "Grill"],
                        key="manual_meal_label",
                    )

                manual_ingredients = st.text_area(
                    "Ingredients *",
                    placeholder="Enter one ingredient per line:\n2 cups flour\n1 cup sugar\n3 eggs",
                    height=150,
                )
                manual_instructions = st.text_area(
                    "Instructions *",
                    placeholder="Enter one step per line:\nPreheat oven to 350°F\nMix dry ingredients\nAdd wet ingredients",
                    height=150,
                )

                submitted = st.form_submit_button(
                    "Save Recipe", type="primary", width="stretch", icon=":material/save:"
                )

                if submitted:
                    if not manual_title or not manual_ingredients or not manual_instructions:
                        st.error("Please fill in all required fields (Title, Ingredients, Instructions)")
                    else:
                        import uuid

                        ingredients_list = [
                            ing.strip() for ing in manual_ingredients.strip().split("\n") if ing.strip()
                        ]
                        instructions_list = [
                            inst.strip() for inst in manual_instructions.strip().split("\n") if inst.strip()
                        ]

                        manual_recipe = Recipe(
                            title=manual_title,
                            url=f"manual-entry-{uuid.uuid4().hex[:8]}",
                            ingredients=ingredients_list,
                            instructions=instructions_list,
                            image_url=manual_image_url if manual_image_url else None,
                            servings=manual_servings,
                            prep_time=manual_prep_time if manual_prep_time > 0 else None,
                            cook_time=manual_cook_time if manual_cook_time > 0 else None,
                            diet_label=DietLabel(manual_diet_label.lower()) if manual_diet_label != "None" else None,
                            meal_label=MealLabel(manual_meal_label.lower()) if manual_meal_label != "None" else None,
                        )

                        with st.spinner("Saving recipe..."):
                            try:
                                from app.storage.recipe_storage import save_recipe

                                save_recipe(manual_recipe)
                                st.session_state.recipe_saved_message = f"✓ Saved: {manual_title}"
                                st.session_state.selected_recipe = None
                                st.session_state.recipes_view = "all"
                                st.rerun()
                            except Exception as e:
                                st.error(f"Could not save: {e}")

# =============================================================================
# MEAL PLAN PAGE
# =============================================================================
elif page == "Meal Plan":
    st.markdown(f"<h1>{svg_icon('calendar-week', size=32)} Weekly Meal Plan</h1>", unsafe_allow_html=True)

    # Week navigation - centered
    _, nav_col1, nav_col2, nav_col3, _ = st.columns([2, 1, 2, 1, 2])
    with nav_col1:
        if st.button("", help="Previous Week", icon=":material/chevron_left:", width="stretch"):
            st.session_state.week_offset -= 1
            st.rerun()
    with nav_col2:
        week_dates = get_week_dates(st.session_state.week_offset)
        week_start = week_dates[0].strftime("%b %d")
        week_end = week_dates[-1].strftime("%b %d, %Y")
        st.markdown(
            f"<h3 style='text-align: center; margin: 0;'>{week_start} - {week_end}</h3>", unsafe_allow_html=True
        )
        if st.session_state.week_offset != 0 and st.button("Today", width="stretch"):
            st.session_state.week_offset = 0
            st.rerun()
    with nav_col3:
        if st.button("", help="Next Week", icon=":material/chevron_right:", width="stretch"):
            st.session_state.week_offset += 1
            st.rerun()

    st.divider()

    # Load recipes for selection
    recipes = load_recipes()
    recipe_dict = dict(recipes)
    recipe_options = {rid: r.title for rid, r in recipes}

    # Weekly grid (Saturday to Friday)
    weekend_names = ["Sat", "Sun"]
    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    meal_types = [MealType.LUNCH, MealType.DINNER]
    today = datetime.now(tz=UTC).date()
    title_max_length = 25

    # Filter recipes for random selection - only Meal and Grill types
    all_recipes = [(rid, r) for rid, r in recipes if r.meal_label and r.meal_label.value in ("meal", "grill")]

    def render_custom_input_tile(key: tuple, col_key: str, d: date, meal_type: MealType) -> None:
        """Render the custom text input form for a meal tile."""
        with st.container(border=True):
            st.markdown("<div style='height: 40px;'></div>", unsafe_allow_html=True)
            custom_text = st.text_input(
                "What's planned?",
                key=f"custom_input_{col_key}_{d}_{meal_type.value}",
                placeholder="e.g., Eating out, Leftovers...",
            )
            input_col1, input_col2 = st.columns(2)
            with input_col1:
                if st.button(
                    "", key=f"save_custom_{col_key}_{d}_{meal_type.value}", help="Save", icon=":material/check:"
                ):
                    if custom_text:
                        st.session_state.meal_plan[key] = f"custom:{custom_text}"
                        update_meal(d.isoformat(), meal_type.value, f"custom:{custom_text}")
                    st.session_state.custom_meal_input = None
                    st.rerun()
            with input_col2:
                if st.button(
                    "", key=f"cancel_custom_{col_key}_{d}_{meal_type.value}", help="Cancel", icon=":material/close:"
                ):
                    st.session_state.custom_meal_input = None
                    st.rerun()

    def render_custom_meal_tile(key: tuple, col_key: str, d: date, meal_type: MealType, custom_text: str) -> None:
        """Render a meal tile with custom text."""
        with st.container(border=True):
            st.markdown(
                f"<div style='height: 80px; display: flex; align-items: center; justify-content: center; "
                f"font-style: italic;'>{custom_text}</div>",
                unsafe_allow_html=True,
            )
            _, _, btn_col = st.columns([2, 2, 1])
            with btn_col:
                if st.button("", key=f"clear_{col_key}_{d}_{meal_type.value}", help="Remove", icon=":material/close:"):
                    del st.session_state.meal_plan[key]
                    if key in st.session_state.meal_portions:
                        del st.session_state.meal_portions[key]
                    delete_meal(d.isoformat(), meal_type.value)
                    st.rerun()

    def render_recipe_meal_tile(  # noqa: PLR0913
        key: tuple, col_key: str, d: date, meal_type: MealType, recipe_id: str, recipe: Recipe
    ) -> None:
        """Render a meal tile with a recipe and portion controls."""
        default_portions = recipe.servings or 4
        current_portions = st.session_state.meal_portions.get(key, default_portions)

        with st.container(border=True):
            # Fixed height image container for consistent tile sizing
            image_url = recipe.image_url or DEFAULT_RECIPE_IMAGE
            st.markdown(
                f"""<div style='height: 200px; overflow: hidden; display: flex;
                align-items: center; justify-content: center;'>
                <img src='{image_url}' style='width: 100%; height: 100%; object-fit: cover;'/>
                </div>""",
                unsafe_allow_html=True,
            )
            title_display = (
                recipe.title[:title_max_length] + "..." if len(recipe.title) > title_max_length else recipe.title
            )
            st.caption(title_display)

            # Combined portion controls and action buttons on one row
            view_col, dec_col, port_col, inc_col, close_col = st.columns([1, 1, 1, 1, 1])
            with view_col:
                if st.button(
                    "",
                    key=f"view_{col_key}_{d}_{meal_type.value}",
                    help="View recipe",
                    icon=":material/visibility:",
                    type="secondary",
                ):
                    st.session_state.selected_recipe = (recipe_id, recipe)
                    st.session_state.current_page = "Recipes"
                    scroll_to_top()
                    st.rerun()
            with dec_col:
                if (
                    st.button(
                        "", key=f"dec_port_{col_key}_{d}_{meal_type.value}", help="Less", icon=":material/remove:"
                    )
                    and current_portions > 1
                ):
                    st.session_state.meal_portions[key] = current_portions - 1
                    st.rerun()
            with port_col:
                st.caption(f":material/group: {current_portions}")
            with inc_col:
                if st.button("", key=f"inc_port_{col_key}_{d}_{meal_type.value}", help="More", icon=":material/add:"):
                    st.session_state.meal_portions[key] = current_portions + 1
                    st.rerun()
            with close_col:
                if st.button("", key=f"clear_{col_key}_{d}_{meal_type.value}", help="Remove", icon=":material/close:"):
                    del st.session_state.meal_plan[key]
                    if key in st.session_state.meal_portions:
                        del st.session_state.meal_portions[key]
                    delete_meal(d.isoformat(), meal_type.value)
                    st.rerun()

    def render_filled_tile(key: tuple, col_key: str, d: date, meal_type: MealType, current_value: str) -> None:
        """Render a meal tile that has a recipe or custom text assigned."""
        if current_value.startswith("custom:"):
            custom_text = current_value[7:]  # Remove "custom:" prefix
            render_custom_meal_tile(key, col_key, d, meal_type, custom_text)
        elif current_value in recipe_dict:
            recipe = recipe_dict[current_value]
            render_recipe_meal_tile(key, col_key, d, meal_type, current_value, recipe)

    def get_week_meals_for_copy() -> dict[str, str]:
        """Get a dict of display names to recipe IDs for meals already planned this week."""
        week_dates = get_week_dates(st.session_state.week_offset)
        meals_dict: dict[str, str] = {}
        seen_recipes: set[str] = set()

        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        meal_names = {"breakfast": "🌅", "lunch": "☀️", "dinner": "🌙"}

        for d in week_dates:
            for meal_type in [MealType.LUNCH, MealType.DINNER]:
                key = (d.isoformat(), meal_type.value)
                recipe_id = st.session_state.meal_plan.get(key, "")
                if recipe_id and not recipe_id.startswith("custom:") and recipe_id not in seen_recipes:
                    if recipe_id not in recipe_dict:
                        continue
                    recipe = recipe_dict[recipe_id]
                    day_name = day_names[d.weekday()]
                    meal_icon = meal_names.get(meal_type.value, "")
                    display = f"{day_name} {meal_icon} {recipe.title}"
                    meals_dict[display] = recipe_id
                    seen_recipes.add(recipe_id)

        return meals_dict

    def get_weighted_random_recipe() -> str | None:
        """Get a random recipe, weighted against ones eaten in the last 2 months."""
        import random

        from app.storage.meal_plan_storage import load_meal_plan

        if not all_recipes:
            return None

        usage_count = _count_recent_recipe_usage(load_meal_plan(), days=60)

        # Build weighted list - unused recipes get weight 3, used ones get lower weight
        # Weight formula: 3 / (usage + 1) - so unused=3, used once=1.5, twice=1, etc.
        weights = []
        recipe_ids = []
        for rid, _ in all_recipes:
            recipe_ids.append(rid)
            usage = usage_count.get(rid, 0)
            weights.append(3.0 / (usage + 1))

        total_weight = sum(weights)
        if total_weight == 0:
            return random.choice(recipe_ids)

        # Weighted random selection
        r = random.random() * total_weight
        cumulative = 0
        for rid, weight in zip(recipe_ids, weights, strict=False):
            cumulative += weight
            if r <= cumulative:
                return rid

        return recipe_ids[-1] if recipe_ids else None

    def _render_copy_mode_ui(key: tuple, col_key: str, d: date, meal_type: MealType, copy_mode_key: str) -> None:
        """Render the copy-from-week selection UI."""
        week_meals = get_week_meals_for_copy()
        if not week_meals:
            st.session_state[copy_mode_key] = False
            st.rerun()
            return

        st.markdown("<div style='height: 60px;'></div>", unsafe_allow_html=True)
        selected = st.selectbox(
            "Copy from:",
            options=["", *list(week_meals.keys())],
            key=f"copy_select_{col_key}_{d}_{meal_type.value}",
            label_visibility="collapsed",
        )
        sel_col1, sel_col2 = st.columns(2)
        with sel_col1:
            if st.button("", key=f"confirm_copy_{col_key}", help="Copy", icon=":material/check:"):
                if selected and selected in week_meals:
                    recipe_id = week_meals[selected]
                    st.session_state.meal_plan[key] = recipe_id
                    update_meal(d.isoformat(), meal_type.value, recipe_id)
                st.session_state[copy_mode_key] = False
                st.rerun()
        with sel_col2:
            if st.button("", key=f"cancel_copy_{col_key}", help="Cancel", icon=":material/close:"):
                st.session_state[copy_mode_key] = False
                st.rerun()
        st.markdown("<div style='height: 60px;'></div>", unsafe_allow_html=True)

    def _render_empty_tile_buttons(key: tuple, col_key: str, d: date, meal_type: MealType, copy_mode_key: str) -> None:
        """Render the action buttons for an empty meal tile."""
        st.markdown("<div style='height: 100px;'></div>", unsafe_allow_html=True)
        _, btn_col1, btn_col2, btn_col3, btn_col4, _ = st.columns([1, 1, 1, 1, 1, 1])
        with btn_col1:
            if st.button("", key=f"add_{col_key}_{d}_{meal_type.value}", help="Select recipe", icon=":material/add:"):
                st.session_state.meal_selector = (d.isoformat(), meal_type.value)
                st.session_state.current_page = "📖 Browse Recipes"
                scroll_to_top()
                st.rerun()
        with btn_col2:
            if st.button("", key=f"random_{col_key}_{d}_{meal_type.value}", help="Random", icon=":material/casino:"):
                random_rid = get_weighted_random_recipe()
                if random_rid:
                    st.session_state.meal_plan[key] = random_rid
                    update_meal(d.isoformat(), meal_type.value, random_rid)
                    st.rerun()
                else:
                    st.toast("No recipes available!")
        with btn_col3:
            week_meals = get_week_meals_for_copy()
            if week_meals and st.button(
                "", key=f"copy_{col_key}_{d}_{meal_type.value}", help="Copy from week", icon=":material/content_copy:"
            ):
                st.session_state[copy_mode_key] = True
                st.rerun()
        with btn_col4:
            if st.button("", key=f"custom_{col_key}_{d}_{meal_type.value}", help="Custom", icon=":material/edit:"):
                st.session_state.custom_meal_input = key
                st.rerun()
        st.markdown("<div style='height: 100px;'></div>", unsafe_allow_html=True)

    def render_empty_tile(key: tuple, col_key: str, d: date, meal_type: MealType) -> None:
        """Render an empty meal tile with action buttons."""
        with st.container(border=True):
            copy_mode_key = f"copy_from_week_{key}"
            if st.session_state.get(copy_mode_key):
                _render_copy_mode_ui(key, col_key, d, meal_type, copy_mode_key)
            else:
                _render_empty_tile_buttons(key, col_key, d, meal_type, copy_mode_key)

    def render_meal_tile(d: date, meal_type: MealType, col_key: str) -> None:
        """Render a single meal tile in the weekly grid."""
        key = (d.isoformat(), meal_type.value)
        current_value = st.session_state.meal_plan.get(key, "")

        if st.session_state.custom_meal_input == key:
            render_custom_input_tile(key, col_key, d, meal_type)
        elif current_value:
            render_filled_tile(key, col_key, d, meal_type, current_value)
        else:
            render_empty_tile(key, col_key, d, meal_type)

    # Show summary directly without meal selector popup (now handled on browse page)

    # Detect if likely mobile (we can't detect directly, but we can use st.columns behavior)
    # For mobile, show a vertical day-by-day layout
    # Add a toggle for users to switch between views
    if "meal_plan_view" not in st.session_state:
        st.session_state.meal_plan_view = "week"  # "week" or "day"

    # Centered view toggle buttons
    _, view_col1, view_col2, _ = st.columns([1, 1, 1, 1])
    with view_col1:
        if st.button(
            ":material/calendar_view_week: Week",
            width="stretch",
            type="primary" if st.session_state.meal_plan_view == "week" else "secondary",
        ):
            st.session_state.meal_plan_view = "week"
            st.rerun()
    with view_col2:
        if st.button(
            ":material/calendar_today: Day",
            width="stretch",
            type="primary" if st.session_state.meal_plan_view == "day" else "secondary",
        ):
            st.session_state.meal_plan_view = "day"
            st.rerun()

    st.write("")

    if st.session_state.meal_plan_view == "day":
        # DAY VIEW - Mobile friendly, compact one day at a time
        if "selected_day_index" not in st.session_state:
            today_index = next((i for i, d in enumerate(week_dates) if d == today), 0)
            st.session_state.selected_day_index = today_index

        # Compact day selector (Saturday to Friday)
        day_names = ["S", "S", "M", "T", "W", "T", "F"]
        full_day_names = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]
        day_cols = st.columns(7)
        for i, (_day_name, d) in enumerate(zip(day_names, week_dates, strict=False)):
            with day_cols[i]:
                is_selected = st.session_state.selected_day_index == i
                is_today = d == today
                btn_type = "primary" if is_selected else "secondary"
                label = f"{d.day}"
                if st.button(label, key=f"day_btn_{i}", width="stretch", type=btn_type):
                    st.session_state.selected_day_index = i
                    st.rerun()

        # Show selected day's meals - compact inline view
        selected_date = week_dates[st.session_state.selected_day_index]
        selected_day_name = full_day_names[st.session_state.selected_day_index]

        st.markdown(f"**{selected_day_name}, {selected_date.strftime('%b %d')}**")

        # Notes input for day view
        note_key = selected_date.isoformat()
        current_note = st.session_state.day_notes.get(note_key, "")
        new_note = st.text_input(
            "📝 Day notes",
            value=current_note,
            key=f"note_day_{note_key}",
            placeholder="e.g. office, home, climb day...",
            max_chars=50,
        )
        if new_note != current_note:
            st.session_state.day_notes[note_key] = new_note
            update_day_note(note_key, new_note)

        # Compact meal display - 3 columns for the 3 meals
        meal_cols = st.columns(3)
        for i, meal_type in enumerate(meal_types):
            with meal_cols[i]:
                key = (selected_date.isoformat(), meal_type.value)
                current_value = st.session_state.meal_plan.get(key, "")

                # Meal type header
                meal_icons = {
                    "breakfast": ":material/coffee:",
                    "lunch": ":material/restaurant:",
                    "dinner": ":material/dinner_dining:",
                }
                st.markdown(f"{meal_icons.get(meal_type.value, '')} **{meal_type.value.title()}**")

                if current_value:
                    if current_value.startswith("custom:"):
                        st.caption(f"_{current_value[7:]}_")
                    elif current_value in recipe_dict:
                        recipe = recipe_dict[current_value]
                        st.image(recipe.image_url or DEFAULT_RECIPE_IMAGE, width="stretch")
                        st.caption(
                            recipe.title[:title_max_length] + "..."
                            if len(recipe.title) > title_max_length
                            else recipe.title
                        )
                    # Remove button
                    if st.button(":material/close:", key=f"rm_day_{selected_date}_{meal_type.value}", help="Remove"):
                        del st.session_state.meal_plan[key]
                        delete_meal(selected_date.isoformat(), meal_type.value)
                        st.rerun()
                else:
                    st.caption("_Empty_")
                    if st.button(":material/add:", key=f"add_day_{selected_date}_{meal_type.value}", help="Add"):
                        st.session_state.meal_selector = (selected_date.isoformat(), meal_type.value)
                        st.session_state.current_page = "📖 Browse Recipes"
                        scroll_to_top()
                        st.rerun()

    else:
        # WEEK VIEW - Original desktop layout
        # WEEKEND (Sat-Sun) - First Row
        st.markdown("#### Weekend")

        # Header row for weekend
        weekend_header_cols = st.columns([0.5] + [1] * 2 + [1] * 3)
        with weekend_header_cols[0]:
            st.write("")
        for i, (day, d) in enumerate(zip(weekend_names, week_dates[:2], strict=False)):
            with weekend_header_cols[i + 1]:
                is_today = d == today
                if is_today:
                    st.markdown(
                        f"<div style='background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); "
                        f"padding: 8px; border-radius: 8px; text-align: center; color: white;'>"
                        f"<strong>{day}</strong><br/><strong>{d.day}</strong></div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(f"**{day}**  \n{d.day}")

        # Notes row for weekend
        weekend_notes_cols = st.columns([0.5] + [1] * 2 + [1] * 3)
        with weekend_notes_cols[0]:
            st.markdown("<span style='color: #666; font-size: 0.85em;'>📝 Notes</span>", unsafe_allow_html=True)
        for i, d in enumerate(week_dates[:2]):
            with weekend_notes_cols[i + 1]:
                note_key = d.isoformat()
                current_note = st.session_state.day_notes.get(note_key, "")
                new_note = st.text_input(
                    "Note",
                    value=current_note,
                    key=f"note_weekend_{note_key}",
                    label_visibility="collapsed",
                    placeholder="e.g. office, home...",
                    max_chars=50,
                )
                if new_note != current_note:
                    st.session_state.day_notes[note_key] = new_note
                    update_day_note(note_key, new_note)

        # Meal rows for weekend
        for meal_type in meal_types:
            weekend_row_cols = st.columns([0.5] + [1] * 2 + [1] * 3)
            with weekend_row_cols[0]:
                st.markdown(
                    f"<span style='color: #1a1a1a; font-weight: 600;'>{meal_type.value.title()}</span>",
                    unsafe_allow_html=True,
                )

            for i, d in enumerate(week_dates[:2]):
                with weekend_row_cols[i + 1]:
                    render_meal_tile(d, meal_type, "weekend")

        st.divider()

        # WEEKDAYS (Mon-Fri) - Second Row
        st.markdown("#### Weekdays")

        # Header row for weekdays
        header_cols = st.columns([0.5] + [1] * 5)
        with header_cols[0]:
            st.write("")
        for i, (day, d) in enumerate(zip(weekday_names, week_dates[2:], strict=False)):
            with header_cols[i + 1]:
                is_today = d == today
                if is_today:
                    st.markdown(
                        f"<div style='background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%); "
                        f"padding: 8px; border-radius: 8px; text-align: center; color: white;'>"
                        f"<strong>{day}</strong><br/><strong>{d.day}</strong></div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(f"**{day}**  \n{d.day}")

        # Notes row for weekdays
        notes_cols = st.columns([0.5] + [1] * 5)
        with notes_cols[0]:
            st.markdown("<span style='color: #666; font-size: 0.85em;'>📝 Notes</span>", unsafe_allow_html=True)
        for i, d in enumerate(week_dates[2:]):
            with notes_cols[i + 1]:
                note_key = d.isoformat()
                current_note = st.session_state.day_notes.get(note_key, "")
                new_note = st.text_input(
                    "Note",
                    value=current_note,
                    key=f"note_weekday_{note_key}",
                    label_visibility="collapsed",
                    placeholder="e.g. office, home...",
                    max_chars=50,
                )
                if new_note != current_note:
                    st.session_state.day_notes[note_key] = new_note
                    update_day_note(note_key, new_note)

        # Meal rows for weekdays
        for meal_type in meal_types:
            row_cols = st.columns([0.5] + [1] * 5)
            with row_cols[0]:
                st.markdown(
                    f"<span style='color: #1a1a1a; font-weight: 600;'>{meal_type.value.title()}</span>",
                    unsafe_allow_html=True,
                )

            for i, d in enumerate(week_dates[2:]):
                with row_cols[i + 1]:
                    render_meal_tile(d, meal_type, "weekday")

        st.divider()

    # Summary and actions
    col1, col2 = st.columns(2)

    with col1:
        st.subheader(":material/bar_chart: Week Summary")
        planned_count = sum(
            1 for d in week_dates for mt in meal_types if (d.isoformat(), mt.value) in st.session_state.meal_plan
        )
        st.write(f"**Meals planned:** {planned_count}/{len(week_dates) * len(meal_types)}")

        # List unique recipes for the week
        unique_recipes = set()
        custom_meals = set()
        for d in week_dates:
            for mt in meal_types:
                key = (d.isoformat(), mt.value)
                if key in st.session_state.meal_plan:
                    meal_value = st.session_state.meal_plan[key]
                    if meal_value.startswith("custom:"):
                        custom_meals.add(meal_value[7:])  # Remove "custom:" prefix
                    else:
                        unique_recipes.add(meal_value)

        if unique_recipes or custom_meals:
            st.write("**Meals this week:**")
            for rid in unique_recipes:
                title = recipe_options.get(rid, rid)
                st.write(f"- {title}")
            for custom_name in custom_meals:
                st.write(f"- {custom_name}")

    with col2:
        st.subheader(":material/shopping_cart: Generate Grocery List")
        st.write("Add ingredients from this week's meals to your shopping list.")

        if st.button(":material/shopping_cart: Add to List", type="primary", width="stretch"):
            if not unique_recipes:
                st.warning("Plan some meals first!")
            else:
                # Add to existing grocery list (don't replace)
                grocery_list = st.session_state.grocery_list
                recipe_dict = dict(recipes)
                items_added = 0

                for rid in unique_recipes:
                    if rid in recipe_dict:
                        recipe = recipe_dict[rid]
                        for ing in recipe.ingredients:
                            # Parse the ingredient to extract quantity, unit, and name
                            parsed = parse_ingredient(ing)
                            qty_source = QuantitySource(quantity=parsed.quantity, unit=parsed.unit, recipe=recipe.title)
                            item = GroceryItem(
                                name=parsed.name if parsed.name else ing,
                                recipe_sources=[recipe.title],
                                quantity_sources=[qty_source],
                            )
                            grocery_list.add_item(item)
                            items_added += 1

                st.session_state.grocery_list = grocery_list
                st.success(f":material/check_circle: Added {items_added} items! Total: {len(grocery_list.items)}")

        if st.button("Clear Week", width="stretch", icon=":material/delete_sweep:"):
            confirm_clear_week(week_dates, meal_types)

# =============================================================================
# GROCERY LIST PAGE
# =============================================================================
elif page == "Grocery List":
    st.markdown(f"<h1>{svg_icon('cart3', size=32)} Grocery List</h1>", unsafe_allow_html=True)

    grocery_list = st.session_state.grocery_list

    if not grocery_list.items:
        st.info("Your grocery list is empty. Generate one from your meal plan!")
        if st.button("Go to Meal Plan"):
            st.rerun()
    else:
        # Summary
        total_items = len(grocery_list.items)
        checked_items = len([i for i in grocery_list.items if i.checked])
        st.progress(checked_items / total_items if total_items > 0 else 0)
        st.caption(f"{checked_items}/{total_items} items checked")

        # Actions
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("Check All", width="stretch", icon=":material/check_box:"):
                for item in grocery_list.items:
                    item.checked = True
                st.rerun()
        with col2:
            if st.button("Uncheck All", width="stretch", icon=":material/check_box_outline_blank:"):
                for item in grocery_list.items:
                    item.checked = False
                st.rerun()
        with col3:
            if st.button("Clear List", width="stretch", icon=":material/delete:"):
                st.session_state.grocery_list = GroceryList()
                st.rerun()

        st.divider()

        # Split items into shopping list and pantry staples
        shopping_items = [(i, item) for i, item in enumerate(grocery_list.items) if not is_pantry_staple(item.name)]
        pantry_items = [(i, item) for i, item in enumerate(grocery_list.items) if is_pantry_staple(item.name)]

        # Two-column layout
        left_col, right_col = st.columns([2, 1])

        with left_col:
            st.subheader(":material/checklist: Shopping List")
            if shopping_items:
                for idx, (i, item) in enumerate(shopping_items):
                    cols = st.columns([0.05, 0.05, 0.08, 0.82])

                    # Move up button
                    with cols[0]:
                        if idx > 0:
                            prev_i = shopping_items[idx - 1][0]
                            if st.button("↑", key=f"up_{i}", help="Move up"):
                                grocery_list.items[i], grocery_list.items[prev_i] = (
                                    grocery_list.items[prev_i],
                                    grocery_list.items[i],
                                )
                                st.rerun()

                    # Move down button
                    with cols[1]:
                        if idx < len(shopping_items) - 1:
                            next_i = shopping_items[idx + 1][0]
                            if st.button("↓", key=f"down_{i}", help="Move down"):
                                grocery_list.items[i], grocery_list.items[next_i] = (
                                    grocery_list.items[next_i],
                                    grocery_list.items[i],
                                )
                                st.rerun()

                    # Checkbox
                    with cols[2]:
                        new_checked = st.checkbox(
                            "", value=item.checked, key=f"check_{i}", label_visibility="collapsed"
                        )
                        if new_checked != item.checked:
                            grocery_list.items[i].checked = new_checked
                            st.rerun()

                    # Item text (without recipe sources)
                    with cols[3]:
                        display = item.display_text
                        if item.checked:
                            st.markdown(f"~~{display}~~", unsafe_allow_html=True)
                        else:
                            st.markdown(f"**{display}**", unsafe_allow_html=True)
            else:
                st.caption("No items to buy - everything is in your pantry!")

            # Add custom item
            st.divider()
            st.markdown("**:material/add: Add Item**")
            new_item = st.text_input("Item name", placeholder="e.g., Milk, Bread...", label_visibility="collapsed")
            if st.button("Add", icon=":material/add_shopping_cart:") and new_item:
                grocery_list.items.append(GroceryItem(name=new_item))
                st.rerun()

        with right_col:
            st.subheader(":material/home: Pantry Staples")
            st.caption("Items you likely have at home")
            if pantry_items:
                for i, item in pantry_items:
                    cols = st.columns([0.12, 0.88])

                    # Checkbox
                    with cols[0]:
                        new_checked = st.checkbox(
                            "", value=item.checked, key=f"pantry_check_{i}", label_visibility="collapsed"
                        )
                        if new_checked != item.checked:
                            grocery_list.items[i].checked = new_checked
                            st.rerun()

                    # Item text (without recipe sources)
                    with cols[1]:
                        display = item.display_text
                        if item.checked:
                            st.markdown(f"~~{display}~~", unsafe_allow_html=True)
                        else:
                            st.markdown(display, unsafe_allow_html=True)
            else:
                st.caption("No pantry staples in this list")

# =============================================================================
# BROWSE RECIPES PAGE (for meal selection)
# =============================================================================
elif page == "📖 Browse Recipes":
    st.markdown(f"<h1>{svg_icon('book', size=32)} Browse Recipes</h1>", unsafe_allow_html=True)

    # Show context if selecting for a meal
    if st.session_state.meal_selector:
        sel_date, sel_meal = st.session_state.meal_selector
        st.info(f":material/calendar_today: Selecting recipe for **{sel_meal.title()}** on **{sel_date}**")
        if st.button("← Cancel Selection"):
            st.session_state.meal_selector = None
            st.session_state.current_page = "Meal Plan"
            scroll_to_top()
            st.rerun()
        st.divider()

    recipes = load_recipes()

    if not recipes:
        st.warning("No recipes yet! Add some recipes first.")
        if st.button("Go to Recipes", width="stretch"):
            st.session_state.current_page = "Recipes"
            scroll_to_top()
            st.rerun()
    else:
        # Filter options
        search = st.text_input(":material/search: Search", placeholder="Search recipes...")

        # Filter recipes
        filtered_recipes = recipes
        if search:
            filtered_recipes = [(rid, r) for rid, r in filtered_recipes if search.lower() in r.title.lower()]

        st.caption(f"Showing {len(filtered_recipes)} recipes")
        st.divider()

        # Display recipes in grid (4 columns for compact view)
        if filtered_recipes:
            cols = st.columns(4)
            for i, (recipe_id, recipe) in enumerate(filtered_recipes):
                with cols[i % 4], st.container(border=True):
                    if recipe.image_url:
                        st.image(recipe.image_url, width="stretch")
                    else:
                        st.markdown(
                            "<div style='height: 150px; background: #f0f0f0; display: flex; "
                            "align-items: center; justify-content: center;'>:material/restaurant:</div>",
                            unsafe_allow_html=True,
                        )

                    st.markdown(f"**{recipe.title}**")

                    # Show labels
                    labels = []
                    if recipe.diet_label:
                        diet_icons = {
                            "veggie": ":material/eco:",
                            "fish": ":material/set_meal:",
                            "meat": ":material/kebab_dining:",
                        }
                        labels.append(
                            f"{diet_icons.get(recipe.diet_label.value, '')} {recipe.diet_label.value.title()}"
                        )
                    if recipe.meal_label:
                        meal_icons = {
                            "breakfast": ":material/egg_alt:",
                            "starter": ":material/soup_kitchen:",
                            "meal": ":material/restaurant:",
                            "dessert": ":material/cake:",
                            "drink": ":material/local_cafe:",
                        }
                        labels.append(
                            f"{meal_icons.get(recipe.meal_label.value, '')} {recipe.meal_label.value.title()}"
                        )
                    if labels:
                        st.caption(" | ".join(labels))

                    # Time info
                    time_info = []
                    if recipe.prep_time:
                        time_info.append(f":material/timer: {recipe.prep_time}m")
                    if recipe.cook_time:
                        time_info.append(f":material/skillet: {recipe.cook_time}m")
                    if time_info:
                        st.caption(" | ".join(time_info))

                    # Action button
                    if st.session_state.meal_selector:
                        if st.button(
                            "Select", key=f"browse_select_{recipe_id}", width="stretch", icon=":material/check:"
                        ):
                            sel_date, sel_meal = st.session_state.meal_selector
                            st.session_state.meal_plan[(sel_date, sel_meal)] = recipe_id
                            update_meal(sel_date, sel_meal, recipe_id)
                            st.session_state.meal_selector = None
                            st.session_state.current_page = "Meal Plan"
                            scroll_to_top()
                            st.rerun()
                    elif st.button("", key=f"browse_view_{recipe_id}", width="stretch", icon=":material/menu_book:"):
                        st.session_state.selected_recipe = (recipe_id, recipe)
                        st.session_state.current_page = "Recipes"
                        scroll_to_top()
                        st.rerun()
        else:
            st.info("No recipes match your filters.")
