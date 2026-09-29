/**
 * WEB APP ABSENSI - VERSI PALING SEDERHANA (tahap 1 langkah 2)
 *
 * File ini TIDAK berisi rahasia apa pun. KODE_RAHASIA tetap dibaca dari
 * Script Properties (sama seperti di setup_spreadsheet.gs), dan fungsi
 * hashDenganGaram() dipakai bersama dari file itu (satu proyek Apps Script
 * = semua file .gs saling bisa panggil fungsi satu sama lain).
 *
 * Baru bisa: ping (tes hidup) dan absen masuk pakai PIN. Belum ada foto,
 * GPS, status telat, atau pop-up - itu langkah-langkah berikutnya.
 *
 * Cara tes dari browser (tanpa aplikasi), pakai URL Web App yang didapat
 * setelah Deploy (lihat penjelasan cara deploy terpisah):
 *   {URL_WEB_APP}?aksi=ping
 *   {URL_WEB_APP}?aksi=absen_masuk&id=K001&pin=1234
 */

function doGet(e) {
  const aksi = e.parameter.aksi;

  if (aksi === 'ping') {
    return respon({
      status: 'ok',
      pesan: 'OK',
      jam_server: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+7', 'yyyy-MM-dd HH:mm:ss')
    });
  }

  if (aksi === 'absen_masuk') {
    return prosesAbsenMasuk(e.parameter.id, e.parameter.pin);
  }

  return respon({
    status: 'gagal',
    pesan: 'Aksi tidak dikenali. Gunakan ?aksi=ping atau ?aksi=absen_masuk&id=...&pin=...'
  });
}

function prosesAbsenMasuk(id, pin) {
  if (!id || !pin) {
    return respon({ status: 'gagal', pesan: 'id dan pin wajib diisi' });
  }

  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) {
    return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' });
  }

  const akun = bacaSheet('akun');
  const akunDitemukan = akun.data.find(function (r) { return String(r.id) === String(id); });

  const hashDicoba = hashDenganGaram(String(pin), String(id), kodeRahasia);
  if (!akunDitemukan || hashDicoba !== akunDitemukan.pin_hash) {
    // Sengaja pesan disamakan untuk id tidak ditemukan maupun PIN salah,
    // supaya orang luar tidak bisa menebak-nebak id karyawan mana yang valid.
    return respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' });
  }

  const zona = Session.getScriptTimeZone() || 'GMT+7';
  const tanggalHariIni = Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd');
  const jamSekarang = Utilities.formatDate(new Date(), zona, 'HH:mm');

  const absensi = bacaSheet('absensi');
  const sudahAbsenMasuk = absensi.data.some(function (r) {
    return String(r.karyawan) === String(id) && r.tanggal === tanggalHariIni && r.masuk;
  });
  if (sudahAbsenMasuk) {
    return respon({ status: 'gagal', pesan: 'Sudah absen masuk hari ini' });
  }

  const barisBaru = {};
  absensi.header.forEach(function (nama) { barisBaru[nama] = ''; });
  barisBaru.tanggal = tanggalHariIni;
  barisBaru.karyawan = id;
  barisBaru.nama = akunDitemukan.nama;
  barisBaru.cabang = akunDitemukan.cabang;
  barisBaru.shift = akunDitemukan.shift;
  barisBaru.masuk = jamSekarang;
  barisBaru.cara_masuk = 'PIN';

  absensi.sheet.appendRow(absensi.header.map(function (nama) { return barisBaru[nama]; }));

  return respon({
    status: 'ok',
    pesan: 'Absen masuk berhasil',
    karyawan: id,
    nama: akunDitemukan.nama,
    tanggal: tanggalHariIni,
    masuk: jamSekarang
  });
}

/**
 * Baca satu sheet jadi bentuk yang gampang dipakai: header (baris judul)
 * dan data (satu objek per baris, key = nama kolom).
 */
function bacaSheet(namaSheet) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(namaSheet);
  const nilai = sheet.getDataRange().getValues();
  const header = nilai[0];
  const data = [];
  for (let i = 1; i < nilai.length; i++) {
    const baris = {};
    header.forEach(function (nama, idx) { baris[nama] = nilai[i][idx]; });
    data.push(baris);
  }
  return { sheet: sheet, header: header, data: data };
}

function respon(objek) {
  return ContentService.createTextOutput(JSON.stringify(objek)).setMimeType(ContentService.MimeType.JSON);
}
