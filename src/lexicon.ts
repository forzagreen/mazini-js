// The attested-verb lexicon: which root × pattern combinations are real verbs, and whether they take an
// object.
//
// The engine conjugates any root with any pattern, and most such combinations are not words. This module
// answers "is it a verb?" from the four root × pattern tables of جداول إحصاء الأفعال العربية (مروان البواب
// ويحيى مير علم, CC BY 4.0; https://github.com/m-bakni/arabic-morphology): 24,188 verbs over 7,626 roots,
// each marked لازم (intransitive), متعدٍّ (transitive) or both. No list of a living language is complete, so
// an absence here means "not listed", not "not a verb"; the engine itself is never restricted by it.
//
// It is a separate entry point (`mazini/lexicon`) so that the ~57 KB of data (src/lexicon-data.ts, generated
// by tools/gen_lexicon.py) is only bundled by callers who import it; the table is decoded on first use.
import * as data from "./lexicon-data";
import { MaziniError } from "./errors";
import { normalizeRoot } from "./radicals";
import { WAZN_BY_CODE, WAZN_BY_NAME } from "./wazn";
import type { FormCode } from "./wazn";

/** لازم, متعدٍّ, or used either way depending on the sense. */
export type Transitivity = "intransitive" | "transitive" | "both";

/** One attested verb: a root, a pattern, and whether the verb takes a direct object. */
export interface LexiconEntry {
  /** The radicals as mazini normalises them, hamza as ء: "ءخذ". */
  root: string;
  /** The pattern name as WAZNS gives it: "فعَل يفعُل", "افتعل". */
  wazn: string;
  formCode: FormCode;
  transitivity: Transitivity;
}

/** Where the data comes from and how much there is. */
export const LEXICON_INFO = {
  sourceUrl: data.SOURCE_URL,
  sourceCommit: data.SOURCE_COMMIT,
  sourceDate: data.SOURCE_DATE,
  roots: data.ROOT_COUNT,
  verbs: data.VERB_COUNT,
} as const;

const TRANSITIVITY: readonly Transitivity[] = ["intransitive", "transitive", "both"];

function decode(table: string, n: number, wazns: readonly string[], into: Map<string, LexiconEntry[]>) {
  for (const line of table.split("\n")) {
    if (!line) continue;
    let root = "";
    for (let i = 0; i < n; i++) root += data.ROOT_LETTERS[data.ROOT_CODES.indexOf(line[i])];
    const entries: LexiconEntry[] = [];
    for (let i = n; i < line.length; i++) {
      const v = data.SYMBOLS.indexOf(line[i]);
      const wazn = wazns[Math.floor(v / 3)];
      entries.push({
        root,
        wazn,
        formCode: WAZN_BY_NAME.get(wazn)!.formCode,
        transitivity: TRANSITIVITY[v % 3],
      });
    }
    into.set(root, entries);
  }
}

let cache: Map<string, LexiconEntry[]> | null = null;
function table(): Map<string, LexiconEntry[]> {
  if (!cache) {
    cache = new Map();
    decode(data.TRI, 3, data.TRI_WAZNS, cache);
    decode(data.QUAD, 4, data.QUAD_WAZNS, cache);
  }
  return cache;
}

function waznName(wazn: string): string {
  const info = WAZN_BY_NAME.get(wazn) ?? WAZN_BY_CODE.get(wazn);
  if (!info) throw new MaziniError("unknown_wazn", "Unknown morphological pattern (وزن صرفي): " + wazn);
  return info.wazn;
}

let roots: readonly string[] | null = null;
/** Every root with at least one attested verb: the triliteral roots, then the quadriliteral, each in Arabic alphabetical order, hamza as ء. */
export function lexiconRoots(): readonly string[] {
  if (!roots) roots = [...table().keys()];
  return roots;
}

/**
 * The attested verbs of a root, in pattern order; empty if the root has none. `root` is written as for
 * `conjugate` ("كتب", "ك ت ب", "أخذ"); a malformed root throws a MaziniError.
 */
export function lexiconEntries(root: string): LexiconEntry[] {
  return [...(table().get(normalizeRoot(root).join("")) ?? [])];
}

/**
 * لازم / متعدٍّ / both for an attested verb, or null if the root × pattern is not listed. `wazn` is a
 * pattern name or form code, as for `conjugate`; an unknown one throws a MaziniError.
 */
export function transitivity(root: string, wazn: string): Transitivity | null {
  const name = waznName(wazn);
  for (const e of table().get(normalizeRoot(root).join("")) ?? []) if (e.wazn === name) return e.transitivity;
  return null;
}

/** True if the root × pattern is a listed verb. */
export function isAttested(root: string, wazn: string): boolean {
  return transitivity(root, wazn) !== null;
}
