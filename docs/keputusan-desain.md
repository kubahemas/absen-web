# Keputusan Desain Terbaru – Absen Web Kubah Emas

Dokumen ini melengkapi CLAUDE.md. Kalau ada yang bertentangan, dokumen ini yang berlaku.
Acuan tampilan: `docs/mockup/BUKA INI - Galeri Mockup.html`. Acuan file export: `docs/contoh-export/`.

## 1. Aturan tampilan umum
- Merah hanya untuk peringatan/pelanggaran, kecuali tombol ABSEN PULANG.
- Layar HP genggam (HP pribadi, admin, owner): tinggi satu layar, isi panjang digulir di tengah, bar bawah selalu terlihat: kotak `‹` 56px di kiri + tombol utama melebar. Tanpa tombol utama: satu tombol lebar "Home" atau "‹ Back".
- Label navigasi singkat: "Home" (ke beranda), "‹ Back" (satu layar). Tombol perintah: "Simpan", "Kirim".
- Layar dengan tombol perintah: tombol menempel di bawah (ada ruang kosong di tengah), bukan menggantung setelah isi.
- Scroll bar disembunyikan; gulir dengan usap.
- Teks keterangan di layar sesingkat mungkin.
- Tanggal di tabel detail: 2 digit + singkatan bulan, tanpa hari ("05 Sep"). Durasi telat: "13 min". Jumlah hari: "12 Hari".
- Semua tabel detail diurutkan tanggal terbaru di atas.

## 2. Navigasi dan tombol Back
- Setiap pergantian layar dicatat ke riwayat browser, jadi Back HP kembali satu layar.
- Layar utama HP toko: Back diabaikan (tetap di layar absen).
- Pop-up/layar wajib (telat, pulang awal, alasan): Back tidak berpengaruh.
- Pindai wajah dan PIN: Back = batal.
- Setiap layar selain layar utama punya tombol kembali yang terlihat (untuk iPhone).
- Pop-up yang menutup sendiri (tepat waktu, pulang, lembur, absen luar, peringatan lanjutan): tanpa tombol X, ketuk di mana saja untuk menutup, atau tertutup sendiri setelah 4 detik.
- Pop-up wajib: tanpa tombol tutup apa pun.
- Jendela informasi (detail, daftar lengkap): tombol tutup/kembali yang cukup besar.

## 3. HP toko
- Layar utama: logo, cabang, status Online, label "Shift 1 aktif ▾" (ketuk = daftar jadwal hari ini, hanya informasi), jam besar dengan detik kecil mengikuti jam server, tombol ABSEN MASUK (hijau) dan ABSEN PULANG (merah) dengan bentuk sama, kartu "Hari ini tidak masuk", tombol LEMBUR (hitam, lebih kecil, di bawah, aktif mulai 16:36).
- Kartu "Hari ini tidak masuk": di antara ABSEN PULANG dan LEMBUR, latar transparan, bingkai putus-putus, isi nama panggilan saja (tanpa jenis izin), sumber izin/cuti (disetujui maupun proses) dan jadwal libur. Maksimal 2 baris, kelebihan jadi "+N lainnya", ketuk untuk daftar lengkap. Karyawan yang belum absen tidak ditampilkan. Disembunyikan kalau semua masuk.
- Pindai wajah: tema putih, panduan siluet kepala dan bahu bergaris putus-putus, abu-abu saat belum pas, hijau saat pas. Ukuran siluet disimpan di pengaturan (ukuran_panduan_wajah, persen lebar layar, awal 60). Kamera tetap persegi panjang penuh, foto disimpan bingkai utuh. Batas 5 detik.
- Jalur manual: foto tampil di atas, filter huruf depan + dropdown nama urut abjad, lalu PIN 4 digit (digit keempat langsung simpan).
- Jam absen dicatat saat tombol ditekan.
- Kualitas foto absen: kamera hanya memotret saat wajah utuh di dalam siluet dan cukup terang. Di layar konfirmasi wajah dan layar pilih nama + PIN ada tombol kecil "Foto ulang" sebelum absen disimpan. Setelah tersimpan, karyawan tidak bisa mengulang; perbaikan lewat "Update foto" oleh admin (foto lama tersimpan di log).
- Absen masuk sebelum jendela (60 menit sebelum jam masuk shift): layar "Absen masuk belum dibuka, mulai 06:44".
- Sudah absen: layar "sudah absen masuk jam 07:40, apakah itu Anda?" dengan foto lama dan sekarang, tombol YA / BUKAN SAYA.
- Sudah absen lembur tapi masih kerja: tombol kecil "Revisi lembur" (jam pulang diganti jam sekarang, ACC ulang). Kalau sebelumnya pulang biasa: "Ganti jadi lembur".
- Shift tidak sesuai jadwal: kalau absen masuk jauh dari jam shift jadwal tapi dekat jam shift lain, tanya "Masuk sebagai Shift 2?" YA = dihitung shift 2, tanda SHIFT_BEDA, wajib konfirmasi admin (admin lain atau owner bila admin tidak ada; ditolak = hitung ulang dari shift jadwal). TIDAK = telat dari shift jadwal.

## 4. Pop-up setelah absen (format sama, beda latar)
- Tepat waktu: latar hijau, "Selamat bekerja, [panggilan]!", keterangan "Masuk 07:45 (Shift 1)", animasi meriah (konfeti, sinar, ikon membesar).
- Telat: latar merah, "Telat 5 menit, [panggilan]!!", keterangan "Masuk 07:50 (Shift 1)", tombol wajib ISI ALASAN TELAT. Tidak menutup otomatis. Kalau tombol tidak ditekan dalam 10 detik, alasan = TIDAK DIISI dan dilaporkan ke admin. Layar alasan (latar merah, tanpa logo) kembali sendiri setelah 30 detik tanpa sentuhan.
- Pulang: latar hitam, "Terima kasih, [panggilan]!", "Pulang 16:31 (Shift 1)".
- Pulang awal: format pulang, keterangan berbingkai merah. Sampai 16:00:59 wajib ISI ALASAN PULANG AWAL (aturan sama dengan telat) dan label "Menunggu persetujuan admin". 16:01–16:29 tanpa ACC.
- Lembur: format pulang, "Lembur 18:35 (2 jam 5 menit)", label "Menunggu persetujuan admin".
- Belum absen pulang kemarin / belum absen masuk hari ini: bagian "Bulan ini" diganti kotak peringatan merah.
- Beberapa peringatan sekaligus: pop-up utama dulu, lalu layar peringatan lanjutan.
- Label performa bulanan TIDAK tampil di pop-up absen.

## 5. Keterangan (alasan)
Lembur, telat, pulang awal, absen luar: pilihan (dari sheet pengaturan) + kolom ketik. Ketik wajib kalau pilih "Lainnya"; absen luar wajib isi tujuan/nama klien. Telat dan pulang awal sampai 16:00: alasan wajib.

## 6. HP pribadi karyawan
- Login: username = nama lengkap, password 6 angka. Login sekali, terikat ke HP.
- Beranda: lencana status kecil di kanan atas (EXCELLENT emas medali / GOOD hijau jempol / BAD merah segitiga), ikon akun, ABSEN MASUK, ABSEN PULANG, LEMBUR, tombol Izin/Cuti, Tukar shift, Report. Akun ber-role ADMIN: tambahan tombol "Menu admin" di bawah. Tanda offline dan jumlah absen belum terkirim.
- Absen luar: wajah (cadangan PIN untuk akun itu, tanpa pilih nama), GPS otomatis di latar (tombol kirim aktif setelah lokasi terkunci), pilih keperluan + ketik tujuan, tombol KIRIM.
- Izin: jenis, tanggal, keterangan opsional. Sakit: tombol foto surat dokter (kamera atau galeri), ada surat = kelompok khusus. Surat bisa ditambahkan selama masih menunggu ACC. Izin untuk tanggal lewat maksimal H+2.
- Tukar shift: "Tukar dengan rekan" atau "Pindah shift", tanggal, rekan, alasan opsional. Karyawan wajib sepakat sendiri dulu (tanpa WA dari aplikasi). Rekan menyetujui lewat pop-up saat membuka aplikasi + kartu di beranda sampai dijawab, lalu admin ACC. Belum dijawab sampai jam masuk shift yang ditukar = batal otomatis. Rekan juga diingatkan lewat pop-up setelah absen di HP toko.
- Report: latar sesuai label (kuning EXCELLENT, hijau GOOD, merah BAD). Semua angka satuan hari; telat ditambah total menit. Penanda naik/turun berbingkai hijau (membaik) atau merah (memburuk). Detail berupa tabel. Lembur disetujui: jumlah hari, detail per tanggal dan tingkat.
- Akun saya: nama, ID, cabang, shift, HP terikat; Ganti password, Ganti PIN.

## 7. Admin cabang
- Role admin mengikuti akun yang login, di perangkat mana pun. Di HP toko: password tidak disimpan, keluar otomatis 2 menit tanpa sentuhan atau saat kembali ke layar absen.
- Menu: ketuk badge "Admin Ngawi" di kanan atas → dropdown: Konfirmasi, Absen manual, Data absensi, Jadwal shift, Input izin, Karyawan, Kalender libur, Dashboard bulanan, lalu Log out (dengan pop-up konfirmasi). Bar bawah beranda: Home.
- Beranda: kartu kehadiran hari ini yang digeser per shift (Semua shift → Shift 1 → Shift 2) dengan titik penanda.
- Konfirmasi: lembur, absen luar, izin (dengan cek surat dokter), lupa absen, konflik, tukar shift, shift tidak sesuai jadwal, jam diubah. Konflik yang bukan milik siapa pun dihapus dari absensi, salinan di log.
- Absen manual: tanggal, jam, jenis, alasan, foto karyawan (wajah harus cocok).
- Edit absen: pilihan Masuk/Pulang, satu foto dengan jam fotonya, tombol "Update foto" (tidak wajib), jam, alasan wajib. Foto lama tidak tampil di aplikasi, tetap tersimpan di log. Data milik admin sendiri dan bulan terkunci hanya bisa diedit owner.
- Jadwal shift: tabel mingguan, tombol Salin minggu lalu dan Tukar shift. Perubahan jadwal/kalender hanya berlaku hari ini dan seterusnya.
- Pola shift per karyawan: Tetap atau Bergilir (urutan shift, ganti setiap 1 minggu/2 minggu/1 bulan/3 bulan, tanggal mulai), dengan pratinjau. Prioritas: perubahan manual/tukar shift → pola → shift bawaan.
- Kalender libur per cabang: toggle "Libur setiap Minggu" (aktif = semua Minggu libur), tanggal merah dan libur khusus diatur admin. Minggu yang berbeda diubah dengan ketuk tanggal.
- Karyawan baru: nama lengkap (= username, tidak boleh kembar), nama panggilan, shift, mulai kerja; role selalu KARYAWAN (role ADMIN hanya owner); persetujuan wajah, PIN, daftar wajah, selesai + "Kirim akun via WA".
- Dashboard bulanan (tanpa export): tab Ringkasan (kehadiran %, telat, tidak hadir, lembur dibanding bulan lalu; komposisi label; grafik telat per minggu dan per hari; paling sering telat) dan tab Per karyawan (filter Semua/Perlu evaluasi; tabel Label ikon, Nama urut A–Z, Tidak hadir "12 Hari"; ketuk baris = detail format Report dengan nama di judul).

## 8. Owner
- Akun OWN01 dibuat oleh kode setup. Login di perangkat mana pun; password minimal 8 karakter huruf + angka; password tidak pernah disimpan di perangkat (hanya tiket sesi); sesi berakhir otomatis 7 hari; setiap perangkat baru muncul di "Perlu perhatian"; menu "Keluarkan semua perangkat" (konfirmasi + daftar perangkat aktif); salah 5 kali ditahan 15 menit; lupa password direset lewat fungsi di editor Apps Script; ganti password membuat perangkat lain keluar. Owner tidak absen.
- Menu dari badge "Owner": Log admin, Kunci periode, Role & admin, Pengaturan, Cabang & shift, Laporan bulanan, Data absensi (dengan filter cabang), Perangkat (HP toko), Ganti password, Keluarkan semua perangkat, Log out.
- Beranda: dropdown Cabang (Semua / per cabang) yang berlaku untuk seluruh beranda; kartu kehadiran digeser per shift; Perlu perhatian (HP toko baru + lokasinya, HP belum sinkron, admin ubah data sendiri, periode belum dikunci, login owner dari perangkat baru); Konfirmasi data admin; Perlu evaluasi; grafik telat 7 hari.
- Laporan bulanan: sama dengan dashboard admin + filter cabang + tombol "Ekspor Excel ▾" (Bulanan / Harian). Ekspor Bulanan aktif setelah periode dikunci; Harian kapan saja. Owner yang mengirim file ke tim keuangan; admin tidak punya ekspor.
- Cabang & shift: jam setiap shift per cabang, tambah shift, tambah cabang; berlaku mulai besok.
- HP toko didaftarkan dengan verifikasi username + password admin cabang (hanya verifikasi, tidak login); cabang ikut admin; lokasi GPS saat daftar dicatat; owner bisa menonaktifkan.

## 9. Aturan data dan perhitungan
- Lupa absen tidak memotong performa. Lupa absen masuk tetap dihitung hadir, status ontime/telat kosong sampai admin mengisi jam. Periode tidak bisa dikunci selama masih ada yang kosong atau konfirmasi yang belum selesai.
- Pindah cabang: dicatat per hari sesuai cabang jadwalnya, muncul di laporan kedua cabang.
- Hari kerja dihitung dari tanggal mulai kerja sampai tanggal nonaktif.
- "Tidak hadir" = semua hari tidak masuk termasuk cuti dan sakit (rincian di detail).
- Sisa cuti dihitung ulang otomatis saat kalender berubah.
- Lembur terjadwal di luar jam tidak dicatat sistem.
- Label performa: EXCELLENT = tanpa alpha, telat, izin biasa, pulang awal; BAD = alpha ≥1, telat >5, pulang awal >5, atau izin biasa >3 hari; selainnya GOOD.

## 10. Export Excel (contoh di docs/contoh-export)
Kolom pertama semua sheet selalu **Cabang**.
- **Bulanan** – sheet `Data`: Cabang, ID, Nama, Label, Hari kerja, Hari aktif, Ontime, Telat, Telat (menit), Pulang awal, Alpha, Izin, Sakit, Cuti, Sisa cuti, Lembur <1 jam, Lembur 1-2 jam, Lembur >2 jam. Sheet `Gaji`: Cabang, ID, Nama, Gaji pokok, Jabatan, Performa, Kehadiran, Lembur, Bonus hadir, Hari aktif, Sisa cuti, Ontime, Telat, Izin, Sakit, Cuti, Piutang, Potongan, Sisa, Jumlah pendapatan, Jumlah potongan, Total gaji. Kolom kehadiran terisi rumus dari sheet Data; kolom rupiah kosong (diisi manual keuangan, latar kuning); Jumlah pendapatan = jumlah Gaji pokok s/d Bonus hadir; Jumlah potongan = Piutang + Potongan; Total = pendapatan − potongan. Sisa = sisa piutang (informasi).
- **Harian** – sheet `Data Harian`: Cabang, Tanggal, ID, Nama, Shift, Jam masuk, Status masuk, Telat (menit), Jam pulang, Status pulang, Lembur, Keterangan, Cara absen. Sheet `Izin`: Cabang, Mulai, Selesai, ID, Nama, Jenis, Kelompok, Hari, Keterangan, Surat (link), Status, Oleh. Sheet `Lembur`: Cabang, Tanggal, ID, Nama, Jam pulang, Durasi, Tingkat, Pekerjaan, Disetujui oleh.
- Aplikasi dan Google Sheets tidak pernah menyimpan angka gaji.

## 11. Keamanan dan teknis
- Zona waktu Apps Script dan spreadsheet wajib Asia/Jakarta.
- Semua aksi selain ping wajib menyertakan token HP toko terdaftar atau sesi login yang sah.
- Aplikasi mengecek nomor versi saat dibuka; versi baru = muat ulang otomatis.
- Data karyawan dan wajah di HP toko disinkron ulang setiap 30 menit saat online.
- Cadangan otomatis mingguan spreadsheet ke folder cadangan.
- Uji beban: semua karyawan satu cabang absen serentak di hari pertama uji coba.

## 12. Perubahan struktur data (terapkan ke setup_spreadsheet.gs)
- `akun`: tambah `pola_shift` (TETAP/BERGILIR), `urutan_shift` (contoh "1,2"), `ganti_setiap` (1M/2M/1B/3B), `mulai_pola`, `gps_daftar` (untuk akun PERANGKAT).
- `izin`: jenis baru `TUKAR_SHIFT` dan `PINDAH_SHIFT`; tambah kolom `rekan` dan `status_rekan` (MENUNGGU/SETUJU/TOLAK/BATAL), `shift_asal`, `shift_tujuan`.
- `absensi`: nilai `tanda` baru `SHIFT_BEDA`; kolom `alasan_kosong` tidak perlu (pakai ket = "TIDAK DIISI").
- `pengaturan`: per cabang `libur_minggu_[kode cabang]` (TRUE/FALSE), `ukuran_panduan_wajah` (60), `batas_izin_lewat_hari` (2), `sesi_owner_hari` (7), `sinkron_karyawan_menit` (30).
- Sheet baru ke-9 `sesi`: id_sesi, akun, perangkat, token_hash, dibuat, terakhir_aktif, kedaluwarsa, aktif.
