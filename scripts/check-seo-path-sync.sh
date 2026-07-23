#!/usr/bin/env bash
# =============================================================================
# check-seo-path-sync.sh — üçlü path reconciliation (NGX-1 + FE-3 + BE-ROB kabul kriteri)
#
# Üç katmanın pretty-URL kümelerini karşılaştırır:
#   A) nginx $resolved_page map'i (kullanıcı rotaları)
#   B) nginx $seo_static_page_path map'i (bot rotaları)
#   C) tradehub_core static_pages_registry.py (backend seed/sitemap)
#
# Kural: B ⊆ A (bot rotası kullanıcı rotasında da olmalı) ve C ⊆ A.
# (A'da olup B/C'de olmayan girişler bilinçli: dinamik olmayan noindex sayfalar
# bot-proxy'ye gerek duymayabilir — yalnız ters yön kırmızıdır.)
# =============================================================================
set -u
cd "$(dirname "$0")/.."
T="nginx.conf.template"
REGISTRY="../tradehub_core/tradehub_core/seo/static_pages_registry.py"
FAIL=0

# A: $resolved_page anahtarları
A=$(awk '/^map \$uri \$resolved_page \{/,/^\}/' "$T" | grep -oE '^\s+/[a-z0-9/-]*' | tr -d ' ' | sort -u)
# B: $seo_static_page_path anahtarları
B=$(awk '/^map \$uri \$seo_static_page_path \{/,/^\}/' "$T" | grep -oE '^\s+/[a-z0-9/-]*\s' | awk '{print $1}' | sort -u)
# C: registry path'leri
if [ -f "$REGISTRY" ]; then
	C=$(grep -oE '"path": "/[a-z0-9/-]*"' "$REGISTRY" | sed 's/"path": "//; s/"//' | sort -u)
else
	echo "UYARI: $REGISTRY bulunamadı — C katmanı atlandı"
	C=""
fi

echo "== check-seo-path-sync: A=$(echo "$A" | grep -c .) kullanıcı, B=$(echo "$B" | grep -c .) bot, C=$(echo "$C" | grep -c .) registry =="

# B ⊆ A
for p in $B; do
	echo "$A" | grep -qx "$p" || { echo "  FAIL bot rotası $p kullanıcı map'inde yok"; FAIL=1; }
done
# C ⊆ A (/404 istisna: error_page ile servis edilir, rota değildir)
for p in $C; do
	[ "$p" = "/404" ] && continue
	echo "$A" | grep -qx "$p" || { echo "  FAIL registry path $p kullanıcı map'inde yok"; FAIL=1; }
done
# Hayalet kontrol: B'deki her path'in HTML hedefi A üzerinden dist'e çözülebilmeli
for p in $B; do
	target=$(awk '/^map \$uri \$resolved_page \{/,/^\}/' "$T" | awk -v p="$p" '$1 == p {print $2}' | tr -d ';')
	case "$target" in
		/pages/*.html|/index.html)
			src="${target#/}"
			[ -f "$src" ] || { echo "  FAIL $p → $target kaynakta yok (hayalet)"; FAIL=1; } ;;
	esac
done

if [ "$FAIL" -eq 0 ]; then echo "== SENKRON TAM (exit 0) =="; else echo "== SENKRON BOZUK =="; fi
exit "$FAIL"
