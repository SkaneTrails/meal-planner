"""Meal Planner - Recipe collector and weekly meal planner inspired by Samsung Food."""

import sys
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import streamlit as st

from app.models.grocery_list import GroceryCategory, GroceryItem, GroceryList
from app.models.meal_plan import MealType
from app.models.recipe import DietLabel, MealLabel, Recipe

st.set_page_config(page_title="Meal Planner", page_icon="🍽️", layout="wide", initial_sidebar_state="expanded")

# Initialize session state
if "meal_plan" not in st.session_state:
    st.session_state.meal_plan = {}  # {(date_str, meal_type): recipe_id}
if "grocery_list" not in st.session_state:
    st.session_state.grocery_list = GroceryList()
if "selected_recipe" not in st.session_state:
    st.session_state.selected_recipe = None
if "week_offset" not in st.session_state:
    st.session_state.week_offset = 0
if "current_page" not in st.session_state:
    st.session_state.current_page = "🏠 Home"
if "meal_selector" not in st.session_state:
    st.session_state.meal_selector = None  # (date_str, meal_type) when selecting a meal


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


# Sidebar navigation with sections instead of radio buttons
st.sidebar.title("🍽️ Meal Planner")
st.sidebar.markdown("*Your personal recipe & meal planning assistant*")
st.sidebar.divider()

pages = ["🏠 Home", "📚 Recipes", "📅 Meal Plan", "🛒 Grocery List"]

for p in pages:
    is_current = st.session_state.current_page == p
    if st.sidebar.button(
        p,
        key=f"nav_{p}",
        use_container_width=True,
        type="primary" if is_current else "secondary",
    ):
        st.session_state.current_page = p
        st.rerun()

page = st.session_state.current_page

st.sidebar.divider()
st.sidebar.markdown("Made with ❤️ and Streamlit")

# =============================================================================
# HOME PAGE
# =============================================================================
if page == "🏠 Home":
    st.title("🍽️ Welcome to Meal Planner")
    st.markdown("Plan your meals, organize recipes, and generate smart grocery lists.")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("### 📚 Recipe Library")
        recipes = load_recipes()
        st.metric("Saved Recipes", len(recipes))
        if st.button("Browse Recipes", use_container_width=True):
            st.session_state.current_page = "📚 Recipes"
            st.rerun()

    with col2:
        st.markdown("### 📅 This Week")
        week_dates = get_week_dates()
        planned_meals = sum(
            1 for d in week_dates for mt in MealType if (d.isoformat(), mt.value) in st.session_state.meal_plan
        )
        total_slots = len(week_dates) * 3  # breakfast, lunch, dinner
        st.metric("Meals Planned", f"{planned_meals}/{total_slots}")
        if st.button("Plan Meals", use_container_width=True):
            st.session_state.current_page = "📅 Meal Plan"
            st.rerun()

    with col3:
        st.markdown("### 🛒 Shopping")
        st.metric("Items to Buy", len(st.session_state.grocery_list.get_unchecked()))
        if st.button("View List", use_container_width=True):
            st.session_state.current_page = "🛒 Grocery List"
            st.rerun()

    st.divider()

    # Quick actions
    st.subheader("Quick Actions")
    qcol1, qcol2 = st.columns(2)

    with qcol1:
        st.markdown("#### 🔗 Import Recipe from URL")
        url = st.text_input("Paste a recipe URL", placeholder="https://www.ica.se/recept/...", key="home_url")
        if st.button("Import", type="primary", key="home_import") and url:
            with st.spinner("Extracting recipe..."):
                try:
                    from app.services.recipe_scraper import scrape_recipe
                    from app.storage.recipe_storage import save_recipe

                    recipe = scrape_recipe(url)
                    if recipe:
                        save_recipe(recipe)
                        st.success(f"✅ Imported: **{recipe.title}**")
                    else:
                        st.error("Could not extract recipe from this URL")
                except Exception as e:
                    st.error(f"Error: {e}")

    with qcol2:
        st.markdown("#### 🍳 What's for dinner?")
        today = datetime.now(tz=UTC).date()
        dinner_key = (today.isoformat(), MealType.DINNER.value)
        if dinner_key in st.session_state.meal_plan:
            recipe_id = st.session_state.meal_plan[dinner_key]
            recipes = load_recipes()
            recipe_dict = dict(recipes)
            if recipe_id in recipe_dict:
                recipe = recipe_dict[recipe_id]
                st.success(f"Tonight: **{recipe.title}**")
                if st.button("View Recipe 📖"):
                    st.session_state.selected_recipe = (recipe_id, recipe)
                    st.session_state.current_page = "📚 Recipes"
                    st.rerun()
        else:
            st.info("No dinner planned for today")
            if st.button("Plan Tonight's Dinner"):
                st.session_state.current_page = "📅 Meal Plan"
                st.rerun()

# =============================================================================
# RECIPES PAGE
# =============================================================================
elif page == "📚 Recipes":
    st.title("📚 Recipe Library")

    # Tabs for different views
    tab1, tab2 = st.tabs(["🗂️ All Recipes", "+ Add Recipe"])

    with tab1:
        recipes = load_recipes()

        # Search and filter
        col1, col2 = st.columns([3, 1])
        with col1:
            search = st.text_input("🔍 Search recipes", placeholder="Search by name...")
        with col2:
            sort_by = st.selectbox("Sort by", ["Newest", "A-Z", "Z-A"])

        # Filter recipes
        if search:
            recipes = [(rid, r) for rid, r in recipes if search.lower() in r.title.lower()]

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
                        st.markdown("🍽️", unsafe_allow_html=True)

                    st.markdown(f"**{recipe.title}**")

                    # Show labels
                    labels = []
                    if recipe.diet_label:
                        diet_icons = {"veggie": "🥬", "fish": "🐟", "meat": "🥩"}
                        labels.append(diet_icons.get(recipe.diet_label.value, "") + recipe.diet_label.value)
                    if recipe.meal_label:
                        meal_icons = {
                            "breakfast": "🌅",
                            "starter": "🥗",
                            "meal": "🍽️",
                            "dessert": "🍰",
                            "drink": "🥤",
                        }
                        labels.append(meal_icons.get(recipe.meal_label.value, "") + recipe.meal_label.value)
                    if labels:
                        st.caption(" | ".join(labels))

                    time_info = []
                    if recipe.prep_time:
                        time_info.append(f"⏱️ Prep: {recipe.prep_time}m")
                    if recipe.cook_time:
                        time_info.append(f"🍳 Cook: {recipe.cook_time}m")
                    if time_info:
                        st.caption(" | ".join(time_info))

                    if recipe.servings:
                        st.caption(f"👥 Serves {recipe.servings}")

                    bcol1, bcol2 = st.columns(2)
                    with bcol1:
                        if st.button("📖 View", key=f"view_{recipe_id}", use_container_width=True):
                            st.session_state.selected_recipe = (recipe_id, recipe)
                            st.rerun()
                    with bcol2:
                        if st.button("🗑️", key=f"del_{recipe_id}", use_container_width=True):
                            try:
                                from app.storage.recipe_storage import delete_recipe

                                delete_recipe(recipe_id)
                                st.rerun()
                            except Exception as e:
                                st.error(str(e))

            # Recipe detail modal
            if st.session_state.selected_recipe:
                recipe_id, recipe = st.session_state.selected_recipe
                with st.expander(f"📖 {recipe.title}", expanded=True):
                    col1, col2 = st.columns([1, 2])

                    with col1:
                        if recipe.image_url:
                            st.image(recipe.image_url, use_container_width=True)

                        st.markdown("**Quick Info**")
                        if recipe.servings:
                            st.write(f"👥 Serves: {recipe.servings}")
                        if recipe.prep_time:
                            st.write(f"⏱️ Prep: {recipe.prep_time} min")
                        if recipe.cook_time:
                            st.write(f"🍳 Cook: {recipe.cook_time} min")
                        if recipe.total_time_calculated:
                            st.write(f"⏰ Total: {recipe.total_time_calculated} min")

                        # Show labels
                        if recipe.diet_label:
                            diet_icons = {"veggie": "🥬", "fish": "🐟", "meat": "🥩"}
                            st.write(f"{diet_icons.get(recipe.diet_label.value, '')} {recipe.diet_label.value.title()}")
                        if recipe.meal_label:
                            meal_icons = {
                                "breakfast": "🌅",
                                "starter": "🥗",
                                "meal": "🍽️",
                                "dessert": "🍰",
                                "drink": "🥤",
                            }
                            st.write(f"{meal_icons.get(recipe.meal_label.value, '')} {recipe.meal_label.value.title()}")

                        st.markdown(f"[🔗 Original Recipe]({recipe.url})")

                    with col2:
                        st.markdown("### 🥗 Ingredients")
                        for ing in recipe.ingredients:
                            st.checkbox(ing, key=f"ing_{recipe_id}_{ing[:20]}")

                        st.markdown("### 📝 Instructions")
                        for i, step in enumerate(recipe.instructions, 1):
                            st.markdown(f"**Step {i}:** {step}")

                    if st.button("Close"):
                        st.session_state.selected_recipe = None
                        st.rerun()
        else:
            st.info("No recipes yet! Add your first recipe in the 'Add Recipe' tab.")

    with tab2:
        st.subheader("Import from URL")
        url = st.text_input("Recipe URL", placeholder="https://www.allrecipes.com/recipe/...")

        if st.button("🔍 Extract Recipe", type="primary") and url:
            with st.spinner("Extracting recipe..."):
                try:
                    from app.services.recipe_scraper import scrape_recipe

                    recipe = scrape_recipe(url)
                    if recipe:
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
                st.write(f"**Servings:** {recipe.servings or 'N/A'}")
                st.write(f"**Prep:** {recipe.prep_time or 'N/A'} min | **Cook:** {recipe.cook_time or 'N/A'} min")

            with st.expander("Ingredients"):
                for ing in recipe.ingredients:
                    st.write(f"- {ing}")

            with st.expander("Instructions"):
                for i, step in enumerate(recipe.instructions, 1):
                    st.write(f"{i}. {step}")

            col1, col2 = st.columns(2)
            with col1:
                if st.button("💾 Save Recipe", type="primary", use_container_width=True):
                    try:
                        from app.storage.recipe_storage import save_recipe

                        save_recipe(recipe)
                        st.success("Recipe saved!")
                        st.session_state.temp_recipe = None
                        st.rerun()
                    except Exception as e:
                        st.error(f"Could not save: {e}")
            with col2:
                if st.button("🗑️ Discard", use_container_width=True):
                    st.session_state.temp_recipe = None
                    st.rerun()

        st.divider()

        # Manual recipe entry
        st.subheader("✍️ Add Recipe Manually")

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

            # Labels (optional)
            st.markdown("**Labels (optional)**")
            label_col1, label_col2 = st.columns(2)
            with label_col1:
                diet_label_option = st.selectbox(
                    "🥗 Diet Type",
                    ["None", "Veggie", "Fish", "Meat"],
                    key="manual_diet_label",
                )
            with label_col2:
                meal_label_option = st.selectbox(
                    "🍽️ Meal Type",
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

            submitted = st.form_submit_button("💾 Save Recipe", type="primary", use_container_width=True)

            if submitted:
                if not manual_title or not manual_ingredients or not manual_instructions:
                    st.error("Please fill in all required fields (Title, Ingredients, Instructions)")
                else:
                    ingredients_list = [ing.strip() for ing in manual_ingredients.strip().split("\n") if ing.strip()]
                    instructions_list = [
                        inst.strip() for inst in manual_instructions.strip().split("\n") if inst.strip()
                    ]

                    # Convert label selections to enum values
                    diet_label_value = None
                    if diet_label_option != "None":
                        diet_label_value = DietLabel(diet_label_option.lower())

                    meal_label_value = None
                    if meal_label_option != "None":
                        meal_label_value = MealLabel(meal_label_option.lower())

                    manual_recipe = Recipe(
                        title=manual_title,
                        url="manual-entry",
                        ingredients=ingredients_list,
                        instructions=instructions_list,
                        image_url=manual_image_url if manual_image_url else None,
                        servings=manual_servings,
                        prep_time=manual_prep_time if manual_prep_time > 0 else None,
                        cook_time=manual_cook_time if manual_cook_time > 0 else None,
                        diet_label=diet_label_value,
                        meal_label=meal_label_value,
                    )

                    try:
                        from app.storage.recipe_storage import save_recipe

                        save_recipe(manual_recipe)
                        st.success(f"✅ Saved: **{manual_title}**")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Could not save: {e}")

# =============================================================================
# MEAL PLAN PAGE
# =============================================================================
elif page == "📅 Meal Plan":
    st.title("📅 Weekly Meal Plan")

    # Week navigation
    col1, col2, col3 = st.columns([1, 2, 1])
    with col1:
        if st.button("← Previous Week"):
            st.session_state.week_offset -= 1
            st.rerun()
    with col2:
        week_dates = get_week_dates(st.session_state.week_offset)
        week_start = week_dates[0].strftime("%b %d")
        week_end = week_dates[-1].strftime("%b %d, %Y")
        st.markdown(f"### {week_start} - {week_end}")
        if st.session_state.week_offset != 0 and st.button("Today", use_container_width=True):
            st.session_state.week_offset = 0
            st.rerun()
    with col3:
        if st.button("Next Week →"):
            st.session_state.week_offset += 1
            st.rerun()

    st.divider()

    # Load recipes for selection
    recipes = load_recipes()
    recipe_dict = dict(recipes)
    recipe_options = {rid: r.title for rid, r in recipes}

    # Meal type icons
    meal_icons = {MealType.BREAKFAST: "🌅", MealType.LUNCH: "☀️", MealType.DINNER: "🌙", MealType.SNACK: "🍎"}

    # Weekly grid
    weekday_names = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    weekend_names = ["Sat", "Sun"]
    meal_types = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]
    today = datetime.now(tz=UTC).date()

    # Helper function to render a meal tile
    def render_meal_tile(d: date, meal_type: MealType, col_key: str):
        key = (d.isoformat(), meal_type.value)
        current_recipe_id = st.session_state.meal_plan.get(key, "")

        if current_recipe_id and current_recipe_id in recipe_dict:
            recipe = recipe_dict[current_recipe_id]
            with st.container(border=True):
                if recipe.image_url:
                    st.image(recipe.image_url, use_container_width=True)
                st.caption(recipe.title[:25] + "..." if len(recipe.title) > 25 else recipe.title)
                if st.button("❌", key=f"clear_{col_key}_{d}_{meal_type.value}", help="Remove"):
                    del st.session_state.meal_plan[key]
                    st.rerun()
        else:
            with st.container(border=True):
                st.markdown(
                    "<div style='height: 60px; display: flex; align-items: center; justify-content: center; "
                    "color: #888;'>Empty</div>",
                    unsafe_allow_html=True,
                )
                if st.button("➕", key=f"add_{col_key}_{d}_{meal_type.value}", help="Add meal"):
                    st.session_state.meal_selector = (d.isoformat(), meal_type.value)
                    st.session_state.current_page = "📖 Browse Recipes"
                    st.rerun()

    # Show summary directly without meal selector popup (now handled on browse page)
    # WEEKDAYS (Mon-Fri) - First Row
    st.markdown("#### Weekdays")

    # Header row for weekdays
    header_cols = st.columns([1] + [1] * 5)
    with header_cols[0]:
        st.write("")
    for i, (day, d) in enumerate(zip(weekday_names, week_dates[:5], strict=False)):
        with header_cols[i + 1]:
            is_today = d == today
            if is_today:
                st.markdown(
                    f"<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); "
                    f"padding: 8px; border-radius: 8px; text-align: center; color: white;'>"
                    f"<strong>{day}</strong><br/><strong>{d.day}</strong> 📍</div>",
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(f"**{day}**  \n{d.day}")

    # Meal rows for weekdays
    for meal_type in meal_types:
        row_cols = st.columns([1] + [1] * 5)
        with row_cols[0]:
            st.markdown(f"{meal_icons[meal_type]} **{meal_type.value.title()}**")

        for i, d in enumerate(week_dates[:5]):
            with row_cols[i + 1]:
                render_meal_tile(d, meal_type, "weekday")

    st.divider()

    # WEEKEND (Sat-Sun) - Second Row
    st.markdown("#### Weekend")

    # Header row for weekend
    weekend_header_cols = st.columns([1] + [1] * 2 + [2])  # Extra space to balance
    with weekend_header_cols[0]:
        st.write("")
    for i, (day, d) in enumerate(zip(weekend_names, week_dates[5:], strict=False)):
        with weekend_header_cols[i + 1]:
            is_today = d == today
            if is_today:
                st.markdown(
                    f"<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); "
                    f"padding: 8px; border-radius: 8px; text-align: center; color: white;'>"
                    f"<strong>{day}</strong><br/><strong>{d.day}</strong> 📍</div>",
                    unsafe_allow_html=True,
                )
            else:
                st.markdown(f"**{day}**  \n{d.day}")

    # Meal rows for weekend
    for meal_type in meal_types:
        weekend_row_cols = st.columns([1] + [1] * 2 + [2])
        with weekend_row_cols[0]:
            st.markdown(f"{meal_icons[meal_type]} **{meal_type.value.title()}**")

        for i, d in enumerate(week_dates[5:]):
            with weekend_row_cols[i + 1]:
                render_meal_tile(d, meal_type, "weekend")

    st.divider()

    # Summary and actions
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 Week Summary")
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
        st.subheader("🛒 Generate Grocery List")
        st.write("Create a shopping list from your planned meals.")

        if st.button("🛒 Generate List", type="primary", use_container_width=True):
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
                st.success(f"Generated list with {len(grocery_list.items)} items!")

        if st.button("Clear Week", use_container_width=True):
            for d in week_dates:
                for mt in meal_types:
                    key = (d.isoformat(), mt.value)
                    if key in st.session_state.meal_plan:
                        del st.session_state.meal_plan[key]
            st.rerun()

# =============================================================================
# GROCERY LIST PAGE
# =============================================================================
elif page == "🛒 Grocery List":
    st.title("🛒 Grocery List")

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
            if st.button("✅ Check All", use_container_width=True):
                for item in grocery_list.items:
                    item.checked = True
                st.rerun()
        with col2:
            if st.button("⬜ Uncheck All", use_container_width=True):
                for item in grocery_list.items:
                    item.checked = False
                st.rerun()
        with col3:
            if st.button("🗑️ Clear List", use_container_width=True):
                st.session_state.grocery_list = GroceryList()
                st.rerun()

        st.divider()

        # Category icons
        category_icons = {
            GroceryCategory.PRODUCE: "🥬",
            GroceryCategory.MEAT_SEAFOOD: "🥩",
            GroceryCategory.DAIRY: "🥛",
            GroceryCategory.BAKERY: "🍞",
            GroceryCategory.PANTRY: "🥫",
            GroceryCategory.FROZEN: "❄️",
            GroceryCategory.BEVERAGES: "🥤",
            GroceryCategory.OTHER: "📦",
        }

        # Display by category - unchecked items first, checked items at bottom
        st.subheader("📝 Shopping List")

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
                if item.recipe_sources:
                    source_text = f"  —  *From: {', '.join(item.recipe_sources)}*"
                else:
                    source_text = ""

                if item.checked:
                    st.markdown(f"~~{item.name}~~{source_text}")
                else:
                    st.markdown(f"{item.name}{source_text}")

        # Add custom item
        st.divider()
        st.subheader("+ Add Item")
        new_item = st.text_input("Item name", placeholder="e.g., Milk, Bread...")
        if st.button("Add") and new_item:
            grocery_list.items.append(GroceryItem(name=new_item))
            st.rerun()

# =============================================================================
# BROWSE RECIPES PAGE (for meal selection)
# =============================================================================
elif page == "📖 Browse Recipes":
    st.title("📖 Browse Recipes")

    # Show context if selecting for a meal
    if st.session_state.meal_selector:
        sel_date, sel_meal = st.session_state.meal_selector
        st.info(f"📅 Selecting recipe for **{sel_meal.title()}** on **{sel_date}**")
        if st.button("← Cancel Selection"):
            st.session_state.meal_selector = None
            st.session_state.current_page = "📅 Meal Plan"
            st.rerun()
        st.divider()

    recipes = load_recipes()

    if not recipes:
        st.warning("No recipes yet! Add some recipes first.")
        if st.button("Go to Recipes", use_container_width=True):
            st.session_state.current_page = "📚 Recipes"
            st.rerun()
    else:
        # Filter options
        col1, col2, col3 = st.columns(3)
        with col1:
            search = st.text_input("🔍 Search", placeholder="Search recipes...")
        with col2:
            diet_filter = st.selectbox(
                "🥗 Diet",
                ["All", "Veggie", "Fish", "Meat"],
                key="browse_diet_filter",
            )
        with col3:
            meal_filter = st.selectbox(
                "🍽️ Type",
                ["All", "Breakfast", "Starter", "Meal", "Dessert", "Drink"],
                key="browse_meal_filter",
            )

        # Filter recipes
        filtered_recipes = recipes
        if search:
            filtered_recipes = [(rid, r) for rid, r in filtered_recipes if search.lower() in r.title.lower()]
        if diet_filter != "All":
            diet_value = diet_filter.lower()
            filtered_recipes = [
                (rid, r)
                for rid, r in filtered_recipes
                if r.diet_label and r.diet_label.value == diet_value
            ]
        if meal_filter != "All":
            meal_value = meal_filter.lower()
            filtered_recipes = [
                (rid, r)
                for rid, r in filtered_recipes
                if r.meal_label and r.meal_label.value == meal_value
            ]

        st.caption(f"Showing {len(filtered_recipes)} recipes")
        st.divider()

        # Display recipes in grid
        if filtered_recipes:
            cols = st.columns(3)
            for i, (recipe_id, recipe) in enumerate(filtered_recipes):
                with cols[i % 3]:
                    with st.container(border=True):
                        if recipe.image_url:
                            st.image(recipe.image_url, use_container_width=True)
                        else:
                            st.markdown(
                                "<div style='height: 150px; background: #f0f0f0; display: flex; "
                                "align-items: center; justify-content: center; font-size: 3em;'>🍽️</div>",
                                unsafe_allow_html=True,
                            )

                        st.markdown(f"**{recipe.title}**")

                        # Show labels
                        labels = []
                        if recipe.diet_label:
                            diet_icons = {"veggie": "🥬", "fish": "🐟", "meat": "🥩"}
                            labels.append(diet_icons.get(recipe.diet_label.value, "") + " " + recipe.diet_label.value)
                        if recipe.meal_label:
                            meal_icons = {
                                "breakfast": "🌅",
                                "starter": "🥗",
                                "meal": "🍽️",
                                "dessert": "🍰",
                                "drink": "🥤",
                            }
                            labels.append(meal_icons.get(recipe.meal_label.value, "") + " " + recipe.meal_label.value)
                        if labels:
                            st.caption(" | ".join(labels))

                        # Time info
                        time_info = []
                        if recipe.prep_time:
                            time_info.append(f"⏱️ {recipe.prep_time}m")
                        if recipe.cook_time:
                            time_info.append(f"🍳 {recipe.cook_time}m")
                        if time_info:
                            st.caption(" | ".join(time_info))

                        # Action button
                        if st.session_state.meal_selector:
                            if st.button("✅ Select", key=f"browse_select_{recipe_id}", use_container_width=True):
                                sel_date, sel_meal = st.session_state.meal_selector
                                st.session_state.meal_plan[(sel_date, sel_meal)] = recipe_id
                                st.session_state.meal_selector = None
                                st.session_state.current_page = "📅 Meal Plan"
                                st.rerun()
                        else:
                            if st.button("📖 View", key=f"browse_view_{recipe_id}", use_container_width=True):
                                st.session_state.selected_recipe = (recipe_id, recipe)
                                st.session_state.current_page = "📚 Recipes"
                                st.rerun()
        else:
            st.info("No recipes match your filters.")
