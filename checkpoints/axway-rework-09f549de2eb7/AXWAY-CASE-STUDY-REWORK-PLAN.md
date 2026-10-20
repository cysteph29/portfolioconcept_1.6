# Axway case study rework plan

The page explains the diagnosis-flow change once, then shows the interface changes that make that shorter flow possible. Those interface changes are parts of the same solution. Their screen reductions are not added together. The product-overview motion is still a placeholder. Do not build that animation until it is explicitly requested.

This structure supersedes the earlier four-chapter order (Overview, Finding the failed invoice, Understanding the failure, Results), the Diagnosis / Fixing scope block, the repeated workflow strips above interface visuals, and the duplicate old/new comparison that closed the drawer section.

## Gallery pass

- Decorative gallery containers removed. Panels no longer use the summary pattern, borders, or inset padding. Images and videos render directly. Placeholders stay plain rectangles with a neutral fill and their label.
- Gallery-first stays Axway-only for now. Salesforce Trailhead and The Ken use the earlier opening again: title first, then Problem / Solution / Outcome beside the existing project video. Their copy, media, titles, and body sections are unchanged. Finish Axway before applying the gallery to other case studies.
- Axway’s gallery is unchanged: full-width, one large panel and two stacked panels, a single column below 800px, the existing promo, and the more specific placeholder labels. Panels still render media directly, without the summary pattern, borders, or inset padding.
- Other content and typography changes deferred. Axway still uses the article-column title, omits the summary block, and caps prose at 42rem. Other case studies keep their current title treatment, summary blocks, body, section order, contents, and type.

## Direction

Restructure `/work/axway` around an overview, one overall flow change, three interface chapters, and results. Headings should carry the story. Keep this portfolio’s type, color, borders, and navigation.

`/dive/work/axway` uses the same MDX and layout. It is not a separate page.

Protected and unchanged:

- Homepage card title, which is also the visible Axway H1: **Reducing Invoice Resolution Time by 67% for Axway E-Invoicing**
- Frontmatter `title` stays `Axway`, so the document title remains “Axway Case Study”
- Homepage thumbnail, which is still `videonew-axway-promo-web.mp4`
- Other case studies’ titles, summaries, body, contents, and type. Gallery-first remains Axway-only until those studies are updated
- Nav, footer, deployment, and original asset files
- Problem, Solution, and Outcome frontmatter, which other pages can still render. Axway no longer shows that summary block.

## Chapter mapping

1. **Opening gallery**, before the title and outside the reading column. Unchanged.
2. **Title.** The visible H1 stays in the article column, with the hairline divider under it.
3. **Overview** (`#overview`). Label: Overview. Product description, then the product-operation placeholder (an invoice moving from one company through Axway E-Invoicing to another, transforming to meet regulatory requirements). Then the failure heading only: “When an invoice failed during processing, Operations had to find out why before fixing it.” No UI screens, navigation steps, diagnosis diagrams, or Diagnosis / Fixing scope block.
4. **Shortening the diagnosis flow** (`#shortening`). The seven-screen heading, then `case-study-axway-4.webp` as the before journey, with the short research note once under that image. Then the heading “Finding the failed invoice and understanding the error now happen in Documents.” and `use this.png`. The caption under that image stays: Task Overview, Sub-Tasks, and Invoice List remain available, and this diagnosis path no longer passes through them.
5. **Identifying failed invoices** (`#identifying`). Status problem, then Status solution. No workflow strip above either visual.
6. **Understanding the error** (`#understanding`). Separate-screen problem, then the Details drawer solution. No local workflow strip or drawer schematic. The comparison does not repeat here.
7. **Supporting the investigation** (`#investigation`). Search problem and solution, then the filter explanation. The email timestamp / Ctrl+F problem is the animated workaround directly under “Users relied on an email timestamp and Ctrl+F in the task screen.” It is not a navigation strip, and it does not include the Documents search solution. No full-workflow strip. This order is explanatory, not the chronology of the work.
8. **Results** (`#results`). Same divider and label treatment. Heading: “Diagnosis time dropped by 67% in user testing.” Testing rounds, the Operations quote, and manager feedback stay. No flow comparison.

Contents: Overview, Shortening the diagnosis flow, Identifying failed invoices, Understanding the error, Supporting the investigation, Results.

Later chapters use `Section` with `divided`, which adds only the hairline and the space under it. Chapter labels reuse the existing eyebrow style. Narrative headings stay on the existing `h2` style. Problem–solution pairs use a tighter internal gap than the gap between pairs.

## Updated diagram

The HTML Documents workspace was replaced by `public/work/axway/use this.png` (1920×1080). It renders with `CaseFigure` under the approved heading, at its own proportions, with the existing lightbox. The image includes a Before row and an Updated Flow: ServiceNow, Email, and Dashboard still lead in, and the updated path goes to Documents, then Invoice Detail. The previous “Updated design / After entering the customer account” label is not on the page. The caption is unchanged.

## What was used

- `videonew-axway-promo-web.mp4` and its poster, with the existing autoplay, loop, muted, and inline playback. The file was not edited.
- `public/work/axway/case-study-axway-4.webp` (1920×1080) is the original diagnosis journey diagram. It renders with `CaseFigure` under the seven-screen heading, at its own proportions, with the existing lightbox. The image shows the notification that does not name the invoice, then Welcome, Documents, Task Overview, Sub-Tasks, Invoice List, and Invoice Detail. Entry points are ServiceNow, Email, and Dashboard.
- `public/work/axway/use this.png` (1920×1080) replaces the HTML updated-flow diagram. It is the image under “Finding the failed invoice and understanding the error now happen in Documents.”
- `public/work/axway/old-ui-2.png` (1920×1231) is the visual under “The Documents list didn’t show which invoices had failed.” It shows the old flow with Documents highlighted, above the original invoices list. That list has no status column. `old-ui-1.png` is no longer rendered.
- `public/work/axway/old-ui-3.png` (1920×1231) is the visual under “Finding the invoice still left its error details on another screen.” It shows the old flow with Invoice Detail highlighted, above the Task Details window. The sentence “Error information opened on a dedicated Invoice Detail screen.” is no longer on the page.
- `public/work/axway/case-study-axway-7.webp` (1920×1364) is the Documents list with Status and Last Update. It is the Status solution visual. The same still also shows the search field and a Details action, so it is not repeated under Search or the drawer.
- `public/work/axway/case-study-axway-5.webp` is the old diagram of the long path plus a redesign proposal from Documents to a separate Invoice Detail screen. It was used as reference only and is not rendered.
- `public/work/axway/case-study-axway-6.webp` annotates Status and a Details link on one screen. It is not rendered. It does not show the drawer, and the annotation would collapse two chapters into one image.
- `case-study-axway-8.webp` for the percentage and Amardeep Tyagi quote.
- `case-study-axway-9.webp` for the manager quote.

`use this.png` was supplied for the updated flow. The presentation PDF was not cropped, and no video frames were extracted.

## Preserved facts

- Axway is the company. Axway E-Invoicing is the product. The visible title stays “Reducing Invoice Resolution Time by 67% for Axway E-Invoicing.”
- Overview states product operation only. The failure heading is the bridge into the problem. The journey diagram carries the screen sequence. The page does not narrate customer accounts, ServiceNow, login steps, or every screen as a separate chapter.
- Documents previously had no search bar. Operations used the email timestamp with the browser’s Find function on the task screen. The new search is in Documents and supports timestamps and invoice references. This is not timestamp support added to an existing Documents search, and it is not a claim that the whole product lacked search.
- Filters were redesigned so the criteria are visible and easier to combine. They stay inside Supporting the investigation.
- The earlier design opened a dedicated Invoice Detail screen. The later design opens a drawer from the right while the Documents list stays in view. The final design did not reuse an unchanged detail screen. No reasons, alternatives, or testing findings were added for the drawer.
- Results: three Operations members, then seven more. The Operations quote and attribution stay in `case-study-axway-8.webp`. Manager feedback stays in `case-study-axway-9.webp`.

## Placeholders still on the page

- Product detail — invoice status and Details action
- Product detail — search and filters
- Product flow — Company A sends an invoice → Axway E-Invoicing transforms it to meet local regulatory requirements → Company B receives it. Intended motion: the invoice visibly changes as it passes through Axway E-Invoicing. Show normal product operation, with no failures, error states, UI screens, or diagnosis diagrams. Do not build the animation yet.
- After — use the notification timestamp in the new Documents search bar
- Filter comparison — previous query controls versus explicit filter criteria
- After — select Details in an invoice row → right-hand drawer shows error information beside the Documents table. No existing still of the open drawer was used.

## Unresolved facts

- The homepage title says resolution time. The results graphic and this page’s stat say diagnosis time. Both wordings remain. The percentage is a user-testing result about discovery, not production impact or end-to-end repair. No baseline, method, or “all ten participants” claim was added.
- The design is not described as shipped.
- The problem heading states seven screens. The rendered diagram is the journey reference. The presentation’s “8 steps” wording is not added to the page.
- The promo, the annotated portfolio stills, and the legacy screenshots use different interface chrome. They are not presented as an iteration history.
- The Invoice Detail drawer came after the earlier link from Documents to a separate detail screen. Nothing establishes that the drawer was in the testing that produced the 67% diagnosis-time result. The page does not attribute that percentage to the drawer, claim the later iteration was tested, or imply a production rollout. Do not add an editorial warning to the public page.
- The original diagram’s entry points are ServiceNow, Email, and Dashboard, then a blank Welcome screen. `use this.png` shows those entry points in both rows. Its updated row goes to Documents, then Invoice Detail, and does not include Welcome. The page does not add a sentence about whether Welcome was retained.
- Task Overview, Sub-Tasks, and Invoice List were bypassed in this diagnosis path. The caption says they remain available. It does not say they were deleted.

## Workaround animation

The “Before — email timestamp → task screen → browser Find (Ctrl+F)” placeholder is now `AxwayFindWorkaround`, directly under the existing heading and paragraph. It is an HTML illustration, not a video. The shared timestamp is `10:42:18`.

Desktop places the email on the left and a larger task window on the right. Below a 36rem column width they stack. The 10s loop highlights the email timestamp, brings the task window into focus, shows Ctrl+F, opens a Find box in the browser chrome, types the timestamp, highlights that text in an existing row, holds, then fades. Rows stay in place. The Documents search solution is still the separate placeholder below it.

The illustration pauses offscreen and behind a hidden tab. Reduced motion shows the finished frame with no loop: email timestamp, Find box filled with `10:42:18`, and the matching table cell highlighted. Play starts the loop from that preference. Pause/Play is the control beside the caption “Illustration of the existing workaround.”

## Check

Reviewed `http://localhost:3000/work/axway#investigation` on the already running dev server.

- The old placeholder is gone. The explainer sits under the email-timestamp heading. The Documents search and filter placeholders are still below it.
- At a 1483px viewport the email and task window sit side by side, with no page overflow. The timestamp is 18px in the email, the Find box, and the table.
- Scrubbing the loop showed the email highlight, then Ctrl+F in the browser chrome, then `10:42` typing in that Find box, then the held frame: Find box `10:42:18` with `1/1`, and the same timestamp highlighted in the middle row. The other two rows stayed.
- At a 390px viewport the email stacks above the task window. Both panels match the column width. The Find box stays inside the chrome. Document overflow was 0. Timestamp text stayed 18px.
- With reduced motion on, the loop did not run and the button read Play. The static frame showed the Find box and the gold table highlight. Turning motion back on resumed the loop. Pause stopped all 15 animations; Play started them again.

## Next step

Stop for visual review at `http://localhost:3000/work/axway`. Remaining visuals are still the placeholders listed above, including the product-flow motion. Do not build that animation until it is explicitly requested.

## Files changed

- `src/content/case-studies/axway.mdx`
- `src/components/work/axway-find-workaround.tsx` (new)
- `src/components/work/axway-find-workaround.module.css` (new)
- `src/components/work/case-figure.tsx`
- `src/components/work/case-study-opening-gallery.tsx` (new, reusable)
- `src/components/work/case-study-page-layout.tsx`
- `src/config/case-studies.ts`
- `src/app/globals.css`
- `mdx-components.tsx`
- this plan
