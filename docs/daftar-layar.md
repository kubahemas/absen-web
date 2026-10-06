# Daftar layar: penyelarasan app dengan mockup

Acuan tampilan satu-satunya = berkas di `docs/mockup/layar/` (82 berkas, urutan dan pengelompokan sama dengan galeri). Tulisan di `CLAUDE.md` / `keputusan-desain.md` tidak boleh menimpa tampilan mockup.
**Sesi berikutnya mulai dari berkas ini**, bukan membaca ulang semua mockup. Baca mockup hanya untuk kelompok yang sedang dikerjakan.

Arti status: **belum** = belum disalin ke `index.html` · **tersalin** = markup sudah disalin tetapi belum bisa dipakai · **tersambung** = sudah tampil dan berfungsi di app.
"Segera" = tombol/layar fiturnya belum ada: tampil seperti mockup, nonaktif, bertulisan "Segera" (tidak dihilangkan).

Urutan kerja: **1. HP Pribadi** → 2. Admin cabang → 3. Owner → 4. HP Toko. Satu kelompok sampai selesai, lalu centang, commit, push.

| Kelompok | Status |
|---|---|
| 1. HP Pribadi (29–48) | **selesai sesi ini** (lihat catatan: layar yang belum ada fiturnya) |
| 2. Admin cabang (49–70) | belum |
| 3. Owner (71–77, 78–82) | belum |
| 4. HP Toko (01–28) | belum |

Bukti visual (mockup kiri, app kanan): `docs/audit/visual/NN_dampingan.png` (dibuat dengan `tools/potret.sh` dan `tools/berdampingan.ps1`).

## 1. HP Pribadi (karyawan)

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 29 | 8. HP Pribadi - Login | tersambung | Persis mockup: satu kolom Password (PIN karyawan atau kata sandi admin; server `login_pribadi` yang membedakan). Keypad PIN dan tautan "Masuk sebagai admin" dihapus. Tombol kembali di layar ini tidak ada di mockup, jadi kembali lewat tombol Back HP. |
| 30 | 9a. Beranda - badge EXCELLENT | tersambung | Lencana performa disembunyikan: **menunggu data** (label belum dihitung). |
| 31 | 9b. Beranda - badge GOOD | tersambung | Sama. |
| 32 | 9c. Beranda - badge BAD | tersambung | Sama. |
| 33 | 9d. Absen luar - wajah dikenali | tersambung | Beda sengaja: tanpa chip Keperluan (satu kolom Keterangan). Baris "Wajah cocok" diganti "Pengenalan wajah · Segera". |
| 34 | 9e. Absen luar - cadangan PIN | belum | **Menunggu fitur** pengenalan wajah (layar ini hanya muncul bila wajah gagal). |
| 35 | 9f. Pop-up absen luar terkirim | belum | Pop-up dipakai bersama HP Toko: dirapikan di kelompok 4. Kotak "Bulan ini" **menunggu data** (belum ada hitungan rekap bulan). |
| 36 | 10a. Report EXCELLENT | belum | **Menunggu fitur** Report. Tombol Report di beranda tampil nonaktif "Segera". |
| 37 | 10b. Report GOOD | belum | Sama. |
| 38 | 10c. Report BAD | belum | Sama. |
| 39 | 10d. Detail lembur | belum | Sama. |
| 40 | 10e. Detail telat (tabel) | belum | Sama. |
| 41 | 11. Form izin / cuti | belum | **Menunggu fitur** izin. Tombol Izin/Cuti nonaktif "Segera". |
| 42 | 11d. Ajukan tukar shift | belum | **Menunggu fitur** tukar shift. Tombol nonaktif "Segera". |
| 43 | 11e. Rekan menyetujui tukar shift | belum | Sama. |
| 44 | 11b. Akun saya | tersambung | Dibuka dari ikon akun (menu "Akun saya"). Nama, ID, cabang terisi; Shift bawaan, HP terikat, Ganti password, Ganti PIN = "Segera". |
| 45 | 11c. Ganti password | belum | **Menunggu fitur** (belum ada aksi server). Tombol di Akun saya nonaktif "Segera". |
| 46 | 9g. Beranda - akun ber-role ADMIN | tersambung | Beda sengaja: kotak "Konfirmasi data karyawan" menggantikan kartu "Menu admin". Strip "2 pengajuan menunggu ACC" disembunyikan: **menunggu data** (fitur izin). |
| 47 | 8b. Login - akun terkunci | tersambung | Kotak merah "Akun terkunci. Hubungi admin." tampil bila server membalas `TERKUNCI`. |
| 48 | 9h. Beranda - offline | belum | **Menunggu fitur** absen offline (spanduk "1 absen belum terkirim" butuh antrean lokal yang belum ada). |

## 2. Admin cabang

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 49 | 13. Admin - Beranda | tersambung* | *dikerjakan di penyelarasan sebelumnya; diperiksa ulang di kelompok 2 (angka per cabang/shift dan aksi server baru belum ada) |
| 50 | 13b. Admin - menu | tersambung* | sama |
| 51 | 13c. Konfirmasi log out | belum | |
| 52 | 14. Admin - Konfirmasi | tersambung* | sama; Edit wajib alasan (log) belum |
| 53 | 15. Admin - Detail konflik | belum | |
| 54 | 16. Admin - Absen manual | belum | |
| 55 | 17. Admin - Jadwal shift | belum | |
| 56 | 17b. Tukar shift satu hari | belum | |
| 57 | 17c. Admin - Pola shift karyawan | belum | |
| 58 | 18. Admin - Daftar karyawan | belum | ada layar Karyawan buatan sebelumnya, belum diselaraskan |
| 59 | 18b. Pola shift karyawan | belum | |
| 60 | 19. Karyawan baru - data | belum | |
| 61 | 20. Karyawan baru - persetujuan + PIN | belum | |
| 62 | 21. Karyawan baru - daftar wajah | belum | |
| 63 | 22. Karyawan baru - selesai + akun | belum | |
| 64 | 32. Admin - Data absensi | belum | |
| 65 | 33. Admin - Edit absen | belum | |
| 66 | 34. Admin - Input izin | belum | |
| 67 | 35. Admin - Kalender libur | belum | |
| 68 | 36. Dashboard bulanan - tab Ringkasan | belum | |
| 69 | 36. Dashboard bulanan - tab Per karyawan | belum | |
| 70 | 36b. Detail karyawan | belum | |

## 3. Owner

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 71 | 23. Owner - Beranda | tersambung* | *penyelarasan sebelumnya; dropdown Cabang selalu tampil + aksi data baru belum |
| 72 | 23b. Owner - menu | tersambung* | sama |
| 73 | 24. Owner - Log per kategori | belum | |
| 74 | 25. Owner - Log detail | belum | |
| 75 | 26. Owner - Pengaturan | belum | |
| 76 | 27. Owner - Kunci periode | belum | |
| 77 | 28. Owner - Role & admin | belum | |
| 78 | 29. HP baru - pilih jenis HP | belum | ada layar buatan sebelumnya (`layarJenis`), perlu diperiksa |
| 79 | 30. Daftarkan HP toko | belum | ada layar buatan sebelumnya (`layarDaftarHp`), perlu diperiksa |
| 80 | 31. Owner - Daftar perangkat | belum | ada layar Kelola HP toko buatan sebelumnya |
| 81 | Owner - Laporan bulanan - Ringkasan | belum | |
| 82 | Owner - Laporan bulanan - Per karyawan | belum | |

## 4. HP Toko (urutan galeri 01–28; 22–28 tercampur di galeri)

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 01 | 1. HP Toko - Layar utama | tersambung* | *penyelarasan sebelumnya |
| 02 | 1c. Shift 1 aktif - jadwal hari ini | belum | |
| 03 | 2. Pindai wajah | belum | menunggu fitur wajah |
| 04 | 3. Wajah dikenali | belum | menunggu fitur wajah |
| 05 | 3b. Peringatan sudah absen (dobel) | belum | |
| 06 | 3d. Shift tidak sesuai jadwal | belum | |
| 07 | 3c. Sudah absen lembur - revisi | belum | |
| 08 | 4. Wajah tidak terbaca | belum | menunggu fitur wajah |
| 09 | 5. Pilih nama + PIN | belum | ada layar buatan sebelumnya |
| 10 | 6a. Pop-up TEPAT WAKTU | belum | |
| 11 | 6b. Pop-up TELAT | belum | |
| 12 | 6b2. Alasan telat | belum | |
| 13 | 6b3. Peringatan lanjutan | belum | |
| 14 | 6c. Pop-up PULANG | belum | |
| 15 | 6d. Pop-up PULANG AWAL | belum | |
| 16 | 6d2. Alasan pulang awal | belum | |
| 17 | 6e. Pop-up LEMBUR | belum | |
| 18 | 6f. Masuk + belum absen pulang kemarin | belum | |
| 19 | 6g. Pulang + belum absen masuk | belum | |
| 20 | 7. Lembur | belum | |
| 21 | 6h. Absen terlalu pagi | belum | |
| 22 | Admin - Cek Surat Dokter | belum | menunggu fitur izin |
| 23 | HP Pribadi - Izin Sakit dengan Surat Dokter | belum | menunggu fitur izin |
| 24 | Owner - Cabang dan Shift | belum | |
| 25 | Owner - Data Absensi | belum | |
| 26 | Owner - Ganti Password | belum | |
| 27 | Owner - Keluarkan Semua Perangkat | belum | |
| 28 | Owner - Konfirmasi Data Admin | tersambung* | *penyelarasan sebelumnya |

## Perubahan dari mockup (penyimpangan sengaja)

| Layar | Perubahan | Alasan |
|---|---|---|
| 33 Absen luar | Satu kolom Keterangan ketik bebas (minimal 5 karakter), tanpa chip Keperluan | keputusan pemilik |
| 30–32, 46 Beranda | Teks kecil "Hanya untuk absen tugas di luar toko" di bawah ABSEN PULANG | tombol absen HP pribadi hanya untuk tugas luar |
| 52 Konfirmasi | Penanda "Lokasi di dalam area toko" | keputusan pemilik |
| 52 Konfirmasi | Owner tidak meng-ACC karyawan; admin tidak meng-ACC / mengedit miliknya sendiri | keputusan pemilik |
| 52 Konfirmasi | Menu Edit (jam dan keterangan, wajib alasan minimal 5 karakter, dicatat di kolom `alasan` sheet `log`) | keputusan pemilik (bagian alasan dikerjakan di kelompok 2) |
| 46 Beranda admin HP pribadi | Kotak "Konfirmasi data karyawan" (seperti owner) menggantikan kartu "Menu admin"; menu admin lewat ikon akun | keputusan pemilik |
| Semua home | Ikon segarkan kecil (berputar dan nonaktif saat memuat) + segarkan otomatis saat aplikasi dibuka / kembali ke layar depan | keputusan pemilik |
| Ikon akun (karyawan) | Membuka menu kecil: Akun saya, Log out, Tutup menu (mockup 44 tidak punya tombol Log out) | Log out tetap perlu ada |
| iPhone/Safari | Ditunda | belum diuji |

## Menunggu data / fitur (disembunyikan atau nonaktif di app)

- Lencana performa EXCELLENT/GOOD/BAD dan kotak "Perlu evaluasi (BAD)": disembunyikan, menunggu perhitungan label.
- Strip "N pengajuan menunggu ACC" (beranda karyawan/admin): disembunyikan, menunggu fitur izin.
- Kotak "Bulan ini" di pop-up: menunggu hitungan rekap bulan.
- Bagian "HP terikat / Ganti HP? Minta admin reset ikatan HP" di Akun saya: ada di mockup tetapi **tidak ada** di server (tidak ada pengikatan akun ke HP). Perlu keputusan pemilik: hapus dari mockup atau buat fiturnya.

## Alat bantu (baru)

- `tools/berdampingan.ps1 <mockup.png> <app.png> <keluaran.png>`: gabungkan dua potret jadi satu.
- `tools/isi_beranda_pribadi.js`: pengisi potret (server tiruan + login HP pribadi → beranda).
- `tools/mockup_ke_layar.pl`: sekarang menambah `box-sizing: content-box` pada elemen non-form supaya ukuran sama dengan mockup (aplikasi memakai `border-box` global; tanpa ini blok dengan padding + tinggi tetap bergeser).
