#!/bin/bash
# Menjalankan SEMUA tes tampilan/alur (server tiruan, tidak menulis ke sheet) dan menyimpan hasilnya sebagai gambar di docs/audit/visual (pita hijau = hasil).
# Pakai: bash tools/jalankan_semua_tes.sh   (butuh 5-8 menit; hasil: docs/audit/visual/t_*.png dan uji_*.png; penanda selesai: _semua.out)
# Lalu baca gambarnya satu per satu (pita merah / baris GAGAL = ada yang salah).
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual
S="$TEMP/tes_salinan"; mkdir -p "$S"
rm -f "$V/_semua.out"
salin() { ( echo "$2"; cat "$1" ) > "$S/$3.js"; } # salin <berkas> <baris pertama> <nama>
for k in toko pribadi pribadiadmin admin owner; do salin tools/uji_alur_layar_baru.js "window.__KONTEKS='$k';" "lbnav_$k"; done
for k in admin karyawan toko; do salin tools/uji_alur_jadwal.js "window.__KONTEKS='$k';" "jadwal_$k"; done
for k in karyawan admin toko toko2; do salin tools/uji_alur_izin.js "window.__KONTEKS='$k';" "izin_$k"; done
for k in pribadi admin owner; do salin tools/uji_alur_tarik_refresh.js "window.__KONTEKS='$k';" "tr_$k"; done
salin tools/uji_alur_foto_lingkaran.js "window.__KONTEKS='toko';" fl_toko
salin tools/uji_alur_foto_lingkaran.js "window.__KONTEKS='luar';" fl_luar
salin tools/uji_alur_konfirmasi_antrean.js "window.__MODE_OWNER=true;" ka_owner
for k in toko admin admin2 owner pribadi; do salin tools/uji_alur_koreksi.js "window.__KONTEKS='$k';" "koreksi_$k"; done
for k in pribadi admin admintoko owner; do salin tools/uji_alur_laporan.js "window.__KONTEKS='$k';" "laporan_$k"; done
( cat tools/token_contoh.js tools/uji_layar_baru_tanpa_contoh.js ) > "$S/tanpa_contoh.js"
PT="$(cat tools/pra_toko.js)"; PO="$(cat tools/pra_owner.js)"
j() { ID="" bash tools/potret.sh app "" "$@" > /dev/null; }
BUDGET=40000 j $V/uji_tombol_segera_hasil.png tools/uji_tombol_segera.js
j $V/uji_layar_baru_tanpa_contoh_hasil.png "$S/tanpa_contoh.js"
PRA="$PT" j $V/uji_alur_layar_baru_toko_hasil.png "$S/lbnav_toko.js"
BUDGET=40000 j $V/uji_alur_layar_baru_pribadi_hasil.png "$S/lbnav_pribadi.js"
BUDGET=40000 j $V/uji_alur_layar_baru_pribadiadmin_hasil.png "$S/lbnav_pribadiadmin.js"
BUDGET=40000 PRA="$PT" j $V/uji_alur_layar_baru_admin_hasil.png "$S/lbnav_admin.js"
PRA="$PO" j $V/uji_alur_layar_baru_owner_hasil.png "$S/lbnav_owner.js"
BUDGET=90000 j $V/uji_alur_izin_karyawan.png "$S/izin_karyawan.js"
BUDGET=90000 j $V/uji_alur_izin_admin.png "$S/izin_admin.js"
BUDGET=40000 PRA="$PT" j $V/uji_alur_izin_toko.png "$S/izin_toko.js"
BUDGET=40000 PRA="$PT" j $V/uji_alur_izin_toko2.png "$S/izin_toko2.js"
BUDGET=40000 PRA="$PT" j $V/uji_alur_hp_toko_hasil.png tools/uji_alur_hp_toko.js
BUDGET=40000 j $V/uji_alur_luar_terkirim_hasil.png tools/uji_alur_luar_terkirim.js
j $V/t_admin.png tools/uji_alur_admin.js
j $V/t_pribadi.png tools/uji_alur_pribadi.js
j $V/t_konf_admin.png tools/uji_alur_konfirmasi_admin.js
j $V/t_konf_owner.png tools/uji_alur_konfirmasi_owner.js
j $V/t_konf_edit.png tools/uji_alur_konfirmasi_edit.js
PRA="$PT" j $V/t_admin_toko.png tools/uji_alur_admin_toko.js
PRA="$PO" j $V/t_owner_beranda.png tools/uji_alur_owner_beranda.js
PRA="$PT" j $V/t_antrean_admin.png tools/uji_alur_konfirmasi_antrean.js
PRA="$PO" j $V/t_antrean_owner.png "$S/ka_owner.js"
j $V/t_tr_pribadi.png "$S/tr_pribadi.js"
PRA="$PT" j $V/t_tr_admin.png "$S/tr_admin.js"
PRA="$PO" j $V/t_tr_owner.png "$S/tr_owner.js"
PRA="$PT" j $V/t_fl_toko.png "$S/fl_toko.js"
j $V/t_fl_luar.png "$S/fl_luar.js"
BUDGET=90000 j $V/uji_alur_jadwal_admin.png "$S/jadwal_admin.js"
BUDGET=90000 j $V/uji_alur_jadwal_karyawan.png "$S/jadwal_karyawan.js"
BUDGET=40000 PRA="$PT" j $V/uji_alur_jadwal_toko.png "$S/jadwal_toko.js"
BUDGET=90000 PRA="$PT" j $V/uji_alur_koreksi_toko.png "$S/koreksi_toko.js"
BUDGET=90000 j $V/uji_alur_koreksi_admin.png "$S/koreksi_admin.js"
BUDGET=90000 j $V/uji_alur_koreksi_admin2.png "$S/koreksi_admin2.js"
BUDGET=90000 PRA="$PO" j $V/uji_alur_koreksi_owner.png "$S/koreksi_owner.js"
BUDGET=90000 j $V/uji_alur_koreksi_pribadi.png "$S/koreksi_pribadi.js"
BUDGET=90000 j $V/uji_alur_laporan_pribadi.png "$S/laporan_pribadi.js"
BUDGET=90000 j $V/uji_alur_laporan_admin.png "$S/laporan_admin.js"
BUDGET=90000 PRA="$PT" j $V/uji_alur_laporan_admintoko.png "$S/laporan_admintoko.js"
BUDGET=90000 PRA="$PO" j $V/uji_alur_laporan_owner.png "$S/laporan_owner.js"
bash tools/uji_server.sh $V/uji_server_hasil.png > /dev/null 2>&1
bash tools/cek_sintaks.sh $V/cek_sintaks_hasil.png > /dev/null 2>&1
echo selesai > $V/_semua.out
