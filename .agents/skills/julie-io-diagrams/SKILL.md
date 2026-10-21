---
name: julie-io-diagrams
description: Create or revise standalone SVG architecture and process diagrams in this repository's julie.io style, using DESIGN.md and the shared diagram stylesheet.
---

# julie.io diagrams

Paths below are relative to the repository root (three levels above this skill directory).

1. Read [DESIGN.md](../../../DESIGN.md) for role colors, geometry and the SVG contract. Read the diagram's source document before deciding what it claims; keep caveats and unverified claims visible.
2. Choose the closest reference in its **Reference Files** table. Reuse geometry and label placement; new artwork uses [images/diagram-style.css](../../../images/diagram-style.css), since legacy class names differ.
3. Plan the reading direction and label positions. Write to `images/` and embed from the relevant document. Use a descriptive `<title>` and `<desc>`, class-based styling, polygon arrowheads and the full shared CSS in CDATA. Keep enough room for fallback fonts when embedded as an image.
4. Render in light and dark, both opened directly and embedded through `<img>` without network fonts. Check collisions, clipping and readable text at intended size. Report any rendering checks unavailable in the environment.
5. Keep new visual decisions and their tradeoffs in the design guide's decision log. Do not change technical claims merely to simplify the picture.
