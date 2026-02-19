#!/usr/bin/env bash
set -euo pipefail

on_error() {
  echo "A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle" >&2
  echo "If this persists, verify pnpm deps and try again." >&2
}
trap on_error ERR

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HASH_FILE="$ROOT_DIR/src/canvas-host/a2ui/.bundle.hash"
OUTPUT_FILE="$ROOT_DIR/src/canvas-host/a2ui/a2ui.bundle.js"
A2UI_RENDERER_DIR="$ROOT_DIR/vendor/a2ui/renderers/lit"
# CanvasA2UI sources exist in this repo, but treat them as optional so
# downstream consumers (and forks) can run without the full vendor tree.
A2UI_APP_DIR="$ROOT_DIR/apps/shared/OpenClawKit/Tools/CanvasA2UI"

mkdir -p "$(dirname "$OUTPUT_FILE")"

write_stub_bundle() {
  cat >"$OUTPUT_FILE" <<'JS'
// Auto-generated fallback bundle.
//
// Some environments (eg forks or minimal CI contexts) don't include the
// upstream A2UI vendor sources. We still ship a tiny bundle so:
// - dist builds succeed (assets can be copied)
// - tests that mount /__openclaw__/a2ui can run
//
// Full A2UI functionality requires running the real bundler with the vendor
// sources present.

(() => {
  const g = globalThis;
  g.openclawA2UI = g.openclawA2UI ?? {};

  if (typeof g.HTMLElement === "function" && !g.customElements?.get?.("openclaw-a2ui-host")) {
    class OpenClawA2UIHost extends HTMLElement {
      connectedCallback() {
        if (!this.shadowRoot) {
          this.attachShadow({ mode: "open" });
        }
        this.shadowRoot.innerHTML = `<style>:host{display:block;height:100%;}</style>`;
      }
    }

    try {
      g.customElements?.define?.("openclaw-a2ui-host", OpenClawA2UIHost);
    } catch {
      // ignore
    }
  }
})();
JS
}

# Docker builds and some forks exclude vendor/apps via .dockerignore.
# In that environment we can keep a prebuilt bundle only if it exists.
# If it doesn't, write a small stub bundle instead of failing CI.
if [[ ! -d "$A2UI_RENDERER_DIR" || ! -d "$A2UI_APP_DIR" ]]; then
  if [[ -f "$OUTPUT_FILE" ]]; then
    echo "A2UI sources missing; keeping existing bundle at: $OUTPUT_FILE"
    exit 0
  fi

  echo "A2UI sources missing; writing stub bundle to: $OUTPUT_FILE"
  write_stub_bundle
  echo "stub" >"$HASH_FILE"
  exit 0
fi

INPUT_PATHS=("$ROOT_DIR/package.json")
if [[ -f "$ROOT_DIR/pnpm-lock.yaml" ]]; then
  INPUT_PATHS+=("$ROOT_DIR/pnpm-lock.yaml")
fi
INPUT_PATHS+=("$A2UI_RENDERER_DIR" "$A2UI_APP_DIR")

compute_hash() {
  ROOT_DIR="$ROOT_DIR" node --input-type=module - "${INPUT_PATHS[@]}" <<'NODE'
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.env.ROOT_DIR ?? process.cwd();
const inputs = process.argv.slice(2);
const files = [];

async function walk(entryPath) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry));
    }
    return;
  }
  files.push(entryPath);
}

for (const input of inputs) {
  await walk(input);
}

function normalize(p) {
  return p.split(path.sep).join("/");
}

files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

const hash = createHash("sha256");
for (const filePath of files) {
  const rel = normalize(path.relative(rootDir, filePath));
  hash.update(rel);
  hash.update("\0");
  hash.update(await fs.readFile(filePath));
  hash.update("\0");
}

process.stdout.write(hash.digest("hex"));
NODE
}

current_hash="$(compute_hash)"
if [[ -f "$HASH_FILE" ]]; then
  previous_hash="$(cat "$HASH_FILE")"
  if [[ "$previous_hash" == "$current_hash" && -f "$OUTPUT_FILE" ]]; then
    echo "A2UI bundle up to date; skipping."
    exit 0
  fi
fi

pnpm -s exec tsc -p "$A2UI_RENDERER_DIR/tsconfig.json"
rolldown -c "$A2UI_APP_DIR/rolldown.config.mjs"

echo "$current_hash" >"$HASH_FILE"
