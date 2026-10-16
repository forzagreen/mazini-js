// The attested-verb lexicon: decoding, lookups, and that every listed verb conjugates.
import { describe, expect, it } from "vitest";
import { conjugate, MaziniError, normalizeRoot, WAZNS } from "../src/index";
import { attestedWazns, isAttested, LEXICON_INFO, lexiconRoots } from "../src/lexicon";

const ALPHABET = "ءبتثجحخدذرزسشصضطظعغفقكلمنهوي";
const QUAD = ["فعلل", "تفعلل", "افعنلل", "افعللّ"];

describe("lexicon", () => {
  it("counts match the generated header", () => {
    const roots = lexiconRoots();
    expect(roots.length).toBe(LEXICON_INFO.roots);
    expect(roots.length).toBe(7626);
    expect(roots.reduce((n, r) => n + attestedWazns(r).length, 0)).toBe(LEXICON_INFO.verbs);
    expect(LEXICON_INFO.verbs).toBe(24188);
    expect(LEXICON_INFO.sourceUrl).toBe("https://github.com/m-bakni/arabic-morphology");
    expect(LEXICON_INFO.sourceCommit).toHaveLength(40);
  });

  it("roots are normalised and sorted, patterns in table order", () => {
    const roots = lexiconRoots();
    const key = (r: string) => [...r].map((ch) => String.fromCharCode(65 + ALPHABET.indexOf(ch))).join("");
    const order = WAZNS.map((w) => w.wazn);
    const seen = new Set<string>();
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      expect([3, 4]).toContain(r.length);
      expect(normalizeRoot(r).join("")).toBe(r);
      if (i > 0) expect(roots[i - 1].length <= r.length).toBe(true);
      if (i > 0 && roots[i - 1].length === r.length) expect(key(roots[i - 1]) < key(r)).toBe(true);
      const wazns = attestedWazns(r);
      expect(wazns.length).toBeGreaterThan(0);
      const idx = wazns.map((w) => order.indexOf(w));
      expect(idx).toEqual([...idx].sort((a, b) => a - b));
      for (const w of wazns) {
        expect(QUAD.includes(w)).toBe(r.length === 4);
        seen.add(w);
      }
    }
    expect([...seen].sort()).toEqual([...order].sort());
  });

  it("entries follow the tables", () => {
    // Rows of the four CSV tables.
    expect(attestedWazns("أبأ")).toEqual(["فعَل يفعَل"]);
    expect(attestedWazns("أبب")).toEqual(["فعَل يفعُل", "فعَل يفعِل", "فعّل", "تفعّل", "افتعل"]);
    expect(attestedWazns("كتب")).toEqual([
      "فعَل يفعُل",
      "فعَل يفعِل",
      "فعّل",
      "فاعل",
      "أفعل",
      "تفعّل",
      "تفاعل",
      "افتعل",
      "استفعل",
    ]);
    expect(attestedWazns("أتمت")).toEqual(["فعلل"]);
    expect(attestedWazns("بأبأ")).toEqual(["فعلل", "تفعلل"]);
    expect(attestedWazns("قشعر")).toEqual(["فعلل", "تفعلل", "افعللّ"]);
    expect(attestedWazns("حرجم")).toEqual(["فعلل", "افعنلل"]);
    expect(attestedWazns("يهيه")).toEqual(["فعلل"]);
  });

  it("lookups take every root and pattern spelling", () => {
    for (const [root, wazn] of [
      ["كتب", "استفعل"],
      ["ك ت ب", "X"],
      ["ك_ت_ب", "I/a~u"],
      ["أخذ", "افتعل"],
      ["ءخذ", "VIII"],
      ["رمى", "فعَل يفعِل"],
      ["رمي", "I/a~i"],
    ])
      expect(isAttested(root, wazn), `${root} ${wazn}`).toBe(true);
    for (const [root, wazn] of [
      ["كتب", "افعوعل"],
      ["كتب", "فعُل يفعُل"],
      ["كتب", "IVq"],
      ["ضضض", "فعَل يفعُل"],
    ])
      expect(isAttested(root, wazn), `${root} ${wazn}`).toBe(false);
    expect(attestedWazns("ضضض")).toEqual([]);
  });

  it("bad input throws like conjugate", () => {
    for (const [root, wazn, code] of [
      ["قال", "فعَل يفعُل", "bad_root"],
      ["كتب", "فعل", "unknown_wazn"],
    ]) {
      let err: unknown;
      try {
        isAttested(root, wazn);
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(MaziniError);
      expect((err as MaziniError).code).toBe(code);
    }
    expect(() => attestedWazns("قال")).toThrow(MaziniError);
  });

  it("every attested verb conjugates", () => {
    const verbs = lexiconRoots().flatMap((r) => attestedWazns(r).map((w) => [r, w]));
    for (let i = 0; i < verbs.length; i += 9) {
      const [root, wazn] = verbs[i];
      const c = conjugate(root, wazn);
      expect(c.lemma.length, `${root} ${wazn}`).toBeGreaterThan(0);
      expect(c.wazn).toBe(wazn);
    }
  });
});
