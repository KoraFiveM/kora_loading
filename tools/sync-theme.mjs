#!/usr/bin/env node
// A loadscreen runs before other resources are mounted, so https://cfx-nui-kora_theme/*
// is often unreachable while it is on screen. This copies kora_theme's theme.js,
// theme.json (the single source of truth for colours and font choices) and its
// fonts/ folder into html/kora_theme/ so the page can derive the exact same tokens
// and render the exact same fonts locally. Nothing is edited by hand.
//
//   node tools/sync-theme.mjs [path/to/kora_theme]          copy the files
//   node tools/sync-theme.mjs --check [path/to/kora_theme]  exit 1 if the copies are stale
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const given = args.find((arg) => !arg.startsWith("--"));
const target = join(root, "html", "kora_theme");
// theme.js resolves fonts/catalog.json next to the theme.json it loaded, and
// fonts.css points at the woff2 files next to itself, so the whole folder has
// to travel together.
const files = ["theme.js", "theme.json"];
const folders = ["fonts"];

// kora_theme is a [standalone] resource while this one lives in [kora], so the
// sibling guess only works when both sit in the same folder.
const candidates = given
    ? [resolve(given)]
    : [
        join(root, "..", "kora_theme"),
        join(root, "..", "..", "[standalone]", "kora_theme"),
        join(root, "..", "..", "kora_theme"),
    ].map((path) => resolve(path));
const source = candidates.find((path) => existsSync(join(path, "theme.json")));

if (!source) {
    console.error(`kora_theme not found; looked in:\n${candidates.map((path) => `  ${path}`).join("\n")}`);
    process.exit(2);
}

let stale = false;

function syncFile(from, to) {
    if (check) {
        if (existsSync(to) && readFileSync(from).equals(readFileSync(to))) return;
        console.error(`stale: ${relative(root, to)}`);
        stale = true;
        return;
    }
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    console.log(`synced ${relative(root, to)}`);
}

// Mirrors `from` into `to`: copies every file and reports or removes copies that
// no longer exist in kora_theme, so a renamed font never lingers here.
function syncFolder(from, to) {
    const wanted = new Set();
    for (const entry of readdirSync(from, { withFileTypes: true })) {
        wanted.add(entry.name);
        const nextFrom = join(from, entry.name);
        const nextTo = join(to, entry.name);
        if (entry.isDirectory()) syncFolder(nextFrom, nextTo);
        else if (entry.isFile()) syncFile(nextFrom, nextTo);
    }
    if (!existsSync(to)) return;
    for (const entry of readdirSync(to, { withFileTypes: true })) {
        if (wanted.has(entry.name)) continue;
        const extra = join(to, entry.name);
        if (check) {
            console.error(`stale: ${relative(root, extra)} is not in kora_theme`);
            stale = true;
        } else {
            rmSync(extra, { recursive: true, force: true });
            console.log(`removed ${relative(root, extra)}`);
        }
    }
}

for (const file of files) syncFile(join(source, file), join(target, file));
for (const folder of folders) {
    const from = join(source, folder);
    if (existsSync(from) && statSync(from).isDirectory()) syncFolder(from, join(target, folder));
}
process.exit(stale ? 1 : 0);
