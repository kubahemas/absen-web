# Arsip selisih (sudah diputuskan pemilik; dipindah apa adanya dari daftar-selisih.md)

JANGAN dibaca utuh; cari dengan grep (mis. `grep -n "SC4" docs/arsip-selisih.md`).

## Kelompok 1: HP Pribadi (29–48)

| No | Elemen / selisih | Kondisi di app | Siapa | Gambar |
|---|---|---|---|---|
| 29 Login | (tidak ada selisih tampilan yang terlihat) | Identik dengan mockup. Tombol kembali tidak ada (mockup juga tidak), kembali lewat tombol Back HP | sesuai | `29_dampingan.png` |
| 30 / 31 / 32 Beranda (EXCELLENT / GOOD / BAD) | Lencana performa berwarna + tulisan label | Lencana pudar bertulisan "Segera" (belum ada perhitungan label); label EXCELLENT/GOOD/BAD tidak tampil | Belum ada fungsi | `31_dampingan.png` (32 sama, hanya warna lencana) |
| 〃 | Ikon segarkan kecil di header | Ada (tidak ada di mockup) | Pemilik | `31_dampingan.png` |
| 〃 | Tulisan "Hanya untuk absen tugas di luar toko" di bawah ABSEN PULANG | Ada | Pemilik | `31_dampingan.png` |
| 〃 | Tombol ABSEN PULANG merah dan LEMBUR hitam selalu aktif | Pudar/nonaktif sesuai keadaan (ABSEN PULANG nonaktif sebelum masuk, LEMBUR nonaktif sebelum jamnya) | Claude Code | `31_dampingan.png` |
| 〃 | Izin/Cuti, Tukar shift, Report aktif | Pudar bertulisan "Segera" | Belum ada fungsi | `31_dampingan.png` |
| 〃 | Strip "2 pengajuan menunggu ACC · Lihat" | Strip pudar "Pengajuan menunggu ACC · Segera" tanpa angka | Belum ada fungsi | `31_dampingan.png` |
| 33 Absen luar | Chip Keperluan (7 pilihan) + label "Keterangan tujuan (nama klien atau alamat)" | Tanpa chip; satu kolom Keterangan, label ditambah "wajib minimal 5 karakter", kolom kosong dengan contoh isian | Pemilik | `33_dampingan.png` |
| 〃 | "Wajah cocok dengan akun · 08:05" | "Pengenalan wajah · Segera" (tanpa jam) | Belum ada fungsi | `33_dampingan.png` |
| 〃 | Lingkaran foto bertulis "[Foto dari kamera]" | Bertulis "Foto otomatis" sampai kamera menyala | Claude Code | `33_dampingan.png` |
| 34 Absen luar cadangan PIN | Seluruh layar | Belum dibuat (butuh pengenalan wajah) | Belum ada fungsi | – |
| 35 Pop-up absen luar terkirim | Kotak "Bulan ini" dengan angka 18/1/0/5 dari 6 | Kotak tampil pudar bertulisan "Segera" tanpa angka | Belum ada fungsi | `35_dampingan.png` |
| 〃 | Teks "(Absen luar · Pemasangan)" | "(Absen luar · <20 huruf pertama keterangan>)" karena tidak ada pilihan keperluan | Claude Code | `35_dampingan.png` |
| 36–40 Report (EXCELLENT, GOOD, BAD, detail lembur, detail telat) | Seluruh layar | Belum dibuat; tombol Report di beranda pudar "Segera" | Belum ada fungsi | – |
| 41 Form izin / cuti | Seluruh layar | Belum dibuat; tombol Izin/Cuti pudar "Segera" | Belum ada fungsi | – |
| 42, 43 Tukar shift (ajukan, rekan menyetujui) | Seluruh layar | Belum dibuat; tombol Tukar shift pudar "Segera" | Belum ada fungsi | – |
| 44 Akun saya | ID "EMP012", Shift bawaan, baris "HP terikat", "Ganti HP? Minta admin reset ikatan HP" | ID dari akun (mis. K001); Shift bawaan pudar "Segera"; baris dan teks "HP terikat/Ganti HP" DIHAPUS | Pemilik (hapus); Belum ada fungsi (shift) | `44_dampingan.png` |
| 〃 | Ganti password, Ganti PIN aktif | Pudar "Segera" | Belum ada fungsi | `44_dampingan.png` |
| 〃 | Dibuka dari ikon akun langsung | Ikon akun membuka menu kecil: Akun saya, Log out, Tutup menu (mockup tidak punya tombol Log out) | Pemilik | – |
| 45 Ganti password | Seluruh layar | Belum dibuat | Belum ada fungsi | – |
| 46 Beranda akun ADMIN | Kartu "Menu admin" (angka 5) | Kotak "Konfirmasi data karyawan" (angka konfirmasi); menu admin lewat ikon akun | Pemilik | `46_dampingan.png` |
| 〃 | Lencana performa, strip pengajuan, subjudul, ikon segarkan, tulisan tugas luar | Sama seperti 30–32 | lihat 30–32 | `46_dampingan.png` |
| 〃 | Subjudul kotak konfirmasi | "Absen luar, lembur, pulang cepat milik karyawan" (mockup 71 memakai "Izin, absen luar, lupa absen milik admin" untuk owner; 46 tidak punya kotak ini) | Claude Code | `46_dampingan.png` |
| 47 Login terkunci | (tidak ada selisih) | Identik | sesuai | `47_dampingan.png` |
| 48 Beranda offline | Spanduk "Offline · 1 absen belum terkirim" | Spanduk tampil hanya saat HP offline; teks kanan "absen belum terkirim · Segera" tanpa angka (belum ada antrean absen offline) | Belum ada fungsi | `48_dampingan.png` |

## Kelompok 2: Admin cabang (49–70)

| No | Elemen / selisih | Kondisi di app | Siapa | Gambar |
|---|---|---|---|---|
| 49 Beranda admin | Dua kartu shift yang bisa digeser + titik | SATU kartu dengan dropdown Shift | Pemilik | `49_dampingan.png` |
| 〃 | Label "Hadir" | "Tepat waktu" (hanya status HADIR; Telat terpisah) | Pemilik | `49_dampingan.png` |
| 〃 | Daftar "Belum absen (shift 1)" semua nama | Mengikuti dropdown; 5 nama pertama (abjad) + tombol "Lihat semua (N)" membuka layar daftar penuh | Pemilik | `49_dampingan.png` |
| 〃 | "Perlu evaluasi (BAD) · 2 orang" | Tampil pudar, tombol mati, tulisan "Segera", tanpa angka | Pemilik (nonaktif) / Belum ada fungsi | `49_dampingan.png` |
| 〃 | Ikon segarkan | Ada (tidak di mockup) | Pemilik | `49_dampingan.png` |
| 〃 | Angka Izin/cuti | Selalu 0 sampai fitur izin ada (rumus siap) | Belum ada fungsi | `49_dampingan.png` |
| 〃 | "Belum absen" dihitung semua yang terjadwal | Hanya yang jam masuk shiftnya sudah lewat | Claude Code | – |
| 50 Menu admin | Item: Konfirmasi (angka), Absen manual, Data absensi, Jadwal shift, Input izin, Karyawan, Kalender libur, Dashboard bulanan, Log out | Item tambahan "Ubah nama HP ini" dan "Tutup menu" DIPERTAHANKAN | Pemilik | `50_dampingan.png` |
| 〃 | Item tanpa fitur aktif | Absen manual, Data absensi, Jadwal shift, Input izin, Kalender libur, Dashboard bulanan pudar "Segera" | Belum ada fungsi | `50_dampingan.png` |
| 〃 | Panah menu ke atas saat terbuka; layar belakang gelap penuh | Panah tetap ke bawah; beranda terlihat samar di belakang | Claude Code | `50_dampingan.png` |
| 51 Konfirmasi log out | Latar gelap penuh tanpa beranda | Dialog sama (ikon, judul, nama · cabang, Batal, Log out) tetapi beranda terlihat samar di belakang (DIPERTAHANKAN) | Pemilik | `51_dampingan.png` |
| 52 Konfirmasi | Chip: Semua, Lembur, Absen luar, Izin, Lupa absen | Chip Pulang cepat DIHAPUS (keputusan pemilik); Izin dan Lupa absen pudar "Segera" | Pemilik; Belum ada fungsi | `52_dampingan.png` |
| 〃 | Kartu Izin sakit, Lupa absen pulang, Tukar shift | Tidak ada (fiturnya belum ada) | Belum ada fungsi | `52_dampingan.png` |
| 〃 | Tombol Edit, penanda "Lokasi di dalam area toko" | Ada (tidak di mockup) | Pemilik | – |
| 〃 | Badge "Admin Ngawi" tanpa ikon; bar Home di dasar | Sama; bar Home di dasar layar gulir | sesuai | `52_dampingan.png` |
| 53 Detail konflik | Seluruh layar | Belum dibuat | Belum ada fungsi | – |
| 54 Absen manual, 55 Jadwal shift, 56 Tukar shift satu hari, 57 / 59 Pola shift | Seluruh layar | Belum dibuat; item menu pudar "Segera"; di sheet karyawan "Pola shift · Segera" | Belum ada fungsi | – |
| 〃 | Teks bawah "Ketuk nama untuk mengubah data, reset PIN/password, lepas ikatan HP, atau menonaktifkan." | "Ketuk nama untuk reset PIN atau menonaktifkan." (tanpa "ikatan HP" dan "password") | Pemilik (ikatan HP dihapus); Claude Code (sisanya) | `58_dampingan.png` |
| 60 Karyawan baru: data | "Nama tersedia." | "Nama tersedia · Segera" (belum ada pemeriksaan nama) | Belum ada fungsi | `60_dampingan.png` |
| 〃 | Kolom tanggal berupa teks "Kamis, 1 Okt 2026" | Pemilih tanggal bawaan browser (01/10/2026) | Claude Code | `60_dampingan.png` |
| 61 Karyawan baru: persetujuan + PIN | "Buat PIN 4 digit", 4 titik | "Buat PIN 5 angka", 5 titik (aturan server) | Claude Code | `61_dampingan.png` |
| 〃 | Tombol "Saya setuju" aktif (ikon centang) | Pudar "Saya setuju · Segera" | Belum ada fungsi | `61_dampingan.png` |
| 〃 | Sel kanan-bawah keypad kosong | Berisi tombol ⌫ (hapus) | Claude Code | `61_dampingan.png` |
| 62 Karyawan baru: daftar wajah | Seluruh layar | Belum dibuat (langkah 3 dilewati) | Belum ada fungsi | – |
| 63 Karyawan baru: selesai + akun | "Uji coba wajah berhasil · HP Toko 1 · 1,2 detik", tombol Uji coba lagi, Kirim akun via WA | Kartu pudar "Uji coba wajah · Segera"; "Uji coba lagi · Segera"; "Kirim akun via WA · Segera" | Belum ada fungsi | `63_dampingan.png` |
| 〃 | "Password awal 123456 / PIN awal 1234" | Diganti "Login: PIN 5 angka" + "PIN dibuat sendiri oleh karyawan" (tidak ada password/PIN awal) | Claude Code | `63_dampingan.png` |
| 64 Data absensi, 65 Edit absen, 66 Input izin, 67 Kalender libur, 68/69 Dashboard bulanan, 70 Detail karyawan | Seluruh layar | Belum dibuat; item menu pudar "Segera" | Belum ada fungsi | – |

## Kelompok 3: Owner (71–82)

| No | Elemen / selisih | Kondisi di app | Siapa | Gambar |
|---|---|---|---|---|
| 71 Beranda owner | Dua kartu shift yang bisa digeser | SATU kartu dengan dropdown Shift | Pemilik | `71_dampingan.png` |
| 〃 | Label "Hadir" | "Tepat waktu" | Pemilik | `71_dampingan.png` |
| 〃 | Dropdown Cabang (selalu, mengatur seluruh isi) | Ada, selalu tampil; pilihan Cabang memanggil server | sesuai / Pemilik | `71_dampingan.png` |
| 〃 | – (tidak ada di mockup) | Daftar "Belum absen" (5 nama + Lihat semua) dan ikon segarkan | Pemilik | `71_dampingan.png` |
| 〃 | "Perlu perhatian": 4 baris dua-baris tanpa tombol centang | Maksimal 3 baris satu-baris dengan tombol ✓ per baris, "Lihat semua (N)" menuju layar daftar; isi dari log nyata (bukan "HPT-PST-02 belum sinkron" dst.) | Pemilik (spesifikasi ✓ ada di CLAUDE.md); Belum ada fungsi (jenis item sinkron/ubah absen/kunci periode) | `71_dampingan.png` |
| 〃 | "Perlu evaluasi (BAD) · 3 orang" | Pudar, "Segera", tanpa angka | Pemilik / Belum ada fungsi | `71_dampingan.png` |
| 〃 | "Telat 7 hari terakhir" | Ada, dari data nyata server; "Tertinggi: …" hanya bila ada telat | sesuai (data nyata) | `71_dampingan.png` |
| 72 Menu owner | "Log admin" dengan angka 1 | "Log admin · Segera" tanpa angka | Belum ada fungsi | `72_dampingan.png` |
| 〃 | Item lain (Kunci periode, Role & admin, Pengaturan, Cabang & shift, Laporan bulanan, Data absensi) aktif | Pudar "Segera" | Belum ada fungsi | `72_dampingan.png` |
| 〃 | Urutan Perangkat, Ganti password, Keluarkan semua perangkat, Log out | Sama persis (diselaraskan di paket ini); "Tutup menu" dihapus dari menu owner | sesuai | `72_dampingan.png` |
| 73 Log per kategori, 74 Log detail, 75 Pengaturan, 76 Kunci periode, 77 Role & admin | Seluruh layar | Belum dibuat; item menu pudar "Segera" | Belum ada fungsi | – |
| 78 HP baru: pilih jenis HP | – (tidak ada di mockup) | Tombol "Masuk sebagai Owner" dan teks pesan di bawah dipertahankan karena owner tidak punya jalan masuk lain | **TANYA** (mockup tidak punya jalur login owner) | `78_dampingan.png` |
| 79 Daftarkan HP toko | Cabang "Ngawi (ikut cabang admin)", ID "HPT-NGW-03", Kode "T3" | Tiga baris pudar "Segera" (nilainya baru ada setelah server mendaftarkan) | Belum ada fungsi | `79_dampingan.png` |
| 〃 | Nama HP berisi contoh "HP meja kasir" | Nilai awal "HP Toko" | Claude Code | `79_dampingan.png` |
| 80 Perangkat (HP toko) | Judul "Perangkat", subjudul "…filter: Ngawi" | Judul sama; subjudul mengikuti filter yang dipilih | sesuai | `80_dampingan.png` |
| 〃 | Pilih cabang, saklar "Tampilkan nonaktif", tombol "Ubah nama" | Tidak ada di mockup; dipertahankan karena fiturnya sudah ada | **TANYA** | `80_dampingan.png` |
| 〃 | "· Infinix" (model HP), "Aktif · terakhir sinkron 08:02", "3 absen belum terkirim · 07:40", "Nonaktif sejak 12 Sep" | Model HP tidak ada; teks status diganti "terakhir sinkron · Segera" / "nonaktif sejak · Segera" | Belum ada fungsi | `80_dampingan.png` |
| 81, 82 Laporan bulanan (ringkasan, per karyawan) | Seluruh layar | Belum dibuat; item menu pudar "Segera" | Belum ada fungsi | – |

## Pertanyaan untuk pemilik (kasus yang tidak ada di mockup)

1. **78**: Owner masuk lewat tombol "Masuk sebagai Owner" yang tidak ada di mockup. Dipertahankan. Mau dipindahkan ke tempat lain atau mockup ditambah?
2. **80**: Pilih cabang, saklar "Tampilkan nonaktif", dan tombol "Ubah nama" tidak ada di mockup. Dipertahankan. Dipertahankan atau dihapus?
3. **58**: Mockup tidak punya layar detail karyawan; app memakai sheet aksi saat nama diketuk. Dipertahankan?
4. **Pop-up 35**: pil hitam tambahan "Absen luar tercatat, menunggu persetujuan admin." menggandakan pil dari mockup. Hapus yang tambahan?

## Keputusan pemilik 2026-10-07 (sudah diterapkan, bukan selisih yang perlu dikembalikan)

| No | Layar | Keputusan | Siapa | Gambar |
|---|---|---|---|---|
| 1 | 30/31/32/46 | Subjudul "Belum absen hari ini" kembali tanpa titik, sama dengan mockup | Pemilik | `31_dampingan.png`, `46_dampingan.png` |
| 2 | 35 | Pil hitam tambahan "Absen luar tercatat…" dihapus; hanya pil mockup "Menunggu persetujuan admin" | Pemilik | `35_dampingan.png` |
| 3, 4 | 50 | "Ubah nama HP ini" dan "Tutup menu" dipertahankan | Pemilik | `50_dampingan.png` |
| 5 | 51 | Beranda samar di belakang dialog keluar dipertahankan | Pemilik | `51_dampingan.png` |
| 6 | 52 | Chip "Pulang cepat" dan durasi tepat lembur dihapus; teks mengikuti mockup (item pulang cepat tetap tampil di "Semua") | Pemilik | `52_dampingan.png` |
| 7 | 58 | Sheet aksi saat nama diketuk dipertahankan | Pemilik | `58_dampingan.png` |
| 8 | 58 | Baris Admin ditambahkan HANYA BACA (tanpa ketuk, tanpa aksi); `karyawan_daftar` mengirim `admin_daftar` (id, nama, panggilan, shift, aktif) | Pemilik | `58_dampingan.png` |
| 9 | 60 | Tombol hijau bawah di posisi app dan ikon kalender dipertahankan; baris info persis mockup "ID otomatis: K005 · Cabang: Ngawi · Jatah cuti: 6 hari · Role: Karyawan" dengan nilai dari server (`id_berikutnya`, cabang admin, `jatah_cuti` di pengaturan) | Pemilik | `60_dampingan.png` |
| 10 | 61 | Tombol ⌫ di keypad dipertahankan | Pemilik | `61_dampingan.png` |
| 11 | 45 | SELESAI (keputusan pemilik 2026-10-07): aturan sandi gaya lama diganti aturan akun yang berlaku, teks mengikuti peran: KARYAWAN = "PIN tepat 5 angka / Hanya angka / Angka apa pun boleh"; ADMIN = "Kata sandi minimal 8 karakter / Maksimal 100 karakter / Huruf besar dan kecil dianggap sama". Tombol Simpan tetap nonaktif "Segera" | `45_dampingan.png` |
| 12 | 36, 36e, 37, 38, 70 | SELESAI (keputusan pemilik): kalimat "Telat N kali. Tanpa pelanggaran untuk …" kembali di posisi mockup, isinya "–" abu dan pudar (tanpa angka, nama label, panah). Mockup 36 (EXCELLENT) tidak punya kalimat itu; kalimat "Tanpa pelanggaran. Pertahankan!" di 36/36e tetap seperti mockup | `37_dampingan.png`, `38_dampingan.png`, `70_dampingan.png` |
| 13 | 48 | SELESAI (keputusan pemilik): "Halo," dihapus; nama besar Oswald 30 px berisi "–" | `48_dampingan.png` |

## Kelompok 4: HP Toko (01–28), selisih yang butuh keputusan pemilik

Semua selisih di bawah **belum diputuskan pemilik**: tidak diubah, hanya dicatat. Elemen mockup tanpa data/fungsi tampil nonaktif "Segera".

| No | Elemen / selisih | Kondisi di app | Siapa | Gambar |
|---|---|---|---|---|
| 〃 | Kartu "Hari ini tidak masuk (8)" + nama-nama | Kartu putus-putus pudar "Hari ini tidak masuk · Segera" tanpa angka dan nama (belum ada data izin/libur di HP toko) | Belum ada fungsi | `01_dampingan.png` |
| 〃 | Tombol LEMBUR hitam menyala | Pudar sampai jam lembur (aturan jam). **Belum diputuskan pemilik, tidak diubah** | Belum diputuskan | `01_dampingan.png` |
| 02 Jadwal shift hari ini | Seluruh layar (muncul saat label "Shift 1 aktif ▾" diketuk) | Belum dibuat; label tetap tampil tetapi tidak membuka apa pun (butuh aksi jadwal di server) | Belum ada fungsi | `02_dampingan.png` |
| 03, 04, 08 Pindai wajah, wajah dikenali, wajah tidak terbaca | Seluruh layar | Belum dibuat (pengenalan wajah belum ada) | Belum ada fungsi | – |
| 05 Sudah absen (dobel), 06 Shift tidak sesuai jadwal, 07 Sudah absen lembur · revisi, 13 Peringatan lanjutan, 18 dan 19 (absen kemarin belum lengkap) | Seluruh layar | Belum dibuat; absen dobel ditolak server dengan pop-up "Tidak tersimpan" | Belum ada fungsi | – |
| 〃 | "Nama (terjadwal hari ini, urut abjad)" dan "(Shift 1)" di tiap nama | "Nama (urut abjad)" tanpa "(Shift N)": HP toko belum punya data jadwal, label mockup akan menyesatkan | Claude Code | `09_dampingan.png` |
| 〃 | Tautan "Tidak ada di jadwal atau karyawan cabang lain" | Pudar "Segera" | Belum ada fungsi | `09_dampingan.png` |
| 〃 | "Masukkan PIN 4 digit", 4 titik, "Digit keempat langsung menyimpan absen" | 5 angka, 5 titik, "Angka kelima…" (aturan server; mockup usang) | Pemilik (PIN 5 angka); mockup perlu direvisi | `09_dampingan.png` |
| 10 Pop-up tepat waktu | Kotak "Bulan ini" 18/1/0/5 dari 6 | Empat kotak pudar "Segera" tanpa angka (sisa cuti belum dihitung) | Belum ada fungsi | `10_dampingan.png` |
| 11 Pop-up telat | Kotak "Bulan ini" berisi angka | Empat kotak pudar "Segera" (warna merah muda seperti mockup) | Belum ada fungsi | `11_dampingan.png` |
| 12 Alasan telat | (tidak ada selisih tampilan) | Sama | sesuai | `12_dampingan.png` |
| 14 Pop-up pulang | Kotak "Bulan ini" | Empat kotak pudar "Segera" | Belum ada fungsi | `14_dampingan.png` |
| 21 Absen terlalu pagi | "Sekarang 06:21. Silakan kembali absen 23 menit lagi." | Pop-up dibuat seperti mockup (latar abu, ikon jam, "Dibuka mulai HH:mm (Shift N)"); baris sisa waktu = "Sekarang dan sisa waktu · Segera" (tidak ada jam server di layar); jam buka diambil dari teks pesan server | Belum ada fungsi | `21_dampingan.png` |
| 22 Cek surat dokter, 23 Izin sakit dengan surat dokter | Seluruh layar | Belum dibuat (fitur izin belum ada) | Belum ada fungsi | – |
| 24 Owner · Cabang dan shift, 25 Owner · Data absensi | Seluruh layar | Belum dibuat; item menu "Segera" | Belum ada fungsi | – |
| 27 Owner · Keluarkan semua perangkat | Daftar perangkat yang sedang login | Daftar tampil bila server mengirim; dialog tanpa latar gelap penuh (beranda samar di belakang) | Claude Code | `27_dampingan.png` |

## Keputusan pemilik 2026-10-07 (sudah diterapkan, pemutus = pemilik)

| No | Layar | Keputusan | Gambar |
|---|---|---|---|
| 1 | 01 | Tanggal mengikuti mockup: format "NamaHari, d NamaBulan yyyy" dengan tanggal hari ini (contoh "Rabu, 7 Oktober 2026") | `01_dampingan.png` |
| 2 | 09 | Versi app dipertahankan, dengan: (a) tautan "‹ Kembali ke layar utama" diturunkan (jarak 18 px dari keypad); (b) bingkai foto diperbesar dari 76 px/border 5 px menjadi 100 px/border 7 px (**ukuran pilihan Claude Code, mohon dinilai pemilik di gambar dampingan**); (c) judul mengikuti mode: "Absen Masuk PIN", "Absen Pulang PIN", "Lembur PIN" | `09_dampingan.png` |
| 3 | 15, 17 | Pop-up 15 (pulang awal) dan 17 (lembur) dibuat persis mockup, tampil LEBIH DULU sebelum layar alasan (16) / pekerjaan lembur (20). Urutan penyimpanan dan logika server tidak berubah: absen baru tersimpan setelah alasan/pekerjaan dikirim. Pop-up 15 memakai hitung mundur 10 detik; kalau tidak ditekan tidak ada yang tersimpan (sama dengan aturan lama). Pop-up 17 menutup sendiri 4 detik lalu membuka layar 20. Jam = jam tiket dari server (bukan jam HP). "Durasi lembur" memakai `durasi_menit` dari balasan server (data nyata, bukan karangan); bila server tidak mengirimnya, tidak ditampilkan. **Risiko yang sudah disadari pemilik:** teks "Terima kasih" muncul sebelum absen tersimpan | `15_dampingan.png`, `17_dampingan.png` |
| 4 | 16, 20, 21, 26 | Versi app sekarang dipertahankan | `16_dampingan.png`, `20_dampingan.png`, `21_dampingan.png`, `26_dampingan.png` |
| 5 | 28, 52 | Versi app dipertahankan; kartu tampil MAKSIMAL 5, urut dari yang paling lama (tanggal lalu jam); sisanya mengantre dan naik setelah satu di-ACC/ditolak; angka total tetap seluruhnya. Semua halaman server dimuat sekali, diurutkan di HP. Hak, ACC, tolak, edit, foto tidak berubah | `28_dampingan.png`, `52_dampingan.png` |
| 6 | 35, 60 | Disetujui pemilik, tidak diubah | `35_dampingan.png`, `60_dampingan.png` |

## Selisih kelompok 4 yang MASIH belum diputuskan pemilik (tidak diubah)

| No | Elemen / selisih | Kondisi di app | Gambar |
|---|---|---|---|
| 01 | Tombol LEMBUR hitam menyala | Pudar sampai jam lembur | `01_dampingan.png` |
| 01 | Kartu "Hari ini tidak masuk (8)" + nama | Nonaktif "Segera" tanpa angka dan nama | `01_dampingan.png` |
| 02 | Layar jadwal hari ini (muncul dari label "Shift 1 aktif ▾") | Belum dibuat; label tidak membuka apa pun tetapi masih tampak bisa diketuk | `02_dampingan.png` |
| 09 | "Nama (terjadwal hari ini, urut abjad)", "(Shift N)", tautan "Tidak ada di jadwal…" | Label "Nama (urut abjad)"; tautan dan "Foto ulang" nonaktif "Segera"; keypad pudar sebelum nama dipilih; "PIN 5 angka" (mockup usang 4 digit) | `09_dampingan.png` |
| 10, 11, 14 | Kotak "Bulan ini" berisi angka | Empat kotak nonaktif "Segera" (sisa cuti belum dihitung) | `10_dampingan.png`, `11_dampingan.png`, `14_dampingan.png` |
| 15, 17 | Kotak "Bulan ini" | Nonaktif "Segera" | `15_dampingan.png`, `17_dampingan.png` |
| 27 | Dialog tanpa beranda; daftar perangkat | Beranda samar di belakang; daftar tampil bila server mengirim | `27_dampingan.png` |
| 28 | Kartu izin, tanpa kotak Foto, badge hitam, subjudul "Pengajuan milik admin" | Kartu izin belum ada; kotak Foto, badge abu, subjudul memuat jumlah | `28_dampingan.png` |
| 52 | Chip "Izin 1", "Lupa absen 1", kartu izin/lupa absen/tukar shift | Chip "Segera" nonaktif; kartu itu belum ada | `52_dampingan.png` |
| 03, 04, 05, 06, 07, 08, 13, 18, 19, 22–25 | Seluruh layar | Belum dibuat (butuh fitur wajah/jadwal/izin/server) | – |

## Keputusan pemilik 2026-10-07 (sudah diterapkan, pemutus = pemilik)

| No | Layar | Keputusan | Gambar |
|---|---|---|---|
| 1 | 30, 31, 32, 46 | "Halo," dihapus; nama saja dengan gaya blok "Cabang Ngawi · HP Toko 1" layar 01 (Poppins 15 px tebal, garis hitam tegak di kiri). Subjudul "Belum absen hari ini" tetap. Hanya HP pribadi. Selisih dari mockup: nama jauh lebih kecil dari judul besar mockup | `30_dampingan.png`, `31_dampingan.png`, `32_dampingan.png`, `46_dampingan.png` |
| 2 | 30, 31, 32, 46 | Ikon segarkan pindah ke bawah ikon akun, rata kanan, sejajar baris nama. Beranda 49 dan 71 tidak berubah | sama |
| 3 | 30–32, 46, 49, 71 | Tarik-ke-bawah untuk refresh (fitur baru, tidak ada di mockup): ambang 90 px, hanya di paling atas, memanggil fungsi ikon, penanda berputar kecil di atas layar | – (perilaku) |
| 4 | 09, absen luar | Lingkaran foto 160 px / border 9 px (**ukuran usulan Claude Code**; mohon dinilai). Layar 09 tidak muat 360x640 tanpa gulir (isi 806 px); halaman otomatis menggulir ke keypad setelah nama dipilih. Absen luar muat 360x640 tanpa gulir | `09_dampingan.png`, `luar_masuk_app.png`, `luar_pulang_app.png`, `luar_lembur_app.png` (app saja, tidak punya mockup sendiri), `09_360x640.png`, `luar_masuk_360x640.png`, `luar_pulang_360x640.png`, `luar_lembur_360x640.png` |

## Selisih BARU putaran "semua layar belum" (2026-10-07) — butuh keputusan pemilik

Semua layar baru = tampilan saja (aksi "Segera", tanpa angka/nama contoh). Gambar: `docs/audit/visual/NN_dampingan.png` (kiri app, kanan mockup).

| No | Layar | Selisih dari mockup | Gambar |
|---|---|---|---|
| 1 | Semua layar baru | Angka, nama, tanggal, jam contoh diganti "–"; baris tabel/daftar contoh dibuang (hanya kepala kolom); dropdown/filter/input nonaktif tanpa isi | `NN_dampingan.png` tiap layar |
| 2 | 36, 36e, 37, 38 | DIGANTIKAN keputusan pemilik 2026-10-07 butir 8: 37 dan 38 kini layar tersendiri (berwarna penuh, tidak bisa dibuka); 36e = EXCELLENT berwarna (tidak bisa dibuka); 36 = satu-satunya yang bisa dibuka, lencana netral nonaktif "Segera" | `36_dampingan.png` (36e), `37_dampingan.png`, `38_dampingan.png`, `36_netral_dampingan.png` |
| 3 | 57, 59 | SELESAI (keputusan pemilik): 57 satu-satunya layar Pola shift; 59 dihapus dari app | `57_dampingan.png` |
| 4 | 67 | Warna sampel pada kalender libur memakai warna mockup; hari libur nyata belum ada | `67_dampingan.png` |
| 5 | 70 | DISETUJUI pemilik (mirip 36, tanpa baris riwayat). Kalimat tren dikembalikan "–". Kalimat "Telat N kali. Tanpa pelanggaran untuk EXCELLENT/…" (36, 37, 38, 70) masih dihapus karena berisi angka dan nama label: BELUM diputuskan | `70_dampingan.png` |
| 6 | 68, 81 | SELESAI (keputusan pemilik butir 4): kartu empat angka dan caption grafik tampil di posisi mockup berisi "–" saja, tanpa panah/angka | `68_dampingan.png`, `81_dampingan.png` |
| 7 | 02 | Latar di balik layar jadwal berbeda sedikit dari mockup (layar utama nyata, bukan gambar) | `02_dampingan.png` |
| 8 | 04, 05, 06, 07, 13, 18, 19, 22, 23, 34, 43, 53, 56, 62, 65, 70 | Layar KEJADIAN: dibuat lengkap tetapi SENGAJA belum bisa dibuka dari navigasi apa pun dan belum disambung ke logika absen; 57 juga belum punya jalur | dampingan tiap layar |
| 9 | 03, 08 | Alur wajah hanya tampilan: 03 tampil 1–2 detik lalu 08; ULANGI nonaktif; kamera tidak dibuka; MANUAL → 09 | `03_dampingan.png`, `08_dampingan.png` |
| 10 | 30, 31, 32, 46 | Nama besar kembali seperti mockup (Oswald 30 px tebal), tetap TANPA "Halo,". Menggantikan gaya blok "Cabang…" 15 px dari keputusan 2026-10-07 butir 1 (selisih dari mockup tinggal: tanpa "Halo,") | `30_dampingan.png` |

## Keputusan pemilik 2026-10-07 (putaran perbaikan 10 butir, pemutus = pemilik)

| No | Layar | Keputusan | Gambar |
|---|---|---|---|
| 1 | 34 | PIN 5 angka; chip "Keperluan" dihapus; satu kolom "Keterangan tujuan (nama klien atau alamat), wajib minimal 5 karakter" (min 5, maks 100) sama dengan layar absen luar yang berjalan | `34_dampingan.png` |
| 1 | 45 | Teks "(awal: 123456)" (sisa password awal) diganti "Password lama" | `45_dampingan.png` |
| 2 | 57, 59 | 57 = satu-satunya layar Pola shift; semua jalur membuka 57; 59 dihapus (mockup 59 tidak diubah) | `57_dampingan.png` |
| 3 | 70 | Mirip 36 tanpa baris riwayat: disetujui | `70_dampingan.png` |
| 4 | 68, 81, 36/36e/37/38, 70 | Kalimat tren dikembalikan: hanya "–" (tanpa panah, tanpa angka); panah baru muncul bila ada perbedaan nyata (fitur laporan nanti) | `68_dampingan.png`, `81_dampingan.png` |
| 5 | 02 | Latar di balik layar dipertahankan | – |
| 6 | 03, 08 → 09 | Alur wajah dipertahankan | – |
| 7 | 35, 48 | Dibuat sebagai tampilan (layar kejadian, tidak bisa dipicu, tanpa angka/nama contoh, tanpa antrean offline) | `35_dampingan.png`, `48_dampingan.png` |
| 8 | 36e, 37, 38 | Layar Report tersendiri berwarna penuh, tidak bisa dibuka; 36 yang bisa dibuka = lencana netral nonaktif | `36_dampingan.png`, `37_dampingan.png`, `38_dampingan.png` |

## Selisih BARU yang butuh keputusan pemilik (putaran 2026-10-07 butir 1–8)

| No | Layar | Selisih dari mockup | Gambar |
|---|---|---|---|
| 11 | 45 | Aturan sandi di mockup masih gaya lama ("6 angka", "Bukan angka berurutan atau kembar", "Bukan 123456 dan tidak sama dengan PIN"); app memakai aturan baru (admin: minimal 8 karakter). Tampil dengan "–" menggantikan angka, belum diubah | `45_dampingan.png` |
| 12 | 36, 36e, 37, 38, 70 | Kalimat "Telat N kali. Tanpa pelanggaran untuk …" / "Telat 7 kali (batas 5) dan 1 alpha. …" masih dihapus (berisi angka dan nama label) | `36_dampingan.png`, `37_dampingan.png`, `38_dampingan.png` |
| 13 | 48 | "Halo, –" masih ada seperti mockup (keputusan "tanpa Halo," hanya untuk 30, 31, 32, 46) | `48_dampingan.png` |
| 14 | 35 | SELESAI (keputusan pemilik): layar 35 dipakai sebagai pop-up nyata setelah absen luar (masuk, pulang, lembur) diterima server; jam = jam tiket server; kotak "Bulan ini" nonaktif "–"; tidak lagi layar kejadian. Pengiriman gagal: pesan galat lama tetap | `35_dampingan.png` |
| 15 | 75 | SELESAI (keputusan pemilik): daftar "Keperluan absen luar" DIPERTAHANKAN sebagai tampilan nonaktif; diputuskan ulang saat fitur Pengaturan dibangun (absen luar sudah ketik bebas) | `75_dampingan.png` |
| 16 | 68, 81, 36, 36e, 37, 38, 70, 82 | SELESAI (keputusan pemilik): teks tren "–" berwarna ABU NETRAL (bukan hijau/merah); hijau/merah baru dipakai kelak bila ada naik/turun nyata | `68_dampingan.png`, `81_dampingan.png` |
| 17 | 36 (bisa dibuka) | DISETUJUI pemilik, tidak diubah | `36_netral_dampingan.png` |

## Keputusan pemilik 2026-10-07 (selisih 11–17, pemutus = pemilik)
Lihat tabel "Selisih BARU" di atas: nomor 11–17 sudah diputuskan dan diterapkan.

## Selisih BARU yang butuh keputusan pemilik (putaran selisih 11–17)

| No | Layar | Selisih dari mockup | Gambar |
|---|---|---|---|
| 18 | 45 | Untuk KARYAWAN aturan memakai kata "PIN", tetapi label kolom masih "Password lama / Password baru / Ulangi password baru" dan judul "Ganti password" seperti mockup (karyawan hanya punya PIN). Tidak diubah; perlu keputusan teks label untuk karyawan | `45_dampingan.png` |
| 19 | 35 (pop-up nyata) | Mockup 35 hanya punya varian MASUK. Untuk pulang dan lembur luar kerangka 35 dipakai dengan judul "Terima kasih, {nama}!" dan kata kerja dari pop-up lama ("Pulang …", "Lembur …, 1 jam 15 menit"); ikon jempol hijau tetap | `35_dampingan.png` |
| 20 | pop-up telat luar, 15, 17 | Pop-up telat (merah, ISI ALASAN) dan pop-up 15/17 tetap pop-up lama; layar 35 hanya untuk absen luar yang sudah diterima dan tersimpan | – |
| 21 | 35 (pop-up nyata) | Pil jam memuat 20 huruf pertama keterangan yang diketik (seperti pop-up lama), padahal mockup memuat nama keperluan | `35_dampingan.png` |


## SESI A-C, FITUR A — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar |
|---|---|---|---|
| SA5 | 41, 23, 66 | Pesan salah (mis. "Tidak ada hari kerja terjadwal") tampil merah di baris "N hari kerja"; hasil kirim tampil di kotak dialog standar "Pengajuan terkirim" (tidak ada di mockup) | – |
| SA8 | 52 | Kartu izin tidak punya kotak "Foto" (sama mockup); chip "Izin N" aktif, "Lupa absen" tetap nonaktif | `52_dampingan.png` |


## SESI A-C, FITUR B — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar |
|---|---|---|---|
| SB2 | 55 | Nama karyawan memakai nama lengkap dari server dan daftar mengikuti cabang; tabel hanya Senin-Sabtu seperti mockup (tidak ada kolom Minggu) | `55_dampingan.png` |
| SB4 | 42 | Pada mode "Pindah shift" label "Tukar dengan" berubah jadi "Pindah ke shift" dan pratinjau hanya "Anda -> Shift N" (mockup hanya menggambarkan tukar) | `42_dampingan.png` |
| SB5 | 43 | Untuk ajakan "pindah shift" judul "{nama} ingin pindah shift" dan baris "Anda tetap di Shift N" (mockup hanya tukar) | `43_dampingan.png` |
| SB7 | 52 | Kartu tukar shift tampil di "Semua" tanpa chip tersendiri (mockup 52 tidak punya chip Tukar shift) | `52_dampingan.png` |

## SESI A-C, FITUR C (koreksi absen) — ASUMSI yang diambil (butuh setuju atau koreksi pemilik)

| No | Aturan yang tidak ada di dokumen | Pilihan yang dipakai (paling aman dan sederhana) |
|---|---|---|
| C1 | Shift yang dipakai absen HP toko dan HP pribadi | Shift EFEKTIF hari itu (kalender, pola, tukar/pindah shift), bukan hanya shift bawaan akun. Kalau jadwal gagal dibaca, memakai shift bawaan akun (absen tidak gagal). |
| C2 | Berlaku sampai kapan tombol BUKAN SAYA | Kode dari server berlaku 5 menit dan tiket waktu masih harus berlaku (3 menit). Lewat itu: "Waktu habis, tekan tombol absen lagi". Peringatan 05/06/07 hanya untuk absen di HP toko (absen luar HP pribadi tidak diperiksa). |
| C3 | Apa yang terjadi pada absen lama saat BUKAN SAYA | Absen masuk lama: baris absensi hari itu dihapus; absen pulang/lembur lama: kolom pulang dikosongkan. Salinan lengkap disimpan di log (aksi KONFLIK_ABSEN) lalu absen baru langsung dicatat. Absen baru gagal dicatat = absen lama dikembalikan. Masuk lama yang sudah punya pulang tidak bisa dilaporkan ("Hubungi admin"). Absen baru sesudah BUKAN SAYA memakai shift jadwal (tanpa pertanyaan shift beda). Kalau absen baru berupa pulang cepat/lembur dan alasannya tidak diisi, absen baru tidak tersimpan (absen lama tetap aman di log). |
| C4 | Keputusan admin atas konflik | Pindahkan ke KARYAWAN aktif cabang yang sama (untuk masuk: belum punya absen masuk; untuk pulang: sudah masuk dan belum pulang), status dihitung ulang untuk tujuan; atau hapus (tidak dihitung untuk siapa pun). Alasan dipilih dari 3 pilihan ("Salah tekan IYA saat pengenalan wajah" dari mockup; "Salah pilih nama" dan "Absen diwakilkan orang lain" tambahan). Dicatat di log KONFLIK_SELESAI. Admin tidak boleh memutuskan konflik miliknya sendiri; owner hanya konflik milik admin. |
| C5 | Kapan pertanyaan "shift tidak sesuai jadwal" muncul | Bila sudah lewat 60 menit (jendela_absen_menit) dari jam masuk shift jadwal DAN jendela masuk shift lain sudah buka dan shift itu belum lewat jam pulangnya. Pilih shift lain: baris absensi memakai shift itu, ditandai SHIFT_BEDA, acc_masuk MENUNGGU, muncul di Konfirmasi (ACC / Tolak seperti absen lain); HADIR/TELAT dihitung dari shift yang dipilih. "Tidak, saya telat" = shift jadwal. |
| C6 | Layar revisi lembur (07) | Hanya muncul bila sudah LEMBUR DI TOKO lalu LEMBUR ditekan lagi. "Ganti jadi lembur" dari pulang normal tetap langsung (tanpa layar 07), seperti sebelumnya. |
| C7 | Daftar "Lupa absen" | Hari-hari SEBELUM hari ini dalam 14 hari terakhir: sudah masuk belum pulang = "Lupa absen pulang"; sudah pulang tanpa masuk = "Lupa absen masuk". Tampil di Konfirmasi admin sampai diisi lewat Absen manual (tidak ada tombol tolak/abaikan). Belum ada perhitungan performa, jadi tidak ada yang dipotong; "lupa masuk" dihitung hadir di beranda (statusnya kosong sampai admin mengisi jam masuk). |
| C8 | Pulang tanpa absen masuk (19) | Hanya bila hasilnya PULANG NORMAL; baris absensi dibuat dengan masuk kosong dan tanda LUPA_MASUK. Pulang cepat atau lembur tanpa masuk tetap ditolak "Belum absen masuk hari ini". Absen masuk setelah itu di hari yang sama ditolak ("Absen hari ini sudah tercatat. Hubungi admin untuk melengkapi jam masuk."). |
| C9 | Belum pulang kemarin (18, 13) | Absen terakhir sebelum hari ini (maksimal 14 hari) yang sudah masuk dan belum pulang. Tepat waktu: layar 18 menggantikan pop-up hijau; telat: pop-up telat, alasan, baru layar 13. Waktu menutup otomatis: 18 dan 19 = 6 detik, 13 = 8 detik. |
| C10 | Absen manual (54) | Hanya admin, untuk KARYAWAN aktif di cabangnya (bukan dirinya dan bukan admin lain). Tanggal tidak boleh di masa depan menurut jam server dan maksimal 31 hari ke belakang; jam di masa depan ditolak. Jenis Masuk atau Pulang (lembur manual tidak ada). Masuk boleh di jam berapa pun (sebelum jendela absen tetap HADIR); pulang butuh masuk, harus sesudah jam masuk, tidak menimpa. Alasan wajib dari 4 pilihan mockup. FOTO WAJIB (kamera/galeri), dikirim sesudah data tersimpan; kalau unggah gagal absen tetap tersimpan dan admin diberi tahu. Pencocokan wajah dilewati (dicatat di log "wajah belum diverifikasi"). id absen berakhiran A, cara MANUAL. |
| C11 | Data absensi (64) dan edit (65) | Hanya admin cabang sendiri (owner belum punya layarnya). Filter Tanggal: Pekan ini / Hari ini / Bulan ini; 30 baris per muatan, dimuat lagi otomatis saat digulir. Edit hanya JAM (Masuk atau Pulang) + foto opsional; alasan wajib minimal 5 karakter; status dihitung ulang (pulang lembur tetap lembur); langsung berlaku tanpa ACC; tanda DIEDIT; log EDIT_ABSEN berisi sebelum/sesudah/alasan. Admin tidak boleh mengedit miliknya sendiri atau data admin lain. Bulan terkunci hanya owner: penjaga memakai baris pengaturan KUNCI_PERIODE (nama yyyy-MM, nilai TRUE); fitur kunci periode belum ada sehingga tidak ada yang terkunci. Foto lama tidak dihapus dari Drive (tautannya dicatat di log); foto baru diberi akhiran _edit. |
| C12 | Peringatan lanjutan dan beberapa peringatan sekaligus | Pop-up utama dulu; layar peringatan lanjutan (13) sesudah pop-up utama (dan layar alasan) selesai; satu per satu. |
| C13 | Foto absen tadi di layar 05/07 | Dimuat terpisah lewat foto_dobel (dari Drive, tidak publik, hanya HP toko dengan kode sah) supaya peringatan tampil cepat. |

## SESI A-C, FITUR C — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar |
|---|---|---|---|
| SC3 | 53 | Teks "wajah" di bawah foto tetap seperti mockup (belum ada data wajah); pilihan Alasan 3 buah (1 dari mockup) | `53_dampingan.png` |
| SC9 | 52 | Chip "Lupa absen" kini aktif (sebelumnya "Segera") | `52_dampingan.png` |

## Keputusan pemilik 2026-10-07 (selisih Fitur A–C, pemutus = pemilik)

Selisih berikut DIPERTAHANKAN apa adanya (bukan lagi selisih terbuka). SB1 dan SC1 juga dicatat di tabel "Perubahan dari mockup" di `docs/keputusan-desain.md`. Asumsi A1–A14 dan B1–B14 BELUM disetujui dan tetap terbuka di atas. Selisih lain (SA5, SA8, SB2, SB4, SB5, SB7, SC3, SC9) masih menunggu keputusan.

| No | Layar | Selisih (ringkas) | Keputusan |
|---|---|---|---|
| SA1 | 30-32, 46 | "Lihat" pada kartu "N pengajuan menunggu ACC" tampil pudar dan tidak bisa diketuk (mockup tidak punya layar daftar pengajuan) | dipertahankan |
| SA2 | 01 | "Ketuk untuk lihat semua" pada kartu "Hari ini tidak masuk" dipudarkan dan kartu tidak bisa diketuk (mockup tidak punya daftar lengkap) | dipertahankan |
| SA3 | 67 | Mockup tidak punya tampilan ubah tanggal: dipakai kotak dialog standar (jenis + keterangan + Simpan/Hapus). Mockup juga tidak punya tombol ganti bulan: bulan diganti dengan geser kiri/kanan di kalender | dipertahankan |
| SA4 | 41, 23, 66 | Kolom Mulai/Selesai memakai pemilih tanggal bawaan HP ("12/10/2026"), mockup menampilkan teks "Sen, 5 Okt 2026" | dipertahankan |
| SA6 | 41/23 | Layar yang terbuka dari tombol Izin/Cuti mengikuti jenis pertama di pengaturan (Sakit) sehingga biasanya terbuka varian 23; mockup membuka 41 dengan jenis Menikah | dipertahankan |
| SA7 | 22 | Foto surat memakai kotak foto mockup; tidak ada Tolak di layar 22 (sama mockup), Tolak dilakukan dari kartu Konfirmasi | dipertahankan |
| SB1 | 55 | Tombol "Tukar shift" (menuju 56) DITAMBAHKAN di bawah "Salin minggu lalu": keputusan-desain.md menyebutnya tetapi mockup 55 tidak punya, sehingga 56 tidak punya jalur | dipertahankan |
| SB3 | 57 | Mockup tidak menggambarkan cara mengubah urutan: ketuk chip = ganti ke shift berikutnya; setelah shift terakhir ketuk lagi = hapus (minimal 2). Layar 57 menampilkan scrollbar tipis di pratinjau | dipertahankan |
| SB6 | 55, 56, 57, 42 | Kolom tanggal memakai pemilih tanggal bawaan HP ("07/10/2026") bukan teks "Selasa, 6 Okt 2026" | dipertahankan |
| SC1 | 52 | Kartu "Konflik absen" tidak ada di mockup 52; dibuat seperti kartu Lupa absen dengan tombol "Lihat detail" (satu-satunya jalan ke layar 53) | dipertahankan |
| SC2 | 54 | Foto memakai pemilih foto bawaan HP (kamera atau galeri), bukan kamera langsung; tulisan "Wajah harus cocok dengan nama" tetap tampil padahal pencocokan wajah belum ada | **DICABUT 2026-10-07 (Tahap 4):** foto absen kini lewat kamera dalam aplikasi (lihat SG1); galeri tidak boleh |
| SC4 | 64 | Pilihan filter Tanggal 3 buah (Pekan ini, Hari ini, Bulan ini); mockup hanya memperlihatkan "Pekan ini". Daftar memuat bertahap saat digulir (mockup tidak punya tombol "muat lagi") | dipertahankan |
| SC5 | 65 | Jam diubah dengan pemilih jam bawaan HP; foto lama dimuat otomatis di kotak | pemilih jam dipertahankan; **pemilih foto DICABUT 2026-10-07 (Tahap 4):** Update foto kini kamera dalam aplikasi (SG1) |
| SC6 | 05 | Untuk absen pulang yang kedua, header "ABSEN PULANG" dan kalimat "sudah absen pulang jam" (mockup hanya menggambarkan masuk) | dipertahankan |
| SC7 | 07 | Baris pil: "Lembur 1 jam 18 menit · 1–2 jam" (mockup "Lembur – jam – menit · –") | dipertahankan |
| SC8 | 13, 18, 19 | Hitung mundur menutup otomatis (8 detik untuk 13, 6 detik untuk 18 dan 19; mockup hanya menulis "– detik"); tanpa confetti pada 18 | dipertahankan |

## TAHAP 1 (perbaikan A–C) — asumsi dan selisih baru

| No | Aturan yang tidak ada di dokumen | Pilihan yang dipakai |
|---|---|---|
| D1 | Layar 74 | Di mockup layar 74 adalah "Log: Edit absen" (TABEL log per kategori), BUKAN layar edit. Karena itu pensil di layar 25 (Data absensi owner) membuka layar 65 yang sama dengan admin (lencana "Owner", Back kembali ke 25). Layar 74 tetap tampilan saja. Mohon dipastikan apakah ini yang dimaksud. |
| D2 | Owner mengisi absen manual | Hanya untuk akun ADMIN (semua cabang), lewat tombol "Isi jam (absen manual)" pada kartu Lupa absen di Konfirmasi owner. Foto wajib. Ditegakkan di server (`bolehTargetKoreksi`): admin ditolak mengisi/mengubah absennya sendiri, data admin lain, dan karyawan cabang lain. |
| D3 | Edit absen oleh owner | Owner boleh mengedit KARYAWAN maupun ADMIN di semua cabang, termasuk bulan terkunci; admin tetap hanya karyawan cabangnya dan bukan miliknya. |
| D4 | Membatalkan pengajuan sendiri | Hanya yang masih MENUNGGU (izin/cuti, ajakan tukar/pindah shift oleh pemohon). Setelah dibatalkan tidak diteruskan ke admin (status BATAL, baris tidak dihapus, dicatat di log BATAL_IZIN). |

## TAHAP 1 — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar (kiri app, kanan mockup) |
|---|---|---|---|
| SF3 | 25, 65, 74 | Pensil di layar 25 membuka layar 65 (lihat D1); layar 74 (log) tidak dihubungkan | `25_dampingan.png` (kiri mockup, kanan app) |
| SF4 | 30-32, 46 | Tombol baru "Batalkan pengajuan" di bawah kartu "N pengajuan menunggu ACC" (hanya tampil bila N > 0) dan dialog daftar pengajuan dengan tombol "Batalkan" + konfirmasi. Tidak ada di mockup; "Lihat" tetap pudar sesuai keputusan SA1 | `SF4_dampingan.png`, `SF4_dialog.png` |

## TAHAP 2 (laporan dan label) — asumsi yang diambil (butuh setuju atau koreksi pemilik)

| No | Aturan yang tidak ada di dokumen | Pilihan yang dipakai (paling aman dan sederhana) |
|---|---|---|
| E1 | Aturan label | Tertulis di `docs/keputusan-desain.md` baris 88: EXCELLENT = tanpa alpha, telat, izin biasa, pulang awal; BAD = alpha >= 1, telat > 5, pulang awal > 5, atau izin biasa > 3 hari; selainnya GOOD. Batas dibaca dari pengaturan UMUM (`batas_telat_bad`, `batas_pulang_awal_bad`, `batas_izin_biasa_bad`; bawaan 5, 5, 3). Izin khusus dan cuti tidak mempengaruhi label. |
| E2 | Hari kerja dan alpha | Hari kerja = hari terjadwal (kalender > pola > shift, libur Minggu/tanggal merah dikecualikan) dari awal bulan (atau tanggal mulai kerja) sampai hari ini, TANPA hari yang izin/cuti-nya DITERIMA. Alpha = hari kerja SEBELUM hari ini tanpa absen dan tanpa izin diterima; izin yang masih MENUNGGU tidak dihitung alpha. Hari ini belum absen = belum dinilai. Absen luar yang DITOLAK dianggap tidak hadir. |
| E3 | Label sebelum ada data | Bila belum ada hari yang bisa dinilai (mis. tanggal 1 sebelum jam masuk) label KOSONG: lencana tetap "Segera" nonaktif dan Report netral (36). Label tidak ditebak. |
| E4 | Telat, pulang awal, lembur | Telat = hari ber-status TELAT (menit dijumlahkan); pulang awal = PULANG CEPAT yang tidak ditolak; lembur disetujui = LEMBUR DI TOKO berstatus DITERIMA (tingkat dari kolom lembur). Absen dengan tanda "lupa masuk" (hanya ada jam pulang) dihitung hadir. |
| E5 | Menunggu ACC dan Ditolak bulan ini | Menunggu = absen (luar, lembur, pulang awal, shift beda) bulan itu yang acc-nya MENUNGGU. Ditolak = absen dengan acc DITOLAK dan pengajuan izin berstatus DITOLAK yang mulai di bulan itu (badge "Ditolak"). Izin yang menunggu tidak ditampilkan di kotak ini (sudah ada di kartu "N pengajuan menunggu ACC"). |
| E6 | Tren | Hanya bila bulan pembanding (bulan sebelumnya) punya data (label tidak kosong) DAN ada selisih nyata: label naik/turun, telat membaik/memburuk, kartu dashboard naik/turun. Tanpa itu tampil "–" abu tanpa panah. Sama dengan bulan lalu = "–". Warna: membaik hijau, memburuk merah; lembur netral. |
| E7 | Kalimat di bawah label | Diisi data nyata: EXCELLENT "Tanpa pelanggaran. Pertahankan!"; GOOD "Telat 2 kali. Tanpa pelanggaran untuk EXCELLENT."; BAD "Telat 7 kali (batas 5) dan 1 alpha. Masuk daftar evaluasi." (lihat SD1). |
| E8 | Report dibuka dari tombol Report | Layar dipilih menurut label bulan ini: EXCELLENT = 36e, GOOD = 37, BAD = 38, belum ada data = 36 (lihat SD3). Bulan yang tampil = bulan ini. Tombol bulan di pojok kanan atas hanya menampilkan nama bulan (tidak bisa dipilih). |
| E9 | Dashboard | Admin: hanya KARYAWAN cabangnya. Owner: KARYAWAN dan ADMIN, semua cabang atau satu cabang. Kehadiran % = jumlah hari masuk / jumlah hari kerja semua karyawan. Telat per minggu: minggu 1 = tanggal 1–7, 2 = 8–14, 3 = 15–21, 4 = 22 ke atas; kalimat membandingkan minggu terakhir yang sudah berjalan dengan minggu yang sama bulan lalu. "Telat per hari" Senin–Sabtu. "Paling sering telat" 3 teratas (hari lalu menit). |
| E10 | Kotak "Perlu evaluasi (BAD)" | Jumlah karyawan berlabel BAD bulan ini (admin: cabangnya; owner: semua cabang). Ketuk = layar Per karyawan (69 atau 82) dengan filter "Perlu evaluasi" aktif. |
| E11 | Pilihan Bulan dan Cabang di dashboard | 12 bulan mundur dari bulan ini; mengganti pilihan memuat ulang dari server. Cabang (owner): Semua cabang atau satu cabang. |

## TAHAP 2 — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar (kiri mockup, kanan app) |
|---|---|---|---|
| SD1 | 36e, 37, 38, 70 | Kalimat di bawah label ("Telat 2 kali. Tanpa pelanggaran untuk EXCELLENT.") yang pada putaran 11–17 diputuskan "–" pudar, kini diisi data nyata karena label sudah dihitung. Mohon konfirmasi mau tetap diisi atau dikembalikan "–" | `37_dampingan.png`, `38_dampingan.png` |
| SD2 | 70 | Mockup 70 hanya menggambarkan GOOD (latar hijau); untuk EXCELLENT latar kuning, untuk BAD latar merah, lencana dan warna label mengikuti | `70_dampingan.png` |
| SD3 | 36e, 37, 38 | Aturan lama: layar ini "tidak bisa dipicu dari navigasi". Kini tombol Report membuka layar sesuai label (satu-satunya cara menampilkan Report berwarna label); 37 dan 38 tidak dihapus/digabung. Mohon konfirmasi | `37_dampingan.png`, `38_dampingan.png`, `36e_dampingan.png` |
| SD4 | 49, 71 | Kotak "Perlu evaluasi (BAD)" kini bisa diketuk (membuka daftar Per karyawan terfilter) dan menampilkan "N orang" | — |
| SD5 | 36e, 37, 38, 70 | Daftar "Menunggu ACC" kosong = tidak ada tulisan apa pun (mockup tidak punya teks kosong); Detail untuk Masuk, Pulang awal, Alpha, Izin biasa, Izin khusus, Sisa cuti tetap nonaktif (mockup tidak punya layar detailnya) | `38_dampingan.png` |
| SD6 | 68, 69, 81, 82 | Tab yang sedang terbuka tampil gelap (bukan pudar) | `68_dampingan.png`, `69_dampingan.png` |

## TAHAP 3 (akun) — asumsi yang diambil (butuh setuju atau koreksi pemilik)

| No | Aturan yang tidak ada di dokumen | Pilihan yang dipakai (paling aman dan sederhana) |
|---|---|---|
| G1 | Apa yang diganti di layar 45 | KARYAWAN: PIN (5 angka; dipakai login HP pribadi DAN absen di HP toko, jadi keduanya berganti sekaligus). ADMIN: kata sandi (min. 8, maks. 100 karakter, besar/kecil sama); PIN admin untuk HP toko TIDAK berubah (belum ada layarnya). Aturan mockup lama (6 angka, "bukan 123456", dst.) sudah diganti keputusan pemilik sebelumnya. |
| G2 | Aturan tambahan | Yang lama wajib diisi dan benar; yang baru harus BERBEDA dari yang lama (admin: besar/kecil dianggap sama). Diperiksa di HP dan di server. |
| G3 | Salah yang lama | Menaikkan hitungan salah seperti login; 5x berturut-turut mengunci akun (log KUNCI_AKUN) dan sesi dihapus. |
| G4 | Setelah berhasil | Sesi HP pribadi LAIN milik akun itu dicabut (sesi ini tetap); dicatat di log GANTI_PIN / GANTI_PASSWORD tanpa nilai PIN/kata sandi. |
| G5 | "Ganti PIN" di Akun saya (44) | TETAP nonaktif "Segera": untuk karyawan PIN = password (sudah diganti lewat "Ganti password"), untuk admin belum ada layar khusus PIN HP toko. MOHON KEPUTUSAN: karyawan memakai satu menu saja? admin perlu layar ganti PIN HP toko? |
| G6 | Teks "Lupa password lama? Hubungi admin cabang untuk reset." | Tetap seperti mockup. Untuk ADMIN yang mereset sebenarnya owner (pemulihan lewat sheet akun). MOHON KEPUTUSAN apakah teks dibedakan menurut peran. |
| G7 | Shift bawaan (44) | Diisi dari sheet shift cabang: "Shift 1 (07:45 – 16:30)"; bila tidak ditemukan tetap "Segera". |

## TAHAP 3 — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar (kiri mockup, kanan app) |
|---|---|---|---|
| SE1 | 45 | Aturan yang BELUM terpenuhi tampil dengan tanda "•" abu (mockup hanya menggambarkan ✓ hijau); pesan galat merah ("PIN lama salah") tampil di ruang kosong di atas "Lupa password lama?" | `45_dampingan.png` |
| SE2 | 44 | "Ganti PIN" tetap nonaktif (lihat G5); Shift bawaan kini terisi | `44_dampingan.png` |


## Keputusan pemilik 2026-10-07 (Tahap 4, pemutus = pemilik)

Dipertahankan: SD1, SD2, SD3, SD4, SD5, SD6, SE1, SE2, SF3, SF4. G5: "Ganti PIN" di layar 44 tetap nonaktif "Segera"; karyawan memakai satu menu "Ganti password"; admin tidak perlu layar ganti PIN HP toko sekarang. Disetujui: E1-E11 (hari izin atau cuti yang sudah diterima tidak dihitung hari kerja), D2-D4, G1-G7. SC2 dan SC5 (bagian pemilih foto) DICABUT. A1-A14 dan B1-B14 tetap terbuka.

## TAHAP 4 (kamera dalam aplikasi, log edit absen) — selisih tampilan baru (butuh keputusan pemilik)

| No | Layar | Selisih | Gambar (kiri mockup, kanan app) |
|---|---|---|---|
| SG1 | 54, 65 | Mockup hanya punya kotak foto. Mengetuk kotak foto (54) atau "Update foto" (65) membuka layar penuh kuning "Foto karyawan" dengan lingkaran kamera depan, tombol AMBIL FOTO, lalu PAKAI FOTO / ULANGI dan Batal (gaya layar 09, dibuat sendiri karena mockup tidak menggambarkannya). Foto 640 px JPEG 0,6. Kamera ditolak/tidak ada: pesan "Izinkan akses kamera untuk mengambil foto", SIMPAN tetap nonaktif, tidak ada jalan ke galeri. | `54_dampingan.png`, `65_dampingan.png` |
| SG2 | 74 | Log hanya 20 tindakan terbaru (mockup tidak punya "Muat lebih"); kalimat di bawah judul = "N tindakan · terbaru di atas". Kolom Alasan kosong tampil "—". Tanpa foto. | `74_dampingan.png` |
| SG3 | 74 | Popup pilihan Admin (di mockup selalu terbuka) kini tertutup di awal dan dibuka dengan mengetuk judul kolom Admin, supaya tidak menutupi data; isinya daftar admin nyata + "Semua admin". Penyaring Waktu, Cabang, Karyawan dan tombol Ekspor tetap nonaktif. | `74_dampingan.png` |
