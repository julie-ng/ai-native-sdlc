---
version: alpha
name: julie.io Diagrams
description: Standalone SVG architecture diagrams in the julie.io style. Flat, light, icon-labelled; brand purple for what I run, teal for autonomous agents, Kubernetes blue for the cluster.
colors:
  primary: "#4652c6"            # brand-500 · platform services, orchestration
  primary-strong: "#3a42b0"     # brand-600 · local/interactive agent, boundaries, loop steps, step badges
  primary-soft: "#eef0fb"       # brand-50 · fill behind purple strokes
  primary-light: "#a3abe6"      # brand-300 · purple strokes in dark mode
  secondary: "#00bba7"          # teal-500 · autonomous cloud agents, their arrows, lock (OK)
  secondary-soft: "#f0fdfa"     # teal-50
  secondary-light: "#46edd5"    # teal-300 · agent strokes in dark mode
  tertiary: "#326ce5"           # Kubernetes blue · cluster border and logo only
  tertiary-soft: "#f6f9ff"      # 4% Kubernetes blue on white · cluster fill
  neutral: "#ffffff"            # background
  surface-elevated: "#f3f4f6"   # external system cards (GitHub)
  border: "#d1d5dc"             # frames, namespaces, supporting cards, links
  on-surface: "#364153"         # body text, node names
  heading: "#101828"            # titles, card names, notes
  muted: "#6a7282"              # subtitles, descriptors, default arrows
  toned: "#4a5565"              # arrow labels, "reach" arrows
  gate: "#bc945b"               # review-gate stroke
  gate-soft: "#fefdef"          # review-gate fill
  warn: "#fdc700"               # warning triangle
  error: "#fb2c36"              # red X (blocked)
  # dark mode counterparts
  neutral-dark: "#101828"
  surface-elevated-dark: "#1e2939"
  border-dark: "#364153"
  on-surface-dark: "#e5e7eb"
  heading-dark: "#ffffff"
  muted-dark: "#99a1af"
  toned-dark: "#d1d5dc"
  error-dark: "#ff6467"
typography:
  diagram-title:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: 600
  diagram-heading-mono:
    fontFamily: Roboto Mono
    fontSize: 16px
    fontWeight: 700
  subtitle:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: 400
  card-label:
    fontFamily: Roboto Mono
    fontSize: 14px
    fontWeight: 600
  card-label-support:
    fontFamily: Roboto Mono
    fontSize: 12px
    fontWeight: 600
  node-label:
    fontFamily: Roboto Mono
    fontSize: 14px
    fontWeight: 400
  container-label:
    fontFamily: Roboto Mono
    fontSize: 11px
    fontWeight: 500
    letterSpacing: 0.06em
  namespace-label:
    fontFamily: Roboto Mono
    fontSize: 12px
    fontWeight: 400
  descriptor:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: 400
  arrow-label:
    fontFamily: Source Sans 3
    fontSize: 13px
    fontWeight: 400
  note:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: 500
  step-number:
    fontFamily: Roboto Mono
    fontSize: 12px
    fontWeight: 700
rounded:
  node: 4px
  card: 6px
  frame: 8px
spacing:
  stroke: 1.5px
  stroke-namespace: 1px
  icon-card: 28px
  icon-inline: 22px
  icon-small: 20px
  step-badge-radius: 10px
  arrowhead-width: 10px
  arrowhead-length: 9px
  card-width: 170px
  card-height: 88px
  node-height: 44px
  node-height-two-line: 52px
components:
  node-platform:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.on-surface}"
    typography: "{typography.node-label}"
    rounded: "{rounded.node}"
    height: 44px
  node-agent:
    backgroundColor: "{colors.secondary-soft}"
    textColor: "{colors.on-surface}"
    typography: "{typography.node-label}"
    rounded: "{rounded.node}"
    height: 52px
  card-external:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.heading}"
    typography: "{typography.card-label}"
    rounded: "{rounded.card}"
  card-support:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.heading}"
    typography: "{typography.card-label-support}"
    rounded: "{rounded.card}"
    width: 170px
    height: 88px
  container-cluster:
    backgroundColor: "{colors.tertiary-soft}"
    textColor: "{colors.heading}"
    typography: "{typography.diagram-heading-mono}"
    rounded: "{rounded.frame}"
  container-namespace:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.muted}"
    typography: "{typography.namespace-label}"
    rounded: "{rounded.card}"
  review-gate:
    backgroundColor: "{colors.gate-soft}"
    textColor: "{colors.on-surface}"
  step-badge:
    backgroundColor: "{colors.primary-strong}"
    textColor: "{colors.neutral}"
    typography: "{typography.step-number}"
    size: 20px
  arrow-label:
    textColor: "{colors.toned}"
    typography: "{typography.arrow-label}"
---

# julie.io Diagrams

> [!NOTE]
> **Scope:** SVG diagrams in this documentation repository. Adapted from the supplied julie.io diagram guide; its claimed extraction from [julie.io](https://julie.io/ai-native-sdlc) on 2026-10-21 has not been independently verified. Lines marked *(inferred)* are interpretations. Token structure checked against the primary [DESIGN.md alpha specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) on 2026-10-21.

## Overview

This system produces **standalone SVG documents**: one `.svg` file per diagram, self-contained, opened or embedded as-is. Colors, dark mode and accessible text live inside the file. Web fonts are optional external requests; fallback fonts must fit without network access.

The look is **flat and light**: 1.5px strokes, small radii, pale tinted fills behind colored strokes, no shadows. **Names are set in Roboto Mono** (services, pods, cards, namespaces, step numbers); **descriptions and arrow labels in Source Sans 3**. Icons sit on cards or beside their labels: line icons for concepts, brand marks for products.

### File contract

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H" width="W" height="H"
     role="img" aria-labelledby="name-title name-desc">
  <title id="name-title">Short name</title>
  <desc id="name-desc">The whole diagram in sentences, including numbered steps.</desc>
  <style><![CDATA[
    /* contents of images/diagram-style.css, verbatim */
  ]]></style>
  <!-- shapes, then arrows, then step badges on top -->
</svg>
```

- Wrap the style block in `<![CDATA[ … ]]>`: its `@import` URL contains `&`, which is invalid raw XML.
- `width`/`height` equal the viewBox size; no background rect (transparent, so it sits on light or dark).
- [images/diagram-style.css](images/diagram-style.css) is the reusable CSS source. When it changes, refresh its embedded copy in diagrams authored with this contract. Legacy references retain their own styles.
- All styling through classes from `images/diagram-style.css`. No hex values or `style=""` on elements.
- Fonts load via the `@import` in the style block. They load when the SVG is opened directly or inlined into HTML, but **not** when it is referenced through `<img>` or a CSS background; there the fallback stacks (Helvetica/Arial, Courier) apply. Lay text out with room for that.
- Dark mode via `@media (prefers-color-scheme: dark)` inside the style block. Never rely on the host page for theming.
- Icons are nested `<svg x y width height viewBox="0 0 24 24">` elements colored with `currentColor`.
- Draw order: containers, nodes, text, connectors, step badges last so they sit on top.

## Colors

Color says **who owns or performs** a thing. Keep this mapping identical across diagrams.

| Meaning | Color | Classes |
|---|---|---|
| Services and orchestration the author runs | primary purple `#4652c6` on `#eef0fb` | `.box-platform` |
| Autonomous agents **and the arrows they originate** | secondary teal `#00bba7` on `#f0fdfa` | `.box-agent`, `.arrow-agent` + `.head-agent` |
| Local/interactive agent, its boundary, steps in a process | primary-strong `#3a42b0` on `#eef0fb` | `.box-local`, `.boundary`, `.box-agent-pill` |
| Numbered step badges | primary-strong `#3a42b0`, white numeral | `.step`, `.t-step` |
| Kubernetes cluster | `#326ce5` stroke, 4% tint fill | `.box-cluster` |
| Namespaces / logical groups | gray `#d1d5dc`, 1px dashed, white fill | `.box-ns` |
| External system that a flow hands off to | elevated gray `#f3f4f6` fill, gray stroke | `.box-ext` |
| Supporting managed services | white fill, gray stroke | `.box-support` |
| All other arrows | muted gray `#6a7282` | `.arrow` + `.head` |
| Arrow labels | toned gray `#4a5565`, whatever the arrow color | `.t-arrow` |
| Review gate | muted gold `#bc945b` on `#fefdef` | `.box-gate` |
| Protected / OK (lock) | teal `#00bba7` | `.ok` |
| Risk (warning triangle) | yellow `#fdc700` | `.warn` |
| Blocked (X) | red `#fb2c36` | `.cross` |

*(inferred)* The rule behind it: **purple = me and what I run; teal = what runs autonomously on my behalf.** Only arrows an agent performs are teal. Third-party products get no box color of their own; brand color appears only in icons.

## Typography

- **Title** (`.t-title`): Source Sans 3, 16px, 600, heading color. Process-diagram titles use the same size in primary-strong.
- **Mono heading** (`.t-mono .t-heading`): Roboto Mono 16px 700, for a container's name.
- **Subtitle** (`.t-subtitle`): Source Sans 13px, muted.
- **Card name** (`.t-mono .t-label`): Roboto Mono 14px 600; supporting cards 12px 600 (`.t-label-support`).
- **Node name** (`.t-mono .t-body`): Roboto Mono 14px.
- **Descriptor** (`.t-sans .t-small`): Source Sans 13px, muted, one line under a name.
- **Group label** (`.t-mono .t-ns`): Roboto Mono 12px, muted, written `kind: name`.
- **Container label** (`.t-container`): Roboto Mono 11px 500, UPPERCASE, 0.06em tracking.
- **Arrow label** (`.t-sans .t-arrow`): Source Sans 13px, toned gray, lower-case verb phrase, at most two lines.
- **Note** (`.t-note`, `.t-note-mono`): 12px 500, heading color, beside a status glyph.
- **Step numeral** (`.t-step`): Roboto Mono 12px 700, white.

Separator in compact labels: `·`. SVG has no text wrapping: break lines yourself with separate `<text>` elements, 14–18 units apart.

## Layout

- **Author at 1:1**: viewBox units equal pixels at the intended size, so 12–14px text renders at that size. Typical widths 240–1100.
- **Reading direction:** left → right for sequences; top → bottom for hand-offs. The external system that starts a flow sits top-center; supporting services in an evenly spaced row under the main container, joined by dashed links.
- **Center lines:** the key external card and the main container's heading share a vertical center line.
- **Connectors:** straight lines or orthogonal polylines; one dashed cubic curve for a loop-back (`.arrow-changes`). Arrowheads are separate filled triangle polygons, 10 wide × 9 long; run the line ~2px past the head's base so it tucks under it, tip on the target edge.
- **Labels never collide** with lines, borders or other labels. Arrow labels sit beside the segment: left of verticals with `text-anchor="end"`, above horizontals with `text-anchor="middle"`. Group labels centered at the top, or bottom-centered where an arrow enters from the top. Widen gaps before adding a line break.
- **Numbered flow:** a step badge beside each arrow label on the main path, in causal order. The `<desc>` spells out each step.
- **Few boxes:** one box per real boundary; "many of" becomes a stack, not N boxes.

## Elevation & Depth

Flat. Hierarchy comes from nesting and stroke color: main container (colored, tinted) › group (gray dashed, white fill) › node (colored stroke, pale fill). "Many of" is a stack of 2–3 copies offset 8 units up-right (`.box-stack-*`). Things out of reach are drawn in muted text (`.t-ghost`), not removed.

## Shapes

- Inner nodes `rx="4"`; cards and groups `rx="6"`; main containers and frames `rx="8"`.
- Review gate: diamond polygon, 92 × 68.
- Step badge: circle `r="10"`, numeral baseline at `cy + 4`.
- **Dashed means logical or soft:** groups (5 4), soft boundary (6 5), loop-back (6 4), supporting links (3 3), and an item that **doesn't fit**, drawn dashed *outside* the frame it overflows.

## Components

**Node inside a group**
```svg
<rect x="540" y="210" width="260" height="250" rx="6" class="box-ns"/>
<text x="670" y="232" text-anchor="middle" class="t-mono t-ns">group: name</text>
<rect x="570" y="252" width="200" height="52" rx="4" class="box-agent"/>
<text x="670" y="274" text-anchor="middle" class="t-mono t-body">node name</text>
<text x="670" y="292" text-anchor="middle" class="t-sans t-small">descriptor</text>
```
A single-line node is 44 tall with the name at `y + 27`.

**Agent arrow with label and step badge**
```svg
<polyline points="723,210 723,80 561,80" class="arrow arrow-agent"/>
<polygon points="561,75 552,80 561,85" class="head-agent"/>
<text x="637" y="72" text-anchor="middle" class="t-sans t-arrow">verb phrase</text>
<circle cx="637" cy="98" r="10" class="step"/>
<text x="637" y="102" text-anchor="middle" class="t-mono t-step">1</text>
```
A gray arrow uses `class="arrow"` and `class="head"`.

**Card with icon** (28×28 icon centered above the name)
```svg
<rect x="315" y="36" width="230" height="88" rx="6" class="box-ext"/>
<svg x="416" y="48" width="28" height="28" viewBox="0 0 24 24" class="ic-mono"><!-- icon paths --></svg>
<text x="430" y="96" text-anchor="middle" class="t-mono t-label">Name</text>
<text x="430" y="113" text-anchor="middle" class="t-sans t-small">descriptor</text>
```

**Supporting link** (no arrowhead)
```svg
<line x1="125" y1="627" x2="125" y2="669" class="link"/>
<circle cx="125" cy="627" r="3" class="link-dot"/>
<circle cx="125" cy="669" r="3" class="link-dot"/>
```

**Gate and loop-back**
```svg
<polygon points="359,77 405,43 451,77 405,111" class="box-gate"/>
<path d="M405,111 C405,146 235,146 235,100" class="arrow arrow-changes"/>
<polygon points="230,102 235,93 240,102" class="head"/>
```

### Iconography

- **Concepts:** Lucide line icons (24 viewBox, `stroke-width="2"`, `currentColor`), colored by role (`.ic-local`, `.ic-agent`, `.ic-muted`). 22px inline, 28px on cards, 20px beside a heading.
- **Products:** Simple Icons brand marks in `currentColor` (`.ic-mono`); Kubernetes in its blue (`.ic-k8s`).
- **Vendor service icons:** full-color, 28×28 on supporting cards. The labels stay generic.
- **Status glyphs**, drawn as paths and paired with a `.t-note`:
  - Warning, top at `(cx, y)`: `<path d="M{cx},{y} L{cx+8.5},{y+14.5} L{cx-8.5},{y+14.5} Z" class="warn"/>`, a `.warn-mark` bar 1.6×5.6 at `(cx-0.8, y+4.5)` and dot r 0.95 at `(cx, y+12.2)`.
  - Lock, body top-left `(x, y)`: shackle `M{x+3.5},{y} V{y-3.5} a4,4 0 0 1 8,0 V{y}` (`.ok-shackle`), body 15×11 `rx="2"` (`.ok`), keyhole r 1.6 at `(x+7.5, y+5.5)` (`.ok-mark`).
  - Blocked: dotted `.blocked` line ending in a 12×12 `.cross` X.

### Reference Files

`images/` holds the six supplied reference diagrams as standalone SVGs, each with its own style block. All six were already tracked and byte-identical to the temporary examples when integrated. They use the site's per-diagram class names, which differ slightly from `images/diagram-style.css`; **for new diagrams use `images/diagram-style.css`** and read the examples for geometry, spacing and label placement.

| File | Shows |
|---|---|
| [`boundary.svg`](images/boundary.svg) | two framed panels, warning vs lock, blocked connector |
| [`memory.svg`](images/memory.svg) | rows in a frame, dashed overflow item outside |
| [`two-modes.svg`](images/two-modes.svg) | purple vs teal columns, stacked nodes, shared bar |
| [`loop-dag.svg`](images/loop-dag.svg) | process steps, gate diamonds, dashed loop-back |
| [`credentials.svg`](images/credentials.svg) | cluster, stacks, divider, numbered exchanges |
| [`architecture.svg`](images/architecture.svg) | cluster with groups, supporting row, 7-step flow (vendor icons replaced by comments) |

Known gap: in `two-modes.svg` the box fills stay light in dark mode while text turns white; don't copy that.

New worked example: [`github-configuration.svg`](images/github-configuration.svg), based on the [GitHub configuration reference](architecture/reference/github-configuration.md). Its numbers identify controls, not ordered steps. The dispatch exception, third-party deploy integrations (control 7) and privileged-trigger details stay in the reference to keep the diagram focused.

## Do's and Don'ts

- Do keep text inside boxes to a name plus at most one descriptor line. Don't put lists inside boxes.
- Do color by owner: purple for what I run, teal for autonomous agents and only the arrows they perform.
- Do keep arrow labels toned gray, whatever the arrow's color.
- Do number the main flow in causal order when order matters, and narrate it in `<desc>`.
- Do render the file in light and dark before handing it over, and fix collisions and text under ~12px.
- Don't give third-party products a box color; brand color belongs to icons only.
- Don't use near-black arrows.
- Don't let an arrow cross a label, a group title or another arrow when moving a box avoids it.
- Don't add shadows, gradients (outside vendor icons), background rects or decorative color.
- Don't show "doesn't fit" by dashing the boundary; dash the item and place it outside.

### Validation

- `npx @google/design.md@0.4.0 lint DESIGN.md` — zero errors on 2026-10-21; 13 orphan-token warnings for tokens used in SVG/CSS rather than component references. Keep those tokens for dark mode and status styling.
- `images/github-configuration.svg` checked in Chromium 156 on 2026-10-21: light/dark, direct with web fonts and embedded with fallback fonts; no text collisions or clipping. XML, accessible labels, embedded CSS, guide/skill links and the Claude symlink checked.
- Skill metadata validated with the skill-creator validator. Harness discovery remains unverified (see ADR-011).

### Decision log

| Date | Decision | Tradeoff |
|---|---|---|
| 2026-10-21 | Root `DESIGN.md`; reusable CSS in `images/diagram-style.css`; skill in `.agents/skills/julie-io-diagrams/` | One design source shared by harnesses; follows [ADR-011](architecture/decisions/011-skills-location.md). SVGs duplicate CSS to stay independently embeddable. |
| 2026-10-21 | Reuse the six tracked SVGs in `images/` as references | No duplicate example tree. Keep existing artwork, including its noted dark-mode gap, unchanged. |
| 2026-10-21 | Adopt supplied palette, fonts and geometry; conform token structure to upstream alpha | Visual choices inherited from the supplied guide, not newly evaluated. No UI components: this repo is documentation. |
| 2026-10-21 | Replace GitHub diagram in place, showing the dispatch caveat | Existing embeds update automatically. Control numbers retain their meaning; the diagram does not claim branch filtering prevents dispatch on `main`. |
| 2026-10-21 | Remove the dispatch warning panel from the GitHub diagram at the author's request | Keep the diagram focused on branches and secret placement; the exception remains documented in the source reference. Supersedes the visual scope of the previous decision. |
