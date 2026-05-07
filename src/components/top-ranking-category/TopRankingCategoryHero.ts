/**
 * TopRankingCategoryHero — Adanmış sayfanın hero bandı.
 *
 * Mevcut TopRankingHero ile birebir görsel kimlik (krem-sarı gradient,
 * decorative circles), ama:
 *  - Başlık dinamik: "En Çok Satanlar — <Kategori Adı>"
 *  - Subtitle ürün sayısını içerir
 *  - Mevcut TopRankingFilters yeniden kullanılır (kullanıcı buradan başka
 *    kategoriye atlayabilir)
 *
 * Parent Alpine state: { categoryName: string, totalProducts: number }
 */

import { t } from "../../i18n";
import { TopRankingFilters } from "../top-ranking/TopRankingFilters";

export function TopRankingCategoryHero(): string {
  return `
    <div class="relative">
      <div class="relative z-10 container-boxed py-2 sm:py-4 lg:py-10 lg:py-14 text-center">
        <!-- Title + subtitle: desktop only -->
        <div class="hidden lg:block">
          <h1
            class="text-3xl sm:text-[40px] md:text-[44px] font-bold leading-tight text-secondary-800"
          >
            <span data-i18n="topRankingCategoryPage.heroTitlePrefix">${t("topRankingCategoryPage.heroTitlePrefix")}</span><span x-text="categoryName"></span>
          </h1>
          <p class="mt-1 text-sm sm:text-base font-medium text-secondary-500">
            <span x-text="$t('topRankingCategoryPage.heroSubtitlePrefix', { count: totalProducts })"></span><span data-i18n="topRankingCategoryPage.heroSubtitleSuffix">${t("topRankingCategoryPage.heroSubtitleSuffix")}</span>
          </p>
        </div>

        <div class="flex justify-center">
          ${TopRankingFilters()}
        </div>
      </div>
    </div>
  `;
}
