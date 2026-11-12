---
title: Installation
sidebar_position: 2
---

# Installation

## Dependencies

`fxmanifest.lua` declares `dependency 'kora_theme'` and `dependency 'kora_lib'`.

- `kora_theme` supplies the colour tokens, fonts and the `getPlayerTheme` export used to keep the player's own accent colour.
- `kora_lib` is pulled in through `shared_script '@kora_lib/init.lua'`. `config.lua` only registers its config schema if `Kora.config.adopt` exists, so the screen also reads plain `config.lua` values when that API is missing.

## Start order

```cfg
ensure kora_theme
ensure kora_lib
ensure kora_loading
```

## Manifest settings

| Setting | Purpose |
| --- | --- |
| `loadscreen 'html/index.html'` | The loading page. |
| `loadscreen_manual_shutdown 'yes'` | The screen stays until `ShutdownLoadingScreen` and `ShutdownLoadingScreenNui` are called. See [Events](./events.md). |
| `loadscreen_cursor 'yes'` | Shows a mouse cursor so the music player and sound controls can be clicked. A loadscreen gets no keyboard focus. |
| `ui_page 'html/sync.html'` | A hidden in-game page that keeps the cached player colour current. See [Theme](./theme.md). |

All of `html/` (including `html/media/*` and `html/kora_theme/**`) is streamed to the player as resource files.

## Optional

`kora_multichar` is not required. If it is installed, its `kora_multichar:client:spawnComplete` event dismisses the screen. See [Events](./events.md).
