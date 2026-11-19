/* =========================================================
   NUTRIGEN — theme.js  (light / dark toggle)
   Load in <head> BEFORE style.css so there is no white flash.
   Injects its own toggle buttons — no HTML edits needed.
   ========================================================= */
(function () {
  var KEY = "nutrigen-theme";
  var root = document.documentElement;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function systemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // 1) Apply immediately (before first paint)
  var initial = saved();
  if (initial !== "dark" && initial !== "light") initial = systemDark() ? "dark" : "light";
  root.setAttribute("data-theme", initial);

  var ICONS =
    '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
    '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

  function makeButton() {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-toggle";
    b.title = "Toggle theme";
    b.innerHTML = ICONS;
    return b;
  }

  function sync() {
    var dark = root.getAttribute("data-theme") === "dark";
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-pressed", String(dark));
      b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    });
  }

  function setTheme(t, persist) {
    root.setAttribute("data-theme", t);
    sync();
    if (persist) { try { localStorage.setItem(KEY, t); } catch (e) {} }
  }

  function toggle() {
    root.classList.add("theme-transition");
    setTimeout(function () { root.classList.remove("theme-transition"); }, 450);
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
  }

  // 2) After the page exists: inject buttons on landing, form and results pages
  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".main-nav");
    if (nav) nav.insertBefore(makeButton(), document.getElementById("start-plan-button"));

    var mini = document.querySelector(".mini-brand");
    if (mini) mini.insertBefore(makeButton(), mini.firstChild);

    var actions = document.querySelector(".output-actions");
    if (actions) actions.insertBefore(makeButton(), actions.firstChild);

    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.addEventListener("click", toggle);
    });
    sync();
  });

  // 3) Follow the system theme live, unless the visitor chose manually
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      if (!saved()) setTheme(e.matches ? "dark" : "light", false);
    });
  } catch (e) {}

  // 4) Always print / save PDF in the light theme
  var before = null;
  window.addEventListener("beforeprint", function () {
    before = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
  });
  window.addEventListener("afterprint", function () {
    if (before) root.setAttribute("data-theme", before);
    before = null;
  });
    // 5) Header bar appears only after scrolling
  function onScroll() {
    root.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

})();
