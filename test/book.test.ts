// The book: every printed cell of the 462 paradigms of El-Dahdah's معجم تصريف الأفعال العربية, checked exactly
// the way upstream's tests/run.lua checks the Lua module -- membership after loose() normalisation.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { FIXTURES } from "./util";
import { conjugate, loose } from "../src/index";

const COLS: Record<string, string> = {
  past: "past_",
  past_pass: "past_pass_",
  ind: "ind_",
  ind_pass: "ind_pass_",
  imp: "imp_",
};

function readCsv(path: string): Record<string, string>[] {
  const lines = readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"));
  const header = splitCsv(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(splitCsv(l).map((c, i) => [header[i], c])));
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
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
      const next = line.indexOf(",", i);
      const end = next < 0 ? line.length : next;
      out.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return out;
}

describe("the book: 462 paradigms from El-Dahdah", () => {
  it("every printed cell is among the forms the engine generates", () => {
    const book = join(FIXTURES, "book");
    const index = readCsv(join(book, "index.csv"));
    expect(index.length).toBe(462);
    let passed = 0;
    const failed: string[] = [];
    const perColumn: Record<string, number> = {};
    for (const e of index) {
      const c = conjugate(e.root, e.wazn, { passive: !!e.passive, reduced: !!e.reduced });
      const rows = readCsv(join(book, e.slug + ".csv"));
      for (const row of rows) {
        for (const col of Object.keys(COLS)) {
          const expected = row[col];
          if (!expected) continue;
          const slot = COLS[col] + row.person;
          const forms = (c.slots as Record<string, { form: string }[]>)[slot] ?? [];
          const want = loose(expected);
          const hit = forms.some((f) => loose(f.form) === want);
          if (hit) {
            passed++;
            perColumn[col] = (perColumn[col] ?? 0) + 1;
          } else {
            failed.push(
              `${e.slug} ${slot}: book ${expected}, engine ${forms.map((f) => f.form).join(" | ") || "(none)"}`,
            );
          }
        }
      }
    }
    console.log(`book: ${passed} passed, ${failed.length} failed; per column ${JSON.stringify(perColumn)}`);
    if (failed.length) console.log(failed.slice(0, 20).join("\n"));
    expect(failed).toEqual([]);
    expect(passed).toBe(15549);
  });
  it("lists the fixture files", () => {
    const n = readdirSync(join(FIXTURES, "book")).filter((f) => f.endsWith(".csv")).length;
    expect(n).toBe(463);
  });
});
