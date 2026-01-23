// nav.js — Top nav (desktop), Bottom nav (mobile), and full-screen mobile sidenav
// Drop-in: <script src="/nav.js"></script> just before </body>

(() => {
  if (window.__NAV_INITED__) return;
  window.__NAV_INITED__ = true;

  document.addEventListener("DOMContentLoaded", () => {
    try {
      // -------------------- Data --------------------
      const TOP_NAV = [
        { label: "Home", href: "/index.html" },
        { label: "Calendar", href: "/calendar/index.html" },
        { label: "Assignments", href: "/assignments/index.html" },
        { label: "Resources", href: "/resources/index.html" },
        { label: "Policies & Info", href: "/policies/index.html" }
      ];

      const SIDENAV = [
        {
          label: "Assignments",
          href: "/assignments/index.html",
          children: [
            { label: "Introduction Assignment", href: "/assignments/introduction.html" },
            {
              label: "Weekly Writing",
              href: "/assignments/weeklywriting.html",
              children: Array.from({ length: 9 }, (_, i) => ({
                label: `Weekly Writing ${i + 1}`,
                href: `/assignments/ww${i + 1}.html`
              }))
            },
            {
              label: "Project 1: Research Paper",
              href: "/assignments/project1.html",
              children: [
                { label: "Project 1 Overview", href: "/assignments/research-paper-overview.html" },
                { label: "Rough Draft", href: "/assignments/rough-draft.html" },
                { label: "Peer Review", href: "/assignments/peer-review.html" },
                { label: "Revised Draft", href: "/assignments/revised-draft.html" },
                { label: "Self-Eval & Reflection", href: "/assignments/reflection.html" },
                { label: "Individual Conferences", href: "/assignments/conferences.html" },
                { label: "Example Organization", href: "/assignments/example-organization.html" },
                { label: "Example Essays", href: "/assignments/example-papers.html" },
                { label: "APA Style & Citations", href: "/assignments/apa-style-citations.html" }
              ]
            },
            {
          label: "Project 2: Museum Exhibits",
          href: "/assignments/p2-overview.html",
          children: [
            { label: "Project 2 Overview", href: "/assignments/p2-overview.html" },
            { label: "Creating Artifacts", href: "/assignments/p2-artifacts.html" },
            { label: "Building the Exhibit", href: "/assignments/p2-exhibit.html" },
            { label: "Exhibit Day & Visitor Report", href: "/assignments/p2-exhibit-day.html" },
            { label: "Example Museum Exhibits", href: "/assignments/p2-examples.html" }
          ]
        },
            { label: "Final Portfolio", href: "/assignments/final-portfolio.html" }
          ]
        },
        {
          label: "Resources",
          href: "/resources/index.html",
          children: [
            { label: "Readings", href: "/resources/readings.html" },
            { label: "Videos", href: "/resources/videos.html" },
            { label: "Sample Assignments", href: "/resources/samples.html" }
          ]
        },
        {
          label: "Readings",
          href: "/readings/index.html",
          children: [{ label: "AI & Energy Use", href: "/readings/ai-and-energy.html" }
            
          ]
        },
        {
          label: "Calendars",
          href: "/calendar/index.html",
          children: [{ label: "M/W Class", href: "/calendar/mw-calendar.html" }]
        },
        {
          label: "Policies & Info",
          href: "/policies/index.html",
          children: [
            { label: "FAQs", href: "/policies/faq.html" },
            { label: "Technology", href: "/policies/technology.html" },
            { label: "Virtual Office Hours", href: "/policies/virtual-office-hours.html" },
            { label: "Attendance", href: "/policies/attendance.html" },
            { label: "Late Work", href: "/policies/late-policy.html" },
            { label: "Grading", href: "/policies/grading.html" },
            { label: "Academic Integrity", href: "/policies/academic-integrity.html" },
            { label: "AI Use & Transparency", href: "/policies/genai-policy.html" }
          ]
        }
      ];

      // -------------------- Utility functions --------------------
      const esc = (s) =>
        String(s).replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
      const path = location.pathname.toLowerCase().replace(/\/+$/, "");
      const last = path.split("/").pop() || "index.html";
      const clean = (s) => String(s || "").toLowerCase().replace(/^\.?\//, "");
      const isCurrent = (href) => {
        if (!href) return false;
        const h = clean(href);
        const hBare = h.split("#")[0].split("?")[0];
        if (last === hBare) return true;
        if (path.endsWith("/" + hBare)) return true;
        const stem = hBare.endsWith(".html") ? hBare.slice(0, -5) : hBare;
        return path.endsWith("/" + stem) || path.endsWith("/" + stem + "/") || path.endsWith("/" + stem + "/index.html");
      };
      const containsCurrent = (node) => node && (isCurrent(node.href) || (node.children || []).some(containsCurrent));
      const sectionDir = (href) => {
        if (!href) return "/";
        const u = new URL(href, location.href);
        let p = u.pathname.toLowerCase().replace(/\/+$/, "");
        if (p.endsWith(".html")) p = p.slice(0, p.lastIndexOf("/"));
        return p || "/";
      };
      const isNavActive = (href) => {
        if (!href) return false;
        if (isCurrent(href)) return true;
        const cur = new URL(location.href).pathname.toLowerCase().replace(/\/+$/, "");
        const dir = sectionDir(href);
        return dir === "/" ? cur.endsWith("/index.html") || cur === "/" : cur.startsWith(dir);
      };
      const menuTitleFor = (label) => {
        const L = String(label || "").toLowerCase();
        if (L.includes("polic")) return "Policies Menu";
        if (L.includes("calendar")) return "Calendar Menu";
        return `${label} Menu`;
      };

      const caretSVG = `
        <svg class="caret" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`.trim();

      // -------------------- Renderers --------------------
      const renderTopNav = () => `
        <input type="checkbox" id="topnav-toggle" class="nav-toggle" />
        <nav class="topnav" role="navigation" aria-label="Top">
          <div class="topnav-inner">
            <a class="brand" href="/index.html">ENGL 1190</a>
            <label for="topnav-toggle" class="hamburger" aria-label="Toggle main menu">☰</label>
            <ul class="menu">
              ${TOP_NAV.map(i => `
                <li><a href="${esc(i.href)}"${isNavActive(i.href) ? ' aria-current="page"' : ''}>${esc(i.label)}</a></li>
              `).join("")}
            </ul>
          </div>
        </nav>`;

      // More robust: match by label OR href -----------
      const iconFor = (label, href = "") => {
        const L = String(label || "").toLowerCase();
        const H = String(href || "").toLowerCase();

        // Class Policies / Policies & Info
        if (L.includes("polic") || H.includes("/polic")) {
          return `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="10.5" x2="12" y2="16.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="12" cy="7.2" r="1.6" fill="currentColor"/>
            </svg>
          `.trim();
        }

        if (L.includes("home") || L.includes("news")) {
          return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10v9h14v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }
        if (L.includes("assign")) {
          return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
        }
        if (L.includes("calendar")) {
          return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="7" y="13" width="4" height="4" rx="1" stroke="currentColor" stroke-width="1.6"/></svg>`;
        }
        if (L.includes("resource")) {
          return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5h9l5 5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.8"/><path d="M14 5v5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }

        // Fallback: simple circle
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/></svg>`;
      };


      const renderBottomNav = () => `
        <nav class="bottomnav" role="navigation" aria-label="Primary">
          <ul class="bottomnav__inner">
            ${TOP_NAV.map(i => `
              <li>
                <a class="bn-item" href="${esc(i.href)}"${isNavActive(i.href) ? ' aria-current="page"' : ''}>
                  <span class="bn-ico">${iconFor(i.label, i.href)}</span>
                  <span class="bn-label">${esc(i.label)}</span>
                </a>
              </li>`).join("")}
          </ul>
        </nav>`;

      const renderList = (children, level = 3) => !children?.length ? "" : `
        <ul class="nav-level-${level}">
          ${children.map(node => {
            const hasKids = !!node.children?.length;
            const open = hasKids && containsCurrent(node);
            if (hasKids)
              return `<li class="subgroup" data-subopen="${open}" data-current-branch="${open}">
                <button class="sub-toggle" type="button" aria-expanded="${open}">${esc(node.label)}${caretSVG}</button>
                ${renderList(node.children, level + 1)}
              </li>`;
            return `<li><a href="${esc(node.href)}"${isCurrent(node.href) ? ' aria-current="page"' : ''}>${esc(node.label)}</a></li>`;
          }).join("")}
        </ul>`;

      const renderLevel2Item = (it) => {
        if (it.children?.length) {
          const open = isCurrent(it.href) || it.children.some(containsCurrent);
          return `<li class="subgroup" data-subopen="${open}" data-current-branch="${open}" data-level="2">
            <button class="sub-toggle" type="button" aria-expanded="${open}">${esc(it.label)}${caretSVG}</button>
            ${renderList(it.children, 3)}
          </li>`;
        }
        return `<li><a href="${esc(it.href)}"${isCurrent(it.href) ? ' aria-current="page"' : ''}>${esc(it.label)}</a></li>`;
      };

      const renderSideGroup = (g) => {
        const level2 = g.children ? [...g.children] : [];
        if (g.href) level2.unshift({ label: "Overview", href: g.href });
        const open = isCurrent(g.href) || level2.some((c) => containsCurrent(c) || isCurrent(c.href));
        return `<li class="group" data-open="${open}">
          <button class="group-toggle" type="button" aria-expanded="${open}">${esc(g.label)}</button>
          <ul class="nav-level-2">${level2.map(renderLevel2Item).join("")}</ul>
        </li>`;
      };

      const renderSideNav = (items, title = "Section Menu") => `
        <input type="checkbox" id="sidenav-toggle" class="nav-toggle" />
        <nav class="sidenav sidenav--fullscreen" role="navigation" aria-label="${esc(title)}">
          <div class="sidenav__bar">
            <div class="sidenav__title">${esc(title)}</div>
            <label for="sidenav-toggle" class="sidenav-close" aria-label="Close ${esc(title)}">
              <span class="x" aria-hidden="true">×</span>
              <span>Close</span>
            </label>
          </div>
          <ul class="nav-level-1">${items.map(renderSideGroup).join("")}</ul>
        </nav>
        <label for="sidenav-toggle" class="sidenav-scrim" aria-hidden="true"></label>`;

      // -------------------- Injection --------------------
      if (!document.querySelector(".topnav")) document.body.insertAdjacentHTML("afterbegin", renderTopNav());
      if (!document.querySelector(".bottomnav")) document.body.insertAdjacentHTML("beforeend", renderBottomNav());

      let layout = document.querySelector(".layout");
      if (!layout) {
        layout = document.createElement("div");
        layout.className = "layout";
        document.body.appendChild(layout);
      }

      const noSidenav = document.body.classList.contains("no-sidenav");
      const curPath = new URL(location.href).pathname.toLowerCase().replace(/\/+$/, "") || "/";
      let itemsForSidenav = null;
      if (document.body.classList.contains("sidenav-show-all")) itemsForSidenav = SIDENAV;
      else {
        const byContains = SIDENAV.find(containsCurrent);
        const byDir = !byContains && SIDENAV.find(g => curPath.startsWith(sectionDir(g.href)));
        itemsForSidenav = byContains ? [byContains] : byDir ? [byDir] : null;
      }

      const sectionTitle = itemsForSidenav?.length ? menuTitleFor(itemsForSidenav[0].label) : "Section Menu";
      if (!noSidenav && itemsForSidenav && !document.querySelector(".sidenav"))
        layout.insertAdjacentHTML("beforeend", renderSideNav(itemsForSidenav, sectionTitle));
      if (!document.querySelector("main.content")) {
        const openBtn = itemsForSidenav ? `<label for="sidenav-toggle" class="open-sidenav-btn">☰ ${esc(sectionTitle)}</label>` : "";
        layout.insertAdjacentHTML("beforeend", `<main class="content">${openBtn}</main>`);
      }
      if (!itemsForSidenav) layout.classList.add("centered-layout");

      const main = document.querySelector("main.content");
      const explicit = document.getElementById("page-content");
      if (explicit && explicit.parentElement !== main) main.appendChild(explicit);

      // -------------------- Behavior --------------------
      const sidenavEl = document.querySelector(".sidenav");
      const checkbox = document.getElementById("sidenav-toggle");

      // --- Mobile scroll lock ---
      const mm = window.matchMedia("(max-width: 900px)");
      let lockedY = 0;
      const lockBody = () => {
        if (!mm.matches) return;
        lockedY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${lockedY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
      };
      const unlockBody = () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        window.scrollTo(0, lockedY);
      };
      if (checkbox) {
        const syncLock = () => (checkbox.checked && mm.matches ? lockBody() : unlockBody());
        checkbox.addEventListener("change", syncLock);
        mm.addEventListener("change", () => { if (!mm.matches) unlockBody(); });
      }

      // Escape closes drawer
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && checkbox && checkbox.checked) checkbox.checked = false;
      });

      // Group toggles
      if (!noSidenav && sidenavEl) {
        const groups = Array.from(sidenavEl.querySelectorAll(".group"));
        const setOpen = (g, open) => {
          g.dataset.open = open ? "true" : "false";
          g.querySelector(".group-toggle").setAttribute("aria-expanded", open ? "true" : "false");
        };
        const openOnly = (target) => groups.forEach((g) => setOpen(g, g === target));
        groups.forEach((g) => {
          const btn = g.querySelector(".group-toggle");
          if (!btn) return;
          btn.addEventListener("click", () => {
            const isOpen = g.dataset.open === "true";
            openOnly(isOpen ? null : g);
          });
        });

        sidenavEl.addEventListener("click", (e) => {
          const btn = e.target.closest(".sub-toggle");
          if (!btn) return;
          const li = btn.closest(".subgroup");
          const ul = li.parentElement;
          const isLevel2 = ul.classList.contains("nav-level-2");
          const isOpen = li.dataset.subopen === "true";
          if (isLevel2) {
            ul.querySelectorAll(".subgroup").forEach((sib) => {
              const sb = sib.querySelector(".sub-toggle");
              sib.dataset.subopen = sib === li ? "true" : "false";
              if (sb) sb.setAttribute("aria-expanded", sib === li ? "true" : "false");
            });
          } else {
            li.dataset.subopen = isOpen ? "false" : "true";
            btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
          }
        });
      }

      if (document.body.classList.contains("sidenav-show-all"))
        document.body.classList.add("sidenav-force-open");
    } catch (err) {
      console.error("nav.js initialization error:", err);
    }
  });
})();
