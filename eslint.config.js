import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["dist", "node_modules", "public", "pages", "**/*.html"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        Alpine: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // ── E2E araçları: Node ortamı ────────────────────────────────────────
  // Playwright spec'leri ve yanlarındaki araçlar Node'da koşuyor; `process`
  // ve `console` orada yasal. Bu blok olmadan her `process.env` okuması
  // `no-undef` hatası veriyordu (kontrast tarama aracında 8 tane).
  {
    files: [
      "tests/e2e/**/*.{ts,mjs,js}",
      "*.config.{js,ts,mjs}",
      "*.cjs", // lighthouserc.cjs — CommonJS, `module.exports` kullanıyor
      "scripts/**",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
        module: "writable",
        require: "readonly",
        // `URL` Node 10'dan beri global; script'ler yol çözmek için kullanıyor.
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
    rules: {
      // Bir CLI aracının çıktısı console'dur; uyarı gürültü olur.
      "no-console": "off",
    },
  },

  // ── Playwright ile sayfaya enjekte edilen ölçüm parçaları ────────────
  // Bu dosyaların KENDİSİ Node script'i (üstteki blok da geçerli), ama
  // `page.evaluate()` callback'leri TARAYICIDA koşuyor — orada DOM globalleri
  // yasal. Liste tek blokta: üç dosya da aynı aileden ve ayrı bloklar
  // tutulduğunda yeni bir ölçüm script'i eklendiğinde unutuluyordu
  // (ölçüldü: `heading-audit.mjs` bu yüzden 1 `no-undef` hatası veriyordu).
  {
    files: [
      "scripts/measure-home-perf.mjs",
      "scripts/heading-audit.mjs",
      "tests/e2e/kontrast-olcum.mjs",
    ],
    languageOptions: {
      globals: {
        document: "readonly",
        getComputedStyle: "readonly",
        innerHeight: "readonly",
        innerWidth: "readonly",
        PerformanceObserver: "readonly",
        performance: "readonly",
      },
    },
  },
];
