// mazini: every form of an Arabic verb from its root and pattern.
// A port of Arabic Wiktionary's Module:ar-verb (وحدة:ar-verb), root + وزن path.
import { IMP_PERSON_NUMBERS, PERSON_NUMBERS, POTENTIAL_LEMMA_SLOTS, SLOTS, UNSETTABLE_SLOTS } from "./chars";
import type { PersonNumber, Slot } from "./chars";
import type { Orth, PassiveType, Weakness } from "./base";
import { classifyTriliteralVerb } from "./classify";
import { conjugateVerb } from "./conjugations";
import { buildBase, detectIndicatorSpec } from "./detect";
import { MaziniError } from "./errors";
import type { MaziniErrorCode } from "./errors";
import type { Form } from "./forms";
import { loose, norm } from "./loose";
import {
  collectForms,
  computeMorphPatterns,
  determineSlotUncertainty,
  determineVerbProperties,
  getVerbInfo,
} from "./properties";
import { normalizeRoot } from "./radicals";
import { parseFormCode, WAZN_BY_NAME, WAZNS } from "./wazn";
import type { FormCode, VerbForm, Vowel, WaznInfo } from "./wazn";

export type {
  Form,
  FormCode,
  MaziniErrorCode,
  Orth,
  PassiveType,
  PersonNumber,
  Slot,
  VerbForm,
  Vowel,
  WaznInfo,
  Weakness,
};
export {
  MaziniError,
  classifyTriliteralVerb,
  normalizeRoot,
  loose,
  norm,
  WAZNS,
  SLOTS,
  PERSON_NUMBERS,
  IMP_PERSON_NUMBERS,
  POTENTIAL_LEMMA_SLOTS,
  UNSETTABLE_SLOTS,
};

export interface ConjugateOptions {
  /** |مبني للمجهول=: the verb has a full personal passive. */
  passive?: boolean;
  /** |مدغم=: the assimilated shape of the affix (اِسَّمَّعَ for تَسَمَّعَ, اِمَّدَحَ, اِهْبَيَّخَ). */
  reduced?: boolean;
  /** Form I only: the past and non-past stem vowels, when `wazn` is the bare "I". */
  vowels?: { past: Vowel; nonpast: Vowel };
}

export interface OutputForm {
  form: string;
  footnotes: string[];
  uncertain?: boolean;
}

export interface Conjugation {
  /** Every slot the verb has, in table order; a slot the verb lacks is absent. */
  slots: Partial<Record<Slot, OutputForm[]>>;
  /** All 119 slot names, in table order. */
  slotList: readonly Slot[];
  /** The citation form: the first of POTENTIAL_LEMMA_SLOTS the verb has. */
  lemma: OutputForm[];
  verbForm: VerbForm;
  formCode: FormCode | string;
  /** The وزن name, or null for forms XIV and XV which have none. */
  wazn: string | null;
  radicals: string[];
  rootDisplay: string;
  weakness: Weakness;
  quadriliteral: boolean;
  vowels: { past: Vowel | null; nonpast: Vowel | null };
  passive: PassiveType;
  passiveUncertain: boolean;
  passiveDefaulted: boolean;
  reduced: boolean;
  irregular: boolean;
  formViiiAssim: string | null;
  orth: Orth;
  morphPatterns: string[];
  verbForms: VerbForm[];
  hasActive: boolean;
  hasPassive: boolean;
  /** Slots whose value is the "?" placeholder (an unknown form-I مصدر or participle). */
  uncertainSlots: Slot[];
  /** «فعل ثلاثي مُجرَّد صحيح سالم» */
  verbType: string;
  /** «صحيح سالم», «معتل أجوف واوي», …; null for quadriliteral roots. */
  classification: string | null;
}

function resolve(
  wazn: string,
  opts: ConjugateOptions,
): {
  verbForm: VerbForm;
  vowels: { past: Vowel; nonpast: Vowel } | null;
  formCode: string;
  waznName: string | null;
} {
  const byName = WAZN_BY_NAME.get(wazn);
  if (byName)
    return {
      verbForm: byName.verbForm,
      vowels: byName.vowels,
      formCode: byName.formCode,
      waznName: byName.wazn,
    };
  const parsed = parseFormCode(wazn);
  if (parsed) {
    const formCode = wazn;
    return {
      verbForm: parsed.verbForm,
      vowels: parsed.vowels,
      formCode,
      waznName: WAZNS.find((w) => w.formCode === formCode)?.wazn ?? null,
    };
  }
  if (wazn === "I" && opts.vowels) {
    const formCode = `I/${opts.vowels.past}~${opts.vowels.nonpast}`;
    const info = WAZNS.find((w) => w.formCode === formCode);
    if (!info) throw new MaziniError("unknown_wazn", "Unknown form-I vowels: " + formCode);
    return { verbForm: "I", vowels: info.vowels, formCode, waznName: info.wazn };
  }
  throw new MaziniError("unknown_wazn", "Unknown morphological pattern (وزن صرفي): " + wazn);
}

function output(f: Form): OutputForm {
  const o: OutputForm = { form: f.form, footnotes: f.footnotes ? [...f.footnotes] : [] };
  if (f.uncertain) o.uncertain = true;
  return o;
}

/**
 * Conjugate a verb. `root` is three or four radicals ("كتب", "ك ت ب" or "ك_ت_ب"); `wazn` is a pattern name
 * ("فعَل يفعُل", "استفعل") or a form code ("I/a~u", "X", "XIV").
 */
export function conjugate(root: string, wazn: string, opts: ConjugateOptions = {}): Conjugation {
  const radicals = normalizeRoot(root);
  const { verbForm, vowels, formCode, waznName } = resolve(wazn, opts);
  const base = buildBase(radicals, verbForm, vowels, { passive: opts.passive, reduced: opts.reduced });
  detectIndicatorSpec(base);
  conjugateVerb(base);

  const forms = collectForms(base);
  const uncertainSlots = determineSlotUncertainty(base, forms);
  const { hasActive, hasPassive } = determineVerbProperties(forms);
  const morphPatterns = computeMorphPatterns(base);
  const { rootDisplay, verbType, classification } = getVerbInfo(base, morphPatterns);

  const slots: Partial<Record<Slot, OutputForm[]>> = {};
  for (const slot of SLOTS) if (forms[slot]) slots[slot] = forms[slot].map(output);
  let lemma: OutputForm[] = [];
  for (const slot of POTENTIAL_LEMMA_SLOTS) {
    if (slots[slot]) {
      lemma = slots[slot]!;
      break;
    }
  }
  const vs = base.conjVowels[0];
  return {
    slots,
    slotList: SLOTS,
    lemma,
    verbForm,
    formCode,
    wazn: waznName,
    radicals,
    rootDisplay,
    weakness: vs.weakness!,
    quadriliteral: base.quadlit,
    vowels: { past: vowels?.past ?? null, nonpast: vowels?.nonpast ?? null },
    passive: base.passive!,
    passiveUncertain: base.passiveUncertain,
    passiveDefaulted: base.passiveDefaulted,
    reduced: base.reduced,
    irregular: base.irregular,
    formViiiAssim: vs.formViiiAssim ?? null,
    orth: { ...base.orth },
    morphPatterns,
    verbForms: base.nocat ? [] : [verbForm],
    hasActive,
    hasPassive,
    uncertainSlots,
    verbType,
    classification,
  };
}

/** The «فعل ثلاثي مُجرَّد صحيح سالم» line, as Module:ar-verb's get_verb_type gives it. */
export function getVerbType(root: string, wazn: string, opts: ConjugateOptions = {}): string {
  return conjugate(root, wazn, opts).verbType;
}
