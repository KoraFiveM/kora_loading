---
title: kora_loading
sidebar_position: 1
---

# kora_loading

`kora_loading` is a `loadscreen` resource styled with the shared `kora_theme` tokens. It shows the server name, rotating tips, a load progress bar with stage text, an optional wallpaper or slideshow, a playlist of background clips and an optional music player. It uses `loadscreen_manual_shutdown`, so the screen stays up until the resource itself dismisses it when the character has loaded.

Current version: see `version` in `fxmanifest.lua`.

## Pages

- [Installation](./installation.md) - dependencies, start order and the manifest settings that matter.
- [Features](./features.md) - what the loading screen does and how it behaves.
- [Configuration](./configuration.md) - every `Config` option with defaults.
- [Media](./media.md) - wallpapers, background clip playlist and the music player in detail.
- [Theme](./theme.md) - colours, fonts and the synced `kora_theme` copy.
- [Events and callbacks](./events.md) - handover, NUI callbacks, game events and the dismissal triggers.
- [Exports](./exports.md) - the optional FFT test hooks.
- [Troubleshooting](./troubleshooting.md) - common problems and fixes.

## Layout

- `fxmanifest.lua` - declares the loadscreen, dependencies and files.
- `config.lua` - `Config` table and, when `kora_lib` is present, the config schema.
- `payload.lua` - builds the settings table sent to the page.
- `server.lua` - hands the settings to the page while the player connects.
- `client.lua` - NUI callbacks and the loadscreen shutdown.
- `fft_hooks.lua` - optional test hooks, inert by default.
- `html/` - the page (`index.html`, `app.js`, `style.css`), the hidden in-game sync page (`sync.html`, `sync.js`), `media/` and the synced `kora_theme/` copy.
- `tools/sync-theme.mjs` - refreshes the synced theme copy.
- `tests/` - `kora_qa` feature files (manual scenarios).

The resource has no commands, no items, no database tables, no ACE permissions and no server-side net events.
