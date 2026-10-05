#!/usr/bin/env node
/**
 * Renders the PairForm logo (src/assets/logo.tsx) to public/logo.png.
 *
 * Emails cannot use the SVG component: most mail apps only show ordinary image files
 * loaded from a public address. Run this again whenever the logo changes:
 *
 *   node scripts/generate_email_logo.mjs
 */
import ts from "typescript";
import sharp from "sharp";
import { pathToFileURL } from "node:url";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const WIDTH = 600; // shown at 150px wide, so this stays sharp on high-density screens

const dir = mkdtempSync(join(process.cwd(), "node_modules", ".pairform-logo-"));
const compiled = join(dir, "logo.mjs");
try {
  // Compile the component to plain JavaScript next to the project so its imports resolve.
  const source = readFileSync("src/assets/logo.tsx", "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  writeFileSync(compiled, outputText);
  const { default: Logo } = await import(pathToFileURL(compiled).href);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");

  const svg = renderToStaticMarkup(createElement(Logo));
  await sharp(Buffer.from(svg), { density: 600 })
    .resize({ width: WIDTH })
    .png({ compressionLevel: 9 })
    .toFile("public/logo.png");
  const meta = await sharp("public/logo.png").metadata();
  console.log(`public/logo.png written: ${meta.width}x${meta.height}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
