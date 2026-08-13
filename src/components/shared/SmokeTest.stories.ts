/**
 * Storybook kurulum duman testi.
 *
 * Üç şeyi bir arada doğrular; üçü de kurulumda sessizce bozulabilecek
 * şeyler:
 *   1. Tailwind utility'leri ÜRETİLİYOR mu (admin-panel'de `tailwindcss()`
 *      atlanınca hiçbir sınıf çalışmamıştı)
 *   2. Alpine reaktivitesi ÇALIŞIYOR mu (`Alpine.start()` bir kez çağrıldı mı)
 *   3. `th-btn-*` gibi proje sınıfları style.css'ten geliyor mu
 *
 * S1–S13 ekranları yazılınca bu dosya silinebilir — o zaman gerçek
 * ekranlar aynı kanıtı üretir.
 */
export default {
  title: "Kurulum/Duman testi",
  id: "setup-smoke-test",
  tags: ["autodocs"],
};

export const TailwindCalisiyor = {
  name: "Tailwind utility'leri",
  render: () => `
    <div class="flex items-center gap-3 rounded-md bg-white p-4 shadow-sm">
      <span class="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
        utility OK
      </span>
      <p class="text-sm text-gray-600">
        Bu kutu yuvarlak, gölgeli ve boşluklu görünüyorsa Tailwind derleniyor.
      </p>
    </div>
  `,
};

/**
 * Storefront'ta GERÇEKTEN tanımlı olan buton sınıfları.
 *
 * `th-btn-primary` bilinçli olarak YOK: admin-panel'de tanımlı ama
 * storefront `style.css`'inde karşılığı bulunmuyor. (İlk yazdığımda onu
 * kullanmıştım ve duman testi renksiz butonu yakaladı — kullanımda olan
 * ama tanımsız sınıflar için ayrı bir bulgu kaydı var.)
 */
export const ProjeSiniflari = {
  name: "Proje sınıfları (th-btn-*)",
  render: () => `
    <div class="flex flex-wrap gap-3">
      <button type="button" class="th-btn">th-btn</button>
      <button type="button" class="th-btn-dark">th-btn-dark</button>
      <button type="button" class="th-btn-outline th-no-press">th-btn-outline</button>
      <button type="button" class="th-btn-ghost th-no-press">th-btn-ghost</button>
    </div>
  `,
};

export const AlpineReaktif = {
  name: "Alpine reaktivitesi",
  render: () => `
    <div x-data="{ sayac: 0 }" class="flex items-center gap-3 rounded-md bg-white p-4">
      <button type="button" class="th-btn-outline th-no-press" @click="sayac++">
        Artır
      </button>
      <span class="text-sm">Sayaç: <strong x-text="sayac">0</strong></span>
      <span class="text-xs text-gray-500" x-show="sayac > 2" x-transition>
        x-show + x-transition da çalışıyor
      </span>
    </div>
  `,
};
