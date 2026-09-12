// loose() parity: the TypeScript port reproduces the Python reference (tools/normalise.py upstream) and the
// Lua port upstream, on every fixture cell, the SAME/DISTINCT pairs and the generated probes.
import { describe, expect, it } from "vitest";
import { readFixtureLines } from "./util";
import { loose } from "../src/loose";

describe("loose() parity", () => {
  it("matches the Python reference and the Lua port on loose.jsonl.gz", () => {
    const lines = readFixtureLines("loose.jsonl.gz");
    const bad: string[] = [];
    for (const line of lines) {
      const rec = JSON.parse(line) as { s: string; py: string | null; lua: string | null };
      const got = loose(rec.s);
      if (got !== rec.py)
        bad.push(`${JSON.stringify(rec.s)}: python ${JSON.stringify(rec.py)}, ts ${JSON.stringify(got)}`);
      if (rec.py !== rec.lua)
        bad.push(
          `${JSON.stringify(rec.s)}: python ${JSON.stringify(rec.py)}, lua ${JSON.stringify(rec.lua)}`,
        );
    }
    expect(lines.length).toBeGreaterThan(50000);
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it("absorbs the attested conventions and keeps the near-misses apart", () => {
    const same: [string, string][] = [
      ["أُؤْكَلُ", "أُوكَلُ"],
      ["يُوْصَلُ", "يُوصَلُ"],
      ["اِيْقَظْ", "اِيقَظْ"],
      ["إِيْثِرْ", "اِئْثِرْ"],
      ["إدْ", "إِدْ"],
      ["ٱفْعُلْ", "افْعُلْ"],
      ["فَعَلَا", "فَعَلا"],
      ["يَفْعَلْ", "يَفْعَل"],
    ];
    const distinct: [string, string][] = [
      ["خُفْتَ", "خِفْتَ"],
      ["يُوصَلُ", "يُوصِلُ"],
      ["يَقُولُ", "يَقِيلُ"],
      ["مُدِدْتُنَّ", "مُدِدْتُنُّ"],
      ["وُصِلَتْ", "وَصِلَتْ"],
      ["يُلَى", "يُولَى"],
      ["إدْ", "أُدْ"],
      ["اِوْنَ", "اِينَ"],
    ];
    for (const [a, b] of same) expect(loose(a), `${a} vs ${b}`).toBe(loose(b));
    for (const [a, b] of distinct) expect(loose(a), `${a} vs ${b}`).not.toBe(loose(b));
  });
});
