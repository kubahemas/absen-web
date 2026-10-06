#!/bin/bash
# Potret layar pada lebar 390 px memakai Microsoft Edge tanpa kepala (alat bantu bukti visual, bukan bagian aplikasi).
# Edge tanpa kepala tidak mau lebih sempit dari ±500 px, jadi halaman dimuat di dalam iframe 390 px lalu hasilnya dipotong.
# Pakai:  tools/potret.sh app <idLayar> <keluaran.png> [berkas-js-pengisi-data]
#         tools/potret.sh mockup "<berkas di docs/mockup/layar>" <keluaran.png>
# Berkas JS pengisi data (opsional) dijalankan setelah layar dipilih, untuk mengisi teks contoh.
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
AKAR="$(cd "$(dirname "$0")/.." && pwd)"
MODE="$1"; ARG="$2"; OUT="$3"; ISI="$4"
export MSYS_NO_PATHCONV=1
DIRW="$(cygpath -w "$(cd "$(dirname "$OUT")" && pwd)")"
NAMA="$(basename "$OUT")"
BS='\'
OUTW="${DIRW}${BS}${NAMA}"
rm -f "$OUT"
HAR="$AKAR/__potret_h.html"
if [ "$MODE" = "mockup" ]; then
  SRC="docs/mockup/layar/$ARG"; SRC="${SRC// /%20}"
  IW=438; IH=892; CX=24; CY=24
else
  FIX=""; [ -n "$ISI" ] && FIX="$(cat "$ISI")"
  ID="$ARG" FIX="$FIX" perl "$AKAR/tools/injeksi.pl" "$AKAR/index.html" > "$AKAR/__potret.html"
  SRC="__potret.html"
  IW=390; IH=844; CX=0; CY=0
fi
echo "<!doctype html><body style='margin:0;background:#888'><iframe src='$SRC' style='border:0;width:${IW}px;height:${IH}px'></iframe></body>" > "$HAR"
URL="file:///$(cygpath -m "$HAR")"; URL="${URL// /%20}"
"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=700,1000 --user-data-dir="$(cygpath -w "${TEMP:-/tmp}")\potret-profil$$" --virtual-time-budget=12000 --screenshot="$OUTW" "$URL" >/dev/null 2>&1
for i in $(seq 1 120); do [ -f "$OUT" ] && break; sleep 0.5; done
sleep 1
rm -f "$HAR" "$AKAR/__potret.html"
if [ -f "$OUT" ]; then
  W=$([ "$MODE" = "mockup" ] && echo 390 || echo 390)
  powershell -NoProfile -ExecutionPolicy Bypass -File "$(cygpath -w "$AKAR/tools/potong.ps1")" "$OUTW" $CX $CY $W 844 && echo "OK $OUT" || echo "GAGAL-POTONG $OUT"
else echo "GAGAL $OUT"; fi
