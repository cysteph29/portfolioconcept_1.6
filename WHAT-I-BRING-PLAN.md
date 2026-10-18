# What I Bring — Plan

Status: Phase 0 approved with revisions (below). Phase 1 implemented, then corrected (revision 2: section moved into the right-hand content column). Phase 2 implemented (active-position emphasis; awaiting review). Phases 3–4 not started.

Branch: `experiment/editorial-homepage`. Nothing committed, pushed, merged, or deployed.

## Corrected architecture (revision 2)

This overrides every earlier placement and layout description in this document, including revision 1 item 3 and the “Where it sits” and “Recommended layout” sections below, which are kept only as history.

```text
.home-page
├── .editorial-stage                 ← 32/68 grid from 1100px
│   ├── EditorialIntro               ← left, sticky (unchanged)
│   └── .editorial-content           ← right content column (new wrapper)
│       ├── WorkSection (#work)      ← 3 featured + 6 AI & Play (unchanged)
│       └── WhatIBring (#what-i-bring)
│           ├── h2 “What I Bring”    ← left edge of the right column
│           └── ol: five rows        ← nested 32/68 inside the right column
│               ├── figure (32%)
│               └── h3 + p (68%)
└── TextReveal05Initializer
ContactFooter                        ← full width, outside main (unchanged)
```

- **Sticky intro stays through the whole section.** Because What I Bring is inside `.editorial-stage`, the intro (`position: sticky`) stays on screen through Work and all five capabilities, and releases only when the stage ends after the fifth row. No scroll listener or positioning hack; it is the grid’s existing containing-block behavior.
- **Wrapper.** `.editorial-content` is a plain `div` (`min-width: 0`) holding `WorkSection` and `WhatIBring` as the stage’s second grid item. `WorkSection` and the card components are unchanged.
- **Heading.** Visible `h2`, Neue Bit `text-heading-2`, at the left edge of the right column, the same edge as the project thumbnails above it.
- **Nested grid.** From 768px, each row is `grid-template-columns: var(--editorial-grid-columns)` — the same 32/68 variable as the stage, but now applied to the right column’s width, not the viewport. Internal gutter `clamp(1.25rem, 2vw, 1.75rem)`, smaller than the stage’s 2rem because the row is narrower.
- **Square figures.** 1 / 1, left-aligned in the 32% sub-column, capped at 250px (`15.625rem`) and shrinking with the column below that. Copy is vertically centered against its square (`align-items: center`). Borders stay until the artwork replaces the placeholders.
- **Type scaled to the column.** Capability headlines `clamp(1.5rem, 1.15rem + 0.75vw, 2rem)`; Fraktion `text-body-2` copy.
- **Content-driven rows.** `padding-block: clamp(1.25rem, 2.25vw, 2rem)`; the last row has no bottom padding, so the stage (and the sticky intro) end close after the fifth capability. Section top padding `clamp(3.5rem, 6vw, 5.5rem)` separates it from the AI & Play grid; bottom padding `clamp(2.5rem, 5vw, 4rem)` before the footer.
- **Breakpoints.**
  - 1100px+: stage is 32/68, intro sticky; rows nested 32/68 inside the right column.
  - 768–1099px: stage already stacks (intro on top, not sticky); rows keep their nested 32/68 because the column is still wide enough.
  - Below 768px: rows stack, figure above text, figure 16 / 10 capped at 10rem tall.
- **Phase 2 implication.** The sticky intro is visible beside the rows while emphasis runs. The emphasis must stay inside the right column and must not animate or dim the intro or the bridge.

## Approved decisions (revision 1)

These override anything later in this document that conflicts with them, except where revision 2 above supersedes them.

1. **Visible heading.** “What I Bring” is a visible `h2` above the five rows, aligned to the homepage grid. Established type, not a hero-sized display.
2. **Content-driven row heights.** No viewport-height sizing on rows (`svh`, `vh`, or similar). Row height comes from the illustration, the headline and copy, and fixed vertical padding. Natural document scroll. The scroll emphasis adapts to whatever height the rows end up with.
3. **32/68 grid is fixed.** The outer stage stays `minmax(0, 0.32fr) minmax(0, 0.68fr)` with a `2rem` gap, exposed as `--editorial-grid-columns` / `--editorial-grid-gap`. *(Superseded in revision 2: the section sits in the right column and the rows reuse the same 32/68 variable nested inside it.)*
4. **Interaction.** The in-flow focal-band emphasis (approach A) is approved for Phase 2.
5. **Type.** Mondwest for capability headlines, Fraktion for supporting copy.
6. **Content.** All five headlines unchanged. The five illustration concepts stay exploratory.
7. **Untouched.** Malayalam Bridge, hero/intro, navigation, Work section, and Footer.

## Design objective

Add one homepage section, below Work and above the global Contact Footer, that states five strengths as a continuous editorial sequence.

The section should feel like the next part of the current homepage: dark green canvas (`#071803`), cream type (`#f4e7dd`), Mondwest / Neue Bit / Fraktion, and Malayalam glyphs used as drawing material. It should not look like a feature-card grid, a second site, or a pinned scrollytelling chapter.

The five headlines stay as written:

1. I Like the Hard Problems
2. AI-First by Default
3. I Design and Code
4. Customer-Driven Decisions
5. End-to-End Ownership

Someone who never watches the motion should still be able to read all five.

## Where it sits

Current homepage structure:

```text
AppShell
  TopNav
  main
    .home-page
      .editorial-stage          ← two columns from 1100px
        EditorialIntro          ← sticky on the left, bridge at the bottom
        WorkSection (#work)     ← featured studies + play grid
      TextReveal05Initializer
  ContactFooter (#contact)      ← sibling after main, not inside .home-page
```

The sticky intro is `position: sticky` only while `.editorial-stage` is the containing block (`globals.css`, min-width 1100px). It releases when that grid ends.

**Placement:** a new `<section id="what-i-bring">` as the next sibling after `.editorial-stage`, still inside `.home-page`. The footer already follows `main`, so the section lands between Work and the contact marquee without editing the footer, nav, intro, or work section.

Putting the section inside `.editorial-stage` would keep the intro and bridge stuck on screen through all five rows. That is the main placement constraint.

The section inherits `.home-page` horizontal padding (`--editorial-gutter`: 1rem, 1.25rem from 768px). It uses the same column split as the stage so the artwork lines up with the intro column and the text lines up with the work column.

No nav link in this experiment. `#what-i-bring` can exist without being added to `TopNav`.

## Recommended layout

Desktop, from 1100px (the same breakpoint as `.editorial-stage`):

```text
[ empty 0.32fr ]  2rem  [ WHAT I BRING  — h2, Neue Bit text-heading-2 ]

[ artwork 0.32fr ]  2rem  [ headline + supporting copy ]
[ artwork          ]        [ headline + supporting copy ]
...five rows, content height, no cards, no rules
```

- Grid: shared variables `--editorial-grid-columns: minmax(0, 0.32fr) minmax(0, 0.68fr)` and `--editorial-grid-gap: 2rem`, defined once on `.home-page`. `.editorial-stage` and the new section both read them, with identical computed values to today. Both live inside `.home-page`, so they have the same content width and the same gutters; the column edges line up to the pixel.
- Section heading: visible `h2` “What I Bring”, Neue Bit `text-heading-2` (the same token the About page uses for its section titles, max 2.5rem), full cream. It sits in the right column, on the same left edge as the capability headlines and the work cards above. Neue Bit marks it as a section label; Mondwest stays for the capability statements. It reads as a section opener, not a second hero.
- Each capability is an `h3`. Mondwest, `clamp(1.5rem, 1.2rem + 1.1vw, 2.375rem)` (24px at 390, about 35px at 1440, capped at 38px; stays below the 28px section heading on mobile), weight 400, no uppercase, `text-wrap: balance`. Smaller than the desktop hero (40px Mondwest).
- Supporting copy: Fraktion `text-body-2`, `--color-text-muted`, `max-width: 38rem` (same cap as `.editorial-intro__copy`), `text-wrap: pretty`.
- Space inside a row (headline to body): `0.75rem`.
- Row height: content only. `padding-block: clamp(1.75rem, 3vw, 3rem)`. No `min-height`.
- Artwork frame: fills the left column, aspect ratio 4 / 3, top-aligned with the headline. Measured in Phase 1: 438 × 328px figures and 415px rows at 1440 (section ≈ 2,300px, about 2.6 screens at 900px tall); 591 × 444px figures and 540px rows at 1920. A taller ratio (4 / 5) would add roughly a screen.
- No borders, background chips, icons, or shadow. Grouping comes from padding and the type stack.
- Exit: section bottom padding `clamp(3rem, 6vw, 5rem)`, then the existing 6px `.home-page` padding, then the footer marquee.

Vertical rhythm matches the homepage’s habit of separating groups with space. The work column already does this between featured studies.

## Alternative approaches considered

### A. In-flow rows with a focal band — recommended

Five rows in normal document flow. As a row’s center passes a line about 42% down the viewport, it becomes the active row and its neighbors ease back. Scroll position maps directly to emphasis. Nothing is pinned. Nothing snaps.

Why this fits:

- Inactive headlines stay on the page and stay readable.
- The visitor can scroll at their own speed. There is no empty scrub distance and no trap.
- Revision 2 keeps the sticky intro beside these rows. Emphasis is applied only to the capability rows, so the intro and bridge are not dimmed or animated, and there is still no second pin.
- Total length is the content itself (about five viewport-heights on desktop), which is long but legible. Every pixel is a real row, not a hold.

Tradeoff: with content-height rows, two or three rows are often on screen together. The handoff follows the measured distance between row centers. It is not tuned by stretching rows. Phase 1’s measured row height (about 390px at 1440, before the nested 250px cap) is historical; the shipped rows are shorter.

### B. CSS scroll-driven animations only (`animation-timeline: view()`)

Same layout as A. Opacity and color would be driven by each row’s view timeline, with no scroll listener.

Why it was not chosen as the primary path:

- Phase 3 needs a numeric emphasis value inside the canvas so ink can shift from quiet cream to the bridge’s lime. A CSS timeline does not hand that number to canvas without also reading scroll in JavaScript.
- A custom property set from one scroll reader serves Phase 2 (CSS) and Phase 3 (canvas) without changing the interaction later.

This stays a useful fallback if Phase 2 proves that opacity on a wrapper is enough and the canvas never needs the number. It can replace the scroll reader without changing the layout.

### C. Pinned crossfade — not recommended

A sticky viewport of roughly one screen, with the five rows stacked in the same box and scroll progress crossfading between them. Often implemented with GSAP ScrollTrigger `pin`.

Why it loses:

- A readable stack of all five headlines and a single pinned stage are in conflict. Pinning usually hides the inactive rows, which this brief does not allow.
- Five full screens of pin, or even a shorter ~180vh crossfade, is the “long pinned sequence” to avoid. The page already has one sticky region (the intro). A second hold immediately after Work will feel like the page has stopped.
- GSAP ScrollTrigger is already on the page for the character-shuffle text reveal. A pinned timeline beside that, and beside the footer’s `motion` scroll marquee, adds a third scroll choreography for little gain.

GSAP remains available if a later phase needs a scrubbed property. It should not pin this section.

## Scroll interaction specification

### Model

One client child reads scroll. It does not use snap, pin, or a carousel.

On each frame while the section intersects the viewport:

1. Focal line `focalY = scrollY + viewportHeight * 0.42` (below the 3.75rem nav, in the upper-middle of the remaining page).
2. Measure each row’s center in document coordinates. Those centers are cached and refreshed on resize, font load, and when `.home-page` changes size. A scroll frame does not read layout.
3. `activeIndex` is where `focalY` sits among those centers: `0` at the first center, `4` at the last, and `1.5` halfway between rows 2 and 3. Piecewise linear between neighbors.
4. Clamp the ends. Before the focal line reaches the first center, `activeIndex` stays `0` (the first capability is already emphasized as the section enters). After it passes the last center, `activeIndex` stays `4`.
5. If the document ends before the last center can meet the 42% line, do not add padding. Compress only the indexes still below that line into the scroll that remains, so the last capability is fully emphasized at the bottom of the page. Earlier rows keep the 42% line.
6. For each row `i`, `t = clamp(1 - abs(i - activeIndex), 0, 1)`, then `emphasis = t * t * (3 - 2 * t)` — the same smoothstep the bridge uses for highlight falloff.
7. Write `--emphasis` on the row, from 0 to 1. The default in CSS is `1`, so the rows are fully emphasized before JavaScript runs and when it never runs.

Neighbors overlap on purpose. While the active index moves from 1 to 2, those two rows crossfade and the others sit at 0. There is no hard switch.

The scroll listener is attached only while the section intersects the viewport. Reduced motion never subscribes: every row keeps `--emphasis: 1`. `ScrollTrigger.refresh()` is not involved. This section does not create ScrollTriggers and does not use GSAP.

### What moves

| Property | Inactive (`--emphasis: 0`) | Active (`--emphasis: 1`) |
| --- | --- | --- |
| Illustration opacity | 0.4 | 1 |
| Illustration ink | cream only | cream, with lime on the “resolved” part of the drawing (Phase 3) |
| Headline opacity | 0.8, color stays `--color-text-primary` | 1 |
| Supporting copy | `--color-text-muted`, opacity 1 | `--color-text-muted`, opacity 1 |
| Scale / translate | none | none in the first pass |

Copy stays at muted-or-stronger. The illustration carries the emphasis. A scale or vertical drift can be tried in Phase 4 only if the opacity shift feels flat. Starting values if that happens: figure scale `0.985 → 1`. No zoom past that.

Headlines do not use `data-reveal-05`. The page initializer would hide them and run the character shuffle, which would fight this emphasis. This section does not opt into that animation.

### Reduced motion

`prefers-reduced-motion: reduce`: every row gets `--emphasis: 1`, the scroll reader does not subscribe, illustrations paint once at full strength. `scroll-behavior: smooth` on `html` is left alone (it is site-wide). This section adds no smooth-scroll dependency.

### Active / inactive, in words

**Active.** The figure is at full strength. In Phase 3 the resolved part of the drawing picks up `#7cff6b`, the same lime the bridge uses for its pointer highlight. The headline is full cream. The body stays quiet.

**Inactive.** The figure drops to 40% opacity and loses the lime. The headline steps down to the existing muted cream, which is still the color used for body copy across the site. The body does not get any dimmer than that. Nothing fades out completely. Nothing is `visibility: hidden` or `aria-hidden` on the text.

Inactive headlines stay `--color-text-primary` at 80% opacity, which paints the same cream-on-`#071803` pair the site already uses for body copy. Supporting copy is never dimmed. Opacity is used instead of `color-mix()` so a custom property does not have to supply a percentage. The rules are wrapped in `prefers-reduced-motion: no-preference`; reduced motion leaves both at full strength. There is no CSS transition, so emphasis tracks the scroll position directly.

## Illustration concepts

These are directions for review. No artwork gets built in Phase 1 or 2.

### Shared visual system

The bridge is not a picture with letters sprinkled on it. It samples Manjari glyphs (`അ ആ ഇ ഉ ക ഗ മ യ ര ല വ സ`) into tiny dot bitmaps, then stamps one glyph into each cell of a line drawing (towers, cables, deck, suspenders). Idle ink is faint cream. Pointer proximity paints `#7cff6b`.

The five figures stay in that language:

- Line structures on a cell grid, predominantly 2D, no fill scenes, no 3D, no icons.
- Same glyph pool, same Manjari sampling, same cell size family (around 8–11px), device pixel ratio capped at 2.
- Cream ink. Lime is reserved for the active state’s resolved stroke, so the set stays in the site palette.
- No pointer highlight. The bridge already owns pointer-follow. Here, scroll emphasis replaces it.
- Each canvas paints once per size change, then only recolors when `--emphasis` changes. Five always-on animation loops would compete with the live bridge canvas above.
- Figures are `aria-hidden`. The headlines carry the meaning. The drawings are complementary, not a text alternative.

The drawings should be recognizable as structures at thumbnail size: a knot, a branch, a grid, a convergence, a finished span. They should not illustrate the headline literally (no brains, robots, speech bubbles, code brackets, or checkmarks).

### 1. I Like the Hard Problems — a knot that becomes a line

Several overlapping curves, using the bridge’s parabolic cable math, piled on the left. They cross, leave a few short segments that connect to nothing, and are packed more densely than the bridge deck. Toward the right they give way to one continuous horizontal line, the same stroke as the bridge deck.

Reads as a mess that resolves into a single span. It quotes the bridge’s cable and deck without drawing the bridge.

### 2. AI-First by Default — a repeated branch

One vertical stem. It splits, and each split splits again, three levels, by the same rule, growing up and to the right. Tips end in small clusters of cells, not dots-as-eyes and not a head. Asymmetric, so it does not look like a logo.

Reads as a generative system: one rule, many outcomes. The suspenders on the bridge are repeated verticals; this is the organic cousin of that repetition. No chip, no brain, no sparkle.

### 3. I Design and Code — a sketch that snaps to a grid

Left half: short strokes at uneven angles, a loose cluster, the drawing equivalent of a sketch. Right half: the same overall mass organized into an orthogonal frame — one top bar and three even rows, like a wireframe reduced to lines. One parabolic cable crosses the gap between them.

Reads as design thinking becoming an interface. The cable is the family resemblance to the bridge. The two halves should share a baseline so they feel like one figure, not two icons.

### 4. Customer-Driven Decisions — signals meeting a line

Five short curves enter from the left and from below, different lengths and angles. They meet just left of center and stop, leaving a gap of a cell or two (a listening point, not a blob). From that gap a single straight horizontal line continues to the right edge.

Reads as many inputs becoming one direction. No ears, mouths, speech bubbles, or people.

### 5. End-to-End Ownership — one path with a finished end

A single unbroken path from left to right, in four beats: a small seed cluster, a rising curve, one tower fragment (two verticals and a crossbeam — a piece of the bridge tower, not the whole Golden Gate), then a long deck that closes into a rectangle at the right.

Reads as continuity from a start to a finished form. This is the figure that most directly cites the bridge, so the set feels related. The other four should not also draw towers, or the section becomes five bridges.

### Active-state lime, per figure

When emphasis is high, lime traces only the resolved portion:

| Figure | Lime stroke |
| --- | --- |
| Hard problems | the straightened horizontal line |
| AI-first | the outermost branch tips |
| Design and code | the orthogonal frame on the right |
| Customer-driven | the line after the gap |
| End to end | the closing rectangle |

The tangled, sketchy, or incoming parts stay cream. That keeps lime meaningful: it marks the part of the idea that has landed.

## Responsive behavior

The stage uses the homepage’s 1100px breakpoint. Rows use 768px, matching revision 2. Emphasis math is measured from the rows, so it is the same at every width.

**1100px and up.** Outer stage is 32/68 with the intro sticky. Rows are a nested 32/68 inside the right column. Content-height rows. Focal-line emphasis as specified. The intro stays visible and is not part of the emphasis.

**768px–1099px.** The stage stacks (intro on top, not sticky). Rows keep the nested 32/68. The same measured-center math applies. Copy `max-width` stays 38rem.

**Below 768px.** Rows stack: square figure above the text, figure still 1 / 1 and capped at 250px (revision 2; the earlier 16 / 10 artwork ratio was not shipped). Section label remains. Horizontal padding stays on the gutter already set by `.home-page`. No pin, no snap, no horizontal scroll. Confirm no canvas overflows the column (`min-width: 0`, width 100%).

**Reduced motion, all sizes.** Full emphasis, static figures.

**Zoom and wrapping.** Headlines and body use `max-width` and normal wrapping, not fixed heights. A longer approved line must be allowed to wrap to three lines without overlapping the figure. On the stacked layouts the figure is in a separate row, so wrapping cannot collide with it.

## Proposed supporting copy

Voice matches the homepage subhead: first person, specific, short. No new metrics. Numbers already published in the case studies (67% invoice time, 6 of 8, 5.6% conversion, 650+ professionals) stay in those case studies. This section does not repeat them.

Sources are listed so the claims can be checked. Wording is a proposal.

### I Like the Hard Problems

> Axway’s invoicing tool had never had a designer. Trailhead’s power users had already left for ChatGPT. I start where the problem is still tangled.

Sources: Axway experience entry and case study (first designer, engineering-led, users had not been part of development); Trailhead case study (certified power users taking questions to ChatGPT and Slack); homepage subhead (“figuring out what matters”).

### AI-First by Default

> On Trailhead, AI was both the product and the way we built it. We prototyped with it, pressure-tested flows before real users arrived, and dropped the idea that would have spoken as a person.

Sources: Trailhead role line (“ResearchOps, Strategy, AI Prototyping”); the Solve prototype built with OpenAI; research turned into agents that ran the flows first; the killed concept of an AI version of a power user speaking for them. “We” is accurate there — the case study describes a team of five. The other blurbs stay “I” where the work was his alone.

### I Design and Code

> I design in Figma and ship the prototype in code. For Trailhead’s Solve, the components went straight into a working React app.

Sources: Trailhead case study (Figma components into Cursor and Claude Code, React front end, no handoff). This does not claim a long engineering career. The same case study says code was new for him. The line states what he does now, which is the headline’s claim.

### Customer-Driven Decisions

> At Axway I pushed for research before the redesign, then followed what the operations team actually did. At Trailhead, the research decided which ideas were worth building.

Sources: Axway case study (advocated for research, studied the operations team, chose the diagnosis problem from what research surfaced); Trailhead case study (research operations, two rounds of interviews, ideas cut from what users needed).

### End-to-End Ownership

> I am often the only designer, from discovery through handoff. At Axway that was one regulated product. At Intentionally Designed Solutions it was three products from zero.

Sources: homepage subhead (“often as the only designer”); Axway experience entry (sole designer, end-to-end from discovery through handoff, regulated e-invoicing); IDS experience entry (0-to-1 design for a catalog, mobile app, and CMS).

## Technical architecture

### Phase 1 — structure, server-rendered

`WhatIBring` can be a server component. Data lives in a small config module so copy changes do not require editing markup.

Each row:

```text
article
  figure          placeholder block, aria-hidden
  div
    h3
    p
```

Placeholder: a `div` with the final aspect ratio, a faint 1px outline, and the working name of the illustration concept (for example “Knot → line”) in small Neue Bit, muted. It is `aria-hidden`. No stock image, no temporary icon set. The whole placeholder is replaced when the canvas arrives.

### Phase 2 — emphasis

`WhatIBringEmphasis` is a client child mounted inside the section. It renders nothing. The section markup stays a server component. The reader does not use GSAP or `motion/react`.

Row centers are measured when layout changes. While the section intersects the viewport, a passive scroll listener schedules one `requestAnimationFrame` callback. That callback reads `scrollY` and `innerHeight` only, then writes `--emphasis` on each row when the rounded value changes.

CSS consumes the variable. `--emphasis` defaults to 1. The opacity rules apply only when the user has not requested reduced motion:

```css
.what-i-bring__row {
  --emphasis: 1;
}
@media (prefers-reduced-motion: no-preference) {
  .what-i-bring__figure {
    opacity: calc(0.4 + 0.6 * var(--emphasis));
  }
  .what-i-bring__headline {
    opacity: calc(0.8 + 0.2 * var(--emphasis));
  }
}
```

### Phase 3 — figures

New canvas component, modeled on `MalayalamBridgeCanvas` but smaller:

- Import `src/app/trial/trial.module.css` so the existing Manjari `@font-face` (`src/app/fonts/Manjari-Regular.woff2`) is registered. The editorial intro already does this indirectly by rendering the bridge.
- Build cells with the same `addLine` / `addSquare` idea, one function per figure.
- Sample glyphs once, share the bitmap cache across the five canvases.
- Static canvas only. Repaint color from `--emphasis`. Do not run the bridge’s pointer loop.
- Pause geometry work when the row is off-screen. Cap DPR at 2, matching the bridge.
- Debounce resize (~120ms, same as the bridge).

**Bridge file.** The bridge is not modified. Glyph sampling helpers in `malayalam-bridge-canvas.tsx` are private, so Phase 3 keeps its own copy of the sampling logic (same glyph pool, same Manjari sampling parameters) inside the new figure renderer. Phase 3 does not touch `malayalam-bridge-canvas.tsx`, `editorial-intro.tsx`, or the bridge’s geometry.

### Styles

New rules live in `src/app/globals.css` next to the editorial block, under classes prefixed `what-i-bring`. No new Tailwind theme. No CSS module unless a canvas-only file needs the font import, which already exists.

### What this section must not do

- No `data-reveal-05`.
- No change to `ContactFooter`, `WorkSection`, `EditorialIntro`, `HeroSection`, `TopNav`, the about page, or case studies.
- No new dependencies.
- No scroll snap on `html` or `body`.
- No edit to the production branch. No commit, push, or deploy unless you ask.

## Expected files to modify

| Phase | File | Change |
| --- | --- | --- |
| 1 | `src/app/page.tsx` | Wrap `WorkSection` + `WhatIBring` in `.editorial-content` inside `.editorial-stage` (revision 2) |
| 1 | `src/config/what-i-bring.ts` | Headlines and approved copy |
| 1 | `src/components/home/what-i-bring.tsx` | Section markup |
| 1 | `src/app/globals.css` | Layout, type, placeholders, responsive rules |
| 2 | `src/components/home/what-i-bring-emphasis.tsx` | Scroll reader, or the same component if it becomes a client component |
| 2 | `src/app/globals.css` | `--emphasis` styles, reduced motion |
| 3 | `src/components/home/capability-canvas.tsx` | Shared renderer |
| 3 | `src/components/home/capability-figures.ts` | Five cell-path builders |
| 4 | `src/app/globals.css` and the figure builders | Spacing, type, proportions, emphasis tuning |

The only edit to an existing homepage rule is in `globals.css`: `.editorial-stage` reads `--editorial-grid-columns` and `--editorial-grid-gap` instead of literal values. Computed layout is identical; it exists so the new section cannot drift from the stage grid.

Files that stay untouched: `editorial-intro.tsx`, `malayalam-bridge-canvas.tsx`, `work-section.tsx`, `case-study-cards.tsx`, `contact-footer.tsx`, `hero-section.tsx`, `top-nav.tsx`, `app-shell.tsx`, about page, case-study MDX.

## Performance and accessibility

**Performance**

- Phase 1 is static HTML and CSS.
- Phase 2 measures row centers when layout changes. While the section is on screen, each scroll frame reads scroll position and viewport height and writes at most five custom properties. No pin.
- Phase 3: five static canvases, geometry cached per size, one shared glyph cache, DPR cap 2, off-screen canvases do not repaint. The bridge canvas stays the only pointer-driven loop. Revision 2 keeps that intro on screen beside this section, so the figures must not run their own animation loop. Phase 2 only changes opacity on the rows and does not animate the intro.
- Avoid `will-change` on the rows. Opacity on the figure is cheap enough.
- Watch the footer marquee, which starts moving as soon as the footer enters the viewport. The section’s bottom padding exists so the last figure is not mid-handoff underneath that marquee. Verify this at 1440 and 390.

**Accessibility**

- `section` with `aria-labelledby` pointing at the `h2`.
- Heading order: page `h1` (intro) → `h2` Work (screen-reader only) → `h3` case-study titles → `h2` What I Bring → `h3` capabilities. That order is valid.
- Figures `aria-hidden="true"`. No essential information lives only in the drawing.
- Inactive headlines remain text, at muted cream or stronger. They are not removed, clipped, or reduced below body contrast.
- Reduced motion shows every row fully emphasized.
- No keyboard trap, no scroll hijack, no focusable placeholder.
- Touch: nothing in the section requires a hover or a drag.
- If the canvas fails to draw (Manjari unavailable), the row still shows the headline and body. The bridge already logs this failure; the new canvas should fail the same way, quietly, and leave the type intact.

## Implementation phases

Each phase stops for approval. Validation viewports when a phase changes the UI: 1440, 1920, 768, 390. After Phase 1 and after any later phase that changes TypeScript, run the type check and a production build.

### Phase 1 — Structural prototype

Mount the section. Five rows, approved headlines and copy, two-column layout from 1100px, stacked below that, placeholder frames in the figure slot. No scroll emphasis, no Malayalam figures. Goal: judge hierarchy, measure, and how the section meets Work above and the footer below.

### Phase 2 — Scroll interaction

Implemented, awaiting review. Focal line at 42% of the viewport, one active index across the five row centers, smoothstep between neighbors. First row emphasized on entry, last row emphasized at the bottom of the page even if its center never reaches 42% (the index calculation absorbs the shortfall; row height and padding are unchanged). Inactive figure opacity 0.4, inactive headline opacity 0.8, supporting copy untouched. Reduced motion and no-JavaScript leave every row fully emphasized. The sticky intro remains in place through the section and is not dimmed. No `min-height`, pin, or snap.

### Phase 3 — Malayalam figures

Build the five approved drawings with the shared cell-and-glyph technique. Wire lime to `--emphasis`. Do not change the interaction model. Do not edit the bridge file.

### Phase 4 — Visual refinement

Adjust type size, row height, figure proportions, and the emphasis range. Check alignment with the editorial grid at 1440 and 1920. Check the stack at 768 and 390. Fix contrast, overflow, and anything that collides with the footer. No new concept work in this phase.

## Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Emphasis bleeding onto the sticky intro | Revision 2 keeps the intro and bridge on screen beside the rows, on purpose | Phase 2 writes `--emphasis` only on the capability rows. Intro, bridge, work, and footer are not styled by it. |
| Rows too tall on desktop | A long section can feel like a trap even without a pin | Rows are content height. If it still drags, reduce artwork ratio or padding, never add a pin. |
| Rows close together | Two headlines share the focal band and the handoff looks accidental | One active index, smoothstep toward the neighboring row only. Do not add `min-height`. |
| Inactive type fails contrast | Emphasis that dims text fights the “always readable” rule | Dim the figure first. Keep body at `--color-text-muted`. Verify with computed colors in Phase 2. |
| Five live canvases | Jank next to the bridge and the footer marquee | Static paint, shared glyph cache, pause off-screen, no pointer loops. |
| Text-reveal shuffle on these headlines | Headlines start hidden and animate on their own | Do not use `data-reveal-05`. |
| Duplicated glyph sampling drifts from the bridge | Figures could stop looking related | Copy the same glyph pool and sampling parameters; compare side by side in Phase 3. |
| Copy overclaims the coding work | The Trailhead case study is honest that shipping code was new | The proposed line limits the claim to designing and shipping the prototype. |
| Footer marquee arrives early | Huge type can crash into the last row | Bottom padding on the section; check at 1440 and 390 in Phase 1. |
| `color-mix()` percentage from a custom property | The inactive/active headline blend may need a different formulation in this Tailwind v4 setup | Resolved in Phase 2: headline emphasis is opacity on `--color-text-primary`, not `color-mix()`. |

## Unresolved questions

Resolved in revision 1: interaction (approach A), visible heading, Mondwest/Fraktion, content-height rows, fixed 32/68 grid, bridge stays untouched (Phase 3 keeps its own glyph-sampling copy; no extraction from `malayalam-bridge-canvas.tsx`).

Still open:

1. **Supporting copy.** The Phase 1 build uses the proposed blurbs as-is. Mark any lines to rewrite, especially the Trailhead “we” in the AI blurb and how strongly “I Design and Code” should sound.
2. **Illustration directions.** Exploratory. Confirm or redirect each before Phase 3.
3. **Artwork ratio.** Phase 1 placeholders are 1 / 1, capped at 250px and left-aligned in the artwork column. Judge that size in the preview.
