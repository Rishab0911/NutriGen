/* NutriGen proactive reminders and meal logging.
   Loaded after script.js; it communicates through the nutrigen:plan-rendered event. */
(() => {
  "use strict";

  const API_BASE = window.location.port === "5500" ? "http://127.0.0.1:8000" : "";
  const USER_MAP_KEY = "nutrigenProactiveUserIds";
  const LAST_NOTIFICATION_KEY = "nutrigenLastNotificationId";
  let userId = null;
  let activeProfile = null;
  let activeResponse = null;
  let pollHandle = null;
  let registering = false;

  const $ = (id) => document.getElementById(id);

  function getUserId(profile) {
    const identity = [
      String(profile?.name || "").trim().toLowerCase(),
      String(profile?.age || ""),
      String(profile?.gender || ""),
    ].join("|");

    try {
      const map = JSON.parse(localStorage.getItem(USER_MAP_KEY) || "{}");
      if (map[identity]) return map[identity];

      const id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `ng-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      map[identity] = id;
      localStorage.setItem(USER_MAP_KEY, JSON.stringify(map));
      return id;
    } catch {
      return `ng-session-${Date.now()}`;
    }
  }

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) {
      const detail = typeof data.detail === "string"
        ? data.detail
        : data.detail?.message || `Request failed (${response.status})`;
      throw new Error(detail);
    }
    return data;
  }

  function ensurePanel() {
    let panel = $("proactive-panel");
    if (panel) return panel;

    const section = $("meal-plan-section");
    const heading = section?.querySelector(".section-heading");
    if (!section || !heading) return null;

    heading.insertAdjacentHTML("afterend", `
      <section class="proactive-panel" id="proactive-panel" aria-labelledby="proactive-title">
        <div class="proactive-panel-main">
          <div class="proactive-panel-copy">
            <span class="proactive-eyebrow">DAILY SUPPORT</span>
            <h3 id="proactive-title">Smart nutrition reminders</h3>
            <p>Log meals as you eat. NutriGen will use your logged intake to send timely reminders.</p>
          </div>
          <div class="proactive-panel-controls">
            <label class="proactive-toggle">
              <input type="checkbox" id="proactive-enabled" checked>
              <span>Daily reminders</span>
            </label>
            <button type="button" class="proactive-browser-button" id="proactive-browser-enable">
              Enable browser alerts
            </button>
          </div>
        </div>
        <div class="proactive-progress" id="proactive-progress">Meal tracking will appear here.</div>
        <p class="proactive-feedback" id="proactive-feedback" role="status" aria-live="polite"></p>
        <div class="proactive-notifications" id="proactive-notifications">
          <strong>Recent reminders</strong>
          <ul id="proactive-notification-list"><li>No reminders yet.</li></ul>
        </div>
      </section>
    `);

    $("proactive-enabled")?.addEventListener("change", async (event) => {
      if (!userId) return;
      try {
        await api("/proactive/settings", {
          method: "POST",
          body: JSON.stringify({ user_id: userId, enabled: event.target.checked }),
        });
        setFeedback(event.target.checked ? "Daily reminders are on." : "Daily reminders are paused.");
        await refreshStatus(false);
      } catch (error) {
        setFeedback(error.message, true);
        event.target.checked = !event.target.checked;
      }
    });

    $("proactive-browser-enable")?.addEventListener("click", async () => {
      if (!("Notification" in window)) {
        setFeedback("This browser does not support desktop notifications.", true);
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setFeedback("Browser alerts enabled. NutriGen must remain open to check for new reminders.");
          $("proactive-browser-enable").textContent = "Browser alerts enabled";
        } else {
          setFeedback("Browser alerts were not enabled. In-page reminders will still appear while NutriGen is open.");
        }
      } catch {
        setFeedback("Could not request browser notification permission.", true);
      }
    });

    return $("proactive-panel");
  }

  function setFeedback(message, isError = false) {
    const target = $("proactive-feedback");
    if (!target) return;
    target.textContent = message || "";
    target.classList.toggle("is-error", !!isError);
  }

  function profileForReminder(profile, response) {
    const allergies = [...(profile?.allergies || [])];
    String(profile?.otherAllergy || "")
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => allergies.push(item));

    const preferences = [...(profile?.preferences || [])];
    if (profile?.otherPreference) preferences.push(profile.otherPreference);
    if (profile?.include) preferences.push(`Foods to include: ${profile.include}`);
    if (profile?.avoid) preferences.push(`Foods to avoid: ${profile.avoid}`);

    return {
      user_id: userId,
      calorie_target: Number(response?.daily_calories),
      protein_target: Number(response?.macros?.protein),
      diet: profile?.diet || "",
      allergies: [...new Set(allergies)],
      preferences,
      restrictions: [
        ...(profile?.restrictions || []),
        ...(profile?.otherRestriction ? [profile.otherRestriction] : []),
      ],
    };
  }

  async function registerPlan(profile, response) {
    if (registering || !profile || !response?.macros) return;
    registering = true;
    try {
      await api("/proactive/register", {
        method: "POST",
        body: JSON.stringify(profileForReminder(profile, response)),
      });
      setFeedback("Your plan is connected to daily reminders.");
      await refreshStatus(true);
      if (pollHandle) clearInterval(pollHandle);
      pollHandle = setInterval(() => refreshStatus(true), 60000);
    } catch (error) {
      setFeedback(`Reminder setup unavailable: ${error.message}`, true);
    } finally {
      registering = false;
    }
  }

  function addMealLogButtons() {
    document.querySelectorAll(".output-meal-card").forEach((card) => {
      const macroLine = card.querySelector(".macro-line");
      if (!macroLine || card.querySelector(".proactive-log-button")) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "proactive-log-button";
      button.textContent = "Mark as eaten";
      button.dataset.proactiveLog = "true";
      button.dataset.logged = "false";
      button.setAttribute("aria-pressed", "false");
      macroLine.insertAdjacentElement("afterend", button);
    });
  }

  function applyLoggedMeals(meals = []) {
    const logged = new Set(meals.map((meal) => meal.meal_label));
    document.querySelectorAll(".output-meal-card").forEach((card) => {
      const label = card.dataset.cardLabel;
      const isLogged = logged.has(label);
      const button = card.querySelector(".proactive-log-button");
      if (button) {
        button.dataset.logged = String(isLogged);
        button.textContent = isLogged ? "Undo meal log" : "Mark as eaten";
        button.setAttribute("aria-pressed", String(isLogged));
        button.classList.toggle("is-logged", isLogged);
      }
      card.querySelectorAll(".swap-meal-btn, .swap-nav-btn").forEach((swap) => {
        swap.disabled = isLogged;
        if (isLogged) swap.title = "Undo the meal log before changing this meal.";
        else swap.removeAttribute("title");
      });
    });
  }

  async function handleMealLog(button) {
    const card = button.closest(".output-meal-card");
    if (!card || !userId) return;
    const logged = button.dataset.logged !== "true";
    button.disabled = true;
    try {
      const result = await api("/proactive/log-meal", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          meal_label: card.dataset.cardLabel,
          calories: Number(card.dataset.mealCalories || 0),
          protein: Number(card.dataset.mealProtein || 0),
          logged,
        }),
      });
      applyLoggedMeals(result.meals || []);
      await refreshStatus(false);
      setFeedback(logged
        ? `${card.dataset.cardLabel} logged using the planned portion.`
        : `${card.dataset.cardLabel} removed from today's log.`);
    } catch (error) {
      setFeedback(error.message, true);
    } finally {
      button.disabled = false;
    }
  }

  function showNewNotification(notification) {
    const message = notification.message || "You have a new NutriGen reminder.";
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("NutriGen reminder", { body: message, tag: `nutrigen-${notification.id}` });
      } catch {}
    } else {
      setFeedback(message);
    }
  }

  function renderNotifications(notifications = []) {
    const list = $("proactive-notification-list");
    if (!list) return;
    if (!notifications.length) {
      list.innerHTML = "<li>No reminders yet. Keep logging meals to get useful nudges.</li>";
      return;
    }
    list.innerHTML = notifications.slice(0, 5).map((item) => {
      const when = new Date(item.created_at).toLocaleString();
      const safeMessage = String(item.message || "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      }[c]));
      return `<li><span>${safeMessage}</span><small>${when}</small></li>`;
    }).join("");
  }

  async function refreshStatus(checkNew = true) {
    if (!userId) return;
    try {
      const data = await api(`/proactive/status/${encodeURIComponent(userId)}`);
      const toggle = $("proactive-enabled");
      if (toggle) toggle.checked = !!data.enabled;

      const count = (data.meals || []).length;
      const calories = Math.round(Number(data.calories_logged || 0));
      const protein = Math.round(Number(data.protein_logged || 0));
      const progress = $("proactive-progress");
      if (progress) {
        progress.textContent = `${count}/4 meals logged - ${calories} kcal - ${protein} g protein logged today.`;
      }

      applyLoggedMeals(data.meals || []);
      renderNotifications(data.notifications || []);

      const latestId = Math.max(0, ...(data.notifications || []).map((item) => Number(item.id) || 0));
      let lastSeen = 0;
      try { lastSeen = Number(
  localStorage.getItem(`${LAST_NOTIFICATION_KEY}:${userId}`) || 0
); } catch {}
      if (checkNew && lastSeen > 0) {
        const unseen = (data.notifications || [])
          .filter((item) => Number(item.id) > lastSeen)
          .sort((a, b) => Number(a.id) - Number(b.id));
        unseen.forEach(showNewNotification);
      }
      if (latestId > lastSeen) {
        try { localStorage.setItem(
  `${LAST_NOTIFICATION_KEY}:${userId}`,
  String(latestId)
);} catch {}
      }
    } catch (error) {
      if (!String(error.message).includes("404")) setFeedback(error.message, true);
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".proactive-log-button");
    if (button) handleMealLog(button);
  });

  window.addEventListener("nutrigen:plan-rendered", (event) => {
    const detail = event.detail || {};
    activeProfile = detail.profile || activeProfile;
    activeResponse = detail.response || activeResponse;
    if (activeProfile) userId = getUserId(activeProfile);
    ensurePanel();
    addMealLogButtons();
    if (activeProfile && activeResponse) {
      registerPlan(activeProfile, activeResponse);
    }
  });

})();
