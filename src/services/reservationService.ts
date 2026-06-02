/**
 * Rezervasyon servisi — tradehub_core.api.reservation.* wrapper'ı.
 *
 * Plus tier seller'larla mesajlaşmadan önce rezervasyon yapmak gerekir.
 * chatService.startOrGetThread() çağrısı server-side gating yapar; ama UX
 * için frontend de can_chat() ile önceden kontrol eder ve gerekirse
 * ReservationModal açar.
 */

import { callMethod } from "../utils/api";

export interface AvailableSlot {
	id: string;
	start_at: string; // server datetime ISO
	end_at: string;
	notes: string;
	is_reserved: boolean;
}

export interface Reservation {
	id: string;
	buyer_user: string;
	seller_user: string;
	counterpart?: string;
	counterpart_name?: string;
	start_at: string;
	end_at: string;
	status: "Active" | "Cancelled" | "Expired";
	slot?: string;
	cancelled_at?: string | null;
}

export interface CanChatResult {
	allowed: boolean;
	reason: "premium_seller" | "active_reservation" | "reservation_required" | "self_chat";
	tier: "Premium" | "Plus" | "n/a";
	message?: string;
	active_reservation?: {
		id?: string;
		start_at?: string;
		end_at?: string;
		slot?: string;
	};
}

async function gpost<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
	return callMethod<T>(method, params, true);
}

async function gget<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
	return callMethod<T>(method, params, false);
}

export async function canChat(sellerId: string): Promise<CanChatResult> {
	return gget<CanChatResult>("tradehub_core.api.reservation.can_chat", { seller_id: sellerId });
}

export async function listSellerSlots(sellerId: string): Promise<AvailableSlot[]> {
	const r = await gget<AvailableSlot[]>(
		"tradehub_core.api.reservation.list_seller_slots",
		{ seller_id: sellerId }
	);
	return Array.isArray(r) ? r : [];
}

export async function reserveSlot(slotId: string): Promise<Reservation> {
	return gpost<Reservation>("tradehub_core.api.reservation.reserve_slot", { slot_id: slotId });
}

export async function listMyReservations(includePast = false): Promise<Reservation[]> {
	const r = await gget<Reservation[]>(
		"tradehub_core.api.reservation.list_my_reservations",
		{ include_past: includePast ? 1 : 0 }
	);
	return Array.isArray(r) ? r : [];
}

export async function cancelReservation(reservationId: string): Promise<Reservation> {
	return gpost<Reservation>("tradehub_core.api.reservation.cancel_reservation", {
		reservation_id: reservationId,
	});
}

/** Tarih formatla — tr-TR locale, "14 May 17:24" gibi. */
export function formatSlot(start: string, end: string): string {
	try {
		const s = new Date(start.replace(" ", "T"));
		const e = new Date(end.replace(" ", "T"));
		const day = s.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
		const sh = `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`;
		const eh = `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
		return `${day} · ${sh} – ${eh}`;
	} catch {
		return `${start} – ${end}`;
	}
}
