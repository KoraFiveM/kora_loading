---
layout: default
title: qbloading
---

A `loadscreen` resource for FiveM, styled with qblib's shared theme tokens so
it matches the rest of the qbcore2 UI out of the box. It sets
`loadscreen_manual_shutdown 'yes'`, so the screen stays up until something
explicitly dismisses it — letting other resources (character selection,
asset streaming, etc.) finish before the player is dropped into the world.

## Requirements

- [qblib](https://qbcore2.github.io/qblib/)

## Installation

`server.cfg`, in this order:
```
ensure qblib
ensure qbloading
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

The screen doesn't have its own colour config — it pulls `QB.theme.tokens()`
from qblib, which derives every CSS custom property (`--primary`,
`--background`, `--border`, ...) from qblib's own
[`Config.ui.accentColor`](https://qbcore2.github.io/qblib/). Set that once in
qblib and qbloading (and every other qblib-themed NUI) picks it up
automatically:
```lua
-- qblib/config.lua
Config.ui.accentColor = '#1E90FF'
```
A theme change is pushed live via `SendNUIMessage({ action =
'loadingscreen:theme', data = ... })` on resource start, so a restart of
qbloading reflects a new accent colour without editing this resource at all.

## Customization

- **Server name / tips** — `Config.serverName` and `Config.tips` in
  `config.lua`.
- **Accent colour and other theme tokens** — set via qblib's
  `Config.ui.accentColor`, not local config (see above).
- **Layout/markup** — `html/index.html`, `html/style.css`, `html/app.js`.
  Bump the `?v=` query string on `style.css`/`app.js` when editing either, to
  bust FiveM's NUI (CEF) cache across reconnects.

## Related resources

Part of the [qbcore2](https://github.com/qbcore2) resource set:

- [qblib](https://qbcore2.github.io/qblib/) — shared helper library
- [qbcore](https://qbcore2.github.io/qbcore/) — framework core
- [qbmultichar](https://qbcore2.github.io/qbmultichar/) — character selection
- [full resource list ↗](https://github.com/orgs/qbcore2/repositories)
