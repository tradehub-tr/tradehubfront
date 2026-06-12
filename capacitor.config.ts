import type { CapacitorConfig } from '@capacitor/cli';

// ─────────────────────────────────────────────────────────────────────────────
// İKİ MOD:
//  1) DEV / LIVE-RELOAD (cihazda hızlı test):
//       CAP_SERVER_URL=http://<LAN_IP>:5173 npx cap sync ios   (veya android)
//     → app, Vite dev server'a bağlanır; /api proxy ile backend'e gider.
//     iPhone + Mac aynı WiFi'de olmalı; <LAN_IP> = Mac'in IP'si.
//
//  2) PROD / BUNDLE (App Store / TestFlight):
//       npx cap sync ios          (env vermeden)
//     → server bloğu hiç eklenmez; app, build edilmiş dist'i KENDİ içinden yükler
//     (capacitor://localhost). Bu modda API çağrıları MUTLAK URL ister:
//       VITE_API_URL=https://rc.istoc.com/api npm run build
//     ve backend CORS + cookie (SameSite=None;Secure) + CSRF ayarı gerekir.
// ─────────────────────────────────────────────────────────────────────────────
const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
	appId: 'com.istoc.app',
	appName: 'istoc',
	webDir: 'dist',
	// M24 fix — WebView navigasyonunu yalnız backend host'larına kısıtla (open-redirect /
	// enjekte içerikle keyfi domaine gitmeyi engeller). allowNavigation her modda uygulanır;
	// dev'de ayrıca live-reload server.url eklenir.
	server: {
		allowNavigation: ['rc.istoc.com', 'istoc.com', '*.istoc.com'],
		...(devServerUrl
			? {
					url: devServerUrl,
					cleartext: true,
					androidScheme: 'http',
				}
			: {}),
	},
	ios: {
		contentInset: 'always',
		limitsNavigationsToAppBoundDomains: false,
		preferredContentMode: 'mobile',
	},
	android: {
		allowMixedContent: false,
		captureInput: true,
	},
	plugins: {
		// fetch/XHR'ı native ağ katmanına yönlendirir → cross-origin istekler browser
		// CORS politikasına TAKILMAZ, cookie'ler native jar'da yönetilir. Bundle modunda
		// backend'e (farklı origin) cookie+CSRF ile bağlanmayı mümkün kılar.
		CapacitorHttp: {
			enabled: true,
		},
		SplashScreen: {
			launchShowDuration: 1500,
			backgroundColor: '#ffffff',
			androidScaleType: 'CENTER_CROP',
			showSpinner: false,
			splashFullScreen: true,
			splashImmersive: true,
		},
		StatusBar: {
			style: 'DARK',
			backgroundColor: '#cc9900',
		},
	},
};

export default config;
