# Daftar selisih: mockup vs app (kelompok 1, 2, 3)

Dibuat 2026-10-06. **Tidak ada layar yang ditandai "sesuai" penuh kecuali tertulis demikian.** Gambar berdampingan: mockup di KIRI, app di KANAN, di `docs/audit/visual/NN_dampingan.png` (NN = nomor layar).

Kolom **Siapa yang memutuskan**:
- **Pemilik** = keputusan tertulis pemilik (tetap berlaku, bukan selisih yang perlu dikembalikan).
- **Claude Code** = penyimpangan yang dibuat Claude Code tanpa keputusan pemilik. **Tidak diubah dan tidak dikembalikan**; pemilik yang memilih kembalikan atau pertahankan.
- **Belum ada fungsi** = elemen mockup tampil NONAKTIF dengan tulisan "Segera" (atau layarnya belum dibuat karena fiturnya belum ada).
- **TANYA** = kasus yang tidak ada di mockup; Claude Code tidak memilih sendiri solusinya, jadi butuh jawaban pemilik.

## SESI A-C, FITUR A (izin dan cuti) — ASUMSI yang diambil (butuh setuju atau koreksi pemilik)

| No | Aturan yang tidak ada di dokumen | Pilihan yang dipakai (paling aman dan sederhana) |
|---|---|---|
| A1 | Cuti per tahun atau berjalan? | Sisa cuti dihitung per TAHUN KALENDER dari tanggal mulai cuti: jatah (`akun.jatah_cuti`, kosong = pengaturan UMUM `jatah_cuti` = 6) dikurangi cuti MENUNGGU/DITERIMA tahun itu. |
| A2 | Batas panjang pengajuan | Satu pengajuan maksimal 31 hari dan paling jauh 1 tahun ke depan; lebih dari itu ditolak. |
| A3 | Pengajuan bertumpuk | Ditolak bila tanggalnya bertumpuk dengan izin/cuti yang masih MENUNGGU atau DITERIMA (tukar/pindah shift tidak ikut). |
| A4 | Kelebihan hari jenis khusus (Menikah maks 3, dst.) | Seperti mockup 41: kelebihan diambil dari Cuti (harus cukup sisa) atau Izin biasa (Keperluan pribadi) sesuai pilihan; pengajuan jadi dua baris satu grup (-A, -B). Pada Input izin admin (66) tidak ada pilihan di mockup, jadi pengajuan yang melebihi batas DITOLAK (kurangi tanggalnya). |
| A5 | Kapan Sakit menjadi "khusus" | Sakit tanpa surat = biasa. Kelompok berubah jadi khusus HANYA setelah surat berhasil tersimpan di Drive (unggah sesudah pengajuan). Gagal unggah tidak menggagalkan pengajuan. |
| A6 | Satu pengajuan terbelah dua baris | Konfirmasi menampilkan SATU kartu per grup; ACC/Tolak berlaku untuk semua baris grup yang masih MENUNGGU. |
| A7 | Izin sakit dengan surat | ACC selalu lewat layar 22 (cek surat dulu). "Surat tidak sah" = izin tetap DITERIMA tetapi kelompok jadi biasa (memengaruhi performa). Izin lain di-ACC langsung dari kartu. |
| A8 | Input izin admin (66) | Hanya untuk role KARYAWAN aktif di cabang admin, bukan untuk diri sendiri; aturan tanggal (H+2) dan tumpang tindih sama dengan pengajuan biasa. Surat boleh dilampirkan admin hanya pada izin yang ia input. |
| A9 | Kalender libur: penyimpanan | Tanggal merah/libur khusus = baris kalender cabang (isi `LIBUR TANGGAL MERAH` / `LIBUR KHUSUS: ket`). "Minggu masuk" = isi `MASUK: ket` (mengalahkan libur Minggu). Menghapus = isi sel dikosongkan (baris tidak dihapus). Hanya hari ini dan seterusnya. |
| A10 | Saklar "Libur setiap Minggu" | Disimpan sebagai satu nilai pengaturan `libur_minggu_<KODE>` sehingga berlaku untuk SEMUA tanggal (tidak bisa "hanya ke depan"); riwayat Minggu yang dulu libur ikut berubah. |
| A11 | "Hari ini tidak masuk" | Hanya karyawan yang izin/cuti (MENUNGGU/DITERIMA) atau libur milik sendiri di kalender. Libur seluruh toko (Minggu/tanggal merah umum) tidak dihitung. Tanpa jenis izin. |
| A12 | Kolom `telat_aju` | Disimpan sebagai TRUE/FALSE (TRUE bila tanggal mulai sudah lewat dari hari pengajuan). |
| A13 | Pembatalan pengajuan | Server siap (`izin_batal`: hanya milik sendiri, hanya MENUNGGU, status jadi BATAL) tetapi belum ada tombolnya karena mockup tidak punya layar daftar pengajuan. |
| A14 | Menambah surat setelah pengajuan | Server siap (`izin_unggah_surat`, selama MENUNGGU) tetapi belum ada tombol di app (sama dengan A13). |

## SESI A-C, FITUR B (jadwal dan shift) — ASUMSI yang diambil (butuh setuju atau koreksi pemilik)

| No | Aturan yang tidak ada di dokumen | Pilihan yang dipakai (paling aman dan sederhana) |
|---|---|---|
| B1 | Admin mengubah jadwalnya sendiri | DITOLAK di server (jadwal admin diatur owner). Baris admin tampil di tabel 55 tetapi selnya tidak bisa diketuk. Admin juga tidak boleh ikut dalam tukar shift satu hari (56). |
| B2 | Salin minggu lalu | Menyalin jadwal EFEKTIF minggu lalu (pola + perubahan manual) ke minggu yang sedang dibuka, hanya tanggal hari ini dan seterusnya. Libur seluruh toko (tanggal merah umum, libur Minggu) di minggu asal maupun tujuan dilewati. Baris admin sendiri tidak ikut. |
| B3 | Cara mengubah satu sel | Ketuk = Shift 1 > Shift 2 > ... > Libur (L) > kembali ke Shift 1. Bila hasil sama dengan pola, perubahan manual dibatalkan (isi sel kalender dikosongkan, baris tidak dihapus). Perubahan hanya tersimpan setelah Simpan; sel hari yang sudah lewat tidak bisa diketuk. |
| B4 | Tukar shift satu hari oleh admin (56) | Kedua karyawan harus terjadwal masuk pada tanggal itu dengan shift berbeda; hasilnya saling bertukar (perubahan manual hanya untuk tanggal itu). |
| B5 | Pola shift | Mulai pola boleh tanggal lampau. Pola tersimpan satu set di akun, jadi mengubahnya ikut mengubah hitungan jadwal tanggal lampau (tidak bisa "hanya ke depan"). Pratinjau = shift pada hari Senin tiap minggu. Hanya untuk role KARYAWAN. |
| B6 | Arti "Pindah shift" | Pemohon pindah ke shift rekan yang dipilih pada tanggal itu, rekan tetap di shiftnya. Tetap butuh jawaban rekan lalu ACC admin. |
| B7 | Siapa yang boleh tukar | Hanya KARYAWAN yang mengajukan; rekan harus KARYAWAN aktif cabang yang sama. Admin tidak mengajukan atau menjadi rekan. |
| B8 | Batas waktu pengajuan | Boleh untuk hari ini selama belum lewat jam masuk shift paling awal dari kedua shift. Rekan belum menjawab sampai jam itu = BATAL otomatis (dihitung saat data tukar dibaca, tanpa pemicu waktu). Tanggal lewat = BATAL. |
| B9 | Bentrok | Ditolak bila salah satu sudah punya tukar yang masih berjalan pada tanggal itu atau sedang izin/cuti. |
| B10 | ACC admin | Hanya admin cabang yang sama; tidak boleh yang melibatkan dirinya sendiri; jadwal kedua karyawan diperiksa ulang (bila sudah berubah, ACC ditolak dengan pesan "Jadwal sudah berubah", admin menolak pengajuan). Sesudah ACC baris kalender per karyawan ditulis (kosong bila sama dengan pola). Tolak: status DITOLAK. |
| B11 | Layar 43 | Muncul otomatis di beranda pribadi (tanpa tombol tutup; Back HP bisa keluar), maksimal sekali per 5 menit selama belum dijawab. Kartu khusus di beranda tidak ada karena mockup beranda tidak punya. |
| B12 | Pengingat di HP toko | Setelah pop-up absen ditutup, dialog standar "Ada N ajakan tukar shift ... buka HP pribadi" (hanya jumlah, lewat aksi tukar_pengingat dengan token HP toko dan id karyawan). |
| B13 | "Shift aktif" di layar 02 | Aktif = dari 60 menit sebelum jam masuk (jendela_absen_menit) sampai jam pulang shift. Karyawan yang izin/cuti tidak ditampilkan; admin yang terjadwal tampil. |
| B14 | Pembatalan ajakan oleh pemohon | Server siap (izin_batal menandai status_rekan BATAL) tetapi belum ada tombol (mockup tidak punya daftar pengajuan). |

## Catatan untuk ditinjau di akhir pilot (diputuskan Claude Code sendiri)

Format satu baris: nomor | layar | apa yang ditambah | alasan. Ditinjau pemilik SATU KALI di akhir pilot. Selisih lama yang sudah diputuskan ada di `docs/arsip-selisih.md` (cari dengan grep).

| No | Layar | Yang ditambah | Alasan |
|---|---|---|---|
