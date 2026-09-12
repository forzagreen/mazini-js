import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

export function readFixtureLines(name: string): string[] {
  const buf = readFileSync(join(FIXTURES, name));
  const text = (name.endsWith(".gz") ? gunzipSync(buf) : buf).toString("utf8");
  return text.split("\n").filter((l) => l.length > 0);
}
