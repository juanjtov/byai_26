# Claude Code Implementation Prompt: Remodly Landing Page

## Context

I'm building **Remodly**, an AI-powered in-home estimator for general contractors. The killer feature is "scan to signed contract in one flow"—a GC scans a room with LiDAR, gets three instant packages priced from their rate card, and the homeowner signs on the spot.

I need you to implement a sophisticated, production-ready landing page based on the design specifications below. This is investor-facing, so quality must be exceptional—think Jony Ive meets high-end home design.

---

## Tech Stack

- **React 18** with TypeScript
- **Vite** for bundling
- **Tailwind CSS** for styling
- **Framer Motion** (or CSS animations) for scroll-triggered animations
- Create as a standalone page component at `src/pages/LandingPage.tsx`

---

## Design System

### Color Palette (CSS Variables)

```css
:root {
  --charcoal: #0a0a0c;        /* Primary background */
  --charcoal-light: #0d0d0f;  /* Secondary background */
  --ivory: #faf8f4;           /* Primary text */
  --amber: #c9a54d;           /* Accent / CTAs */
  --amber-hover: #d4b35f;     /* Accent hover state */
  --sage: #8a9a8d;            /* Success / secondary accent */
}
```

### Typography

**Google Fonts to import:**
- `Cormorant Garamond` (weights: 300, 400, 500, 600) — Display/headlines
- `DM Sans` (weights: 300, 400, 500, 600) — Body text

**Usage:**
- Headlines: `font-family: 'Cormorant Garamond', Georgia, serif`
- Body: `font-family: 'DM Sans', system-ui, sans-serif`

### Design Tokens

- Border radius: minimal (0 for buttons, 8-16px for cards)
- Spacing: generous whitespace, sections have `py-32`
- Borders: 1px with `rgba(250, 248, 244, 0.05)` or `rgba(201, 165, 77, 0.3)`
- Shadows: subtle glows using amber with low opacity

---

## Page Structure & Sections

### 1. Navigation (Fixed)
- Logo: "REMODLY" with geometric diamond icon (rotated square with inner square)
- Links: How It Works, Features, For Contractors
- CTA button: "JOIN WAITLIST" (outlined style, amber border)
- Background becomes semi-transparent with blur on scroll

### 2. Hero Section
**Content:**
- Eyebrow: "Now in Private Beta" with pulsing amber dot
- Headline (3 lines):
  - "From Scan"
  - "to Signed Contract" (gradient text: ivory → amber → ivory)
  - "in Ten Minutes" (40% opacity)
- Subheadline: "The AI-powered estimator that turns your LiDAR scan into instant, accurate pricing—and a signed contract before you leave the room."
- CTAs: Primary "REQUEST EARLY ACCESS" (amber bg) + Secondary "WATCH THE DEMO" (outlined)
- Stats row (3 items): "10 min" / "3x" / "94%" with labels

**Background:**
- Subtle grid pattern (60px spacing, 3% opacity)
- Two floating gradient orbs (amber and sage, blurred)

### 3. Problem Section
**Content:**
- Eyebrow: "The Problem"
- Headline: "Home renovation is still sold like it's 2005"
- 4 numbered pain points (01-04 format)
- Visual: "Traditional Process" card showing timeline from Day 1 to Day 28+ with status indicators

### 4. Solution Section (How It Works)
**Content:**
- Eyebrow: "The Solution"
- Headline: "One flow. Zero friction."
- 3 step cards:
  1. Scan the Space (grid/crosshair icon)
  2. Explore Options (sliders icon)
  3. Sign & Close (shield/checkmark icon)
- Timeline comparison badge: "28+ days → 10 minutes"

**Card styling:**
- Hover effect: top border gradient appears
- Large faded number in corner (01, 02, 03)

### 5. Interactive Demo Section (Features)
**Content:**
- Eyebrow: "The Experience"
- Headline: "Watch the price update in real time"
- Description + 4 bullet points
- **INTERACTIVE COMPONENT**: Working price slider demo

**Interactive Demo Card:**
```
Header: "Kitchen Remodel" | "12' × 14' • L-Shape" | "SCANNED" badge

Slider: Range from Essential → Signature → Luxe

3 Package Cards (highlight active based on slider):
- Essential: ~$17,150 (slider 0-33%)
- Signature: ~$24,500 (slider 34-66%)  
- Luxe: ~$34,300 (slider 67-100%)

Features list updates based on active package

CTA: "LOCK SCOPE & GENERATE CONTRACT"
```

**Pricing logic:**
```typescript
const basePrice = 24500;
const multiplier = 0.5 + (sliderValue / 100) * 1.5;
const currentPrice = Math.round(basePrice * multiplier);

const packages = [
  { name: 'Essential', price: Math.round(currentPrice * 0.7) },
  { name: 'Signature', price: currentPrice },
  { name: 'Luxe', price: Math.round(currentPrice * 1.4) },
];
```

### 6. Confidence Meter Section
**Content:**
- Eyebrow: "Built-In Trust"
- Headline: "The Confidence Meter"
- Description about change order prevention

**Visual:**
- Circular progress ring (87% filled) with gradient stroke
- Checklist with 5 items (4 complete, 1 pending with risk note):
  - ✓ All walls captured
  - ✓ Window dimensions confirmed
  - ✓ Electrical panel located
  - ⚠ Plumbing access verified → "May require additional access"
  - ✓ Ceiling height confirmed

### 7. For Contractors Section
**Content:**
- Eyebrow: "For Contractors"
- Headline: "Close more jobs. In less time."
- 3 benefits with title + description:
  1. Your Pricing, Your Brand
  2. Eliminate Quote Shopping
  3. Standardized Scope

**Visual:**
- Contract preview mockup (light background card):
  - Contractor logo placeholder "AB" | "Alpha Builders"
  - Project: "Kitchen Remodel — Signature Package"
  - Total price + Timeline
  - Line items breakdown
  - Signature lines
- Card has slight rotation, straightens on hover

### 8. CTA Section
**Content:**
- Headline: "Ready to close in ten minutes?"
- Subheadline about private beta
- Email input + "REQUEST ACCESS" button
- Fine print: "Limited spots available..."

**Background:**
- Radial gradient with amber at 30% opacity center

### 9. Footer
- Logo (smaller)
- Links: Privacy, Terms, Contact
- Copyright: © 2025 Remodly

---

## Animations & Interactions

### Scroll Animations
Use Intersection Observer with 15% threshold. Animate in:
- `opacity: 0 → 1`
- `translateY: 32px → 0`
- `duration: 1000ms`
- `easing: ease-out`

Apply to each major section as it enters viewport.

### CSS Animations
```css
/* Floating orbs */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
}

/* Pulsing glow on demo card */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(201, 165, 77, 0.15); }
  50% { box-shadow: 0 0 80px rgba(201, 165, 77, 0.3); }
}
```

### Hover Effects
- Buttons: background color transition 300ms
- Cards: border color change, subtle lift
- Links: color transition to amber
- Contract preview: rotation 1deg → 0deg

### Custom Slider Styling
Style the range input with custom thumb (amber circle with glow) and track (gradient from charcoal to amber).

---

## Special Effects

### Gradient Text
```css
.text-gradient {
  background: linear-gradient(135deg, #faf8f4 0%, #c9a54d 50%, #faf8f4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Gradient Border Cards
```css
.border-gradient {
  border: 1px solid transparent;
  background: 
    linear-gradient(#0a0a0c, #0a0a0c) padding-box,
    linear-gradient(135deg, #c9a54d 0%, #8a9a8d 50%, #c9a54d 100%) border-box;
}
```

### Noise Texture Overlay
Add a fixed, full-screen SVG noise pattern at 3% opacity for premium texture.

---

## Responsive Breakpoints

- Mobile: Stack all grids, reduce font sizes
- `md` (768px): 2-column grids where appropriate
- `lg` (1024px): Full layouts, larger typography

---

## Component Breakdown

Create these sub-components if helpful:
- `<SectionHeader eyebrow="" headline="" />` — Reusable section titles
- `<PackageCard package={} isActive={} />` — For the demo slider
- `<ConfidenceMeter value={} />` — The circular progress ring
- `<ProcessStep num="" title="" desc="" icon={} />` — How it works cards

---

## Implementation Notes

1. Start with the page layout and typography
2. Build the interactive demo slider with state management
3. Add scroll animations last
4. Test responsiveness throughout
5. Ensure all fonts are loaded before rendering (use `font-display: swap`)

---

## Quality Checklist

- [ ] No default/generic fonts (Inter, Arial, Roboto)
- [ ] No purple gradients or generic "AI" aesthetics
- [ ] Consistent spacing using Tailwind's scale
- [ ] All interactive elements have hover states
- [ ] Smooth 60fps animations
- [ ] Accessible color contrast for text
- [ ] Mobile-first responsive design
- [ ] Clean, well-organized code with TypeScript types

---

## Reference

The complete React component is available in the attached `scan-estimate-landing.jsx` file. Use it as a reference for exact styling, copy, and component structure. Adapt it to TypeScript and your project's conventions.
