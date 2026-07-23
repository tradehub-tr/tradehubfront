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

# 3. add_header sayımı — server + /api/ + /assets/ + resim regex = 4
#    (kendi add_header'ı olan location miras almaz; sayı değişirse tuzak)
n=$(grep -c 'add_header X-Robots-Tag \$robots_tag always;' "$T")
assert 'add_header X-Robots-Tag sayısı' 4 "$n"

# 4. proxy_hide_header — backend'e giden TÜM bloklar (10 proxy + 2 sitemap)
n=$(grep -c 'proxy_hide_header X-Robots-Tag;' "$T")
assert 'proxy_hide_header X-Robots-Tag sayısı' 12 "$n"

# 5. X-Istoc-Storefront marker — 5 @seo_* + 2 sitemap = 7
n=$(grep -c 'X-Istoc-Storefront' "$T")
assert 'X-Istoc-Storefront marker sayısı' 7 "$n"

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
grep -q 'location = /markalar' "$T" && grep -q 'return 301 /ureticiler;' "$T"
assert '/markalar → 301 /ureticiler' 0 $?

# 10. robots dosyaları: prod'da Allow + env marker + (henüz) Sitemap YOK
grep -q '^# env: prod' public/robots-prod.txt && grep -q '^Allow: /$' public/robots-prod.txt
assert 'robots-prod.txt marker + Allow' 0 $?
n=$(grep -c '^Sitemap:' public/robots-prod.txt || true)
assert 'robots-prod.txt Sitemap satırı (BE-MAP öncesi 0 olmalı)' 0 "$n"
grep -q '^# env: noindex' public/robots-noindex.txt && grep -q '^Disallow: /$' public/robots-noindex.txt
assert 'robots-noindex.txt marker + Disallow' 0 $?

echo
if [ "$FAIL" -eq 0 ]; then echo "== TÜM ASSERT'LER GEÇTİ =="; else echo "== BAŞARISIZ =="; fi
exit "$FAIL"
