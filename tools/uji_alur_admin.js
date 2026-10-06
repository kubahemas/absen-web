// Skrip uji server TIRUAN: login admin HP pribadi (kata sandi), Menu admin, menu pojok, tombol LEMBUR setelah absen masuk.
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K009', nama: 'Dewi Lestari', panggilan: 'Dewi', role: 'ADMIN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: true, sudah_pulang: false, jam_masuk: '07:40', jam_pulang: '', cara_masuk: 'LUAR', st_pulang: '' }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 5, jumlah_teks: '5' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    el('btnModeLogin').click();
    ok('mode admin: kolom kata sandi tampil, keypad tersembunyi, tombol Masuk tampil', el('bagianSandiLogin').style.display !== 'none' && el('bagianPinLogin').style.display === 'none' && el('btnMasukPribadi').style.display !== 'none');
    el('pribNama').value = 'Dewi Lestari'; el('pribRahasia').value = 'rahasia12';
    el('btnMasukPribadi').click(); await tunggu(600);
    var lg = panggilan.filter(function (x) { return x.aksi === 'login_pribadi'; })[0];
    ok('login admin mengirim kata sandi', !!lg && lg.rahasia === 'rahasia12' && lg.nama === 'Dewi Lestari');
    ok('beranda terbuka', aktif() === 'layarPribadi');
    ok('varian admin: kartu Menu admin tampil dengan angka 5', el('btnPribMenuAdmin').style.display !== 'none' && el('pribMenuAdminJumlah').textContent === '5' && el('pbIsi').classList.contains('admin'));
    ok('sudah masuk: ABSEN MASUK nonaktif, PULANG dan LEMBUR aktif', el('btnPribMasuk').disabled && !el('btnPribPulang').disabled && !el('btnPribLembur').disabled);
    el('btnPribMenuAdmin').click(); await tunggu(200);
    var m = Array.prototype.map.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim() + (b.disabled ? '[x]' : ''); });
    H.push('       menu: ' + m.join(' | '));
    ok('menu admin memuat 9 item mockup + Keluarkan semua + Log out', m.length >= 11 && /Konfirmasi/.test(m[0]) && /Absen manual.*\[x\]/.test(m[1]) && /Karyawan$/.test(m[5]) && /Dashboard bulanan.*\[x\]/.test(m[7]));
    el('btnPribLembur').click(); await tunggu(100);
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
