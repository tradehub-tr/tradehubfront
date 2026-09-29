/**
 * Medya misafir erişimi — GERÇEK backend E2E (MOGEM-685 Bulgu 1).
 *
 * ÇALIŞTIRMA (kökten): ./e2e.sh --alici   (gerçek-backend bloğu)
 * Gerekli: docker stack ayakta (tradehub.localhost), storefront dist güncel,
 * yerel storefront nginx'inde `/medya/v/<slug>` ve `/media/<id>` yolları
 * (28 Eyl'de yerele eklendi; `/medya/v/` yerelde dist HTML'ini servis eder —
 * gerekçe docker/conf/storefront.nginx.conf'ta).
 *
 * Neyi kanıtlar: ziyaretçi (oturumsuz) izleme sayfasını ve medya kimlik
 * sayfasını açtığında —
 *  - aktif ve Unlisted dosyanın başlığı görünür (test kör değil);
 *  - çöpteki, virüslü ve Protected dosyanın başlığı HİÇBİR yerde görünmez:
 *    izleme sayfası 404 sayfasına gider (API 404), kimlik sayfası 404
 *    (Protected'da 401) döner.
 * Ölçüldü (28 Eyl 2026): düzeltmeden önce çöpteki ve virüslü dosyanın
 * başlığı iki sayfada da 200 ile görünüyordu.
 *
 * Veri: koşum kendi `File` kaydını açar (docker exec → bench python) ve
 * sonunda siler; mevcut hiçbir dosyaya dokunmaz.
 */
import { execFileSync } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const BACKEND = "istoccom-backend-1";
const EK = Date.now().toString(36);
const SLUG = `e2e-misafir-${EK}`;
const BASLIK = `E2E Misafir Baslik ${EK}`;

let dosya = "";

/** Konteynerde site bağlamında Python koşar; kod stdin'den gider (tırnak derdi yok). */
function py(kod: string): string {
  const cikti = execFileSync(
    "docker",
    [
      "exec",
      "-i",
      BACKEND,
      "bash",
      "-c",
      "cd /home/frappe/workspace/frappe-bench/sites && ../env/bin/python -",
    ],
    {
      input: `import frappe\nfrappe.init(site="dev.localhost")\nfrappe.connect()\n${kod}\nfrappe.db.commit()\n`,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 60_000,
    }
  );
  return cikti.trim().split("\n").pop() ?? "";
}

function durum(alanlar: Record<string, string | null>): void {
  py(
    `frappe.db.set_value("File", "${dosya}", ${JSON.stringify(alanlar).replace(/null/g, "None")}, update_modified=False)`
  );
}

const AKTIF = {
  th_media_state: "Active",
  th_media_scan_status: null,
  th_media_visibility: "Public",
};

async function izlemeSayfasi(page: Page) {
  const yanit = await page.goto(`/medya/v/${SLUG}`);
  return yanit?.status() ?? 0;
}

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

// eslint-disable-next-line no-empty-pattern
test.beforeAll(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "tek profil yeter — sunucu kararı viewport'a bağlı değil"
  );
  try {
    execFileSync("docker", ["exec", BACKEND, "true"], { stdio: "ignore", timeout: 10_000 });
  } catch {
    test.skip(true, `docker/${BACKEND} erişilemedi — gerçek backend testi koşamaz`);
  }
  dosya = py(
    [
      `d = frappe.get_doc({"doctype": "File", "file_name": "e2e-misafir-${EK}.webm", "is_private": 0, "content": b"e2e-misafir"}).insert(ignore_permissions=True)`,
      `frappe.db.set_value("File", d.name, {"th_media_slug": "${SLUG}", "th_media_title": "${BASLIK}"}, update_modified=False)`,
      "print(d.name)",
    ].join("\n")
  );
  expect(dosya, "test dosyası açılamadı").toMatch(/^[a-z0-9]+$/);
});

test.afterAll(() => {
  if (dosya) py(`frappe.delete_doc("File", "${dosya}", ignore_permissions=True, force=True)`);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "tr");
    // İşaretsiz `i18nextLng` kullanıcı seçimi sayılmıyor (MOGEM-642 Faz 1).
    localStorage.setItem("th-lang-source", "manual");
  });
});

test("aktif dosya: izleme sayfası başlığı gösterir, kimlik sayfası 200", async ({ page }) => {
  durum(AKTIF);
  expect(await izlemeSayfasi(page)).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: BASLIK })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/medya/v/${SLUG}$`));

  const kimlik = await page.goto(`/media/${dosya}`);
  expect(kimlik?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: BASLIK })).toBeVisible();
});

test("unlisted dosya: bağlantıyı bilen görür", async ({ page }) => {
  durum({ ...AKTIF, th_media_visibility: "Unlisted" });
  expect(await izlemeSayfasi(page)).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: BASLIK })).toBeVisible();
});

for (const [ad, alanlar, kimlikKodu] of [
  ["çöpteki", { ...AKTIF, th_media_state: "Trashed" }, 404],
  ["virüslü", { ...AKTIF, th_media_scan_status: "infected" }, 404],
  ["korumalı", { ...AKTIF, th_media_visibility: "Protected" }, 401],
  [
    "unlisted ama çöpteki",
    { ...AKTIF, th_media_visibility: "Unlisted", th_media_state: "Trashed" },
    404,
  ],
] as const) {
  test(`${ad} dosya: iki sayfada da başlık görünmez`, async ({ page }) => {
    durum(alanlar);
    // Sayfanın kendi API çağrısının durum kodu. Gövde burada OKUNMAZ: sayfa
    // hemen /404.html'e yönlendiği için tarayıcı gövdeyi atıyor ("No resource
    // with given identifier"); gövdeyi aşağıdaki doğrudan istek denetliyor.
    const apiDurumlari: number[] = [];
    page.on("response", (r) => {
      if (r.url().includes("get_watch_page")) apiDurumlari.push(r.status());
    });

    await izlemeSayfasi(page);
    // Sayfa verisini alamayınca ziyaretçiyi 404 sayfasına gönderir.
    await expect(page).toHaveURL(/\/404\.html$/);
    await expect(page.getByText(BASLIK)).toHaveCount(0);
    expect(await page.content()).not.toContain(BASLIK);
    expect(apiDurumlari, "sayfa get_watch_page'i çağırmadı ya da 404 almadı").toEqual([404]);
    const api = await page.request.get(
      `/api/method/tradehub_core.api.media_public.get_watch_page?slug=${SLUG}`
    );
    expect(api.status()).toBe(404);
    expect(await api.text()).not.toContain(BASLIK);

    const kimlik = await page.goto(`/media/${dosya}`);
    expect(kimlik?.status()).toBe(kimlikKodu);
    expect(await kimlik?.text()).not.toContain(BASLIK);
  });
}
