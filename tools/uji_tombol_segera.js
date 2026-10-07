// Pemeriksaan: SEMUA tombol/menu yang mengarah ke fitur/layar yang belum dibangun harus NONAKTIF ("Segera").
// Memeriksa seluruh markup statis per kelompok layar (HP Toko, HP Pribadi, Admin, Owner). Menu HP pribadi (dinamis) diperiksa di uji_alur_pribadi.js dan uji_alur_admin.js.
// Pakai: ID="" tools/potret.sh app "" hasil.png tools/uji_tombol_segera.js
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
var BELUM = /(Izin\s*\/\s*Cuti|Izin\/Cuti|Tukar shift|Absen manual|Data absensi|Jadwal shift|Input izin|Kalender libur|Dashboard bulanan|Log admin|Kunci periode|Role\s*&\s*admin|Pengaturan|Cabang\s*&\s*shift|Laporan bulanan|Ganti PIN|Lupa absen|Daftar wajah|Pola shift|Ubah data|Kirim akun via WA|Uji coba|Saya setuju|Foto ulang|Perlu evaluasi|Hari ini tidak masuk)/i;
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
var LB = { 'HP Toko': ['02', '03', '04', '05', '06', '07', '08', '13', '18', '19'], 'HP Pribadi': ['23', '34', '35', '36', '36e', '37', '38', '39', '40', '41', '42', '43', '45', '48'],
  'Admin cabang': ['22', '53', '54', '55', '56', '57', '62', '64', '65', '66', '67', '68', '69', '70'], 'Owner': ['24', '25', '73', '74', '75', '76', '77', '81', '82'] };
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
var DINAMIS = ['lb54', 'lb64', 'lb55', 'lb66', 'lb67', 'lb68', 'lb57', 'lb35']; // menu HP pribadi (dibuat lewat JS) dan sheet karyawan
var alur = ['lb03', 'lb08'];                                         // alur wajah HP toko (lewat JS: tombol absen -> 03 -> 08)
var terjangkau = {}; var antre = [].concat(tujuanTerhubung[''] || [], DINAMIS, alur);
while (antre.length) { var x = antre.pop(); if (terjangkau[x]) { continue; } terjangkau[x] = true; (tujuanTerhubung[x] || []).forEach(function (y) { antre.push(y); }); }
var semuaTujuan = Object.keys(terjangkau);
ok('semua tujuan navigasi (' + semuaTujuan.length + ' layar) ada di markup dan tidak kosong', semuaTujuan.every(function (id) { var e = document.getElementById(id); return !!e && (e.textContent || '').trim().length > 0; }));
var KEJADIAN = ['36e', '37', '38', '48', '04', '05', '06', '07', '13', '18', '19', '22', '23', '34', '43', '53', '56', '62', '65', '70'];
var bisaDicapai = KEJADIAN.filter(function (n) { return terjangkau['lb' + n]; });
ok('layar yang muncul karena KEJADIAN (' + KEJADIAN.join(', ') + ') TIDAK bisa dicapai dari navigasi mana pun' + (bisaDicapai.length ? ' -> terjangkau: ' + bisaDicapai.join(',') : ''), bisaDicapai.length === 0);
var tidakTerjangkau = semuaLb.filter(function (n) { return !terjangkau['lb' + n]; });
ok('layar baru yang tidak punya jalur sama sekali: ' + tidakTerjangkau.join(', ') + ' (harus persis daftar kejadian + 25/65/70... lihat docs/daftar-layar.md)', KEJADIAN.every(function (n) { return tidakTerjangkau.indexOf(n) >= 0; }));
// ---- Keputusan pemilik 2026-10-07 ----
function tk(id) { var e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
var l34 = document.getElementById('lb34');
var titik34 = l34 ? Array.prototype.filter.call(l34.querySelectorAll('div'), function (d) { return /width: 16px; height: 16px; border-radius: 50%/.test(d.getAttribute('style') || ''); }).length : 0;
ok('layar 34: PIN 5 titik (bukan 4), tanpa chip Keperluan, satu kolom Keterangan seperti absen luar (wajib minimal 5 karakter, maksimal 100)', titik34 === 5 && !/Keperluan/.test(tk('lb34')) && /Keterangan tujuan \(nama klien atau alamat\), wajib minimal 5 karakter/.test(tk('lb34')) && l34.querySelectorAll('textarea').length === 1 && l34.querySelector('textarea').getAttribute('maxlength') === '100');
function tkTanpaKeypad(id) { var c = document.getElementById(id).cloneNode(true); Array.prototype.forEach.call(c.querySelectorAll('button'), function (b) { if (/^[0-9]$/.test(b.textContent.trim())) { b.remove(); } }); return c.textContent.replace(/[ \n\t]+/g, ' ').trim(); }
var sisaLama = semuaLb.map(function (n) { var m = tkTanpaKeypad('lb' + n).match(/4 digit|4 angka|123456|1234|[Pp]assword awal|PIN awal|\(awal:/); return m ? 'lb' + n + ': ' + m[0] : ''; }).filter(Boolean);
ok('sisa mockup lama tidak ada di SEMUA layar baru ("4 digit", "4 angka", "123456", "1234", "password awal", "PIN awal", "(awal:")' + (sisaLama.length ? ' -> ' + sisaLama.join(' | ') : ''), sisaLama.length === 0 && /Password lama(?! \()/.test(tk('lb45')));
ok('layar 59 DIHAPUS dari app (markup, id, jalur); Pola shift (sheet karyawan, jalur dinamis) membuka 57', !document.getElementById('lb59') && !document.querySelector('[data-lb-ke="lb59"]') && !!document.getElementById('lb57') && !!terjangkau['lb57']);
var tren = ['lb68', 'lb81', 'lb36', 'lb36e', 'lb37', 'lb38', 'lb70'].map(function (id) {
  var e = document.getElementById(id); if (!e) { return id + ' tidak ada'; }
  var s = tk(id), kosong = Array.prototype.filter.call(e.querySelectorAll('div, span'), function (d) { return d.children.length === 0 && d.textContent.trim() === String.fromCharCode(8211); }).length;
  var minimal = (id === 'lb68' || id === 'lb81') ? 6 : 2;
  return (new RegExp('[' + String.fromCharCode(9650, 9660) + ']|naik|turun|sama dengan|membaik|memburuk|Minggu ke|Paling banyak').test(s) || kosong < minimal) ? id + ' (kalimat tren: simbol/kata tersisa atau "-" kurang dari ' + minimal + ', ada ' + kosong + ')' : '';
}).filter(Boolean);
ok('kalimat tren (68, 81, Report 36/36e/37/38, 70) tampil sebagai "-" tanpa panah segitiga, tanpa kata naik/turun dan tanpa angka' + (tren.length ? ' -> ' + tren.join(' | ') : ''), tren.length === 0);
var l36 = document.getElementById('lb36'), s36 = tk('lb36');
ok('Report yang bisa dibuka (36): lencana netral nonaktif "Segera", TANPA tulisan/warna EXCELLENT, GOOD, BAD', !/EXCELLENT|GOOD|BAD/.test(s36) && /Segera/.test(s36) && Array.prototype.some.call(l36.querySelectorAll('*'), function (e) { return e.classList.contains('belum-aktif') && e.textContent.trim() === 'Segera'; }));
ok('Report berwarna penuh ada (36e EXCELLENT, 37 GOOD, 38 BAD) dan hanya dibuka lewat tombol Report menurut label, bukan tautan statis', /EXCELLENT/.test(tk('lb36e')) && /GOOD/.test(tk('lb37')) && /BAD/.test(tk('lb38')) && ['lb36e', 'lb37', 'lb38', 'lb48'].every(function (id) { return !!document.getElementById(id) && !terjangkau[id]; }));

// ---- Keputusan pemilik 2026-10-07 (selisih 11-17) ----
var STRIP = String.fromCharCode(8211);
function warnaRgb(e) { var m = /rgb\((\d+), (\d+), (\d+)/.exec(getComputedStyle(e).color) || [0, 0, 0, 0]; return [Number(m[1]), Number(m[2]), Number(m[3])]; }
function berwarna(e) { var c = warnaRgb(e); return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) > 25; }
// elemen daun "–" harus dihitung saat layar tampil (warna komputasi) -> tampilkan sementara tiap layar
function stripBerwarna(id) {
  var e = document.getElementById(id), salah = 0, abu = 0, tampak = !e.classList.contains('aktif');
  if (tampak) { e.classList.add('aktif'); }
  Array.prototype.forEach.call(e.querySelectorAll('div, span'), function (d) {
    if (d.children.length === 0 && d.textContent.trim() === STRIP) { if (berwarna(d)) { salah++; } else if (warnaRgb(d).join() === '90,91,94') { abu++; } }
  });
  if (tampak) { e.classList.remove('aktif'); }
  return { salah: salah, abu: abu };
}
var warna = ['lb68', 'lb81', 'lb36', 'lb36e', 'lb37', 'lb38', 'lb70', 'lb82'].map(function (id) {
  var r = stripBerwarna(id), minimal = (id === 'lb68' || id === 'lb81') ? 6 : (id === 'lb82' ? 0 : 2);
  return (r.salah > 0 || r.abu < minimal) ? id + ' (berwarna hijau/merah: ' + r.salah + ', abu netral: ' + r.abu + ', minimal ' + minimal + ')' : '';
}).filter(Boolean);
ok('teks tren "' + STRIP + '" berwarna ABU NETRAL (bukan hijau/merah) di 68, 81, 36, 36e, 37, 38, 70, 82' + (warna.length ? ' -> ' + warna.join(' | ') : ''), warna.length === 0);
var telat = ['lb37', 'lb38', 'lb70'].map(function (id) {
  var e = document.getElementById(id);
  var ada = Array.prototype.some.call(e.querySelectorAll('div'), function (d) { return d.children.length === 0 && d.textContent.trim() === STRIP && d.classList.contains('belum-aktif'); });
  return (!ada || /Telat \S+ kali|Tanpa pelanggaran untuk|batas|daftar evaluasi/.test(tk(id))) ? id : '';
}).filter(Boolean);
ok('kalimat "Telat N kali. Tanpa pelanggaran untuk ..." kembali sebagai "' + STRIP + '" pudar (tanpa angka, tanpa nama label, tanpa panah) di 37, 38, 70' + (telat.length ? ' -> ' + telat.join(',') : ''), telat.length === 0);
ok('layar 48 tanpa "Halo,": nama besar Oswald 30 px berisi "' + STRIP + '"', !/Halo/.test(tk('lb48')) && (function () {
  var e = document.getElementById('lb48'), a = !e.classList.contains('aktif'); if (a) { e.classList.add('aktif'); }
  var n = Array.prototype.filter.call(e.querySelectorAll('div'), function (d) { return d.children.length === 0 && d.textContent.trim() === STRIP && parseFloat(getComputedStyle(d).fontSize) === 30; });
  if (a) { e.classList.remove('aktif'); }
  return n.length === 1 && /Oswald/.test(getComputedStyle(n[0]).fontFamily);
})());
ok('layar 45: tanpa "6 angka" dan "123456"; aturan diisi saat dibuka menurut peran (3 baris data-aturan)', !/6 angka|123456/.test(tk('lb45')) && document.querySelectorAll('#lb45 [data-aturan]').length === 3);
ok('layar 35 DIPAKAI sebagai pop-up absen luar (tidak lagi layar kejadian): dapat dicapai lewat alur absen luar, tanpa angka contoh', !!terjangkau['lb35'] && KEJADIAN.indexOf('35') < 0 && !/\d/.test(tk('lb35').replace(/dalam . detik/, '')));
ok('layar 75: daftar "Keperluan absen luar" tetap tampil nonaktif', /Keperluan absen luar/.test(tk('lb75')) && Array.prototype.some.call(document.querySelectorAll('#lb75 button'), function (b) { return /Keperluan absen luar/.test(b.textContent) && b.disabled; }));
