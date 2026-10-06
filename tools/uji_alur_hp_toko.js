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
    el('btnMasuk').click(); await tunggu(300);
    ok('ABSEN MASUK membuka layar pilih nama dengan judul "Absen Masuk PIN"', aktif() === 'layarPilihNama' && document.querySelector('.pilih-judul').textContent === 'Absen Masuk PIN');
    ok('minta tiket waktu ke server (jam resmi dari server, bukan jam HP)', hitung('tiket_waktu') >= 1);
    ok('PIN 5 titik; "Foto ulang" dan tautan jadwal nonaktif "Segera"', el('pinTitik').children.length === 5 && document.querySelectorAll('#layarPilihNama .belum-aktif').length >= 2);
    await isiPin('K002');
    var am = terakhir('absen_masuk');
    ok('angka kelima langsung mengirim: id K002, PIN 5 angka, memakai tiket', !!am && am.id === 'K002' && am.pin === '12345' && am.tiket === 'TIKET');
    ok('pop-up tepat waktu tampil "Selamat bekerja"; kotak "Bulan ini" nonaktif tanpa angka', /Selamat bekerja/.test(el('popup').textContent) && el('popup').querySelectorAll('.bulan-kotak.belum-aktif').length === 4);
    el('popup').click(); await tunggu(200);
    ok('pop-up ditutup, kembali ke layar utama', aktif() === 'layarUtama');

    // ---- absen dobel ditolak (jawaban server) ----
    window.__absen = { status: 'gagal', pesan: 'Sudah absen masuk hari ini' };
    el('btnMasuk').click(); await tunggu(300); await isiPin('K002');
    ok('absen dobel: pop-up "Tidak tersimpan" dengan pesan server, tanpa "Selamat bekerja"', /Tidak tersimpan/.test(el('popup').textContent) && /Sudah absen masuk hari ini/.test(el('popup').textContent) && !/Selamat bekerja/.test(el('popup').textContent));
    el('popup').click(); await tunggu(200);

    // ---- pulang awal: pop-up 15 lebih dulu, absen BELUM tersimpan sampai alasan dikirim ----
    window.__absen = { status: 'ok', st_pulang: 'PULANG CEPAT', acc: 'MENUNGGU', jam: '15:00', shift: 'Shift 1', panggilan: 'Budi', perlu_keterangan: true, jenis_keterangan: 'ALASAN_PULANG_AWAL', kode_pending: 'KP', pilihan: ['Sakit', 'Urusan keluarga', 'Disuruh atasan', 'Lainnya'], nama: 'Budi Santoso' };
    el('btnPulang').click(); await tunggu(300);
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
    el('btnLembur').disabled = false; el('btnLembur').click(); await tunggu(300);
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
    el('btnMasuk').click(); await tunggu(300); await isiPin('K002');
    ok('absen terlalu pagi: pop-up "Absen masuk belum dibuka" dengan "Dibuka mulai 06:45"; baris sisa waktu nonaktif "Segera"', /Absen masuk belum dibuka/.test(el('popup').textContent) && /Dibuka mulai 06:45/.test(el('popup').textContent) && /Segera/.test(el('popup').textContent));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
