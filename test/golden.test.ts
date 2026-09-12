// Exact equivalence with the Lua module: every slot, every variant, every footnote, every metadata field,
// for every input in test/fixtures/golden.jsonl.gz (generated upstream by tools/port_fixtures.py).
import { describe, expect, it } from "vitest";
import { readFixtureLines } from "./util";
import { conjugate, MaziniError } from "../src/index";
import type { Conjugation } from "../src/index";

interface GoldenIn {
  root: string;
  wazn: string | null;
  form: string | null;
  passive: boolean;
  reduced: boolean;
}
interface GoldenBase {
  verb_form: string;
  passive: string;
  passive_uncertain: boolean;
  passive_defaulted: boolean;
  irregular: boolean;
  reduced: boolean;
  quadlit: boolean;
  orth: string[];
  conj_vowels: {
    past: string;
    nonpast: string;
    rad1: string;
    rad2: string;
    rad3: string;
    rad4: string | null;
    weakness: string;
    form_viii_assim: string | null;
  }[];
}
interface GoldenMeta {
  verb_slots: string[];
  morph_pattern: string[];
  verb_forms: string[];
  passive: string;
  passive_uncertain: boolean;
  has_active: boolean;
  has_passive: boolean;
  slot_uncertain: string[];
  bases: GoldenBase[];
  verb_type: string | null;
  classification: string | null;
}
interface GoldenRecord {
  id: string;
  in: GoldenIn;
  slots?: [string, [string, string[]][]][];
  meta?: GoldenMeta;
  error?: { code: string; lua: string };
}

const UNDIA: Record<string, string | null> = { "َ": "a", "ِ": "i", "ُ": "u", "-": null };

function run(rec: GoldenRecord): Conjugation {
  const wazn = rec.in.form ?? rec.in.wazn ?? "";
  return conjugate(rec.in.root, wazn, { passive: rec.in.passive, reduced: rec.in.reduced });
}

function slotsOf(c: Conjugation): [string, [string, string[]][]][] {
  return Object.entries(c.slots).map(([slot, forms]) => [slot, forms!.map((f) => [f.form, f.footnotes])]);
}

function metaOf(c: Conjugation): Record<string, unknown> {
  const vs = c.vowels;
  return {
    verb_slots: c.slotList,
    morph_pattern: c.morphPatterns,
    verb_forms: c.verbForms,
    passive: c.passive,
    passive_uncertain: c.passiveUncertain,
    has_active: c.hasActive,
    has_passive: c.hasPassive,
    slot_uncertain: c.uncertainSlots,
    verb_type: c.verbType,
    classification: c.classification,
    base: {
      verb_form: c.verbForm,
      passive: c.passive,
      passive_uncertain: c.passiveUncertain,
      passive_defaulted: c.passiveDefaulted,
      irregular: c.irregular,
      reduced: c.reduced,
      quadlit: c.quadriliteral,
      orth: Object.keys(c.orth)
        .filter((k) => (c.orth as Record<string, boolean>)[k])
        .sort(),
      past: vs.past,
      nonpast: vs.nonpast,
      radicals: c.radicals,
      weakness: c.weakness,
      form_viii_assim: c.formViiiAssim,
    },
  };
}

function metaOfGolden(m: GoldenMeta): Record<string, unknown> {
  const b = m.bases[0];
  const cv = b.conj_vowels[0];
  return {
    verb_slots: m.verb_slots,
    morph_pattern: m.morph_pattern,
    verb_forms: m.verb_forms,
    passive: m.passive,
    passive_uncertain: m.passive_uncertain,
    has_active: m.has_active,
    has_passive: m.has_passive,
    slot_uncertain: m.slot_uncertain,
    verb_type: m.verb_type,
    classification: m.classification,
    base: {
      verb_form: b.verb_form,
      passive: b.passive,
      passive_uncertain: b.passive_uncertain,
      passive_defaulted: b.passive_defaulted,
      irregular: b.irregular,
      reduced: b.reduced,
      quadlit: b.quadlit,
      orth: b.orth,
      past: UNDIA[cv.past],
      nonpast: UNDIA[cv.nonpast],
      radicals: [cv.rad1, cv.rad2, cv.rad3, ...(cv.rad4 ? [cv.rad4] : [])],
      weakness: cv.weakness,
      form_viii_assim: cv.form_viii_assim,
    },
  };
}

const records = readFixtureLines("golden.jsonl.gz").map((l) => JSON.parse(l) as GoldenRecord);
let variantsCompared = 0;
const groups = new Map<string, GoldenRecord[]>();
for (const rec of records) {
  const key = rec.meta
    ? `${rec.meta.bases[0].verb_form}-${rec.meta.bases[0].conj_vowels[0].weakness}`
    : `error-${rec.error!.code}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(rec);
}

describe("golden: exact equivalence with Module:ar-verb", () => {
  it("covers every input", () => {
    expect(records.length).toBeGreaterThan(7000);
  });
  for (const [group, recs] of groups) {
    it(`${group} (${recs.length})`, () => {
      const problems: string[] = [];
      for (const rec of recs) {
        if (rec.error) {
          let thrown: unknown;
          try {
            run(rec);
          } catch (e) {
            thrown = e;
          }
          if (!(thrown instanceof MaziniError))
            problems.push(
              `${rec.id}: expected error ${rec.error.code}, got ${thrown ? String(thrown) : "no error"}`,
            );
          else if (thrown.code !== rec.error.code)
            problems.push(
              `${rec.id}: expected error ${rec.error.code}, got ${thrown.code} (${thrown.message})`,
            );
          continue;
        }
        let c: Conjugation;
        try {
          c = run(rec);
        } catch (e) {
          problems.push(`${rec.id}: threw ${String(e)}`);
          continue;
        }
        const got = slotsOf(c);
        const want = rec.slots!;
        const gotMap = new Map(got.map(([s, v]) => [s, JSON.stringify(v)]));
        const wantMap = new Map(want.map(([s, v]) => [s, JSON.stringify(v)]));
        for (const [slot, w] of wantMap) {
          variantsCompared += want.find((x) => x[0] === slot)![1].length;
          const g = gotMap.get(slot);
          if (g !== w) problems.push(`${rec.id} ${slot}: expected ${w} got ${g ?? "(absent)"}`);
        }
        for (const slot of gotMap.keys())
          if (!wantMap.has(slot)) problems.push(`${rec.id} ${slot}: unexpected ${gotMap.get(slot)}`);
        if (got.map((x) => x[0]).join() !== want.map((x) => x[0]).join())
          problems.push(`${rec.id}: slot order differs`);
        const gm = metaOf(c),
          wm = metaOfGolden(rec.meta!);
        for (const key of Object.keys(wm)) {
          if (JSON.stringify(gm[key]) !== JSON.stringify(wm[key])) {
            problems.push(
              `${rec.id} meta.${key}: expected ${JSON.stringify(wm[key])} got ${JSON.stringify(gm[key])}`,
            );
          }
        }
      }
      if (problems.length) {
        console.log(
          `\n[${group}] ${problems.length} problems; first 12:\n  ` + problems.slice(0, 12).join("\n  "),
        );
      }
      expect(problems.length, problems.slice(0, 3).join("\n")).toBe(0);
    });
  }
  it("compared every variant of every slot", () => {
    console.log(`golden: ${records.length} inputs, ${variantsCompared} variants compared`);
    expect(variantsCompared).toBeGreaterThan(700000);
  });
});
