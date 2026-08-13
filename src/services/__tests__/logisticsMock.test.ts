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
];

/** Örnek verinin ASLA görünmemesi gereken ortamlar. */
const LIVE = [
  "betaistoc.cronbi.com",
  "rcistoc.cronbi.com",
  "istoc.cronbi.com",
  "istoc.com",
  "www.istoc.com",
  "rc.istoc.com",
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
