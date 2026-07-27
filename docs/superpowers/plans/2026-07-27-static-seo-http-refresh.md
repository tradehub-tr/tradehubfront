# Static Page SEO HTTP Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every normal storefront page load apply the latest database-backed `Static Page SEO` title and metadata without changing the existing bot-rendering route.

**Architecture:** The backend exposes the same `build_for_static_page` payload already used by bot HTML rendering through a read-only allow-guest endpoint. A small storefront loader recognizes registered static paths, requests that payload with `cache: "no-store"`, and applies it after the i18n bootstrap through the existing `applyServerSeo` DOM helper.

**Tech Stack:** Frappe v15/Python 3.10+, TypeScript 5.9, Vite 7, Vitest 4, browser Fetch API.

## Global Constraints

- Existing bot-side `render_static_page` behavior remains unchanged.
- An already-open page updates only on its next load or reload.
- No polling, WebSocket, Socket.IO, Server-Sent Events, or new package.
- Unknown and dynamic paths must not modify browser metadata.
- HTTP failure must preserve the build-time metadata and must not block page rendering.
- Backend and browser paths must share `meta_builder.build_for_static_page`.

---

### Task 1: Public static SEO payload

**Files:**
- Modify: `../tradehub_core/tradehub_core/seo/page_resolver.py:190-247`
- Test: `../tradehub_core/tradehub_core/seo/tests/test_page_resolver.py`

**Interfaces:**
- Consumes: `static_pages_registry.find_entry(path)` and `meta_builder.build_for_static_page(record, page_meta, lang)`.
- Produces: `get_static_page_meta(path: str, lang: str = "tr") -> dict | None`, registered with `frappe.whitelist(allow_guest=True)`.
- Produces: internal `_load_static_page_seo(path: str, lang: str = "tr") -> dict | None`, shared with `render_static_page`.

- [ ] **Step 1: Write failing resolver tests**

Add tests that patch `_resolve_static_page`, a fake `frappe` module, and
`meta_builder.build_for_static_page`:

```python
class TestLoadStaticPageSeo(unittest.TestCase):
	def test_unknown_path_returns_none(self):
		with patch.object(page_resolver, "_resolve_static_page", return_value=None):
			self.assertIsNone(page_resolver._load_static_page_seo("/unknown"))

	def test_database_override_is_built_with_shared_meta_builder(self):
		entry = {"path": "/", "title": "Anasayfa", "html_path": "index.html"}
		override = {"page_path": "/", "meta_title": "Güncel"}
		frappe = SimpleNamespace(
			db=SimpleNamespace(exists=lambda doctype, name: True),
			get_doc=lambda doctype, name: SimpleNamespace(as_dict=lambda: override),
		)
		payload = {"title": "Güncel"}
		with (
			patch.object(page_resolver, "_resolve_static_page", return_value=entry),
			patch.dict(sys.modules, {"frappe": frappe}),
			patch.object(page_resolver.meta_builder, "build_for_static_page", return_value=payload) as build,
		):
			self.assertEqual(page_resolver._load_static_page_seo("/", "tr"), payload)
		build.assert_called_once_with(record=override, page_meta=entry, lang="tr")

	def test_missing_override_uses_safe_registry_default(self):
		entry = {"path": "/", "title": "Anasayfa", "html_path": "index.html"}
		frappe = SimpleNamespace(
			db=SimpleNamespace(exists=lambda doctype, name: False),
		)
		with (
			patch.object(page_resolver, "_resolve_static_page", return_value=entry),
			patch.dict(sys.modules, {"frappe": frappe}),
			patch.object(
				page_resolver.meta_builder,
				"build_for_static_page",
				return_value={"title": "Anasayfa"},
			) as build,
		):
			page_resolver._load_static_page_seo("/", "tr")
		record = build.call_args.kwargs["record"]
		self.assertEqual(record["page_path"], "/")
		self.assertEqual(record["meta_title"], "Anasayfa")
		self.assertEqual(record["noindex"], 1)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd ../tradehub_core
python -m unittest tradehub_core.seo.tests.test_page_resolver -v
```

Expected: FAIL because `_load_static_page_seo` does not exist.

- [ ] **Step 3: Implement the shared payload loader and endpoint**

In `page_resolver.py`, move the existing registry/override/default/payload
construction from `render_static_page` into:

```python
def _load_static_page_seo(path: str, lang: str = "tr") -> dict | None:
	entry = _resolve_static_page(path, lang=lang)
	if not entry:
		return None

	import frappe

	override = {}
	if frappe.db.exists("Static Page SEO", path):
		override = frappe.get_doc("Static Page SEO", path).as_dict()
	if not override:
		override = {
			"page_path": path,
			"page_title": entry["title"],
			"meta_title": entry["title"],
			"meta_description": "",
			"noindex": 1,
		}
	return meta_builder.build_for_static_page(record=override, page_meta=entry, lang=lang)


def get_static_page_meta(path: str, lang: str = "tr") -> dict | None:
	"""Return public SEO metadata for a registered static storefront path."""
	return _load_static_page_seo(path, lang=lang)
```

Make `render_static_page` call `_load_static_page_seo`; return the existing 404
response when it returns `None`. Register the new endpoint in
`_register_whitelists`:

```python
globals()["get_static_page_meta"] = frappe.whitelist(allow_guest=True)(get_static_page_meta)
```

- [ ] **Step 4: Run backend tests and verify GREEN**

Run:

```bash
cd ../tradehub_core
python -m unittest tradehub_core.seo.tests.test_page_resolver tradehub_core.seo.tests.test_meta_builder -v
```

Expected: all tests PASS.

- [ ] **Step 5: Run backend static validation**

Run:

```bash
cd ../tradehub_core
python -m py_compile tradehub_core/seo/page_resolver.py
ruff check tradehub_core/seo/page_resolver.py tradehub_core/seo/tests/test_page_resolver.py
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit the backend change**

```bash
cd ../tradehub_core
git add tradehub_core/seo/page_resolver.py tradehub_core/seo/tests/test_page_resolver.py
git commit -m "feat(seo): expose static page metadata"
```

---

### Task 2: Storefront HTTP metadata loader

**Files:**
- Create: `src/seo/loadStaticPageSeo.ts`
- Create: `src/seo/loadStaticPageSeo.test.ts`
- Modify: `src/i18n/index.ts:82-94`

**Interfaces:**
- Consumes: `getStaticPageHtmlPath(path: string)` from `src/utils/staticPageUrl.ts`.
- Consumes: `applyServerSeo(payload: ServerSeoPayload)` from `src/seo/setPageMeta.ts`.
- Produces: `normalizeStaticSeoPath(pathname: string) -> { path: string; langFromPath?: "en" }`.
- Produces: `loadStaticPageSeo(lang: SupportedLang) -> Promise<void>`.

- [ ] **Step 1: Write failing storefront tests**

Create a Happy DOM Vitest suite:

```typescript
// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStaticPageSeo, normalizeStaticSeoPath } from "./loadStaticPageSeo";

describe("static page SEO HTTP refresh", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.head.innerHTML = "<title>Build başlığı</title>";
  });

  it("normalizes the English URL prefix", () => {
    expect(normalizeStaticSeoPath("/en/urunler")).toEqual({
      path: "/urunler",
      langFromPath: "en",
    });
    expect(normalizeStaticSeoPath("/en")).toEqual({ path: "/", langFromPath: "en" });
  });

  it("loads and applies current metadata for a registered static page", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Veritabanı başlığı" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("tr", "/");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("get_static_page_meta"),
      expect.objectContaining({ cache: "no-store", credentials: "include" })
    );
    expect(document.title).toBe("Veritabanı başlığı");
  });

  it("skips dynamic paths", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadStaticPageSeo("tr", "/urun/dinamik-urun");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.title).toBe("Build başlığı");
  });

  it("preserves build metadata when HTTP fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await loadStaticPageSeo("tr", "/");
    expect(document.title).toBe("Build başlığı");
  });
});
```

- [ ] **Step 2: Run the focused storefront test and verify RED**

Run:

```bash
cd .
npx vitest run src/seo/loadStaticPageSeo.test.ts
```

Expected: FAIL because `loadStaticPageSeo.ts` does not exist.

- [ ] **Step 3: Implement the loader**

Create `loadStaticPageSeo.ts` with:

```typescript
import type { SupportedLang } from "../i18n";
import { getStaticPageHtmlPath } from "../utils/staticPageUrl";
import { applyServerSeo, type ServerSeoPayload } from "./setPageMeta";

const ENDPOINT =
  "/api/method/tradehub_core.seo.page_resolver.get_static_page_meta";

export function normalizeStaticSeoPath(pathname: string): {
  path: string;
  langFromPath?: "en";
} {
  if (pathname === "/en") return { path: "/", langFromPath: "en" };
  if (pathname.startsWith("/en/")) {
    return { path: pathname.slice(3) || "/", langFromPath: "en" };
  }
  return { path: pathname || "/" };
}

export async function loadStaticPageSeo(
  activeLang: SupportedLang,
  pathname = window.location.pathname
): Promise<void> {
  const normalized = normalizeStaticSeoPath(pathname);
  if (!getStaticPageHtmlPath(normalized.path)) return;

  const lang = normalized.langFromPath || activeLang;
  const query = new URLSearchParams({ path: normalized.path, lang });
  try {
    const response = await fetch(`${ENDPOINT}?${query}`, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const body = (await response.json()) as { message?: ServerSeoPayload | null };
    applyServerSeo(body.message);
  } catch {
    // Build-time SEO remains the safe fallback when the API is unavailable.
  }
}
```

- [ ] **Step 4: Verify the loader test is GREEN**

Run:

```bash
npx vitest run src/seo/loadStaticPageSeo.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Bootstrap the HTTP refresh after i18n**

In the existing initial-language block in `src/i18n/index.ts`, after the static
title assignment, load and invoke the new module:

```typescript
  import("../seo/loadStaticPageSeo").then(({ loadStaticPageSeo }) =>
    loadStaticPageSeo(initialLang)
  );
```

Keep the existing hreflang fallback call intact.

- [ ] **Step 6: Run storefront regression validation**

Run:

```bash
npm run test:unit -- src/seo/loadStaticPageSeo.test.ts src/seo/setPageMeta.test.ts
npm run lint
npm run check:dup
npm run build
```

Expected: all commands exit 0 with no test failures, lint errors, duplicate
export regressions, or TypeScript/build failures.

- [ ] **Step 7: Commit the storefront change**

```bash
git add src/seo/loadStaticPageSeo.ts src/seo/loadStaticPageSeo.test.ts src/i18n/index.ts
git commit -m "fix(seo): refresh static metadata on page load"
```

---

### Task 3: Cross-repository acceptance check

**Files:**
- Verify only; no production file is added in this task.

**Interfaces:**
- Consumes: backend `get_static_page_meta` JSON response.
- Consumes: storefront `loadStaticPageSeo` bootstrap.
- Produces: evidence that a normal visitor reload receives and applies current metadata.

- [ ] **Step 1: Re-run both focused suites from their owning repositories**

```bash
cd ../tradehub_core
python -m unittest tradehub_core.seo.tests.test_page_resolver tradehub_core.seo.tests.test_meta_builder -v

cd ../tradehubfront
npm run test:unit -- src/seo/loadStaticPageSeo.test.ts src/seo/setPageMeta.test.ts
```

Expected: both suites PASS.

- [ ] **Step 2: Review repository status and diffs**

```bash
git -C ../tradehub_core status --short
git -C ../tradehub_core diff --check HEAD~1..HEAD
git -C ../tradehubfront status --short
git -C ../tradehubfront diff --check HEAD~1..HEAD
```

Expected: only the planned committed files appear; both diff checks exit 0.

- [ ] **Step 3: Record deployment validation**

After both repositories are deployed, open a normal browser, change `/` in the
admin SEO editor, save it, reload `https://istoc.com/`, and verify:

```javascript
document.title
document.querySelector('meta[name="description"]')?.content
document.querySelector('meta[property="og:title"]')?.content
```

Expected: all values match the saved `Static Page SEO` record. This production
check is not executed or claimed by the local implementation.
