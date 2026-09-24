import streamlit as st

st.title("Nutrigen")
st.write("Personalized Meal Planner")

name = st.text_input("Your name")

age = st.number_input(
    "Your age",
    min_value=1,
    max_value=100
)

goal = st.selectbox(
    "Your goal",
    ["Weight Loss", "Weight Gain", "Maintain Weight"]
)

if name:
    st.success(f"Welcome, {name}!")