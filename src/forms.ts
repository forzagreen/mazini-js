// Form objects and the small subset of Module:inflection utilities the engine uses.
// A "form object" is {form, footnotes?}; an "abbreviated form list" is a string, a form object, or
// a list of either. Port of inflection utilities.lua 259-368, 416-425, 497-511, 613-643, 646-676,
// 717-766, 783-803 and ar-verb.lua q() 471-499.

export interface Form {
  form: string;
  footnotes?: readonly string[];
  uncertain?: boolean;
}
export type AbForm = string | Form;
export type AbForms = AbForm | readonly AbForm[];
export type FormTable = Record<string, Form[]>;

export function isForm(x: AbForms): x is Form {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Union of two footnote lists, order kept, duplicates dropped (combine_footnotes). */
export function combineFootnotes(
  notes1: readonly string[] | undefined,
  notes2: readonly string[] | undefined,
): readonly string[] | undefined {
  if (!notes1 && !notes2) return undefined;
  if (!notes1) return notes2;
  if (!notes2) return notes1;
  const combined = [...notes1];
  for (const note of notes2) if (!combined.includes(note)) combined.push(note);
  return combined;
}

/** combine_form_and_footnotes: attach footnotes (and optionally a new form value) to an abbreviated form. */
export function combineFormAndFootnotes(
  abform: AbForm,
  addlFootnotes?: string | readonly string[],
  newFormval?: string,
): AbForm {
  const notes = typeof addlFootnotes === "string" ? [addlFootnotes] : addlFootnotes;
  if (!notes && newFormval === undefined) return abform;
  if (typeof abform === "string") {
    return { form: newFormval ?? abform, footnotes: notes };
  }
  const out: Form = { ...abform };
  if (newFormval !== undefined) out.form = newFormval;
  if (notes) out.footnotes = combineFootnotes(out.footnotes, notes);
  return out;
}

/** convert_to_general_list_form: an abbreviated form list as a list of form objects. */
export function toGeneralList(abforms: AbForms, footnotes?: string | readonly string[]): Form[] {
  const notes = typeof footnotes === "string" ? [footnotes] : footnotes;
  if (typeof abforms === "string") return [{ form: abforms, footnotes: notes }];
  if (isForm(abforms)) return [combineFormAndFootnotes(abforms, notes) as Form];
  return abforms.map((f) =>
    typeof f === "string" ? { form: f, footnotes: notes } : (combineFormAndFootnotes(f, notes) as Form),
  );
}

/** insert_form_into_list: append unless the same form value is already present (first occurrence wins). */
export function insertFormIntoList(list: Form[], form: Form | undefined): void {
  if (!form || form.form === undefined || form.form === null) return;
  for (const listform of list) {
    if (listform.form === form.form) {
      // Footnote merging only happens for footnotes carrying a ! or + modifier, which the engine never
      // produces; the upstream branch is also unreachable here (it references an undefined variable).
      return;
    }
  }
  list.push(form);
}

export function insertForm(formtable: FormTable, slot: string, form: Form | undefined): void {
  if (!form || form.form === undefined) return;
  if (!formtable[slot]) formtable[slot] = [];
  insertFormIntoList(formtable[slot], form);
}

export function insertForms(formtable: FormTable, slot: string, forms: readonly Form[] | undefined): void {
  if (!forms) return;
  for (const form of forms) insertForm(formtable, slot, form);
}

/** map_forms: map a function over form values, keeping footnotes; "?" is passed through. */
export function mapForms(
  forms: readonly Form[] | undefined,
  fn: (form: string) => string,
): Form[] | undefined {
  if (!forms) return undefined;
  const out: Form[] = [];
  for (const form of forms) {
    const newval = form.form === "?" ? "?" : fn(form.form);
    insertFormIntoList(out, { ...form, form: newval });
  }
  return out;
}

function combine(stem: string, ending: string, combineStemEnding: (s: string, e: string) => string): string {
  if (stem === "?" || ending === "?") return "?";
  return combineStemEnding(stem, ending);
}

/** add_forms: every stem × every ending into `slot`, with footnotes unioned. */
export function addForms(
  formtable: FormTable,
  slot: string,
  stems: AbForms | undefined,
  endings: AbForms | undefined,
  combineStemEnding: (s: string, e: string) => string,
  footnotes?: readonly string[],
): void {
  if (stems === undefined || endings === undefined) return;
  if (typeof stems === "string" && typeof endings === "string") {
    insertForm(formtable, slot, { form: combine(stems, endings, combineStemEnding), footnotes });
    return;
  }
  if (typeof stems === "string" && Array.isArray(endings) && endings.every((e) => typeof e === "string")) {
    for (const ending of endings as string[]) {
      insertForm(formtable, slot, { form: combine(stems, ending, combineStemEnding), footnotes });
    }
    return;
  }
  const stemList = toGeneralList(stems);
  const endingList = toGeneralList(endings, footnotes);
  for (const stem of stemList) {
    for (const ending of endingList) {
      let notes: readonly string[] | undefined;
      if (stem.footnotes && ending.footnotes) {
        const merged = [...stem.footnotes];
        for (const f of ending.footnotes) if (!merged.includes(f)) merged.push(f);
        notes = merged;
      } else if (stem.footnotes) {
        notes = stem.footnotes;
      } else if (ending.footnotes) {
        notes = ending.footnotes;
      }
      insertForm(formtable, slot, {
        form: combine(stem.form, ending.form, combineStemEnding),
        footnotes: notes,
      });
    }
  }
}

/** add_multiple_forms: reduce three or more components left to right through add_forms. */
export function addMultipleForms(
  formtable: FormTable,
  slot: string,
  components: readonly (AbForms | undefined)[],
  combineStemEnding: (s: string, e: string) => string,
  footnotes?: readonly string[],
): void {
  if (components.length === 0) return;
  if (components.length === 1) {
    if (components[0] === undefined) return;
    insertForms(formtable, slot, toGeneralList(components[0], footnotes));
    return;
  }
  if (components.length === 2) {
    addForms(formtable, slot, components[0], components[1], combineStemEnding, footnotes);
    return;
  }
  let prev: AbForms | undefined = components[0];
  for (let i = 1; i < components.length; i++) {
    const temp: FormTable = {};
    addForms(
      temp,
      slot,
      prev,
      components[i],
      combineStemEnding,
      i === components.length - 1 ? footnotes : undefined,
    );
    prev = temp[slot];
  }
  insertForms(formtable, slot, prev as Form[] | undefined);
}

/**
 * q(): concatenate strings and form objects. All strings → a string; otherwise a form object carrying
 * the union of the footnotes (ar-verb.lua:471-499).
 */
export function q(...args: AbForm[]): AbForm {
  let allStrings = true;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === undefined || args[i] === null) {
      throw new Error("Internal error: Saw nil at index " + (i + 1) + " in q()");
    }
    if (typeof args[i] !== "string") allStrings = false;
  }
  if (allStrings) return (args as string[]).join("");
  let form = "";
  let footnotes: readonly string[] | undefined;
  for (const a of args) {
    if (typeof a === "string") {
      form += a;
    } else {
      form += a.form;
      footnotes = combineFootnotes(footnotes, a.footnotes);
    }
  }
  return { form, footnotes };
}

/** rget: the form value of a radical or vowel (a string or form object). */
export function rget(rad: AbForm): string {
  return typeof rad === "string" ? rad : rad.form;
}
export function rgetFootnotes(rad: AbForm): readonly string[] | undefined {
  return typeof rad === "string" ? undefined : rad.footnotes;
}
export function req(rad: AbForm | undefined, val: string): boolean {
  return rad !== undefined && rget(rad) === val;
}
/** map_vowel: map the form value of a vowel, keeping footnotes. */
export function mapVowel(vow: AbForm, fn: (v: string) => string): AbForm {
  return typeof vow === "string" ? fn(vow) : { form: fn(vow.form), footnotes: vow.footnotes };
}
