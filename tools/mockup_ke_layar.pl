# Mengubah SATU berkas mockup (docs/mockup/layar/*.html) menjadi blok layar siap sisip ke index.html.
# Pakai:  perl tools/mockup_ke_layar.pl "<berkas mockup>" <idLayar> [berkas-keluaran]
# Yang dilakukan: ambil isi <body>; wadah 390x844 jadi fluid (lebar 100%, tinggi minimal satu layar);
# kode warna jadi var(--nama) dari :root index.html; ../assets/ jadi assets/; bungkus <div id="..." class="layar">.
# Yang TIDAK dilakukan (tetap ditulis tangan): id elemen untuk logika, teks contoh -> data, handler, navigasi, status nonaktif "Segera".
# Gaya tetap inline (sama seperti mockup) supaya tampilan bisa dibandingkan langsung dengan mockup.
use strict; use utf8;
binmode(STDOUT,':utf8');
my ($berkas,$id,$keluar)=@ARGV; die "Pakai: perl tools/mockup_ke_layar.pl <mockup.html> <idLayar> [keluaran]\n" unless $berkas && $id;
my %v = (
 '#141111'=>'hitam','#FFFFFF'=>'putih','#FFD62E'=>'kuning','#B91C1C'=>'merah','#1F8A4C'=>'hijau','#333438'=>'abu','#5A5B5E'=>'abu-teks',
 '#5CC98A'=>'hijau-garis','#15643A'=>'hijau-tua','#D92A22'=>'merah-tombol','#3E3F42'=>'abu-tua','#FDE8E8'=>'merah-muda','#F2EFE6'=>'krem',
 '#EEEAE0'=>'krem-gelap','#E3F4EA'=>'hijau-muda','#D9D6CC'=>'abu-garis','#FFF4C2'=>'kuning-muda','#FF7A6E'=>'merah-garis','#F5C518'=>'kuning-tua',
 '#9A9A9A'=>'abu-putus','#000000'=>'hitam-murni','#FFE680'=>'kuning-pucat','#F2F2F0'=>'abu-pucat','#E8E6E0'=>'abu-latar','#B8F0CF'=>'hijau-pucat',
 '#B8860B'=>'emas-tua','#8A6100'=>'emas-lencana','#8A8B8E'=>'abu-sedang','#5FD38A'=>'hijau-cerah','#3CC47A'=>'hijau-sedang','#1D4ED8'=>'biru-tautan','#146B39'=>'hijau-gelap',
);
local $/; open my $h,'<:utf8',$berkas or die "Tidak bisa membuka $berkas\n"; my $t=<$h>; close $h;
$t =~ s/.*?<body[^>]*>//s; $t =~ s/<\/body>.*//s; $t =~ s/<script.*?<\/script>//sg;
my @tak; my $n=0;
$t =~ s/(#[0-9A-Fa-f]{6})\b/exists $v{uc $1} ? "var(--".$v{uc $1}.")" : do { push @tak,$1; $1 }/ge;
$t =~ s/\.\.\/assets\//assets\//g;
# wadah luar: 390x844 tetap -> fluid
$t =~ s/width:\s*390px;\s*height:\s*844px;/width: 100%; min-height: 100dvh;/;
$t =~ s/(<\/?)button([^>]*)>/$1button$2>/g;
$t =~ s/^\s+|\s+$//g;
my $o = "<div id=\"$id\" class=\"layar\">\n$t\n</div>\n";
if ($keluar) { open my $w,'>:utf8',$keluar or die; print $w $o; close $w; print STDERR "Ditulis: $keluar (", length($o), " karakter)\n"; } else { print $o; }
print STDERR "Warna tidak dikenal (tetap heksa): @tak\n" if @tak;
