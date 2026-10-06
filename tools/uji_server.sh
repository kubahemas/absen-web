#!/bin/bash
# Menjalankan tes fungsi murni baru dari tesServer() di Edge (tanpa Apps Script, tanpa menyentuh sheet). Hasil = pita hijau di gambar.
# Pakai: tools/uji_server.sh <keluaran.png>
AKAR="$(cd "$(dirname "$0")/.." && pwd)"
F="${TEMP:-/tmp}/fx_uji_server.js"
{
  echo "window.__hasil=[];var H=window.__hasil;var nGagal=0;var nOk=0;"
  perl "$AKAR/tools/ekstrak_fungsi.pl" "$AKAR/apps-script/api.gs" validasiAbsenLuar validasiKeteranganLuar susunKetLuar uraiKetLuar akurasiBuruk akurasiDariGps BATAS_AKURASI_TANDAI_M dalamRadiusToko titikDariGps jarakMeter rakitItemKonfirmasi kelompokItem urlMaps bolehMemutuskanKonfirmasi saringItemKonfirmasi jamTidakMelewati ketSetelahEdit gabungKet rencanaEditAbsen tentukanStatusMasuk tentukanStatusPulang lemburBolehDariJam jamKeDetik detikKeJam TEKS_TANPA_FOTO bagianTanggal hariKeIndeks geserTanggal selisihHari nomorShift shiftMenurutPola jadwalKaryawanHari hitungBerandaHariIni cabangUntukBeranda HARI_PENDEK HARI_PANJANG validasiAlasanEdit
  cat <<'JS'
function ujiBebas(nama, lulus) { if (lulus) { nOk++; } else { nGagal++; H.push('GAGAL  ' + nama.slice(0, 110)); } }
var s1 = { masuk: '07:45', tutup: '16:00', pulang: '16:30', toleransi: 5 };
var siang = { masuk: '13:45', tutup: '21:30', pulang: '22:00', toleransi: 5 };
var detik = function (jam) { var p = jam.split(':'); return Number(p[0]) * 3600 + Number(p[1]) * 60 + (p[2] ? Number(p[2]) : 0); };
var epoch = function (jam) { return Date.UTC(2026, 9, 5) - 7 * 3600000 + detik(jam) * 1000; };
var gpsOk = { lat: -7.404412, lng: 111.446212, akurasi: 18.4 };
JS
  # definisi bersama dari tesServer (dasarAbs sampai itemKonf) lalu blok tes baru
  sed -n "/^  const dasarAbs = /,/^  const itemKonf = /p" "$AKAR/apps-script/api.gs"
  sed -n "/^  \/\/ ---- Paket perbaikan: absen luar ketik bebas/,/^  \/\/ ---- Daftar HP toko (owner)/p" "$AKAR/apps-script/api.gs" | sed '$d'
  echo "H.unshift('Tes baru: ' + nOk + ' lulus, ' + nGagal + ' GAGAL');"
} > "$F"
ID="" "$AKAR/tools/potret.sh" app "" "$1" "$F"
