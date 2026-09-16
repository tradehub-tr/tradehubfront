import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  backendProxyBlokSayisi,
  validateNginxCountryTemplate,
} from "../../scripts/lib/nginx-country-contract.mjs";

const template = await readFile(resolve("nginx.conf.template"), "utf8");

describe("validateNginxCountryTemplate", () => {
  it("mevcut template sözleşmeyi sağlıyor", () => {
    expect(validateNginxCountryTemplate(template)).toEqual([]);
  });

  it("denetim gerçekten blokları tarıyor (parser çalışıyor)", () => {
    // 16 Eyl 2026 ölçümü: 14 backend proxy bloğu. Sayı düşerse parser bozulmuştur
    // ve "ihlal yok" sonucu yanlış güven verir.
    expect(backendProxyBlokSayisi(template)).toBeGreaterThanOrEqual(14);
  });

  it("tek bir blokta X-Country unutulursa kırmızıya döner", () => {
    // Açığın gerçek hâli bu: yeni location eklenir, iki satır kopyalanmaz.
    const bozuk = template.replace('        proxy_set_header X-Country "";\n', "");

    const ihlaller = validateNginxCountryTemplate(bozuk);
    expect(ihlaller.length).toBeGreaterThan(0);
    expect(ihlaller.join("\n")).toContain("X-Country");
  });

  it("tek bir blokta CF-IPCountry unutulursa kırmızıya döner", () => {
    // CF-IPCountry ayrıca gerekli: backend onu X-Country'den ÖNCE okuyor,
    // yani yalnız X-Country'yi yeniden yazmak açığı kapatmaz.
    const bozuk = template.replace('        proxy_set_header CF-IPCountry "";\n', "");

    const ihlaller = validateNginxCountryTemplate(bozuk);
    expect(ihlaller.length).toBeGreaterThan(0);
    expect(ihlaller.join("\n")).toContain("CF-IPCountry");
  });
});
