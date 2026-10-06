# Menyisipkan semua tools/layar_baru/NN.html ke index.html di antara penanda LAYAR-BARU (membuat penanda bila belum ada).
use strict; use utf8; local $/;
open my $i,'<:utf8','index.html' or die; my $t=<$i>; close $i;
my @blok;
for my $f (sort glob("tools/layar_baru/*.html")) { open my $h,'<:utf8',$f or die; my $b=<$h>; close $h; $b =~ s/^\s+|\s+$//g; push @blok,$b if length $b; }
my $isi = "  <!-- LAYAR-BARU-MULAI: dibuat otomatis oleh tools/bangun_layar_baru.sh dan tools/sisip_layar_baru.pl (jangan diedit tangan; ubah tools/layar_baru_cfg.js lalu bangun ulang) -->\n" . join("\n", @blok) . "\n  <!-- LAYAR-BARU-SELESAI -->\n";
if ($t =~ /  <!-- LAYAR-BARU-MULAI.*?<!-- LAYAR-BARU-SELESAI -->\n/s) { $t =~ s/  <!-- LAYAR-BARU-MULAI.*?<!-- LAYAR-BARU-SELESAI -->\n/$isi/s; }
else { my $n = index($t,'  <div id="layarUtama" class="layar">'); die "titik sisip tidak ada" if $n<0; substr($t,$n,0)=$isi."\n"; }
open my $o,'>:utf8','index.html' or die; print $o $t; close $o;
print scalar(@blok), " blok disisipkan\n";
