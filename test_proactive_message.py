from datetime import datetime

from proactive import UserState, run_check, write_message

# A user who logged only a small breakfast, checked at 7 pm
state = UserState("test_user", calorie_target=2000, protein_target=110,
                  diet="Vegetarian", allergies=["Nuts"], preferences=["High Protein"])
now = datetime(2026, 11, 4, 19, 0)
state.log_meal(500, 25, datetime(2026, 11, 4, 8, 30))

action = run_check(state, now)
print("Trigger :", action["trigger"])
print("Template:", action["message"])

# This calls Gemini. If the call fails, or the text is empty, too long or
# unsafe, write_message quietly returns the template instead.
message = write_message(state, action, now=now)
print("Final   :", message)

if message == action["message"]:
    print("RESULT: fell back to the template (Gemini failed or the text was rejected)")
else:
    print("RESULT: Gemini wrote the message")