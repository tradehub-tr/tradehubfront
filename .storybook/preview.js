import Alpine from "alpinejs";
import collapse from "@alpinejs/collapse";

import { changeLanguage } from "../src/i18n";

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

/**
 * Dil araç çubuğu.
 *
 * Storefront dört dilli ve Arapça RTL — ekranın sağdan sola aynadığını
 * görmenin başka yolu yok. `changeLanguage()` eksik locale paketini kendisi
 * yüklüyor ve `<html dir>` niteliğini de ayarlıyor.
 *
 * UYARI: `shipment.*` ad alanının **ar ve ru karşılıkları henüz çeviri
 * değil** — İngilizce yer tutucu (locale dosyalarında `// TODO çeviri`).
 * Bu iki dilde S1–S13 metinleri İngilizce görünür; hata değil, kapanmamış iş.
 */
const LOCALE_ITEMS = [
  { value: "tr", title: "Türkçe" },
  { value: "en", title: "English" },
  { value: "ar", title: "العربية (RTL)" },
  { value: "ru", title: "Русский" },
];

export default {
  globalTypes: {
    locale: {
      description: "Arayüz dili",
      toolbar: { icon: "globe", items: LOCALE_ITEMS, dynamicTitle: true },
    },
  },

  loaders: [
    async ({ globals }) => {
      // Render'dan ÖNCE çalışıyor: `t()` şablon dizesi içinde çağrıldığı için
      // dil render sırasında hazır olmalı, sonradan güncellenemiyor.
      await changeLanguage(globals.locale ?? "tr");
      return {};
    },
  ],

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
  },

  // `initialGlobals` `parameters`'ın KARDEŞİ — içine konursa Storybook onu
  // sıradan bir parametre sanıp yok sayıyor, varsayılan dil/zemin uygulanmıyor.
  initialGlobals: { backgrounds: { value: "sayfa" }, locale: "tr" },

  decorators: [
    (story) => {
      ensureAlpine();
      return story();
    },
  ],
};
