// Skrip uji (dijalankan lewat tools/potret.sh dengan server TIRUAN): login HP pribadi (keypad), beranda, absen luar dengan pilihan keperluan.
// Pakai: ID="" tools/potret.sh app "" hasil.png tools/uji_alur_pribadi.js   (pita hijau di atas gambar = hasil)
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var peran = 'KARYAWAN';
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: peran, cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '' }; }
  if (b.aksi === 'pribadi_keperluan_luar') { d = { status: 'ok', daftar: ['Survey', 'Pengiriman', 'Lainnya'] }; }
  if (b.aksi === 'tiket_waktu') { d = { status: 'ok', tiket: 'TIKET' }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 5, jumlah_teks: '5' }; }
  if (b.aksi === 'absen_luar_masuk') { d = { status: 'ok', st_masuk: 'HADIR', jam: '08:00', shift: 'Shift 1' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
navigator.geolocation.watchPosition = function (s) { setTimeout(function () { s({ coords: { latitude: -7.4, longitude: 111.4, accuracy: 10 } }); }, 50); return 1; };
navigator.geolocation.clearWatch = function () {};
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    ok('layar login HP pribadi terbuka', aktif() === 'layarLoginPribadi');
    ok('keypad PIN tampil, kolom kata sandi tersembunyi', el('bagianPinLogin').style.display !== 'none' && el('bagianSandiLogin').style.display === 'none');
    el('pribNama').value = 'Budi Santoso';
    '12345'.split('').forEach(function (d) { document.querySelector('#lpKeypad button[data-d="' + d + '"]').click(); });
    await tunggu(500);
    var lg = panggilan.filter(function (x) { return x.aksi === 'login_pribadi'; })[0];
    ok('angka kelima langsung mengirim login (rahasia = PIN 5 angka)', !!lg && lg.rahasia === '12345' && lg.nama === 'Budi Santoso');
    ok('masuk ke beranda HP pribadi', aktif() === 'layarPribadi');
    ok('sapaan memakai nama lengkap', el('pribSapa').textContent === 'Halo, Budi Santoso');
    ok('tidak ada tombol Riwayat absen', !el('btnPribRiwayat'));
    ok('tiga kotak Izin/Cuti, Tukar shift, Report ada dan nonaktif "Segera"', ['btnPribIzin', 'btnPribTukar', 'btnPribReport'].every(function (i) { return el(i).disabled && /Segera/.test(el(i).textContent); }));
    ok('lencana performa tersembunyi', el('pribLabel').style.display === 'none');
    ok('Menu admin tidak tampil untuk karyawan', el('btnPribMenuAdmin').style.display === 'none');
    ok('ABSEN MASUK aktif; PULANG dan LEMBUR nonaktif (belum masuk)', !el('btnPribMasuk').disabled && el('btnPribPulang').disabled && el('btnPribLembur').disabled);
    el('btnPribMasuk').click(); await tunggu(400);
    ok('absen luar terbuka', aktif() === 'layarLuar');
    var chips = el('luarChips').querySelectorAll('button');
    ok('pilihan keperluan dari server tampil (3 chip)', chips.length === 3 && chips[0].textContent === 'Survey');
    ok('hanya satu kolom ketik (tujuan); kolom keperluan teks bebas hilang', !el('luarKeperluan') && el('luarTujuan').tagName === 'TEXTAREA');
    el('btnKirimMasuk').click(); await tunggu(100);
    ok('tanpa memilih keperluan: ditolak di layar', /Pilih keperluan/.test(el('pesanLuar').textContent));
    chips[0].click(); el('btnKirimMasuk').click(); await tunggu(100);
    ok('memilih keperluan tapi tujuan kosong: ditolak', /keterangan tujuan/i.test(el('pesanLuar').textContent));
    el('luarTujuan').value = 'Pasang AC rumah Bu Sri';
    el('btnKirimMasuk').click(); await tunggu(600);
    var am = panggilan.filter(function (x) { return x.aksi === 'absen_luar_masuk'; })[0];
    ok('absen_luar_masuk terkirim dengan keperluan Survey, tujuan, tiket, GPS', !!am && am.keperluan === 'Survey' && am.tujuan === 'Pasang AC rumah Bu Sri' && am.tiket === 'TIKET' && am.gps && am.gps.akurasi === 10);
    ok('pop-up hasil tampil (alur lama tetap jalan)', el('popup').classList.contains('tampil'));
    ok('tidak ada tombol PULANG + LEMBUR di layar absen luar', !el('btnKirimLembur'));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
