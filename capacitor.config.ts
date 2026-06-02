import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.istoc.app',
	appName: 'istoc',
	webDir: 'dist',
	server: {
		// GEÇİCİ: USB tethering test için Vite dev'e bağlan. Production'da bu blok kaldırılacak.
		url: 'http://10.54.157.148:5173',
		cleartext: true,
		androidScheme: 'http',
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
