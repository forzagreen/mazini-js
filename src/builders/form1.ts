// Form I: sound/assimilated, the حَيِيَ/عَيِيَ paradigm, final-weak, hollow and geminate.
// Port of ar-verb.lua 941-990 (irregular-root predicates) and 1755-2161.
import { A, AA, AAMAQ, AAN, ALIF, HAMZA, I, II, IN, MA, N, SH, SK, U, UU, W, Y, _I } from "../chars";
import type { Base, VowelSpec } from "../base";
import { insertAp2Pp2, insertFormOrForms, skipSlot } from "../base";
import { combineFormAndFootnotes, mapVowel, q, req, rget } from "../forms";
import type { AbForm } from "../forms";
import {
  IND_ENDINGS_AA,
  JUSS_ENDINGS_AA,
  IMP_ENDINGS_AA,
  PAST_ENDINGS,
  SUB_ENDINGS_AA,
  makeNonpastEndings,
  NONPAST_PREFIX_CONSONANTS,
} from "../endings";
import { pnIndex } from "../chars";
import { internal } from "../errors";
import {
  allSame,
  inflectTense,
  inflectTense1,
  inflectTenseImp,
  make1StemImperative,
  nonpast1StemConj,
  past2StemConj,
} from "../tense";
import { finalWeakUuRetainsRad3, geminateDegeminationVowel, hayyRadicals, isWawYa } from "../radicals";
import { makeFinalWeakVerb, makeHollowGeminateVerb, makeSoundVerb } from "./common";

/** The clitic note on the long imperative of أَمَرَ, as the module emits it (frame:preprocess is identity). */
export const CLITIC_NOTE = "[used especially with a clitic such as {{m|ar|فَ}} or {{m|ar|وَ}}]";

// ---- radicals of the irregular verbs (ar-verb.lua 958-990)
export function axadhRadicals(rad1: AbForm, rad2: AbForm, rad3: AbForm): boolean {
  return req(rad1, HAMZA) && req(rad2, "خ") && req(rad3, "ذ");
}
/** أكل/أخذ: "shortonly"; أمر: "shortlong" (long imperatives after a clitic); else false. */
export function reducedImperativeVerb(
  rad1: AbForm,
  rad2: AbForm,
  rad3: AbForm,
): "shortonly" | "shortlong" | false {
  if (axadhRadicals(rad1, rad2, rad3)) return "shortonly";
  if (req(rad1, HAMZA) && req(rad2, "ك") && req(rad3, "ل")) return "shortonly";
  if (req(rad1, HAMZA) && req(rad2, "م") && req(rad3, "ر")) return "shortlong";
  return false;
}
export function raaRadicals(rad1: AbForm, rad2: AbForm, rad3: AbForm): boolean {
  return req(rad1, "ر") && req(rad2, HAMZA) && isWawYa(rad3);
}
export function saalRadicals(rad1: AbForm, rad2: AbForm, rad3: AbForm): boolean {
  return req(rad1, "س") && req(rad2, HAMZA) && req(rad3, "ل");
}
export function kaanRadicals(rad1: AbForm, rad2: AbForm, rad3: AbForm): boolean {
  return req(rad1, "ك") && req(rad2, W) && req(rad3, N);
}
export function saalHollowRadicals(rad1: AbForm, rad2: AbForm, rad3: AbForm): boolean {
  return req(rad1, "س") && req(rad2, W) && req(rad3, "ل");
}

function rads3(vs: VowelSpec): [string, string, string, string, string] {
  return [vs.rad1!, vs.rad2!, vs.rad3!, vs.past, vs.nonpast];
}

/** The imperative stem up to and including rad1: hamzat wasl with the class vowel, rad1, sukūn. */
export function formIImpStemThroughRad1(base: Base, nonpastVowel: AbForm, rad1: AbForm): AbForm {
  const impVowel = mapVowel(nonpastVowel, (vow) => {
    if (vow === A || vow === I) return I;
    if (vow === U) return U;
    if (!skipSlot(base, "imp_2ms"))
      internal("Non-past vowel " + vow + " isn't a, i, or u, should have been caught earlier");
    return I; // passive-only; the imperative is never displayed
  });
  const vowelOnAlif = mapVowel(impVowel, (vow) => ALIF + vow);
  return q(vowelOnAlif, rad1, SK);
}

/** Form-I sound or assimilated verb. */
export function makeFormISoundAssimilatedVerb(base: Base, vs: VowelSpec, assimilated: boolean): void {
  const [rad1, rad2, rad3, pastVowel, nonpastVowel] = rads3(vs);

  const pastStem = q(rad1, A, rad2, pastVowel, rad3);
  const nonpastStem = assimilated ? q(rad2, nonpastVowel, rad3) : q(rad1, SK, rad2, nonpastVowel, rad3);
  const pastPassStem = q(rad1, U, rad2, I, rad3);
  const nonpastPassStem = q(rad1, SK, rad2, A, rad3);

  const reducedimp = reducedImperativeVerb(rad1, rad2, rad3);
  if (reducedimp) base.irregular = true;
  const impStemSuffix = q(rad2, nonpastVowel, rad3);
  const longImpStemBase = formIImpStemThroughRad1(base, nonpastVowel, rad1);
  const impStem = q(assimilated || reducedimp ? "" : longImpStemBase, impStemSuffix);

  // A form-I mithal that keeps its wāw spells its imperative on a hamzat wasl (اِوْجَلْ); see #10
  if (!assimilated && req(rad1, W)) base.orth.keep_initial_w = true;

  makeSoundVerb(base, pastStem, pastPassStem, nonpastStem, nonpastPassStem, impStem, "a");

  if (reducedimp === "shortlong") {
    make1StemImperative(base, combineFormAndFootnotes(q(longImpStemBase, impStemSuffix), CLITIC_NOTE));
  }

  // سَأَلَ: alternative jussive and imperative سَل
  if (saalRadicals(rad1, rad2, rad3)) {
    base.irregular = true;
    nonpast1StemConj(base, "juss", "a", "سَل");
    nonpast1StemConj(base, "juss_pass", "u", "سَل");
    make1StemImperative(base, "سَل");
  }

  insertFormOrForms(base, "ap1", q(rad1, AA, rad2, I, rad3));
  insertAp2Pp2(base, q(rad1, A, rad2, II, rad3));
  insertFormOrForms(base, "ap3", q(rad1, A, rad2, I, rad3));
  insertFormOrForms(base, "apcd", q(HAMZA, A, rad1, SK, rad2, A, rad3));
  insertFormOrForms(base, "apan", q(rad1, A, rad2, SK, rad3, AAN));
  insertFormOrForms(base, "pp", q(MA, rad1, SK, rad2, UU, rad3));
}

/** The إدغام-contracting form-I final-weak verb: حَيَّ beside حَيِيَ, عَيَّ beside عَيِيَ. */
export function makeFormIHayyVerb(base: Base, vs: VowelSpec): void {
  base.irregular = true;
  const [rad1, rad2, rad3] = rads3(vs);

  const pastCStem = q(rad1, A, rad2, I, rad3);
  const pastVStemLong = pastCStem;
  const pastVStemShort = q(rad1, A, rad2, SH);
  const pastVStem3mp = q(rad1, A, rad2); // حَيُوا, not the geminated حَيُّوا
  const pastPassCStem = q(rad1, U, rad2, I, rad3);
  const pastPassVStemLong = pastPassCStem;
  const pastPassVStemShort = q(rad1, U, rad2, SH);
  const pastPassVStem3mp = q(rad1, U, rad2);

  const nonpastStem = q(rad1, SK, rad2);
  const nonpastPassStem = nonpastStem;
  const impStem = q(_I, nonpastStem);

  past2StemConj(base, "past", [], pastCStem);
  past2StemConj(base, "past_pass", [], pastPassCStem);
  const variant = vs.variant ?? "both";
  if (variant === "short" || variant === "both") {
    past2StemConj(base, "past", pastVStemShort, []);
    past2StemConj(base, "past_pass", pastPassVStemShort, []);
  }
  const inflectLongVariant = (tense: string, longStem: AbForm, mpStem: AbForm) => {
    inflectTense1(
      base,
      tense,
      "",
      [longStem, longStem, longStem, longStem, mpStem],
      [
        PAST_ENDINGS[pnIndex("3ms")],
        PAST_ENDINGS[pnIndex("3fs")],
        PAST_ENDINGS[pnIndex("3md")],
        PAST_ENDINGS[pnIndex("3fd")],
        PAST_ENDINGS[pnIndex("3mp")],
      ],
      ["3ms", "3fs", "3md", "3fd", "3mp"],
    );
  };
  if (variant === "long" || variant === "both") {
    inflectLongVariant("past", pastVStemLong, pastVStem3mp);
    inflectLongVariant("past_pass", pastPassVStemLong, pastPassVStem3mp);
  }

  nonpast1StemConj(base, "ind", "a", nonpastStem, IND_ENDINGS_AA);
  nonpast1StemConj(base, "sub", "a", nonpastStem, SUB_ENDINGS_AA);
  nonpast1StemConj(base, "juss", "a", nonpastStem, JUSS_ENDINGS_AA);
  nonpast1StemConj(base, "ind_pass", "u", nonpastPassStem, IND_ENDINGS_AA);
  nonpast1StemConj(base, "sub_pass", "u", nonpastPassStem, SUB_ENDINGS_AA);
  nonpast1StemConj(base, "juss_pass", "u", nonpastPassStem, JUSS_ENDINGS_AA);
  inflectTenseImp(base, allSame(impStem), IMP_ENDINGS_AA);

  insertFormOrForms(base, "ap1", q(rad1, AA, rad2, IN));
  insertAp2Pp2(base, q(rad1, A, rad2, II, SH));
  insertFormOrForms(base, "ap3", q(rad1, A, rad2, IN));
  insertFormOrForms(base, "apcd", q(HAMZA, A, rad1, SK, rad2, AAMAQ));
  insertFormOrForms(base, "apan", q(rad1, A, rad2, SK, rad3, AAN));
  insertFormOrForms(base, "pp", q(MA, rad1, SK, rad2, req(rad3, Y) ? II : UU, SH));
}

/** Form-I final-weak or assimilated+final-weak verb. */
export function makeFormIFinalWeakVerb(base: Base, vs: VowelSpec, assimilated: boolean): void {
  const [rad1, rad2, rad3, pastVowel, nonpastVowel] = rads3(vs);

  if (hayyRadicals(rad1, rad2, rad3, "I")) {
    makeFormIHayyVerb(base, vs);
    return;
  }

  const pastStem = q(rad1, A, rad2);
  const pastPassStem = q(rad1, U, rad2);
  let nonpastStem: AbForm, nonpastPassStem: AbForm, impStem: AbForm;
  if (raaRadicals(rad1, rad2, rad3)) {
    base.irregular = true;
    nonpastStem = rad1;
    nonpastPassStem = rad1;
    impStem = rad1;
  } else {
    nonpastPassStem = q(rad1, SK, rad2);
    if (assimilated) {
      nonpastStem = rad2;
      impStem = rad2;
    } else {
      nonpastStem = nonpastPassStem;
      impStem = q(formIImpStemThroughRad1(base, nonpastVowel, rad1), rad2);
    }
  }

  if (!assimilated && req(rad1, W)) base.orth.keep_initial_w = true;

  const pastEndingVowel =
    req(rad3, Y) && req(pastVowel, A)
      ? "ay"
      : req(rad3, W) && req(pastVowel, A)
        ? "aw"
        : req(pastVowel, I)
          ? "ī"
          : "ū";
  const nonpastEndingVowel = req(nonpastVowel, A) ? "ā" : req(nonpastVowel, I) ? "ī" : "ū";
  makeFinalWeakVerb(
    base,
    pastStem,
    pastPassStem,
    nonpastStem,
    nonpastPassStem,
    impStem,
    pastEndingVowel,
    nonpastEndingVowel,
    "a",
    finalWeakUuRetainsRad3(pastEndingVowel, nonpastEndingVowel),
  );

  insertFormOrForms(base, "ap1", q(rad1, AA, rad2, IN));
  insertAp2Pp2(base, q(rad1, A, rad2, II, SH));
  insertFormOrForms(base, "ap3", q(rad1, A, rad2, IN));
  insertFormOrForms(base, "apcd", q(HAMZA, A, rad1, SK, rad2, AAMAQ));
  insertFormOrForms(base, "apan", q(rad1, A, rad2, SK, rad3, AAN));
  insertFormOrForms(base, "pp", q(MA, rad1, SK, rad2, req(rad3, Y) ? II : UU, SH));
}

/** Form-I hollow verb. */
export function makeFormIHollowVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3, pastVowelIn, nonpastVowel] = rads3(vs);
  // i~i and u~u were mapped to a~i and a~u by infer_radicals(); undo that to get the actual past vowel.
  let pastVowel: AbForm = pastVowelIn;
  if (req(pastVowel, A)) {
    pastVowel = mapVowel(pastVowel, () => (req(nonpastVowel, A) ? I : rget(nonpastVowel)));
  }
  const lengthenedNonpast = mapVowel(nonpastVowel, (vow) => (vow === U ? UU : vow === I ? II : AA));

  const pastVStem = q(rad1, AA, rad3);
  const pastCStem = q(rad1, pastVowel, rad3);
  const nonpastVStem = q(rad1, lengthenedNonpast, rad3);
  const nonpastCStem = q(rad1, nonpastVowel, rad3);
  // 'ufīla always; the contracted passive past takes whichever of i/u the active past_c_stem isn't.
  const pastPassVStem = q(rad1, II, rad3);
  const pastPassCStem = q(
    rad1,
    mapVowel(pastVowel, (vow) => (vow === I ? U : I)),
    rad3,
  );
  const nonpastPassVStem = q(rad1, AA, rad3);
  const nonpastPassCStem = q(rad1, A, rad3);
  const impVStem = nonpastVStem;
  const impCStem = nonpastCStem;

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
    "a",
  );

  if (kaanRadicals(rad1, rad2, rad3)) {
    const endings = makeNonpastEndings(U, [], [], [], []);
    inflectTense(base, "juss", NONPAST_PREFIX_CONSONANTS, q(A, rad1) as string, endings);
    base.irregular = true;
  }

  // سالَ يَسالُ keeps سَأَلْتُ's fatḥa in its contracted past (سَلْتَ); README finding #19
  if (saalHollowRadicals(rad1, rad2, rad3) && req(nonpastVowel, A)) {
    base.irregular = true;
    past2StemConj(base, "past", pastVStem, q(rad1, A, rad3));
  }

  insertFormOrForms(base, "ap1", req(rad3, HAMZA) ? q(rad1, AA, HAMZA, IN) : q(rad1, AA, HAMZA, I, rad3));
  insertAp2Pp2(base, q(rad1, A, Y, SH, I, rad3));
  insertFormOrForms(base, "ap3", q(rad1, A, Y, I, rad3));
  insertFormOrForms(base, "apcd", q(HAMZA, A, rad1, SK, rad2, A, rad3));
  insertFormOrForms(base, "apan", q(rad1, A, rad2, SK, rad3, AAN));
  insertFormOrForms(base, "pp", q(MA, rad1, req(rad2, Y) ? II : UU, rad3));
}

/** Form-I geminate verb. */
export function makeFormIGeminateVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3, pastVowel, nonpastVowel] = rads3(vs);

  const pastVStem = q(rad1, A, rad2, SH);
  const pastCStem = q(
    rad1,
    A,
    rad2,
    geminateDegeminationVowel(rad1, rad2, rad3, pastVowel, nonpastVowel),
    rad2,
  );
  const nonpastVStem = q(rad1, nonpastVowel, rad2, SH);
  const nonpastCStem = q(rad1, SK, rad2, nonpastVowel, rad2);
  const pastPassVStem = q(rad1, U, rad2, SH);
  const pastPassCStem = q(rad1, U, rad2, I, rad2);
  const nonpastPassVStem = q(rad1, A, rad2, SH);
  const nonpastPassCStem = q(rad1, SK, rad2, A, rad2);
  const impVStem = q(rad1, nonpastVowel, rad2, SH);
  const impCStem = q(formIImpStemThroughRad1(base, nonpastVowel, rad1), rad2, nonpastVowel, rad2);

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
    "a",
  );

  insertFormOrForms(base, "ap1", q(rad1, AA, rad2, SH));
  insertAp2Pp2(base, q(rad1, A, rad2, II, rad2));
  insertFormOrForms(base, "ap3", q(rad1, A, rad2, SH));
  insertFormOrForms(base, "apcd", q(HAMZA, A, rad1, A, rad2, SH));
  insertFormOrForms(base, "apan", q(rad1, A, rad2, SH, AAN));
  insertFormOrForms(base, "pp", q(MA, rad1, SK, rad2, UU, rad2));
}
