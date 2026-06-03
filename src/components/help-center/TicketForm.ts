/**
 * TicketForm Component
 * Multi-step ticket creation form with step indicator
 */

import { StepIndicator } from "../shared/StepIndicator";
import { t } from "../../i18n";

export function TicketForm(): string {
  const steps = [{ label: t("helpCenter.categoryAndSubject") }, { label: t("helpCenter.details") }];

  return `
    <div class="bg-gray-50 min-h-screen py-8">
      <div class="max-w-[700px] mx-auto px-4 sm:px-6" x-data="ticketForm()">
        <!-- Success State -->
        <template x-if="submitted">
          <div class="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${t("helpCenter.ticketCreated")}</h3>
            <p class="text-sm text-gray-500 mb-4">${t("helpCenter.ticketCreatedDesc")}</p>
            <p class="text-xs text-gray-400">${t("helpCenter.ticketRedirecting")}</p>
          </div>
        </template>

        <template x-if="!submitted">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">${t("helpCenter.createTicket")}</h1>

            ${StepIndicator({ steps, currentStep: 1 })}
            <!-- Dynamic step indicator override -->
            <div x-show="false" x-ref="stepIndicatorData" data-steps="2"></div>

            <div class="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 mt-4">
              <!-- Step 1: Category & Subject -->
              <div x-show="currentStep === 1">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">${t("helpCenter.categoryAndSubject")}</h2>
                <div class="space-y-4">
                  <!-- Category -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t("helpCenter.categoryLabel")}</label>
                    <select x-model="category" class="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" :class="errors.category ? 'border-red-400' : 'border-gray-300'">
                      <option value="">${t("helpCenter.categoryPlaceholder")}</option>
                      <template x-for="cat in categories" :key="cat.id">
                        <option :value="cat.id" x-text="cat.label"></option>
                      </template>
                    </select>
                    <p x-show="errors.category" x-text="errors.category" class="text-xs text-red-500 mt-1"></p>
                  </div>

                  <!-- Sub Category -->
                  <div x-show="category">
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t("helpCenter.subCategoryLabel")}</label>
                    <select x-model="subCategory" class="th-input th-input-md">
                      <option value="">${t("helpCenter.subCategoryPlaceholder")}</option>
                      <template x-for="sub in subCategories" :key="sub">
                        <option :value="sub" x-text="sub"></option>
                      </template>
                    </select>
                  </div>

                  <!-- Subject -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t("helpCenter.subjectLabel")}</label>
                    <input type="text" x-model="subject" class="th-input th-input-md" :class="{ 'is-error': errors.subject }" placeholder="${t("helpCenter.subjectPlaceholder")}">
                    <p x-show="errors.subject" x-text="errors.subject" class="text-xs text-red-500 mt-1"></p>
                  </div>
                </div>
              </div>

              <!-- Step 2: Description & Files -->
              <div x-show="currentStep === 2">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">${t("helpCenter.detailedDescription")}</h2>
                <div class="space-y-4">
                  <!-- Description -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t("helpCenter.descriptionLabel")}</label>
                    <textarea x-model="description" rows="6" class="th-input resize-y" :class="{ 'is-error': errors.description }" placeholder="${t("helpCenter.descriptionPlaceholder")}"></textarea>
                    <div class="flex justify-between mt-1">
                      <p x-show="errors.description" x-text="errors.description" class="text-xs text-red-500"></p>
                      <span class="text-xs text-gray-400 ms-auto" x-text="charCount + ' ${t("helpCenter.characters")}'"></span>
                    </div>
                  </div>

                  <!-- File Upload (tradehub-upload-ui MultiFileDropzone) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${t("helpCenter.fileUploadLabel")}</label>
                    <div id="ticket-dropzone-wrap"></div>
                    <div id="ticket-file-list"></div>
                  </div>
                </div>
              </div>

              <!-- Step 2 devami: Routing + Sipariş Referansı + Ozet -->
              <div x-show="currentStep === 2" class="mt-4 space-y-4">
                <!-- Routing hint -->
                <div x-show="routingHint"
                  class="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                  :class="requiresOrder ? 'bg-primary-50 text-primary-700' : 'bg-blue-50 text-blue-700'">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span x-text="routingHint"></span>
                </div>

                <!-- Sipariş Referansı — sadece satici kategorileri + siparis listesi varsa -->
                <template x-if="requiresOrder && !loadingOrders && orders.length > 0">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      ${t("helpCenter.orderRefLabel")} <span class="text-red-500">*</span>
                    </label>
                    <select x-model="orderRef" class="th-input th-input-md"
                      :class="{ 'is-error': errors.orderRef }">
                      <option value="">— Sipariş seçiniz —</option>
                      <template x-for="o in orders" :key="o.order_number">
                        <option :value="o.order_number"
                          x-text="o.order_number + ' · ' + (o.seller_name || '') + (o.order_date ? ' · ' + o.order_date : '')">
                        </option>
                      </template>
                    </select>
                    <p x-show="errors.orderRef" x-text="errors.orderRef" class="text-xs text-red-500 mt-1"></p>
                    <p x-show="!errors.orderRef" class="text-xs text-gray-400 mt-1">
                      Talep seçtiğiniz siparişin satıcısına iletilir.
                    </p>
                  </div>
                </template>

                <!-- Loading -->
                <template x-if="requiresOrder && loadingOrders">
                  <div class="text-xs text-gray-400 py-2">Siparişler yükleniyor...</div>
                </template>

                <!-- Siparişi olmayan / satici kategorisi ama uygun siparis yok -->
                <template x-if="requiresOrder && !loadingOrders && orders.length === 0">
                  <div class="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs">
                    <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    <span>
                      Bu kategori için uygun bir siparişiniz bulunamadı.
                      Genel sorularınız için kategoriyi <strong>Diğer</strong>,
                      ödeme ile ilgili sorunlar için <strong>Ödeme</strong> olarak seçin.
                    </span>
                  </div>
                </template>

                <!-- Ozet -->
                <div class="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                  <h3 class="font-medium text-gray-800">${t("helpCenter.ticketSummary")}</h3>
                  <p><span class="text-gray-500">${t("helpCenter.summaryCategory")}</span> <span x-text="categories.find(c => c.id === category)?.label || '-'"></span></p>
                  <p><span class="text-gray-500">${t("helpCenter.summarySubject")}</span> <span x-text="subject || '-'"></span></p>
                  <p><span class="text-gray-500">${t("helpCenter.summaryFile")}</span> <span x-text="files.length + ' ${t("helpCenter.summaryFileCount")}'"></span></p>
                </div>

                <!-- Submit hatasi -->
                <p x-show="errors.submit" x-text="errors.submit" class="text-sm text-red-500 text-center"></p>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex justify-between mt-8">
                <button x-show="currentStep > 1" @click="prevStep()" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  ${t("helpCenter.backBtn")}
                </button>
                <div x-show="currentStep === 1" class="w-1"></div>
                <button x-show="currentStep < 2" @click="nextStep()" class="th-btn cursor-pointer ms-auto">
                  ${t("helpCenter.nextBtn")}
                </button>
                <button x-show="currentStep === 2" @click="submitTicket()" class="th-btn cursor-pointer ms-auto">
                  ${t("helpCenter.submitTicket")}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  `;
}
