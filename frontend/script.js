document.addEventListener("DOMContentLoaded", () => {

  // =========================================================
  // PAGE ELEMENTS
  // =========================================================

  const landingPage = document.getElementById("landing-page");
  const personalizationPage = document.getElementById(
    "personalization-page"
  );

  const form = document.getElementById("nutrition-form");
  const profileOutput = document.getElementById("profile-output");
  const messageBox = document.getElementById("message");

  const slides = document.querySelectorAll(".form-slide");
  const sidebarSteps = document.querySelectorAll(".sidebar-step");

  const nextButtons = document.querySelectorAll(".next-button");
  const backButtons = document.querySelectorAll(".back-button");

  const stepLabel = document.getElementById("step-label");
  const stepName = document.getElementById("step-name");
  const progressFill = document.getElementById("progress-fill");

  const restrictionDetails =
    document.getElementById("restriction-details");

  const stepNames = [
    "About You",
    "Your Goal",
    "Food Preferences",
    "Health & Restrictions"
  ];

  let currentStep = 1;


  // =========================================================
  // LANDING PAGE BUTTONS
  // =========================================================

  const startButtons = [
    document.getElementById("start-plan-button"),
    document.getElementById("hero-start-button"),
    document.getElementById("how-it-works-start-button")
  ];

  function openPersonalization() {
    landingPage.classList.add("hidden");
    personalizationPage.classList.remove("hidden");

    showSlide(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  startButtons.forEach((button) => {
    if (button) {
      button.addEventListener("click", openPersonalization);
    }
  });


  // =========================================================
  // BACK TO HOME
  // =========================================================

  const backToHome = document.getElementById("back-to-home");

  if (backToHome) {
    backToHome.addEventListener("click", () => {

      personalizationPage.classList.add("hidden");
      landingPage.classList.remove("hidden");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });
  }


  // =========================================================
  // SHOW SLIDE
  // =========================================================

  function showSlide(step) {

    if (step < 1 || step > slides.length) {
      return;
    }

    currentStep = step;

    slides.forEach((slide) => {

      const slideNumber =
        Number(slide.dataset.slide);

      slide.classList.toggle(
        "active",
        slideNumber === step
      );

    });


    sidebarSteps.forEach((sidebarStep) => {

      const stepNumber =
        Number(sidebarStep.dataset.step);

      sidebarStep.classList.toggle(
        "active",
        stepNumber === step
      );

      sidebarStep.classList.toggle(
        "completed",
        stepNumber < step
      );

    });


    if (stepLabel) {
      stepLabel.textContent =
        `Step ${step} of ${slides.length}`;
    }


    if (stepName) {
      stepName.textContent =
        stepNames[step - 1];
    }


    if (progressFill) {
      progressFill.style.width =
        `${(step / slides.length) * 100}%`;
    }


    clearMessage();


    // =======================================================
    // ALWAYS SCROLL TO THE FORM TOP
    // =======================================================

    requestAnimationFrame(() => {

      const formMain =
        document.querySelector(".form-main");

      if (formMain) {

        const top =
          formMain.getBoundingClientRect().top +
          window.scrollY -
          20;

        window.scrollTo({
          top,
          behavior: "smooth"
        });

      }

    });

  }


  // =========================================================
  // ERROR HELPERS
  // =========================================================

  function showFieldError(
    input,
    errorElement,
    message
  ) {

    if (input) {
      input.classList.add("input-error");
    }

    if (errorElement) {

      errorElement.textContent =
        message;

      errorElement.classList.add("show");
    }

  }


  function clearFieldError(
    input,
    errorElement
  ) {

    if (input) {
      input.classList.remove("input-error");
    }

    if (errorElement) {

      errorElement.textContent = "";

      errorElement.classList.remove(
        "show"
      );

    }

  }


  function clearMessage() {

    if (messageBox) {

      messageBox.textContent = "";

      messageBox.classList.remove(
        "show"
      );

    }

  }


  function showMessage(message) {

    if (messageBox) {

      messageBox.textContent =
        message;

      messageBox.classList.add(
        "show"
      );

    }

  }


  // =========================================================
  // SLIDE 1 VALIDATION
  // =========================================================

  function validateSlide1() {

    let valid = true;

    const name =
      document.getElementById("name");

    const age =
      document.getElementById("age");

    const height =
      document.getElementById("height");

    const nameError =
      document.getElementById("name-error");

    const ageError =
      document.getElementById("age-error");

    const heightError =
      document.getElementById("height-error");


    clearFieldError(
      name,
      nameError
    );

    clearFieldError(
      age,
      ageError
    );

    clearFieldError(
      height,
      heightError
    );


    // NAME

    const nameValue =
      name.value.trim();

    if (!nameValue) {

      showFieldError(
        name,
        nameError,
        "Please enter your name."
      );

      valid = false;

    } else if (nameValue.length < 2) {

      showFieldError(
        name,
        nameError,
        "Name should contain at least 2 characters."
      );

      valid = false;
    }


    // AGE

    const ageValue =
      Number(age.value);

    if (!age.value) {

      showFieldError(
        age,
        ageError,
        "Please enter your age."
      );

      valid = false;

    } else if (
      !Number.isInteger(ageValue) ||
      ageValue < 1 ||
      ageValue > 120
    ) {

      showFieldError(
        age,
        ageError,
        "Age must be between 1 and 120 years."
      );

      valid = false;
    }


    // HEIGHT

    const heightValue =
      Number(height.value);

    if (!height.value) {

      showFieldError(
        height,
        heightError,
        "Please enter your height."
      );

      valid = false;

    } else if (
      heightValue < 50 ||
      heightValue > 250
    ) {

      showFieldError(
        height,
        heightError,
        "Height must be between 50 and 250 cm."
      );

      valid = false;
    }


    return valid;
  }


  // =========================================================
  // SLIDE 2 VALIDATION
  // =========================================================

  function validateSlide2() {

    let valid = true;

    const currentWeight =
      document.getElementById(
        "current-weight"
      );

    const targetWeight =
      document.getElementById(
        "target-weight"
      );

    const calories =
      document.getElementById(
        "daily-calories"
      );


    const currentWeightError =
      document.getElementById(
        "current-weight-error"
      );

    const targetWeightError =
      document.getElementById(
        "target-weight-error"
      );

    const caloriesError =
      document.getElementById(
        "calories-error"
      );


    clearFieldError(
      currentWeight,
      currentWeightError
    );

    clearFieldError(
      targetWeight,
      targetWeightError
    );

    clearFieldError(
      calories,
      caloriesError
    );


    const currentValue =
      Number(currentWeight.value);

    const targetValue =
      Number(targetWeight.value);

    const caloriesValue =
      Number(calories.value);


    // CURRENT WEIGHT

    if (!currentWeight.value) {

      showFieldError(
        currentWeight,
        currentWeightError,
        "Please enter your current weight."
      );

      valid = false;

    } else if (
      currentValue < 20 ||
      currentValue > 300
    ) {

      showFieldError(
        currentWeight,
        currentWeightError,
        "Current weight must be between 20 and 300 kg."
      );

      valid = false;
    }


    // TARGET WEIGHT

    if (!targetWeight.value) {

      showFieldError(
        targetWeight,
        targetWeightError,
        "Please enter your target weight."
      );

      valid = false;

    } else if (
      targetValue < 20 ||
      targetValue > 300
    ) {

      showFieldError(
        targetWeight,
        targetWeightError,
        "Target weight must be between 20 and 300 kg."
      );

      valid = false;
    }


    // GOAL CONSISTENCY

    const selectedGoal =
      document.querySelector(
        'input[name="goal"]:checked'
      );

    const goal =
      selectedGoal
        ? selectedGoal.value
        : "";


    if (
      currentWeight.value &&
      targetWeight.value &&
      currentValue >= 20 &&
      currentValue <= 300 &&
      targetValue >= 20 &&
      targetValue <= 300
    ) {

      if (
        goal === "Weight Loss" &&
        targetValue >= currentValue
      ) {

        showFieldError(
          targetWeight,
          targetWeightError,
          "For Weight Loss, target weight must be lower than current weight."
        );

        valid = false;
      }


      if (
        goal === "Weight Gain" &&
        targetValue <= currentValue
      ) {

        showFieldError(
          targetWeight,
          targetWeightError,
          "For Weight Gain, target weight must be higher than current weight."
        );

        valid = false;
      }


      if (
        goal === "Maintain Weight" &&
        targetValue !== currentValue
      ) {

        showFieldError(
          targetWeight,
          targetWeightError,
          "For Maintain Weight, target weight must match current weight."
        );

        valid = false;
      }

    }


    // CALORIES

    if (!calories.value) {

      showFieldError(
        calories,
        caloriesError,
        "Please enter your daily calorie target."
      );

      valid = false;

    } else if (
      caloriesValue < 1000 ||
      caloriesValue > 6000
    ) {

      showFieldError(
        calories,
        caloriesError,
        "Daily calories must be between 1000 and 6000 kcal."
      );

      valid = false;
    }


    return valid;
  }


  // =========================================================
  // SLIDE 3 VALIDATION
  // =========================================================

  function validateSlide3() {

    const dietType =
      document.querySelector(
        'input[name="diet-type"]:checked'
      );

    const dietError =
      document.getElementById(
        "diet-type-error"
      );


    if (dietError) {

      dietError.textContent = "";

      dietError.classList.remove(
        "show"
      );

    }


    if (!dietType) {

      if (dietError) {

        dietError.textContent =
          "Please select a diet type before continuing.";

        dietError.classList.add(
          "show"
        );

      }

      return false;
    }


    return true;
  }


  // =========================================================
  // SLIDE 4 — SHOW / HIDE DETAILS
  // =========================================================

  function updateRestrictionDetails() {

    const selected =
      document.querySelector(
        'input[name="has-restrictions"]:checked'
      );

    if (!restrictionDetails) {
      return;
    }


    if (
      selected &&
      selected.value === "Yes"
    ) {

      restrictionDetails.classList.remove(
        "hidden"
      );

    } else {

      restrictionDetails.classList.add(
        "hidden"
      );

    }

  }


  // =========================================================
  // CLEAR RESTRICTION DETAILS
  // =========================================================

  function clearRestrictionDetails() {

    document
      .querySelectorAll(
        'input[name="allergies"], input[name="dietary-restrictions"]'
      )
      .forEach((input) => {
        input.checked = false;
      });


    const otherAllergy =
      document.getElementById(
        "other-allergy"
      );

    const otherRestriction =
      document.getElementById(
        "other-restriction"
      );


    if (otherAllergy) {
      otherAllergy.value = "";
    }

    if (otherRestriction) {
      otherRestriction.value = "";
    }


    document
      .querySelectorAll(
        ".expandable-section"
      )
      .forEach((section) => {
        section.removeAttribute("open");
      });

  }


  // =========================================================
  // SLIDE 4 VALIDATION
  // =========================================================

  function validateSlide4() {

    const restrictionChoice =
      document.querySelector(
        'input[name="has-restrictions"]:checked'
      );

    const restrictionError =
      document.getElementById(
        "restriction-choice-error"
      );


    if (restrictionError) {

      restrictionError.textContent = "";

      restrictionError.classList.remove(
        "show"
      );

    }


    // USER MUST ANSWER YES OR NO

    if (!restrictionChoice) {

      if (restrictionError) {

        restrictionError.textContent =
          "Please select Yes or No before generating your plan.";

        restrictionError.classList.add(
          "show"
        );

      }

      showMessage(
        "Please answer the allergies and dietary restrictions question before generating your profile."
      );

      return false;
    }


    // NO = VALID

    if (
      restrictionChoice.value === "No"
    ) {

      return true;
    }


    // YES = REQUIRE DETAILS

    const allergies =
      document.querySelectorAll(
        'input[name="allergies"]:checked'
      );

    const restrictions =
      document.querySelectorAll(
        'input[name="dietary-restrictions"]:checked'
      );


    const otherAllergy =
      document
        .getElementById("other-allergy")
        .value
        .trim();


    const otherRestriction =
      document
        .getElementById("other-restriction")
        .value
        .trim();


    const additionalNotes =
      document
        .getElementById("additional-notes")
        .value
        .trim();


    const hasRestriction =
      allergies.length > 0 ||
      restrictions.length > 0 ||
      otherAllergy !== "" ||
      otherRestriction !== "" ||
      additionalNotes !== "";


    if (!hasRestriction) {

      if (restrictionError) {

        restrictionError.textContent =
          "You selected Yes, so please add at least one allergy, dietary restriction, or note.";

        restrictionError.classList.add(
          "show"
        );

      }

      showMessage(
        "Please provide at least one restriction or additional detail before generating your profile."
      );

      return false;
    }


    return true;
  }


  // =========================================================
  // VALIDATE CURRENT STEP
  // =========================================================

  function validateStep(step) {

    if (step === 1) {
      return validateSlide1();
    }

    if (step === 2) {
      return validateSlide2();
    }

    if (step === 3) {
      return validateSlide3();
    }

    if (step === 4) {
      return validateSlide4();
    }

    return true;
  }


  // =========================================================
  // NEXT BUTTONS
  // =========================================================

  nextButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const nextStep =
        Number(button.dataset.next);


      if (!validateStep(currentStep)) {
        return;
      }


      if (nextStep) {
        showSlide(nextStep);
      }

    });

  });


  // =========================================================
  // BACK BUTTONS
  // =========================================================

  backButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const backStep =
        Number(button.dataset.back);


      if (backStep) {
        showSlide(backStep);
      }

    });

  });


  // =========================================================
  // SIDEBAR NAVIGATION
  // =========================================================

  sidebarSteps.forEach((button) => {

    button.addEventListener("click", () => {

      const requestedStep =
        Number(button.dataset.step);


      // BACKWARDS = ALWAYS ALLOWED

      if (
        requestedStep < currentStep
      ) {

        showSlide(requestedStep);
        return;

      }


      // SAME STEP

      if (
        requestedStep === currentStep
      ) {

        showSlide(requestedStep);
        return;

      }


      // FORWARD = VALIDATE EACH PREVIOUS STEP

      for (
        let step = currentStep;
        step < requestedStep;
        step++
      ) {

        if (!validateStep(step)) {

          showSlide(step);
          return;

        }

      }


      showSlide(requestedStep);

    });

  });


  // =========================================================
  // ENTER KEY NAVIGATION
  // =========================================================

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key !== "Enter") {
        return;
      }


      if (
        personalizationPage.classList.contains(
          "hidden"
        )
      ) {
        return;
      }


      const activeElement =
        document.activeElement;


      // TEXTAREA → NORMAL NEW LINE

      if (
        activeElement &&
        activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }


      // BUTTON → DON'T INTERFERE

      if (
        activeElement &&
        activeElement.tagName === "BUTTON"
      ) {
        return;
      }


      event.preventDefault();


      if (!validateStep(currentStep)) {
        return;
      }


      if (
        currentStep < slides.length
      ) {

        showSlide(
          currentStep + 1
        );

      } else {

        submitProfile();

      }

    }
  );


  // =========================================================
  // PREVENT NUMBER INPUT MOUSE-WHEEL CHANGES
  // =========================================================

  const numberInputs =
    document.querySelectorAll(
      'input[type="number"]'
    );


  numberInputs.forEach((input) => {

    input.addEventListener(
      "wheel",
      (event) => {

        if (
          document.activeElement === input
        ) {

          event.preventDefault();

        }

      },
      {
        passive: false
      }
    );

  });


  // =========================================================
  // RADIO / CHECKBOX HELPERS
  // =========================================================

  function getRadioValue(name) {

    const selected =
      document.querySelector(
        `input[name="${name}"]:checked`
      );


    return selected
      ? selected.value
      : "";

  }


  function getCheckedValues(name) {

    return Array.from(
      document.querySelectorAll(
        `input[name="${name}"]:checked`
      )
    ).map(
      (input) => input.value
    );

  }


  // =========================================================
  // BUILD PROFILE
  // =========================================================

  function buildUserProfile() {

    return {

      name:
        document
          .getElementById("name")
          .value
          .trim(),


      age:
        Number(
          document
            .getElementById("age")
            .value
        ),


      height_cm:
        Number(
          document
            .getElementById("height")
            .value
        ),


      gender:
        getRadioValue("gender"),


      goal:
        getRadioValue("goal"),


      current_weight_kg:
        Number(
          document
            .getElementById(
              "current-weight"
            )
            .value
        ),


      target_weight_kg:
        Number(
          document
            .getElementById(
              "target-weight"
            )
            .value
        ),


      daily_calories_kcal:
        Number(
          document
            .getElementById(
              "daily-calories"
            )
            .value
        ),


      diet_type:
        getRadioValue(
          "diet-type"
        ),


      food_preferences:
        getCheckedValues(
          "food-preferences"
        ),


      other_food_preference:
        document
          .getElementById(
            "other-food-preference"
          )
          .value
          .trim(),


      specific_foods: {

        include:
          document
            .getElementById(
              "include-foods"
            )
            .value
            .trim(),


        exclude:
          document
            .getElementById(
              "exclude-foods"
            )
            .value
            .trim()

      },


      has_restrictions:
        getRadioValue(
          "has-restrictions"
        ),


      allergies:
        getCheckedValues(
          "allergies"
        ),


      other_allergy:
        document
          .getElementById(
            "other-allergy"
          )
          .value
          .trim(),


      dietary_restrictions:
        getCheckedValues(
          "dietary-restrictions"
        ),


      other_restriction:
        document
          .getElementById(
            "other-restriction"
          )
          .value
          .trim(),


      additional_notes:
        document
          .getElementById(
            "additional-notes"
          )
          .value
          .trim()

    };

  }


  // =========================================================
  // DISPLAY PROFILE
  // =========================================================

  function displayProfile(profile) {

    const outputGoal =
      document.getElementById(
        "output-goal"
      );


    const outputCurrentWeight =
      document.getElementById(
        "output-current-weight"
      );


    const outputTargetWeight =
      document.getElementById(
        "output-target-weight"
      );


    const outputDiet =
      document.getElementById(
        "output-diet"
      );


    const outputCalories =
      document.getElementById(
        "output-calories"
      );


    const profileJson =
      document.getElementById(
        "profile-json"
      );


    if (outputGoal) {

      outputGoal.textContent =
        profile.goal || "—";

    }


    if (outputCurrentWeight) {

      outputCurrentWeight.textContent =
        `${profile.current_weight_kg} kg`;

    }


    if (outputTargetWeight) {

      outputTargetWeight.textContent =
        `${profile.target_weight_kg} kg`;

    }


    if (outputDiet) {

      outputDiet.textContent =
        profile.diet_type || "—";

    }


    if (outputCalories) {

      outputCalories.textContent =
        `${profile.daily_calories_kcal} kcal`;

    }


    if (profileJson) {

      profileJson.textContent =
        JSON.stringify(
          profile,
          null,
          2
        );

    }

  }


  // =========================================================
  // SUBMIT PROFILE
  // =========================================================

  function submitProfile() {

    clearMessage();


    // VALIDATE EVERY STEP ONE FINAL TIME

    for (
      let step = 1;
      step <= slides.length;
      step++
    ) {

      if (!validateStep(step)) {

        showSlide(step);

        return;

      }

    }


    const profile =
      buildUserProfile();


    displayProfile(profile);


    if (form) {
      form.classList.add("hidden");
    }


    if (profileOutput) {

      profileOutput.classList.remove(
        "hidden"
      );


      requestAnimationFrame(() => {

        profileOutput.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      });

    }

  }


  // =========================================================
  // FORM SUBMIT
  // =========================================================

  if (form) {

    form.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        submitProfile();

      }
    );

  }


  // =========================================================
  // REAL-TIME ERROR CLEANUP
  // =========================================================

  const allInputs =
    document.querySelectorAll(
      "input, textarea"
    );


  allInputs.forEach((input) => {

    input.addEventListener(
      "input",
      () => {

        input.classList.remove(
          "input-error"
        );


        const errorElement =
          document.getElementById(
            `${input.id}-error`
          );


        if (errorElement) {

          errorElement.textContent = "";

          errorElement.classList.remove(
            "show"
          );

        }


        // Clear restriction validation
        // when user starts providing details.

        if (
          input.name === "allergies" ||
          input.name ===
            "dietary-restrictions" ||
          input.name ===
            "other_allergy" ||
          input.name ===
            "other_restriction" ||
          input.name ===
            "additional_notes"
        ) {

          const restrictionError =
            document.getElementById(
              "restriction-choice-error"
            );


          if (restrictionError) {

            restrictionError.textContent =
              "";

            restrictionError.classList.remove(
              "show"
            );

          }


          clearMessage();

        }

      }
    );


    input.addEventListener(
      "change",
      () => {

        input.classList.remove(
          "input-error"
        );


        const errorElement =
          document.getElementById(
            `${input.id}-error`
          );


        if (errorElement) {

          errorElement.textContent =
            "";

          errorElement.classList.remove(
            "show"
          );

        }


        // DIET TYPE ERROR

        if (
          input.name ===
          "diet-type"
        ) {

          const dietError =
            document.getElementById(
              "diet-type-error"
            );


          if (dietError) {

            dietError.textContent =
              "";

            dietError.classList.remove(
              "show"
            );

          }

        }


        // YES / NO RESTRICTION ERROR

        if (
          input.name ===
          "has-restrictions"
        ) {

          const restrictionError =
            document.getElementById(
              "restriction-choice-error"
            );


          if (restrictionError) {

            restrictionError.textContent =
              "";

            restrictionError.classList.remove(
              "show"
            );

          }


          clearMessage();


          // SHOW DETAILS FOR YES

          if (
            input.value === "Yes" &&
            input.checked
          ) {

            updateRestrictionDetails();

          }


          // HIDE + CLEAR DETAILS FOR NO

          if (
            input.value === "No" &&
            input.checked
          ) {

            clearRestrictionDetails();

            updateRestrictionDetails();

          }

        }

      }
    );

  });


  // =========================================================
  // GOAL CHANGE
  // =========================================================

  const goalOptions =
    document.querySelectorAll(
      'input[name="goal"]'
    );


  goalOptions.forEach((goal) => {

    goal.addEventListener(
      "change",
      () => {

        const targetWeight =
          document.getElementById(
            "target-weight"
          );


        const targetWeightError =
          document.getElementById(
            "target-weight-error"
          );


        clearFieldError(
          targetWeight,
          targetWeightError
        );

      }
    );

  });


  // =========================================================
  // INITIAL STATE
  // =========================================================

  showSlide(1);

});