// Skrip uji (server TIRUAN, tidak menulis ke sheet): Fitur C koreksi absen.
// Konteks lewat window.__KONTEKS = 'toko' (peringatan HP toko: 05, 06, 07, 13, 18, 19) | 'admin' (Konfirmasi lupa/konflik/shift beda, 53, 54, 64, 65).
// 'toko' butuh PRA tools/pra_toko.js. Pakai BUDGET=90000.
window.__hasil = [];
var H = window.__hasil;
var K = window.__KONTEKS || 'toko';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function f(id, nama) { return document.querySelector('#' + id + ' [data-f="' + nama + '"]'); }
function teks(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function ubah(e, nilai) { e.value = nilai; e.dispatchEvent(new Event('change', { bubbles: true })); e.dispatchEvent(new Event('input', { bubbles: true })); }
var panggil = [];
function semua(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }); }
function terakhir(aksi) { return semua(aksi).pop(); }
function jumlah(aksi) { return semua(aksi).length; }
var FOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
window.__pilihFotoUji = FOTO;
var HARI_INI = '2026-10-07';
var PENGGANTI = [];
// ---------------- server tiruan ----------------
var f0 = window.fetch;
var konfDaftar = [];
var konfPutus = [];
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggil.push(b);
  var d = null;
  // HP toko (pra_toko.js menyediakan daftar nama, tiket, absen_masuk/absen_pulang dari window.__absen)
  if (b.aksi === 'absen_masuk' && b.shift_pilihan !== undefined) { d = { status: 'ok', st_masuk: 'HADIR', jam: '13:10', shift: 'Shift ' + b.shift_pilihan, panggilan: 'Budi', id_absen: 'M-K002-261007-131000-T1', shift_beda: b.shift_pilihan === 2 }; }
  if (b.aksi === 'absen_pulang' && b.konfirmasi_revisi === true) { d = { status: 'ok', st_pulang: 'LEMBUR DI TOKO', perubahan: 'REVISI', acc: 'MENUNGGU', jam: '18:40', shift: 'Shift 1', panggilan: 'Budi', durasi_menit: 130, tingkat: 3, id_absen: 'L-K002-261007-184000-T1' }; }
  if (b.aksi === 'laporkan_dobel') { d = { status: 'ok', st_masuk: 'HADIR', jam: '07:52', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'M-K002-261007-075200-T1', konflik: true }; }
  if (b.aksi === 'foto_dobel') { d = { status: 'ok', foto: FOTO }; }
  // admin
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K009', nama: 'Dewi Lestari', panggilan: 'Dewi', role: 'ADMIN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false, izin_menunggu: 0, tukar_masuk: 0 }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: konfDaftar.length, jumlah_teks: String(konfDaftar.length) }; }
  if (b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: konfDaftar.slice(), total: konfDaftar.length, jumlah_teks: String(konfDaftar.length), ada_lagi: false }; }
  if (b.aksi === 'konfirmasi_putuskan') { konfPutus.push(b.id); konfDaftar = konfDaftar.filter(function (x) { return x.id !== b.id; }); d = { status: 'ok', keputusan: 'DITERIMA' }; }
  if (b.aksi === 'ambil_foto') { d = { status: 'ok', foto: null, teks: 'TANPA FOTO' }; }
  if (b.aksi === 'absen_manual_info') { d = { status: 'ok', hari_ini: HARI_INI, jam: '10:00', karyawan: [{ id: 'K003', nama: 'Budi Santoso', panggilan: 'Budi' }, { id: 'K004', nama: 'Rina Wati', panggilan: 'Rina' }], alasan: ['Lupa absen', 'HP toko bermasalah', 'Internet / listrik mati', 'Lainnya'] }; }
  if (b.aksi === 'absen_manual_pratinjau') { d = b.jenis === 'PULANG' && b.jam ? { status: 'ok', bisa: true, pesan: '', tampil: 'Status: PULANG NORMAL (Shift 1)' } : { status: 'ok', bisa: !!b.jam, pesan: '', tampil: 'Status: HADIR (Shift 1)' }; }
  if (b.aksi === 'absen_manual') { d = { status: 'ok', id_absen: 'P-K004-261005-163100-A', jenis: b.jenis, tanggal: b.tanggal, tampil: 'Status: PULANG NORMAL (Shift 1)' }; }
  if (b.aksi === 'absensi_unggah_foto') { d = { status: 'ok' }; }
  if (b.aksi === 'absensi_daftar') {
    d = { status: 'ok', cabang: 'Ngawi', dari: '2026-10-05', sampai: '2026-10-11', hari_ini: HARI_INI, total: 3, ada_lagi: false,
      karyawan: [{ id: 'K003', nama: 'Budi Santoso' }, { id: 'K004', nama: 'Rina Wati' }],
      daftar: [
        { karyawan: 'K003', nama: 'Budi Santoso', tanggal: '2026-10-06', masuk: '07:45', pulang: '18:35', tanda: ['LEMBUR'], diedit: true },
        { karyawan: 'K004', nama: 'Rina Wati', tanggal: '2026-10-06', masuk: '07:40', pulang: '', tanda: ['LUPA PULANG'], diedit: false },
        { karyawan: 'K003', nama: 'Budi Santoso', tanggal: '2026-10-05', masuk: '07:52', pulang: '16:31', tanda: ['TELAT'], diedit: false }
      ] };
  }
  if (b.aksi === 'absensi_edit_info') { d = { status: 'ok', karyawan: 'K003', nama: 'Budi Santoso', tanggal: '2026-10-05', hari_ini: HARI_INI, masuk: { jam: '07:52', st: 'TELAT', telat_mnt: 7, jam_foto: '07:51:40', foto: true }, pulang: { jam: '16:31', st: 'PULANG NORMAL', jam_foto: '', foto: false } }; }
  if (b.aksi === 'absensi_foto') { d = { status: 'ok', foto: FOTO }; }
  if (b.aksi === 'absensi_edit_pratinjau') { d = b.jenis === 'MASUK' ? { status: 'ok', bisa: true, sebelum: 'Masuk 07:52 (TELAT 7 mnt)', sesudah: 'Masuk ' + b.jam + ' (HADIR)' } : { status: 'ok', bisa: true, sebelum: 'Pulang 16:31 (PULANG NORMAL)', sesudah: 'Pulang ' + b.jam + ' (PULANG NORMAL)' }; }
  if (b.aksi === 'absensi_edit') { d = { status: 'ok', sebelum: 'Masuk 07:52 (TELAT 7 mnt)', sesudah: 'Masuk ' + b.jam + ' (HADIR)' }; }
  if (b.aksi === 'konflik_detail') { d = { status: 'ok', id: b.id, tanggal: '2026-10-05', hari: 'Senin, 5 Oktober', jenis: 'MASUK', pelapor: 'K003', nama: 'Budi Santoso', panggilan: 'Budi', lama: { jam: '07:40', st: 'HADIR', foto: true }, baru: { jam: '07:52', st: 'TELAT', foto: true }, kandidat: [{ id: 'K004', nama: 'Rina Wati', keterangan: 'belum ada absen masuk' }] }; }
  if (b.aksi === 'konflik_foto') { d = { status: 'ok', foto: FOTO }; }
  if (b.aksi === 'konflik_pratinjau') { d = b.ke === 'K004' ? { status: 'ok', bisa: true, pesan: '', hasil: 'Rina 07:40 HADIR · Budi 07:52 TELAT' } : { status: 'ok', bisa: false, pesan: 'Pilih karyawan tujuan yang valid' }; }
  if (b.aksi === 'konflik_putuskan') { konfDaftar = konfDaftar.filter(function (x) { return x.id.indexOf('KONFLIK|') !== 0; }); d = { status: 'ok', hasil: 'dipindahkan ke Rina Wati (07:40 HADIR)' }; }
  if (d) { return Promise.resolve({ json: function () { return Promise.resolve(d); } }); }
  return f0(url, opsi);
};
function itemKonf(id, kel, extra) {
  return Object.assign({ id: id, jenis: 'MASUK', kelompok: kel, karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', tanggal: '2026-10-05', shift: '1', jam: '07:40', status: '', ket: '', role: 'KARYAWAN', luar: false, tingkat: 0, durasi_menit: 0, gps: '', foto: 'TANPA' }, extra || {});
}
konfDaftar = [
  itemKonf('K004|2026-10-05|PULANG', 'LUPA', { id: 'LUPA|K004|2026-10-05|PULANG', jenis: 'PULANG', karyawan: 'K004', nama: 'Rina Wati', judul: 'Lupa absen pulang', rincian: 'Sen 5 Okt, masuk 07:40', menunggu_hari: 2, jam: '07:40' }),
  itemKonf('KONFLIK|M-K003-261005-074000-T1', 'KONFLIK', { judul: 'Konflik absen', rincian: 'Sen 5 Okt · masuk 07:40 · ditolak oleh Budi', jam: '07:40' }),
  itemKonf('K005|2026-10-06|MASUK', 'SHIFT_BEDA', { karyawan: 'K005', nama: 'Ari Pratama', tanggal: '2026-10-06', shift: '2', jam: '13:10', status: 'HADIR', ket: 'SHIFT BEDA: jadwal Shift 1', foto: 'ADA' })
];
async function tekan(id) {
  var b = el(id); b.disabled = false; b.click(); await tunggu(1900);
  el('lb08').querySelector('[data-lb-aksi="pilihnama"]').click(); await tunggu(200);
}
async function isiPin(nama) {
  var s = el('selectNama'); s.value = nama; s.dispatchEvent(new Event('change')); await tunggu(150);
  ['1', '2', '3', '4', '5'].forEach(function (d) { document.querySelector('#keypad [data-digit="' + d + '"]').click(); });
  await tunggu(500);
}
async function masukPribadi(nama) {
  el('btnJenisPribadi').click(); await tunggu(100);
  el('pribNama').value = nama; el('pribRahasia').value = 'rahasia12'; el('btnMasukPribadi').click(); await tunggu(800);
}
async function dariMenuAdmin(nama) {
  el('btnMenuPribadi').click(); await tunggu(150);
  Array.prototype.filter.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0].click(); await tunggu(700);
}
(async function () {
  try {
    if (K === 'toko') {
      await tunggu(300);
      // ---- 05: sudah absen masuk ----
      window.__absen = { status: 'gagal', pesan: 'Sudah absen masuk hari ini', dobel: true, kode_dobel: 'abcdef0123456789', jenis_dobel: 'MASUK', jam_lama: '07:40', jam_sekarang: '07:52', nama: 'Budi Santoso', panggilan: 'Budi' };
      await tekan('btnMasuk'); await isiPin('K002');
      ok('absen masuk kedua (dobel): layar 05 menggantikan pop-up "Tidak tersimpan"', aktif() === 'lb05' && !/Tidak tersimpan/.test(el('popup').textContent) && !el('popup').classList.contains('tampil'));
      ok('layar 05: judul "Budi sudah absen masuk jam 07:40", header ABSEN MASUK, foto absen tadi diminta lewat foto_dobel (token HP toko + kode)', teks(f('lb05', 'judul')) === 'Budi sudah absen masuk jam 07:40' && teks(f('lb05', 'header')) === 'ABSEN MASUK' && !!terakhir('foto_dobel') && terakhir('foto_dobel').kode === 'abcdef0123456789' && terakhir('foto_dobel').token === 'T'.repeat(40));
      await tunggu(200);
      ok('layar 05: kedua tombol AKTIF (tanpa "Segera") dan foto absen tadi tampil', !f('lb05', 'ya').disabled && !f('lb05', 'bukan').disabled && !/Segera/.test(f('lb05', 'ya').textContent + f('lb05', 'bukan').textContent) && /url\(/.test(f('lb05', 'fotoLama').style.backgroundImage));
      var n0 = jumlah('laporkan_dobel');
      f('lb05', 'bukan').click(); await tunggu(500);
      ok('BUKAN SAYA mengirim laporkan_dobel (token + kode) dan hasilnya tampil sebagai pop-up absen biasa ("Selamat bekerja")', jumlah('laporkan_dobel') === n0 + 1 && terakhir('laporkan_dobel').kode === 'abcdef0123456789' && /Selamat bekerja/.test(el('popup').textContent));
      el('popup').click(); await tunggu(400);
      ok('pop-up ditutup, kembali ke layar utama', aktif() === 'layarUtama');
      // YA, ITU SAYA: tidak ada yang berubah
      await tekan('btnMasuk'); await isiPin('K002');
      var n1 = jumlah('laporkan_dobel');
      ok('dobel lagi: layar 05 tampil', aktif() === 'lb05');
      f('lb05', 'ya').click(); await tunggu(300);
      ok('YA, ITU SAYA: kembali ke layar utama tanpa laporan', aktif() === 'layarUtama' && jumlah('laporkan_dobel') === n1);
      // ---- 05 untuk pulang ----
      window.__absen = { status: 'gagal', pesan: 'Sudah absen pulang hari ini', dobel: true, kode_dobel: '0123456789abcdef', jenis_dobel: 'PULANG', jam_lama: '16:32', jam_sekarang: '16:50', nama: 'Budi Santoso', panggilan: 'Budi' };
      await tekan('btnPulang'); await isiPin('K002');
      ok('absen pulang kedua: layar 05 dengan header ABSEN PULANG dan teks "sudah absen pulang jam 16:32"', aktif() === 'lb05' && teks(f('lb05', 'header')) === 'ABSEN PULANG' && teks(f('lb05', 'judul')) === 'Budi sudah absen pulang jam 16:32');
      f('lb05', 'ya').click(); await tunggu(300);
      // ---- penolakan lain tetap pop-up ----
      window.__absen = { status: 'gagal', pesan: 'Absen masuk belum dibuka, mulai 06:45' };
      await tekan('btnMasuk'); await isiPin('K002');
      ok('penolakan biasa (bukan dobel) tetap memakai pop-up bawaan, bukan layar 05', aktif() !== 'lb05' && /belum dibuka/i.test(el('popup').textContent));
      el('popup').click(); await tunggu(300);
      // ---- 06: shift tidak sesuai jadwal ----
      window.__absen = { status: 'ok', perlu_pilih_shift: true, panggilan: 'Budi', nama: 'Budi Santoso', jam: '13:10', jadwal: { no: 1, nama: 'Shift 1', masuk: '07:45' }, usulan: { no: 2, nama: 'Shift 2', masuk: '13:45' } };
      await tekan('btnMasuk'); await isiPin('K002');
      ok('layar 06 tampil: "Budi, jadwal Anda Shift 1", "Jadwal: Shift 1", "Sekarang 13:10. Masuk sebagai Shift 2 (13:45)?"', aktif() === 'lb06' && teks(f('lb06', 'judul')) === 'Budi, jadwal Anda Shift 1' && teks(f('lb06', 'pil')) === 'Jadwal: Shift 1' && teks(f('lb06', 'tanya')) === 'Sekarang 13:10. Masuk sebagai Shift 2 (13:45)?');
      ok('layar 06: tombol "YA, SHIFT 2", "Tidak, saya telat (Shift 1)" aktif; catatan "Shift 2 perlu konfirmasi admin."', teks(f('lb06', 'ya')) === 'YA, SHIFT 2' && teks(f('lb06', 'tidak')) === 'Tidak, saya telat (Shift 1)' && !f('lb06', 'ya').disabled && !f('lb06', 'tidak').disabled && teks(f('lb06', 'catatan')) === 'Shift 2 perlu konfirmasi admin.');
      var nm = jumlah('absen_masuk');
      f('lb06', 'ya').click(); await tunggu(500);
      var u = terakhir('absen_masuk');
      ok('YA, SHIFT 2 mengirim ulang absen_masuk dengan shift_pilihan 2, id, PIN, dan tiket yang sama', jumlah('absen_masuk') === nm + 1 && u.shift_pilihan === 2 && u.id === 'K002' && u.pin === '12345' && u.tiket === 'TIKET');
      ok('hasilnya pop-up masuk biasa ("Selamat bekerja", Shift 2)', /Selamat bekerja/.test(el('popup').textContent) && /Shift 2/.test(el('popup').textContent));
      el('popup').click(); await tunggu(300);
      window.__absen = { status: 'ok', perlu_pilih_shift: true, panggilan: 'Budi', nama: 'Budi Santoso', jam: '13:10', jadwal: { no: 1, nama: 'Shift 1', masuk: '07:45' }, usulan: { no: 2, nama: 'Shift 2', masuk: '13:45' } };
      await tekan('btnMasuk'); await isiPin('K002');
      f('lb06', 'tidak').click(); await tunggu(500);
      ok('"Tidak, saya telat" mengirim shift_pilihan 1 (shift jadwal)', terakhir('absen_masuk').shift_pilihan === 1);
      el('popup').click(); await tunggu(300);
      // ---- 07: revisi lembur ----
      window.__absen = { status: 'ok', perlu_konfirmasi_revisi: true, kode_dobel: 'fedcba9876543210', jenis_dobel: 'PULANG', jam_lama: '17:48', durasi_lama: 78, tingkat_lama: 2, jam_baru: '18:40', durasi_baru: 130, tingkat_baru: 3, nama: 'Budi Santoso', panggilan: 'Budi' };
      await tekan('btnLembur'); await isiPin('K002');
      ok('layar 07: "Budi sudah absen lembur jam 17:48", "Lembur 1 jam 18 menit · 1–2 jam", "Sekarang 18:40"', aktif() === 'lb07' && teks(f('lb07', 'judul')) === 'Budi sudah absen lembur jam 17:48' && teks(f('lb07', 'pil')) === 'Lembur 1 jam 18 menit · 1–2 jam' && teks(f('lb07', 'sekarang')) === 'Sekarang 18:40');
      ok('layar 07: tiga tombol aktif; "Revisi lembur ke 18:40"', teks(f('lb07', 'revisi')) === 'Revisi lembur ke 18:40' && !f('lb07', 'ya').disabled && !f('lb07', 'revisi').disabled && !f('lb07', 'bukan').disabled);
      var np = jumlah('absen_pulang');
      f('lb07', 'revisi').click(); await tunggu(500);
      var r = terakhir('absen_pulang');
      ok('Revisi mengirim ulang absen_pulang dengan konfirmasi_revisi true (jenis PULANG_LEMBUR, tiket sama)', jumlah('absen_pulang') === np + 1 && r.konfirmasi_revisi === true && r.jenis === 'PULANG_LEMBUR' && r.tiket === 'TIKET');
      ok('hasil revisi tampil sebagai pop-up lembur ("Lembur direvisi")', /Lembur direvisi/.test(el('popup').textContent) || /direvisi/i.test(el('popup').textContent) || /Menunggu persetujuan/.test(el('popup').textContent));
      el('popup').click(); await tunggu(400);
      // ---- 18: masuk + belum pulang kemarin ----
      window.__absen = { status: 'ok', st_masuk: 'HADIR', jam: '07:40', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'M-K002-261007-074000-T1', belum_pulang_kemarin: { tanggal: '2026-10-05', hari: 'Senin, 5 Oktober', shift: '1' } };
      await tekan('btnMasuk'); await isiPin('K002');
      ok('layar 18: "Selamat bekerja, Budi!", "Masuk 07:40 (Shift 1)", "Senin, 5 Oktober. Hubungi admin."', aktif() === 'lb18' && teks(f('lb18', 'judul')) === 'Selamat bekerja, Budi!' && teks(f('lb18', 'pil')) === 'Masuk 07:40 (Shift 1)' && teks(f('lb18', 'detail')) === 'Senin, 5 Oktober. Hubungi admin.');
      ok('layar 18: hitung mundur "Menutup otomatis dalam N detik"', /^Menutup otomatis dalam \d+ detik$/.test(teks(f('lb18', 'tutup'))));
      el('lb18').click(); await tunggu(300);
      ok('ketuk layar 18 menutup dan kembali ke layar utama', aktif() === 'layarUtama');
      // ---- 13: telat + belum pulang kemarin ----
      window.__absen = { status: 'ok', st_masuk: 'TELAT', telat_mnt: 7, jam: '07:52', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'M-K002-261007-075200-T1', pilihan_alasan: ['Macet', 'Hujan', 'Lainnya'], batas_isi_detik: 10, kode_alasan: 'KA', belum_pulang_kemarin: { tanggal: '2026-10-05', hari: 'Senin, 5 Oktober', shift: '1' } };
      await tekan('btnMasuk'); await isiPin('K002');
      ok('telat: pop-up utama telat tampil lebih dulu (bukan layar 13)', /Telat 7 menit/.test(el('popup').textContent) && aktif() !== 'lb13');
      el('btnIsiAlasan').click(); await tunggu(300);
      el('alasanGrid').querySelector('button').click();
      el('btnSimpanAlasan').click(); await tunggu(500);
      ok('alasan tersimpan: pop-up "Alasan tersimpan"', /Alasan tersimpan/.test(el('popup').textContent));
      el('popup').click(); await tunggu(400);
      ok('sesudah itu layar lanjutan 13 tampil: "Satu lagi, Budi" dan "Senin, 5 Oktober (Shift 1)"', aktif() === 'lb13' && teks(f('lb13', 'sapa')) === 'Satu lagi, Budi' && teks(f('lb13', 'pil')) === 'Senin, 5 Oktober (Shift 1)' && !f('lb13', 'ok').disabled && !/Segera/.test(teks(f('lb13', 'ok'))));
      f('lb13', 'ok').click(); await tunggu(300);
      ok('MENGERTI menutup layar 13 dan kembali ke layar utama (tidak muncul lagi)', aktif() === 'layarUtama');
      // ---- 19: pulang tanpa masuk ----
      window.__absen = { status: 'ok', st_pulang: 'PULANG NORMAL', jam: '16:31', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'P-K002-261007-163100-T1', acc: '', tingkat: 0, durasi_menit: 0, perubahan: '', belum_masuk_hari_ini: true };
      await tekan('btnPulang'); await isiPin('K002');
      ok('layar 19: "Terima kasih, Budi!" dan "Pulang 16:31 (Shift 1)"', aktif() === 'lb19' && teks(f('lb19', 'judul')) === 'Terima kasih, Budi!' && teks(f('lb19', 'pil')) === 'Pulang 16:31 (Shift 1)');
      el('lb19').click(); await tunggu(300);
      ok('layar 19 menutup dan kembali ke layar utama', aktif() === 'layarUtama');
      // ---- absen biasa tidak berubah ----
      window.__absen = { status: 'ok', st_masuk: 'HADIR', jam: '07:40', shift: 'Shift 1', panggilan: 'Budi', id_absen: 'M-K002-261007-074000-T1' };
      await tekan('btnMasuk'); await isiPin('K002');
      ok('absen tepat waktu tanpa peringatan: pop-up biasa "Selamat bekerja" (tidak ada layar 05/06/07/13/18/19)', /Selamat bekerja/.test(el('popup').textContent) && ['lb05', 'lb06', 'lb07', 'lb13', 'lb18', 'lb19'].indexOf(aktif()) < 0);
      el('popup').click(); await tunggu(300);
      ok('ketuk di mana saja menutup; tidak ada layar peringatan tersisa', aktif() === 'layarUtama');
    }

    if (K === 'admin') {
      await masukPribadi('Dewi Lestari');
      await dariMenuAdmin('Konfirmasi');
      ok('Konfirmasi (admin HP pribadi) terbuka', aktif() === 'layarKonfirmasi');
      var kartu = document.querySelectorAll('#daftarKonfirmasi .kartu-konf');
      ok('tiga kartu: lupa absen, konflik absen, shift tidak sesuai jadwal', kartu.length === 3);
      var kl = document.querySelector('#daftarKonfirmasi [data-kel="LUPA"]'), kk = document.querySelector('#daftarKonfirmasi [data-kel="KONFLIK"]'), ks = document.querySelector('#daftarKonfirmasi [data-kel="SHIFT_BEDA"]');
      ok('kartu Lupa absen: "Lupa absen pulang", "Rina Wati", "Menunggu 2 hari", tombol "Isi jam (absen manual)" tanpa ACC/Tolak', !!kl && /Lupa absen pulang/.test(kl.textContent) && /Rina Wati/.test(kl.textContent) && /Menunggu 2 hari/.test(kl.textContent) && !!kl.querySelector('[data-konf="isijam"]') && !kl.querySelector('[data-konf="acc"]'));
      ok('kartu Konflik: "Konflik absen" dengan tombol "Lihat detail"', !!kk && /Konflik absen/.test(kk.textContent) && !!kk.querySelector('[data-konf="konflik"]'));
      ok('kartu Shift beda memakai kartu biasa: judul "Shift tidak sesuai jadwal", keterangan, ACC dan Tolak', !!ks && /Shift tidak sesuai jadwal/.test(ks.textContent) && /SHIFT BEDA: jadwal Shift 1/.test(ks.textContent) && !!ks.querySelector('[data-konf="acc"]') && !!ks.querySelector('[data-konf="tolak"]'));
      var chips = Array.prototype.map.call(document.querySelectorAll('#konfChips button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim(); });
      ok('chip "Lupa absen 1" aktif (bukan "Segera")', chips.some(function (c) { return /^Lupa absen 1$/.test(c); }) && !chips.some(function (c) { return /Segera/.test(c); }) && !document.querySelector('#konfChips button:disabled'));
      // ---- ACC shift beda memakai alur lama ----
      ks.querySelector('[data-konf="acc"]').click(); await tunggu(500);
      ok('ACC kartu shift beda memanggil konfirmasi_putuskan dengan id absen biasa', terakhir('konfirmasi_putuskan') && terakhir('konfirmasi_putuskan').id === 'K005|2026-10-06|MASUK' && terakhir('konfirmasi_putuskan').keputusan === 'ACC');
      // ---- lupa absen -> absen manual (54) ----
      kl.querySelector('[data-konf="isijam"]').click(); await tunggu(800);
      ok('"Isi jam (absen manual)" membuka layar 54 dan memanggil absen_manual_info dengan sesi admin', aktif() === 'lb54' && !!terakhir('absen_manual_info') && terakhir('absen_manual_info').sesi === 'S'.repeat(40));
      ok('layar 54 terisi dari item: karyawan Rina Wati, tanggal 05/10, jenis Pulang', f('lb54', 'karyawan').value === 'K004' && f('lb54', 'tanggal').value === '2026-10-05' && f('lb54', 'jPulang').style.background.indexOf('--hitam') >= 0);
      ok('elemen layar 54 aktif (tanpa "Segera"); SIMPAN masih nonaktif sebelum jam, alasan, foto lengkap', !f('lb54', 'karyawan').disabled && !f('lb54', 'jam').disabled && f('lb54', 'simpan').disabled && /Segera/.test(f('lb54', 'simpan').textContent));
      ubah(f('lb54', 'jam'), '16:31'); await tunggu(400);
      ok('status dari server tampil: "Status: PULANG NORMAL (Shift 1)"', teks(f('lb54', 'status')) === 'Status: PULANG NORMAL (Shift 1)' && terakhir('absen_manual_pratinjau').jenis === 'PULANG');
      f('lb54', 'a0').click(); await tunggu(100);
      ok('alasan terpilih tampil hitam; SIMPAN masih nonaktif tanpa foto', f('lb54', 'a0').style.background.indexOf('--hitam') >= 0 && f('lb54', 'simpan').disabled);
      f('lb54', 'fotoTombol').click(); await tunggu(200);
      ok('foto dipilih: tombol kamera berisi foto, "Foto siap"; SIMPAN aktif', /Foto siap/.test(teks(f('lb54', 'fotoJudul'))) && !f('lb54', 'simpan').disabled && !/Segera/.test(teks(f('lb54', 'simpan'))));
      f('lb54', 'simpan').click(); await tunggu(700);
      var am = terakhir('absen_manual');
      ok('SIMPAN mengirim absen_manual: karyawan K004, tanggal 2026-10-05, jam 16:31, jenis PULANG, alasan "Lupa absen"', !!am && am.karyawan === 'K004' && am.tanggal === '2026-10-05' && am.jam === '16:31' && am.jenis === 'PULANG' && am.alasan === 'Lupa absen' && am.sesi === 'S'.repeat(40));
      var fu = terakhir('absensi_unggah_foto');
      ok('foto diunggah sesudahnya lewat absensi_unggah_foto (karyawan, tanggal, jenis, gambar)', !!fu && fu.karyawan === 'K004' && fu.jenis === 'PULANG' && /^data:image\/jpeg/.test(fu.gambar));
      ok('dialog "Absen manual tersimpan" tampil', /Absen manual tersimpan/.test(el('dialog').textContent));
      var d0 = jumlah('konfirmasi_daftar');
      el('dlgOk').click(); await tunggu(700);
      ok('OK kembali ke Konfirmasi dan memuat ulang daftar', aktif() === 'layarKonfirmasi' && jumlah('konfirmasi_daftar') > d0);
      // ---- konflik (53) ----
      konfDaftar = konfDaftar.concat([]);
      document.querySelector('#daftarKonfirmasi [data-kel="KONFLIK"] [data-konf="konflik"]').click(); await tunggu(900);
      ok('"Lihat detail" membuka layar 53 dan memanggil konflik_detail dengan id item', aktif() === 'lb53' && !!terakhir('konflik_detail') && terakhir('konflik_detail').id === 'KONFLIK|M-K003-261005-074000-T1');
      ok('layar 53 terisi: "Senin, 5 Okt · Budi Santoso", "Budi menekan BUKAN SAYA pada absen lama ini.", "Absen lama 07:40 milik siapa?", "Absen Budi sekarang"', teks(f('lb53', 'sub')) === 'Senin, 5 Okt · Budi Santoso' && teks(f('lb53', 'info')) === 'Budi menekan BUKAN SAYA pada absen lama ini.' && teks(f('lb53', 'tanya')) === 'Absen lama 07:40 milik siapa?' && teks(f('lb53', 'judulBaru')) === 'Absen Budi sekarang');
      ok('dua foto dimuat lewat konflik_foto (LAMA dan BARU)', semua('konflik_foto').some(function (x) { return x.which === 'LAMA'; }) && semua('konflik_foto').some(function (x) { return x.which === 'BARU'; }) && /url\(/.test(f('lb53', 'fotoLama').style.backgroundImage));
      ok('pilihan "Pindahkan ke": "Rina Wati (belum ada absen masuk)"; Alasan 3 pilihan; Pindahkan nonaktif sampai ada pilihan; hapus aktif', /Rina Wati \(belum ada absen masuk\)/.test(f('lb53', 'pindah').textContent) && f('lb53', 'alasan').options.length === 3 && f('lb53', 'pindahkan').disabled && !f('lb53', 'hapus').disabled);
      ubah(f('lb53', 'pindah'), 'K004'); await tunggu(500);
      ok('memilih karyawan: konflik_pratinjau dipanggil, "Hasil: Rina 07:40 HADIR · Budi 07:52 TELAT", Pindahkan aktif', terakhir('konflik_pratinjau').ke === 'K004' && teks(f('lb53', 'hasil')) === 'Hasil: Rina 07:40 HADIR · Budi 07:52 TELAT' && !f('lb53', 'pindahkan').disabled);
      f('lb53', 'pindahkan').click(); await tunggu(300);
      ok('Pindahkan meminta konfirmasi dulu (dialog), belum mengirim', /Pindahkan absen ke Rina Wati/.test(el('dialog').textContent) && !terakhir('konflik_putuskan'));
      el('dlgYa').click(); await tunggu(600);
      var kp = terakhir('konflik_putuskan');
      ok('konflik_putuskan: tindakan PINDAH, ke K004, alasan dari pilihan', !!kp && kp.tindakan === 'PINDAH' && kp.ke === 'K004' && kp.alasan === 'Salah tekan IYA saat pengenalan wajah' && kp.id === 'KONFLIK|M-K003-261005-074000-T1');
      ok('dialog hasil "Konflik diselesaikan"', /Konflik diselesaikan/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(700);
      ok('kembali ke Konfirmasi; kartu konflik sudah hilang', aktif() === 'layarKonfirmasi' && !document.querySelector('#daftarKonfirmasi [data-kel="KONFLIK"]'));
      el('btnKembaliKonf').click(); await tunggu(300);

    }

    if (K === 'admin2') {
      await masukPribadi('Dewi Lestari');
      // ---- data absensi (64) ----
      await dariMenuAdmin('Data absensi');
      ok('Data absensi (64) terbuka dan memanggil absensi_daftar rentang PEKAN dengan sesi admin', aktif() === 'lb64' && !!terakhir('absensi_daftar') && terakhir('absensi_daftar').rentang === 'PEKAN' && terakhir('absensi_daftar').sesi === 'S'.repeat(40));
      var baris = f('lb64', 'daftar').children;
      ok('tiga baris tampil, terbaru di atas; penanda LEMBUR, LUPA PULANG, TELAT dan "· diedit"', baris.length === 3 && /Budi Santoso/.test(baris[0].textContent) && /diedit/.test(baris[0].textContent) && /LEMBUR/.test(baris[0].textContent) && /LUPA PULANG/.test(baris[1].textContent) && /TELAT/.test(baris[2].textContent));
      ok('format baris seperti mockup: "6 Okt · masuk 07:45 · pulang 18:35", "pulang —" bila kosong', /6 Okt · masuk 07:45 · pulang 18:35/.test(baris[0].textContent) && /masuk 07:40 · pulang —/.test(baris[1].textContent));
      ok('filter Tanggal dan Karyawan aktif; pilihan Pekan ini / Hari ini / Bulan ini dan karyawan dari server', !f('lb64', 'ft').disabled && f('lb64', 'ft').options.length === 3 && f('lb64', 'fk').options.length === 3);
      ubah(f('lb64', 'ft'), 'BULAN'); await tunggu(500);
      ok('ganti Tanggal ke Bulan ini memuat ulang dengan rentang BULAN', terakhir('absensi_daftar').rentang === 'BULAN');
      ubah(f('lb64', 'fk'), 'K003'); await tunggu(500);
      ok('ganti Karyawan memuat ulang dengan karyawan K003', terakhir('absensi_daftar').karyawan === 'K003');
      // ---- edit absen (65) ----
      f('lb64', 'daftar').querySelectorAll('button[data-edit]')[2].click(); await tunggu(900);
      ok('ketuk pensil membuka layar 65 dan memanggil absensi_edit_info (karyawan K003, tanggal 2026-10-05)', aktif() === 'lb65' && terakhir('absensi_edit_info').karyawan === 'K003' && terakhir('absensi_edit_info').tanggal === '2026-10-05');
      ok('layar 65: "5 Okt · Budi Santoso", tab Masuk terpilih, jam masuk 07:52, jam foto 07:51:40, foto dimuat', teks(f('lb65', 'sub')) === '5 Okt · Budi Santoso' && f('lb65', 'jam').value === '07:52' && teks(f('lb65', 'jamFoto')) === '07:51:40' && teks(f('lb65', 'labelJam')) === 'Jam masuk' && !!terakhir('absensi_foto'));
      ok('elemen aktif; Simpan nonaktif sebelum alasan diisi', !f('lb65', 'jam').disabled && !f('lb65', 'alasan').disabled && !f('lb65', 'updateFoto').disabled && f('lb65', 'simpan').disabled);
      ubah(f('lb65', 'jam'), '07:44'); await tunggu(500);
      ok('Sebelum → sesudah dari server: "Masuk 07:52 (TELAT 7 mnt) → Masuk 07:44 (HADIR)"', teks(f('lb65', 'ringkas')) === 'Masuk 07:52 (TELAT 7 mnt) → Masuk 07:44 (HADIR)' && terakhir('absensi_edit_pratinjau').jam === '07:44');
      ubah(f('lb65', 'alasan'), 'abc'); await tunggu(100);
      ok('alasan kurang dari 5 karakter: Simpan tetap nonaktif', f('lb65', 'simpan').disabled);
      ubah(f('lb65', 'alasan'), 'Salah catat jam'); await tunggu(100);
      ok('alasan 5 karakter atau lebih: Simpan aktif', !f('lb65', 'simpan').disabled);
      f('lb65', 'tabPulang').click(); await tunggu(700);
      ok('tab Pulang: label "Jam pulang", jam 16:31, foto pulang dimuat ulang', teks(f('lb65', 'labelJam')) === 'Jam pulang' && f('lb65', 'jam').value === '16:31' && terakhir('absensi_foto').jenis === 'PULANG');
      f('lb65', 'tabMasuk').click(); await tunggu(700);
      ubah(f('lb65', 'jam'), '07:44'); await tunggu(500);
      f('lb65', 'updateFoto').click(); await tunggu(200);
      ok('Update foto: foto baru tampil di kotak', /url\(/.test(f('lb65', 'foto').parentElement.style.backgroundImage) && teks(f('lb65', 'jamFoto')) === 'foto baru');
      f('lb65', 'simpan').click(); await tunggu(800);
      var ae = terakhir('absensi_edit');
      ok('Simpan mengirim absensi_edit: K003, 2026-10-05, MASUK, jam 07:44, alasan "Salah catat jam"', !!ae && ae.karyawan === 'K003' && ae.tanggal === '2026-10-05' && ae.jenis === 'MASUK' && ae.jam === '07:44' && ae.alasan === 'Salah catat jam');
      ok('foto baru ikut diunggah (absensi_unggah_foto jenis MASUK)', terakhir('absensi_unggah_foto').jenis === 'MASUK' && terakhir('absensi_unggah_foto').karyawan === 'K003');
      ok('dialog "Absen diperbarui" dengan hasil sesudah', /Absen diperbarui/.test(el('dialog').textContent) && /Masuk 07:44 \(HADIR\)/.test(el('dialog').textContent));
      var dl = jumlah('absensi_daftar');
      el('dlgOk').click(); await tunggu(800);
      ok('OK kembali ke Data absensi dan memuat ulang daftar', aktif() === 'lb64' && jumlah('absensi_daftar') > dl);
    }
  } catch (e) { H.push('GALAT ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  H.unshift(H.filter(function (x) { return /^GAGAL|^GALAT/.test(x); }).length ? 'ADA YANG GAGAL' : 'SEMUA OK');
})();
