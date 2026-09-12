// The demo page: conjugate what the reader types, show the tables the book prints (and the moods it
// does not), and run the 15,549 book assertions in the browser on request.
import { conjugate, loose, MaziniError, WAZNS } from "../src/index";
import type { Conjugation, OutputForm, Slot } from "../src/index";

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const PERSONS = ["3ms", "3md", "3mp", "3fs", "3fd", "3fp", "2ms", "2d", "2mp", "2fs", "2fp", "1s", "1p"];
const PERSON_AR: Record<string, string> = {
  "3ms": "هو",
  "3md": "هما",
  "3mp": "هم",
  "3fs": "هي",
  "3fd": "هما (مؤ)",
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
  ["past_pass_", "الماضي المجهول"],
  ["ind_pass_", "المضارع المجهول"],
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

const rootEl = $<HTMLInputElement>("#root");
const waznEl = $<HTMLSelectElement>("#wazn");
const passEl = $<HTMLInputElement>("#passive");
const redEl = $<HTMLInputElement>("#reduced");
const pickEl = $<HTMLSelectElement>("#book-pick");
const out = $<HTMLElement>("#out");

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
    }
    waznEl.appendChild(og);
  }
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

function show(c: Conjugation) {
  out.innerHTML = "";
  const h = document.createElement("h2");
  h.textContent = c.lemma.map((f) => f.form).join(" / ") || "—";
  out.appendChild(h);
  const facts = document.createElement("div");
  facts.className = "facts";
  const items: [string, string][] = [
    ["الجذر", c.rootDisplay],
    ["الوزن", c.wazn ?? c.formCode],
    ["النوع", c.verbType],
    [
      "المبني للمجهول",
      {
        pass: "كامل",
        ipass: "غير شخصي (للغائب فقط)",
        nopass: "لا مجهول له",
        onlypass: "مجهول فقط",
        "onlypass-impers": "مجهول غير شخصي",
      }[c.passive] + (c.passiveDefaulted ? " (افتراضًا)" : ""),
    ],
  ];
  if (c.irregular) items.push(["", "فعل شاذّ"]);
  for (const [k, v] of items) {
    const s = document.createElement("span");
    s.textContent = k ? k + ": " : "";
    const b = document.createElement("b");
    b.textContent = v;
    s.appendChild(b);
    facts.appendChild(s);
  }
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
    h3.textContent = "المعلوم";
    out.append(h3, table(c, ACTIVE_COLS, false, notes));
  }
  if (c.hasPassive && Object.keys(c.slots).some((s) => s.includes("_pass_"))) {
    const h3 = document.createElement("h3");
    h3.textContent = "المجهول";
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
  const pre = document.createElement("code");
  pre.textContent = JSON.stringify({
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
  });
  meta.appendChild(pre);
  out.appendChild(meta);
}

function update(pushHash = true) {
  const root = rootEl.value.trim();
  const wazn = waznEl.value;
  if (pushHash) {
    const p = new URLSearchParams({ root, wazn });
    if (passEl.checked) p.set("passive", "1");
    if (redEl.checked) p.set("reduced", "1");
    history.replaceState(null, "", "#" + p.toString());
  }
  if (!root) {
    out.innerHTML = '<p class="muted">اكتب جذرًا.</p>';
    return;
  }
  try {
    show(conjugate(root, wazn, { passive: passEl.checked, reduced: redEl.checked }));
  } catch (e) {
    out.innerHTML = "";
    const p = document.createElement("p");
    p.className = "error";
    p.textContent = e instanceof MaziniError ? `خطأ (${e.code}): ${e.message}` : String(e);
    out.appendChild(p);
  }
}

function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get("root")) rootEl.value = p.get("root")!;
  if (p.get("wazn") && WAZNS.some((w) => w.wazn === p.get("wazn"))) waznEl.value = p.get("wazn")!;
  passEl.checked = p.get("passive") === "1";
  redEl.checked = p.get("reduced") === "1";
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
for (const el of [rootEl, waznEl, passEl, redEl]) el.addEventListener("input", () => update());
window.addEventListener("hashchange", () => {
  readHash();
  update(false);
});
$("#theme").addEventListener("click", () => theme());
$("#run-test").addEventListener("click", () => {
  void runSelfTest();
});
void fillPicker();
