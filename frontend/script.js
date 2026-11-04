
/* =========================================================
   NUTRIGEN — script.js
   Complete frontend logic
   HTML + CSS + JavaScript
   FastAPI meal-plan integration
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     1. HELPERS
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
    qsa(`input[name="${name}"]:checked`)
      .map(input => input.value);

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
    Number(number || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 1
    });

  const list = array =>
    array.length ? array.join(", ") : "None selected";

  const set = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };


  /* =======================================================
     2. BACKEND CONFIGURATION
     ======================================================= */

  const API_URL =
    "http://127.0.0.1:8000/generate-meal";


  /* =======================================================
     3. MAIN PAGE REFERENCES
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
  let backendResponse = null;


  /* =======================================================
     4. ACTIVITY LEVEL
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

  // Move Activity Level into Step 1.
  const activityField = qs(".activity-field");
  const slideOnePrivacy = qs("#slide-1 .privacy-note");

  if (activityField && slideOnePrivacy) {
    slideOnePrivacy.parentElement.insertBefore(
      activityField,
      slideOnePrivacy
    );
  }


  /* =======================================================
     5. NAVIGATION
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
      step.classList.toggle("active", index === currentSlide);
      step.classList.toggle("completed", index < currentSlide);
    });
  }


  function goToSlide(index, scroll = true) {
    if (!slides.length) return;

    currentSlide = Math.max(
      0,
      Math.min(slides.length - 1, index)
    );

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle(
        "hidden",
        slideIndex !== currentSlide
      );
    });

    updateProgress();

    if (scroll) {
      setTimeout(toTop, 30);
    }
  }


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
     6. LANDING PAGE BUTTONS
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


  $("hero-learn-button")?.addEventListener("click", event => {
    event.preventDefault();

    $("features")?.scrollIntoView({
      behavior: "smooth"
    });
  });


  /* =======================================================
     7. HOME / EXIT BUTTONS
     ======================================================= */

  [
    "back-to-home-button",
    "back-to-home",
    "return-home-button",
    "exit-form-button",
    "form-back-home",
    "home-brand",
    "back-home-button",
    "slide-home-button",
    "output-home-button",
    "back-to-site-button",
    "back-to-home-from-results",
    "results-back-button",
    "back-to-main-button"
  ].forEach(id => {
    $(id)?.addEventListener("click", event => {
      event.preventDefault();
      returnToLanding();
    });
  });


  /* =======================================================
     8. SIDEBAR BRAND / LOGO
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
     9. BACK / CONTINUE BUTTONS
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
     10. EDIT PROFILE BUTTONS
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
     11. VALIDATION
     ======================================================= */

  function clearErrors() {
    qsa(".validation-message")
      .forEach(element => element.remove());

    qsa(".invalid").forEach(element => {
      element.classList.remove("invalid");
    });
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
        element.focus({ preventScroll: true });
      }
    }, 60);

    return false;
  }


  const VALIDATORS = [

    // STEP 1
    () => {
      const age = num("age");
      const height = num("height");

      if (!val("name")) {
        return showError("name", "Please enter your name.");
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
        const genderGrid = qs(".gender-grid");

        return showError(
          genderGrid?.closest(".field") || genderGrid,
          "Please choose an option."
        );
      }

      if (!one("activity")) {
        const activityGrid = qs(".activity-grid");

        return showError(
          activityGrid?.closest(".field") || activityGrid,
          "Please select your activity level."
        );
      }

      return true;
    },


    // STEP 2
    () => {
      const goal = one("goal");
      const currentWeight = num("current-weight");
      const targetWeight = num("target-weight");
      const calories = num("daily-calories");

      if (!goal) {
        const goalGrid = qs(".goal-grid");

        return showError(
          goalGrid?.closest(".field") || goalGrid,
          "Please select your goal."
        );
      }

      if (
        !(currentWeight >= 20 && currentWeight <= 300)
      ) {
        return showError(
          "current-weight",
          "Enter a weight between 20 and 300 kg."
        );
      }

      if (
        !(targetWeight >= 20 && targetWeight <= 300)
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


    // STEP 3
    () => {
      if (!one("diet")) {
        const dietGrid = qs(".diet-grid");

        return showError(
          dietGrid?.closest(".field") || dietGrid,
          "Please choose your diet preference."
        );
      }

      return true;
    },


    // STEP 4
    () => true

  ];


  function validateSlide(index) {
    clearErrors();

    if (!VALIDATORS[index]) return true;

    return VALIDATORS[index]();
  }


  /* =======================================================
     12. CLEAR ERRORS WHEN USER FIXES FIELD
     ======================================================= */

  function clearFieldError(event) {
    const field = event.target.closest(".field");

    event.target.classList.remove("invalid");
    field?.classList.remove("invalid");

    field
      ?.querySelector(".validation-message")
      ?.remove();
  }


  formEl?.addEventListener("input", clearFieldError);
  formEl?.addEventListener("change", clearFieldError);


  /* =======================================================
     13. ENTER KEY NAVIGATION
     ======================================================= */

  formEl?.addEventListener("keydown", event => {
    if (
      event.key === "Enter" &&
      event.target.matches(
        'input[type="text"], input[type="number"]'
      )
    ) {
      event.preventDefault();

      const button = qs(
        ".continue-button, .generate-button, button[type='submit']",
        slides[currentSlide]
      );

      button?.click();
    }
  });


  /* =======================================================
     14. COLLECT USER PROFILE
     ======================================================= */

  function collectProfile() {
    const selectedCalories = num("daily-calories");

    return {
      name: val("name"),
      age: num("age"),
      height: num("height"),
      gender: one("gender"),
      goal: one("goal"),
      weight: num("current-weight"),
      target: num("target-weight"),

      // Backend expects null when the field is blank.
      calories: Number.isFinite(selectedCalories)
        ? selectedCalories
        : null,

      activity: Number(one("activity")) || 1.375,
      diet: one("diet"),
      preferences: many("preferences"),
      allergies: many("allergies"),
      restrictions: many("restrictions"),
      otherPreference: val("other-preference"),
      include: val("foods-to-include"),
      avoid: val("foods-to-avoid"),
      otherAllergy: val("other-allergy")
    };
  }


  /* =======================================================
     15. FASTAPI INTEGRATION
     Backend is the source of truth.
     ======================================================= */

  async function prepareProfile(profileData) {
    profile = profileData;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profileData)
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The backend returned an unreadable response."
      );
    }

    if (!response.ok) {
      const detail =
        typeof data?.detail === "string"
          ? data.detail
          : data?.message;

      throw new Error(
        detail ||
        `Backend request failed (HTTP ${response.status}).`
      );
    }

    if (
      data.status !== "success" ||
      !Array.isArray(data.meals) ||
      !data.day_totals ||
      !data.macros
    ) {
      throw new Error(
        "The backend response is missing the meal plan or nutrition totals."
      );
    }

    backendResponse = data;

    // Backend nutrition targets.
    nutrition = {
      bmr: data.bmr,
      tdee: data.tdee,
      kcal: data.daily_calories,
      protein: data.macros.protein,
      carbs: data.macros.carbs,
      fat: data.macros.fat,

      // Actual nutrition provided by generated meals.
      actualCalories: data.day_totals.calories,
      actualProtein: data.day_totals.protein,
      actualCarbs: data.day_totals.carbs,
      actualFat: data.day_totals.fat,

      notes: []
    };

    // Convert the API response to the frontend display structure.
    mealPlan = [{
      totals: {
        kcal: data.day_totals.calories,
        protein: data.day_totals.protein,
        carbs: data.day_totals.carbs,
        fat: data.day_totals.fat
      },

      meals: data.meals.map(meal => ({
        label: meal.meal,
        name: meal.dish,

        ingredients: Array.isArray(meal.items)
          ? meal.items.map(item =>
              `${item.food} (${item.grams} g)`
            ).join(", ")
          : "",

        kcal: meal.totals.calories,
        protein: meal.totals.protein,
        carbs: meal.totals.carbs,
        fat: meal.totals.fat,

        items: meal.items || [],
        notFound: meal.not_found || []
      }))
    }];

    return data;
  }


  /* =======================================================
     16. RESULTS — PROFILE SUMMARY
     ======================================================= */

  function renderSummary() {
    if (!profile || !nutrition) return;

    set("output-name", profile.name);
    set("output-age", `${profile.age} years`);
    set("output-height", `${profile.height} cm`);
    set("output-gender", profile.gender);
    set("output-goal", profile.goal);

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
        profile.calories === null
          ? " · calculated by backend"
          : ""
      }`
    );

    set("output-diet", profile.diet);
    set("output-preferences", list(profile.preferences));

    set(
      "output-allergies",
      list([
        ...profile.allergies,
        ...words(profile.otherAllergy)
      ])
    );

    set(
      "profile-greeting",
      `Your personalised one-day plan is ready, ${profile.name}.`
    );

    qsa(".plan-status").forEach(status => {
      status.textContent =
        `${profile.goal} · ${profile.diet}`.toUpperCase();
    });

    const grid = qs(".profile-summary-grid");

    if (grid) {
      qsa(".extra-card", grid).forEach(card => card.remove());

      const createCard = (label, value, wide = false) => `
        <article class="summary-card extra-card ${
          wide ? "wide-summary" : ""
        }">
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
          "MAINTENANCE CALORIES",
          `${fmt(nutrition.tdee)} kcal`
        ) +

        createCard(
          "DAILY TARGET MACROS",
          `Protein ${fmt(nutrition.protein)} g · Carbs ${fmt(nutrition.carbs)} g · Fat ${fmt(nutrition.fat)}`,
          true
        )
      );
    }
  }


  /* =======================================================
     17. RESULTS — ONE-DAY MEAL PLAN
     ======================================================= */

  function createDayNavigation() {
    qs(".day-tabs")?.remove();
    qs("#day-totals")?.remove();

    const grid = qs(".meal-plan-grid");
    if (!grid) return;

    grid.insertAdjacentHTML(
      "beforebegin",
      `<div class="day-totals" id="day-totals"></div>`
    );
  }


  function renderDay() {
    if (!mealPlan?.[0]) return;

    const day = mealPlan[0];

    const totals = $("day-totals");

    if (totals) {
      totals.innerHTML = `
        <div class="day-total-item">
          <strong>
            ${fmt(day.totals.kcal)}
            <small>kcal</small>
          </strong>
          <span>Actual calories</span>
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

    set("selected-day-title", "Your daily meal plan");

    set(
      "selected-day-calories",
      `${fmt(day.totals.kcal)} kcal`
    );

    const dayLabel = qs(".day-label");

    if (dayLabel) {
      dayLabel.textContent = "ONE-DAY PLAN";
    }

    const grid = qs(".meal-plan-grid");
    if (!grid) return;

    grid.innerHTML = day.meals.map(meal => {
      const ingredients = meal.items?.length
        ? meal.items.map(item =>
            `${esc(item.food)} — ${fmt(item.grams)} g`
          ).join(" · ")
        : esc(meal.ingredients || "Ingredient details unavailable.");

      const missing = meal.notFound?.length
        ? `
          <p class="meal-ingredients">
            Unavailable ingredients:
            ${esc(meal.notFound.join(", "))}
          </p>
        `
        : "";

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
              ${esc(meal.label.toUpperCase())}
            </span>

            <h3>${esc(meal.name)}</h3>

            <p class="meal-ingredients">
              ${ingredients}
            </p>

            ${missing}

            <div class="macro-line">
              <b>${fmt(meal.kcal)} kcal</b>
              <i>P ${fmt(meal.protein)}g</i>
              <i>C ${fmt(meal.carbs)}g</i>
              <i>F ${fmt(meal.fat)}g</i>
            </div>

          </div>

        </article>
      `;
    }).join("");
  }


  /* =======================================================
     18. RESULTS — DASHBOARD
     ======================================================= */

  function fillDashboard() {
    if (!nutrition) return;

    // Actual meal totals, not target values.
    set(
      "dashboard-calories",
      fmt(nutrition.actualCalories)
    );

    set(
      "dashboard-protein",
      fmt(nutrition.actualProtein)
    );

    set(
      "dashboard-carbs",
      fmt(nutrition.actualCarbs)
    );

    set(
      "dashboard-fat",
      fmt(nutrition.actualFat)
    );
  }


  function enhanceResults() {
    fillDashboard();

    qsa(".plan-status").forEach(element => {
      element.textContent =
        `${profile.goal} · ${profile.diet}`.toUpperCase();
    });
  }


  /* =======================================================
     19. RESULTS — EXPLANATION
     ======================================================= */

  function renderExplanation() {
    const explanation = qs(".future-note");
    if (!explanation) return;

    explanation.innerHTML = `
      <div class="explanation-mark">i</div>

      <div>
        <strong>How your plan was generated</strong>

        <p>
          NutriGen sent your profile and food preferences
          to its FastAPI backend. The backend calculated
          your daily calorie and macro targets and
          generated your one-day meal plan.
        </p>

        <p>
          The meal cards and actual nutrition totals shown
          above come directly from the backend response.
        </p>

        <p class="explanation-disclaimer">
          Nutrition values are estimates for planning
          purposes and are not medical advice. Always
          verify ingredients and food labels, particularly
          when managing allergies or medical conditions.
        </p>
      </div>
    `;
  }


  /* =======================================================
     20. COMPLETE RESULTS PAGE
     ======================================================= */

  function renderResults() {
    if (!profile || !nutrition || !mealPlan) return;

    renderSummary();
    createDayNavigation();
    renderDay();
    renderExplanation();
    enhanceResults();

    openResults();
  }


  /* =======================================================
     21. SAVE GENERATED PLAN
     ======================================================= */

  function saveGeneratedPlan() {
    try {
      localStorage.setItem(
        "nutrigenProfile",
        JSON.stringify(profile)
      );

      localStorage.setItem(
        "nutrigenLastPlan",
        JSON.stringify({
          profile,
          response: backendResponse
        })
      );
    } catch (error) {
      console.warn(
        "Unable to save the plan locally.",
        error
      );
    }
  }


  /* =======================================================
     22. SUBMIT FORM — CALL BACKEND
     ======================================================= */

  formEl?.addEventListener("submit", async event => {
    event.preventDefault();

    for (let index = 0; index < slides.length; index++) {
      if (!validateSlide(index)) {
        goToSlide(index, false);
        return;
      }
    }

    const collected = collectProfile();

    const submitButton = qs(
      ".generate-button, button[type='submit']",
      formEl
    );

    const originalText =
      submitButton?.textContent;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Generating your plan...";
    }

    try {
      await prepareProfile(collected);

      saveGeneratedPlan();

      setupLastPlanButton();

      renderResults();

    } catch (error) {
      console.error("NutriGen API error:", error);

      alert(
        `We couldn't generate your meal plan.\n\n${error.message}\n\nPlease check that the NutriGen backend is running and try again.`
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent =
          originalText || "Build My Plan";
      }
    }
  });


  /* =======================================================
     23. LOAD SAVED BACKEND RESPONSE
     ======================================================= */

  function restoreSavedPlan(savedPlan) {
    if (
      !savedPlan?.profile ||
      !savedPlan?.response
    ) {
      throw new Error("No saved meal plan was found.");
    }

    const data = savedPlan.response;

    if (
      data.status !== "success" ||
      !Array.isArray(data.meals) ||
      !data.day_totals ||
      !data.macros
    ) {
      throw new Error("The saved meal plan is incomplete.");
    }

    profile = savedPlan.profile;
    backendResponse = data;

    nutrition = {
      bmr: data.bmr,
      tdee: data.tdee,
      kcal: data.daily_calories,
      protein: data.macros.protein,
      carbs: data.macros.carbs,
      fat: data.macros.fat,

      actualCalories: data.day_totals.calories,
      actualProtein: data.day_totals.protein,
      actualCarbs: data.day_totals.carbs,
      actualFat: data.day_totals.fat,

      notes: []
    };

    mealPlan = [{
      totals: {
        kcal: data.day_totals.calories,
        protein: data.day_totals.protein,
        carbs: data.day_totals.carbs,
        fat: data.day_totals.fat
      },

      meals: data.meals.map(meal => ({
        label: meal.meal,
        name: meal.dish,

        ingredients: (meal.items || []).map(item =>
          `${item.food} (${item.grams} g)`
        ).join(", "),

        kcal: meal.totals.calories,
        protein: meal.totals.protein,
        carbs: meal.totals.carbs,
        fat: meal.totals.fat,

        items: meal.items || [],
        notFound: meal.not_found || []
      }))
    }];

    renderResults();
  }


  function setupLastPlanButton() {
    $("last-plan-button")?.remove();

    let savedPlan = null;

    try {
      savedPlan = JSON.parse(
        localStorage.getItem("nutrigenLastPlan") || "null"
      );
    } catch (error) {
      console.warn("Unable to read saved plan.", error);
    }

    if (!savedPlan?.profile || !savedPlan?.response) return;

    const heroActions = qs(".hero-actions");
    if (!heroActions) return;

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

    $("last-plan-button")?.addEventListener("click", event => {
      event.preventDefault();

      try {
        restoreSavedPlan(savedPlan);
      } catch (error) {
        console.error(error);
        alert(
          "Your saved plan could not be loaded. Please generate a new plan."
        );
      }
    });
  }


  setupLastPlanButton();


  /* =======================================================
     24. RESULTS PAGE — NEW PLAN BUTTONS
     ======================================================= */

  function startFresh() {
    formEl?.reset();

    profile = null;
    nutrition = null;
    mealPlan = null;
    backendResponse = null;

    clearErrors();

    hide(output);
    hide(landing);
    show(formPage);

    goToSlide(0);
  }


  function on(id, handler) {
    $(id)?.addEventListener("click", event => {
      event.preventDefault();
      handler();
    });
  }


  on("new-plan-button", startFresh);
  on("create-new-plan-bottom", startFresh);


  /* =======================================================
     25. PLAN NAVIGATION LINK
     ======================================================= */

  qs(".nav-link-plan")?.addEventListener("click", event => {
    event.preventDefault();

    const savedButton = $("last-plan-button");

    if (savedButton) {
      savedButton.click();
    } else {
      openForm();
    }
  });


  /* =======================================================
     26. CHAT ASSISTANT
     ======================================================= */

  const chatPanel = $("chat-panel");
  const chatInput = $("chat-input");
  const chatBox = $("chat-messages");


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


  $("chat-toggle")?.addEventListener("click", () => {
    if (chatPanel?.classList.contains("hidden")) {
      openChat();
    } else {
      closeChat();
    }
  });


  qs(".chat-close")?.addEventListener(
    "click",
    closeChat
  );


  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeChat();
    }
  });


  function say(message, sender) {
    if (!chatBox) return;

    const element = document.createElement("div");

    element.className = `chat-message ${sender}`;
    element.textContent = message;

    chatBox.appendChild(element);

    chatBox.scrollTop = chatBox.scrollHeight;
  }


  function assistantReply(message) {
    const text = message.toLowerCase();

    if (/^(hi|hello|hey)\b/.test(text)) {
      return profile
        ? `Hello ${profile.name}. I can help you understand your daily calorie target, actual meal totals, macros, meals and food restrictions.`
        : "Hello. Build your plan first and I can answer questions using your personalised nutrition data.";
    }

    if (!profile || !nutrition || !mealPlan?.[0]) {
      return "Build your plan first and I can answer using your own nutrition targets and meal plan.";
    }

    const day = mealPlan[0];

    const meal = day.meals.find(item =>
      text.includes(item.label.toLowerCase())
    );

    if (meal) {
      return `${meal.label}: ${meal.name}. It provides approximately ${fmt(meal.kcal)} kcal, ${fmt(meal.protein)} g protein, ${fmt(meal.carbs)} g carbohydrates and ${fmt(meal.fat)} g fat.`;
    }

    if (/bmi/.test(text)) {
      return "BMI is not included in your current NutriGen results. I can help you with your calorie targets and meal nutrition instead.";
    }

    if (/macro|protein|carb|fat/.test(text)) {
      return `Your daily targets are ${fmt(nutrition.protein)} g protein, ${fmt(nutrition.carbs)} g carbohydrates and ${fmt(nutrition.fat)} g fat. Your generated meals provide ${fmt(nutrition.actualProtein)} g protein, ${fmt(nutrition.actualCarbs)} g carbohydrates and ${fmt(nutrition.actualFat)} g fat.`;
    }

    if (/calor|kcal|target|maintenance/.test(text)) {
      return `Your daily calorie target is ${fmt(nutrition.kcal)} kcal. Your generated meals provide ${fmt(nutrition.actualCalories)} kcal. Your estimated maintenance level is ${fmt(nutrition.tdee)} kcal.`;
    }

    if (/allerg|avoid|restrict/.test(text)) {
      const restrictions = [
        ...profile.allergies,
        ...words(profile.otherAllergy),
        ...profile.restrictions,
        ...words(profile.avoid)
      ];

      return restrictions.length
        ? `Your selected exclusions are: ${restrictions.join(", ")}. Please still verify ingredient lists and food labels yourself.`
        : "You have not listed any allergies or additional restrictions.";
    }

    if (/today|day|plan|meal|eat/.test(text)) {
      const meals = day.meals
        .map(item =>
          `${item.label}: ${item.name} (${fmt(item.kcal)} kcal)`
        )
        .join("; ");

      return `Your one-day meal plan is: ${meals}.`;
    }

    if (/water|hydrat/.test(text)) {
      return "Hydration needs vary with activity, climate and individual health. Drink regularly throughout the day.";
    }

    return "I can help with your calorie target, actual meal totals, protein, carbohydrates, fats, breakfast, lunch, snack, dinner and food restrictions. Try asking, “What's for dinner?”";
  }


  $("chat-form")?.addEventListener("submit", event => {
    event.preventDefault();

    const message = chatInput?.value.trim();

    if (!message) return;

    say(message, "user");

    chatInput.value = "";

    setTimeout(() => {
      say(
        assistantReply(message),
        "bot"
      );
    }, 300);
  });


  /* =======================================================
     27. INITIAL STATE
     ======================================================= */

  hide(formPage);
  hide(output);

  goToSlide(0, false);

});
