# iOS — Test & App Store Rehberi

iOS build **yalnızca macOS + Xcode** ile yapılır (Linux'ta olmaz). Proje hazır:
`ios/App/App.xcodeproj` (Capacitor 8, Swift Package Manager — CocoaPods gerekmez),
`Info.plist`'te ATS açık. Aşağıdaki adımları **ofisteki Mac'te** uygula.

`capacitor.config.ts` artık **iki modlu**:
- `CAP_SERVER_URL` env verilirse → dev live-reload (Vite dev server'a bağlanır)
- verilmezse → prod/bundle (App Store derlemesi bu hâlde)

---

## Mac ön kurulum (tek sefer)
```bash
xcode-select --install            # Xcode Command Line Tools (yoksa)
# App Store'dan Xcode kurulu olmalı
node -v                           # 20+ (proje Node 22 ile geliştirildi)
```

## AŞAMA 1 — iPhone'da hızlı test (live-reload, en kolay)
Mac ve iPhone **aynı WiFi'de** olmalı. `<MAC_LAN_IP>` = Mac'in yerel IP'si
(System Settings → Network, ya da `ipconfig getifaddr en0`).

```bash
git pull
npm install
npm run build                     # dist üret (ilk sync için gerekli)

# Mac'in IP'siyle dev server'a bağla + Xcode'da aç:
CAP_SERVER_URL=http://<MAC_LAN_IP>:5173 npx cap sync ios
npx cap open ios

# AYRI bir terminalde dev server'ı LAN'a aç:
npm run dev -- --host 0.0.0.0 --port 5173
```
Xcode'da: üstten **iPhone cihazını** (veya Simulator) seç → ▶ **Run**.
- **Simulator** → Apple ID gerekmez, anında çalışır.
- **Gerçek iPhone** → Xcode → Signing & Capabilities → Team olarak ücretsiz Apple ID
  seç (7 gün geçerli kişisel imza) veya ofisin Developer hesabı. iPhone'da
  Ayarlar → Genel → VPN ve Cihaz Yönetimi → geliştiriciye güven.
- API çağrıları `/api` → Vite proxy → backend (tarayıcı testindeki gibi çalışır).

## AŞAMA 1b — Bundle modunda test (App Store'a yakın)
Dev server olmadan, app kendi içindeki dist'i yükler. Cross-origin **kod tarafında
çözüldü** (aşağıdaki "Cross-origin nasıl çalışıyor"). Backend'e (mutlak URL) bağlanmak için:
```bash
# Native bundle hangi backend'e bağlanacak (varsayılan: https://rc.istoc.com):
VITE_NATIVE_API_URL=https://rc.istoc.com npm run build
npx cap sync ios                  # env(CAP_SERVER_URL) YOK → bundle modu
npx cap open ios                  # Run
```
> Backend'de **CORS ayarı GEREKMEZ** — `CapacitorHttp` istekleri native ağdan geçer,
> browser CORS politikası uygulanmaz. Aşama 1 (live-reload) bundan etkilenmez.

### Cross-origin nasıl çalışıyor (kod)
- `capacitor.config.ts` → `plugins.CapacitorHttp.enabled = true`: fetch/XHR native
  ağ katmanına gider → CORS yok, cookie native jar'da.
- `src/utils/nativeHttp.ts`: bundle modunda `window.fetch`'i sarıp relative
  `/api|/files|/private|/assets|/socket.io` URL'lerini `VITE_NATIVE_API_URL` ile
  mutlaklaştırır. Web ve live-reload'da **no-op**.
- `src/utils/api.ts`: bundle'da `BASE_URL` = mutlak backend (`window.API_BASE` de öyle).
- Auth/CSRF akışı aynı kalır (cookie + `get_session_user` token); native cookie jar taşır.
- ⚠ `reviewsApi.ts` kendi `VITE_FRAPPE_BASE`'ini kullanır → native build'de onu da
  prod backend'e set et: `VITE_FRAPPE_BASE=https://rc.istoc.com`.

---

## AŞAMA 2 — App Store yayını (checklist)

### A. Kod/proje hazırlığı
- [x] **API cross-origin** — ÇÖZÜLDÜ (CapacitorHttp + `nativeHttp.ts`; backend CORS gerekmez).
      Sadece build env'leri ver: `VITE_NATIVE_API_URL` (+ gerekiyorsa `VITE_FRAPPE_BASE`).
- [ ] **Cihazda doğrula** — gerçek iPhone'da login → session cookie → CSRF POST akışını
      bir kez test et (native cookie jar + CSRF token gerçekten taşınıyor mu).
- [ ] **ATS daraltma** — `Info.plist`'teki `NSAllowsArbitraryLoads` App Store'da
      sorgulanır; prod'da kaldırıp sadece gerekli https domainlere izin ver.
- [ ] **Versiyon** — Xcode'da Version (CFBundleShortVersionString) + Build (CFBundleVersion)
- [ ] **İkon & Splash** — `npx @capacitor/assets generate --ios` (kaynak: 1024x1024 logo)

### B. Apple tarafı
- [ ] **Apple Developer Program** ($99/yıl) — ofis hesabı
- [ ] **App Store Connect**'te uygulama kaydı (Bundle ID: `com.istoc.app`)
- [ ] **Signing** — Distribution sertifikası + App Store provisioning profile
      (Xcode "Automatically manage signing" ile otomatik üretir)
- [ ] **Gizlilik** — Privacy Policy URL (zaten var: /gizlilik-politikasi),
      App Privacy "Nutrition Label" (toplanan veri beyanı), hesap silme yolu (zorunlu)

### C. Build + yükleme
```bash
VITE_API_URL=https://rc.istoc.com/api npm run build
npx cap sync ios
npx cap open ios
# Xcode: Product → Archive → Distribute App → App Store Connect → Upload
```
- [ ] **TestFlight** — önce TestFlight'ta dahili test (kendi iPhone'unda)
- [ ] **App Store** — metadata, ekran görüntüleri (6.7" + 5.5" zorunlu), açıklama,
      kategori → "Submit for Review" → Apple incelemesi (~1-3 gün)

---

## Notlar
- Geliştirme makinesi Linux olduğu için iOS derlemesi/Archive **Mac'te** yapılır.
  Mac yoksa bulut: Codemagic / GitHub Actions (macOS) / Ionic Appflow / Bitrise.
- `capacitor.config.ts`'e makine-özel IP **commit'lenmez** — `CAP_SERVER_URL` env kullan.
