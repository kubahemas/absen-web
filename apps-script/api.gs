/**
 * WEB APP ABSENSI - VERSI PALING SEDERHANA (tahap 1 langkah 2)
 *
 * File ini TIDAK berisi rahasia apa pun. KODE_RAHASIA tetap dibaca dari
 * Script Properties (sama seperti di setup_spreadsheet.gs), dan fungsi
 * hashDenganGaram() dipakai bersama dari file itu (satu proyek Apps Script
 * = semua file .gs saling bisa panggil fungsi satu sama lain).
 *
 * - GET  ?aksi=ping           -> tes hidup, boleh dari address bar browser.
 * - POST { aksi:'daftar_hp_toko', username, password, nama_hp, lat, lng, akurasi }
 *   -> verifikasi admin cabang lalu buat token HP toko (lihat "Token HP toko").
 * - POST { aksi:'daftar_karyawan', token } -> daftar {id, nama, panggilan}
 *   karyawan/admin aktif di cabang HP toko itu (cabang dari server, bukan dari HP).
 * - Semua aksi selain ping dan daftar_hp_toko WAJIB menyertakan token HP toko.
 * - POST { aksi:'absen_masuk', token, id, pin } -> WAJIB lewat POST (bukan GET)
 *   supaya PIN tidak muncul di alamat URL. Body dikirim sebagai teks JSON
 *   dengan Content-Type text/plain (bukan application/json) supaya browser
 *   tidak melakukan CORS preflight yang tidak didukung Apps Script.
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

  if (aksi === 'absen_masuk' || aksi === 'daftar_karyawan') {
    return respon({
      status: 'gagal',
      pesan: 'Aksi ini harus lewat POST dengan token HP toko, bukan GET.'
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
function prosesDaftarKaryawan(hp) {
  // Cabang SELALU dari baris HP toko di server, bukan kiriman HP.
  const cabang = hp.cabang;
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
  return respon({ status: 'ok', data: daftar, shift: infoShift, hp: { id: hp.id, nama: hp.nama, cabang: hp.cabang } });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respon({ status: 'gagal', pesan: 'Data yang dikirim bukan JSON yang valid.' });
  }

  // Pendaftaran HP toko: diverifikasi lewat username+password admin, tanpa token.
  if (data.aksi === 'daftar_hp_toko') {
    return prosesDaftarHpToko(data);
  }

  // Semua aksi lain wajib menyertakan token HP toko yang terdaftar.
  if (data.aksi === 'daftar_karyawan' || data.aksi === 'absen_masuk' || data.aksi === 'simpan_alasan') {
    const hp = validasiTokenHp(data.token);
    if (!hp) {
      return respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' });
    }
    if (data.aksi === 'daftar_karyawan') { return prosesDaftarKaryawan(hp); }
    if (data.aksi === 'absen_masuk') { return prosesAbsenMasuk(data.id, data.pin, hp); }
    return prosesSimpanAlasan(data.id, data.kode_alasan, data.alasan, hp);
  }

  return respon({ status: 'gagal', pesan: 'Aksi tidak dikenali.' });
}

function prosesAbsenMasuk(id, pin, hp) {
  if (!id || !pin) {
    return respon({ status: 'gagal', pesan: 'id dan pin wajib diisi' });
  }

  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) {
    return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' });
  }

  const akun = bacaSheet('akun');
  const akunDitemukan = akun.data.find(function (r) { return String(r.id) === String(id); });

  // Karyawan harus dari cabang HP toko ini (dicek sebelum PIN, jadi tidak menaikkan salah_login).
  // Hanya KARYAWAN/ADMIN yang boleh absen lewat sini.
  if (!akunDitemukan || akunDitemukan.cabang !== hp.cabang ||
      (akunDitemukan.role !== 'KARYAWAN' && akunDitemukan.role !== 'ADMIN')) {
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
function prosesSimpanAlasan(id, kode, alasan, hp) {
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
  if (!baris || baris.cabang !== hp.cabang || baris.ket_masuk !== 'TIDAK DIISI') {
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

/**
 * ---- Token HP toko ----
 * Token asli (acak, 3 UUID v4 digabung = lebih dari 128 bit) dibuat di server,
 * dikirim ke HP sekali saat pendaftaran, TIDAK pernah disimpan di sheet/log.
 * Yang disimpan hanya hash-nya di akun.pw_hash baris role PERANGKAT.
 * Hasil validasi di-cache 10 menit (kunci = hash token), jadi menghapus baris
 * atau mengubah aktif jadi FALSE baru berlaku maksimal 10 menit kemudian.
 */
var GARAM_TOKEN_HP = 'TOKEN_HP';

function hashTokenHp(token) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  return hashDenganGaram(String(token), GARAM_TOKEN_HP, kodeRahasia);
}

/** Kembalikan { id, nama, cabang } kalau token sah, kalau tidak null. */
function validasiTokenHp(token) {
  if (!token || typeof token !== 'string' || token.length < 32 || token.length > 200) { return null; }
  if (!PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA')) { return null; }
  const hash = hashTokenHp(token);
  const cache = CacheService.getScriptCache();
  const kunci = 'hp_' + hash;
  const tersimpan = cache.get(kunci);
  if (tersimpan) { return JSON.parse(tersimpan); }

  const baris = bacaSheet('akun').data.find(function (r) {
    return r.role === 'PERANGKAT' && r.aktif === true && r.pw_hash === hash;
  });
  if (!baris) { return null; }
  const hp = { id: baris.id, nama: baris.nama, cabang: baris.cabang };
  cache.put(kunci, JSON.stringify(hp), 600);
  return hp;
}

/**
 * Daftarkan HP toko baru. HANYA verifikasi admin cabang (username + password);
 * tidak membuat sesi login apa pun. Cabang ikut cabang admin.
 */
function prosesDaftarHpToko(d) {
  const pesanUmum = 'Username atau password salah, atau akun bukan admin';
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) {
    return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' });
  }

  const username = String(d.username || '').trim().toLowerCase();
  const password = String(d.password || '');
  if (!username || !password || password.length > 100) {
    return respon({ status: 'gagal', pesan: pesanUmum });
  }

  // Lokasi wajib; tipe dan rentang divalidasi di server (jangan percaya client).
  const lat = d.lat, lng = d.lng, akurasi = d.akurasi;
  if (typeof lat !== 'number' || typeof lng !== 'number' || typeof akurasi !== 'number' ||
      !isFinite(lat) || !isFinite(lng) || !isFinite(akurasi) ||
      Math.abs(lat) > 90 || Math.abs(lng) > 180 || akurasi < 0 || akurasi > 100000) {
    return respon({ status: 'gagal', kode: 'LOKASI_DITOLAK', pesan: 'Lokasi HP wajib dan harus valid. Izinkan akses lokasi lalu coba lagi.' });
  }
  const akurasiBulat = Math.round(akurasi);

  const akun = bacaSheet('akun');
  const admin = akun.data.find(function (r) {
    return String(r.nama).trim().toLowerCase() === username && r.role === 'ADMIN';
  });
  if (!admin || admin.aktif !== true || admin.terkunci === true || admin.ganti_pw === true) {
    return respon({ status: 'gagal', pesan: pesanUmum });
  }

  if (hashDenganGaram(password, String(admin.id), kodeRahasia) !== admin.pw_hash) {
    const salahBaru = (Number(admin.salah_login) || 0) + 1;
    if (salahBaru >= 5) {
      perbaruiKolom(akun, admin, { salah_login: salahBaru, terkunci: true });
      tambahLog({
        jenis: 'KEAMANAN', oleh: admin.id, cabang: admin.cabang, aksi: 'KUNCI_AKUN',
        target: 'akun', id: admin.id, sebelum: 'terkunci=FALSE', sesudah: 'terkunci=TRUE',
        alasan: 'Password salah 5 kali saat daftar HP toko'
      });
    } else {
      perbaruiKolom(akun, admin, { salah_login: salahBaru });
    }
    return respon({ status: 'gagal', pesan: pesanUmum });
  }
  if (Number(admin.salah_login) !== 0) {
    perbaruiKolom(akun, admin, { salah_login: 0 });
  }

  const kodeCabang = ambilKodeCabang(admin.cabang);
  if (!kodeCabang) {
    return respon({ status: 'gagal', pesan: 'Kode cabang ' + admin.cabang + ' belum diisi di sheet pengaturan (kategori CABANG)' });
  }

  // Cek lokasi terhadap koordinat cabang (sheet pengaturan: kategori LOKASI, nama = nama cabang).
  const toko = ambilLokasiCabang(admin.cabang);
  if (!toko) {
    return respon({
      status: 'gagal', kode: 'LOKASI_DITOLAK',
      pesan: 'Koordinat Cabang ' + admin.cabang + ' belum diisi atau tidak valid di sheet pengaturan (kategori LOKASI). Hubungi owner.'
    });
  }
  const akurasiMaks = ambilNilaiUmum('akurasi_maks_m', 100);
  const radiusDaftar = ambilNilaiUmum('radius_daftar_m', 100);
  if (akurasi > akurasiMaks) {
    return respon({
      status: 'gagal', kode: 'LOKASI_DITOLAK',
      pesan: 'Lokasi kurang akurat (' + akurasiBulat + ' m), coba lagi dekat jendela atau di luar'
    });
  }
  const jarak = Math.round(jarakMeter(lat, lng, toko.lat, toko.lng));
  if (jarak > radiusDaftar) {
    return respon({
      status: 'gagal', kode: 'LOKASI_DITOLAK',
      pesan: 'Anda berjarak ' + jarak + ' m dari Cabang ' + admin.cabang + ' (maksimal ' + radiusDaftar + ' m)'
    });
  }

  const kunciLock = LockService.getScriptLock();
  kunciLock.waitLock(15000);
  try {
    // Nomor HP = nomor terbesar yang pernah ada di cabang ini + 1 (termasuk yang tidak aktif).
    const polaId = new RegExp('^HPT-' + kodeCabang + '-(\\d+)$');
    let maks = 0;
    bacaSheet('akun').data.forEach(function (r) {
      const m = polaId.exec(String(r.id));
      if (r.role === 'PERANGKAT' && m) { maks = Math.max(maks, Number(m[1])); }
    });
    const nomor = maks + 1;
    const idHp = 'HPT-' + kodeCabang + '-' + ('0' + nomor).slice(-2);

    let namaHp = String(d.nama_hp || '').trim().slice(0, 40);
    if (!namaHp || namaHp === 'HP Toko') { namaHp = 'HP Toko ' + nomor; }

    const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    const gps = lat + ',' + lng + ',' + akurasiBulat;

    const baru = {};
    akun.header.forEach(function (nama) { baru[nama] = ''; });
    baru.id = idHp;
    baru.nama = namaHp;
    baru.panggilan = namaHp;
    baru.cabang = admin.cabang;
    baru.role = 'PERANGKAT';
    baru.pw_hash = hashTokenHp(token);
    baru.aktif = true;
    baru.ganti_pw = false;
    baru.ganti_pin = false;
    baru.salah_login = 0;
    baru.terkunci = false;
    akun.sheet.appendRow(akun.header.map(function (nama) { return baru[nama]; }));
    const barisBaru = akun.sheet.getLastRow();
    const kolGps = akun.header.indexOf('gps_daftar') + 1;
    if (kolGps > 0) {
      const sel = akun.sheet.getRange(barisBaru, kolGps);
      sel.setNumberFormat('@');
      sel.setValue(gps);
    }

    tambahLog({
      jenis: 'PERANGKAT', oleh: admin.id, cabang: admin.cabang, aksi: 'DAFTAR_HP_TOKO',
      target: namaHp, id: idHp,
      sesudah: lat + ',' + lng,   // sendiri di satu sel, bisa ditempel ke Google Maps
      alasan: 'akurasi ' + akurasiBulat + ' m, jarak ke toko ' + jarak + ' m'
    });

    return respon({
      status: 'ok',
      token: token,
      id_hp: idHp,
      nama_hp: namaHp,
      cabang: admin.cabang,
      kode_perangkat: 'T' + nomor
    });
  } finally {
    kunciLock.releaseLock();
  }
}

/** Koordinat cabang { lat, lng } dari pengaturan (kategori LOKASI, nilai "lat,lng"), atau null kalau tidak ada/tidak valid. */
function ambilLokasiCabang(cabang) {
  const baris = bacaSheet('pengaturan').data.find(function (r) { return r.kategori === 'LOKASI' && r.nama === cabang; });
  if (!baris) { return null; }
  const bagian = String(baris.nilai).split(',');
  if (bagian.length !== 2) { return null; }
  const lat = Number(bagian[0].trim()), lng = Number(bagian[1].trim());
  if (bagian[0].trim() === '' || bagian[1].trim() === '' || !isFinite(lat) || !isFinite(lng) ||
      Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return { lat: lat, lng: lng };
}

/** Jarak dua titik di bumi dalam meter (rumus haversine). */
function jarakMeter(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = function (x) { return x * Math.PI / 180; };
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Kode cabang 3 huruf dari sheet pengaturan (kategori CABANG, nama = nama cabang, nilai = kode). */
function ambilKodeCabang(cabang) {
  const baris = bacaSheet('pengaturan').data.find(function (r) { return r.kategori === 'CABANG' && r.nama === cabang; });
  const kode = baris ? String(baris.nilai).trim().toUpperCase() : '';
  return /^[A-Z]{3}$/.test(kode) ? kode : '';
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
  // Teks seperti "-7.6,111.4,20" jangan sampai diubah Sheets jadi angka: paksa format teks.
  const kolSesudah = log.header.indexOf('sesudah') + 1;
  if (kolSesudah > 0 && /^[-\d.,\s]+$/.test(String(baris.sesudah)) && String(baris.sesudah) !== '') {
    const sel = log.sheet.getRange(log.sheet.getLastRow(), kolSesudah);
    sel.setNumberFormat('@');
    sel.setValue(String(baris.sesudah));
  }
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
