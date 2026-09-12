// The comparison the book fixtures are checked with: a port of tools/normalise.py upstream. Not used by
// the engine (which never normalises); exported for tests and for anyone comparing against printed forms.
const TATWEEL = "ـ";
const SHADDA = "ّ";
const SUKUN = "ْ";
const FATHA = "َ",
  DAMMA = "ُ",
  KASRA = "ِ";
const ALIF = "ا",
  WAW = "و",
  YA = "ي",
  WASLA = "ٱ",
  ALIF_HAMZA = "أ";
const ALIF_HAMZA_BELOW = "إ";
const WAW_HAMZA = "ؤ";
const YA_HAMZA = "ئ";
const MARK_RE = /[ً-ْٰ]/u;

/** Canonical form: wikilinks and tags stripped, NFC, no tatweel, trimmed. `null` for an empty input. */
export function norm(s: string | null | undefined): string | null {
  if (!s) return null;
  s = s.replace(/\[\[[^|\]]*\|([^\]]*)\]\]/gu, "$1");
  s = s.replace(/\[\[([^\]]*)\]\]/gu, "$1");
  s = s.replace(/<[^>]+>/gu, "");
  s = s.normalize("NFC").replaceAll(TATWEEL, "");
  return s.trim();
}

/** Fold the printing conventions on which a reference and Wiktionary legitimately differ. */
export function loose(input: string | null | undefined): string | null {
  let s = norm(input);
  if (s === null) return null;
  s = s.replaceAll(WASLA, ALIF); // hamzat wasl spelling
  s = s.replace(
    new RegExp("^[" + ALIF_HAMZA + ALIF_HAMZA_BELOW + "]([" + DAMMA + KASRA + FATHA + "])", "u"),
    ALIF + "$1",
  );
  if (s.slice(0, 1) === ALIF_HAMZA_BELOW && !MARK_RE.test(s.slice(1, 2))) {
    s = ALIF + KASRA + s.slice(1);
  }
  s = s.replace(new RegExp("^" + ALIF + DAMMA + WAW_HAMZA + SUKUN, "u"), ALIF + DAMMA + WAW);
  s = s.replace(new RegExp("^" + ALIF + KASRA + YA_HAMZA + SUKUN, "u"), ALIF + KASRA + YA);
  s = s.replace(new RegExp(FATHA + "(" + SHADDA + "?)(" + ALIF + ")", "gu"), "$1$2");
  s = s.replace(new RegExp(DAMMA + "(" + SHADDA + "?)(" + WAW + ")(" + SUKUN + "?)", "gu"), "$1$2");
  s = s.replace(new RegExp(KASRA + "(" + SHADDA + "?)(" + YA + ")(" + SUKUN + "?)", "gu"), "$1$2");
  s = s.replace(new RegExp(SUKUN + "$", "u"), "");
  return s;
}
