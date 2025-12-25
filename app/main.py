"""Meal Planner - Recipe collector and weekly meal planner."""

import streamlit as st

st.set_page_config(
    page_title="Meal Planner",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("🍽️ Meal Planner")
st.markdown("*Recipe collector and weekly meal planner*")

# Sidebar navigation
st.sidebar.title("Navigation")
page = st.sidebar.radio("Go to", ["📚 Recipes", "📅 Weekly Plan", "🛒 Grocery List"])

if page == "📚 Recipes":
    st.header("📚 Recipe Library")

    # Add new recipe section
    st.subheader("Add New Recipe")
    url = st.text_input("Paste a recipe URL", placeholder="https://www.allrecipes.com/...")

    if st.button("Import Recipe", type="primary"):
        if url:
            with st.spinner("Extracting recipe..."):
                try:
                    from app.services.recipe_scraper import scrape_recipe
                    from app.storage.recipe_storage import save_recipe

                    recipe = scrape_recipe(url)
                    if recipe:
                        # Save to Firestore
                        recipe_id = save_recipe(recipe)
                        st.success(f"✅ Imported and saved: {recipe.title}")
                        st.caption(f"Recipe ID: {recipe_id}")

                        if recipe.image_url:
                            st.image(recipe.image_url, width=300)
                        st.write(f"**Servings:** {recipe.servings}")
                        st.write(f"**Prep time:** {recipe.prep_time} min")
                        st.write(f"**Cook time:** {recipe.cook_time} min")

                        st.subheader("Ingredients")
                        for ing in recipe.ingredients:
                            st.write(f"- {ing}")

                        st.subheader("Instructions")
                        for i, step in enumerate(recipe.instructions, 1):
                            st.write(f"{i}. {step}")
                    else:
                        st.error("Could not extract recipe from this URL")
                except Exception as e:  # noqa: BLE001
                    st.error(f"Error importing recipe: {e}")
        else:
            st.warning("Please enter a URL")

    # Display saved recipes from Firestore
    st.divider()
    st.subheader("Saved Recipes")

    try:
        from app.storage.recipe_storage import delete_recipe, get_all_recipes

        recipes = get_all_recipes()
        if recipes:
            for recipe_id, recipe in recipes:
                with st.expander(f"🍽️ {recipe.title}"):
                    col1, col2 = st.columns([1, 2])
                    with col1:
                        if recipe.image_url:
                            st.image(recipe.image_url, width=200)
                    with col2:
                        st.write(f"**URL:** [{recipe.url}]({recipe.url})")
                        st.write(f"**Servings:** {recipe.servings or 'N/A'}")
                        st.write(f"**Prep:** {recipe.prep_time or 'N/A'} min | **Cook:** {recipe.cook_time or 'N/A'} min")

                    st.write("**Ingredients:**")
                    for ing in recipe.ingredients[:5]:  # Show first 5
                        st.write(f"- {ing}")
                    if len(recipe.ingredients) > 5:
                        st.caption(f"... and {len(recipe.ingredients) - 5} more")

                    if st.button("🗑️ Delete", key=f"delete_{recipe_id}"):
                        delete_recipe(recipe_id)
                        st.rerun()
        else:
            st.info("No recipes saved yet. Import your first recipe above!")
    except Exception as e:  # noqa: BLE001
        st.warning(f"Could not load recipes: {e}")
        st.info("Make sure you're authenticated with Google Cloud.")


elif page == "📅 Weekly Plan":
    st.header("📅 Weekly Meal Plan")

    # Create weekly grid
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    meals = ["Breakfast", "Lunch", "Dinner"]

    cols = st.columns(7)
    for i, day in enumerate(days):
        with cols[i]:
            st.markdown(f"**{day}**")
            for meal in meals:
                st.text_input(f"{meal}", key=f"{day}_{meal}", label_visibility="collapsed", placeholder=meal)

    st.divider()
    if st.button("Generate Grocery List", type="primary"):
        st.info("Connect recipes to your meal plan to generate a grocery list")

elif page == "🛒 Grocery List":
    st.header("🛒 Grocery List")

    st.info("Plan your meals first to generate a grocery list")

    # Placeholder for grocery list functionality
    st.subheader("Categories")
    categories = ["🥬 Produce", "🥩 Meat & Seafood", "🥛 Dairy", "🍞 Bakery", "🥫 Pantry", "❄️ Frozen"]

    for category in categories:
        with st.expander(category):
            st.write("No items yet")

# Footer
st.sidebar.divider()
st.sidebar.markdown("---")
st.sidebar.markdown("Made with ❤️ and Streamlit")
