const YANDEX_COLLECTOR_HOSTS = [
  "mc.yandex.ru",
  "mc.yandex.az",
  "mc.yandex.by",
  "mc.yandex.co.il",
  "mc.yandex.com",
  "mc.yandex.com.am",
  "mc.yandex.com.ge",
  "mc.yandex.com.tr",
  "mc.yandex.ee",
  "mc.yandex.fr",
  "mc.yandex.kg",
  "mc.yandex.kz",
  "mc.yandex.lt",
  "mc.yandex.lv",
  "mc.yandex.md",
  "mc.yandex.tj",
  "mc.yandex.tm",
  "mc.yandex.uz",
  "mc.webvisor.com",
  "mc.webvisor.org",
];

const REQUIRED_SOURCES = new Map([
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
      ...YANDEX_COLLECTOR_HOSTS.flatMap((host) => [`https://${host}`, `wss://${host}`]),
    ],
  ],
  ["frame-src", ["https://www.googletagmanager.com", "blob:", "https://mc.yandex.ru"]],
  ["child-src", ["blob:", "https://mc.yandex.ru"]],
]);

function parseDirectives(policy) {
  return new Map(
    policy
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...sources] = part.split(/\s+/);
        return [name, new Set(sources)];
      })
  );
}

export function validateNginxCspTemplate(template) {
  const violations = [];
  const headerMatch = template.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/);

  if (!headerMatch) return ["Content-Security-Policy header not found"];

  const directives = parseDirectives(headerMatch[1]);
  for (const [directive, sources] of REQUIRED_SOURCES) {
    const configuredSources = directives.get(directive);
    for (const source of sources) {
      if (!configuredSources?.has(source)) {
        violations.push(`${directive} ${source}`);
      }
    }
  }

  const scriptSources = directives.get("script-src");
  if (scriptSources?.has("https:") || scriptSources?.has("*")) {
    violations.push("script-src must not contain https: or *");
  }

  const frameAncestors = directives.get("frame-ancestors");
  if (frameAncestors?.size !== 1 || !frameAncestors.has("'none'")) {
    violations.push("frame-ancestors must be exactly 'none'");
  }

  if (!/add_header\s+X-Frame-Options\s+"DENY"\s+always;/.test(template)) {
    violations.push("X-Frame-Options must be DENY");
  }

  return violations;
}
