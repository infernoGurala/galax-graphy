# DESIGN.md

## Philosophy
- Distraction-free, ADHD-friendly
- No sidebar — ever
- Full-width content, maximum breathing room
- Every screen shows ONE thing at a time
- Regular fonts with thin fonts contrasts. 
- sharp text to background color contrasts. 
- High performance, quick access tools. 

---

## Color Tokens
| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#1A191C` | App background |
| `--text` | `#E6E6E6` | Primary text |
| `--text-muted` | `#6B6A6E` | Secondary text, placeholders |
| `--surface` | `#242328` | Cards, inputs, hover states |
| `--border` | `#2E2D31` | Dividers, borders |
| `--accent` | TBD | Active states, links, highlights |

> Contrast ratio: 14.02 — passes AA + AAA across all sizes.

---

## Typography
- Font: TBD (clean, modern, highly legible — not Inter, not Roboto)
- Body size: 16px
- Line height: 1.7
- Max content width: 720px (centered)

---

## Navigation
- **Top bar only** — no sidebar
- Contains: Home button · Breadcrumb · Minimal actions
- Breadcrumb format: `Home / Workspace / Folder / Note`
- Home button resets to workspace selection screen

---

## Screen Flow
```
Password Gate
    ↓
Workspace Selection (grid of workspace cards)
    ↓
Folder Selection (grid of folder cards)
    ↓
Note (full-width Novel editor)
```

---

## UI Rules
- No sidebar
- No floating panels unless triggered by user
- No decorations, gradients, or textures
- Hover states use `--surface` background only
- Animations: subtle fade-ins only, no bouncing or sliding
- Mobile-friendly but desktop-first
