#!/bin/bash
# Gambar dampingan layar Fitur A (izin/cuti, kalender, kartu tidak masuk) dengan DATA dari server tiruan (tools/uji_alur_izin.js).
# Pakai: bash tools/potret_fitur_a.sh 41 23 22 66 67 01 31 52
# Tiap nama = satu layar: potret app (setelah alur dijalankan), potret mockup (kalau belum ada), lalu berdampingan -> docs/audit/visual/NN_dampingan.png
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual
MOCK="$TEMP/fa_mock.js"
sed -n '1,/^async function masukPribadi/p' tools/uji_alur_izin.js | sed '$d' > "$TEMP/fa_mock_isi.js"
JPG='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
bangun() { # $1 = konteks, $2 = berkas potongan alur
  { echo "window.__KONTEKS='$1';"; cat "$TEMP/fa_mock_isi.js"; cat <<'JS'
async function masukPribadi(nama) {
  el('btnJenisPribadi').click(); await tunggu(100);
  el('pribNama').value = nama; el('pribRahasia').value = K === 'admin' ? 'rahasia12' : '12345'; el('btnMasukPribadi').click(); await tunggu(700);
}
async function dariMenuAdmin(nama) {
  el('btnMenuPribadi').click(); await tunggu(150);
  Array.prototype.filter.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0].click(); await tunggu(600);
}
JS
  echo "window.__hasil = undefined; delete window.__hasil; (async function () { try {"; cat "$2"; echo "} catch (e) { document.title = 'GALAT ' + e.message; } })();"; } > "$TEMP/fa_$1_$3.js"
}
for n in "$@"; do
  PRA=""; K=karyawan; FILE="$TEMP/fa_alur_$n.txt"; MOCKUP=$n
  case "$n" in
    41) cat > "$FILE" <<JS
await masukPribadi('Budi Santoso'); el('btnPribIzin').click(); await tunggu(700);
ubah(f('lb23', 'jenis'), 'Menikah'); await tunggu(400);
ubah(document.getElementById('lb41_mulai'), '2026-10-12'); ubah(document.getElementById('lb41_selesai'), '2026-10-16'); await tunggu(800);
document.getElementById('lb41_ket').value = 'Pernikahan';
JS
    ;;
    23) cat > "$FILE" <<JS
await masukPribadi('Budi Santoso'); el('btnPribIzin').click(); await tunggu(700);
window.__pilihFotoUji = '$JPG'; f('lb23', 'ganti').click(); await tunggu(400);
JS
    ;;
    22) K=admin; cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); el('btnPribMenuAdmin').click(); await tunggu(700);
el('konfChips').querySelector('button[data-kel="IZIN"]').click(); await tunggu(200);
window.__fotoSurat = '$JPG';
el('daftarKonfirmasi').querySelectorAll('.kartu-konf')[0].querySelector('.acc').click(); await tunggu(800);
JS
    ;;
    66) K=admin; cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Input izin'); await tunggu(500);
ubah(document.getElementById('lb66_ik'), 'K002'); await tunggu(700);
JS
    ;;
    67) K=admin; cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Kalender libur'); await tunggu(700);
JS
    ;;
    01) K=toko2; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
el('btnMasuk').click(); await tunggu(2200); document.querySelector('#lb08 [data-lb-kembali="utama"]').click(); await tunggu(900);
JS
    ;;
    31) cat > "$FILE" <<JS
await masukPribadi('Budi Santoso'); await tunggu(500);
JS
    ;;
    52) K=admin; cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); el('btnPribMenuAdmin').click(); await tunggu(700);
el('konfChips').querySelector('button[data-kel="IZIN"]').click(); await tunggu(300);
JS
    ;;
  esac
  [ "$n" = "22" ] && sed -i "s#data:image/jpeg;base64,[A-Za-z0-9+/=]*#$JPG#" "$FILE"
  bangun "$K" "$FILE" "$n"
  JS="$TEMP/fa_${K}_$n.js"
  # foto surat 1x1 piksel terlalu kecil untuk dilihat: pakai kotak abu sebagai isi foto di layar 22 (hanya untuk bukti visual)
  PRA="$PRA" ID="" bash tools/potret.sh app "" "$V/${n}_app.png" "$JS" > /dev/null
  [ -f "$V/${n}_mockup.png" ] || { f=$(ls docs/mockup/layar | grep "^$MOCKUP - " | head -1); bash tools/potret.sh mockup "$f" "$V/${n}_mockup.png" > /dev/null; }
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/berdampingan.ps1 "$V/${n}_mockup.png" "$V/${n}_app.png" "$V/${n}_dampingan.png"
done
echo selesai
