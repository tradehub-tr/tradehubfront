// @vitest-environment happy-dom

/**
 * Sayı yereli — 21 Eyl 2026'da eklendi.
 *
 * NEDEN: `getCurrentLang() === "en" ? "en-US" : "tr-TR"` deseni Arapça ve
 * Rusça ziyaretçiye Türkçe sayı biçimi veriyordu. Rusçada binlik ayırıcı
 * boşluktur; `1.234` bir Rus okuyucu için ondalık gibi görünür.
 *
 * Bu dosya AYRICA bir tasarım kararını kilitliyor: Arapça için BÖLGESİZ "ar"
 * kullanılır. `ar-SA`/`ar-EG` Doğu Arap rakamı (٣٤٥) üretir ve bu pazaryerinde
 * istenmiyor — biri bölge kodu eklerse test kırmızıya döner ve kararı hatırlatır.
 */
import { describe, expect, it, vi } from "vitest";

import { aktifSayiYereli, sayiBicimle } from "./numberLocale";

const aktifDil = vi.hoisted(() => ({ deger: "tr" as string }));
vi.mock("../i18n", () => ({ getCurrentLang: () => aktifDil.deger }));

describe("sayı yereli", () => {
  it.each([
    ["tr", "tr-TR"],
    ["en", "en-US"],
    ["ar", "ar"],
    ["ru", "ru-RU"],
  ])("%s dili → %s yereli", (dil, beklenen) => {
    aktifDil.deger = dil;
    expect(aktifSayiYereli()).toBe(beklenen);
  });

  it("bilinmeyen dil Türkçeye düşer — biçimlendirme hiç patlamaz", () => {
    aktifDil.deger = "de";
    expect(aktifSayiYereli()).toBe("tr-TR");
  });

  it("Arapça BÖLGESİZ — Doğu Arap rakamı üretmemeli", () => {
    aktifDil.deger = "ar";
    const cikti = sayiBicimle(45678);
    expect(aktifSayiYereli()).toBe("ar");
    // ٠-٩ aralığındaki Doğu Arap rakamları çıkmamalı
    expect(/[٠-٩]/.test(cikti)).toBe(false);
    expect(cikti).toContain("4");
  });

  it("her dil KENDİ ayırıcısını kullanıyor — hepsi aynı değil", () => {
    const ciktilar = new Map<string, string>();
    for (const dil of ["tr", "en", "ru"]) {
      aktifDil.deger = dil;
      ciktilar.set(dil, sayiBicimle(45678));
    }
    // Türkçe nokta, İngilizce virgül, Rusça boşluk kullanır.
    expect(ciktilar.get("tr")).not.toBe(ciktilar.get("en"));
    expect(ciktilar.get("ru")).not.toBe(ciktilar.get("tr"));
    expect(ciktilar.get("ru")).not.toContain(".");
  });
});
