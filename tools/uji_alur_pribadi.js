// Skrip uji (dijalankan lewat tools/potret.sh dengan server TIRUAN): login HP pribadi (keypad), beranda, absen luar dengan pilihan keperluan.
// Pakai: ID="" tools/potret.sh app "" hasil.png tools/uji_alur_pribadi.js   (pita hijau di atas gambar = hasil)
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var peran = 'KARYAWAN', percobaan = 0;
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: peran, cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false }; }
  if (b.aksi === 'tiket_waktu') { d = { status: 'ok', tiket: 'TIKET' }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 5, jumlah_teks: '5' }; }
  if (b.aksi === 'absen_luar_masuk') { d = (++percobaan === 1) ? { status: 'gagal', pesan: 'Semua aksi lain wajib menyertakan token HP toko yang terdaftar' } : { status: 'ok', st_masuk: 'HADIR', jam: '08:00', shift: 'Shift 1' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
navigator.geolocation.watchPosition = function (s) { setTimeout(function () { s({ coords: { latitude: -7.4, longitude: 111.4, accuracy: 10 } }); }, 50); return 1; };
navigator.geolocation.clearWatch = function () {};
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    ok('layar login HP pribadi terbuka', aktif() === 'layarLoginPribadi');
    ok('satu kolom Password, tanpa keypad PIN dan tanpa tautan admin', !!el('pribRahasia') && !el('lpKeypad') && !el('btnModeLogin'));
    el('pribNama').value = 'Budi Santoso';
    el('pribRahasia').value = '12345'; el('btnMasukPribadi').click();
    await tunggu(500);
    var lg = panggilan.filter(function (x) { return x.aksi === 'login_pribadi'; })[0];
    ok('tombol Login mengirim (rahasia = PIN 5 angka)', !!lg && lg.rahasia === '12345' && lg.nama === 'Budi Santoso');
    ok('masuk ke beranda HP pribadi', aktif() === 'layarPribadi');
    ok('nama TANPA "Halo,": tepat "Budi Santoso"', el('pribSapa').textContent === 'Budi Santoso' && !/Halo/.test(el('pbIsi').textContent));
    var rNama = el('pribSapa').getBoundingClientRect(), rSeg = el('btnSegarkanPribadi').getBoundingClientRect(), rAkun = el('btnMenuPribadi').getBoundingClientRect(), rLogo = document.querySelector('#pbIsi .pb-atas img').getBoundingClientRect();
    var cssNama = getComputedStyle(el('pribSapa')), cssCab = getComputedStyle(document.getElementById('namaCabang'));
    ok('nama BESAR seperti mockup 30 (Oswald 30px tebal 700), garis hitam tegak di kirinya', cssNama.fontSize === '30px' && cssNama.fontWeight === '700' && /Oswald/.test(cssNama.fontFamily) && !!document.querySelector('#pbIsi .info-cabang .garis'));
    ok('ikon segarkan di BAWAH ikon akun (bukan di baris atas), rata kanan sejajar ikon akun, sejajar vertikal dengan baris nama', rSeg.top >= rAkun.bottom - 1 && Math.abs(rSeg.right - rAkun.right) <= 12 && rSeg.top > rLogo.bottom - 1 && rSeg.top < rNama.bottom && rSeg.bottom > rNama.top);
    ok('ikon segarkan TIDAK lagi ada di grup tombol baris atas', !document.querySelector('#pbIsi .pb-kanan #btnSegarkanPribadi'));
    ok('tidak ada tombol Riwayat absen', !el('btnPribRiwayat'));
    ok('tiga kotak Izin/Cuti, Tukar shift, Report ada dan AKTIF (membuka layar baru, tanpa tulisan "Segera")', ['btnPribIzin', 'btnPribTukar', 'btnPribReport'].every(function (i) { return !el(i).disabled && !/Segera/.test(el(i).textContent); }));
    ok("lencana performa tampil NONAKTIF (Segera, tanpa label palsu)", el("pribLabel").style.display !== "none" && el("pribLabel").classList.contains("belum-aktif") && el("pribLabelTeks").textContent === "Segera");
    ok("kartu 'Pengajuan menunggu ACC' tampil nonaktif (Segera, tanpa angka)", /Pengajuan menunggu ACC/.test(el("pbIsi").textContent) && /Segera/.test(document.querySelector(".pb-strip").textContent) && !/d/.test(document.querySelector(".pb-strip").textContent));
    ok('Menu admin tidak tampil untuk karyawan', el('btnPribMenuAdmin').style.display === 'none');
    ok('teks "Hanya untuk absen tugas di luar toko" di bawah tombol absen', /Hanya untuk absen tugas di luar toko/.test(el('btnPribPulang').parentNode.textContent));
    ok('ABSEN MASUK aktif; PULANG dan LEMBUR nonaktif (belum masuk)', !el('btnPribMasuk').disabled && el('btnPribPulang').disabled && el('btnPribLembur').disabled);
    el('btnPribMasuk').click(); await tunggu(400);
    ok('absen luar terbuka', aktif() === 'layarLuar');
    ok('Absen luar tidak memanggil server untuk memuat pilihan (tidak ada pribadi_keperluan_luar)', !panggilan.some(function (x) { return x.aksi === 'pribadi_keperluan_luar'; }));
    ok('tidak ada chip keperluan; satu kolom "Keterangan" (textarea)', !el('luarChips') && !el('luarKeperluan') && el('luarKet').tagName === 'TEXTAREA' && /Keterangan/.test(document.querySelector('label[for="luarKet"]').textContent));
    el('btnKirimMasuk').click(); await tunggu(100);
    ok('keterangan kosong ditolak di HP (minimal 5 karakter)', /minimal 5 karakter/.test(el('pesanLuar').textContent));
    el('luarKet').value = '  abcd  '; el('btnKirimMasuk').click(); await tunggu(100);
    ok('keterangan 4 huruf (spasi dipotong) ditolak di HP', /minimal 5 karakter/.test(el('pesanLuar').textContent) && !panggilan.some(function (x) { return x.aksi === 'absen_luar_masuk'; }));
    el('luarKet').value = 'Pasang AC rumah Bu Sri';
    el('btnKirimMasuk').click(); await tunggu(700);
    var am1 = panggilan.filter(function (x) { return x.aksi === 'absen_luar_masuk'; })[0];
    ok('terkirim memakai field keterangan (bukan tujuan/keperluan), tiket, GPS', !!am1 && am1.keterangan === 'Pasang AC rumah Bu Sri' && am1.tiket === 'TIKET' && am1.gps && am1.gps.akurasi === 10 && am1.keperluan === undefined && am1.tujuan === undefined);
    ok('balasan teknis server TIDAK tampil mentah: diganti pesan Indonesia yang jelas', /Absen luar belum bisa dikirim/.test(el('popup').textContent) && !/token HP toko/.test(el('popup').textContent) && !/token HP toko/.test(document.body.innerText));
    ok('tidak ada tombol PULANG + LEMBUR di layar absen luar', !el('btnKirimLembur'));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
