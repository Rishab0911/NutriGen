/* =========================================================
   NUTRIGEN — script.js
   Complete frontend logic
   HTML + CSS + JavaScript
   FastAPI meal-plan integration (100% pure client-side upgrades)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

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

  function showLoading() {
    const overlay = $("loading-overlay");
    show(overlay);

    const steps = [
      { id: "l-step-1", text: "✓ Evaluated Mifflin-St Jeor BMR & TDEE" },
      { id: "l-step-2", text: "✓ Applied allergies & dietary exclusions" },
      { id: "l-step-3", text: "✓ Balanced protein, carb & fat ratios" },
      { id: "l-step-4", text: "✓ Portioned recipes into daily schedule" }
    ];

    let currentStepIdx = 0;
    qsa(".checklist-step").forEach(el => el.classList.remove("active", "done"));
    $("l-step-1")?.classList.add("active");

    const bar = $("laser-progress-bar");
    if (bar) bar.style.width = "15%";

    loadingInterval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const stepEl = $(steps[currentStepIdx].id);
        if (stepEl) {
          stepEl.textContent = steps[currentStepIdx].text;
          stepEl.classList.remove("active");
          stepEl.classList.add("done");
        }
        currentStepIdx++;
        if (bar) bar.style.width = `${Math.min(95, (currentStepIdx / steps.length) * 100)}%`;
        if (currentStepIdx < steps.length) {
          const nextEl = $(steps[currentStepIdx].id);
          nextEl?.classList.add("active");
        }
      }
    }, 700);
  }

  function hideLoading() {
    if (loadingInterval) clearInterval(loadingInterval);
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
    applyDietFilterToAllergies();
    handleGoalChange();
    goToSlide(0);
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
    });
  });

  /* =======================================================
     10. BACK TO TOP, QUICK-JUMP DOCK & SCROLL-SPY
     ======================================================= */

  const backToTopBtn = $("back-to-top");
  const dockPills = qsa(".dock-pill");
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

  function updateScrollSpy() {
    spyTicking = false;
    const y = window.scrollY;

    // Top button: appears after scrolling a bit
    backToTopBtn?.classList.toggle("hidden", y < 500);

    // Dock highlight: only on the results page, and not mid-click-scroll
    if (spyLocked || !dockTargets.length || output.classList.contains("hidden")) return;

    const sorted = dockTargets
      .map(t => ({ ...t, top: t.el.getBoundingClientRect().top + y }))
      .sort((a, b) => a.top - b.top);

    let current = sorted[0];
    sorted.forEach(t => {
      if (t.top - SPY_OFFSET <= y) current = t;
    });

    if (y < 80) current = sorted[0];
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) {
      current = sorted[sorted.length - 1];
    }

    setActivePill(current.pill);
  }

  window.addEventListener("scroll", () => {
    if (spyLocked) {
      // a pill click started a smooth scroll; unlock once scrolling stops
      clearTimeout(spyTimer);
      spyTimer = setTimeout(() => { spyLocked = false; updateScrollSpy(); }, 150);
    }
    if (!spyTicking) {
      spyTicking = true;
      requestAnimationFrame(updateScrollSpy);
    }
  }, { passive: true });

  window.addEventListener("resize", updateScrollSpy);

  // Re-sync whenever the results page is shown/hidden (fixes a stale "Method" pill)
  if (output) {
    new MutationObserver(() => setTimeout(updateScrollSpy, 60))
      .observe(output, { attributes: true, attributeFilter: ["class"] });
  }

  backToTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // the spy follows the scroll and lands on "Profile" by itself
  });

  dockPills.forEach(pill => {
    pill.addEventListener("click", () => {
      const target = $(pill.dataset.target);
      if (!target) return;

      spyLocked = true;
      clearTimeout(spyTimer);
      spyTimer = setTimeout(() => { spyLocked = false; updateScrollSpy(); }, 1200);

      setActivePill(pill);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const timeoutId = setTimeout(() => controller.abort(), 30000);
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
          food: cleanFoodText(item.food)
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
    set("output-preferences", list(profile.preferences));
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
        createCard("THERMODYNAMIC BALANCE", energySummaryText, true)
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

  function renderDay() {
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

    grid.innerHTML = day.meals.map(meal => {
      const typeKey = (meal.label || "").toLowerCase();
      const iconSvg = MEAL_ICONS[typeKey] || MEAL_ICONS.lunch;
      const timing = MEAL_TIMES[typeKey] || "";
      const prepTime = MEAL_PREP[typeKey] || "⏱ 15 mins prep";

      // Caloric percentage contribution of this meal
      const mealPct = Math.round((meal.kcal / totalDayKcal) * 100);

      const ingredientsStr = meal.items?.length
        ? meal.items.map(item => `${esc(item.food)} (${fmt(item.grams)} g)`).join(" · ")
        : "Ingredients calibrated by NutriGen.";

      return `
        <article class="output-meal-card">
          <div class="output-meal-icon meal-icon-styled" aria-hidden="true">
            ${iconSvg}
          </div>

          <div class="meal-card-content">
            <div class="meal-label-row">
              <span class="meal-label">${esc(meal.label.toUpperCase())} ${timing ? `· ${timing}` : ""}</span>
              <button type="button" class="swap-meal-btn" data-meal-name="${esc(meal.name)}" data-meal-type="${esc(meal.label)}">
                 Swap Dish
              </button>
            </div>

            <h3>${esc(meal.name)}</h3>
            <div class="meal-meta-row">
              <span class="meal-prep-badge">${prepTime}</span>
              <span class="meal-pct-badge">${mealPct}% of daily intake</span>
            </div>
            <p class="meal-ingredients">${ingredientsStr}</p>

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

    // Wire up Swap Buttons directly to the Chat Assistant
    qsa(".swap-meal-btn", grid).forEach(btn => {
      btn.addEventListener("click", () => {
        const dishName = btn.dataset.mealName;
        const mealType = btn.dataset.mealType;
        openChat();
        const chatInput = $("chat-input");
        if (chatInput) {
          chatInput.value = `Can you suggest an alternative for ${mealType}: ${dishName}?`;
          $("chat-form")?.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    });

    renderGroceryChecklist(day.meals);
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
        <input type="checkbox" id="g-item-${idx}" />
        <span class="grocery-name">${esc(food)}</span>
        <strong class="grocery-qty">${fmt(grams)} g</strong>
      </label>
    `).join("");
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

    const mealLines = day.meals.map(m =>
      `• ${m.label}: ${m.name} (${fmt(m.kcal)} kcal | P:${fmt(m.protein)}g C:${fmt(m.carbs)}g F:${fmt(m.fat)}g)`
    ).join("\n");

    const textToCopy = [
      `🥗 NutriGen Daily Nutrition Blueprint for ${profile.name}`,
      `Goal: ${profile.goal} (${profile.diet})`,
      `Daily Intake: ${fmt(day.totals.kcal)} kcal (Target: ${fmt(nutrition.kcal)} kcal)`,
      `Macros: Protein ${fmt(day.totals.protein)}g · Carbs ${fmt(day.totals.carbs)}g · Fat ${fmt(day.totals.fat)}g`,
      `\nDAILY SCHEDULE:\n${mealLines}`,
      `\nGenerated by NutriGen.`
    ].join("\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      const btn = $("copy-plan-button");
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "✓ Copied!";
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    } catch {
      alert("Plan copied to clipboard.");
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

      try {
        localStorage.setItem("nutrigenLastPlan", JSON.stringify({ profile, response: backendResponse }));
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
        items: (m.items || []).map(i => ({ ...i, food: cleanFoodText(i.food) })),
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
      restoreSavedPlan(saved);
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
     22. INITIAL STATE
     ======================================================= */

  hide(formPage);
  hide(output);
  goToSlide(0, false);
});