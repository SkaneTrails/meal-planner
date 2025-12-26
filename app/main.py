"""Meal Planner - Recipe collector and weekly meal planner inspired by Samsung Food."""

import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import streamlit as st

from app.icons import inject_bootstrap_icons_css, svg_icon
from app.models.grocery_list import GroceryCategory, GroceryItem, GroceryList
from app.models.meal_plan import MealType
from app.models.recipe import DietLabel, MealLabel, Recipe
from app.storage.meal_plan_storage import delete_meal, load_meal_plan, update_meal

st.set_page_config(page_title="Plate & Plan", page_icon="🍽️", layout="wide", initial_sidebar_state="expanded")

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
if "meal_selector" not in st.session_state:
    st.session_state.meal_selector = None  # (date_str, meal_type) when selecting a meal
if "custom_meal_input" not in st.session_state:
    st.session_state.custom_meal_input = None  # (date_str, meal_type) when entering custom text


def get_week_dates(offset: int = 0) -> list[date]:
    """Get dates for the current week (Monday to Sunday)."""
    today = datetime.now(tz=UTC).date() + timedelta(weeks=offset)
    monday = today - timedelta(days=today.weekday())
    return [monday + timedelta(days=i) for i in range(7)]


def load_recipes() -> list[tuple[str, Recipe]]:
    """Load all recipes from Firestore."""
    try:
        from app.storage.recipe_storage import get_all_recipes

        return get_all_recipes()
    except Exception:
        return []


# Sidebar navigation with logo and sections
logo_path = Path(__file__).parent / "assets" / "images" / "logo.png"
if logo_path.exists():
    st.sidebar.image(str(logo_path), use_container_width=True)
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
        use_container_width=True,
        type="primary" if is_current else "secondary",
        icon=f":material/{page_info['icon']}:" if not is_current else None,
    ):
        st.session_state.current_page = page_name
        # Clear selected recipe when navigating to Recipes page to show the list
        if page_name == "Recipes":
            st.session_state.selected_recipe = None
        st.rerun()

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
        if st.button("Browse Recipes", use_container_width=True):
            st.session_state.current_page = "Recipes"
            st.rerun()

    with col2:
        st.markdown("### :material/calendar_month: This Week")
        week_dates = get_week_dates()
        planned_meals = sum(
            1 for d in week_dates for mt in MealType if (d.isoformat(), mt.value) in st.session_state.meal_plan
        )
        total_slots = len(week_dates) * 3  # breakfast, lunch, dinner
        st.metric("Meals Planned", f"{planned_meals}/{total_slots}")
        if st.button("Plan Meals", use_container_width=True):
            st.session_state.current_page = "Meal Plan"
            st.rerun()

    with col3:
        st.markdown("### :material/shopping_cart: Shopping")
        st.metric("Items to Buy", len(st.session_state.grocery_list.get_unchecked()))
        if st.button("View List", use_container_width=True):
            st.session_state.current_page = "Grocery List"
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
                ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink"],
                key="home_meal_label",
            )

        if st.button("Import", type="primary", key="home_import") and url:
            with st.spinner("Extracting recipe..."):
                try:
                    from app.services.recipe_scraper import scrape_recipe
                    from app.storage.recipe_storage import save_recipe

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
                    st.rerun()
        else:
            st.info("No dinner planned for today")
            if st.button("Plan Tonight's Dinner"):
                st.session_state.current_page = "Meal Plan"
                st.rerun()

# =============================================================================
# RECIPES PAGE
# =============================================================================
elif page == "Recipes":
    st.markdown(f"<h1>{svg_icon('book', size=32)} Recipe Library</h1>", unsafe_allow_html=True)

    # Check if we're viewing a specific recipe
    if st.session_state.selected_recipe:
        recipe_id, recipe = st.session_state.selected_recipe

        # Back button
        if st.button("← Back to Recipes"):
            st.session_state.selected_recipe = None
            st.rerun()

        st.divider()

        # Recipe detail view
        col1, col2 = st.columns([1, 2])

        with col1:
            if recipe.image_url:
                st.image(recipe.image_url, use_container_width=True)

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
                }
                st.write(f"{meal_icons.get(recipe.meal_label.value, '')} {recipe.meal_label.value.title()}")

            if recipe.url and recipe.url != "manual-entry":
                st.markdown(f"[:material/link: Original Recipe]({recipe.url})")

        with col2:
            st.markdown(f"## {recipe.title}")

            st.markdown("### :material/grocery: Ingredients")
            for idx, ing in enumerate(recipe.ingredients):
                st.checkbox(ing, key=f"ing_{recipe_id}_{idx}_{ing[:20]}")

            st.markdown("### :material/format_list_numbered: Instructions")
            for i, step in enumerate(recipe.instructions, 1):
                st.markdown(f"**Step {i}:** {step}")

    else:
        # Tabs for different views
        tab1, tab2 = st.tabs([":material/folder: All Recipes", ":material/add: Add Recipe"])

        with tab1:
            recipes = load_recipes()

            # Search and filter
            filter_col1, filter_col2, filter_col3, filter_col4 = st.columns([3, 1, 1, 1])
            with filter_col1:
                search = st.text_input(":material/search: Search recipes", placeholder="Search by name...")
            with filter_col2:
                diet_filter = st.selectbox(":material/nutrition:", ["All", "Veggie", "Fish", "Meat"], key="lib_diet")
            with filter_col3:
                meal_filter = st.selectbox(
                    ":material/restaurant:", ["All", "Breakfast", "Starter", "Meal", "Dessert", "Drink"], key="lib_meal"
                )
            with filter_col4:
                sort_by = st.selectbox("Sort by", ["Newest", "A-Z", "Z-A"])

            # Filter recipes
            if search:
                recipes = [(rid, r) for rid, r in recipes if search.lower() in r.title.lower()]
            if diet_filter != "All":
                diet_val = diet_filter.lower()
                recipes = [(rid, r) for rid, r in recipes if r.diet_label and r.diet_label.value == diet_val]
            if meal_filter != "All":
                meal_val = meal_filter.lower()
                recipes = [(rid, r) for rid, r in recipes if r.meal_label and r.meal_label.value == meal_val]

            # Sort recipes
            if sort_by == "A-Z":
                recipes = sorted(recipes, key=lambda x: x[1].title)
            elif sort_by == "Z-A":
                recipes = sorted(recipes, key=lambda x: x[1].title, reverse=True)

            st.caption(f"Showing {len(recipes)} recipes")

            if recipes:
                # Display as grid
                cols = st.columns(3)
                for i, (recipe_id, recipe) in enumerate(recipes):
                    with cols[i % 3], st.container(border=True):
                        if recipe.image_url:
                            st.image(recipe.image_url, use_container_width=True)
                        else:
                            st.markdown(":material/restaurant:", unsafe_allow_html=True)

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
                            if st.button(
                                "", key=f"view_{recipe_id}", use_container_width=True, icon=":material/menu_book:"
                            ):
                                st.session_state.selected_recipe = (recipe_id, recipe)
                                st.rerun()
                        with bcol2:
                            if st.button(
                                "", key=f"del_{recipe_id}", use_container_width=True, icon=":material/delete:"
                            ):
                                try:
                                    from app.storage.recipe_storage import delete_recipe

                                    delete_recipe(recipe_id)
                                    st.rerun()
                                except Exception as e:
                                    st.error(str(e))
            else:
                st.info("No recipes yet! Add your first recipe in the 'Add Recipe' tab.")

        with tab2:
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
                    ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink"],
                    key="url_meal_label",
                )

            if st.button("", type="primary", icon=":material/search:") and url:
                with st.spinner("Extracting recipe..."):
                    try:
                        from app.services.recipe_scraper import scrape_recipe

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
                    if recipe.image_url:
                        st.image(recipe.image_url, width=250)
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
                    if st.button("", type="primary", use_container_width=True, icon=":material/save:"):
                        try:
                            from app.storage.recipe_storage import save_recipe

                            save_recipe(recipe)
                            st.success("Recipe saved!")
                            st.session_state.temp_recipe = None
                            st.rerun()
                        except Exception as e:
                            st.error(f"Could not save: {e}")
                with col2:
                    if st.button("", use_container_width=True, icon=":material/delete:"):
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
                        ["None", "Breakfast", "Starter", "Meal", "Dessert", "Drink"],
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
                    "Save Recipe", type="primary", use_container_width=True, icon=":material/save:"
                )

                if submitted:
                    if not manual_title or not manual_ingredients or not manual_instructions:
                        st.error("Please fill in all required fields (Title, Ingredients, Instructions)")
                    else:
                        ingredients_list = [
                            ing.strip() for ing in manual_ingredients.strip().split("\n") if ing.strip()
                        ]
                        instructions_list = [
                            inst.strip() for inst in manual_instructions.strip().split("\n") if inst.strip()
                        ]

                        manual_recipe = Recipe(
                            title=manual_title,
                            url="manual-entry",
                            ingredients=ingredients_list,
                            instructions=instructions_list,
                            image_url=manual_image_url if manual_image_url else None,
                            servings=manual_servings,
                            prep_time=manual_prep_time if manual_prep_time > 0 else None,
                            cook_time=manual_cook_time if manual_cook_time > 0 else None,
                            diet_label=DietLabel(manual_diet_label.lower()) if manual_diet_label != "None" else None,
                            meal_label=MealLabel(manual_meal_label.lower()) if manual_meal_label != "None" else None,
                        )

                        try:
                            from app.storage.recipe_storage import save_recipe

                            save_recipe(manual_recipe)
                            st.success(f":material/check_circle: Saved: **{manual_title}**")
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
        if st.button("", help="Previous Week", icon=":material/chevron_left:", use_container_width=True):
            st.session_state.week_offset -= 1
            st.rerun()
    with nav_col2:
        week_dates = get_week_dates(st.session_state.week_offset)
        week_start = week_dates[0].strftime("%b %d")
        week_end = week_dates[-1].strftime("%b %d, %Y")
        st.markdown(
            f"<h3 style='text-align: center; margin: 0;'>{week_start} - {week_end}</h3>", unsafe_allow_html=True
        )
        if st.session_state.week_offset != 0 and st.button("Today", use_container_width=True):
            st.session_state.week_offset = 0
            st.rerun()
    with nav_col3:
        if st.button("", help="Next Week", icon=":material/chevron_right:", use_container_width=True):
            st.session_state.week_offset += 1
            st.rerun()

    st.divider()

    # Load recipes for selection
    recipes = load_recipes()
    recipe_dict = dict(recipes)
    recipe_options = {rid: r.title for rid, r in recipes}

    # Weekly grid
    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    weekend_names = ["Sat", "Sun"]
    meal_types = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]
    today = datetime.now(tz=UTC).date()
    title_max_length = 25

    # Use all recipes for random selection (no meal_label filtering)
    all_recipes = recipes

    def render_custom_input_tile(key: tuple, col_key: str, d: date, meal_type: MealType) -> None:
        """Render the custom text input form for a meal tile."""
        with st.container(border=True, height=450):
            st.markdown("<div style='height: 300px;'></div>", unsafe_allow_html=True)
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
        with st.container(border=True, height=450):
            st.markdown(
                f"<div style='height: 300px; display: flex; align-items: center; justify-content: center; "
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

        with st.container(border=True, height=450):
            if recipe.image_url:
                st.image(recipe.image_url, use_container_width=True)
            title_display = (
                recipe.title[:title_max_length] + "..." if len(recipe.title) > title_max_length else recipe.title
            )
            st.caption(title_display)

            # Portion controls
            _, pcol1, pcol2, pcol3, _ = st.columns([2, 1, 1, 1, 2])
            with pcol1:
                if (
                    st.button(
                        "", key=f"dec_port_{col_key}_{d}_{meal_type.value}", help="Less", icon=":material/remove:"
                    )
                    and current_portions > 1
                ):
                    st.session_state.meal_portions[key] = current_portions - 1
                    st.rerun()
            with pcol2:
                st.caption(f":material/group: {current_portions}")
            with pcol3:
                if st.button("", key=f"inc_port_{col_key}_{d}_{meal_type.value}", help="More", icon=":material/add:"):
                    st.session_state.meal_portions[key] = current_portions + 1
                    st.rerun()

            btn_col1, _, btn_col2 = st.columns([1, 3, 1])
            with btn_col1:
                if st.button(
                    "", key=f"view_{col_key}_{d}_{meal_type.value}", help="View recipe", icon=":material/visibility:"
                ):
                    st.session_state.selected_recipe = (recipe_id, recipe)
                    st.session_state.current_page = "Recipes"
                    st.rerun()
            with btn_col2:
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

    def render_empty_tile(key: tuple, col_key: str, d: date, meal_type: MealType) -> None:
        """Render an empty meal tile with action buttons."""
        import random

        with st.container(border=True, height=450):
            st.markdown("<div style='height: 180px;'></div>", unsafe_allow_html=True)
            _, btn_col1, btn_col2, btn_col3, _ = st.columns([1, 1, 1, 1, 1])
            with btn_col1:
                if st.button(
                    "", key=f"add_{col_key}_{d}_{meal_type.value}", help="Select recipe", icon=":material/add:"
                ):
                    st.session_state.meal_selector = (d.isoformat(), meal_type.value)
                    st.session_state.current_page = "Recipes"
                    st.rerun()
            with btn_col2:
                if st.button(
                    "", key=f"random_{col_key}_{d}_{meal_type.value}", help="Random recipe", icon=":material/casino:"
                ):
                    if all_recipes:
                        random_rid, _ = random.choice(all_recipes)
                        st.session_state.meal_plan[key] = random_rid
                        update_meal(d.isoformat(), meal_type.value, random_rid)
                        st.rerun()
                    else:
                        st.toast("No recipes available!")
            with btn_col3:
                if st.button(
                    "", key=f"custom_{col_key}_{d}_{meal_type.value}", help="Write custom", icon=":material/edit:"
                ):
                    st.session_state.custom_meal_input = key
                    st.rerun()

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
    # WEEKDAYS (Mon-Fri) - First Row
    st.markdown("#### Weekdays")

    # Header row for weekdays
    header_cols = st.columns([0.5] + [1] * 5)
    with header_cols[0]:
        st.write("")
    for i, (day, d) in enumerate(zip(weekday_names, week_dates[:5], strict=False)):
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

    # Meal rows for weekdays
    for meal_type in meal_types:
        row_cols = st.columns([0.5] + [1] * 5)
        with row_cols[0]:
            st.markdown(
                f"<span style='color: #1a1a1a; font-weight: 600;'>{meal_type.value.title()}</span>",
                unsafe_allow_html=True,
            )

        for i, d in enumerate(week_dates[:5]):
            with row_cols[i + 1]:
                render_meal_tile(d, meal_type, "weekday")

    st.divider()

    # WEEKEND (Sat-Sun) - Second Row
    st.markdown("#### Weekend")

    # Header row for weekend (same total width as weekdays)
    weekend_header_cols = st.columns([0.5] + [1] * 5)
    with weekend_header_cols[0]:
        st.write("")
    for i, (day, d) in enumerate(zip(weekend_names, week_dates[5:], strict=False)):
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

    # Meal rows for weekend (same total width as weekdays)
    for meal_type in meal_types:
        weekend_row_cols = st.columns([0.5] + [1] * 5)
        with weekend_row_cols[0]:
            st.markdown(
                f"<span style='color: #1a1a1a; font-weight: 600;'>{meal_type.value.title()}</span>",
                unsafe_allow_html=True,
            )

        for i, d in enumerate(week_dates[5:]):
            with weekend_row_cols[i + 1]:
                render_meal_tile(d, meal_type, "weekend")

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
        for d in week_dates:
            for mt in meal_types:
                key = (d.isoformat(), mt.value)
                if key in st.session_state.meal_plan:
                    unique_recipes.add(st.session_state.meal_plan[key])

        if unique_recipes:
            st.write("**Recipes this week:**")
            for rid in unique_recipes:
                title = recipe_options.get(rid, "Unknown")
                st.write(f"- {title}")

    with col2:
        st.subheader(":material/shopping_cart: Generate Grocery List")
        st.write("Create a shopping list from your planned meals.")

        if st.button(":material/shopping_cart: Generate List", type="primary", use_container_width=True):
            if not unique_recipes:
                st.warning("Plan some meals first!")
            else:
                # Generate grocery list from planned recipes
                grocery_list = GroceryList()
                recipe_dict = dict(recipes)

                for rid in unique_recipes:
                    if rid in recipe_dict:
                        recipe = recipe_dict[rid]
                        for ing in recipe.ingredients:
                            item = GroceryItem(name=ing, recipe_sources=[recipe.title])
                            grocery_list.add_item(item)

                st.session_state.grocery_list = grocery_list
                st.success(f":material/check_circle: Generated list with {len(grocery_list.items)} items!")

        if st.button("Clear Week", use_container_width=True, icon=":material/delete_sweep:"):
            for d in week_dates:
                for mt in meal_types:
                    key = (d.isoformat(), mt.value)
                    if key in st.session_state.meal_plan:
                        del st.session_state.meal_plan[key]
                        delete_meal(d.isoformat(), mt.value)
            st.rerun()

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
            if st.button("Check All", use_container_width=True, icon=":material/check_box:"):
                for item in grocery_list.items:
                    item.checked = True
                st.rerun()
        with col2:
            if st.button("Uncheck All", use_container_width=True, icon=":material/check_box_outline_blank:"):
                for item in grocery_list.items:
                    item.checked = False
                st.rerun()
        with col3:
            if st.button("Clear List", use_container_width=True, icon=":material/delete:"):
                st.session_state.grocery_list = GroceryList()
                st.rerun()

        st.divider()

        # Category icons
        category_icons = {
            GroceryCategory.PRODUCE: ":material/eco:",
            GroceryCategory.MEAT_SEAFOOD: ":material/kebab_dining:",
            GroceryCategory.DAIRY: ":material/water_drop:",
            GroceryCategory.BAKERY: ":material/bakery_dining:",
            GroceryCategory.PANTRY: ":material/kitchen:",
            GroceryCategory.FROZEN: ":material/ac_unit:",
            GroceryCategory.BEVERAGES: ":material/local_cafe:",
            GroceryCategory.OTHER: ":material/inventory_2:",
        }

        # Display by category - unchecked items first, checked items at bottom
        st.subheader(":material/checklist: Shopping List")

        # Sort items: unchecked first, then checked
        unchecked_items = [(i, item) for i, item in enumerate(grocery_list.items) if not item.checked]
        checked_items_list = [(i, item) for i, item in enumerate(grocery_list.items) if item.checked]
        sorted_items = unchecked_items + checked_items_list

        for original_idx, item in sorted_items:
            col1, col2 = st.columns([0.05, 0.95])
            with col1:
                new_checked = st.checkbox(
                    "", value=item.checked, key=f"check_{original_idx}", label_visibility="collapsed"
                )
                if new_checked != grocery_list.items[original_idx].checked:
                    grocery_list.items[original_idx].checked = new_checked
                    st.rerun()  # Rerun to move item to correct position
            with col2:
                source_text = f"  —  *From: {', '.join(item.recipe_sources)}*" if item.recipe_sources else ""

                if item.checked:
                    st.markdown(f"~~{item.name}~~{source_text}")
                else:
                    st.markdown(f"{item.name}{source_text}")

        # Add custom item
        st.divider()
        st.subheader(":material/add: Add Item")
        new_item = st.text_input("Item name", placeholder="e.g., Milk, Bread...")
        if st.button("Add", icon=":material/add_shopping_cart:") and new_item:
            grocery_list.items.append(GroceryItem(name=new_item))
            st.rerun()

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
            st.rerun()
        st.divider()

    recipes = load_recipes()

    if not recipes:
        st.warning("No recipes yet! Add some recipes first.")
        if st.button("Go to Recipes", use_container_width=True):
            st.session_state.current_page = "Recipes"
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

        # Display recipes in grid
        if filtered_recipes:
            cols = st.columns(3)
            for i, (recipe_id, recipe) in enumerate(filtered_recipes):
                with cols[i % 3], st.container(border=True):
                    if recipe.image_url:
                        st.image(recipe.image_url, use_container_width=True)
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
                            "Select",
                            key=f"browse_select_{recipe_id}",
                            use_container_width=True,
                            icon=":material/check:",
                        ):
                            sel_date, sel_meal = st.session_state.meal_selector
                            st.session_state.meal_plan[(sel_date, sel_meal)] = recipe_id
                            update_meal(sel_date, sel_meal, recipe_id)
                            st.session_state.meal_selector = None
                            st.session_state.current_page = "Meal Plan"
                            st.rerun()
                    elif st.button(
                        "", key=f"browse_view_{recipe_id}", use_container_width=True, icon=":material/menu_book:"
                    ):
                        st.session_state.selected_recipe = (recipe_id, recipe)
                        st.session_state.current_page = "Recipes"
                        st.rerun()
        else:
            st.info("No recipes match your filters.")
