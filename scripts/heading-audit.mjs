import { chromium } from "playwright";
import fs from "node:fs";
// Başlık hiyerarşisi denetimi: tüm sayfaları headless açar, DOM sırasıyla
// h1-h6 çıkarır; h1 yok / birden çok h1 / seviye atlaması varsa ✗ basar.
// Kullanım: node scripts/heading-audit.mjs [çıktı.json]
//   AUDIT_BASE, AUDIT_USER, AUDIT_PASS ortam değişkenleriyle özelleştir.
const BASE = process.env.AUDIT_BASE ?? "http://istoc.localhost";
const STATIC =
  `/ /urunler /kategoriler /ureticiler /sepet /giris /kayit /sifremi-unuttum /sifre-sifirla /davet-kabul /davet-kabul?token=x /yardim-merkezi /sss /sss/detay /destek/yeni /destek/taleplerim /destek/talep /satis-sonrasi /odeme-secenekleri /iade-politikasi /kargo-lojistik /ticaret-guvencesi/detay /erisilebilirlik /cerezler /mesafeli-satis /fikri-mulkiyet /kvkk /yasal-uyari /gizlilik /urun-listeleme-kurallari /iade-kosullari /kullanim-kosullari /hesabim /hesabim/adresler /hesabim/kisiler /hesabim/favoriler /hesabim/sorularim /hesabim/kyb /hesabim/mesajlar /hesabim/siparisler /hesabim/odeme /hesabim/profil /hesabim/rfq /hesabim/rfq/yeni /hesabim/rfq/teklifler /hesabim/ayarlar /odeme /odeme/basarili /odeme/basarisiz /odeme/isleniyor /satici-ol /satici/dashboard /satici/basvuru-bekleyen /satici/tedarikci-kurulum /satici/vitrin /firsatlar /cok-satanlar /cok-satanlar/kategori /size-ozel /ticaret-guvencesi /olmayan-sayfa-404 /urun/blue-black-check-shirt-toptan-tekstil-pamuklu-premium-kumas-ozel-uretim-imkani /kategori/bileklik-0001eaaf /marka/ali-giyim /magaza/DEMO-001 /magaza/DEMO-001/dukkan /pages/dashboard/notification-preferences.html /pages/dashboard/return-request.html /pages/dashboard/returns.html /pages/dashboard/shipment-tracking.html /pages/dashboard/kyc.html /pages/seller/seller-shop.html /pages/seller/shipment.html /pages/media-watch.html /pages/brand.html /pages/product-detail.html`
    .trim()
    .split(/\s+/);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
// Frappe cookie login (Administrator)
const r = await page.request.post(`${BASE}/api/method/login`, {
  form: { usr: process.env.AUDIT_USER ?? "Administrator", pwd: process.env.AUDIT_PASS ?? "admin" },
});
console.log("login:", r.status());
const out = [];
for (const path of STATIC) {
  const url = BASE + path;
  let err = null;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
  } catch (e) {
    err = String(e.message).slice(0, 60);
  }
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => {
      const r = h.getBoundingClientRect();
      const cs = getComputedStyle(h);
      const visible =
        !!(h.offsetParent || cs.position === "fixed") &&
        cs.visibility !== "hidden" &&
        (r.width > 0 || r.height > 0);
      const sr = h.classList.contains("sr-only");
      return {
        tag: h.tagName.toLowerCase(),
        level: +h.tagName[1],
        text: (h.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50),
        visible: visible || sr,
      };
    });
    return { title: document.title, hs };
  });
  const issues = [];
  const h1s = data.hs.filter((h) => h.level === 1);
  if (h1s.length === 0) issues.push("H1 YOK");
  if (h1s.length > 1) issues.push(`${h1s.length} adet H1`);
  if (data.hs.length && data.hs[0].level !== 1) issues.push(`ilk başlık ${data.hs[0].tag}`);
  let prev = 0;
  data.hs.forEach((h, i) => {
    if (h.level > prev + 1 && prev > 0)
      issues.push(`${data.hs[i - 1].tag}→${h.tag} "${h.text.slice(0, 30)}"`);
    if (h.level > prev + 1 && prev === 0) issues.push(`başta ${h.tag} "${h.text.slice(0, 30)}"`);
    prev = h.level;
  });
  out.push({
    path,
    finalUrl: page.url().replace(BASE, ""),
    err,
    count: data.hs.length,
    issues,
    hs: data.hs,
  });
  console.log(
    `${issues.length ? "✗" : "✓"} ${path}${page.url().replace(BASE, "") !== path ? " → " + page.url().replace(BASE, "") : ""} [${data.hs.length}] ${issues.join(" | ")}`
  );
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
process.exitCode = out.some((r) => r.issues.length) ? 1 : 0;
await browser.close();
