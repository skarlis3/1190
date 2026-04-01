/* ==========================================================================
   In-Class / Presentation Mode — JS
   Pair with inclass.css. Include on any standalone in-class or presentation page.
   Adds a toggle button and manages Wake Lock.
   Layout is handled entirely by CSS (columns).
   ========================================================================== */

(function () {
  "use strict";

  let wakeLock = null;

  // Create the toggle button
  const btn = document.createElement("button");
  btn.className = "presentation-toggle";
  btn.setAttribute("aria-label", "Toggle presentation mode");
  btn.textContent = "Presentation Mode";
  document.body.appendChild(btn);

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      }
    } catch (e) {
      // Wake Lock may fail if tab is not visible; that's fine
    }
  }

  async function releaseWakeLock() {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  }

  // Re-acquire wake lock if the page regains visibility while in presentation mode
  document.addEventListener("visibilitychange", () => {
    if (document.body.classList.contains("presentation-mode") && document.visibilityState === "visible") {
      requestWakeLock();
    }
  });

  function enterPresentation() {
    document.body.classList.add("presentation-mode");
    btn.textContent = "Exit Presentation";
    requestWakeLock();
  }

  function exitPresentation() {
    document.body.classList.remove("presentation-mode");
    btn.textContent = "Presentation Mode";
    releaseWakeLock();
  }

  btn.addEventListener("click", () => {
    if (document.body.classList.contains("presentation-mode")) {
      exitPresentation();
    } else {
      enterPresentation();
    }
  });

  // Escape key exits presentation mode
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("presentation-mode")) {
      exitPresentation();
    }
  });
})();
