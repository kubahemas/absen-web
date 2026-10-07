// Uji server TIRUAN: alur absen HP toko (pilih nama, PIN 5 angka, pop-up, absen dobel ditolak, pop-up 15/17 lalu layar alasan/lembur).
// Pakai: PRA="$(cat tools/pra_toko.js)" ID="" tools/potret.sh app "" hasil.png tools/uji_alur_hp_toko.js
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function hitung(aksi) { return window.__panggilan.filter(function (x) { return x.aksi === aksi; }).length; }
function terakhir(aksi) { var a = window.__panggilan.filter(function (x) { return x.aksi === aksi; }); return a[a.length - 1]; }
var kam = 0;
try { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: function () { kam++; return Promise.reject(new Error('uji')); } } }); } catch (e) { /* kamera tidak bisa ditiru: tes kamera dilewati */ }
// Alur wajah (tampilan): tombol -> 03 -> 08 -> MANUAL -> 09. Tiket waktu tetap diminta saat tombol ditekan; kamera tidak dibuka di 03/08.
async function tekan(id, rinci) {
  var tiket0 = hitung('tiket_waktu'), kam0 = kam, b = el(id); b.disabled = false; b.click(); await tunggu(250);
  if (rinci) {
    ok('setelah ' + id + ' ditekan tampil layar pindai wajah (03) "Pengenalan wajah \u00b7 Segera"', aktif() === 'lb03' && /Pengenalan wajah \u00b7 Segera/.test(el('lb03').textContent));
    ok('tiket waktu diminta SAAT TOMBOL DITEKAN (sebelum layar 08/09), jam resmi dari server', hitung('tiket_waktu') === tiket0 + 1);
    ok('layar 03 TIDAK membuka kamera', kam === kam0);
    await tunggu(1700);
    ok('otomatis pindah ke "Wajah tidak terbaca" (08) setelah sekitar 1,5 detik', aktif() === 'lb08' && /Wajah tidak terbaca/.test(el('lb08').textContent));
    var ulang = Array.prototype.filter.call(el('lb08').querySelectorAll('button'), function (x) { return /ULANGI/.test(x.textContent); })[0];
    ok('tombol ULANGI di 08 NONAKTIF "Segera"; MANUAL aktif', !!ulang && ulang.disabled && /Segera/.test(ulang.textContent) && !!el('lb08').querySelector('[data-lb-aksi="pilihnama"]'));
    ok('layar 08 TIDAK membuka kamera; tiket tidak diminta lagi', kam === kam0 && hitung('tiket_waktu') === tiket0 + 1);
    el('lb08').querySelector('[data-lb-aksi="pilihnama"]').click(); await tunggu(200);
    ok('MANUAL membuka layar pilih nama + PIN (09) TANPA meminta tiket baru (jam absen tetap saat tombol ditekan)', aktif() === 'layarPilihNama' && hitung('tiket_waktu') === tiket0 + 1);
    return;
  }
  await tunggu(1700);
  el('lb08').querySelector('[data-lb-aksi="pilihnama"]').click(); await tunggu(200);
}
async function isiPin(nama) {
  var s = el('selectNama'); s.value = nama; s.dispatchEvent(new Event('change')); await tunggu(150);
  ['1', '2', '3', '4', '5'].forEach(function (d) { document.querySelector('#keypad [data-digit="' + d + '"]').click(); });
  await tunggu(500);
}
(async function () {
  try {
    await tunggu(300);
    ok('tanggal layar utama format mockup "NamaHari, d NamaBulan yyyy" (bukan dd/MM/yy)', /^[A-Za-z]+, \d{1,2} [A-Za-z]+ \d{4}$/.test(el('tanggalHariIni').textContent) && !/\//.test(el('tanggalHariIni').textContent));
    var kt = document.querySelector('.kartu-tidak-masuk');
    ok('kartu "Hari ini tidak masuk" tampil NONAKTIF: tombol mati, pudar, "Segera", tanpa angka', !!kt && kt.disabled && kt.classList.contains('belum-aktif') && /Segera/.test(kt.textContent) && !/\d/.test(kt.textContent));

    // ---- masuk tepat waktu ----
    await tekan('btnMasuk', true);
    ok('ABSEN MASUK berakhir di layar pilih nama dengan judul "Absen Masuk PIN"', aktif() === 'layarPilihNama' && document.querySelector('.pilih-judul').textContent === 'Absen Masuk PIN');
    ok('minta tiket waktu ke server (jam resmi dari server, bukan jam HP)', hitung('tiket_waktu') >= 1);
    ok('PIN 5 titik; "Foto ulang" dan tautan jadwal nonaktif "Segera"', el('pinTitik').children.length === 5 && document.querySelectorAll('#layarPilihNama .belum-aktif').length >= 2);
    await isiPin('K002');
    var am = terakhir('absen_masuk');
    ok('angka kelima langsung mengirim: id K002, PIN 5 angka, memakai tiket', !!am && am.id === 'K002' && am.pin === '12345' && am.tiket === 'TIKET');
    ok('pop-up tepat waktu tampil "Selamat bekerja"; kotak "Bulan ini" nonaktif tanpa angka', /Selamat bekerja/.test(el('popup').textContent) && el('popup').querySelectorAll('.bulan-kotak.belum-aktif').length === 4);
    window.__TUKAR = 2;
    el('popup').click(); await tunggu(500);
    ok('pop-up ditutup, kembali ke layar utama', aktif() === 'layarUtama');
    var tp = terakhir('tukar_pengingat');
    ok('pengingat ajakan tukar shift sesudah absen berhasil: tukar_pengingat membawa token HP toko dan id karyawan; dialog menyebut 2 ajakan dan menyuruh membuka HP pribadi', !!tp && tp.id === 'K002' && tp.token === 'T'.repeat(40) && /Ajakan tukar shift/.test(el('dialog').textContent) && /2 ajakan/.test(el('dialog').textContent) && /HP pribadi/.test(el('dialog').textContent));
    el('dlgOk').click(); await tunggu(200); window.__TUKAR = 0;

    // ---- absen dobel ditolak (jawaban server) ----
    window.__absen = { status: 'gagal', pesan: 'Sudah absen masuk hari ini' };
    await tekan('btnMasuk'); await isiPin('K002');
    ok('absen dobel: pop-up "Tidak tersimpan" dengan pesan server, tanpa "Selamat bekerja"', /Tidak tersimpan/.test(el('popup').textContent) && /Sudah absen masuk hari ini/.test(el('popup').textContent) && !/Selamat bekerja/.test(el('popup').textContent));
    el('popup').click(); await tunggu(200);

    // ---- pulang awal: pop-up 15 lebih dulu, absen BELUM tersimpan sampai alasan dikirim ----
    window.__absen = { status: 'ok', st_pulang: 'PULANG CEPAT', acc: 'MENUNGGU', jam: '15:00', shift: 'Shift 1', panggilan: 'Budi', perlu_keterangan: true, jenis_keterangan: 'ALASAN_PULANG_AWAL', kode_pending: 'KP', pilihan: ['Sakit', 'Urusan keluarga', 'Disuruh atasan', 'Lainnya'], nama: 'Budi Santoso' };
    await tekan('btnPulang');
    ok('ABSEN PULANG: judul "Absen Pulang PIN"', document.querySelector('.pilih-judul').textContent === 'Absen Pulang PIN');
    await isiPin('K002');
    ok('pop-up 15 tampil lebih dulu: "Terima kasih", "Pulang awal 15:00 (Shift 1)", "Menunggu persetujuan admin", "ISI ALASAN PULANG AWAL"', /Terima kasih/.test(el('popup').textContent) && /Pulang awal 15:00 \(Shift 1\)/.test(el('popup').textContent) && /Menunggu persetujuan admin/.test(el('popup').textContent) && !!el('btnIsiAlasan') && /ISI ALASAN PULANG AWAL/.test(el('btnIsiAlasan').textContent));
    ok('pada tahap pop-up 15 BELUM ada penyimpanan (tidak ada simpan_pulang), layar alasan belum terbuka', hitung('simpan_pulang') === 0 && !el('layarAlasan').classList.contains('tampil'));
    el('btnIsiAlasan').click(); await tunggu(300);
    ok('tombol ISI ALASAN membuka layar alasan (16) dengan 4 pilihan', el('layarAlasan').classList.contains('tampil') && el('alasanGrid').querySelectorAll('button').length === 4 && /Kenapa pulang awal/.test(el('alasanJudul').textContent));
    el('alasanGrid').querySelectorAll('button')[0].click(); el('btnSimpanAlasan').click(); await tunggu(500);
    var sp = terakhir('simpan_pulang');
    ok('absen pulang awal baru tersimpan SETELAH alasan dikirim (simpan_pulang, kode KP, alasan Sakit)', hitung('simpan_pulang') === 1 && sp.kode_pending === 'KP' && sp.keterangan.pilihan === 'Sakit');
    el('popup').click(); await tunggu(200);
    ok('selesai: kembali ke layar utama', aktif() === 'layarUtama');

    // ---- lembur: pop-up 17 (menutup sendiri 4 detik) lalu layar pekerjaan lembur (20) ----
    window.__absen = { status: 'ok', st_pulang: 'LEMBUR DI TOKO', acc: 'MENUNGGU', jam: '18:35', shift: 'Shift 1', panggilan: 'Budi', perlu_keterangan: true, jenis_keterangan: 'PEKERJAAN_LEMBUR', kode_pending: 'KL', pilihan: ['Stok opname', 'Bongkar muat', 'Lainnya'], nama: 'Budi Santoso', tingkat: 2, durasi_menit: 125 };
    await tekan('btnLembur');
    ok('LEMBUR: judul "Lembur PIN"', document.querySelector('.pilih-judul').textContent === 'Lembur PIN');
    await isiPin('K002');
    ok('pop-up 17 tampil lebih dulu: "Lembur 18:35 (2 jam 5 menit)" (jam dan durasi dari server), "Menunggu persetujuan admin", "Menutup otomatis dalam 4 detik"', /Lembur 18:35 \(2 jam 5 menit\)/.test(el('popup').textContent) && /Menunggu persetujuan admin/.test(el('popup').textContent) && /Menutup otomatis dalam 4 detik/.test(el('popup').textContent));
    var n0 = hitung('simpan_pulang');
    ok('pada tahap pop-up 17 belum ada penyimpanan lembur', n0 === 1 && !el('layarAlasan').classList.contains('tampil'));
    await tunggu(4400);
    ok('setelah 4 detik pop-up menutup sendiri dan layar pekerjaan lembur (20) terbuka', el('layarAlasan').classList.contains('tampil') && /Pekerjaan apa/.test(el('alasanJudul').textContent) && el('alasanGrid').querySelectorAll('button').length === 3);
    el('alasanGrid').querySelectorAll('button')[0].click(); el('btnSimpanAlasan').click(); await tunggu(500);
    var sl = terakhir('simpan_pulang');
    ok('lembur baru tersimpan setelah pekerjaan dikirim (simpan_pulang kode KL, Stok opname)', hitung('simpan_pulang') === 2 && sl.kode_pending === 'KL' && sl.keterangan.pilihan === 'Stok opname');

    // ---- absen terlalu pagi ----
    el('popup').click(); await tunggu(200);
    window.__absen = { status: 'gagal', pesan: 'Absen masuk belum dibuka. Dibuka mulai 06:45.' };
    await tekan('btnMasuk'); await isiPin('K002');
    ok('absen terlalu pagi: pop-up "Absen masuk belum dibuka" dengan "Dibuka mulai 06:45"; baris sisa waktu nonaktif "Segera"', /Absen masuk belum dibuka/.test(el('popup').textContent) && /Dibuka mulai 06:45/.test(el('popup').textContent) && /Segera/.test(el('popup').textContent));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
