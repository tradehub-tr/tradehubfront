import { expect, type Page, type TestInfo } from "@playwright/test";

/**
 * Panel menüsü — MASAÜSTÜ ve MOBİL için ortak okuma.
 *
 * NEDEN VAR: menü testleri `a[href*="/lojistik/"]` ile kalem arıyordu ve
 * `chromium-mobile` projesinde beşi birden düşüyordu. Sebep üründe DEĞİL:
 * mobilde kenar çubuğu hiç çizilmiyor, gezinme `MobileTabBar.vue`'nun
 * "sayfa" panelinden yapılıyor ve oradaki kalemler `<a href>` değil
 * `<button @click="go(item)">`. Yani mobilde eşleşecek `href` YOK.
 *
 * Ölçüldü (7 Eyl 2026, admin oturumu, 390×844): mobil sekme çubuğunda
 * lojistik sekmesi de yok — beş sekme var (Ana Sayfa · Katalog · Ticaret ·
 * Sistem · Daha) ve lojistiğe "Daha → Lojistik" ile giriliyor. Oradan sonra
 * menü EKSİKSİZ: 8 grup, 18 kalem.
 *
 * Bu yüzden mobil iddia YOL değil ETİKET üzerinden kurulur; ikisinin tek
 * kaynağı `admin-panel/frontend/src/router/logisticsScreens.js` (`path` +
 * `labelKey`) ve panelin `i18n/locales/tr.js`'i. Etiket orada değişirse bu
 * eşleme kırılır — bilinçli: sessiz kalmasındansa kırılsın.
 */

/**
 * Yol → mobil menüde görünen etiket(ler). Ölçülerek doğrulandı.
 *
 * Bazı ekranların etiketi ROLE GÖRE değişiyor (satıcıya "Kargo Fiyatlarım",
 * admine "Tarifeler"); o yüzden değer bir dizi. Eşlemesi olmayan bir kalem
 * sessizce düşmez — `lojistikMenuYollari` onu `bilinmeyen` olarak döndürür
 * ve testler istediklerini bulamayınca kırılır.
 */
export const LOJISTIK_ETIKETLER: Record<string, string[]> = {
  "/panel/lojistik/tarifeler": ["Tarifeler", "Kargo Fiyatlarım"],
  "/panel/lojistik/fiyat-kurallari": ["Fiyat Kuralları", "Kargo Kurallarım"],
  "/panel/lojistik/fiyat-simulasyonu": ["Fiyat Simülasyonu", "Fiyat Hesapla"],
};

/** Yol → tek etiket (rolden bağımsız olanlar). */
export const LOJISTIK_ETIKET: Record<string, string> = {
  "/panel/lojistik/pano": "Pano",
  "/panel/lojistik/bekleyen-isler": "Bekleyen İşler",
  "/panel/lojistik/istisnalar": "İstisna Kuyruğu",
  "/panel/lojistik/raporlar": "Raporlar",
  "/panel/lojistik/sevkiyatlar": "Sevkiyatlar",
  "/panel/lojistik/sevkiyatlar/yeni": "Manuel Sevkiyat",
  "/panel/lojistik/paketleme": "Paketleme",
  "/panel/lojistik/teslim-kaniti": "Teslim Kanıtı",
  "/panel/lojistik/satici-teslimati": "Satıcı Teslimatı",
  "/panel/lojistik/alici-teslim-alma": "Alıcı Teslim Alma",
  "/panel/lojistik/iadeler": "İadeler",
  "/panel/lojistik/tarifeler": "Tarifeler",
  "/panel/lojistik/fiyat-kurallari": "Fiyat Kuralları",
  "/panel/lojistik/fiyat-simulasyonu": "Fiyat Simülasyonu",
  "/panel/lojistik/tasiyici-hesaplari": "Taşıyıcı Hesapları",
  "/panel/lojistik/durum-eslemesi": "Durum Eşlemesi",
  "/panel/lojistik/kataloglar": "Lojistik Kataloglar",
  "/panel/lojistik/ayarlar": "Lojistik Ayarları",
};

export function mobilMi(testInfo: TestInfo): boolean {
  return testInfo.project.name.includes("mobile");
}

/**
 * Mobil menüyü "Daha → Lojistik" yolundan açar; grup ve kalem etiketlerini
 * döndürür. Panel zaten açık bir sayfadayken çağrılır.
 */
export async function mobilLojistikMenusu(
  page: Page
): Promise<{ gruplar: string[]; kalemler: string[] }> {
  await page.locator("nav.m-tabbar").getByRole("button", { name: "Daha" }).click();
  const panel = page.locator(".m-sheet");
  await expect(panel, "mobil menü paneli açılmalı").toBeVisible({ timeout: 10_000 });

  await panel.getByText("Lojistik", { exact: true }).first().click();
  await expect(panel.locator(".m-item-label").first()).toBeVisible({ timeout: 10_000 });

  return {
    gruplar: await panel.locator(".m-group-label").allInnerTexts(),
    kalemler: await panel.locator(".m-item-label").allInnerTexts(),
  };
}

/** Etiket → yol (çoklu etiket dahil), tek seferde kurulur. */
const ETIKETTEN_YOL: Map<string, string> = new Map([
  ...Object.entries(LOJISTIK_ETIKET).map(([yol, et]) => [et, yol] as [string, string]),
  ...Object.entries(LOJISTIK_ETIKETLER).flatMap(([yol, etler]) =>
    etler.map((et) => [et, yol] as [string, string])
  ),
]);

/**
 * Lojistik menüsündeki YOLLARI döndürür — masaüstünde ve mobilde AYNI biçimde.
 *
 * Mobilde kalemler `href` taşımadığı için etiketler yola geri çevrilir; böylece
 * çağıran taraf tek bir yol listesiyle çalışır ve mevcut `toContain` /
 * `not.toContain` iddiaları iki ortamda da aynen geçerli kalır.
 */
export async function lojistikMenuYollari(page: Page, testInfo: TestInfo): Promise<string[]> {
  if (mobilMi(testInfo)) {
    const { kalemler } = await mobilLojistikMenusu(page);
    return kalemler.map((e) => ETIKETTEN_YOL.get(e.trim()) ?? `bilinmeyen:${e.trim()}`);
  }
  const linkler = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  return linkler.filter((h): h is string => Boolean(h));
}

/** Verilen yolların menüde bulunduğunu iki ortamda da doğrular. */
export async function menudeVar(page: Page, testInfo: TestInfo, yollar: string[]): Promise<void> {
  const mevcut = await lojistikMenuYollari(page, testInfo);
  for (const yol of yollar) {
    expect(mevcut, `menüde yok: ${yol}`).toContain(yol);
  }
}
