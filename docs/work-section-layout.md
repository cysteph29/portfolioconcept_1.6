# Work Section Widths

The desktop Work section has three horizontal parts:

1. The **Work column** is `232px` wide.
2. The **gap** is `30px` wide.
3. The **case-study column** uses all the space that remains.

The complete layout has a maximum width of `1512px`.

This maximum includes all three parts:

```text
Work column + gap + case-study column = 1512px maximum
```

It does **not** mean that the case-study column alone can be `1512px` wide.

At the maximum layout width:

```text
232px + 30px + case-study column = 1512px
case-study column = 1250px
```

## How it responds to the screen

The Work column and gap stay fixed on desktop and tablet. The case-study column grows or shrinks with the browser window.

The case-study width is calculated as:

```text
browser width - left gutter - right gutter - 232px - 30px
```

For example, with a `922px` browser width:

```text
Left gutter:        about 64.5px
Work column:             232px
Gap:                      30px
Case-study column: about 531px
Right gutter:       about 64.5px
```

The outer gutters are not included in the `1512px` maximum. On very wide screens, they grow to keep the complete Work layout centered.

## Mobile

At `767px` and below, the two-column layout is removed. The Work heading and case studies stack vertically, and both use the available content width.

## Where this is defined

- Layout variables and positioning: `src/components/home/work-section.tsx`
- Maximum width and responsive styles: `src/app/globals.css`

The important current values are:

```text
Work column: 232px
Column gap: 30px
Complete layout maximum: 94.5rem (1512px)
```
