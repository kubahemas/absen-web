// Konfigurasi per layar baru (nomor mockup). Lihat tools/layar_baru_bersih.js untuk arti tiap kunci.
// SUMBER: nomor layar app -> berkas mockup (36 memakai mockup 37 GOOD sebagai satu layar Report).
var SUMBER = { '36': '36', '36e': '36' };
// Kalimat tren (mockup 36/37/38/68/70/81): tampil di tempat yang sama, isinya hanya "–" (tanpa panah dan tanpa angka). Keputusan pemilik 2026-10-07.
// Elemen ke-3 = 'tren' (warna abu netral, keputusan pemilik 16), ke-4 = 'pudar' (kalimat "Telat N kali ..." nonaktif, keputusan pemilik 12).
var TREN = [[/^\s*[▲▼][^]*$/, '–', 'tren'], [/^\s*sama dengan[^]*$/, '–', 'tren'], [/^\s*Minggu ke-[^]*$/, '–', 'tren'], [/^\s*Paling banyak hari[^]*$/, '–', 'tren'], [/^\s*Telat \S+ kali[^]*$/, '–', 'tren', 'pudar']];
// Layar Report: tiga kondisi label. 36 = versi yang bisa dibuka (lencana netral/nonaktif); 36e (EXCELLENT), 37 (GOOD), 38 (BAD) = berwarna penuh, TIDAK bisa dibuka dari navigasi.
var REPORT = { home: 'prib', hapusTeks: [], hapusBaris: [/^Menunggu$/], ganti: TREN, nav: { 'Detail#1': { ke: 'lb40' }, 'Detail#7': { ke: 'lb39' } } };
var CFG = {
  '02': { home: 'toko', hapusBaris: ['Ahmad', 'Ari'] },
  '03': { home: 'toko', judulMode: true, ganti: [[/Memindai.*/, 'Pengenalan wajah · Segera']] },
  '04': { home: 'toko' }, '05': { home: 'toko' }, '06': { home: 'toko' }, '07': { home: 'toko' },
  '08': { home: 'toko', judulMode: true, nav: { 'Manual: pilih nama + PIN': { aksi: 'pilihnama' } } },
  '13': { home: 'toko' }, '18': { home: 'toko' }, '19': { home: 'toko' },
  '22': { home: 'adm' }, '23': { home: 'prib' },
  '24': { home: 'own', hapusSatu: ['Shift 2 · Siang'] },
  '25': { home: 'own', hapusBaris: ['Ahmad Fauzi'], pudar: [/^Semua cabang$/, /^Pekan ini$/, /^Semua$/] },
  '34': { home: 'prib', tombolAngka: true, fn: function (root) {
    // Keputusan pemilik 2026-10-07: PIN 5 angka; chip "Keperluan" dihapus, diganti satu kolom Keterangan seperti layar absen luar yang berjalan.
    var titik = Array.prototype.filter.call(root.querySelectorAll('div'), function (d) { return /width: 16px; height: 16px; border-radius: 50%/.test(d.getAttribute('style') || ''); });
    if (titik.length === 4) { titik[3].parentNode.insertBefore(titik[3].cloneNode(true), titik[3].nextSibling); }
    var judul = Array.prototype.filter.call(root.querySelectorAll('div'), function (d) { return teksLangsung(d) === 'Keperluan'; })[0];
    if (judul) { judul.parentElement.remove(); }
    Array.prototype.forEach.call(root.querySelectorAll('label'), function (l) { if (/^Keterangan tujuan/.test(l.textContent)) { l.textContent = 'Keterangan tujuan (nama klien atau alamat), wajib minimal 5 karakter'; } });
    Array.prototype.forEach.call(root.querySelectorAll('textarea'), function (a) { a.setAttribute('maxlength', '100'); });
  } },
  '35': { home: 'prib', fn: function (root) { Array.prototype.forEach.call(root.querySelectorAll('div'), function (d) { if (teksLangsung(d) === 'Bulan ini') { d.classList.add('belum-aktif'); if (d.nextElementSibling) { d.nextElementSibling.classList.add('belum-aktif'); } } }); } },
  // 36 = Report yang BISA dibuka: sumber mockup 36 (latar kuning netral); lencana label diganti "Segera" nonaktif berwarna netral (tanpa EXCELLENT/GOOD/BAD).
  '36': { home: 'prib', hapusTeks: [], hapusBaris: REPORT.hapusBaris, ganti: TREN.concat([[/^EXCELLENT$/, 'Segera']]), pudar: [/^Segera$/, /^Tanpa pelanggaran/], nav: REPORT.nav, fn: function (root) {
    var lencana = Array.prototype.filter.call(root.querySelectorAll('div'), function (d) { return teksLangsung(d) === 'Segera'; })[0];
    if (lencana) { lencana.style.color = 'var(--abu-teks)'; var ikon = lencana.parentElement.previousElementSibling; if (ikon) { ikon.style.background = 'var(--abu)'; } }
    Array.prototype.forEach.call(root.querySelectorAll('div'), function (d) { if (teksLangsung(d) === String.fromCharCode(8211) && /border-radius: 999px/.test(d.getAttribute('style') || '')) { d.style.borderColor = 'var(--abu-teks)'; d.style.background = 'var(--krem)'; d.style.color = 'var(--abu-teks)'; } });
  } },
  '36e': Object.assign({}, REPORT, { hapusTeks: [] }), '37': REPORT, '38': REPORT,
  '48': { home: 'prib', ganti: [[/^GOOD$/, 'Segera'], [/^Halo, –$/, '–']], pudar: [/^Segera$/], tanpaSegera: /^Tukar shift$/ },
  '39': { home: 'prib', hapusBaris: ['24 Sep'] },
  '40': { home: 'prib', hapusBaris: ['28 Sep'] },
  '41': { home: 'prib', hapusTeks: [/izin khusus menikah/, /hari cuti/, /^Sisa cuti jadi/] },
  '42': { home: 'prib', hapusSatu: [/Anda →/] },
  '43': { home: 'prib' }, '45': { home: 'prib', ganti: [[/Password lama \(awal: –\)/, 'Password lama']], fn: function (root) {
    // Aturan sandi: teks diisi saat layar dibuka menurut peran akun (KARYAWAN = PIN 5 angka; ADMIN = kata sandi minimal 8 karakter). Di markup hanya "–".
    var re = [/^– angka$/, /^Bukan angka berurutan atau kembar/, /^Bukan – dan tidak sama dengan PIN$/];
    Array.prototype.forEach.call(root.querySelectorAll('div, span'), function (d) {
      var t = teksLangsung(d);
      re.forEach(function (r, i) { if (r.test(t)) { d.setAttribute('data-aturan', String(i + 1)); d.textContent = '–'; } });
    });
  } },
  '53': { home: 'adm' }, '54': { home: 'adm' },
  '55': { home: 'adm', hapusSatu: ['Andi Pratama', 'Budi Santoso', 'Dewi Lestari', 'Joko Susilo', 'Rina Wati', 'Sari Utami'] },
  '56': { home: 'adm' },
  '57': { home: 'adm', hapusBaris: ['05–10 Okt'] },
  '62': { home: 'adm' },
  '64': { home: 'adm', hapusBaris: ['Ahmad Fauzi'], pudar: [/^Pekan ini$/, /^Semua$/] },
  '65': { home: 'adm' }, '66': { home: 'adm' },
  '67': { home: 'adm', hapusBaris: [/^17 Sep/] },
  '68': { home: 'adm', ganti: TREN, hapusBaris: ['Mg 1', 'Sen', 'Budi Santoso'], nav: { 'Per karyawan': { ke: 'lb69', ganti: true } } },
  '69': { home: 'adm', hapusBaris: ['Ahmad Fauzi'], nav: { 'Ringkasan': { ke: 'lb68', ganti: true } } },
  '70': { home: 'adm', hapusTeks: REPORT.hapusTeks, hapusBaris: REPORT.hapusBaris, ganti: TREN.concat([[/^GOOD$/, 'Segera']]), pudar: [/^Segera$/], nav: { 'Detail#1': { ke: 'lb40' }, 'Detail#7': { ke: 'lb39' } } },
  '73': { home: 'own', nav: { 'Detail#5': { ke: 'lb74' } } },
  '74': { home: 'own' }, '75': { home: 'own' },
  '76': { home: 'own', hapusBaris: ['Semua absen lengkap', 'Agustus 2026'] },
  '77': { home: 'own', hapusBaris: ['Dewi Lestari', 'Budi Santoso'] },
  '81': { home: 'own', ganti: TREN, hapusBaris: ['Mg 1', 'Sen', 'Budi Santoso'], nav: { 'Per karyawan': { ke: 'lb82', ganti: true } } },
  '82': { home: 'own', hapusBaris: ['Ahmad Fauzi'], nav: { 'Ringkasan': { ke: 'lb81', ganti: true } } }
};
