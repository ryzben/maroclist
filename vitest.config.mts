import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for pure helpers (src/**/*.test.ts). Database migrations have their own runner: npm run test:db
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
  },
});
