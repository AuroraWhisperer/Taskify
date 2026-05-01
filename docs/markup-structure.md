# Markup Deficiency: Invalid HTML from Nested Full Documents Inside EJS Partials

This document is the second coursework deficiency (separate from account security). The core problem is that many `views/partials/**/*.ejs` files were written as **standalone HTML pages** (`<!DOCTYPE html>`, `<html>`, nested `<head>` and `<body>`), while they were **included inside** templates that already defined the single document shell (`index.ejs`, `dashboard.ejs`). That produced an invalid DOM: multiple document roots, `<head>` elements appearing inside `<body>`, and duplicated metadata. Browsers “recover” from errors, but the structure is not compliant, harder to reason about for accessibility tools and validators, and makes stylesheet loading depend on error-tolerant parsing.

**Deficiency: EJS partials embedded full HTML documents, breaking a single valid document tree.**

## Deficiency

Evidence gathered from source inspection of the original layout pattern:

- **Landing page** (`views/index.ejs`) wrapped the rendered output in one `<html>`, then each included partial (`nav`, `hero`, `feature`, `achievements`, `footer`) started again with `<!DOCTYPE html>` and its own `<head>` / `<body>`.
- **Dashboard** (`views/dashboard/dashboard.ejs`) had a missing `</head>` before `<body>`, while child partials (`navbar-dashboard`, `dashboard-sidebar`, `dashboard-cards`) again declared full documents and even trailing `</html>` in some cases.
- Stylesheets for sections lived inside these nested `<head>` blocks; they happened to load in many browsers when moved into the body, but that is **not** valid placement for `<link rel="stylesheet">` in a conforming document.
- **`hero` partial**: the email `<input>` had a typo (`class="hero-input-email"type="email"` with no space), which is invalid attribute separation and can confuse parsers.

Together this is one deficiency because the root cause is the same incorrect pattern: **treating includes as pages instead of fragments**, which breaks valid markup for the whole app shell.

## How We Identified It (Detection)

Use these in the report as evidence of detection:

1. **Manual inspection**: open `views/index.ejs` and any partial under `views/partials/`; note repeated `<!DOCTYPE html>` after the parent’s `<body>` opens.
2. **HTML validator** (e.g. W3C Nu Html Checker): paste “View Source” from `/` — expect errors such as **“Stray doctype”**, **“Start tag head seen but element head is not allowed here”**, or multiple `html` elements.
3. **Browser DevTools**: Elements panel shows **unexpected nesting** (e.g. `html` inside `body`).
4. Optional: **Lighthouse** → Best Practices or accessibility-related parsing noise (secondary; primary proof is validator + source).

## Research Rationale

The fix follows established web platform rules and inclusive design practice:

- The **HTML Living Standard** requires a single `document` with one `html` element; `head` and `body` are not arbitrary wrappers inside fragments. Partials included into a page should output **only the subtree** they own (e.g. `<header>…</header>`), not a second document.
- **MDN / authoring guides** recommend one `main` landmark per page where appropriate, and valid heading/outline structure; invalid nesting makes landmark and heading trees less predictable for assistive technologies.
- Course-friendly secondary reading: high-quality articles on **EJS layouts vs partials** (include only fragments; put shared `<head>` links in the layout).

Implementation applies this directly: strip document boilerplate from partials, **declare all section CSS once** in the parent template’s `<head>`, fix the dashboard shell (`</head>`), and load `dashboard-navbar.js` once from the dashboard layout.

Suggested references for the report (format in **IEEE style** in your final PDF; verify URLs and bibliographic data yourself):

- WHATWG, *HTML Living Standard*, “Documents and document trees,” WHATWG. (Use the section on the `html` element and document structure.)
- Mozilla Developer Network, “Structuring documents with HTML,” MDN Web Docs.
- Optionally: a peer-reviewed or widely used accessibility engineering source that discusses **robust, parseable markup** (use your module’s approved list: IEEE / arXiv / reputable engineering blogs).

## Work Implemented

|Area|Work completed|Key files|
|---|---|---|
|Landing partials as fragments|Removed nested `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` from `nav`, `hero`, `feature`, `achievements`, `footer`.|`views/partials/*.ejs`|
|Centralised styles|Parent `index.ejs` now links `nav.css`, `hero.css`, `feature.css`, `achievements.css`, `footer.css` once.|`views/index.ejs`|
|Semantic landmark|Wrapped landing middle sections in `<main id="main-content">`.|`views/index.ejs`|
|Dashboard shell|Closed `<head>` properly; moved all dashboard partial CSS and `dashboard-navbar.js` to the dashboard layout.|`views/dashboard/dashboard.ejs`|
|Dashboard partials as fragments|Removed full documents from `navbar-dashboard`, `dashboard-sidebar`, `dashboard-cards`.|`views/partials/dashboard/*.ejs`|
|Valid input markup|Fixed missing space between `class` and `type` on hero email input.|`views/partials/hero.ejs`|

## Verification

**Automated / project tests** (unchanged behaviour; run to ensure no regressions):

```bash
npm test
```

**Manual / report evidence**:

- Open `/` → View Source → confirm **only one** `<!DOCTYPE html>` and **one** `<html>`.
- Run the **Nu Html Checker** on the rendered HTML for `/` and `/dashboard` (when logged in if required) — stray doctype / nested `head` errors should be gone or greatly reduced (remaining issues may come from third-party snippets, if any).
- Optional: Lighthouse accessibility scan before/after (secondary).

## Report Wording

Use this as one deficiency in the report:

**Deficiency: Invalid HTML structure caused by embedding full HTML documents inside EJS partials**

The implementation corrected the template architecture so each page has a **single valid document**: partials output only structural fragments, stylesheets are loaded from the parent layout’s `<head>`, the dashboard layout closes `head` properly, and the hero markup typo was fixed. Cite validator output and a short before/after snippet from `nav.ejs` (or `index.ejs` include tree) as evidence.

## Before vs After (concise snippet for the report)

**Before (pattern in partials — invalid when included):**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="../../static/styles/partials/nav.css" />
  </head>
  <body>
    <header>...</header>
  </body>
</html>
```

**After (partial outputs only its fragment):**

```html
<header>
  <div class="container navbar-container">
    ...
  </div>
</header>
```

(Adjust line numbers and file path in the report to match your PDF — use the committed files in `views/partials/`.)
