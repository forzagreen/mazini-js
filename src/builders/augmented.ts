// Forms II–XV and Iq–IVq. Port of ar-verb.lua 2166-2739.
import {
  A,
  AA,
  AAH,
  AH,
  HAMZA,
  I,
  II,
  IN,
  M,
  MU,
  N,
  S,
  SH,
  SK,
  T,
  TA,
  TU,
  U,
  UU,
  W,
  Y,
  _I,
  _U,
} from "../chars";
import type { Base, VowelSpec } from "../base";
import { insertFormOrForms } from "../base";
import { q, req, rget } from "../forms";
import type { AbForm } from "../forms";
import { MaziniError } from "../errors";
import { PAST_ENDINGS_AY_12_PERSON_ONLY } from "../endings";
import { allSame, inflectTense } from "../tense";
import { hayyRadicals } from "../radicals";
import { axadhRadicals, raaRadicals } from "./form1";
import {
  highFormVerbalNoun,
  isFinalWeak,
  makeAugmentedGeminateVerb,
  makeAugmentedHollowVerb,
  makeAugmentedSoundFinalWeakVerb,
  makeHigh5FormSoundFinalWeakVerb,
  makeHighFormSoundFinalWeakVerb,
} from "./common";

function rads3(vs: VowelSpec): [string, string, string] {
  return [vs.rad1!, vs.rad2!, vs.rad3!];
}
function rads4(vs: VowelSpec): [string, string, string, string] {
  return [vs.rad1!, vs.rad2!, vs.rad3!, vs.rad4!];
}

/** The ta-/tu- prefixes of forms II/III/V/VI; reduced forms V/VI double rad1 across a sukūn instead. */
function formIiIiiVViTaTuPrefix(base: Base, rad1: string): [AbForm, AbForm, AbForm] {
  const vform = base.verbForm;
  if (vform === "V" || vform === "VI") {
    if (base.reduced) return [q(_I, rad1, SK), q(rad1, SK), q(_U, rad1, SK)];
    return [TA, TA, TU];
  }
  return ["", "", ""];
}

export function makeFormIiVSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const finalWeak = isFinalWeak(base, vs);
  const vform = base.verbForm;
  const [taPast, taNonpast, tuPast] = formIiIiiVViTaTuPrefix(base, rad1);
  const vn =
    vform === "V"
      ? q(taPast, rad1, A, rad2, SH, finalWeak ? IN : q(U, rad3))
      : q(TA, rad1, SK, rad2, II, finalWeak ? AH : rad3);
  const pastStemBase = q(taPast, rad1, A, rad2, SH);
  const nonpastStemBase = q(taNonpast, rad1, A, rad2, SH);
  const pastPassStemBase = q(tuPast, rad1, U, rad2, SH);
  makeAugmentedSoundFinalWeakVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
}

function makeFormIiiAltVn(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const finalWeak = isFinalWeak(base, vs);
  insertFormOrForms(base, "vn2", q(rad1, I, rad2, AA, finalWeak ? HAMZA : rad3));
}

export function makeFormIiiViSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const finalWeak = isFinalWeak(base, vs);
  const vform = base.verbForm;
  const [taPast, taNonpast, tuPast] = formIiIiiVViTaTuPrefix(base, rad1);
  const vn =
    vform === "VI"
      ? q(taPast, rad1, AA, rad2, finalWeak ? IN : q(U, rad3))
      : q(MU, rad1, AA, rad2, finalWeak ? AAH : q(A, rad3, AH));
  const pastStemBase = q(taPast, rad1, AA, rad2);
  const nonpastStemBase = q(taNonpast, rad1, AA, rad2);
  const pastPassStemBase = q(tuPast, rad1, UU, rad2);
  makeAugmentedSoundFinalWeakVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
  if (vform === "III") makeFormIiiAltVn(base, vs);
}

export function makeFormIiiViGeminateVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2] = rads3(vs);
  const vform = base.verbForm;
  const [taPast, taNonpast, tuPast] = formIiIiiVViTaTuPrefix(base, rad1);
  const vn = vform === "VI" ? q(taPast, rad1, AA, rad2, SH) : q(MU, rad1, AA, rad2, SH, AH);
  const pastStemBase = q(taPast, rad1, AA);
  const nonpastStemBase = q(taNonpast, rad1, AA);
  const pastPassStemBase = q(tuPast, rad1, UU);
  const variant = vs.variant ?? "short";
  if (variant === "short" || variant === "both") {
    makeAugmentedGeminateVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
  }
  // Also the uncompressed parts; duplicates are removed on insertion.
  if (variant === "long" || variant === "both") {
    makeFormIiiViSoundFinalWeakVerb(base, vs);
  } else if (vform === "III") {
    makeFormIiiAltVn(base, vs);
  }
}

export function makeFormIvSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const finalWeak = isFinalWeak(base, vs);
  let stemCore: AbForm;
  const isRaa = raaRadicals(rad1, rad2, rad3);
  if (isRaa) {
    base.irregular = true;
    stemCore = rad1;
  } else {
    stemCore = q(rad1, SK, rad2);
  }
  const vn = isRaa
    ? q(HAMZA, I, stemCore, AA, HAMZA, AH)
    : q(HAMZA, I, stemCore, AA, finalWeak ? HAMZA : rad3);
  const pastStemBase = q(HAMZA, A, stemCore);
  const nonpastStemBase = stemCore;
  const pastPassStemBase = q(HAMZA, U, stemCore);
  makeAugmentedSoundFinalWeakVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
}

export function makeFormIvHollowVerb(base: Base, vs: VowelSpec): void {
  const [rad1, , rad3] = rads3(vs);
  const vn = q(HAMZA, I, rad1, AA, rad3, AH);
  makeAugmentedHollowVerb(base, vs, q(HAMZA, A, rad1), rad1, q(HAMZA, U, rad1), vn);
}

export function makeFormIvGeminateVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2] = rads3(vs);
  const vn = q(HAMZA, I, rad1, SK, rad2, AA, rad2);
  makeAugmentedGeminateVerb(base, vs, q(HAMZA, A, rad1), rad1, q(HAMZA, U, rad1), vn);
}

function formViiNrad1(base: Base, rad1: string): AbForm {
  if (base.reduced) {
    if (!req(rad1, M)) {
      throw new MaziniError(
        "reduced_not_applicable",
        "Internal error: Form VII first radical " +
          rget(rad1) +
          " is not م but .reduced specified; should have been caught earlier",
      );
    }
    return M + SH;
  }
  return q("نْ", rad1);
}

export function makeFormViiSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  makeHighFormSoundFinalWeakVerb(base, vs, formViiNrad1(base, rad1), rad2, rad3);
}

export function makeFormViiHollowVerb(base: Base, vs: VowelSpec): void {
  const [rad1, , rad3] = rads3(vs);
  const nrad1 = formViiNrad1(base, rad1);
  const vn = highFormVerbalNoun(nrad1, Y, rad3);
  const nonpastStemBase = nrad1;
  makeAugmentedHollowVerb(base, vs, q(_I, nonpastStemBase), nonpastStemBase, q(_U, nrad1), vn);
}

export function makeFormViiGeminateVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2] = rads3(vs);
  const nrad1 = formViiNrad1(base, rad1);
  const vn = highFormVerbalNoun(nrad1, rad2, rad2);
  const nonpastStemBase = q(nrad1, A);
  makeAugmentedGeminateVerb(base, vs, q(_I, nonpastStemBase), nonpastStemBase, q(_U, nrad1, U), vn);
}

function formViiiVerbalNoun(base: Base, vs: VowelSpec, rad2: AbForm, rad3: AbForm): AbForm[] {
  const finalWeak = isFinalWeak(base, vs);
  return [highFormVerbalNoun(vs.formViiiAssim!, rad2, finalWeak ? HAMZA : rad3)];
}

export function makeFormViiiSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  if (axadhRadicals(rad1, rad2, rad3)) base.irregular = true; // اِتَّخَذَ
  makeHighFormSoundFinalWeakVerb(base, vs, vs.formViiiAssim!, rad2, rad3);
}

export function makeFormViiiHollowVerb(base: Base, vs: VowelSpec): void {
  const [, , rad3] = rads3(vs);
  const vn = formViiiVerbalNoun(base, vs, Y, rad3);
  const nonpastStemBase = vs.formViiiAssim!;
  makeAugmentedHollowVerb(base, vs, q(_I, nonpastStemBase), nonpastStemBase, q(_U, nonpastStemBase), vn);
}

export function makeFormViiiGeminateVerb(base: Base, vs: VowelSpec): void {
  const [, rad2] = rads3(vs);
  const vn = formViiiVerbalNoun(base, vs, rad2, rad2);
  const nonpastStemBase = q(vs.formViiiAssim!, A);
  makeAugmentedGeminateVerb(
    base,
    vs,
    q(_I, nonpastStemBase),
    nonpastStemBase,
    q(_U, vs.formViiiAssim!, U),
    vn,
  );
}

export function makeFormIxSoundVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const vn = q(_I, rad1, SK, rad2, I, rad3, AA, rad3);
  const nonpastStemBase = q(rad1, SK, rad2, A);
  makeAugmentedGeminateVerb(base, vs, q(_I, nonpastStemBase), nonpastStemBase, q(_U, rad1, SK, rad2, U), vn);
}

export function makeFormIxFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  makeHighFormSoundFinalWeakVerb(base, vs, q(rad1, SK, rad2), rad3, rad3);
}

export function makeFormXSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const isHayy = hayyRadicals(rad1, rad2, rad3);
  const variant = vs.variant ?? "both";
  if (!isHayy || variant === "long" || variant === "both") {
    makeHigh5FormSoundFinalWeakVerb(base, vs, S, T, rad1, rad2, rad3);
  }
  if (isHayy && (variant === "short" || variant === "both")) {
    base.irregular = true;
    makeHighFormSoundFinalWeakVerb(base, vs, S + SK + T, rad1, rad3);
  }
}

export function makeFormXHollowVerb(base: Base, vs: VowelSpec): void {
  const [rad1, , rad3] = rads3(vs);
  const vn = q(base.reduced ? "اِسْ" : "اِسْتِ", rad1, AA, rad3, AH);
  const pastStemBase = q(base.reduced ? "اِسْ" : "اِسْتَ", rad1);
  const nonpastStemBase = q(base.reduced ? "سْ" : "سْتَ", rad1);
  const pastPassStemBase = q(base.reduced ? "اُسْ" : "اُسْتُ", rad1);
  makeAugmentedHollowVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
}

export function makeFormXGeminateVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2] = rads3(vs);
  const vn = q("اِسْتِ", rad1, SK, rad2, AA, rad2);
  const pastStemBase = q("اِسْتَ", rad1);
  const nonpastStemBase = q("سْتَ", rad1);
  const pastPassStemBase = q("اُسْتُ", rad1);
  if (base.altgem) {
    inflectTense(base, "past", "", allSame(q(pastStemBase, A, rad2, SH)), PAST_ENDINGS_AY_12_PERSON_ONLY);
  }
  makeAugmentedGeminateVerb(
    base,
    vs,
    pastStemBase,
    nonpastStemBase,
    pastPassStemBase,
    vn,
    base.altgem ? "[uncommon]" : undefined,
  );
}

export function makeFormXiSoundVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const vn = q(_I, rad1, SK, rad2, II, rad3, AA, rad3);
  const nonpastStemBase = q(rad1, SK, rad2, AA);
  makeAugmentedGeminateVerb(base, vs, q(_I, nonpastStemBase), nonpastStemBase, q(_U, rad1, SK, rad2, UU), vn);
}

export function makeFormXiiSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  makeHigh5FormSoundFinalWeakVerb(base, vs, rad1, rad2, W, rad2, rad3);
}

export function makeFormXiiiSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  makeHigh5FormSoundFinalWeakVerb(base, vs, rad1, rad2, W, W, rad3);
}

export function makeFormXivXvSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3] = rads3(vs);
  const lastrad = base.verbForm === "XV" ? Y : rad3;
  makeHigh5FormSoundFinalWeakVerb(base, vs, rad1, rad2, N, rad3, lastrad);
}

export function makeFormIqIiqSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3, rad4] = rads4(vs);
  const finalWeak = isFinalWeak(base, vs);
  const vform = base.verbForm;
  const vn =
    vform === "IIq"
      ? q(TA, rad1, A, rad2, SK, rad3, finalWeak ? IN : q(U, rad4))
      : q(rad1, A, rad2, SK, rad3, finalWeak ? AAH : q(A, rad4, AH));
  const taPref = vform === "IIq" ? TA : "";
  const tuPref = vform === "IIq" ? TU : "";
  const pastStemBase = q(taPref, rad1, A, rad2, SK, rad3);
  const nonpastStemBase = pastStemBase;
  const pastPassStemBase = q(tuPref, rad1, U, rad2, SK, rad3);
  makeAugmentedSoundFinalWeakVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
}

/** The نون of اِفْعَنْلَلَ, or the إدغام that replaces it when |مدغم= and ل1 is weak. */
function formIiiqNAugment(base: Base, rad3: string): AbForm {
  if (!base.reduced) return N;
  if (!(req(rad3, W) || req(rad3, Y))) {
    throw new MaziniError(
      "reduced_not_applicable",
      "Form IIIq .reduced assimilates the نون into ل1, which must be و or ي, but saw " + rget(rad3),
    );
  }
  return rad3;
}

export function makeFormIiiqSoundFinalWeakVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3, rad4] = rads4(vs);
  makeHigh5FormSoundFinalWeakVerb(base, vs, rad1, rad2, formIiiqNAugment(base, rad3), rad3, rad4);
}

export function makeFormIvqSoundVerb(base: Base, vs: VowelSpec): void {
  const [rad1, rad2, rad3, rad4] = rads4(vs);
  const vn = q(_I, rad1, SK, rad2, I, rad3, SK, rad4, AA, rad4);
  const pastStemBase = q(_I, rad1, SK, rad2, A, rad3);
  const nonpastStemBase = q(rad1, SK, rad2, A, rad3);
  const pastPassStemBase = q(_U, rad1, SK, rad2, U, rad3);
  makeAugmentedGeminateVerb(base, vs, pastStemBase, nonpastStemBase, pastPassStemBase, vn);
}
