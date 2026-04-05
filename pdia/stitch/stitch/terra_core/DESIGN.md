```markdown
# Design System Document: Precision Agriculture & Organic Sophistication

## 1. Overview & Creative North Star: "The Digital Agronomist"
This design system moves beyond the standard "utility app" aesthetic to create a high-end, editorial experience for smart agriculture. The Creative North Star is **The Digital Agronomist**: a persona that is authoritative, grounded, and exceptionally clear.

To break the "template" look common in ag-tech, we employ **Organic Brutalism**. This means combining the rugged, earthy reliability of the primary palette with a sophisticated, asymmetrical layout. We prioritize massive white space, overlapping tonal layers, and a hierarchy that feels like a premium data journal rather than a cluttered dashboard. By rejecting standard 1px borders and rigid grids, we create a fluid, breathable interface that remains performant on low-end devices while looking world-class.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
Our palette is rooted in the earth but refined through digital precision. We use Material Design tokens to create a system that feels alive and atmospheric.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts or subtle tonal transitions. 
*   *Instead of a border:* Place a `surface-container-low` card atop a `surface` background.
*   *The Result:* A UI that feels cohesive and expansive, not boxed in.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine linen paper.
*   **Base:** `surface` (#f7faf5) for the widest layout areas.
*   **Depth 1:** `surface-container-low` (#f1f4ef) for secondary sidebars or grouping elements.
*   **Depth 2 (Focus):** `surface-container-lowest` (#ffffff) for primary data cards and input fields to make them "pop" forward.

### The "Glass & Gradient" Rule
To add soul to the interface:
*   **Gradients:** Use a subtle linear gradient from `primary` (#154212) to `primary-container` (#2d5a27) for Hero CTAs and high-level weather widgets.
*   **Glassmorphism:** For floating mobile menus or top navigation, use the `surface` color at 80% opacity with a `backdrop-filter: blur(12px)`. This keeps the user connected to the "soil" (the content) beneath the UI.

---

## 3. Typography: Editorial Authority
We utilize two typefaces to balance character with readability. **Manrope** provides a modern, geometric technicality for displays, while **Inter** ensures maximum legibility for data-heavy agricultural metrics.

| Level | Token | Font | Size | Weight | Intent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Manrope | 3.5rem | 700 | Large weather metrics or field yield totals. |
| **Headline** | `headline-md` | Manrope | 1.75rem | 600 | Page titles and major section headers. |
| **Title** | `title-lg` | Inter | 1.375rem | 600 | Card titles and modal headers. |
| **Body** | `body-lg` | Inter | 1.0rem | 400 | General descriptions and instructional text. |
| **Label** | `label-md` | Inter | 0.75rem | 500 | Form labels and metadata tags. |

**Editorial Contrast:** Use `display-lg` in `on-primary-fixed-variant` (#23501e) against a `surface-container-highest` background to create a "magazine-style" header that feels premium and intentional.

---

## 4. Elevation & Depth: Tonal Layering
We move away from shadows as a crutch, using color theory to imply height.

*   **The Layering Principle:** Rather than "lifting" an object with a shadow, "recede" the background. Place a white `surface-container-lowest` card on a `surface-dim` (#d8dbd6) background for an immediate, clean sense of focus.
*   **Ambient Shadows:** If a floating element (like a FAB) is required, use a high-spread, low-opacity shadow: `rgba(25, 28, 26, 0.06)` with a 20px blur. This mimics natural light over a field, avoiding the "dirty" look of standard shadows.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-glare outdoor environments), use the `outline-variant` (#c2c9bb) at 15% opacity. It should be felt, not seen.

---

## 5. Components: Tactile & High-Clarity

### Buttons (High-Touch Target)
*   **Primary:** Solid `primary` (#154212) with `on-primary` text. Min-height: 56px for gloved hands. Corner radius: `lg` (0.5rem).
*   **Secondary:** `secondary-container` (#fdcdbc) with `on-secondary-container` (#795548). This provides an earthy, soil-toned alternative for secondary actions.
*   **Tertiary:** Transparent background with `on-surface` text and a `title-sm` font weight.

### Data Cards
*   **Style:** No borders. Background: `surface-container-lowest`. 
*   **Spacing:** Minimum 24px internal padding. 
*   **Data Visualization:** Use `tertiary` (#003c60) for weather-related data and `primary` for crop-related data. Never use divider lines; separate content with 16px of vertical white space.

### Status Indicators (Alerts)
*   **Urgent:** `error_container` (#ffdad6) background with `on-error-container` (#93000a) text.
*   **Active/Safe:** `primary_fixed` (#bcf0ae) background with `on-primary-fixed` (#002201) text.

### Weather Components (Atmospheric Widgets)
*   Unique to this system, weather cards should use a subtle vertical gradient of `tertiary_container` to `surface`. This distinguishes environmental data from agricultural management data.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical spacing. Allow a wider left margin (e.g., 32px) than right margin (e.g., 16px) on tablet views to create an editorial feel.
*   **Do** use `primary-fixed-dim` for inactive toggle states to maintain the "earthy" vibe without defaulting to cold greys.
*   **Do** prioritize Inter for all numbers and data points to ensure "8" and "0" are never confused in low-light field conditions.

### Don’t
*   **Don’t** use pure black (#000000). Use `on-surface` (#191c1a) for all text to keep the contrast natural and reduce eye strain.
*   **Don’t** use "Card Shadows" on every element. If every card has a shadow, nothing is important. Use tonal shifts first.
*   **Don’t** use standard "Information Blue" for alerts. Use the `tertiary` (#003c60) sky-blue range to keep the color story consistent with agriculture and weather.

---

## 7. Signature Texture: The "Grain"
To bridge the gap between high-tech and high-touch, we suggest a subtle 2% noise/grain texture overlay on large `primary` or `secondary` background areas. This removes the "plastic" feel of digital color and gives the platform a tactile, organic quality reminiscent of the earth it manages.```