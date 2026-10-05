/* =========================================================
   NUTRIGEN — script.js
   Complete frontend logic
   HTML + CSS + JavaScript only
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     HELPERS
     ======================================================= */

  const $ = id => document.getElementById(id);

  const qs = (selector, root = document) =>
    root.querySelector(selector);

  const qsa = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const esc = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );

  const val = id =>
    ($(id)?.value || "").trim();

  const num = id => {
    const value = val(id);
    return value === "" ? NaN : Number(value);
  };

  const one = name =>
    qs(`input[name="${name}"]:checked`)?.value || "";

  const many = name =>
    qsa(`input[name="${name}"]:checked`).map(input => input.value);

  const show = element =>
    element?.classList.remove("hidden");

  const hide = element =>
    element?.classList.add("hidden");

  const toTop = () =>
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  const words = text =>
    (text || "")
      .toLowerCase()
      .split(/[,;\n]+/)
      .map(item => item.trim())
      .filter(Boolean);

  const fmt = number =>
    Number(number || 0).toLocaleString("en-IN");

  const list = array =>
    array.length ? array.join(", ") : "None selected";

  const set = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };


  /* =======================================================
     MAIN PAGE REFERENCES
     ======================================================= */

  const landing = $("landing-page");
  const formPage = $("personalization-page");
  const output = $("profile-output");
  const formEl = $("nutrigen-form");

  const slides = qsa(".form-slide");

  let currentSlide = 0;
  let profile = null;
  let nutrition = null;
  let mealPlan = null;
  let currentDay = 0;


  /* =======================================================
     ACTIVITY LEVEL
     ======================================================= */

  const ACTIVITY_LEVELS = [
    [
      "1.2",
      "Mostly seated",
      "Desk-based routine with little exercise"
    ],
    [
      "1.375",
      "Lightly active",
      "Exercise around 1–3 days a week"
    ],
    [
      "1.55",
      "Moderately active",
      "Exercise around 3–5 days a week"
    ],
    [
      "1.725",
      "Very active",
      "Hard exercise around 6–7 days a week"
    ]
  ];

  const caloriesField = $("daily-calories");

  if (
    caloriesField &&
    caloriesField.closest(".field") &&
    !qs('input[name="activity"]')
  ) {
    caloriesField.closest(".field").insertAdjacentHTML(
      "beforebegin",
      `
      <div class="field activity-field">
        <label>Activity Level</label>

        <div class="choice-grid activity-grid">
          ${ACTIVITY_LEVELS.map(
            ([value, title, description], index) => `
              <label class="choice-card">
                <input
                  type="radio"
                  name="activity"
                  value="${value}"
                  ${index === 1 ? "checked" : ""}
                />

                <span class="choice-content">
                  <strong>${title}</strong>
                  <small>${description}</small>
                </span>
              </label>
            `
          ).join("")}
        </div>
      </div>
      `
    );
  }


  /* =======================================================
     NAVIGATION
     ======================================================= */

  function updateProgress() {

    const percentage =
      ((currentSlide + 1) / slides.length) * 100;

    const progressFill = $("progress-fill");
    const progressText = $("progress-text");

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent =
        `Step ${currentSlide + 1} of ${slides.length}`;
    }

    qsa(".progress-step").forEach((step, index) => {

      step.classList.toggle(
        "active",
        index === currentSlide
      );

      step.classList.toggle(
        "completed",
        index < currentSlide
      );
    });
  }


  function goToSlide(index, scroll = true) {

    if (!slides.length) return;

    currentSlide = Math.max(
      0,
      Math.min(slides.length - 1, index)
    );

    slides.forEach((slide, index) => {

      slide.classList.toggle(
        "hidden",
        index !== currentSlide
      );

    });

    updateProgress();

    if (scroll) {
      setTimeout(toTop, 30);
    }
  }


  /* =======================================================
     RETURN / EXIT NAVIGATION
     ======================================================= */

  function returnToLanding() {

    hide(formPage);
    hide(output);
    show(landing);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function openForm() {

    hide(landing);
    hide(output);
    show(formPage);

    goToSlide(0);
  }


  function openResults() {

    hide(landing);
    hide(formPage);
    show(output);

    setTimeout(toTop, 30);
  }


  /* =======================================================
     LANDING PAGE BUTTONS
     ======================================================= */

  [
    "start-plan-button",
    "hero-start-button",
    "how-it-works-start-button"
  ].forEach(id => {

    $(id)?.addEventListener("click", event => {

      event.preventDefault();
      openForm();

    });

  });


  /* =======================================================
     BACK TO WEBSITE BUTTON
     Works even if HTML has one of several IDs
     ======================================================= */

  [
    "back-to-home-button",
    "back-to-home",
    "return-home-button",
    "exit-form-button",
    "form-back-home"
  ].forEach(id => {

    $(id)?.addEventListener("click", event => {

      event.preventDefault();
      returnToLanding();

    });

  });


  /* =======================================================
     SIDEBAR BRAND / LOGO
     Clicking logo returns to landing page
     ======================================================= */

  qsa(
    ".progress-sidebar .brand, .progress-sidebar .brand-mark"
  ).forEach(element => {

    element.style.cursor = "pointer";

    element.addEventListener("click", event => {

      event.preventDefault();
      returnToLanding();

    });

  });


  /* =======================================================
     FORM BACK / CONTINUE BUTTONS
     ======================================================= */

  qsa(".back-button").forEach(button => {

    button.addEventListener("click", event => {

      event.preventDefault();

      if (currentSlide === 0) {
        returnToLanding();
        return;
      }

      goToSlide(currentSlide - 1);

    });

  });


  qsa(".continue-button").forEach(button => {

    button.addEventListener("click", event => {

      event.preventDefault();

      if (validateSlide(currentSlide)) {
        goToSlide(currentSlide + 1);
      }

    });

  });


  /* =======================================================
     EDIT PROFILE BUTTONS
     ======================================================= */

  [
    "edit-profile-button",
    "edit-profile-button-bottom",
    "edit-plan-button",
    "edit-details-button"
  ].forEach(id => {

    $(id)?.addEventListener("click", event => {

      event.preventDefault();

      hide(output);
      hide(landing);
      show(formPage);

      goToSlide(0);

    });

  });


  /* =======================================================
     VALIDATION
     ======================================================= */

  function clearErrors() {

    qsa(".validation-message")
      .forEach(element => element.remove());

    qsa(".invalid")
      .forEach(element =>
        element.classList.remove("invalid")
      );

  }


  function showError(target, message) {

    const element =
      typeof target === "string"
        ? $(target)
        : target;

    if (!element) return false;

    element.classList.add("invalid");

    const container =
      element.closest(".field") ||
      element.parentElement;

    if (container) {

      container.insertAdjacentHTML(
        "beforeend",
        `
        <div class="validation-message">
          ${esc(message)}
        </div>
        `
      );

    }

    setTimeout(() => {

      element.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      if (
        element.matches("input") &&
        element.type !== "radio" &&
        element.type !== "checkbox"
      ) {
        element.focus({
          preventScroll: true
        });
      }

    }, 60);

    return false;
  }


  const VALIDATORS = [

    /* STEP 1 */
    () => {

      const age = num("age");
      const height = num("height");

      if (!val("name")) {
        return showError(
          "name",
          "Please enter your name."
        );
      }

      if (!(age >= 1 && age <= 120)) {
        return showError(
          "age",
          "Enter an age between 1 and 120."
        );
      }

      if (!(height >= 50 && height <= 250)) {
        return showError(
          "height",
          "Enter a height between 50 and 250 cm."
        );
      }

      if (!one("gender")) {

        const genderGrid =
          qs(".gender-grid");

        return showError(
          genderGrid?.closest(".field") ||
          genderGrid,
          "Please choose an option."
        );

      }

      if (!one("activity")) {

        const activityGrid =
          qs(".activity-grid");

        return showError(
          activityGrid?.closest(".field") ||
          activityGrid,
          "Please select your activity level."
        );

      }

      return true;
    },


    /* STEP 2 */
    () => {

      const goal = one("goal");
      const currentWeight = num("current-weight");
      const targetWeight = num("target-weight");
      const calories = num("daily-calories");

      if (!goal) {

        const goalGrid =
          qs(".goal-grid");

        return showError(
          goalGrid?.closest(".field") ||
          goalGrid,
          "Please select your goal."
        );

      }

      if (
        !(currentWeight >= 20 &&
          currentWeight <= 300)
      ) {

        return showError(
          "current-weight",
          "Enter a weight between 20 and 300 kg."
        );

      }

      if (
        !(targetWeight >= 20 &&
          targetWeight <= 300)
      ) {

        return showError(
          "target-weight",
          "Enter a weight between 20 and 300 kg."
        );

      }

      if (
        !isNaN(calories) &&
        (calories < 1000 || calories > 6000)
      ) {

        return showError(
          "daily-calories",
          "Calories should be between 1000 and 6000."
        );

      }

      if (
        goal === "Weight Loss" &&
        targetWeight >= currentWeight
      ) {

        return showError(
          "target-weight",
          "For weight loss, the target must be lower than your current weight."
        );

      }

      if (
        goal === "Weight Gain" &&
        targetWeight <= currentWeight
      ) {

        return showError(
          "target-weight",
          "For weight gain, the target must be higher than your current weight."
        );

      }

      if (
        goal === "Maintain Weight" &&
        Math.abs(targetWeight - currentWeight) > 3
      ) {

        return showError(
          "target-weight",
          "For maintaining weight, keep the target within 3 kg of your current weight."
        );

      }

      return true;
    },


    /* STEP 3 */
    () => {

      if (!one("diet")) {

        const dietGrid =
          qs(".diet-grid");

        return showError(
          dietGrid?.closest(".field") ||
          dietGrid,
          "Please choose your diet preference."
        );

      }

      return true;
    },


    /* STEP 4 */
    () => true

  ];


  function validateSlide(index) {

    clearErrors();

    if (!VALIDATORS[index]) {
      return true;
    }

    return VALIDATORS[index]();

  }


  /* =======================================================
     CLEAR ERROR WHEN USER FIXES FIELD
     ======================================================= */

  function clearFieldError(event) {

    const field =
      event.target.closest(".field");

    event.target.classList.remove("invalid");

    field?.classList.remove("invalid");

    field
      ?.querySelector(".validation-message")
      ?.remove();

  }


  formEl?.addEventListener(
    "input",
    clearFieldError
  );

  formEl?.addEventListener(
    "change",
    clearFieldError
  );


  /* =======================================================
     ENTER KEY NAVIGATION
     ======================================================= */

  formEl?.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" &&
        event.target.matches(
          'input[type="text"], input[type="number"]'
        )
      ) {

        event.preventDefault();

        const button =
          qs(
            ".continue-button, .generate-button",
            slides[currentSlide]
          );

        button?.click();

      }

    }
  );


  /* =======================================================
     NUTRITION CALCULATIONS
     Mifflin-St Jeor
     ======================================================= */

  function calculateNutrition(profileData) {

    const genderAdjustment =
      profileData.gender === "Male"
        ? 5
        : profileData.gender === "Female"
          ? -161
          : -78;

    const bmr =
      10 * profileData.weight +
      6.25 * profileData.height -
      5 * profileData.age +
      genderAdjustment;

    const tdee =
      bmr * profileData.activity;

    const goalAdjustment = {
      "Weight Loss": -500,
      "Weight Gain": 400,
      "Maintain Weight": 0
    };

    const adjustment =
      goalAdjustment[profileData.goal] ?? 0;

    const minimumCalories =
      profileData.gender === "Male"
        ? 1500
        : 1200;

    const notes = [];

    const automatic =
      !profileData.calories;

    let calories = automatic
      ? Math.round(
          (tdee + adjustment) / 50
        ) * 50
      : profileData.calories;

    if (calories < minimumCalories) {

      if (automatic) {

        calories = minimumCalories;

      } else {

        notes.push(
          `Your chosen target is below ${minimumCalories} kcal, which is generally not advised without professional guidance.`
        );

      }

    }


    /* Protein */

    const protein =
      Math.round(
        profileData.weight *
        (
          profileData.goal === "Maintain Weight"
            ? 1.2
            : 1.6
        ) +
        (
          profileData.preferences.includes(
            "High Protein"
          )
            ? 0.3 * profileData.weight
            : 0
        )
      );


    /* Carbs + Fat */

    let carbs;
    let fat;

    if (
      profileData.preferences.includes(
        "Low Carb"
      )
    ) {

      carbs =
        Math.round(
          calories * 0.30 / 4
        );

      fat =
        Math.round(
          (
            calories -
            protein * 4 -
            carbs * 4
          ) / 9
        );

    } else {

      fat =
        Math.round(
          calories *
          (
            profileData.preferences.includes(
              "Low Fat"
            )
              ? 0.22
              : 0.28
          ) / 9
        );

      carbs =
        Math.round(
          (
            calories -
            protein * 4 -
            fat * 9
          ) / 4
        );

    }

    carbs = Math.max(carbs, 50);
    fat = Math.max(fat, 20);


    /* BMI */

    const bmi =
      profileData.weight /
      ((profileData.height / 100) ** 2);


    /* Timeline */

    const weeklyRate =
      profileData.goal === "Weight Loss"
        ? 0.5
        : 0.3;

    const weeks =
      profileData.goal === "Maintain Weight"
        ? 0
        : Math.ceil(
            Math.abs(
              profileData.target -
              profileData.weight
            ) / weeklyRate
          );


    /* Notes */

    if (profileData.age < 18) {

      notes.push(
        "You're under 18. Calorie targets for growing bodies are different, so planning with a doctor or dietitian is recommended."
      );

    }

    if (
      profileData.restrictions.includes(
        "Low Sodium"
      )
    ) {

      notes.push(
        "Low sodium: the current planner does not calculate sodium. Use less salt and check packaged-food labels."
      );

    }


    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      kcal: calories,
      auto: automatic,
      protein,
      carbs,
      fat,
      bmi,
      weeks,
      rate: weeklyRate,
      notes
    };

  }


  /* =======================================================
     MEAL DATABASE
     ======================================================= */

  /*
    level:
    0 = Vegan
    1 = Vegetarian
    2 = Non-Vegetarian
  */

  const MEAL = (
    name,
    level,
    kcal,
    protein,
    carbs,
    fat,
    allergens,
    tags,
    ingredients
  ) => ({
    name,
    level,
    kcal,
    protein,
    carbs,
    fat,
    allergens: allergens
      ? allergens.split(" ")
      : [],
    tags: tags
      ? tags.split(" ")
      : [],
    ingredients
  });


  const MEALS = {

    breakfast: [

      MEAL(
        "Berry Protein Oats",
        0,
        360,
        16,
        52,
        9,
        "gluten",
        "hp hf",
        "oats, mixed berries, chia, flaxseed"
      ),

      MEAL(
        "Tofu Scramble Bowl",
        0,
        340,
        24,
        20,
        18,
        "soy",
        "hp lc",
        "tofu, spinach, tomato, turmeric, millet"
      ),

      MEAL(
        "Vegetable Poha",
        0,
        320,
        8,
        56,
        7,
        "peanuts",
        "lf",
        "flattened rice, peas, onion, peanuts, lemon"
      ),

      MEAL(
        "Moong Dal Chilla",
        0,
        330,
        20,
        42,
        8,
        "",
        "hp hf lf",
        "moong dal, onion, coriander, mint chutney"
      ),

      MEAL(
        "Idli & Sambar",
        0,
        310,
        11,
        58,
        4,
        "",
        "lf hf",
        "idli, lentil sambar, vegetables"
      ),

      MEAL(
        "Paneer Veg Sandwich",
        1,
        400,
        22,
        38,
        17,
        "milk gluten",
        "hp",
        "whole-wheat bread, paneer, cucumber, mint"
      ),

      MEAL(
        "Greek Yogurt Parfait",
        1,
        300,
        20,
        36,
        8,
        "milk",
        "hp",
        "greek yogurt, berries, seeds"
      ),

      MEAL(
        "Egg & Spinach Scramble",
        2,
        360,
        26,
        22,
        19,
        "eggs gluten",
        "hp",
        "eggs, spinach, tomato, whole-wheat toast"
      )

    ],


    lunch: [

      MEAL(
        "Green Power Bowl",
        0,
        430,
        16,
        58,
        14,
        "",
        "hf lf",
        "quinoa, greens, cucumber, chickpeas, lemon dressing"
      ),

      MEAL(
        "Lentil Power Bowl",
        0,
        450,
        24,
        62,
        8,
        "",
        "hp hf lf",
        "brown rice, masoor dal, carrots, beans"
      ),

      MEAL(
        "Rajma & Brown Rice",
        0,
        460,
        20,
        70,
        8,
        "",
        "hf lf",
        "kidney beans, tomato gravy, brown rice"
      ),

      MEAL(
        "Chana Palak & Roti",
        0,
        440,
        18,
        60,
        12,
        "gluten",
        "hf",
        "chickpeas, spinach, tomato, whole-wheat roti"
      ),

      MEAL(
        "Tofu Veg Stir-fry Rice",
        0,
        420,
        26,
        44,
        14,
        "soy",
        "hp",
        "tofu, broccoli, bell pepper, brown rice"
      ),

      MEAL(
        "Paneer & Vegetable Bowl",
        1,
        480,
        28,
        36,
        24,
        "milk",
        "hp lc hf",
        "paneer, broccoli, capsicum, jeera rice"
      ),

      MEAL(
        "Grilled Chicken Grain Bowl",
        2,
        470,
        38,
        42,
        14,
        "",
        "hp",
        "chicken breast, quinoa, vegetables"
      ),

      MEAL(
        "Fish Curry & Rice",
        2,
        450,
        32,
        48,
        14,
        "fish",
        "hp lf",
        "fish, tomato-onion gravy, brown rice"
      ),

      MEAL(
        "Chicken Salad Wrap",
        2,
        430,
        34,
        34,
        16,
        "gluten",
        "hp",
        "chicken, lettuce, cucumber, whole-wheat wrap"
      )

    ],


    dinner: [

      MEAL(
        "Lentil Vegetable Curry",
        0,
        420,
        22,
        58,
        8,
        "",
        "hf lf",
        "toor dal, mixed vegetables, small portion of rice"
      ),

      MEAL(
        "Tofu Vegetable Stir Fry",
        0,
        390,
        26,
        22,
        20,
        "soy",
        "hp lc",
        "tofu, broccoli, zucchini, ginger"
      ),

      MEAL(
        "Roasted Veg & Chickpea Plate",
        0,
        410,
        17,
        48,
        15,
        "",
        "hf",
        "roasted vegetables, chickpeas, quinoa"
      ),

      MEAL(
        "Palak Dal & Roti",
        0,
        400,
        20,
        56,
        9,
        "gluten",
        "hf lf",
        "spinach, moong dal, whole-wheat roti"
      ),

      MEAL(
        "Paneer Tikka & Vegetables",
        1,
        460,
        26,
        30,
        25,
        "milk",
        "hp lc hf",
        "paneer tikka, grilled vegetables, mint chutney"
      ),

      MEAL(
        "Chicken & Roasted Vegetables",
        2,
        440,
        38,
        22,
        20,
        "",
        "hp lc",
        "chicken breast, roasted vegetables, sweet potato"
      ),

      MEAL(
        "Baked Fish & Greens",
        2,
        420,
        36,
        18,
        22,
        "fish",
        "hp lc",
        "fish fillet, sautéed greens, lemon"
      ),

      MEAL(
        "Lean Lamb Curry & Millet",
        2,
        480,
        34,
        36,
        22,
        "",
        "hp",
        "lamb, tomato gravy, millet"
      )

    ],


    snack: [

      MEAL(
        "Fruit & Nut Bowl",
        0,
        220,
        6,
        26,
        12,
        "treenuts",
        "hf",
        "seasonal fruit, almonds, walnuts"
      ),

      MEAL(
        "Roasted Chickpeas",
        0,
        200,
        10,
        28,
        5,
        "",
        "hp hf lf ns",
        "chickpeas, cumin, black pepper"
      ),

      MEAL(
        "Sprouts Chaat",
        0,
        180,
        11,
        26,
        3,
        "",
        "hp hf lf ns",
        "mixed sprouts, onion, tomato, lemon"
      ),

      MEAL(
        "Apple & Peanut Butter",
        0,
        210,
        7,
        24,
        11,
        "peanuts",
        "ns",
        "apple, peanut butter"
      ),

      MEAL(
        "Roasted Makhana",
        0,
        160,
        5,
        24,
        5,
        "",
        "lf ns",
        "fox nuts, black pepper, rock salt"
      ),

      MEAL(
        "Greek Yogurt & Berries",
        1,
        190,
        17,
        20,
        4,
        "milk",
        "hp lf",
        "greek yogurt, berries"
      ),

      MEAL(
        "Boiled Eggs & Cucumber",
        2,
        170,
        14,
        4,
        11,
        "eggs",
        "hp lc ns",
        "boiled eggs, cucumber, pepper"
      )

    ]

  };


  const MEAL_SLOTS = [
    ["Breakfast", "breakfast", 0.25],
    ["Lunch", "lunch", 0.32],
    ["Dinner", "dinner", 0.30],
    ["Snack", "snack", 0.13]
  ];


  const TAGS = {
    "High Protein": "hp",
    "Low Carb": "lc",
    "High Fiber": "hf",
    "Low Fat": "lf",
    "No Added Sugar": "ns"
  };


  const DIET_LEVEL = {
    Vegan: 0,
    Vegetarian: 1,
    "Non-Vegetarian": 2
  };


  /* =======================================================
     MEAL FILTERING
     ======================================================= */

  function isMealSafe(meal, profileData) {

    const text =
      `${meal.name} ${meal.ingredients}`
        .toLowerCase();

    const allergies =
      profileData.allergies.map(
        allergy =>
          allergy
            .toLowerCase()
            .replace(/\s/g, "")
      );


    /* Diet */

    if (
      meal.level >
      DIET_LEVEL[profileData.diet]
    ) {
      return false;
    }


    /* Allergies */

    if (
      meal.allergens.some(
        allergen =>
          allergies.includes(allergen)
      )
    ) {
      return false;
    }


    /* Dairy free */

    if (
      profileData.preferences.includes(
        "Dairy Free"
      ) &&
      meal.allergens.includes("milk")
    ) {
      return false;
    }


    /* Restrictions */

    if (
      profileData.restrictions.includes(
        "No Seafood"
      ) &&
      /fish|prawn|salmon|shrimp|shellfish/.test(text)
    ) {
      return false;
    }


    if (
      profileData.restrictions.includes(
        "No Red Meat"
      ) &&
      /lamb|mutton|beef/.test(text)
    ) {
      return false;
    }


    if (
      profileData.restrictions.includes(
        "No Pork"
      ) &&
      /pork|bacon/.test(text)
    ) {
      return false;
    }


    /* Custom allergy / avoidance */

    const forbiddenWords = [
      ...words(profileData.otherAllergy),
      ...words(profileData.avoid)
    ];

    if (
      forbiddenWords.some(
        word => text.includes(word)
      )
    ) {
      return false;
    }


    return true;
  }


  /* =======================================================
     MEAL SCORING
     ======================================================= */

  function scoreMeal(meal, profileData) {

    const text =
      `${meal.name} ${meal.ingredients}`
        .toLowerCase();

    let score = 0;


    profileData.preferences.forEach(
      preference => {

        const tag =
          TAGS[preference];

        if (
          tag &&
          meal.tags.includes(tag)
        ) {
          score += 2;
        }

      }
    );


    words(profileData.include)
      .forEach(word => {

        if (text.includes(word)) {
          score += 3;
        }

      });


    return score;
  }


  /* =======================================================
     BUILD 7-DAY PLAN
     ======================================================= */

  function buildMealPlan(
    profileData,
    nutritionData
  ) {

    return Array.from(
      { length: 7 },
      (_, dayIndex) => {

        const meals =
          MEAL_SLOTS.map(
            ([label, key, calorieShare], slotIndex) => {

              const pool =
                MEALS[key]
                  .filter(meal =>
                    isMealSafe(
                      meal,
                      profileData
                    )
                  )
                  .sort(
                    (a, b) =>
                      scoreMeal(
                        b,
                        profileData
                      ) -
                      scoreMeal(
                        a,
                        profileData
                      )
                  );


              if (!pool.length) {

                return {
                  label,
                  none: true
                };

              }


              const topPool =
                pool.slice(
                  0,
                  Math.max(
                    3,
                    Math.ceil(pool.length / 2)
                  )
                );


              const meal =
                topPool[
                  (dayIndex + slotIndex) %
                  topPool.length
                ];


              const portion =
                Math.min(
                  2,
                  Math.max(
                    0.6,
                    Math.round(
                      (
                        nutritionData.kcal *
                        calorieShare /
                        meal.kcal
                      ) * 20
                    ) / 20
                  )
                );


              const scale =
                value =>
                  Math.round(
                    value * portion
                  );


              return {
                label,
                meal,
                portion,
                kcal: scale(meal.kcal),
                protein: scale(meal.protein),
                carbs: scale(meal.carbs),
                fat: scale(meal.fat)
              };

            }
          );


        const totals =
          meals.reduce(
            (total, meal) => {

              if (meal.none) {
                return total;
              }

              return {
                kcal:
                  total.kcal + meal.kcal,

                protein:
                  total.protein +
                  meal.protein,

                carbs:
                  total.carbs +
                  meal.carbs,

                fat:
                  total.fat +
                  meal.fat
              };

            },
            {
              kcal: 0,
              protein: 0,
              carbs: 0,
              fat: 0
            }
          );


        return {
          meals,
          totals
        };

      }
    );

  }


  /* =======================================================
     COLLECT PROFILE
     ======================================================= */

  function collectProfile() {

    return {

      name: val("name"),

      age: num("age"),

      height: num("height"),

      gender: one("gender"),

      goal: one("goal"),

      weight: num("current-weight"),

      target: num("target-weight"),

      calories:
        num("daily-calories") || 0,

      activity:
        Number(one("activity")) ||
        1.375,

      diet:
        one("diet"),

      preferences:
        many("preferences"),

      allergies:
        many("allergies"),

      restrictions:
        many("restrictions"),

      otherPreference:
        val("other-preference"),

      include:
        val("foods-to-include"),

      avoid:
        val("foods-to-avoid"),

      otherAllergy:
        val("other-allergy")

    };

  }


  function prepareProfile(profileData) {

    profile = profileData;

    nutrition =
      calculateNutrition(profileData);

    mealPlan =
      buildMealPlan(
        profileData,
        nutrition
      );

  }


  /* =======================================================
     OUTPUT — SUMMARY
     ======================================================= */

  function renderSummary() {

    if (!profile || !nutrition) {
      return;
    }


    set(
      "output-name",
      profile.name
    );

    set(
      "output-age",
      `${profile.age} years`
    );

    set(
      "output-height",
      `${profile.height} cm`
    );

    set(
      "output-gender",
      profile.gender
    );

    set(
      "output-goal",
      profile.goal
    );

    set(
      "output-current-weight",
      `${profile.weight} kg`
    );

    set(
      "output-target-weight",
      `${profile.target} kg`
    );

    set(
      "output-calories",
      `${fmt(nutrition.kcal)} kcal${
        nutrition.auto
          ? " · calculated"
          : ""
      }`
    );

    set(
      "output-diet",
      profile.diet
    );

    set(
      "output-preferences",
      list(profile.preferences)
    );

    set(
      "output-allergies",
      list([
        ...profile.allergies,
        ...words(profile.otherAllergy)
      ])
    );


    set(
      "profile-greeting",
      `Your personalised 7-day plan is ready, ${profile.name}.`
    );


    /* Status */

    const status =
      qs(".plan-status");

    if (status) {

      status.textContent =
        `${profile.goal} · ${profile.diet}`
          .toUpperCase();

    }


    /* Additional information cards */

    const grid =
      qs(".profile-summary-grid");

    if (grid) {

      qsa(
        ".extra-card",
        grid
      ).forEach(
        card => card.remove()
      );


      const bmiCategory =
        nutrition.bmi < 18.5
          ? "Underweight range"
          : nutrition.bmi < 25
            ? "Healthy range"
            : nutrition.bmi < 30
              ? "Overweight range"
              : "Obese range";


      const timeline =
        profile.goal ===
        "Maintain Weight"

          ? "Maintenance · review progress every 4 weeks"

          : `Approximately ${nutrition.weeks} weeks at about ${nutrition.rate} kg/week`;


      const createCard = (
        label,
        value,
        wide = false
      ) => `
        <article
          class="summary-card extra-card ${
            wide ? "wide-summary" : ""
          }"
        >
          <span class="summary-label">
            ${esc(label)}
          </span>

          <strong>
            ${esc(value)}
          </strong>
        </article>
      `;


      grid.insertAdjacentHTML(
        "beforeend",

        createCard(
          "BMI",
          `${nutrition.bmi.toFixed(1)} · ${bmiCategory}`
        ) +

        createCard(
          "MAINTENANCE CALORIES",
          `${fmt(nutrition.tdee)} kcal`
        ) +

        createCard(
          "DAILY MACROS",
          `Protein ${nutrition.protein} g · Carbs ${nutrition.carbs} g · Fat ${nutrition.fat} g`,
          true
        ) +

        createCard(
          "ESTIMATED TIMELINE",
          timeline,
          true
        )

      );

    }

  }


  /* =======================================================
     OUTPUT — DAY TABS
     ======================================================= */

  function createDayNavigation() {

    const existingTabs =
      qs(".day-tabs");

    const existingTotals =
      qs("#day-totals");

    existingTabs?.remove();
    existingTotals?.remove();


    const grid =
      qs(".meal-plan-grid");

    if (!grid) return;


    const days = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ];


    grid.insertAdjacentHTML(
      "beforebegin",

      `
      <div
        class="day-tabs"
        role="tablist"
        aria-label="Plan days"
      >
        ${days.map(
          (dayName, index) => `
            <button
              type="button"
              class="day-tab"
              data-day="${index}"
            >
              <span>Day ${index + 1}</span>
              <small>${dayName}</small>
            </button>
          `
        ).join("")}
      </div>

      <div
        class="day-totals"
        id="day-totals"
      ></div>
      `
    );


    qsa(".day-tab").forEach(button => {

      button.addEventListener(
        "click",
        () => {

          renderDay(
            Number(button.dataset.day)
          );

        }
      );

    });

  }


  /* =======================================================
     OUTPUT — RENDER DAY
     ======================================================= */

  function renderDay(dayIndex) {

    if (!mealPlan?.[dayIndex]) {
      return;
    }


    currentDay = dayIndex;


    qsa(".day-tab").forEach(
      (button, index) => {

        button.classList.toggle(
          "active",
          index === dayIndex
        );

        button.setAttribute(
          "aria-selected",
          index === dayIndex
            ? "true"
            : "false"
        );

      }
    );


    const day =
      mealPlan[dayIndex];


    const totals =
      $("day-totals");


    if (totals) {

      totals.innerHTML = `

        <div class="day-total-item">
          <strong>
            ${fmt(day.totals.kcal)}
            <small>kcal</small>
          </strong>
          <span>Calories</span>
        </div>

        <div class="day-total-item">
          <strong>
            ${fmt(day.totals.protein)}
            <small>g</small>
          </strong>
          <span>Protein</span>
        </div>

        <div class="day-total-item">
          <strong>
            ${fmt(day.totals.carbs)}
            <small>g</small>
          </strong>
          <span>Carbs</span>
        </div>

        <div class="day-total-item">
          <strong>
            ${fmt(day.totals.fat)}
            <small>g</small>
          </strong>
          <span>Fat</span>
        </div>

      `;

    }


    const grid =
      qs(".meal-plan-grid");

    if (!grid) return;


    grid.innerHTML =
      day.meals.map(
        meal => {

          if (meal.none) {

            return `
              <article
                class="output-meal-card meal-unavailable"
              >

                <div class="output-meal-icon">
                  —
                </div>

                <div>
                  <span>
                    ${esc(
                      meal.label.toUpperCase()
                    )}
                  </span>

                  <h3>
                    No suitable option
                  </h3>

                  <p>
                    Your selected preferences
                    and restrictions removed
                    every available option for
                    this meal.
                  </p>

                </div>

              </article>
            `;

          }


          return `
            <article class="output-meal-card">

              <div
                class="output-meal-icon meal-marker"
                aria-hidden="true"
              >
                <span></span>
              </div>

              <div class="meal-card-content">

                <span class="meal-label">
                  ${esc(
                    meal.label.toUpperCase()
                  )}
                </span>

                <h3>
                  ${esc(meal.meal.name)}
                </h3>

                <p class="meal-ingredients">
                  ${esc(
                    meal.meal.ingredients
                  )}
                </p>

                <div class="macro-line">

                  <b>
                    ${fmt(meal.kcal)} kcal
                  </b>

                  <i>
                    P ${meal.protein}g
                  </i>

                  <i>
                    C ${meal.carbs}g
                  </i>

                  <i>
                    F ${meal.fat}g
                  </i>

                  <i>
                    ${meal.portion}× portion
                  </i>

                </div>

              </div>

            </article>
          `;

        }
      ).join("");

  }


  /* =======================================================
     CALCULATION EXPLANATION
     ======================================================= */

  function renderExplanation() {

    const explanation =
      qs(".future-note");

    if (!explanation) return;


    const extraNotes =
      nutrition.notes.length
        ? `
          <div class="calculation-alerts">
            ${nutrition.notes.map(
              note => `
                <p>
                  <strong>Note:</strong>
                  ${esc(note)}
                </p>
              `
            ).join("")}
          </div>
        `
        : "";


    explanation.innerHTML = `

      <div class="explanation-mark">
        i
      </div>

      <div>

        <strong>
          How your plan was calculated
        </strong>

        <p>
          Your calorie target is estimated
          using the Mifflin-St Jeor equation,
          your age, height, weight, gender
          and selected activity level.
        </p>

        <p>
          The target is then adjusted according
          to your goal. Your selected dietary
          preferences, allergies and restrictions
          are used to filter the available meals.
        </p>

        <p>
          Meal portions are scaled around your
          daily calorie target and the plan is
          distributed across breakfast, lunch,
          dinner and snacks.
        </p>

        <p class="explanation-disclaimer">
          These calculations are estimates for
          planning purposes and are not medical
          advice. Always check ingredients and
          food labels yourself, particularly when
          managing allergies or medical conditions.
        </p>

        ${extraNotes}

      </div>

    `;

  }


  /* =======================================================
     COMPLETE RESULTS PAGE
     ======================================================= */

  function renderResults() {

    if (!profile || !nutrition || !mealPlan) {
      return;
    }


    renderSummary();

    createDayNavigation();

    renderDay(0);

    renderExplanation();

    openResults();

  }


  /* =======================================================
     SUBMIT FORM
     ======================================================= */

  formEl?.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      for (
        let index = 0;
        index < slides.length;
        index++
      ) {

        if (!validateSlide(index)) {

          goToSlide(
            index,
            false
          );

          return;
        }

      }


      const collected =
        collectProfile();


      prepareProfile(
        collected
      );


      try {

        localStorage.setItem(
          "nutrigenProfile",
          JSON.stringify(profile)
        );

      } catch (error) {

        console.warn(
          "Unable to save profile.",
          error
        );

      }


      renderResults();

    }
  );


  /* =======================================================
     VIEW LAST PLAN
     ======================================================= */

  function setupLastPlanButton() {

    const savedButton =
      $("last-plan-button");

    if (savedButton) {
      savedButton.remove();
    }


    try {

      const saved =
        JSON.parse(
          localStorage.getItem(
            "nutrigenProfile"
          ) || "null"
        );


      if (
        saved &&
        saved.name &&
        saved.diet
      ) {

        const heroActions =
          qs(".hero-actions");


        if (heroActions) {

          heroActions.insertAdjacentHTML(
            "afterbegin",

            `
            <button
              type="button"
              id="last-plan-button"
              class="secondary-button last-plan-button"
            >
              View my last plan
            </button>
            `
          );


          $("last-plan-button")
            ?.addEventListener(
              "click",
              event => {

                event.preventDefault();

                prepareProfile(
                  saved
                );

                renderResults();

              }
            );

        }

      }

    } catch (error) {

      console.warn(
        "Unable to load saved profile.",
        error
      );

    }

  }


  setupLastPlanButton();


  /* =======================================================
     RESULTS PAGE BACK BUTTONS
     ======================================================= */

  [
    "back-to-site-button",
    "back-to-home-from-results",
    "results-back-button",
    "back-to-main-button"
  ].forEach(id => {

    $(id)?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        returnToLanding();

      }
    );

  });


  /* =======================================================
     CHAT ASSISTANT
     ======================================================= */

  const chatPanel =
    $("chat-panel");

  const chatInput =
    $("chat-input");

  const chatBox =
    $("chat-messages");


  function openChat() {

    show(chatPanel);

    setTimeout(
      () => chatInput?.focus(),
      80
    );

  }


  function closeChat() {

    hide(chatPanel);

  }


  $("chat-toggle")
    ?.addEventListener(
      "click",
      () => {

        if (
          chatPanel?.classList.contains(
            "hidden"
          )
        ) {
          openChat();
        } else {
          closeChat();
        }

      }
    );


  qs(".chat-close")
    ?.addEventListener(
      "click",
      closeChat
    );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {
        closeChat();
      }

    }
  );


  function say(message, sender) {

    if (!chatBox) return;


    const element =
      document.createElement("div");


    element.className =
      `chat-message ${sender}`;


    element.textContent =
      message;


    chatBox.appendChild(
      element
    );


    chatBox.scrollTop =
      chatBox.scrollHeight;

  }


  function assistantReply(message) {

    const text =
      message.toLowerCase();


    if (
      /^(hi|hello|hey)\b/.test(text)
    ) {

      return profile

        ? `Hello ${profile.name}. I can help you understand your calories, macros, meal plan, restrictions or goal timeline.`

        : "Hello. Build your plan first and I can answer questions using your personalised numbers.";

    }


    if (!profile) {

      return "Build your plan first and I can answer using your own nutrition targets and meal plan.";

    }


    const day =
      mealPlan[currentDay];


    const slotIndex =
      MEAL_SLOTS.findIndex(
        ([label]) =>
          text.includes(
            label.toLowerCase()
          )
      );


    if (slotIndex >= 0) {

      const meal =
        day.meals[slotIndex];


      if (meal.none) {

        return `There is no suitable ${MEAL_SLOTS[slotIndex][0].toLowerCase()} option for your current restrictions.`;

      }


      return `
        ${MEAL_SLOTS[slotIndex][0]}:
        ${meal.meal.name}.
        Approximately ${fmt(meal.kcal)} kcal
        and ${meal.protein} g protein.
      `.replace(/\s+/g, " ").trim();

    }


    if (/bmi/.test(text)) {

      return `Your BMI is ${nutrition.bmi.toFixed(1)}. BMI is only a general screening measure and does not account for factors such as muscle mass.`;

    }


    if (
      /macro|protein|carb|fat/.test(text)
    ) {

      return `Your estimated daily macros are ${nutrition.protein} g protein, ${nutrition.carbs} g carbohydrates and ${nutrition.fat} g fat.`;

    }


    if (
      /calor|kcal|target|maintenance/.test(text)
    ) {

      return `Your daily target is ${fmt(nutrition.kcal)} kcal. Your estimated maintenance level is about ${fmt(nutrition.tdee)} kcal.`;

    }


    if (
      /week|long|timeline|when|goal/.test(text)
    ) {

      if (
        profile.goal ===
        "Maintain Weight"
      ) {

        return "Your goal is maintenance, so there is no weight-loss or weight-gain timeline. Review your weight and progress every few weeks.";

      }


      return `At an estimated pace of around ${nutrition.rate} kg per week, reaching ${profile.target} kg would take approximately ${nutrition.weeks} weeks.`;

    }


    if (
      /allerg|avoid|restrict/.test(text)
    ) {

      const restrictions = [
        ...profile.allergies,
        ...words(profile.otherAllergy),
        ...profile.restrictions
      ];


      return restrictions.length

        ? `Your plan is excluding: ${restrictions.join(", ")}. Please still verify ingredients and labels yourself.`

        : "You have not listed any allergies or additional restrictions.";

    }


    if (
      /today|day|plan|meal|eat/.test(text)
    ) {

      const meals =
        day.meals
          .filter(
            meal => !meal.none
          )
          .map(
            meal =>
              `${meal.label}: ${meal.meal.name}`
          )
          .join("; ");


      return `Day ${currentDay + 1}: ${meals}.`;

    }


    if (
      /water|hydrat/.test(text)
    ) {

      return "A common starting point is around 2–3 litres of fluids per day, with needs increasing in hot weather or during exercise.";

    }


    return "I can help with your calories, macros, BMI, meal plan, restrictions or estimated timeline. Try asking something like “What's for dinner?”";

  }


  $("chat-form")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const message =
          chatInput?.value.trim();


        if (!message) {
          return;
        }


        say(
          message,
          "user"
        );


        chatInput.value = "";


        setTimeout(
          () => {

            say(
              assistantReply(message),
              "bot"
            );

          },
          300
        );

      }
    );


  /* =======================================================
     INITIAL STATE
     ======================================================= */

  hide(formPage);
  hide(output);

  goToSlide(
    0,
    false
  );

  /* =======================================================
     FIXES — buttons, dashboard, day heading, activity field
     ======================================================= */

  const DAY_NAMES = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
  ];

  function updateDayHeading(i) {
    set("selected-day-title", DAY_NAMES[i] || "");
    const label = qs(".day-label");
    if (label) label.textContent = `DAY ${i + 1}`;
    if (mealPlan?.[i]) {
      set("selected-day-calories", `${fmt(mealPlan[i].totals.kcal)} kcal`);
    }
  }

  function fillDashboard() {
    if (!nutrition) return;
    set("dashboard-calories", fmt(nutrition.kcal));
    set("dashboard-protein", fmt(nutrition.protein));
    set("dashboard-carbs", fmt(nutrition.carbs));
    set("dashboard-fat", fmt(nutrition.fat));
  }

  function enhanceResults() {
    fillDashboard();
    updateDayHeading(currentDay);
    qsa(".plan-status").forEach(el => {
      el.textContent = `${profile.goal} · ${profile.diet}`.toUpperCase();
    });
  }

  // keep heading in sync when a day tab is clicked
  document.addEventListener("click", event => {
    const tab = event.target.closest(".day-tab");
    if (tab) updateDayHeading(Number(tab.dataset.day));
  });

  // move Activity Level into step 1 (where it is validated)
  const activityField = qs(".activity-field");
  const slideOnePrivacy = qs("#slide-1 .privacy-note");
  if (activityField && slideOnePrivacy) {
    slideOnePrivacy.parentElement.insertBefore(activityField, slideOnePrivacy);
  }

  function on(id, handler) {
    $(id)?.addEventListener("click", event => {
      event.preventDefault();
      handler();
    });
  }

  function startFresh() {
    formEl?.reset();
    clearErrors();
    hide(output);
    hide(landing);
    show(formPage);
    goToSlide(0);
  }

  function savedProfile() {
    if (profile) return profile;
    try {
      const saved = JSON.parse(localStorage.getItem("nutrigenProfile") || "null");
      return saved && saved.name && saved.diet ? saved : null;
    } catch (error) {
      return null;
    }
  }

  // every "back to home" style button
  on("home-brand", returnToLanding);
  on("back-home-button", returnToLanding);
  on("slide-home-button", returnToLanding);
  on("output-home-button", returnToLanding);

  // landing buttons
  on("hero-learn-button", () =>
    $("features")?.scrollIntoView({ behavior: "smooth" })
  );

  qs(".nav-link-plan")?.addEventListener("click", event => {
    event.preventDefault();
    const saved = savedProfile();
    if (saved) {
      prepareProfile(saved);
      renderResults();
    } else {
      openForm();
    }
  });

  // results page buttons
  on("new-plan-button", startFresh);
  on("create-new-plan-bottom", startFresh);});