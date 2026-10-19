// The demo page: conjugate what the reader types, show the tables the book prints (and the moods it
// does not), and run the 16,593 book assertions in the browser on request. By default the root and
// pattern are kept to the verbs the lexicon lists (and the pattern menu shows which ones those are); a
// checkbox lifts the restriction so any root can be conjugated on any pattern.
import { conjugate, loose, MaziniError, WAZNS } from "../src/index";
import type { Conjugation, OutputForm, Slot, WaznInfo } from "../src/index";
import { attestedWazns, LEXICON_INFO, lexiconRoots } from "../src/lexicon";
import { BOOK_SCAN, BOOK_SCAN_URL } from "./book-scan";

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
// المتكلم ثم المخاطب ثم الغائب, singular before dual before plural, masculine before feminine.
const PERSONS = ["1s", "1p", "2ms", "2fs", "2d", "2mp", "2fp", "3ms", "3fs", "3md", "3fd", "3mp", "3fp"];
const GROUP_START = new Set(["2ms", "3ms"]);
const PERSON_AR: Record<string, string> = {
  "3ms": "هو",
  "3md": "هما (مذكر)",
  "3mp": "هم",
  "3fs": "هي",
  "3fd": "هما (مؤنث)",
  "3fp": "هنّ",
  "2ms": "أنتَ",
  "2d": "أنتما",
  "2mp": "أنتم",
  "2fs": "أنتِ",
  "2fp": "أنتنّ",
  "1s": "أنا",
  "1p": "نحن",
};
const ACTIVE_COLS: [string, string][] = [
  ["past_", "الماضي"],
  ["ind_", "المضارع المرفوع"],
  ["sub_", "المنصوب"],
  ["juss_", "المجزوم"],
  ["imp_", "الأمر"],
];
const PASSIVE_COLS: [string, string][] = [
  ["past_pass_", "الماضي"],
  ["ind_pass_", "المضارع المرفوع"],
  ["sub_pass_", "المنصوب"],
  ["juss_pass_", "المجزوم"],
];

interface BookEntry {
  slug: string;
  root: string;
  wazn: string;
  label: string;
  passive: boolean;
  reduced: boolean;
  cells: [string, string][];
}

const N = (n: number) => n.toLocaleString("en").replace(/,/g, "٬");

const rootEl = $<HTMLInputElement>("#root");
const rootList = $<HTMLUListElement>("#root-list");
const waznEl = $<HTMLSelectElement>("#wazn");
// The passive and assimilation options sit in the output, after the verb's facts; show() re-attaches them.
const optsEl = $<HTMLTemplateElement>("#opts-tpl").content.firstElementChild!.cloneNode(true) as HTMLElement;
const passEl = optsEl.querySelector<HTMLInputElement>("#passive")!;
const redEl = optsEl.querySelector<HTMLInputElement>("#reduced")!;
const attestedEl = $<HTMLInputElement>("#attested");
const pickEl = $<HTMLSelectElement>("#book-pick");
const out = $<HTMLElement>("#out");
const waznOptions: { o: HTMLOptionElement; w: WaznInfo }[] = [];

function fillWazn() {
  const groups: [string, (typeof WAZNS)[number][]][] = [
    ["الثلاثي المجرّد", WAZNS.filter((w) => w.verbForm === "I")],
    ["الثلاثي المزيد", WAZNS.filter((w) => w.verbForm !== "I" && !w.verbForm.endsWith("q"))],
    ["الرباعي", WAZNS.filter((w) => w.verbForm.endsWith("q"))],
  ];
  for (const [label, items] of groups) {
    const og = document.createElement("optgroup");
    og.label = label;
    for (const w of items) {
      const o = document.createElement("option");
      o.value = w.wazn;
      o.textContent = `${w.wazn}  (${w.formCode})`;
      og.appendChild(o);
      waznOptions.push({ o, w });
    }
    waznEl.appendChild(og);
  }
}

/** The lexicon's patterns for the typed root; null when the root is malformed (the engine will say so). */
function attested(root: string): string[] | null {
  try {
    return attestedWazns(root);
  } catch {
    return null;
  }
}

/**
 * Mark the patterns the lexicon lists for the root; under the restriction, grey out the others and (unless
 * `keep`) move a selection that is no longer offered to the first listed one.
 */
function refreshWazn(keep = false) {
  const wazns = attested(rootEl.value.trim()) ?? [];
  const restrict = attestedEl.checked && wazns.length > 0;
  for (const { o, w } of waznOptions) {
    const listed = wazns.includes(w.wazn);
    o.textContent = `${w.wazn}  (${w.formCode})` + (listed ? " ✓" : "");
    o.disabled = restrict && !listed;
  }
  if (restrict && !keep && !wazns.includes(waznEl.value)) waznEl.value = wazns[0];
}

// The root suggestions: a styled list rather than a <datalist>, whose native popup cannot be made to match
// the pattern menu. Roots starting with what was typed come first, then those containing it.
let roots: string[] = [];
let active = -1;

function fillRoots() {
  roots = lexiconRoots().map((r) => r.replace(/ء/g, "أ")); // the dictionaries' spelling; lookups fold it back
}

function closeRoots() {
  rootList.hidden = true;
  rootEl.setAttribute("aria-expanded", "false");
  active = -1;
}

function openRoots() {
  const q = rootEl.value.trim();
  const hits = q
    ? [...roots.filter((r) => r.startsWith(q)), ...roots.filter((r) => !r.startsWith(q) && r.includes(q))]
    : roots;
  rootList.innerHTML = "";
  active = -1;
  for (const r of hits.slice(0, 200)) {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.textContent = r;
    li.addEventListener("mousedown", (e) => {
      e.preventDefault(); // keep the focus in the input
      pickRoot(r);
    });
    rootList.appendChild(li);
  }
  const show = hits.length > 0 && !(hits.length === 1 && hits[0] === q);
  rootList.hidden = !show;
  rootEl.setAttribute("aria-expanded", String(show));
}

function moveActive(by: number) {
  const items = rootList.children;
  if (rootList.hidden || !items.length) return openRoots();
  items[active]?.classList.remove("active");
  active = (active + by + items.length) % items.length;
  items[active].classList.add("active");
  items[active].scrollIntoView({ block: "nearest" });
}

function pickRoot(r: string) {
  rootEl.value = r;
  closeRoots();
  refreshWazn();
  update();
}

function restricted(): boolean {
  return attestedEl.checked;
}

function setRestricted(on: boolean) {
  attestedEl.checked = on;
  try {
    localStorage.setItem("mazini-attested", on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** The "not in the lexicon" panel shown under the restriction, with a button that lifts it. */
function notice(text: string) {
  out.innerHTML = "";
  const p = document.createElement("p");
  p.className = "notice";
  p.append(text + " ");
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = "ألغِ القيد وصرِّفه";
  b.addEventListener("click", () => {
    setRestricted(false);
    refreshWazn(true);
    update();
  });
  p.appendChild(b);
  const hint = document.createElement("p");
  hint.className = "muted";
  hint.textContent = `معجم الأفعال: ${N(LEXICON_INFO.verbs)} فعلًا على ${N(LEXICON_INFO.roots)} جذرًا، من جداول إحصاء الأفعال العربية؛ لا قائمة تحيط بلغةٍ حيّة، فغياب الفعل منها لا يعني أنه غير موجود.`;
  out.append(p, hint);
}

/**
 * Where the book prints this verb, or failing that its closest model: the first paradigm on the same pattern
 * and of the same class (صحيح سالم, أجوف واوي…), else the pattern's first sound paradigm, else its first.
 */
function bookPage(c: Conjugation): { leaf: number; verb: string; exact: boolean } | null {
  const root = c.radicals.join("");
  const same = BOOK_SCAN.filter((r) => r[1] === c.wazn);
  const exact = same.find((r) => r[0] === root);
  if (exact) return { leaf: exact[3], verb: exact[4], exact: true };
  const first = (rows: typeof same) =>
    rows.length ? rows.reduce((a, b) => (b[3] < a[3] ? b : a)) : undefined;
  const model =
    first(same.filter((r) => r[2] === (c.classification ?? ""))) ??
    first(same.filter((r) => r[2] === "صحيح سالم")) ??
    first(same);
  return model ? { leaf: model[3], verb: model[4], exact: false } : null;
}

function bookLink(page: { leaf: number }, text: string): HTMLAnchorElement {
  const printed = page.leaf <= 210 ? page.leaf - 1 : page.leaf + 1; // see book-scan.ts
  const a = document.createElement("a");
  a.href = `${BOOK_SCAN_URL}/page/n${page.leaf}/mode/1up`;
  a.target = "_blank";
  a.rel = "noopener";
  a.title = `معجم تصريف الأفعال العربية للدحداح، ص ${printed} (archive.org)`;
  a.textContent = text;
  return a;
}

/** «موجود» / «غير موجود», linked to the book's page for the verb or its closest model. */
function lexiconFact(c: Conjugation, listed: boolean): Node {
  const span = document.createElement("span");
  const page = bookPage(c);
  const word = listed ? "موجود" : "غير موجود";
  if (page && listed) span.appendChild(bookLink(page, word));
  else span.append(word);
  if (page && !page.exact) {
    span.append(" (على نموذج ");
    span.appendChild(listed ? document.createTextNode(page.verb) : bookLink(page, page.verb));
    span.append(")");
  }
  return span;
}

function codeBlock(title: string, text: string): DocumentFragment {
  const f = document.createDocumentFragment();
  const h = document.createElement("h4");
  h.textContent = title;
  const pre = document.createElement("pre");
  pre.dir = "ltr";
  pre.textContent = text;
  f.append(h, pre);
  return f;
}

/** How to get this same conjugation from the npm and PyPI packages. */
function usage(c: Conjugation, root: string, wazn: string, opts: { passive: boolean; reduced: boolean }) {
  const q = (s: string) => JSON.stringify(s);
  const slot = (["past_3ms", "past_pass_3ms", "ind_3ms"] as Slot[]).find((s) => c.slots[s]?.length);
  const ex = slot ? c.slots[slot]![0].form : "";
  const jsOpts = [opts.passive && "passive: true", opts.reduced && "reduced: true"].filter(Boolean);
  const pyOpts = [opts.passive && "passive=True", opts.reduced && "reduced=True"].filter(Boolean);
  const js = [
    "// npm install mazini",
    'import { conjugate } from "mazini";',
    "",
    `const v = conjugate(${[q(root), q(wazn), ...(jsOpts.length ? [`{ ${jsOpts.join(", ")} }`] : [])].join(", ")});`,
    ...(slot ? [`v.slots.${slot}[0].form; // ${q(ex)}`] : []),
    `v.verbType; // ${q(c.verbType)}`,
  ].join("\n");
  const py = [
    "# pip install mazini",
    "from mazini import conjugate",
    "",
    `v = conjugate(${[q(root), q(wazn), ...pyOpts].join(", ")})`,
    ...(slot ? [`v.slots[${q(slot)}][0].form  # ${q(ex)}`] : []),
    `v.verb_type  # ${q(c.verbType)}`,
  ].join("\n");
  return [codeBlock("جافاسكربت", js), codeBlock("بايثون", py)];
}

function cleanNote(n: string): string {
  return n.replace(/^\[|\]$/g, "").replace(/\{\{m\|ar\|([^}]*)\}\}/g, "$1");
}

function cell(forms: OutputForm[] | undefined, notes: Map<string, number>): HTMLTableCellElement {
  const td = document.createElement("td");
  if (!forms || forms.length === 0) {
    td.className = "empty";
    td.textContent = "—";
    return td;
  }
  forms.forEach((f, i) => {
    const span = i === 0 ? td : document.createElement("span");
    if (i > 0) span.className = "alt";
    span.append(f.form);
    for (const n of f.footnotes) {
      if (!notes.has(n)) notes.set(n, notes.size + 1);
      const sup = document.createElement("sup");
      sup.className = "fn";
      sup.textContent = String(notes.get(n));
      span.appendChild(sup);
    }
    if (i > 0) td.appendChild(span);
  });
  return td;
}

function table(
  c: Conjugation,
  cols: [string, string][],
  passive: boolean,
  notes: Map<string, number>,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "tablewrap";
  const t = document.createElement("table");
  t.className = "conj" + (passive ? " pass" : "");
  const hr = t.createTHead().insertRow();
  hr.appendChild(document.createElement("th"));
  for (const [, label] of cols) {
    const th = document.createElement("th");
    th.textContent = label;
    hr.appendChild(th);
  }
  const tb = t.createTBody();
  for (const p of PERSONS) {
    const tr = tb.insertRow();
    if (GROUP_START.has(p)) tr.className = "group";
    const th = document.createElement("th");
    th.className = "person";
    th.textContent = PERSON_AR[p];
    tr.appendChild(th);
    for (const [prefix] of cols) {
      const slot = (prefix + p) as Slot;
      tr.appendChild(cell(prefix === "imp_" && !p.startsWith("2") ? undefined : c.slots[slot], notes));
    }
  }
  wrap.appendChild(t);
  return wrap;
}

function show(
  c: Conjugation,
  listed: boolean,
  root: string,
  wazn: string,
  opts: { passive: boolean; reduced: boolean },
) {
  out.innerHTML = "";
  const h = document.createElement("h2");
  h.textContent = c.lemma.map((f) => f.form).join(" / ") || "—";
  out.appendChild(h);
  const facts = document.createElement("div");
  facts.className = "facts";
  const items: [string, string | Node][] = [
    ["الجذر", c.rootDisplay],
    ["الوزن", c.wazn ?? c.formCode],
    ["النوع", c.verbType],
    ["معجم الأفعال", lexiconFact(c, listed)],
    [
      "المبني للمجهول",
      {
        pass: "كامل",
        ipass: "غير شخصي (للغائب فقط)",
        nopass: "لا يُبنى للمجهول",
        onlypass: "ملازم (لا يُبنى للمعلوم)",
        "onlypass-impers": "ملازم، غير شخصي",
      }[c.passive] + (c.passiveDefaulted ? " (افتراضًا)" : ""),
    ],
  ];
  if (c.irregular) items.push(["", "فعل شاذّ"]);
  for (const [k, v] of items) {
    const s = document.createElement("span");
    s.textContent = k ? k + ": " : "";
    const b = document.createElement("b");
    b.append(v);
    s.appendChild(b);
    facts.appendChild(s);
  }
  facts.appendChild(optsEl);
  out.appendChild(facts);

  const notes = new Map<string, number>();
  const derived = document.createElement("div");
  derived.className = "derived";
  for (const [label, slot] of [
    ["المصدر", "vn"],
    ["اسم الفاعل", "ap"],
    ["اسم المفعول", "pp"],
  ] as [string, Slot][]) {
    const box = document.createElement("div");
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = label;
    const v = document.createElement("div");
    v.className = "v";
    const forms = c.slots[slot];
    v.textContent = forms ? forms.map((f) => f.form).join(" ، ") : "—";
    box.append(k, v);
    derived.appendChild(box);
  }
  out.appendChild(derived);

  if (c.hasActive) {
    const h3 = document.createElement("h3");
    h3.textContent = "المبني للمعلوم";
    out.append(h3, table(c, ACTIVE_COLS, false, notes));
  }
  if (c.hasPassive && Object.keys(c.slots).some((s) => s.includes("_pass_"))) {
    const h3 = document.createElement("h3");
    h3.textContent = "المبني للمجهول";
    out.append(h3, table(c, PASSIVE_COLS, true, notes));
  }
  if (notes.size) {
    const n = document.createElement("div");
    n.className = "notes";
    n.textContent = [...notes].map(([note, i]) => `${i}. ${cleanNote(note)}`).join(" · ");
    out.appendChild(n);
  }
  const meta = document.createElement("details");
  meta.className = "meta";
  meta.innerHTML = "<summary>تفاصيل تقنية</summary>";
  meta.append(...usage(c, root, wazn, opts));
  const json = JSON.stringify(
    {
      formCode: c.formCode,
      radicals: c.radicals,
      weakness: c.weakness,
      passive: c.passive,
      passiveUncertain: c.passiveUncertain,
      reduced: c.reduced,
      irregular: c.irregular,
      formViiiAssim: c.formViiiAssim,
      orth: c.orth,
      uncertainSlots: c.uncertainSlots,
      classification: c.classification,
      slots: Object.keys(c.slots).length,
    },
    null,
    2,
  ).replace(/\[\s+([^[\]{}]*?)\s+\]/g, (_, items: string) => `[${items.split(/,\s+/).join(", ")}]`); // one-line arrays
  meta.append(codeBlock("خصائص الفعل", json));
  out.appendChild(meta);
}

function update(pushHash = true) {
  const root = rootEl.value.trim();
  const wazn = waznEl.value;
  if (pushHash) {
    const p = new URLSearchParams({ root, wazn });
    if (passEl.checked) p.set("passive", "1");
    if (redEl.checked) p.set("reduced", "1");
    if (!restricted()) p.set("all", "1");
    history.replaceState(null, "", "#" + p.toString());
  }
  if (!root) {
    out.innerHTML = '<p class="muted">اكتب جذرًا.</p>';
    return;
  }
  const wazns = attested(root);
  const listed = wazns?.includes(wazn) ?? false;
  if (restricted() && wazns && !listed) {
    if (wazns.length === 0)
      notice(
        `الجذر «${root}» غير موجود في معجم الأفعال. جرِّب جذرًا آخر (الحقل يقترح الجذور الواردة)، أو ألغِ القيد لتصريفه على أي وزن.`,
      );
    else
      notice(
        `الفعل من الجذر «${root}» على وزن «${wazn}» غير موجود في معجم الأفعال؛ الأوزان الواردة لهذا الجذر هي المتاحة في القائمة.`,
      );
    return;
  }
  try {
    const opts = { passive: passEl.checked, reduced: redEl.checked };
    show(conjugate(root, wazn, opts), listed, root, wazn, opts);
  } catch (e) {
    out.innerHTML = "";
    const p = document.createElement("p");
    p.className = "error";
    p.textContent = e instanceof MaziniError ? `خطأ (${e.code}): ${e.message}` : String(e);
    out.appendChild(p);
    if (passEl.checked || redEl.checked) out.appendChild(optsEl); // so an option that caused it can be undone
  }
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get("root")) rootEl.value = p.get("root")!;
  if (p.get("wazn") && WAZNS.some((w) => w.wazn === p.get("wazn"))) waznEl.value = p.get("wazn")!;
  passEl.checked = p.get("passive") === "1";
  redEl.checked = p.get("reduced") === "1";
  // A link that says all=1 was shared from the unrestricted page; otherwise the reader's own last choice.
  let pref = "1";
  try {
    pref = localStorage.getItem("mazini-attested") ?? "1";
  } catch {
    /* ignore */
  }
  attestedEl.checked = p.get("all") !== "1" && pref !== "0";
  refreshWazn(true);
}

let book: BookEntry[] | null = null;
async function loadBook(): Promise<BookEntry[]> {
  if (!book) book = (await (await fetch("book.json")).json()) as BookEntry[];
  return book;
}

async function fillPicker() {
  const b = await loadBook();
  for (const e of b) {
    const o = document.createElement("option");
    o.value = e.slug;
    o.textContent = `${e.label.replace(/\s*\(.*$/, "")} — ${e.wazn}`;
    pickEl.appendChild(o);
  }
  pickEl.addEventListener("change", () => {
    const e = b.find((x) => x.slug === pickEl.value);
    if (!e) return;
    rootEl.value = e.root;
    waznEl.value = e.wazn;
    passEl.checked = e.passive;
    redEl.checked = e.reduced;
    refreshWazn(true);
    update();
  });
}

async function runSelfTest() {
  const status = $<HTMLElement>("#test-status");
  const fails = $<HTMLPreElement>("#test-fails");
  fails.hidden = true;
  fails.textContent = "";
  status.textContent = "يُحمِّل الكتاب…";
  const b = await loadBook();
  let passed = 0;
  const failed: string[] = [];
  const t0 = performance.now();
  let i = 0;
  const step = () => {
    const end = Math.min(i + 12, b.length);
    for (; i < end; i++) {
      const e = b[i];
      let c: Conjugation | null = null;
      try {
        c = conjugate(e.root, e.wazn, { passive: e.passive, reduced: e.reduced });
      } catch (err) {
        failed.push(`${e.label}: ${String(err)}`);
        continue;
      }
      for (const [slot, expected] of e.cells) {
        const forms = c.slots[slot as Slot] ?? [];
        const want = loose(expected);
        if (forms.some((f) => loose(f.form) === want)) passed++;
        else
          failed.push(
            `${e.label} · ${slot} · الكتاب ${expected} · المولِّد ${forms.map((f) => f.form).join(" | ") || "—"}`,
          );
      }
    }
    const secs = ((performance.now() - t0) / 1000).toFixed(1);
    status.innerHTML = `<span class="${failed.length ? "bad" : "ok"}">${passed.toLocaleString("en")} صحيحة، ${failed.length} خاطئة</span> · ${i} / ${b.length} نموذجًا · ${secs} ث`;
    if (i < b.length) requestAnimationFrame(step);
    else if (failed.length) {
      fails.hidden = false;
      fails.textContent = failed.join("\n");
    }
  };
  requestAnimationFrame(step);
}

function theme(set?: string) {
  const cur = document.documentElement.dataset.theme || "light";
  const next = set ?? (cur === "dark" ? "light" : "dark");
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("mazini-theme", next);
  } catch {
    /* ignore */
  }
}

fillWazn();
readHash();
update(false);
rootEl.addEventListener("input", () => {
  openRoots();
  refreshWazn();
  update();
});
rootEl.addEventListener("focus", openRoots);
rootEl.addEventListener("blur", closeRoots);
rootEl.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    moveActive(e.key === "ArrowDown" ? 1 : -1);
  } else if (e.key === "Enter" && !rootList.hidden && active >= 0) {
    e.preventDefault();
    pickRoot(rootList.children[active].textContent!);
  } else if (e.key === "Escape") closeRoots();
});
for (const el of [waznEl, passEl, redEl]) el.addEventListener("input", () => update());
attestedEl.addEventListener("change", () => {
  setRestricted(attestedEl.checked);
  refreshWazn();
  update();
});
window.addEventListener("hashchange", () => {
  readHash();
  update(false);
});
setTimeout(fillRoots, 0);
$("#theme").addEventListener("click", () => theme());
$("#run-test").addEventListener("click", () => {
  void runSelfTest();
});
void fillPicker();
