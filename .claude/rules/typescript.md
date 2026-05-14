---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript + Component pattern

## 1. tsconfig kuralları

- `strict: true` aktif → `null`/`undefined` ayrımına dikkat
- `noUnusedLocals` + `noUnusedParameters` → kullanılmayan değişkene `_` prefix ver veya sil
- `verbatimModuleSyntax: true` → `import type { Foo } from "..."` zorunlu (sadece tip için)
- `any` ESLint warn → `unknown` ile başla, type guard ile daralt
- `console.log` warn → debug bittiğinde sil veya `console.warn` / `console.error` kullan

## 2. DOM erişimi

```ts
const el = this.$el as HTMLElement;
const input = el.querySelector<HTMLInputElement>('input[type="text"]');
```

Type cast yerine `querySelector<T>` generic'i tercih et.

## 3. Component organizasyonu

`src/components/` altında her özellik klasörü şu şablonu izler:

```
components/<feature>/
├── index.ts              # Barrel export
├── <Component>.ts        # Render fonksiyonu (HTML string döndürür) + init
└── ...
```

Component pattern:
```ts
export function MyComponent(props: Props): string {
  return /* html */ `
    <div x-data="myFeature(${JSON.stringify(props.initial)})">
      ...
    </div>
  `;
}

export function initMyComponent(): void {
  // DOM hazır olduktan sonra event listener'lar
}
```

`main.ts` veya `pages/<page>.ts` içinde:
1. `innerHTML` ile HTML'i yerleştir
2. `init*` fonksiyonlarını çağır
3. `startAlpine()` **bir kez** çağır (sayfa init'inin sonunda)

## 4. XSS koruması

Kullanıcı içeriğini `innerHTML`'e DOMPurify'sız verme:

```ts
import DOMPurify from "dompurify";

el.innerHTML = DOMPurify.sanitize(userContent);
```

Backend'den gelen güvenilir içerik için bile gözden geçirilebilir.
