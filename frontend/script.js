/* =========================================================
   NUTRIGEN — MAIN APP CONTROLLER
========================================================= */


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const landingPage =
  document.getElementById("landing-page");

const personalizationPage =
  document.getElementById("personalization-page");


const startButtons = [
  document.getElementById("start-plan-button"),
  document.getElementById("hero-start-button"),
  document.getElementById("how-it-works-start-button")
];


const form =
  document.getElementById("nutrigen-form");


const slides =
  document.querySelectorAll(".form-slide");


const stepLabel =
  document.getElementById("step-label");


const stepName =
  document.getElementById("step-name");


const progressFill =
  document.getElementById("progress-fill");


const messageBox =
  document.getElementById("message");


const profileOutput =
  document.getElementById("profile-output");


const profileJson =
  document.getElementById("profile-json");


let currentSlide = 1;


/* =========================================================
   STEP NAMES
========================================================= */

const stepNames = {

  1: "About You",

  2: "Your Goal",

  3: "Food Preferences",

  4: "Health & Restrictions"

};


/* =========================================================
   PAGE SCROLL HELPER
========================================================= */

/*
   We use window.scrollTo() instead of scrollIntoView().

   This gives us more control over where the page stops and
   prevents the browser from unexpectedly jumping to the top.
*/

function scrollToElement(element, offset = 25) {

  if (!element) {
    return;
  }


  const elementPosition =
    element.getBoundingClientRect().top +
    window.pageYOffset;


  const targetPosition =
    Math.max(
      0,
      elementPosition - offset
    );


  window.scrollTo({

    top: targetPosition,

    behavior: "smooth"

  });

}


/* =========================================================
   LANDING PAGE → PERSONALIZATION
========================================================= */

function openPersonalization(event) {

  if (event) {
    event.preventDefault();
  }


  /* Hide landing page */

  if (landingPage) {

    landingPage.classList.add("hidden");

  }


  /* Show personalization page */

  if (personalizationPage) {

    personalizationPage.classList.remove("hidden");

  }


  /* Always start from Slide 1 */

  showSlide(1, false);


  /*
     Wait until the browser has applied the hidden/display
     change before calculating the position.

     This is important because the personalization section
     cannot have a correct position while it is display:none.
  */

  requestAnimationFrame(() => {

    requestAnimationFrame(() => {

      scrollToElement(
        personalizationPage,
        20
      );

    });

  });

}


/* =========================================================
   START BUTTON EVENTS
========================================================= */

startButtons.forEach((button) => {

  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    openPersonalization
  );

});


/* =========================================================
   UPDATE SLIDE
========================================================= */

function showSlide(
  slideNumber,
  shouldScroll = true
) {

  const selectedSlide =
    document.getElementById(
      `slide-${slideNumber}`
    );


  if (!selectedSlide) {
    return;
  }


  /* =======================================================
     REMOVE ACTIVE FROM ALL SLIDES
  ======================================================= */

  slides.forEach((slide) => {

    slide.classList.remove("active");

  });


  /* =======================================================
     ACTIVATE SELECTED SLIDE
  ======================================================= */

  selectedSlide.classList.add("active");


  currentSlide =
    slideNumber;


  /* =======================================================
     UPDATE PROGRESS TEXT
  ======================================================= */

  if (stepLabel) {

    stepLabel.textContent =
      `Step ${slideNumber} of ${slides.length}`;

  }


  if (stepName) {

    stepName.textContent =
      stepNames[slideNumber];

  }


  /* =======================================================
     UPDATE PROGRESS BAR
  ======================================================= */

  if (progressFill) {

    const progress =
      (slideNumber / slides.length) * 100;


    progressFill.style.width =
      `${progress}%`;

  }


  /* =======================================================
     SIDEBAR STEP
  ======================================================= */

  const sidebarSteps =
    document.querySelectorAll(
      ".sidebar-step"
    );


  sidebarSteps.forEach((step) => {

    step.classList.remove("active");

  });


  const activeSidebarStep =
    document.querySelector(
      `.sidebar-step[data-sidebar-step="${slideNumber}"]`
    );


  if (activeSidebarStep) {

    activeSidebarStep.classList.add(
      "active"
    );

  }


  /* =======================================================
     CLEAR OLD MESSAGE
  ======================================================= */

  clearMessage();


  /* =======================================================
     SCROLL TO SLIDE
  ======================================================= */

  if (shouldScroll) {

    /*
       Give the browser a moment to apply the active class
       before calculating the slide's position.
    */

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {

        scrollToElement(
          selectedSlide,
          20
        );

      });

    });

  }

}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(
  message,
  type = "warning"
) {

  if (!messageBox) {
    return;
  }


  messageBox.textContent =
    message;


  messageBox.className =
    type;


  /*
     Make sure the message is visible if validation
     fails on a slide.
  */

  requestAnimationFrame(() => {

    scrollToElement(
      messageBox,
      100
    );

  });

}


function clearMessage() {

  if (!messageBox) {
    return;
  }


  messageBox.textContent =
    "";


  messageBox.className =
    "";

}


/* =========================================================
   SLIDE 1 VALIDATION
========================================================= */

function validateSlide1() {

  const nameInput =
    document.getElementById("name");


  const ageInput =
    document.getElementById("age");


  if (!nameInput || !ageInput) {
    return false;
  }


  const name =
    nameInput.value.trim();


  const age =
    Number(
      ageInput.value
    );


  /* =======================================================
     NAME
  ======================================================= */

  if (!name) {

    showMessage(
      "Please enter your name before continuing."
    );

    return false;

  }


  /* =======================================================
     AGE
  ======================================================= */

  if (
    !age ||
    age < 1 ||
    age > 120
  ) {

    showMessage(
      "Please enter a valid age between 1 and 120."
    );

    return false;

  }


  return true;

}


/* =========================================================
   SLIDE 2 VALIDATION
========================================================= */

function validateSlide2() {

  const selectedGoal =
    document.querySelector(
      'input[name="goal"]:checked'
    );


  /* =======================================================
     GOAL
  ======================================================= */

  if (!selectedGoal) {

    showMessage(
      "Please select your nutrition goal."
    );

    return false;

  }


  const goal =
    selectedGoal.value;


  /* =======================================================
     WEIGHT INPUTS
  ======================================================= */

  const currentWeightInput =
    document.getElementById(
      "current-weight"
    );


  const targetWeightInput =
    document.getElementById(
      "target-weight"
    );


  if (
    !currentWeightInput ||
    !targetWeightInput
  ) {

    return false;

  }


  const currentWeight =
    Number(
      currentWeightInput.value
    );


  const targetWeight =
    Number(
      targetWeightInput.value
    );


  /* =======================================================
     REQUIRED WEIGHTS
  ======================================================= */

  if (
    !currentWeight ||
    !targetWeight
  ) {

    showMessage(
      "Please enter both your current weight and target weight."
    );

    return false;

  }


  /* =======================================================
     SAFE CURRENT WEIGHT RANGE
  ======================================================= */

  if (
    currentWeight < 20 ||
    currentWeight > 300
  ) {

    showMessage(
      "Please enter a current weight between 20 kg and 300 kg."
    );

    return false;

  }


  /* =======================================================
     SAFE TARGET WEIGHT RANGE
  ======================================================= */

  if (
    targetWeight < 20 ||
    targetWeight > 300
  ) {

    showMessage(
      "Please enter a target weight between 20 kg and 300 kg."
    );

    return false;

  }


  /* =======================================================
     WEIGHT LOSS
  ======================================================= */

  if (
    goal === "Weight Loss" &&
    targetWeight >= currentWeight
  ) {

    showMessage(
      "For a weight-loss goal, your target weight should be lower than your current weight."
    );

    return false;

  }


  /* =======================================================
     WEIGHT GAIN
  ======================================================= */

  if (
    goal === "Weight Gain" &&
    targetWeight <= currentWeight
  ) {

    showMessage(
      "For a weight-gain goal, your target weight should be higher than your current weight."
    );

    return false;

  }


  /* =======================================================
     MAINTAIN WEIGHT
  ======================================================= */

  if (
    goal === "Maintain Weight" &&
    targetWeight !== currentWeight
  ) {

    showMessage(
      "For maintaining your weight, your target weight should match your current weight."
    );

    return false;

  }


  return true;

}


/* =========================================================
   SLIDE 3 VALIDATION
========================================================= */

function validateSlide3() {

  const dietType =
    document.querySelector(
      'input[name="diet_type"]:checked'
    );


  if (!dietType) {

    showMessage(
      "Please select your dietary preference."
    );

    return false;

  }


  return true;

}


/* =========================================================
   NEXT BUTTONS
========================================================= */

const nextButtons =
  document.querySelectorAll(
    ".next-button"
  );


nextButtons.forEach((button) => {

  button.addEventListener(
    "click",
    (event) => {

      event.preventDefault();


      const nextSlide =
        Number(
          button.dataset.next
        );


      /* ===================================================
         SLIDE 1
      =================================================== */

      if (
        currentSlide === 1
      ) {

        if (!validateSlide1()) {

          return;

        }

      }


      /* ===================================================
         SLIDE 2
      =================================================== */

      if (
        currentSlide === 2
      ) {

        if (!validateSlide2()) {

          return;

        }

      }


      /* ===================================================
         SLIDE 3
      =================================================== */

      if (
        currentSlide === 3
      ) {

        if (!validateSlide3()) {

          return;

        }

      }


      /* ===================================================
         MOVE FORWARD
      =================================================== */

      showSlide(
        nextSlide,
        true
      );

    }
  );

});


/* =========================================================
   BACK BUTTONS
========================================================= */

const backButtons =
  document.querySelectorAll(
    ".back-button"
  );


backButtons.forEach((button) => {

  button.addEventListener(
    "click",
    (event) => {

      event.preventDefault();


      const previousSlide =
        Number(
          button.dataset.back
        );


      showSlide(
        previousSlide,
        true
      );

    }
  );

});


/* =========================================================
   SIDEBAR STEP NAVIGATION
========================================================= */

const sidebarSteps =
  document.querySelectorAll(
    ".sidebar-step"
  );


sidebarSteps.forEach((step) => {

  step.addEventListener(
    "click",
    () => {

      const targetSlide =
        Number(
          step.dataset.sidebarStep
        );


      /*
         Only allow navigation to a step that has already
         been reached or is the current step.

         This prevents someone from skipping straight to
         Slide 4 without completing earlier information.
      */

      if (
        targetSlide <= currentSlide
      ) {

        showSlide(
          targetSlide,
          true
        );

      }

    }
  );

});


/* =========================================================
   CHECKBOX VALUE COLLECTOR
========================================================= */

function getCheckedValues(
  containerId
) {

  const container =
    document.getElementById(
      containerId
    );


  if (!container) {

    return [];

  }


  const checkedBoxes =
    container.querySelectorAll(
      'input[type="checkbox"]:checked'
    );


  return Array
    .from(checkedBoxes)
    .map(
      (box) => box.value
    );

}


/* =========================================================
   BUILD USER PROFILE
========================================================= */

function buildUserProfile() {

  /* =======================================================
     PERSONAL INFORMATION
  ======================================================= */

  const name =
    document
      .getElementById("name")
      .value
      .trim();


  const age =
    Number(
      document
        .getElementById("age")
        .value
    );


  const genderInput =
    document.querySelector(
      'input[name="gender"]:checked'
    );


  const gender =
    genderInput
      ? genderInput.value
      : null;


  /* =======================================================
     GOAL INFORMATION
  ======================================================= */

  const goalInput =
    document.querySelector(
      'input[name="goal"]:checked'
    );


  const goal =
    goalInput
      ? goalInput.value
      : null;


  const currentWeight =
    Number(
      document
        .getElementById("current-weight")
        .value
    );


  const targetWeight =
    Number(
      document
        .getElementById("target-weight")
        .value
    );


  /* =======================================================
     DIET INFORMATION
  ======================================================= */

  const dietInput =
    document.querySelector(
      'input[name="diet_type"]:checked'
    );


  const dietType =
    dietInput
      ? dietInput.value
      : null;


  /* =======================================================
     FOOD PREFERENCES
  ======================================================= */

  const foodPreferences =
    getCheckedValues(
      "food-preferences"
    );


  const otherFoodPreference =
    document
      .getElementById(
        "other-food-preference"
      )
      .value
      .trim();


  const specificFoods =
    document
      .getElementById(
        "specific-foods"
      )
      .value
      .trim();


  /* =======================================================
     ALLERGIES
  ======================================================= */

  const allergies =
    getCheckedValues(
      "allergies"
    );


  const otherAllergy =
    document
      .getElementById(
        "other-allergy"
      )
      .value
      .trim();


  /* =======================================================
     DIETARY RESTRICTIONS
  ======================================================= */

  const dietaryRestrictions =
    getCheckedValues(
      "dietary-restrictions"
    );


  const otherRestriction =
    document
      .getElementById(
        "other-restriction"
      )
      .value
      .trim();


  /* =======================================================
     ADDITIONAL INFORMATION
  ======================================================= */

  const additionalNotes =
    document
      .getElementById(
        "additional-notes"
      )
      .value
      .trim();


  /* =======================================================
     COMPLETE PROFILE
  ======================================================= */

  return {

    name: name,

    age: age,

    gender: gender,

    goal: goal,

    current_weight_kg:
      currentWeight,

    target_weight_kg:
      targetWeight,

    diet_type:
      dietType,

    food_preferences:
      foodPreferences,

    other_food_preference:
      otherFoodPreference || null,

    specific_foods:
      specificFoods || null,

    allergies:
      allergies,

    other_allergy:
      otherAllergy || null,

    dietary_restrictions:
      dietaryRestrictions,

    other_restriction:
      otherRestriction || null,

    additional_notes:
      additionalNotes || null

  };

}


/* =========================================================
   RESULT SUMMARY
========================================================= */

function updateResultSummary(
  profile
) {

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


  if (resultGoal) {

    resultGoal.textContent =
      profile.goal;

  }


  if (resultCurrentWeight) {

    resultCurrentWeight.textContent =
      `${profile.current_weight_kg} kg`;

  }


  if (resultTargetWeight) {

    resultTargetWeight.textContent =
      `${profile.target_weight_kg} kg`;

  }


  if (resultDiet) {

    resultDiet.textContent =
      profile.diet_type;

  }

}


/* =========================================================
   MEAL PLAN GENERATOR
========================================================= */

function generateMealPlan(
  profile
) {

  /*
     Your current HTML does not have elements with:
     #meal-breakfast
     #meal-lunch
     #meal-dinner
     #meal-snack

     So we safely find the meal cards instead.
  */

  const mealCards =
    document.querySelectorAll(
      ".meal-plan-grid .meal-card"
    );


  if (!mealCards.length) {

    return;

  }


  let meals = [];


  /* =======================================================
     VEGAN
  ======================================================= */

  if (
    profile.diet_type === "Vegan"
  ) {

    meals = [

      {
        title:
          "Oats with banana, berries and plant-based milk",

        description:
          "A balanced plant-based breakfast with whole grains and fruit."
      },

      {
        title:
          "Chickpea and quinoa power bowl with vegetables",

        description:
          "A protein-rich plant-based lunch built around legumes and grains."
      },

      {
        title:
          "Lentil curry with brown rice and vegetables",

        description:
          "A filling plant-based dinner with lentils, grains and vegetables."
      },

      {
        title:
          "Fruit with a small handful of seeds",

        description:
          "A simple plant-based snack with fruit and healthy fats."
      }

    ];

  }


  /* =======================================================
     VEGETARIAN
  ======================================================= */

  else if (
    profile.diet_type === "Vegetarian"
  ) {

    meals = [

      {
        title:
          "Vegetable omelette with whole-grain toast",

        description:
          "A protein-rich vegetarian breakfast with vegetables and whole grains."
      },

      {
        title:
          "Paneer and vegetable grain bowl",

        description:
          "A balanced vegetarian lunch combining paneer, grains and vegetables."
      },

      {
        title:
          "Dal with brown rice, vegetables and curd",

        description:
          "A balanced vegetarian dinner with lentils, grains and dairy."
      },

      {
        title:
          "Greek yogurt with fruit and seeds",

        description:
          "A simple vegetarian snack with protein, fruit and seeds."
      }

    ];

  }


  /* =======================================================
     NON-VEGETARIAN
  ======================================================= */

  else {

    meals = [

      {
        title:
          "Eggs with whole-grain toast and fresh fruit",

        description:
          "A protein-rich breakfast with eggs, whole grains and fruit."
      },

      {
        title:
          "Grilled chicken with rice and mixed vegetables",

        description:
          "A balanced lunch combining lean protein, grains and vegetables."
      },

      {
        title:
          "Fish with roasted vegetables and whole grains",

        description:
          "A protein-rich dinner with fish, vegetables and whole grains."
      },

      {
        title:
          "Greek yogurt with fruit and nuts",

        description:
          "A snack combining protein, fruit and healthy fats."
      }

    ];

  }


  /* =======================================================
     UPDATE CARDS
  ======================================================= */

  mealCards.forEach(
    (card, index) => {

      const meal =
        meals[index];


      if (!meal) {
        return;
      }


      const title =
        card.querySelector("h3");


      const description =
        card.querySelector("p");


      if (title) {

        title.textContent =
          meal.title;

      }


      if (description) {

        description.textContent =
          meal.description;

      }

    }
  );

}


/* =========================================================
   FORM SUBMISSION
========================================================= */

if (form) {

  form.addEventListener(
    "submit",
    (event) => {

      /* ===================================================
         STOP NORMAL SUBMISSION
      =================================================== */

      event.preventDefault();


      /* ===================================================
         FINAL VALIDATION
      =================================================== */

      if (!validateSlide1()) {

        showSlide(1, true);

        return;

      }


      if (!validateSlide2()) {

        showSlide(2, true);

        return;

      }


      if (!validateSlide3()) {

        showSlide(3, true);

        return;

      }


      /* ===================================================
         BUILD PROFILE
      =================================================== */

      const userProfile =
        buildUserProfile();


      /* ===================================================
         SUCCESS MESSAGE
      =================================================== */

      showMessage(
        `Your profile is ready, ${userProfile.name}.`,
        "success"
      );


      /* ===================================================
         SHOW RESULT
      =================================================== */

      if (profileOutput) {

        profileOutput.classList.remove(
          "hidden"
        );

      }


      /* ===================================================
         UPDATE SUMMARY
      =================================================== */

      updateResultSummary(
        userProfile
      );


      /* ===================================================
         GENERATE MEAL PLAN
      =================================================== */

      generateMealPlan(
        userProfile
      );


      /* ===================================================
         DISPLAY JSON
      =================================================== */

      if (profileJson) {

        profileJson.textContent =
          JSON.stringify(
            userProfile,
            null,
            2
          );

      }


      /* ===================================================
         SCROLL TO RESULT
      =================================================== */

      requestAnimationFrame(() => {

        requestAnimationFrame(() => {

          scrollToElement(
            profileOutput,
            20
          );

        });

      });

    }
  );

}


/* =========================================================
   INITIAL PAGE STATE
========================================================= */

if (landingPage) {

  landingPage.classList.remove(
    "hidden"
  );

}


if (personalizationPage) {

  personalizationPage.classList.add(
    "hidden"
  );

}


if (profileOutput) {

  profileOutput.classList.add(
    "hidden"
  );

}


/* =========================================================
   INITIAL SLIDE
========================================================= */

showSlide(
  1,
  false
);

