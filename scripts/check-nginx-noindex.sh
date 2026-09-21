#!/usr/bin/env bash
# =============================================================================
# check-nginx-noindex.sh — NGX-1 statik template assert'leri (CI: npm run check:nginx)
#
# nginx.conf.template'teki SEO ortam-izolasyon mekanizmasının yanlışlıkla
# bozulmasını (satır silme, add_header miras tuzağı, map değişikliği) yakalar.
# Canlı doğrulama için scripts/verify-seo-bot.sh kullanılır (Ç5 katmanlaması).
# =============================================================================
set -u
cd "$(dirname "$0")/.."
T="nginx.conf.template"
FAIL=0

assert() { # $1=açıklama $2=beklenen $3=gerçek
	if [ "$2" = "$3" ]; then
		printf '  PASS %s\n' "$1"
	else
		printf '  FAIL %s (beklenen=%s, bulunan=%s)\n' "$1" "$2" "$3"
		FAIL=1
	fi
}

echo "== check-nginx-noindex: $T =="

# 1. $robots_tag map'i — fail-closed (default noindex, yalnız istoc.com boş)
grep -A3 'map "\${FRONTEND_DOMAIN}" \$robots_tag' "$T" | grep -q 'default\s*"noindex, nofollow"'
assert '$robots_tag map default=noindex (fail-closed)' 0 $?
grep -A3 'map "\${FRONTEND_DOMAIN}" \$robots_tag' "$T" | grep -q '"istoc.com" ""'
assert '$robots_tag map istoc.com=boş (header basılmaz)' 0 $?

# 2. $robots_file map'i (4. assert — robots gövde seçici)
grep -A3 'map "\${FRONTEND_DOMAIN}" \$robots_file' "$T" | grep -q 'default\s*/robots-noindex.txt'
assert '$robots_file map default=/robots-noindex.txt' 0 $?
grep -A3 'map "\${FRONTEND_DOMAIN}" \$robots_file' "$T" | grep -q '"istoc.com" /robots-prod.txt'
assert '$robots_file map istoc.com=/robots-prod.txt' 0 $?

# 3. add_header sayımı — server + /api/ + /assets/ + resim regex + stable media = 5
#    (kendi add_header'ı olan location miras almaz; sayı değişirse tuzak)
n=$(grep -c 'add_header X-Robots-Tag \$robots_tag always;' "$T")
assert 'add_header X-Robots-Tag sayısı' 5 "$n"

# 4. proxy_hide_header — backend'e giden TÜM bloklar
#    (10 proxy + 2 sitemap + 2 medya = 14)
#
#    13 → 14 GÜNCELLENDİ (21 Eyl 2026). Sebep arkeolojiyle bulundu: bu dosya
#    en son 22 Ağustos'ta (e8d0339) güncellenmiş; 28 Ağustos'ta aa1be08
#    (feat(product): medya izleme sayfası…) `location ~ ^/medya/v/([a-z0-9-]+)$`
#    bloğunu ekledi. Blok DOĞRU deseni taşıyor — `proxy_hide_header X-Robots-Tag`
#    ve `X-Istoc-Storefront "1"` ikisi de yerinde (gözle doğrulandı) — yani kayma
#    masum, bayat olan sabitti.
#
#    ⚠ Bu denetim CI'da KOŞMUYOR (ölçüldü 21 Eyl: lint.yml/test.yml'de satırı yok),
#    bu yüzden kayma 24 gün fark edilmeden durdu. Sayı yine değişirse ÖNCE yeni
#    bloğun bu iki satırı taşıyıp taşımadığına bakılır: taşımıyorsa sabit
#    güncellenmez, BLOK düzeltilir — eksik `proxy_hide_header`, backend'in
#    X-Robots-Tag başlığını müşteriye sızdırır.
n=$(grep -c 'proxy_hide_header X-Robots-Tag;' "$T")
assert 'proxy_hide_header X-Robots-Tag sayısı' 14 "$n"

# 5. X-Istoc-Storefront marker — 5 @seo_* + 2 sitemap + 2 medya = 9
#    (8 → 9: yukarıdaki aynı sebep — /medya/v/ bloğu)
n=$(grep -c 'X-Istoc-Storefront' "$T")
assert 'X-Istoc-Storefront marker sayısı' 9 "$n"

# 6. robots.txt location + dosya seçimi
grep -q 'location = /robots.txt' "$T" && grep -q 'try_files \$robots_file =404;' "$T"
assert 'location = /robots.txt + try_files $robots_file' 0 $?

# 7. www → apex 301 container savunması
grep -q 'if (\$host = "www.\${FRONTEND_DOMAIN}")' "$T"
assert 'www → apex 301 if bloğu' 0 $?

# 8. Hayalet path'ler temizlendi (maps'te olmamalı)
n=$(grep -cE '^\s+/(blog|kariyer|kurumsal-sorumluluk|izleme|haberler|ortakliklar|kargo-koruma|vergi|satici/dogrulama)\s' "$T" || true)
assert 'hayalet path kalıntısı' 0 "$n"

# 9. /markalar yalnız 301 olarak var
#
#    Hedef DESENLE aranır, birebir dizeyle değil (2026-09-21): yönlendirmeler
#    o gün `return 301 /ureticiler;` yerine `return 301 https://$host/ureticiler;`
#    oldu — göreli Location, Caddy arkasında `$scheme=http` verdiği için
#    tarayıcıyı önce http'ye gönderiyordu (ölçüldü: canlıda
#    `location: http://istoc.com/ureticiler`). İddianın AMACI değişmedi:
#    /markalar hâlâ yalnız 301 olarak var ve hedefi /ureticiler.
grep -q 'location = /markalar' "$T" && grep -qE 'return 301 [^;]*/ureticiler;' "$T"
assert '/markalar → 301 /ureticiler' 0 $?

# 10. robots dosyaları: prod'da Allow + env marker + canlı sitemap bildirimi
grep -q '^# env: prod' public/robots-prod.txt && grep -q '^Allow: /$' public/robots-prod.txt
assert 'robots-prod.txt marker + Allow' 0 $?
n=$(grep -c '^Sitemap:' public/robots-prod.txt || true)
assert 'robots-prod.txt Sitemap satırı' 1 "$n"
grep -q '^# env: noindex' public/robots-noindex.txt && grep -q '^Disallow: /$' public/robots-noindex.txt
assert 'robots-noindex.txt marker + Disallow' 0 $?

# 11. Ülke başlığı backend'e GİDİYOR, ama yalnız nginx'in ürettiği değerle
#
#     NEDEN BU DENETİM VAR (21 Eyl 2026): Faz 1.4'te `X-Country` güvenlik için
#     boşaltıldı (istemci ülkesini uydurabiliyordu) ve "kaynak belli olunca
#     doldurulacak" notu düşüldü. Kaynak 17 Eyl'de belli oldu (M1: nginx geo)
#     ama satır beş gün boş kaldı. Sonuç ölçüldü: dil `TR` derken para birimi
#     `US`/USD diyordu — Türkiye'deki İngilizce tarayıcılı kullanıcı arayüzü
#     Türkçe, fiyatları dolar görüyordu. Hiçbir test bunu söylemedi.
#
#     İki yönlü iddia: (a) /api/ bloğu ülkeyi GÖNDERMELİ, (b) değer
#     `$ulke_yayin` olmalı — `$ulke_kodu` DEĞİL, çünkü bot muafiyeti
#     ikincisinde yok ve arama motoruna ülke sızardı.
grep -qE 'proxy_set_header X-Country \$ulke_yayin;' "$T"
assert 'X-Country backend'"'"'e gidiyor ($ulke_yayin ile)' 0 $?
n=$(grep -c 'proxy_set_header X-Country \$ulke_kodu;' "$T" || true)
assert 'X-Country bot muafiyetsiz değişken KULLANMIYOR' 0 "$n"

# 12. CF-IPCountry HER blokta boş kalmalı
#
#     Backend `_detect_country()` bunu X-Country'den ÖNCE okuyor. Dolu
#     bırakılsaydı istemci `CF-IPCountry: US` gönderip ülkesini uydurabilir,
#     11. maddedeki düzeltme anlamsızlaşırdı. Cloudflare M1 ile elendi, yani
#     bu başlık meşru bir kaynaktan da gelmiyor.
n=$(grep -c 'proxy_set_header CF-IPCountry "";' "$T" || true)
d=$(grep -c 'proxy_set_header CF-IPCountry' "$T" || true)
assert 'CF-IPCountry her blokta boş' "$d" "$n"

echo
if [ "$FAIL" -eq 0 ]; then echo "== TÜM ASSERT'LER GEÇTİ =="; else echo "== BAŞARISIZ =="; fi
exit "$FAIL"
