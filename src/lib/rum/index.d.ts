/**
 * T-123 — `index.js` için el yazımı bildirim dosyası (yalnız TS tarafının
 * kullandığı yüzey). Vendor'lanan JS çekirdeği tsconfig'te `allowJs`
 * olmadan derlendiğinden, TS girişleri (`boot.ts`) bu bildirime dayanır.
 *
 * NOT: `index.js` ayrıca `contract.js` sabitlerini yeniden dışa aktarır;
 * TS tarafında kullanılmadıkları için burada bildirilmediler. TS'ten
 * gerekirse önce buraya bildirim ekle.
 */

/** `createRumCollector` tutamacı — asla fırlatmaz. */
export interface RumHandle {
  stop(): Promise<string>;
  flush(): Promise<string>;
  isSampled(): boolean;
}

export interface StartRumOptions {
  /** Gönderim yolu; varsayılan `POST /api/method/tradehub_core.api.rum.collect`. */
  endpoint?: string;
  /** 0..1, varsayılan 0.1. */
  sampleRate?: number;
  /** Toplanacak metrikler; varsayılan LCP/CLS/INP/FCP/TTFB. */
  metrics?: string[];
  /** Medya motoru sürümü (<=32 karakter). */
  engineVersion?: string;
  /** Tanı geri çağrısı. */
  onDiagnostic?: (kod: string, ayrinti?: unknown) => void;
}

/** Toplayıcıyı bir kez başlat (modül-tekil idempotent). Asla fırlatmaz. */
export function startRum(opts?: StartRumOptions): RumHandle;

/** Toplayıcıyı durdur ve kuyruğu boşalt. Asla fırlatmaz. */
export function stopRum(): Promise<string>;
