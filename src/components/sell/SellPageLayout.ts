/**
 * SellPageLayout — "Fabrikanı tüm dünyaya aç" üretici landing'i
 *
 * Referans: docs/satıcıtablo/A _ Klasik split + checkout (2)/seller-sections.jsx + seller.css
 *
 * Bölümler:
 *   1. HeroSection      Klasik split (sol metin + sağ foto)
 *   2. PricingSection   4 paket + yıllık/aylık toggle + detaylı matris
 *   3. ComparisonSection iSTOC vs diğer pazaryerleri
 *   4. FinalCtaSection  "Başvuru 4 dakikada biter."
 *
 * Stil: Tailwind v4 utility-first, hex değerleri referans seller.css token'larından
 *   --brand=#f5b800  --brand-700=#d39c00  --brand-50=#fff8e1
 *   --bg=#f7f7f5     --surface=#ffffff    --surface-2=#fafaf8
 *   --border=#e8e6e0 --border-strong=#d5d2c9
 *   --text=#1a1a1a   --text-2=#4a4a48     --muted=#8a877f
 *   --ok=#1f7a4d     --warn=#b54708       --danger=#b42318
 *
 * State: Pricing toggle için inline Alpine x-data.
 */

import heroImg from "../../assets/images/liman.avif";

const SELL_HREF = "/pages/auth/register.html?type=supplier";
// Section sarmal: header/footer ile aynı dış genişlik — `container-boxed` (max 1840px).
// Inner sınır: 1500px max, mx-auto. 4 section'da ortak ki içerikler simetrik / hizalı dursun.
const WRAP_CLS = "container-boxed";
const INNER_CLS = "max-w-[1500px] mx-auto";

// ---------- SVG ikonları ----------
const SVG_ARROW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
const SVG_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const SVG_CHECK_MD = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const SVG_X = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
const SVG_DASH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 12h12"/></svg>`;
// ---------- Paylaşılan class'lar ----------
const EYEBROW_CLS =
  "inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#d39c00] " +
  "before:content-[''] before:inline-block before:w-[18px] before:h-px before:bg-[#d39c00]";

const SECTION_HEAD_CLS = "flex flex-col gap-3.5 mb-12 max-w-[56ch]";
const SECTION_H2_CLS = "text-4xl md:text-[44px] lg:text-5xl leading-[1.05] tracking-[-0.025em] font-semibold text-[#1a1a1a] m-0";
const SECTION_P_CLS = "text-base md:text-[17px] text-[#4a4a48] leading-[1.45] m-0";

// CTA'lar sistemin `th-btn` / `th-btn-outline` class'larını kullanır — remote theme
// admin panelden tek yerden yönetir; iki butonun padding/font'u zaten birebir eşit.
// `.th-btn-lg` modifikatörü hero/final CTA gibi büyük alanlar için 1.3x boyut verir.

// =====================================================
// 1. HERO — Klasik split
// =====================================================
function HeroSection(): string {
  return /* html */ `
    <section class="bg-[#f7f7f5] pt-12 md:pt-16 pb-12 md:pb-16">
      <div class="${WRAP_CLS}">
        <div class="${INNER_CLS} grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 lg:items-stretch items-center">
          <div class="w-full">
            <span class="${EYEBROW_CLS}">Üretici platformu</span>
            <h1 class="text-[36px] sm:text-[44px] lg:text-[56px] leading-[1.04] tracking-[-0.025em] font-semibold mt-[18px] mb-[18px] max-w-[14ch] text-[#1a1a1a]">
              Fabrikanı tüm dünyaya aç.
            </h1>
            <p class="text-base md:text-lg leading-[1.45] text-[#4a4a48] max-w-[42ch] mb-7">
              iSTOC, Türkiye'deki üreticileri dünyanın dört bir yanındaki B2B alıcılarıyla aracısız buluşturur.
              Listele, sat, kargola — komisyon yok.
            </p>
            <div class="flex flex-wrap gap-3 items-center">
              <a href="${SELL_HREF}" data-seller-cta class="th-btn th-btn-lg">
                Satıcı başvurusu yap ${SVG_ARROW}
              </a>
              <a href="#paketler" class="th-btn-outline th-btn-lg">Nasıl çalışır?</a>
            </div>
          </div>
          <div class="relative w-full lg:max-w-[720px] xl:max-w-[800px] 2xl:max-w-[860px] lg:mr-auto lg:h-full">
            <div class="relative w-full aspect-[5/4] lg:aspect-auto lg:h-full lg:min-h-[360px] rounded-2xl overflow-hidden border border-[#e8e6e0] bg-[#f0ead8] shadow-[0_8px_24px_-12px_rgba(20,20,18,0.18),0_4px_8px_-4px_rgba(20,20,18,0.08)]">
              <img
                src="${heroImg}"
                alt="Türkiye'den dünyaya ihracat: liman ve konteyner lojistiği"
                class="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// =====================================================
// 2. PRICING — 4 paket + toggle + matrix
// =====================================================
type Tier = {
  id: string;
  tag: string;
  name: string;
  sub: string;
  priceY: number | null;
  priceM: number | null;
  featured?: boolean;
  badge?: string;
  strip: Array<{ l: string; v: string }>;
  ctaLabel: string;
  feat: Array<{ ok: boolean; t: string }>;
};

const TIERS: Tier[] = [
  {
    id: "starter",
    tag: "01 · Başlangıç",
    name: "Starter",
    sub: "Avrupa pazarına ilk adımını atan küçük üreticiler için.",
    priceY: 399,
    priceM: 39,
    strip: [
      { l: "Komisyon", v: "%8" },
      { l: "Aktif ürün", v: "50" },
    ],
    ctaLabel: "Starter ile başla",
    feat: [
      { ok: true, t: "Doğrulanmış üretici rozeti" },
      { ok: true, t: "Standart vitrin (TR + EN)" },
      { ok: true, t: "Temel satış raporları" },
      { ok: true, t: "Email destek" },
      { ok: true, t: "Ödeme güvencesi dahil" },
      { ok: false, t: "Öne çıkan listeleme" },
      { ok: false, t: "Hesap yöneticisi" },
    ],
  },
  {
    id: "pro",
    tag: "02 · Büyüyen",
    name: "Professional",
    sub: "Düzenli sipariş alan, büyümek isteyen üreticilerin ana paketi.",
    priceY: 499,
    priceM: 49,
    featured: true,
    badge: "En popüler",
    strip: [
      { l: "Komisyon", v: "%6" },
      { l: "Aktif ürün", v: "500" },
    ],
    ctaLabel: "Professional seç",
    feat: [
      { ok: true, t: "Gümüş üretici rozeti" },
      { ok: true, t: "Premium vitrin · özel banner" },
      { ok: true, t: "4 dilli vitrin (TR · EN · DE · FR)" },
      { ok: true, t: "Gelişmiş analitik + ihracat raporu" },
      { ok: true, t: "Öncelikli destek · 8 saat içinde" },
      { ok: true, t: "5 öne çıkan listeleme / ay" },
      { ok: true, t: "Reklam kredisi €100 / ay" },
      { ok: true, t: "3 ekip kullanıcısı" },
    ],
  },
  {
    id: "business",
    tag: "03 · Ölçeklenen",
    name: "Business",
    sub: "Geniş katalog ve düzenli ihracat hacmi olan üreticiler.",
    priceY: 599,
    priceM: 59,
    strip: [
      { l: "Komisyon", v: "%4" },
      { l: "Aktif ürün", v: "2.000" },
    ],
    ctaLabel: "Business ile başla",
    feat: [
      { ok: true, t: "Altın üretici rozeti + arama önceliği" },
      { ok: true, t: "Premium+ vitrin · video & 360°" },
      { ok: true, t: "6 dilli vitrin (+ IT · ES)" },
      { ok: true, t: "Tam analitik + tahmin paneli" },
      { ok: true, t: "Atanmış hesap yöneticisi" },
      { ok: true, t: "20 öne çıkan listeleme / ay" },
      { ok: true, t: "Reklam kredisi €300 / ay" },
      { ok: true, t: "10 ekip kullanıcısı · Fuar daveti" },
    ],
  },
  {
    id: "ent",
    tag: "04 · Kurumsal",
    name: "Enterprise",
    sub: "Çok tesisli üretici ve markalar için özel çözüm.",
    priceY: null,
    priceM: null,
    strip: [
      { l: "Komisyon", v: "Özel" },
      { l: "Aktif ürün", v: "Sınırsız" },
    ],
    ctaLabel: "Satışla konuş",
    feat: [
      { ok: true, t: "Platinum rozet · anasayfa yerleşimi" },
      { ok: true, t: "Tam özel vitrin · alt domain" },
      { ok: true, t: "15+ dil · çeviri editorial dahil" },
      { ok: true, t: "BI tabloları + özel rapor SLA" },
      { ok: true, t: "7/24 dedicated ekip" },
      { ok: true, t: "Sınırsız öne çıkan listeleme" },
      { ok: true, t: "API erişimi + ERP entegrasyonu" },
      { ok: true, t: "Sınırsız ekip · Özel ödeme koşulları" },
    ],
  },
];

function PricingCard(t: Tier): string {
  const isFeat = !!t.featured;
  const hasPrice = t.priceY != null && t.priceM != null;

  const cardCls = isFeat
    ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[0_10px_30px_-10px_rgba(213,156,0,0.35)]"
    : "bg-white text-[#1a1a1a] border-[#e8e6e0] hover:border-[#d5d2c9] hover:shadow-[0_2px_6px_rgba(20,20,18,0.06)] hover:-translate-y-0.5";

  const tagCls = isFeat ? "text-white/65" : "text-[#8a877f]";
  const nameCls = isFeat ? "text-[#f5b800]" : "text-[#1a1a1a]";
  const subCls = isFeat ? "text-white/65" : "text-[#4a4a48]";
  const amountCls = isFeat ? "text-white" : "text-[#1a1a1a]";
  const perCls = isFeat ? "text-white/65" : "text-[#8a877f]";
  const metaCls = isFeat ? "text-white/65" : "text-[#8a877f]";
  const stripCls = isFeat
    ? "bg-white/[0.06] border-white/10"
    : "bg-[#fafaf8] border-[#e8e6e0]";
  const stripL = isFeat ? "text-white/55" : "text-[#8a877f]";
  const stripV = isFeat ? "text-white" : "text-[#1a1a1a]";
  // Featured kart koyu zemin → th-btn (sarı dolgu kontrast yaratır)
  // Diğer kartlar açık zemin → th-btn-outline (sarı çerçeve)
  // Her ikisi th-btn-block ile kart genişliğine yayılır.
  const ctaCls = isFeat ? "th-btn th-btn-block" : "th-btn-outline th-btn-block";
  const dividerCls = isFeat ? "bg-white/10" : "bg-[#e8e6e0]";
  const featHeadCls = isFeat ? "text-white/55" : "text-[#8a877f]";
  const featLiCls = isFeat ? "text-white/85" : "text-[#4a4a48]";
  const checkCls = isFeat ? "text-[#f5b800]" : "text-[#1f7a4d]";
  const xCls = isFeat
    ? "text-white/35"
    : "text-[#d5d2c9]";
  const noLineCls = isFeat
    ? "text-white/40 line-through decoration-white/30"
    : "text-[#8a877f] line-through decoration-[#d5d2c9]";

  return /* html */ `
    <div class="relative flex flex-col gap-3.5 rounded-2xl border p-[26px_22px_22px] transition-[border-color,box-shadow,transform] duration-150 ${cardCls}">
      ${
        t.badge
          ? `<span class="absolute -top-2.5 left-[22px] bg-[#f5b800] text-[#1a1a1a] text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-[#d39c00]">${t.badge}</span>`
          : ""
      }
      <span class="text-[11px] font-semibold uppercase tracking-[0.1em] ${tagCls}">${t.tag}</span>
      <div class="text-[22px] font-semibold tracking-[-0.01em] -mt-1 ${nameCls}">${t.name}</div>
      <div class="text-[13px] leading-[1.4] min-h-[36px] ${subCls}">${t.sub}</div>

      <div class="flex items-baseline gap-1.5 mt-1.5">
        ${
          hasPrice
            ? `<span class="text-[42px] font-semibold tracking-[-0.03em] tabular-nums leading-none ${amountCls}">
                €<span x-text="yearly ? '${t.priceY}' : '${t.priceM}'">${t.priceY}</span>
              </span>
              <span class="text-[13px] ${perCls}">/ <span x-text="yearly ? 'yıl' : 'ay'">yıl</span></span>`
            : `<span class="text-[32px] font-semibold tracking-[-0.03em] leading-none ${amountCls}">Özel teklif</span>`
        }
      </div>
      <div class="text-[11.5px] -mt-1 ${metaCls}">
        ${
          hasPrice
            ? `<span x-text="yearly ? 'yıllık peşin · KDV hariç' : 'aylık · istediğin zaman iptal'">yıllık peşin · KDV hariç</span>`
            : "hacme göre fiyatlandırılır"
        }
      </div>

      <div class="grid grid-cols-2 gap-2 p-3 rounded-[10px] border ${stripCls}">
        ${t.strip
          .map(
            (s) => `
          <div>
            <div class="text-[10px] uppercase tracking-[0.06em] ${stripL}">${s.l}</div>
            <div class="text-sm font-semibold tabular-nums mt-0.5 ${stripV}">${s.v}</div>
          </div>
        `,
          )
          .join("")}
      </div>

      <a href="${SELL_HREF}" data-seller-cta class="${ctaCls} mt-0.5">
        ${t.ctaLabel} ${SVG_ARROW}
      </a>

      <div class="h-px my-1 ${dividerCls}"></div>
      <div class="text-[11px] font-semibold uppercase tracking-[0.06em] ${featHeadCls}">Paket içeriği</div>
      <ul class="list-none p-0 m-0 flex flex-col gap-2 text-[13px] flex-1">
        ${t.feat
          .map(
            (f) => `
          <li class="flex items-start gap-2.5 leading-[1.4] ${f.ok ? featLiCls : noLineCls}">
            <span class="shrink-0 mt-0.5 ${f.ok ? checkCls : xCls}">${f.ok ? SVG_CHECK : SVG_X}</span>
            <span>${f.t}</span>
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;
}

// ---------- Matrix (detaylı özellik tablosu) ----------
type MatrixCell = { type: "yes" } | { type: "no" } | { type: "text"; v: string };
type MatrixRow = { f: string; help?: string; v: [MatrixCell, MatrixCell, MatrixCell, MatrixCell] };
type MatrixSection = { title: string; rows: MatrixRow[] };

const yes: MatrixCell = { type: "yes" };
const no: MatrixCell = { type: "no" };
const txt = (v: string): MatrixCell => ({ type: "text", v });

const MATRIX_SECTIONS: MatrixSection[] = [
  {
    title: "Komisyon & limitler",
    rows: [
      { f: "Satış komisyonu", help: "Tamamlanan siparişler üzerinden", v: [txt("%8"), txt("%6"), txt("%4"), txt("Özel")] },
      { f: "Aktif ürün limiti", v: [txt("50"), txt("500"), txt("2.000"), txt("Sınırsız")] },
      { f: "Numune satışı", v: [yes, yes, yes, yes] },
      { f: "Toplu yükleme (CSV)", v: [yes, yes, yes, yes] },
    ],
  },
  {
    title: "Vitrin & sergileme",
    rows: [
      { f: "Üretici rozeti", v: [txt("Standart"), txt("Gümüş"), txt("Altın"), txt("Platinum")] },
      { f: "Vitrin tipi", v: [txt("Standart"), txt("Premium"), txt("Premium+"), txt("Tam özel")] },
      { f: "Çoklu dil", v: [txt("2 dil"), txt("4 dil"), txt("6 dil"), txt("15+ dil")] },
      { f: "Video & 360° ürün medya", v: [no, no, yes, yes] },
      { f: "Öne çıkan listeleme / ay", v: [txt("—"), txt("5"), txt("20"), txt("Sınırsız")] },
    ],
  },
  {
    title: "Destek & operasyon",
    rows: [
      { f: "Destek", v: [txt("Email"), txt("Öncelikli"), txt("Hesap yön."), txt("7/24 dedicated")] },
      { f: "Ekip kullanıcısı", v: [txt("1"), txt("3"), txt("10"), txt("Sınırsız")] },
      { f: "Reklam kredisi / ay", v: [txt("—"), txt("€100"), txt("€300"), txt("Özel")] },
      { f: "KDV iadesi danışmanlığı", v: [yes, yes, yes, yes] },
      { f: "Sigortalı kargo dahil", v: [yes, yes, yes, yes] },
      { f: "Fuar / etkinlik daveti", v: [no, no, yes, yes] },
    ],
  },
  {
    title: "Kurumsal",
    rows: [
      { f: "API erişimi", help: "Sipariş, stok, fiyat eşitleme", v: [no, txt("Limitli"), txt("Tam"), txt("Özel SLA")] },
      { f: "ERP / muhasebe entegrasyonu", v: [no, no, txt("Beta"), yes] },
      { f: "Özel ödeme koşulları", v: [no, no, no, yes] },
      { f: "Alt domain (markaniz.istoc.com)", v: [no, no, no, yes] },
    ],
  },
];

function renderMatrixCell(c: MatrixCell): string {
  if (c.type === "yes") return `<span class="inline-flex text-[#1f7a4d]">${SVG_CHECK_MD}</span>`;
  if (c.type === "no") return `<span class="inline-flex text-[#d5d2c9]">${SVG_DASH}</span>`;
  return c.v;
}

const MATRIX_GRID_CLS = "grid grid-cols-[1.6fr_repeat(4,1fr)] gap-3 items-center";

function PricingMatrix(): string {
  const cols = [
    { n: "Starter", p: "€399 / yıl" },
    { n: "Professional", p: "€499 / yıl", featured: true },
    { n: "Business", p: "€599 / yıl" },
    { n: "Enterprise", p: "Özel teklif" },
  ];

  return /* html */ `
    <div class="mt-14 bg-white border border-[#e8e6e0] rounded-2xl overflow-hidden hidden lg:block">
      <div class="${MATRIX_GRID_CLS} items-end px-6 py-[18px] bg-[#fafaf8] border-b border-[#d5d2c9]">
        <div class="text-left">
          <div class="text-[15px] font-semibold text-[#1a1a1a]">Tüm paket özellikleri</div>
          <div class="text-xs text-[#8a877f] mt-0.5 tabular-nums">yıllık periyot, KDV hariç</div>
        </div>
        ${cols
          .map(
            (c) => `
          <div class="text-center ${c.featured ? "bg-[#fff8e1] rounded-lg px-2 py-2.5 -mx-1 -my-2.5" : ""}">
            <div class="text-[15px] font-semibold ${c.featured ? "text-[#d39c00]" : "text-[#1a1a1a]"}">${c.n}</div>
            <div class="text-xs text-[#8a877f] mt-0.5 tabular-nums">${c.p}</div>
          </div>
        `,
          )
          .join("")}
      </div>

      ${MATRIX_SECTIONS.map(
        (sec) => `
        <div>
          <div class="px-6 pt-3.5 pb-2 bg-[#fafaf8] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a877f] border-b border-[#e8e6e0]">
            ${sec.title}
          </div>
          ${sec.rows
            .map(
              (r) => `
            <div class="${MATRIX_GRID_CLS} px-6 py-3.5 border-b border-[#e8e6e0] last:border-b-0 text-[13px]">
              <div>
                <div class="text-[#1a1a1a] font-medium">${r.f}</div>
                ${r.help ? `<div class="text-[11px] text-[#8a877f] mt-0.5 font-normal">${r.help}</div>` : ""}
              </div>
              ${r.v
                .map(
                  (c, j) => `
                <div class="text-center text-[#4a4a48] ${
                  j === 1
                    ? "bg-[rgba(245,184,0,0.06)] font-semibold text-[#1a1a1a] -mx-1 -my-3.5 px-1 py-3.5 flex items-center justify-center"
                    : ""
                }">
                  ${renderMatrixCell(c)}
                </div>
              `,
                )
                .join("")}
            </div>
          `,
            )
            .join("")}
        </div>
      `,
      ).join("")}
    </div>
  `;
}

function PricingSection(): string {
  return /* html */ `
    <section id="paketler" class="py-16 md:py-24 border-t border-[#e8e6e0] bg-[#f7f7f5]" x-data="{ yearly: true }">
      <div class="${WRAP_CLS}">
        <div class="${INNER_CLS}">
        <div class="${SECTION_HEAD_CLS}">
          <span class="${EYEBROW_CLS}">Satıcı paketleri</span>
          <h2 class="${SECTION_H2_CLS}">Hangi ölçekteysen, o paketi seç.</h2>
          <p class="${SECTION_P_CLS}">
            Tüm paketler aynı işi yapar: senin ürününü Avrupa'lı alıcıya ulaştırır.
            Üst paketler komisyonu düşürür, vitrini büyütür, destek seviyesini artırır.
          </p>
        </div>

        <div class="inline-flex bg-white border border-[#e8e6e0] rounded-full p-1 mb-8" role="tablist" aria-label="Periyot">
          <button
            type="button"
            role="tab"
            @click="yearly = true"
            :aria-selected="yearly"
            :class="yearly ? 'bg-[#1a1a1a] text-white' : 'bg-transparent text-[#8a877f]'"
            class="appearance-none border-0 text-[12.5px] font-medium px-4 py-2 rounded-full focus:outline-none transition-colors duration-150"
          >
            Yıllık
            <span class="text-[10px] bg-[#f5b800] text-[#1a1a1a] px-1.5 py-0.5 rounded-full font-bold ml-1.5 tracking-[0.04em]">2 ay bedava</span>
          </button>
          <button
            type="button"
            role="tab"
            @click="yearly = false"
            :aria-selected="!yearly"
            :class="!yearly ? 'bg-[#1a1a1a] text-white' : 'bg-transparent text-[#8a877f]'"
            class="appearance-none border-0 text-[12.5px] font-medium px-4 py-2 rounded-full focus:outline-none transition-colors duration-150"
          >
            Aylık
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
          ${TIERS.map(PricingCard).join("")}
        </div>

        ${PricingMatrix()}
        </div>
      </div>
    </section>
  `;
}

// =====================================================
// 3. COMPARISON — Diğer pazaryerlerine göre iSTOC
// =====================================================
type CompareCell = string | { type: "icon"; v: "yes" | "no" | "mid"; label?: string };
type CompareRow = { f: string; i: CompareCell; g: CompareCell; h: CompareCell };

const COMPARE_ROWS: CompareRow[] = [
  { f: "Komisyon oranı", i: "%4 — %8", g: "%15+", h: "Değişken %12–30" },
  { f: "Aylık üyelik", i: { type: "icon", v: "no", label: "Yok" }, g: "€40/ay", h: "€39/ay" },
  {
    f: "Listeleme ücreti",
    i: { type: "icon", v: "no", label: "Yok" },
    g: { type: "icon", v: "no", label: "Yok" },
    h: "Ürün başı ücret",
  },
  { f: "Ödeme süresi", i: "7 gün", g: "14 — 30 gün", h: "14 — 21 gün" },
  {
    f: "B2B / toptan odaklı",
    i: { type: "icon", v: "yes" },
    g: { type: "icon", v: "mid", label: "Karma" },
    h: { type: "icon", v: "no" },
  },
  {
    f: "Türkiye üreticisine özel destek",
    i: { type: "icon", v: "yes" },
    g: { type: "icon", v: "no" },
    h: { type: "icon", v: "no" },
  },
  {
    f: "KDV iadesi danışmanlığı",
    i: { type: "icon", v: "yes" },
    g: { type: "icon", v: "no" },
    h: { type: "icon", v: "no" },
  },
  {
    f: "Sigortalı kargo dahil",
    i: { type: "icon", v: "yes" },
    g: { type: "icon", v: "mid", label: "Ek ücret" },
    h: { type: "icon", v: "mid", label: "Ek ücret" },
  },
  {
    f: "Numune satışı",
    i: { type: "icon", v: "yes" },
    g: { type: "icon", v: "no" },
    h: { type: "icon", v: "mid", label: "Kısıtlı" },
  },
];

function renderCompareCell(c: CompareCell): string {
  if (typeof c === "string") return c;
  const labelHtml = c.label ? `<span class="text-[#8a877f] text-[12.5px]">${c.label}</span>` : "";
  if (c.v === "yes") return `<span class="inline-flex items-center justify-center text-[#1f7a4d]">${SVG_CHECK_MD}</span>`;
  if (c.v === "no")
    return `<span class="inline-flex items-center gap-1.5"><span class="text-[#b42318]/55">${SVG_X}</span>${labelHtml}</span>`;
  return `<span class="inline-flex items-center gap-1.5"><span class="text-[#b54708]">${SVG_DASH}</span>${labelHtml}</span>`;
}

function ComparisonSection(): string {
  const thBaseCls = "bg-[#fafaf8] font-medium text-[13px] text-[#4a4a48] p-[18px_22px] text-left";
  const thHeadCls = "text-[#1a1a1a] text-center p-[22px] border-b border-[#d5d2c9]";

  return /* html */ `
    <section id="karsilastirma" class="py-16 md:py-24 bg-[#fafaf8] border-t border-b border-[#e8e6e0]">
      <div class="${WRAP_CLS}">
        <div class="${INNER_CLS}">
        <div class="${SECTION_HEAD_CLS}">
          <span class="${EYEBROW_CLS}">Karşılaştırma</span>
          <h2 class="${SECTION_H2_CLS}">Diğer pazaryerlerine göre iSTOC.</h2>
          <p class="${SECTION_P_CLS}">
            Üretici penceresinden bakınca fark net görünüyor: daha düşük komisyon,
            sabit aidat yok, B2B'ye odaklı süreç.
          </p>
        </div>

        <div class="overflow-x-auto rounded-2xl">
          <table class="w-full border-separate border-spacing-0 bg-white border border-[#e8e6e0] rounded-2xl overflow-hidden min-w-[640px]">
            <thead>
              <tr>
                <th class="${thBaseCls} w-[28%] border-b border-[#d5d2c9]"></th>
                <th class="bg-[#fff8e1] ${thHeadCls}">
                  <span class="block text-base font-semibold mb-0.5 text-[#d39c00]">iSTOC</span>
                  <span class="text-[11px] uppercase tracking-[0.06em] font-medium text-[#d39c00]">Üretici platformu</span>
                </th>
                <th class="bg-white ${thHeadCls}">
                  <span class="block text-base font-semibold mb-0.5">Global B2B pazaryeri</span>
                  <span class="text-[11px] uppercase tracking-[0.06em] font-medium text-[#8a877f]">Uluslararası genel</span>
                </th>
                <th class="bg-white ${thHeadCls}">
                  <span class="block text-base font-semibold mb-0.5">Yatay e-ticaret</span>
                  <span class="text-[11px] uppercase tracking-[0.06em] font-medium text-[#8a877f]">B2C ağırlıklı</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${COMPARE_ROWS.map((r, i) => {
                const last = i === COMPARE_ROWS.length - 1;
                const border = last ? "" : "border-b border-[#e8e6e0]";
                return `
                <tr>
                  <th class="${thBaseCls} w-[28%] ${border}">${r.f}</th>
                  <td class="bg-[rgba(245,184,0,0.05)] text-[#1a1a1a] font-semibold text-[13.5px] text-center p-[18px_22px] ${border}">${renderCompareCell(r.i)}</td>
                  <td class="text-[#4a4a48] text-[13.5px] text-center p-[18px_22px] ${border}">${renderCompareCell(r.g)}</td>
                  <td class="text-[#4a4a48] text-[13.5px] text-center p-[18px_22px] ${border}">${renderCompareCell(r.h)}</td>
                </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>

        <div class="mt-7 flex flex-wrap justify-between items-center gap-4">
          <p class="text-xs text-[#8a877f] max-w-[60ch] m-0">
            * Rakip oranları kamuya açık fiyatlandırma sayfalarından alınmıştır (Mayıs 2026).
            iSTOC komisyonu kategori bazlıdır; tam liste başvuru sonrası paylaşılır.
          </p>
          <a href="${SELL_HREF}" data-seller-cta class="th-btn">
            Başvuruyu başlat ${SVG_ARROW}
          </a>
        </div>
        </div>
      </div>
    </section>
  `;
}

// =====================================================
// 4. FINAL CTA — "Başvuru 4 dakikada biter."
// =====================================================
function FinalCtaSection(): string {
  return /* html */ `
    <section class="pt-16 md:pt-20 pb-20 md:pb-24 bg-[#f7f7f5] text-center">
      <div class="${WRAP_CLS}">
        <div class="${INNER_CLS}">
        <h2 class="text-[34px] sm:text-[38px] md:text-[42px] tracking-[-0.025em] leading-[1.1] font-semibold max-w-[22ch] mx-auto mb-3.5 text-[#1a1a1a]">
          Başvuru 4 dakikada biter.
        </h2>
        <p class="text-base text-[#4a4a48] mx-auto mb-6 max-w-[52ch]">
          Vergi numarası, üretim kategorisi ve bir iletişim — gerisini birlikte hallederiz.
          Onay süresi ortalama 2 iş günü.
        </p>
        <div class="inline-flex flex-wrap gap-3 justify-center">
          <a href="${SELL_HREF}" data-seller-cta class="th-btn th-btn-lg">
            Satıcı başvurusu yap ${SVG_ARROW}
          </a>
          <a href="#karsilastirma" class="th-btn-outline th-btn-lg">Önce konuşalım</a>
        </div>
        <div class="mt-3.5 text-xs text-[#8a877f]">Başvuru ücretsiz. İptal koşulu yok.</div>
        </div>
      </div>
    </section>
  `;
}

// =====================================================
// EXPORT — Sayfa iskeleti (header/footer dışında)
// =====================================================
export function SellPageLayout(): string {
  return `
    ${HeroSection()}
    ${PricingSection()}
    ${ComparisonSection()}
    ${FinalCtaSection()}
  `;
}
