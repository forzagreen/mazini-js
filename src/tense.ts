// inflect_tense and the stem-pattern conjugators. Port of ar-verb.lua 1242-1440.
import { A, dia, IMP_PERSON_NUMBERS, PERSON_NUMBERS } from "./chars";
import type { PersonNumber } from "./chars";
import { combineFormAndFootnotes, q } from "./forms";
import type { AbForm, AbForms } from "./forms";
import { add3, stemOrEmpty } from "./base";
import type { Base } from "./base";
import {
  IMP_ENDINGS,
  IMP_ENDINGS_ALT_A,
  IMP_ENDINGS_ALT_I,
  IND_ENDINGS,
  JUSS_ENDINGS,
  JUSS_ENDINGS_ALT_A,
  JUSS_ENDINGS_ALT_I,
  NONPAST_PREFIX_CONSONANTS,
  PAST_ENDINGS,
  SUB_ENDINGS,
} from "./endings";
import type { Endings } from "./endings";
import { internal } from "./errors";

/** A per-person affix table: one entry per person, or a single value used for every person. */
export type Affixes = string | { allSame: AbForms } | readonly AbForms[];

export function allSame(x: AbForms): Affixes {
  return { allSame: x };
}

function getAffix(affixes: Affixes, i: number): AbForms {
  if (typeof affixes === "string") return affixes;
  if (Array.isArray(affixes)) return affixes[i];
  return (affixes as { allSame: AbForms }).allSame;
}

function verifyAffixes(tense: string, name: string, affixes: Affixes, n: number): void {
  if (Array.isArray(affixes) && affixes.length !== n) {
    internal(`For tense '${tense}', '${name}' should have length ${n} but has length ${affixes.length}`);
  }
}

/** inflect_tense_1: zip prefixes × stems × endings into `tense_<person>` for every person in `pnums`. */
export function inflectTense1(
  base: Base,
  tense: string,
  prefixes: Affixes | undefined,
  stems: Affixes | undefined,
  endings: Affixes | undefined,
  pnums: readonly PersonNumber[],
): void {
  if (prefixes === undefined || stems === undefined || endings === undefined) return;
  verifyAffixes(tense, "prefixes", prefixes, pnums.length);
  verifyAffixes(tense, "stems", stems, pnums.length);
  verifyAffixes(tense, "endings", endings, pnums.length);
  pnums.forEach((pn, i) => {
    add3(base, tense + "_" + pn, getAffix(prefixes, i), getAffix(stems, i), getAffix(endings, i));
  });
}

export function inflectTense(
  base: Base,
  tense: string,
  prefixes: Affixes | undefined,
  stems: Affixes | undefined,
  endings: Affixes | undefined,
): void {
  inflectTense1(base, tense, prefixes, stems, endings, PERSON_NUMBERS);
}

export function inflectTenseImp(base: Base, stems: Affixes | undefined, endings: Affixes | undefined): void {
  inflectTense1(base, "imp", "", stems, endings, IMP_PERSON_NUMBERS);
}

/** past_2stem_conj: vowel-initial and consonant-initial past stems (sound, assimilated, hollow, geminate). */
export function past2StemConj(
  base: Base,
  tense: string,
  vStem: AbForms | undefined,
  cStem: AbForms | undefined,
  footnote12?: string,
): void {
  const v = stemOrEmpty(vStem);
  let c12: AbForms = stemOrEmpty(cStem);
  if (footnote12 !== undefined && cStem !== undefined && !Array.isArray(cStem)) {
    c12 = combineFormAndFootnotes(cStem as AbForm, footnote12);
  }
  const c3: AbForms = stemOrEmpty(cStem);
  inflectTense(base, tense, "", [c12, c12, c12, v, v, c12, v, v, c12, c12, c12, v, c3], PAST_ENDINGS);
}

export function past1StemConj(base: Base, tense: string, stem: AbForms | undefined): void {
  past2StemConj(base, tense, stem, stem);
}

/** nonpast_2stem_conj: non-past with vowel-initial and consonant-initial stems; endings inferred from the tense. */
export function nonpast2StemConj(
  base: Base,
  tense: string,
  prefixVowel: "a" | "u",
  vStemIn: AbForms | undefined,
  cStemIn: AbForms | undefined,
  endings?: Endings,
  jussive?: boolean,
): void {
  const pv = dia[prefixVowel];
  const vStem = stemOrEmpty(vStemIn === undefined ? undefined : prefixStem(pv, vStemIn));
  const cStem = stemOrEmpty(cStemIn === undefined ? undefined : prefixStem(pv, cStemIn));
  if (!endings) {
    if (tense.startsWith("ind")) endings = IND_ENDINGS;
    else if (tense.startsWith("sub")) endings = SUB_ENDINGS;
    else if (tense.startsWith("juss")) {
      jussive = true;
      endings = JUSS_ENDINGS;
    } else internal("Unrecognized tense '" + tense + "'");
  }
  if (!jussive) {
    inflectTense(
      base,
      tense,
      NONPAST_PREFIX_CONSONANTS,
      [vStem, vStem, vStem, vStem, vStem, vStem, vStem, vStem, vStem, vStem, cStem, vStem, cStem],
      endings,
    );
  } else {
    inflectTense(
      base,
      tense,
      NONPAST_PREFIX_CONSONANTS,
      [cStem, cStem, vStem, cStem, cStem, vStem, vStem, vStem, cStem, vStem, cStem, vStem, cStem],
      endings,
    );
  }
}

/** q(dia[prefix_vowel], stem) for a string/form stem, or per element for a list. */
function prefixStem(pv: string, stem: AbForms): AbForms {
  if (Array.isArray(stem)) return (stem as readonly AbForm[]).map((s) => q(pv, s));
  return q(pv, stem as AbForm);
}

export function nonpast1StemConj(
  base: Base,
  tense: string,
  prefixVowel: "a" | "u",
  stem: AbForms | undefined,
  endings?: Endings,
  jussive?: boolean,
): void {
  nonpast2StemConj(base, tense, prefixVowel, stem, stem, endings, jussive);
}

/** jussive_gem_conj: the three geminate jussive alternants (-a, -i, null). */
export function jussiveGemConj(
  base: Base,
  tense: string,
  prefixVowel: "a" | "u",
  vStem: AbForms | undefined,
  cStem: AbForms | undefined,
): void {
  nonpast2StemConj(base, tense, prefixVowel, vStem, cStem, JUSS_ENDINGS_ALT_A);
  nonpast2StemConj(base, tense, prefixVowel, vStem, cStem, JUSS_ENDINGS_ALT_I);
  nonpast2StemConj(base, tense, prefixVowel, vStem, cStem, JUSS_ENDINGS, true);
}

export function make2StemImperative(
  base: Base,
  vStemIn: AbForms | undefined,
  cStemIn: AbForms | undefined,
  endings?: Endings,
  altGem?: boolean,
): void {
  endings = endings ?? IMP_ENDINGS;
  const vStem = stemOrEmpty(vStemIn);
  const cStem = stemOrEmpty(cStemIn);
  if (altGem) inflectTenseImp(base, [vStem, vStem, vStem, vStem, cStem], endings);
  else inflectTenseImp(base, [cStem, vStem, vStem, vStem, cStem], endings);
}

export function make1StemImperative(base: Base, stem: AbForms | undefined): void {
  make2StemImperative(base, stem, stem);
}

export function makeGemImperative(base: Base, vStem: AbForms | undefined, cStem: AbForms | undefined): void {
  make2StemImperative(base, vStem, cStem, IMP_ENDINGS_ALT_A, true);
  make2StemImperative(base, vStem, cStem, IMP_ENDINGS_ALT_I, true);
  make2StemImperative(base, vStem, cStem);
}

export const A_VOWEL = A;
