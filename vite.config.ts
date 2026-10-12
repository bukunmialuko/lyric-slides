// `vitest/config` rather than `vite` — the same defineConfig widened to accept
// the `test` block, so no separate vitest.config file is needed.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // `--mode artifact` is the claude.ai artifact build: one JS and one CSS file
  // with the logo inlined, which scripts/artifact.mjs folds into a single page.
  build:
    mode === "artifact"
      ? { outDir: "dist-artifact", assetsInlineLimit: 100_000_000, cssCodeSplit: false, rolldownOptions: { output: { codeSplitting: false } } }
      : {},
  test: {
    // core/ is pure string work — no DOM needed, so tests stay fast and jsdom
    // stays out of the dependency list.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
