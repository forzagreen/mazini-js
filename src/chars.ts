// Characters, diacritics and the slot inventory. Port of module/ar-verb.lua:74-291.
// Every constant is a code point given by its escape so that mark order is never at the mercy
// of an editor's normalisation.

// hamza variants
export const HAMZA = "ء"; // hamza on the line = ء
export const HAMZA_ON_ALIF = "أ"; // أ
export const HAMZA_ON_W = "ؤ"; // ؤ
export const HAMZA_UNDER_ALIF = "إ"; // إ
export const HAMZA_ON_Y = "ئ"; // ئ
export const HAMZA_ANY_RE = /[ءأإؤئ]/u;
export const HAMZA_PH = "￰"; // hamza placeholder

export const BORDER = "￲";
export const KEEP_W_PH = "￳"; // retained-wāw placeholder; see postprocess
export const KEEP_HAMZA_PH = "￴"; // quiescent-hamza placeholder
export const WAW_SEAT_PH = "￵"; // pre-seated hamza-on-wāw placeholder
export const NO_MADDA_PH = "￶"; // hamza held back from the madda rule

// diacritics
export const A = "َ"; // fatḥa
export const AN = "ً"; // fatḥatān
export const U = "ُ"; // ḍamma
export const UN = "ٌ"; // ḍammatān
export const I = "ِ"; // kasra
export const IN = "ٍ"; // kasratān
export const SK = "ْ"; // sukūn
export const SH = "ّ"; // šadda
export const DAGGER_ALIF = "ٰ";
/** Regex source for one diacritic other than šadda. */
export const DIACRITIC_ANY_BUT_SH = "[ًٌٍَُِْٰ]";
/** Regex source for one short vowel. */
export const AIU = "[َُِ]";

export const dia: Record<string, string> = { a: A, i: I, u: U };
export const undia: Record<string, string> = { [A]: "a", [I]: "i", [U]: "u", "-": "-" };

// letters
export const ALIF = "ا"; // ا
export const AMAQ = "ى"; // ى
export const AMAD = "آ"; // آ
export const TAM = "ة"; // ة
export const T = "ت"; // ت
export const N = "ن"; // ن
export const W = "و"; // و
export const Y = "ي"; // ي
export const S = "س"; // س
export const M = "م"; // م

// common combinations
export const AH = A + TAM;
export const AA = A + ALIF;
export const AAMAQ = A + AMAQ;
export const AAH = AA + TAM;
export const II = I + Y;
export const UU = U + W;
export const AY = A + Y;
export const AW = A + W;
export const AYSK = AY + SK;
export const AWSK = AW + SK;
export const NA = N + A;
export const NI = N + I;
export const AAN = AA + N;
export const AANI = AA + NI;
export const MA = M + A;
export const MU = M + U;
export const TA = T + A;
export const TU = T + U;
export const _I = ALIF + I;
export const _U = ALIF + U;

/** The 13 person/number codes, in the module's slot order (ar-verb.lua:197-211). */
export const PERSON_NUMBERS = [
  "1s",
  "2ms",
  "2fs",
  "3ms",
  "3fs",
  "2d",
  "3md",
  "3fd",
  "1p",
  "2mp",
  "2fp",
  "3mp",
  "3fp",
] as const;
export type PersonNumber = (typeof PERSON_NUMBERS)[number];
/** The five imperative persons, in the same order. */
export const IMP_PERSON_NUMBERS = PERSON_NUMBERS.filter((p) => p.startsWith("2")) as readonly PersonNumber[];

/** Index of a person in the 13-slot affix arrays (never a literal number in the port). */
export function pnIndex(pn: PersonNumber): number {
  return PERSON_NUMBERS.indexOf(pn);
}
export function impIndex(pn: PersonNumber): number {
  return IMP_PERSON_NUMBERS.indexOf(pn);
}

/** The slots whose form is the verb's citation form, in order of preference. */
export const POTENTIAL_LEMMA_SLOTS = [
  "past_3ms",
  "past_pass_3ms",
  "ind_3ms",
  "ind_pass_3ms",
  "imp_2ms",
] as const;

/** Staging slots for the form-I participles and the form-III alternative مصدر. */
export const UNSETTABLE_SLOTS = ["ap1", "ap2", "ap3", "apcd", "apan", "pp2", "vn2"] as const;

export const TENSES = ["past", "ind", "sub", "juss"] as const;

function buildSlots(): string[] {
  const slots: string[] = ["ap", "pp", "vn", ...UNSETTABLE_SLOTS];
  for (const tense of TENSES) {
    for (const voice of ["", "_pass"]) {
      for (const pn of PERSON_NUMBERS) slots.push(tense + voice + "_" + pn);
    }
  }
  for (const pn of IMP_PERSON_NUMBERS) slots.push("imp_" + pn);
  return slots;
}

/** Every slot the engine can fill, in table order (ar-verb.lua add_slots, 269-291). */
export const SLOTS = buildSlots() as readonly Slot[];
export const SLOT_SET: ReadonlySet<string> = new Set(SLOTS);

export type Tense = (typeof TENSES)[number];
export type Slot =
  | "ap"
  | "pp"
  | "vn"
  | (typeof UNSETTABLE_SLOTS)[number]
  | `${Tense}_${PersonNumber}`
  | `${Tense}_pass_${PersonNumber}`
  | `imp_${"2ms" | "2fs" | "2d" | "2mp" | "2fp"}`;

/** Slots a form-I verb may simply not have been told: shown as "?" rather than left empty. */
export const SLOTS_THAT_MAY_BE_UNCERTAIN: readonly Slot[] = ["vn", "ap"];
