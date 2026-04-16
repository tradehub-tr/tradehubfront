/**
 * Satış Sonrası Değerlendirme ve Destek Landing Page
 */
import heroImg from "../../assets/images/satıssonrasıhizmetleri.avif";
import taLogoUrl from "../../assets/images/ta-logo.svg";
import { TradeAssuranceFooterCards } from "../shared/TradeAssuranceFooterCards";

/* ════════════════════════════════════════════════════
   ICONS (inline SVG)
   ════════════════════════════════════════════════════ */

const iconStar = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>`;

const iconMessage = `<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>`;

/* ════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════ */

function yellowIcon(svgContent: string): string {
  return `<div class="w-[48px] h-[48px] rounded-full bg-[#FFE285] flex items-center justify-center shrink-0">${svgContent}</div>`;
}

/* ════════════════════════════════════════════════════
   SECTION BUILDERS
   ════════════════════════════════════════════════════ */

function heroSection(): string {
  return `
    <section class="relative w-full min-h-[400px] flex items-center" style="background-image: url('${heroImg}'); background-size: cover; background-position: center;">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative z-10 container-boxed w-full py-16 sm:py-20">
        <div class="inline-flex items-center px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
          <img src="${taLogoUrl}" alt="Ticari Güvence" class="h-7 sm:h-8" />
        </div>
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
          Satış sonrası değerlendirme ve destek
        </h1>
        <p class="text-base sm:text-lg text-white/90 max-w-2xl leading-relaxed">
          Her alışveriş sonrası satıcılarınızı değerlendirin, platformun kalitesine katkıda bulunun
        </p>
      </div>
    </section>
  `;
}

function breadcrumbSection(): string {
  return `
    <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <nav class="flex text-sm text-gray-500" aria-label="Breadcrumb">
        <ol class="flex items-center gap-1.5">
          <li><a href="/pages/info/trade-assurance-detail.html" class="hover:text-[#FFC800] transition-colors">Ticari Güvence</a></li>
          <li class="text-gray-400">&gt;</li>
          <li class="text-gray-900 font-medium">Satış sonrası destek</li>
        </ol>
      </nav>
    </div>
  `;
}

function currentFeaturesSection(): string {
  return `
    <section class="bg-white py-12 sm:py-16">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Sipariş sonrası size neler sunuyoruz?</h2>
        <p class="text-gray-600 leading-relaxed max-w-3xl mb-10 text-base sm:text-lg">
          iSTOC, alım-satım sürecini şeffaf ve güvenli kılacak temel araçları sunar. Siparişiniz tamamlandıktan sonra da platform üzerinde destek almaya devam edebilirsiniz.
        </p>

        <!-- 2 Current Feature Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">

          <!-- Card 1: Satıcı Değerlendirme -->
          <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            ${yellowIcon(iconStar)}
            <h3 class="text-lg font-bold text-gray-900">Satıcı Değerlendirme Sistemi</h3>
            <p class="text-sm text-gray-600 leading-relaxed flex-1">
              Aldığınız ürün ve hizmeti 1-5 yıldız arasında puanlayıp yorum yazabilirsiniz. Değerlendirmeleriniz diğer alıcılara rehberlik eder ve satıcıların kalitesini şekillendirir.
            </p>
            <div class="flex items-center gap-1 pt-2">
              ${[1, 2, 3, 4, 5]
                .map(
                  () => `
                <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Card 2: Mesajlaşma -->
          <div class="border border-gray-200 rounded-md p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            ${yellowIcon(iconMessage)}
            <h3 class="text-lg font-bold text-gray-900">Satıcı ile Doğrudan İletişim</h3>
            <p class="text-sm text-gray-600 leading-relaxed flex-1">
              Sipariş sonrası sorularınızı, ürünle ilgili taleplerinizi veya yaşadığınız sorunları doğrudan satıcınıza iletebilir, çözüm arayışına ortak olabilirsiniz.
            </p>
          </div>

        </div>
      </div>
    </section>
  `;
}

/* ════════════════════════════════════════════════════
   EXPORTS
   ════════════════════════════════════════════════════ */

export function AfterSalesPage(): string {
  return `
    ${heroSection()}
    ${breadcrumbSection()}
    ${currentFeaturesSection()}
    ${TradeAssuranceFooterCards()}
  `;
}

export function initAfterSalesPage(): void {
  // future interactivity hooks
}
