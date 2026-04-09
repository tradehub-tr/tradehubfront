/**
 * Ticari Güvence Footer Cards — Shared component
 * Reused across shipping-logistics, payments, and similar pages.
 * NOTE: Export adı `TradeAssuranceFooterCards` olarak kalıyor çünkü tüm sayfalar bu adla import ediyor.
 */

const iconBookmark = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#FFC200"/><g transform="translate(8,8)"><path d="M24.381 3.048c1.262 0 2.286 1.023 2.286 2.285v23.62L16 24.19 5.333 28.952V5.333c0-1.262 1.024-2.285 2.286-2.285h16.762Zm0 2.285H7.619v20.096L16 21.687l8.381 3.742V5.333Zm-3.81 9.143v2.286h-9.142v-2.286h9.143Zm0-5.333v2.286h-9.142V9.143h9.143Z" fill="#222" fill-rule="nonzero"/></g></svg>`

const iconCalendar = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#FFC200"/><g transform="translate(8,8)"><path d="M24.381 4.571c1.262 0 2.286 1.024 2.286 2.286v15.879L21.2 28.952H8.381A2.286 2.286 0 0 1 6.095 26.667V6.857c0-1.262 1.024-2.286 2.286-2.286h.001v22.095h9.524v-6.476h6.476V4.571Zm-.53 17.905L20.19 22.476v4.163l3.661-4.163ZM17.524 16v2.286h-6.857V16h6.857Zm3.81-4.571v2.285H10.666v-2.285h10.667Zm4.523-8.381v3.81h-2.286v-3.81h2.286Zm-10.756 0v3.81H12.815v-3.81h2.286Zm6.947 1.192v2.286h-5.334V4.24h5.334Z" fill="#222" fill-rule="nonzero"/></g></svg>`

const iconHeadset = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#FFC200"/><g transform="translate(8,8)"><path d="M21.757 12.499l2.811.001c-.531-4.145-4.165-7.352-8.568-7.352-4.403 0-8.037 3.207-8.568 7.351l2.811.001V21.95H6.095c-1.683 0-3.047-1.364-3.047-3.048v-3.356c0-1.39.93-2.562 2.201-2.929C5.732 7.255 10.361 3.048 16 3.048c5.639 0 10.268 4.207 10.752 9.57 1.27.368 2.2 1.54 2.2 2.93v3.356c0 1.684-1.365 3.048-3.048 3.048h-1.99l.001.574c0 1.826-1.047 3.408-2.573 4.178a3.42 3.42 0 0 1-2.746 2.249 2.8 2.8 0 0 1-4.113 0 2.8 2.8 0 0 1 4.114-3.601 2.97 2.97 0 0 0 .74.35 2.36 2.36 0 0 0 1.016-1.899V12.5ZM18.596 25.637h-4.113a2.515 2.515 0 0 0 0 5.03h4.113a2.515 2.515 0 0 0 0-5.03ZM7.958 14.785H6.095a.762.762 0 0 0-.762.762v3.356c0 .421.341.762.762.762h1.863v-4.88Zm17.947 0h-1.863v4.88h1.863a.762.762 0 0 0 .762-.761v-3.357a.762.762 0 0 0-.762-.762Z" fill="#222"/></g></svg>`

export function TradeAssuranceFooterCards(): string {
  return `
    <section class="bg-[#1C0C05] py-[70px]">
      <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

          <!-- Card: Hükümler ve Koşullar -->
          <a href="/pages/legal/terms" class="group block bg-[#000]/40 hover:bg-[#000]/60 rounded-md p-6 transition-all duration-300">
            <div class="mb-4">${iconBookmark}</div>
            <h3 class="text-base font-bold text-white mb-3">Hükümler ve Koşullar</h3>
            <span class="text-[#FFC200] text-sm font-medium group-hover:underline">Okuyun &rarr;</span>
          </a>

          <!-- Card: Ticari Güvence kılavuzu -->
          <a href="/pages/help/help-center" class="group block bg-[#000]/40 hover:bg-[#000]/60 rounded-md p-6 transition-all duration-300">
            <div class="mb-4">${iconCalendar}</div>
            <h3 class="text-base font-bold text-white mb-3">Ticari Güvence kılavuzu</h3>
            <span class="text-[#FFC200] text-sm font-medium group-hover:underline">İndir &rarr;</span>
          </a>

          <!-- Card: Müşteri Hizmetleri -->
          <a href="/pages/help/help-center" class="group block bg-[#000]/40 hover:bg-[#000]/60 rounded-md p-6 transition-all duration-300">
            <div class="mb-4">${iconHeadset}</div>
            <h3 class="text-base font-bold text-white mb-3">Müşteri Hizmetleri</h3>
            <span class="text-[#FFC200] text-sm font-medium group-hover:underline">Yardım alın &rarr;</span>
          </a>

        </div>
      </div>
    </section>
  `;
}
