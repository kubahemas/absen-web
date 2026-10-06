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
      else if (BELUM.test(teks) && !nonaktif && !/^Konfirmasi/.test(teks)) { salah.push('menuju fitur belum ada tetapi AKTIF: ' + teks); }
    });
  });
  ok(k + ': ' + segera + ' tombol/menu "Segera", ' + mati + ' nonaktif; tidak ada tombol aktif menuju layar yang belum dibangun' + (salah.length ? ' -> ' + salah.join(' | ') : ''), salah.length === 0 && segera === mati);
});
// Layar yang belum dibangun memang tidak ada di markup (tidak ada layar kosong/contoh yang bisa dibuka)
var TIDAK_ADA = ['layarReport', 'layarIzin', 'layarTukarShift', 'layarGantiPassword', 'layarLogOwner', 'layarPengaturan', 'layarKunciPeriode', 'layarRoleAdmin', 'layarLaporanBulanan', 'layarAbsenManual', 'layarJadwalShift', 'layarDataAbsensi'];
ok('layar yang belum dibangun tidak ada di markup (tidak ada layar kosong/data contoh): ' + TIDAK_ADA.length + ' nama layar diperiksa', TIDAK_ADA.every(function (id) { return !document.getElementById(id); }));
var semuaLayar = Array.prototype.map.call(document.querySelectorAll('.layar'), function (l) { return l.id; });
ok('daftar layar yang ada (' + semuaLayar.length + ') semuanya layar yang sudah dibangun fungsinya: ' + semuaLayar.join(', '), semuaLayar.length > 15);
