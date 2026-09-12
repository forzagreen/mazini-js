// Ending tables for every tense. Port of ar-verb.lua 997-1226. Arrays are 13 long (PERSON_NUMBERS order)
// or 5 long (IMP_PERSON_NUMBERS order); an empty array in a cell means "no form for this person".
import {
  A,
  AA,
  AAMAQ,
  AANI,
  ALIF,
  AW,
  AWSK,
  AY,
  AYSK,
  HAMZA,
  I,
  II,
  N,
  NA,
  SH,
  SK,
  T,
  TA,
  TU,
  U,
  UU,
  Y,
  IMP_PERSON_NUMBERS,
  PERSON_NUMBERS,
  pnIndex,
} from "./chars";
import type { AbForms } from "./forms";

export type Endings = readonly AbForms[];

/** The 13 endings of the sound/hollow/geminate past tense. */
export const PAST_ENDINGS: Endings = [
  // singular
  SK + TU,
  SK + TA,
  SK + "تِ",
  A,
  A + "تْ",
  // dual
  SK + "تُمَا",
  AA,
  A + "تَا",
  // plural
  SK + "نَا",
  SK + "تُمْ",
  // šadda + vowel kept in this order on purpose (the module works šadda-first)
  SK + "تُن" + SH + A,
  UU + ALIF,
  SK + "نَ",
];

function makePastEndingsAyAw(ayaw: string, thirdSgMasc: string): Endings {
  return [
    ayaw + SK + TU,
    ayaw + SK + TA,
    ayaw + SK + "تِ",
    thirdSgMasc,
    A + "تْ",
    ayaw + SK + "تُمَا",
    ayaw + AA,
    A + "تَا",
    ayaw + SK + "نَا",
    ayaw + SK + "تُمْ",
    ayaw + SK + "تُن" + SH + A,
    AW + SK + ALIF,
    ayaw + SK + "نَ",
  ];
}
export const PAST_ENDINGS_AY = makePastEndingsAyAw(AY, AAMAQ);
export const PAST_ENDINGS_AW = makePastEndingsAyAw(AW, AA);

/** Alternative endings for form-X geminate verbs like اِسْتَمَرَّ: first and second persons only. */
export const PAST_ENDINGS_AY_12_PERSON_ONLY: Endings = [
  AY + SK + TU,
  AY + SK + TA,
  AY + SK + "تِ",
  [],
  [],
  AY + SK + "تُمَا",
  [],
  [],
  AY + SK + "نَا",
  AY + SK + "تُمْ",
  AY + SK + "تُن" + SH + A,
  [],
  [],
];

function makePastEndingsIiUu(iiuu: string): Endings {
  return [
    iiuu + TU,
    iiuu + TA,
    iiuu + "تِ",
    iiuu + A,
    iiuu + A + "تْ",
    iiuu + "تُمَا",
    iiuu + AA,
    iiuu + A + "تَا",
    iiuu + "نَا",
    iiuu + "تُمْ",
    iiuu + "تُن" + SH + A,
    UU + ALIF,
    iiuu + "نَ",
  ];
}
export const PAST_ENDINGS_II = makePastEndingsIiUu(II);
export const PAST_ENDINGS_UU = makePastEndingsIiUu(UU);

/** The consonant of the non-past prefix, per person. */
export const NONPAST_PREFIX_CONSONANTS: readonly string[] = [HAMZA, T, T, Y, T, T, Y, T, N, T, T, Y, Y];

/** There are only five distinct endings in all non-past verbs. */
export function makeNonpastEndings(
  nul: AbForms,
  fem: AbForms,
  dual: AbForms,
  pl: AbForms,
  fempl: AbForms,
): Endings {
  return [nul, nul, fem, nul, nul, dual, dual, dual, nul, pl, fempl, pl, fempl];
}

export const IND_ENDINGS = makeNonpastEndings(U, II + NA, AANI, UU + NA, SK + NA);

function makeSubJussEndings(diaNull: string): Endings {
  return makeNonpastEndings(diaNull, II, AA, UU + ALIF, SK + NA);
}
export const SUB_ENDINGS = makeSubJussEndings(A);
export const JUSS_ENDINGS = makeSubJussEndings(SK);
/** alternative geminate jussive in -a; same as the subjunctive */
export const JUSS_ENDINGS_ALT_A = SUB_ENDINGS;
/** alternative geminate jussive in -i */
export const JUSS_ENDINGS_ALT_I = makeSubJussEndings(I);

export const IND_ENDINGS_AA = makeNonpastEndings(AAMAQ, AYSK + NA, AY + AANI, AWSK + NA, AYSK + NA);
function makeIndEndingsIiUu(iiuu: string): Endings {
  return makeNonpastEndings(iiuu, II + NA, iiuu + AANI, UU + NA, iiuu + NA);
}
export const IND_ENDINGS_II = makeIndEndingsIiUu(II);
export const IND_ENDINGS_UU = makeIndEndingsIiUu(UU);

export const SUB_ENDINGS_AA = makeNonpastEndings(AAMAQ, AYSK, AY + AA, AWSK + ALIF, AYSK + NA);
function makeSubEndingsIiUu(iiuu: string): Endings {
  return makeNonpastEndings(iiuu + A, II, iiuu + AA, UU + ALIF, iiuu + NA);
}
export const SUB_ENDINGS_II = makeSubEndingsIiUu(II);
export const SUB_ENDINGS_UU = makeSubEndingsIiUu(UU);

export const JUSS_ENDINGS_AA = makeNonpastEndings(A, AYSK, AY + AA, AWSK + ALIF, AYSK + NA);
function makeJussEndingsIiUu(iu: string, iiuu: string): Endings {
  return makeNonpastEndings(iu, II, iiuu + AA, UU + ALIF, iiuu + NA);
}
export const JUSS_ENDINGS_II = makeJussEndingsIiUu(I, II);
export const JUSS_ENDINGS_UU = makeJussEndingsIiUu(U, UU);

/** Extract the second-person jussive endings to get the imperative endings (by person name, not index). */
export function imperativeEndingsFromJussive(endings: Endings): Endings {
  return IMP_PERSON_NUMBERS.map((pn) => endings[pnIndex(pn)]);
}
export const IMP_ENDINGS = imperativeEndingsFromJussive(JUSS_ENDINGS);
export const IMP_ENDINGS_ALT_A = imperativeEndingsFromJussive(JUSS_ENDINGS_ALT_A);
export const IMP_ENDINGS_ALT_I = imperativeEndingsFromJussive(JUSS_ENDINGS_ALT_I);
export const IMP_ENDINGS_AA = imperativeEndingsFromJussive(JUSS_ENDINGS_AA);
export const IMP_ENDINGS_II = imperativeEndingsFromJussive(JUSS_ENDINGS_II);
export const IMP_ENDINGS_UU = imperativeEndingsFromJussive(JUSS_ENDINGS_UU);

/** A 13-entry table with one entry replaced, named by person (ar-verb.lua set_2fs, 1521-1538). */
export function withPerson(endings: Endings, pn: (typeof PERSON_NUMBERS)[number], ending: AbForms): Endings {
  const out = [...endings];
  out[pnIndex(pn)] = ending;
  return out;
}
export function withImpPerson(
  endings: Endings,
  pn: (typeof IMP_PERSON_NUMBERS)[number],
  ending: AbForms,
): Endings {
  const out = [...endings];
  out[IMP_PERSON_NUMBERS.indexOf(pn)] = ending;
  return out;
}
