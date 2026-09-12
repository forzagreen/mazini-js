// Hamza seating: port of module/ar-utilities.lua 183-298 (reorder_shadda, hamza_subs, process_hamza).
// Every regex here is `u`-flagged so that `.`/`[^ ]` match one code point, as mw.ustring does.
import {
  A,
  AN,
  ALIF,
  AMAD,
  DIACRITIC_ANY_BUT_SH,
  HAMZA,
  HAMZA_ON_ALIF,
  HAMZA_ON_W,
  HAMZA_ON_Y,
  HAMZA_PH,
  HAMZA_UNDER_ALIF,
  I,
  SH,
  SK,
  U,
  W,
  Y,
} from "./chars";

const AIU_C = "[َُِ]";
// A diacritic that may sit on a consonant: optional šadda then one non-šadda mark (DIACRITIC in ar-utilities).
const DIA_OPT = SH + "?" + DIACRITIC_ANY_BUT_SH + "?";

/** reorder_shadda: short-vowel + šadda → šadda + short-vowel (undoes NFC ordering). */
export function reorderShadda(text: string): string {
  return text.replace(new RegExp("(" + DIACRITIC_ANY_BUT_SH + ")" + SH, "gu"), SH + "$1");
}

function seatFromVowel(v: string): string {
  return v === I ? HAMZA_ON_Y : v === U ? HAMZA_ON_W : HAMZA_ON_ALIF;
}

type Sub = [RegExp, string | ((...m: string[]) => string)];

const HAMZA_SUBS: Sub[] = [
  // ---- initial hamza: seat according to the following vowel
  [new RegExp("^" + HAMZA_PH + "([" + I + Y + "])", "u"), HAMZA_UNDER_ALIF + "$1"],
  [new RegExp(" " + HAMZA_PH + "([" + I + Y + "])", "gu"), " " + HAMZA_UNDER_ALIF + "$1"],
  [new RegExp("^" + HAMZA_PH, "u"), HAMZA_ON_ALIF], // if no vowel, assume a
  [new RegExp(" " + HAMZA_PH, "gu"), " " + HAMZA_ON_ALIF],
  // ---- final hamza: may be followed by a short vowel or tanwīn; use the previous short vowel for the seat
  [
    new RegExp("(" + AIU_C + ")(" + HAMZA_PH + ")(" + DIA_OPT + ")$", "u"),
    (_m, v, _ham, diacrit) => v + seatFromVowel(v) + diacrit,
  ],
  [
    new RegExp("(" + AIU_C + ")(" + HAMZA_PH + ")(" + DIA_OPT + " )", "gu"),
    (_m, v, _ham, diacrit) => v + seatFromVowel(v) + diacrit,
  ],
  // else hamza is on the line
  [new RegExp(HAMZA_PH + "(" + DIA_OPT + ")$", "u"), HAMZA + "$1"],
  // ---- medial hamza: if a long vowel or diphthong precedes, ignore it
  [
    new RegExp("([" + AMAD + ALIF + W + Y + "]" + SK + "?)(" + HAMZA_PH + ")(" + SH + "?)([^ ])", "gu"),
    (_m, prec, _ham, shad, v2) => {
      const ham =
        v2 === I || v2 === Y
          ? HAMZA_ON_Y
          : v2 === U || v2 === W
            ? HAMZA_ON_W
            : prec.includes(Y)
              ? HAMZA_ON_Y
              : HAMZA;
      return prec + ham + shad + v2;
    },
  ],
  // otherwise the seat relates to the vowels on one or both sides
  [
    new RegExp("([^ ])(" + HAMZA_PH + ")(" + SH + "?)(" + AN + "?[^ ])", "gu"),
    (_m, v1, _ham, shad, v2) => {
      const ham =
        v1 === I || v2 === I || v2 === Y
          ? HAMZA_ON_Y
          : v1 === U || v2 === U || v2 === W
            ? HAMZA_ON_W
            : v2 === AN + ALIF // avoid two alifs in a row before the indefinite accusative (جُزْءًا)
              ? HAMZA
              : HAMZA_ON_ALIF;
      return v1 + ham + shad + v2;
    },
  ],
  // ---- alif madda
  [new RegExp(HAMZA_ON_ALIF + A + "?" + ALIF, "gu"), AMAD],
  // ---- catch any remaining hamzas
  [new RegExp(HAMZA_PH, "gu"), HAMZA],
];

const W_UU = W + "ؤُو";
const Y_UU = Y + "ؤُو";
const ALIF_UU = ALIF + "ؤُو";

/** process_hamza: seat every placeholder hamza; returns the list of acceptable spellings. */
export function processHamza(term: string): string[] {
  for (const [re, repl] of HAMZA_SUBS) {
    term =
      typeof repl === "string"
        ? term.replace(re, repl)
        : term.replace(re, repl as (...m: string[]) => string);
  }
  // hamza-on-wāw + wāw is problematic and leads to alternatives (see ar-utilities.lua 275-297)
  if (term.includes(W_UU)) {
    return [term.replaceAll(W_UU, W + "ئُو"), term.replaceAll(W_UU, W + "ءُو")];
  } else if (term.includes(Y_UU)) {
    return [term.replaceAll(Y_UU, Y + "ئُو"), term];
  } else if (term.includes(ALIF_UU)) {
    return [term.replaceAll(ALIF_UU, ALIF + "ئُو"), term];
  }
  return [term];
}
