/**
 * Örnek veri modunun ORTAM SINIRI.
 *
 * Bu testin tek işi şu iddiayı korumak: **canlı ortamlarda mock veri asla
 * görünmez.** İddia bugün doğru; yarın beyaz listeye "kısa bir deneme için"
 * bir alan adı eklenirse burası kırmızı olur.
 *
 * Alan adları uydurma değil — kök `CLAUDE.md` §5 altyapı topolojisinden ve
 * `docker/conf/gateway.nginx.conf`'tan alındı.
 */
import { describe, expect, it } from "vitest";

import { isPreviewHostname } from "../logisticsMock";

/** Örnek veri GÖRÜNEBİLECEĞİ ortamlar. */
const PREVIEW = [
  "localhost",
  "tradehub.localhost", // yerel stack gateway'i — ekibin gerçekten kullandığı adres
  "127.0.0.1",
  "::1",
  "ali-pc.local",
  "alpha.istoc.com",
  "beta.istoc.com", // 29 Eyl 2026 ürün kararı: Alpha/Beta/RC'de örnek veri olabilir (MOGEM-685 F-03)
  "rc.istoc.com", // aynı karar — RC, Alpha/Beta ile aynı yapıda (UAT örnek veriyle)
];

/**
 * Örnek verinin ASLA görünmemesi gereken ortam — PROD (ve backend adresleri).
 * (`*.cronbi.com` BACKEND adresleri; ön yüz orada servis edilmiyor.)
 * İkinci kilit: PROD derlemesinde mock kodu hiç yok (`__LOJISTIK_MOCK__` =
 * false) — onu `scripts/check-no-mock-in-build.mjs` derleme çıktısında sınıyor.
 */
const LIVE = [
  "betaistoc.cronbi.com",
  "rcistoc.cronbi.com",
  "istoc.cronbi.com",
  "istoc.com",
  "www.istoc.com",
  "admin-preview.istoc.com",
  "192.168.1.100", // yerel ağ IP'si — makine yerel ama adres beyaz listede değil
];

describe("örnek veri modu — ortam sınırı", () => {
  it.each(PREVIEW)("önizleme ortamı: %s", (host) => {
    expect(isPreviewHostname(host)).toBe(true);
  });

  it.each(LIVE)("canlı/kapalı ortam: %s", (host) => {
    expect(isPreviewHostname(host)).toBe(false);
  });

  it("beta'nın önüne/arkasına eklemek kapıyı açmıyor", () => {
    expect(isPreviewHostname("beta.istoc.com.saldirgan.net")).toBe(false);
    expect(isPreviewHostname("rc-beta.istoc.com")).toBe(false);
    expect(isPreviewHostname("rc.istoc.com.saldirgan.net")).toBe(false);
    expect(isPreviewHostname("xrc.istoc.com")).toBe(false);
  });

  it("canlı alan adının önüne alt alan eklemek kapıyı açmıyor", () => {
    // "alpha.istoc.com" beyaz listede diye "alpha.istoc.com.saldirgan.net"
    // eşleşmemeli — tam eşleşme kullanıldığı için eşleşmiyor.
    expect(isPreviewHostname("alpha.istoc.com.saldirgan.net")).toBe(false);
    expect(isPreviewHostname("notalpha.istoc.com")).toBe(false);
  });

  it("son ek kontrolü nokta sınırına saygılı", () => {
    // "mylocal" ".local" ile bitmiyor; "my.local" bitiyor.
    expect(isPreviewHostname("mylocal")).toBe(false);
    expect(isPreviewHostname("my.local")).toBe(true);
  });
});
