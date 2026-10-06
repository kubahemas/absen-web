# Audit Mockup vs Aplikasi (Langkah 0)

Tanggal audit: 2026-10-06. Hanya membaca dan menulis dokumen; tidak ada kode aplikasi yang diubah.

## 0. Cara memeriksa (penting dibaca dulu)

- **Semua status di bawah berasal dari pembandingan KODE/MARKUP, BUKAN visual.** Mockup tidak dirender berdampingan dengan aplikasi pada lebar 390 px, jadi tidak ada berkas gambar pembanding. Karena itu hampir tidak ada status "SESUAI" yang mutlak; hanya 3 layar yang markupnya terbukti identik (teks, urutan, tombol).
- Alat: skrip Perl (`ekstrak.pl`, dijalankan sementara, tidak disimpan di repo) yang mengekstrak per berkas mockup: judul, teks tombol, teks label, jumlah tombol/input/select/gambar. Hasilnya dibandingkan dengan markup `index.html` (blok `<div id="layar...">`, menu, dialog, popup) dan dengan daftar aksi di `apps-script/api.gs`.
- Kode metode dipakai di tabel: **M1** = markup mockup dibanding markup `index.html`; **M2** = pencarian teks/ID di `index.html` (tidak ditemukan = BELUM ADA); **M3** = CSS (ukuran) dibanding; **A** = daftar aksi di `api.gs`.
- **TIDAK DAPAT DIPASTIKAN (TDP)** dipakai kalau markup mirip tetapi perbedaan tampilan hanya bisa dipastikan lewat render.
- Koreksi fakta format (penting untuk Langkah 4): mockup **bukan** format `<x-dc>` dan **tidak** punya skrip `DCLogic`. Terbukti: `grep "x-dc|DCLogic"` = 0 berkas; jumlah tag `<script>` di 82 berkas = 0. Mockup adalah HTML statis biasa dengan gaya inline.

## 1. Inventaris (Langkah 1)

- Jumlah berkas di `docs/mockup/layar/`: **82**. Galeri (`BUKA INI - Galeri Mockup.html`) memuat 82 `<iframe>` dan 82 tautan unik. Jadi **sama**: 82 = 82. Tidak ada dokumen lain (`keputusan-desain.md`, `CLAUDE.md`) yang menyebut jumlah layar, jadi tidak ada angka lain untuk dibandingkan.
- Tanggal perubahan terakhir di git: **semua 82 berkas = 2026-10-01** (satu commit). Ukuran 1,8 KB sampai 19,7 KB per berkas; total sekitar 600 KB.
- Pengelompokan di galeri: HP Toko, HP Pribadi karyawan, Admin cabang, Owner. Untuk audit ini dipakai 5 kelompok: HP toko (01–21), HP pribadi (23, 29–48), Admin (22, 49–70), Owner (24–28, 71–77, 80–82), Bersama (78–79: pilih jenis HP dan daftarkan HP toko).

## 2. Ringkasan (jumlah layar per status per peran)

| Peran | Jumlah | SESUAI | BEDA | BELUM ADA | TDP |
|---|---|---|---|---|---|
| HP toko | 21 | 0 | 7 | 11 | 3 |
| HP pribadi | 21 | 0 | 7 | 13 | 1 |
| Admin cabang | 23 | 1 | 6 | 16 | 0 |
| Owner | 15 | 2 | 4 | 9 | 0 |
| Bersama | 2 | 0 | 2 | 0 | 0 |
| **Total** | **82** | **3** | **26** | **49** | **4** |

Layar yang ada di aplikasi tetapi **tidak ada di mockup**: Riwayat absen (HP pribadi), Kelola HP toko (sebagian berpadanan dengan mockup 80), Perlu perhatian (daftar), Karyawan dengan filter Aktif/Nonaktif (sebagian berpadanan 58), Buat kata sandi dan PIN admin (login pertama), Ubah nama HP.

## 3. Tabel lengkap (Langkah 2 dan 3)

Kolom server: **ya** = aksi sudah ada di `api.gs`; **sebagian** = ada tetapi perlu tambahan; **belum** = tidak ada aksi.

### HP toko

| No | Layar | Status | Beda di mana | Metode | Server |
|---|---|---|---|---|---|
| 01 | Layar utama | BEDA | [KOREKSI 2026-10-06: ukuran tombol (112 px, ikon 56, gap 18) ternyata SAMA dengan mockup 01; angka 104/52/16 adalah milik mockup beranda HP pribadi. Bukti: docs/audit/visual/01_mockup.png dan 01_app.png.] Kartu "Hari ini tidak masuk (N)" tidak ada (grep "tidak masuk" = 0). Label "Shift 1 aktif ▾" hanya teks, tidak ada pembuka jadwal. LEMBUR dasar nonaktif sampai waktunya (ada, tetapi sub-teks beda). Tombol "Masuk sebagai Admin" ada | M1, M3 | sebagian (daftar nama tidak masuk kerja belum ada) |
| 02 | Ketuk Shift 1 aktif: jadwal hari ini | BELUM ADA | Tidak ada layar/dialog jadwal; `labelShift` tidak punya aksi ketuk | M1, M2 | belum (butuh jadwal hari ini per shift) |
| 03 | Pindai wajah | BELUM ADA | Pengenalan wajah belum dikerjakan (rencana tahap 1 nomor 6) | M2 | belum |
| 04 | Wajah dikenali IYA/TIDAK | BELUM ADA | Sama (butuh pengenalan wajah) | M2 | belum |
| 05 | Peringatan sudah absen (dobel) | BELUM ADA | Teks "Apakah itu Anda?" dan tombol "BUKAN SAYA" tidak ada | M2 | belum |
| 06 | Shift tidak sesuai jadwal | BELUM ADA | `SHIFT_BEDA` tidak ada di `index.html` | M2 | belum |
| 07 | Sudah absen lembur, revisi lembur | BELUM ADA di HP toko | "Revisi lembur"/"Ganti jadi lembur" = 0 di `index.html` (server sudah punya logika revisi) | M2, A | sebagian (logika ada, balasan tanda "sudah absen" belum ke layar) |
| 08 | Wajah tidak terbaca (ULANGI/MANUAL) | BELUM ADA | Butuh pengenalan wajah | M2 | belum |
| 09 | Pilih nama + PIN | BEDA | Keypad angka ada di keduanya (sesuai). Beda: PIN 5 digit (sadar), foto kamera tampil sebagai lingkaran kecil bukan foto besar di atas, tidak ada "Foto ulang", daftar nama tidak berlabel "(Shift N)" dan tidak tersaring jadwal hari ini | M1 | sebagian (`daftar_karyawan` ada, tanpa jadwal) |
| 10 | Pop-up tepat waktu | BEDA | Judul, pil "Masuk jam (Shift)", teks tutup otomatis 4 detik ada. Kotak "Bulan ini" (Masuk/Telat/Izin/Sisa cuti) tidak ada ("Bulan ini"=0) | M1, M2 | belum (statistik bulan ini) |
| 11 | Pop-up telat | BEDA | Sama seperti 10: kotak "Bulan ini" tidak ada; tombol ISI ALASAN TELAT, hitung 10 detik ada | M1 | belum |
| 12 | Alasan telat | TDP | Markup layar alasan memuat chip, "Keterangan (wajib jika pilih Lainnya)", SIMPAN ALASAN, "Tanpa sentuhan 30 detik" (serupa). Judul kepala di app memakai kelas `alasan-head-lembur`; apakah tema merah sama hanya bisa dipastikan lewat render | M1 | ya |
| 13 | Peringatan lanjutan | BELUM ADA | "Satu lagi"/"MENGERTI" = 0 | M2 | belum (butuh deteksi lupa absen pulang kemarin) |
| 14 | Pop-up pulang | BEDA | "Terima kasih" ada; kotak "Bulan ini" tidak ada | M1, M2 | belum |
| 15 | Pop-up pulang awal | BEDA | Pil "Menunggu persetujuan" dan tombol alasan ada; kotak "Bulan ini" tidak ada | M1 | belum |
| 16 | Alasan pulang awal | TDP | Sama dengan 12 | M1 | ya |
| 17 | Pop-up lembur | BEDA | Kotak "Bulan ini" tidak ada | M1 | belum |
| 18 | Pop-up masuk + belum absen pulang kemarin | BELUM ADA | Teks tidak ada | M2 | belum |
| 19 | Pop-up pulang + belum absen masuk | BELUM ADA | Teks tidak ada | M2 | belum |
| 20 | Lembur (pekerjaan apa) | TDP | Teks "Pekerjaan apa", "SIMPAN LEMBUR" ada; tampilan layar tidak dirender | M1, M2 | ya |
| 21 | Absen terlalu pagi | BELUM ADA | "belum dibuka" = 0; server menolak dengan pesan umum lewat popup "Tidak tersimpan" | M2 | sebagian (server menolak, tanpa jam buka) |

### HP pribadi

| No | Layar | Status | Beda di mana | Metode | Server |
|---|---|---|---|---|---|
| 23 | Izin sakit dengan surat dokter | BELUM ADA | Tombol "IZIN / CUTI · Segera" nonaktif | M1 | belum (tidak ada aksi izin) |
| 29 | Login | BEDA | Mockup: "Username (nama lengkap)" + "Password", gambar karyawan, tagline "Selamat bekerja karyawan terbaik...". App: "Nama lengkap" + satu kolom "PIN atau kata sandi", tanpa gambar karyawan/tagline, bar bawah ‹ + Masuk. Keduanya memakai keyboard biasa | M1 | ya |
| 30 | Beranda badge EXCELLENT | BEDA | Lihat pemeriksaan wajib 1 dan 2 | M1, M3 | belum (label performa) |
| 31 | Beranda badge GOOD | BEDA | Sama | M1 | belum |
| 32 | Beranda badge BAD | BEDA | Sama | M1 | belum |
| 33 | Absen luar, wajah dikenali | BEDA | Mockup: foto + "Wajah cocok" + 7 chip Keperluan + "Keterangan tujuan". App: dua kolom teks bebas Tujuan dan Keperluan, status GPS; tanpa chip, tanpa wajah | M1 | sebagian (daftar `KEPERLUAN_LUAR` hanya di `setup_spreadsheet.gs`, tidak ada aksi yang membacanya) |
| 34 | Absen luar, cadangan PIN | BELUM ADA | Tidak ada langkah PIN di absen luar (autentikasi lewat sesi) | M1, M2 | belum (butuh pengenalan wajah dulu) |
| 35 | Pop-up absen luar terkirim | BEDA | Popup "Selamat bekerja" ada; tanpa kotak "Bulan ini" dan tanpa "(Absen luar · keperluan)" | M1 | sebagian |
| 36 | Report EXCELLENT | BELUM ADA | Tidak ada layar Report | M2 | belum (hitung rekap + label) |
| 37 | Report GOOD | BELUM ADA | Sama | M2 | belum |
| 38 | Report BAD | BELUM ADA | Sama | M2 | belum |
| 39 | Detail lembur | BELUM ADA | Sama | M2 | belum |
| 40 | Detail telat | BELUM ADA | Sama | M2 | belum |
| 41 | Form izin dan cuti | BELUM ADA | Tombol nonaktif "Segera" | M1 | belum |
| 42 | Ajukan tukar shift | BELUM ADA | Lihat pemeriksaan 6 | M2 | belum |
| 43 | Rekan menyetujui tukar shift | BELUM ADA | Sama | M2 | belum |
| 44 | Akun saya | BELUM ADA | Mockup memuat "HP terikat"/"Ganti HP?" yang sudah dibatalkan secara sadar | M2 | belum |
| 45 | Ganti password (HP pribadi) | BELUM ADA | Mockup memakai password 6 angka dan "awal: 123456" (aturan lama; sekarang PIN 5 angka/sandi 8 karakter) | M2 | belum |
| 46 | Beranda akun ber-role ADMIN | BEDA | Mockup: kartu "Menu admin — Konfirmasi, absen manual, jadwal, karyawan" dengan angka. App: item di menu pojok (badge), tanpa kartu di beranda | M1 | ya (jumlah konfirmasi) |
| 47 | Login akun terkunci | TDP | Pesan terkunci dari server ditampilkan di `pesanLoginPribadi`; tampilan merah/teks tidak dirender | M1 | ya |
| 48 | Beranda offline | BELUM ADA | Absen offline belum ada (lencana "Offline" hanya penanda) | M2 | belum |

### Admin cabang

| No | Layar | Status | Beda di mana | Metode | Server |
|---|---|---|---|---|---|
| 22 | Cek surat dokter | BELUM ADA | — | M2 | belum |
| 49 | Beranda | BEDA | Mockup: kartu Hari ini (Hadir/Telat/Belum absen/Izin), daftar "Belum absen (shift 1)", kartu "Menunggu konfirmasi N", "Perlu evaluasi (BAD)". App: hanya judul "Beranda admin", catatan, Home dan Log out | M1 | belum (hari-ini admin, evaluasi) |
| 50 | Menu admin | BEDA | Mockup 10 item (Konfirmasi N, Absen manual, Data absensi, Jadwal shift, Input izin, Karyawan, Kalender libur, Dashboard bulanan, Log out). App: Konfirmasi, Karyawan, Ubah nama HP ini, Log out, Tutup menu | M1 | sebagian |
| 51 | Konfirmasi log out | SESUAI (HP toko) | Dialog "Log out?" + nama · cabang + Batal/Log out identik di markup HP toko; di HP pribadi sub-teks hanya nama | M1 (bukan visual) | ya |
| 52 | Daftar konfirmasi | BEDA | Mockup: tab Semua/Lembur/Absen luar/Izin/Lupa absen, kartu izin sakit, lupa absen, tukar shift. App: judul kelompok (Absen luar, Lembur, Pulang cepat), tanpa tab, tanpa izin/lupa absen/tukar shift | M1 | sebagian (absen luar/lembur/pulang cepat ya; izin, lupa absen, tukar shift belum) |
| 53 | Detail konflik | BELUM ADA | — | M2 | belum |
| 54 | Absen manual | BELUM ADA | — | M2 | belum |
| 55 | Jadwal shift | BELUM ADA | — | M2 | belum |
| 56 | Tukar shift satu hari | BELUM ADA | — | M2 | belum |
| 57 | Pola shift karyawan (variasi dengan "+ Shift") | BELUM ADA | — | M2 | belum (kolom `akun.pola_shift` dll ada di sheet) |
| 58 | Daftar karyawan | BEDA | App: filter Aktif/Nonaktif, tombol + Tambah; mockup: daftar dengan label shift/Admin/Nonaktif, ketuk nama = ubah data, lepas ikatan HP (ikatan HP dibatalkan) | M1 | ya |
| 59 | Pola shift karyawan | BELUM ADA | — | M2 | belum |
| 60 | Karyawan baru: data | BEDA | Field sama (nama, panggilan, shift, mulai kerja, catatan ID otomatis). Tidak ada "Langkah 1 dari 4", tidak ada "Batal pendaftaran", cek "Nama tersedia" tidak ada | M1 | ya |
| 61 | Karyawan baru: persetujuan + PIN | BEDA | Keypad ada (sesuai). Beda: PIN 5 digit, kotak "Persetujuan data wajah" dan tombol "Saya setuju" tidak ada | M1 | ya |
| 62 | Karyawan baru: daftar wajah | BELUM ADA | Tombol "Daftar wajah · Segera" nonaktif | M2 | belum |
| 63 | Karyawan baru: selesai + akun | BELUM ADA | Isinya "password awal 123456, PIN awal 1234" (aturan lama, sudah dibatalkan) | M2 | belum |
| 64 | Data absensi (admin) | BELUM ADA | — | M2 | belum |
| 65 | Edit absen | BELUM ADA | — | M2 | belum |
| 66 | Input izin | BELUM ADA | — | M2 | belum |
| 67 | Kalender libur | BELUM ADA | — | M2 | belum |
| 68 | Dashboard bulanan, tab Ringkasan | BELUM ADA | — | M2 | belum |
| 69 | Dashboard bulanan, tab Per karyawan | BELUM ADA | — | M2 | belum |
| 70 | Detail karyawan | BELUM ADA | — | M2 | belum |

### Owner

| No | Layar | Status | Beda di mana | Metode | Server |
|---|---|---|---|---|---|
| 24 | Cabang dan shift | BELUM ADA | — | M2 | belum |
| 25 | Data absensi (owner) | BELUM ADA | — | M2 | belum |
| 26 | Ganti password | SESUAI (markup) | Field (lama, baru, ulang), daftar cek, catatan, bar ‹ + Simpan sama | M1 (bukan visual) | ya |
| 27 | Keluarkan semua perangkat | SESUAI (markup) | Dialog: judul, "N perangkat sedang login", daftar perangkat, catatan, Batal/Keluarkan semua sama | M1 (bukan visual) | ya |
| 28 | Konfirmasi data admin | BEDA | Lihat pemeriksaan 5: layar khusus milik admin; app memakai satu layar Konfirmasi umum | M1 | sebagian |
| 71 | Beranda owner | BEDA | Lihat pemeriksaan 7 | M1 | sebagian |
| 72 | Menu owner | BEDA | Mockup 11 item; app 4 item (+Konfirmasi) | M1 | sebagian |
| 73 | Log per kategori | BELUM ADA | — | M2 | belum (sheet `log` ada; belum ada aksi baca per kategori) |
| 74 | Log detail (tabel + filter) | BELUM ADA | — | M2 | belum |
| 75 | Pengaturan | BELUM ADA | — | M2 | belum |
| 76 | Kunci periode | BELUM ADA | — | M2 | belum |
| 77 | Role dan admin | BELUM ADA | — | M2 | belum |
| 80 | Daftar perangkat | BEDA | App "Kelola HP toko": filter cabang, saklar nonaktif, Nonaktifkan, Ubah nama (mockup tidak punya Ubah nama/saklar; mockup punya status sinkron/belum terkirim yang belum ada) | M1 | sebagian |
| 81 | Laporan bulanan, Ringkasan | BELUM ADA | — | M2 | belum |
| 82 | Laporan bulanan, Per karyawan | BELUM ADA | — | M2 | belum |

### Bersama

| No | Layar | Status | Beda di mana | Metode | Server |
|---|---|---|---|---|---|
| 78 | HP baru: pilih jenis HP | BEDA | Pilihan kedua berlabel "MASUK" (mockup "HP PRIBADI") dengan keterangan beda; tombol "Masuk sebagai Owner" tambahan di app | M1 | ya |
| 79 | Daftarkan HP toko | BEDA | App: Username, Password, Nama HP; mockup juga menampilkan baris Cabang, ID HP (HPT-NGW-03), Kode di absen (T3) dan "Langkah 1/2" | M1 | ya |

## 4. Pemeriksaan wajib (verifikasi terhadap mockup)

**1. Beranda HP pribadi (mockup 30–32, 46, 48).** Temuan pemilik **benar**. Urutan mockup dari atas: logo + lencana label performa kanan atas (EXCELLENT/GOOD/BAD), sapaan "Halo, nama" + "Belum absen hari ini", ABSEN MASUK, ABSEN PULANG, LEMBUR (kecil), satu baris tiga kotak (Izin/Cuti, Tukar shift, Report), kartu "N pengajuan menunggu ACC" + tautan Lihat, catatan "Absen di HP ini perlu ACC admin". App (`#layarPribadi`): logo + badge (tombol menu, bertuliskan nama panggilan, bukan label performa), sapaan + tanggal, status, ABSEN MASUK, ABSEN PULANG, **RIWAYAT ABSEN** (tidak ada di mockup), **IZIN / CUTI · Segera** (tombol lebar nonaktif, bukan satu dari tiga kotak). Tidak ada LEMBUR, Tukar shift, Report, kartu pengajuan, dan catatan bawah. Di app, lembur dikerjakan lewat tombol "PULANG + LEMBUR" di layar absen luar.

**2. Ukuran/posisi tombol.** Mockup: ABSEN MASUK/PULANG tinggi 104 px, border 4, radius 26, padding 0 20, lingkaran ikon 52, judul Oswald 30 px; LEMBUR tinggi 62, radius 20, Oswald 22, margin horizontal 28, di bawah dua tombol utama; baris tiga kotak tinggi 84 px. App (`.tombol-absen`): tinggi 112 px, border 4, radius 26, padding 0 22, ikon 56, judul `clamp(18px…32px)`, plus sub-teks "Absen luar". Selisih: tinggi +8 px, ikon +4 px, ada sub-teks; tidak ada LEMBUR, tiga kotak. Metode: M3 (CSS vs inline style), bukan visual.

**3. PIN keypad.** Temuan pemilik **sebagian tidak terbukti**. Hasil: (a) Layar login HP pribadi: mockup 29 **juga memakai kolom ketik biasa** (Username + Password), bukan keypad; app sama-sama keyboard (kolom tersembunyi/password). (b) PIN HP toko (mockup 09): keypad **ada di mockup dan di app** (`data-digit`), beda hanya 4 digit vs 5 digit. (c) Buat PIN karyawan (mockup 61): keypad **ada di mockup dan di app** (`#layarPinBaru`, `data-d`). (d) Keypad di mockup juga ada pada **absen luar cadangan PIN (34)** yang **tidak ada** di app. (e) Layar baru di app tanpa padanan mockup: "Buat kata sandi dan PIN" admin (`#layarKredensialAdmin`) memakai kolom PIN `inputmode="numeric"`, bukan keypad.

**4. Form absen luar.** **Benar.** App: dua kolom teks bebas `luarTujuan` dan `luarKeperluan` (maks 100 karakter). Mockup 33/34: 7 chip pilihan (Survey, Pengiriman, Pemasangan, Service, Penagihan, Ketemu klien, Lainnya) + kolom "Keterangan tujuan (nama klien atau alamat)". Daftar `KEPERLUAN_LUAR` ada di `setup_spreadsheet.gs` (baris 163–169), tetapi `api.gs` tidak memiliki aksi yang membacanya (hanya `ALASAN_TELAT`, `ALASAN_PULANG_AWAL`, `PEKERJAAN_LEMBUR` yang dikirim ke layar). Server tidak memeriksa nilai keperluan terhadap daftar.

**5. Konfirmasi.** Mockup: ADMIN punya **keduanya**: item menu "Konfirmasi 5" (50) dan kartu di beranda "Menunggu konfirmasi 5" (49). OWNER: ada kotak beranda "Konfirmasi data admin — Izin, absen luar, lupa absen milik admin 2" (71) menuju layar 28 "Pengajuan milik admin" (hanya data admin, catatan "Admin tidak bisa meng-ACC datanya sendiri"); **menu owner (72) tidak punya item Konfirmasi** (punya "Log admin 1"). App: Konfirmasi hanya item menu (admin HP toko, admin HP pribadi, owner); tidak ada kartu beranda untuk admin maupun owner. Angka "Menunggu ACC" di beranda owner hanya angka, tidak bisa diketuk.
*Penyebab owner tidak bisa ACC:* **tidak ditemukan cacat di kode**. Jalur terbaca benar: menu owner `btnMenuKonfirmasiOwner` memanggil `bukaKonfirmasi('OWNER')` (menu tertutup oleh handler tombol), klien mengirim `{aksi, sesi: sesiOwner}` tanpa token; server `aktorKonfirmasi` memvalidasi `validasiSesi(sesi,'OWNER')` lalu `bolehMemutuskanKonfirmasi` mengizinkan OWNER semua cabang (termasuk absen milik admin). Satu-satunya perbedaan dibanding admin ada di tahap autentikasi. Kemungkinan penyebab (urut dari paling mungkin; **tidak bisa dipastikan tanpa menjalankan aplikasi**): (1) Gelombang 2 baru tayang di Pages setelah build hijau, sebelumnya halaman lama (tanpa menu Konfirmasi); (2) salinan `api.gs` terbaru belum disalin ke editor Apps Script dan di-deploy sebagai **versi baru** (tanpa itu aksi `konfirmasi_*` ditolak sebagai "wajib token HP toko"); (3) sesi owner kedaluwarsa/dicabut (kode `SESI_TIDAK_VALID` akan memaksa login ulang, tampak seperti "tidak bisa"); (4) harapan pemilik: mockup menaruh ACC milik admin di kotak beranda owner, sedangkan app menaruhnya di menu. Minta pemilik menyebutkan pesan layar yang muncul persis.

**6. Tukar shift (mockup 42, 43, 56; terkait 41, 52, 55, 57, 59).** Tidak ada di app (`grep` "tukar" di `index.html` dan `api.gs` = 0). Ketergantungan: Izin/Cuti (41) sebagai pintu masuk, kotak "Tukar shift" di beranda HP pribadi (30–32), Jadwal shift admin (55: grid minggu per karyawan, salin minggu lalu), Pola shift (57/59), Konfirmasi tukar shift di layar Konfirmasi admin (52, kartu "rekan setuju"), kolom sheet `izin` (jenis TUKAR_SHIFT/PINDAH_SHIFT, rekan, status_rekan, shift_asal, shift_tujuan) dan `akun.pola_shift` yang baru tertulis di dokumen; perhitungan shift harian harus membaca jadwal/kalender (sekarang absen memakai shift dari `akun.shift`). Aksi server: belum ada satu pun untuk izin/jadwal.

**7. Beranda owner (mockup 71).** Mockup: filter Cabang (Semua/Ngawi/Pusat) dengan catatan "Semua isi beranda mengikuti pilihan ini"; Hari ini = Hadir/Telat/Belum absen/Izin-cuti (+ rincian per shift); "Perlu perhatian N" dengan 4 jenis (HP toko baru, HP belum sinkron, admin ubah absen sendiri, bulan belum dikunci); kotak "Konfirmasi data admin"; "Perlu evaluasi (BAD) 3 orang"; grafik "Telat 7 hari terakhir". App: Cabang (hanya bila > 1) dan Shift; angka Sudah masuk/Telat/Sudah pulang/Menunggu ACC; "Perlu perhatian" (hanya HP toko baru dan login perangkat baru). **Hilang:** angka "Belum absen" dan "Izin/cuti", rincian per shift pada kartu, jenis perhatian HP belum sinkron/admin ubah absen/bulan belum dikunci, kotak Konfirmasi data admin, Perlu evaluasi (BAD), grafik telat 7 hari. Menu owner: app 4 item (+Konfirmasi), mockup 11 (tambahan: Log admin, Kunci periode, Role & admin, Pengaturan, Cabang & shift, Laporan bulanan, Data absensi).

**KOREKSI pemeriksaan 8 dan penyimpangan 10 (2026-10-06):** tombol absen HP toko sudah sesuai mockup 01 (bukti visual berdampingan di `docs/audit/visual/01_*`); yang tetap beda: kartu "Hari ini tidak masuk", teks kecil di bawah judul tombol, dan jadwal shift.

**8. Layar lain.**
- Beranda admin: app hampir kosong (judul, catatan, Home, Log out); mockup berisi Hari ini, daftar belum absen, Menunggu konfirmasi, Perlu evaluasi.
- Menu admin: 4 item vs 10 (daftar di baris 50).
- Layar Karyawan: ada filter/tombol tambah; mockup memuat detail ketuk-nama (ubah data, lepas ikatan HP) dan label shift per baris.
- HP toko (01): ABSEN MASUK, ABSEN PULANG, LEMBUR, "Masuk sebagai Admin" ada; kartu "Hari ini tidak masuk", pembuka jadwal shift, dan IZIN **tidak ada** di layar (mockup 01 juga tidak punya tombol IZIN; tombolnya: Shift 1 aktif, ABSEN MASUK, ABSEN PULANG, Hari ini tidak masuk, LEMBUR, Masuk sebagai Admin). Tombol "ADMIN di pojok": pada mockup berupa tombol "Masuk sebagai Admin" di bawah, sama dengan app.
- Layar awal/jenis HP: lihat 78 dan 79. Login: lihat 29.

## 5. Kelayakan konversi otomatis (Langkah 4)

**(a) Bisa otomatis sebagian besar?** Ya untuk markup dan CSS. Fakta: mockup = HTML statis, gaya **inline** pada tiap elemen, tanpa kelas, tanpa skrip; font Google Fonts yang sama dengan app (Oswald, Poppins); gambar relatif (`../assets/logo.png`, `orang_transparan.png`; app sudah memiliki berkas yang sama di `assets/`); wadah tetap 390 × 844 px; sebagian elemen memakai posisi absolut (misalnya login). Teks contoh (Budi Santoso, 07:41, dst.) tertanam langsung.

**(b) Tetap ditulis tangan:** semua logika (pemanggilan server, validasi, timer, kamera), navigasi dan riwayat browser, pengikatan data (ganti teks contoh dengan elemen ber-ID), keadaan (nonaktif, pemuatan, galat), dan keputusan sadar yang berbeda dari mockup (PIN 5 angka, login tanpa ikatan HP, tanggal dd/MM/yy). Layar yang membutuhkan data/aksi baru (49 layar BELUM ADA) butuh aksi server dulu.

**(c) Pendekatan.** Tulis satu skrip konversi (Perl/PowerShell, tanpa dependensi): per mockup ambil isi `<body>`, ubah gaya inline yang sama menjadi kelas hasil-generate, ubah wadah 390 × 844 menjadi lebar penuh (`max-width: 430px`, `min-height: 100dvh`), sisipkan sebagai `<div id="layarXxx" class="layar">` ke `index.html`. Lalu tangan menambah `id` pada elemen yang perlu logika dan menyambungkan ke fungsi yang sudah ada. Layar yang sudah berfungsi (absen, foto, login) diganti **satu per satu**, bukan serentak.

**(d) Perkiraan pekerjaan tampilan SAJA** (tanpa server baru, tanpa logika baru; dasar: pekerjaan bagian Gelombang 2 yang menghasilkan 3–5 layar lengkap per sesi, dan layar tampilan-saja jauh lebih ringan; 75 layar disentuh = 26 BEDA + 49 BELUM ADA):
- Skrip konversi + uji coba: 1 sesi.
- HP toko (21 layar): 2 sesi.
- HP pribadi (21 layar): 2–3 sesi.
- Admin (23 layar): 3 sesi.
- Owner (15 layar): 2 sesi.
- Total sekitar **10–11 sesi Claude Code Sonnet**. Ini perkiraan kasar; tingkat kepastian rendah sampai skrip konversi dicoba pada 3–4 layar.

**(e) Risiko.** `index.html` adalah satu berkas 3.191 baris dengan satu blok skrip besar yang menyambung ke elemen lewat ID; mengganti markup tanpa mempertahankan ID memutus sambungan ke server (absen masuk/pulang, foto, login) tanpa kesalahan yang terlihat jelas. Setiap layar yang diganti harus dites ulang di HP (kamera, GPS, sesi). Selain itu `sw.js` (`VERSI_CACHE`) harus dinaikkan tiap perubahan. Risiko kedua: mockup memuat aturan lama (PIN 4 angka, password 6 angka, ikatan HP, password awal 123456) yang tidak boleh ikut terbawa lewat konversi otomatis.

**Penyimpanan warna dan ukuran dasar.** **Tersebar**, bukan satu tempat. `index.html` tidak memiliki variabel CSS (`--...` = 0); kode warna ditulis langsung sebanyak ±179 kali (#141111 ±68, #FFFFFF ±44, #FFD62E ±28, #B91C1C ±25, #1F8A4C ±18, #333438 ±17, dst.). Ada pula konstanta `TEMA` di JavaScript (kuning, hijau, merah, hitam) untuk `theme-color`. Dua merah dipakai berbeda (#B91C1C dan #D92A22). Akibatnya mengubah **satu warna global** berarti cari-ganti di banyak tempat (murah secara teknis, tetapi perlu hati-hati karena satu kode dipakai untuk beberapa fungsi). Ukuran dasar (tinggi tombol, radius) juga tersebar di tiap kelas. Mengubah ke variabel CSS adalah pekerjaan kecil tersendiri (sekitar 1 sesi) yang membuat perubahan global berikutnya murah.

## 6. Ketergantungan antar layar

- Beranda HP pribadi (30–32) → Izin/Cuti (41, 23) → Konfirmasi admin (52) → Cek surat dokter (22).
- Tukar shift (42, 43, 56) → Jadwal shift (55) → Pola shift (57, 59) → Konfirmasi tukar shift (52) → data `izin`/`akun` di sheet.
- Report (36–40) → rekap bulanan (sheet `rekap_bulanan`) + label EXCELLENT/GOOD/BAD → Dashboard admin (68–70) dan Laporan owner (81–82).
- Pengenalan wajah (03, 04, 08, 33, 34, 62) → data wajah → pendaftaran karyawan (62, 63).
- Peringatan dobel/lupa absen (05, 13, 18, 19) → Detail konflik (53) → Absen manual (54) → Edit absen (65).
- Pop-up bulanan (10, 11, 14, 15, 17, 35) memerlukan statistik "Bulan ini" dan sisa cuti dari server.
- Owner: Kunci periode (76) → Konfirmasi selesai (28/52) → Laporan bulanan (81–82) dan ekspor Excel.

## 7. Hal yang tidak bisa dipastikan

- Semua status berbasis kode/markup, bukan render visual 390 px: perbedaan jarak, warna, font, dan posisi tidak tercakup.
- Penyebab owner tidak bisa ACC (lihat pemeriksaan 5): tidak direproduksi, hanya hipotesis.
- Status 12, 16, 20, 47 (TDP): perlu dirender untuk memastikan.
- Perkiraan jumlah sesi: kasar.
