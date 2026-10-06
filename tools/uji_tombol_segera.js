// Pemeriksaan: SEMUA tombol/menu yang mengarah ke fitur/layar yang belum dibangun harus NONAKTIF ("Segera").
// Memeriksa seluruh markup statis per kelompok layar (HP Toko, HP Pribadi, Admin, Owner). Menu HP pribadi (dinamis) diperiksa di uji_alur_pribadi.js dan uji_alur_admin.js.
// Pakai: ID="" tools/potret.sh app "" hasil.png tools/uji_tombol_segera.js
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
var BELUM = /(Izin\s*\/\s*Cuti|Izin\/Cuti|Tukar shift|Report|Absen manual|Data absensi|Jadwal shift|Input izin|Kalender libur|Dashboard bulanan|Log admin|Kunci periode|Role\s*&\s*admin|Pengaturan|Cabang\s*&\s*shift|Laporan bulanan|Ganti PIN|Lupa absen|Daftar wajah|Pola shift|Ubah data|Kirim akun via WA|Uji coba|Saya setuju|Foto ulang|Perlu evaluasi|Hari ini tidak masuk)/i;
var KELOMPOK = {
  'HP Toko': ['layarUtama', 'layarPilihNama', 'layarAlasan'],
  'HP Pribadi': ['layarPribadi', 'layarLuar', 'layarAkun', 'layarRiwayat', 'menuPribadi'],
  'Admin cabang': ['layarAdmin', 'menuAdmin', 'layarKaryawan', 'layarTambahKaryawan', 'layarPinBaru', 'layarSelesaiKaryawan', 'layarKonfirmasi', 'layarBelumAbsen'],
  'Owner': ['layarOwner', 'menuOwner', 'layarKelolaHp', 'layarPerhatian']
};
Object.keys(KELOMPOK).forEach(function (k) {
  var segera = 0, mati = 0, salah = [];
  KELOMPOK[k].forEach(function (id) {
    var root = document.getElementById(id);
    if (!root) { salah.push('(layar ' + id + ' tidak ada)'); return; }
    root.querySelectorAll('button, a, [role="button"]').forEach(function (b) {
      var teks = (b.textContent || '').replace(/\s+/g, ' ').trim();
      var punyaSegera = !!b.querySelector('.segera') || /Segera/.test(teks);
      var nonaktif = b.disabled === true || b.getAttribute('aria-disabled') === 'true';
      if (punyaSegera) { segera++; if (nonaktif) { mati++; } else { salah.push('"Segera" tetapi AKTIF: ' + teks); } }
      else if (BELUM.test(teks) && !nonaktif && !/^Konfirmasi/.test(teks) && !b.hasAttribute('data-lb-ke')) { salah.push('menuju fitur belum ada tetapi AKTIF: ' + teks); }
    });
  });
  ok(k + ': ' + segera + ' tombol/menu "Segera", ' + mati + ' nonaktif; tidak ada tombol aktif menuju layar yang belum dibangun' + (salah.length ? ' -> ' + salah.join(' | ') : ''), salah.length === 0 && segera === mati);
});
// Layar yang belum dibangun memang tidak ada di markup (tidak ada layar kosong/contoh yang bisa dibuka)
var TIDAK_ADA = ['layarReport', 'layarIzin', 'layarTukarShift', 'layarGantiPassword', 'layarLogOwner', 'layarPengaturan', 'layarKunciPeriode', 'layarRoleAdmin', 'layarLaporanBulanan', 'layarAbsenManual', 'layarJadwalShift', 'layarDataAbsensi'];
ok('layar yang belum dibangun tidak ada di markup (tidak ada layar kosong/data contoh): ' + TIDAK_ADA.length + ' nama layar diperiksa', TIDAK_ADA.every(function (id) { return !document.getElementById(id); }));
var semuaLayar = Array.prototype.map.call(document.querySelectorAll('.layar'), function (l) { return l.id; });
ok('daftar layar yang ada (' + semuaLayar.length + ') semuanya layar yang sudah dibangun fungsinya: ' + semuaLayar.join(', '), semuaLayar.length > 15);
// ---- Layar baru (tampilan saja): lb02..lb82 ----
var LB = { 'HP Toko': ['02', '03', '04', '05', '06', '07', '08', '13', '18', '19'], 'HP Pribadi': ['23', '34', '36', '39', '40', '41', '42', '43', '45'],
  'Admin cabang': ['22', '53', '54', '55', '56', '57', '59', '62', '64', '65', '66', '67', '68', '69', '70'], 'Owner': ['24', '25', '73', '74', '75', '76', '77', '81', '82'] };
var semuaLb = [].concat.apply([], Object.keys(LB).map(function (k) { return LB[k]; }));
Object.keys(LB).forEach(function (k) {
  var fungsi = 0, mati = 0, salah = [], kosong = [];
  LB[k].forEach(function (n) {
    var blok = document.getElementById('lb' + n);
    if (!blok) { salah.push('lb' + n + ' tidak ada'); return; }
    if (!(blok.textContent || '').trim()) { kosong.push('lb' + n); }
    blok.querySelectorAll('button, a, [role="button"]').forEach(function (b) {
      var teks = (b.textContent || '').replace(/\s+/g, ' ').trim();
      var nonaktif = b.disabled === true || b.getAttribute('aria-disabled') === 'true';
      var fn = b.hasAttribute('data-lb-ke') || b.hasAttribute('data-lb-kembali') || b.hasAttribute('data-lb-aksi');
      if (nonaktif) { mati++; if (fn) { salah.push('lb' + n + ' nonaktif tetapi punya navigasi: ' + teks); } }
      else if (fn) { fungsi++; }
      else { salah.push('lb' + n + ' AKTIF tanpa fungsi navigasi: ' + teks); }
    });
  });
  ok('Layar baru ' + k + ': ' + LB[k].length + ' layar, ' + mati + ' tombol aksi nonaktif, ' + fungsi + ' tombol navigasi (Kembali/Home/Tutup/Batal/tab/detail); tidak ada tombol aktif tanpa fungsi' + (salah.length ? ' -> ' + salah.slice(0, 5).join(' | ') : ''), salah.length === 0 && kosong.length === 0);
});
// tujuan navigasi ada dan tidak kosong; jalur dari layar lain
var ENTRI = {}; var tujuanTerhubung = {};
document.querySelectorAll('[data-lb-ke]').forEach(function (b) {
  var tujuan = b.getAttribute('data-lb-ke'), induk = b.closest('.layar') || b.closest('.menu-lapis') || b.closest('#dialog');
  var dariLb = induk && /^lb\d+$/.test(induk.id) ? induk.id : '';
  (tujuanTerhubung[dariLb] = tujuanTerhubung[dariLb] || []).push(tujuan);
});
var DINAMIS = ['lb54', 'lb64', 'lb55', 'lb66', 'lb67', 'lb68', 'lb59']; // menu HP pribadi (dibuat lewat JS) dan sheet karyawan
var alur = ['lb03', 'lb08'];                                         // alur wajah HP toko (lewat JS: tombol absen -> 03 -> 08)
var terjangkau = {}; var antre = [].concat(tujuanTerhubung[''] || [], DINAMIS, alur);
while (antre.length) { var x = antre.pop(); if (terjangkau[x]) { continue; } terjangkau[x] = true; (tujuanTerhubung[x] || []).forEach(function (y) { antre.push(y); }); }
var semuaTujuan = Object.keys(terjangkau);
ok('semua tujuan navigasi (' + semuaTujuan.length + ' layar) ada di markup dan tidak kosong', semuaTujuan.every(function (id) { var e = document.getElementById(id); return !!e && (e.textContent || '').trim().length > 0; }));
var KEJADIAN = ['04', '05', '06', '07', '13', '18', '19', '22', '23', '34', '43', '53', '56', '62', '65', '70'];
var bisaDicapai = KEJADIAN.filter(function (n) { return terjangkau['lb' + n]; });
ok('layar yang muncul karena KEJADIAN (' + KEJADIAN.join(', ') + ') TIDAK bisa dicapai dari navigasi mana pun' + (bisaDicapai.length ? ' -> terjangkau: ' + bisaDicapai.join(',') : ''), bisaDicapai.length === 0);
var tidakTerjangkau = semuaLb.filter(function (n) { return !terjangkau['lb' + n]; });
ok('layar baru yang tidak punya jalur sama sekali: ' + tidakTerjangkau.join(', ') + ' (harus persis daftar kejadian + 25/65/70... lihat docs/daftar-layar.md)', KEJADIAN.every(function (n) { return tidakTerjangkau.indexOf(n) >= 0; }));
