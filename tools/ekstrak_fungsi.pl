# Mengambil fungsi tingkat atas (dan variabel var NAMA = ...;) dari apps-script/api.gs menurut nama, untuk diuji di Edge tanpa Apps Script.
# Pakai: perl tools/ekstrak_fungsi.pl apps-script/api.gs nama1 nama2 ...
use strict; use utf8; binmode(STDOUT, ':utf8');
my ($berkas, @nama) = @ARGV;
open my $h, '<:utf8', $berkas or die; local $/; my $t = <$h>; close $h;
for my $n (@nama) {
  if ($t =~ /^(function \Q$n\E\(.*?\n\}\n)/ms) { print $1, "\n"; }
  elsif ($t =~ /^((?:var|const) \Q$n\E = [^\n]*\n)/m) { print $1, "\n"; }
  else { die "tidak ketemu: $n\n"; }
}
