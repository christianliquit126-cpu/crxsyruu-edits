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
├── App.jsx              # Root layout (BrowserRouter, Navbar, footer, ParticleBackground)
├── App.module.css
├── main.jsx             # React entry point
├── styles/
│   └── globals.css      # Design tokens (CSS vars), reset, animations, global utility classes
├── lib/
│   ├── firebase.js      # Firebase init (gracefully degrades to demo mode if unconfigured)
│   ├── cloudinary.js    # Cloudinary upload + URL helpers (degrades to demo mode)
│   └── demoData.js      # CATEGORIES list only (demo edits/stats removed)
├── hooks/
│   ├── useFirebaseData.js   # Firebase listeners (useEdits, useStats, incrementView, pushEdit, deleteEdit, toggleFeatured, updateEdit)
│   └── useDevicePerformance.js  # Low-end device detection (reduces animations)
├── components/
│   ├── Navbar.jsx / .module.css        # Fixed navbar with active route highlighting
│   ├── ParticleBackground.jsx          # Canvas particle system with connection lines
│   ├── GalleryCard.jsx / .module.css   # 3D tilt card with cursor glow, hover effects
│   ├── VideoModal.jsx / .module.css    # Focus mode modal for viewing edits
│   └── UploadForm.jsx / .module.css    # Drag-and-drop upload with progress states
└── pages/
    ├── Home.jsx / .module.css          # Tempest Flow — hero, stats bar, featured edits, about
    ├── Gallery.jsx / .module.css       # Tempest Archive — filter, search, sort, grid
    ├── Upload.jsx / .module.css        # Tempest Upload — upload form with sidebar
    ├── Stats.jsx / .module.css         # Tempest Stats — analytics, ranked edits, activity
    └── Admin.jsx / .module.css         # Admin panel (password-gated, delete edits)
```

## Design System

All design tokens live in `src/styles/globals.css` as CSS variables:
- **Colors:** `--tempest-void`, `--tempest-deep`, `--tempest-surface`, `--tempest-panel`
- **Glows:** `--glow-blue`, `--glow-cyan`, `--glow-teal`, `--glow-purple`
- **Typography:** `--font-display` (Orbitron/Rajdhani), `--font-ui` (Rajdhani), `--font-body` (Inter)
- **Glow intensities:** `--glow-idle` / `--glow-hover` / `--glow-active`

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

Without these, the app shows **empty states** with configuration guidance — no placeholder/demo data is injected.

## Audio System

The navbar includes an ambient music toggle. Place your audio file at:
`/public/audio/tempest-ambient.mp3`
The player degrades silently if the file does not exist.

## Key Features (v2)

- **Mobile scroll:** `-webkit-overflow-scrolling: touch`, proper `overflow-y: auto` on html/body, 16px inputs to prevent iOS zoom
- **Zero demo data:** Empty states shown when Firebase is unconfigured, no fake content injected
- **Ultra HD uploads:** 4 GB client limit, Cloudinary handles 4K/UHD quality preservation
- **Hover video preview:** GalleryCard plays `edit.videoUrl` muted on hover (desktop only)
- **Featured glow:** `glow-pulse-featured` CSS animation on featured cards, pulsing border
- **Ripple buttons:** Click ripple effect on all gallery cards
- **Audio visualizer:** CSS-animated bars in navbar when audio is playing
- **Admin enhanced:** Toggle featured status, edit title/description/tags via modal dialog
- **Energy lines:** Animated CSS gradient lines on hero and CTA sections

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
