import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";

/**
 * Storefront Storybook yapılandırması.
 *
 * Storybook'un Vite builder'ı proje `vite.config.ts`'ini OKUYOR — ilk
 * denemede çıktıda `sw.js` + `workbox-*.js` belirdi ve `iframe.html`'e
 * service worker kaydı enjekte edilmişti. Uygulamanın dokuz eklentisi
 * Storybook'a sızıyor.
 *
 * Bunların çoğu burada anlamsız, bazısı zararlı:
 *   * VitePWA        → service worker, story'leri agresif cache'ler
 *   * SEO eklentileri → çıktı HTML'ine meta/placeholder enjekte eder
 *   * URL rewrite'lar → çok sayfalı uygulamanın dev-server davranışı
 *   * tema bootstrap  → uzaktan tema API'si Storybook'ta yok
 *
 * Bu yüzden ada göre eleniyorlar; `tailwindcss()` ise stil zinciri için
 * ZORUNLU (admin-panel'de atlandığında hiçbir utility üretilmemişti).
 */

/** Storybook'a sızmaması gereken uygulama eklentileri (vite.config.ts adları). */
const EXCLUDED_APP_PLUGINS = new Set([
  "theme-bootstrap-inject",
  "font-head-inject",
  "impeccable-live-inject",
  "static-page-rewrite",
  "pretty-url-rewrite",
  "not-found-fallback",
  "static-seo-inject",
  "seo-placeholder-inject",
]);

/** VitePWA tek bir ad değil, birden çok eklenti kaydediyor. */
const isPwaPlugin = (name) => typeof name === "string" && name.includes("vite-plugin-pwa");
export default {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|ts)"],

  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],

  framework: {
    name: "@storybook/html-vite",
    options: {},
  },

  async viteFinal(config) {
    // Sızan uygulama eklentilerini ele. Vite eklenti dizisi iç içe olabildiği
    // için düzleştirilip filtreleniyor.
    const kept = (config.plugins ?? []).flat(Infinity).filter((plugin) => {
      const name = plugin?.name;
      return !EXCLUDED_APP_PLUGINS.has(name) && !isPwaPlugin(name);
    });

    config.plugins = [tailwindcss(), ...kept];

    // Uygulama kodu göreli yol kullanıyor (`../utils/...`), `@` alias'ı yok —
    // yine de story'lerden kısa yol yazılabilsin diye tanımlanıyor.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": resolve(import.meta.dirname, "../src"),
    };

    return config;
  },
};
