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
| 〃 | Subjudul "Belum absen hari ini" | "Belum absen hari ini." (ada titik) dan teks berubah menurut keadaan (jam masuk/pulang) | Claude Code | `31_dampingan.png` |
| 〃 | Strip "2 pengajuan menunggu ACC · Lihat" | Strip pudar "Pengajuan menunggu ACC · Segera" tanpa angka | Belum ada fungsi | `31_dampingan.png` |
| 33 Absen luar | Chip Keperluan (7 pilihan) + label "Keterangan tujuan (nama klien atau alamat)" | Tanpa chip; satu kolom Keterangan, label ditambah "wajib minimal 5 karakter", kolom kosong dengan contoh isian | Pemilik | `33_dampingan.png` |
| 〃 | "Wajah cocok dengan akun · 08:05" | "Pengenalan wajah · Segera" (tanpa jam) | Belum ada fungsi | `33_dampingan.png` |
| 〃 | Lingkaran foto bertulis "[Foto dari kamera]" | Bertulis "Foto otomatis" sampai kamera menyala | Claude Code | `33_dampingan.png` |
| 34 Absen luar cadangan PIN | Seluruh layar | Belum dibuat (butuh pengenalan wajah) | Belum ada fungsi | – |
| 35 Pop-up absen luar terkirim | Kotak "Bulan ini" dengan angka 18/1/0/5 dari 6 | Kotak tampil pudar bertulisan "Segera" tanpa angka | Belum ada fungsi | `35_dampingan.png` |
| 〃 | Teks "(Absen luar · Pemasangan)" | "(Absen luar · <20 huruf pertama keterangan>)" karena tidak ada pilihan keperluan | Claude Code | `35_dampingan.png` |
| 〃 | – (tidak ada di mockup) | Satu pil hitam tambahan "Absen luar tercatat, menunggu persetujuan admin." di bawah pil "Menunggu persetujuan admin" | Claude Code | `35_dampingan.png` |
| 〃 | Kartu pop-up di tengah layar | Kartu lebih tinggi karena pil tambahan | Claude Code | `35_dampingan.png` |
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
| 50 Menu admin | Item: Konfirmasi (angka), Absen manual, Data absensi, Jadwal shift, Input izin, Karyawan, Kalender libur, Dashboard bulanan, Log out | Item tambahan "Ubah nama HP ini" dan "Tutup menu" | Claude Code | `50_dampingan.png` |
| 〃 | Item tanpa fitur aktif | Absen manual, Data absensi, Jadwal shift, Input izin, Kalender libur, Dashboard bulanan pudar "Segera" | Belum ada fungsi | `50_dampingan.png` |
| 〃 | Panah menu ke atas saat terbuka; layar belakang gelap penuh | Panah tetap ke bawah; beranda terlihat samar di belakang | Claude Code | `50_dampingan.png` |
| 51 Konfirmasi log out | Latar gelap penuh tanpa beranda | Dialog sama (ikon, judul, nama · cabang, Batal, Log out) tetapi beranda terlihat samar di belakang | Claude Code | `51_dampingan.png` |
| 52 Konfirmasi | Chip: Semua, Lembur, Absen luar, Izin, Lupa absen | Ada chip tambahan "Pulang cepat"; Izin dan Lupa absen pudar "Segera" | Claude Code (chip Pulang cepat); Belum ada fungsi | `52_dampingan.png` |
| 〃 | Kartu Izin sakit, Lupa absen pulang, Tukar shift | Tidak ada (fiturnya belum ada) | Belum ada fungsi | `52_dampingan.png` |
| 〃 | Baris detail lembur "Kemarin, pulang 17:48, stok opname" | "Hari ini 08:05, 1 jam 15 menit, Survey": durasi tepat ditambahkan | Claude Code | `52_dampingan.png` |
| 〃 | Tombol Edit, penanda "Lokasi di dalam area toko" | Ada (tidak di mockup) | Pemilik | – |
| 〃 | Badge "Admin Ngawi" tanpa ikon; bar Home di dasar | Sama; bar Home di dasar layar gulir | sesuai | `52_dampingan.png` |
| 53 Detail konflik | Seluruh layar | Belum dibuat | Belum ada fungsi | – |
| 54 Absen manual, 55 Jadwal shift, 56 Tukar shift satu hari, 57 / 59 Pola shift | Seluruh layar | Belum dibuat; item menu pudar "Segera"; di sheet karyawan "Pola shift · Segera" | Belum ada fungsi | – |
| 58 Daftar karyawan | Baris role Admin (Dewi, Sari) dengan label "Admin" | Tidak tampil: server hanya mengirim karyawan | Claude Code | `58_dampingan.png` |
| 〃 | Teks bawah "Ketuk nama untuk mengubah data, reset PIN/password, lepas ikatan HP, atau menonaktifkan." | "Ketuk nama untuk reset PIN atau menonaktifkan." (tanpa "ikatan HP" dan "password") | Pemilik (ikatan HP dihapus); Claude Code (sisanya) | `58_dampingan.png` |
| 〃 | Ketuk nama = detail data karyawan | Ketuk nama = sheet aksi (Reset PIN, Nonaktifkan / Aktifkan kembali; Ubah data, Pola shift, Daftar wajah pudar "Segera"). Layar detail tidak ada di mockup | TANYA | `58_dampingan.png` |
| 60 Karyawan baru: data | "Nama tersedia." | "Nama tersedia · Segera" (belum ada pemeriksaan nama) | Belum ada fungsi | `60_dampingan.png` |
| 〃 | "ID otomatis: K005 · Cabang: Ngawi · Jatah cuti: 6 hari · Role: Karyawan" | "ID otomatis · Cabang mengikuti admin · Role: Karyawan" (tanpa nomor ID dan jatah cuti, belum ada datanya di HP) | Claude Code | `60_dampingan.png` |
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
