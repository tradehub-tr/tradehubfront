#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const templateUrl = new URL("../nginx.conf.template", import.meta.url);
const template = await readFile(templateUrl, "utf8");
const headerMatch = template.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/);

if (!headerMatch) {
  console.error("CSP check failed: Content-Security-Policy header not found.");
  process.exitCode = 1;
} else {
  const directives = new Map(
    headerMatch[1]
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...sources] = part.split(/\s+/);
        return [name, new Set(sources)];
      })
  );

  const requiredSources = new Map([
    [
      "script-src",
      [
        "https://*.googletagmanager.com",
        "https://*.clarity.ms",
        "https://mc.yandex.ru",
        "https://yastatic.net",
      ],
    ],
    [
      "connect-src",
      [
        "https://${BACKEND_DOMAIN}",
        "wss://${BACKEND_DOMAIN}",
        "https://*.googletagmanager.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://www.google.com",
        "https://*.clarity.ms",
        "https://c.bing.com",
        "https://mc.yandex.ru",
        "wss://mc.yandex.ru",
        "https://mc.webvisor.com",
        "https://mc.webvisor.org",
        "wss://mc.webvisor.com",
        "wss://mc.webvisor.org",
      ],
    ],
    ["frame-src", ["https://www.googletagmanager.com", "blob:", "https://mc.yandex.ru"]],
    ["child-src", ["blob:", "https://mc.yandex.ru"]],
    ["frame-ancestors", ["'none'"]],
  ]);

  const missing = [];
  for (const [directive, sources] of requiredSources) {
    const configuredSources = directives.get(directive);
    for (const source of sources) {
      if (!configuredSources?.has(source)) {
        missing.push(`${directive} ${source}`);
      }
    }
  }

  if (missing.length > 0) {
    console.error("CSP check failed. Missing required source pairs:");
    for (const pair of missing) console.error(`  - ${pair}`);
    process.exitCode = 1;
  } else {
    console.log(`CSP check passed (${requiredSources.size} directives verified).`);
  }
}
