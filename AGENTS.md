# kora_loading agent guide

`kora_loading` is a Kora loadscreen resource: a `kora_theme`-styled loading page with server name, tips, progress bar, wallpaper/clip playlist and a music player, dismissed manually once the character has loaded. Layout: `fxmanifest.lua`, `config.lua` (config and kora_lib schema), `payload.lua` (settings table sent to the page), `server.lua` (handover while connecting), `client.lua` (NUI callbacks and shutdown), `fft_hooks.lua` (optional FFT hooks), `html/` (page, sync page, media, synced `kora_theme/` copy), `tools/sync-theme.mjs` and `tests/` (kora_qa feature files).

## Documentation

User-facing documentation lives in `docs/` (Markdown, published via the Kora Docusaurus site, kora_docs_next). Read `docs/index.md` first (it has the documentation map). Layout: `index.md` (hub), `installation.md`, `how-to-use.md`, `api/` (`index.md`, `nui.md` for NUI callbacks, events and shutdown, `configuration.md` for every `Config` option), and topic pages `features.md`, `media.md`, `theme.md`, `exports.md` (FFT hooks), `troubleshooting.md`. The resource has no commands, so there is no `commands.md`. Put a change on the page that owns the topic.

When you add, change, or remove a feature, config option, command, export, event, item, permission, or database table/column, update the matching page in `docs/` in the same change. Keep docs accurate to the code; do not document behaviour that does not exist.

Docs rules: plain Markdown with `title`/`sidebar_position` front matter (no `id`/`slug`), relative links only between docs pages, assets inside `docs/`, fenced code blocks with a language, and no raw `<`, `>`, `{`, `}` outside code (pages are parsed as MDX). The release version comes from `fxmanifest.lua`'s `version` field.

## Shared contribution standards

Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing. Humans and agents follow
the same Kora standards and self-contained local Lua checks. Preserve the domain
constraints above and in module guides; record policy conflicts explicitly.
