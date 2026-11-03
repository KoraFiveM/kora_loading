#!/usr/bin/env sh
# kora_loading checks: Lua syntax, browser script syntax, and the vendored kora_theme copy (F#242).
set -eu
cd "$(dirname "$0")/.."
luac_bin="${LUAC:-luac5.4}"
command -v "$luac_bin" >/dev/null 2>&1 || luac_bin=luac
for file in *.lua; do "$luac_bin" -p "$file"; done
node --check html/app.js
theme_dir="${KORA_THEME_DIR:-../kora_theme}"
if [ -f "$theme_dir/theme.json" ]; then
  node tools/sync-theme.mjs --check "$theme_dir"
  echo "kora_loading: html/kora_theme matches $theme_dir"
else
  echo "kora_loading: theme sync check skipped (no kora_theme at $theme_dir)"
fi
lua test/config.lua
echo "kora_loading: ok"
