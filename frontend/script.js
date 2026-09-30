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
   LANDING PAGE → PERSONALIZATION
========================================================= */

function openPersonalization() {

  landingPage.classList.add("hidden");

  personalizationPage.classList.remove("hidden");


  showSlide(1);

}


startButtons.forEach((button) => {

  if (button) {

    button.addEventListener(
      "click",
      openPersonalization
    );

  }

});


/* =========================================================
   UPDATE SLIDE
========================================================= */

function showSlide(slideNumber) {

  /* Remove active state from all slides */

  slides.forEach((slide) => {

    slide.classList.remove("active");

  });


  /* Find the slide we want */

  const selectedSlide =
    document.getElementById(
      `slide-${slideNumber}`
    );


  if (!selectedSlide) {

    return;

  }


  /* Activate selected slide */

  selectedSlide.classList.add("active");


  currentSlide = slideNumber;


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


  /* Clear previous messages */

  clearMessage();


  /* =======================================================
     SCROLL TO CURRENT SLIDE
  ======================================================= */

  setTimeout(() => {

    selectedSlide.scrollIntoView({

      behavior: "smooth",

      block: "start"

    });

  }, 100);

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


  /* Name */

  if (!name) {

    showMessage(
      "Please enter your name before continuing."
    );

    return false;

  }


  /* Age */

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


  /* Make sure goal is selected */

  if (!selectedGoal) {

    showMessage(
      "Please select your nutrition goal."
    );

    return false;

  }


  const goal =
    selectedGoal.value;


  /* Get weights */

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
     SAFE WEIGHT RANGE
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
     WEIGHT LOSS LOGIC
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
     WEIGHT GAIN LOGIC
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
     MAINTAIN WEIGHT LOGIC
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
    () => {

      const nextSlide =
        Number(
          button.dataset.next
        );


      /* Slide 1 */

      if (
        currentSlide === 1
      ) {

        if (!validateSlide1()) {

          return;

        }

      }


      /* Slide 2 */

      if (
        currentSlide === 2
      ) {

        if (!validateSlide2()) {

          return;

        }

      }


      /* Slide 3 */

      if (
        currentSlide === 3
      ) {

        if (!validateSlide3()) {

          return;

        }

      }


      /* Move forward */

      showSlide(
        nextSlide
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
    () => {

      const previousSlide =
        Number(
          button.dataset.back
        );


      showSlide(
        previousSlide
      );

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


  const gender =
    document.querySelector(
      'input[name="gender"]:checked'
    ).value;


  /* =======================================================
     GOAL INFORMATION
  ======================================================= */

  const goal =
    document.querySelector(
      'input[name="goal"]:checked'
    ).value;


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

  const dietType =
    document.querySelector(
      'input[name="diet_type"]:checked'
    ).value;


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
     RETURN COMPLETE PROFILE
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

  const breakfast =
    document.getElementById(
      "meal-breakfast"
    );


  const lunch =
    document.getElementById(
      "meal-lunch"
    );


  const dinner =
    document.getElementById(
      "meal-dinner"
    );


  const snack =
    document.getElementById(
      "meal-snack"
    );


  /* =======================================================
     VEGAN PLAN
  ======================================================= */

  if (
    profile.diet_type === "Vegan"
  ) {

    if (breakfast) {

      breakfast.textContent =
        "Oats with banana, berries and plant-based milk";

    }


    if (lunch) {

      lunch.textContent =
        "Chickpea and quinoa power bowl with vegetables";

    }


    if (dinner) {

      dinner.textContent =
        "Lentil curry with brown rice and vegetables";

    }


    if (snack) {

      snack.textContent =
        "Fruit with a small handful of seeds";

    }


    return;

  }


  /* =======================================================
     VEGETARIAN PLAN
  ======================================================= */

  if (
    profile.diet_type === "Vegetarian"
  ) {

    if (breakfast) {

      breakfast.textContent =
        "Vegetable omelette with whole-grain toast";

    }


    if (lunch) {

      lunch.textContent =
        "Paneer and vegetable grain bowl";

    }


    if (dinner) {

      dinner.textContent =
        "Dal with brown rice, vegetables and curd";

    }


    if (snack) {

      snack.textContent =
        "Greek yogurt with fruit and seeds";

    }


    return;

  }


  /* =======================================================
     NON-VEGETARIAN PLAN
  ======================================================= */

  if (breakfast) {

    breakfast.textContent =
      "Eggs with whole-grain toast and fresh fruit";

  }


  if (lunch) {

    lunch.textContent =
      "Grilled chicken with rice and mixed vegetables";

  }


  if (dinner) {

    dinner.textContent =
      "Fish with roasted vegetables and whole grains";

  }


  if (snack) {

    snack.textContent =
      "Greek yogurt with fruit and nuts";

  }

}


/* =========================================================
   FORM SUBMISSION
========================================================= */

form.addEventListener(
  "submit",
  (event) => {

    /* Stop normal form submission */

    event.preventDefault();


    /* =====================================================
       FINAL VALIDATION
    ===================================================== */

    if (!validateSlide2()) {

      showMessage(
        "Please check your goal and weight information."
      );

      showSlide(2);

      return;

    }


    /* =====================================================
       BUILD USER PROFILE
    ===================================================== */

    const userProfile =
      buildUserProfile();


    /* =====================================================
       SUCCESS MESSAGE
    ===================================================== */

    showMessage(
      `Your profile is ready, ${userProfile.name}.`,
      "success"
    );


    /* =====================================================
       SHOW RESULT
    ===================================================== */

    if (profileOutput) {

      profileOutput.classList.remove(
        "hidden"
      );

    }


    /* =====================================================
       UPDATE RESULT SUMMARY
    ===================================================== */

    updateResultSummary(
      userProfile
    );


    /* =====================================================
       GENERATE MEAL PLAN
    ===================================================== */

    generateMealPlan(
      userProfile
    );


    /* =====================================================
       DISPLAY COMPLETE PROFILE
    ===================================================== */

    if (profileJson) {

      profileJson.textContent =
        JSON.stringify(
          userProfile,
          null,
          2
        );

    }


    /* =====================================================
       SCROLL TO RESULT
    ===================================================== */

    setTimeout(() => {

      if (profileOutput) {

        profileOutput.scrollIntoView({

          behavior: "smooth",

          block: "start"

        });

      }

    }, 100);

  }
);


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


/* Start on Slide 1 */

showSlide(1);