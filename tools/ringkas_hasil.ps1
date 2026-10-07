# Menumpuk baris ringkasan "[N OK, M GAGAL]" (bagian paling atas) dari semua gambar hasil tes jadi satu gambar: ringkas_hasil.ps1 <keluaran.png>
param($Out)
Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Get-Location) 'docs/audit/visual'
$files = Get-ChildItem $dir -Filter '*.png' | Where-Object { $_.Name -match '^(t_|uji_)' -and $_.Name -notmatch 'uji_server_hasil|cek_sintaks' } | Sort-Object Name
$sh = 20; $w = 390
$bm = New-Object System.Drawing.Bitmap ($w * 2), ([Math]::Ceiling($files.Count / 2.0) * ($sh + 14))
$g = [System.Drawing.Graphics]::FromImage($bm); $g.Clear([System.Drawing.Color]::White)
$f = New-Object System.Drawing.Font('Consolas', 8)
$i = 0
foreach ($x in $files) {
  $img = [System.Drawing.Image]::FromFile($x.FullName)
  $col = $i % 2; $row = [Math]::Floor($i / 2)
  $g.DrawString($x.Name, $f, [System.Drawing.Brushes]::Black, $col * $w, $row * ($sh + 14))
  $g.DrawImage($img, [System.Drawing.Rectangle]::new($col * $w, $row * ($sh + 14) + 12, $w, $sh), [System.Drawing.Rectangle]::new(0, 0, $w, $sh), [System.Drawing.GraphicsUnit]::Pixel)
  $img.Dispose(); $i++
}
$bm.Save((Join-Path (Get-Location) $Out), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bm.Dispose()
