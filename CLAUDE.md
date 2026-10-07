# Proyek: Aplikasi Absensi Kubah Emas Indonesia

## ATURAN TAMPILAN DARI PEMILIK (paling atas, berlaku untuk semua pekerjaan layar)
1. Mockup di `docs/mockup/layar` dipatuhi PERSIS. Jangan merevisi desain atas inisiatif sendiri. Penyimpangan hanya dari keputusan pemilik yang tertulis.
2. DILARANG menyembunyikan elemen mockup. Elemen yang fungsinya belum ada tampil persis seperti mockup tetapi NONAKTIF (pudar, tidak bisa ditekan, memakai pola `.segera`; tanpa angka atau data palsu).
3. ATURAN BARU (menggantikan aturan lama soal selisih; teks lama ada di `docs/aturan-detail.md`): tambahan atau perubahan yang dibutuhkan fungsi dan TIDAK menghapus/menyembunyikan elemen mockup serta TIDAK mengubah aturan bisnis diputuskan sendiri oleh Claude Code; cukup catat SATU baris di `docs/daftar-selisih.md` (nomor, layar, apa yang ditambah, alasannya), jangan dibawa ke pemilik satu per satu. Pemilik hanya dimintai keputusan untuk: (a) elemen mockup yang akan dihapus/disembunyikan, (b) perubahan yang mengubah aturan bisnis (hak akses, perhitungan label, jatah cuti, dsb). Semua catatan ditinjau pemilik SATU KALI di akhir pilot bersama gambar dampingan; gambar dampingan hanya untuk selisih BARU yang menyangkut tampilan.
- Keputusan pemilik yang tetap berlaku: "Hadir" diganti "Tepat waktu" (hanya status HADIR; Telat terpisah); kartu angka SATU dengan dropdown Shift (owner: dropdown Cabang + Shift); daftar Belum absen 5 nama + "Lihat semua (N)"; "Perlu evaluasi (BAD)" nonaktif; absen luar ketik bebas minimal 5 karakter; label "Hanya untuk absen tugas di luar toko"; penanda "Lokasi di dalam area toko"; owner tidak ACC karyawan dan admin tidak ACC/edit miliknya sendiri; Edit di Konfirmasi dengan alasan minimal 5 karakter; home admin HP pribadi memakai kotak Konfirmasi karyawan dan menu admin lewat ikon akun; refresh otomatis + ikon refresh; "HP terikat" dihapus dari Akun saya; Log out di menu kecil dari ikon akun; iPhone/Safari ditunda.

## Tentang pemilik proyek
- Pemilik proyek adalah pemula (belum bisa koding). Selalu jelaskan dengan bahasa Indonesia yang sederhana dan langsung.
- Kerjakan SATU langkah kecil per permintaan. Setelah selesai, jelaskan cara mengetesnya, lalu tunggu konfirmasi sebelum lanjut.
- Jangan menambah fitur di luar yang diminta. Kalau ada yang kurang jelas, tanya dulu.
- Beri tahu dengan jujur kalau ada keputusan yang berisiko.

## Acuan desain lengkap
- Keputusan desain paling detail dan terbaru ada di `docs/keputusan-desain.md` (aturan tampilan/navigasi, HP toko, HP pribadi, admin cabang, owner, aturan data & perhitungan, format export Excel, keamanan & teknis). **Kalau isinya bertentangan dengan ringkasan di CLAUDE.md ini, `docs/keputusan-desain.md` yang berlaku.**
- Acuan tampilan: `docs/mockup/BUKA INI - Galeri Mockup.html` (versi final). Acuan format file export: `docs/contoh-export/` (contoh .xlsx bulanan & harian).
- Beberapa poin besar yang ada di sana dan belum masuk ringkasan CLAUDE.md ini: pola shift tetap/bergilir, tukar & pindah shift antar karyawan, sistem sesi login (termasuk sesi owner & token HP toko lewat sheet `sesi`), label performa EXCELLENT/GOOD/BAD, export Excel bulanan & harian (aplikasi tidak pernah menyimpan angka gaji), serta aturan detail navigasi/pop-up/kualitas foto di HP toko. Baca filenya langsung untuk detail sebelum mengerjakan bagian terkait.

## Aturan keamanan (wajib)
- Repo GitHub bersifat publik. JANGAN menaruh PIN, password, token, atau ID spreadsheet rahasia di kode frontend.
- PIN dan password disimpan sebagai hash SHA-256 di sheet `akun` (kolom `pw_hash`, `pin_hash`), dihitung di Apps Script dengan garam ganda: `teks + id + KODE_RAHASIA`. `KODE_RAHASIA` disimpan di Script Properties milik proyek Apps Script (Project Settings > Script Properties) — TIDAK PERNAH ditaruh di sheet atau di GitHub.
- Di sheet `akun`, kolom `pw_hash`, `pin_hash`, `data_wajah`, `id_hp` dikelompokkan (grouped) dan disembunyikan secara default supaya tidak terlihat sekilas saat sheet dibuka — tetap bisa dibuka manual lewat tanda "+" di atas kolom kalau perlu dicek.
- Hanya akun owner yang punya akses ke Spreadsheet dan folder Drive.

## Aturan membuat layar baru (wajib)
- Setiap layar baru HARUS menyalin CSS dari file mockup yang sesuai di `docs/mockup/layar/`, bukan menggambar ulang dari nol.
- Halaman ini sudah PWA (`manifest.json`, `sw.js`). Setiap kali file halaman (index.html, config.js, dll.) diubah, naikkan nomor `VERSI_CACHE` di `sw.js` supaya HP memuat versi baru. Kalau menambah file halaman baru, daftarkan juga di `FILE_HALAMAN` di `sw.js`. Panggilan ke Apps Script tidak boleh di-cache.


## Peta berkas
- `index.html` (semua layar + JS), `sw.js` (cache), `config.js`, `manifest.json`, `assets/`; `apps-script/api.gs` (server), `apps-script/setup_spreadsheet.gs` (sumber kolom).
- `docs/keputusan-desain.md` (desain terbaru, menang bila bertentangan), `docs/daftar-layar.md` (status layar), `docs/daftar-selisih.md` (selisih terbuka), `docs/mockup/`, `docs/contoh-export/`.
- `docs/aturan-detail.md` = SEMUA aturan detail (struktur 9 sheet, format tanggal/ID, alur absen, HP toko, sesi, konfirmasi, fitur A-D, paket-paket lama). Baca hanya bagian yang dibutuhkan (grep), jangan dibaca utuh.
- `docs/arsip-selisih.md` = selisih lama yang sudah diputuskan. JANGAN dibaca utuh; cari dengan grep.
- `tools/` = alat uji dan potret.

## Peran dan hak
| Peran | Absen | Konfirmasi (ACC/Tolak/Edit) | Lain |
|---|---|---|---|
| KARYAWAN | HP toko (PIN 5 angka) atau HP pribadi (absen luar) | tidak | PIN 5 angka |
| ADMIN | HP toko (PIN) + kata sandi min. 8 karakter; tidak lembur | hanya karyawan cabangnya, BUKAN miliknya sendiri | kelola karyawan cabang; role ADMIN hanya diberikan owner |
| OWNER | sesi 7 hari | hanya pengajuan ADMIN (semua cabang) | kelola HP toko, laporan semua cabang |
| PERANGKAT | akun HP toko (token) | tidak | satu baris `akun` per HP toko |

## Aturan kerja
- Satu langkah kecil per permintaan; jelaskan cara tes; tunggu konfirmasi. Jangan tambah fitur di luar permintaan.
- Saat mengerjakan pakai `bash tools/uji_cepat.sh <fitur>` (izin, jadwal, koreksi, laporan, akun, foto, dst.). Tes regresi penuh (`tools/jalankan_semua_tes.sh`) SATU KALI sebelum commit akhir tiap perintah, bukan per tahap.
- Ubah file halaman = naikkan `VERSI_CACHE` di `sw.js`. Perubahan `api.gs` = salin ke editor Apps Script, deploy VERSI BARU.
- Kuota hemat: tanpa tangkapan layar atau proses latar belakang kecuali diminta; jangan perulangan `until ... sleep`.

## Format laporan baku (maks 40 baris)
Urutan: 1) RUSAK ATAU HILANG (benar-benar tidak sesuai/tidak berfungsi); 2) SEGERA (disengaja: tombol/layar nonaktif); 3) asumsi baru (satu baris tiap asumsi); 4) keputusan yang butuh pemilik (hanya jenis a dan b di atas); 5) langkah deploy api.gs untuk pemula (hanya bila api.gs berubah); 6) uji Android singkat. Tanpa rincian tes per berkas, tanpa mengulang keputusan lama.
