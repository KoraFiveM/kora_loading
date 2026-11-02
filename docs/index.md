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
- [kora_lib](https://qbcore2.github.io/kora_lib/)

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

### Progress bar

The bar fills from FiveM's own loadscreen events (`loadProgress`, plus the
init-function and map-load events as a fallback) and never moves backwards.
Next to it the page shows the percentage and the current load stage; set
`Config.showProgressText = false` to hide that text and keep only the bar.

### Background images, video and music

With no media configured, a background themed with your kora_theme colours is
shown. To add your own, put the files in `html/media/` and list them in
`config.lua` (or use a full `https://` address):
```lua
Config.media = {
    backdrop = true,
    images = { 'media/city.jpg', 'media/beach.jpg' }, -- several = slideshow
    slideSeconds = 8,
    video = '',          -- e.g. 'media/intro.mp4' (muted, looping)
    music = 'media/theme.ogg',
    musicVolume = 0.3,
    dim = 0.45,          -- darkens the background so text stays readable
}
```
Files in `html/media/` are streamed to the loadscreen automatically. Keep them
small: players see the screen while they are still downloading your server.

### Matching your server's brand colour

The screen doesn't have its own colour config. A loadscreen is shown before
other resources are mounted, so `cfx-nui-kora_theme` may not answer yet. The page
therefore uses copies of kora_theme's `theme.js` and `theme.json` stored in
`html/kora_theme/`, and the live kora_theme script re-applies the colours once it
is reachable. After changing `kora_theme/theme.json`, refresh the copies:
```
node tools/sync-theme.mjs           # copy from ../kora_theme
node tools/sync-theme.mjs --check   # exit 1 if the copies are stale
```
Colours are set in one place, `kora_theme/theme.json` (not in Lua), then restart
`kora_theme`. Set the palette once and every kora_theme consumer picks it up
automatically:
```json
{
  "name": "Kora green",
  "colors": {
    "primary": "#1E90FF"
  }
}
```
`name` is the label of the primary colour, and `presets` lists the extra colours
offered by the `/theme` picker. Players can also choose their own accent
colour in game with `/theme` (stored client-side; `/theme reset` returns to the
`theme.json` primary). See the kora_theme README for the full key list.

The loading page receives the current palette when it mounts; it does not keep
a Lua theme bridge alive after the loading frame shuts down.

## Customization

- **Server name / tips / progress text / media** — `Config.serverName`,
  `Config.tips`, `Config.showProgressText` and `Config.media` in `config.lua`.
- **Accent colour and other theme tokens** — set in `kora_theme/theme.json`;
  players can override their own accent with `/theme`.
- **Layout/markup** — `html/index.html`, `html/style.css`, `html/app.js`.
  Bump the `?v=` query string on `style.css`/`app.js` when editing either, to
  bust FiveM's NUI (CEF) cache across reconnects.

## Related resources

Part of the [qbcore2](https://github.com/qbcore2) resource set:

- [kora_lib](https://qbcore2.github.io/kora_lib/) — shared helper library
- [qbcore](https://qbcore2.github.io/kora_core/) — framework core
- [qbmultichar](https://qbcore2.github.io/kora_multichar/) — character selection
- [full resource list ↗](https://github.com/orgs/qbcore2/repositories)
