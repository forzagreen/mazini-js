// From a root and a form code to a Base ready to conjugate. Port of the root-path subset of
// parse_indicator_spec (3350-3362), construct_verb_spec (4800-4816) and detect_indicator_spec (3650-3932).
import { dia, undia } from "./chars";
import { newBase } from "./base";
import type { Base, VowelSpec } from "./base";
import { MaziniError } from "./errors";
import { req } from "./forms";
import {
  checkRadicals,
  formViiiJoinTa,
  hayyRadicals,
  isPassiveOnly,
  vformProbablyFullPassive,
  vformProbablyImpersonalPassive,
  vformProbablyNoPassive,
  weaknessFromRadicals,
} from "./radicals";
import type { VerbForm, Vowel } from "./wazn";

export interface BuildOptions {
  passive?: boolean;
  reduced?: boolean;
}

/** buildBase: what parse_indicator_spec leaves behind for "ك_ت_ب<I/a~u.pass.reduced>". */
export function buildBase(
  radicals: readonly string[],
  verbForm: VerbForm,
  vowels: { past: Vowel; nonpast: Vowel } | null,
  opts: BuildOptions,
): Base {
  const lemma = radicals.join("_");
  const conjVowels: VowelSpec[] = vowels ? [{ past: dia[vowels.past], nonpast: dia[vowels.nonpast] }] : [];
  return newBase(lemma, verbForm, conjVowels, opts);
}

/** detect_indicator_spec: radicals, weakness, passive type and the grouped vowels. */
export function detectIndicatorSpec(base: Base): void {
  if (base.conjVowels.length === 0) {
    base.conjVowels = [{ past: "-", nonpast: "-" }];
  }
  const vform = base.verbForm;
  base.quadlit = vform.endsWith("q");

  const rads = base.lemma.split("_");
  for (const vs of base.conjVowels) {
    let ir1: string, ir2: string, ir3: string, ir4: string | undefined;
    if (rads.length === 3 && rads.every((r) => [...r].length === 1)) {
      [ir1, ir2, ir3] = rads;
    } else if (rads.length === 4 && rads.every((r) => [...r].length === 1)) {
      [ir1, ir2, ir3, ir4] = rads;
    } else {
      // The Lua module would fall through to infer_radicals() here and mis-conjugate; the port refuses.
      throw new MaziniError("bad_root", "A root needs three or four single-letter radicals: " + base.lemma);
    }
    if (!base.quadlit && ir4 !== undefined) {
      throw new MaziniError(
        "bad_root",
        "A four-letter root cannot take a triliteral form (" + vform + "): " + base.lemma,
      );
    }
    if (base.quadlit && ir4 === undefined) {
      throw new MaziniError(
        "bad_root",
        "A quadriliteral form (" + vform + ") needs a four-letter root: " + base.lemma,
      );
    }
    const weakness = weaknessFromRadicals(vform, ir1, ir2, ir3, ir4, vs.past, vs.nonpast);
    if (vform === "VIII") vs.formViiiAssim = formViiiJoinTa(ir1, base.reduced);

    if (vform === "I" && !isPassiveOnly(base.passive) && (vs.past === "-" || vs.nonpast === "-")) {
      throw new MaziniError(
        "unknown_wazn",
        "Form I verb that isn't passive-only or final-weak must have past~non-past vowels specified",
      );
    }

    vs.rad1 = ir1;
    vs.rad2 = ir2;
    vs.rad3 = ir3;
    if (base.quadlit) vs.rad4 = ir4;
    vs.weakness = weakness;

    checkRadicals(vform, weakness, ir1, ir2, ir3, base.quadlit ? ir4 : undefined);

    const formIiiViGeminate = (vform === "III" || vform === "VI") && ir2 === ir3 && ir2 !== "ي";
    const hayyIX = hayyRadicals(ir1, ir2, ir3, vform) && (vform === "I" || vform === "X");
    if (!(formIiiViGeminate || hayyIX) && vs.variant !== undefined) {
      throw new MaziniError("internal", "Variant value 'var:" + vs.variant + "' not allowed in this context");
    }
  }

  if (vform === "I") {
    // Regroup the vowels for display; a single past~non-past pair groups trivially.
    const groupByPast: { past: string; nonpasts: string[] }[] = [];
    for (const vs of base.conjVowels) {
      const past = undia[vs.past];
      const nonpast = undia[vs.nonpast];
      const existing = groupByPast.find((g) => g.past === past);
      if (existing) {
        if (!existing.nonpasts.includes(nonpast)) existing.nonpasts.push(nonpast);
      } else {
        groupByPast.push({ past, nonpasts: [nonpast] });
      }
    }
    const groupByNonpast: { pasts: string[]; nonpasts: string[] }[] = [];
    for (const g of groupByPast) {
      const existing = groupByNonpast.find((h) => JSON.stringify(h.nonpasts) === JSON.stringify(g.nonpasts));
      if (existing) {
        if (!existing.pasts.includes(g.past)) existing.pasts.push(g.past);
      } else {
        groupByNonpast.push({ pasts: [g.past], nonpasts: g.nonpasts });
      }
    }
    base.groupedConjVowels = groupByNonpast;
  }

  // Default the passive type (ar-verb.lua 3879-3897).
  if (!base.passive) {
    base.passiveDefaulted = true;
    if (vformProbablyFullPassive(vform)) {
      base.passive = "pass";
    } else {
      base.passiveUncertain = true;
      for (const vs of base.conjVowels) {
        if (vformProbablyNoPassive(vform, vs.past)) {
          base.passive = "nopass";
          break;
        } else if (vformProbablyImpersonalPassive(vform, vs.past)) {
          base.passive = "ipass";
          break;
        }
      }
      base.passive = base.passive ?? "pass";
    }
  }
}

export const _req = req;
