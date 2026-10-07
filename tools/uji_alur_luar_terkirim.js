// Skrip uji (server TIRUAN): pop-up absen luar terkirim = layar 35 (lb35) untuk masuk, pulang, dan lembur luar (keputusan pemilik 2026-10-07).
// Pakai: BUDGET=40000 ID="" tools/potret.sh app "" hasil.png tools/uji_alur_luar_terkirim.js   (pita hijau di atas gambar = hasil)
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function teks(id) { return el(id).textContent.replace(/\s+/g, ' ').trim(); }
var sudahMasuk = false, lemburBoleh = false, modeBalasan = 'ok', tiketKe = 0;
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: 'KARYAWAN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: sudahMasuk, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: lemburBoleh }; }
  if (b.aksi === 'tiket_waktu') { d = { status: 'ok', tiket: 'TIKET' + (++tiketKe) }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 0, jumlah_teks: '0' }; }
  if (b.aksi === 'absen_luar_masuk') { d = modeBalasan === 'gagal' ? { status: 'gagal', pesan: 'Semua aksi lain wajib menyertakan token HP toko yang terdaftar' } : { status: 'ok', st_masuk: 'HADIR', jam: '08:00', shift: 'Shift 1', id_absen: 'M-K001-261007-080000-P' }; }
  if (b.aksi === 'absen_luar_pulang') {
    d = b.jenis === 'PULANG_LEMBUR'
      ? { status: 'ok', st_pulang: 'LEMBUR DI TOKO', jam: '17:40', durasi_menit: 75, tingkat: 2, shift: 'Shift 1', acc: 'MENUNGGU', id_absen: 'L-K001-261007-174000-P' }
      : { status: 'ok', st_pulang: 'PULANG NORMAL', jam: '16:31', shift: 'Shift 1', id_absen: 'P-K001-261007-163100-P' };
  }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
navigator.geolocation.watchPosition = function (s) { setTimeout(function () { s({ coords: { latitude: -7.4, longitude: 111.4, accuracy: 10 } }); }, 50); return 1; };
navigator.geolocation.clearWatch = function () {};
function tanpaAngkaPopup() { return teks('lb35').replace(/\d{1,2}:\d{2}/g, '').replace(/dalam 4 detik/, ''); }
async function kirimLuar(tombolBeranda, tombolKirim, ket) {
  el(tombolBeranda).click(); await tunggu(400);
  el('luarKet').value = ket; el(tombolKirim).click(); await tunggu(700);
}
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    el('pribNama').value = 'Budi Santoso'; el('pribRahasia').value = '12345'; el('btnMasukPribadi').click(); await tunggu(600);
    ok('beranda HP pribadi terbuka', aktif() === 'layarPribadi');
    // ---- MASUK luar ----
    await kirimLuar('btnPribMasuk', 'btnKirimMasuk', 'Pasang AC rumah Bu Sri');
    ok('absen luar MASUK diterima: layar 35 (lb35) tampil sebagai pop-up', aktif() === 'lb35');
    ok('judul memakai nama dari server/akun: "Selamat bekerja, Budi!"', /Selamat bekerja, Budi!/.test(teks('lb35')));
    ok('jam = jam dari server (jam tiket): "Masuk 08:00 (Absen luar ..."', /Masuk 08:00 \(Absen luar/.test(teks('lb35')));
    ok('status "Menunggu persetujuan admin" tampil', /Menunggu persetujuan admin/.test(teks('lb35')));
    ok('kotak "Bulan ini" nonaktif tanpa angka (Masuk/Telat/Izin/Sisa cuti = tanda strip)', /Bulan ini/.test(teks('lb35')) && !/\d/.test(tanpaAngkaPopup().replace(/Pasang AC rumah Bu S/, '')) && !!el('lb35').querySelector('.belum-aktif'));
    ok('tidak ada pop-up lama yang ikut tampil bersamaan', !el('popup').classList.contains('tampil'));
    ok('tiket diminta saat tombol beranda ditekan, dikirim ke server bersama keterangan', panggilan.filter(function (x) { return x.aksi === 'absen_luar_masuk'; })[0].tiket === 'TIKET1' && panggilan.filter(function (x) { return x.aksi === 'absen_luar_masuk'; })[0].keterangan === 'Pasang AC rumah Bu Sri');
    el('lb35').click(); await tunggu(300);
    ok('ketuk di mana saja menutup layar 35 dan kembali ke beranda pribadi', aktif() === 'layarPribadi');
    // ---- PULANG luar (menutup sendiri 4 detik) ----
    sudahMasuk = true;
    el('btnSegarkanPribadi').click(); await tunggu(500);
    await kirimLuar('btnPribPulang', 'btnKirimPulang', 'Selesai pasang AC');
    ok('absen luar PULANG diterima: layar 35 dengan "Terima kasih, Budi!" dan "Pulang 16:31 (Absen luar"', aktif() === 'lb35' && /Terima kasih, Budi!/.test(teks('lb35')) && /Pulang 16:31 \(Absen luar/.test(teks('lb35')));
    await tunggu(4600);
    ok('menutup otomatis setelah 4 detik, kembali ke beranda pribadi', aktif() === 'layarPribadi');
    // ---- LEMBUR luar ----
    lemburBoleh = true;
    el('btnSegarkanPribadi').click(); await tunggu(500);
    ok('tombol LEMBUR aktif', !el('btnPribLembur').disabled);
    await kirimLuar('btnPribLembur', 'btnKirimPulang', 'Bongkar muat barang');
    ok('absen luar LEMBUR diterima: layar 35 dengan "Lembur 17:40, 1 jam 15 menit (Absen luar"', aktif() === 'lb35' && /Lembur 17:40, 1 jam 15 menit \(Absen luar/.test(teks('lb35')));
    ok('permintaan lembur memakai jenis PULANG_LEMBUR', panggilan.filter(function (x) { return x.aksi === 'absen_luar_pulang'; }).pop().jenis === 'PULANG_LEMBUR');
    await tunggu(4600);
    ok('layar 35 menutup sendiri, kembali ke beranda', aktif() === 'layarPribadi');
    // ---- gagal: pesan galat lama tetap ----
    sudahMasuk = false; lemburBoleh = false; modeBalasan = 'gagal';
    el('btnSegarkanPribadi').click(); await tunggu(500);
    await kirimLuar('btnPribMasuk', 'btnKirimMasuk', 'Pasang AC rumah Bu Sri');
    ok('pengiriman GAGAL: pesan galat lama tetap tampil ("Absen luar belum bisa dikirim"), layar 35 TIDAK muncul', aktif() !== 'lb35' && /Absen luar belum bisa dikirim/.test(el('popup').textContent) && !/token HP toko/.test(document.body.innerText));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
