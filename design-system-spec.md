# Email Automation — Visual Design System Specification

> **Status**: Specification ready. Awaiting Figma write access (rate-limited on Starter plan) to materialise these foundations in the existing Figma file.
>
> This document defines the complete visual language for the College Outreach Automation System V2 frontend, covering color, typography, spacing, radius, shadows, status semantics, component variants, and layout primitives.

---

## 1. Brand Positioning

**Identity**: AI + Automation + Research + Trust + Human Control

| Attribute | Visual Strategy |
|---|---|
| **AI** | Subtle gradient accents on key elements (personalization status badges, AI-generated tags). Monochromatic data surfaces. Precision-aligned grids. |
| **Automation** | Consistent 8px spacing grid. Systematic component variants. Predictable interaction patterns (claim → send → reply). |
| **Research** | Evidence traceability UI — source attribution chips, confidence bars, fact-to-email mapping. Academic-inspired muted backgrounds. |
| **Trust** | Neutral, professional color palette. High-contrast accessible text. Clear status semantics. Verified badges. |
| **Human Control** | Warm accent colors on interactive elements. Explicit approve/reject/edit buttons. Override controls visible and unmissable. |

---

## 2. Color Palette

### 2.1 Semantic Color System

All colors are defined as Figma Variables with specific scopes. The base mode is **Light**; a **Dark** mode is planned as a future mode in the same collection.

#### Brand & Accent
| Variable | Light Mode | Hex | Scope |
|---|---|---|---|
| `color/brand/primary` | #2563EB (blue-600) | `#2563eb` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color/brand/primary-hover` | #1D4ED8 (blue-700) | `#1d4ed8` | FRAME_FILL, SHAPE_FILL |
| `color/brand/primary-subtle` | #EFF6FF (blue-50) | `#eff6ff` | FRAME_FILL, SHAPE_FILL |
| `color/brand/ai` | #7C3AED (violet-600) | `#7c3aed` | FRAME_FILL, SHAPE_FILL, TEXT_FILL |
| `color/brand/ai-subtle` | #F3F0FF (violet-50) | `#f3f0ff` | FRAME_FILL, SHAPE_FILL |
| `color/brand/accent-gradient-start` | #2563EB | `#2563eb` | — (gradient) |
| `color/brand/accent-gradient-end` | #7C3AED | `#7c3aed` | — (gradient) |

#### Neutral (Text & Backgrounds)
| Variable | Light Mode | Hex | Usage |
|---|---|---|---|
| `color/neutral/900` | #111827 (gray-900) | `#111827` | Primary text, headings |
| `color/neutral/800` | #1F2937 (gray-800) | `#1f2937` | Secondary text |
| `color/neutral/700` | #374151 (gray-700) | `#374151` | Tertiary text, labels |
| `color/neutral/600` | #4B5563 (gray-600) | `#4b5563` | Placeholder, icons |
| `color/neutral/500` | #6B7280 (gray-500) | `#6b7280` | Disabled text, borders |
| `color/neutral/400` | #9CA3AF (gray-400) | `#9ca3af` | Dividers, subtle borders |
| `color/neutral/300` | #D1D5DB (gray-300) | `#d1d5db` | Border, input outlines |
| `color/neutral/200` | #E5E7EB (gray-200) | `#e5e7eb` | Hover states, subtle fills |
| `color/neutral/100` | #F3F4F6 (gray-100) | `#f3f4f6` | Secondary surfaces |
| `color/neutral/50` | #F9FAFB (gray-50) | `#f9fafb` | Page background |
| `color/neutral/0` | #FFFFFF (white) | `#ffffff` | Cards, primary surfaces |

#### Status Colors (Semantic)
| Variable | Light Mode | Hex | Usage |
|---|---|---|---|
| `color/status/success` | #10B981 (emerald-500) | `#10b981` | Approved, sent, delivered |
| `color/status/success-bg` | #D1FAE5 (emerald-100) | `#d1fae5` | Success badge backgrounds |
| `color/status/warning` | #F59E0B (amber-500) | `#f59e0b` | Pending review, warning |
| `color/status/warning-bg` | #FEF3C7 (amber-100) | `#fef3c7` | Warning badge backgrounds |
| `color/status/error` | #EF4444 (red-500) | `#ef4444` | Failed, bounced, error |
| `color/status/error-bg` | #FEE2E2 (red-100) | `#fee2e2` | Error badge backgrounds |
| `color/status/info` | #3B82F6 (blue-500) | `#3b82f6` | Processing, in-progress |
| `color/status/info-bg` | #DBEAFE (blue-100) | `#dbeafe` | Info badge backgrounds |
| `color/status/neutral` | #9CA3AF (gray-400) | `#9ca3af` | Neutral/draft, inactive |
| `color/status/neutral-bg` | #F3F4F6 (gray-100) | `#f3f4f6` | Neutral badge backgrounds |

#### Gradient (AI-Personalized)
| Variable | Value | Usage |
|---|---|---|
| `gradient/ai-badge` | Linear 90°, #2563EB → #7C3AED | AI-generated personalization tags, status badges with tone=AI |

---

## 3. Typography

### Type Scale & Styles

All text styles use **Inter** as the primary font, with **SF Mono** / **Fira Code** for evidence IDs and technical trace elements.

| Style Name | Font | Size | Line Height | Weight | Letter Spacing | Scope |
|---|---|---|---|---|---|---|
| `text/display/900` | Inter | 48px | 1.05 | 700 | -0.02em | HEADING |
| `text/display/800` | Inter | 36px | 1.1 | 700 | -0.01em | HEADING |
| `text/display/700` | Inter | 32px | 1.15 | 700 | -0.01em | HEADING |
| `text/display/600` | Inter | 28px | 1.2 | 600 | -0.01em | HEADING |
| `text/display/500` | Inter | 24px | 1.25 | 600 | -0.01em | HEADING |
| `text/display/400` | Inter | 20px | 1.3 | 500 | -0.005em | HEADING |
| `text/display/300` | Inter | 18px | 1.35 | 500 | -0.005em | HEADING |
| `text/body/large` | Inter | 16px | 1.5 | 400 | 0 | TEXT |
| `text/body/default` | Inter | 14px | 1.5 | 400 | 0 | TEXT |
| `text/body/small` | Inter | 13px | 1.5 | 400 | 0 | TEXT |
| `text/ui/large` | Inter | 15px | 1.4 | 500 | -0.005em | TEXT |
| `text/ui/default` | Inter | 13px | 1.4 | 500 | -0.005em | TEXT |
| `text/ui/small` | Inter | 12px | 1.4 | 500 | 0 | TEXT |
| `text/caption` | Inter | 12px | 1.4 | 400 | 0 | TEXT |
| `text/overline` | Inter | 11px | 1.5 | 600 | 0.05em | TEXT |
| `text/code` | SF Mono | 12px | 1.4 | 400 | 0 | TEXT |

### Hierarchy Rules
- **Display 900**: Page titles (only on dashboard root)
- **Display 500**: Section headings, modal titles
- **Display 300**: Card titles, table column headers
- **Body/Large**: Primary body text in cards and detail views
- **Body/Default**: Default paragraph text
- **UI/Default**: Button labels, form field labels, navigation items
- **Caption**: Helper text, metadata, timestamps
- **Overlayer**: Tags, badges, labels
- **Code**: Evidence IDs, trace references, source identifiers

---

## 4. Spacing System (8px Grid)

| Variable | Value | Usage |
|---|---|---|
| `spacing/xxs` | 2px | Border widths, subtle dividers |
| `spacing/xs` | 4px | Icon spacing, tight padding |
| `spacing/s` | 8px | Compact padding, small gaps |
| `spacing/sm` | 12px | Default input padding, small component gap |
| `spacing/m` | 16px | Default card padding, list item gap |
| `spacing/l` | 24px | Section padding, card-to-card gap |
| `spacing/xl` | 32px | Page padding, major section spacing |
| `spacing/2xl` | 48px | Between major page sections |
| `spacing/3xl` | 64px | Between primary page regions |
| `spacing/4xl` | 96px | Hero section bottom margin |

**Layout rules**: All padding/margin values snap to this grid. Cards use `spacing/m` (16px) internal padding. Page containers use `spacing/xl` (32px) horizontal padding. Between cards: `spacing/l` (24px). Between form fields
: `spacing/sm` (12px).

---

## 5. Border Radius

| Variable | Value | Usage |
|---|---|---|
| `radius/xs` | 2px | Tags, small badges |
| `radius/s` | 4px | Badges, chips, compact elements |
| `radius/m` | 8px | Buttons, input fields, table cells |
| `radius/l` | 12px | Card corners |
| `radius/xl` | 16px | Modal corners, large cards |
| `radius/2xl` | 24px | Panel containers |
| `radius/full` | 9999px | Pills, avatar |

---

## 6. Shadows & Effects

Defined as Figma Effect styles (also bound to variables for dynamic use).

| Style Name | Properties | Usage |
|---|---|---|
| `effect/shadow/sm` | 0px 1px 2px rgba(16, 25, 40, 0.05) | Active state overlays, dropdown items |
| `effect/shadow/m` | 0px 2px 8px rgba(16, 25, 40, 0.08) | Cards at rest |
| `effect/shadow/m-hover` | 0px 4px 16px rgba(16, 25, 40, 0.12) | Cards on hover |
| `effect/shadow/l` | 0px 8px 24px rgba(16, 25, 40, 0.12) | Floating elements, modals |
| `effect/shadow/ai-glow` | 0px 0px 12px rgba(124, 54, 237, 0.4) | AI-badge glow, personalization indicators |
| `effect/inner-border` | inset 0px 1px 0px rgba(16, 25, 40, 0.04) | Input field inner border |

---

## 7. Status Color Mapping

This preserves and extends the existing Status Badge concept (Tone = Neutral, Info, Processing, Warning, Danger, Success).

| Backend Status | Badge Tone | Background | Text | Icon |
|---|---|---|---|---|
| Ready | Neutral | `neutral/100` | `neutral/700` | — |
| Claimed | Info | `status/info-bg` | `status/info` | ⋯ |
| Sending | Info | `status/info-bg` | `status/info` | ↻ |
| Sent | Success | `status/success-bg` | `status/success` | ✓ |
| Delivered | Success | `status/success-bg` | `status/success` | ✓✓ |
| Bounced | Error | `status/error-bg` | `status/error` | ✕ |
| Error | Error | `status/error-bg` | `status/error` | ⚠ |
| Replied | AI Gradient | Gradient (brand) | `neutral/0` (white) | AI |
| Follow-up 1 | Warning | `status/warning-bg` | `status/warning` | ↻ |
| Follow-up 2 | Warning | `status/warning-bg` | `status/warning` | ↻ |
| Closed | Neutral | `neutral/100` | `neutral/600` | — |
| Pending Review | Processing | `status/info-bg` | `status/info` | ⋯ |
| Approved | Success | `status/success-bg` | `status/success` | ✓ |
| Rejected | Error | `status/error-bg` | `status/error` | ✕ |
| Edited | Warning | `status/warning-bg` | `status/warning` | ✏ |

---

## 8. Component Library

### 8.1 Status Badge (Preserved from existing)

**Component Set** (auto-layout, 22px height, hugging content horizontally)

| Property | Values |
|---|---|
| `Tone` | Neutral, Info, Processing, Warning, Danger, Success, AI |
| `Style` | Solid (default), Subtle |
| `Size` | Small (20px), Medium (28px) |

**Default padding**: 6px horizontal (Small) / 10px horizontal (Medium)
**Text style**: `text/caption` bold
**Border radius**: `radius/s` (4px) for Small, `radius/m` (8px) for Medium
**AI tone**: Uses the brand gradient background with white text

### 8.2 Button (Preserved from existing)

**Component Set** (auto-layout, 36px height)

| Property | Values |
|---|---|
| `Style` | Primary (gradient), Secondary, Tertiary, Destructive |
| `Size` | Small (32px), Medium (36px), Large (44px) |
| `State` | Default, Hover, Pressed, Disabled, Loading |
| `Icon` | None (default), Leading, Trailing |

**Visual rules**:
- **Primary**: Gradient background (blue→violet), white text, `status/success` glow on hover
- **Secondary**: White background, `neutral/300` border, `neutral/900` text
- **Tertiary**: Transparent background, `neutral/600` text
- **Destructive**: `status/error` background, white text
- **Loading**: Spinner animation over disabled state
- All buttons have `cornerRadius: radius/m` (8px)

### 8.3 Input Field

**Component Set**:
| Property | Values |
|---|---|
| `Variant` | Default, Focused, Error, Disabled |
| `Size` | Small (32px), Medium (40px), Large (48px) |

**Visual rules**:
- Border: 1px `neutral/300`, focused → 2px `brand/primary`
- Error state: 1px `status/error` border, error message below in `text/caption` color `status/error`
- Left icon slot (optional)
- Label above (always visible, not floating — for clarity in data-dense forms)

### 8.4 Chip

**Component Set**:
| Property | Values |
|---|---|
| `Tone` | Neutral, Info, AI, Success, Warning, Error |
| `Icon` | None, With icon (trailing) |
| `Closable` | No (default), Yes |

**Visual rules**:
- 20px height, `radius/m` (8px)
- Subtle background (20% opacity version of tone color)
- `text/ui/small` medium weight
- Close "x" icon on `Closable: Yes`

### 8.5 Card

**Component Set**:
| Property | Values |
|---|---|
| `Variant` | Elevated (default), Flat, Interactive |
| `Padding` | Compact (12px), Default (16px), Spacious (24px) |
| `Border` | None (default), Subtle |

**Visual rules**:
- `radius/l` (12px)
- Elevated: `shadow/m`, `shadow/m-hover` on interactive hover
- Flat: `neutral/50` background
- Interactive: hover state with `shadow/m-hover` + cursor pointer

### 8.6 Table

| Element | Style |
|---|---|
| Header row | `neutral/100` background, `text/caption` overline weight, bottom border `neutral/200` |
| Data row | `text/body/small` default, hover `neutral/50` background |
| Selected row | `brand/primary-subtle` background, left accent `brand/primary` |
| Divider | `neutral/200`, 1px horizontal |
| Pagination | `text/ui/small`, `neutral/600` |

### 8.7 Avatar

| Size | Dimensions |
|---|---|
| Small | 24×24px |
| Medium | 32×32px |
| Large | 40×40px |

Border radius: `radius/full` (circular). Background: generated from name initials using a deterministic color from the brand palette.

---

## 9. Layout Primitives

### 9.1 Page Structure
```
Page Padding: 32px (spacing/xl) — horizontal only
Sidebar Width: 240px (collapsed: 64px)
Header Height: 64px
Content Area: Full bleed below header, within page padding
```

### 9.2 Grid System
- **12-column grid** for card layouts (dashboard)
- **Gutter**: 24px (spacing/l) between columns
- **Card width**: Minimum 280px, ideal 320–480px
- **Table**: Full width, horizontal scroll on overflow

### 9.3 List Items
- Vertical padding: 12px (spacing/sm)
- Horizontal padding: 16px (spacing/m)
- Divider: `neutral/200` 1px horizontal
- Leading: Avatar (32px) or icon (20px)
- Trailing: Status badge, action menu, or metadata

---

## 10. Navigation

### 10.1 Sidebar
Left vertical navigation, 64px (collapsed) or 240px (expanded).

| Section | Icon | Label |
|---|---|---|
| Dashboard / Overview | ◯ (circle-grid) | Dashboard |
| Import / Upload | ↑↓ (upload) | Import |
| People / Profiles | 👤 | People |
| Research & Evidence | 🔍 | Research |
| AI Personalization | ⋯ (sparkles) | AI Personalization |
| Review & Approval | ✅ | Review Queue |
| Campaigns | 📊 | Campaigns |
| Bulk Sending | ✉️ | Bulk Send |
| Outreach | 📨 | Outreach |
| Replies & Classification | ↪️ | Replies |
| Settings / Integrations | ⚙️ | Settings |

**Active state**: `brand/primary` text + `brand/primary-subtle` left border (4px wide)
**Hover state**: `neutral/100` background
**Icons**: Line-style icons, `neutral/500` default, `brand/primary` active

### 10.2 Header
Height: 64px. Contains:
- Page title (Display 500)
- Right side: User avatar, campaign selector dropdown, notification bell

### 10.3 Breadcrumbs
Below header, 12px margin. `text/ui/small` `neutral/600`, separators are `/` in `neutral/400`.

---

## 11. Component Lifecycle States

### Loading Skeletons
| Component | Skeleton Style |
|---|---|
| Card | Gray shimmer box, 16px radius |
| Table row | 4 lines, last line 60% width |
| Text block | Single shimmer line |
| Avatar | Circle shimmer |
| Button | Rounded rectangle shimmer |

Duration: 1.5s pulse animation. Background: `neutral/200` shimmer over `neutral/50`.

### Empty States
- **Illustration**: Minimal line-art SVG matching the page theme
- **Title**: `text/display/400` `neutral/900`
- **Description**: `text/body/default` `neutral/600`, max 480px width
- **Action**: Primary button centered below

### Error States
- **Inline**: Red border (`status/error`) on the affected input, error message in `text/caption` `status/error`
- **Banner**: Full-width banner at top of page/content area: `status/error-bg` background, `status/error` icon + text, [Dismiss] button
- **Toast**: Bottom-right, auto-dismiss after 5s, `neutral/900` text on `neutral-100` background, `shadow/l`

---

## 12. Animation & Micro-interactions

| Interaction | Animation |
|---|---|
| Button press | Scale 0.97, 80ms ease-out |
| Card hover | Shadow lift `m` → `m-hover`, 160ms ease |
| Status badge color change | Cross-fade 120ms |
| AI badge (gradient) | Subtle shimmer sweep, infinite 3s |
| Modal open | Scale 0.95 → 1.0, opacity 0 → 1, 200ms ease-out |
| Table row selection | Background color 120ms ease |
| Stepper/Progress | Width transition 200ms ease |
| Toast enter/exit | Slide up + fade, 200ms |

---

## 13. What to Preserve from Existing Components

1. **Status Badge `Tone` variants**: Neutral, Info, Processing, Warning, Danger, Success — these map directly to the backend outreach statuses and should be preserved as-is. An `AI` tone is added for AI-generated/personalized indicators.

2. **Button `Style` variants**: Primary, Secondary — preserved. Extended with Tertiary and Destructive for additional hierarchy. The `Style` property name is kept.

3. **Existing frame dimensions**: Status Badge at 765×22px, Button at 251×36px — these were placeholder scaffolding. The new components will have proper sizing with hugging constraints and proper variant properties.

---

## 14. Figma Variable Collections to Create

| Collection | Variables | Modes |
|---|---|---|
| `Color` | All semantic colors (brand, neutral, status, gradient stops) | Light (default), Dark (future) |
| `Spacing` | 2px–96px tokens | Single mode |
| `Border Radius` | xs through full | Single mode |
| `Typography` | 18 text styles | Single mode |
| `Shadows` | 6 effect styles | Single mode |
| `Opacity` | 0–100% in 5% steps (for overlays, disabled states) | Single mode |

---

## 15. Next Steps — Figma Implementation

Once Figma MCP access is restored, the following will be created in the existing file:

1. **New page**: "Design System" (dedicated foundations page)
2. **Variable collections**: Color (with Light/dark modes), Spacing, Border Radius, Typography, Shadows, Opacity
3. **Text styles**: 18 styles matching the typography table
4. **Effect styles**: 6 shadow styles
5. **Component sets**: Status Badge, Button, Input Field, Chip, Card, Avatar
6. **Layout grid**: 12-column, 24px gutter, 1280px max width container
7. **Sidebar navigation**: Component or frame with all 10 sections

The existing "Foundations & Screens" page will be updated to use the new design system and the preserved Status Badge + Button components.

---

*Specification complete. Awaiting Figma write access to materialise.*