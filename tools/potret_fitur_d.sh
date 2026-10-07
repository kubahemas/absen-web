#!/bin/bash
# Gambar dampingan layar Tahap 2 (laporan, label, dashboard) dengan DATA dari server tiruan (tools/uji_alur_laporan.js). Kiri mockup, kanan app.
# Pakai: bash tools/potret_fitur_d.sh 36 36e 37 38 39 40 68 69 70 81 82
AKAR="$(cd "$(dirname "$0")/.." && pwd)"; cd "$AKAR"
V=docs/audit/visual
sed -n '1,/^async function masukPribadi/p' tools/uji_alur_laporan.js | sed '$d' > "$TEMP/fd2_mock.js"
sed -n '/^async function masukPribadi/,/^(async function/p' tools/uji_alur_laporan.js | sed '$d' > "$TEMP/fd2_fn.js"
mk() { { echo "window.__KONTEKS='$1';"; cat "$TEMP/fd2_mock.js" "$TEMP/fd2_fn.js"; echo "window.__hasil = []; (async function () { try { await tunggu(300);"; echo "$2"; echo "} catch (e) { document.title = 'GALAT ' + e.message; } })();"; } > "$TEMP/fd2_$3.js"; }
for n in "$@"; do
  PRA=""; K=pribadi
  case "$n" in
    36)  A="window.__LABEL='NONE'; await masukPribadi('Budi Santoso'); el('btnPribReport').click(); await tunggu(700);" ;;
    36e) A="window.__LABEL='EXCELLENT'; window.__TREN=false; await masukPribadi('Budi Santoso'); el('btnPribReport').click(); await tunggu(700);" ;;
    37)  A="window.__LABEL='GOOD'; await masukPribadi('Budi Santoso'); el('btnPribReport').click(); await tunggu(700);" ;;
    38)  A="window.__LABEL='BAD'; await masukPribadi('Budi Santoso'); el('btnPribReport').click(); await tunggu(700);" ;;
    39)  A="window.__LABEL='GOOD'; await masukPribadi('Budi Santoso'); el('btnPribReport').click(); await tunggu(700); f('lb37','r_lembur').lastElementChild.click(); await tunggu(400);" ;;
    40)  A="window.__LABEL='GOOD'; await masukPribadi('Budi Santoso'); el('btnPribReport').click(); await tunggu(700); f('lb37','r_telat').lastElementChild.click(); await tunggu(400);" ;;
    68)  K=admin; A="await masukPribadi('Dewi Lestari'); await dariMenu('btnMenuPribadi','Dashboard bulanan'); await tunggu(400);" ;;
    69)  K=admin; A="await masukPribadi('Dewi Lestari'); await dariMenu('btnMenuPribadi','Dashboard bulanan'); el('lb68').querySelectorAll('[role=\"tablist\"] button')[1].click(); await tunggu(500);" ;;
    70)  K=admin; A="await masukPribadi('Dewi Lestari'); await dariMenu('btnMenuPribadi','Dashboard bulanan'); el('lb68').querySelectorAll('[role=\"tablist\"] button')[1].click(); await tunggu(400); f('lb69','tbody').rows[0].click(); await tunggu(700);" ;;
    81)  K=owner; PRA="$(cat tools/pra_owner.js)"; A="el('btnJenisOwner').click(); el('ownUsername').value='owner'; el('ownPassword').value='rahasia123'; el('btnMasukOwner').click(); await tunggu(1200); await dariMenu('btnMenuOwner','Laporan bulanan'); await tunggu(400);" ;;
    82)  K=owner; PRA="$(cat tools/pra_owner.js)"; A="el('btnJenisOwner').click(); el('ownUsername').value='owner'; el('ownPassword').value='rahasia123'; el('btnMasukOwner').click(); await tunggu(1200); await dariMenu('btnMenuOwner','Laporan bulanan'); el('lb81').querySelectorAll('[role=\"tablist\"] button')[1].click(); await tunggu(500);" ;;
    31)  A="window.__LABEL='GOOD'; await masukPribadi('Budi Santoso'); await tunggu(700);" ;;
  esac
  mk "$K" "$A" "$n"
  BUDGET=9000 PRA="$PRA" ID="" bash tools/potret.sh app "" "$V/${n}_app.png" "$TEMP/fd2_$n.js" > /dev/null
  nm=$n; [ "$n" = 36e ] && nm=36; f=$(ls docs/mockup/layar | grep "^$nm - " | head -1); [ -f "$V/${n}_mockup.png" ] || bash tools/potret.sh mockup "$f" "$V/${n}_mockup.png" > /dev/null
  powershell -NoProfile -ExecutionPolicy Bypass -File tools/berdampingan.ps1 "$V/${n}_mockup.png" "$V/${n}_app.png" "$V/${n}_dampingan.png"
done
echo selesai
