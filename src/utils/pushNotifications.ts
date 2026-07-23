/**
 * Push notification kurulumu — native (iOS/Android, Capacitor) + web (Service Worker + VAPID).
 *
 * - **Native:** `@capacitor/push-notifications` ile APNs/FCM token alınır ve backend'e kaydedilir.
 * - **Web:** `vite-plugin-pwa`'nın kurduğu Service Worker (bkz. `vite.config.ts` → `VitePWA`)
 *   zaten sayfa yüklendiğinde register edilir; burada yalnızca `PushManager.subscribe` ile
 *   VAPID aboneliği oluşturulup backend'e gönderilir.
 *
 * Backend karşılığı: `tradehub_core/api/push.py`
 *  - `get_public_key()`             — VAPID public key (mevcut, `allow_guest=True`)
 *  - `subscribe(endpoint,p256dh,auth)` — web push abonelik kaydı (mevcut, login zorunlu)
 *  - `register_device_token(token,platform)` — native cihaz token kaydı: **backend'de henüz
 *    yok** (TODO — `tradehub_core/api/push.py`'ye eklenmeli, `Push Subscription` DocType'ına
 *    benzer bir `platform`/`token` alanlı kayıt ya da ayrı bir `Device Token` DocType gerekir).
 *    Eklenene kadar bu çağrı 404 döner; sessizce loglanır, akışı bozmaz.
 *
 * Kullanım: login sonrası bir kez `initPushNotifications()` çağrılır (idempotent).
 */

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type { ActionPerformed, PushNotificationSchema, Token } from "@capacitor/push-notifications";
import { callMethod } from "./api";
import { waitForAuth } from "./auth";

let _initStarted = false;

/**
 * Push bildirimlerini kurar. Native'de izin ister + token alır, web'de VAPID abonelik
 * oluşturur. Giriş yapmamış kullanıcı için no-op (backend endpoint'leri login ister).
 * Idempotent — aynı sayfa ömründe birden fazla çağrılırsa yalnızca ilki işlem yapar.
 */
export async function initPushNotifications(): Promise<void> {
  if (_initStarted) return;
  _initStarted = true;

  const user = await waitForAuth();
  if (!user) return;

  if (Capacitor.isNativePlatform()) {
    await initNativePush();
  } else {
    await initWebPush();
  }
}

// ─── Native (iOS/Android) ─────────────────────────────────────────────────

async function initNativePush(): Promise<void> {
  try {
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") return;

    PushNotifications.addListener("registration", (token: Token) => {
      void saveNativeTokenToBackend(token.value, Capacitor.getPlatform());
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.warn("[push] native registration error", error);
    });

    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        // Foreground'da gelen bildirim — native banner otomatik gösterilmiyor,
        // burada gerekirse in-app toast/badge tetiklenebilir.
        console.warn("[push] foreground notification received", notification);
      },
    );

    PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
      handleNotificationTap(action.notification.data as Record<string, unknown> | undefined);
    });

    await PushNotifications.register();
  } catch (err) {
    console.warn("[push] native init failed", err);
  }
}

async function saveNativeTokenToBackend(token: string, platform: string): Promise<void> {
  try {
    await callMethod("tradehub_core.api.push.register_device_token", { token, platform }, true);
  } catch (err) {
    // Backend endpoint'i henüz yok (bkz. dosya başı TODO) — sessizce logla, kullanıcı akışını bozma.
    console.warn("[push] register_device_token failed (backend endpoint may not exist yet)", err);
  }
}

// ─── Web (Service Worker + VAPID) ─────────────────────────────────────────

async function initWebPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const { public_key, enabled } = await callMethod<{ public_key: string; enabled: boolean }>(
        "tradehub_core.api.push.get_public_key",
      );
      if (!enabled || !public_key) return;

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });
    }

    const json = subscription.toJSON();
    const endpoint = json.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!endpoint || !p256dh || !auth) return;

    await callMethod("tradehub_core.api.push.subscribe", { endpoint, p256dh, auth }, true);
  } catch (err) {
    console.warn("[push] web init failed", err);
  }
}

/** VAPID public key'i (base64url) `PushManager.subscribe`'ın istediği `Uint8Array`'e çevirir. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) output[i] = binary.charCodeAt(i);
  return output;
}

// ─── Ortak: bildirime tıklama → yönlendirme ───────────────────────────────

/** Bildirim payload'ındaki `data.url` alanına göre sayfa yönlendirmesi yapar (native tap). */
function handleNotificationTap(data?: Record<string, unknown>): void {
  const url = typeof data?.url === "string" ? data.url : null;
  if (url) window.location.href = url;
}
