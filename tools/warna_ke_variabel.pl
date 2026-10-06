# Sekali pakai (sudah dijalankan): mengganti kode warna heksa di <style> dan di atribut style="..." menjadi var(--nama).
# Atribut stroke=/fill= SVG, array warna di JavaScript, dan meta theme-color sengaja tidak diubah (var() tidak berlaku di sana).
use strict; use utf8;
my %n = (
 '#141111'=>'hitam','#FFFFFF'=>'putih','#FFD62E'=>'kuning','#B91C1C'=>'merah','#1F8A4C'=>'hijau','#333438'=>'abu',
 '#5A5B5E'=>'abu-teks','#5CC98A'=>'hijau-garis','#15643A'=>'hijau-tua','#D92A22'=>'merah-tombol','#3E3F42'=>'abu-tua',
 '#FDE8E8'=>'merah-muda','#F2EFE6'=>'krem','#EEEAE0'=>'krem-gelap','#E3F4EA'=>'hijau-muda','#D9D6CC'=>'abu-garis',
 '#FFF4C2'=>'kuning-muda','#FF7A6E'=>'merah-garis','#F5C518'=>'kuning-tua','#9A9A9A'=>'abu-putus','#000000'=>'hitam-murni',
 '#FFE680'=>'kuning-pucat','#F2F2F0'=>'abu-pucat','#E8E6E0'=>'abu-latar','#B8F0CF'=>'hijau-pucat','#B8860B'=>'emas-tua',
 '#8A8B8E'=>'abu-sedang','#5FD38A'=>'hijau-cerah','#3CC47A'=>'hijau-sedang','#1D4ED8'=>'biru-tautan','#146B39'=>'hijau-gelap',
);
local $/; open my $h,'<:utf8',$ARGV[0] or die; my $t=<$h>; close $h;
sub ganti { my $s=shift; $s=~s/(#[0-9A-Fa-f]{6})\b/exists $n{uc $1} ? "var(--".$n{uc $1}.")" : $1/ge; return $s }
$t=~s/(<style>)(.*?)(<\/style>)/$1.ganti($2).$3/gse;
$t=~s/(style="[^"]*")/ganti($1)/ge;
my $root=":root {\n".join("",map{ "  --$n{$_}: $_;\n" } sort { $n{$a} cmp $n{$b} } keys %n)."}\n";
$t=~s/<style>\n/<style>\n$root/;
open my $o,'>:utf8',$ARGV[0] or die; print $o $t; close $o;
