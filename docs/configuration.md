---
title: Configuration
sidebar_position: 4
---

# Configuration

Settings live in `config.lua` (a shared script). When `kora_lib` provides `Kora.config.adopt`, each option is also registered with a label, description and limits so it can be edited through kora_lib's config system, and `Config` is replaced by the adopted copy.

Settings are sent to each player while they connect. Options marked **live** in the schema apply to players who connect after the change, with no restart. For the others, restart `kora_loading`; screens that are already open are not refreshed.

## General

| Option | Default | Notes |
| --- | --- | --- |
| `Config.serverName` | `'Roleplay Server Name'` | Heading text. Schema: non-empty string. |
| `Config.tips` | five example tips | One string per row. Rotate every 6 seconds. Edit them so they only mention features your server has. |
| `Config.showProgressText` | `true` | Shows the percentage and stage text. The bar is always shown. |
| `Config.theme.fonts` | `true` | `false` keeps the plain built-in fonts on this screen. Colours always follow `kora_theme`. |

## Backdrop and wallpaper (`Config.media`)

| Option | Default | Notes |
| --- | --- | --- |
| `backdrop` | `true` | Solid dark background (`#111315` per the schema text) under images and video. `false` leaves the page transparent and also stops any default wallpaper from loading. |
| `images` | `{}` | Wallpaper paths or `https://` addresses. Several images form a slideshow. |
| `defaultWallpaper` | Kora Discord banner URL | Used when no image is set and the theme has no wallpaper. `''` for none. |
| `themeWallpaper` | `true` | Allows a `wallpaper` entry in `kora_theme`'s `theme.json`. |
| `slideSeconds` | `8` | Seconds per image in a slideshow, also the default length of a silent image clip. Schema range 2 to 120. |
| `dim` | `0.45` | Darkening over wallpapers and videos, 0 to 1. |

## Background clips (`Config.media`, all **live**)

| Option | Default | Notes |
| --- | --- | --- |
| `videos` | `intro.webm` plus nine scene clips | List of rows with `video`, `image`, `audio`, `seconds`. See [Media](./media.md). |
| `videoSound` | `true` | Play each video's own soundtrack. |
| `videoVolume` | `0.5` | 0 to 1. Starting level until a player moves the slider. |
| `videoSoundButton` | `true` | Show the mute button and slider while a clip can make sound. |
| `videoOrder` | `'shuffle'` | `sequential`, `shuffle` or `random`. Any other value is treated as `sequential` by the page. |
| `videoRandomStart` | `false` | With `sequential`, start at a random clip. |
| `videoPinFirst` | `true` | First clip plays first, once; the order applies to the rest. |
| `videoOverlap` | `0` | Crossfade seconds, 0 to 10. |
| `videoFadeIn` | `0.6` | First clip fade-in seconds, 0 to 5. |
| `videoMaxSeconds` | `0` | Cut each video after this many seconds. `0` plays to the end. Range 0 to 3600. |
| `videoSpeed` | `1` | 0.25 to 2. |
| `videoFit` | `'cover'` | `cover` or `contain`. |

## Music

| Option | Default | Notes |
| --- | --- | --- |
| `Config.media.music` | `''` | Single looping track. With the player enabled and no tracks it becomes a one-track playlist. With the player disabled it plays with no panel. |
| `Config.media.musicVolume` | `0.3` | Volume for the no-panel case. |
| `Config.musicPlayer.enabled` | `true` | Shows the panel when at least one track is playable. |
| `Config.musicPlayer.volume` | `0.3` | Starting volume. A player's saved volume wins. |
| `Config.musicPlayer.tracks` | `{}` | Rows with `url`, optional `title`, `artist`. |

## Not configuration

The accent colour and fonts are chosen in `kora_theme`, not here. See [Theme](./theme.md).
