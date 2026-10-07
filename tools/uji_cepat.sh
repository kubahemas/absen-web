#!/bin/bash
# Menjalankan hanya tes satu fitur + cek sintaks, menampilkan ringkasan "[N OK, M GAGAL]".
# Pakai: bash tools/uji_cepat.sh <izin|jadwal|koreksi|laporan|akun|foto|konfirmasi|toko|server>
# Hasil tiap tes = gambar di docs/audit/visual; OK/GAGAL ditentukan dari warna pita atas (hijau = OK). Baris GAGAL di dalam pita hijau
# tidak terbaca di sini: untuk itu buka gambar uji_server_hasil.png / yang bersangkutan.
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual; S="${TEMP:-/tmp}/uji_cepat"; mkdir -p "$S"
F="${1:-}"; [ -z "$F" ] && { echo "Pakai: tools/uji_cepat.sh <izin|jadwal|koreksi|laporan|akun|foto|konfirmasi|toko|server>"; exit 1; }
PT="$(cat tools/pra_toko.js)"; PO="$(cat tools/pra_owner.js)"
j() { ID="" bash tools/potret.sh app "" "$@" > /dev/null; }
salin() { ( echo "window.__KONTEKS='$2';"; cat "$1" ) > "$S/$3.js"; }
H=()  # daftar gambar hasil
t() { H+=("$1"); }
case "$F" in
 izin) for k in karyawan admin toko toko2; do salin tools/uji_alur_izin.js $k izin_$k; PRA=$([[ $k == toko* ]] && echo "$PT") BUDGET=90000 j $V/uji_alur_izin_$k.png "$S/izin_$k.js"; t $V/uji_alur_izin_$k.png; done;;
 jadwal) for k in admin karyawan toko; do salin tools/uji_alur_jadwal.js $k jadwal_$k; PRA=$([[ $k == toko ]] && echo "$PT") BUDGET=90000 j $V/uji_alur_jadwal_$k.png "$S/jadwal_$k.js"; t $V/uji_alur_jadwal_$k.png; done;;
 koreksi) for k in toko admin admin2 owner pribadi; do salin tools/uji_alur_koreksi.js $k koreksi_$k; P=""; [ $k = toko ] && P="$PT"; [ $k = owner ] && P="$PO"; PRA="$P" BUDGET=90000 j $V/uji_alur_koreksi_$k.png "$S/koreksi_$k.js"; t $V/uji_alur_koreksi_$k.png; done;;
 laporan) for k in pribadi admin admintoko owner; do salin tools/uji_alur_laporan.js $k laporan_$k; P=""; [ $k = admintoko ] && P="$PT"; [ $k = owner ] && P="$PO"; PRA="$P" BUDGET=90000 j $V/uji_alur_laporan_$k.png "$S/laporan_$k.js"; t $V/uji_alur_laporan_$k.png; done;;
 akun) for k in karyawan admin terkunci; do salin tools/uji_alur_akun.js $k akun_$k; BUDGET=90000 j $V/uji_alur_akun_$k.png "$S/akun_$k.js"; t $V/uji_alur_akun_$k.png; done;;
 foto) salin tools/uji_alur_foto_lingkaran.js toko fl_toko; salin tools/uji_alur_foto_lingkaran.js luar fl_luar
   PRA="$PT" j $V/t_fl_toko.png "$S/fl_toko.js"; t $V/t_fl_toko.png; j $V/t_fl_luar.png "$S/fl_luar.js"; t $V/t_fl_luar.png;;
 konfirmasi) j $V/t_konf_admin.png tools/uji_alur_konfirmasi_admin.js; t $V/t_konf_admin.png
   j $V/t_konf_owner.png tools/uji_alur_konfirmasi_owner.js; t $V/t_konf_owner.png
   j $V/t_konf_edit.png tools/uji_alur_konfirmasi_edit.js; t $V/t_konf_edit.png;;
 toko) BUDGET=40000 PRA="$PT" j $V/uji_alur_hp_toko_hasil.png tools/uji_alur_hp_toko.js; t $V/uji_alur_hp_toko_hasil.png;;
 server) ;;
 *) echo "Fitur tidak dikenal: $F"; exit 1;;
esac
bash tools/uji_server.sh $V/uji_server_hasil.png > /dev/null 2>&1; t $V/uji_server_hasil.png
bash tools/cek_sintaks.sh $V/cek_sintaks_hasil.png > /dev/null 2>&1; t $V/cek_sintaks_hasil.png
# Pita atas gambar: hijau = OK. Dibaca lewat PowerShell (piksel sudut kiri atas).
LIST=""; for g in "${H[@]}"; do LIST="$LIST;$(cygpath -w "$AKAR/$g")"; done
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; \$ok=0;\$gg=0; foreach(\$p in '$LIST'.Split(';') | ?{\$_}){ if(Test-Path \$p){ \$b=New-Object System.Drawing.Bitmap \$p; \$c=\$b.GetPixel(3,3); \$b.Dispose(); if(\$c.G -gt \$c.R -and \$c.G -gt 100){\$ok++}else{\$gg++} } else {\$gg++} }; Write-Output ('[' + \$ok + ' OK, ' + \$gg + ' GAGAL]')"
