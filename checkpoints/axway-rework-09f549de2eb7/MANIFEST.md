# Axway rework checkpoint

Recoverable copy of the current Axway rework before splitting the public case study and the preview.
This directory is not publicly served. Do not delete it while the rework is unfinished.

- Git commit: `09f549de2eb73078286832e388efce158202a76b`
- Branch: `experiment/editorial-homepage`
- Working tree status at checkpoint: clean (no uncommitted or untracked tracked-path changes)
- The preview content must be taken from `src/content/case-studies/axway.mdx` in this checkpoint, which is the working-tree file at the commit above.

## Git status --porcelain

```
(empty)
```

## Ignored paths (relevant)

```
!! "public/work/axway/Redesign Proposal/"
```

## Files

| Original path | Bytes | SHA-256 | Compared with HEAD |
| --- | ---: | --- | --- |
| `src/content/case-studies/axway.mdx` | 7058 | `cc7913312a11d0eee2e7d5851600e4a95233c5d27ef2558cbedf5e36a45778db` | matches HEAD |
| `src/components/work/axway-find-workaround.tsx` | 6650 | `23eea608c5bf2eb932d8974b65d88c30be437166fbf4226e5fa9e29346400f48` | matches HEAD |
| `src/components/work/axway-find-workaround.module.css` | 10887 | `09de2ae3d6dba51b4d29383f0a39a9277ca869f48c027893b8ec35b4229ee11e` | matches HEAD |
| `src/components/work/case-figure.tsx` | 7939 | `25cf62715966f6f324fbcd449b19aba5e466f4f68fc13157076d15116b82c3e6` | matches HEAD |
| `src/components/work/case-study-opening-gallery.tsx` | 2433 | `a80ce081032c24b69d28152a4a00d0544758e6dbe72cff14c921c554ae25a64c` | matches HEAD |
| `src/components/work/case-study-page-layout.tsx` | 6960 | `3fc3570b235bf5dc03b61f8a496627431dca6cb3bf2ee8ec959628f75ea43b4d` | matches HEAD |
| `src/config/case-studies.ts` | 2102 | `ff489ba3992ef5bd1c829cf62f62592573909997c2bfae1732f072d3ea116c57` | matches HEAD |
| `src/app/globals.css` | 56255 | `8c00ba3ea5ebc4ba86a34977d2b03732c1bc17ebd888fb34ae9542122f2920ab` | matches HEAD |
| `src/app/work/[slug]/page.tsx` | 1674 | `548964086732dff426cf8fb220f4886478804af8b4eef16324e6dedb0621abc3` | matches HEAD |
| `src/app/dive/work/[slug]/page.tsx` | 1676 | `6cb9addd39ade24dcb88f7a43e3ab9ac6edeab3cc986da95180da6fbe79c0470` | matches HEAD |
| `mdx-components.tsx` | 2422 | `b1bb98dd14431f5d776df5ae424c49bbf7b96bbd816c6fca030cf3abb8d00431` | matches HEAD |
| `AXWAY-CASE-STUDY-REWORK-PLAN.md` | 14459 | `53fbcad1468adcb40d8e04a4247d7a0226835686609ac7a58ce93bb1780f7d3d` | matches HEAD |
| `public/work/axway/use this.png` | 57020 | `6c5f5a01989313f2fee06dc06413303ed9b63eeb732f0c5288c4d3792e41a17b` | matches HEAD |
| `public/work/axway/old-ui-1.png` | 385896 | `4a88950631cfe1b82208a9ba90e9ca5313241e2a1cc66b029e7b1c14dbc85424` | matches HEAD |
| `public/work/axway/old-ui-2.png` | 1502065 | `ecc27e32ccf7c1a44e3e2a82f621a05c5bbf8197434d40458d2c8e3bf3b8b11c` | matches HEAD |
| `public/work/axway/old-ui-3.png` | 581788 | `88f92b8ccad06e26a8402d5cbda24f79307ea471f892961f4052cb05bb43506c` | matches HEAD |
| `public/work/axway/Redesign Proposal/.DS_Store` | 6148 | `d65165279105ca6773180500688df4bdc69a2c7b771752f0a46ef120b7fd8ec3` | not in HEAD (untracked or ignored) |

## Recovery

To restore the rework content and the files copied here, copy each path from this checkpoint back onto the same path in the repo.
Tracked media that is not copied here (the existing `/public/work/axway` videos and webp stills) was unchanged in the working tree and remains at the Git commit above.
Do not use `git reset`, `git checkout`, or `git restore` to recover this checkpoint; copy the files.

