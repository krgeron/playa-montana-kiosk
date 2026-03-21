# Playa Montana Kiosk — Style Guide

> Derived from the Playa Montana Beach Hotel main website.
> The kiosk app must feel like a **natural extension** of the resort's brand —
> guests should immediately recognize it as "Playa Montana" when they scan
> a QR code or pick up a shared tablet.

---

## 1. Brand Identity Summary

Playa Montana's visual identity is **coastal elegance** — warm, inviting, and
relaxed but never casual. The design pairs a rich turquoise/teal brand color
with warm cream backgrounds, elegant serif headings, and generous whitespace.
Accents of amber/gold add a touch of warmth and luxury.

**Keywords:** Beachfront, tropical, refined, warm, approachable, clean.

---

## 2. Color Palette

### 2.1 Primary Colors

| Token                  | Hex         | Usage                                                       |
|------------------------|-------------|-------------------------------------------------------------|
| `--color-primary`      | `#4CBEB5`   | Main brand teal — buttons, links, active states, labels     |
| `--color-primary-dark` | `#3AA8A0`   | Hover/pressed states for primary elements                   |
| `--color-primary-light`| `#7DD3CE`   | Subtle highlights, focus rings, icon backgrounds            |
| `--color-primary-50`   | `#E8F6F5`   | Very faint teal wash — backgrounds, selected row highlights |

### 2.2 Accent Colors

| Token                  | Hex         | Usage                                                       |
|------------------------|-------------|-------------------------------------------------------------|
| `--color-accent`       | `#C99A4A`   | Amber/gold accent — premium CTAs, brand emphasis            |
| `--color-accent-dark`  | `#B5873D`   | Hover/pressed states for accent buttons                     |
| `--color-accent-light` | `#E2C68A`   | Subtle gold tints                                           |

### 2.3 Neutral Palette

| Token                      | Hex         | Usage                                                   |
|----------------------------|-------------|---------------------------------------------------------|
| `--color-bg-page`          | `#FAF7F2`   | Main page background — warm ivory/cream                 |
| `--color-bg-card`          | `#FFFFFF`   | Card backgrounds, elevated surfaces                     |
| `--color-bg-muted`         | `#F0ECE4`   | Muted backgrounds — input fields, secondary surfaces    |
| `--color-bg-footer`        | `#1E6B69`   | Footer / dark sections                                  |
| `--color-bg-footer-dark`   | `#175755`   | Footer bottom bar                                       |
| `--color-bg-cta-section`   | `#267D7A`   | CTA banner sections (dark teal)                         |
| `--color-text-primary`     | `#2D3436`   | Primary body text — dark charcoal (never pure black)    |
| `--color-text-secondary`   | `#6B7280`   | Secondary/muted text — gray                             |
| `--color-text-placeholder` | `#9CA3AF`   | Placeholder text in inputs                              |
| `--color-text-on-primary`  | `#FFFFFF`   | Text on teal/dark backgrounds                           |
| `--color-text-on-accent`   | `#FFFFFF`   | Text on amber/gold backgrounds                          |
| `--color-divider`          | `#E5E0D8`   | Dividers, borders, subtle separators                    |

### 2.4 Semantic Colors

| Token                      | Hex         | Usage                                                   |
|----------------------------|-------------|---------------------------------------------------------|
| `--color-success`          | `#22C55E`   | Order confirmed, positive status                        |
| `--color-success-light`    | `#DCFCE7`   | Success background tint                                 |
| `--color-warning`          | `#F59E0B`   | In-progress status, caution states                      |
| `--color-warning-light`    | `#FEF3C7`   | Warning background tint                                 |
| `--color-error`            | `#EF4444`   | Error messages, destructive actions                     |
| `--color-error-light`      | `#FEE2E2`   | Error background tint                                   |

### 2.5 Color Usage Rules

- **Never use pure black (`#000000`)** for text. Always use `--color-text-primary` (`#2D3436`).
- **Never use pure white (`#FFFFFF`)** for page backgrounds. Always use `--color-bg-page` (`#FAF7F2`).
- **Primary teal** is the dominant action color. Use it for primary buttons, active nav indicators, links, and iconography.
- **Amber/gold accent** is reserved for high-emphasis CTAs (e.g., "Place Order", "Reserve") to add warmth. Use sparingly.
- **Dark teal backgrounds** (`--color-bg-footer`, `--color-bg-cta-section`) are used for immersive sections like welcome screens and confirmation pages.

---

## 3. Typography

### 3.1 Font Families

| Role           | Font Family                          | Fallback Stack                           |
|----------------|--------------------------------------|------------------------------------------|
| **Headings**   | `Playfair Display`                   | `Georgia, 'Times New Roman', serif`      |
| **Body**       | `Lato`                               | `'Helvetica Neue', Arial, sans-serif`    |
| **Monospace**  | `'JetBrains Mono', monospace`        | `Menlo, Consolas, monospace`             |

**Loading:** Import both from Google Fonts in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
```

### 3.2 Type Scale

All sizes use `rem` units. Base size is `16px`.

| Token / Class          | Size    | Weight      | Line Height | Usage                                          |
|------------------------|---------|-------------|-------------|-------------------------------------------------|
| `text-display`         | 2rem    | 700 (bold)  | 1.2         | Hero headings (Playfair Display)               |
| `text-heading-1`       | 1.5rem  | 700 (bold)  | 1.3         | Page titles (Playfair Display)                 |
| `text-heading-2`       | 1.25rem | 600 (semi)  | 1.3         | Section headings (Playfair Display)            |
| `text-heading-3`       | 1.125rem| 600 (semi)  | 1.4         | Card titles, category names (Playfair Display) |
| `text-body`            | 1rem    | 400 (reg)   | 1.6         | Standard body text (Lato)                      |
| `text-body-sm`         | 0.875rem| 400 (reg)   | 1.5         | Secondary text, descriptions (Lato)            |
| `text-caption`         | 0.75rem | 400 (reg)   | 1.4         | Captions, metadata, timestamps (Lato)          |
| `text-overline`        | 0.6875rem| 600 (semi) | 1.2         | Section labels — always uppercase, tracked     |
| `text-price`           | 1rem    | 700 (bold)  | 1            | Price displays (Lato)                          |
| `text-price-lg`        | 1.5rem  | 700 (bold)  | 1            | Large price totals (Lato)                      |

### 3.3 Typography Patterns

**Section Overline Label (e.g., "OUR STORY", "ACCOMMODATION", "ROOM DINING"):**
```
font-family: Lato
font-size: 0.6875rem (11px)
font-weight: 600
letter-spacing: 0.15em
text-transform: uppercase
color: var(--color-primary)   /* #4CBEB5 */
```

**Page Title (e.g., "Where Summer Lingers", "Your Order"):**
```
font-family: Playfair Display
font-size: 1.5rem (24px)
font-weight: 700
line-height: 1.3
color: var(--color-text-primary)   /* #2D3436 */
```

**Body Text:**
```
font-family: Lato
font-size: 1rem (16px)
font-weight: 400
line-height: 1.6
color: var(--color-text-primary)
```

**Muted/Secondary Text:**
```
font-family: Lato
font-size: 0.875rem (14px)
font-weight: 400
color: var(--color-text-secondary)   /* #6B7280 */
```

### 3.4 Typography Rules

- **Headings are always Playfair Display** (serif). This gives the resort feel.
- **Body text is always Lato** (sans-serif). Clean and readable on small screens.
- **Never use Playfair Display below 1rem.** Serif fonts become hard to read at small sizes.
- **Overline labels** (category markers, section labels) are always uppercase, letter-spaced, in the primary teal color.
- **Prices** use Lato Bold — never the serif font. Numbers should be `tabular-nums` for alignment.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on a 4px grid:

| Token   | Value  | Usage                                |
|---------|--------|--------------------------------------|
| `xs`    | 4px    | Icon gaps, tight padding             |
| `sm`    | 8px    | Compact element spacing              |
| `md`    | 12px   | Standard element gaps                |
| `base`  | 16px   | Default padding, card internal       |
| `lg`    | 24px   | Section padding, generous gaps       |
| `xl`    | 32px   | Page-level padding, section spacing  |
| `2xl`   | 48px   | Major section dividers               |
| `3xl`   | 64px   | Hero sections, top-level spacing     |

### 4.2 Page Layout

- **Page padding (horizontal):** `20px` (1.25rem) on mobile, `32px` (2rem) on tablet
- **Max content width:** `480px` for phone kiosk, `768px` for tablet kiosk
- **Section spacing:** `32px–48px` between major sections

### 4.3 Grid

- **Menu item grid:** 2 columns on phone, 3 columns on tablet (min `280px`)
- **Grid gap:** `16px` (1rem)
- **Cart item list:** Single column, `12px` gap

---

## 5. Components

### 5.1 Buttons

All buttons use `font-family: Lato`, `font-weight: 700`, and have `transition` on opacity/background.

#### Primary Button (Teal Filled)
```
background: var(--color-primary)         /* #4CBEB5 */
color: white
border-radius: 8px
padding: 14px 24px
font-size: 0.9375rem (15px)
font-weight: 700
letter-spacing: 0.02em
text-transform: uppercase

:hover / :active → background: var(--color-primary-dark) /* #3AA8A0 */
:disabled → opacity: 0.5
```

#### Accent Button (Gold Filled) — High-emphasis CTA
```
background: var(--color-accent)          /* #C99A4A */
color: white
border-radius: 8px
padding: 14px 24px
font-size: 0.9375rem (15px)
font-weight: 700
letter-spacing: 0.02em
text-transform: uppercase

:hover / :active → background: var(--color-accent-dark) /* #B5873D */
```

#### Secondary Button (Outlined)
```
background: transparent
color: var(--color-primary)
border: 2px solid var(--color-primary)
border-radius: 8px
padding: 12px 24px
font-size: 0.9375rem (15px)
font-weight: 700
letter-spacing: 0.02em
text-transform: uppercase

:hover / :active → background: var(--color-primary-50) /* #E8F6F5 */
```

#### Ghost Button (Text Only)
```
background: transparent
color: var(--color-primary)
border: none
padding: 8px 12px
font-size: 0.875rem (14px)
font-weight: 600

:hover / :active → opacity: 0.7
```

#### Destructive Button (e.g., Clear Cart)
```
background: var(--color-error)           /* #EF4444 */
color: white
border-radius: 8px
padding: 10px 20px
font-size: 0.875rem (14px)
font-weight: 700

:hover / :active → opacity: 0.85
```

#### Large CTA Button (e.g., "Place Order", "View Order")
```
background: var(--color-accent)          /* #C99A4A */
color: white
border-radius: 10px
padding: 20px 24px
font-size: 1.25rem (20px)
font-weight: 700
letter-spacing: 0.02em
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
```

#### Button Size Variants

| Size      | Padding          | Font Size | Border Radius |
|-----------|------------------|-----------|---------------|
| `sm`      | 8px 16px         | 0.8125rem | 6px           |
| `md`      | 12px 24px        | 0.9375rem | 8px           |
| `lg`      | 16px 32px        | 1.0625rem | 10px          |
| `xl`      | 20px 32px        | 1.25rem   | 10px          |

### 5.2 Cards

#### Menu Item Card
```
background: var(--color-bg-card)         /* #FFFFFF */
border-radius: 12px
overflow: hidden
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06)
transition: box-shadow 0.2s

/* Image container */
aspect-ratio: 4 / 3
object-fit: cover
border-radius: 12px 12px 0 0

/* Content area */
padding: 16px

/* Item name — Playfair Display */
font-family: Playfair Display
font-size: 1rem
font-weight: 600
color: var(--color-text-primary)

/* Price */
font-family: Lato
font-size: 0.9375rem
font-weight: 700
color: var(--color-text-primary)

/* Description (if shown) */
font-family: Lato
font-size: 0.8125rem
color: var(--color-text-secondary)
line-height: 1.4
max 2 lines, ellipsis overflow
```

#### Cart Item Card
```
background: var(--color-bg-card)
border-radius: 10px
padding: 16px
border: 1px solid var(--color-divider)   /* #E5E0D8 */
```

#### Summary Card (Confirmation)
```
background: var(--color-bg-card)
border-radius: 12px
overflow: hidden
divide-y with var(--color-divider)
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)
```

### 5.3 Inputs

```
background: var(--color-bg-muted)        /* #F0ECE4 */
border: 1.5px solid var(--color-divider) /* #E5E0D8 */
border-radius: 8px
padding: 14px 16px
font-family: Lato
font-size: 0.9375rem (15px)
color: var(--color-text-primary)
placeholder color: var(--color-text-placeholder) /* #9CA3AF */

:focus →
  border-color: var(--color-primary)
  box-shadow: 0 0 0 3px var(--color-primary-50) /* #E8F6F5 */
  outline: none
```

#### Input on Dark Background (Welcome Screen)
```
background: rgba(255, 255, 255, 0.12)
border: 1.5px solid rgba(255, 255, 255, 0.2)
border-radius: 8px
padding: 14px 16px
color: white
placeholder color: rgba(255, 255, 255, 0.4)

:focus →
  border-color: rgba(255, 255, 255, 0.5)
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1)
```

### 5.4 Navigation / Header

#### Kiosk Top Bar (Guest Info)
```
background: var(--color-bg-cta-section)  /* #267D7A — dark teal */
   or gradient: linear-gradient(135deg, #4CBEB5, #267D7A)
padding: 16px 20px
color: white
```

#### Category Tabs
```
background: var(--color-bg-page)         /* #FAF7F2 */
border-bottom: 1px solid var(--color-divider)
overflow-x: auto (horizontal scroll, no scrollbar)

Each tab:
  padding: 12px 20px
  font-family: Lato
  font-size: 0.875rem (14px)
  font-weight: 600
  color: var(--color-text-secondary)
  border-bottom: 3px solid transparent
  white-space: nowrap

Active tab:
  color: var(--color-primary)
  border-bottom-color: var(--color-primary)
  font-weight: 700
```

### 5.5 Quantity Stepper

```
display: inline-flex
align-items: center
background: var(--color-bg-muted)        /* #F0ECE4 */
border: 1.5px solid var(--color-divider)
border-radius: 8px
overflow: hidden

Minus / Plus buttons:
  width: 36px
  height: 36px
  display: flex
  align-items: center
  justify-content: center
  font-size: 1.125rem
  font-weight: 600
  color: var(--color-primary)
  background: transparent
  :active → background: var(--color-primary-50)

Quantity display:
  min-width: 40px
  text-align: center
  font-family: Lato
  font-weight: 700
  font-size: 0.9375rem
  color: var(--color-text-primary)
```

### 5.6 Floating Action Bar (View Order / Place Order)

```
position: fixed
bottom: 24px
left: 20px
right: 20px
z-index: 50

background: var(--color-accent)          /* #C99A4A */
border-radius: 14px
padding: 18px 24px
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18)

font-family: Lato
font-weight: 700
font-size: 1.125rem
color: white
```

### 5.7 Modal / Dialog

```
Overlay:
  background: rgba(0, 0, 0, 0.45)
  backdrop-filter: blur(4px)

Modal container:
  background: var(--color-bg-card)       /* #FFFFFF */
  border-radius: 16px
  max-width: 400px
  width: calc(100% - 40px)
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2)
  overflow: hidden

Modal header area:
  padding: 24px 24px 16px

Modal body:
  padding: 0 24px 24px

Modal footer:
  background: var(--color-bg-page)       /* #FAF7F2 */
  padding: 16px 24px
  border-top: 1px solid var(--color-divider)
  display: flex
  gap: 12px
  justify-content: flex-end
```

### 5.8 Status Badges (Kitchen Display)

| Status        | Background              | Text Color | Border         |
|---------------|-------------------------|------------|----------------|
| New / Pending | `--color-primary-50`    | `#267D7A`  | `--color-primary` |
| Preparing     | `--color-warning-light` | `#92400E`  | `--color-warning` |
| Ready         | `--color-success-light` | `#166534`  | `--color-success` |
| Delivered     | `#F3F4F6`               | `#6B7280`  | `#D1D5DB`       |

```
border-radius: 6px
padding: 4px 12px
font-family: Lato
font-size: 0.75rem
font-weight: 700
text-transform: uppercase
letter-spacing: 0.05em
border-width: 1px
```

---

## 6. Iconography

- **Style:** Outline (stroke-based), 1.5px–2px stroke weight
- **Source:** Heroicons (outline set) — already commonly used in Tailwind projects
- **Size:** 20px for inline icons, 24px for buttons, 32px for empty states
- **Color:** Inherits from parent text color. Primary action icons use `--color-primary`.
- **Touch target:** Minimum 44x44px tap area around any interactive icon

---

## 7. Border Radius

| Element         | Radius   | Tailwind Class   |
|-----------------|----------|------------------|
| Buttons (sm)    | 6px      | `rounded-md`     |
| Buttons (md/lg) | 8px      | `rounded-lg`     |
| Cards           | 12px     | `rounded-xl`     |
| Inputs          | 8px      | `rounded-lg`     |
| Modals          | 16px     | `rounded-2xl`    |
| Badges          | 6px      | `rounded-md`     |
| Floating bar    | 14px     | `rounded-[14px]` |
| Avatars/icons   | 50%      | `rounded-full`   |

**Rule:** The kiosk uses rounded corners everywhere — never `rounded-none`.
The website consistently uses soft, rounded edges to convey warmth and
approachability. Sharp corners feel clinical and should be avoided.

---

## 8. Shadows & Elevation

| Level   | Shadow                                      | Usage                           |
|---------|---------------------------------------------|---------------------------------|
| None    | `none`                                      | Flat elements, backgrounds      |
| Subtle  | `0 1px 3px rgba(0,0,0,0.06)`               | Cards at rest                   |
| Medium  | `0 2px 8px rgba(0,0,0,0.08)`               | Elevated cards, dropdowns       |
| Strong  | `0 8px 24px rgba(0,0,0,0.15)`              | Floating action bars, modals    |
| Heavy   | `0 20px 60px rgba(0,0,0,0.2)`              | Modal overlays                  |

---

## 9. Screen-by-Screen Application

### 9.1 Welcome Screen (Login)

- **Background:** Full-bleed gradient using dark teal: `linear-gradient(160deg, #4CBEB5 0%, #1E6B69 100%)`
- **Logo/Emblem:** Playa Montana logo (or a wave icon in a circle with `border: 2px solid rgba(255,255,255,0.3)`)
- **Overline label:** "ROOM DINING" — white/60% opacity, uppercase, tracked
- **Heading:** "Welcome" — Playfair Display, 2rem, bold, white
- **Subtext:** Lato, 0.875rem, white/60%
- **Input fields:** Glass-style (see Input on Dark Background in 5.3)
- **Submit button:** White background, teal text — provides high contrast against dark background
- **Rounded corners on everything** — inputs 8px, button 8px

### 9.2 Menu Screen

- **Sticky header:** Dark teal bar with guest name + room, time/date
- **Category tabs:** Cream background, horizontal scroll, teal active indicator (underline)
- **Menu grid:** 2-column cards on white background with rounded corners
- **Item card:** Photo top, name in Playfair Display, price in Lato Bold, teal "Add" button
- **Floating cart bar:** Amber/gold, bottom-fixed with shadow, shows item count + total

### 9.3 Cart Screen

- **Background:** Cream (`--color-bg-page`)
- **Back link:** Teal ghost button with ← arrow
- **Page title:** "Your Order" in Playfair Display
- **Guest info line:** Lato, muted text
- **Cart items:** White cards, rounded, with quantity stepper and item notes input
- **Order notes:** Textarea with muted background
- **Fixed footer:** Total in large Lato Bold, "Place Order" in amber/gold large CTA button

### 9.4 Confirmation Screen

- **Top section:** Full-bleed teal gradient background
- **Check icon:** White circle with checkmark
- **Heading:** "Order Placed!" in Playfair Display, white
- **Bottom section:** Cream background with summary card
- **Summary card:** White, rounded, divided rows showing order#, room, total
- **Action buttons:** "New Order" (teal primary) + "Done" (outlined secondary)

### 9.5 Kitchen Display

- **Layout:** Full-screen, designed for wall-mounted tablet/TV
- **Background:** Cream (`--color-bg-page`)
- **Order cards:** White cards with rounded corners, colored left border indicating status
- **Status badges:** See 5.8 above
- **Auto-refresh:** No user interaction required for new order display

---

## 10. Motion & Animation

- **Transitions:** All interactive state changes use `transition: all 0.2s ease`
- **Button press:** `active:opacity-80` or `active:scale-[0.98]`
- **Page transitions:** Subtle fade-in (200ms) when navigating between screens
- **Cart button entrance:** Slide up from bottom with subtle spring
- **Loading states:** Pulsing opacity animation on skeleton elements
- **No jarring animations.** The resort feel is calm and relaxed — motion should be gentle.

---

## 11. Responsive Breakpoints

| Breakpoint    | Width    | Layout Target                    |
|---------------|----------|----------------------------------|
| Phone         | < 640px  | Single column, 2-col menu grid   |
| Tablet        | 640–1024px | 3-col menu grid, wider padding  |
| Kitchen       | > 1024px | Multi-column order board         |

The kiosk primarily targets **phone** (guest's own phone via QR code) and
**tablet** (shared Android tablets at the resort). The kitchen display targets
larger screens.

---

## 12. Accessibility

- **Touch targets:** Minimum 44x44px for all interactive elements
- **Color contrast:** All text meets WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text)
- **Focus indicators:** 3px solid ring in `--color-primary-50` with 2px offset
- **Font size:** Never below 12px (0.75rem) for any visible text
- **Price clarity:** Always prefix with ₱ symbol, use `tabular-nums` for alignment

---

## 13. Do's and Don'ts

### Do
- Use Playfair Display for headings to maintain the resort's elegant feel
- Use the teal/cream color combination as the dominant palette
- Keep generous whitespace — don't crowd elements
- Use rounded corners on all interactive elements and cards
- Use the overline label pattern ("ROOM DINING", "YOUR ORDER") for section context
- Use amber/gold for the highest-emphasis CTA per screen (usually one per page)

### Don't
- Use green (`#59A310`) — this is NOT the brand color. The brand is teal (`#4CBEB5`)
- Use `rounded-none` / sharp corners — the brand uses soft, rounded edges
- Use system fonts — always load Playfair Display + Lato
- Use pure black text or pure white backgrounds — always use the warm palette
- Make the app feel like a generic POS terminal — it should feel like a resort experience
- Use more than one amber/gold accent button per screen — it loses its emphasis

---

## 14. Tailwind CSS Configuration

Suggested Tailwind v4 theme extension for the kiosk app:

```css
/* index.css — Tailwind v4 with custom theme */
@import "tailwindcss";

@theme {
  /* Brand colors */
  --color-brand-50: #E8F6F5;
  --color-brand-100: #C5EBE8;
  --color-brand-200: #9EDED9;
  --color-brand-300: #7DD3CE;
  --color-brand-400: #4CBEB5;
  --color-brand-500: #3AA8A0;
  --color-brand-600: #267D7A;
  --color-brand-700: #1E6B69;
  --color-brand-800: #175755;
  --color-brand-900: #104240;

  --color-accent-50: #FDF6E8;
  --color-accent-100: #F5E4BE;
  --color-accent-200: #E2C68A;
  --color-accent-300: #D4AD66;
  --color-accent-400: #C99A4A;
  --color-accent-500: #B5873D;
  --color-accent-600: #9A7033;
  --color-accent-700: #7D5A29;

  --color-cream: #FAF7F2;
  --color-cream-dark: #F0ECE4;
  --color-sand: #E5E0D8;

  /* Typography */
  --font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Lato', 'Helvetica Neue', Arial, sans-serif;
}
```

---

## 15. CSS Custom Properties (Full Reference)

Add these to `index.css` or a dedicated `theme.css` file:

```css
:root {
  /* Primary (Teal) */
  --color-primary: #4CBEB5;
  --color-primary-dark: #3AA8A0;
  --color-primary-light: #7DD3CE;
  --color-primary-50: #E8F6F5;

  /* Accent (Gold) */
  --color-accent: #C99A4A;
  --color-accent-dark: #B5873D;
  --color-accent-light: #E2C68A;

  /* Neutrals */
  --color-bg-page: #FAF7F2;
  --color-bg-card: #FFFFFF;
  --color-bg-muted: #F0ECE4;
  --color-bg-footer: #1E6B69;
  --color-bg-cta-section: #267D7A;

  /* Text */
  --color-text-primary: #2D3436;
  --color-text-secondary: #6B7280;
  --color-text-placeholder: #9CA3AF;
  --color-text-on-dark: #FFFFFF;

  /* Borders */
  --color-divider: #E5E0D8;

  /* Semantic */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-strong: 0 8px 24px rgba(0, 0, 0, 0.15);

  /* Fonts */
  --font-heading: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-body: 'Lato', 'Helvetica Neue', Arial, sans-serif;
}
```

---

## 16. Migration Notes (Current → Target)

The current kiosk app needs these changes to align with the brand:

| Current                              | Target                                          |
|--------------------------------------|------------------------------------------------|
| `#59A310` (green) everywhere         | `#4CBEB5` (teal) for primary actions            |
| `#1a3a05` (dark green) gradients     | `#1E6B69` / `#267D7A` (dark teal) gradients     |
| `system-ui` font                     | Playfair Display (headings) + Lato (body)       |
| `#f5f0e8` page background            | `#FAF7F2` page background                       |
| `#ede8dc` card backgrounds           | `#FFFFFF` card backgrounds                      |
| `rounded-none` on all elements       | `rounded-lg` to `rounded-xl` on all elements    |
| `bg-blue-500` on active category tab | `border-b` indicator in teal (`#4CBEB5`)         |
| No shadows on cards                  | Subtle shadow: `0 1px 3px rgba(0,0,0,0.06)`     |
| Green "Place Order" button           | Amber/gold accent `#C99A4A` for emphasis         |
| Generic layout                       | Overline labels, serif headings, more whitespace |
