// Uji server TIRUAN: admin HP pribadi membuka Konfirmasi (kartu Menu admin), chip pengelompokan, ACC.
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var item = function (id, kel, jenis, nama) { return { id: id, jenis: jenis, kelompok: kel, karyawan: id.split('|')[0], nama: nama, cabang: 'Ngawi', tanggal: '2026-10-06', shift: '1', jam: '08:05', status: '', ket: 'Survey', tingkat: kel === 'LEMBUR' ? 2 : 0, durasi_menit: 75, gps: kel === 'LUAR' ? '-7.4,111.4,12' : '', akurasi: 12, akurasi_buruk: false, maps: 'https://www.google.com/maps?q=-7.4,111.4', foto: 'ADA' }; };
var sisa = [item('K001|2026-10-06|MASUK', 'LUAR', 'MASUK', 'Dewi Lestari'), item('K002|2026-10-05|PULANG', 'LEMBUR', 'PULANG', 'Budi Santoso'), item('K004|2026-10-05|PULANG', 'LEMBUR', 'PULANG', 'Siti Rohmah'), item('K003|2026-10-05|PULANG', 'PULANG_CEPAT', 'PULANG', 'Andi Pratama')];
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K009', nama: 'Dewi Lestari', panggilan: 'Dewi', role: 'ADMIN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '' }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: sisa.length, jumlah_teks: String(sisa.length) }; }
  if (b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: sisa.slice(), total: sisa.length, jumlah_teks: String(sisa.length), ada_lagi: false }; }
  if (b.aksi === 'konfirmasi_putuskan') { sisa = sisa.filter(function (x) { return x.id !== b.id; }); d = { status: 'ok', keputusan: 'DITERIMA' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    el('pribNama').value = 'Dewi Lestari'; el('pribRahasia').value = 'rahasia12';
    el('btnMasukPribadi').click(); await tunggu(700);
    ok('kartu Menu admin menampilkan jumlah 4', el('pribMenuAdminJumlah').textContent === '4');
    el('btnPribMenuAdmin').click(); await tunggu(600);
    ok('Konfirmasi terbuka dari menu admin', aktif() === 'layarKonfirmasi');
    ok('judul Konfirmasi, badge "Admin Ngawi", catatan owner tersembunyi', el('konfJudul').textContent === 'Konfirmasi' && el('konfBadge').textContent === 'Admin Ngawi' && el('konfCatatan').style.display === 'none');
    var chips = Array.prototype.map.call(el('konfChips').querySelectorAll('button'), function (b) { return b.textContent + (b.disabled ? '[x]' : ''); });
    H.push('       chip: ' + chips.join(' | '));
    ok('chip: Semua 4, Lembur 2, Absen luar 1 (tanpa chip Pulang cepat, keputusan pemilik); Izin AKTIF (Izin 0, fungsinya sudah ada); Lupa absen "Segera" nonaktif', chips[0] === 'Semua 4' && chips[1] === 'Lembur 2' && chips[2] === 'Absen luar 1' && chips.length === 5 && chips[3] === 'Izin 0' && /Lupa absen.*Segera/.test(chips[4]) && /\[x\]/.test(chips[4]));
    el('konfChips').querySelector('button[data-kel="LEMBUR"]').click();
    var tampil = Array.prototype.filter.call(el('daftarKonfirmasi').querySelectorAll('.kartu-konf'), function (k) { return k.style.display !== 'none'; });
    ok('chip Lembur menyaring: hanya 2 kartu lembur tampil', tampil.length === 2 && tampil.every(function (k) { return k.getAttribute('data-kel') === 'LEMBUR'; }));
    tampil[0].querySelector('.acc').click(); await tunggu(600);
    var p = panggilan.filter(function (x) { return x.aksi === 'konfirmasi_putuskan'; })[0];
    ok('ACC memakai sesi HP pribadi admin', !!p && p.keputusan === 'ACC' && p.id === 'K002|2026-10-05|PULANG' && p.sesi === 'S'.repeat(40) && !p.token);
    el('konfChips').querySelector('button[data-kel=""]').click();
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
