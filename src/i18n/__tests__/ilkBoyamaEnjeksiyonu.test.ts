/**
 * İLK BOYAMA DİLİ — enjeksiyon denetimi (MOGEM-642 · Faz 2).
 *
 * Yukarıdaki `ilkBoyamaDili.test.ts` script'in KARARINI doğruluyor. Burası
 * script'in SAYFAYA GİRDİĞİNİ doğrular; ikisi ayrı kusur: doğru karar veren
 * bir script hiçbir sayfaya konmazsa ziyaretçi için hiçbir şey değişmez.
 *
 * Faz 1'de tam bu tür bir boşluk ölçüldü: `panel-dil-butunlugu.spec.ts`
 * yazıldığı günden beri hiçbir koşum listesinde değildi, yani hiç çalışmamıştı.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Plugin } from "vite";
import { describe, expect, it } from "vitest";

const KOK = process.cwd();

const ORNEK_HTML = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title data-i18n="pageTitle.home">iStoc</title>
  </head>
  <body><div id="app"></div></body>
</html>`;

async function eklentiyiBul() {
  const config = (await import("../../../vite.config")).default as { plugins?: unknown };
  const duz = (config.plugins as unknown[]).flat(3) as Plugin[];
  return duz.find((p) => p && p.name === "ilk-boyama-dili-inject");
}

async function donustur(html: string): Promise<string> {
  const eklenti = await eklentiyiBul();
  const kanca = eklenti?.transformIndexHtml;
  const isleyici = typeof kanca === "function" ? kanca : kanca?.handler;
  const sonuc = await (isleyici as (h: string, c?: unknown) => Promise<string> | string)(html, {
    path: "/index.html",
    filename: join(KOK, "index.html"),
  });
  return typeof sonuc === "string" ? sonuc : html;
}

describe("vite eklentisi sayfaya gerçekten enjekte ediyor", () => {
  it("eklenti config'de KAYITLI", async () => {
    // Eklentiyi yazıp diziye eklemeyi unutmak, testleri yeşil bırakıp
    // üretimde hiçbir şey değiştirmeyen sessiz bir kusurdur.
    expect(await eklentiyiBul()).toBeTruthy();
  });

  it("ülke meta'sı ve açılış script'i <head>'e giriyor", async () => {
    const cikti = await donustur(ORNEK_HTML);
    expect(cikti).toContain('name="th-country"');
    expect(cikti).toContain("__thDil");
  });

  it("ülke meta'sı açılış script'inden ÖNCE geliyor", async () => {
    // Script `<head>` ayrıştırılırken çalışıyor: kendinden SONRA gelen bir
    // meta'yı göremez, ülke basamağı sessizce ölür (Faz 5'i bozar).
    const cikti = await donustur(ORNEK_HTML);
    expect(cikti.indexOf('name="th-country"')).toBeLessThan(cikti.indexOf("__thDil"));
  });

  it("açılış script'i <title>'dan ÖNCE, başlık script'i SONRA geliyor", async () => {
    // Başlık script'i `<title>`dan önce konsaydı, ayrıştırıcı etikete
    // geldiğinde `document.title`ı statik Türkçe değerine geri yazardı.
    const cikti = await donustur(ORNEK_HTML);
    const kararIdx = cikti.indexOf("__thDil={lang");
    const titleSonu = cikti.indexOf("</title>");
    const baslikIdx = cikti.indexOf("title[data-i18n]");
    expect(kararIdx).toBeGreaterThan(-1);
    expect(kararIdx).toBeLessThan(titleSonu);
    expect(baslikIdx).toBeGreaterThan(titleSonu);
  });

  it("başlık haritası dört dili de taşıyor ve gerçek çevirilerden geliyor", async () => {
    const cikti = await donustur(ORNEK_HTML);
    const eslesme = /var B=(\{.*?\});var e=document/.exec(cikti);
    expect(eslesme).toBeTruthy();
    const harita = JSON.parse(eslesme![1]) as Record<string, string>;
    expect(Object.keys(harita).sort()).toEqual(["ar", "en", "ru", "tr"]);
    // Uydurulmuş değil, sözlükteki değerin ta kendisi olmalı.
    const tr = (await import("../locales/tr")).default as unknown as {
      translation: { pageTitle: Record<string, string> };
    };
    expect(harita.tr).toBe(tr.translation.pageTitle.home);
  });

  it("anahtarsız <title> olan sayfada başlık script'i EKLENMEZ", async () => {
    // 404, media-watch, returns… yedi sayfanın başlığında `data-i18n` yok.
    const cikti = await donustur(ORNEK_HTML.replace(' data-i18n="pageTitle.home"', ""));
    expect(cikti).toContain("__thDil");
    expect(cikti).not.toContain("title[data-i18n]");
  });

  it("iki kez çalıştırılınca script'i ÇİFTLEMEZ", async () => {
    const birKez = await donustur(ORNEK_HTML);
    const ikiKez = await donustur(birKez);
    expect(ikiKez).toBe(birKez);
  });
});

describe("CSP açılış script'lerini engellemiyor", () => {
  it("nginx script-src 'unsafe-inline' içeriyor", () => {
    // Üç açılış script'i de (depolama shim'i, tema, dil) satır içi. CSP'den
    // 'unsafe-inline' kaldırılırsa hiçbiri çalışmaz ve kusur SESSİZ olur:
    // sayfa açılır, yalnız dil/tema/gizli-sekme davranışı geri döner.
    // Sıkılaştırma gerekirse doğru yol nonce/hash — o zaman bu test de
    // güncellenir ve kimse habersiz kalmaz.
    const conf = readFileSync(join(KOK, "nginx.conf.template"), "utf8");
    const satir = conf.split("\n").find((s) => /add_header\s+Content-Security-Policy\s+"/.test(s));
    expect(satir, "CSP başlığı bulunamadı").toBeTruthy();
    const scriptSrc = /script-src([^;]*);/.exec(satir!);
    expect(scriptSrc, "script-src yönergesi yok").toBeTruthy();
    expect(scriptSrc![1]).toContain("'unsafe-inline'");
  });
});
