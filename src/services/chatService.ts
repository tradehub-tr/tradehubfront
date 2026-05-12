/**
 * Chat transport surface (frontend stub).
 *
 * - v1 stubs are write-only fire-and-forget; they return Promise<void> for
 *   mutations (block/mute/pin/delete/markRead). The Alpine store mutates its
 *   in-memory model directly. The backend integration may evolve these to
 *   return Promise<Conversation> — note the signature change in the migration.
 * - `writeBuffer` is session-scoped; messages persist across popup open/close
 *   but reset on page reload. This is intentional for the frontend-only phase.
 * - `nowHHMM()` uses the local wall-clock; the backend will provide canonical
 *   server-side timestamps.
 */
// TODO(backend): Frontend stub — replace bodies with real API calls when the
// chat backend is provided. Interfaces here are the contract; do not change
// signatures without updating Alpine.store and component consumers.

import type { Conversation, Message, PinnedProduct } from "../types/chat";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "../data/chatMockData";

const FAKE_LATENCY_MS = 250;

function delay<T>(value: T, ms = FAKE_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// In-memory write buffer so optimistic UI persists across re-opens during the session.
const writeBuffer: Record<string, Message[]> = {};

function readAll(conversationId: string): Message[] {
  const seed = MOCK_MESSAGES[conversationId] ?? [];
  const local = writeBuffer[conversationId] ?? [];
  return [...seed, ...local];
}

export async function listConversations(): Promise<Conversation[]> {
  return delay(MOCK_CONVERSATIONS.slice());
}

export async function findConversationBySellerId(sellerId: string): Promise<Conversation | null> {
  const conv = MOCK_CONVERSATIONS.find((c) => c.sellerId === sellerId);
  return delay(conv ?? null);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  return delay(readAll(conversationId));
}

export async function sendTextMessage(
  conversationId: string,
  text: string,
  _pinnedProduct?: PinnedProduct,
): Promise<Message> {
  const msg: Message = {
    id: `m-local-${Date.now()}`,
    conversationId,
    direction: "me",
    body: { type: "text", text },
    time: nowHHMM(),
    read: false,
  };
  (writeBuffer[conversationId] ??= []).push(msg);
  return delay(msg);
}

export async function markConversationRead(_conversationId: string): Promise<void> {
  return delay(undefined);
}

export async function blockConversation(_conversationId: string): Promise<void> {
  return delay(undefined);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  delete writeBuffer[conversationId];
  return delay(undefined);
}

export async function muteConversation(_conversationId: string, _mute: boolean): Promise<void> {
  return delay(undefined);
}

export async function pinConversation(_conversationId: string, _pin: boolean): Promise<void> {
  return delay(undefined);
}
