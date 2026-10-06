// Dijalankan di <head> sebelum aplikasi (lewat PRA=...): HP toko terdaftar di localStorage + server TIRUAN untuk admin HP toko.
// Pakai: PRA="$(cat tools/pra_toko.js)" ID="" bash tools/potret.sh app "" hasil.png tools/isi_beranda_admin_toko.js
localStorage.setItem('absen_hp_toko', JSON.stringify({ token: 'T'.repeat(40), id: 'HPT-NGW-01', cabang: 'Ngawi', nama: 'HP toko 1' }));
window.__BERANDA = window.__BERANDA || {
  status: 'ok', tanggal: '2026-09-28', jam: '08:20', hari: 'Senin', cabang: 'Ngawi',
  semua: { tepat: 8, telat: 2, belum: 4, izin: 1 },
  shift: [
    { no: 1, nama: 'Shift 1', masuk: '07:45', tepat: 8, telat: 2, belum: 1, izin: 1, belum_daftar: [{ nama: 'Joko Susilo', panggilan: 'Joko', jadwal: '07:45' }] },
    { no: 2, nama: 'Shift 2', masuk: '13:45', tepat: 0, telat: 0, belum: 3, izin: 0, belum_daftar: [{ nama: 'Rina Wati', panggilan: 'Rina', jadwal: '13:45' }, { nama: 'Ani Yulia', panggilan: 'Ani', jadwal: '13:45' }, { nama: 'Dedi Kurnia', panggilan: 'Dedi', jadwal: '13:45' }] }
  ],
  telat7: [], tertinggi: null
};
window.__panggilan = [];
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  window.__panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'daftar_karyawan') { d = { status: 'ok', cabang: 'Ngawi', karyawan: [] }; }
  if (b.aksi === 'login_admin_toko') { d = { status: 'ok', sesi: 'S'.repeat(40), nama: 'Dewi Lestari', cabang: 'Ngawi' }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 5, jumlah_teks: '5' }; }
  if (b.aksi === 'beranda_hari_ini') { d = window.__BERANDA; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
// Daftar Konfirmasi tiruan (mockup 52)
(function () {
  var item = function (id, kel, jenis, nama) { return { id: id, jenis: jenis, kelompok: kel, karyawan: id.split('|')[0], nama: nama, cabang: 'Ngawi', tanggal: '2026-10-06', shift: '1', jam: '08:05', status: '', ket: 'Survey', tingkat: kel === 'LEMBUR' ? 2 : 0, durasi_menit: 75, gps: kel === 'LUAR' ? '-7.4,111.4,12' : '', akurasi: 12, akurasi_buruk: false, maps: 'https://www.google.com/maps?q=-7.4,111.4', foto: 'ADA' }; };
  var daftar = [item('K001|2026-10-06|MASUK', 'LUAR', 'MASUK', 'Dewi Lestari'), item('K002|2026-10-05|PULANG', 'LEMBUR', 'PULANG', 'Budi Santoso'), item('K003|2026-10-05|PULANG', 'PULANG_CEPAT', 'PULANG', 'Andi Pratama')];
  var f0 = window.fetch;
  window.fetch = function (url, opsi) {
    var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
    if (b.aksi === "konfirmasi_daftar") { window.__panggilan.push(b); var d = { status: 'ok', daftar: daftar.slice(), total: daftar.length, jumlah_teks: String(daftar.length), ada_lagi: false }; return Promise.resolve({ json: function () { return Promise.resolve(d); } }); }
    if (b.aksi === 'konfirmasi_jumlah') { var j = { status: 'ok', jumlah: daftar.length, jumlah_teks: String(daftar.length) }; return Promise.resolve({ json: function () { return Promise.resolve(j); } }); }
    return f0(url, opsi);
  };
})();
// Daftar karyawan tiruan (mockup 58) dan tambah karyawan (mockup 60-63)
(function () {
  var f0 = window.fetch;
  var aktif = [['K001', 'Andi Pratama', 'Andi', '1'], ['K002', 'Budi Santoso', 'Budi', '1'], ['K003', 'Joko Susilo', 'Joko', '2'], ['K004', 'Rina Wati', 'Rina', '1']].map(function (x) { return { id: x[0], nama: x[1], panggilan: x[2], shift: x[3], aktif: true }; });
  var mati = [{ id: 'K009', nama: 'Tono Wibowo', panggilan: 'Tono', shift: '1', aktif: false }];
  window.fetch = function (url, opsi) {
    var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
    var d = null;
    if (b.aksi === 'karyawan_daftar') { d = { status: 'ok', cabang: 'Ngawi', daftar: b.kelompok === 'NONAKTIF' ? mati : aktif, daftar_shift: [{ no: '1', nama: 'Shift 1', masuk: '07:45', pulang: '16:30' }], kelompok: b.kelompok, jumlah_aktif: aktif.length }; }
    if (b.aksi === 'karyawan_tambah') { d = { status: 'ok', id: 'K005' }; }
    if (d) { window.__panggilan.push(b); return Promise.resolve({ json: function () { return Promise.resolve(d); } }); }
    return f0(url, opsi);
  };
})();
