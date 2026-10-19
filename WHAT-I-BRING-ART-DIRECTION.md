# What I Bring — Illustration Art Direction

Status: **Interference and Specimen kept. Rule 110, Chorus, and Hilbert replaced. Awaiting review of the new three.** Uncommitted.

## Step B — as built

- **Approved inputs:** Interference (slot 1) and Specimen (slot 3), with `ഴ` as the Specimen letter, full cream capped at 70%, and the 8px grid. Slots 2, 4, and 5 stay as placeholders.
- **Interference changed from the proposal.** Straight gratings at an angle broke into checkerboard noise on a 31-cell grid. It now uses two concentric ring targets of unequal size (radius 44% and 34%, period 4 cells). Rings are faint outside the overlap and mid inside it. Cells where both rings are on are full tone, and one 2×2 lime glyph sits at the node nearest the midpoint between the two centres.
- **Specimen:** `ഴ` is sampled as a mask about 74% of the grid tall, cropped 10% off the left edge, full tone, with no stroke thickening. Guides sit at the x-height, the baseline, and the descender, plus dotted verticals every 4 columns. All guides are knocked out one cell around the letter. The baseline is set at the first row below the bowl where only the stem remains, and lime marks those stem cells.
- **Tones:** faint 20%, mid 42%, full 70%, lime 85%.
- **Micro-dots:** 1px at DPR 1, 0.5px at DPR 2 (12×12 glyph bitmaps instead of 6×6). At 2× the texture glyphs read as Malayalam letters; at 1× they read as stipple, like the bridge.
- **The knot** is removed from the working tree and recoverable from commit `1cd0f01` (`capability-figures.ts`).

### Pressure — as built (AI-First by Default)

Replaces Rule 110. One sideways mass: a flat bright edge on the left, dissolving to the right through ordered dither. The right boundary is a flattened sine, so the silhouette stays rounded instead of coming to a point. Glyph weight lightens with the dissolve. A 2×2 lime glyph sits in the bright edge.

### Opening — as built (Customer-Driven Decisions)

Replaces Chorus. One thick circular stroke, open on the lower right, with an empty center. The stroke is brightest opposite the gap and fades toward the two tips. A 2×2 lime glyph sits in the opening.

### Joint — as built (End-to-End Ownership)

Replaces Hilbert. A thick corner bleeding off the bottom and right edges. Each arm starts faint at its free end and becomes full at the corner. The upper left stays empty. A 2×2 lime glyph sits on the inner corner.

Branch: `experiment/editorial-homepage`. Baseline is the Revision 3 Stripe-inspired showcase in `WHAT-I-BRING-PLAN.md` (one bordered 300px frame, five stacked layers, crossfade, auto-cycle). Layout, interaction, copy, and typography are out of scope.

## 1. What exists today

### The bridge (the reference)

`src/components/trial/malayalam-bridge-canvas.tsx`, `profile="editorial"` in the sticky intro.

- Manjari glyphs from a 12-letter pool (`അ ആ ഇ ഉ ക ഗ മ യ ര ല വ സ`) are rendered offscreen, then down-sampled into tiny bitmaps of 1px "micro-dots". At `cellSize: 10` and `glyphScale: 0.75` each glyph becomes roughly a 7×7 dot stamp.
- A drawing is a set of grid cells. Each cell gets one glyph, picked by a deterministic hash of its position.
- Cells come from line primitives only: `addLine`, `addSquare`, parabolic cables, suspenders.
- After drawing, a thinning pass drops edge cells (12%) and randomly drops interior cells (fill 0.75). That's what gives the bridge its broken, printed texture.
- Ink is cream at 15% opacity when idle, and the pointer paints lime `#7cff6b` with a smoothstep falloff.

### The capability canvas

`capability-canvas.tsx` and `capability-figures.ts` are a private copy of the same pipeline: same glyph pool, same sampling, `cellSize: 8`, cream at 62%, lime at 82%, one paint per resize, no animation loop. The only figure is the "Hard Problems" knot-to-line.

At the real size, the canvas sits inside the 8% inset of the 300px frame, so it's **252 × 252 CSS px**. At 8px cells that's a **31.5 × 31.5 grid**: about 1,000 cells in total, each glyph a 6×6 dot stamp.

### What the renderer can and can't do

| Can do | Can't do yet |
| --- | --- |
| Draw 1-cell lines and squares on a grid | Fill areas or show tonal value (every cell is either on or off) |
| Assign glyphs randomly by position | Choose a glyph for a reason (by tone, rule, or neighbourhood) |
| Mark cells cream or lime | Use more than one cream strength |
| Paint once, cheaply (a few thousand `fillRect`s) | Show a glyph large enough to read as a letter |
| | Centre the grid: it uses `ceil`, so the last row and column are cropped at the right and bottom |

Why the knot struggles: it's a thin line drawing at the smallest glyph scale. At 252px the glyphs read as grey stipple, the random 12% dropout reads as noise, and the shape has to carry all the meaning. **The glyphs aren't doing any work. They're just a texture applied to a line icon.**

Everything below follows from that. The new direction makes the glyphs carry structure, through **tone, rule, and scale**, not just texture.

## 2. The visual system: "Lipi" (ലിപി, script)

The working name is a collection of five small, static, generative prints made from Malayalam letters. Think of a riso or letterpress series pulled on the same paper with the same inks, where each sheet runs a different procedure.

### Shared rules (what makes them one family)

1. **One grid.** All five sit on the same 8px cell grid, centred in the 252px layer with an equal margin on all sides. The bridge uses 10px, so the two are close enough to read as related, while 8px gives these pieces enough resolution at 300px.
2. **One glyph pipeline.** The same Manjari sampling, pool, and 1px micro-dots as the bridge. No new font and no smooth vector text.
3. **Three glyph scales, used sparingly.**
   - *Texture*: the 8px cell (a 6×6 stamp). It reads as stipple and makes up most of every piece.
   - *Display*: a 2×2 or 3×3 cell block (16–24px) holding one glyph at a legible size. At most a handful per piece.
   - *Specimen*: one glyph sampled as a *shape mask* about 20–26 cells tall, then filled with texture-scale glyphs. Only one piece uses it.
4. **Three cream tones, no gradients.** Faint ≈ 22%, mid ≈ 48%, full ≈ 86% of the cream `rgb(249 244 241)`. These are stepped tones, like layered ink passes, not smooth ramps. Faint is close to the bridge's 15% idle value, so the two speak the same language.
5. **Tone comes from glyphs, not just opacity.** Each glyph's dot count is measured when it's sampled (for example, `ര` is light and `മ`/`ഗ` are heavy). Dense areas use heavy glyphs and light areas use light ones, the way ASCII art builds tone. **This is the main way the characters become integral.** It's backed up by the three opacity tones, because a 6×6 stamp gives a limited tonal range on its own.
6. **Ordered dithering, not random dropout.** Where a field needs partial density, cells are kept or dropped using a 4×4 Bayer threshold, not `Math.random`-style hashing. The result looks printed and deliberate, which avoids the "random glyph noise" failure. The bridge's random edge-dither stays on the bridge. The new pieces use a lighter version only on line work.
7. **One lime event per piece.** Lime marks a single point or short run, under about 2% of inked cells, and always sits somewhere structurally meaningful: a seed, a node, a start and end. Never a fill or a glow.
8. **A density budget.** Inked cells cover at most about 40% of the grid, and full-tone cells at most about 15%, so no piece out-shouts the Mondwest headline beside it. Every piece keeps at least one clear area of negative space.
9. **A relationship to the frame.** The hairline border is the "paper edge". Pieces either bleed to the inset edge on purpose (they get cropped by it, like a detail) or sit clear of it with obvious margin. Nothing half-touches it.
10. **Static and deterministic.** Each piece paints the same way on every load and only repaints on resize. No motion in this phase.

### How the set reads as a sequence

Auto-cycle shows them in order, so the set alternates weight and geometry. Each crossfade then reads as a change of sheet, not a flicker:

| # | Piece | Geometry | Weight | Use of frame |
| --- | --- | --- | --- | --- |
| 1 | Interference | Two overlapping gratings | Dense, optical | Bleeds |
| 2 | Rule 110 | Diagonal growth from a point | Medium, crisp | Diagonal split |
| 3 | Specimen | One large letterform on a grid | Bold, single mass | Cropped detail |
| 4 | Chorus | Horizontal waves | Light, rhythmic | Bleeds left and right |
| 5 | Hilbert | One continuous path | Even, complete | Exactly fills the square |

No two pieces share a dominant geometry (field, triangle, letter, bands, path). What they do share is the grid, the inks, the glyph pipeline, and the single lime mark.

## 3. The five compositions

The sketches below are at a quarter of the real resolution. `█` is full tone, `▓` mid, `░` faint, `+` lime, `.` empty.

### 1. I Like the Hard Problems — "Interference"

Two simple, ordered fields that become complicated only where they overlap.

- **Field A:** a square, about 19 × 19 cells, set high and left. It's filled with a horizontal grating, one row of glyphs every 3 rows, at faint tone.
- **Field B:** a disc about 20 cells across, set low and right. It's filled with the same grating rotated about 18°, also at faint tone.
- **The overlap (a lens-shaped region):** both gratings are evaluated together. Their sum produces a moiré beat, a lattice of diamond-shaped nodes about 9 cells apart. Cells on a node become full tone and use heavy glyphs. Cells between nodes drop out through the ordered dither.
- **Lime:** the single node where both gratings peak most strongly, shown as one display-scale (2×2) glyph.
- **Negative space:** the top-right and bottom-left corners stay empty.

What it says, loosely: each part of a problem is simple, and the difficulty lives where they meet. The square-and-disc pairing gives an ordered-meets-organic tension without depicting anything.

```text
▓▓▓▓▓▓▓▓▓▓.......
░░░░░░░░░░.......
▓▓▓▓▓▓▓▓▓▓.......
░░░░░░░░░▓░▓░....
▓▓▓▓▓▓█▓█▓█▓░░...
░░░░░█░+░█░▓░░░..
▓▓▓▓▓▓█▓█▓█▓░░░░.
....░░▓░▓░▓░░░░░.
....░░░░░░░░░░░░.
.....░░░░░░░░░░..
.......░░░░░░....
```

Risk: if the grating period or angle is wrong, the moiré becomes noise. Period and angle are the two tuning values, and the beat spacing should land at 3 to 4 nodes across the lens.

### 2. AI-First by Default — "Rule 110"

A one-dimensional cellular automaton grown from a single seed. Each row is a generation, and one simple rule produces an intricate, self-repeating structure.

- **Seed:** one lime cell at the top-right corner of the grid.
- **Growth:** Rule 110 only expands leftward, so the structure becomes a right triangle. It widens one cell per row, and by the last row it spans the full width. The frame is split on the diagonal: open space at the top left, generated structure at the bottom right.
- **The glyph *is* the rule.** Each live cell's glyph is chosen by its 3-cell parent neighbourhood (8 possible patterns map to 8 glyphs from the pool). The same local situation always produces the same letter, so the eye starts to find repeated "words" in the pattern. That's the most direct way of making the characters integral to the system rather than decoration.
- **Tone:** live cells are mid. Dead cells inside the grown triangle are faint, so the triangle reads as a region and the pattern reads inside it. Rule 110's long diagonal "gliders" become full tone, which gives the piece a few strong lines to hold on to.

What it says, loosely: one rule, applied by default, generating more than you'd expect. No brain, no sparkle, no network graph.

```text
...............+
..............▓▓
.............▓▓▓
............▓▓░▓
...........▓▓▓▓▓
..........▓▓░░░▓
.........▓▓▓░░▓▓
........▓▓░▓░▓▓▓
.......▓▓▓▓▓█▓░▓
......▓▓░░░▓█▓▓▓
.....▓▓▓░░▓▓░█░▓
```

Alternative: Rule 30 from a centred seed gives a symmetric triangle that becomes chaotic, which is more famous and less compositionally interesting. Rule 90 (the Sierpinski triangle) is too recognisable.

### 3. I Design and Code — "Specimen"

A type-specimen crop: one Malayalam letter at a large size, against the construction grid it would be designed on.

- **The letter:** `ഴ` (zha, the sound found only in Malayalam, as in *Kozhikode*). It's sampled once as a shape mask about 26 cells tall, placed low and left, and deliberately cropped by the bottom and left inset edges, like a detail from a specimen sheet. The letter's shape is filled with full-tone, heavy texture glyphs, so it's a letter made of letters.
- **The grid:** faint horizontal guides at the baseline, x-height, and ascender rows, plus vertical guides every 4 cells. All of them are drawn in light glyphs. Where a guide passes behind the letter it's hidden, so the letter clearly sits *on* the structure.
- **The meeting point:** where one stroke of the letter crosses the baseline, a short run of 3–4 lime cells marks it. That's the single place the organic curve and the rule-based grid touch.
- **Negative space:** the top-right quadrant has only grid guides.

What it says, loosely: a curve that's drawn by hand and a grid that's defined in code, in one image. It's also the most personal piece, because it puts a large, legible Malayalam letter in the portfolio rather than only stipple.

```text
░...░...░...░...
░░░░░░░░░░░░░░░░   ← ascender guide
░...░...░...░...
░.████████..░...
██████████████░░   ← x-height guide
█████...░████...
████....░..███..
███░░░░░░░░███░░
███.....░..███..
████++++████....   ← baseline, lime where stroke meets it
.█████████......
```

Alternative letters: `മ` (more balanced and calmer) or `അ` (the first letter of the alphabet; it's also the bridge's reference glyph). Any Manjari letter works, because the existing sampler can sample any glyph. See the decisions at the end.

### 4. Customer-Driven Decisions — "Chorus"

Many separate voices that start out of step and finish in rhythm.

- **Seven voices:** horizontal waves, one every 4 rows, each drawn as a continuous glyph line using the bridge's line primitive. They run edge to edge and bleed off both sides of the inset.
- **Left third:** each voice has its own frequency and phase, so the waves cross and clash, at faint tone.
- **Middle third:** the phases pull together, at mid tone.
- **Right third:** every voice has the same frequency and phase, at full tone. The peaks stack into vertical columns.
- **Lime:** the right-most column of aligned peaks, a short vertical run of lime cells. It's not drawn as a line; it appears because the voices agreed.
- **Negative space:** the gaps between voices, which open up on the right as the waves align.

What it says, loosely: listening to many signals until a shared direction emerges. There are no speech bubbles, ears, or people. It's also the lightest piece and the one most related to the bridge (a line-based relative of the cables), which balances the denser pieces around it.

```text
░▓.░..▓▓░..▓█..█..█
.░▓░▓░..▓▓█.██.██.+
▓..░..░▓..▓█..█..█.
.▓░.▓░.░▓▓.█..█..█.
░..▓..▓..▓█.██.██.+
.░.░▓..░▓..▓█..█..█
▓░..░▓░..▓▓.██.██.+
```

### 5. End-to-End Ownership — "Hilbert"

One unbroken line that visits every part of the square and ends where the system is complete.

- **The path:** an order-4 Hilbert curve, 16 × 16 nodes at a 2-cell pitch, so it spans 31 × 31 cells. That fills the 252px layer almost exactly. It's one continuous line of glyphs with no breaks and no dropout, because unbroken is the point.
- **Four phases:** a Hilbert curve naturally completes one quadrant before moving to the next. Each quadrant gets one step of tone (faint, mid, mid, full), so the eye follows the path from start to finish without any labels.
- **Lime:** the entry cell (bottom left) and the exit cell (bottom right), the only two ends of the line.
- **Frame:** the only piece that fills the square exactly, edge to edge inside the inset, so it reads as closure and a finished system. It ends the cycle before the loop goes back to piece 1.

What it says, loosely: from the first step to the last, nothing handed off and nothing skipped.

```text
▓▓▓.▓▓▓.█▓█.███.
▓.▓.▓.▓.█.█.█.█.
▓.▓▓▓.▓▓█.███.█.
▓.....▓.........
▓▓▓.▓▓▓.█▓█.███.
..▓.▓.....█.█...
░░░.░░░.▓▓▓.▓▓▓.
░.....░.▓.....▓.
░.░░░.░.▓.▓▓▓.▓.
+.░.░.░.▓.▓.▓.▓+
```

Alternative: a *kolam*-style closed loop (one line weaving around a dot grid, a South Indian threshold drawing). It's more culturally rooted but more ornamental. Keep it as a fallback if Hilbert feels too technical.

## 4. Renderer changes needed

All of these are contained in `capability-canvas.tsx` and `capability-figures.ts`. **`malayalam-bridge-canvas.tsx` isn't touched.** No dependencies are added.

| Change | Why | Size |
| --- | --- | --- |
| `FigureCell` gains `tone: "faint" \| "mid" \| "full" \| "lime"` (replaces `ink`), optional `glyph` override, and optional `span` (1, 2, or 3 cells) | Three-tone inks, rule-chosen glyphs, display-scale glyphs | Small |
| Paint in four passes (faint, mid, full, lime), one `fillStyle` each; `span` cells use a bitmap sampled at a larger budget | Keeps painting as cheap as today | Small |
| Measure each glyph bitmap's dot count when sampling, and expose glyphs sorted light to heavy | Tone from glyph choice | Small |
| Centre the grid: `floor` columns and rows, offset the remainder evenly | Equal margins; nothing cropped by accident | Small |
| `fieldCells(fn)` helper: evaluate a scalar field per cell, then quantise to a tone with a 4×4 Bayer threshold | Filled areas and density without random noise | Small |
| `glyphMask(glyph, rows)` helper: reuse the existing `sampleGlyphBitmap` at a large budget to get a cell mask | The Specimen letter | Small (the sampler already exists) |
| Per-figure thinning settings instead of the single `HARD_PROBLEMS_DENSITY` | Hilbert needs no dropout; Chorus needs a light one | Small |
| Share one module-level font-load and bitmap promise across the five canvases | Already in the plan's Phase C; avoids five redundant sampling runs | Small |
| Optional: paint inactive layers in `requestIdleCallback` | Spreads the first paint of five canvases | Small, only if profiling shows a need |

Each figure builder is a pure function of grid size: about 1,000 cells, under 25k micro-dots, and a few milliseconds per paint. No piece needs a frame loop, an offscreen accumulation buffer, or WebGL.

## 5. Recommended first two prototypes

**1. Interference** (I Like the Hard Problems) and **3. Specimen** (I Design and Code).

Why these two:

- **They test opposite directions.** Interference is a pure *field*: optical, all texture, nothing to recognise, and full-bleed. Specimen is a single *form*: typographic, one legible letter, a cropped composition, with lots of negative space. If both work, the system holds across the full range. If only one does, we learn which way to push the other three.
- **Between them they exercise every renderer extension.** Interference uses tonal fields, ordered dither, glyph-weight tone, and a display-scale lime glyph. Specimen uses the glyph mask, guide lines, occlusion, and cropping. Rule 110, Chorus, and Hilbert then need almost nothing new.
- **They put the riskiest ideas first.** Interference is the piece most likely to fall into "random glyph noise". Specimen is the biggest departure from the bridge (a legible letter). It's better to find out about both now.
- **Interference replaces the unapproved knot** in slot 1, so the first thing a visitor sees changes.

Fallback pairing, if you'd rather start with lower risk: **Rule 110 + Specimen**. Rule 110 is very likely to look good straight away, but it teaches us less about filled tonal areas.

Step B scope stays as written: two figures, integrated into the existing layers, the other three as placeholders, verified at 300px on desktop and mobile, with a type check, build, and a performance check beside the bridge.

## 6. Decisions needing your input

1. **The two prototypes.** Interference + Specimen (recommended), or Rule 110 + Specimen.
2. **The Specimen letter.** `ഴ` (recommended: distinctly Malayalam and expressive), `മ` (calmer), or `അ` (the alphabet's first letter and the bridge's reference glyph). This also decides whether one large, readable letter is welcome, or whether you'd rather keep every glyph at texture scale.
3. **The tonal range.** Three cream tones (22% / 48% / 86%) is a step beyond the bridge's single faint tone. The full tone is noticeably brighter than the bridge. If you want the set quieter, cap full at about 70%.
4. **Retiring the knot.** The current Hard Problems figure would be replaced, not kept as an option.
5. **Cell size.** Proposed: stay at 8px for all five. A 6px grid (42 × 42) would give the moiré and the automaton more detail, but glyphs would shrink to 4–5 dot stamps and stop reading as letters. Recommendation: keep 8px.

Not in scope for Step B, noted for later: internal motion (the automaton could grow, the chorus could sync, the Hilbert path could draw itself), and whether the placeholder labels in `src/config/what-i-bring.ts` (`illustrationConcept`) should be renamed. They're `aria-hidden` and disappear as each real piece lands, so they can stay as they are for now.
