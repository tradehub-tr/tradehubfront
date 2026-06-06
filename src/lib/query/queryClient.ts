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
