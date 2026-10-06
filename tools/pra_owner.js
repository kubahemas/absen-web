// Dijalankan di <head> sebelum aplikasi (lewat PRA=...): server TIRUAN untuk owner (beranda mockup 71 dan layar lain kelompok 3).
try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
// Pakai: PRA="$(cat tools/pra_owner.js)" ID="" bash tools/potret.sh app "" hasil.png tools/isi_beranda_owner.js
window.__panggilan = [];
window.__BELUM_SEMUA = [['Joko Susilo', '07:45'], ['Dedi Kurnia', '07:45'], ['Rina Wati', '13:45'], ['Ani Yulia', '13:45'], ['Tono Wibowo', '13:45'], ['Sari Utami', '08:00'], ['Dodi Hartono', '08:00']];
function __daftar(arr, no) { return arr.map(function (x) { return { nama: x[0], panggilan: x[0].split(' ')[0], jadwal: x[1] }; }); }
window.__berandaOwner = function (cab) {
  var n1 = [["Dedi Kurnia", "07:45"], ["Joko Susilo", "07:45"]], p1 = [["Sari Utami", "08:00"], ["Dodi Hartono", "08:00"]];
  var s1 = cab === "Pusat" ? p1 : (cab === "Ngawi" ? n1 : n1.concat(p1));
  var s2 = cab === "Pusat" ? [] : [["Ani Yulia", "13:45"], ["Rina Wati", "13:45"], ["Tono Wibowo", "13:45"]];
  return {
    status: 'ok', tanggal: '2026-09-28', jam: '08:20', hari: 'Senin', cabang: cab || '',
    semua: { tepat: 18, telat: 3, belum: s1.length + s2.length, izin: 3 },
    shift: [
      { no: 1, nama: 'Shift 1', masuk: '07:45', tepat: 15, telat: 3, belum: s1.length, izin: 2, belum_daftar: __daftar(s1) },
      { no: 2, nama: 'Shift 2', masuk: '13:45', tepat: 3, telat: 0, belum: s2.length, izin: 1, belum_daftar: __daftar(s2) }
    ],
    telat7: [['2026-09-22', 'Sel', 3], ['2026-09-23', 'Rab', 2], ['2026-09-24', 'Kam', 4], ['2026-09-25', 'Jum', 1], ['2026-09-26', 'Sab', 5], ['2026-09-27', 'Min', 0], ['2026-09-28', 'Sen', 6]].map(function (x) { return { tanggal: x[0], hari: x[1], hari_panjang: x[1], jumlah: x[2] }; }),
    tertinggi: { tanggal: '2026-09-28', hari: 'Sen', hari_panjang: 'Senin', jumlah: 6 },
    daftar_cabang: ['Ngawi', 'Pusat']
  };
};
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  window.__panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_owner') { d = { status: 'ok', sesi: 'O'.repeat(40) }; }
  if (b.aksi === 'owner_beranda') { d = { status: 'ok', nama: 'Owner', id: 'OWN01', perangkat_aktif: [] }; }
  if (b.aksi === 'beranda_hari_ini') { d = window.__berandaOwner(b.cabang); }
  if (b.aksi === 'owner_perhatian') {
    d = { status: "ok", jumlah_belum: 4, jumlah_teks: "4", terbaru: [
      { id: 'a1', tipe: 'HP_BARU', judul: 'HP toko baru: HPT-NGW-03', sub: '2026-09-28 07:12', info: '4 km dari toko' },
      { id: 'a2', tipe: 'LOGIN_PERANGKAT_BARU', judul: 'Login dari perangkat baru', sub: '2026-09-28 06:10', info: '' },
      { id: 'a3', tipe: 'LOGIN_PERANGKAT_BARU', judul: 'Login dari perangkat baru', sub: '2026-09-27 21:00', info: '' }
    ] };
  }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 2, jumlah_teks: '2' }; }
  if (b.aksi === 'konfirmasi_daftar') { var it = function (id, kel, jenis, nama) { return { id: id, jenis: jenis, kelompok: kel, karyawan: id.split('|')[0], nama: nama, cabang: 'Ngawi', tanggal: '2026-09-28', shift: '1', jam: '08:05', status: '', ket: 'Survey', tingkat: kel === 'LEMBUR' ? 2 : 0, durasi_menit: 75, gps: kel === 'LUAR' ? '-7.4,111.4,12' : '', akurasi: 12, akurasi_buruk: false, maps: 'https://www.google.com/maps?q=-7.4,111.4', foto: 'ADA' }; }; var l = [it('A01|2026-09-28|MASUK', 'LUAR', 'MASUK', 'Dewi Lestari'), it('A02|2026-09-27|PULANG', 'LEMBUR', 'PULANG', 'Sari Utami')]; d = { status: 'ok', daftar: l, total: 2, jumlah_teks: '2', ada_lagi: false }; }
  if (b.aksi === 'owner_daftar_hp') { d = { status: 'ok', hp_toko: [{ id: 'HPT-NGW-01', nama: 'HP toko 1', cabang: 'Ngawi', aktif: true }, { id: 'HPT-NGW-02', nama: 'HP toko 2', cabang: 'Ngawi', aktif: true }, { id: 'HPT-PST-01', nama: 'HP toko pusat', cabang: 'Pusat', aktif: false }] }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
// Antrean Konfirmasi (28) yang bisa diisi ulang oleh uji: window.__KONF (urutan server = terbaru dulu)
(function () {
  var f0 = window.fetch;
  var mk = function (id, kel, jenis, nama) { return { id: id, jenis: jenis, kelompok: kel, karyawan: id.split('|')[0], nama: nama, cabang: 'Ngawi', tanggal: '2026-09-28', shift: '1', jam: '08:05', status: '', ket: 'Survey', tingkat: kel === 'LEMBUR' ? 2 : 0, durasi_menit: 75, gps: kel === 'LUAR' ? '-7.4,111.4,12' : '', akurasi: 12, akurasi_buruk: false, maps: 'https://www.google.com/maps?q=-7.4,111.4', foto: 'ADA' }; };
  window.__KONF = window.__KONF || [mk('A01|2026-09-28|MASUK', 'LUAR', 'MASUK', 'Dewi Lestari'), mk('A02|2026-09-27|PULANG', 'LEMBUR', 'PULANG', 'Sari Utami')];
  window.fetch = function (url, opsi) {
    var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
    var d = null;
    if (window.__KONF && b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: window.__KONF.slice(0, 20), total: window.__KONF.length, jumlah_teks: String(window.__KONF.length), ada_lagi: false }; }
    if (window.__KONF && b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: window.__KONF.length, jumlah_teks: String(window.__KONF.length) }; }
    if (window.__KONF && b.aksi === 'konfirmasi_putuskan') { for (var q = 0; q < window.__KONF.length; q++) { if (window.__KONF[q].id === b.id) { window.__KONF.splice(q, 1); break; } } d = { status: 'ok', keputusan: b.keputusan === 'ACC' ? 'DITERIMA' : 'DITOLAK' }; }
    if (d) { window.__panggilan.push(b); return Promise.resolve({ json: function () { return Promise.resolve(d); } }); }
    return f0(url, opsi);
  };
})();
