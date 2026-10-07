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

## Perubahan dari mockup

Daftar resmi selisih antara mockup (`docs/mockup/layar/`) dan aplikasi. Rincian per layar ada di `docs/audit-mockup.md` (audit 2026-10-06, berbasis pembandingan kode/markup, bukan visual). Status "belum disinkron ke mockup" = keputusan sadar, mockup belum diperbarui. Status "PENYIMPANGAN: harus diperbaiki" = aplikasi harus mengikuti mockup. Mockup bukan acuan untuk baris keputusan sadar; yang berlaku keputusan di tabel ini.

| Tanggal | Layar | Apa yang berubah | Alasan | Status |
|---|---|---|---|---|
| 2026-10-05/06 | Login HP pribadi (29) | Nama lengkap + PIN 5 angka (karyawan) atau kata sandi minimal 8 karakter (admin); sesi sampai Log out; HP tidak terikat. Mockup: password 6 angka, terikat ke HP | Disederhanakan | belum disinkron ke mockup |
| 2026-10-05/06 | PIN karyawan dan admin (09, 61) | 5 angka (mockup 4 angka) | Disederhanakan | belum disinkron ke mockup |
| 2026-10-05/06 | Semua layar kata sandi | Kata sandi tidak peka huruf besar-kecil | Mengurangi salah ketik | belum disinkron ke mockup |
| 2026-10-05/06 | Kelola HP toko (80) | Layar baru di menu owner: filter cabang, saklar nonaktif, Ubah nama, Nonaktifkan | Owner perlu mengelola HP toko | belum disinkron ke mockup |
| 2026-10-05/06 | Menu admin HP toko (50) | Item "Ubah nama HP ini" | Nama HP mudah dikenali | belum disinkron ke mockup |
| 2026-10-05/06 | Layar Karyawan admin (58) | Filter Aktif/Nonaktif, Tambah, Reset PIN, Nonaktifkan, Aktifkan kembali, tombol "Daftar wajah" nonaktif ("Segera") | Kelola karyawan tanpa pengenalan wajah | belum disinkron ke mockup |
| 2026-10-05/06 | Tampilan tanggal | dd/MM/yy (contoh 05/10/26) | Ringkas | belum disinkron ke mockup |
| 2026-10-05/06 | Beranda owner (71) dan menu owner (72) | Diringkas: Hari ini dan Perlu perhatian (kartu selalu tampil, angka 0 bila kosong); menu 4 item + Konfirmasi | Dikerjakan bertahap | belum disinkron ke mockup (kotak Konfirmasi data admin, Perlu evaluasi, grafik telat dan item menu lain: lihat penyimpangan) |
| 2026-10-05/06 | Foto absen | Struktur folder Drive `FOTO ABSEN WEB/Cabang/Tahun/Bulan/ID_Nama/DDMMYY_JENIS+SHIFT_HHMM.jpg` | Bukan tampilan | belum disinkron ke mockup |
| 2026-10-06 | Beranda HP pribadi (30–32, 46) | Ada tombol "Riwayat absen" yang tidak ada di mockup; tidak ada baris tiga kotak Izin/Cuti, Tukar shift, Report; tidak ada LEMBUR, kartu pengajuan menunggu ACC, lencana label performa (badge berisi nama dan membuka menu) | Dikerjakan bertahap | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Tombol absen HP pribadi (30) | Tinggi 112 px, ikon 56 px (mockup 104 px dan 52 px), ada sub-teks; tidak ada LEMBUR dan tiga kotak di bawahnya | Tata letak belum disalin dari mockup | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Absen luar (33) | Dua kolom teks bebas (tujuan, keperluan) alih-alih chip keperluan dari `KEPERLUAN_LUAR` + keterangan tujuan | Belum ada aksi server pembaca daftar | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Konfirmasi (28, 49, 71) | Hanya item menu; admin tanpa kartu "Menunggu konfirmasi" di beranda; owner tanpa kotak "Konfirmasi data admin" dan layar khusus data admin; owner dilaporkan tidak bisa ACC (penyebab belum dipastikan) | Dikerjakan bertahap | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Tukar shift (42, 43, 56) dan terkait (55, 57, 59) | Belum ada sama sekali | Belum dikerjakan | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Pop-up HP toko (10, 11, 14, 15, 17, 35) | Kotak "Bulan ini" (Masuk, Telat, Izin/cuti, Sisa cuti) tidak ada | Statistik bulanan belum dibuat di server | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Layar utama HP toko (01, 02) | Tidak ada kartu "Hari ini tidak masuk", teks kecil di tombol (mis. "Shift 1 mulai 07:45") dan layar jadwal shift hari ini. KOREKSI: ukuran tombol ABSEN MASUK/PULANG HP toko (112 px, ikon 56) SUDAH sama dengan mockup 01; angka 104 px milik beranda HP pribadi (30) | Belum dikerjakan | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Beranda dan menu admin (49, 50) | Beranda hanya judul + Home/Log out; menu 4 item (mockup 10 item) | Dikerjakan bertahap | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Pengenalan wajah dan peringatan (03–08, 13, 18, 19, 21, 34) | Belum ada (absen lewat nama + PIN) | Tahap 1 nomor 6–7 belum dikerjakan | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Mockup 45, 63 (aturan lama) | Password awal 123456, PIN awal 1234, password 6 angka, ikatan HP/"Lepas HP" tidak berlaku lagi | Dibatalkan | belum disinkron ke mockup (mockup perlu dikoreksi, jangan ditiru) |
| 2026-10-06 | Layar HP pribadi: Report, Izin/Cuti, Akun saya (36–45) | Belum ada | Belum dikerjakan | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Layar admin dan owner lain (22, 24, 25, 53–55, 62–77, 81–82) | Belum ada | Belum dikerjakan | PENYIMPANGAN: harus diperbaiki |
| 2026-10-07 | Beranda HP pribadi (30, 31, 32, 46) | Kata "Halo," dihapus; nama saja bergaya blok "Cabang ..." layar 01 (Poppins tebal kecil + garis hitam tegak). Subjudul "Belum absen hari ini" tetap | Keputusan pemilik | disetujui pemilik |
| 2026-10-07 | Beranda HP pribadi (30, 31, 32, 46) | Ikon segarkan pindah ke bawah ikon akun, rata kanan, sejajar baris nama (posisi lama di baris atas dihapus). Beranda admin (49) dan owner (71) tidak berubah | Keputusan pemilik | disetujui pemilik |
| 2026-10-07 | Beranda HP pribadi, admin HP toko, owner | Tarik-ke-bawah untuk refresh (fitur baru): hanya bila di paling atas dan tarikan >= 90 px, memanggil fungsi yang sama dengan ikon segarkan, tarik-ke-bawah bawaan Chrome dimatikan, penanda kecil berputar | Keputusan pemilik | disetujui pemilik |
| 2026-10-07 | Layar 09 (HP toko) dan absen luar masuk/pulang/lembur (HP pribadi) | Lingkaran foto kamera dibesarkan menjadi 160 px, border 9 px (sebelumnya 100 px/7 px dan 72 px). Ukuran usulan Claude Code, belum final: pemilik menilai di gambar dampingan. Layar 09 di 360x640 perlu digulir (isi 806 px); setelah nama dipilih otomatis digulir ke keypad | Keputusan pemilik (ukuran = usulan) | menunggu penilaian ukuran |

Catatan koreksi audit (2026-10-06): dugaan awal bahwa layar login HP pribadi di mockup memakai keypad angka **tidak terbukti**; mockup 29 memakai kolom ketik biasa seperti app. Keypad ada di mockup untuk PIN HP toko (09), buat PIN karyawan (61), dan absen luar cadangan PIN (34); dua yang pertama sudah ada di app (5 digit), yang ketiga belum.

### Penyelarasan Fase 1, bagian 2 (HP pribadi) — 2026-10-06
Bukti visual berdampingan: `docs/audit/visual/<nomor>_mockup.png` dan `<nomor>_app.png` (29, 30, 33, 46). Hasil uji alur dengan server tiruan: `docs/audit/visual/uji_alur_pribadi_hasil.png`, `uji_alur_admin_hasil.png`, `uji_server_keperluan_hasil.png`.

| Tanggal | Layar | Apa yang berubah | Alasan | Status |
|---|---|---|---|---|
| 2026-10-06 | Beranda HP pribadi (30–32) | Disalin dari mockup: logo + ikon akun, sapaan, ABSEN MASUK/PULANG 104 px (ikon 52), LEMBUR, satu baris tiga kotak Izin/Cuti, Tukar shift, Report (nonaktif "Segera"). Tombol "Riwayat absen" dihapus dari beranda (layar dan aksi server `pribadi_riwayat` masih ada, tetapi tidak terjangkau dari layar) | Sesuai mockup | sesuai mockup; Riwayat: belum disinkron ke mockup |
| 2026-10-06 | Beranda HP pribadi (30–32) | Lencana label performa (EXCELLENT/GOOD/BAD) disiapkan tetapi DISEMBUNYIKAN | Belum ada data performa | belum ada data |
| 2026-10-06 | Beranda HP pribadi (30–32) | Kartu "N pengajuan menunggu ACC" + "Lihat" tidak dibuat | Belum ada data izin | belum ada data |
| 2026-10-06 | Beranda HP pribadi | Ikon akun membuka menu pojok (Log out, dst.), bukan layar "Akun saya" (44) | Layar Akun saya belum ada; Log out harus terjangkau | PENYIMPANGAN: harus diperbaiki (setelah Akun saya dibuat) |
| 2026-10-06 | Beranda HP pribadi | Sapaan "Halo, {nama lengkap}" (mockup) bukan nama panggilan lagi; baris tanggal diganti baris status absen hari ini | Mengikuti mockup | sesuai mockup |
| 2026-10-06 | Beranda HP pribadi | Tombol LEMBUR aktif begitu sudah absen masuk (kecuali sudah PULANG CEPAT); belum mengikuti jam server seperti HP toko. Server menolak bila belum waktunya | `pribadi_hari_ini` belum mengirim jam pulang shift; mengubahnya di luar izin langkah ini | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Absen luar (33) | Pilihan pulang di dalam layar absen luar (PULANG / PULANG + LEMBUR) dihapus: ABSEN PULANG dan LEMBUR di beranda masing-masing membuka layar absen luar sendiri; tombol kirim berlabel "KIRIM" | Sesuai mockup | sesuai mockup |
| 2026-10-06 | Absen luar (33) | Kolom teks "Keperluan" diganti pilihan (chip) dari `KEPERLUAN_LUAR` + kolom ketik "Keterangan tujuan" (wajib). Aksi server baru `pribadi_keperluan_luar` dan validasi server bahwa keperluan ada di daftar (daftar kosong = tidak diperiksa) | Sesuai mockup | sesuai mockup |
| 2026-10-06 | Absen luar (33) | Hanya kolom keperluan/tujuan yang disalin dari mockup; susunan atas layar lama dipertahankan. Teks "Wajah cocok dengan akun" tidak ada (belum ada pengenalan wajah); foto tetap otomatis saat KIRIM | Pengenalan wajah belum ada | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Login HP pribadi (29) | Karyawan memakai keypad angka 5 titik PIN (angka kelima langsung masuk); admin lewat tautan "Masuk sebagai admin (kata sandi)" dengan keyboard. Mockup 29: kolom Username + Password biasa | KEPUTUSAN PEMILIK 2026-10-06 (keypad seperti 09, 61, 34) | belum disinkron ke mockup |
| 2026-10-06 | Login HP pribadi (29) | Gambar karyawan dan tagline "Selamat bekerja karyawan terbaik..." tidak ada | Belum dikerjakan | PENYIMPANGAN: harus diperbaiki |
| 2026-10-06 | Beranda admin HP pribadi (46) | Kartu "Menu admin" di bawah beranda (angka konfirmasi), tombol absen 86 px dan kotak 64 px seperti mockup 46; menu dari ikon akun memuat semua item mockup 50, yang belum ada fiturnya nonaktif "Segera" (Absen manual, Data absensi, Jadwal shift, Input izin, Kalender libur, Dashboard bulanan) | Sesuai mockup | sesuai mockup |
| 2026-10-06 | Menu admin HP pribadi | Item "Keluarkan semua perangkat" dipertahankan (tidak ada di mockup 50) | Fitur yang sudah berfungsi | belum disinkron ke mockup |

### Penyelarasan Fase 1, bagian 3 (Konfirmasi, beranda admin, beranda owner) — 2026-10-06
Bukti visual: `docs/audit/visual/52_*`, `28_*`, `49_*`, `50_*`, `71_*`, `72_*` (`_mockup.png` dan `_app.png`); uji alur server tiruan: `uji_alur_konfirmasi_owner_hasil.png`, `uji_alur_konfirmasi_admin_hasil.png`.

| Tanggal | Layar | Apa yang berubah | Alasan | Status |
|---|---|---|---|---|
| 2026-10-06 | Konfirmasi (52) | Tata letak kartu, tombol ACC/Tolak, tombol Home, chip pengelompokan (Semua, Lembur, Absen luar) disalin dari mockup 52. Judul kelompok diganti chip; ditambah chip "Pulang cepat" (ada di data, tidak ada di mockup). Chip "Izin" dan "Lupa absen" tampil nonaktif "Segera". Jumlah per chip hanya tampil bila semua item sudah termuat | Sesuai mockup; jumlah per kelompok butuh perubahan server | belum disinkron ke mockup (chip Pulang cepat) |
| 2026-10-06 | Konfirmasi (52) | Kotak "Foto" 56 px membuka foto saat diketuk (dimuat satu per satu, bukan thumbnail otomatis) | Foto tidak publik, dimuat hanya saat ditekan (hemat kuota) | belum disinkron ke mockup |
| 2026-10-06 | Konfirmasi owner (28) | Dibuka dari kotak "Konfirmasi data admin" di beranda owner; judul sama dengan mockup 28, filter Cabang, catatan "Admin tidak bisa meng-ACC datanya sendiri". Daftar memuat SEMUA yang menunggu keputusan owner, bukan hanya milik admin | Server belum menyaring berdasarkan peran pemilik; baris sub di kotak ditulis apa adanya ("Absen luar, lembur, pulang cepat") bukan "milik admin" | PENYIMPANGAN: harus diperbaiki (butuh peran pemilik pada item di server) |
| 2026-10-06 | Beranda owner (71) | Ditambah kotak "Konfirmasi data admin" (jumlah). Kartu Hari ini dan Perlu perhatian dipertahankan | Owner tidak punya jalan ke tombol ACC dari beranda | sesuai mockup |
| 2026-10-06 | Beranda owner (71) | Tidak dibuat: Belum absen, Izin/cuti, rincian per shift, jenis perhatian HP belum sinkron/admin ubah absen/bulan belum dikunci, Perlu evaluasi (BAD), grafik telat 7 hari | Belum ada data atau aksi server | belum ada data |
| 2026-10-06 | Menu owner (72) | Item sesuai mockup 72; yang belum ada fiturnya nonaktif "Segera" (Log admin, Kunci periode, Role & admin, Pengaturan, Cabang & shift, Laporan bulanan, Data absensi). "Kelola HP toko" berganti nama "Perangkat (HP toko)". Item "Konfirmasi" dihapus dari menu (ada di beranda) | Sesuai mockup | sesuai mockup |
| 2026-10-06 | Beranda admin HP toko (49) | Judul "Hari ini" + tanggal, kartu "Menunggu konfirmasi" dengan jumlah, tombol Home; tombol Log out di bawah dihapus (Log out ada di menu seperti mockup 50) | Sesuai mockup | sesuai mockup |
| 2026-10-06 | Beranda admin HP toko (49) | Tidak dibuat: kartu Hari ini (Hadir, Telat, Izin/cuti, per shift), daftar Belum absen, Perlu evaluasi (BAD) | Admin belum punya aksi server untuk angka Hari ini (aksi `owner_hari_ini` khusus owner) dan belum ada jadwal | belum ada data |
| 2026-10-06 | Menu admin HP toko (50) | Item sesuai mockup 50; yang belum ada fiturnya nonaktif "Segera"; "Ubah nama HP ini" dipertahankan | Sesuai mockup | sesuai mockup; Ubah nama HP: belum disinkron ke mockup |

### Penyelarasan Fase 1, bagian 4 (HP toko) — 2026-10-06
Tidak ada perubahan kode di bagian ini, dengan alasan terbukti secara visual (`docs/audit/visual/01_mockup.png` dan `01_app.png`): ukuran dan posisi ABSEN MASUK, ABSEN PULANG, dan LEMBUR di HP toko sudah sama dengan mockup 01 (kotak tombol sama persis pada y 272–380 dan 397–506); angka "104 px" dalam perintah berasal dari mockup beranda HP pribadi (30), bukan HP toko. Tombol IZIN di HP toko tidak ada di aplikasi maupun di mockup 01 (tombol mockup: Shift 1 aktif, ABSEN MASUK, ABSEN PULANG, Hari ini tidak masuk, LEMBUR, Masuk sebagai Admin), jadi tidak ada yang diubah.

| Tanggal | Layar | Apa yang berubah | Alasan | Status |
|---|---|---|---|---|
| 2026-10-06 | Layar utama HP toko (01) | Tidak ada perubahan | Ukuran tombol sudah sama dengan mockup | sesuai mockup (ukuran dan posisi tombol) |
| 2026-10-06 | Layar utama HP toko (01) | Tidak dibuat: kartu "Hari ini tidak masuk", teks kecil di tombol ("Shift 1 mulai 07:45", "Pulang normal 16:30" — di app ada tempatnya tetapi terisi hanya bila server mengirim jadwal), jadwal shift (02) | Butuh data jadwal/izin | belum ada data |
| 2026-10-06 | Pop-up HP toko (10, 11, 14, 15, 17, 35) | Kotak "Bulan ini" tidak dibuat | Butuh data Report | belum ada data |

### Paket perbaikan: Absen luar, Konfirmasi, Edit — 2026-10-06
Bukti: `docs/audit/visual/paket_*_app.png` (layar), `uji_alur_*_hasil.png` (alur dengan server tiruan), `uji_server_paket_hasil.png` (fungsi server baru), `cek_sintaks_apigs.png`. **iPhone/Safari DITUNDA** (belum diuji dan tidak dikerjakan di paket ini).

| Tanggal | Layar | Apa yang berubah | Alasan | Status |
|---|---|---|---|---|
| 2026-10-06 | Absen luar (33) | Chip keperluan diganti SATU kolom ketik bebas "Keterangan". Wajib untuk masuk, pulang, dan lembur, minimal 5 karakter setelah spasi dipotong (dicek di HP dan di server). Tersimpan sebagai `LUAR: keterangan` di kolom keterangan yang sudah ada. Layar tidak lagi memanggil server untuk memuat pilihan. Aksi `pribadi_keperluan_luar` dan baris `KEPERLUAN_LUAR` di sheet tetap ada tetapi tidak dipakai layar | Permintaan pemilik; pilihan tetap sering gagal dimuat | belum disinkron ke mockup (mockup 33 masih chip) |
| 2026-10-06 | Absen luar | Teks balasan teknis server tidak lagi tampil mentah; layar menampilkan pesan Indonesia yang dikenal atau pesan umum "Absen luar belum bisa dikirim..." | Pemilik melihat teks mentah di layar | sesuai keputusan |
| 2026-10-06 | Beranda HP pribadi (30–32) | Tombol ABSEN MASUK dan ABSEN PULANG SUDAH ADA sejak penyelarasan bagian 2 (membuka alur absen luar yang sama, tanpa layar baru; tidak ada tombol yang dihapus atau ditambah). Ditambah teks di bawahnya: "Hanya untuk absen tugas di luar toko". Penulisan tombol tetap huruf kapital seperti mockup. ABSEN PULANG aktif hanya bila sudah ada absen masuk hari itu (di toko atau luar), diperiksa juga di server ("Belum absen masuk hari ini") | Permintaan pemilik | belum disinkron ke mockup (teks keterangan) |
| 2026-10-06 | Beranda HP pribadi | Tombol LEMBUR aktif sesuai penanda `lembur_boleh` dari server (`pribadi_hari_ini`): jam server dan aturan yang sama dengan lembur HP toko (jam pulang + toleransi + 1 menit; tidak setelah PULANG CEPAT; tidak untuk ADMIN). Layar menyegarkan penanda tiap 60 detik. Penolakan di server tetap seperti sebelumnya | Menutup penyimpangan "LEMBUR belum mengikuti jam server" | sesuai mockup |
| 2026-10-06 | Konfirmasi (52, 28) | Penanda "Lokasi di dalam area toko" pada kartu bila koordinat absen luar berada dalam radius `radius_tanda_toko_m` (UMUM, bawaan 100 m; baris pengaturan ini perlu ditambah pemilik, server memakai 100 bila belum ada) dari koordinat HP toko cabang itu (`gps_daftar` HP toko aktif, ditambah titik LOKASI bila ada). Absen TETAP diterima dan menunggu ACC. Penanda disimpan di kolom keterangan yang sudah ada: `LUAR [AREA TOKO]: keterangan` (tanpa kolom baru) | Permintaan pemilik | belum disinkron ke mockup |
| 2026-10-06 | Konfirmasi | Owner HANYA melihat dan memutuskan pengajuan level admin; admin HANYA pengajuan karyawan cabangnya, dan tidak boleh ACC, TOLAK, atau edit pengajuannya sendiri; semua ditegakkan di server (aksi `konfirmasi_putuskan`, `konfirmasi_edit`, `ambil_foto`), bukan hanya disembunyikan. Akibatnya admin juga tidak lagi memutuskan pengajuan admin lain | Permintaan pemilik; menutup penyimpangan "owner melihat semua" | sesuai mockup 28 (data milik admin) |
| 2026-10-06 | Konfirmasi | Menu "Edit" di tiap pengajuan ABSEN LUAR (jam dan keterangan saja; jenis tidak bisa diubah). Boleh: admin untuk karyawan, owner untuk admin, bukan pengajuan sendiri. Pengajuan yang sudah di-ACC atau ditolak tidak bisa diedit (server menolak). Keterangan hasil edit minimal 5 karakter; jam pada tanggal absen yang sama dan tidak melewati jam server. Setelah disimpan, HADIR/TELAT dan tingkat lembur dihitung ulang dengan aturan absen biasa dan pengajuan tetap MENUNGGU; dicatat di `log` (aksi `EDIT_ABSEN`, sebelum/sesudah, siapa, kapan). Pengajuan lembur/pulang cepat dari HP toko tidak punya menu Edit (hanya absen luar) | Permintaan pemilik | belum disinkron ke mockup |
| 2026-10-07 | Beranda HP pribadi (30–32, 46) | Nama kembali BESAR seperti mockup (Oswald 30 px, tebal 700), tetap TANPA "Halo," (hanya kata "Halo," yang berbeda dari mockup) | Keputusan pemilik | belum disinkron ke mockup |
| 2026-10-07 | 43 layar yang tadinya belum ada (HP Toko 02–08, 13, 18, 19, 22–25; HP Pribadi 34, 36–43, 45; Admin 53–57, 59, 62, 64–70; Owner 73–77, 81, 82) | Dibuat sebagai TAMPILAN SAJA: tanpa angka/nama/tanggal contoh ("–"), tabel hanya kepala kolom, input/dropdown nonaktif, semua tombol aksi nonaktif "Segera"; hanya Kembali/Home/Tutup dan tautan menu yang berfungsi. Layar KEJADIAN (04, 05, 06, 07, 13, 18, 19, 22, 23, 34, 43, 53, 56, 62, 65, 70) belum bisa dipicu | Keputusan pemilik: semua tampilan harus ada, fitur menyusul | berlaku |
| 2026-10-07 | Alur absen HP toko | ABSEN MASUK/PULANG/LEMBUR → layar 03 (1–2 detik, "Pengenalan wajah · Segera", kamera tidak dibuka) → 08 (ULANGI nonaktif) → MANUAL → 09. Tiket waktu tetap diminta saat tombol ditekan | Persiapan pengenalan wajah | berlaku |
| 2026-10-07 | Layar 34 (absen luar, cadangan PIN) | PIN 5 angka; chip Keperluan diganti satu kolom Keterangan ketik bebas (min 5, maks 100) seperti layar absen luar | Keputusan pemilik | belum disinkron ke mockup |
| 2026-10-07 | Layar 45 | "(awal: 123456)" dihapus | Sisa password awal | belum disinkron ke mockup |
| 2026-10-07 | Layar 59 | DIHAPUS dari app, digantikan 57 (satu-satunya layar Pola shift) | Keputusan pemilik | mockup 59 tidak diubah |
| 2026-10-07 | Kalimat tren 68, 81, Report, 70 | Tampil "–" saja tanpa panah dan tanpa angka; panah hanya bila ada perbedaan nyata | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 37, 38, 36e, 35, 48 | Layar tersendiri (tampilan saja), tidak bisa dipicu dari navigasi | Keputusan pemilik "semua tampilan dibuat" | berlaku |
| 2026-10-07 | Layar Report yang bisa dibuka (36) | Lencana label netral nonaktif ("Segera") sampai label dihitung; warna penuh hanya di 36e/37/38 yang tidak bisa dibuka | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 45 (Ganti password) | Aturan sandi gaya lama diganti aturan akun yang berlaku menurut peran: KARYAWAN = PIN tepat 5 angka; ADMIN = kata sandi minimal 8 karakter, maksimal 100, besar/kecil sama | Keputusan pemilik | belum disinkron ke mockup |
| 2026-10-07 | Layar 36/36e/37/38/70 | Kalimat "Telat N kali. Tanpa pelanggaran untuk …" tampil "–" abu pudar | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 48 | "Halo," dihapus; nama besar (Oswald 30 px) berisi "–" | Keputusan pemilik | belum disinkron ke mockup |
| 2026-10-07 | Pop-up absen luar terkirim (35) | Layar 35 dipakai sebagai pop-up nyata setelah absen luar masuk/pulang/lembur diterima server (data nyata: nama, jam tiket, menunggu ACC; kotak Bulan ini nonaktif) | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 75 (Pengaturan) | Daftar "Keperluan absen luar" dipertahankan nonaktif; diputuskan ulang saat Pengaturan dibangun | Keputusan pemilik | berlaku |
| 2026-10-07 | Teks tren 68, 81, 36, 36e, 37, 38, 70, 82 | "–" berwarna abu netral (bukan hijau/merah) sampai ada naik/turun nyata | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 36 yang bisa dibuka | Report netral lencana abu: disetujui | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 45 (Ganti password) | Label untuk KARYAWAN menjadi "PIN lama / PIN baru / Ulangi PIN baru" (karyawan hanya punya PIN); untuk ADMIN tetap "Password ...". Fungsi ganti tetap "Segera". Selisih 19, 20, 21 dipertahankan | Keputusan pemilik | belum disinkron ke mockup |
| 2026-10-07 | Fitur A (izin dan cuti) | Proses izin/cuti, cek surat dokter, input izin admin, kalender libur, kartu "Hari ini tidak masuk" dan "N pengajuan menunggu ACC" dibangun; asumsi A1-A14 ada di `docs/daftar-selisih.md` | Permintaan pemilik (Sesi A-C) | berlaku |
| 2026-10-07 | Fitur C (koreksi absen) | Peringatan HP toko (sudah absen, shift tidak sesuai jadwal, revisi lembur, lanjutan), konflik absen, absen manual, data absensi, edit absen dibangun; asumsi C1-C13 ada di `docs/daftar-selisih.md` | Permintaan pemilik (Sesi A-C) | berlaku |
| 2026-10-07 | Layar 55 (Jadwal shift) | Tombol "Tukar shift" (menuju layar 56) ditambahkan di bawah "Salin minggu lalu" (SB1) | Keputusan pemilik | berlaku |
| 2026-10-07 | Layar 52 (Konfirmasi) | Kartu "Konflik absen" dengan tombol "Lihat detail" (jalan ke layar 53) (SC1) | Keputusan pemilik | berlaku |
| 2026-10-07 | Selisih Fitur A–C: SA1, SA2, SA3, SA4, SA6, SA7, SB3, SB6, SC2, SC4, SC5, SC6, SC7, SC8 | Dipertahankan apa adanya (rincian di `docs/daftar-selisih.md`, bagian "Keputusan pemilik 2026-10-07 (selisih Fitur A–C)") | Keputusan pemilik | berlaku |
