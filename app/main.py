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

                    recipe = scrape_recipe(url)
                    if recipe:
                        st.success(f"✅ Imported: {recipe.title}")
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

    # Display saved recipes
    st.divider()
    st.subheader("Saved Recipes")
    st.info("No recipes saved yet. Import your first recipe above!")

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
