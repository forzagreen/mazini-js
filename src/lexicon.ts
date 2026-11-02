// The attested-verb lexicon: which root × pattern combinations are real verbs.
//
// The engine conjugates any root with any pattern, and most such combinations are not words. This module
// answers "is it a verb?" (and is it transitive?) from the four root × pattern tables of جداول إحصاء الأفعال العربية (مروان البواب
// ويحيى مير علم, CC BY 4.0; https://github.com/m-bakni/arabic-morphology): 24,188 verbs over 7,626 roots.
// No list of a living language is complete, so an absence here means "not listed", not "not a verb"; the
// engine itself is never restricted by it.
//
// It is a separate entry point (`mazini/lexicon`) so that the ~44 KB of data (src/lexicon-data.ts, generated
// by tools/gen_lexicon.py) is only bundled by callers who import it; the table is decoded on first use.
import * as data from "./lexicon-data";
import { MaziniError } from "./errors";
import { U } from "./chars";
import { normalizeRoot, vformProbablyNoPassive } from "./radicals";
import { WAZN_BY_CODE, WAZN_BY_NAME } from "./wazn";
import type { WaznInfo } from "./wazn";

/** How the tables mark a verb: ل لازم, م متعدٍّ, ك both. */
export type Transitivity = "intransitive" | "transitive" | "both";
const MARKS: readonly Transitivity[] = ["intransitive", "transitive", "both"];

/** Where the data comes from and how much there is. */
export const LEXICON_INFO = {
  sourceUrl: data.SOURCE_URL,
  sourceCommit: data.SOURCE_COMMIT,
  sourceDate: data.SOURCE_DATE,
  roots: data.ROOT_COUNT,
  verbs: data.VERB_COUNT,
} as const;

interface Entry {
  wazns: readonly string[];
  marks: readonly Transitivity[];
}

function decode(table: string, marks: string, n: number, wazns: readonly string[], into: Map<string, Entry>) {
  const digits = Math.ceil(wazns.length / 6);
  const text = table.replace(/\n/g, "");
  const width = n + digits;
  const allMarks: Transitivity[] = [];
  for (const ch of marks.replace(/\n/g, "")) {
    const v = data.SYMBOLS.indexOf(ch);
    allMarks.push(MARKS[Math.floor(v / 9)], MARKS[Math.floor(v / 3) % 3], MARKS[v % 3]);
  }
  let next = 0;
  for (let at = 0; at < text.length; at += width) {
    let root = "";
    for (let i = 0; i < n; i++) root += data.ROOT_LETTERS[data.ROOT_CODES.indexOf(text[at + i])];
    let mask = 0;
    for (let i = n; i < width; i++) mask = (mask << 6) | data.SYMBOLS.indexOf(text[at + i]);
    const listed = wazns.filter((_, i) => (mask >> i) & 1);
    into.set(root, { wazns: listed, marks: allMarks.slice(next, next + listed.length) });
    next += listed.length;
  }
}

let cache: Map<string, Entry> | null = null;
function table(): Map<string, Entry> {
  if (!cache) {
    cache = new Map();
    decode(data.TRI, data.TRI_MARKS, 3, data.TRI_WAZNS, cache);
    decode(data.QUAD, data.QUAD_MARKS, 4, data.QUAD_WAZNS, cache);
  }
  return cache;
}

function waznInfo(wazn: string): WaznInfo {
  const info = WAZN_BY_NAME.get(wazn) ?? WAZN_BY_CODE.get(wazn);
  if (!info) throw new MaziniError("unknown_wazn", "Unknown morphological pattern (وزن صرفي): " + wazn);
  return info;
}

let roots: readonly string[] | null = null;
/**
 * Every root with at least one attested verb: the triliteral roots, then the quadriliteral, each in Arabic
 * alphabetical order, hamza as ء.
 */
export function lexiconRoots(): readonly string[] {
  if (!roots) roots = [...table().keys()];
  return roots;
}

/**
 * The pattern names (as WAZNS gives them) of the root's attested verbs, in table order; empty if it has
 * none. `root` is written as for `conjugate` ("كتب", "ك ت ب", "أخذ"); a malformed root throws a MaziniError.
 */
export function attestedWazns(root: string): string[] {
  return [...(table().get(normalizeRoot(root).join(""))?.wazns ?? [])];
}

/**
 * True if the root × pattern is a listed verb. `wazn` is a pattern name or form code, as for `conjugate`;
 * an unknown one throws a MaziniError.
 */
export function isAttested(root: string, wazn: string): boolean {
  return transitivity(root, wazn) !== null;
}

/**
 * The transitivity the tables give a listed verb (ل "intransitive", م "transitive", ك "both"), or null if
 * the root × pattern is not listed. Arguments as for `isAttested`.
 */
export function transitivity(root: string, wazn: string): Transitivity | null {
  const info = waznInfo(wazn);
  const entry = table().get(normalizeRoot(root).join(""));
  const i = entry ? entry.wazns.indexOf(info.wazn) : -1;
  return i < 0 ? null : entry!.marks[i];
}

/**
 * The passive a listed verb takes, from its transitivity, as `conjugate`'s `passive` option: a transitive
 * verb (م or ك) has a full personal passive ("pass", ضُرِبْتُ); an intransitive one (ل) only the impersonal
 * third-person masculine singular, with a prepositional complement ("ipass", جُلِسَ عَلَيْهِ), or none at all
 * for the patterns that never take a passive (فعُل يفعُل, انفعل, افعلّ, افعالّ, … : "nopass"). Null if the
 * verb is not listed, in which case `conjugate` guesses from the pattern.
 */
export function lexiconPassive(root: string, wazn: string): "pass" | "ipass" | "nopass" | null {
  const t = transitivity(root, wazn);
  if (t === null) return null;
  if (t !== "intransitive") return "pass";
  const { verbForm, vowels } = waznInfo(wazn);
  return vformProbablyNoPassive(verbForm, vowels?.past === "u" ? U : "") ? "nopass" : "ipass";
}
