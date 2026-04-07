/**
 * AddressesLayout Component
 * Buyer address book: list, add, edit, delete, set default.
 * Uses Alpine.js x-data="addressesManager".
 */

const ICONS = {
  pin: `<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 0.5C5.51472 0.5 3.5 2.51472 3.5 5C3.5 8.375 8 15.5 8 15.5C8 15.5 12.5 8.375 12.5 5C12.5 2.51472 10.4853 0.5 8 0.5ZM8 6.875C6.96447 6.875 6.125 6.03553 6.125 5C6.125 3.96447 6.96447 3.125 8 3.125C9.03553 3.125 9.875 3.96447 9.875 5C9.875 6.03553 9.03553 6.875 8 6.875Z" fill="currentColor"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 1.5l2 2L4.5 11.5H2.5v-2l8-8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M4.5 3.5l.5 8h4l.5-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 7v4M10 13h.01M8.5 3.21l-7 12.13A1 1 0 002.5 17h15a1 1 0 00.87-1.5l-7-12.13a1 1 0 00-1.74 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  emptyBox: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none"><rect x="8" y="16" width="40" height="32" rx="3" stroke="#D1D5DB" stroke-width="2"/><path d="M8 24h40M20 16v-4a2 2 0 012-2h12a2 2 0 012 2v4" stroke="#D1D5DB" stroke-width="2"/><path d="M22 33l4 4 8-8" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function renderAddressCard(): string {
  return `
    <template x-for="addr in addresses" :key="addr.id">
      <div class="bg-white rounded-lg p-5 max-sm:p-4 border-2 transition-colors"
           :class="addr.is_default ? 'border-[var(--color-primary,#cc9900)]' : 'border-transparent'">

        <!-- Header: title + default badge -->
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-[var(--color-primary,#cc9900)]">${ICONS.pin}</span>
            <span class="font-semibold text-sm text-gray-900 truncate" x-text="addr.title"></span>
          </div>
          <span x-show="addr.is_default"
                class="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary,#cc9900)] text-white">
            ${ICONS.check}
            Varsayılan
          </span>
        </div>

        <!-- Address info -->
        <div class="space-y-1 text-sm text-gray-600 mb-4">
          <p class="font-medium text-gray-800" x-text="addr.contact_name"></p>
          <p x-text="addr.company"></p>
          <p x-text="addr.phone"></p>
          <p x-text="addr.state + (addr.city ? ', ' + addr.city : '')"></p>
          <p class="text-gray-500 line-clamp-2" x-text="addr.street + (addr.apartment ? ', ' + addr.apartment : '')"></p>
          <p x-show="addr.postal_code" class="text-gray-400 text-xs" x-text="addr.postal_code"></p>
          <p x-show="addr.note" class="text-gray-400 text-xs italic" x-text="addr.note"></p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 flex-wrap border-t border-gray-100 pt-3">
          <button @click="openEdit(addr)"
                  class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            ${ICONS.edit} Düzenle
          </button>
          <button @click="confirmDelete(addr)"
                  class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-700 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors">
            ${ICONS.trash} Sil
          </button>
          <button x-show="!addr.is_default" @click="setDefault(addr.id)"
                  class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:border-[var(--color-primary,#cc9900)] hover:text-[var(--color-primary,#cc9900)] transition-colors ml-auto">
            Varsayılan Yap
          </button>
        </div>
      </div>
    </template>
  `;
}

function renderEmptyState(): string {
  return `
    <div x-show="addresses.length === 0 && !loading"
         class="bg-white rounded-lg p-12 flex flex-col items-center text-center">
      <div class="mb-4 text-gray-300">${ICONS.emptyBox}</div>
      <p class="text-gray-500 text-sm mb-4">Henüz kayıtlı adresiniz yok.</p>
      <button @click="openAdd()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded th-btn text-sm font-medium">
        ${ICONS.plus} İlk Adresinizi Ekleyin
      </button>
    </div>
  `;
}

function renderFormModal(): string {
  return `
    <!-- Backdrop -->
    <div x-show="isModalOpen"
         x-transition:enter="transition-opacity ease-out duration-200"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="transition-opacity ease-in duration-150"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         @click="closeModal()"
         class="fixed inset-0 bg-black/50 z-40"
         style="display:none"></div>

    <!-- Modal panel -->
    <div x-show="isModalOpen"
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 translate-y-4"
         x-transition:enter-end="opacity-100 translate-y-0"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100 translate-y-0"
         x-transition:leave-end="opacity-0 translate-y-4"
         class="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4"
         style="display:none">
      <div class="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] flex flex-col"
           @click.stop>

        <!-- Modal header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 class="text-base font-semibold text-gray-900"
              x-text="editingId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'"></h2>
          <button @click="closeModal()" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            ${ICONS.close}
          </button>
        </div>

        <!-- Modal body: form -->
        <div class="overflow-y-auto flex-1 px-6 py-5">
          <form @submit.prevent="saveAddress()" class="space-y-4">

            <!-- Adres Başlığı -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Adres Başlığı <span class="text-red-500">*</span>
              </label>
              <input type="text"
                     x-model="form.title"
                     placeholder="örn. Merkez Ofis, Depo"
                     maxlength="60"
                     class="w-full h-10 px-3 border rounded text-sm transition-colors"
                     :class="errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[var(--color-primary,#cc9900)]'"
                     @input="errors.title = false" />
              <p x-show="errors.title" class="text-red-500 text-xs mt-1">Bu alan zorunludur.</p>
            </div>

            <!-- İrtibat Kişisi -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                İrtibat Kişisi <span class="text-red-500">*</span>
              </label>
              <input type="text"
                     x-model="form.contact_name"
                     placeholder="Ad Soyad"
                     maxlength="80"
                     class="w-full h-10 px-3 border rounded text-sm transition-colors"
                     :class="errors.contact_name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[var(--color-primary,#cc9900)]'"
                     @input="errors.contact_name = false" />
              <p x-show="errors.contact_name" class="text-red-500 text-xs mt-1">Bu alan zorunludur.</p>
            </div>

            <!-- Şirket Adı -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Şirket Adı <span class="text-red-500">*</span>
              </label>
              <input type="text"
                     x-model="form.company"
                     placeholder="Şirket A.Ş."
                     maxlength="120"
                     class="w-full h-10 px-3 border rounded text-sm transition-colors"
                     :class="errors.company ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[var(--color-primary,#cc9900)]'"
                     @input="errors.company = false" />
              <p x-show="errors.company" class="text-red-500 text-xs mt-1">Bu alan zorunludur.</p>
            </div>

            <!-- Telefon -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Telefon <span class="text-red-500">*</span>
              </label>
              <input type="tel"
                     x-model="form.phone"
                     placeholder="0212 000 00 00"
                     maxlength="20"
                     class="w-full h-10 px-3 border rounded text-sm transition-colors"
                     :class="errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[var(--color-primary,#cc9900)]'"
                     @input="errors.phone = false" />
              <p x-show="errors.phone" class="text-red-500 text-xs mt-1">Bu alan zorunludur.</p>
            </div>

            <!-- İl + İlçe (yan yana) -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  İl <span class="text-red-500">*</span>
                </label>
                <select x-model="form.state"
                        @change="form.city = ''; errors.state = false"
                        class="w-full h-10 px-3 border rounded text-sm bg-white transition-colors"
                        :class="errors.state ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[var(--color-primary,#cc9900)]'">
                  <option value="">Seçiniz</option>
                  <template x-for="p in provinces" :key="p">
                    <option :value="p" x-text="p"></option>
                  </template>
                </select>
                <p x-show="errors.state" class="text-red-500 text-xs mt-1">Bu alan zorunludur.</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">İlçe</label>
                <select x-model="form.city"
                        class="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white focus:border-[var(--color-primary,#cc9900)] transition-colors"
                        :disabled="!form.state">
                  <option value="">Seçiniz</option>
                  <template x-for="d in districtOptions" :key="d">
                    <option :value="d" x-text="d"></option>
                  </template>
                </select>
              </div>
            </div>

            <!-- Açık Adres -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Adres Satırı <span class="text-red-500">*</span>
              </label>
              <textarea x-model="form.street"
                        placeholder="Mahalle, sokak, bina adı"
                        rows="2"
                        maxlength="300"
                        class="w-full px-3 py-2 border rounded text-sm resize-none transition-colors"
                        :class="errors.street ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[var(--color-primary,#cc9900)]'"
                        @input="errors.street = false"></textarea>
              <p x-show="errors.street" class="text-red-500 text-xs mt-1">Bu alan zorunludur.</p>
            </div>

            <!-- Daire / Posta Kodu (yan yana) -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Daire / Bina</label>
                <input type="text"
                       x-model="form.apartment"
                       placeholder="Kat 3, Daire 7"
                       maxlength="80"
                       class="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:border-[var(--color-primary,#cc9900)] transition-colors" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Posta Kodu</label>
                <input type="text"
                       x-model="form.postal_code"
                       placeholder="34000"
                       maxlength="10"
                       class="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:border-[var(--color-primary,#cc9900)] transition-colors" />
              </div>
            </div>

            <!-- Adres Notu -->
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">
                Adres Notu <span class="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <input type="text"
                     x-model="form.note"
                     placeholder="örn. Hafta içi 09:00-18:00 teslimat"
                     maxlength="150"
                     class="w-full h-10 px-3 border border-gray-300 rounded text-sm focus:border-[var(--color-primary,#cc9900)] transition-colors" />
            </div>

            <!-- Varsayılan checkbox -->
            <label class="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox"
                     x-model="form.is_default"
                     class="w-4 h-4 rounded accent-[var(--color-primary,#cc9900)]" />
              <span class="text-sm text-gray-700">Varsayılan teslimat adresi olarak ayarla</span>
            </label>

          </form>
        </div>

        <!-- Modal footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button @click="closeModal()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button @click="saveAddress()"
                  :disabled="saving"
                  class="px-5 py-2 text-sm font-medium rounded th-btn disabled:opacity-60 disabled:cursor-not-allowed min-w-[80px]">
            <span x-show="!saving">Kaydet</span>
            <span x-show="saving" class="inline-flex items-center gap-1.5">
              <svg class="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Kaydediliyor...
            </span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDeleteConfirm(): string {
  return `
    <!-- Delete confirm backdrop -->
    <div x-show="isDeleteConfirmOpen"
         x-transition:enter="transition-opacity ease-out duration-150"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="transition-opacity ease-in duration-100"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="fixed inset-0 bg-black/50 z-50"
         style="display:none"></div>

    <div x-show="isDeleteConfirmOpen"
         x-transition:enter="transition ease-out duration-150"
         x-transition:enter-start="opacity-0 scale-95"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-in duration-100"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-95"
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="display:none">
      <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center" @click.stop>
        <div class="flex justify-center mb-3 text-amber-500">${ICONS.warning}</div>
        <h3 class="text-base font-semibold text-gray-900 mb-1">Adresi Sil</h3>
        <p class="text-sm text-gray-500 mb-5">
          <strong x-text="deletingTitle"></strong> adresini silmek istediğinize emin misiniz?
        </p>
        <div class="flex gap-3">
          <button @click="isDeleteConfirmOpen = false"
                  class="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button @click="deleteAddress()"
                  class="flex-1 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Sil
          </button>
        </div>
      </div>
    </div>
  `;
}

export function AddressesLayout(): string {
  return `
    <section x-data="addressesManager" class="py-4 pb-8">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-bold text-gray-900">Adreslerim</h1>
        <button x-show="addresses.length > 0"
                @click="openAdd()"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded th-btn text-sm font-medium">
          ${ICONS.plus} Yeni Adres Ekle
        </button>
      </div>

      <!-- Loading skeleton -->
      <div x-show="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <template x-for="i in 3">
          <div class="bg-white rounded-lg p-5 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              <div class="h-3 bg-gray-200 rounded w-2/3"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </template>
      </div>

      <!-- Limit uyarısı -->
      <div x-show="addresses.length >= 10 && !loading"
           class="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
        ${ICONS.warning}
        <span>Maksimum 10 adres limitine ulaştınız. Yeni adres eklemek için mevcut bir adresi silin.</span>
      </div>

      <!-- Address cards grid -->
      <div x-show="addresses.length > 0 && !loading"
           class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        ${renderAddressCard()}
      </div>

      <!-- Empty state -->
      ${renderEmptyState()}

      <!-- Form modal -->
      ${renderFormModal()}

      <!-- Delete confirm -->
      ${renderDeleteConfirm()}

    </section>
  `;
}
