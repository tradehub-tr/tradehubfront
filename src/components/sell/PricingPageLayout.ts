/**
 * PricingPageLayout Component
 * Pricing plans fetched from backend API via sellPricing Alpine data.
 * Falls back to loading skeleton while data is fetched.
 */

import { t } from "../../i18n";

export function PricingPageLayout(): string {
  return `
    <div x-data="sellPricing()" class="pb-16">
      <!-- Header -->
      <div class="text-center py-10 sm:py-14">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">${t("sellPage.pricing.title")}</h1>
        <p class="text-gray-500 mb-6">${t("sellPage.pricing.subtitle")}</p>

        <!-- Billing Toggle -->
        <div class="inline-flex items-center bg-gray-100 rounded-full p-1">
          <button @click="billingPeriod = 'monthly'" class="px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer" :class="billingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">${t("sellPage.pricing.monthly")}</button>
          <button @click="billingPeriod = 'yearly'" class="px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer" :class="billingPeriod === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'">
            ${t("sellPage.pricing.yearly")} <span class="text-xs text-green-600 font-semibold ms-1">${t("sellPage.pricing.yearlyDiscount")}</span>
          </button>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6">

        <!-- Loading skeleton -->
        <template x-if="plansLoading && plans.length === 0">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <template x-for="i in 3" :key="i">
              <div class="bg-white rounded-md border border-gray-200 p-6 sm:p-8 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div class="h-10 bg-gray-200 rounded w-32 mb-6"></div>
                <div class="space-y-3">
                  <div class="h-4 bg-gray-100 rounded w-full"></div>
                  <div class="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div class="h-4 bg-gray-100 rounded w-5/6"></div>
                </div>
                <div class="h-10 bg-gray-200 rounded mt-8"></div>
              </div>
            </template>
          </div>
        </template>

        <!-- Error state -->
        <template x-if="plansError && plans.length === 0">
          <div class="text-center py-12 text-gray-500">
            <p>${t("sellPage.pricing.loadError") || "Fiyatlandırma bilgileri yüklenemedi. Lütfen sayfayı yenileyin."}</p>
          </div>
        </template>

        <!-- Dynamic plan cards from backend -->
        <div x-show="plans.length > 0" class="grid grid-cols-1 gap-6 mb-16"
             :class="{
               'md:grid-cols-2': plans.length === 2,
               'md:grid-cols-3': plans.length === 3,
               'md:grid-cols-4': plans.length >= 4
             }">
          <template x-for="plan in plans" :key="plan.plan_code">
            <div class="relative bg-white rounded-md flex flex-col p-6 sm:p-8"
                 :class="plan.highlighted ? 'border-2 border-primary-500 shadow-lg' : 'border border-gray-200 shadow-sm'">
              <!-- Badge -->
              <template x-if="plan.badge_label">
                <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-semibold rounded-full"
                     :class="{
                       'bg-yellow-500': plan.badge_color === 'yellow',
                       'bg-gray-900': plan.badge_color === 'black',
                       'bg-gradient-to-r from-violet-600 to-indigo-600': plan.badge_color === 'premium',
                       'bg-green-600': plan.badge_color === 'green',
                       'bg-blue-600': plan.badge_color === 'blue',
                       'bg-primary-500': !plan.badge_color || plan.badge_color === 'default'
                     }"
                     x-text="plan.badge_label"></div>
              </template>

              <h3 class="text-xl font-bold text-gray-900" x-text="plan.plan_name"></h3>
              <p x-show="plan.short_tagline" class="text-sm text-gray-500 mt-1" x-text="plan.short_tagline"></p>

              <!-- Price -->
              <div class="mt-4 mb-6">
                <span class="text-3xl font-bold text-gray-900"
                      x-text="formatPrice(billingPeriod === 'monthly' ? plan.monthly_price : plan.yearly_price, plan.currency)"></span>
                <span class="text-sm text-gray-500" x-show="plan.monthly_price > 0"> ${t("sellPage.pricing.perMonth")}</span>
                <template x-if="plan.trial_days > 0">
                  <p class="text-xs text-green-600 mt-1" x-text="plan.trial_days + ' ${t("sellPage.pricing.trialDays") || "gün ücretsiz deneme"}'"></p>
                </template>
              </div>

              <!-- Features -->
              <ul class="space-y-3 mb-8 flex-1">
                <template x-for="feat in plan.features" :key="feat.display_text">
                  <li class="flex items-start gap-2 text-sm" :class="feat.is_disabled ? 'text-gray-400 line-through' : 'text-gray-600'">
                    <template x-if="feat.icon === 'check' || !feat.icon">
                      <svg class="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </template>
                    <template x-if="feat.icon === 'x'">
                      <svg class="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </template>
                    <template x-if="feat.icon === 'star'">
                      <svg class="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </template>
                    <span x-text="feat.display_text"></span>
                  </li>
                </template>
              </ul>

              <!-- CTA -->
              <a :href="plan.cta_action === 'contact_sales' ? '/iletisim' : '/satici-ol'"
                 class="block text-center"
                 :class="plan.highlighted ? 'th-btn' : 'th-btn-outline'"
                 x-text="plan.cta_label"></a>
            </div>
          </template>
        </div>

        <!-- FAQ -->
        <div class="max-w-[800px] mx-auto">
          <h2 class="text-xl font-bold text-gray-900 mb-6 text-center">${t("sellPage.pricing.faqTitle")}</h2>
          <div class="space-y-2">
            <template x-for="(item, index) in faqItems" :key="index">
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <button @click="toggleFaq(index)" class="w-full flex items-center justify-between px-4 py-3.5 text-start text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer">
                  <span x-text="item.question"></span>
                  <svg class="w-4 h-4 text-gray-500 transition-transform shrink-0 ms-2" :class="item.open && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </button>
                <div x-show="item.open" x-collapse>
                  <p class="px-4 pb-4 text-sm text-gray-600 leading-relaxed" x-text="item.answer"></p>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- CTA -->
        <div class="text-center mt-14">
          <a href="/satici-ol" class="th-btn inline-block">${t("sellPage.pricing.ctaBottom")}</a>
        </div>
      </div>
    </div>
  `;
}
