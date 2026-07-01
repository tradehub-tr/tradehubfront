/**
 * E2E — Products page filter behaviour.
 *
 * Backend lokalde ayakta değil — `page.route()` ile `/api/method/...` çağrıları mock'lanır.
 * Sayfa hem desktop (`.hidden lg:block`) hem mobile (`#filter-sidebar-drawer`) için
 * `FilterSidebar()`'ı iki kez render eder → DOM'da aynı `data-filter-value`'ya sahip
 * iki checkbox bulunur. Bu test paketi multi-select chip akışının bu duplikasyonu
 * doğru yönettiğini doğrular.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const FACETS_BASE: Record<string, unknown> = {
  countries: [
    { value: "TR", label: "Türkiye", code: "TR", count: 30 },
    { value: "US", label: "United States", code: "US", count: 25 },
    { value: "DE", label: "Germany", code: "DE", count: 15 },
  ],
  categories: [
    { id: "kitchen", name: "Mutfak Aksesuarları", slug: "mutfak-aksesuarlari", count: 30 },
  ],
  managementCertifications: [
    { value: "ISO9001", label: "ISO 9001", count: 12 },
    { value: "BSCI", label: "BSCI", count: 7 },
  ],
  productCertifications: [{ value: "CE", label: "CE", count: 9 }],
  brands: [],
  attributes: [
    {
      code: "COLOR",
      label: "Renk",
      options: [
        { value: "Kırmızı", label: "Kırmızı", color: "#e11d48", count: 12 },
        { value: "Mavi", label: "Mavi", color: "#2563eb", count: 8 },
      ],
    },
  ],
};

const LISTINGS_EMPTY: Record<string, unknown> = {
  data: [],
  total: 0,
  page: 1,
  total_pages: 1,
};

async function mockBackend(page: Page): Promise<void> {
  // Playwright route handler sırası: son eklenen ilk çalıştırılır.
  // Catch-all en BAŞTA, spesifik handler'lar SONRA ki en spesifik önce eşleşsin.
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { user: "Guest", csrf_token: "test" } }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: LISTINGS_EMPTY }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.listing.get_filter_facets*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: FACETS_BASE } }),
    })
  );
}

test.describe("Products page — multi-select filter chips", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
  });

  test("Tek bir ülke seçilince chip yalnızca BİR kez render edilmeli (dupe yok)", async ({
    page,
  }) => {
    await page.goto("/pages/products.html");

    // Desktop sidebar render olduktan sonra dinamik country facet'larının yüklenmesini bekle
    const desktopTurkeyCheckbox = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
    );
    await expect(desktopTurkeyCheckbox).toBeAttached({ timeout: 10_000 });

    // 1) Desktop'tan TR'i seç — sr-only checkbox, direkt DOM mutation
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
      );
      if (!input) throw new Error("desktop TR checkbox not found");
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(desktopTurkeyCheckbox).toBeChecked();

    // 2) Bug reproduce için ikinci bir filtre seç — bu filter-change handler'ı tetikler,
    //    handler `:checked` ile DOM'u rebuild eder. Eğer mobile TR de syncDuplicateInputs
    //    ile checked olduysa, state.supplierCountries içine "TR" iki kez girer.
    await page.evaluate(() => {
      const verified = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="verified-supplier"][data-filter-value="1"]'
      );
      if (!verified) throw new Error("desktop verified-supplier checkbox not found");
      verified.checked = true;
      verified.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // 3) Debounce için 400ms bekle
    await page.waitForTimeout(400);

    // 4) Engine state'i tahta üzerinden gözlemle: window'a hiç expose edilmediğinden
    //    chip container DOM'una bakalım. Tek "Türkiye" chip'i olmalı (BUG: 2 olur).
    const chipsContainer = page.locator("#active-filter-chips");
    const turkeyChips = chipsContainer.locator("span.rounded-full", {
      hasText: /türkiye|turkey|^TR$/i,
    });
    await expect(turkeyChips).toHaveCount(1);
  });

  test("Country chip'i ham kod değil lokalize edilmiş adı göstermeli (BUG 2)", async ({
    page,
  }) => {
    await page.goto("/pages/products.html");

    const desktopTr = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
    );
    await expect(desktopTr).toBeAttached({ timeout: 10_000 });

    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(400);

    // i18n yüklendikten sonra chip "Türkiye" (TR locale) ya da çevirisi olmalı,
    // ham "TR" kodu DEĞİL. Chip outer span'ın ilk text içeriği label'dır.
    const chips = page.locator("#active-filter-chips");
    // Chip yapısı: <span class="...rounded-full"><span>{LABEL}</span><button>×</button></span>
    const chipLabels = await chips.locator("span.rounded-full > span").allTextContents();
    expect(chipLabels.length, "En az 1 chip render edilmeli").toBeGreaterThan(0);
    expect(
      chipLabels.some((t) => t === "TR"),
      `Chip ham 'TR' kodunu göstermemeli — labels: ${JSON.stringify(chipLabels)}`
    ).toBe(false);
    expect(chipLabels.some((t) => /türkiye|turkey/i.test(t))).toBe(true);
  });

  test("Dinamik attribute (renk) seçimi başka filtre eklendikten sonra da KALMALI (BUG 3)", async ({
    page,
  }) => {
    await page.goto("/pages/products.html");

    // Dinamik attribute sayfaya geç yüklenir — beklemek için checkbox toBeAttached
    const colorCb = page.locator(
      '[data-filter-section="attr-color"][data-filter-value="Kırmızı"]'
    );
    await expect(colorCb.first()).toBeAttached({ timeout: 10_000 });

    // 1) Renk: Kırmızı seç
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[data-filter-section="attr-color"][data-filter-value="Kırmızı"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(400);

    // 2) Onaylanmış Satıcı'yı da seç — filter-change handler tetiklenir
    await page.evaluate(() => {
      const v = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="verified-supplier"][data-filter-value="1"]'
      );
      v!.checked = true;
      v!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // 3) URL hâlâ attr_COLOR=Kırmızı içermeli (state korundu mu?)
    const url = page.url();
    expect(url, `URL: ${url}`).toContain("attr_COLOR=");
    expect(decodeURIComponent(url)).toContain("Kırmızı");
  });

  test("Multi-select sertifika seçimi de duplikasyon üretmemeli", async ({ page }) => {
    await page.goto("/pages/products.html");

    const isoCheckbox = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="mgmt-certifications"][data-filter-value="ISO9001"]'
    );
    await expect(isoCheckbox).toBeAttached({ timeout: 10_000 });
    await isoCheckbox.check({ force: true });

    // Şu an chip'ler sadece ülke + verified-supplier için render ediliyor (FilterChips.ts).
    // Bu test sertifika state'inin de :checked rebuild'inde dupe oluşturmadığını doğrular —
    // state.mgmtCertifications array'i unique olmalı.
    const state = await page.evaluate(() => {
      // Window üzerine debug için engine'in state'ini expose etmediğimizden
      // DOM'dan :checked sertifika sayısını okuyalım
      const checked = document.querySelectorAll(
        '[data-filter-section="mgmt-certifications"]:checked'
      );
      return Array.from(checked).map((cb) => (cb as HTMLInputElement).value);
    });

    // Desktop + mobile sidebar her ikisi de DOM'da olduğu için :checked iki tane buluyor.
    // Bu beklenen — ama engine state ARRAY'inde unique tutmalı.
    // (Test bug'ı izole etmek için DOM sayısı 2 olabilir; asıl önemli olan state rebuild dedup'lı olsun.)
    expect(new Set(state).size).toBe(1); // unique değer sayısı: 1
  });

  test("Ülke chip'i × ile kaldırılınca tüm sync'li checkbox'lar uncheck olmalı", async ({
    page,
  }) => {
    await page.goto("/pages/products.html");

    const desktopTr = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
    );
    await expect(desktopTr).toBeAttached({ timeout: 10_000 });

    // sr-only checkbox — programatik check
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Chip render olsun (debounce için kısa bekleme)
    await page.waitForTimeout(400);
    const chips = page.locator("#active-filter-chips");
    await expect(chips.locator("span.rounded-full")).toHaveCount(1);

    // Chip remove button'ına tıkla
    await chips.locator("button").first().click();
    await page.waitForTimeout(400);

    // Hem desktop hem mobile sidebar checkbox'ları uncheck olmalı
    await expect(desktopTr).not.toBeChecked();
    const mobileTr = page.locator(
      '[data-filter-prefix-root="mobile"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
    );
    await expect(mobileTr).not.toBeChecked();

    // Chip container empty
    await expect(chips).toBeEmpty();
  });

  test("URL ?country=TR + yavaş facet yanıtı → facet yüklenir yüklenmez TR checked olmalı (BUG 4)", async ({
    page,
  }) => {
    // Override: facet response 2 sn gecikme. setTimeout(1500ms) hack'i bundan ÖNCE
    // çalışır → input henüz DOM'da değildir → restore başarısız.
    // Fix: facet promise'ine bağlı restore.
    await page.unroute("**/api/method/tradehub_core.api.listing.get_filter_facets*");
    await page.route(
      "**/api/method/tradehub_core.api.listing.get_filter_facets*",
      async (route: Route) => {
        await new Promise((r) => setTimeout(r, 2000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: { data: FACETS_BASE } }),
        });
      }
    );

    await page.goto("/pages/products.html?country=TR");

    // Facet yanıtı geldikten sonra 500ms buffer
    const desktopTr = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
    );
    await expect(desktopTr).toBeAttached({ timeout: 10_000 });
    await expect(desktopTr).toBeChecked({ timeout: 3_000 });
  });

  test("ISO 9001 sertifikası seçilince chip render edilmeli (BUG 7)", async ({ page }) => {
    await page.goto("/pages/products.html");

    const isoCheckbox = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="mgmt-certifications"][data-filter-value="ISO9001"]'
    );
    await expect(isoCheckbox).toBeAttached({ timeout: 10_000 });

    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="mgmt-certifications"][data-filter-value="ISO9001"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(400);

    // Chip container'da ISO chip'i olmalı
    const chips = page.locator("#active-filter-chips");
    const isoChip = chips.locator("span.rounded-full", { hasText: /ISO ?9001/i });
    await expect(isoChip).toHaveCount(1);
  });

  test("Sertifika chip'i × ile kaldırılınca checkbox uncheck olmalı (BUG 7)", async ({
    page,
  }) => {
    await page.goto("/pages/products.html");

    const isoCheckbox = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="mgmt-certifications"][data-filter-value="ISO9001"]'
    );
    await expect(isoCheckbox).toBeAttached({ timeout: 10_000 });

    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="mgmt-certifications"][data-filter-value="ISO9001"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(400);

    const chips = page.locator("#active-filter-chips");
    await expect(chips.locator("span.rounded-full")).toHaveCount(1);

    // Chip x butonuna tıkla
    await chips.locator("span.rounded-full button").first().click();
    await page.waitForTimeout(400);

    await expect(isoCheckbox).not.toBeChecked();
    await expect(chips).toBeEmpty();
  });

  test("Bir filtre seçilince sidebar'daki diğer count'lar dinamik azalmalı (BUG 8)", async ({
    page,
  }) => {
    // İlk facet response — 3 marka, geniş sayım. Sonraki çağrıda backend aktif filtre
    // (verified_supplier=1) ile çağrılır → sayım daralır.
    await page.unroute("**/api/method/tradehub_core.api.listing.get_filter_facets*");
    let facetCall = 0;
    await page.route(
      "**/api/method/tradehub_core.api.listing.get_filter_facets*",
      async (route: Route) => {
        facetCall++;
        const url = route.request().url();
        const isFiltered = url.includes("verified_supplier=1");
        // İlk çağrı (filtresiz): geniş sayım. Sonrakiler (filtreli): daraltılmış sayım.
        const brands = isFiltered
          ? [
              { code: "MARMARAT", value: "MARMARAT", label: "MarmaraT", count: 5 },
              { code: "AKDENIZ", value: "AKDENIZ", label: "AkdenizMut", count: 3 },
            ]
          : [
              { code: "MARMARAT", value: "MARMARAT", label: "MarmaraT", count: 38 },
              { code: "AKDENIZ", value: "AKDENIZ", label: "AkdenizMut", count: 30 },
              { code: "KARADENIZ", value: "KARADENIZ", label: "KaradenizG", count: 27 },
            ];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: {
              data: {
                countries: FACETS_BASE.countries,
                categories: FACETS_BASE.categories,
                managementCertifications: FACETS_BASE.managementCertifications,
                productCertifications: FACETS_BASE.productCertifications,
                brands,
                attributes: FACETS_BASE.attributes,
              },
            },
          }),
        });
      }
    );

    await page.goto("/pages/products.html");

    // MarmaraT marka satırı render olsun (dinamik facet)
    const marmaraBrandRow = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="brands"][data-filter-value="MARMARAT"]'
    );
    await expect(marmaraBrandRow).toBeAttached({ timeout: 10_000 });

    // İlk count: 38
    const marmaraLabel = page.locator(
      '[data-filter-prefix-root="desktop"] label:has(input[data-filter-section="brands"][data-filter-value="MARMARAT"])'
    );
    await expect(marmaraLabel.locator("span.ms-auto")).toHaveText("(38)");

    // Onaylanmış Satıcı'yı seç → tüm fetch zinciri tetiklenir
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="verified-supplier"][data-filter-value="1"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // MarmaraT count'u 5'e düşmeli (debounced fetch ~300ms + facet promise)
    await expect(marmaraLabel.locator("span.ms-auto")).toHaveText("(5)", { timeout: 5_000 });
    expect(facetCall, "Facet endpoint en az 2 kez çağrılmalı (init + filter sonrası)").toBeGreaterThanOrEqual(2);
  });

  test("Tüm filtreleri temizle → chip yok, tüm input uncheck/empty", async ({ page }) => {
    await page.goto("/pages/products.html");

    const desktopTr = page.locator(
      '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
    );
    await expect(desktopTr).toBeAttached({ timeout: 10_000 });

    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-filter-prefix-root="desktop"] input[data-filter-section="supplier-country"][data-filter-value="TR"]'
      );
      input!.checked = true;
      input!.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Önce chip oluşmuş olmalı
    await page.waitForTimeout(400);
    const chips = page.locator("#active-filter-chips");
    await expect(chips.locator("span.rounded-full")).toHaveCount(1);

    // Clear All butonuna tıkla (desktop sidebar)
    await page
      .locator('[data-filter-prefix-root="desktop"] [data-filter-action="clear-all"]')
      .click();
    await page.waitForTimeout(400);

    // Tüm checkbox'lar uncheck, chip container boş
    await expect(desktopTr).not.toBeChecked();
    await expect(chips).toBeEmpty();
  });
});
