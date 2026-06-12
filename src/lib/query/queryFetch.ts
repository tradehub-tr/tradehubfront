import type { QueryKey } from "@tanstack/query-core";
import { queryClient } from "./queryClient";
import type { CachePolicy } from "./keys";

/**
 * Servislerin api() yerine çağırdığı ince sarmalayıcı.
 * Aynı key'e gelen paralel çağrılar dedup edilir, sonuç cache + IndexedDB'ye yazılır.
 */
export function queryFetch<T>(
  key: QueryKey,
  fn: () => Promise<T>,
  policy?: Partial<CachePolicy>
): Promise<T> {
  return queryClient.fetchQuery({
    queryKey: key,
    queryFn: fn,
    staleTime: policy?.staleTime,
    gcTime: policy?.gcTime,
  });
}

/** Arka planda önceden çekme (örn. sonraki sayfa). Hata yutulur. */
export function prefetch<T>(
  key: QueryKey,
  fn: () => Promise<T>,
  policy?: Partial<CachePolicy>
): void {
  void queryClient.prefetchQuery({
    queryKey: key,
    queryFn: fn,
    staleTime: policy?.staleTime,
    gcTime: policy?.gcTime,
  });
}

/** Bir key (veya prefix) için cache'i geçersiz kıl. */
export function invalidate(key: QueryKey): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: key });
}
