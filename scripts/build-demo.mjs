// Build the GitHub Pages demo into ./site: bundle demo/browser-entry.ts with esbuild (the engine is pure
// code, nothing to preload), copy index.html, and turn test/fixtures/book/ into site/book.json for the
// self-test panel.
import { build } from "esbuild";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const site = resolve(root, "site");

rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });

await build({
  entryPoints: [resolve(root, "demo/browser-entry.ts")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  sourcemap: true,
  charset: "utf8",
  outfile: resolve(site, "app.js"),
  logLevel: "info",
});

copyFileSync(resolve(root, "demo/index.html"), resolve(site, "index.html"));
copyFileSync(resolve(root, "demo/styles.css"), resolve(site, "styles.css"));
writeFileSync(resolve(site, ".nojekyll"), "");

// book.json: [{slug, root, wazn, label, passive, reduced, cells: [[slot, form], ...]}]
function csv(text) {
  return text
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((line) => {
      const out = [];
      let i = 0;
      while (i <= line.length) {
        if (line[i] === '"') {
          let buf = "";
          i++;
          while (i < line.length) {
            if (line[i] === '"') {
              if (line[i + 1] === '"') {
                buf += '"';
                i += 2;
              } else {
                i++;
                break;
              }
            } else {
              buf += line[i];
              i++;
            }
          }
          out.push(buf);
          i++;
        } else {
          const n = line.indexOf(",", i);
          const e = n < 0 ? line.length : n;
          out.push(line.slice(i, e));
          i = e + 1;
        }
      }
      return out;
    });
}
const bookDir = join(root, "test", "fixtures", "book");
const COLS = { past: "past_", past_pass: "past_pass_", ind: "ind_", ind_pass: "ind_pass_", imp: "imp_" };
const [header, ...rows] = csv(readFileSync(join(bookDir, "index.csv"), "utf8"));
const book = rows.map((r) => {
  const e = Object.fromEntries(r.map((c, i) => [header[i], c]));
  const [h, ...cells] = csv(readFileSync(join(bookDir, e.slug + ".csv"), "utf8"));
  const out = [];
  for (const cell of cells) {
    const row = Object.fromEntries(cell.map((c, i) => [h[i], c]));
    for (const col of Object.keys(COLS)) if (row[col]) out.push([COLS[col] + row.person, row[col]]);
  }
  return {
    slug: e.slug,
    root: e.root,
    wazn: e.wazn,
    label: e.label,
    passive: !!e.passive,
    reduced: !!e.reduced,
    cells: out,
  };
});
writeFileSync(resolve(site, "book.json"), JSON.stringify(book));
console.log(
  `demo built -> site/ (app.js, index.html, styles.css, book.json with ${book.length} paradigms, ${readdirSync(site).length} files)`,
);
