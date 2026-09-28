import streamlit as st

st.title("NutriGen")
st.write("Personalized Meal Planner")

# Personal Information
st.header("Personal Information")

name = st.text_input("Your name")

age = st.number_input(
    "Your age",
    min_value=1,
    max_value=100,
    value=18
)

gender = st.radio(
    "Your gender",
    ["Male", "Female", "Other"]
)

# Meal Preferences
st.header("Meal Preferences")

goal = st.selectbox(
    "What is your goal?",
    ["Weight Loss", "Weight Gain", "Maintain Weight"]
)

diet_type = st.radio(
    "What type of diet do you follow?",
    ["Vegetarian", "Non-Vegetarian", "Vegan"]
)

spice_level = st.slider(
    "How spicy do you like your food?",
    min_value=1,
    max_value=5,
    value=3
)

# Vegetarian-specific preference
if diet_type == "Vegetarian":
    eats_mushrooms = st.radio(
        "Do you eat mushrooms?",
        ["Yes", "No"]
    )

# Additional Preferences
dietary_preferences = st.multiselect(
    "Any additional dietary preferences?",
    ["Gluten-Free", "Keto", "High Protein", "Low Carb"]
)

allergies = st.multiselect(
    "Do you have any food allergies?",
    ["Peanuts", "Tree Nuts", "Dairy", "Eggs", "Shellfish", "Soy", "Wheat"]
)

has_other_preferences = st.checkbox(
    "I have other food preferences"
)

# Generate Meal Plan
if st.button("Generate Meal Plan"):
    if name:
        st.success(f"Welcome, {name}! Your meal plan is being generated.")
    else:
        st.warning("Please enter your name first.")
