/* =========================================================
   NUTRIGEN
   Frontend JavaScript
   Day 4 - Multi-Step Form + Sidebar
   ========================================================= */


document.addEventListener("DOMContentLoaded", () => {


  /* =======================================================
     ELEMENTS
     ======================================================= */

  const landingPage =
    document.getElementById("landing-page");

  const personalizationPage =
    document.getElementById("personalization-page");

  const form =
    document.getElementById("nutrigen-form");

  const slides =
    Array.from(document.querySelectorAll(".form-slide"));

  const sidebarSteps =
    Array.from(document.querySelectorAll(".sidebar-step"));

  const progressFill =
    document.getElementById("progress-fill");

  const stepLabel =
    document.getElementById("step-label");

  const stepName =
    document.getElementById("step-name");

  const message =
    document.getElementById("message");

  const profileOutput =
    document.getElementById("profile-output");


  /* =======================================================
     START BUTTONS
     ======================================================= */

  const startButtons = [
    document.getElementById("start-plan-button"),
    document.getElementById("hero-start-button"),
    document.getElementById("how-it-works-start-button")
  ].filter(Boolean);


  /* =======================================================
     STEP INFORMATION
     ======================================================= */

  const stepNames = {
    1: "About You",
    2: "Your Goal",
    3: "Food Preferences",
    4: "Health & Restrictions"
  };


  let currentStep = 1;


  /* =======================================================
     CONTROLLED SCROLLING
     
     IMPORTANT PROJECT REQUIREMENT:
     Every Continue, Back and Sidebar navigation must
     automatically scroll to the newly opened slide.
     ======================================================= */

  function scrollToElement(element, offset = 30) {

    if (!element) {
      return;
    }

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        const elementTop =
          element.getBoundingClientRect().top +
          window.scrollY -
          offset;

        window.scrollTo({
          top: Math.max(0, elementTop),
          behavior: "smooth"
        });

      });

    });

  }


  /* =======================================================
     OPEN PERSONALIZATION
     ======================================================= */

  function openPersonalization() {

    landingPage.classList.add("hidden");

    personalizationPage.classList.remove("hidden");

    currentStep = 1;

    showStep(1, false);

    scrollToElement(personalizationPage, 20);
  }


  startButtons.forEach((button) => {

    button.addEventListener(
      "click",
      openPersonalization
    );

  });


  /* =======================================================
     SHOW STEP
     ======================================================= */

  function showStep(
    step,
    shouldScroll = true
  ) {

    if (
      step < 1 ||
      step > slides.length
    ) {
      return;
    }


    currentStep = step;


    /* -----------------------------------------------
       Activate correct slide
       ----------------------------------------------- */

    slides.forEach((slide, index) => {

      const isActive =
        index + 1 === step;

      slide.classList.toggle(
        "active",
        isActive
      );

    });


    /* -----------------------------------------------
       Progress text
       ----------------------------------------------- */

    stepLabel.textContent =
      `Step ${step} of ${slides.length}`;

    stepName.textContent =
      stepNames[step];


    /* -----------------------------------------------
       Progress bar
       ----------------------------------------------- */

    const percentage =
      (step / slides.length) * 100;

    progressFill.style.width =
      `${percentage}%`;


    /* -----------------------------------------------
       Sidebar
       ----------------------------------------------- */

    updateSidebar(step);


    /* -----------------------------------------------
       Clear previous messages
       ----------------------------------------------- */

    clearMessage();


    /* -----------------------------------------------
       AUTOMATIC SCROLL
       ----------------------------------------------- */

    if (shouldScroll) {

      const selectedSlide =
        slides[step - 1];

      scrollToElement(
        selectedSlide,
        30
      );

    }

  }


  /* =======================================================
     SIDEBAR STATE
     ======================================================= */

  function updateSidebar(step) {

    sidebarSteps.forEach((sidebarStep) => {

      const number =
        Number(
          sidebarStep.dataset.sidebarStep
        );


      sidebarStep.classList.remove(
        "active",
        "completed"
      );


      if (number === step) {

        sidebarStep.classList.add(
          "active"
        );

      }


      if (number < step) {

        sidebarStep.classList.add(
          "completed"
        );

      }

    });

  }


  /* =======================================================
     VALIDATE STEP
     ======================================================= */

  function validateStep(step) {

    clearMessage();


    /* =====================================================
       STEP 1
       ===================================================== */

    if (step === 1) {

      const name =
        document.getElementById("name");

      const age =
        document.getElementById("age");


      if (!name.value.trim()) {

        showMessage(
          "Please enter your name.",
          "error"
        );

        name.focus();

        return false;
      }


      const ageValue =
        Number(age.value);


      if (
        !age.value ||
        ageValue < 1 ||
        ageValue > 120
      ) {

        showMessage(
          "Please enter a valid age between 1 and 120.",
          "error"
        );

        age.focus();

        return false;
      }

    }


    /* =====================================================
       STEP 2
       ===================================================== */

    if (step === 2) {

      const currentWeight =
        document.getElementById(
          "current-weight"
        );

      const targetWeight =
        document.getElementById(
          "target-weight"
        );


      const current =
        Number(currentWeight.value);

      const target =
        Number(targetWeight.value);


      /* Current weight */

      if (
        !currentWeight.value ||
        current < 20 ||
        current > 300
      ) {

        showMessage(
          "Please enter a valid current weight between 20 and 300 kg.",
          "error"
        );

        currentWeight.focus();

        return false;
      }


      /* Target weight */

      if (
        !targetWeight.value ||
        target < 20 ||
        target > 300
      ) {

        showMessage(
          "Please enter a valid target weight between 20 and 300 kg.",
          "error"
        );

        targetWeight.focus();

        return false;
      }


      /* Goal */

      const selectedGoal =
        document.querySelector(
          'input[name="goal"]:checked'
        );


      if (!selectedGoal) {

        showMessage(
          "Please select your goal.",
          "error"
        );

        return false;
      }


      const goal =
        selectedGoal.value;


      /* Weight loss */

      if (
        goal === "Weight Loss" &&
        target >= current
      ) {

        showMessage(
          "For weight loss, your target weight should be lower than your current weight.",
          "error"
        );

        targetWeight.focus();

        return false;
      }


      /* Weight gain */

      if (
        goal === "Weight Gain" &&
        target <= current
      ) {

        showMessage(
          "For weight gain, your target weight should be higher than your current weight.",
          "error"
        );

        targetWeight.focus();

        return false;
      }


      /* Maintain */

      if (
        goal === "Maintain Weight" &&
        target !== current
      ) {

        showMessage(
          "For maintaining weight, your target weight should match your current weight.",
          "error"
        );

        targetWeight.focus();

        return false;
      }

    }


    /* =====================================================
       STEP 3
       ===================================================== */

    if (step === 3) {

      const selectedDiet =
        document.querySelector(
          'input[name="diet_type"]:checked'
        );


      if (!selectedDiet) {

        showMessage(
          "Please select your diet type.",
          "error"
        );

        return false;
      }

    }


    /* =====================================================
       STEP 4
       ===================================================== */

    if (step === 4) {

      /*
       * All current Step 4 fields are optional.
       *
       * No blocking validation is required.
       */

    }


    return true;

  }


  /* =======================================================
     CONTINUE BUTTONS
     ======================================================= */

  document
    .querySelectorAll(".next-button")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const nextStep =
            Number(button.dataset.next);


          if (
            !validateStep(currentStep)
          ) {
            return;
          }


          showStep(
            nextStep,
            true
          );

        }
      );

    });


  /* =======================================================
     BACK BUTTONS
     ======================================================= */

  document
    .querySelectorAll(".back-button")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const previousStep =
            Number(button.dataset.back);


          showStep(
            previousStep,
            true
          );

        }
      );

    });


  /* =======================================================
     SIDEBAR NAVIGATION
     ======================================================= */

  sidebarSteps.forEach(
    (sidebarStep) => {

      sidebarStep.addEventListener(
        "click",
        () => {

          const requestedStep =
            Number(
              sidebarStep.dataset.sidebarStep
            );


          /* Already on this step */

          if (
            requestedStep === currentStep
          ) {
            return;
          }


          /* ---------------------------------------------
             Going backward
             --------------------------------------------- */

          if (
            requestedStep < currentStep
          ) {

            showStep(
              requestedStep,
              true
            );

            return;
          }


          /* ---------------------------------------------
             Going forward
             Validate every step in between.
             --------------------------------------------- */

          let stepToValidate =
            currentStep;


          while (
            stepToValidate < requestedStep
          ) {

            if (
              !validateStep(
                stepToValidate
              )
            ) {

              return;

            }


            stepToValidate++;

          }


          showStep(
            requestedStep,
            true
          );

        }
      );

    }
  );


  /* =======================================================
     FORM SUBMISSION
     ======================================================= */

  form.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      if (!validateStep(4)) {
        return;
      }


      const profile =
        collectProfileData();


      displayProfile(profile);


      profileOutput.classList.remove(
        "hidden"
      );


      /* Automatically scroll to result */

      scrollToElement(
        profileOutput,
        30
      );

    }
  );


  /* =======================================================
     COLLECT PROFILE DATA
     ======================================================= */

  function collectProfileData() {

    const formData =
      new FormData(form);


    const profile = {

      name:
        formData
          .get("name")
          ?.trim() || "",


      age:
        Number(
          formData.get("age")
        ) || null,


      gender:
        formData.get("gender") || "",


      goal:
        formData.get("goal") || "",


      current_weight:
        Number(
          formData.get(
            "current_weight"
          )
        ) || null,


      target_weight:
        Number(
          formData.get(
            "target_weight"
          )
        ) || null,


      diet_type:
        formData.get(
          "diet_type"
        ) || "",


      food_preferences:
        formData.getAll(
          "food_preferences"
        ),


      other_food_preference:
        formData
          .get(
            "other_food_preference"
          )
          ?.trim() || "",


      specific_foods:
        formData
          .get(
            "specific_foods"
          )
          ?.trim() || "",


      allergies:
        formData.getAll(
          "allergies"
        ),


      other_allergy:
        formData
          .get(
            "other_allergy"
          )
          ?.trim() || "",


      dietary_restrictions:
        formData.getAll(
          "dietary_restrictions"
        ),


      other_restriction:
        formData
          .get(
            "other_restriction"
          )
          ?.trim() || "",


      additional_notes:
        formData
          .get(
            "additional_notes"
          )
          ?.trim() || ""

    };


    return profile;

  }


  /* =======================================================
     DISPLAY PROFILE
     ======================================================= */

  function displayProfile(profile) {

    const resultGoal =
      document.getElementById(
        "result-goal"
      );

    const resultCurrentWeight =
      document.getElementById(
        "result-current-weight"
      );

    const resultTargetWeight =
      document.getElementById(
        "result-target-weight"
      );

    const resultDiet =
      document.getElementById(
        "result-diet"
      );

    const profileJson =
      document.getElementById(
        "profile-json"
      );


    if (resultGoal) {

      resultGoal.textContent =
        profile.goal || "—";

    }


    if (resultCurrentWeight) {

      resultCurrentWeight.textContent =
        profile.current_weight !== null
          ? `${profile.current_weight} kg`
          : "—";

    }


    if (resultTargetWeight) {

      resultTargetWeight.textContent =
        profile.target_weight !== null
          ? `${profile.target_weight} kg`
          : "—";

    }


    if (resultDiet) {

      resultDiet.textContent =
        profile.diet_type || "—";

    }


    if (profileJson) {

      profileJson.textContent =
        JSON.stringify(
          profile,
          null,
          2
        );

    }


    /* -----------------------------------------------
       Save profile locally.
       This prepares the frontend for future
       backend/API integration.
       ----------------------------------------------- */

    localStorage.setItem(
      "nutrigen_user_profile",
      JSON.stringify(profile)
    );

  }


  /* =======================================================
     MESSAGE HANDLING
     ======================================================= */

  function showMessage(
    text,
    type = "error"
  ) {

    if (!message) {
      return;
    }


    message.textContent =
      text;

    message.className =
      type;


    /* Scroll validation message into view */

    scrollToElement(
      message,
      100
    );

  }


  function clearMessage() {

    if (!message) {
      return;
    }


    message.textContent =
      "";

    message.className =
      "";

  }


  /* =======================================================
     WEIGHT INPUT LIMITS
     ======================================================= */

  const weightInputs = [

    document.getElementById(
      "current-weight"
    ),

    document.getElementById(
      "target-weight"
    )

  ].filter(Boolean);


  weightInputs.forEach(
    (input) => {

      input.addEventListener(
        "input",
        () => {

          const value =
            Number(input.value);


          if (value > 300) {

            input.value = 300;

          }


          if (value < 0) {

            input.value = "";

          }

        }
      );

    }
  );


  /* =======================================================
     AGE INPUT LIMIT
     ======================================================= */

  const ageInput =
    document.getElementById(
      "age"
    );


  if (ageInput) {

    ageInput.addEventListener(
      "input",
      () => {

        const value =
          Number(ageInput.value);


        if (value > 120) {

          ageInput.value = 120;

        }


        if (value < 0) {

          ageInput.value = "";

        }

      }
    );

  }


  /* =======================================================
     INITIAL STATE
     ======================================================= */

  showStep(
    1,
    false
  );

});