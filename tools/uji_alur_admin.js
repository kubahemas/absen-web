// Skrip uji server TIRUAN: login admin HP pribadi (kata sandi), Menu admin, menu pojok, tombol LEMBUR setelah absen masuk.
window.__hasil = [];
var laluLembur = false;
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
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: true, sudah_pulang: false, jam_masuk: '07:40', jam_pulang: '', cara_masuk: 'LUAR', st_pulang: '', lembur_boleh: laluLembur }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 5, jumlah_teks: '5' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    
    ok('satu kolom Password, tanpa keypad PIN dan tanpa tautan admin', !!el('pribRahasia') && !el('lpKeypad') && !el('btnModeLogin'));
    el('pribNama').value = 'Dewi Lestari'; el('pribRahasia').value = 'rahasia12';
    el('btnMasukPribadi').click(); await tunggu(600);
    var lg = panggilan.filter(function (x) { return x.aksi === 'login_pribadi'; })[0];
    ok('login admin mengirim kata sandi', !!lg && lg.rahasia === 'rahasia12' && lg.nama === 'Dewi Lestari');
    ok('beranda terbuka', aktif() === 'layarPribadi');
    ok('varian admin: kartu Menu admin tampil dengan angka 5', el('btnPribMenuAdmin').style.display !== 'none' && el('pribMenuAdminJumlah').textContent === '5' && el('pbIsi').classList.contains('admin'));
    ok('sudah masuk tapi belum waktunya lembur (lembur_boleh=false dari server): MASUK nonaktif, PULANG aktif, LEMBUR nonaktif', el('btnPribMasuk').disabled && !el('btnPribPulang').disabled && el('btnPribLembur').disabled);
    laluLembur = true; el('btnPribPulang').click(); await tunggu(300); el('btnKembaliLuarPulang').click(); await tunggu(500);
    ok('setelah jam lembur (lembur_boleh=true dari server): LEMBUR aktif', !el('btnPribLembur').disabled);
    el('btnMenuPribadi').click(); await tunggu(200);
    var m = Array.prototype.map.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim() + (b.disabled ? '[x]' : ''); });
    H.push('       menu: ' + m.join(' | '));
    ok('menu ikon akun memuat Akun saya + item admin (Absen manual dan Dashboard bulanan kini AKTIF, menuju layar baru) + Keluarkan semua + Log out', m.length >= 12 && /Akun saya/.test(m[0]) && /Konfirmasi/.test(m[1]) && /^Absen manual$/.test(m[2]) && /Karyawan$/.test(m[6]) && /^Dashboard bulanan$/.test(m[8]));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
