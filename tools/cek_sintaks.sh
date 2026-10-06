#!/bin/bash
# Memeriksa SINTAKS apps-script/api.gs di Edge (tidak menjalankan fungsinya). Hasil = pita hijau (OK) atau pita merah (galat).
# Pakai: tools/cek_sintaks.sh <keluaran.png>
AKAR="$(cd "$(dirname "$0")/.." && pwd)"
F="${TEMP:-/tmp}/fx_sintaks.js"
{
  echo -n 'window.__hasil=[];var src="'
  perl "$AKAR/tools/js_string.pl" "$AKAR/apps-script/api.gs"
  echo '";'
  echo 'try { new Function(src); window.__hasil.push("OK  sintaks api.gs valid (" + src.length + " karakter)"); } catch (e) { window.__hasil.push("GALAT sintaks api.gs: " + e.message); }'
} > "$F"
ID="" "$AKAR/tools/potret.sh" app "" "$1" "$F"
