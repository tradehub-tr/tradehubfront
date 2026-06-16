/**
 * ReservationModal — Plus tier seller'larla mesajlaşmadan önce slot seçim modal'ı.
 * Alpine store: `reservationModal`. mountReservationModal() ile body'e bir kere
 * eklenir; başka kodlardan `chat-popup:open`'a benzer event ile tetiklenir:
 *
 *   window.dispatchEvent(new CustomEvent("reservation-modal:open", {
 *     detail: { sellerId: "...", sellerName: "..." }
 *   }))
 */

import { t } from "../../i18n";

export function ReservationModal(): string {
  return /* html */ `
		<div x-data
			 x-show="$store.reservationModal.isOpen"
			 x-cloak
			 x-transition:enter="transition ease-out duration-200"
			 x-transition:enter-start="opacity-0"
			 x-transition:enter-end="opacity-100"
			 x-transition:leave="transition ease-out duration-150"
			 x-transition:leave-start="opacity-100"
			 x-transition:leave-end="opacity-0"
			 @click.self="$store.reservationModal.close()"
			 class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div x-show="$store.reservationModal.isOpen"
				 x-transition:enter="transition ease-out duration-200"
				 x-transition:enter-start="opacity-0 scale-95 motion-reduce:scale-100"
				 x-transition:enter-end="opacity-100 scale-100"
				 x-transition:leave="transition ease-out duration-150"
				 x-transition:leave-start="opacity-100 scale-100"
				 x-transition:leave-end="opacity-0 scale-95 motion-reduce:scale-100"
				 class="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
				<!-- Header -->
				<div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
					<div>
						<h2 class="text-base font-semibold text-gray-800">${t("commonSvc.meetingReservation")}</h2>
						<p class="text-xs text-gray-500 mt-0.5">
							<span x-text="$store.reservationModal.sellerName"></span> — ${t("commonSvc.pickAvailableHour")}
						</p>
					</div>
					<button @click="$store.reservationModal.close()"
							class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 border-none bg-transparent cursor-pointer">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>

				<!-- Body -->
				<div class="flex-1 overflow-y-auto px-5 py-4">
					<!-- Success: aktif rezervasyon — chat hemen açılabilir -->
					<template x-if="$store.reservationModal.successReservation && $store.reservationModal.successActive">
						<div class="text-center py-6">
							<div class="text-4xl mb-3">✓</div>
							<h3 class="text-base font-semibold text-gray-800 mb-2">${t("commonSvc.reservationConfirmed")}</h3>
							<p class="text-sm text-gray-500 mb-5">
								${t("commonSvc.canStartChatNowPrefix")} <strong x-text="$store.reservationModal.sellerName"></strong> ${t("commonSvc.canStartChatNowSuffix")}
							</p>
							<button @click="$store.reservationModal.openChatAfterReserve()"
									class="th-btn-primary w-full">
								${t("commonSvc.startChatBtn")}
							</button>
						</div>
					</template>

					<!-- Success: ileri tarihli rezervasyon — beklemesi gerek -->
					<template x-if="$store.reservationModal.successReservation && !$store.reservationModal.successActive">
						<div class="text-center py-6">
							<div class="text-4xl mb-3">📅</div>
							<h3 class="text-base font-semibold text-gray-800 mb-2">${t("commonSvc.reservationAccepted")}</h3>
							<p class="text-sm text-gray-600 mb-2">
								<strong x-text="$store.reservationModal.sellerName"></strong> ${t("commonSvc.meetingWindowSuffix")}
							</p>
							<p class="text-sm font-medium text-violet-600 mb-5"
							   x-text="$store.reservationModal.successReservation
									? $store.reservationModal.formatSlot($store.reservationModal.successReservation.start_at, $store.reservationModal.successReservation.end_at)
									: ''"></p>
							<p class="text-xs text-gray-500 mb-5">
								${t("commonSvc.retryChatAtTime")}
							</p>
							<button @click="$store.reservationModal.close()"
									class="th-btn-primary w-full">
								${t("commonSvc.ok")}
							</button>
						</div>
					</template>

					<!-- Loading -->
					<template x-if="!$store.reservationModal.successReservation && $store.reservationModal.loading">
						<div class="py-8 text-center text-sm text-gray-500">${t("commonSvc.slotsLoading")}</div>
					</template>

					<!-- Empty -->
					<template x-if="!$store.reservationModal.successReservation && !$store.reservationModal.loading && $store.reservationModal.slots.length === 0">
						<div class="py-8 text-center">
							<div class="text-3xl mb-3">📭</div>
							<p class="text-sm text-gray-600 mb-1">${t("commonSvc.noSlotsAvailable")}</p>
							<p class="text-xs text-gray-400">${t("commonSvc.noSlotsHint")}</p>
						</div>
					</template>

					<!-- Slot list -->
					<template x-if="!$store.reservationModal.successReservation && !$store.reservationModal.loading && $store.reservationModal.slots.length > 0">
						<div class="space-y-2">
							<template x-for="slot in $store.reservationModal.slots" :key="slot.id">
								<button @click="$store.reservationModal.selectSlot(slot.id)"
										class="w-full flex items-start gap-3 p-3 rounded-lg border text-start cursor-pointer transition-colors bg-white"
										:class="$store.reservationModal.selectedSlotId === slot.id
											? 'border-(--color-cta-primary,#cc9900) bg-(--color-primary-50,#fff8e1)'
											: 'border-gray-200 hover:border-gray-300'">
									<div class="w-10 h-10 flex items-center justify-center rounded-full bg-(--color-primary-50,#fff8e1) text-(--color-cta-primary,#cc9900) flex-shrink-0">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
										</svg>
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-sm font-medium text-gray-800"
											 x-text="$store.reservationModal.formatSlot(slot.start_at, slot.end_at)"></div>
										<div class="text-xs text-gray-500 mt-0.5" x-text="slot.notes || '${t("commonSvc.availableForMeeting")}'"></div>
									</div>
									<template x-if="$store.reservationModal.selectedSlotId === slot.id">
										<div class="w-5 h-5 rounded-full bg-(--color-cta-primary,#cc9900) text-white flex items-center justify-center flex-shrink-0">
											<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
											</svg>
										</div>
									</template>
								</button>
							</template>
						</div>
					</template>

					<!-- Error -->
					<template x-if="$store.reservationModal.error">
						<div class="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
							 x-text="$store.reservationModal.error"></div>
					</template>
				</div>

				<!-- Footer -->
				<template x-if="!$store.reservationModal.successReservation">
					<div class="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
						<button @click="$store.reservationModal.close()"
								class="th-btn-outline flex-1">
							${t("commonSvc.cancel")}
						</button>
						<button @click="$store.reservationModal.confirm()"
								:disabled="!$store.reservationModal.selectedSlotId || $store.reservationModal.reserving"
								class="th-btn-primary flex-1"
								:class="(!$store.reservationModal.selectedSlotId || $store.reservationModal.reserving) ? 'opacity-50 cursor-not-allowed' : ''">
							<span x-text="$store.reservationModal.reserving ? '${t("commonSvc.reserving")}' : '${t("commonSvc.reserve")}'"></span>
						</button>
					</div>
				</template>
			</div>
		</div>
	`;
}

const MOUNT_ID = "reservation-modal-mount";

export function mountReservationModal(): void {
  if (document.getElementById(MOUNT_ID)) return;
  const container = document.createElement("div");
  container.id = MOUNT_ID;
  container.innerHTML = ReservationModal();
  document.body.appendChild(container);
}
