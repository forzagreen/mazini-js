// The per-verb state the builders write into, and the slot helpers around it.
// Port of ar-verb.lua 681-817 and of the fields parse_indicator_spec/detect_indicator_spec set (3352-3362, 3650-3932).
import type { VerbForm } from "./wazn";
import { addForms, addMultipleForms, insertForm, insertForms, toGeneralList } from "./forms";
import type { AbForm, AbForms, Form, FormTable } from "./forms";

export type PassiveType = "pass" | "ipass" | "nopass" | "onlypass" | "onlypass-impers";
export type Weakness =
  "sound" | "assimilated" | "final-weak" | "assimilated+final-weak" | "hollow" | "geminate";

export interface VowelSpec {
  /** Past and non-past stem vowels as diacritics (A/I/U), or "-" for the augmented forms. */
  past: string;
  nonpast: string;
  rad1?: string;
  rad2?: string;
  rad3?: string;
  rad4?: string;
  weakness?: Weakness;
  /** Form VIII: the infixed tāʾ joined to the first radical (form_viii_join_ta). */
  formViiiAssim?: string;
  variant?: "short" | "long" | "both";
}

export interface Orth {
  keep_initial_w?: boolean;
  analytic_hamza?: boolean;
  hamza_rad2_final_weak?: boolean;
}

export interface Base {
  lemma: string; // "ك_ت_ب"
  verbForm: VerbForm;
  conjVowels: VowelSpec[];
  groupedConjVowels: { pasts: string[]; nonpasts: string[] }[];
  passive?: PassiveType;
  passiveUncertain: boolean;
  passiveDefaulted: boolean;
  reduced: boolean;
  altgem: boolean;
  nopast: boolean;
  noimp: boolean;
  noNonpast: boolean;
  nocat: boolean;
  variant?: "short" | "long" | "both";
  quadlit: boolean;
  irregular: boolean;
  forms: FormTable;
  slotUncertain: Record<string, true>;
  orth: Orth;
}

export function newBase(
  lemma: string,
  verbForm: VerbForm,
  conjVowels: VowelSpec[],
  opts: { passive?: boolean; reduced?: boolean },
): Base {
  return {
    lemma,
    verbForm,
    conjVowels,
    groupedConjVowels: [],
    passive: opts.passive ? "pass" : undefined,
    passiveUncertain: false,
    passiveDefaulted: false,
    reduced: !!opts.reduced,
    altgem: false,
    nopast: false,
    noimp: false,
    noNonpast: false,
    nocat: false,
    quadlit: verbForm.endsWith("q"),
    irregular: false,
    forms: {},
    slotUncertain: {},
    orth: {},
  };
}

/** skip_slot: whether the verb's passive type and flags leave this slot empty. */
export function skipSlot(base: Base, slot: string): boolean {
  const pass = slot.includes("_pass");
  if (base.passive === "nopass" && (slot === "pp" || pass)) return true;
  if (base.passive === "onlypass" && slot !== "pp" && slot !== "vn" && !pass) return true;
  if (base.passive === "ipass" && pass && !slot.includes("3ms")) return true;
  if (
    base.passive === "onlypass-impers" &&
    slot !== "pp" &&
    slot !== "vn" &&
    (!pass || (pass && !slot.includes("3ms")))
  ) {
    return true;
  }
  if (base.nopast && slot.startsWith("past_")) return true;
  if (base.noimp && slot.startsWith("imp_")) return true;
  if (base.noNonpast && (slot.startsWith("ind_") || slot.startsWith("sub_") || slot.startsWith("juss")))
    return true;
  return false;
}

const concat3 = (stem: string, ending: string) => stem + ending;

/** add3: prefix + stem + ending into `slot`. */
export function add3(base: Base, slot: string, prefixes: AbForms, stems: AbForms, endings: AbForms): void {
  if (skipSlot(base, slot)) return;
  if (typeof prefixes === "string") {
    const p = prefixes;
    addForms(base.forms, slot, stems, endings, (stem, ending) => p + stem + ending);
  } else {
    addMultipleForms(base.forms, slot, [prefixes, stems, endings], concat3);
  }
}

/** insert_form_or_forms: an abbreviated form list into `slot`, unless the slot is skipped. */
export function insertFormOrForms(base: Base, slot: string, formOrForms: AbForms, uncertain?: boolean): void {
  if (skipSlot(base, slot)) return;
  if (typeof formOrForms === "string") {
    const f: Form = { form: formOrForms };
    if (uncertain) f.uncertain = true;
    insertForm(base.forms, slot, f);
    return;
  }
  const list = toGeneralList(formOrForms);
  if (uncertain) for (const f of list) f.uncertain = true;
  insertForms(base.forms, slot, list);
}

/** Insert into both ap2 and pp2, copying a form object so no object sits in two slots. */
export function insertAp2Pp2(base: Base, stringOrForm: AbForm): void {
  insertFormOrForms(base, "ap2", stringOrForm);
  insertFormOrForms(base, "pp2", typeof stringOrForm === "string" ? stringOrForm : { ...stringOrForm });
}

/**
 * override_stem_if_needed: the engine has no user stem overrides, so this is the default stem, or an
 * empty list when there is none (ar-verb.lua 808-817).
 */
export function stemOrEmpty(defaultStem: AbForms | undefined): AbForms {
  return defaultStem === undefined ? [] : defaultStem;
}
