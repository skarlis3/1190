# 1190 Site Repo

See `work-with-claude-code/classes/ENGL-1190/CLAUDE.md` for full course context.

## In-Class Activity & Handout Pages

There are three types of pages for in-class use:

### 1. Instructions page (in the site nav)
- A normal site page using `style.css`, `nav.js`, and `footer.js`
- Contains full activity instructions, examples, and templates
- If the activity has standalone companion pages (projector view, handouts, examples), link them at the **top** of the page as pill-shaped links (`.activity-pill`)
  - **Student-facing links first** (examples, handouts) — use `.pill-primary` (filled accent color, stands out)
  - **Instructor-only links second** (projector view) — use `.pill-outline` (outlined, less prominent since only the instructor uses it)
- See `artifact-planning.html` for the pattern

### 2. Projector page (standalone)
- Does **not** use `style.css`, `nav.js`, or `footer.js`
- Self-contained styling: dark-on-light, high contrast, large text
- Content is simplified — key info at a glance, not the full instructions
- Includes `inclass.css` and `inclass.js` (from repo root) for Wake Lock (prevents screen sleep)
- Should include a footer directing students to the class website for full instructions
- See `artifact-planning-projector.html` for the pattern

### 3. Handout pages (standalone, using `handout.css`)
- Uses `/resources/handout.css` — standalone CSS with same fonts/tokens as main site but no nav
- Always light mode, print-friendly
- Has a floating "Back to Class Site" button (`.back-btn`)
- Footer injected via `footer.js`
- Used for handouts that students interact with directly (timeline brainstorming, example timeline)
- See `timeline-handout.html` and `timeline-example.html` for examples

## `inclass.css` + `inclass.js`

Located in repo root. Used **only** on projector pages.

- Adds a floating "Presentation Mode" toggle button
- Requests a Wake Lock to prevent the screen from sleeping
- Escape key exits presentation mode
- Button fades to low opacity so it doesn't distract

### How to use on a new projector page
1. Do **not** include `style.css`, `nav.js`, or `footer.js`
2. Add `<link rel="stylesheet" href="/inclass.css" />` in `<head>`
3. Add `<script src="/inclass.js"></script>` before `</body>`
4. Wrap content in a `<div class="presentation-content">`
5. Page's own `<style>` handles all layout — `inclass.css` only provides the toggle button and base styles

## `handout.css`

Located at `/resources/handout.css`. Used on standalone handout/resource pages.

- Full standalone CSS (replaces style.css, not used alongside it)
- Same Lato/Judson fonts and color tokens as main site
- Always forces light mode (overrides stored dark preference)
- Includes timeline components (nodes, arrows, branches, forks, merges)
- Post-it note style (Shadows Into Light Two font)
- Print stylesheet built in
- Floating glass-style "Back to Class Site" button

## Write in full sentences

Every sentence needs a subject and a verb. **This is a live failure mode, named 13 Aug 2026** after it
turned up across several unrelated projects: recent models drift into a clipped, promotional register even
in plain documents.

The tell is the **verbless headline fragment** — *"Three projects plus a final reflection, scaffolded by
nine writing activities."* That is a caption, not a sentence. Write *"There are three projects and a final
reflection. Nine writing activities scaffold them."*

Same problem in other clothes: em-dash appositives standing in for clauses; bulleted lists of fragments
where prose belongs; bolded lead-ins that replace the verb (*"**Project 2: Rhetorical Analysis** — 1,000
words on one article"*). Bullets are for genuinely parallel enumerable items, and even then each bullet
should be a complete sentence unless it is a bare name, number, or label.

Applies to page copy, planning docs, READMEs, and change logs alike. Does not apply to tables, headings,
filenames, or short labels.

Related but distinct: **no marketing copy** — don't sell the course back to students, don't write
atmospheric openers, don't explain what a reading is *doing* for the class on a student-facing page. That
rule is about not saying it at all; this one is about how to write what does belong. Full statement of both:
`~/MEGA/work-with-claude-code/CLAUDE.md`, under Communication Style.
