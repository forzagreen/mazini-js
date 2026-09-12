// The infobox's «صحيح سالم / معتل أجوف واوي …» classification of a triliteral root.
// Port of ar-verb.lua export.classify_triliteral_verb (4569-4731), branch for branch.
import { HAMZA, HAMZA_ON_ALIF, HAMZA_ON_W, HAMZA_ON_Y, HAMZA_UNDER_ALIF, W, Y } from "./chars";

const HAMZAS = new Set([HAMZA, HAMZA_ON_ALIF, HAMZA_UNDER_ALIF, HAMZA_ON_W, HAMZA_ON_Y]);

export function classifyTriliteralVerb(r1: string, r2: string, r3: string): string {
  const h = [HAMZAS.has(r1), HAMZAS.has(r2), HAMZAS.has(r3)];
  const w = [r1 === W || r1 === Y, r2 === W || r2 === Y, r3 === W || r3 === Y];
  const weakCount = w.filter(Boolean).length;
  const doubled = r2 === r3;

  if (weakCount > 0) {
    if (weakCount >= 2) {
      if (w[1] && w[2]) {
        if (doubled) return r2 === W ? "معتل لفيف مقرون مُضعَّف واوي" : "معتل لفيف مقرون مُضعَّف يائي";
        if (h[0]) return "معتل لفيف مقرون مهموز الفاء";
        return "معتل لفيف مقرون";
      } else if (w[0] && w[1]) {
        return "معتل لفيف مقرون";
      } else if (w[0] && w[2]) {
        if (h[1]) return "معتل لفيف مفروق مهموز العين";
        return "معتل لفيف مفروق";
      }
    } else if (w[0]) {
      if (r1 === W) {
        if (h[2]) return "معتل مثال واوي مهموز اللام";
        if (doubled) return "معتل مثال واوي مُضعَّف";
        if (h[1]) return "معتل مثال واوي مهموز العين";
        return "معتل مثال واوي";
      }
      if (doubled) return "معتل مثال يائي مُضعَّف";
      if (h[1]) return "معتل مثال يائي مهموز العين";
      return "معتل مثال يائي";
    } else if (w[1]) {
      if (r2 === W) {
        if (h[2]) return "معتل أجوف واوي مهموز اللام";
        if (h[0]) return "معتل أجوف واوي مهموز الفاء";
        return "معتل أجوف واوي";
      }
      if (h[2]) return "معتل أجوف يائي مهموز اللام";
      if (h[0]) return "معتل أجوف يائي مهموز الفاء";
      return "معتل أجوف يائي";
    } else if (w[2]) {
      if (r3 === W) {
        if (h[0]) return "معتل ناقص واوي مهموز الفاء";
        if (h[1]) return "معتل ناقص واوي مهموز العين";
        return "معتل ناقص واوي";
      }
      if (h[0]) return "معتل ناقص يائي مهموز الفاء";
      if (h[1]) return "معتل ناقص يائي مهموز العين";
      return "معتل ناقص يائي";
    }
  } else {
    if (h[0] || h[1] || h[2]) {
      if (h[0] && h[2]) return "صحيح مهموز الفاء واللام";
      if (h[0]) return doubled ? "صحيح مُضعَّف مهموز الفاء" : "صحيح مهموز الفاء";
      if (h[1]) return "صحيح مهموز العين";
      return "صحيح مهموز اللام";
    }
    if (doubled) return "صحيح مُضعَّف";
    return "صحيح سالم";
  }
  return "غير معروف";
}
