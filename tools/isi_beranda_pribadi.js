// Pengisi potret: server tiruan + login HP pribadi, lalu beranda terbuka. Peran dari window.__peran (bawaan KARYAWAN; "ADMIN" untuk admin).
// Pakai: tools/potret.sh app "" hasil.png tools/isi_beranda_pribadi.js   (untuk admin, tambahkan baris "window.__peran='ADMIN';" di depan salinan)
var P = window.__peran || 'KARYAWAN';
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: P, cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = window.__HARI || { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false }; }
  if (b.aksi === 'absen_luar_masuk') { d = { status: 'ok', st_masuk: 'HADIR', jam: '07:40', shift: 'Shift 1' }; }
  if (b.aksi === 'tiket_waktu') { d = { status: 'ok', tiket: 'T' }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 5, jumlah_teks: '5' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
navigator.geolocation.watchPosition = function (s) { setTimeout(function () { s({ coords: { latitude: -7.4, longitude: 111.4, accuracy: 12 } }); }, 50); return 1; };
document.getElementById('btnJenisPribadi').click();
document.getElementById('pribNama').value = 'Budi Santoso';
document.getElementById('pribRahasia').value = '12345';
document.getElementById('btnMasukPribadi').click();
