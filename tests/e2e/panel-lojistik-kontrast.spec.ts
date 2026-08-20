/**
 * 13-FE · Lojistik ekranları — WCAG KONTRAST DENETİMİ.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<administrator_parolasi>' ./e2e.sh --panel
 *
 * NEDEN BU DOSYA VAR:
 *   Koyu temada ⋯ menüsünün hover'ı açık zemin + açık metin veriyordu:
 *   1.03:1 kontrast, yazı görünmüyordu. Build geçti, birim testler geçti,
 *   ekran testleri geçti — çünkü hiçbiri RENK ÖLÇMÜYOR.
 *
 *   Kullanıcının sözü: "hepsini tek tek bulamam". Doğru; kimse bulamaz.
 *   Bu yüzden gözle aramak yerine ölçüyoruz: her görünür metin için efektif
 *   zemin bulunup WCAG 2.1 kontrast oranı hesaplanıyor, iki temada da.
 *
 * EŞİKLER (WCAG 2.1 AA, 1.4.3):
 *   normal metin  ≥ 4.5:1
 *   büyük metin   ≥ 3:1   (≥24px, ya da ≥18.66px + kalın)
 *   Salt-dekoratif ve devre dışı öğeler muaf (1.4.3 istisnası).
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const SHP = "SHP-2026-00042";
const EKRANLAR: Record<string, string> = {
  "kuyruk": "/panel/lojistik/paketleme",
  "çalışma alanı": `/panel/lojistik/paketleme/${SHP}`,
  "palet planı": `/panel/lojistik/paketleme/${SHP}/palet`,
  "etiket": `/panel/lojistik/etiketler/${SHP}`,
};

test.use({ baseURL: BASE, viewport: { width: 1600, height: 1000 } });
test.describe.configure({ mode: "serial" });

/** Sayfaya enjekte edilen ölçüm — tarayıcı içinde çalışır. */
const OLCUM = `(() => {
  /**
   * CSS rengini {r,g,b,a}'ya çevirir.
   *
   * DÜZ REGEX YETMİYOR: Tailwind v4 palet renklerini oklch() olarak
   * derliyor. İlk sürüm yalnız rgb() okuyordu ve oklch dönen her öğeyi
   * atlıyordu — AÇIK TEMA neredeyse hiç ölçülmüyordu (kuyruk ekranında 29
   * yerine 9 öğe tarandı). Tarayıcıya çizdirip pikseli okumak her CSS renk
   * söz dizimini kapsıyor.
   */
  const tuval = document.createElement("canvas");
  tuval.width = 1;
  tuval.height = 1;
  const ctx = tuval.getContext("2d", { willReadFrequently: true });

  const ayristir = (renk) => {
    if (!renk || renk === "transparent" || renk === "none") return { r: 0, g: 0, b: 0, a: 0 };
    const m = renk.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[,\s\/]+/).filter(Boolean).map((x) => parseFloat(x));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    ctx.fillStyle = "#000000";
    ctx.fillStyle = renk;
    ctx.clearRect(0, 0, 1, 1);
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };

  const uzerineKoy = (ust, alt) => ({
    r: ust.r * ust.a + alt.r * (1 - ust.a),
    g: ust.g * ust.a + alt.g * (1 - ust.a),
    b: ust.b * ust.a + alt.b * (1 - ust.a),
    a: 1,
  });

  const parlaklik = ({ r, g, b }) => {
    const k = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
  };

  const oran = (a, b) => {
    const [x, y] = [parlaklik(a), parlaklik(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  /** Şeffaf zeminleri ata katmanlarla harmanlayarak efektif zemini bulur. */
  const efektifZemin = (el) => {
    let katman = { r: 255, g: 255, b: 255, a: 1 };
    const yigin = [];
    for (let n = el; n && n !== document.documentElement.parentNode; n = n.parentElement) {
      const bg = ayristir(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) yigin.push(bg);
    }
    for (const bg of yigin.reverse()) katman = uzerineKoy(bg, katman);
    return katman;
  };

  const gorunur = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.15;
  };

  const bulgular = [];
  let sayac = 0;
  for (const el of document.querySelectorAll("main *")) {
    // Yalnız DOĞRUDAN metin taşıyan öğeler — kapsayıcılar iki kez sayılmasın.
    const metin = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!metin || metin.length < 2) continue;
    if (!gorunur(el)) continue;
    // Devre dışı öğeler WCAG 1.4.3 kapsamı dışında.
    if (el.closest("[disabled], [aria-disabled='true']")) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;

    const cs = getComputedStyle(el);
    const on = ayristir(cs.color);
    if (!on) continue;
    const zemin = efektifZemin(el);
    const gercekOn = on.a < 1 ? uzerineKoy(on, zemin) : on;

    sayac++;
    const px = parseFloat(cs.fontSize);
    const kalin = parseInt(cs.fontWeight, 10) >= 700;
    const buyuk = px >= 24 || (px >= 18.66 && kalin);
    const esik = buyuk ? 3 : 4.5;
    const o = oran(gercekOn, zemin);

    if (o < esik) {
      bulgular.push({
        metin: metin.slice(0, 44),
        oran: Math.round(o * 100) / 100,
        esik,
        px,
        renk: cs.color,
        zemin: \`rgb(\${Math.round(zemin.r)}, \${Math.round(zemin.g)}, \${Math.round(zemin.b)})\`,
        yol: el.tagName.toLowerCase() + "." + (el.className?.toString?.() ?? "").slice(0, 60),
      });
    }
  }
  return { bulgular, taranan: sayac };
})()`;

/** Ekran gerçekten dolana kadar bekler — sabit `waitForTimeout` yetmiyor. */
async function hazirOl(page: any, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("main h1").first().waitFor({ state: "visible", timeout: 15_000 });
  // İskelet (`aria-busy`) kalkana kadar: yükleniyor durumunda metin yok.
  await page.locator('main [aria-busy="true"]').first().waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function oturumAc(context: any) {
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);
}

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli (admin parolası).");
  await oturumAc(context);
});

for (const tema of ["light", "dark"] as const) {
  test(`${tema} tema — lojistik ekranlarında WCAG AA kontrastı`, async ({ page, context }) => {
    await context.addInitScript((t) => {
      localStorage.setItem("th-lang", "tr");
      localStorage.setItem("th-theme", t);
      localStorage.setItem("panel_tour_seen_v5", JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management", "messaging",
      ]));
    }, tema);

    const hepsi: string[] = [];
    let toplamTaranan = 0;
    for (const [ad, url] of Object.entries(EKRANLAR)) {
      await hazirOl(page, url);
      const { bulgular, taranan } = (await page.evaluate(OLCUM)) as any;
      // Yarı yüklenmiş ekran "temiz" görünür — alt sınır bunu yakalıyor.
      expect(taranan, `${tema}/${ad}: yalnız ${taranan} metin öğesi tarandı — ekran yüklenmemiş olabilir`).toBeGreaterThan(15);
      toplamTaranan += taranan;
      for (const b of bulgular as any[]) {
        hepsi.push(`${ad}: "${b.metin}" ${b.oran}:1 (gereken ${b.esik}:1) · ${b.renk} / ${b.zemin} · ${b.yol}`);
      }
    }
    console.log(`${tema}: ${toplamTaranan} metin öğesi ölçüldü`);
    expect(hepsi, `KONTRAST EKSİĞİ:\n  ${hepsi.join("\n  ")}`).toEqual([]);
  });

  test(`${tema} tema — hover durumlarında WCAG AA kontrastı`, async ({ page, context }) => {
    // Hover ayrı test: ⋯ menüsü hatası YALNIZ hover'da ortaya çıkıyordu.
    // Duran ekranı ölçmek onu bulamazdı.
    await context.addInitScript((t) => {
      localStorage.setItem("th-lang", "tr");
      localStorage.setItem("th-theme", t);
      localStorage.setItem("panel_tour_seen_v5", JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management", "messaging",
      ]));
    }, tema);

    const hepsi: string[] = [];
    for (const [ad, url] of Object.entries(EKRANLAR)) {
      await hazirOl(page, url);

      // Açılır menüleri de kapsa: varsa aç.
      const menu = page.getByRole("button", { name: "Diğer koli işlemleri" }).first();
      if (await menu.count()) await menu.click();
      const filtre = page.getByRole("button", { name: /^Filtreler( \d+)?$/ });
      if (await filtre.count()) await filtre.click();

      const tiklanabilir = page.locator("main button:not([disabled]), main a[href], main [role='menuitem']");
      const n = Math.min(await tiklanabilir.count(), 40);
      for (let i = 0; i < n; i++) {
        const el = tiklanabilir.nth(i);
        if (!(await el.isVisible().catch(() => false))) continue;
        await el.hover({ timeout: 2000 }).catch(() => {});
        const { bulgular } = (await page.evaluate(OLCUM)) as any;
        for (const b of bulgular as any[]) {
          const satir = `${ad}: "${b.metin}" ${b.oran}:1 (gereken ${b.esik}:1) · ${b.renk} / ${b.zemin} · ${b.yol}`;
          if (!hepsi.includes(satir)) hepsi.push(satir);
        }
      }
    }
    expect(hepsi, `HOVER KONTRAST EKSİĞİ:\n  ${hepsi.join("\n  ")}`).toEqual([]);
  });
}
