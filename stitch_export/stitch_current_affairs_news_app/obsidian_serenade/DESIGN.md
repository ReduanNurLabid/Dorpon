---
name: Obsidian Serenade
colors:
  surface: '#101413'
  surface-dim: '#101413'
  surface-bright: '#363a39'
  surface-container-lowest: '#0b0f0e'
  surface-container-low: '#181c1b'
  surface-container: '#1c201f'
  surface-container-high: '#272b2a'
  surface-container-highest: '#323634'
  on-surface: '#e0e3e1'
  on-surface-variant: '#bbcac0'
  inverse-surface: '#e0e3e1'
  inverse-on-surface: '#2d3130'
  outline: '#85948b'
  outline-variant: '#3c4a42'
  surface-tint: '#45dfa4'
  primary: '#5af0b3'
  on-primary: '#003825'
  primary-container: '#34d399'
  on-primary-container: '#00563b'
  inverse-primary: '#006c4b'
  secondary: '#b4ccc1'
  on-secondary: '#20342d'
  secondary-container: '#384d45'
  on-secondary-container: '#a6beb3'
  tertiary: '#ffd165'
  on-tertiary: '#3f2e00'
  tertiary-container: '#eab308'
  on-tertiary-container: '#604700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#68fcbf'
  primary-fixed-dim: '#45dfa4'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#d0e8dd'
  secondary-fixed-dim: '#b4ccc1'
  on-secondary-fixed: '#0a1f19'
  on-secondary-fixed-variant: '#364b43'
  tertiary-fixed: '#ffdf9a'
  tertiary-fixed-dim: '#f7be1d'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#101413'
  on-background: '#e0e3e1'
  surface-variant: '#323634'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 46px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.025em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies mindful curation, calm authority, and radical visual silence. Built for an intelligent, distraction-free modern news sanctuary, it treats news ingestion as a meditative ritual rather than a barrage of sensory noise. The aesthetic bridges hyper-minimalism and organic ambient depth: deep obsidian velvet voids offset by faint, high-atmosphere forest glows, floating frosted glass surfaces, and whisper-quiet typography.

### Design Principles
- **Atmospheric Depth over Borders:** Structure is established via spatial layering, soft luminosity, and backdrop filtration rather than high-contrast dividing lines.
- **Radical Breathing Room:** Embrace the void. At least 40% of the canvas remains unpopulated negative space, ensuring cognitive decompression between daily briefs and editorial deep-dives.
- **Quiet Clarity:** Restraint governs every element. Badges, tags, and active states use delicate optical dots and hairline indicators rather than dense filled capsules or screaming uppercase text.
- **Tactile Softness:** Fluid curves, rounded monolithic glass slabs, and floating navigation pills evoke natural river stones resting smoothly on black velvet.

## Colors

The palette is engineered exclusively around an ultra-dark nocturnal space punctuated by organic forest illumination and subtle status accents.

### Color Tokens
- **Background Canvas (`#0A0E0D`):** Obsidian velvet black. Provides deep, energy-efficient, glare-free grounds.
- **Ambient Forest Glow (`#11261F`):** Deep emerald-forest tone utilized strictly in large, diffused radial gradients (typically `blur(80px)` to `blur(120px)`) positioned behind primary morning greetings, audio hero waves, and top-canvas headers.
- **Primary Accent (`#34D399`):** Luminous soft mint/emerald. Reserved exclusively for micro-interactions: live playback dots, active tab indicator lines, reading progress markers, and primary interactive glyphs.
- **Tertiary Accent (`#EAB308`):** Restrained muted gold. Used strictly for rare context signals, verified bookmarks, curated highlights, and editorial milestones.
- **Surface Translucencies:**
  - `surface-glass`: `rgba(255, 255, 255, 0.04)` with `backdrop-filter: blur(24px)`.
  - `surface-glass-active`: `rgba(255, 255, 255, 0.08)`.
  - `surface-glass-border`: `rgba(255, 255, 255, 0.07)`.
  - `surface-glass-border-focused`: `rgba(52, 211, 153, 0.25)`.
- **Typographic Neutral Hierarchy:**
  - `text-primary`: `#FFFFFF` — clean titles, dominant numbers, primary labels.
  - `text-secondary`: `#8E9F97` — dates, station categories, excerpts, reading duration.
  - `text-tertiary`: `rgba(142, 159, 151, 0.5)` — passive metadata and icon strokes.

## Typography

The type system prioritizes modern geometric grace and quiet hierarchy using **Plus Jakarta Sans**. 

### Guidelines
- **Case Sensitivity:** Use sentence case universally across titles, buttons, status badges, and tabs. Avoid uppercase shouting; hierarchy is created strictly through scale and subtle weight differentiation (400 vs 500/600).
- **Proportional Tracking:** Headlines employ tight negative tracking (`-0.03em` to `-0.01em`) to create a cohesive editorial density on dark glass backgrounds.
- **Reading Comfort:** Body text preserves generous line heights (`1.5` to `1.6`) to prevent visual crowding when users read extended briefs or AI-synthesized summaries.

## Layout & Spacing

Layouts follow a unified fluid grid system with expansive gutters and outer margins tailored for mobile touch ergonomics and generous negative space.

### Structural Rhythm
- **Outer Shell & Safe Zones:** Canvas margins stay locked between `1.25rem` (20px) on compact mobile screens and `2rem` (32px) on larger viewports.
- **Vertical Airflow:** Screen regions are separated by substantial empty height: `2.5rem` to `4rem` of breathing space separates the ambient greeting section from incoming live feeds.
- **Floating Dock Clearance:** All scrollable viewports integrate an automatic bottom offset of `6rem` (96px) to prevent card truncation behind the floating capsule navigation bar.
- **Grid Composition:** 
  - Mobile: Single column or 2-column horizontal card carousels with `0.75rem` gutters.
  - Tablet/Desktop: 4 to 8 column fluid grids with maximum reading container constraints (`680px` max-width for article views).

## Elevation & Depth

Visual planes are built using non-tactile glassmorphism and ambient atmospheric backlights rather than heavy opaque shadows.

### Elevation Hierarchy
- **Base Level (Canvas):** Pure `#0A0E0D` surface with upper atmospheric radial blend `radial-gradient(circle at 50% 10%, #11261F 0%, transparent 65%)`.
- **Level 1 (Cards & Tile Surfaces):**
  - Background: `rgba(255, 255, 255, 0.04)`
  - Backdrop Blur: `24px`
  - Border: 1px continuous solid `rgba(255, 255, 255, 0.07)`
  - Shadow: None or faint ambient diffusion `0 12px 32px rgba(0, 0, 0, 0.4)`
- **Level 2 (Active Mini-Cards & Interactive Modules):**
  - Background: `rgba(255, 255, 255, 0.07)`
  - Backdrop Blur: `32px`
  - Border: 1px continuous solid `rgba(255, 255, 255, 0.12)`
- **Level 3 (Detached Floating Capsule Bar):**
  - Background: `rgba(17, 38, 31, 0.55)` layered over `rgba(255, 255, 255, 0.05)`
  - Backdrop Blur: `40px` (saturate 140%)
  - Border: 1px solid `rgba(255, 255, 255, 0.12)`
  - Shadow: `0 20px 40px rgba(0, 0, 0, 0.6)`

## Shapes

The design system embraces generous, friendly radii that visually soften structural elements into pebble-like forms.

### Corner Radius System
- **Hero & Content Cards:** Fixed `28px` (`1.75rem`) border radius on containers, list groups, and station preview modules.
- **Floating Capsule Docks & Primary Action Bars:** Full pill shape (`9999px` / `3rem`).
- **Icon Circles & Avatar Frames:** Pure circular frames (`50%` / `9999px`).
- **Nested Media Previews:** Internal media thumbnails inside 28px parent cards inherit a synchronized `18px` to `20px` radius to maintain concentric perimeter margins.

## Components

### Buttons & Interactive Controls
- **Primary Capsule Action (e.g., "Join", "Play Daily Brief"):**
  - Height: `52px`. Full pill radius (`9999px`).
  - Surface: `rgba(255, 255, 255, 0.1)` with 1px `rgba(255, 255, 255, 0.15)` border.
  - Interactive state: Subtle emerald glow `0 0 20px rgba(52, 211, 153, 0.2)`.
  - Icon + Typography: White `#FFFFFF`, `14px` weight 500, centered with `8px` gap.
- **Round Action Nodes (Play/Pause, Dismiss, Quick Filter):**
  - Circular buttons (`44px` or `48px`).
  - Fill: `rgba(255, 255, 255, 0.05)` with `rgba(255, 255, 255, 0.1)` border.
  - Glyph: 18px stroke icons in `#FFFFFF` or `#8E9F97`.

### Floating Navigation Capsule
- Detached bottom dock floating `24px` above viewport lower edge.
- Horizontal layout housing core navigation icons (`Home`, `User`, `Plus`) with dynamic expanding pill slots.
- Active tab indicated by a subtle mint `#34D399` under-dot (3px) or frosted white highlight pill.

### Content Cards & Station Previews
- Surface: Frosted glass (`rgba(255,255,255,0.04)`), `28px` corner radius, 1px border (`rgba(255,255,255,0.07)`).
- Padding: `16px` inner padding for medium cards, `20px` to `24px` for parent overview panels.
- Imagery: Edge-to-edge top thumbnail or inner squircle tile with `18px` corners.
- Live Indicator: Small inset glass pill (`rgba(0,0,0,0.5)`) housing a pulsing `#34D399` dot alongside "Live" in sentence case (`11px`, weight 500).

### Lists & Feed Items
- Borderless or divided by ultra-faint hairlines (`rgba(255, 255, 255, 0.05)`).
- Row structure: Left thumbnail (`48px` squircle, 14px radius), center title (`15px` white, max 2 lines) stacked over sage source/timestamp (`13px`), right contextual bookmark icon.

### Form Inputs & Search
- Height: `44px`. Full pill or 20px radius.
- Background: `rgba(255, 255, 255, 0.04)`.
- Placeholder: `#8E9F97` at `14px`.
- Prefix: 16px search glyph in `#8E9F97` with `12px` left inset.
- Active focus: Subtle emerald halo (`border-color: rgba(52, 211, 153, 0.4)`).