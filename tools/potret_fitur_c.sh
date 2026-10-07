#!/bin/bash
# Gambar dampingan layar Fitur C (peringatan HP toko, konflik, absen manual, data absensi, edit absen) dengan DATA dari server tiruan (tools/uji_alur_koreksi.js).
# Pakai: bash tools/potret_fitur_c.sh 05 06 07 13 18 19 52 53 54 64 65
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual
sed -n '1,/^async function tekan/p' tools/uji_alur_koreksi.js | sed '$d' > "$TEMP/fc_mock_isi.js"
sed -n '/^async function tekan/,/^(async function/p' tools/uji_alur_koreksi.js | sed '$d' > "$TEMP/fc_fungsi.js"
bangun() { # $1 = konteks, $2 = berkas potongan alur, $3 = nama
  { echo "window.__KONTEKS='$1';"; cat "$TEMP/fc_mock_isi.js"; cat "$TEMP/fc_fungsi.js"
    echo "window.__hasil = []; (async function () { try { await tunggu(300);"; cat "$2"; echo "} catch (e) { document.title = 'GALAT ' + e.message; } })();"; } > "$TEMP/fc_$3.js"
}
for n in "$@"; do
  PRA=""; K=admin; B=9000; FILE="$TEMP/fc_alur_$n.txt"
  toko_dobel='window.__absen = { status: "gagal", pesan: "Sudah absen masuk hari ini", dobel: true, kode_dobel: "abcdef0123456789", jenis_dobel: "MASUK", jam_lama: "07:40", jam_sekarang: "07:52", nama: "Budi Santoso", panggilan: "Budi" };'
  case "$n" in
    05) K=toko; B=5000; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
$toko_dobel
await tekan('btnMasuk'); await isiPin('K002'); await tunggu(500);
JS
    ;;
    06) K=toko; B=5000; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
window.__absen = { status: 'ok', perlu_pilih_shift: true, panggilan: 'Budi', nama: 'Budi Santoso', jam: '13:10', jadwal: { no: 1, nama: 'Shift 1', masuk: '07:45' }, usulan: { no: 2, nama: 'Shift 2', masuk: '13:45' } };
await tekan('btnMasuk'); await isiPin('K002'); await tunggu(300);
JS
    ;;
    07) K=toko; B=5000; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
window.__absen = { status: 'ok', perlu_konfirmasi_revisi: true, kode_dobel: 'fedcba9876543210', jenis_dobel: 'PULANG', jam_lama: '17:48', durasi_lama: 78, tingkat_lama: 2, jam_baru: '18:40', durasi_baru: 130, tingkat_baru: 3, nama: 'Budi Santoso', panggilan: 'Budi' };
await tekan('btnLembur'); await isiPin('K002'); await tunggu(500);
JS
    ;;
    13) K=toko; B=7500; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
window.__absen = { status: 'ok', st_masuk: 'TELAT', telat_mnt: 7, jam: '07:52', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'M-K002-261007-075200-T1', pilihan_alasan: ['Macet', 'Hujan', 'Lainnya'], batas_isi_detik: 10, kode_alasan: 'KA', belum_pulang_kemarin: { tanggal: '2026-10-05', hari: 'Senin, 5 Oktober', shift: '1' } };
await tekan('btnMasuk'); await isiPin('K002');
el('btnIsiAlasan').click(); await tunggu(300);
el('alasanGrid').querySelector('button').click(); el('btnSimpanAlasan').click(); await tunggu(500);
el('popup').click(); await tunggu(400);
JS
    ;;
    18) K=toko; B=5000; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
window.__absen = { status: 'ok', st_masuk: 'HADIR', jam: '07:40', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'M-K002-261007-074000-T1', belum_pulang_kemarin: { tanggal: '2026-10-05', hari: 'Senin, 5 Oktober', shift: '1' } };
await tekan('btnMasuk'); await isiPin('K002'); await tunggu(300);
JS
    ;;
    19) K=toko; B=5000; PRA="$(cat tools/pra_toko.js)"; cat > "$FILE" <<JS
window.__absen = { status: 'ok', st_pulang: 'PULANG NORMAL', jam: '16:31', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'P-K002-261007-163100-T1', acc: '', tingkat: 0, durasi_menit: 0, perubahan: '', belum_masuk_hari_ini: true };
await tekan('btnPulang'); await isiPin('K002'); await tunggu(300);
JS
    ;;
    52) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Konfirmasi'); await tunggu(300);
JS
    ;;
    53) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Konfirmasi');
document.querySelector('#daftarKonfirmasi [data-kel="KONFLIK"] [data-konf="konflik"]').click(); await tunggu(900);
ubah(f('lb53', 'pindah'), 'K004'); await tunggu(500);
JS
    ;;
    54) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Konfirmasi');
document.querySelector('#daftarKonfirmasi [data-kel="LUPA"] [data-konf="isijam"]').click(); await tunggu(800);
ubah(f('lb54', 'jam'), '16:31'); await tunggu(400); f('lb54', 'a0').click(); f('lb54', 'fotoTombol').click(); await tunggu(300);
JS
    ;;
    64) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Data absensi'); await tunggu(500);
JS
    ;;
    65) cat > "$FILE" <<JS
await masukPribadi('Dewi Lestari'); await dariMenuAdmin('Data absensi'); await tunggu(400);
f('lb64', 'daftar').querySelectorAll('button[data-edit]')[2].click(); await tunggu(900);
ubah(f('lb65', 'jam'), '07:44'); ubah(f('lb65', 'alasan'), 'Salah catat jam'); await tunggu(500);
JS
    ;;
  esac
  bangun "$K" "$FILE" "$n"
  BUDGET=$B PRA="$PRA" ID="" bash tools/potret.sh app "" "$V/${n}_app.png" "$TEMP/fc_$n.js" > /dev/null
  [ -f "$V/${n}_mockup.png" ] || { f=$(ls docs/mockup/layar | grep "^$n - " | head -1); bash tools/potret.sh mockup "$f" "$V/${n}_mockup.png" > /dev/null; }
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/berdampingan.ps1 "$V/${n}_mockup.png" "$V/${n}_app.png" "$V/${n}_dampingan.png"
done
echo selesai
