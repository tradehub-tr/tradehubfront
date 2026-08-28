/**
 * Storybook kırık kaynak taraması — görsel turun otomatikleşen kısmı.
 *
 * Her story açılır; 404 dönen kaynak (kırık görsel) ve konsol hatası toplanır.
 * 12-FE denetiminde POD imza/fotoğrafının kırık olduğu YALNIZ gözle görülmüştü;
 * bu tarama o sınıfı otomatik yakalar.
 *
 * `tests/e2e` DIŞINDA duruyor (`playwright.config.ts` → `testDir: "./tests/e2e"`):
 * Storybook build'i ve ayrı bir HTTP sunucusu istiyor, CI koşusuna girmemeli.
 * Elle çalıştırılır — komut `GOREV-TAMAMLAMA-SOZLESMESI.md` §6.1'de.
 */
/* eslint-disable no-console -- Aracın TEK çıktısı konsol raporu. */
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const SB = process.env.SB_URL!;
const index = JSON.parse(readFileSync(process.env.SB_INDEX!, "utf8"));
/**
 * KASITLI kırık kaynak taşıyan story'ler.
 *
 * Bazı story'lerin işi zaten "kaynak gelmediğinde ne oluyor"u göstermek.
 * Onları bulgu saymak aracı gürültüye boğar ve gerçek kusuru gizler — ama
 * listeye eklemek BİLİNÇLİ bir karar olmalı, gerekçesiyle.
 */
const BEKLENEN: Record<string, string> = {
  "logistics-s9-label-download--barkod-yuklenemedi":
    "Barkod adresi var ama dosya gelmiyor — `onerror` yedeğinin kendisi sınanıyor.",
};

const storyler: string[] = Object.keys(index.entries ?? {}).filter(
  (k) => !k.endsWith("--docs") && (index.entries[k].type ?? "story") === "story"
);

test("hiçbir story kırık kaynak ya da konsol hatası üretmiyor", async ({ page }) => {
  test.setTimeout(600_000);
  const bulgular: string[] = [];
  const beklenenler: string[] = [];

  for (const id of storyler) {
    const kirik: string[] = [];
    const hatalar: string[] = [];
    const onResponse = (r: { status: () => number; url: () => string }) => {
      const u = r.url();
      // API çağrıları Storybook'ta zaten 404 — backend yok, bu gürültü.
      // Aranan şey STATİK varlık: görsel, font, belge. Kırık görsel ekranda
      // görünür ve kullanıcıya "bir şey bozuk" der.
      if (u.includes("/api/method/")) return;
      if (r.status() >= 400) kirik.push(`${r.status()} ${u.split("/").pop()}`);
    };
    const onConsole = (m: { type: () => string; text: () => string }) => {
      const t = m.text();
      if (m.type() === "error" && !t.includes("api/method")) hatalar.push(t.slice(0, 90));
    };
    page.on("response", onResponse);
    page.on("console", onConsole);

    await page.goto(`${SB}/iframe.html?id=${id}&viewMode=story`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);

    page.off("response", onResponse);
    page.off("console", onConsole);
    if (kirik.length && !BEKLENEN[id]) bulgular.push(`[KIRIK] ${id} → ${kirik.join(", ")}`);
    if (kirik.length && BEKLENEN[id]) beklenenler.push(`[BEKLENEN] ${id} — ${BEKLENEN[id]}`);
  }

  console.log(`\n=== ${storyler.length} story tarandı ===`);
  for (const b of bulgular) console.log(b);
  for (const b of beklenenler) console.log(b);
  console.log(`=== ${bulgular.length} bulgu · ${beklenenler.length} beklenen ===\n`);

  // Beklenen bir story kırık DEĞİLSE liste bayatlamış demektir.
  const bayat = Object.keys(BEKLENEN).filter(
    (id) => storyler.includes(id) && !beklenenler.some((b) => b.includes(id))
  );
  expect(bayat, `Artık kırık olmayan "beklenen" kayıtlar — listeden düşürün:`).toEqual([]);
  expect(bulgular, `Kırık kaynak/konsol hatası:\n${bulgular.join("\n")}`).toEqual([]);
});
