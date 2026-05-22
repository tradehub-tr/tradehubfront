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
import type { PricingPlan, PricingPlansResponse } from "../../services/pricingService";

const SELL_HREF = "/pages/auth/register.html?type=supplier";

// FAZ 4.1 — CTA aksiyonuna göre target URL
function ctaHref(action: PricingPlan["cta_action"]): string {
  switch (action) {
    case "signup":
    case "signup_billing":
      return "/pages/auth/register.html?type=supplier";
    case "contact_sales":
      return "/pages/info/contact.html?topic=enterprise";
    case "learn_more":
      return "#paketler";
    default:
      return SELL_HREF;
  }
}

// FAZ 4.1 — feature icon glyph map (backend "check"|"x"|"star"|"zap"|"info" → svg)
const SVG_STAR = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z"/></svg>`;
const SVG_ZAP = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
const SVG_INFO = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`;

function featureIcon(icon: PricingPlan["features"][number]["icon"]): string {
  switch (icon) {
    case "x":
      return SVG_X;
    case "star":
      return SVG_STAR;
    case "zap":
      return SVG_ZAP;
    case "info":
      return SVG_INFO;
    case "check":
    default:
      return SVG_CHECK;
  }
}
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
const SECTION_H2_CLS =
  "text-4xl md:text-[44px] lg:text-5xl leading-[1.05] tracking-[-0.025em] font-semibold text-[#1a1a1a] m-0";
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
// 2. PRICING — N paket (API'den dinamik) + toggle + matrix
// =====================================================
// FAZ 4.1 — Subscription Plan + Pricing Plan Feature DocType'larından gelir.
// Backend: tradehub_core.api.v1.public_pricing.get_pricing_plans
// Süper Admin Permission Console → Planlar → Düzenle ekranından yönetilir.

// Sayı formatı: "1500" → "1.500", 0 → "Sınırsız"
function fmtListings(n: number): string {
  if (!n || n <= 0) return "Sınırsız";
  return n.toLocaleString("tr-TR");
}

// Para sembolü map'i
function currencySymbol(c: string): string {
  switch ((c || "EUR").toUpperCase()) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "TRY":
      return "₺";
    case "GBP":
      return "£";
    default:
      return c;
  }
}

// "01 · Başlangıç" tag'i — display_order'a göre auto (FREE = 00 vs)
function tierTag(plan: PricingPlan, idx: number): string {
  const num = String(idx + 1).padStart(2, "0");
  return `${num} · ${plan.badge_label || plan.plan_name}`;
}

function PricingCard(plan: PricingPlan, idx: number): string {
  const isFeat = !!plan.highlighted;
  const hasPrice = (plan.yearly_price ?? 0) > 0 || (plan.monthly_price ?? 0) > 0;
  const sym = currencySymbol(plan.currency);
  const priceY = plan.yearly_price || 0;
  const priceM = plan.monthly_price || 0;
  const tag = tierTag(plan, idx);
  const badge = isFeat ? plan.badge_label || "En popüler" : null;

  const cardCls = isFeat
    ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[0_10px_30px_-10px_rgba(213,156,0,0.35)]"
    : "bg-white text-[#1a1a1a] border-[#e8e6e0] hover:border-[#d5d2c9] hover:shadow-[0_2px_6px_rgba(20,20,18,0.06)] hover:-translate-y-0.5";

  const tagCls = isFeat ? "text-white/65" : "text-[#8a877f]";
  const nameCls = isFeat ? "text-[#f5b800]" : "text-[#1a1a1a]";
  const subCls = isFeat ? "text-white/65" : "text-[#4a4a48]";
  const amountCls = isFeat ? "text-white" : "text-[#1a1a1a]";
  const perCls = isFeat ? "text-white/65" : "text-[#8a877f]";
  const metaCls = isFeat ? "text-white/65" : "text-[#8a877f]";
  const stripCls = isFeat ? "bg-white/[0.06] border-white/10" : "bg-[#fafaf8] border-[#e8e6e0]";
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
  const xCls = isFeat ? "text-white/35" : "text-[#d5d2c9]";
  const noLineCls = isFeat
    ? "text-white/40 line-through decoration-white/30"
    : "text-[#8a877f] line-through decoration-[#d5d2c9]";

  const stripRows = [
    { l: "Komisyon", v: plan.commission_rate > 0 ? `%${plan.commission_rate}` : "Özel" },
    { l: "Aktif ürün", v: fmtListings(plan.max_active_listings) },
  ];

  // CTA — seller-cta sadece signup akışları için; contact_sales kendi link'ine gitsin
  const ctaTargetHref = ctaHref(plan.cta_action);
  const isSellerSignup = plan.cta_action === "signup" || plan.cta_action === "signup_billing";
  const ctaAttr = isSellerSignup ? "data-seller-cta" : "";

  return /* html */ `
    <div class="relative flex flex-col gap-3.5 rounded-2xl border p-[26px_22px_22px] transition-[border-color,box-shadow,transform] duration-150 ${cardCls}">
      ${
        badge
          ? `<span class="absolute -top-2.5 left-[22px] bg-[#f5b800] text-[#1a1a1a] text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-[#d39c00]">${badge}</span>`
          : ""
      }
      <span class="text-[11px] font-semibold uppercase tracking-[0.1em] ${tagCls}">${tag}</span>
      <div class="text-[22px] font-semibold tracking-[-0.01em] -mt-1 ${nameCls}">${plan.plan_name}</div>
      <div class="text-[13px] leading-[1.4] min-h-[36px] ${subCls}">${plan.short_tagline || plan.description || ""}</div>

      <div class="flex items-baseline gap-1.5 mt-1.5">
        ${
          hasPrice
            ? `<span class="text-[42px] font-semibold tracking-[-0.03em] tabular-nums leading-none ${amountCls}">
                ${sym}<span x-text="yearly ? '${priceY}' : '${priceM}'">${priceY}</span>
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
        ${stripRows
          .map(
            (s) => `
          <div>
            <div class="text-[10px] uppercase tracking-[0.06em] ${stripL}">${s.l}</div>
            <div class="text-sm font-semibold tabular-nums mt-0.5 ${stripV}">${s.v}</div>
          </div>
        `
          )
          .join("")}
      </div>

      <a href="${ctaTargetHref}" ${ctaAttr} class="${ctaCls} mt-0.5">
        ${plan.cta_label || "Devam et"} ${SVG_ARROW}
      </a>

      <div class="h-px my-1 ${dividerCls}"></div>
      <div class="text-[11px] font-semibold uppercase tracking-[0.06em] ${featHeadCls}">Paket içeriği</div>
      <ul class="list-none p-0 m-0 flex flex-col gap-2 text-[13px] flex-1">
        ${plan.features
          .map((f) => {
            const ok = !f.is_disabled;
            const icon = ok ? featureIcon(f.icon) : SVG_X;
            const iconCls = ok ? checkCls : xCls;
            const liCls = ok ? featLiCls : noLineCls;
            const tip = f.tooltip ? ` title="${f.tooltip.replace(/"/g, "&quot;")}"` : "";
            return `
              <li class="flex items-start gap-2.5 leading-[1.4] ${liCls}"${tip}>
                <span class="shrink-0 mt-0.5 ${iconCls}">${icon}</span>
                <span>${f.display_text}</span>
              </li>
            `;
          })
          .join("")}
      </ul>
    </div>
  `;
}

// ---------- Matrix (detaylı özellik tablosu) ----------
type MatrixCell = { type: "yes" } | { type: "no" } | { type: "text"; v: string };
type MatrixRow = {
  f: string;
  help?: string;
  // Opsiyonel feature_key — varsa plan.features içinde aranır; bulunursa
  // plan'daki display_text / is_disabled kullanılır, yoksa `v` fallback değeri.
  feature_key?: string;
  v: [MatrixCell, MatrixCell, MatrixCell, MatrixCell];
};
type MatrixSection = { title: string; rows: MatrixRow[] };

const yes: MatrixCell = { type: "yes" };
const no: MatrixCell = { type: "no" };
const txt = (v: string): MatrixCell => ({ type: "text", v });

// "Komisyon & limitler" başlığı altındaki ilk 2 satır (Satış komisyonu, Aktif
// ürün limiti) plan kartlarındaki ile birebir uyuşmalı — bu yüzden plans'tan
// türetiliyor (bkz. buildDynamicMatrixSections). Diğer satırlar plan modelinde
// structured field değil (mesela "Numune satışı") — feature_key + fallback.
const STATIC_COMMISSION_EXTRA_ROWS: MatrixRow[] = [
  { f: "Numune satışı", feature_key: "sample_sales", v: [yes, yes, yes, yes] },
  { f: "Toplu yükleme (CSV)", feature_key: "bulk_csv_upload", v: [yes, yes, yes, yes] },
];

// Matrix detay section'ları — her satır feature_key taşıyor. Backend'de bir
// plan'ın Pricing Plan Feature child table'ında aynı feature_key varsa, o
// plan için satır değeri override edilir. Yoksa fallback `v` array kullanılır.
const MATRIX_SECTIONS: MatrixSection[] = [
  // NOTE: "Komisyon & limitler" section runtime'da `buildDynamicMatrixSections`
  // tarafından plans verisiyle önek olarak eklenir; burada **listelenmez**.
  {
    title: "Vitrin & sergileme",
    rows: [
      {
        f: "Üretici rozeti",
        feature_key: "manufacturer_badge",
        v: [txt("Standart"), txt("Gümüş"), txt("Altın"), txt("Platinum")],
      },
      {
        f: "Vitrin tipi",
        feature_key: "storefront_tier",
        v: [txt("Standart"), txt("Premium"), txt("Premium+"), txt("Tam özel")],
      },
      {
        f: "Çoklu dil",
        feature_key: "languages",
        v: [txt("2 dil"), txt("4 dil"), txt("6 dil"), txt("15+ dil")],
      },
      { f: "Video & 360° ürün medya", feature_key: "rich_media", v: [no, no, yes, yes] },
      {
        f: "Öne çıkan listeleme / ay",
        feature_key: "featured_listings",
        v: [txt("—"), txt("5"), txt("20"), txt("Sınırsız")],
      },
    ],
  },
  {
    title: "Destek & operasyon",
    rows: [
      {
        f: "Destek",
        feature_key: "support_tier",
        v: [txt("Email"), txt("Öncelikli"), txt("Hesap yön."), txt("7/24 dedicated")],
      },
      {
        f: "Ekip kullanıcısı",
        feature_key: "team_seats",
        v: [txt("1"), txt("3"), txt("10"), txt("Sınırsız")],
      },
      {
        f: "Reklam kredisi / ay",
        feature_key: "ad_credit_monthly",
        v: [txt("—"), txt("€100"), txt("€300"), txt("Özel")],
      },
      { f: "KDV iadesi danışmanlığı", feature_key: "vat_refund_advisory", v: [yes, yes, yes, yes] },
      { f: "Sigortalı kargo dahil", feature_key: "insured_shipping", v: [yes, yes, yes, yes] },
      { f: "Fuar / etkinlik daveti", feature_key: "event_invitations", v: [no, no, yes, yes] },
    ],
  },
  {
    title: "Kurumsal",
    rows: [
      {
        f: "API erişimi",
        help: "Sipariş, stok, fiyat eşitleme",
        feature_key: "api_access",
        v: [no, txt("Limitli"), txt("Tam"), txt("Özel SLA")],
      },
      {
        f: "ERP / muhasebe entegrasyonu",
        feature_key: "erp_integration",
        v: [no, no, txt("Beta"), yes],
      },
      { f: "Özel ödeme koşulları", feature_key: "custom_payment_terms", v: [no, no, no, yes] },
      {
        f: "Alt domain (markaniz.istoc.com)",
        feature_key: "custom_subdomain",
        v: [no, no, no, yes],
      },
    ],
  },
];

// feature_key bazlı resolution — plan.features'tan satırdaki kaynağı seçer.
// Öncelik sırası: plan'da matching feature varsa kullan; aksi halde fallback.
function resolveCellFromFeature(
  row: MatrixRow,
  plan: PricingPlan,
  fallbackIndex: number
): MatrixCell {
  if (!row.feature_key) return row.v[fallbackIndex];

  const f = plan.features.find((x) => x.feature_key === row.feature_key);
  if (!f) return row.v[fallbackIndex];

  if (f.is_disabled) return no;
  // display_text yoksa veya boşsa, icon "check"e göre yes/no, diğeri text
  const text = (f.display_text || "").trim();
  if (!text) {
    if (f.icon === "x") return no;
    return yes;
  }
  return txt(text);
}

function resolveRowCells(
  row: MatrixRow,
  plans: PricingPlan[]
): [MatrixCell, MatrixCell, MatrixCell, MatrixCell] {
  const four = plans.slice(0, 4);
  return four.map((p, i) => resolveCellFromFeature(row, p, i)) as [
    MatrixCell,
    MatrixCell,
    MatrixCell,
    MatrixCell,
  ];
}

function renderMatrixCell(c: MatrixCell): string {
  if (c.type === "yes") return `<span class="inline-flex text-[#1f7a4d]">${SVG_CHECK_MD}</span>`;
  if (c.type === "no") return `<span class="inline-flex text-[#d5d2c9]">${SVG_DASH}</span>`;
  return c.v;
}

// Matrix tüm section'larını plans verisinden derive eder:
//   1. "Komisyon & limitler" — commission_rate + max_active_listings doğrudan
//      plan field'larından alınır (card değerleriyle birebir aynı kaynak).
//   2. STATIC_COMMISSION_EXTRA + MATRIX_SECTIONS satırları — `feature_key`
//      taşıyanlar için plan.features içinde override aranır; bulunmazsa
//      hardcoded fallback değerleri kullanılır.
function buildDynamicMatrixSections(plans: PricingPlan[]): MatrixSection[] {
  const four = plans.slice(0, 4);
  if (four.length < 4) return MATRIX_SECTIONS;

  const commissionCells = four.map((p) =>
    p.commission_rate > 0 ? txt(`%${p.commission_rate}`) : txt("Özel")
  ) as [MatrixCell, MatrixCell, MatrixCell, MatrixCell];

  const listingsCells = four.map((p) => txt(fmtListings(p.max_active_listings))) as [
    MatrixCell,
    MatrixCell,
    MatrixCell,
    MatrixCell,
  ];

  const dynamicCommissionSection: MatrixSection = {
    title: "Komisyon & limitler",
    rows: [
      {
        f: "Satış komisyonu",
        help: "Tamamlanan siparişler üzerinden",
        v: commissionCells,
      },
      { f: "Aktif ürün limiti", v: listingsCells },
      // STATIC extra rows da feature_key resolve etsin (admin "sample_sales"
      // feature_key'i bir plan'a is_disabled=1 ile koyarsa "no" olur).
      ...STATIC_COMMISSION_EXTRA_ROWS.map((r) => ({
        ...r,
        v: resolveRowCells(r, plans),
      })),
    ],
  };

  const resolvedSections = MATRIX_SECTIONS.map((sec) => ({
    title: sec.title,
    rows: sec.rows.map((r) => ({
      ...r,
      v: resolveRowCells(r, plans),
    })),
  }));

  return [dynamicCommissionSection, ...resolvedSections];
}

const MATRIX_GRID_CLS = "grid grid-cols-[1.6fr_repeat(4,1fr)] gap-3 items-center";

function PricingMatrix(plans: PricingPlan[]): string {
  // Matrix sadece 4 sütun gösteriyor. Plan sayısı 4'ten azsa matrix'i gizle.
  // 4'ten fazlaysa ilk 4'ünü göster (admin sıraya koyduğu plan'lardan ilk 4).
  if (plans.length < 4) return "";
  const sym = currencySymbol(plans[0]?.currency || "EUR");
  const cols = plans.slice(0, 4).map((p) => ({
    n: p.plan_name,
    p:
      (p.yearly_price || 0) > 0
        ? `${sym}${p.yearly_price} / yıl`
        : (p.monthly_price || 0) > 0
          ? `${sym}${p.monthly_price} / ay`
          : "Özel teklif",
    featured: !!p.highlighted,
  }));

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
        `
          )
          .join("")}
      </div>

      ${buildDynamicMatrixSections(plans)
        .map(
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
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function PricingEmpty(): string {
  return /* html */ `
    <div class="rounded-2xl border border-[#e8e6e0] bg-white p-10 text-center text-[#4a4a48]">
      <p class="m-0 mb-2 text-base font-medium text-[#1a1a1a]">Paketler şu anda yüklenemedi.</p>
      <p class="m-0 text-sm">Bir kaç saniye sonra tekrar dener veya
        <a href="${SELL_HREF}" data-seller-cta class="text-[#d39c00] font-medium underline">başvuruyu başlat</a>.
      </p>
    </div>
  `;
}

// D4: Yıllık vs aylık indirimi gerçek fiyatlardan hesapla. En yüksek indirim
// taşıyan plan'ı baz alıp "N ay bedava" badge'i üret. Hiçbir plan'da indirim
// yoksa badge gizli (boş string döner).
function _computeYearlyDiscountBadge(plans: PricingPlan[]): string {
  let bestSavedMonths = 0;
  for (const p of plans) {
    const monthly = p.monthly_price || 0;
    const yearly = p.yearly_price || 0;
    if (monthly <= 0 || yearly <= 0) continue;
    const savedAmount = monthly * 12 - yearly;
    if (savedAmount <= 0) continue;
    const savedMonths = Math.round(savedAmount / monthly);
    if (savedMonths > bestSavedMonths) bestSavedMonths = savedMonths;
  }
  if (bestSavedMonths <= 0) return "";
  return `${bestSavedMonths} ay bedava`;
}

function PricingSection(plans: PricingPlan[]): string {
  const cards = plans.length
    ? `<div class="grid grid-cols-1 md:grid-cols-2 ${plans.length >= 4 ? "lg:grid-cols-4" : plans.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-3.5 items-stretch">
         ${plans.map((p, i) => PricingCard(p, i)).join("")}
       </div>
       ${PricingMatrix(plans)}`
    : PricingEmpty();

  const discountBadge = _computeYearlyDiscountBadge(plans);

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
            ${discountBadge ? `<span class="text-[10px] bg-[#f5b800] text-[#1a1a1a] px-1.5 py-0.5 rounded-full font-bold ml-1.5 tracking-[0.04em]">${discountBadge}</span>` : ""}
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

        ${cards}
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
  if (c.v === "yes")
    return `<span class="inline-flex items-center justify-center text-[#1f7a4d]">${SVG_CHECK_MD}</span>`;
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
// FAZ 4.1 — pricingData zorunlu: backend'den (veya cache'ten) gelir.
// Plan listesi boşsa PricingSection kendi "yüklenemedi" mesajını gösterir.
export function SellPageLayout(pricingData?: PricingPlansResponse): string {
  const plans = pricingData?.plans ?? [];
  return `
    ${HeroSection()}
    ${PricingSection(plans)}
    ${ComparisonSection()}
    ${FinalCtaSection()}
  `;
}
