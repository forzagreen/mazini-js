// The attested-verb lexicon: which root × pattern combinations are real verbs.
//
// The engine conjugates any root with any pattern, and most such combinations are not words. This module
// answers "is it a verb?" from the four root × pattern tables of جداول إحصاء الأفعال العربية (مروان البواب
// ويحيى مير علم, CC BY 4.0; https://github.com/m-bakni/arabic-morphology): 24,188 verbs over 7,626 roots.
// No list of a living language is complete, so an absence here means "not listed", not "not a verb"; the
// engine itself is never restricted by it.
//
// It is a separate entry point (`mazini/lexicon`) so that the ~44 KB of data (src/lexicon-data.ts, generated
// by tools/gen_lexicon.py) is only bundled by callers who import it; the table is decoded on first use.
import * as data from "./lexicon-data";
import { MaziniError } from "./errors";
import { normalizeRoot } from "./radicals";
import { WAZN_BY_CODE, WAZN_BY_NAME } from "./wazn";

/** Where the data comes from and how much there is. */
export const LEXICON_INFO = {
  sourceUrl: data.SOURCE_URL,
  sourceCommit: data.SOURCE_COMMIT,
  sourceDate: data.SOURCE_DATE,
  roots: data.ROOT_COUNT,
  verbs: data.VERB_COUNT,
} as const;

function decode(table: string, n: number, wazns: readonly string[], into: Map<string, readonly string[]>) {
  const digits = Math.ceil(wazns.length / 6);
  const text = table.replace(/\n/g, "");
  const width = n + digits;
  for (let at = 0; at < text.length; at += width) {
    let root = "";
    for (let i = 0; i < n; i++) root += data.ROOT_LETTERS[data.ROOT_CODES.indexOf(text[at + i])];
    let mask = 0;
    for (let i = n; i < width; i++) mask = (mask << 6) | data.SYMBOLS.indexOf(text[at + i]);
    into.set(
      root,
      wazns.filter((_, i) => (mask >> i) & 1),
    );
  }
}

let cache: Map<string, readonly string[]> | null = null;
function table(): Map<string, readonly string[]> {
  if (!cache) {
    cache = new Map();
    decode(data.TRI, 3, data.TRI_WAZNS, cache);
    decode(data.QUAD, 4, data.QUAD_WAZNS, cache);
  }
  return cache;
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
  return [...(table().get(normalizeRoot(root).join("")) ?? [])];
}

/**
 * True if the root × pattern is a listed verb. `wazn` is a pattern name or form code, as for `conjugate`;
 * an unknown one throws a MaziniError.
 */
export function isAttested(root: string, wazn: string): boolean {
  const info = WAZN_BY_NAME.get(wazn) ?? WAZN_BY_CODE.get(wazn);
  if (!info) throw new MaziniError("unknown_wazn", "Unknown morphological pattern (وزن صرفي): " + wazn);
  return (table().get(normalizeRoot(root).join("")) ?? []).includes(info.wazn);
}
