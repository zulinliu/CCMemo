# CCMemo Design Reference

**Purpose:** Comprehensive design research for CCMemo's visual redesign toward an explorer's journal / paper-craft aesthetic, with refined micro-interactions and multi-device consistency (especially iOS PWA).

**Date:** 2026-06-06

---

## A. Brand Design References

### A.1 Developer Tools with Exceptional Branding

#### Linear (linear.app)
- **URL:** https://linear.app
- **What makes it exceptional:** Linear is the gold standard for premium developer tool branding. The entire brand is built around speed, focus, and dark-mode-first design. Key brand decisions: a single geometric wordmark, a monochrome + single-accent color system (purple), cinematic product photography, and a website that feels like a movie trailer.
- **Brand elements:**
  - Monochrome dark theme with a single violet accent
  - Geometric sans-serif wordmark
  - PWA-ready: `apple-mobile-web-app-capable=yes`, `viewport-fit=cover`
  - Smooth page transitions via custom animation system
  - Product screenshots are always in context (dark IDE background)
- **What CCMemo can borrow:** The restraint. Linear proves a developer tool can feel premium without being complex. One accent color. One typeface. Dark mode as default. The lesson is not to copy the dark theme but to adopt the discipline: pick one strong identity element (our terracotta `#c6613f`) and build everything around it.

#### Notion
- **URL:** https://notion.so
- **What makes it exceptional:** Notion's brand is its typography and iconography. The handwritten-style logo, the emoji-as-icon system, and the clean page metaphor create an instantly recognizable identity. The product IS the brand -- every screenshot looks like Notion.
- **Brand elements:**
  - Handwritten/script logo contrasted with ultra-clean UI
  - Emoji as functional icons (documents, databases, calendars)
  - Black + white + single blue accent
  - "Block" metaphor creates visual consistency across every feature
- **What CCMemo can borrow:** The contrast between a warm/handcrafted logo and a precise UI. CCMemo can have a stamp/seal-style logo paired with a clean, structured interface. The "explorer journal" identity should live in the logo, textures, and transitions -- not in cluttering the functional UI.

#### Obsidian
- **URL:** https://obsidian.md
- **What makes it exceptional:** Obsidian uses a deep purple + dark theme that evokes its namesake (volcanic glass). The graph view is its signature visual element. The brand communicates "knowledge archaeology" -- digging through connections.
- **What CCMemo can borrow:** The metaphor-brand alignment. Obsidian = volcanic glass = knowledge connections. CCMemo = explorer's journal = session memory. The metaphor should extend from the name through to every visual decision.

#### Warp Terminal
- **URL:** https://warp.dev
- **What makes it exceptional:** Warp is a terminal emulator with IDE-quality UI. It uses a modern sans-serif font, rounded corners, and a vibrant accent system that feels more like a design tool than a terminal. Their "blocks" concept (each command + output is a visual block) is a direct parallel to CCMemo's timeline events.
- **What CCMemo can borrow:** The block metaphor for timeline events. Warp treats terminal output as discrete, visually distinct blocks -- CCMemo should treat session events as journal entries on a thread, each with distinct visual identity.

### A.2 Organic/Crafted/Playful Aesthetics in Tech

#### Figma
- **Brand:** Multi-colored rounded geometric shapes. Playful but not childish.
- **Lesson:** A crafted feel does not require skeuomorphism. Figma uses flat shapes but with organic curves and warm colors.

#### GitHub (2023+ redesign)
- **Brand:** Introduced a primer color system with warm neutrals, moved away from cold grays.
- **Lesson:** Even large-scale developer tools are moving toward warmer palettes -- validating CCMemo's ivory/slate direction.

#### Supabase
- **Brand:** Dark theme with green accents, but uses a gradient mesh background that creates depth and atmosphere without texture.
- **Lesson:** Background atmosphere matters. A flat solid color feels unfinished.

### A.3 Paper/Craft/Notebook Visual Metaphors

#### Moleskine Digital (closed)
- The physical Moleskine notebook brand tried a digital product. The brand identity relied on: rounded corners, a cream background, a ribbon bookmark accent color, and an elastic band closure metaphor. These 4 elements were enough to evoke "premium notebook."

#### Bear App (Shiny Frog)
- **URL:** https://bear.app
- **What makes it exceptional:** Bear is a markdown note-taking app with a warm, slightly whimsical aesthetic. It uses a warm color palette (reds, oranges, browns), a serif font for headings, and subtle icon illustrations. The app feels like writing in a leather-bound journal.
- **Brand elements:**
  - Warm color scheme: deep reds, burnt oranges, tans
  - Bear icon/logo in various illustrated poses
  - Serif headings paired with clean sans-serif body text
  - Subtle background textures
- **What CCMemo can borrow:** The warm palette (already have with terracotta/ivory). The serif-for-headings idea could work for section titles. The overall "this is a pleasant place to write/read" feeling.

#### GoodNotes
- **URL:** https://goodnotes.com
- **What makes it exceptional:** Digital handwriting app that makes paper feel digital. Uses warm cream backgrounds, ruled line patterns, and a subtle paper texture throughout. The "paper" feel comes from the ruled lines + warm background + slightly rough text rendering.

#### Craft Docs
- **URL:** https://craft.do
- **What makes it exceptional:** Craft uses a card-based document metaphor with smooth animations and a warm, minimal aesthetic. Documents have subtle shadows creating depth. The cover images and typography create a magazine-like feel.
- **Brand elements:**
  - Card-based document metaphor with elevation
  - Warm neutral backgrounds
  - Smooth page-turn transitions
  - Cover images for documents
- **What CCMemo can borrow:** Card elevation for session cards. Page-turn-like transitions between session list and detail view. The sense that each card is a physical thing you can pick up.

### A.4 2025-2026 Logo & Brand Trends

Based on current design direction in the industry:

1. **Neo-handcrafted:** Hand-drawn elements paired with precise digital typography. Think: a stamp or seal that looks hand-pressed, paired with Inter or Geist font.
2. **Geometric warmth:** Simple geometric shapes (circles, rounded squares) with warm color fills instead of gradients. CCMemo's current rounded-square logo with terracotta fill is already on-trend.
3. **Monochrome + one accent:** The dominant trend. Use one strong color as the identity anchor (CCMemo's terracotta `#c6613f`).
4. **Functional logos:** The logo does double duty as an app icon. Simple shapes that read well at 16px and 512px.
5. **Stamp/seal aesthetics:** Circular or shield-shaped elements with contained illustrations. This aligns perfectly with the explorer journal theme.

### A.5 Actionable Brand Recommendations for CCMemo

1. **Keep the terracotta accent** (`#c6613f`) as the sole brand color. It is distinctive, warm, and already associated with earth/craft.
2. **Redesign the logo** toward a stamp/seal metaphor:
   - Circular or shield shape (instead of rounded square)
   - Contained illustration: compass rose, folded map, or quill/lamp combination
   - Single-color (terracotta) with white interior
   - Must read at 16px favicon size and 512px app icon size
3. **Typography pairing:**
   - Body: Inter (current) -- keep, it is excellent
   - Display/headings: Consider adding a serif (like Merriweather, Lora, or Source Serif) for headings that evoke "journal title"
   - Code: JetBrains Mono (current) -- keep
4. **Photography/illustration style:** If any illustration is needed, use:
   - Stippled/engraved style (like vintage field guide illustrations)
   - Single accent color on cream background
   - No photography, no gradients, no 3D renders
5. **Sound identity:** Consider a subtle "stamp thud" sound for confirmation actions (optional, can be added later)

---

## B. UI Design References

### B.1 Japanese-Inspired Minimal Design (Wabi-Sabi)

#### Principles Applied to Digital UI
Wabi-sabi values imperfection, impermanence, and incompleteness. In UI design, this translates to:
- **Intentional asymmetry:** Not everything needs to be perfectly centered or aligned. A subtle offset creates visual interest.
- **Natural materials:** Warm paper tones (already in CCMemo's ivory palette), visible "grain" or texture, organic shapes.
- **Restraint:** Fewer elements, more whitespace. Each element earns its place.
- **Aging gracefully:** Content that looks better as it accumulates (session histories should feel like a well-used journal, not a pristine page).

#### Muji (mujidesignphilosophy)
- **URL:** https://muji.com
- **Design principles:** Raw materials, no decoration, functional beauty. Muji products use unbleached paper, visible stitching, and simple typography.
- **UI translation:** Minimal borders, warm backgrounds, functional typography without decorative elements.

#### Traditional Washi Paper Aesthetic
Washi paper has a distinctive fibrous texture, warm cream color, and slight translucency. In digital design:
- **Texture:** Subtle noise/grain overlay at 2-4% opacity on cream backgrounds
- **Color:** Not pure white but warm ivory (`#faf9f5` -- CCMemo already has this)
- **Translucency:** Semi-transparent overlays with backdrop-blur (CCMemo's mobile tab bar already uses this)
- **Edge quality:** Slightly rough or deckled edges on cards/panels

#### Practical Implementation
```css
/* Paper texture overlay */
:root {
  --texture-paper: url("data:image/svg+xml,..."); /* inline SVG noise pattern */
}

/* Apply as background on main container */
.paper-bg {
  background-color: var(--color-ivory-light);
  background-image: var(--texture-paper);
  background-repeat: repeat;
}
```

The grain can be generated as a small (100x100px) SVG with `<feTurbulence>` or as a repeating PNG. The key is subtlety -- the texture should be barely perceptible, creating a feeling rather than a visible pattern.

### B.2 Vintage Cartography / Explorer Journal Aesthetic

#### Visual Elements
1. **Aged paper backgrounds:** Warm ivory with subtle staining or foxing effects
2. **Cartographic details:** Compass roses, dotted travel routes, coordinate markers
3. **Typography:** Serif headings, monospace coordinates, italic captions
4. **Line styles:** Dotted paths, dashed borders, hairline rules
5. **Color palette:** Sepia, burnt sienna, indigo, aged gold -- all already close to CCMemo's existing palette (terracotta, kraft, olive, sky)

#### Applied to CCMemo
- **Session list = index/table of contents:** Each session is an entry in a travel log, with a date, destination (project), and status (completed/interrupted = arrived/shipwrecked)
- **Timeline = travel route:** Events plotted along a vertical thread, like points on a map. Each event is a "discovery" or "waypoint"
- **Search = expedition index:** Finding specific knowledge from past journeys
- **Session detail = expedition report:** A structured account of what happened, with key metrics and observations

#### Specific UI Treatments
1. **Session cards as index cards:** Slight shadow, cream background, colored left-edge tab by status, monospace date stamps
2. **Timeline thread as a dotted path:** Vertical dashed line connecting event nodes, like a route on a map
3. **Event nodes as map pins/stamps:** Each event type has a distinct stamp-like icon (user message = speech mark stamp, tool call = gear stamp, file edit = document stamp)
4. **Coordinates/metadata in monospace:** Session IDs, timestamps, durations displayed like map coordinates
5. **Section dividers as dashed lines:** Stitch-like separators between sections, evoking sewn journal binding

### B.3 Hand-Crafted Digital Interfaces

#### Reference: Blogspot/WordPress Classic Themes (modernized)
The "craft" web aesthetic (as opposed to the "glass" aesthetic of Apple/fintech) is characterized by:
- Warm, off-white backgrounds
- Serif or handwritten display fonts
- Visible borders and shadows (not floating/glass)
- Card-based layouts with physical metaphors
- Subtle texture overlays

#### Reference: Readwise Reader
- **URL:** https://readwise.io/read
- **What makes it relevant:** Reader is a reading app that uses a warm, paper-like theme with clean typography. The "Paper" theme is not literally skeuomorphic paper but uses warm whites, soft shadows, and comfortable typography to create a reading-pleasant environment.

#### Reference: Things 3 (Cultured Code)
- **URL:** https://things.app
- **What makes it relevant:** Things is a task manager known for its exceptional UI craft. It uses subtle animations, a warm color palette, and carefully considered spacing. Every interaction feels intentional and polished.
- **Key lesson:** The craft is in the details, not in skeuomorphism. Things doesn't look like a physical notebook -- it looks like software made by someone who cares deeply about quality.

### B.4 Warm Paper Tone Implementation

#### Color Science
CCMemo's existing ivory palette is already well-chosen. The key refinement:

| Token | Current | Recommendation | Rationale |
|-------|---------|---------------|-----------|
| `--color-ivory-light` | `#faf9f5` | Keep | Excellent warm white, already paper-like |
| `--color-ivory-medium` | `#f0eee6` | Keep | Good secondary background |
| `--color-ivory-dark` | `#e8e6dc` | Keep | Good tertiary/separator |
| `--color-accent` | `#c6613f` | Keep | Distinctive, warm, craft-aligned |
| `--color-kraft` | `#d4a27f` | Keep | Perfect for header strips and accents |

New tokens to add:

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-aged-paper` | `#f5f0e6` | Slightly warmer background for special areas (login, detail header) |
| `--color-sepia` | `#8b7355` | For decorative elements, vintage text accents |
| `--color-thread` | `var(--color-cloud-light)` | For timeline connecting line |
| `--color-wax-seal` | `var(--color-accent)` | For stamp/seal style badges |

---

## C. iOS PWA Best Practices (2025-2026)

### C.1 iOS Safari PWA Capabilities

#### Web Push (iOS 16.4+)
- **APIs:** Push API + Notifications API + Service Workers
- **Requirements:** Must be added to Home Screen first. Requires a valid push subscription through a push service.
- **CCMemo relevance:** Low priority. CCMemo is local-first and does not need push notifications in its current form. Could be used for "scan complete" notifications in the future.

#### Badging API (iOS 16.4+)
- **API:** `navigator.setAppBadge()` / `navigator.clearAppBadge()`
- **Usage:** Set a numeric badge on the Home Screen icon.
- **CCMemo relevance:** Medium. Could show count of new/active sessions after a scan. Simple to implement.

#### Manifest ID (iOS 17+)
- **Purpose:** The `id` field in the Web App Manifest uniquely identifies the app. Without it, iOS may create duplicate icons if the start_url changes.
- **Current status:** CCMemo's `manifest.webmanifest` does not have an `id` field.
- **Recommendation:** Add `"id": "/"` to the manifest.

#### Screen Wake Lock (iOS 16.4+)
- **API:** `navigator.wakeLock.request('screen')`
- **Usage:** Prevent screen from sleeping during active use.
- **CCMemo relevance:** Low. Could be useful during long session reviews.

#### Screen Orientation API
- **CCMemo relevance:** Low. CCMemo works in any orientation.

#### Third-Party Browser "Add to Home Screen" (iOS 17+)
- Before iOS 17, only Safari could add web apps to the Home Screen. Now Chrome, Firefox, Edge, etc. on iOS can also add web apps.
- **Impact:** Users are not locked into Safari for PWA usage.

### C.2 PWA Manifest Best Practices for iOS

#### Current CCMemo Manifest Analysis
```json
{
  "name": "CCMemo",
  "short_name": "CCMemo",
  "display": "standalone",
  "background_color": "#faf9f5",
  "theme_color": "#C6613F"
}
```

This is minimal but functional. Recommended improvements:

1. **Add `id`:** `"id": "/"` to prevent duplicate icons
2. **Add `description`:** For accessibility and store listings
3. **Add `categories`:** `["productivity", "utilities"]`
4. **Add `screenshots`:** Required for "installable" quality signals
5. **Add maskable icon padding:** Current SVG icon may clip when used as maskable. Add a dedicated maskable icon with safe-zone padding (inner 80% of the icon area)
6. **Add `display_override`:** Consider `["window-controls-overlay"]` for desktop PWA support
7. **Update `icons`:** Provide multiple sizes: 192x192 and 512x512 PNG (in addition to SVG)

#### Recommended Manifest Update
```json
{
  "id": "/",
  "name": "CCMemo - Session Memory Manager",
  "short_name": "CCMemo",
  "description": "Turn Claude Code session transcripts into searchable, reusable engineering assets",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#faf9f5",
  "theme_color": "#C6613F",
  "categories": ["productivity", "utilities", "developer-tools"],
  "icons": [
    {
      "src": "/logo-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/logo-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/logo-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/logo-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/logo.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

### C.3 iOS-Specific HTML Meta Tags

CCMemo should include these in `<head>`:

```html
<!-- iOS PWA -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="CCMemo">
<meta name="mobile-web-app-capable" content="yes">

<!-- Viewport with safe area support -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

<!-- Theme color for browser chrome -->
<meta name="theme-color" content="#C6613F">
<meta name="theme-color" content="#141413" media="(prefers-color-scheme: dark)">

<!-- Apple touch icon -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Splash screens (iOS generates these from apple-touch-icon) -->
```

### C.4 Native-Feeling iOS PWA Patterns

#### Safe Area Handling
CCMemo's mobile layout already uses safe-area padding. The key CSS:

```css
/* Bottom tab bar safe area */
padding-bottom: env(safe-area-inset-bottom, 0px);

/* Full-viewport height */
height: 100dvh; /* Dynamic viewport height - adjusts for browser chrome */

/* Status bar area */
padding-top: env(safe-area-inset-top, 0px);
```

The `dvh` unit is critical for iOS PWA -- it accounts for the dynamic viewport changes when the address bar appears/disappears. CCMemo already has a `@supports` fallback:

```css
@supports not (height: 100dvh) {
  .h-dvh {
    height: 100vh;
    height: -webkit-fill-available;
  }
}
```

This is correct and should be preserved.

#### Touch Target Sizes
Apple HIG recommends minimum 44x44pt touch targets. CCMemo's `--height-control-xl: 44px` matches this. Ensure:
- All interactive elements are at least 44x44px
- Tab bar items have adequate spacing
- No touch targets are placed within 8px of each other

#### Haptic Feedback
No web standard for haptics, but iOS Safari does provide automatic haptic feedback on certain interactions (button presses, toggles). Design buttons to feel "pressable" with visual feedback (scale down on active state).

#### Overscroll Behavior
CCMemo already uses `overscroll-behavior: none` on body. This prevents the iOS rubber-band effect from revealing the underlying content or triggering back-navigation.

#### Pull-to-Refresh
Not needed for CCMemo (content refreshes automatically). Prevent accidental pull-to-refresh by keeping `overscroll-behavior: none`.

### C.5 iOS PWA Limitations (2026)

1. **No background execution:** When the PWA is not in the foreground, JavaScript stops executing. Service workers can handle push events but cannot run arbitrary background tasks.
2. **Storage limits:** Web Storage and IndexedDB are limited (~50MB soft limit before iOS prompts the user). CCMemo uses the backend API, not client-side storage, so this is not a concern.
3. **No access to native APIs:** No Camera, HealthKit, HomeKit, etc. Not relevant for CCMemo.
4. **Service Worker lifecycle:** iOS may terminate service workers aggressively. CCMemo's service worker is simple (cache-first for static assets, network-first for API), which is correct.
5. **Cache eviction:** iOS may evict web app caches under storage pressure. The service worker should handle cache misses gracefully (which it does by falling back to network).

### C.6 Service Worker Improvements

The current `sw.js` is functional but basic. Recommended improvements:

1. **Version the cache by content hash** (not by hard-coded version string)
2. **Add offline fallback page** for when the server is unreachable
3. **Consider `workbox`** for more sophisticated caching strategies
4. **Add `fetch` event handler for API calls** with network-first strategy and timeout

### C.7 Actionable iOS PWA Recommendations for CCMemo

1. **Add `id` field to manifest** -- prevents duplicate Home Screen icons
2. **Generate PNG icons at 192x192 and 512x512** -- iOS needs these for splash screens
3. **Add `apple-mobile-web-app-capable` meta tag** -- ensures standalone mode
4. **Add `apple-mobile-web-app-status-bar-style: default`** -- gives normal status bar appearance
5. **Verify `viewport-fit=cover`** in viewport meta -- enables safe-area insets
6. **Test on iOS Safari 17+** for third-party browser Add to Home Screen
7. **Add Badging API** for showing active session count on Home Screen icon (low effort, high polish)

---

## D. Animation & Micro-Interaction Patterns

### D.1 Animation Library: Motion for React (formerly Framer Motion)

**URL:** https://motion.dev
**Current version:** 12.34.0 (as of 2026-06-06)
**License:** MIT (core), paid add-ons (Motion+)

Motion is the recommended animation library for CCMemo's React frontend. It provides:
- Declarative animation API via `<motion.div>` components
- Enter/exit animations via `<AnimatePresence>`
- Layout animations (automatic position/size transitions)
- Gesture animations (whileHover, whileTap, whileInView)
- Variant system for orchestrating parent/child animations
- Hardware-accelerated transforms
- `useReducedMotion()` hook for accessibility

#### Key Motion APIs for CCMemo

##### 1. Enter/Exit Animations with AnimatePresence
For session cards appearing/disappearing, modal open/close, and page transitions.

```tsx
import { motion, AnimatePresence } from "motion/react"

<AnimatePresence>
  {sessions.map(session => (
    <motion.div
      key={session.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <SessionCard session={session} />
    </motion.div>
  ))}
</AnimatePresence>
```

**CCMemo use cases:**
- Session cards entering the list as they load
- Timeline events appearing as they stream in
- Detail panel sliding in when a session is selected
- Empty state fade-in when no sessions match search

##### 2. Layout Animations with layoutId
For shared element transitions between list and detail views.

```tsx
// In session list card:
<motion.div layoutId={`session-${session.id}`}>
  <SessionCard session={session} />
</motion.div>

// In detail view header:
<motion.div layoutId={`session-${session.id}`}>
  <SessionHeader session={session} />
</motion.div>
```

When navigating from list to detail, the card smoothly morphs into the header. This creates a "page turn" effect that feels like opening a journal entry.

**CCMemo use cases:**
- Session card morphing into detail header
- Search bar position transition when scrolling
- Tab indicator sliding between tabs

##### 3. Variant Orchestration with Stagger
For coordinated entrance animations of list items.

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.04, // 40ms between each child
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 }
}

<motion.ul variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.li key={item.id} variants={itemVariants} />
  ))}
</motion.ul>
```

**CCMemo use cases:**
- Stat cards animating in sequence
- Timeline events appearing one by one
- Filter chips appearing with stagger

##### 4. Gesture Animations (whileHover, whileTap)
For interactive feedback that feels physical.

```tsx
<motion.div
  whileHover={{
    y: -1,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
  <SessionCard />
</motion.div>
```

**CCMemo use cases:**
- Session card hover: slight lift + shadow deepen (paper card being picked up)
- Session card tap: scale down slightly (pressing a physical card)
- Button press: scale down then up with spring physics
- Tab switch: subtle press effect
- Timeline event hover: icon node slightly enlarges (stamp being examined)

##### 5. Dynamic Variants with custom prop
For per-item animation timing.

```tsx
const itemVariants = {
  hidden: { opacity: 0 },
  visible: (index: number) => ({
    opacity: 1,
    transition: { delay: index * 0.03 }
  })
}

{items.map((item, i) => (
  <motion.div key={item.id} custom={i} variants={itemVariants} />
))}
```

##### 6. useAnimate Hook
For imperative animation sequences (complex, multi-step animations).

```tsx
const [scope, animate] = useAnimate()

const handleCopy = async () => {
  await animate(scope.current, { scale: [1, 0.95, 1] }, { duration: 0.2 })
  // After animation, show copied state
}
```

**CCMemo use cases:**
- Copy confirmation "stamp" animation
- Loading state transition sequences
- Sidebar collapse/expand with coordinated animations

### D.2 Paper-Like Page Transitions

#### Transition Design Principles
1. **Directionality:** Transitions should feel like turning a page or unfolding a letter. Forward navigation = move left-to-right (new page sliding in from right). Back navigation = move right-to-left.
2. **Shadow play:** As a "page" slides over another, a subtle shadow appears on the edge, like a physical page casting a shadow on the one beneath it.
3. **Spring physics:** Paper doesn't move linearly. Use spring-based easing with moderate stiffness (300-500) and damping (25-30) for natural feel.

#### Session List to Detail Transition
```
Current state: Session list visible
1. Selected card begins to expand (width + height)
2. Other cards fade out with slight downward drift
3. Detail content fades in from the expanded card area
4. Shadow appears on left edge (on desktop: detail covers sidebar partially)
```

#### Mobile Tab Transition
```
Current state: List tab active
1. Current content slides left with fade
2. New content slides in from right with slight delay
3. Tab indicator slides to new position
4. Bottom bar stays fixed (no animation)
```

### D.3 Craft-Like Loading States

#### Loading Philosophy
Loading states should feel like "preparing the journal" -- setting up the desk, opening the book, laying out the tools.

#### Recommended Loading Patterns

1. **Skeleton screens** (not spinners):
   - Use the exact layout of the content that will appear
   - Skeleton elements have a subtle paper-texture shimmer animation
   - Shimmer color: slightly lighter than the background (like light moving across paper)

2. **Progressive reveal:**
   - Timeline events appear one by one with stagger (0.03s between items)
   - Session cards fade in from top to bottom
   - Detail sections appear in order: header -> stats -> metadata -> content

3. **Specific loading states:**
   - **Session list loading:** 3-5 skeleton cards with paper shimmer
   - **Timeline loading:** A vertical dashed line (the thread) appears immediately, then events "stamp" onto it one by one
   - **Search loading:** Search bar shows a subtle pulse, results area shows skeleton

### D.4 Card/List/Panel Micro-Interactions

#### Session Card Interactions
| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Hover (desktop) | translateY(-1px) + shadow deepen | 200ms | ease-out |
| Press/active | scale(0.98) | 100ms | spring(400,25) |
| Select | Left accent strip slides in + border color change | 150ms | ease-out |
| Deselect | Left accent strip slides out + border fade | 150ms | ease-out |
| Enter view | opacity 0->1, translateY(8px->0) | 200ms | ease-out |
| Exit view | opacity 1->0, translateY(0->-8px) | 150ms | ease-in |
| Status change | Status dot/strip color crossfade | 300ms | ease-in-out |

#### Timeline Event Interactions
| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Enter view | opacity 0->1, x(-12px->0) | 200ms | ease-out |
| Expand | height auto-animate, chevron rotate 180deg | 250ms | spring(300,30) |
| Collapse | height animate, chevron rotate back | 200ms | ease-in |
| Hover (desktop) | Icon node scale(1.05) + subtle glow | 150ms | ease-out |

#### Button Interactions
| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Hover | Background color shift + slight shadow | 150ms | ease-out |
| Press | scale(0.97) | 80ms | spring(500,30) |
| Release | scale(0.97->1) | 120ms | spring(400,25) |
| Loading | Replace content with spinner, maintain size | 200ms | ease-in-out |

#### Tab Bar Interactions (Mobile)
| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Tab press | Icon scale(0.9->1) | 150ms | spring(400,25) |
| Tab switch | Indicator slides to new position | 250ms | spring(300,30) |
| Active state | Small dot appears below icon | 200ms | spring(400,25) |

### D.5 CSS View Transitions API

**URL:** https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition
**Browser support:** Chrome 111+, Safari 18+. Not in Firefox (as of 2026).

The View Transitions API enables smooth transitions between DOM states using native browser animations. For SPAs, it works via `document.startViewTransition()`.

#### SPA Usage Pattern
```typescript
document.startViewTransition(() => {
  // Update the DOM (React re-render)
  // This function returns a promise that resolves when the new content is ready
})
```

#### CSS Configuration
```css
@view-transition {
  navigation: auto;
}

/* Assign transition names to elements */
.session-card {
  view-transition-name: session-card;
}

/* Customize the transition animation */
::view-transition-old(root) {
  animation: 0.3s ease-in both fade-out;
}

::view-transition-new(root) {
  animation: 0.3s ease-out both fade-in;
}

@keyframes fade-out {
  to { opacity: 0; transform: translateX(-20px); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateX(20px); }
}
```

#### CCMemo Integration Strategy
The View Transitions API is ideal for CCMemo's SPA navigation but should be used as a progressive enhancement:
1. **Primary:** Use Motion for React for all component-level animations (card hover, list stagger, gesture feedback)
2. **Secondary:** Use View Transitions API for page-level navigation (list to detail, tab switches) where supported
3. **Fallback:** No animation for browsers without View Transitions API (Motion handles its own fallbacks)

### D.6 Animation Performance Guidelines

1. **Animate only transform and opacity.** These are GPU-composited and do not trigger layout/paint. Never animate `width`, `height`, `top`, `left` directly -- use `transform: translateX/Y` and `transform: scale` instead.
2. **Use `will-change` sparingly.** Only add `will-change: transform` to elements that will definitely animate. Remove it after animation completes.
3. **Respect `prefers-reduced-motion`.** CCMemo already has a global rule that collapses all animations to 0.01ms. Motion's `useReducedMotion()` hook can also be used for component-level decisions.
4. **Keep spring animations moderate.** Stiffness 300-500, damping 25-30. Too springy feels unprofessional; too stiff feels robotic.
5. **Keep durations short.** 100-250ms for most interactions. Never exceed 400ms for any single animation. Users should never wait for an animation to finish before they can interact.
6. **Stagger with restraint.** Maximum 0.04s (40ms) between items. For 20 items, that is 0.8s total -- the last item should still appear within 1 second.

### D.7 Accessibility Considerations

1. **Always provide `prefers-reduced-motion` fallback** -- CCMemo's existing CSS rule is correct
2. **Use Motion's `useReducedMotion()` hook** to conditionally disable JS animations
3. **Never make critical information appear-only-through-animation** -- content should be readable even with all animations disabled
4. **Animation should enhance, not delay** -- never block user interaction for an animation to complete
5. **Focus management** -- when content animates in/out, manage focus so screen readers can follow

### D.8 Actionable Animation Recommendations for CCMemo

#### Phase 1: Foundation (immediate)
1. **Install `motion` (v12.x):** `npm install motion`
2. **Add entrance animations to SessionList:** Fade-up stagger for cards
3. **Add hover/tap animations to SessionCard:** Lift + shadow on hover, press scale on tap
4. **Add AnimatePresence to timeline events:** Smooth enter/exit as events load

#### Phase 2: Refinement (next iteration)
5. **Add layout animations for detail panel:** Smooth size/position transitions
6. **Add tab indicator animation in mobile BottomTabBar:** Sliding indicator
7. **Add skeleton loading states:** Replace spinner with skeleton cards
8. **Add stagger to stat cards in SessionDetail:** Sequential reveal

#### Phase 3: Polish (final)
9. **Explore View Transitions API** for page-level navigation
10. **Add micro-interactions to buttons** (copy, search, theme toggle)
11. **Add loading shimmer** with paper-texture feel
12. **Fine-tune spring parameters** based on user testing

---

## E. Implementation Priority Matrix

| Priority | Item | Effort | Impact | Area |
|----------|------|--------|--------|------|
| P0 | Paper background texture (CSS) | Small | High | B |
| P0 | Install Motion + add card hover/tap | Small | High | D |
| P0 | Card entrance animation (stagger) | Small | High | D |
| P1 | Timeline vertical thread (dashed line) | Medium | High | B |
| P1 | Card elevation shadows | Small | High | A |
| P1 | Manifest `id` field + PNG icons | Small | Medium | C |
| P1 | `apple-mobile-web-app-capable` meta | Small | Medium | C |
| P2 | Timeline event enter animations | Medium | Medium | D |
| P2 | Detail panel layout animation | Medium | Medium | D |
| P2 | Skeleton loading states | Medium | Medium | D |
| P2 | Kraft-toned header strip | Small | Medium | B |
| P2 | Stitch-pattern separators | Small | Medium | B |
| P3 | View Transitions API integration | Medium | Low | D |
| P3 | Badging API for session count | Small | Low | C |
| P3 | Login page journal treatment | Medium | Low | B |
| P3 | Logo redesign (stamp/seal) | Medium | Medium | A |

---

## F. Reference URLs

### Brand & Visual Design
- Linear: https://linear.app
- Notion: https://notion.so
- Obsidian: https://obsidian.md
- Bear: https://bear.app
- Craft Docs: https://craft.do
- Warp: https://warp.dev
- Readwise Reader: https://readwise.io/read
- Things: https://things.app

### Animation Libraries & APIs
- Motion for React: https://motion.dev/docs/react-animation
- CSS View Transitions API: https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition
- View Transition API (JS): https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API

### iOS PWA
- WebKit Safari 16.4 Web Push: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- MDN PWA Guide: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- Apple HIG (requires JS rendering): https://developer.apple.com/design/human-interface-guidelines/

### Design Tokens & CSS
- CSS @property: https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- CSS color-mix(): https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- CSS Relative Color Syntax: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors
- CSS font-size-adjust: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size-adjust

---

*Research completed: 2026-06-06*
*Next step: Visual redesign implementation per CURRENT-VISUAL-ANALYSIS.md priority ranking*
