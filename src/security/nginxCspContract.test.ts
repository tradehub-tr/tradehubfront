import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateNginxCspTemplate } from "../../scripts/lib/nginx-csp-contract.mjs";

const template = await readFile(resolve("nginx.conf.template"), "utf8");

describe("validateNginxCspTemplate", () => {
  it("accepts the storefront tracking-provider policy", () => {
    expect(validateNginxCspTemplate(template)).toEqual([]);
  });

  it("rejects a missing regional Yandex HTTPS collector", () => {
    const mutated = template.replace(" https://mc.yandex.com.tr", "");

    expect(validateNginxCspTemplate(mutated)).toContain("connect-src https://mc.yandex.com.tr");
  });

  it("rejects a missing regional Yandex WebSocket collector", () => {
    const mutated = template.replace(" wss://mc.yandex.com.tr", "");

    expect(validateNginxCspTemplate(mutated)).toContain("connect-src wss://mc.yandex.com.tr");
  });

  it("requires frame-ancestors to contain only 'none'", () => {
    const mutated = template.replace(
      "frame-ancestors 'none'",
      "frame-ancestors 'none' https://example.com"
    );

    expect(validateNginxCspTemplate(mutated)).toContain("frame-ancestors must be exactly 'none'");
  });

  it("rejects a blanket HTTPS script source", () => {
    const mutated = template.replace("script-src 'self'", "script-src 'self' https:");

    expect(validateNginxCspTemplate(mutated)).toContain("script-src must not contain https: or *");
  });

  it("requires the storefront anti-framing header", () => {
    const mutated = template.replace(
      'add_header X-Frame-Options "DENY" always;',
      'add_header X-Frame-Options "SAMEORIGIN" always;'
    );

    expect(validateNginxCspTemplate(mutated)).toContain("X-Frame-Options must be DENY");
  });
});
