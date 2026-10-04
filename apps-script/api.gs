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
  const aksiBertoken = ['daftar_karyawan', 'absen_masuk', 'simpan_alasan', 'absen_pulang', 'simpan_pulang'];
  if (aksiBertoken.indexOf(data.aksi) !== -1) {
    const hp = validasiTokenHp(data.token);
    if (!hp) {
      return respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' });
    }
    if (data.aksi === 'daftar_karyawan') { return prosesDaftarKaryawan(hp); }
    if (data.aksi === 'absen_masuk') { return prosesAbsenMasuk(data.id, data.pin, hp); }
    if (data.aksi === 'absen_pulang') { return prosesAbsenPulang(data.id, data.pin, data.jenis, hp); }
    if (data.aksi === 'simpan_pulang') { return prosesSimpanPulang(data.id, data.kode_pending, data.keterangan, hp); }
    return prosesSimpanAlasan(data.id, data.kode_alasan, data.alasan, hp);
  }

  return respon({ status: 'gagal', pesan: 'Aksi tidak dikenali.' });
}

function prosesAbsenMasuk(id, pin, hp) {
  const cek = cekKaryawanDanPin(id, pin, hp);
  if (cek.gagal) { return cek.gagal; }
  const akunDitemukan = cek.akun;

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

/**
 * Cari karyawan di cabang HP toko ini dan cek PIN-nya (dipakai absen masuk dan pulang).
 * Kembalian: { akun } kalau lolos, atau { gagal: <respon JSON> } kalau ditolak.
 * Salah PIN menaikkan salah_login; 5x berturut-turut = akun terkunci + dicatat ke log.
 */
function cekKaryawanDanPin(id, pin, hp) {
  if (!id || !pin) {
    return { gagal: respon({ status: 'gagal', pesan: 'id dan pin wajib diisi' }) };
  }

  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) {
    return { gagal: respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }) };
  }

  const akun = bacaSheet('akun');
  const akunDitemukan = akun.data.find(function (r) { return String(r.id) === String(id); });

  // Karyawan harus dari cabang HP toko ini (dicek sebelum PIN, jadi tidak menaikkan salah_login).
  // Hanya KARYAWAN/ADMIN yang boleh absen lewat sini.
  if (!akunDitemukan || akunDitemukan.cabang !== hp.cabang ||
      (akunDitemukan.role !== 'KARYAWAN' && akunDitemukan.role !== 'ADMIN')) {
    // Sengaja pesan disamakan dengan "PIN salah" supaya id karyawan tidak bisa ditebak-tebak.
    return { gagal: respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' }) };
  }

  if (akunDitemukan.terkunci === true) {
    return { gagal: respon({ status: 'gagal', pesan: 'Akun terkunci, hubungi admin' }) };
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
      return { gagal: respon({ status: 'gagal', pesan: 'Akun terkunci, hubungi admin' }) };
    }
    perbaruiKolom(akun, akunDitemukan, { salah_login: salahBaru });
    return { gagal: respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' }) };
  }

  if (Number(akunDitemukan.salah_login) !== 0) {
    perbaruiKolom(akun, akunDitemukan, { salah_login: 0 });
  }
  return { akun: akunDitemukan };
}

/**
 * ---- Absen pulang ----
 * Semua dihitung di server dari jam server. Jam pulang dan toleransi dibaca dari
 * sheet shift (shift yang tercatat di baris absensi hari itu), tidak ditulis di kode.
 *
 * Alur: absen_pulang (id, pin, jenis PULANG | PULANG_LEMBUR).
 *  - PULANG NORMAL: langsung tersimpan.
 *  - PULANG CEPAT atau LEMBUR: alasan/keterangan WAJIB. Jam saat PIN benar dicatat di
 *    cache (5 menit) dan balasannya meminta keterangan; BARU tersimpan ke sheet lewat
 *    aksi simpan_pulang (kode_pending + keterangan). Tidak ada keterangan = tidak tersimpan.
 * Aplikasi tidak menyimpan angka rupiah lembur; kolom `lembur` berisi "tingkat|menit".
 */

/**
 * Fungsi murni (tanpa sheet/cache/jam sistem): tentukan status pulang.
 *  detik     = jam sekarang dalam detik sejak 00:00
 *  shift     = { masuk, tutup, pulang: 'HH:mm', toleransi: menit }
 *  jenis     = 'PULANG' | 'PULANG_LEMBUR'
 *  sudahMasuk, sudahPulang = boolean (kondisi baris absensi hari ini)
 * Kembalian: { ok:false, pesan } atau
 *  { ok:true, st_pulang, keterangan:'ALASAN_PULANG_AWAL'|'PEKERJAAN_LEMBUR'|null,
 *    acc:'MENUNGGU'|'', tingkat, durasi_menit }
 */
function tentukanStatusPulang(detik, shift, jenis, sudahMasuk, sudahPulang) {
  if (!sudahMasuk) { return { ok: false, pesan: 'Belum absen masuk hari ini' }; }
  if (sudahPulang) { return { ok: false, pesan: 'Sudah absen pulang hari ini' }; }
  if (jenis !== 'PULANG' && jenis !== 'PULANG_LEMBUR') { return { ok: false, pesan: 'Jenis absen pulang tidak dikenal' }; }

  const detikPulang = jamKeDetik(shift.pulang);
  const detikTutup = jamKeDetik(shift.tutup);
  const batasLembur = detikPulang + (Number(shift.toleransi) + 1) * 60; // 1 menit setelah toleransi

  if (jenis === 'PULANG_LEMBUR') {
    if (detik < batasLembur) {
      return { ok: false, pesan: 'Lembur baru bisa dicatat mulai ' + detikKeJam(batasLembur) };
    }
    const durasiDetik = detik - detikPulang;
    // Tepat di batas masuk tingkat bawah: 60:00 = tingkat 1, 120:00 = tingkat 2.
    const tingkat = durasiDetik <= 3600 ? 1 : (durasiDetik <= 7200 ? 2 : 3);
    return {
      ok: true, st_pulang: 'LEMBUR DI TOKO', keterangan: 'PEKERJAAN_LEMBUR', acc: 'MENUNGGU',
      tingkat: tingkat, durasi_menit: Math.floor(durasiDetik / 60)
    };
  }

  if (detik < detikPulang) {
    // Sampai 1 menit setelah jam tutup (mis. 16:00:59) wajib ACC admin; sesudahnya tanpa ACC.
    return {
      ok: true, st_pulang: 'PULANG CEPAT', keterangan: 'ALASAN_PULANG_AWAL',
      acc: detik < detikTutup + 60 ? 'MENUNGGU' : '', tingkat: 0, durasi_menit: 0
    };
  }
  return { ok: true, st_pulang: 'PULANG NORMAL', keterangan: null, acc: '', tingkat: 0, durasi_menit: 0 };
}

var KUNCI_PULANG_PENDING = 'pulang_pending_';

/** Baris absensi karyawan hari ini + info shift-nya; atau { gagal }. */
function bacaKondisiPulang(akunDitemukan, tanggalHariIni) {
  const absensi = bacaSheet('absensi');
  const baris = absensi.data.find(function (r) {
    return String(r.karyawan) === String(akunDitemukan.id) && sebagaiTanggalTeks(r.tanggal, ZONA_ABSEN) === tanggalHariIni;
  }) || null;
  const sudahMasuk = !!baris && String(baris.masuk) !== '';
  const sudahPulang = !!baris && String(baris.pulang) !== '';
  let shift = null;
  if (baris) {
    shift = bacaShiftCabang(akunDitemukan.cabang).find(function (sh) { return String(sh.no) === String(baris.shift); }) || null;
    if (shift && shift.toleransi === null) { shift.toleransi = ambilNilaiUmum('toleransi_pulang_menit', 5); }
  }
  return { absensi: absensi, baris: baris, sudahMasuk: sudahMasuk, sudahPulang: sudahPulang, shift: shift };
}

function prosesAbsenPulang(id, pin, jenis, hp) {
  const cek = cekKaryawanDanPin(id, pin, hp);
  if (cek.gagal) { return cek.gagal; }
  const akunDitemukan = cek.akun;

  const sekarang = new Date();
  const tanggalHariIni = Utilities.formatDate(sekarang, ZONA_ABSEN, 'yyyy-MM-dd');
  const jamSekarang = Utilities.formatDate(sekarang, ZONA_ABSEN, 'HH:mm');
  const detik = Number(Utilities.formatDate(sekarang, ZONA_ABSEN, 'H')) * 3600 +
    Number(Utilities.formatDate(sekarang, ZONA_ABSEN, 'm')) * 60 +
    Number(Utilities.formatDate(sekarang, ZONA_ABSEN, 's'));

  if (jenis === 'PULANG_LEMBUR' && akunDitemukan.role === 'ADMIN') {
    return respon({ status: 'gagal', pesan: 'Admin tidak mencatat lembur' });
  }

  const kondisi = bacaKondisiPulang(akunDitemukan, tanggalHariIni);
  if (kondisi.baris && kondisi.sudahMasuk && !kondisi.sudahPulang && !kondisi.shift) {
    return respon({ status: 'gagal', pesan: 'Jadwal shift karyawan tidak ditemukan, hubungi admin' });
  }
  const hasil = tentukanStatusPulang(detik, kondisi.shift, jenis, kondisi.sudahMasuk, kondisi.sudahPulang);
  if (!hasil.ok) {
    return respon({ status: 'gagal', pesan: hasil.pesan });
  }

  const info = {
    id: akunDitemukan.id, nama: akunDitemukan.nama, panggilan: akunDitemukan.panggilan,
    tanggal: tanggalHariIni, jam: jamSekarang, shift: kondisi.shift.nama,
    st_pulang: hasil.st_pulang, acc: hasil.acc, tingkat: hasil.tingkat, durasi_menit: hasil.durasi_menit
  };

  if (hasil.keterangan) {
    // Wajib ada keterangan: simpan dulu di cache (jam = saat PIN benar), tulis ke sheet setelah diisi.
    info.kategori = hasil.keterangan;
    info.kode = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    CacheService.getScriptCache().put(KUNCI_PULANG_PENDING + akunDitemukan.id, JSON.stringify(info), 300);
    return respon({
      status: 'ok', perlu_keterangan: true, kode_pending: info.kode,
      jenis_keterangan: hasil.keterangan, pilihan: ambilDaftarPengaturan(hasil.keterangan),
      nama: info.nama, panggilan: info.panggilan, jam: info.jam, shift: info.shift,
      st_pulang: info.st_pulang, acc: info.acc, tingkat: info.tingkat, durasi_menit: info.durasi_menit
    });
  }

  tulisPulang(kondisi, info, '');
  return respon(balasanPulang(info));
}

/** Aksi simpan_pulang: lengkapi PULANG CEPAT / LEMBUR dengan keterangan, lalu tulis ke sheet. */
function prosesSimpanPulang(id, kode, ket, hp) {
  if (!id || !kode) { return respon({ status: 'gagal', pesan: 'Data tidak lengkap' }); }
  const cache = CacheService.getScriptCache();
  const mentah = cache.get(KUNCI_PULANG_PENDING + id);
  const info = mentah ? JSON.parse(mentah) : null;
  if (!info || info.kode !== String(kode)) {
    return respon({ status: 'gagal', pesan: 'Waktu mengisi keterangan sudah habis, ulangi absen pulang' });
  }

  const akun = bacaSheet('akun').data.find(function (r) { return String(r.id) === String(id); });
  if (!akun || akun.cabang !== hp.cabang) {
    return respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' });
  }

  const v = validasiKeterangan(info.kategori, ket);
  if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }

  const kondisi = bacaKondisiPulang(akun, info.tanggal);
  if (!kondisi.sudahMasuk) { return respon({ status: 'gagal', pesan: 'Belum absen masuk hari ini' }); }
  if (kondisi.sudahPulang) { return respon({ status: 'gagal', pesan: 'Sudah absen pulang hari ini' }); }

  tulisPulang(kondisi, info, v.teks);
  cache.remove(KUNCI_PULANG_PENDING + id);
  return respon(balasanPulang(info));
}

/** Pilihan harus ada di daftar pengaturan; "Lainnya" wajib teks; teks maksimal 100 karakter. */
function validasiKeterangan(kategori, ket) {
  const pilihan = ket && ket.pilihan ? String(ket.pilihan) : '';
  const teks = ket && ket.teks ? String(ket.teks).trim() : '';
  if (ambilDaftarPengaturan(kategori).indexOf(pilihan) === -1) { return { ok: false, pesan: 'Pilihan tidak dikenal' }; }
  if (teks.length > 100) { return { ok: false, pesan: 'Keterangan maksimal 100 karakter' }; }
  if (pilihan === 'Lainnya' && !teks) { return { ok: false, pesan: 'Keterangan wajib diisi kalau memilih Lainnya' }; }
  return { ok: true, teks: teks ? pilihan + ': ' + teks : pilihan };
}

function tulisPulang(kondisi, info, keterangan) {
  const perubahan = {
    pulang: info.jam,
    st_pulang: info.st_pulang,
    ket_pulang: keterangan,
    cara_pulang: 'PIN',
    acc_pulang: info.acc
  };
  if (info.st_pulang === 'LEMBUR DI TOKO') { perubahan.lembur = info.tingkat + '|' + info.durasi_menit; }
  perbaruiKolom(kondisi.absensi, kondisi.baris, perubahan);
}

function balasanPulang(info) {
  return {
    status: 'ok', pesan: 'Absen pulang berhasil', st_pulang: info.st_pulang, jam: info.jam, shift: info.shift,
    nama: info.nama, panggilan: info.panggilan, acc: info.acc, tingkat: info.tingkat, durasi_menit: info.durasi_menit
  };
}

/**
 * Tes otomatis logika pulang. Jalankan dari editor Apps Script (pilih tesServer > Jalankan).
 * TIDAK menulis ke sheet absensi atau log; hanya memanggil fungsi murni dengan waktu simulasi.
 * Hasil tampil di Log eksekusi (dan jendela pesan kalau bisa).
 */
function tesServer() {
  const s1 = { masuk: '07:45', tutup: '16:00', pulang: '16:30', toleransi: 5 };
  const siang = { masuk: '13:45', tutup: '21:30', pulang: '22:00', toleransi: 5 };
  const detik = function (jam) {
    const p = jam.split(':');
    return Number(p[0]) * 3600 + Number(p[1]) * 60 + (p[2] ? Number(p[2]) : 0);
  };
  const baris = [];
  let gagal = 0;

  // sudahMasuk/sudahPulang default true/false
  function uji(nama, jam, shift, jenis, harap, sudahMasuk, sudahPulang) {
    const h = tentukanStatusPulang(detik(jam), shift, jenis,
      sudahMasuk === undefined ? true : sudahMasuk, sudahPulang === undefined ? false : sudahPulang);
    let lulus = h.ok === harap.ok;
    if (lulus && harap.ok) {
      ['st_pulang', 'keterangan', 'acc', 'tingkat', 'durasi_menit'].forEach(function (k) {
        if (harap[k] !== undefined && h[k] !== harap[k]) { lulus = false; }
      });
    }
    if (lulus && !harap.ok && harap.pesan && h.pesan.indexOf(harap.pesan) === -1) { lulus = false; }
    if (!lulus) { gagal++; }
    baris.push((lulus ? 'LULUS  ' : 'GAGAL  ') + nama + (lulus ? '' : '  -> hasil: ' + JSON.stringify(h)));
  }

  const CEPAT = { ok: true, st_pulang: 'PULANG CEPAT', keterangan: 'ALASAN_PULANG_AWAL' };
  const NORMAL = { ok: true, st_pulang: 'PULANG NORMAL', keterangan: null };
  const TOLAK = { ok: false };

  uji('16:29:00 PULANG = pulang cepat', '16:29:00', s1, 'PULANG', CEPAT);
  uji('16:29:59 PULANG = pulang cepat', '16:29:59', s1, 'PULANG', CEPAT);
  uji('16:30:00 PULANG = normal', '16:30:00', s1, 'PULANG', NORMAL);
  uji('16:35:00 PULANG = normal', '16:35:00', s1, 'PULANG', NORMAL);
  uji('16:36:00 PULANG = normal (jenis PULANG tetap normal)', '16:36:00', s1, 'PULANG', NORMAL);
  uji('15:59:59 PULANG = cepat + ACC menunggu', '15:59:59', s1, 'PULANG', { ok: true, st_pulang: 'PULANG CEPAT', acc: 'MENUNGGU' });
  uji('16:00:59 PULANG = cepat + ACC menunggu', '16:00:59', s1, 'PULANG', { ok: true, st_pulang: 'PULANG CEPAT', acc: 'MENUNGGU' });
  uji('16:01:00 PULANG = cepat tanpa ACC', '16:01:00', s1, 'PULANG', { ok: true, st_pulang: 'PULANG CEPAT', acc: '' });

  uji('16:29:00 PULANG_LEMBUR ditolak', '16:29:00', s1, 'PULANG_LEMBUR', TOLAK, true, false);
  uji('16:30:00 PULANG_LEMBUR ditolak', '16:30:00', s1, 'PULANG_LEMBUR', TOLAK);
  uji('16:35:00 PULANG_LEMBUR ditolak', '16:35:00', s1, 'PULANG_LEMBUR', TOLAK);
  uji('16:35:59 PULANG_LEMBUR ditolak', '16:35:59', s1, 'PULANG_LEMBUR', TOLAK);
  uji('16:36:00 PULANG_LEMBUR diterima, tingkat 1', '16:36:00', s1, 'PULANG_LEMBUR',
    { ok: true, st_pulang: 'LEMBUR DI TOKO', keterangan: 'PEKERJAAN_LEMBUR', acc: 'MENUNGGU', tingkat: 1, durasi_menit: 6 });
  uji('17:30:00 lembur tepat 60 menit = tingkat 1', '17:30:00', s1, 'PULANG_LEMBUR', { ok: true, tingkat: 1, durasi_menit: 60 });
  uji('17:30:01 lembur = tingkat 2', '17:30:01', s1, 'PULANG_LEMBUR', { ok: true, tingkat: 2 });
  uji('18:30:00 lembur tepat 120 menit = tingkat 2', '18:30:00', s1, 'PULANG_LEMBUR', { ok: true, tingkat: 2, durasi_menit: 120 });
  uji('18:30:01 lembur = tingkat 3', '18:30:01', s1, 'PULANG_LEMBUR', { ok: true, tingkat: 3 });

  uji('pulang dobel ditolak', '16:40:00', s1, 'PULANG', { ok: false, pesan: 'Sudah absen pulang' }, true, true);
  uji('lembur dobel ditolak', '17:40:00', s1, 'PULANG_LEMBUR', { ok: false, pesan: 'Sudah absen pulang' }, true, true);
  uji('pulang tanpa absen masuk ditolak', '16:40:00', s1, 'PULANG', { ok: false, pesan: 'Belum absen masuk' }, false, false);
  uji('jenis tidak dikenal ditolak', '16:40:00', s1, 'LAIN', TOLAK);

  uji('shift siang 21:59:00 = pulang cepat', '21:59:00', siang, 'PULANG', CEPAT);
  uji('shift siang 22:00:00 = normal', '22:00:00', siang, 'PULANG', NORMAL);
  uji('shift siang 22:05:59 lembur ditolak', '22:05:59', siang, 'PULANG_LEMBUR', TOLAK);
  uji('shift siang 22:06:00 lembur tingkat 1', '22:06:00', siang, 'PULANG_LEMBUR', { ok: true, tingkat: 1, durasi_menit: 6 });
  uji('shift siang 23:00:00 lembur tingkat 1', '23:00:00', siang, 'PULANG_LEMBUR', { ok: true, tingkat: 1 });
  uji('shift siang 23:00:01 lembur tingkat 2', '23:00:01', siang, 'PULANG_LEMBUR', { ok: true, tingkat: 2 });

  const ringkas = (gagal === 0 ? 'SEMUA LULUS' : gagal + ' SKENARIO GAGAL') + ' (' + baris.length + ' skenario)';
  const teks = baris.join('\n') + '\n\n' + ringkas;
  Logger.log(teks);
  try { SpreadsheetApp.getUi().alert(ringkas + '\n\nRincian ada di Log eksekusi.'); } catch (e) { /* tanpa jendela pesan */ }
  return teks;
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
