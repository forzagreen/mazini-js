// The وزن names {{تصريف}} takes, their form codes and their مجرد/مزيد class. ar-verb.lua:140-195.
export type VerbForm =
  | "I"
  | "II"
  | "III"
  | "IV"
  | "V"
  | "VI"
  | "VII"
  | "VIII"
  | "IX"
  | "X"
  | "XI"
  | "XII"
  | "XIII"
  | "XIV"
  | "XV"
  | "Iq"
  | "IIq"
  | "IIIq"
  | "IVq";
export type Vowel = "a" | "i" | "u";
export type FormCode = "I/a~u" | "I/a~i" | "I/a~a" | "I/u~u" | "I/i~a" | "I/i~i" | Exclude<VerbForm, "I">;

export const ALLOWED_VFORMS: readonly VerbForm[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "Iq",
  "IIq",
  "IIIq",
  "IVq",
];

export interface WaznInfo {
  /** The pattern as Arabic grammar names it, e.g. فعَل يفعُل or استفعل. */
  wazn: string;
  formCode: FormCode;
  verbForm: VerbForm;
  /** Form I only: the past and non-past stem vowels. */
  vowels: { past: Vowel; nonpast: Vowel } | null;
  /** مُجرَّد / مزيد بحرف / مزيد بحرفين / مزيد بثلاثة أحرف */
  basicDeriv: string;
}

const TABLE: [string, FormCode, string][] = [
  ["فعَل يفعُل", "I/a~u", "مُجرَّد"],
  ["فعَل يفعِل", "I/a~i", "مُجرَّد"],
  ["فعَل يفعَل", "I/a~a", "مُجرَّد"],
  ["فعُل يفعُل", "I/u~u", "مُجرَّد"],
  ["فعِل يفعَل", "I/i~a", "مُجرَّد"],
  ["فعِل يفعِل", "I/i~i", "مُجرَّد"],
  ["فعّل", "II", "مزيد بحرف"],
  ["فاعل", "III", "مزيد بحرف"],
  ["أفعل", "IV", "مزيد بحرف"],
  ["تفعّل", "V", "مزيد بحرفين"],
  ["تفاعل", "VI", "مزيد بحرفين"],
  ["انفعل", "VII", "مزيد بحرفين"],
  ["افتعل", "VIII", "مزيد بحرفين"],
  ["افعلّ", "IX", "مزيد بحرفين"],
  ["استفعل", "X", "مزيد بثلاثة أحرف"],
  ["افعالّ", "XI", "مزيد بثلاثة أحرف"],
  ["افعوعل", "XII", "مزيد بثلاثة أحرف"],
  ["افعوّل", "XIII", "مزيد بثلاثة أحرف"],
  ["فعلل", "Iq", "مُجرَّد"],
  ["تفعلل", "IIq", "مزيد بحرف"],
  ["افعنلل", "IIIq", "مزيد بحرفين"], // "XIV" should not be used
  ["افعللّ", "IVq", "مزيد بحرفين"],
];

/** Parse a form code such as "I/a~u" or "X" into its form and (for form I) vowels. */
export function parseFormCode(
  code: string,
): { verbForm: VerbForm; vowels: { past: Vowel; nonpast: Vowel } | null } | null {
  const m = /^(I)\/([aiu])~([aiu])$/.exec(code);
  if (m) return { verbForm: "I", vowels: { past: m[2] as Vowel, nonpast: m[3] as Vowel } };
  if ((ALLOWED_VFORMS as readonly string[]).includes(code) && code !== "I") {
    return { verbForm: code as VerbForm, vowels: null };
  }
  return null;
}

/** The 22 patterns, in the module's order. */
export const WAZNS: readonly WaznInfo[] = TABLE.map(([wazn, formCode, basicDeriv]) => {
  const parsed = parseFormCode(formCode)!;
  return { wazn, formCode, verbForm: parsed.verbForm, vowels: parsed.vowels, basicDeriv };
});

export const WAZN_BY_NAME: ReadonlyMap<string, WaznInfo> = new Map(WAZNS.map((w) => [w.wazn, w]));
export const WAZN_BY_CODE: ReadonlyMap<string, WaznInfo> = new Map(WAZNS.map((w) => [w.formCode, w]));

/** The وزن a form code is displayed as; XIV and XV have none (ar-verb.lua:166-169). */
export function formCodeToWazn(code: string): string | null {
  return WAZN_BY_CODE.get(code)?.wazn ?? null;
}
