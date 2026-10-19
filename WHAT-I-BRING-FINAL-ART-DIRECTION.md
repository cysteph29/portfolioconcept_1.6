# What I Bring — Final Art Direction (Lipi)

Status: **Implemented on `experiment/editorial-homepage`.** Interference and Specimen are unchanged. Slots 2, 4, and 5 are Completion, Case, and Seam.

## As built

Manjari’s proportions are wider than the proposal assumed, so two sizes were fitted to the 31-cell grid. The compositions are the ones below.

- **Completion.** `ലിപി` is sampled to about 1.12× the grid width, so both syllables stay in frame and bleed a few cells off the sides. The gap still sits near 45% of the width. The uncommitted half uses **mid** tone at the same glyph weight as the committed half (0.85). Faint ink at a light weight did not hold the letter shape at 300px.
- **Case.** Built to the compartment table below.
- **Seam.** `ണ` is wide, not tall. It is sized so the whole letter stays inside the frame, centered vertically, with the slug edge cutting the stem just before the right counter. The lime glyph sits in the counter that falls inside the slug.

Figure ids are `completion`, `case`, and `seam`.

Branch: `experiment/editorial-homepage`. This supersedes the slot 2, 4, and 5 sections of `WHAT-I-BRING-ART-DIRECTION.md`. Everything else in that file still applies: the grid, inks, and pipeline.

## The diagnosis in one line

Interference and Specimen work because they are about **how ink behaves on a page**: overprinting in one, a letter on its construction grid in the other. Dissolving Mass, Open Ring, and Corner are about **a shape filled with ink**. So the three replacements each take a real typographic or printing device as their structure. The shape is never the subject.

## The three replacements

| Slot | Capability | Replaces | New piece | Typographic device |
| --- | --- | --- | --- | --- |
| 2 | AI-First by Default | Dissolving Mass | **Completion** | A line of type, set mid-word, with a caret |
| 4 | Customer-Driven Decisions | Open Ring | **Case** | A printer's type case, with compartments sized by use |
| 5 | End-to-End Ownership | Corner | **Seam** | A figure/ground reversal across a hard edge |

All measurements are given for the real grid: 31 × 31 cells of 8px each, inside the 252px layer. `size` means `Math.min(columns, rows)`. Positions are written as fractions of `size`, so they scale, with the value at 31 in brackets. Tones and weights use the existing `FigureCell` vocabulary.

---

### 2. AI-First by Default — "Completion"

**Composition.** One line of large Malayalam type crosses the lower-middle of the frame and bleeds off both the left and right edges. The word is **ലിപി** ("script", the name of the series). The frame catches it mid-word. To the left of a thin lime caret, the letters are bright and committed. To the right, the rest of the word is the same size but faint, like suggested text that hasn't been accepted yet. Above it, two short lines of texture-scale "text" give the page context and a reading direction.

**Dominant structure.** A horizontal line of type. It's the only horizontal piece in the set, and the only one built from a word rather than a letter.

**How the glyphs form it.**
- `glyphMask("ലിപി", …)` is sampled once as a single mask, about `0.58·size` tall (18 rows), with its top at row `0.3·size` (9).
- The mask is split at the empty column gap between `ലി` and `പി` (the gap nearest its horizontal middle). The mask is offset so that gap lands at column `0.45·size` (14).
- Left of the split: `full`, weight 0.85, every cell (the same treatment as Specimen's letter).
- Right of the split: `faint`, weight 0.15, every cell. **No dither.** The ghost is a change of ink, not a dissolve, so it doesn't repeat the rejected piece.
- Context lines: rows `0.1·size` (3) and `0.16·size` (5) are `faint`, weight 0.3, and start at column 0 so they bleed off the left. They're broken into "words" of 2–6 cells with 1-cell spaces, using the existing deterministic hash. The first line ends near column `0.7·size` (22), the second near `0.4·size` (12). The ragged ends matter: they read as a paragraph, not as rules.

**Negative space.** A clear band of 3 rows separates the context lines from the word. The top-right corner is empty above the short second line. There's empty space below the word's baseline, and inside the counters of every letter.

**Focal point and lime.** The **caret** is a single `lime` column at the split, running from 1 row above the mask's top to its bottom. Clear one column on each side so it stands free. It's about 20 cells, more than the old 2% lime guideline. That's deliberate: it's still a single mark, and it's the hinge of the whole image.

**Why it works at 300px.** At 18 rows tall, the letters are about as large as Specimen's, so they read instantly as Malayalam. The full-to-faint jump is the biggest tonal contrast in the series, and it happens at one sharp vertical line. Small text against large text gives the "printed page" feel that the rejected pieces lacked.

```text
................
░░.░░░.░░░░.░░..   ← context lines, texture scale, faint
░.░░░░.░░.......
................
..████..+.░░░░░.
.██..██.+░░..░░░
.....██.+░░..░░░
.█████..+░░..░░░
██...██.+░░..░░░
.█████..+.░░░░░░
......█.+.....░░
................
```

---

### 4. Customer-Driven Decisions — "Case"

**Composition.** A fragment of a printer's type case (the drawer of compartments that holds metal type). It's cropped by the right and bottom edges. In a real case, compartment size follows how often each letter is used, so the most common letter gets the biggest box. Here the asymmetry is literal: the layout is shaped by use, not by taste. One large compartment holds a big `മ` built from glyphs. Smaller compartments hold single display-scale letters. Three compartments are empty.

**Dominant structure.** An irregular grid of rectangles holding letters at four scales: a mask, span 4, span 3, and span 2. It's the only piece where the source letters appear plainly, at legible size, as themselves.

**How the glyphs form it.** Authored for 31 × 31. At other sizes, scale every coordinate by `size / 31` and round. Inclusive cell ranges:

| Compartment | Columns | Rows | Contents |
| --- | --- | --- | --- |
| A | 3–20 | 3–20 | `glyphMask("മ")`, about 14 rows tall, centred, `full`, weight 0.85 |
| B | 22–30 | 3–9 | `ക`, span 4, `mid` |
| C | 22–30 | 11–15 | `ര`, span 3, `mid` |
| D | 22–25 | 17–20 | `വ`, span 3, `mid` |
| E | 27–30 | 17–20 | empty |
| F | 3–10 | 22–30 | `യ`, span 4, `mid` |
| G | 12–14 | 22–24 | `അ`, span 2, **`lime`** |
| H | 12–14 | 26–30 | empty |
| I | 16–25 | 22–25 | `ല`, span 2, `mid` |
| J | 16–25 | 27–30 | `സ`, span 2, `mid` |
| K | 27–30 | 22–30 | empty |

- **Dividers** are `faint`, weight 0, solid 1-cell lines with no dither, on the cells between compartments. They run on row 2, column 2, row 21, and column 21. Inside the right column they run on rows 10 and 16, and on column 26 between rows 16 and 20. In the bottom band they run on columns 11, 15, and 26, on row 25 between columns 11 and 15, and on row 26 between columns 15 and 26. There's no divider on the right or bottom edge, so the case continues out of the frame.
- Display glyphs are centred in their compartments. Every letter used comes from the existing pool, so no new bitmaps are sampled except the `മ` mask.

**Negative space.** The generous margin of compartment A around its letter, the three empty compartments (E, H, and K, like sorts that have been used up), and the unruled top and left margin. This is the lightest sheet in the set, at about 25% of cells inked.

**Focal point and lime.** The big `മ` is the first read. The lime `അ` sits in the smallest compartment, G, diagonally opposite. `അ` is the first letter of the alphabet and the bridge's reference glyph. The idea, loosely: the smallest signal is the one that changes the decision. The eye travels between the largest and smallest letters, and that diagonal is the composition.

**Why it works at 300px.** A span-4 glyph is 32px, a span-3 glyph is 24px, and both are crisp, legible Malayalam letters at 2× DPR. Nothing else in the set shows them at that size. The mix of scales inside a rigid structure is what makes a type specimen sheet beautiful. Because the case is cropped and the compartments are unequal, it reads as a found object, not as a UI grid.

```text
................
.░░░░░░░░░░░░░░░
.░.........░....
.░.........░.▓▓.
.░..█████..░.▓▓.
.░.██.█.██.░░░░░
.░.██.█.██.░.▓..
.░.██.█.██.░░░░.
.░....████.░▓.░.
.░.........░..░.
.░░░░░░░░░░░░░░░
.░....░.░....░..
.░.▓▓.░+░.▓..░..
.░.▓▓.░░░....░..
.░....░.░░░░░░..
.░....░.░.▓..░..
```

---

### 5. End-to-End Ownership — "Seam"

**Composition.** A solid slug of glyphs fills the left half of the frame and bleeds off the top, left, and bottom. One large letter, **ണ** (ṇa), straddles the slug's hard right edge. Inside the slug, the letter is knocked out as empty paper. Outside, it's printed in full cream. The form never breaks at the seam; only its polarity flips. The idea, loosely: the boundary where a handoff would normally happen doesn't interrupt the work.

**Dominant structure.** A figure/ground reversal: a rectangle and a letter, cut against each other. It's a classic Swiss-poster move, and the heaviest sheet in the set.

**How the glyphs form it.**
- Slug: columns 0 to `0.5·size` (0–15), all rows, `mid`, weight 0.7, every cell, no dither.
- Letter: `glyphMask("ണ", …)` about `0.62·size` tall (19 rows), with its top at row `0.2·size` (6). Offset horizontally so the slug edge cuts through at least two strokes, ideally at a stroke junction rather than through a counter. Start with the left edge at column `0.24·size` (7). The right side may crop off the frame by 2–4 columns.
- Letter cells inside the slug are removed. Letter cells outside are `full`, weight 0.85.
- No halo and no outline. The seam is defined only by the two tones meeting at the slug's straight edge.

**Negative space.** The letter itself, inside the slug. Outside it, the open top-right and bottom-right corners above and below the printed half. The heaviness on the left makes the right side feel very open.

**Focal point and lime.** A single 2×2 `lime` glyph sits at the centroid of the largest enclosed counter of `ണ` that falls inside the slug. Inside the slug a counter is a small `mid` island, ringed by the empty stroke, so the lime sits in the most framed spot in the image. To find counters, flood-fill the background from the mask's bounding-box border; unreached background cells are counters. If no counter falls inside the slug, nudge the letter left until one does.

**Why it works at 300px.** Reversal is the strongest silhouette available at small sizes: two masses, one straight edge, one curved figure, with maximum contrast. It reads from across the room and holds up when it's crossfading. It also mirrors Specimen spatially, with the mass on the left and the printed letter on the right, cropped at the right edge rather than the left. So the two letter pieces don't look alike.

```text
▓▓▓▓▓▓▓▓........
▓▓▓▓▓▓▓▓........
▓▓▓▓▓▓▓▓........
▓▓▓▓...▓████....
▓▓▓.▓▓▓.▓..██...
▓▓▓.▓+▓.█...██..
▓▓▓.▓▓▓.█...███.
▓▓▓▓...▓█..█..██
▓▓▓▓▓▓▓.████..██
▓▓▓▓▓▓▓▓......██
▓▓▓▓▓▓▓▓........
▓▓▓▓▓▓▓▓........
```

---

## How the five work as one series

| # | Piece | Device | Weight | Main axis | Edge use | Lime |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Interference | Overprinted ring screens | Dense, optical | Radial | Floats | Node (2×2) |
| 2 | Completion | A line of type with a caret | Medium | Horizontal | Bleeds left and right | Caret (column) |
| 3 | Specimen | A letter on its construction grid | Bold mass | Vertical | Cropped left | Stem on baseline (run) |
| 4 | Case | A type case | Light, many parts | Grid, diagonal read | Bleeds right and bottom | Smallest letter (span 2) |
| 5 | Seam | Figure/ground reversal | Heavy | Split vertical | Bleeds on all sides | Inside a counter (2×2) |

- **One question, five answers.** Each sheet is a different way type makes an image: an overprint, a line, a letter, a set of sorts, and a counterform. That's what makes them a series rather than five icons.
- **The rhythm of the auto-cycle.** The weight alternates: dense, medium, bold, light, heavy. The main axis never repeats twice in a row.
- **Big letters, but never the same way.** Completion, Specimen, and Seam each use a large letterform, but as a cropped word, a single specimen, and a negative shape respectively. Interference and Case break the run with a field and a set of small letters.
- **One lime mark per sheet**, each in a different form (node, caret, run, letter, counter), but always at the structural hinge.
- **The bridge connection.** All five are cream glyph stipple on dark green, on the same pipeline. `അ` (the bridge's reference glyph) appears in lime in Case.

Considered and dropped: two overprinted letters (it repeats Interference's "overlap is brightest" logic), a size waterfall (too close to Specimen), and a justified text block with a river (too quiet at 300px).

## Renderer support

**The renderer supports all three with small, contained changes.** Nothing changes in `malayalam-bridge-canvas.tsx`, the tones, the DPR handling, the paint passes, the frame, or the showcase.

| Change | Needed by | Size |
| --- | --- | --- |
| Optional `glyph?: string` on `FigureCell`. `pickGlyph` uses that pool letter's bitmap at the cell's span instead of the weighted pick | Case | Small |
| `glyphMask` handles multi-character strings: widen the offscreen sampling canvas (or lower the font size) when the text is wider than one glyph, so `ലിപി` isn't clipped at 256px | Completion | Small |
| Add `ലിപി` and `ണ` (and `മ`) to the string passed to `loadManjariFont`, so the font check covers them | Completion, Seam | Trivial |
| Rename figure ids: `pressure` → `completion`, `opening` → `case`, `joint` → `seam` in `CapabilityFigureId`, `buildFigureCells`, `CAPABILITY_FIGURES` in `capability-showcase.tsx`, and `FIGURES` in `src/app/dev/lipi/page.tsx`. Delete the three old builders | All | Trivial |

The counter flood-fill (Seam), the gap split (Completion), and the compartment table (Case) are all pure functions inside `capability-figures.ts`. `buildInterferenceCells` and `buildSpecimenCells` are not touched.

## Step B checklist (for whoever implements)

1. Build the three builders above in `capability-figures.ts` with the small renderer changes. No new dependencies.
2. Review all five together on `/dev/lipi` at 1× and 2× DPR. One screenshot pass, not an automation loop.
3. Tuning allowed without re-approval: offsets within ±2 cells, the mask height within ±10%, and the exact split or seam column. Anything beyond that (a different letter, word, or layout) comes back for review.
4. Check the homepage showcase still cycles, crossfades, and pauses correctly. Then run a type check and lint. Don't commit.
