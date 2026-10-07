#!/bin/bash
# Membangun blok layar baru: mockup -> tools/mockup_ke_layar.pl -> pembersih (di Edge tanpa kepala; hasil dikirim lewat log konsol) -> tools/layar_baru/NN.html
export MSYS_NO_PATHCONV=1
# Pakai: tools/bangun_layar_baru.sh 02 03 ...   (tanpa argumen = semua nomor di tools/layar_baru_cfg.js)
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
AKAR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$AKAR"
NOMOR="$@"
[ -z "$NOMOR" ] && NOMOR=$(grep -oE "'[0-9]{2}[a-z]?': {" tools/layar_baru_cfg.js | grep -oE "[0-9]{2}[a-z]?" | sort -u | tr '\n' ' ')
for n in $NOMOR; do
  src=$(grep -oE "'$n': '[0-9]+'" tools/layar_baru_cfg.js | head -1 | sed -E "s/.*: '([0-9]+)'/\1/"); [ -z "$src" ] && src=$n
  f=$(ls docs/mockup/layar | grep "^$src - " | head -1)
  perl tools/mockup_ke_layar.pl "docs/mockup/layar/$f" "x$n" "$TEMP/lb_$n.blok" 2>/dev/null
  H="$AKAR/__lb_$n.html"
  { echo '<!doctype html><html><head><meta charset="utf-8"></head><body>'; cat "$TEMP/lb_$n.blok"; echo '<script>'; cat tools/layar_baru_bersih.js tools/layar_baru_cfg.js;
    echo "var l = bersih('$n', CFG['$n'] || {}); var h = document.getElementById('lb$n').outerHTML; var b = btoa(unescape(encodeURIComponent(h))); console.log('LBLOG:' + l.join(';'));"
    echo "for (var i = 0; i < b.length; i += 1500) { console.log('LBCH:' + (i / 1500) + ':' + b.slice(i, i + 1500)); } console.log('LBEND');"
    echo '</script></body></html>'; } > "$H"
  URL="file:///$(cygpath -m "$H")"; URL="${URL// /%20}"
  [ -n "$LBDEBUG" ] && echo "URL=$URL"
  LG="$TEMP/lb_$n.log"; rm -f "$LG"
  "$EDGE" --headless=new --disable-gpu --screenshot="$(cygpath -w "$TEMP")\lb_$n.png" --enable-logging --v=0 --log-file="$(cygpath -w "$LG")" --user-data-dir="$(cygpath -w "${TEMP:-/tmp}")\lb-profil$n" --virtual-time-budget=3000 "$URL" > /dev/null 2>&1
  for i in $(seq 1 100); do grep -q "LBEND" "$LG" 2>/dev/null && break; sleep 0.5; done; sleep 1
  perl -MMIME::Base64 -e 'my %c; my $log=""; while (<>) { if (/"LBCH:(\d+):([A-Za-z0-9+\/=]+)"/) { $c{$1}=$2 } if (/"LBLOG:([^"]*)"/) { $log=$1 } } print STDERR "LOG[$log] "; print decode_base64(join("", map { $c{$_} } sort { $a <=> $b } keys %c));' "$LG" > "tools/layar_baru/$n.html" 2> "$TEMP/lb_$n.err"
  echo "$n: $(wc -c < tools/layar_baru/$n.html) bytes $(cat "$TEMP/lb_$n.err")"
  [ -n "$LBDEBUG" ] || rm -f "$H"
done
