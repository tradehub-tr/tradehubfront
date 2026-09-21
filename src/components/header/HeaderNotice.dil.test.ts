// @vitest-environment happy-dom

/**
 * Duyuru şeridi dört dilde çiziliyor mu — 21 Eyl 2026'da eklendi.
 *
 * NEDEN: Vitrinin kırma turunda bulundu. `noticeContent` `lang === "en"` diye
 * soruyordu, yani Arapça/Rusça ziyaretçi şeridi HER SAYFADA Türkçe görüyordu.
 * Kusur gizliydi: canlıda aktif duyuru yoktu (`notices: []`, ölçüldü), yani
 * biri duyuru yayınladığı gün ortaya çıkacaktı.
 *
 * Kardeşleri: `CategoryShowcase.dil.test.ts`,
 * backend `test_header_notice_diller.py`, panel `duyuruDilDenetimi.test.js`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HeaderNotice } from "./HeaderNotice";
import type { HeaderNoticeData, HeaderNoticeItem } from "../../services/headerNoticeService";
import { NOTICE_LANGS } from "../../services/headerNoticeService";

const aktifDil = vi.hoisted(() => ({ deger: "tr" as string }));
vi.mock("../../i18n", () => ({
  getCurrentLang: () => aktifDil.deger,
  t: (anahtar: string) => `«${anahtar}»`,
}));

function duyuru(kismi: Partial<HeaderNoticeItem> = {}): HeaderNoticeItem {
  return {
    name: "duyuru-1",
    message_tr: "Türkçe mesaj",
    icon: "none",
    sort_order: 1,
    ...kismi,
  } as HeaderNoticeItem;
}

function veri(notices: HeaderNoticeItem[]): HeaderNoticeData {
  return { display_mode: "single", notices };
}

describe("HeaderNotice — dört dil", () => {
  beforeEach(() => {
    aktifDil.deger = "tr";
  });

  it.each([
    ["tr", "Türkçe mesaj"],
    ["en", "English message"],
    ["ar", "رسالة عربية"],
    ["ru", "Русское сообщение"],
  ])("%s dilinde kendi mesajını çiziyor", (dil, beklenen) => {
    aktifDil.deger = dil;
    const html = HeaderNotice(
      veri([
        duyuru({
          message_en: "English message",
          message_ar: "رسالة عربية",
          message_ru: "Русское сообщение",
        }),
      ])
    );
    expect(html).toContain(beklenen);
  });

  it("bağlantı metni de dile uyuyor", () => {
    aktifDil.deger = "ar";
    const html = HeaderNotice(
      veri([
        duyuru({
          message_ar: "رسالة",
          link_text_tr: "Detaylar",
          link_text_ar: "التفاصيل",
          link_href: "/kampanya",
        }),
      ])
    );
    expect(html).toContain("التفاصيل");
    expect(html).not.toContain("Detaylar");
  });

  it("o dilde metin yoksa TÜRKÇEYE düşer — şerit boş kalmaz", () => {
    for (const dil of NOTICE_LANGS) {
      aktifDil.deger = dil;
      const html = HeaderNotice(veri([duyuru()]));
      expect(html, `${dil} dilinde şerit boş kaldı`).toContain("Türkçe mesaj");
    }
  });

  it("boşluktan ibaret çeviri kullanılmaz, TÜRKÇEYE düşer", () => {
    // `"   "` dolu sayılırsa şerit görünüşte boş çizilir — bu yüzden trim şart.
    aktifDil.deger = "ru";
    const html = HeaderNotice(veri([duyuru({ message_ru: "   " })]));
    expect(html).toContain("Türkçe mesaj");
  });
});
