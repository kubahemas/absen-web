// Skrip uji (server TIRUAN, tidak menulis ke sheet): Tahap 2 laporan bulanan, label performa, dashboard.
// Konteks lewat window.__KONTEKS = 'pribadi' (Report 36/36e/37/38, detail 39/40, lencana) | 'admin' (dashboard 68/69, detail 70) | 'admintoko' (kotak Perlu evaluasi, butuh pra_toko.js) | 'owner' (81/82, kotak evaluasi; butuh pra_owner.js).
// Pakai BUDGET=90000.
window.__hasil = [];
var H = window.__hasil;
var K = window.__KONTEKS || 'pribadi';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function f(id, nama) { return document.querySelector('#' + id + ' [data-f="' + nama + '"]'); }
function teks(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function ubah(e, nilai) { e.value = nilai; e.dispatchEvent(new Event('change', { bubbles: true })); }
var panggil = [];
function semua(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }); }
function terakhir(aksi) { return semua(aksi).pop(); }
window.__LABEL = 'BAD';
window.__TREN = true;
function lap(label) {
  return {
    bulan: '2026-10', bulan_teks: 'Oktober 2026', periode_teks: '1–9 Oktober', dari: '2026-10-01', sampai: '2026-10-09', hari_kerja: 7, masuk: 6, telat_hari: 1, telat_mnt: 7, plg_awal: 1, alpha: 1, izin_biasa: 0, izin_khusus: 0,
    cuti_bulan: 1, jatah_cuti: 6, sisa_cuti: 5, lembur_hari: 1, lembur_1: 0, lembur_2: 1, lembur_3: 0, label: label, ada_data: !!label,
    catatan: label === 'EXCELLENT' ? 'Tanpa pelanggaran. Pertahankan!' : (label === 'GOOD' ? 'Telat 2 kali. Tanpa pelanggaran untuk EXCELLENT.' : 'Telat 7 kali (batas 5) dan 1 alpha. Masuk daftar evaluasi.'),
    menunggu: [{ tanggal: '2026-10-08', judul: 'Absen luar', rincian: '8 Okt, pasang ac' }], ditolak: label === 'BAD' ? [{ tanggal: '2026-10-06', judul: 'Lembur 1–2 jam', rincian: '6 Okt, penataan barang' }] : [],
    telat_detail: [{ tanggal: '2026-10-02', masuk: '07:52', telat_mnt: 7, alasan: 'Macet' }, { tanggal: '2026-10-07', masuk: '07:50', telat_mnt: 5, alasan: '' }],
    lembur_detail: [{ tanggal: '2026-10-03', pulang: '18:00', tingkat: 2, pekerjaan: 'Stok opname' }],
    tren: window.__TREN ? { label: { arah: 'turun', dari: 'GOOD' }, telat: { arah: 'memburuk', dari: 0 } } : { label: { arah: '', dari: '' }, telat: { arah: '', dari: '' } }
  };
}
var DASH = {
  status: 'ok', bulan: '2026-10', bulan_ini: '2026-10', bulan_teks: 'Oktober 2026', bulan_lalu_teks: 'September', ada_pembanding: true, cabang: 'Ngawi', daftar_cabang: ['Ngawi', 'Pusat'],
  kehadiran: { persen: 90, tren: { arah: 'naik', dari: 87, baik: true, selisih: 3 } }, telat: { hari: 6, tren: { arah: 'naik', dari: 2, baik: false } }, tidak_hadir: { hari: 2, tren: { arah: '', dari: '' } }, lembur: { hari: 1, tren: { arah: 'turun', dari: 3, baik: null } },
  komposisi: { EXCELLENT: 1, GOOD: 0, BAD: 1 }, jumlah_karyawan: 2,
  telat_minggu: [{ label: 'Mg 1', jumlah: 1 }, { label: 'Mg 2', jumlah: 5 }, { label: 'Mg 3', jumlah: 0 }, { label: 'Mg 4', jumlah: 0 }], kalimat_minggu: 'Minggu ke-2 naik dari 1 jadi 5',
  telat_hari: [{ label: 'Sen', jumlah: 1 }, { label: 'Sel', jumlah: 2 }, { label: 'Rab', jumlah: 1 }, { label: 'Kam', jumlah: 1 }, { label: 'Jum', jumlah: 1 }, { label: 'Sab', jumlah: 0 }], hari_terbanyak: 'Selasa',
  paling_sering: [{ id: 'K004', nama: 'Andi Pratama', hari: 6, menit: 40 }],
  karyawan: [{ id: 'K004', nama: 'Andi Pratama', cabang: 'Ngawi', label: 'BAD', alpha: 2 }, { id: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', label: 'EXCELLENT', alpha: 0 }], perlu_evaluasi: 1
};
var f0 = window.fetch;
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggil.push(b);
  var d = null;
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: K === 'pribadi' ? 'K003' : 'K009', nama: K === 'pribadi' ? 'Budi Santoso' : 'Dewi Lestari', panggilan: 'Budi', role: K === 'pribadi' ? 'KARYAWAN' : 'ADMIN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false, izin_menunggu: 0, tukar_masuk: 0 }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 0, jumlah_teks: '0' }; }
  if (b.aksi === 'laporan_saya') { d = { status: 'ok', nama: 'Budi Santoso', laporan: lap(window.__LABEL === 'NONE' ? null : window.__LABEL), jam_masuk: '07:45' }; }
  if (b.aksi === 'laporan_cabang') { d = Object.assign({}, DASH, { bulan: b.bulan || '2026-10', cabang: K === 'owner' ? (b.cabang || '') : 'Ngawi', daftar_cabang: K === 'owner' ? DASH.daftar_cabang : undefined }); }
  if (b.aksi === 'laporan_karyawan') { d = { status: 'ok', id: b.id, nama: 'Andi Pratama', cabang: 'Ngawi', shift: 'Shift 1', jam_masuk: '07:45', laporan: lap('BAD') }; }
  if (b.aksi === 'evaluasi_jumlah') { d = { status: 'ok', jumlah: 3 }; }
  if (d) { return Promise.resolve({ json: function () { return Promise.resolve(d); } }); }
  return f0(url, opsi);
};
async function masukPribadi(nama) {
  el('btnJenisPribadi').click(); await tunggu(100);
  el('pribNama').value = nama; el('pribRahasia').value = 'rahasia12'; el('btnMasukPribadi').click(); await tunggu(900);
}
async function dariMenu(idMenu, nama) {
  el(idMenu).click(); await tunggu(150);
  Array.prototype.filter.call(document.querySelectorAll(idMenu === 'btnMenuOwner' ? '#menuOwner .menu-kartu button' : '#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0].click(); await tunggu(900);
}
(async function () {
  try {
    if (K === 'pribadi') {
      await masukPribadi('Budi Santoso');
      var lc = el('pribLabel');
      ok('lencana beranda aktif dengan label dari server: BAD merah, teks "BAD", tidak lagi "Segera"', !lc.classList.contains('belum-aktif') && teks(el('pribLabelTeks')) === 'BAD' && /merah/.test(lc.style.background) && !!terakhir('laporan_saya') && terakhir('laporan_saya').sesi === 'S'.repeat(40));
      el('btnPribReport').click(); await tunggu(700);
      ok('label BAD membuka layar 38 (Report BAD)', aktif() === 'lb38');
      ok('layar 38: "Oktober 2026", "Performa 1–9 Oktober", label BAD, catatan "Telat 7 kali (batas 5) dan 1 alpha. Masuk daftar evaluasi."', teks(f('lb38', 'bulan')) === 'Oktober 2026' && teks(f('lb38', 'perf')) === 'Performa 1–9 Oktober' && teks(f('lb38', 'label')) === 'BAD' && teks(f('lb38', 'catatan')) === 'Telat 7 kali (batas 5) dan 1 alpha. Masuk daftar evaluasi.');
      ok('angka dari server: Masuk 6 / 7 hari, Telat 1 hari (Total 7 menit), Pulang awal 1, Alpha 1, Izin biasa 0, Izin khusus 0, Sisa cuti 5 / 6, Lembur 1', teks(f('lb38', 'r_masuk').children[1]) === '6 / 7 hari' && teks(f('lb38', 'r_telat').children[1]) === '1 hari' && teks(f('lb38', 'totalMenit')) === 'Total 7 menit' && teks(f('lb38', 'r_plg').children[1]) === '1 hari' && teks(f('lb38', 'r_alpha').children[1]) === '1 hari' && teks(f('lb38', 'r_izinb').children[1]) === '0 hari' && teks(f('lb38', 'r_cuti').children[1]) === '5 / 6 hari' && teks(f('lb38', 'r_lembur').children[1]) === '1 hari');
      ok('tren nyata dari server: "▼ turun dari GOOD" (merah) dan "▲ memburuk dari 0" (merah)', teks(f('lb38', 'tren')) === '▼ turun dari GOOD' && teks(f('lb38', 'trenTelat')) === '▲ memburuk dari 0' && /merah/.test(f('lb38', 'tren').style.color));
      var kartuM = f('lb38', 'hMenunggu').nextElementSibling, kartuD = f('lb38', 'hDitolak').nextElementSibling;
      ok('Menunggu ACC: absen luar 8 Okt dengan badge Menunggu; Ditolak bulan ini: Lembur 1–2 jam dengan badge Ditolak', /Absen luar/.test(teks(kartuM)) && /8 Okt, pasang ac/.test(teks(kartuM)) && /Menunggu$/.test(teks(kartuM)) && /Lembur 1–2 jam/.test(teks(kartuD)) && /Ditolak$/.test(teks(kartuD)));
      ok('Detail Telat dan Lembur aktif; Detail lain (Masuk, Pulang awal, dst.) tetap nonaktif', !f('lb38', 'r_telat').lastElementChild.disabled && !f('lb38', 'r_lembur').lastElementChild.disabled && f('lb38', 'r_alpha').lastElementChild.disabled && f('lb38', 'r_masuk').lastElementChild.disabled);
      f('lb38', 'r_telat').lastElementChild.click(); await tunggu(300);
      ok('Detail telat (40): "Oktober 2026 · 1 hari · total 7 menit"; baris tabel "02 Okt 07:52 7 min Macet" dan alasan kosong "—"; "Dihitung dari jam masuk 07:45."', aktif() === 'lb40' && teks(f('lb40', 'sub')) === 'Oktober 2026 · 1 hari · total 7 menit' && /02 Okt.*07:52.*7 min.*Macet/.test(teks(f('lb40', 'tbody'))) && /07 Okt.*5 min.*—/.test(teks(f('lb40', 'tbody'))) && teks(f('lb40', 'catatan')) === 'Dihitung dari jam masuk 07:45.');
      el('lb40').querySelector('[data-lb-kembali]').click(); await tunggu(200);
      f('lb38', 'r_lembur').lastElementChild.click(); await tunggu(300);
      ok('Detail lembur (39): "Oktober 2026 · 1 hari", hitung 0 / 1 / 0, baris "03 Okt 18:00 1–2 jam Stok opname"', aktif() === 'lb39' && teks(f('lb39', 'sub')) === 'Oktober 2026 · 1 hari' && teks(f('lb39', 'hitung')).replace(/\s/g, '').indexOf('0<1jam1') === 0 && /03 Okt.*18:00.*1–2 jam.*Stok opname/.test(teks(f('lb39', 'tbody'))));
      el('lb39').querySelector('[data-lb-kembali]').click(); await tunggu(200);
      el('lb38').querySelector('[data-lb-kembali="home"]').click(); await tunggu(300);
      // tanpa selisih nyata: tren "–"
      window.__TREN = false; window.__LABEL = 'GOOD';
      el('btnPribReport').click(); await tunggu(700);
      ok('label GOOD membuka layar 37; tanpa selisih/pembanding tren tampil "–" abu tanpa panah', aktif() === 'lb37' && teks(f('lb37', 'label')) === 'GOOD' && teks(f('lb37', 'tren')) === '–' && teks(f('lb37', 'trenTelat')) === '–' && !/[▲▼]/.test(teks(el('lb37'))));
      ok('catatan GOOD dari server', teks(f('lb37', 'catatan')) === 'Telat 2 kali. Tanpa pelanggaran untuk EXCELLENT.');
      el('lb37').querySelector('[data-lb-kembali="home"]').click(); await tunggu(300);
      window.__LABEL = 'EXCELLENT';
      el('btnPribReport').click(); await tunggu(700);
      ok('label EXCELLENT membuka layar 36e; Total menit disembunyikan bila tidak telat bukan kasus ini (ada telat) tetap tampil', aktif() === 'lb36e' && teks(f('lb36e', 'label')) === 'EXCELLENT' && teks(f('lb36e', 'catatan')) === 'Tanpa pelanggaran. Pertahankan!');
      el('lb36e').querySelector('[data-lb-kembali="home"]').click(); await tunggu(300);
      window.__LABEL = 'NONE';
      el('btnPribReport').click(); await tunggu(700);
      ok('belum ada data (label kosong): layar 36 netral, label tetap "Segera" nonaktif (tidak ditebak)', aktif() === 'lb36' && /Segera/.test(teks(f('lb36', 'label'))));
      ok('semua layar Report (36, 36e, 37, 38) tetap ada', !!el('lb36') && !!el('lb36e') && !!el('lb37') && !!el('lb38'));
    }
    if (K === 'admin') {
      await masukPribadi('Dewi Lestari');
      await dariMenu('btnMenuPribadi', 'Dashboard bulanan');
      ok('menu "Dashboard bulanan" membuka layar 68 dan memanggil laporan_cabang dengan sesi admin', aktif() === 'lb68' && !!terakhir('laporan_cabang') && terakhir('laporan_cabang').sesi === 'S'.repeat(40) && !terakhir('laporan_cabang').token);
      ok('subjudul "Cabang Ngawi", badge "Admin Ngawi"', teks(f('lb68', 'sub')) === 'Cabang Ngawi' && /Admin Ngawi/.test(teks(el('lb68'))));
      ok('kartu angka: Kehadiran 90% (▲ naik 3% dari September hijau), Telat 6 Hari (▲ naik dari 2 merah), Tidak hadir 2 Hari ("–" karena tidak ada selisih), Lembur 1 Hari (▼ turun dari 3 netral)', teks(f('lb68', 'k_kehadiran').children[1]) === '90%' && teks(f('lb68', 'k_kehadiran').children[2]) === '▲ naik 3% dari September' && teks(f('lb68', 'k_telat').children[1]) === '6 Hari' && teks(f('lb68', 'k_telat').children[2]) === '▲ naik dari 2' && /merah/.test(f('lb68', 'k_telat').children[2].style.color) && teks(f('lb68', 'k_tidak').children[2]) === '–' && teks(f('lb68', 'k_lembur').children[2]) === '▼ turun dari 3');
      ok('komposisi: "2 karyawan", EXCELLENT 1, GOOD 0, BAD 1', teks(f('lb68', 'komposisi')).indexOf('2 karyawan') >= 0 && /EXCELLENT 1/.test(teks(f('lb68', 'komposisi'))) && /GOOD 0/.test(teks(f('lb68', 'komposisi'))) && /BAD 1/.test(teks(f('lb68', 'komposisi'))));
      ok('grafik telat per minggu 4 batang (Mg 1..Mg 4) + kalimat "Minggu ke-2 naik dari 1 jadi 5"; telat per hari 6 batang + "Paling banyak hari Selasa"', f('lb68', 'minggu').children[1].children.length === 4 && teks(f('lb68', 'minggu').children[2]) === 'Minggu ke-2 naik dari 1 jadi 5' && f('lb68', 'hari').children[1].children.length === 6 && teks(f('lb68', 'hari').children[2]) === 'Paling banyak hari Selasa');
      ok('paling sering telat: "1 Andi Pratama 6 Hari · 40 min"', /1\s*Andi Pratama\s*6 Hari · 40 min/.test(teks(f('lb68', 'sering'))));
      ok('pilihan Bulan: 12 bulan mundur, bulan ini terpilih', f('lb68', 'bulan').options.length === 12 && f('lb68', 'bulan').value === '2026-10' && !f('lb68', 'bulan').disabled);
      ubah(f('lb68', 'bulan'), '2026-09'); await tunggu(500);
      ok('ganti Bulan memuat ulang laporan_cabang dengan bulan itu', terakhir('laporan_cabang').bulan === '2026-09');
      var n0 = semua('laporan_cabang').length;
      el('lb68').querySelectorAll('[role="tablist"] button')[1].click(); await tunggu(400);
      ok('tab "Per karyawan" membuka layar 69 tanpa memuat ulang dari server', aktif() === 'lb69' && semua('laporan_cabang').length === n0);
      ok('chip "Semua 2" dan "Perlu evaluasi 1"; baris urut nama: Andi Pratama (ikon BAD, Tidak hadir 2 Hari), Budi Santoso (ikon EXCELLENT, 0 Hari)', teks(f('lb69', 'fSemua')) === 'Semua 2' && teks(f('lb69', 'fEval')) === 'Perlu evaluasi 1' && f('lb69', 'tbody').rows.length === 2 && /Andi Pratama/.test(teks(f('lb69', 'tbody').rows[0])) && /2 Hari/.test(teks(f('lb69', 'tbody').rows[0])) && f('lb69', 'tbody').rows[0].querySelector('[title="BAD"]') && f('lb69', 'tbody').rows[1].querySelector('[title="EXCELLENT"]'));
      f('lb69', 'fEval').click(); await tunggu(200);
      ok('filter "Perlu evaluasi": hanya yang BAD', f('lb69', 'tbody').rows.length === 1 && /Andi Pratama/.test(teks(f('lb69', 'tbody'))));
      f('lb69', 'tbody').rows[0].click(); await tunggu(700);
      ok('ketuk baris memanggil laporan_karyawan lalu membuka layar 70 (detail karyawan)', aktif() === 'lb70' && terakhir('laporan_karyawan').id === 'K004' && terakhir('laporan_karyawan').sesi === 'S'.repeat(40));
      ok('layar 70: nama "Andi Pratama", "Cabang Ngawi · Shift 1", label BAD merah, angka dan catatan dari server', teks(f('lb70', 'nama')) === 'Andi Pratama' && teks(f('lb70', 'info')) === 'Cabang Ngawi · Shift 1' && teks(f('lb70', 'label')) === 'BAD' && teks(f('lb70', 'r_masuk').children[1]) === '6 / 7 hari' && /alpha/.test(teks(f('lb70', 'catatan'))) && /merah/.test(document.getElementById('lb70').firstElementChild.style.background));
      f('lb70', 'r_telat').lastElementChild.click(); await tunggu(300);
      ok('Detail telat dari layar 70 memakai data karyawan itu', aktif() === 'lb40' && /Macet/.test(teks(f('lb40', 'tbody'))));
      el('lb40').querySelector('[data-lb-kembali]').click(); await tunggu(200);
      el('lb70').querySelector('[data-lb-kembali]').click(); await tunggu(200);
      ok('Back dari 70 kembali ke daftar Per karyawan (filter tetap)', aktif() === 'lb69' && f('lb69', 'tbody').rows.length === 1);
    }
    if (K === 'admintoko') {
      await tunggu(300);
      el('btnAdmin').click(); await tunggu(200);
      el('admUsername').value = 'dewi'; el('admPassword').value = 'rahasia12'; el('btnMasukAdmin').click(); await tunggu(1200);
      var te = el('btnEvalAdmin');
      ok('beranda admin HP toko: kotak "Perlu evaluasi (BAD)" aktif dengan jumlah dari server "3 orang"', aktif() === 'layarAdmin' && !te.disabled && !te.classList.contains('belum-aktif') && /3 orang/.test(te.textContent) && !/Segera/.test(te.textContent) && !!terakhir('evaluasi_jumlah') && terakhir('evaluasi_jumlah').token === 'T'.repeat(40));
      te.click(); await tunggu(800);
      ok('ketuk kotak membuka layar 69 dengan filter "Perlu evaluasi" aktif (hanya BAD)', aktif() === 'lb69' && f('lb69', 'tbody').rows.length === 1 && /Andi Pratama/.test(teks(f('lb69', 'tbody'))) && !!terakhir('laporan_cabang').token);
    }
    if (K === 'owner') {
      el('btnJenisOwner').click(); el('ownUsername').value = 'owner'; el('ownPassword').value = 'rahasia123'; el('btnMasukOwner').click(); await tunggu(1200);
      var to = el('btnEvalOwner');
      ok('beranda owner: kotak "Perlu evaluasi (BAD)" aktif "3 orang" dengan sesi owner', !to.disabled && /3 orang/.test(to.textContent) && !!terakhir('evaluasi_jumlah') && !terakhir('evaluasi_jumlah').token && !!terakhir('evaluasi_jumlah').sesi);
      await dariMenu('btnMenuOwner', 'Laporan bulanan');
      ok('menu "Laporan bulanan" membuka layar 81 dengan sesi owner; subjudul "Semua cabang"; pilihan Cabang dari server', aktif() === 'lb81' && !!terakhir('laporan_cabang') && !terakhir('laporan_cabang').token && teks(f('lb81', 'sub')) === 'Semua cabang' && f('lb81', 'cab').options.length === 3);
      ok('tombol "Ekspor Excel" tetap nonaktif "Segera"', f('lb81', 'ekspor').disabled && /Segera/.test(teks(f('lb81', 'ekspor'))));
      ok('angka ringkasan dari server (Kehadiran 90%, Telat 6 Hari)', teks(f('lb81', 'k_kehadiran').children[1]) === '90%' && teks(f('lb81', 'k_telat').children[1]) === '6 Hari');
      ubah(f('lb81', 'cab'), 'Pusat'); await tunggu(500);
      ok('ganti Cabang ke Pusat memuat ulang dengan cabang Pusat; subjudul "Pusat"', terakhir('laporan_cabang').cabang === 'Pusat' && teks(f('lb81', 'sub')) === 'Pusat');
      el('lb81').querySelectorAll('[role="tablist"] button')[1].click(); await tunggu(400);
      ok('tab Per karyawan (82) tampil dengan dua baris', aktif() === 'lb82' && f('lb82', 'tbody').rows.length === 2);
      f('lb82', 'tbody').rows[0].click(); await tunggu(700);
      ok('baris membuka layar 70 dengan beranda owner (data-lb-home own)', aktif() === 'lb70' && document.getElementById('lb70').getAttribute('data-lb-home') === 'own' && !terakhir('laporan_karyawan').token);
      el('lb70').querySelector('[data-lb-kembali]').click(); await tunggu(200);
      el('lb82').querySelector('[data-lb-kembali="home"]').click(); await tunggu(500);
      to = el('btnEvalOwner'); to.click(); await tunggu(800);
      ok('kotak evaluasi owner membuka layar 82 dengan filter "Perlu evaluasi"', aktif() === 'lb82' && f('lb82', 'tbody').rows.length === 1);
    }
  } catch (e) { H.push('GALAT ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  H.unshift(H.filter(function (x) { return /^GAGAL|^GALAT/.test(x); }).length ? 'ADA YANG GAGAL' : 'SEMUA OK');
})();
