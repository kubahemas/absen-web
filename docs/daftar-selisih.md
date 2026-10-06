# Daftar selisih: mockup vs app (kelompok 1, 2, 3)

Dibuat 2026-10-06. **Tidak ada layar yang ditandai "sesuai" penuh kecuali tertulis demikian.** Gambar berdampingan: mockup di KIRI, app di KANAN, di `docs/audit/visual/NN_dampingan.png` (NN = nomor layar).

Kolom **Siapa yang memutuskan**:
- **Pemilik** = keputusan tertulis pemilik (tetap berlaku, bukan selisih yang perlu dikembalikan).
- **Claude Code** = penyimpangan yang dibuat Claude Code tanpa keputusan pemilik. **Tidak diubah dan tidak dikembalikan**; pemilik yang memilih kembalikan atau pertahankan.
- **Belum ada fungsi** = elemen mockup tampil NONAKTIF dengan tulisan "Segera" (atau layarnya belum dibuat karena fiturnya belum ada).
- **TANYA** = kasus yang tidak ada di mockup; Claude Code tidak memilih sendiri solusinya, jadi butuh jawaban pemilik.

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
| 11 | 61, 63 | Mockup usang: "Buat PIN 4 digit" (61) dan "Password awal 123456 / PIN awal 1234" (63). App memakai PIN 5 angka buatan karyawan sendiri. **Pemilik yang akan merevisi mockup**; mockup tidak diedit | Pemilik | `61_dampingan.png`, `63_dampingan.png` |
| 12 | 78 | "Masuk sebagai Owner" dipertahankan | Pemilik | `78_dampingan.png` |
| 13 | 80 | Filter cabang, saklar "Tampilkan nonaktif", "Ubah nama" dipertahankan | Pemilik | `80_dampingan.png` |

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

## Keputusan pemilik 2026-10-08 (sudah diterapkan, pemutus = pemilik)

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

## Keputusan pemilik 2026-10-09 (sudah diterapkan, pemutus = pemilik)

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
| 2 | 36 (37, 38) | Satu layar Report dipakai untuk tiga kondisi (mockup 36/37/38 beda hanya label); lencana label (EXCELLENT/GOOD/BAD) nonaktif "Segera"; 38 tidak punya layar sendiri | `36_dampingan.png` |
| 3 | 57 dan 59 | Mockup 57 (jalur lain ke Pola shift) belum punya jalur; Pola shift dibuka dari sheet karyawan → 59 | `57_dampingan.png`, `59_dampingan.png` |
| 4 | 67 | Warna sampel pada kalender libur memakai warna mockup; hari libur nyata belum ada | `67_dampingan.png` |
| 5 | 70 | Dibuat mirip 36 (detail karyawan); tanpa baris riwayat, tanda naik/turun, dan "Telat N kali"; tombol Detail membuka 40 / 39 | `70_dampingan.png` |
| 6 | 68, 81 | Ringkasan: kalimat tren ("naik/turun/sama dengan…", "Paling banyak hari…", "Minggu ke-N") dihapus karena berisi angka contoh | `68_dampingan.png`, `81_dampingan.png` |
| 7 | 02 | Latar di balik layar jadwal berbeda sedikit dari mockup (layar utama nyata, bukan gambar) | `02_dampingan.png` |
| 8 | 04, 05, 06, 07, 13, 18, 19, 22, 23, 34, 43, 53, 56, 62, 65, 70 | Layar KEJADIAN: dibuat lengkap tetapi SENGAJA belum bisa dibuka dari navigasi apa pun dan belum disambung ke logika absen; 57 juga belum punya jalur | dampingan tiap layar |
| 9 | 03, 08 | Alur wajah hanya tampilan: 03 tampil 1–2 detik lalu 08; ULANGI nonaktif; kamera tidak dibuka; MANUAL → 09 | `03_dampingan.png`, `08_dampingan.png` |
| 10 | 30, 31, 32, 46 | Nama besar kembali seperti mockup (Oswald 30 px tebal), tetap TANPA "Halo,". Menggantikan gaya blok "Cabang…" 15 px dari keputusan 2026-10-09 butir 1 (selisih dari mockup tinggal: tanpa "Halo,") | `30_dampingan.png` |
