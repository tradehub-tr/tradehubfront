/**
 * Push notification kurulumu — native (iOS/Android, Capacitor) + web (Service Worker + VAPID).
 *
 * - **Native:** `@capacitor/push-notifications` ile APNs/FCM token alınır ve backend'e kaydedilir.
 * - **Web:** `vite-plugin-pwa`'nın kurduğu Service Worker (bkz. `vite.config.ts` → `VitePWA`)
 *   zaten sayfa yüklendiğinde register edilir; burada yalnızca `PushManager.subscribe` ile
 *   VAPID aboneliği oluşturulup backend'e gönderilir.
 *
 * Backend karşılığı:
 *  - `tradehub_core.api.push.get_public_key()`  — VAPID public key (`allow_guest=True`)
 *  - `tradehub_core.api.push.subscribe(endpoint,p256dh,auth)` — web push abonelik kaydı
 *  - `tradehub_core.api.v1.notification_preferences.register_push_device(token, platform)` —
 *    native cihaz kaydı (`platform`: `ios` | `android`). Native sağlayıcı kurulu değilse
 *    **503 PROVIDER_UNAVAILABLE** döner; token kabul edilmiş sayılmaz.
 *
 * Başarı yalnız kayıt sunucuda gerçekten tamamlanınca bildirilir (`PushEnableResult.outcome`);
 * tarayıcı izninin verilmiş olması tek başına "açık" demek değildir.
 *
 * Kullanım: login sonrası bir kez `initPushNotifications()` çağrılır (idempotent).
 */

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type {
  ActionPerformed,
  PushNotificationSchema,
  RegistrationError,
  Token,
} from "@capacitor/push-notifications";
import type { NotifPushDeviceState } from "../types/notificationPreferences";
import { ApiHttpError, callMethod } from "./api";
import { waitForAuth } from "./auth";

let _initStarted = false;
let _nativeListenersReady = false;

/** Native token'ın kaydı için en çok bu kadar beklenir (APNs/FCM yanıtı). */
const NATIVE_TOKEN_TIMEOUT_MS = 15_000;

/**
 * "Bu cihazda aç" denemesinin sonucu:
 *   · `registered` — izin verildi VE sunucu kaydı aldı
 *   · `denied` — kullanıcı/tarayıcı izni vermedi
 *   · `unsupported` — cihaz push'u desteklemiyor
 *   · `provider-unavailable` — sunucuda gönderim sağlayıcısı yok (503 / VAPID kapalı)
 *   · `failed` — beklenmeyen hata
 */
export type PushEnableOutcome =
  | "registered"
  | "denied"
  | "unsupported"
  | "provider-unavailable"
  | "failed";

export interface PushEnableResult {
  outcome: PushEnableOutcome;
  /** Denemeden sonra cihazın izin durumu (`getPushDeviceState`). */
  state: NotifPushDeviceState | null;
}

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

// ─── Bu cihazın izin durumu (Ayarlar > Bildirimler) ───────────────────────

/**
 * Bu cihazın/tarayıcının push izni — İZİN İSTEMEDEN okur.
 *
 * `null`: cihaz push'u hiç desteklemiyor (ör. Service Worker'sız tarayıcı); ekran
 * o durumda sunucunun hesap düzeyindeki bilgisine düşer. `cihaz-yok` burada
 * üretilmez — o, hesaba bağlı cihaz olmadığını söyleyen sunucu durumudur.
 */
export async function getPushDeviceState(): Promise<NotifPushDeviceState | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { receive } = await PushNotifications.checkPermissions();
      if (receive === "granted") return "hazir";
      return receive === "denied" ? "engelli" : "izin-yok";
    }
    if (
      typeof Notification === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return null;
    }
    if (Notification.permission === "granted") return "hazir";
    return Notification.permission === "denied" ? "engelli" : "izin-yok";
  } catch {
    return null;
  }
}

/**
 * Kullanıcı "İzin ver"e bastığında: izin ister, verilirse aboneliği/token'ı kaydeder
 * ve GERÇEK sonucu döner. `initPushNotifications`'ın tek seferlik kilidine bağlı değildir —
 * kullanıcı eylemiyle tekrar çağrılabilir.
 */
export async function enablePushOnThisDevice(): Promise<PushEnableResult> {
  const outcome = Capacitor.isNativePlatform() ? await initNativePush() : await initWebPush();
  return { outcome, state: await getPushDeviceState() };
}

/** 503 / PROVIDER_UNAVAILABLE mı. */
function isProviderUnavailable(err: unknown): boolean {
  return (
    err instanceof ApiHttpError && (err.status === 503 || err.errorCode === "PROVIDER_UNAVAILABLE")
  );
}

// ─── Native (iOS/Android) ─────────────────────────────────────────────────

async function ensureNativeListeners(): Promise<void> {
  if (_nativeListenersReady) return;
  _nativeListenersReady = true;
  await PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      // Foreground'da gelen bildirim — native banner otomatik gösterilmiyor,
      // burada gerekirse in-app toast/badge tetiklenebilir.
      console.warn("[push] foreground notification received", notification);
    }
  );
  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action: ActionPerformed) => {
      handleNotificationTap(action.notification.data as Record<string, unknown> | undefined);
    }
  );
}

/** APNs/FCM token'ını bekler; hata ya da zaman aşımında `null`. */
async function waitForNativeToken(): Promise<string | null> {
  return new Promise((resolve) => {
    let done = false;
    const handles: Promise<{ remove: () => Promise<void> }>[] = [];
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      for (const h of handles) void h.then((x) => x.remove()).catch(() => undefined);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), NATIVE_TOKEN_TIMEOUT_MS);
    handles.push(PushNotifications.addListener("registration", (t: Token) => finish(t.value)));
    handles.push(
      PushNotifications.addListener("registrationError", (error: RegistrationError) => {
        console.warn("[push] native registration error", error);
        finish(null);
      })
    );
    PushNotifications.register().catch(() => finish(null));
  });
}

async function initNativePush(): Promise<PushEnableOutcome> {
  try {
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") return "denied";
    await ensureNativeListeners();
    const token = await waitForNativeToken();
    if (!token) return "failed";
    return await saveNativeTokenToBackend(token);
  } catch (err) {
    console.warn("[push] native init failed", err);
    return "failed";
  }
}

async function saveNativeTokenToBackend(token: string): Promise<PushEnableOutcome> {
  const platform = Capacitor.getPlatform();
  if (platform !== "ios" && platform !== "android") return "unsupported";
  try {
    await callMethod(
      "tradehub_core.api.v1.notification_preferences.register_push_device",
      { token, platform },
      true
    );
    return "registered";
  } catch (err) {
    if (isProviderUnavailable(err)) return "provider-unavailable";
    console.warn("[push] register_push_device failed", err);
    return "failed";
  }
}

// ─── Web (Service Worker + VAPID) ─────────────────────────────────────────

async function initWebPush(): Promise<PushEnableOutcome> {
  if (
    typeof Notification === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const { public_key, enabled } = await callMethod<{ public_key: string; enabled: boolean }>(
        "tradehub_core.api.push.get_public_key"
      );
      if (!enabled || !public_key) return "provider-unavailable";

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });
    }

    const json = subscription.toJSON();
    const endpoint = json.endpoint;
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!endpoint || !p256dh || !auth) return "failed";

    await callMethod("tradehub_core.api.push.subscribe", { endpoint, p256dh, auth }, true);
    return "registered";
  } catch (err) {
    if (isProviderUnavailable(err)) return "provider-unavailable";
    console.warn("[push] web init failed", err);
    return "failed";
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
