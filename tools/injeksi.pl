# Dipakai tools/potret.sh: menyalin index.html ke stdout dengan skrip tambahan (hanya untuk potret/uji, tidak mengubah index.html).
# - ID (env) tidak kosong: memilih layar ber-id itu (berulang, supaya tidak ditimpa logika halaman),
# - FIX (env): JS pengisi data / skrip uji, dijalankan SEKALI 1,5 detik setelah dimuat (boleh memakai return),
# - pita merah "GALAT JS" di dasar layar bila ada galat JavaScript,
# - pita hijau di atas layar berisi window.__hasil (baris-baris hasil uji) bila skrip uji mengisinya.
use strict; use utf8;
binmode(STDOUT, ':utf8');
my $id  = $ENV{ID}  // '';
my $fix = $ENV{FIX} // '';
local $/;
open my $h, '<:utf8', $ARGV[0] or die "tidak bisa membuka $ARGV[0]";
my $t = <$h>; close $h;
my $kepala = '<script>window.__g=[];window.addEventListener("error",function(e){__g.push(String(e.message)+" @"+e.lineno)});</script>';
my $pilih = $id ne '' ? 'document.querySelectorAll(".layar").forEach(function(l){l.classList.toggle("aktif",l.id==="' . $id . '");});' : '';
my $badan = '<script type="text/plain" id="__fix">' . $fix . '</script><script>(function(){' .
  'function p(){' . $pilih . '}' .
  'function f(){try{(function(){' . $fix . "\n" . '})()}catch(e){__g.push("isi: "+e.message)}}' .
  'p();setInterval(p,200);setTimeout(f,1500);' .
  'setInterval(function(){' .
    'if(window.__hasil){var r=document.getElementById("__hasil");if(!r){r=document.createElement("div");r.id="__hasil";r.style.cssText="position:fixed;left:0;right:0;top:0;z-index:99999;background:#063;color:#fff;font:10px monospace;padding:4px;white-space:pre-wrap";r.textContent=window.__hasil.join("\n");document.body.appendChild(r);}r.textContent=window.__hasil.join("\n");}' .
    'if(window.__g.length){var d=document.createElement("div");d.style.cssText="position:fixed;left:0;right:0;bottom:0;z-index:99999;background:red;color:#fff;font:11px monospace;padding:4px";d.textContent="GALAT JS: "+window.__g.join(" | ");document.body.appendChild(d);}' .
  '},300);' .
  '})();</script>';
$t =~ s/<head>/<head>$kepala/;
$t =~ s/<\/body>/$badan<\/body>/;
print $t;
