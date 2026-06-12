import { get, set, del, entries, createStore } from "idb-keyval";

// TanStack persister için AsyncStorage uyumlu IndexedDB adapter.
// İzole store: tradehub-query / queries (diğer idb kullanımına karışmaz).
const store = createStore("tradehub-query", "queries");

export const idbStorage = {
  getItem: (key: string): Promise<string | null> => get<string>(key, store).then((v) => v ?? null),
  setItem: (key: string, value: string): Promise<void> => set(key, value, store),
  removeItem: (key: string): Promise<void> => del(key, store),
  entries: (): Promise<Array<[string, string]>> => entries<string, string>(store),
};
