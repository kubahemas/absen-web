# Mencetak isi berkas sebagai isi string JavaScript (tanda kutip ganda): dipakai tools/cek_sintaks.sh.
use strict;
binmode(STDOUT, ':utf8');
local $/;
open my $h, '<:utf8', $ARGV[0] or die;
my $t = <$h>;
close $h;
my $bs = chr(92);
my $kutip = chr(34);
$t =~ s/\r//g;
$t =~ s/\Q$bs\E/$bs$bs/g;
$t =~ s/\Q$kutip\E/$bs$kutip/g;
$t =~ s/\n/${bs}n/g;
print $t;
