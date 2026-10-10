# SemantIQ — Chrome/Silver Brand Palette

**Scope:** README and opt-in terminal logo. This is a visual-design reference, not a benchmark maturity or scientific claim.

## Two independent color layers

The user-supplied reference shows a **metallic grayscale brain** (black/shadowed grooves, graphite, steel gray and silver-white highlights) over a **muted blush / mauve / dusty-rose / blue-gray background**. The warm colors belong to the atmosphere; do not recolor the brain or SemantIQ wordmark pink.

The SVG uses the original UTF-8 block-character shapes, **not a substituted font-shaped logo**. Browser glyph rasterization and exact chrome reflections cannot match the photographic reference pixel for pixel.

## Foreground — metallic icon and original ASCII title

| Surface | Hex examples | Purpose |
| --- | --- | --- |
| Deep outline | `#263039` | Dark grooves and ASCII definition |
| Graphite | `#657078` | Metallic contrast |
| Mid silver | `#a7aeb4` | Cool steel variation |
| Silver highlight | `#f7f8f7` | Brain bright highlights |
| Pearl white | `#ffffff` | Original SemantIQ wordmark |
| Pearl-gray | `#d5d9dc` | White title shading |

These are grayscale / low-saturation chrome tones, not blue, pink or teal branding ink.

## Background — warm reference atmosphere

| Location | Hex | Purpose |
| --- | --- | --- |
| Left | `#536c70` | Muted slate / gray-teal |
| Early blend | `#ad8b94` | Dusty mauve |
| Center | `#daa8a5` | Warm rose haze |
| Right-center | `#d5a1a7` | Blush |
| Right edge | `#576274` | Smoky blue-gray |
| Ambient light | `#ffd3c6` | Subtle peach bloom |

## CLI presentation: neutral silver ANSI ink

The CLI cannot reliably detect the user's terminal background. Therefore colored output uses **medium-to-bright gray** rather than very dark shadow colors that would disappear on dark terminals. Six RGB segments run left-to-right in both Python and Node: `247;249;250`, `216;223;228`, `151;162;172`, `249;250;250`, `187;198;205`, `241;244;246`.

`--color=auto` is enabled for interactive TTY only and honors `NO_COLOR` / `TERM=dumb`. `--color=never` produces byte-for-byte original text and is the recommended accessible fallback in light terminal themes. No background ANSI escapes are injected.

## Original glyph integrity and future usage

- Brain glyph source: `packages/python/src/semantiq/assets/semantiq-logo.txt` — 27 rows, **unchanged**.
- Original SemantIQ title source: `packages/python/src/semantiq/assets/semantiq-wordmark.txt` — 8 rows, **unchanged**.
- README SVG: `Docs/branding/semantiq-brain-compact.svg` — the same literal glyph lines, adjusted spacing/contrast.
- Website theme: may reuse these tokens **only in a separately reviewed future change**.

Previous branding PRs #185, #186 and #187 are preserved as normal immutable project history; this correction supersedes their **visual palette**, not their historical records.
