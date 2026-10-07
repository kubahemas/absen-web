#!/bin/bash
# Gambar dampingan layar Fitur B (jadwal, pola, tukar shift) dengan DATA dari server tiruan (tools/uji_alur_jadwal.js).
# Pakai: bash tools/potret_fitur_b.sh 02 55 56 57 42 43 52
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual
sed -n '1,/^async function masukPribadi/p' tools/uji_alur_jadwal.js | sed '$d' > "$TEMP/fb_mock_isi.js"
bangun() { # $1 = konteks, $2 = berkas potongan alur, $3 = nama
  { echo "window.__KONTEKS='$1';"; cat "$TEMP/fb_mock_isi.js"; cat <<'JS'
async function masukPribadi(nama) {
  el('btnJenisPribadi').click(); await tunggu(100);
  el('pribNama').value = nama; el('pribRahasia').value = K === 'admin' ? 'rahasia12' : '12345'; el('btnMasukPribadi').click(); await tunggu(800);
}
async function dariMenuAdmin(nama) {
  el('btnMenuPribadi').click(); await tunggu(150);
  Array.prototype.filter.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0].click(); await tunggu(700);
}
JS
  echo "window.__hasil = undefined; delete window.__hasil; (async function () { try {"; cat "$2"; echo "} catch (e) { document.title = 'GALAT ' + e.message; } })();"; } > "$TEMP/fb_$3.js"
}
for n in "$@"; do
  PRA=""; K=admin; FILE="$TEMP/fb_alur_$n.txt"
  case "$n" in
    02) K=toko; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
await tunggu(300); document.querySelector('.label-shift').click(); await tunggu(800);
JS
    ;;
    55) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Jadwal shift'); await tunggu(500);
document.querySelector('#lb55 [data-sel="K003|2026-10-08"]').click(); await tunggu(200);
JS
    ;;
    56) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Jadwal shift'); await tunggu(400); f('lb55', 'tukar').click(); await tunggu(900);
ubah(f('lb56', 'k1'), 'K004'); ubah(f('lb56', 'k2'), 'K005'); await tunggu(300);
JS
    ;;
    57) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari');
var pb = document.createElement('button'); pb.setAttribute('data-lb-ke', 'lb57'); pb.setAttribute('data-pola-id', 'K003'); document.body.appendChild(pb); pb.click(); await tunggu(1000);
JS
    ;;
    42) K=karyawan; cat > "$FILE" <<JS
tukarMasukMock = [];
await masukPribadi('Budi Santoso'); el('btnPribTukar').click(); await tunggu(900);
ubah(f('lb42', 'tanggal'), '2026-10-13'); await tunggu(400); ubah(f('lb42', 'rekan'), 'K005'); await tunggu(700);
f('lb42', 'alasan').value = 'Antar ibu ke dokter pagi';
JS
    ;;
    43) K=karyawan; cat > "$FILE" <<JS
await masukPribadi('Budi Santoso'); await tunggu(500);
JS
    ;;
    52) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); el('btnPribMenuAdmin').click(); await tunggu(800);
JS
    ;;
  esac
  bangun "$K" "$FILE" "$n"
  PRA="$PRA" ID="" bash tools/potret.sh app "" "$V/${n}_app.png" "$TEMP/fb_$n.js" > /dev/null
  [ -f "$V/${n}_mockup.png" ] || { f=$(ls docs/mockup/layar | grep "^$n - " | head -1); bash tools/potret.sh mockup "$f" "$V/${n}_mockup.png" > /dev/null; }
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/berdampingan.ps1 "$V/${n}_mockup.png" "$V/${n}_app.png" "$V/${n}_dampingan.png"
done
echo selesai
