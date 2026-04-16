/**
 * InfoPageLayout Component
 * Reusable informational page layout with hero banner, icon, and content sections.
 * Used for all static info pages (payments, refunds, shipping, etc.)
 */

export interface InfoSection {
  title: string;
  content: string;
}

export interface InfoPageLayoutProps {
  title: string;
  subtitle: string;
  icon: string;
  sections: InfoSection[];
}

/**
 * Renders a professional informational page with hero and card-based sections.
 */
export function InfoPageLayout({ title, subtitle, icon, sections }: InfoPageLayoutProps): string {
  return `
    <!-- Hero Banner -->
    <section class="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 py-14 sm:py-20 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      </div>
      <div class="absolute inset-0 opacity-5">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="info-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#info-grid)"/>
        </svg>
      </div>
      <div class="max-w-[900px] mx-auto px-4 sm:px-6 text-center relative z-10">
        <div class="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-white/20 backdrop-blur-sm text-white mb-5 shadow-lg">
          ${icon}
        </div>
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">${title}</h1>
        <p class="text-orange-100 text-base sm:text-lg max-w-[600px] mx-auto leading-relaxed">${subtitle}</p>
      </div>
    </section>

    <!-- Content Sections -->
    <section class="py-10 sm:py-16 bg-gray-50">
      <div class="max-w-[900px] mx-auto px-4 sm:px-6">
        <div class="space-y-6">
          ${sections
            .map(
              (section, index) => `
            <article class="bg-white rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
              <div class="flex items-start gap-4 p-6 sm:p-8">
                <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm mt-0.5">
                  ${index + 1}
                </div>
                <div class="flex-1 min-w-0">
                  <h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-3">${section.title}</h2>
                  <div class="text-gray-600 text-[15px] leading-relaxed space-y-3">
                    ${section.content}
                  </div>
                </div>
              </div>
            </article>
          `
            )
            .join("")}
        </div>

        <!-- Bottom CTA -->
        <div class="mt-10 text-center">
          <div class="inline-flex items-center gap-2 px-5 py-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
            </svg>
            <span>Sorulariniz mi var? <a href="/pages/help/help-center.html" class="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2">Yardim Merkezimizi</a> ziyaret edin.</span>
          </div>
        </div>
      </div>
    </section>
  `;
}
