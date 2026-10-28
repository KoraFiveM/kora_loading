---
layout: default
title: kora_loading
---

A `loadscreen` resource for FiveM, styled with kora_theme's shared tokens so
it matches the rest of the qbcore2 UI out of the box. It sets
`loadscreen_manual_shutdown 'yes'`, so the screen stays up until something
explicitly dismisses it — letting other resources (character selection,
asset streaming, etc.) finish before the player is dropped into the world.

## Requirements

- `kora_theme`
- [qblib](https://qbcore2.github.io/kora_lib/)

## Installation

`server.cfg`, in this order:
```
ensure kora_theme
ensure kora_lib
ensure kora_loading
```

## Usage examples

### Dismissing the loading screen (manual shutdown)

Because `loadscreen_manual_shutdown` is on, `client.lua` never calls the
shutdown native itself — ownership is handed to whichever resource knows the
player is actually ready. Call FiveM's native from that resource once it has
what it needs:
```lua
-- client, in whatever resource owns "is the player ready" (e.g. after
-- character data has arrived)
ShutdownLoadingScreen()
```
On a bare server with no such resource installed, `spawnmanager`'s own
`spawnPlayer()` calls `ShutdownLoadingScreen()` as part of its native spawn
sequence, so nothing hangs even without extra setup.

### Setting the server name and loading tips

`config.lua` is a `shared_script`, so edit it directly:
```lua
Config.serverName = 'My Roleplay Server'

Config.tips = {
    'Tip: press F1 to open the phone.',
    'Tip: buy a house to unlock private storage.',
}
```
The page fetches these once on mount via the `loadingscreen:getTheme` NUI
callback, then cycles tips every 6 seconds.

### Matching your server's brand colour

The screen doesn't have its own colour config. It loads `theme.css` and
`theme.js` from kora_theme, and the browser reads `kora_theme/theme.json` directly.
Set the palette once and every kora_theme consumer picks it up automatically:
```lua
-- kora_theme/theme.json
QBThemeConfig.colors.primary = '#1E90FF'
```
The loading page receives the current palette when it mounts; it does not keep
a Lua theme bridge alive after the loading frame shuts down.

## Customization

- **Server name / tips** — `Config.serverName` and `Config.tips` in
  `config.lua`.
- **Accent colour and other theme tokens** — set in `kora_theme/theme.json`.
- **Layout/markup** — `html/index.html`, `html/style.css`, `html/app.js`.
  Bump the `?v=` query string on `style.css`/`app.js` when editing either, to
  bust FiveM's NUI (CEF) cache across reconnects.

## Related resources

Part of the [qbcore2](https://github.com/qbcore2) resource set:

- [qblib](https://qbcore2.github.io/kora_lib/) — shared helper library
- [qbcore](https://qbcore2.github.io/kora_core/) — framework core
- [qbmultichar](https://qbcore2.github.io/kora_multichar/) — character selection
- [full resource list ↗](https://github.com/orgs/qbcore2/repositories)
