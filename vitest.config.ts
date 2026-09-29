import { defineConfig } from "vitest/config";

export default defineConfig({
  // Birim testleri mock modüllerini sınıyor → anahtar açık (vite.config `define` ile aynı ad).
  define: { __LOJISTIK_MOCK__: "true" },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["fake-indexeddb/auto"],
  },
});
