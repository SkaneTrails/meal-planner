# Bootstrap Icons for Meal Planner

This folder can store SVG icons downloaded from [Bootstrap Icons](https://icons.getbootstrap.com/).

## How to Download Icons

1. Go to https://icons.getbootstrap.com/
2. Search for the icon you want (e.g., "cart", "calendar", "book")
3. Click on the icon
4. Click the **Download SVG** button
5. Save the SVG file to this folder

## Recommended Icons for Meal Planner

Here are some food/cooking related icons you might want to use:

- **Navigation:**
  - `house` or `house-fill` - Home
  - `book` or `journal` - Recipes
  - `calendar` or `calendar-week` - Meal Plan
  - `cart` or `basket` - Grocery List

- **Food & Cooking:**
  - `cup-hot` - Hot drinks/breakfast
  - `egg-fried` - Breakfast
  - `fork-knife` - Meals/dinner (requires v1.11+)

- **Actions:**
  - `plus-circle` - Add
  - `trash` - Delete
  - `pencil` - Edit
  - `check-circle` - Complete
  - `x-circle` - Cancel/Remove
  - `search` - Search
  - `arrow-left` / `arrow-right` - Navigation

## Using Icons in Streamlit

### Method 1: SVG Files (Best quality)

```python
from pathlib import Path

def load_svg_icon(name: str, size: int = 24, color: str = "currentColor") -> str:
    """Load an SVG icon and return it as HTML."""
    svg_path = Path(__file__).parent / "assets" / "icons" / f"{name}.svg"
    if svg_path.exists():
        svg_content = svg_path.read_text()
        # Modify size and color
        svg_content = svg_content.replace('width="16"', f'width="{size}"')
        svg_content = svg_content.replace('height="16"', f'height="{size}"')
        svg_content = svg_content.replace('fill="currentColor"', f'fill="{color}"')
        return svg_content
    return ""

# Usage in Streamlit:
st.markdown(load_svg_icon("house", size=32), unsafe_allow_html=True)
```

### Method 2: Bootstrap Icons Font (CDN)

Add this CSS to your app using st.markdown:

```python
st.markdown('''
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
<style>
    .bi { font-size: 1.5rem; vertical-align: middle; }
</style>
''', unsafe_allow_html=True)

# Then use icons like this:
st.markdown('<i class="bi bi-house"></i> Home', unsafe_allow_html=True)
```

### Method 3: Inline SVG (No files needed)

Copy the SVG code directly from the Bootstrap Icons website:

```python
home_icon = '''
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-house" viewBox="0 0 16 16">
  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
</svg>
'''
st.markdown(home_icon, unsafe_allow_html=True)
```
