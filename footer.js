// footer.js — Injects a shared footer on all pages.
// On the home page (with .home-hero), it inserts the footer directly after the hero
// and removes the empty .layout block to avoid any white gap.

(() => {
  if (window.__FOOTER_INITED__) return;
  window.__FOOTER_INITED__ = true;

  document.addEventListener("DOMContentLoaded", () => {
    const year = new Date().getFullYear();

    const html = `
<footer class="site-footer" role="contentinfo">
  <div class="site-footer__inner">
    <div>
      <div class="site-footer__brand">ENGL 1190 Class Website</div>
<hr/>
      <p>ENGL 1190 website and its individual pages, unless otherwise noted, are created by Sarah Karlis and are licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License. </p>
    </div>

    <nav aria-label="Footer – Quick Links">
      <h4>Quick Links</h4>
      <ul>
        <li><a href="/index.html">Home</a></li>
        <li><a href="/calendar/index.html">Calendar</a></li>
        <li><a href="/assignments/index.html">Assignments</a></li>
        <li><a href="/resources/index.html">Resources</a></li>
        <li><a href="/policies/index.html">Class Policies</a></li>
      </ul>
    </nav>

    <div>
      <h4>External Links</h4>
      <p><a href="https://online.macomb.edu">Canvas</a></p>
       </div>
  </div>
</footer>`.trim();

    const hero = document.querySelector(".home-hero");
    const layout = document.querySelector(".layout");

    if (hero) {
      // Home page: insert footer right under the hero, and hide an empty layout to remove white gap.
      hero.insertAdjacentHTML("afterend", html);

      const main = document.querySelector("main.content#page-content") || document.querySelector("main.content");
      const mainIsEmpty = main && main.children.length === 0 && main.textContent.trim() === "";
      if (layout && mainIsEmpty && document.body.classList.contains("no-sidenav")) {
        // If the layout is just an empty content area (your current index.html),
        // remove it so nothing sits between the hero and the footer.
        layout.remove();
      }
    } else if (layout) {
      // Other pages: put footer after the layout grid so it spans full width.
      layout.insertAdjacentHTML("afterend", html);
    } else {
      // Fallback: append to end of body.
      document.body.insertAdjacentHTML("beforeend", html);
    }
  });
})();
