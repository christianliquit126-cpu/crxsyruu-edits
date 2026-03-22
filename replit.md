# Crxsyruu Tempest — Video Editor Portfolio

A production-ready, anime-inspired video editor portfolio for **Crxsyruu**, themed after Rimuru Tempest from *That Time I Got Reincarnated as a Slime*.

## Stack

- **Frontend:** React 18 + Vite 5
- **Routing:** React Router DOM v6
- **Animations:** Framer Motion
- **Database:** Firebase Realtime Database (empty state when unconfigured)
- **Media Storage:** Cloudinary — Ultra HD/4K support up to 4 GB
- **Fonts:** Orbitron, Rajdhani, Inter (Google Fonts)
- **Styling:** CSS Modules + CSS Variables

## Project Structure

```
src/
├── App.jsx              # Root layout (BrowserRouter, Navbar, footer, ParticleBackground, sound init)
├── App.module.css       # Ambient gradient, noise overlay, footer styles
├── main.jsx             # React entry point
├── styles/
│   └── globals.css      # Design tokens, reset, 20+ animations, global utility classes
├── lib/
│   ├── firebase.js      # Firebase init (gracefully degrades to demo mode if unconfigured)
│   ├── cloudinary.js    # Cloudinary upload + URL helpers (degrades to demo mode)
│   ├── demoData.js      # CATEGORIES list only (demo edits/stats removed)
│   ├── sound.js         # Web Audio API synthetic sound system (tap, hover, open, close, nav, toggle, swipe, videoPlay)
│   └── session.js       # Persistent session memory: video timestamps, scroll positions, volume, mute, last viewed, interactions
├── hooks/
│   ├── useFirebaseData.js        # Firebase listeners (useEdits, useStats, incrementView, pushEdit, deleteEdit, toggleFeatured, updateEdit)
│   ├── useDevicePerformance.js   # Low-end device detection (reduces animations)
│   ├── useScrollFade.js          # IntersectionObserver scroll-fade-in hook
│   ├── useSystemIntelligence.js  # Idle detection (28s), time-of-day theming, adaptive animation speed via --anim-speed CSS var
│   └── useInteractionTracking.js # Admin-only click/play/hover heatmap scoring per edit
├── components/
│   ├── Navbar.jsx / .module.css        # Fixed navbar — hide-on-scroll, magnetic buttons, audio visualizer, performance toggle
│   ├── ParticleBackground.jsx          # Canvas particle system with connection lines
│   ├── GalleryCard.jsx / .module.css   # 3D tilt, light reflection, hold-to-preview, ripple, focus mode, progress bar
│   ├── VideoModal.jsx / .module.css    # Custom controls, cinematic mode, swipe nav, keyboard shortcuts, auto-pause
│   ├── ScrollProgress.jsx              # Top scroll progress bar
│   ├── BootIntro.jsx                   # Animated boot sequence on first load
│   ├── CursorGlow.jsx                  # Custom cursor glow effect
│   └── UploadForm.jsx / .module.css    # Drag-and-drop upload with progress states
└── pages/
    ├── Home.jsx / .module.css          # Tempest Flow — hero orbs, stats bar, featured edits, about, CTA
    ├── Gallery.jsx / .module.css       # Tempest Archive — filter, search, sort, swipe navigation
    ├── Upload.jsx / .module.css        # Tempest Upload — upload form with sidebar
    ├── Stats.jsx / .module.css         # Tempest Stats — analytics, ranked edits, activity
    └── Admin.jsx / .module.css         # Admin panel (password-gated, delete edits)
```

## Design System

All design tokens live in `src/styles/globals.css` as CSS variables:
- **Colors:** `--tempest-void`, `--tempest-deep`, `--tempest-surface`, `--tempest-panel`, `--tempest-glass`
- **Glows:** `--glow-blue`, `--glow-cyan`, `--glow-teal`, `--glow-purple`, `--glow-pink`
- **Glow intensities:** `--glow-idle` / `--glow-hover` / `--glow-active`
- **Shadows:** `--shadow-sm/md/lg/xl`, `--shadow-glow`, `--shadow-glow-strong`
- **Typography:** `--font-display` (Orbitron/Rajdhani), `--font-ui` (Rajdhani), `--font-body` (Inter)
- **Radius:** `--radius-sm/md/lg/xl/2xl/pill`
- **Transitions:** `--transition-fast/smooth/slow/spring`

## Visual Feature System

### Glassmorphism
- `backdrop-filter: blur(18-24px) saturate(1.4)` on cards/panels/modal
- `rgba` background at 0.65-0.72 opacity
- `.glass-panel` and `.glow-panel` utility classes available globally

### Animated Gradient Background
- Three layered radial gradients in `App.module.css` `.ambientGradient`
- Animated with `gradient-shift` 18s keyframe cycle
- Disabled in performance mode

### Noise Texture Overlay
- Inline SVG noise filter applied as CSS background
- Opacity 0.028 — subtle grain texture
- Disabled in performance mode

### Light Reflection Animation
- `light-reflection` keyframe sweeps a skewed highlight across cards and panels
- Triggers on card hover (2.2s)
- Continuous on CTA section

### Edge Lighting
- Inset box-shadow on cards: blue/cyan/teal gradient edges on hover

### Sound System (`src/lib/sound.js`)
- Web Audio API — no external files required
- Lazy-initialized on first user interaction
- Sounds: `tap`, `hover`, `open`, `close`, `nav`, `toggle`, `swipe`, `videoPlay`
- User preference stored in `localStorage` (`tempest_sound`)
- Performance mode stores in `localStorage` (`tempest_perf`)

### GalleryCard Features
- 3D perspective tilt (desktop only) based on mouse position
- Cursor-relative glow spotlight effect
- Hover: light reflection sweep, video autoplay, scale effect
- Hold (250ms): hold-to-preview mode — plays video with live indicator
- Click ripple effect from exact click position
- Custom video progress bar
- Focus mode styling (`focused` prop)
- Category-specific color theming

### VideoModal Features
- Custom video progress bar with click-to-seek and drag thumb
- Mute toggle with SVG icons (no emoji)
- Cinematic mode (hides info panel, letterbox feel) — toggle with `C` key
- Fullscreen mode — toggle with `F` key
- Swipe left/right for navigation between edits
- Arrow key navigation
- Auto-hide controls after 2.8s of inactivity
- Buffering indicator with spinner
- View tracking via Firebase `incrementView`
- **Quality selector:** Auto / 1080p / 720p / 480p via Cloudinary URL transformations (`getVideoQualityUrl` in `cloudinary.js`). Seamless switch that preserves playback position.

### Boot Intro (v2)
- 4-line text sequence: Initializing / Loading / Syncing / Ready
- Moving gradient orbs behind the grid (CSS-only, no JS)
- Spinning logo rings with pulse animation
- Progress bar with glow dot
- Click-anywhere-to-skip
- StrictMode-safe implementation (uses `cancelled` flag pattern)

### Performance Optimizations
- ParticleBackground: FPS capped (40fps high-end, 24fps low-end), mobile count reduced to 32, connection lines disabled on mobile/low-end, ResizeObserver instead of window resize listener
- `will-change: transform` on canvas for GPU compositing
- Performance mode hides animated border, edge lighting, cursor glow, light reflection

### Navbar Features
- Hide-on-scroll-down, reveal-on-scroll-up
- Glassmorphism background when scrolled
- Magnetic buttons (subtle mouse attraction effect)
- Audio visualizer bars when ambient music plays
- Performance mode toggle (lightning bolt icon)
- Mobile: slide-in menu from right with overlay

### Scroll Fade Animations
- `useScrollFade()` hook: wraps any element in IntersectionObserver fade-in
- Applied to Featured, About, CTA sections on Home
- Applied to header and controls on Gallery
- Smooth 0.55s cubic-bezier reveal

## Environment Variables

Required `.env` variables (see `.env.example`):

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# Admin
VITE_ADMIN_PASSWORD=
```

Without these, the app shows **empty states** with configuration guidance — no placeholder/demo data.

## Audio

- Sound effects: Web Audio API synthetic tones (no files needed)
- Ambient music: place file at `/public/audio/tempest-ambient.mp3`
- Music player degrades silently if file does not exist

## Sections (UI Identity)

| Label | Route | Purpose |
|---|---|---|
| Tempest Flow | `/` | Homepage, hero, stats, featured edits |
| Tempest Archive | `/gallery` | Browse all edits with filter/search/sort |
| Tempest Upload | `/upload` | Drag-and-drop media upload to Cloudinary + Firebase |
| Tempest Stats | `/stats` | Live analytics, ranked edits, category breakdown |
| Admin | `/admin` | Password-gated panel — delete edits, toggle featured, edit metadata |

## Dev Server

- Port: **5000**
- Host: `0.0.0.0` (required for Replit preview proxy)
- Command: `npm run dev`

## Deployment

Configured as a **static** deployment (Vite build → `dist/`):
- Build: `npm run build`
- Public dir: `dist`
