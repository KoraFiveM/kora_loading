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

### Wallpaper, video and music

Out of the box the screen shows the animated Kora Discord banner. To use your
own, put the files in `html/media/` and list them in `config.lua` (or use a full
`https://` address):
```lua
Config.media = {
    backdrop = true,
    images = { 'media/city.jpg', 'media/beach.jpg' }, -- several = slideshow
    defaultWallpaper = 'https://cdn.discordapp.com/banners/...', -- the Kora banner
    themeWallpaper = true,
    slideSeconds = 8,
    video = '',          -- e.g. 'media/intro.mp4' (muted, looping)
    music = 'media/theme.ogg',
    musicVolume = 0.3,
    dim = 0.45,          -- darkens the wallpaper so text stays readable
}
```
A wallpaper may be **any still or animated format the browser can paint** —
`.png`, `.jpg`/`.jpeg`, `.webp`, `.gif`, `.svg`, `.avif` — loaded from a local
file or from a CDN. Files in `html/media/` are streamed to the loadscreen
automatically; keep them small, because players see the screen while they are
still downloading your server. A CDN wallpaper costs nothing to download from
the server but needs the player's connection, so it is preloaded: if it fails,
it drops out silently and the themed background shows instead.

Wallpaper sources, most specific first:

1. `Config.media.images` — one wallpaper, or several as a slideshow.
2. `"wallpaper"` in `kora_theme/theme.json` (unless `themeWallpaper = false`) —
   a URL, a list of URLs, or a path to a file kora_theme itself ships. Re-run
   `node tools/sync-theme.mjs` after editing it, like any other theme change.
   A theme-hosted file comes from kora_theme's own NUI origin, which can answer
   a moment late during a loadscreen; a CDN URL or a file in `html/media/`
   appears immediately.
3. `Config.media.defaultWallpaper` — the Kora Discord banner by default. Set it
   to `''` for the themed background and nothing else.

A configured `video`, or `backdrop = false`, means no default wallpaper is
fetched at all. `dim` only applies once a wallpaper or video has actually
loaded.

### Music player

List one or more tracks and the screen shows a music player with the song
title, the artist, play/pause, skip, a volume slider and mute:
```lua
Config.musicPlayer = {
    enabled = true,
    volume = 0.3,
    tracks = {
        { title = 'Night Drive', artist = 'Kora Radio', url = 'media/night-drive.mp3' },
        { title = 'Static',      artist = 'Kora Radio', url = 'https://cdn.example.com/static.mp3' },
    },
}
```
- **With no tracks listed nothing is drawn**, so the player can stay enabled on
  a server that wants a silent loading screen.
- A `url` is a path inside `html/` or a full `https://` address, in any format
  the browser can decode: `.mp3`, `.ogg`, `.wav`, `.m4a`/`.aac`, `.flac`,
  `.webm`, or the audio track of an `.mp4`. A track that will not play is
  skipped; if none of them play, the panel hides itself.
- `title` and `artist` are optional — a track with no title is labelled with its
  file name.
- The volume and mute state a player picks are remembered for their next
  connect. `Config.musicPlayer.volume` only sets the starting point.
- Tracks play in order and loop back to the first. A single track loops in
  place.
- The controls are **mouse-only**: a loadscreen never gets keyboard focus. The
  cursor comes from `loadscreen_cursor 'yes'` in `fxmanifest.lua`, which is also
  what makes a mouse pointer visible while the screen is up.
- Browsers may refuse to start audio before the player has clicked something.
  When that happens the panel appears paused with a "press play" hint rather
  than silently failing.

`Config.media.music` still works: with the player enabled it becomes a
one-track playlist shown in the panel, and with `enabled = false` it keeps
playing silently with no panel at all, at `Config.media.musicVolume`.

### Matching your server's brand colour and fonts

The screen doesn't have its own colour or font config. A loadscreen is shown
before other resources are mounted, so `cfx-nui-kora_theme` may not answer yet.
The page therefore uses copies of kora_theme's `theme.js`, `theme.json` and
`fonts/` folder stored in `html/kora_theme/`, and the live kora_theme script
re-applies everything once it is reachable. After changing
`kora_theme/theme.json` — or after updating kora_theme itself — refresh the
copies:
```
node tools/sync-theme.mjs           # copy from kora_theme (found automatically)
node tools/sync-theme.mjs --check   # exit 1 if the copies are stale
```

Fonts follow kora_theme's `"fonts"` block (`heading`, `body`, `mono`) and the
`/config` font settings, exactly like every other Kora UI: the heading font is
used for the server name, the mono font for the `LOADING 42%` line, the body
font everywhere else. Because the font files are synced locally, the chosen font
renders from the first frame instead of only once kora_theme answers. Set
`Config.theme.fonts = false` to keep the plain built-in stack regardless of the
theme; colours always follow kora_theme either way.
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

- **Server name / tips / progress text / wallpaper and media** —
  `Config.serverName`, `Config.tips`, `Config.showProgressText` and
  `Config.media` in `config.lua`.
- **Music player** — `Config.musicPlayer` in `config.lua`.
- **Accent colour, fonts and other theme tokens** — set in
  `kora_theme/theme.json`; players can override their own accent with `/theme`.
  `Config.theme.fonts` turns the theme font off for this screen only.
- **Layout/markup** — `html/index.html`, `html/style.css`, `html/app.js`.
  Bump the `?v=` query string on `style.css`/`app.js` when editing either, to
  bust FiveM's NUI (CEF) cache across reconnects.

## Related resources

Part of the [qbcore2](https://github.com/qbcore2) resource set:

- [kora_lib](https://qbcore2.github.io/kora_lib/) — shared helper library
- [qbcore](https://qbcore2.github.io/kora_core/) — framework core
- [qbmultichar](https://qbcore2.github.io/kora_multichar/) — character selection
- [full resource list ↗](https://github.com/orgs/qbcore2/repositories)
