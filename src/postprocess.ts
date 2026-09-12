// The orthography passes run over every finished form. Port of ar-verb.lua 669-675 (apply_nfc_shadda),
// 2872-2896 (postprocess_subs), 2938-3120 (postprocess_term), 3149-3175 (add_naql_idgham_forms) and
// 3177-3202 (postprocess_forms). The BORDER/placeholder scheme is kept literally: the rule order and the
// parked sequences are the algorithm.
import {
  A,
  AIU,
  ALIF,
  AMAD,
  AMAQ,
  BORDER,
  DIACRITIC_ANY_BUT_SH,
  HAMZA,
  HAMZA_ON_ALIF,
  HAMZA_ON_W,
  HAMZA_PH,
  HAMZA_UNDER_ALIF,
  I,
  II,
  KEEP_HAMZA_PH,
  KEEP_W_PH,
  NO_MADDA_PH,
  SH,
  SK,
  U,
  UU,
  W,
  WAW_SEAT_PH,
  Y,
} from "./chars";
import type { Base, Orth } from "./base";
import { insertForm } from "./forms";
import type { Form, FormTable } from "./forms";
import { processHamza } from "./hamza";

/** apply_nfc_shadda: šadda + vowel → vowel + šadda, the order NFC (and MediaWiki) stores. */
const NFC_SHADDA_RE = new RegExp(SH + "(" + DIACRITIC_ANY_BUT_SH + ")", "gu");
export function applyNfcShadda(word: string): string {
  return word.replace(NFC_SHADDA_RE, "$1" + SH);
}

type Sub = [RegExp | string, string];
const POSTPROCESS_SUBS: Sub[] = [
  // reorder short-vowel + šadda -> šadda + short-vowel for easier processing
  [new RegExp("(" + AIU + ")" + SH, "gu"), SH + "$1"],
  // same letter separated by sukūn should instead use šadda (kun-nā)
  [new RegExp("(.)" + SK + "\\1", "gu"), "$1" + SH],
  // assimilated verbs: iw, iy -> ī; uw, uy -> ū
  [I + W + SK, II],
  [I + Y + SK, II],
  [U + W + SK, UU],
  [U + Y + SK, UU],
  // final -yā uses tall alif not alif maqṣūra
  [new RegExp("(" + Y + SH + "?" + A + ")" + AMAQ, "gu"), "$1" + ALIF],
  // hamza assimilation: initial hamza + short vowel + hamza + sukūn -> hamza + long vowel
  [HAMZA + A + HAMZA + SK, HAMZA + A + ALIF],
  [HAMZA + I + HAMZA + SK, HAMZA + I + Y],
  [HAMZA + U + HAMZA + SK, HAMZA + U + W],
];

function applySubs(t: string): string {
  for (const [from, to] of POSTPROCESS_SUBS) {
    t = typeof from === "string" ? t.replaceAll(from, to) : t.replace(from, to);
  }
  return t;
}

const PARK_W_FROM = BORDER + ALIF + I + W + SK;
const PARK_W_TO = BORDER + ALIF + I + KEEP_W_PH + SK;
const PARK_HAMZA_FROM = BORDER + HAMZA + A + HAMZA + SK;
const PARK_HAMZA_TO = BORDER + HAMZA + A + KEEP_HAMZA_PH + SK;
const HAMZA_A_ALIF_END = HAMZA + A + ALIF + BORDER;
const HAMZA_A_AMAQ_END = HAMZA + A + AMAQ + BORDER;
const W_HAMZA_U_W = W + HAMZA + U + W;
const SEAT_FINAL_RE = new RegExp(SK + HAMZA + "(" + AIU + ")" + BORDER, "gu");
const NO_MADDA_FROM = ALIF + HAMZA + A + ALIF + BORDER;
const NO_MADDA_TO = ALIF + NO_MADDA_PH + A + ALIF + BORDER;
const MADDA_AFTER_LONG_RE = new RegExp("([" + AMAD + ALIF + W + Y + "])" + HAMZA + A + ALIF, "gu");
const ALIF_KASRA = HAMZA_ON_ALIF + I;
const ALIF_KASRA_BELOW = HAMZA_UNDER_ALIF + I;

/** Phase 1: the reductions, with the parked exemptions held out across them. */
function reduce(term: string, orth: Orth, parkW: boolean | undefined): string {
  let t = BORDER + term + BORDER;
  // #10: a word-initial hamzat wasl + wāw + sukūn is a retained-wāw mithal imperative (اِوْنَ)
  if (parkW) t = t.replaceAll(PARK_W_FROM, PARK_W_TO);
  // #14: hamza-initial form VIII spells its 1s مضارع analytically (أَأْتَمِنُ)
  if (orth.analytic_hamza) t = t.replaceAll(PARK_HAMZA_FROM, PARK_HAMZA_TO);
  t = applySubs(t);
  // #12, the past half: the ā of a wāw-rad3 past 3ms after a hamza rad2 is written as alif maqṣūra
  if (orth.hamza_rad2_final_weak) t = t.replaceAll(HAMZA_A_ALIF_END, HAMZA_A_AMAQ_END);
  t = t.replaceAll(KEEP_W_PH, W);
  t = t.replaceAll(KEEP_HAMZA_PH, HAMZA);
  return t.replaceAll(BORDER, "");
}

/** Phase 2: hamza seats. Returns the list of spellings for one reduced term. */
function seat(t: string, orth: Orth): string[] {
  if (!t.includes(HAMZA)) return [t];
  // #17: keep the wāw seat after a long ū beside the two spellings process_hamza returns
  let wawSeat: string | undefined;
  if (t.includes(W_HAMZA_U_W)) {
    const parked = t.replaceAll(W_HAMZA_U_W, W + WAW_SEAT_PH + U + W);
    wawSeat = processHamza(parked.replaceAll(HAMZA, HAMZA_PH))[0].replaceAll(WAW_SEAT_PH, HAMZA_ON_W);
  }
  const out = processHamza(t.replaceAll(HAMZA, HAMZA_PH));
  if (wawSeat !== undefined) out.push(wawSeat);
  // #12, the imperative/jussive half: a stranded radical hamza after a sukūn takes its own vowel's seat
  if (orth.hamza_rad2_final_weak) {
    for (let i = 0; i < out.length; i++) {
      const v = (BORDER + out[i] + BORDER).replace(
        SEAT_FINAL_RE,
        (_m, vowel: string) => SK + (vowel === U ? HAMZA_ON_W : HAMZA_ON_ALIF) + vowel + BORDER,
      );
      out[i] = v.replaceAll(BORDER, "");
    }
  }
  // #15: a hamza on the line after a long vowel, with fatḥa + alif after it, is written as a madda,
  // except word-finally directly after an alif
  for (let i = 0; i < out.length; i++) {
    let v = BORDER + out[i] + BORDER;
    v = v.replaceAll(NO_MADDA_FROM, NO_MADDA_TO);
    v = v.replace(MADDA_AFTER_LONG_RE, "$1" + AMAD);
    v = v.replaceAll(NO_MADDA_PH, HAMZA);
    out[i] = v.replaceAll(BORDER, "");
  }
  // #18: a hamza seated on an alif and carrying a bare kasra is written below the alif
  for (let i = 0; i < out.length; i++) out[i] = out[i].replaceAll(ALIF_KASRA, ALIF_KASRA_BELOW);
  return out;
}

/** postprocess_term: the finished spelling(s) of one form. */
export function postprocessTerm(term: string, orth: Orth | undefined): string | string[] {
  if (term === "?") return "?";
  orth = orth ?? {};
  const out = seat(reduce(term, orth, orth.keep_initial_w), orth);
  // #16: a retained-wāw mithal imperative is printed both ways (اِوْنَ and اِينَ), so carry both
  if (orth.keep_initial_w) {
    for (const reduced of seat(reduce(term, orth, false), orth)) {
      if (!out.includes(reduced)) out.push(reduced);
    }
  }
  return out.length === 1 ? out[0] : out;
}

// #13: نقل الحركة + إدغام in a لفيف مقرون verb outside form I (أَحْيَيَا -> أَحَيَّا).
const NAQL_RE = new RegExp("(.)" + SK + Y + "(" + AIU + ")" + Y + "(" + AIU + ")", "gu");
const NAQL_TO = "$1$2" + Y + SK + Y + "$3";

export function addNaqlIdghamForms(base: Base): void {
  if (base.verbForm === "I") return;
  const additions: [string, Form][] = [];
  for (const slot of Object.keys(base.forms)) {
    for (const form of base.forms[slot]) {
      if (NAQL_RE.test(form.form)) {
        NAQL_RE.lastIndex = 0;
        additions.push([slot, { form: form.form.replace(NAQL_RE, NAQL_TO), footnotes: form.footnotes }]);
      }
      NAQL_RE.lastIndex = 0;
    }
  }
  for (const [slot, form] of additions) insertForm(base.forms, slot, form);
}

/** postprocess_forms: run postprocess_term over every slot, deduplicating the spellings it returns. */
export function postprocessForms(base: Base): void {
  for (const slot of Object.keys(base.forms)) {
    const forms = base.forms[slot];
    const converted = forms.map((f) => postprocessTerm(f.form, base.orth));
    const changed = converted.some((c, i) => c !== forms[i].form);
    if (!changed) continue;
    const dedup: FormTable = {};
    forms.forEach((form, i) => {
      const terms = converted[i];
      for (const term of Array.isArray(terms) ? terms : [terms]) {
        insertForm(dedup, "temp", { form: term, footnotes: form.footnotes });
      }
    });
    base.forms[slot] = dedup.temp;
  }
}
