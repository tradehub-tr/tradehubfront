/**
 * Lighthouse CI (FE-2) — CWV bütçe takibi.
 *
 * Koşum (lokal): npx -y @lhci/cli autorun --config=lighthouserc.cjs
 * Jenkins'te NON-BLOCKING stage olarak koşulur (plan JNK-1 notu) — kırmızı
 * skor build'i düşürmez, trend raporu üretir.
 *
 * Hedefler (plan FAZ 2 / CWV): LCP < 2.5s, CLS < 0.1, TBT < 300ms.
 */
module.exports = {
	ci: {
		collect: {
			staticDistDir: './dist',
			url: [
				'http://localhost/index.html',
				'http://localhost/pages/products.html',
				'http://localhost/pages/product-detail.html',
			],
			numberOfRuns: 3,
			settings: { preset: 'desktop' },
		},
		assert: {
			assertions: {
				'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
				'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
				'total-blocking-time': ['warn', { maxNumericValue: 300 }],
				'categories:performance': ['warn', { minScore: 0.8 }],
				'categories:seo': ['warn', { minScore: 0.9 }],
			},
		},
		upload: { target: 'filesystem', outputDir: './perf-reports/lhci' },
	},
};
