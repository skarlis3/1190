# ENGL 1190 — WCAG AA Accessibility Audit

**Date:** April 2026
**Standard:** WCAG 2.1 AA

## Summary

No issues found. This site passes all WCAG AA checks in both light and dark modes. The shared nav.js framework dynamically injects skip links, main landmarks, ARIA labels, and a dark mode toggle on all pages. All color combinations exceed AA contrast ratios (many exceed AAA). Inline links are underlined for distinguishability. Reduced motion preferences are respected. Conference page heading hierarchy was already fixed earlier in this session.

## Audit Results

| Category | Status | Notes |
|----------|--------|-------|
| Color contrast (light mode) | PASS | All combinations 7.2:1 or higher |
| Color contrast (dark mode) | PASS | All combinations 9.4:1 or higher |
| Language attribute (`lang`) | PASS | All pages |
| Skip links | PASS | Injected dynamically by nav.js |
| Main landmark | PASS | Injected dynamically by nav.js |
| Heading hierarchy | PASS | Correct on all pages (conference callouts fixed earlier this session) |
| Image alt text | PASS | All images have descriptive alt attributes |
| Link distinguishability | PASS | Inline links in `p` and `li` have underlines via CSS |
| Focus indicators | PASS | `:focus-visible` with 2px solid outline on all interactive elements |
| Keyboard navigation | PASS | All interactive elements reachable via keyboard |
| Reduced motion | PASS | `@media (prefers-reduced-motion: reduce)` present in style.css |
| ARIA labels | PASS | Navigation regions, buttons, toggles have appropriate labels (via nav.js) |
| Empty links | PASS | None found |
| Form labels | PASS | No unlabeled form elements |
| Iframe titles | PASS | Calendar iframes have titles |
| Tabindex | PASS | No positive tabindex values |
| Duplicate IDs | PASS | None found |
| Buttons | PASS | All buttons have accessible labels |

## Changes Made

None required — all checks passed.
