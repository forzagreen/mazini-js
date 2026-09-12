// The engine-only half of وحدة:ar-verb/مختبر (wiki/batch_0.lua upstream), ported case for case.
import { describe, expect, it } from "vitest";
import { classifyTriliteralVerb, conjugate, MaziniError, normalizeRoot, WAZNS, SLOTS } from "../src/index";

function slot(c: ReturnType<typeof conjugate>, name: string): string | undefined {
  const forms = (c.slots as Record<string, { form: string }[]>)[name];
  return forms ? forms.map((f) => f.form).join("/") : undefined;
}
const first = (c: ReturnType<typeof conjugate>, name: string) =>
  (c.slots as Record<string, { form: string }[]>)[name]?.[0]?.form;

describe("form I–IV", () => {
  it("كتب, فعَل يفعُل", () => {
    const r = conjugate("كتب", "فعَل يفعُل");
    expect(first(r, "past_3ms")).toBe("كَتَبَ");
    expect(first(r, "ind_3ms")).toBe("يَكْتُبُ");
    expect(first(r, "imp_2ms")).toBe("اُكْتُبْ");
    expect(first(r, "ap")).toBe("كَاتِب");
    expect(first(r, "pp")).toBe("مَكْتُوب");
    expect(r.hasActive).toBe(true);
    expect(r.hasPassive).toBe(true);
    expect(r.verbForms[0]).toBe("I");
  });
  it("درس, فعّل", () => {
    const r = conjugate("درس", "فعّل");
    expect([
      first(r, "past_3ms"),
      first(r, "ind_3ms"),
      first(r, "imp_2ms"),
      first(r, "ap"),
      first(r, "pp"),
      first(r, "vn"),
    ]).toEqual(["دَرَّسَ", "يُدَرِّسُ", "دَرِّسْ", "مُدَرِّس", "مُدَرَّس", "تَدْرِيس"]);
  });
  it("قتل, فاعل", () => {
    const r = conjugate("قتل", "فاعل");
    expect([
      first(r, "past_3ms"),
      first(r, "ind_3ms"),
      first(r, "imp_2ms"),
      first(r, "ap"),
      first(r, "pp"),
    ]).toEqual(["قَاتَلَ", "يُقَاتِلُ", "قَاتِلْ", "مُقَاتِل", "مُقَاتَل"]);
  });
  it("رسل, أفعل", () => {
    const r = conjugate("رسل", "أفعل");
    expect([
      first(r, "past_3ms"),
      first(r, "ind_3ms"),
      first(r, "imp_2ms"),
      first(r, "ap"),
      first(r, "pp"),
    ]).toEqual(["أَرْسَلَ", "يُرْسِلُ", "أَرْسِلْ", "مُرْسِل", "مُرْسَل"]);
  });
  it("form IV hollow: wāw and yāʾ alike contract to أَفَالَ", () => {
    expect(first(conjugate("قول", "أفعل"), "past_3ms")).toBe("أَقَالَ");
    for (const [root, want] of [
      ["تيس", "أَتَاسَ"],
      ["طيب", "أَطَابَ"],
      ["بين", "أَبَانَ"],
      ["ضيع", "أَضَاعَ"],
      ["طيح", "أَطَاحَ"],
    ]) {
      expect(first(conjugate(root, "أفعل"), "past_3ms"), root).toBe(want);
    }
    expect(first(conjugate("تيس", "استفعل"), "past_3ms")).toBe("اِسْتَتَاسَ");
  });
  it("form IV sound exceptions (أَفْيَلَ)", () => {
    for (const [root, want] of [
      ["خيل", "أَخْيَلَ"],
      ["غيل", "أَغْيَلَ"],
      ["حيج", "أَحْيَجَ"],
      ["حين", "أَحْيَنَ"],
      ["خيف", "أَخْيَفَ"],
      ["ريف", "أَرْيَفَ"],
      ["زين", "أَزْيَنَ"],
    ]) {
      expect(first(conjugate(root, "أفعل"), "past_3ms"), root).toBe(want);
    }
  });
});

describe("weak roots and root spellings", () => {
  it("hollow, defective, geminate, assimilated", () => {
    const qwl = conjugate("قول", "فعَل يفعُل");
    expect([first(qwl, "past_3ms"), first(qwl, "ind_3ms"), first(qwl, "imp_2ms")]).toEqual([
      "قَالَ",
      "يَقُولُ",
      "قُلْ",
    ]);
    const rmy = conjugate("رمي", "فعَل يفعِل");
    expect([first(rmy, "past_3ms"), first(rmy, "ind_3ms"), first(rmy, "imp_2ms"), first(rmy, "ap")]).toEqual([
      "رَمَى",
      "يَرْمِي",
      "اِرْمِ",
      "رَامٍ",
    ]);
    expect(first(conjugate("م_د_د", "فعَل يفعُل"), "past_3ms")).toBe("مَدَّ");
    const wsl = conjugate("وصل", "فعَل يفعِل");
    expect([first(wsl, "past_3ms"), first(wsl, "ind_3ms"), first(wsl, "imp_2ms")]).toEqual([
      "وَصَلَ",
      "يَصِلُ",
      "صِلْ",
    ]);
  });
  it("underscores and spaces separate radicals", () => {
    for (const root of ["ك_ت_ب", "ك ت ب", "كتب", "كَتَبَ"]) {
      const r = conjugate(root, "فعَل يفعُل");
      expect(first(r, "past_3ms"), root).toBe("كَتَبَ");
      expect(first(r, "ind_3ms"), root).toBe("يَكْتُبُ");
    }
    expect(normalizeRoot("أخذ")).toEqual(["ء", "خ", "ذ"]);
    expect(normalizeRoot("رمى")).toEqual(["ر", "م", "ي"]);
  });
  it("rejects what the module rejects, with a stable code", () => {
    for (const [root, wazn, code] of [
      ["قال", "فعَل يفعُل", "bad_root"],
      ["", "فعَل يفعُل", "bad_root"],
      ["كتب", "فعل", "unknown_wazn"],
      ["كتب", "انفعل", "reduced_not_applicable"],
    ] as const) {
      let err: unknown;
      try {
        conjugate(root, wazn, { reduced: code === "reduced_not_applicable" });
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(MaziniError);
      expect((err as MaziniError).code).toBe(code);
    }
  });
});

describe("every pattern", () => {
  it("the six form-I vowel patterns", () => {
    const cases: [string, string, string, string, string][] = [
      ["كتب", "فعَل يفعُل", "كَتَبَ", "يَكْتُبُ", "اُكْتُبْ"],
      ["ضرب", "فعَل يفعِل", "ضَرَبَ", "يَضْرِبُ", "اِضْرِبْ"],
      ["فتح", "فعَل يفعَل", "فَتَحَ", "يَفْتَحُ", "اِفْتَحْ"],
      ["علم", "فعِل يفعَل", "عَلِمَ", "يَعْلَمُ", "اِعْلَمْ"],
      ["كرم", "فعُل يفعُل", "كَرُمَ", "يَكْرُمُ", "اُكْرُمْ"],
      ["حسب", "فعِل يفعِل", "حَسِبَ", "يَحْسِبُ", "اِحْسِبْ"],
    ];
    for (const [root, wazn, past, pres, imp] of cases) {
      const r = conjugate(root, wazn);
      expect([slot(r, "past_3ms"), slot(r, "ind_3ms"), slot(r, "imp_2ms")], root).toEqual([past, pres, imp]);
    }
  });
  it("the derived forms V–XIII", () => {
    const cases: [string, string, string, string, string][] = [
      ["علم", "تفعّل", "تَعَلَّمَ", "يَتَعَلَّمُ", "تَعَلُّم"],
      ["عون", "تفاعل", "تَعَاوَنَ", "يَتَعَاوَنُ", "تَعَاوُن"],
      ["كسر", "انفعل", "اِنْكَسَرَ", "يَنْكَسِرُ", "اِنْكِسَار"],
      ["جمع", "افتعل", "اِجْتَمَعَ", "يَجْتَمِعُ", "اِجْتِمَاع"],
      ["حمر", "افعلّ", "اِحْمَرَّ", "يَحْمَرُّ", "اِحْمِرَار"],
      ["خرج", "استفعل", "اِسْتَخْرَجَ", "يَسْتَخْرِجُ", "اِسْتِخْرَاج"],
      ["حمر", "افعالّ", "اِحْمَارَّ", "يَحْمَارُّ", "اِحْمِيرَار"],
      ["عشب", "افعوعل", "اِعْشَوْشَبَ", "يَعْشَوْشِبُ", "اِعْشِيشَاب"],
      ["جلذ", "افعوّل", "اِجْلَوَّذَ", "يَجْلَوِّذُ", "اِجْلِوَّاذ"],
    ];
    for (const [root, wazn, past, pres, vn] of cases) {
      const r = conjugate(root, wazn);
      expect([slot(r, "past_3ms"), slot(r, "ind_3ms"), slot(r, "vn")], root + " " + wazn).toEqual([
        past,
        pres,
        vn,
      ]);
    }
  });
  it("the quadriliteral forms", () => {
    const cases: [string, string, string, string, string][] = [
      ["دحرج", "فعلل", "دَحْرَجَ", "يُدَحْرِجُ", "دَحْرَجَة"],
      ["دحرج", "تفعلل", "تَدَحْرَجَ", "يَتَدَحْرَجُ", "تَدَحْرُج"],
      ["حرجم", "افعنلل", "اِحْرَنْجَمَ", "يَحْرَنْجِمُ", "اِحْرِنْجَام"],
      ["قشعر", "افعللّ", "اِقْشَعَرَّ", "يَقْشَعِرُّ", "اِقْشِعْرَار"],
    ];
    for (const [root, wazn, past, pres, vn] of cases) {
      const r = conjugate(root, wazn);
      expect([slot(r, "past_3ms"), slot(r, "ind_3ms"), slot(r, "vn")], root + " " + wazn).toEqual([
        past,
        pres,
        vn,
      ]);
    }
  });
  it("form codes and the WAZNS table agree", () => {
    for (const w of WAZNS) {
      const a = conjugate("كتب".length && w.verbForm.endsWith("q") ? "دحرج" : "كتب", w.wazn);
      const b = conjugate(w.verbForm.endsWith("q") ? "دحرج" : "كتب", w.formCode);
      expect(JSON.stringify(a.slots)).toBe(JSON.stringify(b.slots));
      expect(a.wazn).toBe(w.wazn);
    }
    expect(SLOTS.length).toBe(119);
  });
});

describe("persons, moods, passive, irregulars", () => {
  it("persons and moods of كتب", () => {
    const r = conjugate("كتب", "فعَل يفعُل");
    const cases: [string, string][] = [
      ["past_1s", "كَتَبْتُ"],
      ["past_2ms", "كَتَبْتَ"],
      ["past_3fs", "كَتَبَتْ"],
      ["past_3fp", "كَتَبْنَ"],
      ["ind_1s", "أَكْتُبُ"],
      ["ind_2fs", "تَكْتُبِينَ"],
      ["ind_3mp", "يَكْتُبُونَ"],
      ["sub_3ms", "يَكْتُبَ"],
      ["juss_3ms", "يَكْتُبْ"],
      ["imp_2fs", "اُكْتُبِي"],
      ["imp_2mp", "اُكْتُبُوا"],
      ["imp_2fp", "اُكْتُبْنَ"],
    ];
    for (const [s, want] of cases) expect(slot(r, s), s).toBe(want);
  });
  it("passive forms", () => {
    const r = conjugate("كتب", "فعَل يفعُل");
    expect([
      slot(r, "past_pass_3ms"),
      slot(r, "ind_pass_3ms"),
      slot(r, "sub_pass_3ms"),
      slot(r, "juss_pass_3ms"),
    ]).toEqual(["كُتِبَ", "يُكْتَبُ", "يُكْتَبَ", "يُكْتَبْ"]);
    const r2 = conjugate("درس", "فعّل");
    expect([slot(r2, "past_pass_3ms"), slot(r2, "ind_pass_3ms")]).toEqual(["دُرِّسَ", "يُدَرَّسُ"]);
  });
  it("the irregular verbs", () => {
    const raa = conjugate("رأي", "فعَل يفعَل");
    expect([slot(raa, "past_3ms"), slot(raa, "ind_3ms"), slot(raa, "imp_2ms")]).toEqual([
      "رَأَى",
      "يَرَى",
      "رَ",
    ]);
    const araa = conjugate("رأي", "أفعل");
    expect([slot(araa, "past_3ms"), slot(araa, "ind_3ms")]).toEqual(["أَرَى", "يُرِي"]);
    const akal = conjugate("أكل", "فعَل يفعُل");
    expect([slot(akal, "past_3ms"), slot(akal, "imp_2ms")]).toEqual(["أَكَلَ", "كُلْ"]);
    expect(slot(conjugate("أخذ", "فعَل يفعُل"), "imp_2ms")).toBe("خُذْ");
    const amar = conjugate("أمر", "فعَل يفعُل");
    expect(slot(amar, "imp_2ms")).toBe("مُرْ/اُؤْمُرْ");
    expect(amar.slots.imp_2ms![1].footnotes).toEqual([
      "[used especially with a clitic such as {{m|ar|فَ}} or {{m|ar|وَ}}]",
    ]);
    expect(amar.irregular).toBe(true);
    const saal = conjugate("سأل", "فعَل يفعَل");
    expect([slot(saal, "imp_2ms"), slot(saal, "juss_3ms")]).toEqual(["اِسْأَلْ/سَلْ", "يَسْأَلْ/يَسَلْ"]);
    const hayy = conjugate("حيي", "فعِل يفعَل");
    expect([slot(hayy, "past_3ms"), slot(hayy, "ind_3ms")]).toEqual(["حَيَّ/حَيِيَ", "يَحْيَا"]);
  });
  it("the reduced (مدغم) shapes", () => {
    const ittakhadha = conjugate("أخذ", "افتعل", { reduced: true });
    expect([slot(ittakhadha, "past_3ms"), slot(ittakhadha, "ind_3ms"), slot(ittakhadha, "vn")]).toEqual([
      "اِتَّخَذَ",
      "يَتَّخِذُ",
      "اِتِّخَاذ",
    ]);
    expect(slot(conjugate("درأ", "تفاعل", { reduced: true }), "past_3ms")).toBe("اِدَّارَأَ");
    const istaa = conjugate("طوع", "استفعل", { reduced: true });
    expect([slot(istaa, "past_3ms"), slot(istaa, "ind_3ms")]).toEqual(["اِسْطَاعَ", "يَسْطِيعُ"]);
    expect(istaa.reduced).toBe(true);
  });
  it("mithāl, nāqiṣ, lafīf", () => {
    const cases: [string, string, string, string, string, string][] = [
      ["وعد", "فعَل يفعِل", "وَعَدَ", "يَعِدُ", "عِدْ", "وَاعِد"],
      ["دعو", "فعَل يفعُل", "دَعَا", "يَدْعُو", "اُدْعُ", "دَاعٍ"],
      ["شوي", "فعَل يفعِل", "شَوَى", "يَشْوِي", "اِشْوِ", "شَاوٍ"],
      ["وقي", "فعَل يفعِل", "وَقَى", "يَقِي", "قِ", "وَاقٍ"],
    ];
    for (const [root, wazn, past, pres, imp, ap] of cases) {
      const r = conjugate(root, wazn);
      expect([slot(r, "past_3ms"), slot(r, "ind_3ms"), slot(r, "imp_2ms"), slot(r, "ap")], root).toEqual([
        past,
        pres,
        imp,
        ap,
      ]);
    }
  });
  it("the unknown form-I مصدر is a '?' placeholder, and the metadata says so", () => {
    const r = conjugate("كتب", "فعَل يفعُل");
    expect(r.slots.vn).toEqual([{ form: "?", footnotes: [] }]);
    expect(r.uncertainSlots).toEqual(["vn"]);
    expect(r.lemma[0].form).toBe("كَتَبَ");
    expect(r.weakness).toBe("sound");
    expect(r.passive).toBe("pass");
    expect(r.classification).toBe("صحيح سالم");
    const stative = conjugate("علم", "فعِل يفعَل");
    expect(stative.uncertainSlots).toEqual(["ap", "vn"]);
    expect(stative.passive).toBe("ipass");
  });
});

describe("classifyTriliteralVerb", () => {
  it("sound roots", () => {
    const cases: [string, string, string, string][] = [
      ["ك", "ت", "ب", "صحيح سالم"],
      ["ذ", "ه", "ب", "صحيح سالم"],
      ["م", "د", "د", "صحيح مُضعَّف"],
      ["ش", "د", "د", "صحيح مُضعَّف"],
      ["أ", "خ", "ذ", "صحيح مهموز الفاء"],
      ["س", "أ", "ل", "صحيح مهموز العين"],
      ["ق", "ر", "أ", "صحيح مهموز اللام"],
      ["أ", "ب", "أ", "صحيح مهموز الفاء واللام"],
      ["أ", "ب", "ب", "صحيح مُضعَّف مهموز الفاء"],
    ];
    for (const [a, b, c, want] of cases) expect(classifyTriliteralVerb(a, b, c), a + b + c).toBe(want);
  });
  it("weak roots", () => {
    const cases: [string, string, string, string][] = [
      ["و", "ج", "د", "معتل مثال واوي"],
      ["و", "ض", "أ", "معتل مثال واوي مهموز اللام"],
      ["ي", "س", "ر", "معتل مثال يائي"],
      ["ي", "أ", "س", "معتل مثال يائي مهموز العين"],
      ["ق", "و", "ل", "معتل أجوف واوي"],
      ["ب", "ي", "ع", "معتل أجوف يائي"],
      ["د", "ع", "و", "معتل ناقص واوي"],
      ["ر", "م", "ي", "معتل ناقص يائي"],
      ["و", "ي", "ي", "معتل لفيف مقرون مُضعَّف يائي"],
      ["ح", "و", "و", "معتل لفيف مقرون مُضعَّف واوي"],
      ["ح", "و", "ي", "معتل لفيف مقرون"],
      ["أ", "و", "ي", "معتل لفيف مقرون مهموز الفاء"],
      ["و", "ق", "ي", "معتل لفيف مفروق"],
      ["و", "أ", "ي", "معتل لفيف مفروق مهموز العين"],
      ["أ", "و", "ل", "معتل أجوف واوي مهموز الفاء"],
      ["ق", "و", "أ", "معتل أجوف واوي مهموز اللام"],
      ["أ", "ي", "ب", "معتل أجوف يائي مهموز الفاء"],
      ["ج", "ي", "أ", "معتل أجوف يائي مهموز اللام"],
      ["ر", "أ", "و", "معتل ناقص واوي مهموز العين"],
      ["ش", "أ", "ي", "معتل ناقص يائي مهموز العين"],
      ["و", "د", "د", "معتل مثال واوي مُضعَّف"],
      ["ي", "ن", "ن", "معتل مثال يائي مُضعَّف"],
      ["و", "أ", "ب", "معتل مثال واوي مهموز العين"],
      ["أ", "ت", "ي", "معتل ناقص يائي مهموز الفاء"],
    ];
    for (const [a, b, c, want] of cases) expect(classifyTriliteralVerb(a, b, c), a + b + c).toBe(want);
  });
});
