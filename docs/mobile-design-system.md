# Remodly Mobile Design System

This document defines all UI parameters for the iOS mobile app to ensure visual consistency with the web application.

---

## Color Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **obsidian** | `#0F1012` | `15, 16, 18` | Primary background |
| **tungsten** | `#1C1C1E` | `28, 28, 30` | Surface/cards |
| **surface-light** | `#2C2C2E` | `44, 44, 46` | Borders, dividers, accents |
| **ivory** | `#FAF8F4` | `250, 248, 244` | Primary text |
| **body** | `#B5ADA5` | `181, 173, 165` | Secondary/body text |
| **copper** | `#C88D74` | `200, 141, 116` | Primary accent (buttons, links) |
| **copper-hover** | `#D4A08A` | `212, 160, 138` | Hover/pressed state |
| **sage** | `#768A86` | `118, 138, 134` | Secondary accent |
| **sage-muted** | `#8B9E7D` | `139, 158, 125` | Cool secondary accent |
| **signal** | `#CFFF04` | `207, 255, 4` | Success, LiDAR glow, active states |
| **coral** | `#E8A087` | `232, 160, 135` | CTA accent |
| **gold** | `#D4A84B` | `212, 168, 75` | Warm gold accent |

### Opacity Variants

Common opacity modifiers used throughout the app:

| Base Color | Opacity | RGBA | Usage |
|------------|---------|------|-------|
| ivory | 5% | `rgba(250, 248, 244, 0.05)` | Subtle backgrounds |
| ivory | 10% | `rgba(250, 248, 244, 0.1)` | Borders, dividers |
| ivory | 40% | `rgba(250, 248, 244, 0.4)` | Placeholder text |
| copper | 10% | `rgba(200, 141, 116, 0.1)` | Subtle accent backgrounds |
| copper | 20% | `rgba(200, 141, 116, 0.2)` | Badge backgrounds |
| copper | 30% | `rgba(200, 141, 116, 0.3)` | Selection highlight |
| copper | 90% | `rgba(200, 141, 116, 0.9)` | Hover states |
| signal | 30% | `rgba(207, 255, 4, 0.3)` | Subtle glow |
| signal | 60% | `rgba(207, 255, 4, 0.6)` | Strong glow |

---

## Typography

### Font Families

| Role | Font | Fallback | Google Fonts |
|------|------|----------|--------------|
| **Display/Headings** | Cormorant Garamond | Georgia, serif | [Link](https://fonts.google.com/specimen/Cormorant+Garamond) |
| **Body/UI** | DM Sans | system-ui, sans-serif | [Link](https://fonts.google.com/specimen/DM+Sans) |

### Font Weights

- **Cormorant Garamond**: Regular (400), Medium (500), SemiBold (600), Bold (700)
- **DM Sans**: Regular (400), Medium (500), Bold (700)

### Recommended Type Scale

| Element | Font | Size (pt) | Weight | Line Height |
|---------|------|-----------|--------|-------------|
| Large Title | Cormorant Garamond | 34 | SemiBold | 1.2 |
| Title 1 | Cormorant Garamond | 28 | SemiBold | 1.2 |
| Title 2 | Cormorant Garamond | 22 | Medium | 1.3 |
| Title 3 | DM Sans | 20 | Medium | 1.3 |
| Headline | DM Sans | 17 | SemiBold | 1.4 |
| Body | DM Sans | 17 | Regular | 1.5 |
| Callout | DM Sans | 16 | Regular | 1.4 |
| Subhead | DM Sans | 15 | Regular | 1.4 |
| Footnote | DM Sans | 13 | Regular | 1.4 |
| Caption | DM Sans | 12 | Regular | 1.3 |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `small` | 4pt | Small elements, badges, tags |
| `medium` | 8pt | Buttons, inputs, small cards |
| `large` | 12pt | Cards, containers, modals |
| `full` | 9999pt | Avatars, pills, circular buttons |

---

## Shadows & Glows

### Box Shadows

```swift
// Copper glow (default)
shadowColor: UIColor(hex: "#C88D74").withAlphaComponent(0.4)
shadowOffset: CGSize(width: 0, height: 0)
shadowRadius: 20
shadowOpacity: 1

// Copper glow (strong)
shadowColor: UIColor(hex: "#C88D74").withAlphaComponent(0.6)
shadowRadius: 30

// Signal glow (default)
shadowColor: UIColor(hex: "#CFFF04").withAlphaComponent(0.4)
shadowRadius: 20

// Signal glow (strong)
shadowColor: UIColor(hex: "#CFFF04").withAlphaComponent(0.6)
shadowRadius: 30

// Gold glow
shadowColor: UIColor(hex: "#D4A84B").withAlphaComponent(0.4)
shadowRadius: 20

// Sage glow
shadowColor: UIColor(hex: "#8B9E7D").withAlphaComponent(0.4)
shadowRadius: 20
```

### Focus Ring

```swift
borderColor: copper (#C88D74)
borderWidth: 2pt
offset: 2pt
```

---

## Component Specifications

### Text Input

| Property | Value |
|----------|-------|
| Background | `rgba(250, 248, 244, 0.05)` |
| Border color | `rgba(250, 248, 244, 0.1)` |
| Border width | 1pt |
| Border radius | 8pt |
| Padding horizontal | 16pt |
| Padding vertical | 12pt |
| Text color | ivory (`#FAF8F4`) |
| Placeholder color | `rgba(250, 248, 244, 0.4)` |
| Focus border color | copper (`#C88D74`) |
| Font | DM Sans Regular, 17pt |

### Primary Button

| Property | Value |
|----------|-------|
| Background | copper (`#C88D74`) |
| Text color | obsidian (`#0F1012`) |
| Border radius | 8pt |
| Padding horizontal | 24pt |
| Padding vertical | 12pt |
| Font | DM Sans Medium, 17pt |
| Pressed background | copper-hover (`#D4A08A`) |
| Disabled opacity | 50% |

### Secondary Button

| Property | Value |
|----------|-------|
| Background | `rgba(200, 141, 116, 0.1)` |
| Border | 1pt `rgba(200, 141, 116, 0.5)` |
| Text color | copper (`#C88D74`) |
| Border radius | 8pt |
| Padding horizontal | 24pt |
| Padding vertical | 12pt |
| Font | DM Sans Medium, 17pt |

### Card

| Property | Value |
|----------|-------|
| Background | `rgba(250, 248, 244, 0.05)` |
| Border | 1pt `rgba(250, 248, 244, 0.1)` |
| Border radius | 12pt |
| Padding | 24pt |

---

## Gradients

### Text Gradient (Premium Feel)

```swift
let gradient = CAGradientLayer()
gradient.colors = [
    UIColor(hex: "#FAF8F4").cgColor,
    UIColor(hex: "#C88D74").cgColor,
    UIColor(hex: "#FAF8F4").cgColor
]
gradient.startPoint = CGPoint(x: 0, y: 0)
gradient.endPoint = CGPoint(x: 1, y: 1)
```

### Border Gradient

```swift
let gradient = CAGradientLayer()
gradient.colors = [
    UIColor(hex: "#C88D74").cgColor,
    UIColor(hex: "#768A86").cgColor,
    UIColor(hex: "#C88D74").cgColor
]
gradient.startPoint = CGPoint(x: 0, y: 0)
gradient.endPoint = CGPoint(x: 1, y: 1)
```

### Signal Gradient

```swift
let gradient = CAGradientLayer()
gradient.colors = [
    UIColor(hex: "#CFFF04").cgColor,
    UIColor(hex: "#9ECC03").cgColor
]
gradient.startPoint = CGPoint(x: 0, y: 0)
gradient.endPoint = CGPoint(x: 1, y: 1)
```

---

## States

### Disabled State

- Opacity: 50%
- User interaction disabled

### Loading State

- Use processing pulse animation (opacity oscillates between 70% and 100%)

### Error State

- Background: `rgba(239, 68, 68, 0.1)` (red-500/10)
- Border: `rgba(239, 68, 68, 0.5)` (red-500/50)
- Text: `#F87171` (red-400)

### Success State

- Use signal color (`#CFFF04`) for indicators
- Signal glow for emphasis

---

## Swift Implementation

```swift
import UIKit

// MARK: - Colors

struct RemodlyColors {
    // Backgrounds
    static let obsidian = UIColor(hex: "#0F1012")
    static let tungsten = UIColor(hex: "#1C1C1E")
    static let surfaceLight = UIColor(hex: "#2C2C2E")

    // Text
    static let ivory = UIColor(hex: "#FAF8F4")
    static let body = UIColor(hex: "#B5ADA5")

    // Accents
    static let copper = UIColor(hex: "#C88D74")
    static let copperHover = UIColor(hex: "#D4A08A")
    static let sage = UIColor(hex: "#768A86")
    static let sageMuted = UIColor(hex: "#8B9E7D")
    static let signal = UIColor(hex: "#CFFF04")
    static let coral = UIColor(hex: "#E8A087")
    static let gold = UIColor(hex: "#D4A84B")

    // Semantic
    static let primary = copper
    static let secondary = sage
    static let success = signal
    static let background = obsidian
    static let surface = tungsten
    static let textPrimary = ivory
    static let textSecondary = body
}

// MARK: - Typography

struct RemodlyFonts {
    static let displayFamily = "CormorantGaramond"
    static let bodyFamily = "DMSans"

    static func display(size: CGFloat, weight: UIFont.Weight = .semibold) -> UIFont {
        let fontName: String
        switch weight {
        case .regular: fontName = "CormorantGaramond-Regular"
        case .medium: fontName = "CormorantGaramond-Medium"
        case .semibold: fontName = "CormorantGaramond-SemiBold"
        case .bold: fontName = "CormorantGaramond-Bold"
        default: fontName = "CormorantGaramond-Regular"
        }
        return UIFont(name: fontName, size: size) ?? .systemFont(ofSize: size, weight: weight)
    }

    static func body(size: CGFloat, weight: UIFont.Weight = .regular) -> UIFont {
        let fontName: String
        switch weight {
        case .regular: fontName = "DMSans-Regular"
        case .medium: fontName = "DMSans-Medium"
        case .bold: fontName = "DMSans-Bold"
        default: fontName = "DMSans-Regular"
        }
        return UIFont(name: fontName, size: size) ?? .systemFont(ofSize: size, weight: weight)
    }
}

// MARK: - Radius

struct RemodlyRadius {
    static let small: CGFloat = 4
    static let medium: CGFloat = 8
    static let large: CGFloat = 12
    static let full: CGFloat = 9999
}

// MARK: - Spacing

struct RemodlySpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}

// MARK: - UIColor Extension

extension UIColor {
    convenience init(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
        let g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
        let b = CGFloat(rgb & 0x0000FF) / 255.0

        self.init(red: r, green: g, blue: b, alpha: 1.0)
    }
}
```

---

## SwiftUI Implementation

```swift
import SwiftUI

extension Color {
    // Backgrounds
    static let obsidian = Color(hex: "#0F1012")
    static let tungsten = Color(hex: "#1C1C1E")
    static let surfaceLight = Color(hex: "#2C2C2E")

    // Text
    static let ivory = Color(hex: "#FAF8F4")
    static let body = Color(hex: "#B5ADA5")

    // Accents
    static let copper = Color(hex: "#C88D74")
    static let copperHover = Color(hex: "#D4A08A")
    static let sage = Color(hex: "#768A86")
    static let sageMuted = Color(hex: "#8B9E7D")
    static let signal = Color(hex: "#CFFF04")
    static let coral = Color(hex: "#E8A087")
    static let gold = Color(hex: "#D4A84B")

    init(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let r = Double((rgb & 0xFF0000) >> 16) / 255.0
        let g = Double((rgb & 0x00FF00) >> 8) / 255.0
        let b = Double(rgb & 0x0000FF) / 255.0

        self.init(red: r, green: g, blue: b)
    }
}

extension Font {
    static func remodlyDisplay(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom("CormorantGaramond-SemiBold", size: size)
    }

    static func remodlyBody(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("DMSans-Regular", size: size)
    }
}
```

---

## Animation Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Micro interactions | 0.1s - 0.15s | ease-out |
| Transitions | 0.2s - 0.3s | ease-in-out |
| Page transitions | 0.3s - 0.4s | ease-in-out |
| Floating animations | 6s - 25s | ease-in-out, infinite |
| Pulse animations | 2s - 3s | ease-in-out, infinite |
| Processing pulse | 2s | ease-in-out, infinite |

---

## Accessibility

- Maintain minimum contrast ratio of 4.5:1 for body text
- Use `prefers-reduced-motion` to disable animations when requested
- Support Dynamic Type scaling
- Ensure touch targets are at least 44x44pt
