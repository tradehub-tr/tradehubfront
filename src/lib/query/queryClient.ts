import { QueryClient } from "@tanstack/query-core";
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";
import { idbStorage } from "./idbStorage";

// Deploy'da cache invalidate: build version değişince persister buster değişir.
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || "dev";

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
