# Menggabungkan potret mockup (kiri) dan app (kanan) jadi satu gambar: berdampingan.ps1 <mockup.png> <app.png> <keluaran.png>
param($A,$B,$Out)
Add-Type -AssemblyName System.Drawing
$ia=[System.Drawing.Image]::FromFile((Resolve-Path $A)); $ib=[System.Drawing.Image]::FromFile((Resolve-Path $B))
$w=$ia.Width+$ib.Width+10; $h=[Math]::Max($ia.Height,$ib.Height)
$bm=New-Object System.Drawing.Bitmap $w,$h; $g=[System.Drawing.Graphics]::FromImage($bm)
$g.Clear([System.Drawing.Color]::Gray); $g.DrawImage($ia,0,0); $g.DrawImage($ib,$ia.Width+10,0)
$dir=Split-Path (Join-Path (Get-Location) $Out); $bm.Save((Join-Path (Get-Location) $Out),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bm.Dispose(); $ia.Dispose(); $ib.Dispose()
