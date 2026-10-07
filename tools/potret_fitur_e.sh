#!/bin/bash
# Gambar dampingan layar Tahap 3 (Akun saya 44, Ganti password 45) dengan DATA dari server tiruan (tools/uji_alur_akun.js). Kiri mockup, kanan app.
# Pakai: bash tools/potret_fitur_e.sh 44 45
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual
sed -n '1,/^(async function/p' tools/uji_alur_akun.js | sed '$d' > "$TEMP/fe_mock.js"
mk() { { echo "window.__KONTEKS='karyawan';"; cat "$TEMP/fe_mock.js"; echo "window.__hasil = []; (async function () { try { await tunggu(300);"; echo "el('btnJenisPribadi').click(); await tunggu(100); el('pribNama').value='Budi Santoso'; el('pribRahasia').value='12345'; el('btnMasukPribadi').click(); await tunggu(900); el('btnMenuPribadi').click(); await tunggu(150); document.querySelector('#menuPribadiIsi [data-menu=\"akun\"]').click(); await tunggu(600);"; echo "$1"; echo "} catch (e) { document.title = 'GALAT ' + e.message; } })();"; } > "$TEMP/fe_$2.js"; }
for n in "$@"; do
  case "$n" in
    44) A="" ;;
    45) A="document.querySelector('#layarAkun [data-lb-ke=\"lb45\"]').click(); await tunggu(300); isi(f('lb45','lama'),'11111'); isi(f('lb45','baru'),'55555'); isi(f('lb45','ulang'),'55555'); await tunggu(200);" ;;
  esac
  mk "$A" "$n"
  BUDGET=9000 ID="" bash tools/potret.sh app "" "$V/${n}_app.png" "$TEMP/fe_$n.js" > /dev/null
  f=$(ls docs/mockup/layar | grep "^$n - " | head -1); bash tools/potret.sh mockup "$f" "$V/${n}_mockup.png" > /dev/null
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/berdampingan.ps1 "$V/${n}_mockup.png" "$V/${n}_app.png" "$V/${n}_dampingan.png"
done
echo selesai
