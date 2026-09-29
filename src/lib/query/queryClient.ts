import { QueryClient } from "@tanstack/query-core";
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";
import { idbStorage } from "./idbStorage";

// Deploy'da cache invalidate: build version değişince persister buster değişir.
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || "dev";

// T-5 (2026-09-28) · `listings` IndexedDB'ye YAZILMAZ/OKUNMAZ.
// ÖLÇÜLDÜ (alpha): persister'ın 7 günlük `maxAge`'i restore anında
// `staleTime`'ı (60sn) hiç sormuyor — 6 gün önce IndexedDB'ye yazılmış bir
// ürün listesi hâlâ "taze değil mi" kontrolünden ÖNCE ekrana basılıyordu.
// `staleTime` zaten bellek-içi (in-memory) cache için doğru çalışıyor;
// sorun yalnız disk-kalıcı restore adımında. Çözüm kalıcılığı `listings`
// için TAMAMEN kapatmak — o zaman disk'ten hiç okunmaz/yazılmaz, tazelik
// tek kaynaktan (bellek + staleTime) gelir.
//
// Context7 (2026-09-28, /tanstack/query v5.90.3 — projede pinli 5.101.0'a
// en yakın belgelenen sürüm; `experimental_createQueryPersister`
// `StoragePersisterOptions` arayüzü v5.101.0'da da aynı) doğrular:
// `filters?: QueryFilters` — "Filters to narrow down which Queries should
// be persisted." `node_modules/@tanstack/query-persist-client-core/src/
// createPersister.ts` (persisterFn, satır ~208): `matchesFilter` yanlışsa
// hem restore hem persist adımı TAMAMEN atlanır, `queryFn` normal çalışır.
// Bu yüzden görev dosyasının önerdiği "queryFetch'te `persister: undefined`
// geçir" sarmalayıcısı (queryFetch.ts'e dokunmak, `persister`'ı export
// etmek) GEREKMİYOR — resmi/belgeli mekanizma zaten bunu tek satırla
// çözüyor ve `queryFetch`/`prefetch` çağıranları hiç değişmiyor.
export const NON_PERSISTED_QUERY_KEY_PREFIXES = new Set(["listings"]);

const persister = experimental_createQueryPersister({
  storage: idbStorage,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 gün üst sınır
  buster: APP_VERSION,
  prefix: "tradehub-query",
  // MOGEM-638 §2.6: varsayılan `true`, IndexedDB'den geri yüklenen her sorgu
  // için `query.isStale()` sorup arka planda ikinci bir fetch atıyordu. Biz
  // `queryClient.fetchQuery` kullanıyoruz (gözlemci yok) ve gözlemcisiz
  // sorguda `isStale()` staleTime'ı hiç bakmadan "bayat" diyor — sonuç: her
  // sayfada currency 2×, mega menü 2×, listings 2× (ana sayfada 6). Tazelik
  // zaten `staleTime`/`maxAge` ile yönetiliyor; geri yükleme fetch'i gereksiz.
  refetchOnRestore: false,
  // `listings` bu filtreden GEÇMEZ → hiç restore/persist edilmez (yukarıdaki
  // not). `matchQuery` predicate'i her sorguda çalışır; yalnız queryKey'in
  // ilk elemanına bakmak yeterli, `keys.ts`'teki tüm `listings(...)` anahtarları
  // `["listings", ...]` biçiminde üretiliyor.
  filters: {
    predicate: (query) => !NON_PERSISTED_QUERY_KEY_PREFIXES.has(String(query.queryKey[0])),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      persister: persister.persisterFn,
    },
  },
});
