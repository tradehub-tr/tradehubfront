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

import {
  aktifSayiYereli,
  paraBicimle,
  paraBicimleKisa,
  sayiBicimle,
  tarihBicimle,
} from "./numberLocale";

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

describe("paraBicimle / paraBicimleKisa / tarihBicimle (D1 kararı)", () => {
  /**
   * Dört dilde tutar biçimi — kullanıcı kararı D1 (21 Eyl 2026):
   * para BİÇİMİ arayüz diline bağlanır, SEMBOL para birimine bağlı kalır.
   */
  it.each([
    ["tr", "1.234,56"],
    ["en", "1,234.56"],
    ["ar", "1,234.56"],
    ["ru", "1 234,56"],
  ])("%s dilinde tutar %s biçiminde yazılır", (dil, beklenen) => {
    aktifDil.deger = dil;
    // Rusça binlik ayıracı DAR BOŞLUK (U+00A0/U+202F). Kaynağa o karakteri
    // YAZMAK yerine regex ile normalleştiriliyor: görünmez karakter kod
    // içinde durursa gözle fark edilmez ve eslint `no-irregular-whitespace`
    // ile kırmızıya düşer — ilk sürüm tam bu yüzden kırıldı.
    expect(paraBicimle(1234.56).replace(/\s/g, " ")).toBe(beklenen);
  });

  it("tam sayı tutarda kesir kuyruğu atılır, kesirli tutarda kalır", () => {
    aktifDil.deger = "tr";
    expect(paraBicimleKisa(1234)).toBe("1.234");
    expect(paraBicimleKisa(1234.5)).toBe("1.234,50");
    aktifDil.deger = "en";
    expect(paraBicimleKisa(1234)).toBe("1,234");
    expect(paraBicimleKisa(1234.5)).toBe("1,234.50");
  });

  it("kuyruk atma SABİT DİZE ile değil sayıyla yapılır", () => {
    // Karşı kanıt: `.replace(/,00$/,"")` deseni Rusçada da çalışırdı ama
    // İngilizcede (`1,234.00`) yanlış yeri keserdi. Sayıya bakan sürüm
    // her yerelde doğru.
    aktifDil.deger = "ru";
    expect(paraBicimleKisa(1234).replace(/\s/g, " ")).toBe("1 234");
  });

  it("tarih aktif dilin biçiminde yazılır, geçersiz tarih boş döner", () => {
    aktifDil.deger = "tr";
    expect(tarihBicimle("2026-09-21")).toBe("21.09.2026");
    aktifDil.deger = "en";
    expect(tarihBicimle("2026-09-21")).toBe("9/21/2026");
    expect(tarihBicimle("gecersiz")).toBe("");
  });
});
