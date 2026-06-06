# Design

## Theme

Restrained thematic。宣纸质感背景 + 现代干净的功能 UI，水墨和行纪的意象以微妙细节呈现。浅色模式为默认（开发者在明亮环境下的本地工具），深色模式保持一致的质感。

## Color

### Primary palette

| Token | Name | Value | Usage |
|-------|------|-------|-------|
| `--ink` | 墨色 | `#1a1a1a` | Primary text, logo strokes |
| `--ink-light` | 淡墨 | `#3d3d3a` | Secondary text |
| `--ink-wash` | 游墨 | `#5e5d59` | Tertiary text, placeholders |
| `--rice` | 宣白 | `#f5f0e8` | Primary background |
| `--rice-medium` | 素宣 | `#ebe6da` | Secondary background |
| `--rice-dark` | 旧纸 | `#e2dcd0` | Tertiary background, dividers |

### Brand accent

| Token | Name | Value | Usage |
|-------|------|-------|-------|
| `--cinnabar` | 朱砂 | `#c23a2e` | Primary accent, stamps, CTA |
| `--cinnabar-hover` | 朱砂亮 | `#d44a3e` | Hover state |
| `--indigo` | 靛青 | `#2c5f7c` | User events, links |
| `--mineral` | 石绿 | `#4a7c5c` | Success, active status |
| `--ochre` | 赭石 | `#a67c52` | File/tool events |
| `--fig` | 紫果 | `#9c4a6a` | Interrupted status |

### Semantic colors

| Token | Name | Value | Usage |
|-------|------|-------|-------|
| `--status-active` | 行进中 | 石绿 | Active sessions |
| `--status-complete` | 已达 | 淡墨 | Completed sessions |
| `--status-interrupted` | 暂歇 | 紫果 | Interrupted sessions |
| `--status-failed` | 陨途 | 朱砂 | Unrecoverable sessions |

### Dark mode

墨色背景体系: `#141413` / `#1e1e1c` / `#2a2a28`。文字变为宣白体系。朱砂红保持不变。石绿、靛青饱和度微调以保持深色可读性。

## Typography

| Role | Font | Fallback | Sizes |
|------|------|----------|-------|
| Display (brand titles) | LXGW WenKai | Noto Serif SC | 18-24px / 500 |
| Body | Inter | system-ui | 14px / 400 |
| Caption | Inter | system-ui | 12px / 400 |
| Code/data | JetBrains Mono | Fira Code | 13px / 400 |

Type scale: fixed rem, 1.125 ratio between steps. No fluid clamp for product UI.

## Spacing

8-step scale preserved: 0, 4, 8, 12, 16, 20, 24, 32, 40px. All spacing uses `var(--space-N)`.

## Radius

6-step scale: 4, 6, 8, 10 (revised from 12), 16, 9999px. Cards use 10px for a slightly more hand-cut feel.

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | Multi-layer soft shadow | Default card elevation |
| `--shadow-card-hover` | Deeper shadow | Card hover lift |
| `--shadow-lg` | Heavy shadow | Dropdowns, elevated panels |

## Textures

Paper grain at 2-3% opacity via inline SVG noise on primary background. Barely perceptible, creates tactile feel without interfering with text readability. Dark mode uses inverted noise.

## Components

### Session Card

Elevated paper card with shadow. Status via left-edge color strip (4px). Title + metadata + metrics separated by dashed stitch-line. Hover: translateY(-1px) + shadow deepen. Press: scale(0.98). Selected: accent border + strongest shadow.

### Timeline

Vertical dashed thread connecting all event nodes. Each node is a circular icon stamp (28-32px) sitting on the thread. Different colors per event type: indigo (user), mineral (AI), ochre (file), ink-wash (command), cinnabar (error). Events enter with stagger animation.

### Login Page

Journal cover metaphor. Paper texture background. Large brand title in LXGW WenKai. Password input with bottom-border-only styling. Cinnabar submit button with "stamp press" effect. Footer stitch-line divider.

### Header (Desktop)

Kraft-toned strip. Logo + brand name + cinnabar stamp. Stats as small tag. 1px cinnabar bottom line as binding thread.

### Mobile Bottom Tab Bar

Three tabs: 目录, 路线, 报告. Active indicator: cinnabar dot below icon. Backdrop blur preserved. Tab switch: content slide + dot slide animation.

## Motion

Library: Motion for React (v12.x). Spring physics: stiffness 300-400, damping 25-30. Durations: 100-250ms for interactions, 400ms max for page transitions. All animations respect `prefers-reduced-motion`. No decorative motion; every animation conveys state change or spatial relationship.

## Implementation Priority

1. Design token overhaul (colors, fonts, textures)
2. SessionCard redesign (elevation + status strip + hover)
3. Timeline redesign (vertical thread + node stamps)
4. Login page (journal cover)
5. Desktop header (kraft strip)
6. Mobile layout + tab bar
7. SessionDetail (report layout)
8. Micro-interactions (press, lift, stamp confirmations)
