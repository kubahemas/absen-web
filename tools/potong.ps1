# Memotong PNG: potong.ps1 <berkas> <x> <y> <lebar> <tinggi>  (menimpa berkas yang sama)
param($Berkas, $X, $Y, $L, $T)
Add-Type -AssemblyName System.Drawing
$bytes = [System.IO.File]::ReadAllBytes($Berkas)
$ms = New-Object System.IO.MemoryStream (,$bytes)
$src = New-Object System.Drawing.Bitmap $ms
$dst = New-Object System.Drawing.Bitmap ([int]$L), ([int]$T)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, ([int]$L), ([int]$T)), (New-Object System.Drawing.Rectangle ([int]$X), ([int]$Y), ([int]$L), ([int]$T)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose(); $src.Dispose(); $ms.Dispose()
$dst.Save($Berkas, [System.Drawing.Imaging.ImageFormat]::Png)
$dst.Dispose()
