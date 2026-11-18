/* =========================================================
   NUTRIGEN — script.js
   Complete frontend logic
   HTML + CSS + JavaScript
   FastAPI meal-plan integration (100% pure client-side upgrades)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =======================================================
   PREVENT ACCIDENTAL NUMBER CHANGES ON MOUSE WHEEL
   ======================================================= */

document.addEventListener("wheel", (event) => {
    const input = event.target.closest('input[type="number"]');

    if (input && document.activeElement === input) {
        input.blur();
    }
}, {
    capture: true,
    passive: true
});

  /* =======================================================
     1. HELPERS
     ======================================================= */

  const $ = id => document.getElementById(id);
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  const esc = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const val = id => ($(id)?.value || "").trim();

  const num = id => {
    const value = val(id);
    return value === "" ? NaN : Number(value);
  };

  const one = name => qs(`input[name="${name}"]:checked`)?.value || "";
  const many = name => qsa(`input[name="${name}"]:checked`).map(input => input.value);

  const show = element => element?.classList.remove("hidden");
  const hide = element => element?.classList.add("hidden");

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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

  const list = array => (array.length ? array.join(", ") : "None selected");

  const set = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };

  /* =======================================================
     2. BACKEND CONFIGURATION
     ======================================================= */

  const API_URL = "http://127.0.0.1:8000/generate-meal";

  /* =======================================================
     3. CLEAN FOOD & INGREDIENT NAMES (Removes DB Jargon)
     ======================================================= */

  function cleanFoodText(text) {
    if (!text) return "";
    let cleaned = String(text);

    // Remove brands like ", UNCLE BENS", ", QUAKER"
    cleaned = cleaned.replace(/,\s*(UNCLE BENS|QUAKER|KRAFT|DOLE|GENERAL MILLS)[^,]*/gi, "");

    // Remove technical database preparation state suffixes
    cleaned = cleaned.replace(/,\s*(mature seeds|canned|drained solids|cooked|raw|boiled|parboiled|without skin|without salt)[^,]*/gi, "");

    // Remove parenthetical alternative names
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, "");

    // Clean multiple commas/spaces
    cleaned = cleaned.replace(/\s*,\s*,+/g, ", ").replace(/,\s*$/g, "").trim();

    // Convert ALL-CAPS strings into clean Title Case
    if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
      cleaned = cleaned.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    return cleaned || text;
  }

  /* =======================================================
     4. MEAL ICONS, TIMINGS & PREP ESTIMATES
     ======================================================= */

  const MEAL_ICONS = {
    breakfast: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v3M18.4 5.6l-2.1 2.1M5.6 5.6l2.1 2.1M2 14h20M5 14a7 7 0 0 0 14 0" />
      </svg>
    `,
    lunch: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    `,
    snack: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3c-1.5 2-1 4-1 4s2 .5 4-1c-1-2-3-3-3-3z" />
        <path d="M12 7c-4 0-7 3.5-7 8a7 7 0 0 0 14 0c0-4.5-3-8-7-8z" />
      </svg>
    `,
    dinner: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    `
  };

  const MEAL_TIMES = {
    breakfast: "~8:30 AM",
    lunch: "~1:00 PM",
    snack: "~4:30 PM",
    dinner: "~7:30 PM"
  };

  const MEAL_PREP = {
    breakfast: "⏱ 10 mins prep",
    lunch: "⏱ 15 mins prep",
    snack: "⏱ 5 mins prep",
    dinner: "⏱ 20 mins prep"
  };

  /* =======================================================
     5. ERROR BANNER & BRANDED LUXURY LIGHT LOADING
     ======================================================= */

  function showAPIError(message) {
    const banner = $("api-error-banner");
    const msgEl = $("api-error-message");
    if (msgEl) {
      msgEl.textContent = message || "Please check that the backend is running and try again.";
    }
    if (banner) {
      show(banner);
      banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function hideAPIError() {
    hide($("api-error-banner"));
  }

  $("api-error-close")?.addEventListener("click", hideAPIError);

  let loadingInterval = null;

  const LOADING_STEPS = [
    {
      id: "l-step-1",
      heading: "Understanding your body…",
      active: "Working out how much energy your body needs",
      done: "Calculated your daily calorie target"
    },
    {
      id: "l-step-2",
      heading: "Making it safe for you…",
      active: "Checking your allergies and food choices",
      done: "Removed foods you can't or won't eat"
    },
    {
      id: "l-step-3",
      heading: "Balancing your nutrition…",
      active: "Balancing protein, carbs and fats for your goal",
      done: "Balanced protein, carbs and fats"
    },
    {
      id: "l-step-4",
      heading: "Picking your meals…",
      active: "Building meals that match your numbers",
      done: "Meals matched to your numbers"
    }
  ];

  function setLoadingStep(index, state) {
    const step = LOADING_STEPS[index];
    const el = step && $(step.id);
    if (!el) return;
    el.classList.remove("active", "done");
    if (state) el.classList.add(state);
    const label = qs(".ck-text", el);
    if (label) label.textContent = state === "done" ? step.done : step.active;
  }

  function showLoading() {
    show($("loading-overlay"));
    if (loadingInterval) clearInterval(loadingInterval);

    let idx = 0;
    let pct = 8;
    LOADING_STEPS.forEach((_, i) => setLoadingStep(i, null));
    setLoadingStep(0, "active");
    set("loading-main-text", LOADING_STEPS[0].heading);

    const bar = $("laser-progress-bar");
    if (bar) bar.style.width = `${pct}%`;

    loadingInterval = setInterval(() => {
      if (idx < LOADING_STEPS.length - 1) {
        // finish this step (green tick) and start the next one (spinner)
        setLoadingStep(idx, "done");
        idx++;
        setLoadingStep(idx, "active");
        set("loading-main-text", LOADING_STEPS[idx].heading);
        pct = 8 + Math.round((idx / LOADING_STEPS.length) * 78);
      } else {
        // last step keeps spinning until the plan really arrives; the bar creeps so it never looks frozen
        pct = Math.min(95, pct + 1.5);
      }
      if (bar) bar.style.width = `${pct}%`;
    }, 1800);
  }

  function hideLoading() {
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = null;
    const bar = $("laser-progress-bar");
    if (bar) bar.style.width = "100%";
    hide($("loading-overlay"));
  }

  /* =======================================================
     6. MAIN PAGE REFERENCES & STATE
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

  // Per-meal swap history: { Breakfast: { options: [rawMeal, ...], idx: 0 }, ... }
  let swapState = {};
  // Grocery items the user has already ticked (kept across swaps)
  let groceryTicked = new Set();
  const swapBusy = new Set();

  /* =======================================================
     7. MAINTAIN WEIGHT LOGIC (Auto-lock Target Weight)
     ======================================================= */

  function handleGoalChange() {
    const goal = one("goal");
    const currentWeightInput = $("current-weight");
    const targetWeightInput = $("target-weight");
    const targetHint = $("target-weight-hint");

    if (!targetWeightInput) return;

    if (goal === "Maintain Weight") {
      targetWeightInput.value = currentWeightInput?.value || "";
      targetWeightInput.setAttribute("readonly", "true");
      targetWeightInput.classList.add("input-locked");
      if (targetHint) {
        targetHint.textContent = "🔒 Target locked to current weight (Maintain balance).";
        targetHint.style.color = "var(--g700)";
      }
    } else {
      targetWeightInput.removeAttribute("readonly");
      targetWeightInput.classList.remove("input-locked");
      if (targetHint) {
        targetHint.textContent = "Your desired target in kilograms.";
        targetHint.style.color = "var(--muted)";
      }
    }
  }

  qsa('input[name="goal"]').forEach(r => r.addEventListener("change", handleGoalChange));

  $("current-weight")?.addEventListener("input", () => {
    if (one("goal") === "Maintain Weight") {
      const targetInput = $("target-weight");
      if (targetInput) targetInput.value = $("current-weight")?.value || "";
    }
  });

  /* =======================================================
     8. DYNAMIC DIET FILTER FOR ALLERGIES (Slide 3 -> 4)
     ======================================================= */

  function applyDietFilterToAllergies() {
    const diet = one("diet");
    const isVeg = diet === "Vegetarian" || diet === "Vegan";

    qsa('[data-diet-filter="non-veg"]').forEach(card => {
      const input = card.querySelector('input[type="checkbox"]');
      if (isVeg) {
        card.style.display = "none";
        if (input) input.checked = false;
      } else {
        card.style.display = "";
      }
    });

    // Layout only: if just one restriction card is left visible, show it as a full-width row
    const restrictionGrid = qs(".restriction-grid");
    if (restrictionGrid) {
      const visibleCards = qsa(".check-card", restrictionGrid).filter(c => c.style.display !== "none");
      restrictionGrid.classList.toggle("single-option", visibleCards.length === 1);
    }
  }

  qsa('input[name="diet"]').forEach(r => {
    r.addEventListener("change", applyDietFilterToAllergies);
  });

  /* =======================================================
     9. NAVIGATION & CLICKABLE PROGRESS SIDEBAR
     ======================================================= */

  function updateProgress() {
    const percentage = ((currentSlide + 1) / slides.length) * 100;
    const progressFill = $("progress-fill");
    const progressText = $("progress-text");

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.textContent = `Step ${currentSlide + 1} of ${slides.length}`;

    qsa(".progress-step").forEach((step, index) => {
      step.classList.toggle("active", index === currentSlide);
      step.classList.toggle("completed", index < currentSlide);
    });
  }

  function goToSlide(index, scroll = true) {
    if (!slides.length) return;
    currentSlide = Math.max(0, Math.min(slides.length - 1, index));

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("hidden", slideIndex !== currentSlide);
    });

    updateProgress();
    if (scroll) setTimeout(toTop, 30);
  }

  qsa(".progress-step").forEach(step => {
    step.addEventListener("click", () => {
      const targetSlide = Number(step.dataset.slide);
      if (!isNaN(targetSlide) && targetSlide <= currentSlide) {
        goToSlide(targetSlide);
      }
    });
  });

  function returnToLanding() {
    hide(formPage);
    hide(output);
    show(landing);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openForm() {
    hide(landing);
    hide(output);
    show(formPage);

    // Returning users: don't show the last person's answers — start blank so the
    // "Which one are you?" prompt can ask who is filling the form
    if (readSavedProfiles().length) {
      formEl?.reset();
      clearErrors();
    }
    applyDietFilterToAllergies();
    handleGoalChange();
    goToSlide(0);
    refreshSavedBanner(); // "Welcome back — is this you?" prompt for returning users
  }

  function openResults() {
    hide(landing);
    hide(formPage);
    show(output);
    setTimeout(toTop, 30);
  }

  ["start-plan-button", "hero-start-button", "how-it-works-start-button"].forEach(id => {
    $(id)?.addEventListener("click", e => { e.preventDefault(); openForm(); });
  });

  $("hero-learn-button")?.addEventListener("click", e => {
    e.preventDefault();
    $("features")?.scrollIntoView({ behavior: "smooth" });
  });

  [
    "back-to-home-button", "back-to-home", "return-home-button",
    "exit-form-button", "form-back-home", "home-brand",
    "back-home-button", "slide-home-button", "output-home-button"
  ].forEach(id => {
    $(id)?.addEventListener("click", e => { e.preventDefault(); returnToLanding(); });
  });

  qsa(".back-button").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      if (currentSlide === 0) { returnToLanding(); return; }
      goToSlide(currentSlide - 1);
    });
  });

  qsa(".continue-button").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      if (validateSlide(currentSlide)) {
        if (currentSlide === 2) applyDietFilterToAllergies();
        goToSlide(currentSlide + 1);
      }
    });
  });

  ["edit-profile-button", "edit-profile-button-bottom"].forEach(id => {
    $(id)?.addEventListener("click", e => {
      e.preventDefault();
      hide(output);
      hide(landing);
      show(formPage);
      applyDietFilterToAllergies();
      handleGoalChange();
      goToSlide(0);
      refreshSavedBanner();
    });
  });

  /* =======================================================
     10. BACK TO TOP, QUICK-JUMP DOCK & SCROLL-SPY
     ======================================================= */

  /* =======================================================
     10. BACK TO TOP, FLOATING QUICK-JUMP DOCK & SCROLL-SPY
     ======================================================= */

  const backToTopBtn = $("back-to-top");
  const dockPills = qsa(".dock-pill");
  const dockNav = $("quick-jump-dock");

  const dockTargets = dockPills
    .map(pill => ({ pill, el: $(pill.dataset.target) }))
    .filter(t => t.el);

  const SPY_OFFSET = 120;
  let spyLocked = false;
  let spyTimer = null;
  let spyTicking = false;

  function setActivePill(pill) {
    dockPills.forEach(p => {
      const on = p === pill;
      p.classList.toggle("active", on);
      if (on) p.setAttribute("aria-current", "true");
      else p.removeAttribute("aria-current");
    });
  }

  // A section counts as "reached" once it sits at (or above) the spot that
  // clicking its pill scrolls it to: scroll-margin-top + scroll-padding-top.
  function spyOffsetFor(el) {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return Math.max(SPY_OFFSET, margin + padding + 12);
  }

  function updateScrollSpy() {
    spyTicking = false;

    const y = window.scrollY;
    const planVisible = output && !output.classList.contains("hidden");

    // Back-to-top button
    backToTopBtn?.classList.toggle("hidden", y < 500);

    // Floating navigation follows the screen
    dockNav?.classList.toggle(
      "is-visible",
      planVisible && y > window.innerHeight * 0.5
    );

    // Update active section
    if (spyLocked || !dockTargets.length || !planVisible) return;

    const sorted = dockTargets
      .map(t => ({
        ...t,
        top: t.el.getBoundingClientRect().top + y
      }))
      .sort((a, b) => a.top - b.top);

    let current = sorted[0];

    sorted.forEach(t => {
      if (t.top - spyOffsetFor(t.el) <= y) current = t;
    });

    if (y < 80) current = sorted[0];

    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) {
      current = sorted[sorted.length - 1];
    }

    setActivePill(current.pill);
  }

  window.addEventListener("scroll", () => {
    if (spyLocked) {
      clearTimeout(spyTimer);
      spyTimer = setTimeout(() => {
        spyLocked = false;
        updateScrollSpy();
      }, 150);
    }

    if (!spyTicking) {
      spyTicking = true;
      requestAnimationFrame(updateScrollSpy);
    }
  }, { passive: true });

  window.addEventListener("resize", updateScrollSpy);

  // Re-sync when the generated plan is shown or hidden
  if (output) {
    new MutationObserver(() => {
      setTimeout(updateScrollSpy, 60);
    }).observe(output, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  // Back-to-top
  backToTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Jump to selected meal-plan section
  dockPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const target = $(pill.dataset.target);
      if (!target) return;

      // e.g. the Grocery pill opens the hidden checklist first
      if (pill.dataset.open) show($(pill.dataset.open));

      spyLocked = true;
      clearTimeout(spyTimer);

      spyTimer = setTimeout(() => {
        spyLocked = false;
        updateScrollSpy();
      }, 1200);

      setActivePill(pill);

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });


     /* =======================================================
     11. FORM VALIDATION
     ======================================================= */

  function clearErrors() {
    qsa(".validation-message").forEach(el => el.remove());
    qsa(".invalid").forEach(el => el.classList.remove("invalid"));
  }

  function showError(target, message) {
    const el = typeof target === "string" ? $(target) : target;
    if (!el) return false;

    el.classList.add("invalid");
    const container = el.closest(".field") || el.parentElement;

    if (container) {
      container.insertAdjacentHTML("beforeend", `<div class="validation-message">${esc(message)}</div>`);
    }

    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el.matches("input") && el.type !== "radio" && el.type !== "checkbox") {
        el.focus({ preventScroll: true });
      }
    }, 60);

    return false;
  }

  const VALIDATORS = [
    // Step 1
    () => {
      const age = num("age");
      const height = num("height");
      if (!val("name")) return showError("name", "Please enter your name.");
      if (!(age >= 1 && age <= 120)) return showError("age", "Enter an age between 1 and 120.");
      if (!(height >= 50 && height <= 250)) return showError("height", "Enter a height between 50 and 250 cm.");
      if (!one("gender")) return showError(qs(".gender-grid"), "Please choose an option.");
      if (!one("activity")) return showError(qs(".activity-grid"), "Please select your activity level.");
      return true;
    },
    // Step 2
    () => {
      const goal = one("goal");
      const currentWeight = num("current-weight");
      const targetWeight = num("target-weight");
      const calories = num("daily-calories");

      if (!goal) return showError(qs(".goal-grid"), "Please select your goal.");
      if (!(currentWeight >= 20 && currentWeight <= 300)) {
        return showError("current-weight", "Enter a weight between 20 and 300 kg.");
      }

      if (goal !== "Maintain Weight" && !(targetWeight >= 20 && targetWeight <= 300)) {
        return showError("target-weight", "Enter a weight between 20 and 300 kg.");
      }

      if (!isNaN(calories) && (calories < 1000 || calories > 6000)) {
        return showError("daily-calories", "Calories should be between 1000 and 6000.");
      }

      if (goal === "Weight Loss" && targetWeight >= currentWeight) {
        return showError("target-weight", "For weight loss, target must be lower than your current weight.");
      }

      if (goal === "Weight Gain" && targetWeight <= currentWeight) {
        return showError("target-weight", "For weight gain, target must be higher than your current weight.");
      }

      return true;
    },
    // Step 3
    () => {
      if (!one("diet")) return showError(qs(".diet-grid"), "Please choose your diet preference.");
      return true;
    },
    // Step 4
    () => true
  ];

  function validateSlide(index) {
    clearErrors();
    return VALIDATORS[index] ? VALIDATORS[index]() : true;
  }

  formEl?.addEventListener("input", e => {
    e.target.classList.remove("invalid");
    const f = e.target.closest(".field");
    f?.classList.remove("invalid");
    f?.querySelector(".validation-message")?.remove();
  });

  formEl?.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches('input[type="text"], input[type="number"]')) {
      e.preventDefault();
      qs(".continue-button, .generate-button, button[type='submit']", slides[currentSlide])?.click();
    }
  });

  /* =======================================================
     12. COLLECT USER PROFILE
     (Includes custom other-restriction seamlessly)
     ======================================================= */

  function collectProfile() {
    const selectedCalories = num("daily-calories");
    const currentW = num("current-weight");
    const targetW = one("goal") === "Maintain Weight" ? currentW : num("target-weight");
    const otherRest = val("other-restriction");
    const rawRest = many("restrictions");
    const mergedRestrictions = [
      ...rawRest,
      ...(otherRest ? [otherRest] : [])
    ];

    return {
      name: val("name"),
      age: num("age"),
      height: num("height"),
      gender: one("gender"),
      goal: one("goal"),
      weight: currentW,
      target: targetW,
      calories: Number.isFinite(selectedCalories) ? selectedCalories : null,
      activity: Number(one("activity")) || 1.375,
      diet: one("diet"),
      preferences: many("preferences"),
      allergies: many("allergies"),
      restrictions: mergedRestrictions,
      otherRestriction: otherRest,
      otherPreference: val("other-preference"),
      include: val("foods-to-include"),
      avoid: val("foods-to-avoid"),
      otherAllergy: val("other-allergy")
    };
  }

  /* =======================================================
     13. FASTAPI INTEGRATION & ADAPTER
     ======================================================= */

  async function prepareProfile(profileData) {
    profile = profileData;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);
    let response;

    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("The backend returned an unreadable response.");
    }

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `Request failed (HTTP ${response.status}).`);
    }

    if (data.status !== "success" || !Array.isArray(data.meals) || !data.day_totals || !data.macros) {
      throw new Error("Backend response is missing meals or nutrition data.");
    }

    backendResponse = data;
    swapState = {};          // new plan → fresh swap history
    groceryTicked = new Set();

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
      actualFat: data.day_totals.fat
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
        name: cleanFoodText(meal.dish),
        rawDish: meal.dish,
        kcal: meal.totals?.calories || 0,
        protein: meal.totals?.protein || 0,
        carbs: meal.totals?.carbs || 0,
        fat: meal.totals?.fat || 0,
        items: (meal.items || []).map(item => ({
          ...item,
          food: cleanFoodText(item.food), foodRaw: item.food
        })),
        notFound: meal.not_found || []
      }))
    }];

    return data;
  }

  /* =======================================================
     14. RENDER RESULTS — PROFILE & VISUAL BMI GAUGE
     ======================================================= */

  function renderSummary() {
    if (!profile || !nutrition) return;

    // BMI calculation
    const hM = profile.height / 100;
    const bmiVal = Number((profile.weight / (hM * hM)).toFixed(1));
    const minIdeal = (18.5 * hM * hM).toFixed(1);
    const maxIdeal = (24.9 * hM * hM).toFixed(1);

    set("output-name", profile.name);
    set("output-age", `${profile.age} years`);
    set("output-height", `${profile.height} cm`);
    set("output-bmi", `${bmiVal} kg/m²`);
    set("output-gender", profile.gender);
    set("output-goal", profile.goal);
    set("output-current-weight", `${profile.weight} kg`);
    set("output-target-weight", `${profile.target} kg`);
    set("output-calories", `${fmt(nutrition.kcal)} kcal${profile.calories === null ? " · target" : ""}`);
    set("output-diet", profile.diet);
   set(
  "output-preferences",
  list([
    ...profile.preferences,
    ...(profile.otherPreference ? [profile.otherPreference.trim()] : [])
  ])
);
    set("output-allergies", list([...profile.allergies, ...words(profile.otherAllergy)]));
    set("profile-greeting", `Calibrated for ${profile.name} (${profile.goal} · ${profile.diet}).`);

    qsa(".plan-status").forEach(st => {
      st.textContent = `${profile.goal} · ${profile.diet}`.toUpperCase();
    });

    // Visual BMI gauge: position on a 15 → 40 BMI scale (matches the CSS zone widths)
    let category;
    let catClass;

    if (bmiVal < 18.5) {
      category = "Underweight";
      catClass = "under";
    } else if (bmiVal <= 24.9) {
      category = "Normal (Healthy)";
      catClass = "normal";
    } else if (bmiVal <= 29.9) {
      category = "Overweight";
      catClass = "over";
    } else {
      category = "Obese Range";
      catClass = "obese";
    }

    const pct = ((Math.min(Math.max(bmiVal, 15), 40) - 15) / 25) * 100;

    const pointer = $("bmi-pointer");
    if (pointer) pointer.style.left = `${pct}%`;

    const statusPill = $("bmi-status-pill");
    if (statusPill) {
      statusPill.textContent = `● ${category}`;
      statusPill.className = `bmi-status-pill ${catClass}`;
    }

    set("bmi-desc-text", `WHO classified normal weight range for ${profile.height} cm: ${minIdeal} – ${maxIdeal} kg.`);

    // Personal Encouragement Note
    set("encouragement-title", `Healthy progress is built one meal at a time, ${profile.name}.`);
    set("encouragement-body", `Healthy living isn't about rigid deprivation, guilt, or perfection—it's about fueling your body with balanced, portioned foods that respect your routine. Use this plan as your daily guide, stay consistent, and celebrate taking this positive step today!`);

    // Thermodynamic Energy Balance Calculation
    const grid = qs(".profile-summary-grid");
    if (grid) {
      qsa(".extra-card", grid).forEach(c => c.remove());

      const tdee = nutrition.tdee || 0;
      const targetKcal = nutrition.kcal || 0;
      const diffKcal = targetKcal - tdee;

      let energySummaryText = `Equilibrium maintenance at ${fmt(tdee)} kcal/day`;
      if (profile.goal === "Weight Loss" && diffKcal < 0) {
        const weeklyLoss = (Math.abs(diffKcal) * 7 / 7700).toFixed(2);
        energySummaryText = `Deficit: ${fmt(diffKcal)} kcal/day · Projected fat loss: ~${weeklyLoss} kg/week`;
      } else if (profile.goal === "Weight Gain" && diffKcal > 0) {
        const weeklyGain = (diffKcal * 7 / 7700).toFixed(2);
        energySummaryText = `Surplus: +${fmt(diffKcal)} kcal/day · Projected surplus: ~${weeklyGain} kg/week`;
      }

      const createCard = (lbl, val, wide = false) => `
        <article class="summary-card extra-card ${wide ? "wide-summary" : ""}">
          <span class="summary-label">${esc(lbl)}</span>
          <strong>${esc(val)}</strong>
        </article>
      `;

      grid.insertAdjacentHTML(
        "beforeend",
        createCard("MAINTENANCE (TDEE)", `${fmt(tdee)} kcal`) +
        createCard("DAILY CALORIE BALANCE", energySummaryText, true)
      );
    }
  }

  /* =======================================================
     15. RENDER DASHBOARD, TOLERANCE BAND & MACRO RATIOS
     ======================================================= */

  function fillDashboard() {
    if (!nutrition) return;

    const cal = nutrition.actualCalories;
    const prot = nutrition.actualProtein;
    const carbs = nutrition.actualCarbs;
    const fat = nutrition.actualFat;

    set("dashboard-calories", fmt(cal));
    set("dashboard-protein", fmt(prot));
    set("dashboard-carbs", fmt(carbs));
    set("dashboard-fat", fmt(fat));

    // Tolerance Band (±5%) defending target vs actual
    const targetKcal = nutrition.kcal || cal;
    const lowerBound = Math.round(targetKcal * 0.95);
    const upperBound = Math.round(targetKcal * 1.05);

    const bandEl = $("dashboard-cal-band");
    if (bandEl) {
      bandEl.textContent = `kcal/day (Acceptable buffer: ${fmt(lowerBound)} – ${fmt(upperBound)} kcal)`;
    }

    const pill = $("target-match-pill");
    if (pill) {
      const isWithinBand = cal >= lowerBound && cal <= upperBound;
      const diff = Math.round(cal - targetKcal);
      const sign = diff >= 0 ? `+${diff}` : `${diff}`;

      if (isWithinBand) {
        pill.textContent = `✓ Within Target Range (${sign} kcal / target: ${fmt(targetKcal)})`;
        pill.className = "target-match-pill match-high";
      } else {
        pill.textContent = `Target buffer calibrated (${sign} kcal)`;
        pill.className = "target-match-pill match-moderate";
      }
    }

    // Caloric Macro Split (Atwater formula: P=4, C=4, F=9)
    const protCal = prot * 4;
    const carbCal = carbs * 4;
    const fatCal = fat * 9;
    const totalMacroCal = protCal + carbCal + fatCal || 1;

    const protPct = Math.round((protCal / totalMacroCal) * 100);
    const carbPct = Math.round((carbCal / totalMacroCal) * 100);
    const fatPct = Math.max(0, 100 - protPct - carbPct);

    const segP = $("macro-seg-protein");
    const segC = $("macro-seg-carbs");
    const segF = $("macro-seg-fat");

    if (segP) segP.style.width = `${protPct}%`;
    if (segC) segC.style.width = `${carbPct}%`;
    if (segF) segF.style.width = `${fatPct}%`;

    set("macro-pct-protein", `${protPct}%`);
    set("macro-pct-carbs", `${carbPct}%`);
    set("macro-pct-fat", `${fatPct}%`);
    set("macro-bar-ratio-text", `Protein ${protPct}% · Carbs ${carbPct}% · Fat ${fatPct}%`);
  }

  /* =======================================================
     16. RENDER MEAL CARDS (Distinct SVGs, % per meal & Swap)
     ======================================================= */

  /* ---- Meal card helpers: household measures, raw/cooked tag, method ---- */
  const HOUSEHOLD = [
    [/\begg(?!plant)/i, 50, "egg", "eggs"],
    [/banana/i, 118, "banana", "bananas"],
    [/apple/i, 180, "apple", "apples"],
    [/bread/i, 30, "slice", "slices"],
    [/^(milk|yogurt|yoghurt|curd)\b/i, 245, "cup", "cups"],
    [/\b(oil|ghee)\b|^butter\b/i, 14, "tbsp", "tbsp"],
    [/\boats?\b/i, 80, "cup (dry)", "cups (dry)"]
  ];

  // Display-only: turns USDA-style names into short, readable ones
  function friendlyFood(name) {
    const raw = String(name || "").trim();
    if (!raw.includes(",")) return raw;
    const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
    const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    const head = (parts[0] || "").toLowerCase();
    const second = (parts[1] || "").toLowerCase();
    const SUFFIX = ["oil", "cheese", "milk", "yogurt", "yoghurt", "rice", "bread", "flour", "beans", "pasta", "juice"];
    const DROP = ["fish", "nuts", "nut", "seeds", "seed", "shellfish", "crustaceans", "mollusks"];
    if (SUFFIX.includes(head) && second) return cap(`${second} ${head}`);
    if (DROP.includes(head) && second) return cap(second) + (parts[2] ? ` (${parts[2].toLowerCase()})` : "");
    return cap(parts[0] || raw);
  }

  function householdMeasure(food, grams) {
    const g = Number(grams) || 0;
    const hit = HOUSEHOLD.find(([re]) => re.test(food));
    if (!hit || g <= 0) return "";
    const [, unitG, one, many] = hit;
    const n = g / unitG;
    if (n < 0.25 || n > 12) return "";
    const rounded = Math.round(n * 2) / 2;
    if (!rounded) return "";
    const whole = Math.floor(rounded);
    const text = `${whole || ""}${rounded % 1 ? "½" : ""}`;
    return `≈ ${text} ${rounded <= 1 ? one : many}`;
  }

  function foodState(raw) {
    const t = String(raw || "").toLowerCase();
    if (/\braw\b/.test(t)) return "raw";
    if (/\b(cooked|boiled|parboiled|steamed|roasted|grilled)\b/.test(t)) return "cooked";
    if (/\bcanned\b/.test(t)) return "canned";
    return "";
  }

  const ROLE_RULES = [
    ["dairy", /^(milk|yogurt|yoghurt|curd)\b|kefir/i],
    ["fat", /\b(oil|ghee)\b|^butter\b|avocado|almond|walnut|cashew|seed|nut/i],
    ["fruit", /apple|banana|berry|berries|orange|mango|grape|melon|papaya|pear|peach|pineapple|fruit|kiwi/i],
    ["grain", /rice|oat|bread|roti|chapati|pasta|noodle|quinoa|millet|couscous|cereal|tortilla|wheat|barley/i],
    ["protein", /\begg(?!plant)|chicken|turkey|fish|salmon|tuna|shrimp|prawn|paneer|cheese|tofu|tempeh|lentil|dal|bean|chickpea|beef|pork|lamb|whey|soy/i],
    ["veg", /spinach|broccoli|carrot|tomato|onion|pepper|cucumber|lettuce|cabbage|cauliflower|kale|mushroom|zucchini|squash|beet|okra|pumpkin|potato|celery|garlic|capsicum/i]
  ];

  function roleOf(food) {
    const hit = ROLE_RULES.find(([, re]) => re.test(food));
    return hit ? hit[0] : "other";
  }

  const stepOpen = new Set();   // which "How to make it" guides are expanded
  const stepDone = new Set();   // remembers which steps were ticked (survives swaps / re-renders)

  const normStep = s => typeof s === "string"
    ? { title: "", text: s, min: 0 }
    : { title: s?.title || "", text: s?.text || s?.step || s?.description || "", min: Number(s?.minutes ?? s?.min) || 0 };

  function buildMethod(meal) {
    const items = meal.items || [];
    if (!items.length) return [];
    const by = {};
    items.forEach(it => {
      const r = roleOf(it.food);
      (by[r] = by[r] || []).push({
        name: friendlyFood(it.food),
        g: it.grams,
        state: foodState(it.foodRaw)
      });
    });

    const listJoin = arr => arr.length < 2 ? (arr[0] || "") : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`;
    const phrase = o => o.state === "cooked"
      ? o.name.toLowerCase()
      : `${fmt(o.g)} g ${o.state ? o.state + " " : ""}${o.name.toLowerCase()}`;
    const names = r => listJoin(by[r].slice(0, 3).map(phrase));
    const cookedNote = r => {
      const c = (by[r] || []).filter(o => o.state === "cooked");
      return c.length
        ? ` Portion ${listJoin(c.map(o => `${fmt(o.g)} g ${o.name.toLowerCase()}`))} after cooking.`
        : "";
    };
    const anyOf = (r, re) => (by[r] || []).some(o => re.test(o.name));

    const steps = [{
      title: "Get ready",
      text: "Weigh or measure everything in the ingredient list and wash any fresh produce.",
      min: 2
    }];

    if (by.grain) {
      const quick = by.grain.every(o => /oat|bread|tortilla|roti|chapati/i.test(o.name));
      steps.push({
        title: "Cook the base",
        text: quick
          ? `Prepare ${names("grain")}: simmer oats for 3–5 minutes, or toast or warm bread and roti.${cookedNote("grain")}`
          : `Cook ${names("grain")} until soft (boil, steam or simmer).${cookedNote("grain")}`,
        min: quick ? 4 : 12
      });
    }

    if (by.protein) {
      steps.push({
        title: "Cook the protein",
        text: `Cook or heat ${names("protein")} until fully done: grill, pan-sear, boil or scramble. Chicken, fish and eggs must be cooked all the way through.${cookedNote("protein")}`,
        min: anyOf("protein", /egg/i) ? 6 : anyOf("protein", /paneer|tofu|cheese|whey|tempeh/i) ? 5 : 10
      });
    }

    if (by.veg) {
      steps.push({
        title: "Prep the vegetables",
        text: `Wash and chop ${names("veg")}, then sauté or steam for 3–5 minutes, or keep it fresh as a salad.`,
        min: 6
      });
    }

    if (by.fruit || by.dairy) {
      steps.push({
        title: "Add the fresh items",
        text: by.fruit && by.dairy
          ? `Slice ${names("fruit")} and add ${names("dairy")} cold, or warm it gently.`
          : by.fruit
            ? `Wash and slice ${names("fruit")}.`
            : `Add ${names("dairy")} cold, or warm it gently.`,
        min: 2
      });
    }

    if (by.fat) {
      steps.push({
        title: "Measure the fat",
        text: `Measure ${names("fat")} with a spoon, not by eye. It is calorie-dense.`,
        min: 1
      });
    }

    steps.push({
      title: "Plate and serve",
      text: "Combine everything in a bowl or plate, season lightly with salt, pepper, herbs or spices, and enjoy.",
      min: 2
    });
    return steps;
  }

  function buildTips(meal) {
    const items = meal.items || [];
    const roles = items.map(i => roleOf(i.food));
    const type = String(meal.label || "").toLowerCase();
    const tips = [];

    if (items.some(i => foodState(i.foodRaw))) {
      tips.push("Weigh each item in the state shown (raw or cooked) so your calories stay accurate.");
    }
    if (!roles.includes("veg") && (type === "lunch" || type === "dinner")) {
      tips.push("No vegetables in this dish. A side of cucumber or tomato slices adds fibre for very few calories (a small extra, not counted in your totals).");
    }
    const flavour = {
      breakfast: "Cinnamon or cardamom adds a sweet, warm flavour with almost no calories.",
      lunch: "Finish with lemon juice, black pepper, cumin or fresh coriander for flavour without meaningful calories.",
      dinner: "Finish with lemon juice, black pepper, cumin or fresh coriander for flavour without meaningful calories.",
      snack: "Drink water or unsweetened tea with this snack. It keeps you full for longer."
    };
    tips.push(flavour[type] || "Fresh herbs, lemon and spices add flavour without meaningful calories.");
    if (roles.includes("grain") || roles.includes("protein")) {
      tips.push("Short on time? Cook the base and protein in bulk and refrigerate. Cooked food keeps 1–2 days (rice: eat within 1 day).");
    }
    return tips.slice(0, 3);
  }

  function renderDay(keepCardAnimation = false) {
    if (!mealPlan?.[0]) return;
    const day = mealPlan[0];
    const totalDayKcal =
      day.totals.kcal ||
      day.meals.reduce((sum, m) => sum + (m.kcal || 0), 0) ||
      1;

    set("selected-day-title", "Today's Fresh Meals");
    set("selected-day-calories", `${fmt(day.totals.kcal)} kcal`);

    const grid = qs(".meal-plan-grid");
    if (!grid) return;

    // After a swap we re-render without replaying the card entrance animation
    grid.classList.toggle("no-anim", !!keepCardAnimation);

    grid.innerHTML = day.meals.map(meal => {
      const typeKey = (meal.label || "").toLowerCase();
      const iconSvg = MEAL_ICONS[typeKey] || MEAL_ICONS.lunch;
      const timing = MEAL_TIMES[typeKey] || "";
      const rawMeal = backendResponse?.meals?.find(m => m.meal === meal.label);
      const steps = (Array.isArray(rawMeal?.steps) && rawMeal.steps.length
        ? rawMeal.steps.map(normStep)
        : buildMethod(meal)).filter(s => s.text);
      const tips = (Array.isArray(rawMeal?.tips) && rawMeal.tips.length
        ? rawMeal.tips.map(String)
        : buildTips(meal)).slice(0, 4);
      const stepKey = i => `${meal.label}|${meal.name}|${i}`;
      const openKey = `${meal.label}|${meal.name}`;
      const isOpen = stepOpen.has(openKey);
      const doneCount = steps.filter((_, i) => stepDone.has(stepKey(i))).length;
      const stepMinutes = steps.reduce((sum, s) => sum + (s.min || 0), 0);
      const prepMin = Number(rawMeal?.prep_minutes)
        || (stepMinutes ? Math.min(45, Math.max(5, stepMinutes)) : Math.min(40, 5 + (meal.items?.length || 0) * 4));
      const prepTime = `⏱ ~${prepMin} min`;

      // Caloric percentage contribution of this meal
      const mealPct = Math.round((meal.kcal / totalDayKcal) * 100);

      const ingredientsStr = meal.items?.length
        ? meal.items.map(item => `${esc(item.food)} (${fmt(item.grams)} g)`).join(" · ")
        : "Ingredients calibrated by NutriGen.";

      const ingredientsHtml = meal.items?.length
        ? `<div class="ingredients-block">
              <div class="ingredients-title">Ingredients <small>· ${meal.items.length} items</small></div>
              <ul class="ingredient-list">
                ${meal.items.map(item => {
                  const state = foodState(item.foodRaw);
                  const home = householdMeasure(item.food, item.grams);
                  return `<li>
                    <div class="ing-name">${esc(friendlyFood(item.food))}${state ? `<em class="ing-state">${state}</em>` : ""}${home ? `<small class="ing-home">${esc(home)}</small>` : ""}</div>
                    <div class="ing-qty">${fmt(item.grams)} g</div>
                  </li>`;
                }).join("")}
              </ul>
            </div>
            ${steps.length ? `<div class="how-to ${isOpen ? "open" : ""}">
              <button type="button" class="how-to-toggle" aria-expanded="${isOpen}" data-open-key="${esc(openKey)}">
                <div class="how-to-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16H6z" /><path d="M9 9h6M9 13h6M9 17h3" /></svg></div>
                <div class="how-to-heading">
                  <div class="how-to-title">How to make it</div>
                  <div class="how-to-sub">${steps.length} steps · tap to show / hide</div>
                </div>
                <div class="how-to-meta">${doneCount}/${steps.length} done · ~${prepMin} min</div>
                <div class="how-to-chevron" aria-hidden="true">▾</div>
              </button>
              <div class="how-to-body">
                <div class="step-hint">Tap a step to tick it off as you cook.</div>
                <div class="how-to-progress"><div class="how-to-progress-fill" style="width:${Math.round((doneCount / steps.length) * 100)}%"></div></div>
                <ol class="step-list">
                  ${steps.map((s, i) => {
                    const done = stepDone.has(stepKey(i));
                    return `<li class="step-item ${done ? "done" : ""}" role="checkbox" tabindex="0" aria-checked="${done}" data-step-key="${esc(stepKey(i))}">
                      <div class="step-num">${i + 1}</div>
                      <div class="step-main">
                        <div class="step-label">STEP ${i + 1}</div>
                        <div class="step-title-row">
                          <div class="step-title">${esc(s.title || `Step ${i + 1}`)}</div>
                          ${s.min ? `<div class="step-time">~${s.min} min</div>` : ""}
                        </div>
                        <div class="step-text">${esc(s.text)}</div>
                      </div>
                    </li>`;
                  }).join("")}
                </ol>
                ${tips.length ? `<div class="meal-tips">
                  <div class="tips-title"> Tips &amp; suggestions</div>
                  <ul>${tips.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
                </div>` : ""}
              </div>
            </div>` : ""}`
        : `<p class="meal-ingredients">${ingredientsStr}</p>`;

      // Swap history for this meal (original dish is option 0)
      const st = swapState[meal.label];
      const optCount = st ? st.options.length : 1;
      const optIdx = st ? st.idx : 0;
      const isSwapped = optIdx > 0;
      const busy = swapBusy.has(meal.label);
      const statusText = isSwapped
        ? `✓ Swapped · option ${optIdx + 1} of ${optCount}`
        : (optCount > 1 ? `Original dish · option 1 of ${optCount}` : "");
      const note = st?.note ? `<p class="swap-note">${esc(st.note)}</p>` : "";

      const swapControls = optCount > 1 || st?.note ? `
            <div class="swap-controls">
              <button type="button" class="swap-nav-btn" data-swap-dir="prev" data-meal-type="${esc(meal.label)}" aria-label="Previous dish for ${esc(meal.label)}" ${optIdx === 0 || busy ? "disabled" : ""}>‹</button>
              <span class="swap-status ${isSwapped ? "is-swapped" : ""}">${esc(statusText)}</span>
              <button type="button" class="swap-nav-btn" data-swap-dir="next" data-meal-type="${esc(meal.label)}" aria-label="Next dish for ${esc(meal.label)}" ${optIdx >= optCount - 1 || busy ? "disabled" : ""}>›</button>
            </div>
            ${note}` : `<div class="swap-controls swap-controls-idle"><span class="swap-status">Original dish</span></div>`;

      return `
        <article class="output-meal-card ${isSwapped ? "meal-swapped" : ""} ${busy ? "meal-swapping" : ""}" data-card-label="${esc(meal.label)}">
          <div class="output-meal-icon meal-icon-styled" aria-hidden="true">
            ${iconSvg}
          </div>

          <div class="meal-card-content">
            <div class="meal-label-row">
              <span class="meal-label">${esc(meal.label.toUpperCase())} ${timing ? `· ${timing}` : ""}</span>
              <button type="button" class="swap-meal-btn" data-meal-name="${esc(meal.name)}" data-meal-type="${esc(meal.label)}" ${busy ? "disabled" : ""}>
                 ${busy ? "Finding a dish…" : "Swap Dish"}
              </button>
            </div>

            <h3>${esc(meal.name)}</h3>
            ${swapControls}
            <div class="meal-meta-row">
              <span class="meal-prep-badge">${prepTime}</span>
              <span class="meal-pct-badge">${mealPct}% of daily intake</span>
            </div>
            ${ingredientsHtml}

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

    // Swap Dish → swaps right inside the meal card (next saved option, or fetches a new one)
    qsa(".swap-meal-btn", grid).forEach(btn => {
      btn.addEventListener("click", () => swapMeal(btn.dataset.mealType, "swap"));
    });

    // ‹ › arrows → step through dishes already seen for that meal
    qsa(".swap-nav-btn", grid).forEach(btn => {
      btn.addEventListener("click", () => swapMeal(btn.dataset.mealType, btn.dataset.swapDir));
    });

    // Open / close the step-by-step guide
    qsa(".how-to-toggle", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        const how = btn.closest(".how-to");
        const open = !how.classList.contains("open");
        how.classList.toggle("open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (open) stepOpen.add(btn.dataset.openKey);
        else stepOpen.delete(btn.dataset.openKey);
      });
    });

    // Tick steps off as you cook
    qsa(".step-item", grid).forEach(li => {
      const toggle = () => {
        const nowDone = !li.classList.contains("done");
        li.classList.toggle("done", nowDone);
        li.setAttribute("aria-checked", String(nowDone));
        if (nowDone) stepDone.add(li.dataset.stepKey);
        else stepDone.delete(li.dataset.stepKey);

        const how = li.closest(".how-to");
        const meta = how && qs(".how-to-meta", how);
        if (how) {
          const total = qsa(".step-item", how).length;
          const done = qsa(".step-item.done", how).length;
          if (meta) meta.textContent = meta.textContent.replace(/^\d+\/\d+ done/, `${done}/${total} done`);
          const fill = qs(".how-to-progress-fill", how);
          if (fill) fill.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
        }
      };
      li.addEventListener("click", toggle);
      li.addEventListener("keydown", e => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      });
    });

    renderGroceryChecklist(day.meals);
  }

  /* =======================================================
     16b. IN-CARD DISH SWAP (history, totals, checklist sync)
     ======================================================= */

  function mapBackendMeal(meal) {
    return {
      label: meal.meal,
      name: cleanFoodText(meal.dish),
      rawDish: meal.dish,
      kcal: meal.totals?.calories || 0,
      protein: meal.totals?.protein || 0,
      carbs: meal.totals?.carbs || 0,
      fat: meal.totals?.fat || 0,
      items: (meal.items || []).map(item => ({
        ...item,
        food: cleanFoodText(item.food), foodRaw: item.food
      })),
      notFound: meal.not_found || []
    };
  }

  function ensureSwapState(label) {
    if (!swapState[label]) {
      const original = backendResponse?.meals?.find(m => m.meal === label);
      if (!original) return null;
      swapState[label] = { options: [original], idx: 0, note: "" };
    }
    return swapState[label];
  }

  // Applies option `idx` for a meal and re-syncs everything that depends on it
  function applyMealOption(label, idx) {
    const st = ensureSwapState(label);
    if (!st || !st.options[idx] || !backendResponse || !mealPlan?.[0]) return;

    st.idx = idx;
    st.note = "";
    const raw = st.options[idx];

    const pos = backendResponse.meals.findIndex(m => m.meal === label);
    if (pos < 0) return;

    // 1. Replace the dish
    backendResponse.meals[pos] = raw;
    mealPlan[0].meals[pos] = mapBackendMeal(raw);

    // 2. Recalculate day totals from the dishes now selected
    const sum = key =>
      Math.round(backendResponse.meals.reduce((s, m) => s + (Number(m.totals?.[key]) || 0), 0) * 10) / 10;

    const totals = {
      calories: sum("calories"),
      protein: sum("protein"),
      carbs: sum("carbs"),
      fat: sum("fat")
    };

    backendResponse.day_totals = { ...backendResponse.day_totals, ...totals };
    mealPlan[0].totals = {
      kcal: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat
    };

    if (nutrition) {
      nutrition.actualCalories = totals.calories;
      nutrition.actualProtein = totals.protein;
      nutrition.actualCarbs = totals.carbs;
      nutrition.actualFat = totals.fat;
    }

    // 3. Refresh dashboard, macro bar, meal cards and the grocery checklist
    fillDashboard();
    renderDay(true);

    // 4. Remember the swap so "View my last plan" matches what's on screen
    try {
      localStorage.setItem(
        "nutrigenLastPlan",
        JSON.stringify({ profile, response: backendResponse, swaps: swapState })
      );
    } catch (err) {
      console.warn("Storage warning:", err);
    }

    const announcer = $("plan-announcer");
    if (announcer) {
      announcer.textContent = `${label} changed to ${mealPlan[0].meals[pos].name}. Daily total is now ${fmt(totals.calories)} kcal.`;
    }
  }

  // Normalised dish name used to spot duplicates ("Oats Bowl" vs "oats  bowl")
  const dishKey = text =>
    cleanFoodText(String(text || "")).trim().toLowerCase().replace(/\s+/g, " ");

  async function fetchAlternativeMeal(label) {
    const st = ensureSwapState(label);
    if (!st || !profile) return null;

    // Calories of the original dish: replacements should stay close to it
    const baseKcal = Number(st.options[0]?.totals?.calories) || 0;
    const kcalOf = meal => Number(meal?.totals?.calories) || 0;

    // Never offer a dish already seen for this meal, or one already used by another meal today
    const avoid = new Set(st.options.map(o => dishKey(o.dish)));
    (backendResponse?.meals || []).forEach(m => {
      if (m.meal !== label) avoid.add(dishKey(m.dish));
    });

    const found = [];
    let lastError = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok || data.status !== "success" || !Array.isArray(data.meals)) continue;

        const candidate = data.meals.find(m => m.meal === label);
        const key = dishKey(candidate?.dish);
        if (!candidate || !key || avoid.has(key)) continue;

        avoid.add(key);
        found.push(candidate);

        // Good match (within 20% of the original calories) → use it straight away
        if (!baseKcal || Math.abs(kcalOf(candidate) - baseKcal) / baseKcal <= 0.2) return candidate;
      } catch (err) {
        lastError = err;
        break;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // No perfect match: take the closest one, as long as it is within 40% of the original
    if (found.length) {
      found.sort((a, b) => Math.abs(kcalOf(a) - baseKcal) - Math.abs(kcalOf(b) - baseKcal));
      const best = found[0];
      if (!baseKcal || Math.abs(kcalOf(best) - baseKcal) / baseKcal <= 0.4) return best;
      return null;
    }

    if (lastError) throw lastError;
    return null;
  }

  async function swapMeal(label, action) {
    if (!label || swapBusy.has(label) || !mealPlan?.[0]) return;
    const st = ensureSwapState(label);
    if (!st) return;

    if (action === "prev") {
      if (st.idx > 0) applyMealOption(label, st.idx - 1);
      return;
    }

    if (action === "next") {
      if (st.idx < st.options.length - 1) applyMealOption(label, st.idx + 1);
      return;
    }

    // "swap": use the next saved option if there is one, otherwise ask the backend for a new dish
    if (st.idx < st.options.length - 1) {
      applyMealOption(label, st.idx + 1);
      return;
    }

    swapBusy.add(label);
    st.note = "";
    renderDay(true);

    try {
      const fresh = await fetchAlternativeMeal(label);
      swapBusy.delete(label);

      if (fresh) {
        st.options.push(fresh);
        applyMealOption(label, st.options.length - 1);
      } else {
        st.note = "No new dish with similar calories found right now — try again in a moment.";
        renderDay(true);
      }
    } catch (error) {
      console.error("Swap error:", error);
      swapBusy.delete(label);
      st.note = "Couldn't reach the backend to find another dish.";
      renderDay(true);
    }
  }

  /* =======================================================
     17. INGREDIENT SHOPPING CHECKLIST
     ======================================================= */

  function renderGroceryChecklist(meals) {
    const listGrid = $("grocery-items-grid");
    const countEl = $("grocery-count");
    if (!listGrid) return;

    const itemMap = new Map();
    meals.forEach(m => {
      (m.items || []).forEach(item => {
        const key = item.food.trim();
        const prev = itemMap.get(key) || 0;
        itemMap.set(key, prev + (Number(item.grams) || 0));
      });
    });

    if (countEl) countEl.textContent = itemMap.size;

    if (itemMap.size === 0) {
      listGrid.innerHTML = `<p class="empty-list">No ingredients found for this plan.</p>`;
      return;
    }

    listGrid.innerHTML = [...itemMap.entries()].map(([food, grams], idx) => `
      <label class="grocery-item">
        <input type="checkbox" id="g-item-${idx}" data-food="${esc(food)}" ${groceryTicked.has(food) ? "checked" : ""} />
        <span class="grocery-name">${esc(friendlyFood(food))}</span>
        <strong class="grocery-qty">${fmt(grams)} g</strong>
      </label>
    `).join("");

    // Remember ticks so swapping a dish doesn't wipe items already marked as bought
    qsa('input[data-food]', listGrid).forEach(box => {
      box.addEventListener("change", () => {
        if (box.checked) groceryTicked.add(box.dataset.food);
        else groceryTicked.delete(box.dataset.food);
      });
    });
  }

  $("toggle-grocery-button")?.addEventListener("click", () => {
    const card = $("grocery-checklist-card");
    if (card) card.classList.toggle("hidden");
  });

  $("grocery-close")?.addEventListener("click", () => {
    hide($("grocery-checklist-card"));
  });

  /* =======================================================
     18. COPY PLAN & PRINT EXPORT
     ======================================================= */

  $("print-plan-button")?.addEventListener("click", () => {
    window.print();
  });

  $("copy-plan-button")?.addEventListener("click", async () => {
    if (!profile || !nutrition || !mealPlan?.[0]) return;

    const day = mealPlan[0];

    const divider = "────────────────────────────";

    const mealSections = day.meals.map(meal => {
      const ingredients = meal.items?.length
        ? meal.items.map(item => `   • ${friendlyFood(item.food)} — ${fmt(item.grams)} g`).join("\n")
        : "   Ingredients included in the generated recipe.";

      return [
        `${meal.label.toUpperCase()}`,
        divider,
        `Dish: ${meal.name}`,
        "",
        "Ingredients:",
        ingredients,
        "",
        `Calories: ${fmt(meal.kcal)} kcal`,
        `Protein: ${fmt(meal.protein)} g`,
        `Carbohydrates: ${fmt(meal.carbs)} g`,
        `Fat: ${fmt(meal.fat)} g`
      ].join("\n");
    }).join("\n\n");

    const textToCopy = [
      "NUTRIGEN — YOUR DAILY MEAL PLAN",
      "Personalised Nutrition Report",
      divider,
      "",
      "YOUR PROFILE",
      `Name: ${profile.name}`,
      `Age: ${profile.age} years`,
      `Height: ${profile.height} cm`,
      `Current Weight: ${fmt(profile.weight)} kg`,
      `Target Weight: ${fmt(profile.target)} kg`,
      `Goal: ${profile.goal}`,
      `Diet: ${profile.diet}`,
      "",
      "YOUR DAILY NUTRITION TARGETS",
      `Calories: ${fmt(nutrition.kcal)} kcal`,
      `Protein: ${fmt(nutrition.protein)} g`,
      `Carbohydrates: ${fmt(nutrition.carbs)} g`,
      `Fat: ${fmt(nutrition.fat)} g`,
      "",
      divider,
      "",
      "YOUR MEAL SCHEDULE",
      "",
      mealSections,
      "",
      divider,
      "",
      "YOUR ACTUAL DAILY NUTRITION",
      `Total Calories: ${fmt(day.totals.kcal)} kcal`,
      `Total Protein: ${fmt(day.totals.protein)} g`,
      `Total Carbohydrates: ${fmt(day.totals.carbs)} g`,
      `Total Fat: ${fmt(day.totals.fat)} g`,
      "",
      `Estimated Maintenance (TDEE): ${fmt(nutrition.tdee)} kcal`,
      "",
      divider,
      "Generated with NutriGen",
      "Your nutrition, personalised."
    ].join("\n");

    const btn = $("copy-plan-button");
    const originalText = btn?.textContent;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const temp = document.createElement("textarea");
        temp.value = textToCopy;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();

        const copied = document.execCommand("copy");
        temp.remove();

        if (!copied) throw new Error("Clipboard copy failed.");
      }

      if (btn) {
        btn.textContent = "✓ Copied!";
        setTimeout(() => {
          btn.textContent = originalText || "Copy Plan";
        }, 2000);
      }
    } catch (error) {
      console.error("Copy plan error:", error);
      alert("Unable to copy automatically. Please try again using a secure browser connection.");
    }
  });


  
  /* =======================================================
     19. SUBMIT FORM & API CALL
     ======================================================= */

  let isGenerating = false;

  formEl?.addEventListener("submit", async event => {
    event.preventDefault();
    if (isGenerating) return;

    for (let index = 0; index < slides.length; index++) {
      if (!validateSlide(index)) {
        goToSlide(index, false);
        return;
      }
    }

    const collected = collectProfile();
    const submitBtn = qs(".generate-button, button[type='submit']", formEl);
    const originalContent = submitBtn?.innerHTML;

    isGenerating = true;
    hideAPIError();
    showLoading();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.textContent = "Generating your plan...";
    }

    try {
      await prepareProfile(collected);

      // Remember (or forget) the user's details based on the checkbox
      if ($("save-info-checkbox")?.checked) writeSavedProfile(collected);

      else removeSavedProfile(collected.name);
      try {
        localStorage.setItem("nutrigenLastPlan", JSON.stringify({ profile, response: backendResponse, swaps: swapState }));
      } catch (err) {
        console.warn("Storage warning:", err);
      }

      setupLastPlanButton();

      renderSummary();
      fillDashboard();
      renderDay();
      openResults();

      const announcer = $("plan-announcer");
      if (announcer) {
        announcer.textContent = `Your meal plan is ready, ${profile.name}. 4 meals scheduled.`;
      }
    } catch (error) {
      console.error("NutriGen API error:", error);
      const msg = error.name === "AbortError"
        ? "The request timed out. Please check that the NutriGen backend is running on port 8000."
        : (error.message || "Failed to reach backend.");
      showAPIError(msg);
    } finally {
      hideLoading();
      isGenerating = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.innerHTML = originalContent || "Generate My Plan";
      }
    }
  });

  /* =======================================================
     20. RESTORE LAST PLAN
     ======================================================= */

  function restoreSavedPlan(saved) {
    if (!saved?.profile || !saved?.response) return;
    profile = saved.profile;
    backendResponse = saved.response;
    swapState = saved.swaps && typeof saved.swaps === "object" ? saved.swaps : {};
    groceryTicked = new Set();
    const data = backendResponse;

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
      actualFat: data.day_totals.fat
    };

    mealPlan = [{
      totals: {
        kcal: data.day_totals.calories,
        protein: data.day_totals.protein,
        carbs: data.day_totals.carbs,
        fat: data.day_totals.fat
      },
      meals: data.meals.map(m => ({
        label: m.meal,
        name: cleanFoodText(m.dish),
        rawDish: m.dish,
        kcal: m.totals?.calories || 0,
        protein: m.totals?.protein || 0,
        carbs: m.totals?.carbs || 0,
        fat: m.totals?.fat || 0,
        items: (m.items || []).map(i => ({ ...i, food: cleanFoodText(i.food), foodRaw: i.food })),
        notFound: m.not_found || []
      }))
    }];

    renderSummary();
    fillDashboard();
    renderDay();
    openResults();
  }

  function setupLastPlanButton() {
    $("last-plan-button")?.remove();
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("nutrigenLastPlan") || "null");
    } catch {}

    if (!saved?.profile || !saved?.response) return;

    const heroActions = qs(".hero-actions");
    if (!heroActions) return;

    heroActions.insertAdjacentHTML(
      "afterbegin",
      `<button type="button" id="last-plan-button" class="secondary-button last-plan-button">
        View my last plan
      </button>`
    );

    $("last-plan-button")?.addEventListener("click", e => {
      e.preventDefault();
      // Re-read so any swaps made after this button was created are included
      let latest = saved;
      try { latest = JSON.parse(localStorage.getItem("nutrigenLastPlan") || "null") || saved; } catch {}
      restoreSavedPlan(latest);
    });
  }

  setupLastPlanButton();

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
    handleGoalChange();
    applyDietFilterToAllergies();
    goToSlide(0);
    refreshSavedBanner();
  }

  $("new-plan-button")?.addEventListener("click", startFresh);
  $("create-new-plan-bottom")?.addEventListener("click", startFresh);

  /* =======================================================
     21. CHAT ASSISTANT & QUICK SUGGESTION CHIPS
     ======================================================= */

  const chatPanel = $("chat-panel");
  const chatInput = $("chat-input");
  const chatBox = $("chat-messages");

  function openChat() {
    show(chatPanel);
    setTimeout(() => chatInput?.focus(), 80);
  }

  function closeChat() { hide(chatPanel); }

  $("chat-toggle")?.addEventListener("click", () => {
    chatPanel?.classList.contains("hidden") ? openChat() : closeChat();
  });

  qs(".chat-close")?.addEventListener("click", closeChat);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeChat(); });

  function say(message, sender) {
    if (!chatBox) return;
    const el = document.createElement("div");
    el.className = `chat-message ${sender}`;
    el.textContent = message;
    chatBox.appendChild(el);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function assistantReply(message) {
    const text = message.toLowerCase();

    if (/^(hi|hello|hey)\b/.test(text)) {
      return profile
        ? `Hello ${profile.name}! I can explain your calorie targets, macro ratios, meal timings, or suggest alternatives.`
        : "Hello! Build your plan first and I can answer questions using your personalized nutrition numbers.";
    }

    if (!profile || !nutrition || !mealPlan?.[0]) {
      return "Build your plan first and I can answer using your customized meal and calorie data.";
    }

    const day = mealPlan[0];

    // Dish Swap Alternative
    if (/swap|alternative|replace|instead of/.test(text)) {
      const meal = day.meals.find(m => text.includes(m.label.toLowerCase()) || text.includes(m.name.toLowerCase()));
      if (meal) {
        return `For ${meal.label} (${meal.name}), balanced alternatives matching around ${fmt(meal.kcal)} kcal include: grilled cottage cheese (paneer) with mixed sautéed veggies, lentil stew with brown rice, or a Greek yogurt chia bowl.`;
      }
      return "To swap a meal, let me know which one (Breakfast, Lunch, Snack or Dinner)!";
    }

    const meal = day.meals.find(item => text.includes(item.label.toLowerCase()));
    if (meal) {
      return `${meal.label}: ${meal.name}. It provides approx. ${fmt(meal.kcal)} kcal (${fmt(meal.protein)}g protein, ${fmt(meal.carbs)}g carbs, ${fmt(meal.fat)}g fat).`;
    }

    if (/macro|protein|carb|fat/.test(text)) {
      return `Daily target: ${fmt(nutrition.protein)}g protein, ${fmt(nutrition.carbs)}g carbs, ${fmt(nutrition.fat)}g fat. Your generated meals provide ${fmt(nutrition.actualProtein)}g protein, ${fmt(nutrition.actualCarbs)}g carbs, and ${fmt(nutrition.actualFat)}g fat.`;
    }

    if (/calor|kcal|target|maintenance|tdee/.test(text)) {
      return `Your daily calorie target is ${fmt(nutrition.kcal)} kcal. Your generated meals deliver ${fmt(nutrition.actualCalories)} kcal. Your estimated maintenance (TDEE) is ${fmt(nutrition.tdee)} kcal.`;
    }

    if (/allerg|avoid|restrict/.test(text)) {
      const r = [...profile.allergies, ...words(profile.otherAllergy), ...profile.restrictions, ...words(profile.avoid)];
      return r.length ? `Your selected exclusions: ${r.join(", ")}.` : "You haven't listed any allergies or exclusions.";
    }

    if (/today|day|plan|meal|eat/.test(text)) {
      return `Your daily meals: ${day.meals.map(m => `${m.label}: ${m.name} (${fmt(m.kcal)} kcal)`).join("; ")}.`;
    }

    return "I can explain your calorie target, protein, carbs, fats, meals, and food swaps. Try asking: “What's for dinner?” or “Explain my macros”.";
  }

  function handleChatSubmit(text) {
    const msg = (text || chatInput?.value || "").trim();
    if (!msg) return;

    say(msg, "user");
    if (chatInput) chatInput.value = "";

    setTimeout(() => {
      say(assistantReply(msg), "bot");
    }, 280);
  }

  $("chat-form")?.addEventListener("submit", e => {
    e.preventDefault();
    handleChatSubmit();
  });

  qsa(".chat-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      handleChatSubmit(chip.dataset.question);
    });
  });
    /* =======================================================
     21b. SAVED DETAILS + "YOUR PLAN" NAV LINK
     ======================================================= */

  const SAVED_PROFILE_KEY = "nutrigenSavedProfile";     // old single-profile key (auto-migrated)
  const SAVED_PROFILES_KEY = "nutrigenSavedProfiles";   // list of saved profiles
  const MAX_SAVED_PROFILES = 8;

  const sameName = (a, b) =>
    String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  function readSavedProfiles() {
    let profilesList = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVED_PROFILES_KEY) || "null");
      if (Array.isArray(parsed)) profilesList = parsed.filter(p => p && p.name);
    } catch {}

    // Move a profile saved by the earlier single-profile version into the list
    try {
      const old = JSON.parse(localStorage.getItem(SAVED_PROFILE_KEY) || "null");
      if (old && old.name && !profilesList.some(p => sameName(p.name, old.name))) {
        profilesList.push(old);
        localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(profilesList));
      }
      localStorage.removeItem(SAVED_PROFILE_KEY);
    } catch {}

    return profilesList;
  }

  function storeSavedProfiles(profilesList) {
    try {
      localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(profilesList.slice(-MAX_SAVED_PROFILES)));
    } catch {}
  }

  // Most recently saved profile (used when there is only one)
  function readSavedProfile() {
    const all = readSavedProfiles();
    return all.length ? all[all.length - 1] : null;
  }

  // Saves or updates the profile that has this name
  function writeSavedProfile(p) {
    const rest = readSavedProfiles().filter(x => !sameName(x.name, p.name));
    rest.push(p);
    storeSavedProfiles(rest);
  }

  function removeSavedProfile(name) {
    storeSavedProfiles(readSavedProfiles().filter(x => !sameName(x.name, name)));
  }

  // Deletes every saved profile
  function clearSavedProfile() {
    try {
      localStorage.removeItem(SAVED_PROFILES_KEY);
      localStorage.removeItem(SAVED_PROFILE_KEY);
    } catch {}
  }

  const setVal = (id, value) => {
    const el = $(id);
    if (el) el.value = value ?? "";
  };

  function fillForm(p) {
    formEl?.reset();

    setVal("name", p.name);
    setVal("age", p.age);
    setVal("height", p.height);
    setVal("current-weight", p.weight);
    setVal("target-weight", p.target);
    setVal("daily-calories", p.calories);
    setVal("other-preference", p.otherPreference);
    setVal("foods-to-include", p.include);
    setVal("foods-to-avoid", p.avoid);
    setVal("other-allergy", p.otherAllergy);
    setVal("other-restriction", p.otherRestriction);

    const pick = (name, value) => {
      const radio = qs(`input[name="${name}"][value="${value}"]`);
      if (radio) radio.checked = true;
    };
    if (p.gender) pick("gender", p.gender);
    if (p.activity) pick("activity", String(p.activity));
    if (p.goal) pick("goal", p.goal);
    if (p.diet) pick("diet", p.diet);

    ["preferences", "allergies", "restrictions"].forEach(name => {
      qsa(`input[name="${name}"]`).forEach(input => {
        input.checked = (p[name] || []).includes(input.value);
      });
    });

    handleGoalChange();
    applyDietFilterToAllergies();
  }

  function renderSavedProfileList(profilesList) {
    const listEl = $("saved-profile-list");
    if (!listEl) return;

    listEl.innerHTML = [...profilesList].reverse().map(p => {
      const details = [p.goal, p.diet, p.weight ? `${p.weight} kg` : ""].filter(Boolean).join(" · ");
      return `
        <div class="saved-profile-row">
          <span class="saved-profile-avatar" aria-hidden="true">${esc((p.name || "?").trim().charAt(0).toUpperCase())}</span>
          <div class="saved-profile-info">
            <strong>${esc(p.name)}</strong>
            <small>${esc(details)}</small>
          </div>
          <button type="button" class="primary-button saved-pick-btn" data-saved-name="${esc(p.name)}">That's me</button>
          <button type="button" class="saved-delete-btn" data-saved-delete="${esc(p.name)}" aria-label="Delete saved details for ${esc(p.name)}">Delete</button>
        </div>`;
    }).join("");
  }

  // Is the site currently dark? Reads the real page colours, so it follows your theme toggle
  function isDarkTheme() {
    const channels = color => {
      const m = /rgba?\(([^)]+)\)/.exec(color || "");
      if (!m) return null;
      const p = m[1].split(",").map(s => parseFloat(s));
      return p.length > 3 && p[3] === 0 ? null : p;
    };
    for (const el of [qs(".form-card"), document.body, document.documentElement]) {
      if (!el) continue;
      const p = channels(getComputedStyle(el).backgroundColor);
      if (p) return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) < 128;
    }
    return !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  }

  function applyBannerTheme() {
    $("saved-profile-banner")?.classList.toggle("banner-light", !isDarkTheme());
  }

  // Re-check when the theme is toggled
  [document.documentElement, document.body].forEach(el => {
    new MutationObserver(() => setTimeout(applyBannerTheme, 60))
      .observe(el, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
  });

  function refreshSavedBanner() {
    const banner = $("saved-profile-banner");
    if (!banner) return;
    applyBannerTheme();

    const profilesList = readSavedProfiles();
    const shouldShow = profilesList.length > 0 && currentSlide === 0 && !val("name");
    banner.classList.toggle("hidden", !shouldShow);
    if (!shouldShow) return;

    const multi = profilesList.length > 1;
    const latest = profilesList[profilesList.length - 1];

    set("saved-profile-name", multi ? "" : (latest.name ? `, ${latest.name}` : ""));
    set(
      "saved-profile-text",
      multi
        ? "Which one are you? Pick your profile to auto-fill the form, or start fresh as someone new."
        : "Is this you? We found your saved details on this device. Use them to auto-fill the form, or start with a blank one."
    );
    set("start-blank-button", multi ? "I'm someone new" : "Start fresh");
    set("clear-saved-button", multi ? "Delete all saved details" : "Delete saved details");

    renderSavedProfileList(profilesList);
    $("saved-profile-list")?.classList.toggle("hidden", !multi);
    $("use-saved-button")?.classList.toggle("hidden", multi);
  }

  $("use-saved-button")?.addEventListener("click", () => {
    const saved = readSavedProfile();
    if (!saved) return;
    clearErrors();
    fillForm(saved);
    hide($("saved-profile-banner"));
  });

  // Several profiles: "That's me" fills the form, "Delete" removes just that person
  $("saved-profile-list")?.addEventListener("click", e => {
    const pick = e.target.closest("[data-saved-name]");
    const del = e.target.closest("[data-saved-delete]");

    if (pick) {
      const chosen = readSavedProfiles().find(p => p.name === pick.dataset.savedName);
      if (!chosen) return;
      clearErrors();
      fillForm(chosen);
      hide($("saved-profile-banner"));
      return;
    }

    if (del) {
      const name = del.dataset.savedDelete;
      if (!window.confirm(`Delete the saved details for ${name}?`)) return;
      removeSavedProfile(name);
      refreshSavedBanner();
    }
  });

  $("start-blank-button")?.addEventListener("click", () => {
    formEl?.reset();
    clearErrors();
    handleGoalChange();
    applyDietFilterToAllergies();
    hide($("saved-profile-banner"));
  });

  $("clear-saved-button")?.addEventListener("click", () => {
    const count = readSavedProfiles().length;
    const msg = count > 1 ? "Delete ALL saved profiles on this device?" : "Delete your saved details from this device?";
    if (!window.confirm(msg)) return;
    clearSavedProfile();
    hide($("saved-profile-banner"));
  });

  // "Your Plan" in the header: open the last plan, or the form if there isn't one yet
  $("nav-your-plan")?.addEventListener("click", e => {
    e.preventDefault();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("nutrigenLastPlan") || "null"); } catch {}
    if (saved?.profile && saved?.response) restoreSavedPlan(saved);
    else openForm();
  });


  /* =======================================================
     22. INITIAL STATE
     ======================================================= */

  hide(formPage);
  hide(output);
  goToSlide(0, false);
});