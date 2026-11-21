---
name: JNLOP Mobile
description: JNIC church-operations companion — Midnight Executive design system
colors:
  midnight-ink: "#070D1F"
  navy-surface: "#0D1730"
  slate-surface: "#131F42"
  navy-deep: "#04081A"
  navy-mute: "#16244B"
  signal-white: "#E9EDF7"
  slate-mute: "#7E8AAB"
  edge-slate: "#1B2748"
  edge-quiet: "#141E3D"
  brass-gold: "#C9A050"
  lamplight-gold: "#D9B870"
  gold-ink: "#0A1020"
  signal-green: "#4ADE80"
  signal-amber: "#FCD34D"
  signal-red: "#FCA5A5"
  signal-blue: "#93C5FD"
typography:
  display:
    fontFamily: "Fraunces"
    fontWeight: 500
  display-strong:
    fontFamily: "Fraunces"
    fontWeight: 600
  body:
    fontFamily: "Plus Jakarta Sans"
    fontWeight: 400
  body-strong:
    fontFamily: "Plus Jakarta Sans"
    fontWeight: 600
  label:
    fontFamily: "Plus Jakarta Sans"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brass-gold}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.signal-white}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
  chip:
    backgroundColor: "{colors.navy-surface}"
    textColor: "{colors.signal-white}"
    rounded: "{rounded.full}"
    padding: "12px 14px"
  chip-active:
    backgroundColor: "{colors.brass-gold}"
    textColor: "{colors.gold-ink}"
    rounded: "{rounded.full}"
    padding: "12px 14px"
  input-field:
    backgroundColor: "{colors.slate-surface}"
    textColor: "{colors.signal-white}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  card:
    backgroundColor: "{colors.navy-surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  list-row:
    backgroundColor: "transparent"
    textColor: "{colors.signal-white}"
    padding: "14px 16px"
  severity-tag:
    textColor: "{colors.lamplight-gold}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
---

# Design System: JNLOP Mobile

## Overview

**Creative North Star: "The Executive Brief"**

JNLOP Mobile reads like a boardroom briefing delivered after dark: a deep midnight field, content set in quiet columns, and a single brass voice that speaks only when it matters. The system is dense but never loud — status is carried by typography and hairlines before color, and gold appears where an executive would look first: the active tab, the coverage ring, the call to action.

Density is the point. An HQ pastor checks this app between meetings; every screen must read in seconds. That means compact vertical rhythm, serif figures for anything quantitative, and status rendered as text tags rather than decorative icons.

**Key Characteristics:**
- Full-bleed deep navy; surfaces step up through tonal navy layers, not cards-in-cards
- One accent (brass gold) at ≤10% of any screen
- Fraunces serif for numerals and the personal greeting only
- Hairline borders and uppercase overlines instead of boxes and icons

## Colors

A single brass accent on a midnight navy field; semantic colors are soft, never saturated.

### Primary
- **Brass Gold** (#C9A050): buttons, active chip/tab, progress ring fill, latest trend bar, gold rule under the hero. The only color that acts.
- **Lamplight Gold** (#D9B870): gold when it must read as text or icon on dark — links, wordmark, severity tags, focus borders (4.5:1+ contrast).
- **Gold Ink** (#0A1020): text/icons placed on a gold fill.

### Neutral
- **Midnight Ink** (#070D1F): page background, the deepest resting layer.
- **Navy Surface** (#0D1730): cards, sheets, inputs at rest on navy.
- **Slate Surface** (#131F42): inset wells — progress tracks, search fields, pressed states.
- **Navy Mute** (#16244B): trend bars, quiet fill elements.
- **Edge Slate** (#1B2748): borders; **Edge Quiet** (#141E3D): inner hairlines.
- **Signal White** (#E9EDF7): primary text.
- **Slate Mute** (#7E8AAB): secondary text, captions, meta.

### Semantic
- **Signal Green** (#4ADE80): positive deltas, success states.
- **Signal Amber** (#FCD34D): pending/warning.
- **Signal Red** (#FCA5A5): missed/urgent (softened for dark surfaces).
- **Signal Blue** (#93C5FD): informational.

### Named Rules
**The One Voice Rule.** Brass gold covers ≤10% of any screen — actions, active states, and the single most important figure. Its rarity is the point; a second accent is never added.
**The Muted Delta Rule.** Deltas and severity speak in semantic colors at caption weight; never filled chips of saturated color.

## Typography

**Display Font:** Fraunces (500/600)
**Body Font:** Plus Jakarta Sans (400–700)

**Character:** Jakarta does all the talking; Fraunces is reserved for numbers and the personal greeting, where its editorial weight reads like a printed figure in a ledger.

### Hierarchy
- **Display** (Fraunces 500, 30px/38): the hero greeting only ("Good evening, Davies")
- **Numeral** (Fraunces 500, 24–30px): KPI values, coverage figures, trend totals
- **Title** (Jakarta 600, 18px/24): card and section titles
- **Body** (Jakarta 400, 15–16px/21–22): row titles, descriptions
- **Caption** (Jakarta 500, 12px/16): meta lines, timestamps
- **Overline** (Jakarta 600, 11px/14, +0.08em tracking, uppercase): section labels, kickers, tags

### Named Rules
**The Serif Is for Figures Rule.** Fraunces never renders body copy, buttons, or navigation — only numerals and the greeting. A serif label is always wrong.
**The Small-Caps Rule.** Every section label, kicker, and severity tag is uppercase tracked type; never sentence-case bold.

## Layout

20px screen padding. Content stacks in a flat sheet below a full-bleed hero; sections separate by a muted overline + `md` (16px) gaps, never by boxed containers. Inside cards, rows divide by `Edge Quiet` hairlines. KPI strips run inline with hairline dividers between cells — no per-metric tiles. Lists use `ListRow` (title / subtitle / meta / trailing) at 44px+ touch height.

## Elevation & Depth

Flat by default: depth is tonal layering (Midnight Ink → Navy Surface → Slate Surface), not shadow. Two ambient shadows exist for genuinely raised surfaces only — `soft` (0 8px 24px rgba(4,8,26,.45)) on hero cards like the weekly-health ring, and `float` (0 12px 28px rgba(4,8,26,.6)) on the floating pill tab bar.

### Named Rules
**The Flat-By-Default Rule.** A card at rest has no shadow. Elevation is earned by floating chrome (tab bar) or a featured status card, never by grouping.

## Shapes

Generous card radius (`xl` 24px) against sharp-angled content; pills (`full`) for chips, tags, the tab bar, and progress rings; hairline borders where separation is needed. No clipped hero imagery, no asymmetric cuts — the geometry is a calm grid.

## Components

### Buttons
- **Shape:** `md` (12px) radius
- **Primary:** Brass Gold fill, Gold Ink text, 16px vertical padding, min 54px tall; pressed = 0.88 opacity + 0.985 scale with a light haptic. `navy` and `danger` tones exist for secondary/destructive actions.
- **Ghost:** transparent, Signal White text; pressed fills Slate Surface.

### Chips
- **Style:** Navy Surface pill, Edge Slate border, footnote-semibold text; active = Brass Gold fill + Gold Ink text.

### Cards / Containers
- **Corner:** `xl` on feature cards, `lg` on grouped lists
- **Background:** Navy Surface only — no gradients, no borders on feature cards
- **Shadow:** see Flat-By-Default Rule
- **Padding:** `md` (16px)

### Inputs / Fields
- **Style:** Slate Surface fill, `md` radius, transparent border at rest
- **Focus:** border turns Brass Gold on Navy Surface
- **On-navy variant:** Navy Mute fill with Edge-gold border

### List rows
- Title / subtitle / meta stack, optional trailing, Edge Quiet hairline divider, pressed = Slate Surface flash.

### Severity tags
- Uppercase tracked text on a soft semantic wash (`goldSoft`/`warningSoft`/`errorSoft`) — pill, never a filled saturated chip.

### Navigation
- **Floating pill tab bar:** glassy navy (blurred Navy Glow) floating above content, `float` shadow; active tab = Brass Gold pill behind Gold Ink label + icon. Inactive = Slate Mute icons, no labels.
- **Hero:** wordmark "JNIC · HQ" in tracked gold overline, small-caps meta line, serif greeting, gold hairline rule.

### Progress ring
- Brass Gold arc on a Slate Surface track, percent + "coverage" centered. Pure-RN implementation; used for weekly coverage only.

## Do's and Don'ts

### Do:
- **Do** render every numeric value in Fraunces.
- **Do** keep brass gold to actions, active states, and the key figure — ≤10% of a screen.
- **Do** separate sections with overline labels and hairlines, not nested cards.
- **Do** express status as small-caps text tags on soft washes.

### Don't:
- **Don't** place a kicker/eyebrow above a heading; the "JNIC · HQ" wordmark is identity, not an eyebrow.
- **Don't** use gradients — text or surfaces (also a hard constraint: no expo-linear-gradient is installed).
- **Don't** stack icon chips with headings inside a card — the nested-card default is banned.
- **Don't** use the ring, sparkline, or any figure as decoration — data only.
- **Don't** ship UI that needs a new native dependency; keep solutions pure-RN so changes ship via `eas update`.
