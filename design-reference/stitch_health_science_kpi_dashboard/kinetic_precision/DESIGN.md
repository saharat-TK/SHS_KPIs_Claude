---
name: Kinetic Precision
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#424936'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#727a64'
  outline-variant: '#c1cab1'
  surface-tint: '#416900'
  primary: '#416900'
  on-primary: '#ffffff'
  primary-container: '#76b900'
  on-primary-container: '#284400'
  inverse-primary: '#94da32'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#a6a7a7'
  on-tertiary-container: '#3b3d3d'
  error: '#e52020'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aff74e'
  primary-fixed-dim: '#94da32'
  on-primary-fixed: '#102000'
  on-primary-fixed-variant: '#304f00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  primary-dark: '#5a8d00'
  ink: '#000000'
  surface-soft: '#f7f7f7'
  hairline: '#cccccc'
  hairline-strong: '#5e5e5e'
  mute: '#757575'
  stone: '#898989'
  warning: '#df6500'
  success: '#3f8500'
  link-blue: '#0046a4'
typography:
  display-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.25'
  heading-xl:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.25'
  heading-lg:
    fontFamily: Hanken Grotesk
    fontSize: 22px
    fontWeight: '400'
    lineHeight: '1.75'
  heading-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.25'
  body-strong:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.5'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.67'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.43'
    letterSpacing: 0.05em
  caption-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.25'
  utility-xs:
    fontFamily: Hanken Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  section: 64px
  xxl: 32px
  xl: 24px
  lg: 16px
  md: 12px
  sm: 8px
  xs: 4px
  tiny: 2px
---

## Brand & Style

The design system is engineered for the high-stakes environment of health sciences, where data density and clarity are paramount. The aesthetic is "Engineering-Grade Modern," characterized by surgical precision, high-contrast structural hierarchy, and a total absence of decorative fluff. It evokes the feeling of a high-performance laboratory instrument or a sophisticated financial terminal.

The brand personality is authoritative and disciplined. It utilizes a "Sandwich" architecture: deep black navigation and footer chapters frame a pristine, paper-white canvas for the core data interface. Visual interest is generated through rigid grid alignment and a single, electric accent color, rather than illustrative ornamentation.

**Key Stylistic Pillars:**
- **Minimalism & Brutalism Hybrid:** Clean, white-space heavy data regions meet raw, unapologetically angular structural headers.
- **Precision over Approachability:** Sharp corners and hairline strokes signal technical accuracy.
- **High-Contrast Logic:** Interaction states and performance trends are signaled through a singular, high-saturation accent.

## Colors

The palette is rooted in functional high-contrast. The primary chromatic engine is NVIDIA Green, used exclusively for active states, key performance indicators (KPIs), and primary calls to action. 

The background strategy employs "Surface Tiering":
- **Canvas (#FFFFFF):** The main body for data tables, charts, and KPI cards.
- **Surface-Soft (#F7F7F7):** Used for alternating row zebra-striping and secondary utility bars to maintain legibility in high-density layouts.
- **Surface-Dark (#000000):** Reserved for global navigation and footer regions to ground the interface.

Semantic colors (Red, Orange, Success Green) are strictly reserved for status-driven data points. Do not use these for general UI chrome.

## Typography

This system uses **Hanken Grotesk** as a high-fidelity alternative to technical sans-serifs, providing the necessary sharpness for dense data environments. 

Hierarchy is established through weight and scale rather than color. Bold (700) is the default for all interactive labels and titles, while Regular (400) is reserved for narrative body text and descriptive metadata. 

For the KPI Dashboard:
- Use `display-lg` for primary metric values.
- Use `label-md` (Uppercase) for category eyebrows and table headers.
- Use `utility-xs` for technical units and legal fine print.
- On mobile, `display-xl` should scale down to `heading-xl` (24px) to ensure multi-column data remains visible.

## Layout & Spacing

The layout utilizes a **12-column structured editorial grid** for desktop, optimized for multi-pane dashboard layouts. 

- **Grid:** 24px gutters (`xl`) and 32px side margins (`xxl`) on desktop. 
- **Rhythm:** A strict 8px base unit governs all layout spacing, while 2px and 4px increments are used for internal component details (e.g., input padding or icon-to-text spacing).
- **Responsive Behavior:** 
    - **Desktop:** 12-column. Complex KPI cards can span 3, 4, or 6 columns.
    - **Tablet:** 6-column. Gutter reduces to 16px. Cards reflow to 2-up.
    - **Mobile:** 2-column. All metrics stack vertically. Margins reduce to 16px.

Vertical spacing between major content modules is a fixed 64px, creating a rhythmic "breathing room" between dense data sets.

## Elevation & Depth

This design system is intentionally flat. Depth is communicated through color blocking and hairlines rather than shadows.

- **Tonal Layering:** Use `#f7f7f7` backgrounds to group related information within the `#ffffff` canvas.
- **Outlines:** All cards and data containers use a 1px solid hairline (`#cccccc`). On dark backgrounds, use the stronger `#5e5e5e` hairline.
- **Shadow Exception:** A single, subtle shadow (`0 0 5px 0 rgba(0,0,0,0.1)`) is permitted exclusively for sticky navigation bars to signal that they float above the content during scroll. 
- **Active State:** Depth is indicated by color change to Primary Green, never by "lifting" the element via shadow.

## Shapes

The shape language is defined by **Angular Geometry**. To maintain an "engineering-grade" feel, rounding is kept to a functional minimum.

- **Interactive Elements:** Buttons, form inputs, and cards must use a 2px (`sm`) corner radius. This is soft enough to avoid visual "sharpness" in peripheral vision but remains disciplined.
- **Structural Chrome:** Top navigation, footer blocks, and full-width hero sections use 0px (Sharp) corners.
- **The Corner Square:** The signature brand motif is a 12px x 12px solid Primary Green square anchored to the top-right corner of primary KPI containers.
- **Avatars:** User profiles are the only element allowed a circular (9999px) shape.

## Components

### Buttons
- **Primary:** Solid `#76b900` background, white text, 2px radius, 44px height. Hover: `#5a8d00`.
- **Secondary/Ghost:** 1px hairline `#cccccc` border, black text. Hover: `#f7f7f7` background.
- **Pill Tabs:** `button-sm` type, 1px border, 2px radius. Active state uses green text and a 2px green bottom border.

### KPI Cards
- **Structure:** White background, 1px `#cccccc` border, 2px radius.
- **Signature:** 12px Green square in the top-right corner.
- **Content:** Headline-md for the title, Display-lg for the primary metric, and Body-sm for the trend description.

### Input Fields
- **Default:** 1px solid `#cccccc` border, 2px radius, 12px horizontal padding. 
- **Focus State:** 1px solid `#76b900` border with a subtle 1px internal inset.

### Data Tables
- **Header:** `#000000` background with white `label-md` text.
- **Rows:** Alternating `#ffffff` and `#f7f7f7`. 1px horizontal dividers only.
- **Indicators:** Performance trends (up/down) use semantic Green/Red icons next to the value.

### Chips & Badges
- **Status Badges:** Small 2px radius rectangles with light tinted backgrounds and bold semantic text (e.g., Light Red background for "Critical" status).