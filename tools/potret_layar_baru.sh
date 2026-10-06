#!/bin/bash
# Memotret layar baru (app) dan mockupnya lalu menggabungkan berdampingan: tools/potret_layar_baru.sh 02 03 ...
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
for n in "$@"; do
  src=$n; [ "$n" = "36" ] && src=37
  f=$(ls docs/mockup/layar | grep "^$src - " | head -1)
  ID="lb$n" bash tools/potret.sh app "lb$n" "docs/audit/visual/${n}_app.png" >/dev/null
  bash tools/potret.sh mockup "$f" "docs/audit/visual/${n}_mockup.png" >/dev/null
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/berdampingan.ps1 "docs/audit/visual/${n}_mockup.png" "docs/audit/visual/${n}_app.png" "docs/audit/visual/${n}_dampingan.png"
done
echo selesai
