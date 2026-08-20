/**
 * T-123 — RUM boot: MPA girişleri için ortak, çift-başlatma korumalı montaj.
 *
 * Bu proje çok girişli (MPA) bir Vite uygulamasıdır: her HTML sayfasının
 * kendi `src/pages/*.ts` girişi vardır ve ORTAK bir bootstrap modülü YOKTUR
 * (ölçüldü 2026-08-20: 72 giriş; `../style.css` bile yalnız 62'sinde).
 * Tam sayfa-tipi kapsaması için bu modül HER girişten side-effect import
 * edilir:
 *
 *   import "../lib/rum/boot";      // src/pages/* girişleri
 *   import "./lib/rum/boot";       // src/main.ts
 *
 * ÇİFT BAŞLATMA KORUMASI — iki katman:
 *   1. `startRum` zaten modül-tekil idempotenttir (index.js).
 *   2. Bundler aynı modülü iki ayrı chunk'a kopyalarsa (1) yetmez; bu
 *      yüzden `globalThis` üzerinde bayrak tutulur. Aynı sayfada bu modül
 *      kaç kez import edilirse edilsin TEK toplayıcı başlar.
 *
 * Örneklem %10 — T-123 dokümanı (rapor 60 §8). Telemetri sayfayı asla
 * kırmaz: `startRum` fırlatmamayı taahhüt eder.
 */
import { startRum, type RumHandle } from "./index.js";

const BAYRAK = "__tradehubRumBooted" as const;

type RumGlobal = typeof globalThis & { [BAYRAK]?: boolean };

/**
 * Toplayıcıyı en fazla bir kez başlat.
 *
 * @returns yeni başlatıldıysa toplayıcı tutamacı; bu sayfada zaten
 *          başlatılmışsa `null` (ikinci çağrı hiçbir şey yapmaz).
 */
export function bootRum(): RumHandle | null {
  const g = globalThis as RumGlobal;
  if (g[BAYRAK]) return null;
  g[BAYRAK] = true;
  return startRum({ sampleRate: 0.1 });
}

bootRum();
