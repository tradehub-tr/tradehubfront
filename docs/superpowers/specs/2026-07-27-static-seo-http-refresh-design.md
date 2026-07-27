# Static Page SEO HTTP Refresh Design

**Date:** 2026-07-27
**Scope:** `tradehub_core/` backend and `tradehubfront/` storefront

## Goal

When an administrator changes a `Static Page SEO` title or description, every
visitor must receive the current SEO values the next time that static storefront
page loads or reloads. An already-open page does not update until its next load.

The existing server-rendered bot path remains unchanged.

## Current Behavior

Production Nginx sends recognized bots to
`tradehub_core.seo.page_resolver.render_static_page`, which reads the database
override and injects current SEO into HTML. Normal visitors receive the locally
built static HTML instead. The storefront i18n bootstrap then applies its
build-time page title, so normal browsers continue to show the old value.

Routing every visitor through `render_static_page` is unsafe because the
production backend cannot read the storefront dist volume and therefore returns
its minimal fallback HTML.

## Design

### Public HTTP endpoint

Add an allow-guest endpoint alongside the existing static page resolver. It:

1. Accepts a normalized page path and supported language.
2. Rejects paths that are absent from `STATIC_PAGES`.
3. Loads the matching `Static Page SEO` record when present.
4. Uses `meta_builder.build_for_static_page` so browser and bot payloads share
   exactly the same title, description, Open Graph, robots, canonical, hreflang,
   and JSON-LD rules.
5. Returns a small JSON SEO payload rather than HTML.

The endpoint is read-only and exposes only public page metadata. Unknown paths
return no payload instead of revealing database records.

### Storefront bootstrap

Add a focused static SEO loader under `src/seo/`. On every page load it:

1. Derives the registry path from `window.location.pathname`, including supported
   language prefixes.
2. Calls the public endpoint with same-origin HTTP.
3. Applies a successful payload through the existing `applyServerSeo` helper.
4. Leaves the build-time metadata untouched when the request fails or the path is
   not a registered static page.

The loader runs after the initial i18n title assignment so the database value is
the final browser title. Dynamic product, category, brand, and seller pages are
not changed by this flow.

### Caching and freshness

The browser request must revalidate instead of relying on a long-lived client
cache. The existing `Static Page SEO` save hook continues purging the canonical
Cloudflare URL for bot-rendered HTML. The JSON request uses a non-cacheable or
revalidated response so a reload after Save observes the committed value.

No polling, WebSocket, or new frontend dependency is introduced.

## Error Handling

- Network/backend failure: keep safe build-time metadata; do not block page
  rendering.
- Unknown path: return an empty/not-found result and make no DOM changes.
- Missing `Static Page SEO` record: use the same registry defaults already used
  by server-side rendering.
- Unsupported language: normalize to the established default language behavior.

## Tests

### Backend

- Registered path returns the payload built from the database override.
- Missing override uses registry defaults.
- Unknown path returns no public SEO payload.
- Endpoint remains allow-guest and read-only.

### Storefront

- Registered static path requests the endpoint and applies the returned payload.
- Language-prefixed static path sends the canonical registry path and language.
- Dynamic/unregistered path performs no SEO override.
- Failed HTTP request preserves existing metadata.
- Bootstrap ordering proves the remote payload wins over the i18n build-time
  title.

### Verification

- Backend focused unit tests.
- Storefront focused Vitest suite.
- Storefront lint and production build.
- Manual HTTP comparison for a normal browser user-agent after deployment is a
  deployment validation step, not part of this local implementation.

## Non-goals

- Updating already-open tabs without reload.
- Changing Google recrawl timing or forcing Google’s selected title link.
- Replacing the existing bot-side HTML injection.
- Adding polling, Socket.IO, Server-Sent Events, or a new package.
