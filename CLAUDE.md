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
   - `UMUM`: jatah_cuti=6, jendela_absen_menit=60, toleransi_pulang_menit=5, batas_telat_bad=5, batas_pulang_awal_bad=5, batas_izin_biasa_bad=3, simpan_foto_bulan=2, simpan_absensi_bulan=3, batas_isi_alasan_detik=10, libur_minggu_NGW=TRUE (toko Ngawi tutup hari Minggu; per cabang, nama diikuti kode cabang 3 huruf), ukuran_panduan_wajah=60, batas_izin_lewat_hari=2, sesi_owner_hari=7, sinkron_karyawan_menit=30
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
- Semua aksi selain `ping` wajib menyertakan token HP toko terdaftar atau sesi login yang sah (lihat `docs/keputusan-desain.md` bagian 11). Saat ini `daftar_karyawan` dan `absen_masuk` di `apps-script/api.gs` BELUM mengecek token apa pun — siapa saja yang tahu URL Web App bisa memanggilnya. Ini cukup untuk tes/pengembangan, tapi harus ditutup dengan sistem token (sheet `sesi`) sebelum dipakai di toko sungguhan.
- Akun owner `OWN01` belum dibuat. Saat dibuat nanti, WAJIB lewat fungsi khusus di editor Apps Script yang meminta password diketik interaktif saat fungsi dijalankan (`Browser.inputBox` atau sejenisnya) — password owner tidak boleh ditulis sebagai teks di kode `apps-script/` manapun (kode itu disalin ke GitHub yang publik).

## Rencana tahap 1 (kerjakan berurutan)
1. Spreadsheet 8 sheet + data contoh 3 karyawan
2. Apps Script: terima absen dan tulis ke sheet `absensi`
3. Halaman HP toko sederhana: pilih nama + PIN + foto -> tersimpan
4. Simpan foto ke Drive: Absensi_Foto/Cabang/Tahun/Bulan/ID_Nama/DDMMYY_MASUK1_HHMM.jpg
5. Pop-up tepat waktu / telat + layar alasan telat
6. Pengenalan wajah
7. Peringatan dobel, lupa absen, pulang awal, lembur
