# SemantIQ — Approved ASCII Branding Palette

**Status:** visual-design reference for the SemantIQ README and opt-in terminal logo. This is not a product version or scientific claim.

The user-approved reference uses **blush / warm peach / dusty rose / mauve / lavender / desaturated blue-gray**. Avoid the previous saturated cyan, teal, navy-on-white title styling.

## Fixed original glyph forms

- **Brain:** `packages/python/src/semantiq/assets/semantiq-logo.txt` — existing 27-row compact Unicode brain. The text glyphs and their positions are unchanged in this update.
- **Wordmark:** `packages/python/src/semantiq/assets/semantiq-wordmark.txt` — original eight-line `SemantIQ` block-character wordmark supplied by the project owner. Do not replace it with a typeset font.
- **README:** `Docs/branding/semantiq-brain-compact.svg` renders these exact glyph lines with monochrome Unicode characters and a color gradient. No raster text or image generation is used in the repo.
- **CLI:** combines the exact brain and wordmark files with one empty separator line. Color is only an ANSI presentation layer and never appears in piped text by default.

## Terminal ink palette

| Slot | RGB | Hex | Character |
| --- | --- | --- | --- |
| Warm blush | 255, 178, 174 | `#ffb2ae` | left |
| Rose pink | 252, 167, 185 | `#fca7b9` | |
| Dusty rose | 225, 166, 197 | `#e1a6c5` | |
| Mauve | 198, 170, 211 | `#c6aad3` | |
| Slate lavender | 160, 179, 204 | `#a0b3cc` | |
| Blue-gray highlight | 147, 176, 194 | `#93b0c2` | right |

These tones are selected to visually approximate the approved mockup/reference photo; they are **brand-design tokens**, not scientifically measured colors. SVG uses closely related gradient stops for legibility against its background.

## Browser and terminal surfaces

The SVG background blends muted blue-gray `#536a70`, dusty mauve `#a9828e`, warm rose `#d29a9f`, and slate `#56687c`, with gentle peach `#f9b6a7` bloom.

The CLI deliberately does not print a background color: it needs to remain legible under arbitrary terminal themes. `--color=auto` requires a TTY and honors `NO_COLOR` / `TERM=dumb`; `--color=always` is an explicit override.

## Integration and guardrails

Website design may reuse these colors in a future separate PR; this change does **not** edit website components or imply a web-theme release.

README and CLI always display the original SemantIQ ASCII title. No benchmark execution, evidence, qualification, agent operation, telemetry, provider request, scientific promotion, or release is tied to the logo.
