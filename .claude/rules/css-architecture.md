---
paths:
  - "**/*.css"
  - "src/style.css"
  - "**/*.html"
  - "**/*.ts"
---

# CSS mimari + izin kapısı

## 1. İzin kapısı — `src/style.css` ve `src/styles/**`

`.claude/settings.json` bu yollar için izin sormalı:

```json
{
  "permissions": {
    "ask": [
      "Edit(src/style.css)",
      "Write(src/style.css)",
      "Edit(src/styles/**)",
      "Write(src/styles/**)"
    ]
  }
}
```

**İzin istemeden önce hazır olmanız gerekenler:**

1. Hangi class/değişkeni ekliyorsunuz, neden utility'e çevrilemiyor?
2. `tailwind-utility-rules.md`'deki 4 sorudan hangisine "evet" cevap bu satırı buraya koyuyor?
3. Bu satır olmadan tasarım nasıl bozulur? (somut görsel/işlevsel etki)

Net cevabınız yoksa **izin istemeyin**, önce yine utility ile denemeyi düşünün.

## 2. CSS hiyerarşi (tercih sırası)

1. **Inline utility class'ları** — varsayılan, %90 vakada bu
2. **`@theme` token** — yeni tasarım değişkeni gerekiyorsa `style.css` `@theme` bloğuna
3. **`@layer base`** — global element reset (`h1`, `body`)
4. **`@layer components` + `@apply`** — sadece **3'ten fazla yerde** tekrar eden compound (örn. `.btn-primary` global)
5. **3rd-party override** — Flowbite/Swiper iç class'larını ezme
6. **Custom CSS (vanilla)** — animation, kompleks pseudo-element trick'leri

## 3. `@theme` token'ları

`src/style.css` `@theme` bloğu Tailwind v4'ün tek konfigürasyon noktası:

- `--color-{name}-{50..950}` → `bg-{name}-500`, `text-{name}-700` otomatik
- `--font-{name}` → `font-{name}`
- `--breakpoint-{name}` → `{name}:` responsive variant

**Token eklerken:**
- 3'ten az yerde kullanılacaksa **token ekleme**, arbitrary value yaz: `bg-[#f5b800]`
- `cssEditorPlugin` (vite.config.ts) token'ları dev-time düzenleyebiliyor — yeniden adlandırırken bu plugin'i kontrol et

## 4. CSS değişkenleri (uzaktan tema)

Bu projede uzaktan tema desteği var (`themeBootstrapPlugin` vite.config.ts'te). `localStorage` ve `/api/method/tradehub_core.api.theme.get_public_theme`'den gelen değerler `:root`'a inject ediliyor.

CSS değişkeni içeren stil yazarken:
- Tailwind arbitrary value: `class="bg-[var(--color-surface,#fff)]"`
- Fallback **mutlaka** ver (`,#fff`) — uzak tema yüklenmeden önceki paint için

## 5. `src/style.css` şişme yasağı

Mayıs 2026 refactor sonrası baseline:

| Dosya | Mevcut | Max tolerans |
|---|---:|---:|
| `src/style.css` | ~4300 satır | 4500 (üstü = uyarı) |
| `src/styles/*.css` | 0 (dizin silindi) | 0 (yeni dosya yasak) |

**Yeni satır eklemek için kanıt göster:**
- Utility ile ifade edilemediğini açıkça belirt
- 3rd-party override ise hangi kütüphaneyi/seçiciyi ezdiğini yorum satırına yaz
- `:root` değişkeni ekliyorsan uzaktan tema sisteminde admin panelden ayarlanan token mı kontrol et — değilse `@theme` tercih et
- Refactor sırasında satır **artmıyorsa** azalmalı

**Yeni `src/styles/*.css` yasak.** Sayfa-spesifik stil:
- Utility class olarak HTML/TS içine yaz (varsayılan)
- Çok karmaşık layout için component-local CSS modülü (`MyComponent.module.css`)
- Global gereken token varsa `style.css`'in `@theme` bloğuna ekle

## 6. JS-toggled state → data-attribute + variant

`.parent.state .child` pattern'i (parent class JS ile toggle ediliyorsa) **yasak**.

**Adım 1 — JS değişikliği:**
```ts
// ❌ ESKİ
el.classList.toggle("active", isActive);

// ✅ YENİ
el.dataset.state = isActive ? "active" : "inactive";
```

**Adım 2 — Parent'a `group/name`, child'a `group-data-[*]/name:` variant:**
```html
<div class="group/myThing" data-state="inactive">
  <div class="text-gray-500 group-data-[state=active]/myThing:text-blue-500">
```

**Alternatif:** Alpine `:class` binding (basit durumlar):
```html
<div :class="{ 'border-blue-500 bg-blue-50': isActive, 'border-gray-200 bg-white': !isActive }">
```

**Veya `[&.class]:` arbitrary parent variant** (eski JS toggle, refactor maliyeti yüksek):
```html
<div class="border [&.active]:border-blue-500 [&.active]:bg-blue-50">
```
