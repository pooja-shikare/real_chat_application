import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Vitest configuration for the frontend suite.
 *
 * Mirrors the `@` and `declarations` aliases from `vite.config.js` so tests
 * import the same modules the app does. The DOM environment and the setup file
 * are configured here; the `test` script also passes `--environment jsdom`,
 * which is harmless and keeps the lane runnable through the script alone.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: false,
    // The container reports a low CPU count, which makes Vitest's default
    // min/max thread bounds conflict. Pin both so the pool is deterministic.
    pool: "threads",
    poolOptions: {
      threads: { minThreads: 1, maxThreads: 1 },
    },
  },
});
