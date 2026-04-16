# Vision Caption Studio — Design System

> **Aesthetic identity:** Warm Neutral SaaS — organic, calm, commercially mature.  
> Reference: Anthropic Claude UI · Arc browser · Perplexity AI.  
> Not cold-blue enterprise. Not glassmorphism. Not neon.

---

## Table of Contents

1. [Color](#1-color)
2. [Typography](#2-typography)
3. [Spacing](#3-spacing)
4. [Border Radius](#4-border-radius)
5. [Shadows](#5-shadows)
6. [Borders](#6-borders)
7. [Components](#7-components)
8. [Motion](#8-motion)
9. [Status Badges](#9-status-badges)
10. [Layout](#10-layout)
11. [Empty States & Loading](#11-empty-states--loading)
12. [Interaction Rules](#12-interaction-rules)

---

## 1. Color

### Background

| Token | Hex | Usage |
|---|---|---|
| `page-bg` | `#F2EDE4` | Page canvas — the most important color in the palette |
| `card-bg` | `#FAF8F5` | Cards, panels, drawers, modals |
| `input-bg` | `#F5F1EB` | Input fields, textareas, code editors |
| `sidebar-bg` | `#EDE8DF` | Left navigation sidebar |

Never use pure white (`#FFFFFF`) as a background.

### Text

| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#1C1917` | Body, headings, labels |
| `text-secondary` | `#78716C` | Captions, muted labels, nav inactive |
| `text-placeholder` | `#A8A29E` | Input placeholders, disabled states |

### Actions

| Token | Hex | Usage |
|---|---|---|
| `action-primary` | `#2C2825` | Buttons, active links, focus borders |
| `action-primary-hover` | `#1A1714` | Hover state for primary elements |

### Accent

| Token | Hex | Usage |
|---|---|---|
| `accent` | `#D97757` | Muted terracotta. Active nav border, selected row indicator, key CTAs. **Maximum 1–2 uses per page.** |

The accent is a highlight tool, not a brand color applied broadly.

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `success` | `#3D7A5E` | Success text, icons, check states |
| `warning` | `#A16207` | Warning text, amber indicators |
| `danger` | `#B45050` | Destructive actions, error text |

### Border

| Token | Value | Usage |
|---|---|---|
| `border-default` | `rgba(0,0,0,0.07)` | Cards, panels — whisper-thin |
| `border-hover` | `rgba(0,0,0,0.14)` | Hover state on interactive borders |
| `border-input` | `rgba(0,0,0,0.12)` | Input fields — slightly more visible |
| `border-focus` | `#2C2825` | Keyboard focus on inputs |

### Do Not Use

- Any shade of bright blue (`#3B82F6`, `#1B4FD8`, etc.)
- Cold grays (`#6B7280`, `#9CA3AF`) — use warm stone equivalents
- Black shadows — use warm-tinted equivalents
- Pure white backgrounds

---

## 2. Typography

### Fonts

| Role | Font | Fallback | When to use |
|---|---|---|---|
| **UI / body** | Instrument Sans | DM Sans | All text |
| **Monospace** | Geist Mono | Courier New | Status badges, IDs, API keys, timestamps, code editors |

Import via `next/font/google`. Never use Inter, Roboto, Plus Jakarta Sans, or `system-ui`.

### Scale

| Element | Size | Weight | Color | Notes |
|---|---|---|---|---|
| `h1` | 28px | 600 | `#1C1917` | Page-level headings |
| `h2` | 20px | 600 | `#1C1917` | Section headings |
| `h3` | 16px | 600 | `#1C1917` | Card headings |
| Body | 14px | 400 | `#1C1917` | Line-height 1.6 |
| Label / nav | 14px | 500 | contextual | |
| Small / caption | 12px | 500 | `#78716C` | Letter-spacing `0.02em` |

**Never use font-weight 700 (bold).** It reads too harsh against warm backgrounds.

---

## 3. Spacing

Use only values from this scale: **4 · 8 · 12 · 16 · 24 · 32 · 48 px**

Tailwind equivalents: `p-1` `p-2` `p-3` `p-4` `p-6` `p-8` `p-12`

Do not introduce intermediate values (e.g., `p-5` = 20px) unless composing from the scale.

---

## 4. Border Radius

| Element | Radius | Tailwind |
|---|---|---|
| Button | 10px | `rounded-[10px]` |
| Input | 10px | `rounded-[10px]` |
| Card | 16px | `rounded-2xl` |
| Drawer (bottom-anchored) | 20px top corners only | `rounded-t-[20px]` |
| Tag / Badge (pill) | 9999px | `rounded-full` |
| Avatar | 50% | `rounded-full` |
| Nav item | 8px | `rounded-lg` |

Never go below 8px — it reads as corporate / dated.

---

## 5. Shadows

All shadows use warm-tinted, low-opacity values. Never use cold gray or black directly.

| Element | Value |
|---|---|
| **Card** | `0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)` |
| **Card hover** | `0 4px 16px rgba(28,25,23,0.10), 0 1px 4px rgba(28,25,23,0.06)` |
| **Popover / dropdown** | `0 8px 32px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)` |
| **Primary button** | `0 1px 3px rgba(28,25,23,0.20)` |
| **Drawer overlay** | `-8px 0 32px rgba(28,25,23,0.08)` |

---

## 6. Borders

Cards float on the page — their border is barely visible, and color contrast against the warm background creates natural separation.

```
Card border:     1px solid rgba(0,0,0,0.07)
Input border:    1px solid rgba(0,0,0,0.12)
Divider:         border-color rgba(0,0,0,0.06)
Dashed (upload): 1.5px dashed rgba(0,0,0,0.15)
```

On hover, input borders step up to `rgba(0,0,0,0.20)`.

---

## 7. Components

### Button

**Primary**
```
background: #2C2825
color:       #FAF8F5
radius:      10px
padding:     8px 16px
shadow:      0 1px 3px rgba(28,25,23,0.20)
hover:       background #1A1714, transform scale(0.99)
```

**Secondary**
```
background: #EDE8DF
color:      #2C2825
radius:     10px
border:     1px solid rgba(0,0,0,0.07)
hover:      background #E5DFD6
```

**Ghost / Danger**
```
color:  #B45050
hover:  background rgba(180,80,80,0.06)
```

Never use bright blue buttons.

### Input / Textarea

```
background:   #F5F1EB
border:        1px solid rgba(0,0,0,0.12)
radius:        10px
placeholder:   color #A8A29E
focus border:  #2C2825
focus shadow:  0 0 0 3px rgba(44,40,37,0.08)
```

### Card

```
background: #FAF8F5
border:     1px solid rgba(0,0,0,0.07)
radius:     16px
shadow:     card shadow (see §5)
```

Cards do not need a heavy border — the shadow and background contrast handle separation.

### Sidebar Nav Item

```
default:  color #78716C, hover background rgba(0,0,0,0.05)
active:   background #2C2825, color #FAF8F5, radius 8px
```

### Segmented Control (Tab switcher)

```
container: background #F2EDE4, radius 12px, padding 4px
active tab: background #FAF8F5, shadow 0 1px 3px rgba(28,25,23,0.10)
inactive tab: color #78716C
```

### Tag / Pill (read-only)

```
background: #F5F1EB
border:     1px solid rgba(0,0,0,0.12)
color:      #1C1917
radius:     9999px
padding:    4px 12px
font-size:  12px, weight 500
```

### Drawer

```
width:        400px
background:   #FAF8F5
border-left:  1px solid rgba(0,0,0,0.07)
shadow:       -8px 0 32px rgba(28,25,23,0.08)
animation:    slide-in-right 220ms cubic-bezier(0.32, 0, 0.08, 1)
top:          below header (56px)
```

On mobile (< 768px), drawers become full-screen sheets anchored to the bottom.

---

## 8. Motion

| Interaction | Duration | Easing | What animates |
|---|---|---|---|
| Button / nav hover | 120ms | ease-out | background, color — never layout |
| Card hover | 120ms | ease-out | shadow, transform scale |
| Panel / drawer slide | 220ms | `cubic-bezier(0.32, 0, 0.08, 1)` | translateX |
| Page / section mount | 180ms | ease-out | opacity 0→1, translateY 4px→0 |
| Toast | 200ms | ease-out | slide from bottom-right |
| Skeleton shimmer | 1.8s | ease-in-out | gradient position, infinite |

**Rules:**
- Hover transitions are background/border/color only. Never animate layout, width, or position on hover.
- Scale on hover: card `scale(1.02)`, primary button `scale(0.99)`.
- No spring animations or bounce effects.
- Respect `prefers-reduced-motion` — wrap motion in a media query or use the `useReducedMotion` hook.

### CSS Keyframes Reference

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1;   transform: scale(1);   }
  50%       { opacity: 0.5; transform: scale(0.75); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0);   }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

---

## 9. Status Badges

Badges use **Geist Mono**, 11px, uppercase, fully rounded (pill), with no border.

| Status | Background | Text |
|---|---|---|
| `QUEUED` | `#E8E4DE` | `#78716C` |
| `PROCESSING` | `#FEF3C7` | `#92400E` + 6px pulsing dot |
| `SUCCEEDED` | `#D1FAE5` | `#065F46` |
| `FAILED` | `#FEE2E2` | `#991B1B` |

The PROCESSING dot pulses via the `pulse-dot` keyframe (1.4s ease-in-out infinite).

Implementation: `src/components/ui/status-badge.tsx`

```tsx
<StatusBadge status="PROCESSING" />
```

---

## 10. Layout

### Shell Structure

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (240px, fixed)   │ Header (56px, sticky)      │
│ bg: #EDE8DF              │ bg: #F2EDE4                │
│                          ├────────────────────────────│
│  Logo                    │                            │
│  Nav items               │  Page content              │
│  ...                     │  (scrollable per page)     │
│  Logout                  │                            │
└──────────────────────────────────────────────────────┘
```

- Sidebar: `position: fixed`, `width: 240px`, `height: 100vh`, `overflow-y: auto`
- Header: `height: 56px`, `position: sticky`, `top: 0`
- Content: `flex-1`, `overflow: hidden` — each page manages its own scroll

### Content Width

Standard pages: `max-width: 1100px`, centered, `padding: 0 24px`  
Settings / forms: `max-width: 680px`, centered

### Two-Column Pages (Generate, Prompt Templates)

```
┌──────────────┬─────────────────────────────────────┐
│ Left panel   │ Right panel                          │
│ fixed width  │ flex-1, fills remaining              │
│ border-right │ independently scrollable             │
└──────────────┴─────────────────────────────────────┘
```

Both panels: `height: calc(100vh - 56px)`, `overflow-y: auto`

Left panel widths: Generate `380px` · Prompt Templates `280px`

### Mobile (< 768px)

- Sidebar collapses to bottom navigation bar (5 icons)
- Drawers become full-screen bottom sheets
- Grids: 2 columns
- Two-column pages: stack vertically

---

## 11. Empty States & Loading

### Empty State

Every list, grid, or table that can be empty must show:

```
[Icon — 40px, color #A8A29E]
[Primary message — 14px, #78716C]
[Optional CTA — link or button]
```

Never show "No data" alone without context or a next action.

### Skeleton Loading

Use shimmer skeletons for all async content. Never use generic spinners for page or section loading.

```css
.skeleton {
  background: linear-gradient(90deg, #EDE8DF 25%, #E5DFD6 50%, #EDE8DF 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
  border-radius: 6px;
}
```

Spinner (small, inline) is only appropriate inside a button during a pending action.

---

## 12. Interaction Rules

### Destructive Actions

- **No modals for delete confirmation.** Use inline confirm only.
- Pattern: button click once → label changes to "Confirm delete?" → auto-resets after 2s if not confirmed → click again to execute.
- Use `Ghost / Danger` button style. On confirmed state, switch to filled danger (`background: #B45050, color: white`).

### Focus

```
outline: 2px solid #2C2825
outline-offset: 2px
```

Must be visible on all interactive elements. Do not remove focus rings.

### Toasts

- Position: bottom-right
- Duration: 4000ms
- Slide in on mount, fade out on dismiss
- Success icon: `#3D7A5E` · Error icon: `#B45050`
- Style matches warm card aesthetic (not default OS toast)

### Forms

- Press **Enter** to submit login and single-field forms.
- In tag inputs, press **Enter** to add a tag. Click **×** to remove.
- Validation errors appear inline below the field (never as alerts above the form).
- API errors appear as toasts.

### Tooltips

Appear on hover via CSS (`:hover` + sibling selector or Tailwind `group-hover`). No JavaScript-driven tooltip libraries needed for simple guard messaging.

---

## Appendix — Quick Reference

```
Page bg:       #F2EDE4   Card bg:      #FAF8F5
Sidebar bg:    #EDE8DF   Input bg:     #F5F1EB
Primary:       #2C2825   Primary text: #1C1917
Secondary txt: #78716C   Placeholder:  #A8A29E
Accent:        #D97757   (use sparingly)
Success:       #3D7A5E   Warning:      #A16207   Danger: #B45050

Font:          Instrument Sans (400/500/600)
Mono:          Geist Mono
Radius:        btn/input 10px · card 16px · pill 9999px
Card shadow:   0 1px 4px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)
Hover:         120ms ease-out
Drawer slide:  220ms cubic-bezier(0.32, 0, 0.08, 1)
```
