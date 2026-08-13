import Alpine from "alpinejs";
import collapse from "@alpinejs/collapse";

// Stil zinciri — uygulamayla AYNI giriş noktası. Tailwind v4 `@source`
// taramasını buradan yapıyor, ayrıca Flowbite eklentisi ve tüm proje
// stilleri bu tek dosyadan geliyor.
import "../src/style.css";

// Alpine.data() kayıtları (side-effect import). `src/alpine/index.ts`'in
// modül seviyesindeki import'ları tüm component'leri kaydediyor; `startAlpine()`
// fonksiyonunu ÇAĞIRMIYORUZ — sebebi aşağıda.
import "../src/alpine";

/**
 * Alpine, Storybook'ta bir KEZ başlatılır.
 *
 * `Alpine.start()` ikinci kez çağrılınca hata veriyor, ama Storybook her
 * story'yi aynı iframe içinde yeniden render ediyor. Alpine zaten
 * MutationObserver ile yeni DOM'u kendiliğinden ele alıyor — bir kez
 * başlatmak yeterli.
 *
 * `startAlpine()` yerine elle başlatmanın nedeni: o fonksiyon
 * `initTracking()` de çağırıyor ve tasarım incelemesinde analytics script'i
 * yüklemenin hiçbir gerekçesi yok (üstelik çerez izni akışını tetikler).
 */
let alpineStarted = false;
function ensureAlpine() {
  if (alpineStarted) return;
  alpineStarted = true;
  Alpine.plugin(collapse);
  Alpine.start();
}

export default {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    // Storefront tek temalı (style.css'te yalnız 4 `dark:` kullanımı var) —
    // admin-panel'deki tema araç çubuğu buraya konmadı, yanıltıcı olurdu.
    backgrounds: {
      options: {
        beyaz: { name: "Beyaz", value: "#ffffff" },
        sayfa: { name: "Sayfa zemini", value: "#f5f6f8" },
      },
    },
    initialGlobals: { backgrounds: { value: "sayfa" } },
  },

  decorators: [
    (story) => {
      ensureAlpine();
      return story();
    },
  ],
};
