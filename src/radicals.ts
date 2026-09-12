// Roots: normalisation, the lexical exception tables, weakness from radicals, and check_radicals.
// Port of ar-verb.lua 561-660, 860-912, 2768-2868, 3564-3647 and 4740-4785.
import {
  A,
  ALIF,
  AMAD,
  AMAQ,
  HAMZA,
  HAMZA_ON_ALIF,
  HAMZA_ON_W,
  HAMZA_ON_Y,
  HAMZA_UNDER_ALIF,
  I,
  SK,
  U,
  W,
  Y,
} from "./chars";
import { MaziniError } from "./errors";
import { req } from "./forms";
import type { AbForm } from "./forms";
import type { Weakness } from "./base";
import type { VerbForm } from "./wazn";

/** Lexical exceptions to the wāw-elision rule of form I, keyed root:past+nonpast (ar-verb.lua 561). */
const FORM_I_W_ASSIMILATION: Record<string, boolean> = {
  ["وطء:ia"]: true, // وَطِئَ ـَ / يَطَأُ / طَأْ: الدحداح، نموذج 155
  ["وبء:aa"]: false, // وَبَأَ ـَ / يَوْبَأُ / إِيبَأْ: الدحداح، نموذج 135
};

function vowelLetter(v: AbForm | undefined): string {
  return req(v, A) ? "a" : req(v, I) ? "i" : req(v, U) ? "u" : "?";
}

/** True if a form-I verb whose first radical is wāw elides that wāw in the non-past (يَعِدُ, not يَوْعِدُ). */
export function formIWAssimilated(
  pastVowel: AbForm | undefined,
  nonpastVowel: AbForm | undefined,
  rad1?: string,
  rad2?: string,
  rad3?: string,
): boolean {
  if (pastVowel === undefined || nonpastVowel === undefined) return true;
  if (rad1 && rad2 && rad3) {
    const listed =
      FORM_I_W_ASSIMILATION[rad1 + rad2 + rad3 + ":" + vowelLetter(pastVowel) + vowelLetter(nonpastVowel)];
    if (listed !== undefined) return listed;
  }
  return req(nonpastVowel, I) || (req(nonpastVowel, A) && req(pastVowel, A));
}

/** Geminate form-I roots whose degemination vowel follows the مضارع by إتباع (هَمُمْتَ). */
const GEMINATE_ITBAA_ROOTS = new Set(["همم", "عشش", "فكك", "شرر", "لبب"]);

export function geminateDegeminationVowel(
  rad1: string,
  rad2: string,
  rad3: string,
  pastVowel: AbForm,
  nonpastVowel: AbForm,
): AbForm {
  if (req(pastVowel, A) && req(nonpastVowel, U) && GEMINATE_ITBAA_ROOTS.has(rad1 + rad2 + rad3))
    return nonpastVowel;
  return pastVowel;
}

/** Form-I final-weak roots keep rad3 as a consonant before the 2fs -ī on the فعُل يفعُل measure (تَسْهُوِينَ). */
export function finalWeakUuRetainsRad3(pastEndingVowel: string, nonpastEndingVowel: string): boolean {
  return pastEndingVowel === "ū" && nonpastEndingVowel === "ū";
}

/** Roots the sources conjugate SOUND in a form whose rule would not, keyed form:root (ar-verb.lua 2768). */
const SOUND_ROOTS = new Set([
  "IV:خيل",
  "IV:غيل",
  "IV:حيج",
  "IV:حين",
  "IV:خيف",
  "IV:ريف",
  "IV:زين",
  "IV:ثوب",
  "IV:نيء",
  "VII:سيء",
  "VIII:عول",
  "VIII:زوج",
  "X:جوب",
  "III:علل",
  "III:فرر",
  "VI:عثث",
  "VI:غضض",
]);

/** Hollow roots that keep the middle radical sound in one form-I vowel pattern, keyed root:vowels (هَيُؤَ, أَوِبَ). */
const SOUND_FORM_I_ROOTS = new Set(["هي" + HAMZA + ":uu", HAMZA + "وب:ia"]);

/** Wāw-initial roots whose form VIII keeps the wāw instead of assimilating it (اِيتَشَى / يَوْتَشِي). */
const FORM_VIII_UNASSIMILATED_W_ROOTS = new Set(["وشي"]);

export function vformSupportsFinalWeak(vform: VerbForm): boolean {
  return vform !== "XI" && vform !== "XV" && vform !== "IVq";
}
export function vformSupportsGeminate(vform: VerbForm): boolean {
  return ["I", "III", "IV", "VI", "VII", "VIII", "X"].includes(vform);
}
export function vformSupportsHollow(vform: VerbForm): boolean {
  return ["I", "IV", "VII", "VIII", "X"].includes(vform);
}
export function vformProbablyImpersonalPassive(vform: VerbForm, pastVowel: AbForm): boolean {
  return (
    (vform === "I" && req(pastVowel, I)) ||
    vform === "V" ||
    vform === "VI" ||
    vform === "X" ||
    vform === "IIq"
  );
}
export function vformProbablyFullPassive(vform: VerbForm): boolean {
  return vform === "II" || vform === "III" || vform === "IV" || vform === "Iq";
}
export function vformProbablyNoPassive(vform: VerbForm, pastVowel: AbForm): boolean {
  return (
    (vform === "I" && req(pastVowel, U)) ||
    ["VII", "IX", "XI", "XII", "XIII", "XIV", "XV", "IIIq", "IVq"].includes(vform)
  );
}
/** Active forms II, III, IV, Iq take non-past prefixes in -u- instead of -a-. */
export function prefixVowelFromVform(vform: VerbForm): "a" | "u" {
  return vform === "II" || vform === "III" || vform === "IV" || vform === "Iq" ? "u" : "a";
}
/** True if the active non-past takes a-vocalisation in its last syllable. */
export function vformNonpastAVowel(vform: VerbForm): boolean {
  return vform === "V" || vform === "VI" || vform === "XV" || vform === "IIq";
}
export function isPassiveOnly(passive: string | undefined): boolean {
  return passive === "onlypass" || passive === "onlypass-impers";
}
export function isWawYa(rad: AbForm | undefined): boolean {
  return req(rad, W) || req(rad, Y);
}

/** حَيِيَ / عَيِيَ: the form-I verbs whose past may contract by إدغام, and form X of حيي. */
export function hayyRadicals(rad1: AbForm, rad2: AbForm, rad3: AbForm, vform?: string): boolean {
  if (!(req(rad2, Y) && isWawYa(rad3))) return false;
  return req(rad1, "ح") || (vform === "I" && req(rad1, "ع"));
}

/** weakness_from_radicals: the weakness class of a root under a form (the |جذر= + |وزن= path). */
export function weaknessFromRadicals(
  form: VerbForm,
  rad1: string,
  rad2: string,
  rad3: string,
  rad4: string | undefined,
  pastVowel: AbForm | undefined,
  nonpastVowel: AbForm | undefined,
): Weakness {
  const quadlit = form.endsWith("q");
  if (!quadlit) {
    if (isWawYa(rad3) && rad1 === W && form === "I") {
      return formIWAssimilated(pastVowel, nonpastVowel, rad1, rad2, rad3)
        ? "assimilated+final-weak"
        : "final-weak";
    } else if (isWawYa(rad3) && vformSupportsFinalWeak(form)) {
      return "final-weak";
    } else if (rad2 === rad3 && vformSupportsGeminate(form)) {
      return SOUND_ROOTS.has(form + ":" + rad1 + rad2 + rad3) ? "sound" : "geminate";
    } else if (isWawYa(rad2) && vformSupportsHollow(form)) {
      if (SOUND_ROOTS.has(form + ":" + rad1 + rad2 + rad3)) return "sound";
      if (
        form === "I" &&
        pastVowel !== undefined &&
        nonpastVowel !== undefined &&
        SOUND_FORM_I_ROOTS.has(rad1 + rad2 + rad3 + ":" + vowelLetter(pastVowel) + vowelLetter(nonpastVowel))
      ) {
        return "sound";
      }
      return "hollow";
    } else if (rad1 === W && form === "I") {
      return formIWAssimilated(pastVowel, nonpastVowel, rad1, rad2, rad3) ? "assimilated" : "sound";
    }
    return "sound";
  }
  return isWawYa(rad4) ? "final-weak" : "sound";
}

/** form_viii_join_ta: the infixed tāʾ joined to the first radical of a form VIII verb. */
export function formViiiJoinTa(rad: string, reduced: boolean, root?: string): string {
  if (rad === W && root !== undefined && FORM_VIII_UNASSIMILATED_W_ROOTS.has(root)) return W + SK + "ت";
  if (rad === W || rad === Y || rad === "ت") return "تّ";
  if (rad === HAMZA && reduced) return "تّ";
  if (rad === "د") return "دّ";
  if (rad === "ث") return "ثّ";
  if (rad === "ذ") return "ذّ";
  if (rad === "ز") return "زْد";
  if (rad === "ص") return "صْط";
  if (rad === "ض") return "ضْط";
  if (rad === "ط") return "طّ";
  if (rad === "ظ") return "ظّ";
  return rad + SK + "ت";
}

/** check_radicals: the radicals present are allowable for the weakness. */
export function checkRadicals(
  form: VerbForm,
  weakness: Weakness,
  rad1: string,
  rad2: string,
  rad3: string,
  rad4: string | undefined,
): void {
  const fail = (msg: string): never => {
    throw new MaziniError("invalid_radicals", msg);
  };
  const hamzaCheck = (index: number, rad: string | undefined) => {
    if (rad === HAMZA_ON_ALIF || rad === HAMZA_UNDER_ALIF || rad === HAMZA_ON_W || rad === HAMZA_ON_Y) {
      fail("Radical " + index + " is " + rad + " but should be ء (hamza on the line)");
    }
  };
  const checkWawYa = (index: number, rad: string) => {
    if (!isWawYa(rad)) fail("Radical " + index + " is " + rad + " but should be و or ي");
  };
  const checkNotWawYa = (index: number, rad: string) => {
    if (isWawYa(rad)) fail("In a sound verb, radical " + index + " should not be و or ي");
  };
  hamzaCheck(1, rad1);
  hamzaCheck(2, rad2);
  hamzaCheck(3, rad3);
  hamzaCheck(4, rad4);
  if (weakness === "assimilated" || weakness === "assimilated+final-weak") {
    if (rad1 !== W) fail("Radical 1 is " + rad1 + " but should be و");
  }
  if (weakness === "final-weak" || weakness === "assimilated+final-weak") {
    if (rad4 !== undefined) checkWawYa(4, rad4);
    else checkWawYa(3, rad3);
  } else if (vformSupportsFinalWeak(form)) {
    if (rad4 !== undefined) checkNotWawYa(4, rad4);
    else checkNotWawYa(3, rad3);
  }
  if (weakness === "hollow") checkWawYa(2, rad2);
  if (weakness === "geminate") {
    if (rad4 !== undefined) fail("Internal error: No geminate quadrilaterals, should not be seen");
    if (rad2 !== rad3)
      fail("Weakness is geminate; radical 3 is " + rad3 + " but should be same as radical 2 " + rad2);
  } else if (vformSupportsGeminate(form)) {
    if (rad4 !== undefined) fail("Internal error: No quadrilaterals should support geminate verbs");
    if (rad2 === rad3 && !isWawYa(rad2) && !SOUND_ROOTS.has(form + ":" + rad1 + rad2 + rad3)) {
      fail(
        "Weakness is '" +
          weakness +
          "'; radical 2 and 3 are same at " +
          rad2 +
          " but should not be; consider making weakness 'geminate'",
      );
    }
  }
}

const ARABIC_LETTER_RE = /[ء-ي]/gu;

function normalizeChar(ch: string): string {
  if (ch === HAMZA_ON_ALIF || ch === HAMZA_UNDER_ALIF || ch === HAMZA_ON_W || ch === HAMZA_ON_Y) return HAMZA;
  if (ch === AMAQ) return Y;
  if (ch === ALIF) {
    throw new MaziniError(
      "bad_root",
      "Root contains alif (ا) which is not a valid root radical. For weak verbs, use و (waw) or ي (yaa) instead.",
    );
  }
  return ch;
}

/**
 * normalize_root: "كتب", "ك ت ب" or "ك_ت_ب" → the radicals, hamza seats folded to ء and ى to ي.
 * Diacritics and non-Arabic characters in an unseparated root are dropped, as on the wiki.
 */
export function normalizeRoot(root: string): string[] {
  if (root === undefined || root === null || root === "") {
    throw new MaziniError("bad_root", "Missing root");
  }
  root = root.replaceAll(AMAD, HAMZA + ALIF).replaceAll(" ", "_");
  let parts: string[];
  if (!root.includes("_")) {
    parts = [...root.matchAll(ARABIC_LETTER_RE)].map((m) => normalizeChar(m[0]));
  } else {
    parts = root.split("_").map(normalizeChar);
  }
  for (const p of parts) {
    if ([...p].length !== 1)
      throw new MaziniError("bad_root", "Each radical must be one letter, saw '" + p + "'");
  }
  if (parts.length !== 3 && parts.length !== 4) {
    throw new MaziniError(
      "bad_root",
      "A root needs three or four radicals, saw " + parts.length + " in '" + root + "'",
    );
  }
  return parts;
}
