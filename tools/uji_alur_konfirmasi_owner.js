// Uji server TIRUAN: owner membuka Konfirmasi dari kotak di beranda, ACC dan Tolak.
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var item = function (id, kel, jenis, nama) { return { id: id, jenis: jenis, kelompok: kel, karyawan: id.split('|')[0], nama: nama, cabang: 'Ngawi', tanggal: '2026-10-06', shift: '1', jam: '08:05', status: '', ket: 'Survey, pasang AC', tingkat: kel === 'LEMBUR' ? 2 : 0, durasi_menit: 75, gps: '-7.4,111.4,12', akurasi: 12, akurasi_buruk: false, maps: 'https://www.google.com/maps?q=-7.4,111.4', foto: 'ADA' }; };
var sisa = [item('K001|2026-10-06|MASUK', 'LUAR', 'MASUK', 'Dewi Lestari'), item('K002|2026-10-05|PULANG', 'LEMBUR', 'PULANG', 'Budi Santoso'), item('K003|2026-10-05|PULANG', 'PULANG_CEPAT', 'PULANG', 'Andi Pratama')];
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_owner') { d = { status: 'ok', sesi: 'O'.repeat(40) }; }
  if (b.aksi === 'owner_beranda') { d = { status: 'ok', nama: 'Owner', id: 'OWN01', perangkat_aktif: [] }; }
  if (b.aksi === 'beranda_hari_ini') { d = { status: 'ok', tanggal: '2026-10-06', jam: '08:20', hari: 'Selasa', cabang: '', semua: { tepat: 2, telat: 1, belum: 0, izin: 0 }, shift: [{ no: 1, nama: 'Shift 1', masuk: '07:45', tepat: 2, telat: 1, belum: 0, izin: 0, belum_daftar: [] }], telat7: [], tertinggi: null, daftar_cabang: ['Ngawi'] }; }
  if (b.aksi === 'owner_perhatian') { d = { status: 'ok', jumlah: 0, jumlah_teks: '0', daftar: [] }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: sisa.length, jumlah_teks: String(sisa.length) }; }
  if (b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: sisa.slice(), total: sisa.length, jumlah_teks: String(sisa.length), ada_lagi: false }; }
  if (b.aksi === 'konfirmasi_putuskan') { sisa = sisa.filter(function (x) { return x.id !== b.id; }); d = { status: 'ok', keputusan: b.keputusan === 'ACC' ? 'DITERIMA' : 'DITOLAK' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
(async function () {
  try {
    el('btnJenisOwner').click(); await tunggu(100);
    el('ownUsername').value = 'owner'; el('ownPassword').value = 'rahasia123';
    el('btnMasukOwner').click(); await tunggu(700);
    ok('beranda owner terbuka', aktif() === 'layarOwner');
    ok('kotak "Konfirmasi data admin" ada di beranda owner dengan jumlah 3', !!el('btnOwnerKonf') && /Konfirmasi data admin/.test(el('btnOwnerKonf').textContent) && el('ownerKonfJumlah').textContent === '3');
    el('btnMenuOwner').click(); await tunggu(100);
    var m = Array.prototype.map.call(document.querySelectorAll('#menuOwner .menu-kartu button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim() + (b.disabled ? '[x]' : ''); });
    H.push('       menu owner: ' + m.join(' | '));
    ok('menu owner sesuai mockup 72 (item dengan layar baru kini AKTIF); Perangkat (HP toko) aktif', /^Log admin$/.test(m[0]) && m.some(function (x) { return x === 'Perangkat (HP toko)'; }) && m.some(function (x) { return /^Ganti password$/.test(x); }));
    el('menuLatar').click();
    el('btnOwnerKonf').click(); await tunggu(500);
    ok('layar Konfirmasi terbuka dari kotak beranda', aktif() === 'layarKonfirmasi');
    ok('judul "Konfirmasi data admin", badge Owner, catatan admin tidak bisa ACC datanya sendiri', el('konfJudul').textContent === 'Konfirmasi data admin' && el('konfBadge').textContent === 'Owner' && el('konfCatatan').style.display !== 'none');
    var kartu = el('daftarKonfirmasi').querySelectorAll('.kartu-konf');
    ok('3 kartu tampil dengan tombol ACC dan Tolak', kartu.length === 3 && kartu[0].querySelector('.acc') && kartu[0].querySelector('.tolak'));
    ok('chip pengelompokan tersembunyi untuk owner (mockup 28)', el('konfChips').style.display === 'none');
    kartu[0].querySelector('.acc').click(); await tunggu(600);
    var p = panggilan.filter(function (x) { return x.aksi === 'konfirmasi_putuskan'; });
    ok('ACC terkirim dengan sesi owner (tanpa token HP toko)', p.length === 1 && p[0].keputusan === 'ACC' && p[0].id === 'K001|2026-10-06|MASUK' && p[0].sesi === 'O'.repeat(40) && !p[0].token);
    ok('kartu yang di-ACC hilang dari daftar', el('daftarKonfirmasi').querySelectorAll('.kartu-konf').length === 2);
    el('daftarKonfirmasi').querySelector('.kartu-konf .tolak').click(); await tunggu(200);
    ok('Tolak meminta konfirmasi dulu', el('dialog').classList.contains('tampil'));
    el('dlgYa').click(); await tunggu(600);
    p = panggilan.filter(function (x) { return x.aksi === 'konfirmasi_putuskan'; });
    ok('TOLAK terkirim', p.length === 2 && p[1].keputusan === 'TOLAK');
    el('btnKembaliKonf').click(); await tunggu(500);
    ok('Home kembali ke beranda owner dan jumlah di kotak diperbarui (1)', aktif() === 'layarOwner' && el('ownerKonfJumlah').textContent === '1');
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
