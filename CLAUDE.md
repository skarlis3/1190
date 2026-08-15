# 1190 Site Repo

## Read these first, before doing any work in this repo

The rules governing this work are deliberately not kept in this repo, because this repo is public. Nothing here repeats them, so skipping these files means working without them. **Read each one in full — do not skim for the sections that look relevant.**

1. `~/MEGA/work-with-claude-code/CLAUDE.md` — how Sarah wants the work done.
2. `~/MEGA/work-with-claude-code/classes/CLAUDE.md` — rules shared across every class.
3. `~/MEGA/work-with-claude-code/classes/ENGL-1190/CLAUDE.md` — this course: term, sections, readings, assignments, calendars.

Everything below this point is about this repo's own files, and belongs here.

## The calendar is shared code — edit all three repos

`calendar/calendar.js` and `calendar/calendar.css` are **byte-identical** in `1190`, `1181` and `1170`. Not similar; identical. Check before and after any change:

```
md5sum ~/Websites_work/{1190,1181,1170}/calendar/calendar.{js,css}
```

**A fix made in one repo and not the others silently forks them.** That is not hypothetical: this file drifted before, and on 15 Aug 2026 1170 was found still carrying urgency colours at 2.8:1 and 3.3:1 that 1181 had fixed months earlier. Nobody noticed because nothing compares them.

**The sharing is also what catches bugs.** The same day, porting the calendar to a third site forced its colours to be recalculated against a different palette, which exposed a card border sitting at 1.18:1 against the page in dark mode — invisible, and live on a site that had just been through a contrast pass. One palette hid it; three did not.

### The stylesheet is token-driven, so it must stay colour-agnostic

`calendar.css` reads `--accent`, `--bright`, `--muted`, `--text`, `--bg` and `--border` from each site's own `style.css`. That is how one file renders navy here, teal on 1181 and purple on 1170. **Never hard-code a site's colour into it.** The event-type colours (due amber, reading blue, online green) are deliberately the same everywhere and are the only fixed values in the file.

**Contrast has to be re-checked per site, because the palettes differ.** A ratio that clears 7:1 against one accent can fail against another. The dark card-edge mix is 48% rather than 46% for exactly this reason: 46% cleared 3:1 on the teal site and landed at 2.88 and 2.93 on the purple and navy ones. The measured ratios are recorded in comments beside the tokens — read them rather than re-deriving, and re-run the maths for **all three** sites if you change a colour.

### What is *not* shared

The page shells are per-site and always differ: filenames, `data-calendar-id`, headings, tab titles and nav labels. Only the two files above are common.

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
