#!/usr/bin/env bash
# =============================================================================
# verify-seo-bot.sh — Canlı SEO/bot-proxy doğrulama matrisi (BOT-1)
#
# Üretim davranışını DEĞİŞTİRMEZ; yalnız curl ile doğrular.
#
# Kullanım:
#   BASE_URL=https://rc.istoc.com EXPECT_NOINDEX=1 ./scripts/verify-seo-bot.sh
#   BASE_URL=https://istoc.com    EXPECT_NOINDEX=0 ./scripts/verify-seo-bot.sh
#
# Parametreler (env):
#   BASE_URL        Hedef ortam (zorunlu; ör. https://rc.istoc.com)
#   EXPECT_NOINDEX  1 = X-Robots-Tag noindex BEKLENİR (staging)
#                   0 = X-Robots-Tag OLMAMALI (prod)          [default: 1]
#   PRODUCT_SLUG    Bot-proxy içerik testi için gerçek ürün slug'ı (ops.)
#   CHECK_WWW       1 = www→apex 301 tek-hop kontrolü (yalnız prod)  [default: 0]
#
# Çıkış: 0 = tüm assert'ler geçti; 1 = en az bir FAIL.
# =============================================================================
set -u

BASE_URL="${BASE_URL:?BASE_URL zorunlu (ör. https://rc.istoc.com)}"
EXPECT_NOINDEX="${EXPECT_NOINDEX:-1}"
PRODUCT_SLUG="${PRODUCT_SLUG:-}"
CHECK_WWW="${CHECK_WWW:-0}"
GOOGLEBOT_UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

PASS=0; FAIL=0

ok()   { PASS=$((PASS+1)); printf '  \033[32mPASS\033[0m %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31mFAIL\033[0m %s\n' "$1"; }

hdr()  { curl -sS -o /dev/null -D - --max-time 20 -A "$2" "$1" 2>/dev/null; }
body() { curl -sS --max-time 20 -A "$2" "$1" 2>/dev/null; }

section() { printf '\n== %s ==\n' "$1"; }

# --- 1. X-Robots-Tag header matrisi (statik HTML + asset + bot rotası) -------
section "X-Robots-Tag header (EXPECT_NOINDEX=$EXPECT_NOINDEX)"
# add_header miras tuzağı: her location tipinden en az bir path test edilir.
HEADER_PATHS=("/" "/urunler" "/kategoriler" "/sss" "/robots.txt")
for path in "${HEADER_PATHS[@]}"; do
	h="$(hdr "$BASE_URL$path" "Mozilla/5.0")"
	tag="$(printf '%s' "$h" | grep -ci '^x-robots-tag:.*noindex' || true)"
	if [ "$EXPECT_NOINDEX" = "1" ]; then
		[ "$tag" -ge 1 ] && ok "$path → noindex header VAR" || bad "$path → noindex header YOK (staging'de olmalı)"
	else
		[ "$tag" -eq 0 ] && ok "$path → noindex header yok" || bad "$path → noindex header SIZMIŞ (prod'da olmamalı!)"
	fi
done

# Googlebot UA (bot-proxy rotası backend'e gider — proxy_hide_header kontrolü)
h="$(hdr "$BASE_URL/" "$GOOGLEBOT_UA")"
tag="$(printf '%s' "$h" | grep -ci '^x-robots-tag:.*noindex' || true)"
if [ "$EXPECT_NOINDEX" = "1" ]; then
	[ "$tag" -ge 1 ] && ok "Googlebot / → noindex VAR" || bad "Googlebot / → noindex YOK"
else
	[ "$tag" -eq 0 ] && ok "Googlebot / → noindex yok" || bad "Googlebot / → backend header SIZMIŞ (proxy_hide_header?)"
fi

# --- 2. robots.txt gövdesi ---------------------------------------------------
section "robots.txt"
rb="$(body "$BASE_URL/robots.txt" "Mozilla/5.0")"
if [ "$EXPECT_NOINDEX" = "1" ]; then
	printf '%s' "$rb" | grep -q '^Disallow: /$' && ok "robots.txt → Disallow: /" || bad "robots.txt → Disallow: / bekleniyordu; içerik: $(printf '%s' "$rb" | head -3 | tr '\n' ' ')"
else
	printf '%s' "$rb" | grep -q '^Allow: /$' && ok "robots.txt → Allow: /" || bad "robots.txt → Allow: / bekleniyordu"
	# gerçek newline kontrolü ($robots_body literal \n tuzağı)
	lines="$(printf '%s' "$rb" | wc -l | tr -d ' ')"
	[ "$lines" -ge 2 ] && ok "robots.txt çok satırlı ($lines satır)" || bad "robots.txt TEK satır — literal \\n tuzağı?"
fi

# --- 3. Bot-proxy içerik paritesi (opsiyonel, PRODUCT_SLUG ile) --------------
if [ -n "$PRODUCT_SLUG" ]; then
	section "Bot-proxy içerik (/urun/$PRODUCT_SLUG)"
	b_bot="$(body "$BASE_URL/urun/$PRODUCT_SLUG" "$GOOGLEBOT_UA")"
	printf '%s' "$b_bot" | grep -qi '<title>' && ok "bot HTML'inde <title> var" || bad "bot HTML'inde <title> yok"
	printf '%s' "$b_bot" | grep -qi 'rel="canonical"' && ok "bot HTML'inde canonical var" || bad "bot HTML'inde canonical yok"
	# canonical apex'i göstermeli (cronbi/www sızıntısı)
	if printf '%s' "$b_bot" | grep -qi 'canonical.*cronbi\.com\|canonical.*www\.istoc\.com'; then
		bad "canonical yanlış host gösteriyor (cronbi/www)"
	else
		ok "canonical host temiz"
	fi
fi

# --- 4. Negatif slug (soft-404 kontrolü) -------------------------------------
section "Negatif slug"
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -A "$GOOGLEBOT_UA" "$BASE_URL/urun/olmayan-urun-xyz-404-testi" 2>/dev/null)"
if [ "$code" = "404" ] || [ "$code" = "410" ]; then
	ok "olmayan slug → $code"
else
	bad "olmayan slug → $code (404/410 bekleniyordu — soft-404 riski)"
fi

# --- 5. www → apex 301 tek-hop (yalnız prod, CHECK_WWW=1) --------------------
if [ "$CHECK_WWW" = "1" ]; then
	section "www → apex 301"
	loc_line="$(curl -sS -o /dev/null -D - --max-time 20 "https://www.istoc.com/" 2>/dev/null | tr -d '\r')"
	code="$(printf '%s' "$loc_line" | head -1 | awk '{print $2}')"
	target="$(printf '%s' "$loc_line" | grep -i '^location:' | awk '{print $2}')"
	if [ "$code" = "301" ] && [ "$target" = "https://istoc.com/" ]; then
		ok "www → 301 tek-hop → https://istoc.com/"
	else
		bad "www → code=$code target=$target (301 + https://istoc.com/ bekleniyordu)"
	fi
fi

# --- Sonuç -------------------------------------------------------------------
printf '\n== SONUÇ: %d PASS / %d FAIL ==\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
