# Cyril's Portfolio

This project sets up the architecture and navigation system for a personal product design portfolio using:

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- Motion (Framer Motion)
- MDX case study content

The visuals are intentionally placeholders in this phase.

## Plan (Plain Language)

1. Use real pages for each top section (`/`, `/work`, `/experience`, `/about`, `/contact`) and real case study pages under `/work/[slug]`.
2. Keep routing as the foundation, then add an animation layer on top that creates the shrink -> travel -> expand gesture.
3. Make links still work as normal links without JavaScript, so direct URLs always load the right page even if animation is unavailable.

## Route Structure

- `/` -> Home placeholder section
- `/work` -> Work placeholder section with dummy case study cards
- `/experience` -> Experience placeholder section (intentionally long to prove vertical scroll)
- `/about` -> About placeholder section
- `/contact` -> Contact placeholder section
- `/work/dummy-case-study-1` -> Dummy case study page from MDX
- `/work/axway` -> Axway case study page from MDX

## Where To Edit Section Order

Top-level section order and route mapping live in:

- `src/config/sections.ts`

Why: this keeps navigation order in one place so you can reorder, add, or remove sections without hunting through multiple files.

## How The Transition Works

The animation is controlled by two tuneable constants in:

- `src/config/transitions.ts`

Constants:

- `MINIATURE_SCALE` (currently `0.8`)
- `TRANSITION_DURATION_MS` (currently `650`)

Flow on click:

1. Current page scales down.
2. Current and destination previews travel (horizontal for top-level, vertical for case study entry/exit).
3. Destination scales up to full size.
4. Route commit happens during the animation and then the click lock is released.

Only two animated panels are shown during the transition (current + destination), so this is **not** a strip of all sections sliding side by side.

## Why Routing Still Works Without Animation

All pages are real Next.js routes and all links are real links.

Why this matters: if JavaScript is off (or animation fails), opening any URL directly still returns a complete readable page, including case studies.

## Sticky Navigation

The top nav is rendered separately from the animated content in:

- `src/components/navigation/app-shell.tsx`

Why: the nav stays fixed and full-size at all times and is never affected by scaling or movement animations.

## Click Lock During Transition

Transition state lives in:

- `src/components/navigation/transition-context.tsx`

If a transition is already running, new transition clicks are ignored (not queued, not interrupted).

## MDX Case Study Pipeline

MDX is configured in:

- `next.config.ts`
- `mdx-components.tsx`

Dummy content files:

- `src/content/case-studies/dummy-case-study-1.mdx`
- `src/content/case-studies/axway.mdx`

Case study slug + import mapping:

- `src/config/case-studies.ts`

## Replace A Dummy Top-Level Section Later

1. Update the route page file (example: `src/app/experience/page.tsx`).
2. Keep its route path if you want the same URL.
3. If you rename/reorder sections, update `src/config/sections.ts`.

## Add A New Case Study Later

1. Add a new MDX file in `src/content/case-studies/`.
2. Add a new item to `CASE_STUDIES` in `src/config/case-studies.ts`.
3. Add a matching MDX content entry in `src/components/folds/route-folds.tsx`.
4. The Work page cards and static route generation will pick it up automatically.

## Run Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
