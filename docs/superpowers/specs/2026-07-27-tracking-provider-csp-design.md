# Tracking Provider CSP Design

## Problem

The production storefront sends a restrictive `Content-Security-Policy` header
from `nginx.conf.template`. The policy currently permits the GTM loader and
some GA4 collection hosts, but the active GTM container also loads Microsoft
Clarity and Yandex Metrica. Those resources are blocked because their script
and connection origins are absent. GTM's fallback iframe is also blocked
because `frame-src` is absent and therefore falls back to `default-src
'self'`.

The separate `ERR_CONNECTION_REFUSED` for `www.google-analytics.com` is not a
CSP failure. On the diagnostic machine that hostname resolves to `0.0.0.0`,
which indicates local DNS or privacy filtering. The storefront cannot override
that client-side network policy.

## Decision

Keep Clarity and Yandex Metrica active through GTM and extend the storefront
CSP with an explicit provider allowlist:

- GTM/GA4:
  - permit the GTM iframe through `frame-src`;
  - permit the observed GA fallback collector at `https://www.google.com`.
- Microsoft Clarity:
  - permit Clarity script hosts;
  - permit Clarity collection/load-balancing hosts and `https://c.bing.com`.
- Yandex Metrica:
  - permit scripts from `https://mc.yandex.ru` and `https://yastatic.net`;
  - permit Metrica and Webvisor HTTP/WebSocket collection endpoints;
  - permit the documented `blob:` and Metrica frame requirements used by
    Webvisor.

Do not broaden `script-src` to all HTTPS origins. Preserve `frame-ancestors
'none'` and `X-Frame-Options: DENY`; allowing third-party resources inside the
storefront does not authorize third parties to frame the storefront.

## Verification

Add a semantic CSP checker that parses the policy into directives and fails
when a required provider source is absent. Wire it into `npm run check:nginx`
alongside the existing noindex checker. Validate with:

- the checker failing before the policy change;
- the checker passing after the policy change;
- the complete Nginx checks;
- unit tests, lint, duplicate-export check, and production build.

No deployment, push, GTM container mutation, DNS change, or production
configuration mutation is part of this work.
