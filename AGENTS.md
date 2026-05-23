# AGENTS.md

## Project Overview

Sticker Pomodoro is a cute macOS desktop timer built with Tauri 2, React, TypeScript, and Vite. The app focuses on a compact sticker-like UI: user avatar upload, countdown/count-up timing, configurable rest time, top-edge reminder toasts, menu bar/tray behavior, global shortcut support, local settings persistence, theme switching, and DIY background stickers.

Key areas:

- `src/App.tsx`: main React UI, timer interactions, settings panel, reminder route.
- `src/styles.css`: visual system, themes, rounded-window styling, toast styling.
- `src/lib/`: shared timer, storage, and type helpers.
- `src-tauri/src/main.rs`: Tauri commands, tray menu, reminder window positioning, haptic feedback.
- `src-tauri/tauri.conf.json`: app/window/bundle config.

## Development Commands

- Install dependencies: `npm install`
- Web dev server: `npm run dev`
- Tauri dev app: `npm run tauri dev`
- Web build: `npm run build`
- Tests: `npm test`
- Release bundle: `npm run tauri build`
- Tauri diagnostics: `npm run tauri -- info`

## Code Style

- Use TypeScript with strict typing; keep shared shapes in `src/lib/types.ts`.
- Prefer existing local helpers in `src/lib/storage.ts` and `src/lib/timer.ts` over adding duplicate logic in components.
- Keep React state explicit and small; avoid broad refactors when a narrow change solves the request.
- Use `lucide-react` icons for controls when possible.
- Keep comments sparse and only for non-obvious behavior.
- Preserve local persistence compatibility when changing settings; merge old settings with defaults.

## Design Rules

- This is a usable desktop tool, not a landing page.
- Keep the UI compact, soft, and sticker-like, with clear spacing and no crowded control clusters.
- Main timer interaction should remain simple: the circular timer is the primary start/pause target.
- Use restrained cute styling: rounded forms, soft shadows, coordinated colors, and readable contrast.
- Avoid adding large explanatory text in the app UI; prefer direct controls and familiar icons.
- Maintain theme readability, especially `night` mode; check text, borders, sliders, and buttons against dark backgrounds.
- Reminder windows should feel like native macOS/iMessage-style floating notifications: transparent background, glassy card, short copy, and top-edge positioning.
- Countdown/rest completion reminders with action buttons must be persistent until the user clicks an action; start/preview reminders may still auto-dismiss.
- Action reminders must be sized and positioned with their actual window width, especially at `top-right`, so they never render past the screen edge.
- Menu-bar tree icons should be designed inside an 18x18 logical canvas but exported with a high-resolution backing bitmap, such as 54x54, so Retina menu bars stay crisp without cropping.
- If the menu-bar item disappears while tray diagnostics show `renderState=ok`, `fallback=none`, and `set_icon`/`set_visible(true)` succeeded, do not treat it as a tree-rendering bug first. This has been caused by the current macOS user account caching/hiding the installed app's status item for the old bundle id, especially after running installed, built, and dev copies at the same time. First quit all `sticker-pomodoro` instances, avoid running multiple copies with the same bundle identity, restart `SystemUIServer`, and if the installed bundle id remains stuck, use a new bundle identifier with settings migration.
- Menu-bar `pixel` tree art should keep a clear trunk and compact block canopy at every growth stage; `pine` should use real stage structure changes, not simple scale-only growth.
- Menu-bar rest/charging icons must stay visually symmetrical in the tray, including the inner fill at every stage.
- Rest countdown must use the charging/status icon and must never add focus seconds or trees to forest statistics.
- If an unclassified focus session is later assigned to a project, move that session's tree count and focus seconds from `unclassified` to the selected project without duplicating daily totals.
- Forest statistics should stay literal and easy to explain; expose `trees` and `focus time` views instead of an ambiguous combined score.
- Forest summary totals should stay compact enough to fit in one polished row above the heatmap.
- Default timer settings for normal builds are 25 minutes focus, 5 minutes rest, and `potted` as the default menu-bar tree style.
- Global start shortcuts should be registered through the Tauri/Rust shortcut command path and report registration failures in settings; keep accelerator strings compatible with Tauri/global-hotkey syntax such as `Ctrl+Alt+P`.
- The global start shortcut is start/resume-only; do not make repeated shortcut presses pause an active focus timer.
- Changing the reminder corner in settings should immediately show a short preview reminder in that corner; do not keep a separate preview button.
- The main window uses close-to-hide behavior, so Dock reopen/activation must explicitly show, unminimize, and focus the existing main window.

## Testing Instructions

Before handing off meaningful changes, run:

```bash
npm test
npm run build
```

For desktop or Tauri changes, also run:

```bash
npm run tauri build
```

When changing visuals or window behavior, launch the built app and inspect the real macOS window. Pay special attention to transparent corners, custom window controls, reminder placement, and settings-panel readability.

## Constraints

- Do not upload avatar or sticker data; store user media locally as data URLs/settings.
- Do not break tray/menu-bar behavior or close-to-hide behavior.
- Keep reminder placement limited to top-left, top-center, and top-right unless the product direction changes.
- Be careful with coordinate systems in Tauri reminder windows; use logical positioning for macOS displays.
- Do not reintroduce the native title bar unless requested; the app uses custom themed window controls.
- Keep generated build artifacts out of manual edits; do not modify `src-tauri/target` or `node_modules`.
- Prefer concise, focused patches and avoid unrelated cleanup.
