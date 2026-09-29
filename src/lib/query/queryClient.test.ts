import { afterEach, describe, expect, it, vi } from "vitest";

import { idbStorage } from "./idbStorage";
import { queryFetch } from "./queryFetch";

// T-5 (2026-09-28) — MOGEM-638 devamı: persister'ın `maxAge` (7 gün) üst
// sınırı `staleTime`'ı (60sn) hiç sormadan IndexedDB'den geri yüklüyordu.
// Alpha'da 6 gün önce yazılmış bir `listings` sorgusu bu yüzden "taze"
// sayılıp ekrana basıldı. Çözüm: `listings` anahtarları hiç kalıcı
// YAZILMAZ/OKUNMAZ (queryClient.ts — persister `filters.predicate`).
// Kalan tüm anahtarlar (örn. `categories`) eskisi gibi kalıcı kalır.
function flushPersisterSchedule(ms = 20): Promise<void> {
  // notifyManager.schedule → systemSetTimeoutZero (gerçek setTimeout(0)).
  // persistQuery çağrısı bu tick'te kuyruğa girer; testte beklenmesi gerekir.
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("queryClient persister filtresi (T-5)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("`listings` anahtarlı queryFetch sonrası IndexedDB'ye yazma çağrısı OLMAZ", async () => {
    const setItemSpy = vi.spyOn(idbStorage, "setItem");
    const key = ["listings", [["cat", Math.random()]]];

    await queryFetch(key, async () => ({ items: [] }));
    await flushPersisterSchedule();

    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("`categories` anahtarlı queryFetch sonrası IndexedDB'ye yazma çağrısı OLUR", async () => {
    const setItemSpy = vi.spyOn(idbStorage, "setItem");
    const key = ["categories", `v${Math.random()}`, "tr"];

    await queryFetch(key, async () => ({ tree: [] }));
    await flushPersisterSchedule();

    expect(setItemSpy).toHaveBeenCalled();
  });
});
