# Tracking Provider CSP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permit the storefront's intentional GTM, GA4, Microsoft Clarity, and Yandex Metrica traffic without broadly weakening its CSP.

**Architecture:** Keep the CSP owned by `nginx.conf.template` and add only the provider origins required by the active GTM container. Add a Node-based semantic checker that parses the configured CSP directives and verifies the provider contract, then run it through the existing Nginx check command.

**Tech Stack:** Nginx configuration, Node.js ESM, npm scripts

## Global Constraints

- Clarity and Yandex Metrica remain active through GTM.
- Do not allow every HTTPS origin in `script-src`.
- Preserve `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- Do not deploy, push, mutate GTM, or change production DNS.

---

### Task 1: Add the CSP regression checker

**Files:**
- Create: `scripts/check-nginx-csp.mjs`
- Modify: `package.json`
- Test: `scripts/check-nginx-csp.mjs`

**Interfaces:**
- Consumes: the `Content-Security-Policy` value in `nginx.conf.template`
- Produces: exit code `0` when every required directive/source pair exists; a nonzero exit code with missing pairs otherwise

- [ ] **Step 1: Write the failing checker**

Create an ESM script that:

1. reads `nginx.conf.template`;
2. extracts the `add_header Content-Security-Policy "..." always;` value;
3. parses semicolon-separated directives into `Map<string, Set<string>>`;
4. checks literal required directive/source pairs for GTM/GA4, Clarity, and
   Yandex;
5. prints every missing pair and sets `process.exitCode = 1`;
6. prints a success summary only when no pair is missing.

Add `node scripts/check-nginx-csp.mjs` after the existing noindex checker in
the `check:nginx` npm script.

- [ ] **Step 2: Run the checker to verify it fails**

Run: `npm run check:nginx`

Expected: nonzero exit with missing `frame-src`, Clarity, Yandex, and Google
fallback source reports.

- [ ] **Step 3: Commit the failing checker**

```bash
git add package.json scripts/check-nginx-csp.mjs
git commit -m "test(security): enforce tracking provider CSP"
```

### Task 2: Extend the storefront CSP

**Files:**
- Modify: `nginx.conf.template`
- Test: `scripts/check-nginx-csp.mjs`

**Interfaces:**
- Consumes: `${BACKEND_DOMAIN}` during container startup
- Produces: a CSP header whose directive sets satisfy the checker contract

- [ ] **Step 1: Add the minimal explicit sources**

Update the CSP directive sets:

- `script-src`: retain existing values and add Clarity plus Yandex script
  origins;
- `connect-src`: retain backend/GTM/GA4 values and add Google fallback,
  Clarity, Bing, and documented Yandex Metrica/Webvisor endpoints;
- `frame-src`: add GTM, `blob:`, and the Metrica frame origin;
- `child-src`: add `blob:` and the Metrica origin for Webvisor compatibility;
- preserve all other directives and anti-framing policy.

- [ ] **Step 2: Run the checker to verify it passes**

Run: `npm run check:nginx`

Expected: both Nginx checks exit `0`.

- [ ] **Step 3: Run project verification**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm run test:unit
npm run lint
npm run check:dup
npm run build
```

Expected: every command exits `0`.

- [ ] **Step 4: Commit the implementation**

```bash
git add nginx.conf.template
git commit -m "fix(security): allow GTM tracking providers in CSP"
```
