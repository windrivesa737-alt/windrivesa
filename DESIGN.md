---
name: WinDriveSA Master Design System
colors:
  surface: '#f7f9ff'
  surface-dim: '#d1dbe9'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e4effd'
  surface-container-high: '#dfe9f7'
  surface-container-highest: '#d9e3f1'
  on-surface: '#121c26'
  on-surface-variant: '#44474c'
  inverse-surface: '#27313c'
  inverse-on-surface: '#e8f2ff'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6074'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0a1d2e'
  on-primary-container: '#74859b'
  inverse-primary: '#b6c8df'
  secondary: '#785900'
  on-secondary: '#ffffff'
  secondary-container: '#fcc019'
  on-secondary-container: '#6c5000'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00210a'
  on-tertiary-container: '#26974d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fc'
  primary-fixed-dim: '#b6c8df'
  on-primary-fixed: '#0a1d2e'
  on-primary-fixed-variant: '#37485b'
  secondary-fixed: '#ffdf9d'
  secondary-fixed-dim: '#f9bd14'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5b4300'
  tertiary-fixed: '#8ef9a4'
  tertiary-fixed-dim: '#71dc8a'
  on-tertiary-fixed: '#00210a'
  on-tertiary-fixed-variant: '#005324'
  background: '#f7f9ff'
  on-background: '#121c26'
  surface-variant: '#d9e3f1'
typography:
  display-hero:
    fontFamily: Sora
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Sora
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Sora
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-zar-val:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-caps:
    fontFamily: Manrope
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  tabular-stat:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an architectural bridge between high-spec automotive precision and institutional wealth governance. Tailored specifically for the South African market, it articulates ambition, transparent opportunity, and tangible empowerment without relying on flash-in-the-pan gimmicks, neon lights, or speculative casino tropes. 

The emotional posture is resolute, aspirational, and deeply grounded:
- **Tone:** Authoritative, architectural, aspirational, and immutably honest.
- **Design Movement:** Modern Precision Editorial with Financial Dashboard rigor. It marries full-bleed photographic dynamism (vehicle silhouettes, engineered details) with hyper-structured typography, micro-borders, and high-density metric modules.
- **Cultural Subtext:** Subtle South African prestige—grounded in rich mineral golds, authentic national emerald tones, and resilient deep ocean navies, steering entirely clear of tourist kitsch or superficial graphics.

## Colors

The palette balances the commanding weight of Deep Navy and Charcoal against the vibrancy of South African Emerald and Warm Mineral Gold. It avoids synthetic, overly saturated SaaS hues in favor of rich, terrestrial, and metallurgic tones.

### Functional Roles
- **Primary (`#071A2B` - Deep Navy):** Dominates structural headers, primary high-intent action triggers, dark container backdrops, and navigation scaffolding. Conveys executive permanence.
- **Secondary (`#F2B705` - Mineral Gold):** Used with surgical discipline for verified badges, draw deadlines, campaign status flags, and key accents. Never applied to large backgrounds; strictly deployed for value inflection points.
- **Tertiary (`#00843D` - SA Emerald):** Deployed for verified trust markers, compliance confirmations, positive valuation deltas, and live entry counters.
- **Neutral Core (`#17212B` - Charcoal):** Primary typographic read color for maximum legibility on light backgrounds; doubles as subtle elevated surface contrast.
- **Canvas & Surface (`#F5F7FA` - Crisp Surface):** Calibrated neutral light foundation that provides clean contrast against both heavy charcoal typography and full-bleed automotive assets.
- **Muted Elements (`#667085` - Slate Muted):** Secondary metadata, inactive states, table headers, and micro-labels.
- **Structural Lines (`#D9E0E7` - Hairline Border):** Crisp, uniform 1px structural framing across dashboard cards and interactive fields.

## Typography

The type system pairs the confident, engineered geometry of **Sora** with the pristine analytical utility of **Manrope**.

### Typographic Rules & Numerical Rigor
- **Tabular Numerals (`font-variant-numeric: tabular-nums`):** Mandatory for all currency amounts (e.g., `R250,000`, `R1,850,000`), countdown clocks, ticket allocation counts, and odds metrics. Decimal places and comma separators retain exact vertical alignment across rows and dashboard widgets.
- **Editorial Asymmetry:** Large display sizes in Sora make intentional use of tight negative tracking (`-0.02em` to `-0.03em`) to mimic premium print and luxury motoring journals.
- **Uppercase Utility Markers:** Sub-headers, audit statuses, and asset category tags strictly utilize `label-caps` in uppercase with expanded kerning (`0.08em`), establishing visual anchoring above major data cards.

## Layout & Spacing

The architecture operates on an 8-point harmonic rhythm within a robust 12-column grid format (collapsing to 6 columns on tablet and 4 columns on mobile).

### Layout Geometry
- **Asymmetric Tension:** Primary dashboards contrast large-span (8-column) panoramic vehicle photography modules against narrow (4-column) financial transaction and verification ledgers.
- **Full-Bleed Viewports:** Vehicle showcase headers break standard canvas gutters horizontally while aligning all text and control metadata strictly to the interior 12-column track.
- **Density Scaling:**
  - **Desktop (1440px+):** 2.5rem outer canvas margins with 1.5rem gutters. Strict baseline grid compliance for side-by-side metric tiles.
  - **Tablet (768px – 1024px):** 1.5rem margins and gutters. Financial tables transition to horizontal scroll views with frozen primary identifier columns.
  - **Mobile (320px – 767px):** 1rem margins and gutters. Actions switch to fixed bottom bar sheets; cards snap edge-to-edge with 12px internal breathing room.

## Elevation & Depth

This design system avoids soft, floating cloud-like shadows in favor of structured architectural depth and disciplined border containment.

### Surface Stratification
1. **Ground Base (`#F5F7FA`):** Inactive structural page canvas.
2. **Floor Level (`#FFFFFF`):** High-density functional cards, transactional ledgers, and input blocks framed with a crisp `1px solid #D9E0E7` border.
3. **Elevated Overlays (`#FFFFFF` + Tinted Ambient Occlusion):** Used exclusively for active dropdown menus, contextual inspection panels, and transaction dialogs. Shadow formula: `0 4px 16px -2px rgba(7, 26, 43, 0.06), 0 1px 3px 0 rgba(7, 26, 43, 0.04)`.
4. **Deep Anchor Surfaces (`#071A2B`):** Inverted dark modules dedicated to grand prize reveals, VIP allocation panels, and system summaries. Dark elevation is achieved by layering `#17212B` interior borders with 1px gold hairline rules (`rgba(242, 183, 5, 0.25)`) rather than drop shadows.

## Shapes

The shape grammar adheres to an uncompromising, machine-tooled standard. 

- **Corner Radii:** Strictly locked between **4px** (`rounded-sm` / base) and **8px** (`rounded-lg` / large containers).
- **Philosophical Basis:** Rounded pill buttons and heavy bubbling corners (`>12px`) undermine authority and evoke mobile games. The restrained 4–8px radius mimics brushed metal fabrication, luxury automotive console switchgear, and sovereign banking interfaces.
- **Internal Nesting:** A parent container with an 8px radius must encase child interactive targets with an exact 4px radius, preserving uniform boundary math throughout.

## Components

### Buttons & Intent Triggers
- **Primary CTA:** Deep Navy (`#071A2B`) background with crisp White (`#FFFFFF`) typography in Sora 14px Semi-Bold. 4px corner radius, 0px border. Hover transition shifts background to `#17212B` with a subtle `2px` inset bottom accent of Mineral Gold (`#F2B705`).
- **High-Prestige / Winning CTA:** Mineral Gold (`#F2B705`) background with Deep Navy (`#071A2B`) typography. Reserved strictly for primary submission phases and key vehicle prize claims.
- **Secondary / Audit Button:** 1px hairline border in `#D9E0E7` on white background, Charcoal text. Hover fills to `#F5F7FA`.

### Asset & Entry Cards
- **Automotive Showcase Cards:** Horizontal split or asymmetric 60/40 vertical layout. Photographic upper zone features edge-to-edge framing with no inset padding; lower data deck contains vehicle technical specifications, guaranteed retail valuation (in bold `Sora` with ZAR tabular numerals), and live verification indicators.
- **Data Boundary:** Always bounded by a 1px solid `#D9E0E7` border. In dark mode or inverted sections, borders shift to `rgba(217, 224, 231, 0.12)`.

### Form Fields & Inputs
- **Base Style:** 44px container height, 4px corner radius, `#FFFFFF` background, 1px solid `#D9E0E7`. 
- **Focus State:** 1px solid `#071A2B` with a sharp `0 0 0 2px rgba(7, 26, 43, 0.12)` halo.
- **Prefix Anchors:** Dedicated prefix segments for South African currency (`R`) and country codes (`+27`), rendered in `#667085` with tabular spacing and a subtle right border divider.

### Chips & Verification Badges
- **Audited / Verified Chip:** Emerald (`#00843D`) background at 10% opacity, solid `#00843D` text, 4px radius, 11px uppercase `label-caps`. Features a 6px solid emerald status dot.
- **Draw Status / Countdown Tag:** Deep Navy (`#071A2B`) background with Mineral Gold text. Tabular numerals for second-by-second countdowns.

### Lists & Ledger Rows
- **Financial Transaction Tables:** Alternating rows eliminate alternating striped zebra fills, relying instead on clean 1px bottom border separators (`#D9E0E7`). Numeric columns right-align; text columns left-align. Font sizing locked to `Manrope 14px` with mandatory tabular alignment for all South African Rand (ZAR) amounts.