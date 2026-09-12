// The dispatch table (verb form + weakness → builder) and conjugate_verb. Port of ar-verb.lua 1844-2739
// (the conjugations[...] entries) and 3298-3347 (conjugate_verb), plus the ap1 → ap promotion of
// process_slot_overrides (3251-3264), which is the only part of it that runs without user overrides.
import { A, HAMZA_ANY_RE } from "./chars";
import type { Base, VowelSpec } from "./base";
import { skipSlot } from "./base";
import { MaziniError } from "./errors";
import { req } from "./forms";
import { addNaqlIdghamForms, postprocessForms } from "./postprocess";
import {
  makeFormIiVSoundFinalWeakVerb,
  makeFormIiiViGeminateVerb,
  makeFormIiiViSoundFinalWeakVerb,
  makeFormIiiqSoundFinalWeakVerb,
  makeFormIqIiqSoundFinalWeakVerb,
  makeFormIvGeminateVerb,
  makeFormIvHollowVerb,
  makeFormIvSoundFinalWeakVerb,
  makeFormIvqSoundVerb,
  makeFormIxFinalWeakVerb,
  makeFormIxSoundVerb,
  makeFormViiGeminateVerb,
  makeFormViiHollowVerb,
  makeFormViiSoundFinalWeakVerb,
  makeFormViiiGeminateVerb,
  makeFormViiiHollowVerb,
  makeFormViiiSoundFinalWeakVerb,
  makeFormXGeminateVerb,
  makeFormXHollowVerb,
  makeFormXSoundFinalWeakVerb,
  makeFormXiSoundVerb,
  makeFormXiiSoundFinalWeakVerb,
  makeFormXiiiSoundFinalWeakVerb,
  makeFormXivXvSoundFinalWeakVerb,
} from "./builders/augmented";
import {
  makeFormIFinalWeakVerb,
  makeFormIGeminateVerb,
  makeFormIHollowVerb,
  makeFormISoundAssimilatedVerb,
} from "./builders/form1";

type Builder = (base: Base, vs: VowelSpec) => void;

export const CONJUGATIONS: Record<string, Builder> = {
  "I-sound": (b, v) => makeFormISoundAssimilatedVerb(b, v, false),
  "I-assimilated": (b, v) => makeFormISoundAssimilatedVerb(b, v, true),
  "I-final-weak": (b, v) => makeFormIFinalWeakVerb(b, v, false),
  "I-assimilated+final-weak": (b, v) => makeFormIFinalWeakVerb(b, v, true),
  "I-hollow": makeFormIHollowVerb,
  "I-geminate": makeFormIGeminateVerb,
  "II-sound": makeFormIiVSoundFinalWeakVerb,
  "II-final-weak": makeFormIiVSoundFinalWeakVerb,
  "III-sound": makeFormIiiViSoundFinalWeakVerb,
  "III-final-weak": makeFormIiiViSoundFinalWeakVerb,
  "III-geminate": makeFormIiiViGeminateVerb,
  "IV-sound": makeFormIvSoundFinalWeakVerb,
  "IV-final-weak": makeFormIvSoundFinalWeakVerb,
  "IV-hollow": makeFormIvHollowVerb,
  "IV-geminate": makeFormIvGeminateVerb,
  "V-sound": makeFormIiVSoundFinalWeakVerb,
  "V-final-weak": makeFormIiVSoundFinalWeakVerb,
  "VI-sound": makeFormIiiViSoundFinalWeakVerb,
  "VI-final-weak": makeFormIiiViSoundFinalWeakVerb,
  "VI-geminate": makeFormIiiViGeminateVerb,
  "VII-sound": makeFormViiSoundFinalWeakVerb,
  "VII-final-weak": makeFormViiSoundFinalWeakVerb,
  "VII-hollow": makeFormViiHollowVerb,
  "VII-geminate": makeFormViiGeminateVerb,
  "VIII-sound": makeFormViiiSoundFinalWeakVerb,
  "VIII-final-weak": makeFormViiiSoundFinalWeakVerb,
  "VIII-hollow": makeFormViiiHollowVerb,
  "VIII-geminate": makeFormViiiGeminateVerb,
  "IX-sound": makeFormIxSoundVerb,
  "IX-final-weak": makeFormIxFinalWeakVerb,
  "X-sound": makeFormXSoundFinalWeakVerb,
  "X-final-weak": makeFormXSoundFinalWeakVerb,
  "X-hollow": makeFormXHollowVerb,
  "X-geminate": makeFormXGeminateVerb,
  "XI-sound": makeFormXiSoundVerb,
  "XII-sound": makeFormXiiSoundFinalWeakVerb,
  "XII-final-weak": makeFormXiiSoundFinalWeakVerb,
  "XIII-sound": makeFormXiiiSoundFinalWeakVerb,
  "XIII-final-weak": makeFormXiiiSoundFinalWeakVerb,
  "XIV-sound": makeFormXivXvSoundFinalWeakVerb,
  "XIV-final-weak": makeFormXivXvSoundFinalWeakVerb,
  "XV-sound": makeFormXivXvSoundFinalWeakVerb,
  "Iq-sound": makeFormIqIiqSoundFinalWeakVerb,
  "Iq-final-weak": makeFormIqIiqSoundFinalWeakVerb,
  "IIq-sound": makeFormIqIiqSoundFinalWeakVerb,
  "IIq-final-weak": makeFormIqIiqSoundFinalWeakVerb,
  "IIIq-sound": makeFormIiiqSoundFinalWeakVerb,
  "IIIq-final-weak": makeFormIiiqSoundFinalWeakVerb,
  "IVq-sound": makeFormIvqSoundVerb,
};

/** conjugate_verb: build every slot of `base.forms`. */
export function conjugateVerb(base: Base): void {
  base.orth = base.orth ?? {};
  for (const vs of base.conjVowels) {
    const conjType = base.verbForm + "-" + vs.weakness;
    // #14: a hamza-initial form VIII spells its 1s مضارع analytically (أَأْتَمِنُ)
    if (base.verbForm === "VIII" && vs.rad1 !== undefined && HAMZA_ANY_RE.test(vs.rad1)) {
      base.orth.analytic_hamza = true;
    }
    // #12: a final-weak verb whose rad2 is a hamza
    if ((vs.weakness ?? "").includes("final-weak") && vs.rad2 !== undefined && HAMZA_ANY_RE.test(vs.rad2)) {
      base.orth.hamza_rad2_final_weak = true;
    }
    const builder = CONJUGATIONS[conjType];
    if (!builder)
      throw new MaziniError("unsupported_weakness", "Unknown conjugation type '" + conjType + "'");
    builder(base, vs);
  }
  // #13: before postprocess_forms(), which supplies the إدغام half of the alternation.
  addNaqlIdghamForms(base);
  postprocessForms(base);
  promoteAp1(base);
}

/** For non-stative form-I verbs, fill the active participle from ap1. */
function promoteAp1(base: Base): void {
  if (base.verbForm === "I" && !base.forms.ap && base.forms.ap1 && !skipSlot(base, "ap")) {
    const sawNonStative = base.conjVowels.some((vs) => req(vs.past, A));
    if (sawNonStative) {
      base.forms.ap = base.forms.ap1;
      delete base.forms.ap1;
    }
  }
}
