# Daftar layar: penyelarasan app dengan mockup

Acuan tampilan satu-satunya = berkas di `docs/mockup/layar/` (82 berkas, urutan dan pengelompokan sama dengan galeri). Tulisan di `CLAUDE.md` / `keputusan-desain.md` tidak boleh menimpa tampilan mockup.
**Sesi berikutnya mulai dari berkas ini**, bukan membaca ulang semua mockup. Baca mockup hanya untuk kelompok yang sedang dikerjakan.

Arti status: **belum** = belum disalin ke `index.html` · **tersalin** = markup sudah disalin tetapi belum bisa dipakai · **tersambung** = sudah tampil dan berfungsi di app.
"Segera" = tombol/layar fiturnya belum ada: tampil seperti mockup, nonaktif, bertulisan "Segera" (tidak dihilangkan).

Urutan kerja: **1. HP Pribadi** → 2. Admin cabang → 3. Owner → 4. HP Toko. Satu kelompok sampai selesai, lalu centang, commit, push.

| Kelompok | Status |
|---|---|
| 1. HP Pribadi (29–48) | **selesai** (layar yang belum ada fiturnya = "Segera") |
| 2. Admin cabang (49–70) | **selesai** (layar yang belum ada fiturnya = "Segera", lihat tabel) |
| 3. Owner (71–82) | **selesai** untuk layar yang fiturnya ada (71, 72, 78, 79, 80); sisanya "Segera" |
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
| 44 | 11b. Akun saya | tersambung | Dibuka dari ikon akun (menu "Akun saya"). Nama, ID, cabang terisi; Shift bawaan, Ganti password, Ganti PIN = "Segera". Baris "HP terikat" dan teks "Ganti HP? Minta admin reset ikatan HP" DIHAPUS (keputusan pemilik: tidak ada ikatan akun ke HP). |
| 45 | 11c. Ganti password | belum | **Menunggu fitur** (belum ada aksi server). Tombol di Akun saya nonaktif "Segera". |
| 46 | 9g. Beranda - akun ber-role ADMIN | tersambung | Beda sengaja: kotak "Konfirmasi data karyawan" menggantikan kartu "Menu admin". Strip "2 pengajuan menunggu ACC" disembunyikan: **menunggu data** (fitur izin). |
| 47 | 8b. Login - akun terkunci | tersambung | Kotak merah "Akun terkunci. Hubungi admin." tampil bila server membalas `TERKUNCI`. |
| 48 | 9h. Beranda - offline | belum | **Menunggu fitur** absen offline (spanduk "1 absen belum terkirim" butuh antrean lokal yang belum ada). |

## 2. Admin cabang

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 49 | 13. Admin - Beranda | tersambung | Angka Hadir/Telat/Belum absen/Izin per shift dari aksi baru `beranda_hari_ini`; kartu bisa digeser (Semua shift + tiap shift), daftar "Belum absen" mengikuti kartu (bawaan: semua shift; mockup menampilkan shift 1), "Menunggu konfirmasi", ikon segarkan. "Perlu evaluasi (BAD)" disembunyikan: **menunggu data** (label performa). Izin/cuti = 0 sampai fitur izin ada. |
| 50 | 13b. Admin - menu | tersambung | Item sama seperti mockup (belum ada fitur = "Segera"). Tambahan di app: "Ubah nama HP ini" dan "Tutup menu". Angka di "Konfirmasi" polos seperti mockup. |
| 51 | 13c. Konfirmasi log out | tersambung | Ikon lingkaran hitam ditambahkan di dialog Log out (HP toko, HP pribadi, owner). |
| 52 | 14. Admin - Konfirmasi | tersambung | Judul 30 px, badge "Admin Ngawi", tanggal "Hari ini/Kemarin/Sabtu 26 Sep", label lembur "1–2 jam", link Maps hitam. Chip Izin dan Lupa absen = "Segera". Edit wajib alasan (lihat tabel perubahan). |
| 53 | 15. Admin - Detail konflik | belum | **Menunggu fitur** konflik absen |
| 54 | 16. Admin - Absen manual | belum | **Menunggu fitur**; item menu "Segera" |
| 55 | 17. Admin - Jadwal shift | belum | **Menunggu fitur**; item menu "Segera" |
| 56 | 17b. Tukar shift satu hari | belum | **Menunggu fitur** tukar shift |
| 57 | 17c. Admin - Pola shift karyawan | belum | **Menunggu fitur** (di daftar karyawan: "Pola shift · Segera") |
| 58 | 18. Admin - Daftar karyawan | tersambung | Satu daftar (aktif lalu nonaktif); ketuk baris = sheet aksi (Reset PIN, Nonaktifkan / Aktifkan kembali; Ubah data, Pola shift, Daftar wajah = "Segera"). Baris role Admin tidak tampil (server hanya mengirim karyawan). Teks bawah tanpa "password" dan "lepas ikatan HP". |
| 59 | 18b. Pola shift karyawan | belum | **Menunggu fitur** |
| 60 | 19. Karyawan baru - data | tersambung | Langkah 1 dari 4. Tanpa "Nama tersedia." (belum ada pemeriksaan nama di server) dan tanpa "Jatah cuti" di kotak info. |
| 61 | 20. Karyawan baru - persetujuan + PIN | tersambung | Langkah 2 dari 4. "Saya setuju" = "Segera". PIN **5 digit** (aturan server), bukan 4. Tombol ⌫ ditambahkan di sel kosong keypad. Layar sama dipakai Reset PIN (tanpa bilah langkah dan persetujuan). |
| 62 | 21. Karyawan baru - daftar wajah | belum | **Menunggu fitur** pengenalan wajah (langkah 3 dilewati) |
| 63 | 22. Karyawan baru - selesai + akun | tersambung | Langkah 4 dari 4. Uji coba wajah dan "Kirim akun via WA" = "Segera". Kotak akun: Username + "Login: PIN 5 angka" (tidak ada password awal 123456 / PIN awal 1234). |
| 64 | 32. Admin - Data absensi | belum | **Menunggu fitur**; item menu "Segera" |
| 65 | 33. Admin - Edit absen | belum | **Menunggu fitur** |
| 66 | 34. Admin - Input izin | belum | **Menunggu fitur** izin |
| 67 | 35. Admin - Kalender libur | belum | **Menunggu fitur** |
| 68 | 36. Dashboard bulanan - tab Ringkasan | belum | **Menunggu fitur** (butuh rekap bulanan + label) |
| 69 | 36. Dashboard bulanan - tab Per karyawan | belum | sama |
| 70 | 36b. Detail karyawan | belum | sama |

## 3. Owner

Selisih per layar (siapa yang memutuskan, gambar berdampingan): lihat `docs/daftar-selisih.md`.

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 71 | 23. Owner - Beranda | tersambung | Dropdown Cabang selalu tampil; satu kartu + dropdown Shift; Belum absen; Perlu evaluasi nonaktif; Telat 7 hari dari data nyata |
| 72 | 23b. Owner - menu | tersambung | Urutan dan isi menu = mockup; item tanpa fitur "Segera" |
| 73 | 24. Owner - Log per kategori | belum | **Menunggu fitur** |
| 74 | 25. Owner - Log detail | belum | **Menunggu fitur** |
| 75 | 26. Owner - Pengaturan | belum | **Menunggu fitur** |
| 76 | 27. Owner - Kunci periode | belum | **Menunggu fitur** |
| 77 | 28. Owner - Role & admin | belum | **Menunggu fitur** |
| 78 | 29. HP baru - pilih jenis HP | tersambung | Tombol "Masuk sebagai Owner" dipertahankan (TANYA) |
| 79 | 30. Daftarkan HP toko | tersambung | Cabang/ID/Kode = "Segera" |
| 80 | 31. Owner - Daftar perangkat | tersambung | Filter cabang, saklar nonaktif, Ubah nama dipertahankan (TANYA) |
| 81 | Owner - Laporan bulanan - Ringkasan | belum | **Menunggu fitur** |
| 82 | Owner - Laporan bulanan - Per karyawan | belum | **Menunggu fitur** |

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
| 52 Konfirmasi | Menu Edit (jam dan keterangan, wajib alasan minimal 5 karakter, dicatat di kolom `alasan` sheet `log`) | keputusan pemilik; server `konfirmasi_edit` menolak bila alasan kosong/kurang dari 5 karakter |
| 44 Akun saya | Baris "HP terikat" dan teks "Ganti HP? Minta admin reset ikatan HP" dihapus | keputusan pemilik: satu akun boleh banyak HP, tidak ada ikatan |
| 49 Beranda admin | Daftar "Belum absen" awalnya memuat semua shift (mockup: shift 1) dan berganti mengikuti kartu yang digeser | kartu pertama "Semua shift" |
| 50 Menu admin HP toko | Tambahan "Ubah nama HP ini" dan "Tutup menu" | fitur nyata yang tidak punya tempat di mockup |
| 52 Konfirmasi | Label lembur tetap memuat durasi tepat ("1 jam 15 menit") di baris detail; chip "Pulang cepat" ada | server memakai kelompok ini |
| 58 Daftar karyawan | Baris role Admin tidak tampil; ketuk baris membuka sheet aksi | server hanya mengirim karyawan |
| 61 PIN | 5 digit, bukan 4; tombol ⌫ | aturan server |
| 63 Selesai | Tanpa "Password awal 123456 / PIN awal 1234" | tidak ada password/PIN awal |
| 46 Beranda admin HP pribadi | Kotak "Konfirmasi data karyawan" (seperti owner) menggantikan kartu "Menu admin"; menu admin lewat ikon akun | keputusan pemilik |
| Semua home | Ikon segarkan kecil (berputar dan nonaktif saat memuat) + segarkan otomatis saat aplikasi dibuka / kembali ke layar depan | keputusan pemilik |
| Ikon akun (karyawan) | Membuka menu kecil: Akun saya, Log out, Tutup menu (mockup 44 tidak punya tombol Log out) | Log out tetap perlu ada |
| iPhone/Safari | Ditunda | belum diuji |

## Menunggu data / fitur (disembunyikan atau nonaktif di app)

- Lencana performa EXCELLENT/GOOD/BAD dan kotak "Perlu evaluasi (BAD)": disembunyikan, menunggu perhitungan label.
- Strip "N pengajuan menunggu ACC" (beranda karyawan/admin): disembunyikan, menunggu fitur izin.
- Kotak "Bulan ini" di pop-up: menunggu hitungan rekap bulan.
- Kotak "Perlu evaluasi (BAD)" di beranda admin: disembunyikan, menunggu data label performa.
- Angka Izin/cuti di beranda admin: 0 sampai fitur izin ada (rumus sudah siap: izin yang bukan DITOLAK/BATAL dan mencakup hari ini).
- "Belum absen" hanya menghitung karyawan yang jam masuk shiftnya SUDAH lewat (supaya shift siang tidak terhitung belum absen di pagi hari).

## Alat bantu (baru)

- `tools/berdampingan.ps1 <mockup.png> <app.png> <keluaran.png>`: gabungkan dua potret jadi satu.
- `tools/pra_toko.js` + `tools/isi_beranda_admin_toko.js`: HP toko tiruan + login admin (pakai `PRA="$(cat tools/pra_toko.js)"` di depan perintah potret; `injeksi.pl` kini mendukung variabel PRA yang dijalankan di `<head>` sebelum aplikasi). Uji: `tools/uji_alur_admin_toko.js`.
- `tools/isi_beranda_pribadi.js`: pengisi potret (server tiruan + login HP pribadi → beranda).
- `tools/mockup_ke_layar.pl`: sekarang menambah `box-sizing: content-box` pada elemen non-form supaya ukuran sama dengan mockup (aplikasi memakai `border-box` global; tanpa ini blok dengan padding + tinggi tetap bergeser).
