# Membuat tools/token_contoh.js: daftar teks/angka CONTOH yang ada di mockup sumber tiap layar baru (nama, jam, tanggal, angka).
# Dipakai tools/uji_layar_baru_tanpa_contoh.js untuk memastikan TIDAK ada yang muncul di layar app.
# Pakai: perl tools/buat_token_contoh.pl
use strict; use utf8; local $/;
binmode(STDOUT,':utf8');
my @nama = ('Budi Santoso','Dewi Lestari','Rina Wati','Siti Rohmah','Ahmad Fauzi','Andi Pratama','Joko Susilo','Sari Utami','Dimas Saputra','Wulan Sari','Tono Wibowo','Budi','Dewi','Rina','Siti','Ahmad','Andi','Joko','Sari','Dimas','Wulan','Tono','Ari','Dina','EMP012','Ngawi','Madiun','Samsung','Infinix','Stok opname','Antar ibu ke dokter pagi','Pernikahan di Madiun','Demam','Kendaraan bermasalah','HP toko lambat');
my $sumber = { '36' => '37' };
my @nomor = qw(02 03 04 05 06 07 08 13 18 19 22 23 24 25 34 36 39 40 41 42 43 45 53 54 55 56 57 59 62 64 65 66 67 68 69 70 73 74 75 76 77 81 82);
my %hasil;
for my $n (@nomor) {
  my $s = $sumber->{$n} // $n;
  opendir(my $dh, "docs/mockup/layar") or die; my ($f) = map { "docs/mockup/layar/$_" } grep { index($_, "$s - ") == 0 } readdir($dh); closedir($dh); die "tidak ada mockup $s" unless $f;
  open my $h,'<:utf8',$f or die; my $t=<$h>; close $h;
  $t =~ s/.*?<body[^>]*>//s; $t =~ s/<\/body>.*//s; $t =~ s/<svg.*?<\/svg>//sg; $t =~ s/<style.*?<\/style>//sg;
  $t =~ s/&lt;/</g; $t =~ s/&gt;/>/g; $t =~ s/&amp;/&/g;
  # nilai input/textarea juga contoh
  my @tok;
  while ($t =~ /value="([^"]+)"/g) { push @tok, $1; }
  while ($t =~ /<textarea[^>]*>([^<]+)</g) { push @tok, $1; }
  my @teks; while ($t =~ />([^<>]+)</g) { my $x=$1; $x =~ s/\s+/ /g; $x =~ s/^ | $//g; push @teks,$x if length $x; }
  my $semua = join(" | ", @teks, @tok);
  for my $nm (@nama) { push @tok, $nm if $semua =~ /(?<![A-Za-z])\Q$nm\E(?![A-Za-z])/; }
  for my $x (@teks, @tok) { while ($x =~ /(\d{1,2}[:.\/]\d{1,2}(?:[:.\/]\d{1,2})?|\b\d{2,}\b)/g) { push @tok, $1; } }
  my %u; my @h = grep { !$u{$_}++ } grep { length $_ >= 2 } @tok;
  $hasil{$n} = \@h;
}
open my $o,'>:utf8','tools/token_contoh.js' or die;
print $o "// DIBUAT OTOMATIS oleh tools/buat_token_contoh.pl (jangan diedit): teks/angka contoh pada mockup sumber tiap layar baru.\nvar TOKEN_CONTOH = {\n";
for my $n (sort keys %hasil) { my $j = join(", ", map { my $x=$_; $x =~ s/\\/\\\\/g; $x =~ s/'/\\'/g; "'$x'" } @{$hasil{$n}}); print $o "  '$n': [$j],\n"; }
print $o "};\n"; close $o;
print "ok: ", scalar(keys %hasil), " layar\n";
