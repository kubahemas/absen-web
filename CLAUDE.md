# Proyek: Aplikasi Absensi Kubah Emas Indonesia

## Tentang pemilik proyek
- Pemilik proyek adalah pemula (belum bisa koding). Selalu jelaskan dengan bahasa Indonesia yang sederhana dan langsung.
- Kerjakan SATU langkah kecil per permintaan. Setelah selesai, jelaskan cara mengetesnya, lalu tunggu konfirmasi sebelum lanjut.
- Jangan menambah fitur di luar yang diminta. Kalau ada yang kurang jelas, tanya dulu.
- Beri tahu dengan jujur kalau ada keputusan yang berisiko.

## Acuan desain lengkap
- Keputusan desain paling detail dan terbaru ada di `docs/keputusan-desain.md` (aturan tampilan/navigasi, HP toko, HP pribadi, admin cabang, owner, aturan data & perhitungan, format export Excel, keamanan & teknis). **Kalau isinya bertentangan dengan ringkasan di CLAUDE.md ini, `docs/keputusan-desain.md` yang berlaku.**
- Acuan tampilan: `docs/mockup/BUKA INI - Galeri Mockup.html` (versi final). Acuan format file export: `docs/contoh-export/` (contoh .xlsx bulanan & harian).
- Beberapa poin besar yang ada di sana dan belum masuk ringkasan CLAUDE.md ini: pola shift tetap/bergilir, tukar & pindah shift antar karyawan, sistem sesi login (termasuk sesi owner & token HP toko lewat sheet `sesi`), label performa EXCELLENT/GOOD/BAD, export Excel bulanan & harian (aplikasi tidak pernah menyimpan angka gaji), serta aturan detail navigasi/pop-up/kualitas foto di HP toko. Baca filenya langsung untuk detail sebelum mengerjakan bagian terkait.

## Susunan teknis
- Database: Google Sheets (9 sheet).
- Backend: Google Apps Script, di-deploy sebagai Web App. Semua baca-tulis data lewat sini.
- Frontend: HTML + CSS + JavaScript biasa (tanpa framework), PWA, di-hosting di GitHub Pages (HTTPS wajib untuk kamera).
- Foto: Google Drive milik owner.
- Kode Apps Script disimpan juga di folder `apps-script/` proyek ini sebagai salinan; pemilik menyalinnya manual ke editor Apps Script.

## Aturan keamanan (wajib)
- Repo GitHub bersifat publik. JANGAN menaruh PIN, password, token, atau ID spreadsheet rahasia di kode frontend.
- PIN dan password disimpan sebagai hash SHA-256 di sheet `akun` (kolom `pw_hash`, `pin_hash`), dihitung di Apps Script dengan garam ganda: `teks + id + KODE_RAHASIA`. `KODE_RAHASIA` disimpan di Script Properties milik proyek Apps Script (Project Settings > Script Properties) — TIDAK PERNAH ditaruh di sheet atau di GitHub.
- Di sheet `akun`, kolom `pw_hash`, `pin_hash`, `data_wajah`, `id_hp` dikelompokkan (grouped) dan disembunyikan secara default supaya tidak terlihat sekilas saat sheet dibuka — tetap bisa dibuka manual lewat tanda "+" di atas kolom kalau perlu dicek.
- Hanya akun owner yang punya akses ke Spreadsheet dan folder Drive.

## Aturan membuat layar baru (wajib)
- Setiap layar baru HARUS menyalin CSS dari file mockup yang sesuai di `docs/mockup/layar/`, bukan menggambar ulang dari nol.
- Halaman ini sudah PWA (`manifest.json`, `sw.js`). Setiap kali file halaman (index.html, config.js, dll.) diubah, naikkan nomor `VERSI_CACHE` di `sw.js` supaya HP memuat versi baru. Kalau menambah file halaman baru, daftarkan juga di `FILE_HALAMAN` di `sw.js`. Panggilan ke Apps Script tidak boleh di-cache.

## Desain
- Blueprint lengkap ada di Claude Docs milik pemilik; ringkasan aturan inti ada di file ini. Kalau butuh detail, tanyakan ke pemilik.
- Warna: kuning #FFD62E (latar), abu seragam #333438, hitam #141111, hijau #1F8A4C (ABSEN MASUK, tepat waktu), merah #D92A22 / #B91C1C (ABSEN PULANG, telat, peringatan, pelanggaran). Merah hanya untuk peringatan/pelanggaran, kecuali tombol ABSEN PULANG.
- Font: Oswald (judul, tombol besar), Poppins (teks).
- Logo dan foto karyawan ada di folder `assets/`.

## Struktur data (9 sheet)

Sumber kebenaran kolom = file `apps-script/setup_spreadsheet.gs`. Kalau mau ubah kolom, ubah di file itu dulu lalu salin bagian ini. Nama kolom dibuat singkat; di sheet lain selain `akun`, kolom yang berisi ID karyawan selalu bernama `karyawan`.

Singkatan yang dipakai: `st`=status, `ket`=keterangan, `mnt`=menit, `plg`=pulang, `aju`=pengajuan.

1. `akun`: id (kunci unik, tidak pernah berubah), nama (sekaligus username, tidak boleh kembar), panggilan (tampil di pop-up), cabang, role (KARYAWAN/ADMIN/OWNER/PERANGKAT), shift, pw_hash, pin_hash, data_wajah, id_hp, mulai_kerja, jatah_cuti, aktif, ganti_pw, ganti_pin, pw_awal_sampai, salah_login, terkunci, setuju_wajah, pola_shift (TETAP/BERGILIR), urutan_shift (contoh "1,2"), ganti_setiap (1M/2M/1B/3B), mulai_pola, gps_daftar (untuk akun PERANGKAT)
   - `pw_hash`, `pin_hash`, `data_wajah`, `id_hp` dikelompokkan & disembunyikan (lihat "Aturan keamanan").
2. `shift`: cabang, no, nama, masuk, tutup, pulang, toleransi
3. `kalender`: tanggal, cabang, karyawan (kosong = semua), isi (LIBUR MINGGU / LIBUR TANGGAL MERAH / LIBUR KHUSUS / nomor shift)
4. `pengaturan`: kategori, nama, nilai, kelompok, maks — kategori yang dipakai:
   - `UMUM`: jatah_cuti=6, jendela_absen_menit=60, toleransi_pulang_menit=5, batas_telat_bad=5, batas_pulang_awal_bad=5, batas_izin_biasa_bad=3, simpan_foto_bulan=2, simpan_absensi_bulan=3, batas_isi_alasan_detik=10, libur_minggu_NGW=TRUE (toko Ngawi tutup hari Minggu; per cabang, nama diikuti kode cabang 3 huruf), ukuran_panduan_wajah=60, batas_izin_lewat_hari=2, sesi_owner_hari=7, sinkron_karyawan_menit=30, akurasi_maks_m=100 dan radius_daftar_m=100 (batas akurasi GPS dan jarak maksimal HP ke toko saat mendaftarkan HP toko; kalau barisnya tidak ada, server memakai bawaan 100)
   - `CABANG`: nama = nama cabang, nilai = kode 3 huruf (contoh Ngawi -> NGW).
   - `LOKASI`: nama = nama cabang (persis sama dengan `akun.cabang`), nilai = koordinat toko "lat,lng" (contoh `-7.4044,111.4462`). Kalau barisnya tidak ada atau tidak valid, pendaftaran HP toko DITOLAK. Sel nilai harus berformat Plain text.
   - `JENIS_IZIN` (kolom `kelompok` menandai jenis izin): Sakit (biasa; jadi khusus kalau ada surat dokter — ditentukan saat pengajuan, bukan nilai tetap di sini), Keperluan pribadi (biasa), Menikah (khusus, maks 3), Keluarga meninggal (khusus, maks 2), Istri melahirkan (khusus, maks 2), Cuti (cuti)
   - `ALASAN_TELAT`: Macet, Hujan, Kendaraan bermasalah, Urusan keluarga, Sakit, Lainnya
   - `ALASAN_PULANG_AWAL`: Sakit, Urusan keluarga, Disuruh atasan, Lainnya
   - `KEPERLUAN_LUAR`: Survey, Pengiriman, Pemasangan, Service, Penagihan, Ketemu klien, Lainnya
   - `PEKERJAAN_LEMBUR`: Stok opname, Bongkar muat, Penataan barang, Melayani pelanggan, Menyelesaikan tugas luar, Lainnya
   - Urutan baris = urutan tampil di aplikasi. "Lainnya" selalu paling bawah.
5. `absensi`: 1 baris per karyawan per hari — tanggal, karyawan, nama, cabang, shift, masuk, st_masuk, telat_mnt, ket_masuk, foto_masuk, gps_masuk, cara_masuk, acc_masuk, pulang, st_pulang, lembur, ket_pulang, foto_pulang, gps_pulang, cara_pulang, acc_pulang, st_hari, tanda (termasuk nilai SHIFT_BEDA), id_masuk, id_pulang
6. `izin`: id, grup, karyawan, jenis (termasuk TUKAR_SHIFT, PINDAH_SHIFT), kelompok, mulai, selesai, hari, ket, lampiran, diajukan, telat_aju, status, oleh, diputus, rekan, status_rekan (MENUNGGU/SETUJU/TOLAK/BATAL), shift_asal, shift_tujuan
7. `rekap_bulanan`: bulan, karyawan, nama, cabang, hari_kerja, masuk, telat, telat_mnt, plg_awal, alpha, izin, izin_khusus, cuti, sisa_cuti, lembur_1 (<1 jam), lembur_2 (1–2 jam), lembur_3 (>2 jam), label
8. `log`: waktu, jenis, oleh, cabang, aksi, target, id, sebelum, sesudah, alasan
9. `sesi`: id_sesi, akun, perangkat, token_hash, dibuat, terakhir_aktif, kedaluwarsa, aktif

## Format tanggal & waktu
- Kolom tanggal (tanpa jam), format `yyyy-mm-dd`: `kalender.tanggal`, `absensi.tanggal`, `izin.mulai`, `izin.selesai`, `akun.mulai_kerja`.
- Kolom waktu (tanggal+jam), format `yyyy-mm-dd HH:mm`: `akun.pw_awal_sampai`, `izin.diajukan`, `izin.diputus`, `log.waktu`.
- Kolom jam-saja (tanpa tanggal), format `HH:mm`: `shift.masuk/tutup/pulang`, `absensi.masuk/pulang`.
- Kolom bulan, format `yyyy-mm` (contoh `2026-09`): `rekap_bulanan.bulan`.
- **Penting (bug yang pernah kejadian):** Google Sheets otomatis mengubah teks yang terlihat seperti tanggal (mis. `"2026-09-29"`) menjadi nilai tanggal asli begitu ditulis lewat `setValues`/`appendRow`. Jadi saat kolom tanggal/waktu dibaca lagi lewat Apps Script, isinya bisa berupa objek Date, bukan teks yang sama persis — perbandingan `=== "2026-09-29"` bisa diam-diam selalu salah. Kode yang membandingkan kolom tanggal/waktu WAJIB menormalkan nilainya dulu (lihat fungsi `sebagaiTanggalTeks()` di `apps-script/api.gs` sebagai contoh) sebelum dibandingkan sebagai teks.

## Aturan inti (shift 1 sebagai contoh)
- Absen masuk dibuka 60 menit sebelum jam masuk. Masuk 07:45:59 masih HADIR, 07:46:00 TELAT.
- Jam absen dicatat saat tombol ditekan, dari jam server saat online.
- Pulang sampai 16:00:59 = PULANG AWAL (wajib alasan + ACC). 16:01–16:29 = PULANG AWAL tanpa ACC. 16:30–16:35 = PULANG NORMAL. Tombol LEMBUR aktif mulai 16:36.
- Lembur: <1 jam, 1–2 jam, >2 jam; wajib ACC admin. Aplikasi tidak menghitung rupiah.
- Telat dan pulang awal wajib isi alasan dalam 10 detik (jika tidak: TIDAK DIISI) — detail lengkap di bagian "Alur absen & pop-up".
- PIN 4 angka, password 6 angka; bukan angka berurutan/kembar. Password awal 123456 (berlaku 24 jam), PIN awal 1234 setelah reset.

## Format ID (tetap)
- Karyawan: `K` + 3 angka, contoh `K001`. Tidak pernah dipakai ulang meski karyawan keluar/nonaktif.
- Owner: `OWN` + 2 angka, contoh `OWN01`.
- Kode cabang: 3 huruf, contoh `NGW` = Ngawi. Kolom `cabang` di sheet tetap berisi nama lengkap cabang (bukan kodenya) — kode cabang cuma dipakai untuk menyusun ID lain di bawah ini.
- HP toko: `HPT-{kode cabang}-{2 angka}`, contoh `HPT-NGW-01`.
- HP pribadi (`akun.id_hp`): `HPP-` + 8 karakter acak, contoh `HPP-7K2QX9MB`.
- Absen: `{M/P/L}-{id karyawan}-{YYMMDD}-{HHMMSS}-{kode perangkat}`, dibuat di HP saat tombol ditekan. `M`=masuk, `P`=pulang, `L`=lembur. Kode perangkat: `T`+nomor HP toko tanpa nol di depan (dari `HPT-NGW-01` dst. -> `T1`, `T2`, ... `T10`), `P`=HP pribadi, `A`=absen manual oleh admin. Contoh: `M-K001-260928-074512-T3`.
- Pengajuan izin: `IZN-{tahun}-{4 angka}-{huruf}`, contoh `IZN-2026-0001-A`. Kalau satu pengajuan mencakup beberapa hari, semuanya berbagi `izin.grup` = `IZN-{tahun}-{4 angka}` (tanpa huruf akhir).

## Akun & hak akses
- Username = `akun.nama` (tidak boleh kembar, tidak dibedakan huruf besar/kecil). `akun.panggilan` cuma untuk tampilan pop-up. `akun.id` kunci unik yang tidak pernah berubah; `akun.nama` boleh diubah kapan saja.
- Salah login 5 kali berturut-turut -> `akun.terkunci` = TRUE (kolom `akun.salah_login` mencapai 5), cuma admin yang bisa membuka kuncinya lagi.
- Menu admin mengikuti role akun yang sedang login, di perangkat apa pun (HP toko atau HP pribadi):
  - Di HP pribadi: ada tombol "Menu admin" di bawah halaman beranda.
  - Di HP toko: password TIDAK disimpan di perangkat; sesi admin keluar otomatis setelah 2 menit tidak disentuh, atau begitu kembali ke layar absen.
- Role ADMIN cuma bisa diberikan oleh owner. Kalau admin sendiri butuh izin/cuti, itu ditangani langsung oleh owner. Admin tidak lembur (tombol lembur tidak berlaku untuk role ADMIN).

## HP toko
- Saat HP baru pertama kali dibuka: pilih salah satu, HP TOKO atau HP PRIBADI.
- Mendaftarkan HP sebagai HP toko: verifikasi username + password admin cabang (cuma untuk verifikasi identitas, bukan login penuh). Cabang HP ikut cabang admin yang mendaftarkan. Lokasi GPS saat pendaftaran dicatat dan tersimpan di sheet `log`.
- Owner bisa melihat semua HP toko yang terdaftar dan bisa menonaktifkannya.

## Alur absen & pop-up
- Jam absen dicatat saat tombol ditekan (bukan saat data sampai ke server), pakai jam server saat online.
- Pop-up beda tampilan per kasus: tepat waktu (hijau, animasi meriah), telat (merah), pulang (hitam), pulang awal, lembur.
- Telat, dan pulang awal sampai jam tutup toko (16:00 untuk shift 1): wajib tekan "ISI ALASAN" dalam 10 detik, kalau tidak ditekan -> tercatat "TIDAK DIISI". Layar isi alasan otomatis kembali sendiri kalau 30 detik tidak disentuh.
- Keterangan untuk lembur, telat, pulang awal, dan absen luar: pilihan dari daftar di sheet `pengaturan` + boleh ketik manual. Kolom ketik WAJIB diisi kalau pilih "Lainnya"; untuk absen luar, kolom ketik diisi tujuan/nama klien.
- Karyawan sudah absen lembur tapi masih kerja: tombol "Revisi lembur" memperbarui jam lembur ke waktu sekarang (perlu ACC ulang admin). Kalau sebelumnya karyawan pulang biasa (bukan lembur): tombol yang muncul "Ganti jadi lembur".
- Kalau beberapa peringatan berlaku sekaligus: pop-up utama muncul dulu, baru layar peringatan lanjutan (satu per satu, bukan bersamaan).
- Absen yang menimbulkan konflik dan tidak jelas milik siapa: dihapus dari sheet `absensi`, tapi salinannya tetap disimpan di sheet `log` (tidak pernah benar-benar hilang).
- Lembur yang terjadi di luar jam kerja terjadwal (misal dijadwalkan manager di luar sistem) tidak dicatat sistem — dibayar tunai langsung oleh manager, di luar aplikasi.

## Tampilan data (laporan & log)
- Report (rekap karyawan/owner): semua angka dalam satuan hari; khusus telat, ditambahkan juga total menitnya (bukan cuma jumlah hari telat). Detail ditampilkan sebagai tabel, diurutkan dari tanggal terbaru di atas.
- Log owner ditampilkan per kategori; detail tiap kategori berupa tabel dengan filter di judul kolom (bisa difilter berdasarkan waktu, admin, cabang, karyawan).

## Belum aman dipakai karyawan sungguhan (wajib dikerjakan sebelum go-live)
- Token HP toko SUDAH berlaku (Paket 2A): `daftar_karyawan`, `absen_masuk`, `simpan_alasan` wajib menyertakan token (POST). Tiap HP toko = satu baris `akun` role PERANGKAT (id `HPT-{kode cabang}-{nn}`); yang disimpan di `pw_hash` hanya hash token (garam `TOKEN_HP` + `KODE_RAHASIA`), token asli tidak pernah disimpan. Cabang selalu ditentukan server dari baris HP itu. Kode cabang dibaca dari sheet `pengaturan` (kategori `CABANG`, nama = nama cabang, nilai = kode 3 huruf).
- Absen pulang SUDAH ada (Paket 3), semua dihitung di server dari jam server dan sheet `shift` (shift dari baris `absensi` hari itu): aksi `absen_pulang` (id, pin, jenis `PULANG`/`PULANG_LEMBUR`) dan `simpan_pulang`. Status di `st_pulang`: `PULANG CEPAT` (sebelum jam pulang; alasan wajib dari `ALASAN_PULANG_AWAL`; `acc_pulang`=MENUNGGU kalau sebelum jam tutup+1 menit), `PULANG NORMAL`, `LEMBUR DI TOKO` (mulai jam pulang+toleransi+1 menit; keterangan wajib dari `PEKERJAAN_LEMBUR`; `acc_pulang`=MENUNGGU). Kolom `lembur` berisi `tingkat|menit` (contoh `2|75`; tingkat 1 s/d 60 menit, 2 s/d 120 menit, 3 lebih; batas dihitung dari jam pulang shift, tidak ada rupiah). Pulang cepat/lembur BARU tersimpan setelah alasan/keterangan dikirim (jam yang dicatat = jam tiket, yaitu saat tombol ditekan; ditahan di cache 5 menit); kalau tidak diisi, tidak ada yang tersimpan. Logika ada di fungsi murni `tentukanStatusPulang()`; tes otomatis: jalankan `tesServer()` di editor Apps Script (tidak menulis ke sheet).
- Lembur ulang: karyawan yang sudah PULANG NORMAL boleh menekan LEMBUR ("Ganti jadi lembur"), yang sudah LEMBUR menekan LEMBUR lagi = "Revisi lembur" (jam diperbarui, hitung ulang, ACC kembali MENUNGGU). Nilai sebelum/sesudah dicatat di `log` (aksi `GANTI_JADI_LEMBUR` / `REVISI_LEMBUR`). Tetap ditolak: ABSEN PULANG kedua kali, lembur setelah PULANG CEPAT, lembur oleh ADMIN.
- **Jam absen = saat TOMBOL ditekan (tiket waktu).** Begitu ABSEN MASUK/PULANG/LEMBUR ditekan, halaman memanggil `tiket_waktu` (token HP toko, jenis MASUK/PULANG/LEMBUR) di latar belakang; server membalas tiket = jam server + jenis + cabang + masa berlaku, ditandatangani HMAC-SHA256 dengan `KODE_RAHASIA` (+ `|tiket`). `absen_masuk` dan `absen_pulang` WAJIB membawa tiket; server memverifikasi tanda tangan, jenis, cabang, masa berlaku, lalu menghitung semua status dari jam di tiket (jam dari client tidak pernah dipercaya). Tiket sekali pakai (CacheService, dihabiskan hanya saat absen diterima/ditahan menunggu keterangan; PIN salah tidak menghabiskan tiket, kunci 5x tetap jalan). Masa berlaku: `pengaturan` UMUM `tiket_absen_menit` (bawaan 3). Salah/kedaluwarsa: "Waktu habis, tekan tombolnya lagi".
- **Catatan cache token:** hasil validasi token HP toko disimpan di CacheService selama **60 detik** (kunci `hp_` + hash token = isi `pw_hash` baris HP itu). Menghapus baris HP toko atau mengubah `aktif` jadi FALSE secara manual di sheet baru berlaku maksimal 60 detik kemudian. Tombol **Nonaktifkan** di beranda owner menghapus cache itu langsung, jadi HP langsung ditolak.
- **Sesi login (sheet `sesi`) SUDAH ada (Paket 2B)** untuk owner dan admin di HP toko. Tiket sesi = 3 UUID acak; yang disimpan di sheet hanya hash (garam `SESI` + `KODE_RAHASIA`), password tidak pernah disimpan di perangkat. Kolom `perangkat` berisi `idPerangkat|label` (id acak dibuat di browser). Kalau spreadsheet lama belum punya sheet `sesi`, `api.gs` membuatnya otomatis (kolom sesuai `setup_spreadsheet.gs`). HP pribadi belum ada.
- **Akun owner `OWN01`:** diisi manual oleh pemilik satu baris di sheet `akun`: `id`=OWN01, `nama`=owner, `role`=OWNER, `aktif`=TRUE, `ganti_pw`=TRUE, `pw_hash` KOSONG (kolom lain boleh kosong). Login pertama di aplikasi (layar HP baru > "Masuk sebagai Owner"): isi username `owner` saja, aplikasi meminta password baru (minimal 8 karakter, wajib huruf dan angka, bukan `123456`, bukan sama dengan username), lalu `pw_hash` terisi dan `ganti_pw` jadi FALSE. Jalur "pw_hash kosong" HANYA berlaku untuk role OWNER (aktif, ganti_pw TRUE); role lain ditolak; kalau `pw_hash` sudah terisi, jalur ini ditolak. **Sebelum password pertama diatur, siapa pun yang tahu username `owner` bisa mengaturnya — isi baris OWN01 lalu langsung login.** Tidak ada password di kode.
- **Pemulihan owner lupa password:** di sheet `akun` baris OWN01, kosongkan sel `pw_hash` dan set `ganti_pw` = TRUE (juga `salah_login` = 0 kalau sedang ditahan). Lalu login lagi dengan username `owner`, aplikasi meminta password baru; semua sesi lama dicabut.
- Aturan owner: sesi 7 hari (`sesi_owner_hari`), tidak ada batas jumlah perangkat, salah password 5x = login ditahan 15 menit (penahanan disimpan di Script Properties `tahan_OWN01`, hitungan salah di `akun.salah_login`; BUKAN terkunci permanen), login dari perangkat baru dicatat di `log` (`LOGIN_PERANGKAT_BARU`) dan muncul di "Perlu perhatian", "Keluarkan semua perangkat" mencabut semua sesi owner, ganti password mengeluarkan perangkat lain. Pendaftaran HP toko baru muncul di "Perlu perhatian" owner (informasi saja, tanpa persetujuan).
- Lebih dari satu owner: setiap baris role OWNER berdiri sendiri (jalur login pertama, hitungan salah, penahanan `tahan_<ID>`, sesi, "Keluarkan semua perangkat", catatan perangkat baru semuanya per akun). Username yang tidak ada diperlakukan SAMA dengan password salah (pesan sama, dan ikut ditahan 15 menit setelah 5x lewat CacheService).
- "Perlu perhatian" owner (aksi `owner_perhatian`, `owner_perhatian_daftar`, `owner_tandai_dibaca`): sumber `log` (`DAFTAR_HP_TOKO`, `LOGIN_PERANGKAT_BARU`, 30 hari), item sama untuk semua owner; penanda "terakhir dibaca" per owner di Script Properties `dibaca_<ID owner>` (log tidak pernah diubah). Kartu "Hari ini" (`owner_hari_ini`, filter cabang/shift opsional): sudah masuk, telat, sudah pulang, menunggu ACC (`acc_pulang`=MENUNGGU); tidak ada angka "belum absen". `owner_daftar_hp`: HP toko (yang `aktif`=FALSE disembunyikan kecuali `tampilkan_nonaktif`). `ubah_nama_hp`: owner = HP mana pun; admin = hanya HP toko yang dipegangnya (token HP + sesi admin, cabang harus sama); hanya kolom `akun.nama` yang berubah (1 sampai 40 karakter setelah dipangkas spasi, ditulis sebagai teks; nama BOLEH KEMBAR, hanya ID yang unik; id, token, aktif tidak tersentuh), tercatat di log `UBAH_NAMA_HP_TOKO`, dan cache token baris itu dihapus supaya nama di HP toko berubah langsung.
- Layar owner (halaman): beranda = judul "Hari ini", kartu Hari ini (4 angka; dropdown Shift selalu, dropdown Cabang hanya kalau cabang > 1), kartu "Perlu perhatian" (3 item terbaru yang belum dibaca satu baris per item, "Lihat semua (N)" membuka layar daftar terpisah, "Tandai dibaca"; kartu hilang kalau tidak ada yang belum dibaca). Menu dari badge "Owner" di kanan atas: Kelola HP toko, Keluarkan semua perangkat, Ganti password, Log out (jangan menambah item menu yang belum punya fungsi). Kelola HP toko: filter cabang, saklar "Tampilkan nonaktif" (bawaan mati), tiap HP punya Nonaktifkan dan Ubah nama. Admin di HP toko punya tombol kecil "Ubah nama HP ini" (hanya HP yang dipegang). Nama HP boleh kembar; hanya ID yang unik.
- Aturan tampilan 360 px: teks tombol tidak boleh terpecah dua baris (`white-space: nowrap` pada kelas tombol).
- Admin di HP toko: tombol "Masuk sebagai Admin" (username + password admin cabang HP itu), keluar otomatis 2 menit tanpa sentuhan (dihitung ulang tiap sentuhan, hanya di HP toko) dan saat kembali ke layar absen; sesi server berakhir sendiri paling lama 10 menit. Beranda admin hanya berisi yang sudah ada fungsinya (Home, Log out).

## Rencana tahap 1 (kerjakan berurutan)
1. Spreadsheet 8 sheet + data contoh 3 karyawan
2. Apps Script: terima absen dan tulis ke sheet `absensi`
3. Halaman HP toko sederhana: pilih nama + PIN + foto -> tersimpan
4. Simpan foto ke Drive: Absensi_Foto/Cabang/Tahun/Bulan/ID_Nama/DDMMYY_MASUK1_HHMM.jpg
5. Pop-up tepat waktu / telat + layar alasan telat
6. Pengenalan wajah
7. Peringatan dobel, lupa absen, pulang awal, lembur
