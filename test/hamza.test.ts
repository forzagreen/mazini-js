import { describe, expect, it } from "vitest";
import { readFixtureLines } from "./util";
import { processHamza } from "../src/hamza";

describe("processHamza against every call the Lua module made", () => {
  it("reproduces hamza.jsonl.gz", () => {
    const lines = readFixtureLines("hamza.jsonl.gz");
    const bad: string[] = [];
    let n = 0;
    for (const line of lines) {
      const rec = JSON.parse(line) as { in: string; out: string[] };
      n++;
      const got = processHamza(rec.in);
      if (JSON.stringify(got) !== JSON.stringify(rec.out)) {
        if (bad.length < 20) bad.push(`${rec.in}: expected ${rec.out.join(" | ")} got ${got.join(" | ")}`);
      }
    }
    expect(n).toBeGreaterThan(50000);
    expect(bad).toEqual([]);
  });
});
