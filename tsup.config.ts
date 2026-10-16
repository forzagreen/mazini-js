import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/lexicon.ts"],
  format: ["esm", "cjs"],
  target: "node18",
  outDir: "dist",
  dts: true,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  },
});
