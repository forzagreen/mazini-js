// After conjugation: the slot table in table order, the "?" placeholders, has_active/has_passive, the
// morph patterns and the verb-type phrase. Port of iut's single-word copy (inflection utilities.lua
// 1190-1249), ar-verb.lua 3968-4034 and get_verb_info (4425-4462).
import { SLOTS, SLOTS_THAT_MAY_BE_UNCERTAIN } from "./chars";
import type { Slot } from "./chars";
import type { Base } from "./base";
import { skipSlot } from "./base";
import { classifyTriliteralVerb } from "./classify";
import type { Form, FormTable } from "./forms";
import { applyNfcShadda } from "./postprocess";
import { isPassiveOnly } from "./radicals";
import { formCodeToWazn, WAZN_BY_NAME } from "./wazn";

/** The top-level form table: every slot in table order, forms copied, šadda written after its vowel. */
export function collectForms(base: Base): FormTable {
  const forms: FormTable = {};
  for (const slot of SLOTS) {
    const list = base.forms[slot];
    if (!list) continue;
    forms[slot] = list.map((f) => {
      const copy: Form = { ...f, form: applyNfcShadda(f.form) };
      return copy;
    });
  }
  return forms;
}

/** determine_slot_uncertainty_from_forms: an unknown form-I مصدر or participle shows as "?". */
export function determineSlotUncertainty(base: Base, forms: FormTable): Slot[] {
  const uncertain: Slot[] = [];
  for (const slot of SLOTS_THAT_MAY_BE_UNCERTAIN) {
    if (!base.forms[slot] && !skipSlot(base, slot)) {
      base.slotUncertain[slot] = true;
    }
  }
  for (const slot of SLOTS_THAT_MAY_BE_UNCERTAIN) {
    if (!forms[slot] && base.slotUncertain[slot]) {
      forms[slot] = [{ form: "?" }];
    }
  }
  for (const slot of Object.keys(base.slotUncertain).sort()) uncertain.push(slot as Slot);
  return uncertain;
}

export function determineVerbProperties(forms: FormTable): { hasActive: boolean; hasPassive: boolean } {
  let hasActive = false;
  let hasPassive = false;
  for (const slot of Object.keys(forms)) {
    const personal = /[123]/.test(slot);
    const pass = slot.includes("_pass");
    if (slot === "ap" || (personal && !pass)) hasActive = true;
    if (slot === "pp" || (personal && pass)) hasPassive = true;
  }
  return { hasActive, hasPassive };
}

/** compute_morph_patterns: the وزن (or أوزان) the verb was conjugated on. */
export function computeMorphPatterns(base: Base): string[] {
  const patterns: string[] = [];
  if (base.nocat) return patterns;
  const add = (p: string | null) => {
    if (p && !patterns.includes(p)) patterns.push(p);
  };
  add(formCodeToWazn(base.verbForm));
  if (base.verbForm === "I" && !isPassiveOnly(base.passive)) {
    for (const g of base.groupedConjVowels) {
      for (const past of g.pasts)
        for (const nonpast of g.nonpasts) add(formCodeToWazn(`I/${past}~${nonpast}`));
    }
  }
  return patterns;
}

/** get_verb_info: the root as spaced letters and the «فعل ثلاثي مُجرَّد صحيح سالم» phrase. */
export function getVerbInfo(
  base: Base,
  morphPatterns: string[],
): { rootDisplay: string; verbType: string; classification: string | null } {
  const vs = base.conjVowels[0];
  const rad1 = vs?.rad1,
    rad2 = vs?.rad2,
    rad3 = vs?.rad3,
    rad4 = vs?.rad4;
  const basicDeriv = morphPatterns[0] ? WAZN_BY_NAME.get(morphPatterns[0])?.basicDeriv : undefined;
  if (!(rad1 && rad2 && rad3)) return { rootDisplay: "", verbType: "فعل", classification: null };
  if (rad4) {
    let verbType = "فعل رباعي";
    if (basicDeriv) verbType += " " + basicDeriv;
    return { rootDisplay: [rad1, rad2, rad3, rad4].join(" "), verbType, classification: null };
  }
  let verbType = "فعل ثلاثي";
  const classification = classifyTriliteralVerb(rad1, rad2, rad3);
  if (basicDeriv) {
    verbType += " " + basicDeriv;
    if (basicDeriv === "مُجرَّد") verbType += " " + classification;
  }
  return { rootDisplay: [rad1, rad2, rad3].join(" "), verbType, classification };
}
