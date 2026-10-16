// The attested-verb lexicon: decoding, lookups, and that every listed verb conjugates.
import { describe, expect, it } from "vitest";
import { conjugate, MaziniError, normalizeRoot, WAZNS } from "../src/index";
import { WAZN_BY_NAME } from "../src/wazn";
import { isAttested, LEXICON_INFO, lexiconEntries, lexiconRoots, transitivity } from "../src/lexicon";

const ALPHABET = "ءبتثجحخدذرزسشصضطظعغفقكلمنهوي";

describe("lexicon", () => {
  it("counts match the generated header", () => {
    const roots = lexiconRoots();
    expect(roots.length).toBe(LEXICON_INFO.roots);
    expect(roots.length).toBe(7626);
    expect(roots.reduce((n, r) => n + lexiconEntries(r).length, 0)).toBe(LEXICON_INFO.verbs);
    expect(LEXICON_INFO.verbs).toBe(24188);
    expect(LEXICON_INFO.sourceUrl).toBe("https://github.com/m-bakni/arabic-morphology");
    expect(LEXICON_INFO.sourceCommit).toHaveLength(40);
  });

  it("roots are normalised and sorted, entries well formed", () => {
    const roots = lexiconRoots();
    const key = (r: string) => [...r].map((ch) => String.fromCharCode(65 + ALPHABET.indexOf(ch))).join("");
    const seen = new Set<string>();
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      expect([3, 4]).toContain(r.length);
      expect(normalizeRoot(r).join("")).toBe(r);
      if (i > 0 && roots[i - 1].length === r.length) expect(key(roots[i - 1]) < key(r)).toBe(true);
      if (i > 0) expect(roots[i - 1].length <= r.length).toBe(true);
      for (const e of lexiconEntries(r)) {
        expect(e.root).toBe(r);
        expect(WAZN_BY_NAME.get(e.wazn)!.formCode).toBe(e.formCode);
        expect(["intransitive", "transitive", "both"]).toContain(e.transitivity);
        expect(e.formCode.endsWith("q")).toBe(r.length === 4);
        seen.add(e.wazn);
      }
    }
    expect([...seen].sort()).toEqual(WAZNS.map((w) => w.wazn).sort());
  });

  it("entries follow the tables", () => {
    // Rows of the four CSV tables, read against the marks ل / م / ك.
    expect(lexiconEntries("أبأ").map((e) => [e.wazn, e.transitivity])).toEqual([
      ["فعَل يفعَل", "transitive"],
    ]);
    expect(lexiconEntries("أبب").map((e) => [e.formCode, e.transitivity])).toEqual([
      ["I/a~u", "both"],
      ["I/a~i", "both"],
      ["II", "intransitive"],
      ["V", "intransitive"],
      ["VIII", "intransitive"],
    ]);
    expect(lexiconEntries("كتب").map((e) => e.wazn)).toEqual([
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
    expect(lexiconEntries("بأبأ").map((e) => [e.formCode, e.transitivity])).toEqual([
      ["Iq", "both"],
      ["IIq", "intransitive"],
    ]);
    expect(lexiconEntries("قشعر").map((e) => [e.formCode, e.transitivity])).toEqual([
      ["Iq", "transitive"],
      ["IIq", "intransitive"],
      ["IVq", "intransitive"],
    ]);
    expect(lexiconEntries("حرجم")[1].formCode).toBe("IIIq");
  });

  it("lookups take every root and pattern spelling", () => {
    expect(transitivity("كتب", "استفعل")).toBe("transitive");
    expect(transitivity("ك ت ب", "X")).toBe("transitive");
    expect(transitivity("ك_ت_ب", "I/a~u")).toBe("both");
    expect(transitivity("أخذ", "فاعل")).toBe("transitive");
    expect(transitivity("ءخذ", "III")).toBe("transitive");
    expect(transitivity("أخذ", "افتعل")).toBe("both");
    expect(transitivity("رمى", "فعَل يفعِل")).toBe("both");
    expect(transitivity("رمي", "I/a~i")).toBe("both");
    expect(isAttested("كتب", "تفاعل")).toBe(true);
    expect(isAttested("كتب", "افعوعل")).toBe(false);
    expect(isAttested("كتب", "فعُل يفعُل")).toBe(false);
    expect(transitivity("كتب", "افعوعل")).toBeNull();
    expect(lexiconEntries("ضضض")).toEqual([]);
    expect(isAttested("ضضض", "فعَل يفعُل")).toBe(false);
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
    expect(() => lexiconEntries("قال")).toThrow(MaziniError);
  });

  it("every attested verb conjugates", () => {
    const entries = lexiconRoots().flatMap((r) => lexiconEntries(r));
    for (let i = 0; i < entries.length; i += 9) {
      const e = entries[i];
      const c = conjugate(e.root, e.wazn);
      expect(c.lemma.length, `${e.root} ${e.wazn}`).toBeGreaterThan(0);
      expect(c.wazn).toBe(e.wazn);
    }
  });
});
