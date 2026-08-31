/**
 * İade mock'u — 15-FE.
 *
 * NE SORUYOR: "fonksiyon doğru mu" değil **"iş akışı kapanıyor mu"**.
 * Zincirin tamamı deneniyor: uygunluk → talep → liste → detay. Ekranı ilk
 * kez açan biri bir iadeyi baştan sona açabiliyorsa bu testler yeşildir.
 *
 * Ayrıca 15-FE'nin düzelttiği iki kusurun REGRESYON bekçisi:
 *   · girilen miktarın gönderimde kaybolması (analiz §3.2)
 *   · alıcının başkasının kaydını görmesi (analiz §3.3)
 *
 * Tarayıcı karşılığı: `tests/e2e/storefront-iade.spec.ts` (adım 8).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../logisticsMock", async (orj) => ({
  ...(await orj<Record<string, unknown>>()),
  isMockMode: () => true,
}));

import {
  createReturnRequest,
  getReturnEligibility,
  getReturnRequest,
  listReturnRequests,
  resetReturnMock,
} from "../logisticsReturnMock";

describe("iade mock — iş akışı kapanıyor mu", () => {
  beforeEach(() => {
    localStorage.clear();
    resetReturnMock();
  });

  it("uygunluk → talep → liste → detay zinciri", async () => {
    const uygunluk = await getReturnEligibility("SHP-2026-00041");
    expect(uygunluk.window_open).toBe(1);
    expect(uygunluk.returnable_items).toHaveLength(2);
    expect(uygunluk.reasons.map((r) => r.value)).toContain("damaged");
    expect(uygunluk.reasons.every((r) => r.label_key.startsWith("shipment.returnReason."))).toBe(
      true
    );

    const oncekiSayi = (await listReturnRequests()).length;

    const olusan = await createReturnRequest({
      shipment: "SHP-2026-00041",
      reason: "damaged",
      note: "İki top kumaşta su hasarı var.",
      items: [{ item: "LST-00121", qty: 6 }],
    });
    expect(olusan.name).toMatch(/^RET-2026-\d{5}$/);

    const liste = await listReturnRequests();
    expect(liste).toHaveLength(oncekiSayi + 1);
    expect(liste[0].name).toBe(olusan.name);

    const detay = await getReturnRequest(olusan.name);
    expect(detay.items?.[0].requested_qty).toBe(6);
  });

  it("miktar gönderimde KAYBOLMUYOR", async () => {
    const olusan = await createReturnRequest({
      shipment: "SHP-2026-00041",
      reason: "wrong_item",
      note: "Yanlış ürün gönderilmiş.",
      items: [{ item: "LST-00133", qty: 3 }],
    });
    const detay = await getReturnRequest(olusan.name);
    expect(detay.items?.[0].requested_qty).toBe(3);
  });

  it("miktarsız kalem reddediliyor", async () => {
    await expect(
      createReturnRequest({
        shipment: "SHP-2026-00041",
        reason: "damaged",
        note: "Açıklama yeterince uzun.",
        items: [{ item: "LST-00121", qty: 0 }],
      })
    ).rejects.toThrow();
  });

  it("teslim alınandan fazlası reddediliyor", async () => {
    await expect(
      createReturnRequest({
        shipment: "SHP-2026-00041",
        reason: "damaged",
        note: "Açıklama yeterince uzun.",
        items: [{ item: "LST-00121", qty: 99 }],
      })
    ).rejects.toThrow();
  });

  it("durum geçişi: iade edilen miktar uygunluktan düşüyor", async () => {
    await createReturnRequest({
      shipment: "SHP-2026-00041",
      reason: "damaged",
      note: "İki top kumaşta su hasarı var.",
      items: [{ item: "LST-00121", qty: 12 }],
    });
    const sonra = await getReturnEligibility("SHP-2026-00041");
    expect(sonra.returnable_items.map((k) => k.item)).not.toContain("LST-00121");
  });

  it("rol süzgeci: başkasının kaydı listede yok", async () => {
    const liste = await listReturnRequests();
    expect(liste.every((k) => k.buyer === "alici@ornek.com")).toBe(true);
    await expect(getReturnRequest("RET-2026-00006")).rejects.toThrow();
  });

  it("liste satırı DETAIL alanı taşımıyor (K-6)", async () => {
    const liste = await listReturnRequests();
    expect(liste.every((k) => !("refund_amount" in k))).toBe(true);
  });

  it("onaylı iadenin etiketi gerçekten açılabilir", async () => {
    const detay = await getReturnRequest("RET-2026-00007");
    expect(detay.return_label_url).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("kalıcılık: yeni talep saklanıyor", async () => {
    const olusan = await createReturnRequest({
      shipment: "SHP-2026-00041",
      reason: "other",
      note: "Başka bir sebep var burada.",
      items: [{ item: "LST-00121", qty: 1 }],
    });
    expect(localStorage.getItem("istoc_return_mock")).toContain(olusan.name);
  });
});
