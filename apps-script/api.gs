/**
 * WEB APP ABSENSI - VERSI PALING SEDERHANA (tahap 1 langkah 2)
 *
 * File ini TIDAK berisi rahasia apa pun. KODE_RAHASIA tetap dibaca dari
 * Script Properties (sama seperti di setup_spreadsheet.gs), dan fungsi
 * hashDenganGaram() dipakai bersama dari file itu (satu proyek Apps Script
 * = semua file .gs saling bisa panggil fungsi satu sama lain).
 *
 * - GET  ?aksi=ping           -> tes hidup, boleh dari address bar browser.
 * - GET  ?aksi=daftar_karyawan&cabang=... -> daftar {id, nama, panggilan}
 *   karyawan/admin aktif di satu cabang. Dipakai halaman HP toko (index.html)
 *   untuk mengisi daftar nama. Tidak ada data rahasia di balasan ini.
 * - POST { aksi:'absen_masuk', id, pin } -> WAJIB lewat POST (bukan GET)
 *   supaya PIN tidak muncul di alamat URL. Body dikirim sebagai teks JSON
 *   dengan Content-Type text/plain (bukan application/json) supaya browser
 *   tidak melakukan CORS preflight yang tidak didukung Apps Script.
 *   Cara tes: buka tes/tes-api.html di komputer (lihat penjelasan terpisah).
 *
 * Pengaman PIN: setiap PIN salah, salah_login bertambah 1. Sampai 5 kali,
 * akun otomatis terkunci (terkunci=TRUE) dan absen selalu ditolak walau
 * PIN berikutnya benar, sampai admin membuka kuncinya manual di sheet akun
 * (set terkunci=FALSE dan salah_login=0). Setiap penguncian dicatat ke log.
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

  if (aksi === 'daftar_karyawan') {
    return prosesDaftarKaryawan(e.parameter.cabang);
  }

  if (aksi === 'absen_masuk') {
    return respon({
      status: 'gagal',
      pesan: 'Absen masuk sekarang harus lewat POST, bukan GET. Pakai tes/tes-api.html untuk tes.'
    });
  }

  return respon({
    status: 'gagal',
    pesan: 'Aksi tidak dikenali. Gunakan ?aksi=ping (GET) untuk tes hidup.'
  });
}

/**
 * Daftar nama untuk layar "pilih nama" di HP toko: id, nama, panggilan
 * karyawan DAN admin yang aktif di satu cabang (admin tetap absen sendiri,
 * cuma tidak lembur — jadi tetap harus muncul di daftar ini). Owner dan
 * akun PERANGKAT tidak absen, jadi tidak disertakan.
 */
function prosesDaftarKaryawan(cabang) {
  if (!cabang) {
    return respon({ status: 'gagal', pesan: 'cabang wajib diisi' });
  }
  const akun = bacaSheet('akun');
  const daftar = akun.data
    .filter(function (r) {
      return r.cabang === cabang && r.aktif === true && (r.role === 'KARYAWAN' || r.role === 'ADMIN');
    })
    .map(function (r) {
      return { id: r.id, nama: r.nama, panggilan: r.panggilan };
    });
  // Info shift (tidak ada data sensitif). Untuk sekarang: shift pertama cabang itu.
  const daftarShift = bacaShiftCabang(cabang);
  let infoShift = null;
  if (daftarShift.length) {
    const sh = daftarShift[0];
    infoShift = {
      nama: sh.nama,
      masuk: sh.masuk,
      pulang: sh.pulang,
      toleransi_pulang: sh.toleransi !== null ? sh.toleransi : ambilNilaiUmum('toleransi_pulang_menit', 5)
    };
  }
  return respon({ status: 'ok', data: daftar, shift: infoShift });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respon({ status: 'gagal', pesan: 'Data yang dikirim bukan JSON yang valid.' });
  }

  if (data.aksi === 'absen_masuk') {
    return prosesAbsenMasuk(data.id, data.pin);
  }

  if (data.aksi === 'simpan_alasan') {
    return prosesSimpanAlasan(data.id, data.kode_alasan, data.alasan);
  }

  return respon({ status: 'gagal', pesan: 'Aksi tidak dikenali.' });
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

  if (!akunDitemukan) {
    // Sengaja pesan disamakan dengan "PIN salah" supaya id karyawan tidak bisa ditebak-tebak.
    return respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' });
  }

  if (akunDitemukan.terkunci === true) {
    return respon({ status: 'gagal', pesan: 'Akun terkunci, hubungi admin' });
  }

  const hashDicoba = hashDenganGaram(String(pin), String(id), kodeRahasia);

  if (hashDicoba !== akunDitemukan.pin_hash) {
    const salahBaru = (Number(akunDitemukan.salah_login) || 0) + 1;
    if (salahBaru >= 5) {
      perbaruiKolom(akun, akunDitemukan, { salah_login: salahBaru, terkunci: true });
      tambahLog({
        jenis: 'KEAMANAN', oleh: id, cabang: akunDitemukan.cabang, aksi: 'KUNCI_AKUN',
        target: 'akun', id: id, sebelum: 'terkunci=FALSE', sesudah: 'terkunci=TRUE',
        alasan: 'PIN salah 5 kali berturut-turut'
      });
      return respon({ status: 'gagal', pesan: 'Akun terkunci, hubungi admin' });
    }
    perbaruiKolom(akun, akunDitemukan, { salah_login: salahBaru });
    return respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' });
  }

  if (Number(akunDitemukan.salah_login) !== 0) {
    perbaruiKolom(akun, akunDitemukan, { salah_login: 0 });
  }

  const zona = ZONA_ABSEN;
  const sekarang = new Date();
  const tanggalHariIni = Utilities.formatDate(sekarang, zona, 'yyyy-MM-dd');
  const jamSekarang = Utilities.formatDate(sekarang, zona, 'HH:mm');
  const detikSekarang = Number(Utilities.formatDate(sekarang, zona, 'H')) * 3600 +
    Number(Utilities.formatDate(sekarang, zona, 'm')) * 60 +
    Number(Utilities.formatDate(sekarang, zona, 's'));

  const absensi = bacaSheet('absensi');
  const sudahAbsenMasuk = absensi.data.some(function (r) {
    return String(r.karyawan) === String(id) && sebagaiTanggalTeks(r.tanggal, zona) === tanggalHariIni && r.masuk;
  });
  if (sudahAbsenMasuk) {
    return respon({ status: 'gagal', pesan: 'Sudah absen masuk hari ini' });
  }

  // Jam masuk dari sheet shift (cabang + nomor shift karyawan).
  const shiftKaryawan = bacaShiftCabang(akunDitemukan.cabang).find(function (sh) {
    return String(sh.no) === String(akunDitemukan.shift);
  });
  if (!shiftKaryawan || !shiftKaryawan.masuk) {
    return respon({ status: 'gagal', pesan: 'Jadwal shift karyawan tidak ditemukan, hubungi admin' });
  }
  const detikMasuk = jamKeDetik(shiftKaryawan.masuk);
  const jendelaDetik = ambilNilaiUmum('jendela_absen_menit', 60) * 60;
  if (detikSekarang < detikMasuk - jendelaDetik) {
    return respon({
      status: 'gagal',
      pesan: 'Absen masuk belum dibuka, mulai ' + detikKeJam(detikMasuk - jendelaDetik)
    });
  }

  // Kurang dari 60 detik setelah jam masuk = HADIR; mulai 60 detik = TELAT.
  const selisih = detikSekarang - detikMasuk;
  const telat = selisih >= 60;
  const telatMnt = telat ? Math.floor(selisih / 60) : 0;

  const barisBaru = {};
  absensi.header.forEach(function (nama) { barisBaru[nama] = ''; });
  barisBaru.tanggal = tanggalHariIni;
  barisBaru.karyawan = id;
  barisBaru.nama = akunDitemukan.nama;
  barisBaru.cabang = akunDitemukan.cabang;
  barisBaru.shift = akunDitemukan.shift;
  barisBaru.masuk = jamSekarang;
  barisBaru.st_masuk = telat ? 'TELAT' : 'HADIR';
  barisBaru.telat_mnt = telatMnt;
  barisBaru.ket_masuk = telat ? 'TIDAK DIISI' : '';
  barisBaru.cara_masuk = 'PIN';

  absensi.sheet.appendRow(absensi.header.map(function (nama) { return barisBaru[nama]; }));

  const hasil = {
    status: 'ok',
    pesan: 'Absen masuk berhasil',
    st_masuk: barisBaru.st_masuk,
    telat_mnt: telatMnt,
    karyawan: id,
    nama: akunDitemukan.nama,
    panggilan: akunDitemukan.panggilan,
    tanggal: tanggalHariIni,
    jam: jamSekarang,
    shift: shiftKaryawan.nama
  };
  if (telat) {
    hasil.pilihan_alasan = ambilDaftarPengaturan('ALASAN_TELAT');
    hasil.batas_isi_detik = ambilNilaiUmum('batas_isi_alasan_detik', 10);
    hasil.kode_alasan = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    CacheService.getScriptCache().put(KUNCI_KODE_ALASAN + id, hasil.kode_alasan, 300);
  }
  return respon(hasil);
}

/**
 * Simpan alasan telat. Tidak minta PIN lagi: cukup kode sekali pakai yang
 * dikirim saat absen masuk (berlaku 5 menit), dan ket_masuk hari ini harus
 * masih "TIDAK DIISI". alasan = { pilihan, teks }.
 */
function prosesSimpanAlasan(id, kode, alasan) {
  if (!id || !kode) {
    return respon({ status: 'gagal', pesan: 'Data tidak lengkap' });
  }
  const cache = CacheService.getScriptCache();
  const kodeTersimpan = cache.get(KUNCI_KODE_ALASAN + id);
  if (!kodeTersimpan || kodeTersimpan !== String(kode)) {
    return respon({ status: 'gagal', pesan: 'Waktu mengisi alasan sudah habis' });
  }

  const zona = ZONA_ABSEN;
  const tanggalHariIni = Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd');
  const absensi = bacaSheet('absensi');
  const baris = absensi.data.find(function (r) {
    return String(r.karyawan) === String(id) && sebagaiTanggalTeks(r.tanggal, zona) === tanggalHariIni;
  });
  if (!baris || baris.ket_masuk !== 'TIDAK DIISI') {
    return respon({ status: 'gagal', pesan: 'Alasan tidak bisa disimpan' });
  }

  const pilihan = alasan && alasan.pilihan ? String(alasan.pilihan) : '';
  const teks = alasan && alasan.teks ? String(alasan.teks).trim() : '';
  if (ambilDaftarPengaturan('ALASAN_TELAT').indexOf(pilihan) === -1) {
    return respon({ status: 'gagal', pesan: 'Pilihan alasan tidak dikenal' });
  }
  if (teks.length > 100) {
    return respon({ status: 'gagal', pesan: 'Keterangan maksimal 100 karakter' });
  }
  if (pilihan === 'Lainnya' && !teks) {
    return respon({ status: 'gagal', pesan: 'Keterangan wajib diisi kalau memilih Lainnya' });
  }

  perbaruiKolom(absensi, baris, { ket_masuk: teks ? pilihan + ': ' + teks : pilihan });
  cache.remove(KUNCI_KODE_ALASAN + id);
  return respon({ status: 'ok', pesan: 'Alasan tersimpan' });
}

var ZONA_ABSEN = 'Asia/Jakarta';
var KUNCI_KODE_ALASAN = 'kode_alasan_';

/** Nilai angka dari sheet pengaturan kategori UMUM (pakai bawaan kalau tidak ada). */
function ambilNilaiUmum(nama, bawaan) {
  const baris = bacaSheet('pengaturan').data.find(function (r) { return r.kategori === 'UMUM' && r.nama === nama; });
  const angka = baris ? Number(baris.nilai) : NaN;
  return isNaN(angka) ? bawaan : angka;
}

/** Daftar nama pilihan (urutan baris) dari satu kategori di sheet pengaturan. */
function ambilDaftarPengaturan(kategori) {
  return bacaSheet('pengaturan').data
    .filter(function (r) { return r.kategori === kategori; })
    .map(function (r) { return String(r.nama); });
}

/**
 * Baca sheet shift satu cabang. Memakai getDisplayValues supaya jam "07:45"
 * tetap terbaca sebagai teks jam (Sheets bisa menyimpannya sebagai nilai jam).
 */
function bacaShiftCabang(cabang) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('shift');
  const nilai = sheet.getDataRange().getDisplayValues();
  const header = nilai[0];
  const hasil = [];
  for (let i = 1; i < nilai.length; i++) {
    const r = {};
    header.forEach(function (nama, idx) { r[nama] = nilai[i][idx]; });
    if (r.cabang !== cabang) continue;
    const toleransi = parseInt(r.toleransi, 10);
    hasil.push({
      no: r.no,
      nama: r.nama,
      masuk: normalisasiJam(r.masuk),
      tutup: normalisasiJam(r.tutup),
      pulang: normalisasiJam(r.pulang),
      toleransi: isNaN(toleransi) ? null : toleransi
    });
  }
  return hasil;
}

function normalisasiJam(teks) {
  const m = /(\d{1,2})[:.](\d{2})/.exec(String(teks));
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : '';
}

function jamKeDetik(jam) {
  const p = jam.split(':');
  return Number(p[0]) * 3600 + Number(p[1]) * 60;
}

function detikKeJam(detik) {
  const j = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  return ('0' + j).slice(-2) + ':' + ('0' + m).slice(-2);
}

/**
 * Baca satu sheet jadi bentuk yang gampang dipakai: header (baris judul)
 * dan data (satu objek per baris, key = nama kolom, plus _baris = nomor
 * baris asli di sheet supaya bisa dipakai untuk update lewat perbaruiKolom).
 */
function bacaSheet(namaSheet) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(namaSheet);
  const nilai = sheet.getDataRange().getValues();
  const header = nilai[0];
  const data = [];
  for (let i = 1; i < nilai.length; i++) {
    const baris = {};
    header.forEach(function (nama, idx) { baris[nama] = nilai[i][idx]; });
    baris._baris = i + 1;
    data.push(baris);
  }
  return { sheet: sheet, header: header, data: data };
}

/**
 * Ubah beberapa kolom di satu baris sheet (hasil dari bacaSheet), tanpa
 * menyentuh kolom/baris lain.
 */
function perbaruiKolom(bacaan, barisData, perubahan) {
  Object.keys(perubahan).forEach(function (nama) {
    const idx = bacaan.header.indexOf(nama);
    if (idx === -1) return;
    bacaan.sheet.getRange(barisData._baris, idx + 1).setValue(perubahan[nama]);
    barisData[nama] = perubahan[nama];
  });
}

/**
 * Tambah satu baris ke sheet log. Kolom "waktu" otomatis diisi jam sekarang.
 */
function tambahLog(field) {
  const log = bacaSheet('log');
  const zona = Session.getScriptTimeZone() || 'GMT+7';
  const baris = {};
  log.header.forEach(function (nama) { baris[nama] = ''; });
  baris.waktu = Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd HH:mm');
  Object.keys(field).forEach(function (k) { baris[k] = field[k]; });
  log.sheet.appendRow(log.header.map(function (nama) { return baris[nama]; }));
}

/**
 * Google Sheets suka otomatis mengubah teks yang terlihat seperti tanggal
 * (contoh: "2026-09-29") menjadi nilai tanggal asli begitu ditulis lewat
 * setValues/appendRow. Jadi saat dibaca lagi, isinya bisa berupa objek
 * Date, bukan teks yang sama persis. Fungsi ini menyamakan keduanya jadi
 * teks yyyy-MM-dd supaya perbandingan tanggal selalu benar.
 */
function sebagaiTanggalTeks(nilai, zona) {
  if (nilai instanceof Date) {
    return Utilities.formatDate(nilai, zona, 'yyyy-MM-dd');
  }
  return nilai;
}

function respon(objek) {
  return ContentService.createTextOutput(JSON.stringify(objek)).setMimeType(ContentService.MimeType.JSON);
}
