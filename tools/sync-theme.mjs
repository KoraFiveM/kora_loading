#!/usr/bin/env node
// A loadscreen runs before other resources are mounted, so https://cfx-nui-kora_theme/*
// is often unreachable while it is on screen. This copies kora_theme's theme.js and
// theme.json (the single source of truth for colours) into html/kora_theme/ so the
// page can derive the exact same tokens locally. Nothing is edited by hand.
//
//   node tools/sync-theme.mjs [path/to/kora_theme]          copy the files
//   node tools/sync-theme.mjs --check [path/to/kora_theme]  exit 1 if the copies are stale
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const source = resolve(args.find((arg) => !arg.startsWith("--")) || join(root, "..", "kora_theme"));
const target = join(root, "html", "kora_theme");
const files = ["theme.js", "theme.json"];

if (!existsSync(join(source, "theme.json"))) {
  console.error(`kora_theme not found at ${source}`);
  process.exit(2);
}

let stale = false;
for (const file of files) {
  const from = join(source, file);
  const to = join(target, file);
  if (check) {
    if (!existsSync(to) || !readFileSync(from).equals(readFileSync(to))) {
      console.error(`stale: html/kora_theme/${file}`);
      stale = true;
    }
  } else {
    mkdirSync(target, { recursive: true });
    copyFileSync(from, to);
    console.log(`synced html/kora_theme/${file}`);
  }
}
process.exit(stale ? 1 : 0);
