# FigJam — Mentor Portal E2E Flow Generator

Draws the full mentor portal flow (12 sections, 43 edge cases) onto your FigJam board as stickies + connectors.

**Target board:** [Figma Jam — Untitled](https://www.figma.com/board/xEkUNKsGoFrKf9sU6pj8VG/Untitled?node-id=0-1)

## Run once (≈2 minutes)

1. Open your board in the **Figma desktop app** (plugins do not run in browser-only mode for development imports).
2. **Plugins → Development → Import plugin from manifest…**
3. Select this folder: `tools/figjam-mentor-flow/manifest.json`
4. **Plugins → Development → Glimmora Mentor Portal Flow → Run**
5. The plugin creates all sections on the current page. Zoom out or scroll down — content is tall by design.
6. Optional: select stickies → **Tidy up** / align manually for presentation.

## What gets drawn

| Section | Content |
|---------|---------|
| Legend | 🟢 REAL · 🟡 RUNTIME · 🔵 MOCK · 🟣 PROXY · 🔒 GATED |
| 1 | Entry, auth, onboarding gate, demo mode |
| 2 | Onboarding wizard steps |
| 3 | Role tiers & nav visibility |
| 4 | Dashboard (mock) |
| 5 | Review queue + decisions |
| 6 | Escalations (senior+) |
| 7 | History & metrics |
| 8 | **Mentorship (real Prisma flow)** |
| 9 | Profile, settings, notifications |
| 10 | Admin / registration |
| 11 | Data-layer stakeholder summary |
| 12 | One-page lifecycle |

**Edge cases** appear as ⚠️ stickies **above** the related flow box (same layout as requested).

## Re-run

Running again **adds** another copy on the same page. Delete the old group first, or run on a fresh page/section.

## Why not drawn remotely?

Cursor cannot authenticate to your Figma account or edit [your board](https://www.figma.com/board/xEkUNKsGoFrKf9sU6pj8VG/Untitled) directly. This plugin is the one-click equivalent.
