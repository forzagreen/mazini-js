// Whole-verb builders shared by several forms. Port of ar-verb.lua 1448-1777 and 2371-2395.
import { A, AA, AN, AMAQ, I, II, IN, MU, SH, SK, _I } from "./../chars";
import type { Base, VowelSpec } from "../base";
import { insertFormOrForms, stemOrEmpty } from "../base";
import { q } from "../forms";
import type { AbForm, AbForms } from "../forms";
import {
  IMP_ENDINGS_AA,
  IMP_ENDINGS_II,
  IMP_ENDINGS_UU,
  IND_ENDINGS_AA,
  IND_ENDINGS_II,
  IND_ENDINGS_UU,
  JUSS_ENDINGS_AA,
  JUSS_ENDINGS_II,
  JUSS_ENDINGS_UU,
  PAST_ENDINGS_AW,
  PAST_ENDINGS_AY,
  PAST_ENDINGS_II,
  PAST_ENDINGS_UU,
  SUB_ENDINGS_AA,
  SUB_ENDINGS_II,
  SUB_ENDINGS_UU,
  withImpPerson,
  withPerson,
} from "../endings";
import type { Endings } from "../endings";
import { internal } from "../errors";
import {
  allSame,
  inflectTense,
  inflectTenseImp,
  jussiveGemConj,
  make1StemImperative,
  make2StemImperative,
  makeGemImperative,
  nonpast1StemConj,
  nonpast2StemConj,
  past1StemConj,
  past2StemConj,
} from "../tense";
import { prefixVowelFromVform, vformNonpastAVowel } from "../radicals";
import { UU } from "../chars";

/** Form XV (اِفْعَنْلَى) is final-weak by shape, whatever the root's third radical. */
export function isFinalWeak(base: Base, vs: VowelSpec): boolean {
  return vs.weakness === "final-weak" || base.verbForm === "XV";
}

/** Finite parts of a sound (or assimilated) verb from five stems plus the active non-past prefix vowel. */
export function makeSoundVerb(
  base: Base,
  pastStem: AbForms | undefined,
  pastPassStem: AbForms | undefined,
  nonpastStem: AbForms | undefined,
  nonpastPassStem: AbForms | undefined,
  impStem: AbForms | undefined,
  prefixVowel: "a" | "u",
): void {
  past1StemConj(base, "past", pastStem);
  past1StemConj(base, "past_pass", pastPassStem);
  nonpast1StemConj(base, "ind", prefixVowel, nonpastStem);
  nonpast1StemConj(base, "sub", prefixVowel, nonpastStem);
  nonpast1StemConj(base, "juss", prefixVowel, nonpastStem);
  nonpast1StemConj(base, "ind_pass", "u", nonpastPassStem);
  nonpast1StemConj(base, "sub_pass", "u", nonpastPassStem);
  nonpast1StemConj(base, "juss_pass", "u", nonpastPassStem);
  make1StemImperative(base, impStem);
}

function pastFinalWeakEndingsFromVowel(vowel: string): Endings {
  if (vowel === "ay") return PAST_ENDINGS_AY;
  if (vowel === "aw") return PAST_ENDINGS_AW;
  if (vowel === "ī") return PAST_ENDINGS_II;
  if (vowel === "ū") return PAST_ENDINGS_UU;
  return internal("Unrecognized past final-weak vowel spec '" + vowel + "'");
}

function nonpastFinalWeakEndingsFromVowel(vowel: string): [Endings, Endings, Endings, Endings] {
  if (vowel === "ā") return [IND_ENDINGS_AA, SUB_ENDINGS_AA, JUSS_ENDINGS_AA, IMP_ENDINGS_AA];
  if (vowel === "ī") return [IND_ENDINGS_II, SUB_ENDINGS_II, JUSS_ENDINGS_II, IMP_ENDINGS_II];
  if (vowel === "ū") return [IND_ENDINGS_UU, SUB_ENDINGS_UU, JUSS_ENDINGS_UU, IMP_ENDINGS_UU];
  return internal("Unrecognized non-past final-weak vowel spec '" + vowel + "'");
}

/**
 * Finite parts of a final-weak verb from five stems, the past ending vowel (ay, aw, ī, ū), the non-past
 * ending vowel (ā, ī, ū) and the prefix vowel. `retainRad3_2fs` keeps rad3 as a consonant before the 2fs -ī
 * (تَسْهُوِينَ / اُسْهُوِي).
 */
export function makeFinalWeakVerb(
  base: Base,
  pastStem: AbForm,
  pastPassStem: AbForm,
  nonpastStem: AbForm,
  nonpastPassStem: AbForm,
  impStem: AbForm,
  pastEndingVowel: string,
  nonpastEndingVowel: string,
  prefixVowel: "a" | "u",
  retainRad3_2fs?: boolean,
): void {
  const pastEndings = pastFinalWeakEndingsFromVowel(pastEndingVowel);
  const pastPassEndings = pastFinalWeakEndingsFromVowel("ī");
  let [indEndings, subEndings, jussEndings, impEndings] =
    nonpastFinalWeakEndingsFromVowel(nonpastEndingVowel);
  const [indPassEndings, subPassEndings, jussPassEndings] = nonpastFinalWeakEndingsFromVowel("ā");

  if (retainRad3_2fs) {
    // rad3 surfaces as a consonant carrying the class's own ḍamma, then the regular -ī
    indEndings = withPerson(indEndings, "2fs", UU + II + "نَ");
    subEndings = withPerson(subEndings, "2fs", UU + II);
    jussEndings = withPerson(jussEndings, "2fs", UU + II);
    impEndings = withImpPerson(impEndings, "2fs", UU + II);
  }

  inflectTense(base, "past", "", allSame(stemOrEmpty(pastStem)), pastEndings);
  inflectTense(base, "past_pass", "", allSame(stemOrEmpty(pastPassStem)), pastPassEndings);
  nonpast1StemConj(base, "ind", prefixVowel, nonpastStem, indEndings);
  nonpast1StemConj(base, "sub", prefixVowel, nonpastStem, subEndings);
  nonpast1StemConj(base, "juss", prefixVowel, nonpastStem, jussEndings);
  nonpast1StemConj(base, "ind_pass", "u", nonpastPassStem, indPassEndings);
  nonpast1StemConj(base, "sub_pass", "u", nonpastPassStem, subPassEndings);
  nonpast1StemConj(base, "juss_pass", "u", nonpastPassStem, jussPassEndings);
  inflectTenseImp(base, allSame(stemOrEmpty(impStem)), impEndings);
}

/** An augmented (form II+) final-weak verb: past in -ay, non-past in -ā (forms V/VI) or -ī. */
export function makeAugmentedFinalWeakVerb(
  base: Base,
  pastStem: AbForm,
  pastPassStem: AbForm,
  nonpastStem: AbForm,
  nonpastPassStem: AbForm,
  impStem: AbForm,
  prefixVowel: "a" | "u",
  form56: boolean,
): void {
  makeFinalWeakVerb(
    base,
    pastStem,
    pastPassStem,
    nonpastStem,
    nonpastPassStem,
    impStem,
    "ay",
    form56 ? "ā" : "ī",
    prefixVowel,
  );
}

/** An augmented sound or final-weak verb from its three stem bases and its مصدر. */
export function makeAugmentedSoundFinalWeakVerb(
  base: Base,
  vs: VowelSpec,
  pastStemBase: AbForm,
  nonpastStemBase: AbForm,
  pastPassStemBase: AbForm,
  vn: AbForms,
): void {
  insertFormOrForms(base, "vn", vn);

  const lastrad = (base.quadlit ? vs.rad4 : vs.rad3)!;
  const finalWeak = isFinalWeak(base, vs);
  const prefixVowel = prefixVowelFromVform(base.verbForm);
  const form56 = vformNonpastAVowel(base.verbForm);
  const aBaseSuffix: AbForm = finalWeak ? "" : q(A, lastrad);
  const iBaseSuffix: AbForm = finalWeak ? "" : q(I, lastrad);

  const pastStem = q(pastStemBase, aBaseSuffix);
  // Forms V and VI have /a/ as the last stem vowel of the finite non-past but /i/ in the active participle.
  const nonpastStem = q(nonpastStemBase, form56 ? aBaseSuffix : iBaseSuffix);
  const apStem = q(nonpastStemBase, iBaseSuffix);
  const pastPassStem = q(pastPassStemBase, iBaseSuffix);
  const nonpastPassStem = q(nonpastStemBase, aBaseSuffix);
  const impStem = q(pastStemBase, form56 ? aBaseSuffix : iBaseSuffix);

  if (finalWeak) {
    makeAugmentedFinalWeakVerb(
      base,
      pastStem,
      pastPassStem,
      nonpastStem,
      nonpastPassStem,
      impStem,
      prefixVowel,
      form56,
    );
  } else {
    makeSoundVerb(base, pastStem, pastPassStem, nonpastStem, nonpastPassStem, impStem, prefixVowel);
  }

  if (finalWeak) {
    insertFormOrForms(base, "ap", q(MU, apStem, IN));
    insertFormOrForms(base, "pp", q(MU, nonpastPassStem, AN, AMAQ));
  } else {
    insertFormOrForms(base, "ap", q(MU, apStem));
    insertFormOrForms(base, "pp", q(MU, nonpastPassStem));
  }
}

/** Finite parts of a hollow or geminate verb from ten stems. */
export function makeHollowGeminateVerb(
  base: Base,
  geminate: boolean,
  pastVStem: AbForms | undefined,
  pastCStem: AbForms | undefined,
  pastPassVStem: AbForms | undefined,
  pastPassCStem: AbForms | undefined,
  nonpastVStem: AbForms | undefined,
  nonpastCStem: AbForms | undefined,
  nonpastPassVStem: AbForms | undefined,
  nonpastPassCStem: AbForms | undefined,
  impVStem: AbForms | undefined,
  impCStem: AbForms | undefined,
  prefixVowel: "a" | "u",
  altgemNote?: string,
): void {
  past2StemConj(base, "past", pastVStem, pastCStem, altgemNote);
  past2StemConj(base, "past_pass", pastPassVStem, pastPassCStem);
  nonpast2StemConj(base, "ind", prefixVowel, nonpastVStem, nonpastCStem);
  nonpast2StemConj(base, "sub", prefixVowel, nonpastVStem, nonpastCStem);
  nonpast2StemConj(base, "ind_pass", "u", nonpastPassVStem, nonpastPassCStem);
  nonpast2StemConj(base, "sub_pass", "u", nonpastPassVStem, nonpastPassCStem);
  if (geminate) {
    jussiveGemConj(base, "juss", prefixVowel, nonpastVStem, nonpastCStem);
    jussiveGemConj(base, "juss_pass", "u", nonpastPassVStem, nonpastPassCStem);
    makeGemImperative(base, impVStem, impCStem);
  } else {
    nonpast2StemConj(base, "juss", prefixVowel, nonpastVStem, nonpastCStem);
    nonpast2StemConj(base, "juss_pass", "u", nonpastPassVStem, nonpastPassCStem);
    make2StemImperative(base, impVStem, impCStem);
  }
}

/** An augmented hollow verb from its stem bases and مصدر. */
export function makeAugmentedHollowVerb(
  base: Base,
  vs: VowelSpec,
  pastStemBase: AbForm,
  nonpastStemBase: AbForm,
  pastPassStemBase: AbForm,
  vn: AbForms,
): void {
  insertFormOrForms(base, "vn", vn);
  const lastrad = (base.quadlit ? vs.rad4 : vs.rad3)!;
  const form410 = base.verbForm === "IV" || base.verbForm === "X";
  const prefixVowel = prefixVowelFromVform(base.verbForm);

  const aBaseSuffixV = q(AA, lastrad); // 'af-āl-a, inf-āl-a
  const aBaseSuffixC = q(A, lastrad); // 'af-al-tu, inf-al-tu
  const iBaseSuffixV = q(II, lastrad); // 'uf-īl-a, unf-īl-a
  const iBaseSuffixC = q(I, lastrad); // 'uf-il-tu, unf-il-tu

  const pastVStem = q(pastStemBase, aBaseSuffixV);
  const pastCStem = q(pastStemBase, aBaseSuffixC);
  const nonpastVStem = q(nonpastStemBase, form410 ? iBaseSuffixV : aBaseSuffixV);
  const nonpastCStem = q(nonpastStemBase, form410 ? iBaseSuffixC : aBaseSuffixC);
  const pastPassVStem = q(pastPassStemBase, iBaseSuffixV);
  const pastPassCStem = q(pastPassStemBase, iBaseSuffixC);
  const nonpastPassVStem = q(nonpastStemBase, aBaseSuffixV);
  const nonpastPassCStem = q(nonpastStemBase, aBaseSuffixC);
  const impVStem = q(pastStemBase, form410 ? iBaseSuffixV : aBaseSuffixV);
  const impCStem = q(pastStemBase, form410 ? iBaseSuffixC : aBaseSuffixC);

  makeHollowGeminateVerb(
    base,
    false,
    pastVStem,
    pastCStem,
    pastPassVStem,
    pastPassCStem,
    nonpastVStem,
    nonpastCStem,
    nonpastPassVStem,
    nonpastPassCStem,
    impVStem,
    impCStem,
    prefixVowel,
  );

  insertFormOrForms(base, "ap", q(MU, nonpastVStem));
  insertFormOrForms(base, "pp", q(MU, nonpastPassVStem));
}

/** An augmented geminate verb from its stem bases and مصدر (+ the form-X altgem footnote). */
export function makeAugmentedGeminateVerb(
  base: Base,
  vs: VowelSpec,
  pastStemBase: AbForm,
  nonpastStemBase: AbForm,
  pastPassStemBase: AbForm,
  vn: AbForms,
  altgemNote?: string,
): void {
  insertFormOrForms(base, "vn", vn);
  const vform = base.verbForm;
  const lastrad = (base.quadlit ? vs.rad4 : vs.rad3)!;
  const prefixVowel = prefixVowelFromVform(vform);

  let aBaseSuffixV: AbForm, aBaseSuffixC: AbForm, iBaseSuffixV: AbForm, iBaseSuffixC: AbForm;
  if (vform === "IV" || vform === "X" || vform === "IVq") {
    aBaseSuffixV = q(A, lastrad, SH); // 'af-all
    aBaseSuffixC = q(SK, lastrad, A, lastrad); // 'af-lal
    iBaseSuffixV = q(I, lastrad, SH); // yuf-ill
    iBaseSuffixC = q(SK, lastrad, I, lastrad); // yuf-lil
  } else {
    aBaseSuffixV = q(lastrad, SH); // fā-ll, infa-ll
    aBaseSuffixC = q(lastrad, A, lastrad); // fā-lal, infa-lal
    iBaseSuffixV = q(lastrad, SH); // yufā-ll, yanfa-ll
    iBaseSuffixC = q(lastrad, I, lastrad); // yufā-lil, yanfa-lil
  }
  const aVowel = vformNonpastAVowel(vform);
  const pastVStem = q(pastStemBase, aBaseSuffixV);
  const pastCStem = q(pastStemBase, aBaseSuffixC);
  const nonpastVStem = q(nonpastStemBase, aVowel ? aBaseSuffixV : iBaseSuffixV);
  const nonpastCStem = q(nonpastStemBase, aVowel ? aBaseSuffixC : iBaseSuffixC);
  const pastPassVStem = q(pastPassStemBase, iBaseSuffixV);
  const pastPassCStem = q(pastPassStemBase, iBaseSuffixC);
  const nonpastPassVStem = q(nonpastStemBase, aBaseSuffixV);
  const nonpastPassCStem = q(nonpastStemBase, aBaseSuffixC);
  const impVStem = q(pastStemBase, aVowel ? aBaseSuffixV : iBaseSuffixV);
  const impCStem = q(pastStemBase, aVowel ? aBaseSuffixC : iBaseSuffixC);

  makeHollowGeminateVerb(
    base,
    true,
    pastVStem,
    pastCStem,
    pastPassVStem,
    pastPassCStem,
    nonpastVStem,
    nonpastCStem,
    nonpastPassVStem,
    nonpastPassCStem,
    impVStem,
    impCStem,
    prefixVowel,
    altgemNote,
  );

  insertFormOrForms(base, "ap", q(MU, nonpastVStem));
  insertFormOrForms(base, "pp", q(MU, nonpastPassVStem));
}

/** A مصدر of the shape shared by forms VII and above: اِفْعِلَال. */
export function highFormVerbalNoun(rad12: AbForm, rad34: AbForm, rad5: AbForm): AbForm {
  return q(_I, rad12, I, rad34, AA, rad5);
}

/** A sound or final-weak verb of any high-numbered form: two consonant clusters and a final consonant. */
export function makeHighFormSoundFinalWeakVerb(
  base: Base,
  vs: VowelSpec,
  rad12: AbForm,
  rad34: AbForm,
  rad5: AbForm,
): void {
  const finalWeak = isFinalWeak(base, vs);
  const vn = highFormVerbalNoun(rad12, rad34, finalWeak ? "ء" : rad5);
  const nonpastStemBase = q(rad12, A, rad34);
  const pastStemBase = q(_I, nonpastStemBase);
  const pastPassStemBase = q("اُ", rad12, "ُ", rad34);
  makeAugmentedSoundFinalWeakVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
}

export function makeHigh5FormSoundFinalWeakVerb(
  base: Base,
  vs: VowelSpec,
  rad1: AbForm,
  rad2: AbForm,
  rad3: AbForm,
  rad4: AbForm,
  rad5: AbForm,
): void {
  makeHighFormSoundFinalWeakVerb(base, vs, q(rad1, SK, rad2), q(rad3, SK, rad4), rad5);
}
