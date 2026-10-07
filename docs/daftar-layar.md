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
| 4. HP Toko (01–28) | **dikerjakan** (tampilan; semua yang tersambung masih punya selisih, tidak ada yang "sesuai" penuh) |

Bukti visual (mockup kiri, app kanan): `docs/audit/visual/NN_dampingan.png` (dibuat dengan `tools/potret.sh` dan `tools/berdampingan.ps1`).

## 1. HP Pribadi (karyawan)

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 29 | 8. HP Pribadi - Login | tersambung | Persis mockup: satu kolom Password (PIN karyawan atau kata sandi admin; server `login_pribadi` yang membedakan). Keypad PIN dan tautan "Masuk sebagai admin" dihapus. Tombol kembali di layar ini tidak ada di mockup, jadi kembali lewat tombol Back HP. |
| 30 | 9a. Beranda - badge EXCELLENT | tersambung | Lencana performa disembunyikan: **menunggu data** (label belum dihitung). |
| 31 | 9b. Beranda - badge GOOD | tersambung | Sama. |
| 32 | 9c. Beranda - badge BAD | tersambung | Sama. |
| 33 | 9d. Absen luar - wajah dikenali | tersambung | Beda sengaja: tanpa chip Keperluan (satu kolom Keterangan). Baris "Wajah cocok" diganti "Pengenalan wajah · Segera". |
| 34 | 9e. Absen luar - cadangan PIN | tersambung (tampilan saja) | Layar KEJADIAN, belum bisa dipicu. PIN 5 titik; chip Keperluan dihapus, satu kolom Keterangan (wajib minimal 5, maksimal 100) seperti absen luar (keputusan pemilik 2026-10-07). |
| 35 | 9f. Pop-up absen luar terkirim | tersambung (dipakai sebagai pop-up nyata) | `lb35` tampil setelah absen luar masuk/pulang/lembur DITERIMA server (nama, jam tiket server, "Menunggu persetujuan admin"; kotak "Bulan ini" nonaktif "–"); menutup sendiri 4 detik atau ketuk. Pengiriman gagal = pesan galat lama. |
| 36 | 10a. Report EXCELLENT | tersambung (tampilan saja) | `lb36e` = berwarna penuh EXCELLENT, TIDAK bisa dibuka dari navigasi. Layar Report yang bisa dibuka = `lb36` (lencana netral nonaktif "Segera", tanpa warna label). |
| 37 | 10b. Report GOOD | tersambung (tampilan saja) | `lb37`: layar tersendiri berwarna penuh GOOD; TIDAK bisa dibuka (label belum dihitung). |
| 38 | 10c. Report BAD | tersambung (tampilan saja) | `lb38`: layar tersendiri berwarna penuh BAD; TIDAK bisa dibuka (label belum dihitung). |
| 39 | 10d. Detail lembur | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: Sama. |
| 40 | 10e. Detail telat (tabel) | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: Sama. |
| 41 | 11. Form izin / cuti | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** izin. Tombol Izin/Cuti nonaktif "Segera". |
| 42 | 11d. Ajukan tukar shift | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** tukar shift. Tombol nonaktif "Segera". |
| 43 | 11e. Rekan menyetujui tukar shift | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: Sama. |
| 44 | 11b. Akun saya | tersambung | Dibuka dari ikon akun (menu "Akun saya"). Nama, ID, cabang terisi; Shift bawaan, Ganti password, Ganti PIN = "Segera". Baris "HP terikat" dan teks "Ganti HP? Minta admin reset ikatan HP" DIHAPUS (keputusan pemilik: tidak ada ikatan akun ke HP). |
| 45 | 11c. Ganti password | tersambung (tampilan saja) | Aturan sandi mengikuti peran akun (KARYAWAN: PIN tepat 5 angka; ADMIN: kata sandi minimal 8 karakter); Simpan nonaktif "Segera". Label "Password" untuk karyawan: lihat selisih 18. |
| 46 | 9g. Beranda - akun ber-role ADMIN | tersambung | Beda sengaja: kotak "Konfirmasi data karyawan" menggantikan kartu "Menu admin". Strip "2 pengajuan menunggu ACC" disembunyikan: **menunggu data** (fitur izin). |
| 47 | 8b. Login - akun terkunci | tersambung | Kotak merah "Akun terkunci. Hubungi admin." tampil bila server membalas `TERKUNCI`. |
| 48 | 9h. Beranda - offline | tersambung (tampilan saja) | Layar KEJADIAN (`lb48`): belum bisa dipicu; tanpa "Halo,", nama besar "–"; tanpa antrean offline. |

## 2. Admin cabang

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 49 | 13. Admin - Beranda | tersambung | Angka Hadir/Telat/Belum absen/Izin per shift dari aksi baru `beranda_hari_ini`; kartu bisa digeser (Semua shift + tiap shift), daftar "Belum absen" mengikuti kartu (bawaan: semua shift; mockup menampilkan shift 1), "Menunggu konfirmasi", ikon segarkan. "Perlu evaluasi (BAD)" disembunyikan: **menunggu data** (label performa). Izin/cuti = 0 sampai fitur izin ada. |
| 50 | 13b. Admin - menu | tersambung | Item sama seperti mockup (belum ada fitur = "Segera"). Tambahan di app: "Ubah nama HP ini" dan "Tutup menu". Angka di "Konfirmasi" polos seperti mockup. |
| 51 | 13c. Konfirmasi log out | tersambung | Ikon lingkaran hitam ditambahkan di dialog Log out (HP toko, HP pribadi, owner). |
| 52 | 14. Admin - Konfirmasi | tersambung | Judul 30 px, badge "Admin Ngawi", tanggal "Hari ini/Kemarin/Sabtu 26 Sep", label lembur "1–2 jam", link Maps hitam. Chip Izin dan Lupa absen = "Segera". Edit wajib alasan (lihat tabel perubahan). |
| 53 | 15. Admin - Detail konflik | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** konflik absen |
| 54 | 16. Admin - Absen manual | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur**; item menu "Segera" |
| 55 | 17. Admin - Jadwal shift | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur**; item menu "Segera" |
| 56 | 17b. Tukar shift satu hari | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** tukar shift |
| 57 | 17c. Admin - Pola shift karyawan | tersambung (tampilan saja) | SATU-SATUNYA layar Pola shift (keputusan pemilik 2026-10-07): dibuka dari sheet karyawan (admin HP toko/HP pribadi). Tanpa angka/nama contoh ("–"), aksi "Segera". |
| 58 | 18. Admin - Daftar karyawan | tersambung | Satu daftar (aktif lalu nonaktif); ketuk baris = sheet aksi (Reset PIN, Nonaktifkan / Aktifkan kembali; Ubah data, Pola shift, Daftar wajah = "Segera"). Baris role Admin tidak tampil (server hanya mengirim karyawan). Teks bawah tanpa "password" dan "lepas ikatan HP". |
| 59 | 18b. Pola shift karyawan | **DIHAPUS dari app** | Dihapus atas keputusan pemilik (2026-10-07), digantikan layar 57 (satu-satunya layar Pola shift). Mockup 59 di folder mockup tidak diubah. |
| 60 | 19. Karyawan baru - data | tersambung | Langkah 1 dari 4. Tanpa "Nama tersedia." (belum ada pemeriksaan nama di server) dan tanpa "Jatah cuti" di kotak info. |
| 61 | 20. Karyawan baru - persetujuan + PIN | tersambung | Langkah 2 dari 4. "Saya setuju" = "Segera". PIN **5 digit** (aturan server), bukan 4. Tombol ⌫ ditambahkan di sel kosong keypad. Layar sama dipakai Reset PIN (tanpa bilah langkah dan persetujuan). |
| 62 | 21. Karyawan baru - daftar wajah | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** pengenalan wajah (langkah 3 dilewati) |
| 63 | 22. Karyawan baru - selesai + akun | tersambung | Langkah 4 dari 4. Uji coba wajah dan "Kirim akun via WA" = "Segera". Kotak akun: Username + "Login: PIN 5 angka" (tidak ada password awal 123456 / PIN awal 1234). |
| 64 | 32. Admin - Data absensi | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur**; item menu "Segera" |
| 65 | 33. Admin - Edit absen | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 66 | 34. Admin - Input izin | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** izin |
| 67 | 35. Admin - Kalender libur | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 68 | 36. Dashboard bulanan - tab Ringkasan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** (butuh rekap bulanan + label) |
| 69 | 36. Dashboard bulanan - tab Per karyawan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: sama |
| 70 | 36b. Detail karyawan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: sama |

## 3. Owner

Selisih per layar (siapa yang memutuskan, gambar berdampingan): lihat `docs/daftar-selisih.md`.

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 71 | 23. Owner - Beranda | tersambung | Dropdown Cabang selalu tampil; satu kartu + dropdown Shift; Belum absen; Perlu evaluasi nonaktif; Telat 7 hari dari data nyata |
| 72 | 23b. Owner - menu | tersambung | Urutan dan isi menu = mockup; item tanpa fitur "Segera" |
| 73 | 24. Owner - Log per kategori | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 74 | 25. Owner - Log detail | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 75 | 26. Owner - Pengaturan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 76 | 27. Owner - Kunci periode | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 77 | 28. Owner - Role & admin | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 78 | 29. HP baru - pilih jenis HP | tersambung | Tombol "Masuk sebagai Owner" dipertahankan (TANYA) |
| 79 | 30. Daftarkan HP toko | tersambung | Cabang/ID/Kode = "Segera" |
| 80 | 31. Owner - Daftar perangkat | tersambung | Filter cabang, saklar nonaktif, Ubah nama dipertahankan (TANYA) |
| 81 | Owner - Laporan bulanan - Ringkasan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 82 | Owner - Laporan bulanan - Per karyawan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |

## 4. HP Toko (urutan galeri 01–28; 22–28 tercampur di galeri)

Tidak ada layar kelompok 4 yang ditandai "sesuai" penuh: semua yang tersambung masih punya selisih (lihat `docs/daftar-selisih.md`, bagian Kelompok 4). Hanya TAMPILAN yang diselaraskan; logika absen HP toko tidak diubah.

| No | Layar mockup | Status | Catatan |
|---|---|---|---|
| 01 | 1. HP Toko - Layar utama | tersambung (ada selisih) | Tanggal ikut mockup (keputusan pemilik); LEMBUR pudar dan kartu "Hari ini tidak masuk" nonaktif (belum diputuskan) |
| 02 | 1c. Shift 1 aktif - jadwal hari ini | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** jadwal (label tidak membuka apa pun) |
| 03 | 2. Pindai wajah | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** wajah |
| 04 | 3. Wajah dikenali | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** wajah |
| 05 | 3b. Peringatan sudah absen (dobel) | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 06 | 3d. Shift tidak sesuai jadwal | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 07 | 3c. Sudah absen lembur - revisi | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 08 | 4. Wajah tidak terbaca | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** wajah |
| 09 | 5. Pilih nama + PIN | tersambung (ada selisih) | Versi app dipertahankan (keputusan pemilik): judul "Absen Masuk/Pulang/Lembur PIN", bingkai foto 100 px |
| 10 | 6a. Pop-up TEPAT WAKTU | tersambung (ada selisih) | "Bulan ini" nonaktif |
| 11 | 6b. Pop-up TELAT | tersambung (ada selisih) | "Bulan ini" nonaktif |
| 12 | 6b2. Alasan telat | tersambung | Tidak ada selisih tampilan yang terlihat |
| 13 | 6b3. Peringatan lanjutan | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 14 | 6c. Pop-up PULANG | tersambung (ada selisih) | "Bulan ini" nonaktif |
| 15 | 6d. Pop-up PULANG AWAL | tersambung (ada selisih) | Pop-up persis mockup tampil lebih dulu; "Bulan ini" nonaktif |
| 16 | 6d2. Alasan pulang awal | tersambung | Versi app dipertahankan (keputusan pemilik) |
| 17 | 6e. Pop-up LEMBUR | tersambung (ada selisih) | Pop-up persis mockup tampil lebih dulu, lalu layar 20; "Bulan ini" nonaktif |
| 18 | 6f. Masuk + belum absen pulang kemarin | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 19 | 6g. Pulang + belum absen masuk | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** |
| 20 | 7. Lembur | tersambung | Versi app dipertahankan (keputusan pemilik) |
| 21 | 6h. Absen terlalu pagi | tersambung | Versi app dipertahankan (keputusan pemilik); baris sisa waktu nonaktif |
| 22 | Admin - Cek Surat Dokter | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** izin |
| 23 | HP Pribadi - Izin Sakit dengan Surat Dokter | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; layar KEJADIAN: dibuat lengkap, TIDAK bisa dipicu dari navigasi nyata. Fitur aslinya: **Menunggu fitur** izin |
| 24 | Owner - Cabang dan Shift | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 25 | Owner - Data Absensi | tersambung (tampilan saja) | Tampilan persis mockup tanpa angka/nama contoh ("–"); semua tombol aksi nonaktif "Segera"; bisa dibuka dari tombol/menu mockup. Fitur aslinya: **Menunggu fitur** |
| 26 | Owner - Ganti Password | tersambung | Versi app dipertahankan (keputusan pemilik) |
| 27 | Owner - Keluarkan Semua Perangkat | tersambung (ada selisih) | Daftar perangkat dari server |
| 28 | Owner - Konfirmasi Data Admin | tersambung | Versi app dipertahankan; maksimal 5 kartu terlama (keputusan pemilik) |

## Perubahan dari mockup: keputusan pemilik 2026-10-07 (tambahan)

| Layar | Perubahan | Alasan |
|---|---|---|
| 50 Menu admin | "Ubah nama HP ini" dan "Tutup menu" dipertahankan | keputusan pemilik (fungsi) |
| 51 Log out | Beranda samar di belakang dialog dipertahankan | keputusan pemilik |
| 58 Karyawan | Ketuk nama membuka sheet aksi; baris Admin hanya baca | keputusan pemilik |
| 60 Karyawan baru | Tombol hijau di posisi app, ikon kalender di tanggal; baris info dengan nilai server | keputusan pemilik |
| 61 PIN | Tombol ⌫ ; PIN 5 angka (mockup 4 digit usang, pemilik yang merevisi mockup) | keputusan pemilik |
| 63 Selesai | Tanpa password/PIN awal (mockup usang, pemilik yang merevisi) | keputusan pemilik |
| 78 | Tombol "Masuk sebagai Owner" | keputusan pemilik |
| 80 | Filter cabang, saklar nonaktif, Ubah nama | keputusan pemilik |
| 52 Konfirmasi | Chip "Pulang cepat" dan durasi tepat dihapus (kembali ke mockup) | keputusan pemilik |
| 35 Pop-up | Pil tambahan dihapus | keputusan pemilik |
| 30–32, 46 | Titik di subjudul dihapus (kembali ke mockup) | keputusan pemilik |

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

## Menunggu data / fitur (tampil NONAKTIF "Segera" di app)

- Lencana performa EXCELLENT/GOOD/BAD dan kotak "Perlu evaluasi (BAD)": tampil nonaktif, menunggu perhitungan label.
- Strip "N pengajuan menunggu ACC" (beranda karyawan/admin): tampil nonaktif, menunggu fitur izin.
- Kotak "Bulan ini" di pop-up: menunggu hitungan rekap bulan.
- Kotak "Perlu evaluasi (BAD)" di beranda admin: tampil nonaktif, menunggu data label performa.
- Angka Izin/cuti di beranda admin: 0 sampai fitur izin ada (rumus sudah siap: izin yang bukan DITOLAK/BATAL dan mencakup hari ini).
- "Belum absen" hanya menghitung karyawan yang jam masuk shiftnya SUDAH lewat (supaya shift siang tidak terhitung belum absen di pagi hari).

## Alat bantu (baru)

- `tools/berdampingan.ps1 <mockup.png> <app.png> <keluaran.png>`: gabungkan dua potret jadi satu.
- `tools/pra_toko.js` + `tools/isi_beranda_admin_toko.js`: HP toko tiruan + login admin (pakai `PRA="$(cat tools/pra_toko.js)"` di depan perintah potret; `injeksi.pl` kini mendukung variabel PRA yang dijalankan di `<head>` sebelum aplikasi). Uji: `tools/uji_alur_admin_toko.js`.
- `tools/isi_beranda_pribadi.js`: pengisi potret (server tiruan + login HP pribadi → beranda).
- `tools/mockup_ke_layar.pl`: sekarang menambah `box-sizing: content-box` pada elemen non-form supaya ukuran sama dengan mockup (aplikasi memakai `border-box` global; tanpa ini blok dengan padding + tinggi tetap bergeser).

## Paket 2026-10-07 (keputusan pemilik)

- 30, 31, 32, 46: nama tanpa "Halo,", ikon segarkan di bawah ikon akun (selisih dari mockup, keputusan pemilik; lihat `docs/daftar-selisih.md`).
- Tarik-ke-bawah refresh di beranda HP pribadi, admin HP toko, owner.
- 09 dan absen luar masuk/pulang/lembur: lingkaran foto 160 px (ukuran usulan, belum final).

## Putaran "semua layar belum" (2026-10-07): tampilan saja
- 43 layar baru disalin dari mockup lewat `tools/mockup_ke_layar.pl` lalu dibersihkan otomatis (`tools/layar_baru_bersih.js`, hasil di `tools/layar_baru/NN.html`): tanpa angka/nama/tanggal contoh ("–"), tabel hanya kepala kolom, dropdown/filter/input nonaktif, semua tombol aksi nonaktif "Segera". Yang berfungsi hanya Kembali / Home / Tutup, tab 68↔69 dan 81↔82, serta tautan menu yang ditetapkan.
- Tombol/menu yang kini AKTIF menuju layar baru: label "Shift 1 aktif" → 02; menu admin (HP toko & HP pribadi): Absen manual 54, Data absensi 64, Jadwal shift 55, Input izin 66, Kalender libur 67, Dashboard bulanan 68; HP pribadi: Izin/Cuti 41, Tukar shift 42, Report 36 (→ Detail Telat 40, Detail Lembur 39), Ganti password 45; sheet karyawan "Pola shift" 59; menu owner: Log admin 73 (→ Edit absen 74), Pengaturan 75, Kunci periode 76, Role & admin 77, Cabang & shift 24, Data absensi 25, Laporan bulanan 81 (tab → 82).
- Alur wajah HP toko (tampilan saja): ABSEN MASUK/PULANG/LEMBUR → 03 (1–2 detik, "Pengenalan wajah · Segera", kamera TIDAK dibuka) → 08 (ULANGI nonaktif "Segera") → MANUAL aktif → layar 09 seperti sebelumnya. Tiket waktu tetap diminta SAAT TOMBOL DITEKAN (sekali saja).
- Layar KEJADIAN (04, 05, 06, 07, 13, 18, 19, 22, 23, 34, 43, 53, 56, 62, 65, 70) dibuat lengkap tetapi sengaja belum bisa dipicu dan tidak disambung ke logika absen (penolakan dobel dari server tetap pop-up "Tidak tersimpan"). Layar 57 belum punya jalur (jalur Pola shift lewat 59).
- Tes: `tools/uji_tombol_segera.js`, `tools/uji_layar_baru_tanpa_contoh.js` (+ `tools/buat_token_contoh.pl`), `tools/uji_alur_layar_baru.js`, alur wajah di `tools/uji_alur_hp_toko.js`.

## Putaran keputusan pemilik 2026-10-07 (butir 1-8)
- 34: PIN 5 angka, tanpa chip Keperluan, kolom Keterangan seperti absen luar. 45: "(awal: ...)" dihapus (sisa password awal 123456).
- Pola shift: hanya layar 57; layar 59 dihapus (markup, jalur, tes, gambar dampingan).
- Kalimat tren (68, 81, Report, 70) dikembalikan sebagai "–" tanpa panah dan tanpa angka.
- Layar baru: 35, 37, 38, 48 dan 36e (Report EXCELLENT berwarna). Tidak bisa dipicu: 35, 36e, 37, 38, 48 (selain 04, 05, 06, 07, 13, 18, 19, 22, 23, 34, 43, 53, 56, 62, 65, 70).
- Layar Report yang bisa dibuka (36) memakai lencana netral nonaktif.

## Putaran keputusan pemilik 2026-10-07 (selisih 11–17)
- 35 kini pop-up nyata absen luar (bukan layar kejadian lagi); layar kejadian yang tersisa: 04, 05, 06, 07, 13, 18, 19, 22, 23, 34, 36e, 37, 38, 43, 48, 53, 56, 62, 65, 70.
- 45 aturan sandi menurut peran; 48 tanpa "Halo,"; kalimat "Telat N kali…" = "–" pudar; teks tren "–" abu netral; 75 daftar Keperluan absen luar dipertahankan nonaktif.
