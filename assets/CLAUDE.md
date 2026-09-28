# Proyek: Aplikasi Absensi Kubah Emas Indonesia

## Tentang pemilik proyek
- Pemilik proyek adalah pemula (belum bisa koding). Selalu jelaskan dengan bahasa Indonesia yang sederhana dan langsung.
- Kerjakan SATU langkah kecil per permintaan. Setelah selesai, jelaskan cara mengetesnya, lalu tunggu konfirmasi sebelum lanjut.
- Jangan menambah fitur di luar yang diminta. Kalau ada yang kurang jelas, tanya dulu.
- Beri tahu dengan jujur kalau ada keputusan yang berisiko.

## Susunan teknis
- Database: Google Sheets (8 sheet).
- Backend: Google Apps Script, di-deploy sebagai Web App. Semua baca-tulis data lewat sini.
- Frontend: HTML + CSS + JavaScript biasa (tanpa framework), PWA, di-hosting di GitHub Pages (HTTPS wajib untuk kamera).
- Foto: Google Drive milik owner.
- Kode Apps Script disimpan juga di folder `apps-script/` proyek ini sebagai salinan; pemilik menyalinnya manual ke editor Apps Script.

## Aturan keamanan (wajib)
- Repo GitHub bersifat publik. JANGAN menaruh PIN, password, token, atau ID spreadsheet rahasia di kode frontend.
- PIN dan password disimpan sebagai hash di Sheets, dicek di Apps Script.
- Hanya akun owner yang punya akses ke Spreadsheet dan folder Drive.

## Desain
- Blueprint lengkap ada di Claude Docs milik pemilik; ringkasan aturan inti ada di file ini. Kalau butuh detail, tanyakan ke pemilik.
- Warna: kuning #FFD62E (latar), abu seragam #333438, hitam #141111, hijau #1F8A4C (ABSEN MASUK, tepat waktu), merah #D92A22 / #B91C1C (ABSEN PULANG, telat, peringatan, pelanggaran). Merah hanya untuk peringatan/pelanggaran, kecuali tombol ABSEN PULANG.
- Font: Oswald (judul, tombol besar), Poppins (teks).
- Logo dan foto karyawan ada di folder `assets/`.

## Struktur data (8 sheet)
1. `akun`: id_karyawan (kunci unik, tidak pernah berubah), nama_lengkap (sekaligus username, tidak boleh kembar), nama_panggilan (tampil di pop-up), cabang, role (KARYAWAN/ADMIN/OWNER/PERANGKAT), shift_bawaan, password_hash, pin_hash, data_wajah, id_hp, tanggal_mulai, jatah_cuti, aktif
2. `shift`: cabang, nomor_shift, nama_shift, jam_masuk, jam_tutup, jam_pulang, toleransi_pulang
3. `kalender`: tanggal, cabang, id_karyawan (kosong = semua), isi (LIBUR MINGGU / LIBUR TANGGAL MERAH / LIBUR KHUSUS / nomor shift)
4. `pengaturan`: kategori, nama, nilai, kelompok, maks_hari
5. `absensi`: 1 baris per karyawan per hari (bagian masuk, bagian pulang, status hari, penanda)
6. `izin`: pengajuan izin dan cuti
7. `rekap_bulanan`: 1 baris per karyawan per bulan
8. `log`: tindakan admin dan absen yang disisihkan/dihapus

## Aturan inti (shift 1 sebagai contoh)
- Absen masuk dibuka 60 menit sebelum jam masuk. Masuk 07:45:59 masih HADIR, 07:46:00 TELAT.
- Jam absen dicatat saat tombol ditekan, dari jam server saat online.
- Pulang sampai 16:00:59 = PULANG AWAL (wajib alasan + ACC). 16:01–16:29 = PULANG AWAL tanpa ACC. 16:30–16:35 = PULANG NORMAL. Tombol LEMBUR aktif mulai 16:36.
- Lembur: <1 jam, 1–2 jam, >2 jam; wajib ACC admin. Aplikasi tidak menghitung rupiah.
- Pop-up telat wajib isi alasan dalam 10 detik (jika tidak: TIDAK DIISI).
- PIN 4 angka, password 6 angka; bukan angka berurutan/kembar. Password awal 123456 (berlaku 24 jam), PIN awal 1234 setelah reset.

## Rencana tahap 1 (kerjakan berurutan)
1. Spreadsheet 8 sheet + data contoh 3 karyawan
2. Apps Script: terima absen dan tulis ke sheet `absensi`
3. Halaman HP toko sederhana: pilih nama + PIN + foto -> tersimpan
4. Simpan foto ke Drive: Absensi_Foto/Cabang/Tahun/Bulan/ID_Nama/DDMMYY_MASUK1_HHMM.jpg
5. Pop-up tepat waktu / telat + layar alasan telat
6. Pengenalan wajah
7. Peringatan dobel, lupa absen, pulang awal, lembur
