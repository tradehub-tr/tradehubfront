#!/usr/bin/env bash
# ÜLKE TESPİTİ DOĞRULAMA TAKIMI — üretim nginx yapılandırmasına karşı (L1).
#
# NEDEN VAR: lokal `docker compose` üretim config'ini KOŞMUYOR — storefront
# servisi imajı bizim Dockerfile'ımızla derliyor ama config'i mount ile
# eziyor (`docker/conf/storefront.nginx.conf`). Yani `nginx.conf.template`e
# yapılan hiçbir değişiklik lokal stack'te görünmez. Bu script üretim
# şablonunu ayrı bir container'da ayağa kaldırıp sınar.
#
# NEDEN VPN GEREKMİYOR: güven sınırını biz belirliyoruz. `set_real_ip_from`
# özel aralıklara güvendiği için, container'a docker ağından gönderilen
# `X-Forwarded-For` kabul edilir — yani herhangi bir ülkeden geliyormuş gibi
# istek atabiliriz. Gerçek VPN turu (L3) bunun yerine geçmez, ama dört ülkeyi
# her değişiklikte saniyeler içinde sınamayı sağlar.
#
# KULLANIM: bash scripts/ulke-tablosu-dogrula.sh
set -u

KOK="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AD="ulke-dogrula-$$"
PORT=8095
GECTI=0
DUSTU=0

temizle() { docker rm -f "$AD" >/dev/null 2>&1 || true; }
trap temizle EXIT

iddia() { # iddia <açıklama> <beklenen> <bulunan>
  if [[ "$2" == "$3" ]]; then
    printf '  \033[0;32mGEÇTİ\033[0m %s\n' "$1"
    GECTI=$((GECTI + 1))
  else
    printf '  \033[0;31mDÜŞTÜ\033[0m %s — beklenen=%q bulunan=%q\n' "$1" "$2" "$3"
    DUSTU=$((DUSTU + 1))
  fi
}

# Teşhis ucundan tek alan okur. jq'ya bağımlı olmamak bilinçli: bu script
# geliştirici makinesinde de CI'da da kurulum istemeden koşabilmeli.
alan() { # alan <json> <anahtar>
  printf '%s' "$1" | sed -n "s/.*\"$2\":\"\([^\"]*\)\".*/\1/p"
}

istek() { # istek <ip> [user-agent]
  local ip="$1" ua="${2:-curl-test}"
  curl -s --max-time 10 -H "X-Forwarded-For: $ip" -H "User-Agent: $ua" \
    "http://127.0.0.1:$PORT/__dil-teshis"
}

echo "▶ Üretim nginx yapılandırması ayağa kaldırılıyor…"
temizle
docker run --rm -d --name "$AD" \
  -e BACKEND_DOMAIN=istoc.cronbi.com \
  -e FRONTEND_DOMAIN=istoc.com \
  -e NGINX_ENVSUBST_FILTER='^(BACKEND_DOMAIN|FRONTEND_DOMAIN)$' \
  -v "$KOK/nginx.conf.template":/etc/nginx/templates/default.conf.template:ro \
  -v "$KOK/dist":/usr/share/nginx/html:ro \
  -p "$PORT":80 nginx:alpine >/dev/null || {
  echo "✗ container başlatılamadı (dist/ derlenmiş mi?)"
  exit 1
}
# HAZIRLIK KAPISI: container ayağa kalkmadan iddialara geçilirse HER istek boş
# döner ve 20'den fazla test "düştü" der — kusur nginx'te sanılır, oysa
# yalnız yarış vardır. Ölçüldü 17 Eyl 2026: önceki container silinirken
# koşulan tur 22 sahte hata üretti. Hazırlık ayrı bir kapı ve NET hata veriyor.
HAZIR=0
for _ in $(seq 1 40); do
  if curl -sf -o /dev/null "http://127.0.0.1:$PORT/__dil-teshis"; then
    HAZIR=1
    break
  fi
  sleep 0.5
done
if [[ "$HAZIR" -ne 1 ]]; then
  echo "✗ Container 20 saniyede hazır olmadı — iddialar KOŞULMADI (sahte hata üretmemek için)."
  echo "  Muhtemel sebepler: $PORT portu dolu · nginx yapılandırması bozuk · dist/ yok."
  echo "  Container günlüğü:"
  docker logs "$AD" 2>&1 | tail -15 | sed 's/^/    /'
  exit 1
fi

echo "▶ Ülke tespiti — bilinen IP'ler"
iddia "Türk Telekom 88.255.0.1 → TR" "TR" "$(alan "$(istek 88.255.0.1)" ulke)"
iddia "Türk Telekom 212.156.0.1 → TR" "TR" "$(alan "$(istek 212.156.0.1)" ulke)"
iddia "Yandex 95.108.213.1 → RU" "RU" "$(alan "$(istek 95.108.213.1)" ulke)"
iddia "STC Suudi 188.49.0.1 → SA" "SA" "$(alan "$(istek 188.49.0.1)" ulke)"
iddia "Etisalat BAE 94.200.0.1 → AE" "AE" "$(alan "$(istek 94.200.0.1)" ulke)"
iddia "TE Mısır 41.33.0.1 → EG" "EG" "$(alan "$(istek 41.33.0.1)" ulke)"

echo "▶ Listede olmayan ülkeler boş dönmeli (İngilizceye düşer)"
iddia "Google ABD 8.8.8.8 → boş" "" "$(alan "$(istek 8.8.8.8)" ulke)"
iddia "Wikimedia NL 91.198.174.192 → boş" "" "$(alan "$(istek 91.198.174.192)" ulke)"
iddia "Almanya 85.214.0.1 → boş" "" "$(alan "$(istek 85.214.0.1)" ulke)"

echo "▶ IPv6 — tabloda 17 binden fazla kayıt var, gerçekten okunuyor mu"
# Mobil kullanıcıların çoğu IPv6. Bu blok eklenene kadar tablo IPv6 kayıtları
# taşıyor ama HİÇ SINANMIYORDU (17 Eyl 2026 boşluk taraması).
iddia "TR IPv6 2001:5:1::1 → TR" "TR" "$(alan "$(istek '2001:5:1::1')" ulke)"
iddia "RU IPv6 2001:470:180f::1 → RU" "RU" "$(alan "$(istek '2001:470:180f::1')" ulke)"
iddia "AE IPv6 2001:470:3cf::1 → AE" "AE" "$(alan "$(istek '2001:470:3cf::1')" ulke)"
iddia "Google IPv6 → boş" "" "$(alan "$(istek '2001:4860:4860::8888')" ulke)"

echo "▶ Çok duraklı X-Forwarded-For — sahte önek kazanmamalı"
# Caddy istemcinin gönderdiği XFF'e EKLEME yapıyor. Ziyaretçi sahte bir önek
# gönderirse başlık "8.8.8.8, <gerçek>" olur; `real_ip_recursive` sağdan
# sola yürüyüp güvenilmeyen İLK adresi aldığı için gerçek istemci kazanır.
iddia "tek proxy: '88.255.0.1, 192.168.144.1' → TR" "TR" "$(alan "$(istek '88.255.0.1, 192.168.144.1')" ulke)"
iddia "çok proxy: '95.108.213.1, 10.0.0.5, 172.17.0.1' → RU" "RU" "$(alan "$(istek '95.108.213.1, 10.0.0.5, 172.17.0.1')" ulke)"
iddia "sahte önek: '8.8.8.8, 88.255.0.1' → TR (sahte yok sayılır)" "TR" "$(alan "$(istek '8.8.8.8, 88.255.0.1')" ulke)"

echo "▶ Bot muafiyeti"
BOT_JSON="$(istek 88.255.0.1 "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")"
iddia "Googlebot: tablo ülkeyi buluyor" "TR" "$(alan "$BOT_JSON" ulke)"
iddia "Googlebot: yayınlanan ülke BOŞ" "" "$(alan "$BOT_JSON" ulke_yayin)"

echo "▶ Çerez — yalnız HTML yanıtında, yalnız ülke biliniyorken"
CEREZ_TR="$(curl -sI --max-time 10 -H "X-Forwarded-For: 88.255.0.1" "http://127.0.0.1:$PORT/" | grep -ci "set-cookie: th-country=TR")"
iddia "HTML + TR IP → th-country=TR yazılıyor" "1" "$CEREZ_TR"
CEREZ_BILINMEYEN="$(curl -sI --max-time 10 -H "X-Forwarded-For: 8.8.8.8" "http://127.0.0.1:$PORT/" | grep -ci "set-cookie: th-country")"
iddia "HTML + bilinmeyen IP → çerez YOK" "0" "$CEREZ_BILINMEYEN"
CEREZ_BOT="$(curl -sI --max-time 10 -H "X-Forwarded-For: 88.255.0.1" -H "User-Agent: Googlebot/2.1" "http://127.0.0.1:$PORT/" | grep -ci "set-cookie: th-country")"
iddia "HTML + Googlebot → çerez YOK" "0" "$CEREZ_BOT"

# 304 Not Modified: nginx bu yanıtlarda `Content-Type` göndermiyor. Süzgeç
# yalnız `text/html` arasaydı çerez 304'lerde hiç yazılmazdı ve çerez ömrü
# dolduktan sonra dönen ziyaretçi ülkesiz kalırdı (ölçüldü 17 Eyl 2026).
ETAG="$(curl -sI --max-time 10 -H "X-Forwarded-For: 88.255.0.1" "http://127.0.0.1:$PORT/" | sed -n 's/^[Ee][Tt]ag: //p' | tr -d '\r')"
CEREZ_304="$(curl -sI --max-time 10 -H "X-Forwarded-For: 88.255.0.1" -H "If-None-Match: $ETAG" "http://127.0.0.1:$PORT/" | grep -ci "set-cookie: th-country=TR")"
iddia "304 yanıtında çerez TAZELENİYOR" "1" "$CEREZ_304"

VARLIK="$(find "$KOK/dist/assets" -name '*.js' 2>/dev/null | head -1 | sed "s|$KOK/dist||")"
if [[ -n "$VARLIK" ]]; then
  CEREZ_JS="$(curl -sI --max-time 10 -H "X-Forwarded-For: 88.255.0.1" "http://127.0.0.1:$PORT$VARLIK" | grep -ci "set-cookie: th-country")"
  iddia "JS dosyası (200, content-type dolu) → çerez YOK" "0" "$CEREZ_JS"
fi

echo "▶ Güvenlik başlıkları korunuyor mu (add_header miras tuzağı)"
BASLIKLAR="$(curl -sI --max-time 10 -H "X-Forwarded-For: 88.255.0.1" "http://127.0.0.1:$PORT/")"
for b in content-security-policy strict-transport-security x-frame-options x-content-type-options referrer-policy permissions-policy; do
  iddia "HTML yanıtında $b var" "1" "$(printf '%s' "$BASLIKLAR" | grep -ci "^$b:")"
done

echo "▶ Sahte XFF reddi — güvenilmeyen kaynaktan gelen başlık"
# Docker ağı özel aralıkta olduğu için buradaki istek GÜVENİLİR sayılır; bu
# testin ölçtüğü şey zincirin çalıştığı, reddin kendisi değil. Gerçek red
# ancak genel bir kaynak adresten sınanabilir (PROD'da teşhis ucuyla).
GORULEN="$(alan "$(istek 88.255.0.1)" gorulen_ip)"
iddia "real_ip zinciri çalışıyor (gorulen_ip = XFF)" "88.255.0.1" "$GORULEN"

echo
if [[ "$DUSTU" -eq 0 ]]; then
  printf '\033[0;32m== TÜMÜ GEÇTİ (%d) ==\033[0m\n' "$GECTI"
  exit 0
fi
printf '\033[0;31m== %d DÜŞTÜ, %d geçti ==\033[0m\n' "$DUSTU" "$GECTI"
exit 1
