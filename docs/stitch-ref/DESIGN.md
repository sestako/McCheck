# Design System Documentation: The Forest Minimalist

## 1. Overview & Creative North Star: "The Digital Atrium"
This design system is built upon the philosophy of **"The Digital Atrium"**—a space defined by light, air, and organic structure. We are moving away from the "boxed-in" nature of traditional enterprise software to create an experience that feels like a premium Apple native application.

The goal is to evoke a sense of **quiet authority**. We achieve this by prioritizing negative space over containment, tonal depth over structural lines, and intentional asymmetry to guide the eye. By leveraging the depth of Forest Green (#007A5E) against a sophisticated palette of off-whites and cool greys, we create a UI that breathes.

## 2. Colors & Surface Architecture
Our palette is rooted in nature and prestige. The primary Forest Green is not just a brand color; it is a signal of "action" and "growth."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or subtle tonal transitions.
- **Surface-to-Surface Transition:** Place a `surface-container-low` card on a `surface` background to define its edge.
- **Separation:** Use vertical whitespace from the spacing scale rather than `<hr>` or divider lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of fine vellum.
- **Base Layer:** `surface` (#f9f9fe).
- **Secondary Sectioning:** `surface-container-low` (#f3f3f8).
- **Interactive Elements/Cards:** `surface-container-lowest` (#ffffff) to provide "pop" against the lower tiers.
- **Top Bar/Navigation:** Use `surface-bright` with a 80% opacity and a 20px backdrop blur to create a premium glassmorphic feel.

### The "Glass & Gradient" Rule
Standard flat buttons are insufficient for a "Professional Universal" aesthetic. 
- **CTAs:** Use a subtle linear gradient from `primary` (#005f48) to `primary-container` (#007a5e) at a 135-degree angle. This adds "soul" and a tactile, curved appearance.
- **Notifications:** Use `surface-container-lowest` at 60% opacity with `backdrop-filter: blur(16px)`. This ensures notifications feel like they are floating in the user's space, not stuck to the grid.

## 3. Typography: Editorial Precision
We utilize **SF Pro** (system-ui) for its unmatched legibility and native Apple feel. The hierarchy is designed to feel like a high-end architectural magazine.

- **Display & Headlines:** Use `headline-lg` (2rem) for page titles. Use `title-lg` (1.375rem) for section headers. Ensure headers have ample top-margin to "own" the white space below them.
- **Body:** `body-lg` (1rem) is our workhorse. Use `on-surface-variant` (#3e4944) for secondary body text to reduce visual noise.
- **Labels:** `label-md` (0.75rem) should always be in `caps` or `semi-bold` to distinguish from body copy, used sparingly for metadata.

## 4. Elevation & Depth: Tonal Layering
Depth is conveyed through light and shadow, mimicking a natural environment.

- **The Layering Principle:** Place `surface-container-lowest` elements on top of `surface-container` to create a soft lift. 
- **Ambient Shadows:** Standard shadows are forbidden. When an element must "float" (e.g., a modal or notification), use a shadow with a 40px blur, 0px offset, and 5% opacity of the `on-surface` color. It should feel like a soft glow, not a dark smudge.
- **The "Ghost Border" Fallback:** In rare accessibility cases where a border is required, use `outline-variant` (#bdc9c2) at **15% opacity**. It should be felt, not seen.

## 5. Components

### Navigation: The Signature Top Bar
- **Layout:** A fixed `surface-bright` bar with a `backdrop-blur`. 
- **Icons:** Profile icon (Left) and History icon (Right). Use 24px stroke-based icons with a 1.5pt weight. Avoid filled icons unless in an "active" state.

### Buttons & Inputs
- **Primary Button:** `primary` gradient, `roundness-md` (0.75rem), white text.
- **Secondary/Ghost Button:** No background. Use `primary` color for text.
- **Input Fields:** `surface-container-low` background, no border. On focus, transition the background to `surface-container-lowest` and add a subtle `primary` inner glow.

### Cards & Lists
- **The Forbidden Divider:** Never use a line to separate list items. Use 16px of vertical padding and a subtle hover state shift to `surface-container-high`.
- **Roundedness:** All cards must use `roundness-lg` (1rem) to maintain the "Apple Professional" softness.

### Glassmorphic Banners
- **Style:** Notifications and alerts must use a `surface-container-lowest` base with 70% opacity and 24px backdrop blur. 
- **Placement:** Floating 20px from the top or bottom edge, never spanning the full width of the screen.

## 6. Do’s and Don’ts

### Do
- **Do** use intentional asymmetry. A left-aligned header with a right-aligned "History" icon creates a sophisticated editorial balance.
- **Do** maximize white space. If a layout feels "full," remove an element or increase the padding.
- **Do** use `primary` (#005f48) as a surgical strike—use it for the most important action on the screen and nowhere else.

### Don't
- **Don't** use pure black (#000000) for text. Use `on-surface` (#1a1c1f).
- **Don't** use 1px dividers or high-contrast borders.
- **Don't** use standard "Material Design" shadows. Keep elevations tonal and soft.
- **Don't** crowd the Top Bar. Keep the center clear to let the content breathe.