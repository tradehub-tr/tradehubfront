/**
 * SellPageLayout — "Fabrikanı tüm dünyaya aç" üretici landing'i
 *
 * Referans: docs/satıcıtablo/A _ Klasik split + checkout (2)/seller-sections.jsx + seller.css
 *
 * Bölümler:
 *   1. HeroSection      Klasik split (sol metin + sağ foto)
 *   2. PricingSection   3 paket + yıllık/aylık toggle + detaylı matris
 *   3. FinalCtaSection  "Başvuru 4 dakikada biter."
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
import { escapeHtml } from "../../utils/sanitize";
import { t } from "../../i18n";
import type {
  PricingPlan,
  PricingPlansResponse,
  PricingFeaturesMatrix,
  PricingMatrixCell,
  TrialConfig,
} from "../../services/pricingService";

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
            <span class="${EYEBROW_CLS}">${t("sellPage.manufacturerPlatform")}</span>
            <h1 class="text-[36px] sm:text-[44px] lg:text-[56px] leading-[1.04] tracking-[-0.025em] font-semibold mt-[18px] mb-[18px] max-w-[14ch] text-[#1a1a1a]">
              ${t("sellPage.heroTitle")}
            </h1>
            <p class="text-base md:text-lg leading-[1.45] text-[#4a4a48] max-w-[42ch] mb-7">
              ${t("sellPage.heroSubtitle")}
            </p>
            <div class="flex flex-wrap gap-3 items-center">
              <a href="${SELL_HREF}" data-seller-cta class="th-btn th-btn-lg">
                ${t("sellPage.applyAsSeller")} ${SVG_ARROW}
              </a>
              <a href="#paketler" class="th-btn-outline th-btn-lg">${t("sellPage.howItWorks")}</a>
            </div>
          </div>
          <div class="relative w-full lg:max-w-[720px] xl:max-w-[800px] 2xl:max-w-[860px] lg:me-auto lg:h-full">
            <div class="relative w-full aspect-[5/4] lg:aspect-auto lg:h-full lg:min-h-[360px] rounded-2xl overflow-hidden border border-[#e8e6e0] bg-[#f0ead8] shadow-[0_8px_24px_-12px_rgba(20,20,18,0.18),0_4px_8px_-4px_rgba(20,20,18,0.08)]">
              <img
                src="${heroImg}"
                alt="${t("sellPage.heroImageAlt")}"
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
  if (!n || n <= 0) return t("sellPage.unlimited");
  return n.toLocaleString("tr-TR");
}

// Komisyon etiketi: her zaman gerçek oran gösterilir (0 → "%0"). Admin komisyonu
// kaç yazdıysa kartta da o görünür — "Özel" yazılmaz (Enterprise dahil).
function commissionLabel(plan: PricingPlan): string {
  return `%${plan.commission_rate || 0}`;
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

// Per-kart "Paket içeriği" özet listesi — SADECE plana dahil (✓) VE admin'de
// "Kartta Göster" işaretli feature'lar gösterilir. İşaretli hiç feature yoksa
// liste boş kalır (fallback YOK) — kart içeriği tamamen admin seçimine bağlı.
function cardFeatures(plan: PricingPlan): PricingPlan["features"] {
  // Ortak set: show_on_card=1 olanların hepsi; pakette dahil değilse (is_disabled)
  // ✗ + üstü çizili gösterilir (klasik karşılaştırma — tüm kartlar eşit uzunluk).
  return plan.features.filter((f) => f.show_on_card);
}

function PricingCard(
  plan: PricingPlan,
  idx: number,
  trial?: TrialConfig
): string {
  const isFeat = !!plan.highlighted;
  const hasPrice = (plan.yearly_price ?? 0) > 0 || (plan.monthly_price ?? 0) > 0;
  // Admin'den girilen "fiyat yerine metin" — doluysa fiyatın yerini alır (ör. "Özel teklif").
  const overrideLabel = (plan.price_override_label || "").trim();
  const sym = currencySymbol(plan.currency);
  const priceY = plan.yearly_price || 0;
  const priceM = plan.monthly_price || 0;
  const tag = tierTag(plan, idx);
  const badge = isFeat ? plan.badge_label || t("sellPage.mostPopular") : null;

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
    { l: t("sellPage.commission"), v: commissionLabel(plan) },
    { l: t("sellPage.activeProduct"), v: fmtListings(plan.max_active_listings) },
  ];

  // CTA — seller-cta sadece signup akışları için; contact_sales kendi link'ine gitsin
  const ctaTargetHref = ctaHref(plan.cta_action);
  const isSellerSignup = plan.cta_action === "signup" || plan.cta_action === "signup_billing";
  const ctaAttr = isSellerSignup ? "data-seller-cta" : "";

  return /* html */ `
    <div class="relative flex flex-col gap-3.5 rounded-2xl border p-[26px_22px_22px] transition-[border-color,box-shadow,transform] duration-150 ${cardCls}">
      ${
        badge
          ? `<span class="absolute -top-2.5 start-[22px] bg-[#f5b800] text-[#1a1a1a] text-[10.5px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border border-[#d39c00]">${escapeHtml(badge)}</span>`
          : ""
      }
      <span class="text-[11px] font-semibold uppercase tracking-[0.1em] ${tagCls}">${escapeHtml(tag)}</span>
      <div class="text-[22px] font-semibold tracking-[-0.01em] -mt-1 ${nameCls}">${escapeHtml(plan.plan_name)}</div>
      <div class="text-[13px] leading-[1.4] min-h-[36px] ${subCls}">${escapeHtml(plan.short_tagline || plan.description || "")}</div>

      <div class="flex items-baseline gap-1.5 mt-1.5">
        ${
          overrideLabel
            ? `<span class="text-[32px] font-semibold tracking-[-0.03em] leading-none ${amountCls}">${escapeHtml(overrideLabel)}</span>`
            : hasPrice
              ? `<span class="text-[42px] font-semibold tracking-[-0.03em] tabular-nums leading-none ${amountCls}">
                ${escapeHtml(sym)}<span x-text="yearly ? '${priceY}' : '${priceM}'">${priceY}</span>
              </span>
              <span class="text-[13px] ${perCls}">/ <span x-text="yearly ? '${t("sellPage.year")}' : '${t("sellPage.month")}'">${t("sellPage.year")}</span></span>`
            : `<span class="text-[32px] font-semibold tracking-[-0.03em] leading-none ${amountCls}">${t("sellPage.customOffer")}</span>`
        }
      </div>
      <div class="text-[11.5px] -mt-1 ${metaCls}">
        ${
          hasPrice
            ? `<span x-text="yearly ? '${t("sellPage.yearlyUpfrontVatExcl")}' : '${t("sellPage.monthlyCancelAnytime")}'">${t("sellPage.yearlyUpfrontVatExcl")}</span>`
            : t("sellPage.pricedByVolume")
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

      ${
        trial?.enabled && plan.plan_code === trial.plan_code
          ? `<a href="/pages/auth/register.html?type=supplier&plan=${encodeURIComponent(
              plan.plan_code
            )}&trial=1" data-seller-cta class="${ctaCls} mt-0.5">${SVG_ZAP} ${escapeHtml(
              (trial.cta_label || "").trim() ||
                `${trial.days || plan.trial_days || 0} gün ücretsiz dene`
            )}</a>`
          : `<a href="${ctaTargetHref}" ${ctaAttr} class="${ctaCls} mt-0.5">${escapeHtml(
              plan.cta_label || t("sellPage.continue")
            )} ${SVG_ARROW}</a>`
      }

      <div class="h-px my-1 ${dividerCls}"></div>
      <div class="text-[11px] font-semibold uppercase tracking-[0.06em] ${featHeadCls}">${t("sellPage.packageContents")}</div>
      <ul class="list-none p-0 m-0 flex flex-col gap-2 text-[13px] flex-1">
        ${cardFeatures(plan)
          .map((f) => {
            const ok = !f.is_disabled;
            const icon = ok ? featureIcon(f.icon) : SVG_X;
            const iconCls = ok ? checkCls : xCls;
            const liCls = ok ? featLiCls : noLineCls;
            const tip = f.tooltip ? ` title="${escapeHtml(f.tooltip)}"` : "";
            // Enum/quota değeri varsa (ör. "7×24 tahsisli") adın yanında kalın göster.
            // Boolean / değersiz ("", "0", "Yok") → sadece ad.
            const tv = (f.text_value || "").trim();
            const showVal = ok && tv && tv !== "0" && tv.toLocaleLowerCase("tr") !== "yok";
            const label = showVal
              ? `${escapeHtml(f.display_text)}: <span class="font-semibold">${escapeHtml(tv)}</span>`
              : escapeHtml(f.display_text);
            // "Yakında" rozeti — özellik dahil (✓) ama henüz çalışmıyorsa.
            const soonCls = isFeat
              ? "bg-[#f5b800]/20 text-[#f5b800]"
              : "bg-[#f5b800]/15 text-[#9a7400]";
            const badge =
              ok && f.coming_soon
                ? ` <span class="inline-block align-middle ms-1 text-[9.5px] font-semibold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-full ${soonCls}">Yakında</span>`
                : "";
            return `
              <li class="flex items-start gap-2.5 leading-[1.4] ${liCls}"${tip}>
                <span class="shrink-0 mt-0.5 ${iconCls}">${icon}</span>
                <span>${label}${badge}</span>
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
  coming_soon?: boolean;
  // Opsiyonel feature_key — varsa plan.features içinde aranır; bulunursa
  // plan'daki display_text / is_disabled kullanılır, yoksa `v` fallback değeri.
  feature_key?: string;
  // Plan sayısı kadar hücre (N kolon). Hardcoded fallback satırlarında 4 eleman
  // olabilir; plan sayısı farklıysa resolveCellFromFeature güvenli fallback yapar.
  v: MatrixCell[];
};
type MatrixSection = { title: string; rows: MatrixRow[] };

const yes: MatrixCell = { type: "yes" };
const no: MatrixCell = { type: "no" };
const txt = (v: string): MatrixCell => ({ type: "text", v });

// "Komisyon & limitler" başlığı altındaki ilk 2 satır (Satış komisyonu, Aktif
// ürün limiti) plan kartlarındaki ile birebir uyuşmalı — bu yüzden plans'tan
// türetiliyor (bkz. buildDynamicMatrixSections). Diğer satırlar plan modelinde
// structured field değil (mesela "Numune satışı") — feature_key + fallback.
function staticCommissionExtraRows(): MatrixRow[] {
  return [
    { f: t("sellPage.sampleSales"), feature_key: "sample_sales", v: [yes, yes, yes, yes] },
    { f: t("sellPage.bulkUploadCsv"), feature_key: "bulk_csv_upload", v: [yes, yes, yes, yes] },
  ];
}

// Matrix detay section'ları — her satır feature_key taşıyor. Backend'de bir
// plan'ın Pricing Plan Feature child table'ında aynı feature_key varsa, o
// plan için satır değeri override edilir. Yoksa fallback `v` array kullanılır.
function matrixSections(): MatrixSection[] {
  return [
    // NOTE: "Komisyon & limitler" section runtime'da `buildDynamicMatrixSections`
    // tarafından plans verisiyle önek olarak eklenir; burada **listelenmez**.
    {
      title: t("sellPage.matrixStorefront"),
      rows: [
        {
          f: t("sellPage.manufacturerBadge"),
          feature_key: "manufacturer_badge",
          v: [txt(t("sellPage.tierStandard")), txt(t("sellPage.tierSilver")), txt(t("sellPage.tierGold")), txt("Platinum")],
        },
        {
          f: t("sellPage.storefrontType"),
          feature_key: "storefront_tier",
          v: [txt(t("sellPage.tierStandard")), txt("Premium"), txt("Premium+"), txt(t("sellPage.tierFullyCustom"))],
        },
        {
          f: t("sellPage.multiLanguage"),
          feature_key: "languages",
          v: [txt(t("sellPage.langCount2")), txt(t("sellPage.langCount4")), txt(t("sellPage.langCount6")), txt(t("sellPage.langCount15Plus"))],
        },
        { f: t("sellPage.videoMedia360"), feature_key: "rich_media", v: [no, no, yes, yes] },
        {
          f: t("sellPage.featuredListingPerMonth"),
          feature_key: "featured_listings",
          v: [txt("—"), txt("5"), txt("20"), txt(t("sellPage.unlimited"))],
        },
      ],
    },
    {
      title: t("sellPage.matrixSupport"),
      rows: [
        {
          f: t("sellPage.support"),
          feature_key: "support_tier",
          v: [txt("Email"), txt(t("sellPage.supportPriority")), txt(t("sellPage.supportAccountMgr")), txt(t("sellPage.support247Dedicated"))],
        },
        {
          f: t("sellPage.teamSeats"),
          feature_key: "team_seats",
          v: [txt("1"), txt("3"), txt("10"), txt(t("sellPage.unlimited"))],
        },
        {
          f: t("sellPage.adCreditPerMonth"),
          feature_key: "ad_credit_monthly",
          v: [txt("—"), txt("€100"), txt("€300"), txt(t("sellPage.custom"))],
        },
        { f: t("sellPage.vatRefundAdvisory"), feature_key: "vat_refund_advisory", v: [yes, yes, yes, yes] },
        { f: t("sellPage.insuredShippingIncluded"), feature_key: "insured_shipping", v: [yes, yes, yes, yes] },
        { f: t("sellPage.eventInvitation"), feature_key: "event_invitations", v: [no, no, yes, yes] },
      ],
    },
    {
      title: t("sellPage.matrixEnterprise"),
      rows: [
        {
          f: t("sellPage.apiAccess"),
          help: t("sellPage.apiAccessHelp"),
          feature_key: "api_access",
          v: [no, txt(t("sellPage.limited")), txt(t("sellPage.full")), txt(t("sellPage.customSla"))],
        },
        {
          f: t("sellPage.erpIntegration"),
          feature_key: "erp_integration",
          v: [no, no, txt("Beta"), yes],
        },
        { f: t("sellPage.customPaymentTerms"), feature_key: "custom_payment_terms", v: [no, no, no, yes] },
        {
          f: t("sellPage.customSubdomain"),
          feature_key: "custom_subdomain",
          v: [no, no, no, yes],
        },
      ],
    },
  ];
}

// feature_key bazlı resolution — plan.features'tan satırdaki kaynağı seçer.
// Öncelik sırası: plan'da matching feature varsa kullan; aksi halde fallback.
function resolveCellFromFeature(
  row: MatrixRow,
  plan: PricingPlan,
  fallbackIndex: number
): MatrixCell {
  // Hardcoded fallback array plan sayısından kısa olabilir → son elemana veya
  // `no`'ya düş (N-plan güvenliği).
  const fb = row.v[fallbackIndex] ?? row.v[row.v.length - 1] ?? no;
  if (!row.feature_key) return fb;

  const f = plan.features.find((x) => x.feature_key === row.feature_key);
  if (!f) return fb;

  if (f.is_disabled) return no;
  // display_text yoksa veya boşsa, icon "check"e göre yes/no, diğeri text
  const text = (f.display_text || "").trim();
  if (!text) {
    if (f.icon === "x") return no;
    return yes;
  }
  return txt(text);
}

function resolveRowCells(row: MatrixRow, plans: PricingPlan[]): MatrixCell[] {
  return plans.map((p, i) => resolveCellFromFeature(row, p, i));
}

function renderMatrixCell(c: MatrixCell): string {
  if (c.type === "yes") return `<span class="inline-flex text-[#1f7a4d]">${SVG_CHECK_MD}</span>`;
  if (c.type === "no") return `<span class="inline-flex text-[#d5d2c9]">${SVG_DASH}</span>`;
  return escapeHtml(c.v);
}

// Matrix tüm section'larını plans + features_matrix verisinden derive eder.
// Faz J: backend Feature Catalog'tan kategorize edilmiş matris geliyorsa
// (features_matrix.categories) onu kullan — tüm UI satırları admin'den yönetilir.
// features_matrix yoksa (eski API yanıtı veya cache) hardcoded matrixSections()
// fallback'i kullanılır (geriye uyumluluk).
//
// Plan field override'ı: "commission_rate" ve "max_active_listings" feature
// key'leri için plan model'indeki gerçek değerler matris hücresini ezer
// (admin'in feature catalog'ta "Özel" yazsa bile satıcı plan'da %8
// belirlemişse "%8" gösterilir).
function _matrixCellFromBackend(
  cell: PricingMatrixCell | undefined,
  valueType: "checkbox" | "text"
): MatrixCell {
  if (!cell) return valueType === "checkbox" ? no : txt("—");
  if (cell.value_type === "checkbox" || valueType === "checkbox") {
    return cell.is_included ? yes : no;
  }
  const text = (cell.text_value || "").trim();
  return text ? txt(text) : txt("—");
}

function buildDynamicMatrixSections(
  plans: PricingPlan[],
  featuresMatrix?: PricingFeaturesMatrix
): MatrixSection[] {
  // N-plan: kaç public plan varsa o kadar kolon (4 şartı kaldırıldı).
  if (!plans.length) return matrixSections();

  // ─ Yeni yol: features_matrix backend'den geldi ──────────
  if (featuresMatrix?.categories?.length) {
    const planCodes = plans.map((p) => p.plan_code);
    return featuresMatrix.categories.map((cat) => ({
      title: cat.name,
      rows: cat.features.map((f) => {
        // values_by_plan backend'de hazırlanır. Genel feature'larda admin
        // "Paket İçeriği" matris hücresi geçerlidir; ancak komisyon ve aktif
        // ürün limiti için plan model field'ı OTORİTEDİR ve backend bu iki
        // hücreyi field değeriyle ezer (bkz. public_pricing._build_features_matrix).
        // Böylece karşılaştırma tablosu, kart "şerit"i ile birebir aynı kalır.
        const cells = plans.map((_plan, i) => {
          const cell = f.values_by_plan?.[planCodes[i]];
          return _matrixCellFromBackend(cell, f.value_type);
        });
        return {
          f: f.display_name,
          feature_key: f.feature_key,
          help: f.tooltip ?? undefined,
          coming_soon: f.coming_soon,
          v: cells,
        };
      }),
    }));
  }

  // ─ Eski yol: hardcoded matrixSections() fallback ─────────
  const commissionCells = plans.map((p) => txt(commissionLabel(p)));

  const listingsCells = plans.map((p) => txt(fmtListings(p.max_active_listings)));

  const dynamicCommissionSection: MatrixSection = {
    title: t("sellPage.matrixCommissionLimits"),
    rows: [
      {
        f: t("sellPage.salesCommission"),
        help: t("sellPage.salesCommissionHelp"),
        v: commissionCells,
      },
      { f: t("sellPage.activeProductLimit"), v: listingsCells },
      // STATIC extra rows da feature_key resolve etsin (admin "sample_sales"
      // feature_key'i bir plan'a is_disabled=1 ile koyarsa "no" olur).
      ...staticCommissionExtraRows().map((r) => ({
        ...r,
        v: resolveRowCells(r, plans),
      })),
    ],
  };

  const resolvedSections = matrixSections().map((sec) => ({
    title: sec.title,
    rows: sec.rows.map((r) => ({
      ...r,
      v: resolveRowCells(r, plans),
    })),
  }));

  return [dynamicCommissionSection, ...resolvedSections];
}

// N kolon grid template — sol özellik kolonu + plan sayısı kadar kolon.
// Dinamik plan sayısı Tailwind arbitrary class'ı ile ifade EDİLEMEZ (build-time
// tarama interpolasyonu görmez) → inline style ile grid-template-columns veriyoruz.
// `minmax(...,1fr)` + min-width sayesinde mobilde yatay scroll'da kolonlar ezilmez.
function matrixGridStyle(n: number): string {
  return `grid-template-columns: minmax(150px,1.6fr) repeat(${n}, minmax(96px,1fr))`;
}

// Grid container'ın statik (Tailwind taranabilir) utility'leri.
const MATRIX_GRID_CLS = "grid gap-3 items-center";

function PricingMatrix(
  plans: PricingPlan[],
  featuresMatrix?: PricingFeaturesMatrix
): string {
  // N-plan: kaç public plan varsa o kadar kolon. Karşılaştırma için en az 2 plan.
  if (plans.length < 2) return "";
  const gridStyle = matrixGridStyle(plans.length);
  const featuredIdx = plans.findIndex((p) => p.highlighted);
  const sym = currencySymbol(plans[0]?.currency || "EUR");
  const cols = plans.map((p) => ({
    n: p.plan_name,
    p:
      (p.yearly_price || 0) > 0
        ? `${sym}${p.yearly_price} / ${t("sellPage.year")}`
        : (p.monthly_price || 0) > 0
          ? `${sym}${p.monthly_price} / ${t("sellPage.month")}`
          : t("sellPage.customOffer"),
    featured: !!p.highlighted,
  }));

  // Mobile-first: dar ekranda yatay scroll; inner min-width plan sayısına göre
  // (dinamik → inline style, Tailwind arbitrary class taranamaz).
  const minW = 160 + plans.length * 110;
  return /* html */ `
    <div class="mt-14 overflow-x-auto">
      <div class="bg-white border border-[#e8e6e0] rounded-2xl overflow-hidden" style="min-width:${minW}px">
      <div class="${MATRIX_GRID_CLS} items-end px-6 py-[18px] bg-[#fafaf8] border-b border-[#d5d2c9]" style="${gridStyle}">
        <div class="text-start">
          <div class="text-[15px] font-semibold text-[#1a1a1a]">${t("sellPage.allPackageFeatures")}</div>
          <div class="text-xs text-[#8a877f] mt-0.5 tabular-nums">${t("sellPage.yearlyPeriodVatExcl")}</div>
        </div>
        ${cols
          .map(
            (c) => `
          <div class="text-center ${c.featured ? "bg-[#fff8e1] rounded-lg px-2 py-2.5 -mx-1 -my-2.5" : ""}">
            <div class="text-[15px] font-semibold ${c.featured ? "text-[#d39c00]" : "text-[#1a1a1a]"}">${escapeHtml(c.n)}</div>
            <div class="text-xs text-[#8a877f] mt-0.5 tabular-nums">${escapeHtml(c.p)}</div>
          </div>
        `
          )
          .join("")}
      </div>

      ${buildDynamicMatrixSections(plans, featuresMatrix)
        .map(
          (sec) => `
        <div>
          <div class="px-6 pt-3.5 pb-2 bg-[#fafaf8] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a877f] border-b border-[#e8e6e0]">
            ${escapeHtml(sec.title)}
          </div>
          ${sec.rows
            .map(
              (r) => `
            <div class="${MATRIX_GRID_CLS} px-6 py-3.5 border-b border-[#e8e6e0] last:border-b-0 text-[13px]" style="${gridStyle}">
              <div>
                <div class="text-[#1a1a1a] font-medium">${escapeHtml(r.f)}${
                  r.coming_soon
                    ? ` <span class="inline-block align-middle ms-1 text-[9.5px] font-semibold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-full bg-[#f5b800]/15 text-[#9a7400]">Yakında</span>`
                    : ""
                }</div>
                ${r.help ? `<div class="text-[11px] text-[#8a877f] mt-0.5 font-normal">${escapeHtml(r.help)}</div>` : ""}
              </div>
              ${r.v
                .map(
                  (c, j) => `
                <div class="text-center text-[#4a4a48] ${
                  j === featuredIdx
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
    </div>
  `;
}

function PricingEmpty(): string {
  return /* html */ `
    <div class="rounded-2xl border border-[#e8e6e0] bg-white p-10 text-center text-[#4a4a48]">
      <p class="m-0 mb-2 text-base font-medium text-[#1a1a1a]">${t("sellPage.plansLoadFailed")}</p>
      <p class="m-0 text-sm">${t("sellPage.plansLoadRetry")}
        <a href="${SELL_HREF}" data-seller-cta class="text-[#d39c00] font-medium underline">${t("sellPage.startApplication")}</a>.
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
  return t("sellPage.monthsFree", { count: bestSavedMonths });
}

function PricingSection(
  plans: PricingPlan[],
  featuresMatrix?: PricingFeaturesMatrix,
  trial?: TrialConfig
): string {
  const cards = plans.length
    ? `<div class="grid grid-cols-1 md:grid-cols-2 ${plans.length >= 4 ? "lg:grid-cols-4" : plans.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-3.5 items-stretch">
         ${plans.map((p, i) => PricingCard(p, i, trial)).join("")}
       </div>
       ${PricingMatrix(plans, featuresMatrix)}`
    : PricingEmpty();

  const discountBadge = _computeYearlyDiscountBadge(plans);

  return /* html */ `
    <section id="paketler" class="py-16 md:py-24 border-t border-[#e8e6e0] bg-[#f7f7f5]" x-data="{ yearly: true }">
      <div class="${WRAP_CLS}">
        <div class="${INNER_CLS}">
        <div class="${SECTION_HEAD_CLS}">
          <span class="${EYEBROW_CLS}">${t("sellPage.sellerPackages")}</span>
          <h2 class="${SECTION_H2_CLS}">${t("sellPage.pricingSectionTitle")}</h2>
          <p class="${SECTION_P_CLS}">
            ${t("sellPage.pricingSectionDesc")}
          </p>
        </div>


        <div class="inline-flex bg-white border border-[#e8e6e0] rounded-full p-1 mb-8" role="tablist" aria-label="${t("sellPage.period")}">
          <button
            type="button"
            role="tab"
            @click="yearly = true"
            :aria-selected="yearly"
            :class="yearly ? 'bg-[#1a1a1a] text-white' : 'bg-transparent text-[#8a877f]'"
            class="appearance-none border-0 text-[12.5px] font-medium px-4 py-2 rounded-full focus:outline-none transition-colors duration-150"
          >
            ${t("sellPage.yearlyToggle")}
            ${discountBadge ? `<span class="text-[10px] bg-[#f5b800] text-[#1a1a1a] px-1.5 py-0.5 rounded-full font-bold ms-1.5 tracking-[0.04em]">${discountBadge}</span>` : ""}
          </button>
          <button
            type="button"
            role="tab"
            @click="yearly = false"
            :aria-selected="!yearly"
            :class="!yearly ? 'bg-[#1a1a1a] text-white' : 'bg-transparent text-[#8a877f]'"
            class="appearance-none border-0 text-[12.5px] font-medium px-4 py-2 rounded-full focus:outline-none transition-colors duration-150"
          >
            ${t("sellPage.monthlyToggle")}
          </button>
        </div>

        ${cards}
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
          ${t("sellPage.finalCtaTitle")}
        </h2>
        <p class="text-base text-[#4a4a48] mx-auto mb-6 max-w-[52ch]">
          ${t("sellPage.finalCtaDesc")}
        </p>
        <div class="inline-flex flex-wrap gap-3 justify-center">
          <a href="${SELL_HREF}" data-seller-cta class="th-btn th-btn-lg">
            ${t("sellPage.applyAsSeller")} ${SVG_ARROW}
          </a>
          <a href="#karsilastirma" class="th-btn-outline th-btn-lg">${t("sellPage.letsTalkFirst")}</a>
        </div>
        <div class="mt-3.5 text-xs text-[#8a877f]">${t("sellPage.finalCtaNote")}</div>
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
  const featuresMatrix = pricingData?.features_matrix;
  const trial = pricingData?.trial_config;
  return `
    ${HeroSection()}
    ${PricingSection(plans, featuresMatrix, trial)}
    ${FinalCtaSection()}
  `;
}
