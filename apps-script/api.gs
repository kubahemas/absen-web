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

  // Aksi owner dan logout memakai tiket sesi login (bukan token HP toko).
  if (data.aksi === 'login_owner') { return prosesLoginOwner(data); }
  if (data.aksi === 'atur_password_owner') { return prosesAturPasswordOwner(data); }
  if (data.aksi === 'owner_beranda') { return prosesOwnerBeranda(data.sesi); }
  if (data.aksi === 'owner_nonaktifkan_hp') { return prosesOwnerNonaktifkanHp(data.sesi, data.id_hp); }
  if (data.aksi === 'owner_keluarkan_semua') { return prosesOwnerKeluarkanSemua(data.sesi); }
  if (data.aksi === 'owner_ganti_password') { return prosesOwnerGantiPassword(data.sesi, data.lama, data.baru); }
  if (data.aksi === 'logout') { return prosesLogout(data.sesi); }

  // Semua aksi lain wajib menyertakan token HP toko yang terdaftar.
  const aksiBertoken = ['daftar_karyawan', 'tiket_waktu', 'absen_masuk', 'simpan_alasan', 'absen_pulang', 'simpan_pulang', 'login_admin_toko'];
  if (aksiBertoken.indexOf(data.aksi) !== -1) {
    const hp = validasiTokenHp(data.token);
    if (!hp) {
      return respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' });
    }
    if (data.aksi === 'daftar_karyawan') { return prosesDaftarKaryawan(hp); }
    if (data.aksi === 'tiket_waktu') { return prosesTiketWaktu(data.jenis, hp); }
    if (data.aksi === 'login_admin_toko') { return prosesLoginAdminToko(data, hp); }
    if (data.aksi === 'absen_masuk') { return prosesAbsenMasuk(data.id, data.pin, hp, data.tiket); }
    if (data.aksi === 'absen_pulang') { return prosesAbsenPulang(data.id, data.pin, data.jenis, hp, data.tiket); }
    if (data.aksi === 'simpan_pulang') { return prosesSimpanPulang(data.id, data.kode_pending, data.keterangan, hp); }
    return prosesSimpanAlasan(data.id, data.kode_alasan, data.alasan, hp);
  }

  return respon({ status: 'gagal', pesan: 'Aksi tidak dikenali.' });
}

/**
 * ---- Tiket waktu ----
 * Jam absen = saat TOMBOL ditekan, bukan saat PIN dimasukkan. Begitu tombol ditekan, HP
 * minta tiket (aksi tiket_waktu): jam server + jenis + cabang + masa berlaku, ditandatangani
 * HMAC dengan KODE_RAHASIA. Saat PIN dikirim, tiket ikut; server memverifikasinya dan
 * menghitung SEMUA status dari jam di tiket. Jam dari client tidak pernah dipercaya.
 * Tiket sekali pakai untuk absen yang berhasil; PIN salah tidak menghabiskan tiket.
 */
var PESAN_TIKET = 'Waktu habis, tekan tombolnya lagi';

function kunciTiket() {
  const k = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  return k ? k + '|tiket' : '';
}

/** Buat tiket: base64url(payload JSON) + "." + base64url(HMAC-SHA256). */
function buatTiket(payload, kunci) {
  const p = Utilities.base64EncodeWebSafe(JSON.stringify(payload), Utilities.Charset.UTF_8);
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(p, kunci));
  return p + '.' + sig;
}

function samaAman(a, b) {
  if (a.length !== b.length) { return false; }
  let beda = 0;
  for (let i = 0; i < a.length; i++) { beda |= a.charCodeAt(i) ^ b.charCodeAt(i); }
  return beda === 0;
}

/**
 * Fungsi murni (tidak menyentuh sheet/cache): periksa tanda tangan, jenis, cabang, masa berlaku.
 * Kembalian: { ok:true, t (ms jam tombol ditekan), nonce } atau { ok:false, pesan }.
 */
function periksaTiket(tiket, jenis, cabang, kunci, sekarangMs) {
  const gagal = { ok: false, pesan: PESAN_TIKET };
  if (typeof tiket !== 'string' || tiket.length > 600) { return gagal; }
  const bagian = tiket.split('.');
  if (bagian.length !== 2) { return gagal; }
  let sigBenar;
  try {
    sigBenar = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(bagian[0], kunci));
  } catch (e) { return gagal; }
  if (!samaAman(sigBenar, bagian[1])) { return gagal; }
  let p;
  try {
    p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(bagian[0])).getDataAsString());
  } catch (e) { return gagal; }
  if (!p || p.j !== jenis || p.c !== cabang || typeof p.t !== 'number' || typeof p.e !== 'number' || !p.n) { return gagal; }
  if (sekarangMs > p.e || p.t > sekarangMs + 5000) { return gagal; }
  return { ok: true, t: p.t, nonce: String(p.n) };
}

/** Jam Jakarta dari ms epoch: { tanggal 'yyyy-MM-dd', jam 'HH:mm', detik sejak 00:00 }. */
function waktuDariMs(ms) {
  const d = new Date(ms);
  const f = function (pola) { return Utilities.formatDate(d, ZONA_ABSEN, pola); };
  return { tanggal: f('yyyy-MM-dd'), jam: f('HH:mm'), detik: Number(f('H')) * 3600 + Number(f('m')) * 60 + Number(f('s')) };
}

/** Tandai tiket terpakai. false kalau sudah pernah dipakai. cache = objek dengan get/put. */
function klaimTiket(nonce, cache) {
  const k = 'tiket_pakai_' + nonce;
  if (cache.get(k)) { return false; }
  cache.put(k, '1', 21600);
  return true;
}

function klaimTiketServer(nonce) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    return klaimTiket(nonce, CacheService.getScriptCache());
  } finally {
    lock.releaseLock();
  }
}

/** Aksi tiket_waktu: jenis MASUK | PULANG | LEMBUR. Wajib token HP toko (dicek di doPost). */
function prosesTiketWaktu(jenis, hp) {
  if (jenis !== 'MASUK' && jenis !== 'PULANG' && jenis !== 'LEMBUR') {
    return respon({ status: 'gagal', pesan: 'Jenis tiket tidak dikenal' });
  }
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const menit = ambilNilaiUmum('tiket_absen_menit', 3);
  const t = Date.now();
  const tiket = buatTiket({
    j: jenis, t: t, e: t + menit * 60000, c: hp.cabang, n: Utilities.getUuid().replace(/-/g, '').slice(0, 16)
  }, kunci);
  return respon({ status: 'ok', tiket: tiket, jam_server: Utilities.formatDate(new Date(t), ZONA_ABSEN, 'yyyy-MM-dd HH:mm:ss') });
}

/**
 * Fungsi murni: status absen masuk dari jam (detik sejak 00:00) dan shift { masuk }.
 * < 60 detik setelah jam masuk = HADIR; mulai 60 detik = TELAT (menit dibulatkan ke bawah).
 */
function tentukanStatusMasuk(detik, shift, jendelaMenit) {
  const detikMasuk = jamKeDetik(shift.masuk);
  if (detik < detikMasuk - jendelaMenit * 60) {
    return { ok: false, pesan: 'Absen masuk belum dibuka, mulai ' + detikKeJam(detikMasuk - jendelaMenit * 60) };
  }
  const selisih = detik - detikMasuk;
  if (selisih >= 60) { return { ok: true, st_masuk: 'TELAT', telat_mnt: Math.floor(selisih / 60) }; }
  return { ok: true, st_masuk: 'HADIR', telat_mnt: 0 };
}

function prosesAbsenMasuk(id, pin, hp, tiket) {
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const tk = periksaTiket(tiket, 'MASUK', hp.cabang, kunci, Date.now());
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }

  const cek = cekKaryawanDanPin(id, pin, hp);
  if (cek.gagal) { return cek.gagal; }
  const akunDitemukan = cek.akun;

  // Semua waktu dari tiket (saat tombol ditekan).
  const zona = ZONA_ABSEN;
  const w = waktuDariMs(tk.t);
  const tanggalHariIni = w.tanggal;
  const jamSekarang = w.jam;
  const detikSekarang = w.detik;

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
  const status = tentukanStatusMasuk(detikSekarang, shiftKaryawan, ambilNilaiUmum('jendela_absen_menit', 60));
  if (!status.ok) { return respon({ status: 'gagal', pesan: status.pesan }); }
  const telat = status.st_masuk === 'TELAT';
  const telatMnt = status.telat_mnt;

  // Tiket sekali pakai: hanya dihabiskan kalau absen benar-benar akan ditulis.
  if (!klaimTiketServer(tk.nonce)) { return respon({ status: 'gagal', pesan: PESAN_TIKET }); }

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
 * Hasil validasi di-cache 60 detik (kunci = hash token), jadi menghapus baris
 * atau mengubah aktif jadi FALSE baru berlaku maksimal 60 detik kemudian (kecuali lewat tombol Nonaktifkan owner, yang menghapus cache langsung).
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
  cache.put(kunci, JSON.stringify(hp), 60);
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
 *  - PULANG CEPAT atau LEMBUR: alasan/keterangan WAJIB. Jam saat TOMBOL ditekan (jam tiket) dicatat di
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
 *  stSebelumnya = st_pulang yang sudah tercatat hari ini (kalau sudahPulang)
 * Kembalian: { ok:false, pesan } atau
 *  { ok:true, st_pulang, keterangan:'ALASAN_PULANG_AWAL'|'PEKERJAAN_LEMBUR'|null,
 *    acc:'MENUNGGU'|'', tingkat, durasi_menit, perubahan:''|'GANTI'|'REVISI' }
 *  perubahan GANTI = pulang normal diganti jadi lembur; REVISI = lembur diperbarui.
 */
function tentukanStatusPulang(detik, shift, jenis, sudahMasuk, sudahPulang, stSebelumnya) {
  if (!sudahMasuk) { return { ok: false, pesan: 'Belum absen masuk hari ini' }; }
  if (jenis !== 'PULANG' && jenis !== 'PULANG_LEMBUR') { return { ok: false, pesan: 'Jenis absen pulang tidak dikenal' }; }

  // Sudah absen pulang: PULANG biasa ditolak. LEMBUR boleh kalau sebelumnya PULANG NORMAL
  // ("Ganti jadi lembur") atau LEMBUR DI TOKO ("Revisi lembur"); PULANG CEPAT tidak boleh.
  let perubahan = '';
  if (sudahPulang) {
    if (jenis === 'PULANG') { return { ok: false, pesan: 'Sudah absen pulang hari ini' }; }
    if (stSebelumnya === 'PULANG NORMAL') { perubahan = 'GANTI'; }
    else if (stSebelumnya === 'LEMBUR DI TOKO') { perubahan = 'REVISI'; }
    else { return { ok: false, pesan: 'Pulang awal tidak bisa diganti jadi lembur' }; }
  }

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
      tingkat: tingkat, durasi_menit: Math.floor(durasiDetik / 60), perubahan: perubahan
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
  return {
    absensi: absensi, baris: baris, sudahMasuk: sudahMasuk, sudahPulang: sudahPulang, shift: shift,
    stPulang: baris ? String(baris.st_pulang) : ''
  };
}

function prosesAbsenPulang(id, pin, jenis, hp, tiket) {
  if (jenis !== 'PULANG' && jenis !== 'PULANG_LEMBUR') {
    return respon({ status: 'gagal', pesan: 'Jenis absen pulang tidak dikenal' });
  }
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const tk = periksaTiket(tiket, jenis === 'PULANG_LEMBUR' ? 'LEMBUR' : 'PULANG', hp.cabang, kunci, Date.now());
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }

  const cek = cekKaryawanDanPin(id, pin, hp);
  if (cek.gagal) { return cek.gagal; }
  const akunDitemukan = cek.akun;

  // Semua waktu dari tiket (saat tombol ditekan).
  const w = waktuDariMs(tk.t);
  const tanggalHariIni = w.tanggal;
  const jamSekarang = w.jam;
  const detik = w.detik;

  if (jenis === 'PULANG_LEMBUR' && akunDitemukan.role === 'ADMIN') {
    return respon({ status: 'gagal', pesan: 'Admin tidak mencatat lembur' });
  }

  const kondisi = bacaKondisiPulang(akunDitemukan, tanggalHariIni);
  if (kondisi.baris && kondisi.sudahMasuk && !kondisi.shift) {
    return respon({ status: 'gagal', pesan: 'Jadwal shift karyawan tidak ditemukan, hubungi admin' });
  }
  const hasil = tentukanStatusPulang(detik, kondisi.shift, jenis, kondisi.sudahMasuk, kondisi.sudahPulang, kondisi.stPulang);
  if (!hasil.ok) {
    return respon({ status: 'gagal', pesan: hasil.pesan });
  }

  const info = {
    id: akunDitemukan.id, nama: akunDitemukan.nama, panggilan: akunDitemukan.panggilan, cabang: akunDitemukan.cabang,
    tanggal: tanggalHariIni, jam: jamSekarang, detik: detik, shift: kondisi.shift.nama,
    st_pulang: hasil.st_pulang, acc: hasil.acc, tingkat: hasil.tingkat, durasi_menit: hasil.durasi_menit,
    perubahan: hasil.perubahan || ''
  };

  // Tiket sekali pakai: dihabiskan begitu absen diterima (ditulis, atau ditahan menunggu keterangan).
  if (!klaimTiketServer(tk.nonce)) { return respon({ status: 'gagal', pesan: PESAN_TIKET }); }

  if (hasil.keterangan) {
    // Wajib ada keterangan: simpan dulu di cache (jam = saat tombol ditekan), tulis ke sheet setelah diisi.
    info.kategori = hasil.keterangan;
    info.kode = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    CacheService.getScriptCache().put(KUNCI_PULANG_PENDING + akunDitemukan.id, JSON.stringify(info), 300);
    return respon({
      status: 'ok', perlu_keterangan: true, kode_pending: info.kode,
      jenis_keterangan: hasil.keterangan, pilihan: ambilDaftarPengaturan(hasil.keterangan),
      nama: info.nama, panggilan: info.panggilan, jam: info.jam, shift: info.shift,
      st_pulang: info.st_pulang, acc: info.acc, tingkat: info.tingkat, durasi_menit: info.durasi_menit,
      perubahan: info.perubahan
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

  // Periksa ulang terhadap kondisi sheet sekarang (pakai jam tiket): jangan sampai
  // keadaan sudah berubah (misal sudah pulang dari HP lain) sejak keterangan diminta.
  const kondisi = bacaKondisiPulang(akun, info.tanggal);
  if (kondisi.baris && kondisi.sudahMasuk && !kondisi.shift) {
    return respon({ status: 'gagal', pesan: 'Jadwal shift karyawan tidak ditemukan, hubungi admin' });
  }
  const jenis = info.st_pulang === 'LEMBUR DI TOKO' ? 'PULANG_LEMBUR' : 'PULANG';
  const ulang = tentukanStatusPulang(info.detik, kondisi.shift, jenis, kondisi.sudahMasuk, kondisi.sudahPulang, kondisi.stPulang);
  if (!ulang.ok) { return respon({ status: 'gagal', pesan: ulang.pesan }); }
  if (ulang.st_pulang !== info.st_pulang || (ulang.perubahan || '') !== info.perubahan) {
    return respon({ status: 'gagal', pesan: 'Data absen berubah, ulangi absen pulang' });
  }

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

  // "Ganti jadi lembur" / "Revisi lembur": catat nilai sebelum dan sesudah di log.
  let sebelum = '';
  if (info.perubahan) { sebelum = ringkasanPulang(kondisi.absensi, kondisi.baris); }
  perbaruiKolom(kondisi.absensi, kondisi.baris, perubahan);
  if (info.perubahan) {
    tambahLog({
      jenis: 'ABSENSI', oleh: info.id, cabang: info.cabang,
      aksi: info.perubahan === 'GANTI' ? 'GANTI_JADI_LEMBUR' : 'REVISI_LEMBUR',
      target: 'absensi ' + info.tanggal, id: info.id,
      sebelum: sebelum, sesudah: ringkasanPulang(kondisi.absensi, kondisi.baris)
    });
  }
}

/** Ringkasan kolom pulang satu baris absensi (teks tampilan, supaya jam tidak berubah bentuk) untuk log. */
function ringkasanPulang(absensi, baris) {
  const ambil = function (kolom) {
    const idx = absensi.header.indexOf(kolom);
    return idx === -1 ? '' : String(absensi.sheet.getRange(baris._baris, idx + 1).getDisplayValue());
  };
  return 'pulang=' + ambil('pulang') + '; st=' + ambil('st_pulang') + '; lembur=' + ambil('lembur') +
    '; ket=' + ambil('ket_pulang') + '; acc=' + ambil('acc_pulang');
}

function balasanPulang(info) {
  return {
    status: 'ok', pesan: 'Absen pulang berhasil', st_pulang: info.st_pulang, jam: info.jam, shift: info.shift,
    nama: info.nama, panggilan: info.panggilan, acc: info.acc, tingkat: info.tingkat, durasi_menit: info.durasi_menit,
    perubahan: info.perubahan
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
  // stSebelumnya = st_pulang yang sudah tercatat (untuk skenario sudah pulang)
  function uji(nama, jam, shift, jenis, harap, sudahMasuk, sudahPulang, stSebelumnya) {
    const h = tentukanStatusPulang(detik(jam), shift, jenis,
      sudahMasuk === undefined ? true : sudahMasuk, sudahPulang === undefined ? false : sudahPulang, stSebelumnya);
    let lulus = h.ok === harap.ok;
    if (lulus && harap.ok) {
      ['st_pulang', 'keterangan', 'acc', 'tingkat', 'durasi_menit', 'perubahan'].forEach(function (k) {
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
  uji('lembur kedua = revisi, jam diperbarui, ACC MENUNGGU', '18:40:00', s1, 'PULANG_LEMBUR',
    { ok: true, st_pulang: 'LEMBUR DI TOKO', acc: 'MENUNGGU', perubahan: 'REVISI', tingkat: 3, durasi_menit: 130 },
    true, true, 'LEMBUR DI TOKO');
  uji('revisi lembur tetap ACC ulang walau jam masih tingkat 1', '17:00:00', s1, 'PULANG_LEMBUR',
    { ok: true, acc: 'MENUNGGU', perubahan: 'REVISI', tingkat: 1, durasi_menit: 30 }, true, true, 'LEMBUR DI TOKO');
  uji('pulang normal lalu lembur = ganti jadi lembur', '17:00:00', s1, 'PULANG_LEMBUR',
    { ok: true, st_pulang: 'LEMBUR DI TOKO', acc: 'MENUNGGU', perubahan: 'GANTI', tingkat: 1, durasi_menit: 30 },
    true, true, 'PULANG NORMAL');
  uji('ganti jadi lembur sebelum 16:36 ditolak', '16:35:00', s1, 'PULANG_LEMBUR', TOLAK, true, true, 'PULANG NORMAL');
  uji('revisi lembur sebelum 16:36 ditolak', '16:20:00', s1, 'PULANG_LEMBUR', TOLAK, true, true, 'LEMBUR DI TOKO');
  uji('pulang cepat lalu lembur ditolak', '17:00:00', s1, 'PULANG_LEMBUR', { ok: false, pesan: 'Pulang awal' }, true, true, 'PULANG CEPAT');
  uji('pulang normal kedua ditolak', '17:00:00', s1, 'PULANG', { ok: false, pesan: 'Sudah absen pulang' }, true, true, 'PULANG NORMAL');
  uji('pulang biasa setelah lembur ditolak', '17:00:00', s1, 'PULANG', { ok: false, pesan: 'Sudah absen pulang' }, true, true, 'LEMBUR DI TOKO');
  uji('pulang tanpa absen masuk ditolak', '16:40:00', s1, 'PULANG', { ok: false, pesan: 'Belum absen masuk' }, false, false);
  uji('jenis tidak dikenal ditolak', '16:40:00', s1, 'LAIN', TOLAK);

  uji('shift siang 21:59:00 = pulang cepat', '21:59:00', siang, 'PULANG', CEPAT);
  uji('shift siang 22:00:00 = normal', '22:00:00', siang, 'PULANG', NORMAL);
  uji('shift siang 22:05:59 lembur ditolak', '22:05:59', siang, 'PULANG_LEMBUR', TOLAK);
  uji('shift siang 22:06:00 lembur tingkat 1', '22:06:00', siang, 'PULANG_LEMBUR', { ok: true, tingkat: 1, durasi_menit: 6 });
  uji('shift siang 23:00:00 lembur tingkat 1', '23:00:00', siang, 'PULANG_LEMBUR', { ok: true, tingkat: 1 });
  uji('shift siang 23:00:01 lembur tingkat 2', '23:00:01', siang, 'PULANG_LEMBUR', { ok: true, tingkat: 2 });

  // ---- Tiket waktu: jam yang dicatat = saat TOMBOL ditekan (jam di tiket), bukan saat PIN dikirim ----
  const KUNCI_UJI = 'kunci-uji-tiket';
  let nomorTiket = 0;
  const epoch = function (jam) { return Date.UTC(2026, 9, 5) - 7 * 3600000 + detik(jam) * 1000; }; // jam Jakarta 5 Okt 2026
  const bikinTiket = function (jenis, jamTombol, menit, cabang) {
    nomorTiket++;
    return buatTiket({ j: jenis, t: epoch(jamTombol), e: epoch(jamTombol) + menit * 60000, c: cabang || 'Ngawi', n: 'uji' + nomorTiket }, KUNCI_UJI);
  };
  function ujiBebas(nama, lulus, detail) {
    if (!lulus) { gagal++; }
    baris.push((lulus ? 'LULUS  ' : 'GAGAL  ') + nama + (lulus || !detail ? '' : '  -> ' + detail));
  }

  // 1. Tiket 07:45:50, PIN dikirim 07:46:10 = HADIR (dihitung dari jam tombol).
  const t1 = periksaTiket(bikinTiket('MASUK', '07:45:50', 3), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10'));
  const s1m = t1.ok ? tentukanStatusMasuk(waktuDariMs(t1.t).detik, s1, 60) : null;
  ujiBebas('tiket 07:45:50 + PIN 07:46:10 = HADIR', t1.ok && s1m.ok && s1m.st_masuk === 'HADIR' && waktuDariMs(t1.t).jam === '07:45', JSON.stringify(s1m));
  // pembanding: kalau jam PIN yang dipakai, hasilnya TELAT
  ujiBebas('(pembanding) jam 07:46:10 sendiri = TELAT 1 menit', tentukanStatusMasuk(detik('07:46:10'), s1, 60).telat_mnt === 1);

  // 2-5. Penolakan
  ujiBebas('tiket kedaluwarsa ditolak', !periksaTiket(bikinTiket('MASUK', '07:45:50', 3), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:49:00')).ok);
  ujiBebas('tiket masih berlaku di detik terakhir diterima', periksaTiket(bikinTiket('MASUK', '07:45:50', 3), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:48:50')).ok);
  ujiBebas('jenis salah ditolak (tiket PULANG dipakai MASUK)', !periksaTiket(bikinTiket('PULANG', '16:30:00', 3), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('16:30:10')).ok);
  ujiBebas('cabang salah ditolak', !periksaTiket(bikinTiket('MASUK', '07:45:50', 3, 'Pusat'), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10')).ok);
  ujiBebas('tiket dari masa depan ditolak', !periksaTiket(bikinTiket('MASUK', '07:50:00', 3), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:45:00')).ok);
  const asli = bikinTiket('MASUK', '07:45:50', 3);
  const bagianAsli = asli.split('.');
  const muatanPalsu = Utilities.base64EncodeWebSafe(JSON.stringify({ j: 'MASUK', t: epoch('07:40:00'), e: epoch('07:43:00') + 999999999, c: 'Ngawi', n: 'palsu' }), Utilities.Charset.UTF_8);
  ujiBebas('tanda tangan dimanipulasi (muatan diganti) ditolak', !periksaTiket(muatanPalsu + '.' + bagianAsli[1], 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10')).ok);
  ujiBebas('tanda tangan dirusak ditolak', !periksaTiket(bagianAsli[0] + '.' + bagianAsli[1].slice(0, -2) + 'AA', 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10')).ok);
  ujiBebas('tiket dengan kunci lain ditolak', !periksaTiket(asli, 'MASUK', 'Ngawi', 'kunci-lain', epoch('07:46:10')).ok);
  ujiBebas('tiket kosong/bukan teks ditolak', !periksaTiket('', 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10')).ok && !periksaTiket(null, 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10')).ok);

  // 6. Sekali pakai (cache tiruan, tanpa CacheService)
  const cacheTiruan = { d: {}, get: function (k) { return this.d[k] || null; }, put: function (k, v) { this.d[k] = v; } };
  ujiBebas('tiket dipakai dua kali: pertama diterima, kedua ditolak', klaimTiket('n-sekali', cacheTiruan) === true && klaimTiket('n-sekali', cacheTiruan) === false);

  // 7. Pulang dan lembur memakai jam tiket
  const tp = periksaTiket(bikinTiket('PULANG', '16:29:50', 3), 'PULANG', 'Ngawi', KUNCI_UJI, epoch('16:30:10'));
  const hp1 = tp.ok ? tentukanStatusPulang(waktuDariMs(tp.t).detik, s1, 'PULANG', true, false) : null;
  ujiBebas('pulang: tiket 16:29:50 + PIN 16:30:10 = PULANG CEPAT', tp.ok && hp1.ok && hp1.st_pulang === 'PULANG CEPAT', JSON.stringify(hp1));
  const tl1 = periksaTiket(bikinTiket('LEMBUR', '16:35:50', 3), 'LEMBUR', 'Ngawi', KUNCI_UJI, epoch('16:36:20'));
  const hl1 = tl1.ok ? tentukanStatusPulang(waktuDariMs(tl1.t).detik, s1, 'PULANG_LEMBUR', true, false) : null;
  ujiBebas('lembur: tiket 16:35:50 + PIN 16:36:20 = ditolak (tombol belum boleh)', tl1.ok && hl1.ok === false, JSON.stringify(hl1));
  const tl2 = periksaTiket(bikinTiket('LEMBUR', '16:36:05', 3), 'LEMBUR', 'Ngawi', KUNCI_UJI, epoch('16:36:40'));
  const hl2 = tl2.ok ? tentukanStatusPulang(waktuDariMs(tl2.t).detik, s1, 'PULANG_LEMBUR', true, false) : null;
  ujiBebas('lembur: tiket 16:36:05 = diterima, tingkat 1, jam pulang 16:36', tl2.ok && hl2.ok && hl2.tingkat === 1 && waktuDariMs(tl2.t).jam === '16:36', JSON.stringify(hl2));

  // ---- Owner: password, jalur pw_hash kosong, penahanan 15 menit, sesi 7 hari, keluarkan semua ----
  ujiBebas('password lemah ditolak: terlalu pendek (Abc1234)', !periksaKekuatanPassword('Abc1234', 'owner').ok);
  ujiBebas('password lemah ditolak: hanya huruf (abcdefgh)', !periksaKekuatanPassword('abcdefgh', 'owner').ok);
  ujiBebas('password lemah ditolak: hanya angka (12345678)', !periksaKekuatanPassword('12345678', 'owner').ok);
  ujiBebas('password lemah ditolak: 123456', !periksaKekuatanPassword('123456', 'owner').ok);
  ujiBebas('password lemah ditolak: sama dengan username (owner123 vs owner123)', !periksaKekuatanPassword('owner123', 'owner123').ok);
  ujiBebas('password lemah ditolak: sama dengan password lama', !periksaKekuatanPassword('KubahEmas2026', 'owner', 'KubahEmas2026').ok);
  ujiBebas('password valid diterima (KubahEmas2026)', periksaKekuatanPassword('KubahEmas2026', 'owner', 'lama12345').ok);

  const ownerKosong = { role: 'OWNER', aktif: true, pw_hash: '', ganti_pw: true };
  ujiBebas('jalur pw_hash kosong: OWNER diterima', jalurPasswordAwal(ownerKosong).boleh === true);
  ujiBebas('jalur pw_hash kosong: role ADMIN ditolak', jalurPasswordAwal({ role: 'ADMIN', aktif: true, pw_hash: '', ganti_pw: true }).boleh === false);
  ujiBebas('jalur pw_hash kosong: role KARYAWAN ditolak', jalurPasswordAwal({ role: 'KARYAWAN', aktif: true, pw_hash: '', ganti_pw: true }).boleh === false);
  ujiBebas('jalur pw_hash kosong: OWNER yang pw_hash-nya sudah terisi ditolak', jalurPasswordAwal({ role: 'OWNER', aktif: true, pw_hash: 'abc123', ganti_pw: true }).boleh === false);
  ujiBebas('jalur pw_hash kosong: OWNER dengan ganti_pw FALSE ditolak', jalurPasswordAwal({ role: 'OWNER', aktif: true, pw_hash: '', ganti_pw: false }).boleh === false);
  ujiBebas('jalur pw_hash kosong: OWNER tidak aktif ditolak', jalurPasswordAwal({ role: 'OWNER', aktif: false, pw_hash: '', ganti_pw: true }).boleh === false);
  ujiBebas('jalur pw_hash kosong: akun tidak ada ditolak', jalurPasswordAwal(null).boleh === false);

  const t0 = epoch('08:00:00');
  let k4 = keputusanSalahPassword(3, t0);
  ujiBebas('salah ke-4 belum ditahan', k4.salahBaru === 4 && k4.tahanSampai === null);
  const k5 = keputusanSalahPassword(4, t0);
  ujiBebas('salah ke-5 ditahan 15 menit', k5.salahBaru === 5 && k5.tahanSampai === t0 + 15 * 60000);
  ujiBebas('masih ditahan di menit ke-14:59', masihDitahan(k5.tahanSampai, t0 + 14 * 60000 + 59000) === true);
  ujiBebas('bebas lagi setelah 15 menit (bukan terkunci permanen)', masihDitahan(k5.tahanSampai, t0 + 15 * 60000 + 1000) === false);

  const kedal = hitungKedaluwarsa(t0, 7);
  ujiBebas('sesi 7 hari: masih berlaku di hari ke-6 23:00', sesiMasihBerlaku(kedal, t0 + 6 * 86400000 + 23 * 3600000) === true);
  ujiBebas('sesi 7 hari: kedaluwarsa tepat setelah 7 hari', sesiMasihBerlaku(kedal, t0 + 7 * 86400000 + 60000) === false);

  const sesiUji = [
    { id_sesi: 'A', akun: 'OWN01', aktif: true }, { id_sesi: 'B', akun: 'OWN01', aktif: true },
    { id_sesi: 'C', akun: 'OWN01', aktif: false }, { id_sesi: 'D', akun: 'K001', aktif: true }
  ];
  const semuaDicabut = cabutSesiPada(sesiUji, 'OWN01', '');
  ujiBebas('keluarkan semua perangkat: semua sesi OWN01 nonaktif, akun lain tidak tersentuh',
    semuaDicabut.filter(function (s) { return s.akun === 'OWN01' && s.aktif; }).length === 0 &&
    semuaDicabut.filter(function (s) { return s.id_sesi === 'D'; })[0].aktif === true);
  const kecualiB = cabutSesiPada(sesiUji, 'OWN01', 'B');
  ujiBebas('ganti password: sesi lain dicabut, sesi perangkat ini (B) tetap aktif',
    kecualiB.filter(function (s) { return s.id_sesi === 'A'; })[0].aktif === false && kecualiB.filter(function (s) { return s.id_sesi === 'B'; })[0].aktif === true);
  ujiBebas('label perangkat dibersihkan dari karakter berbahaya', bersihkanLabel('HP|Samsung\n<A15>') === 'HP Samsung <A15>' && bersihkanLabel('') === 'Perangkat');

  const jumlahSkenario = baris.length;
  baris.push('');
  baris.push('TES MANUAL (butuh menulis ke sheet, jalankan sendiri di aplikasi):');
  baris.push('  - Login pertama owner: isi username "owner" saja, aplikasi minta password baru, lalu masuk ke beranda owner');
  baris.push('  - sheet akun baris OWN01: pw_hash terisi dan ganti_pw jadi FALSE; sheet sesi bertambah 1 baris (aktif TRUE, kedaluwarsa 7 hari)');
  baris.push('  - Login owner dari perangkat/browser baru: sheet log ada baris LOGIN_PERANGKAT_BARU dan muncul di Perlu perhatian');
  baris.push('  - Daftarkan HP toko baru: muncul di Perlu perhatian owner (HP toko baru, oleh admin, jam, jarak)');
  baris.push('  - Tombol Nonaktifkan: kolom aktif HP jadi FALSE, log NONAKTIFKAN_HP_TOKO, HP itu langsung ditolak (HP kembali ke layar "HP ini belum terdaftar")');
  baris.push('  - Keluarkan semua perangkat: semua baris sesi OWN01 jadi aktif FALSE, perangkat lain diminta login lagi');
  baris.push('  - Salah password owner 5x: pesan "ditahan 15 menit", log TAHAN_LOGIN_OWNER; sesudah 15 menit bisa login lagi');
  baris.push('  - Masuk sebagai Admin di HP toko: keluar sendiri setelah 2 menit tanpa sentuhan dan saat kembali ke layar absen');

  const ringkas = (gagal === 0 ? 'SEMUA LULUS' : gagal + ' SKENARIO GAGAL') + ' (' + jumlahSkenario + ' skenario)';
  const teks = baris.join('\n') + '\n\n' + ringkas;
  Logger.log(teks);
  try { SpreadsheetApp.getUi().alert(ringkas + '\n\nRincian ada di Log eksekusi.'); } catch (e) { /* tanpa jendela pesan */ }
  return teks;
}

/**
 * ---- Sesi login (sheet sesi) dan akun owner / admin HP toko ----
 * Sesi = tiket masuk acak (3 UUID); yang disimpan di sheet `sesi` hanya hash-nya
 * (garam 'SESI' + KODE_RAHASIA). Password TIDAK pernah disimpan di perangkat.
 * Owner: sesi 7 hari (pengaturan UMUM sesi_owner_hari), tidak ada batas jumlah perangkat,
 * salah password 5x = login owner ditahan 15 menit, bukan terkunci permanen.
 * Admin di HP toko: sesi pendek (SESI_ADMIN_TOKO_MENIT); aturan 2 menit tanpa sentuhan
 * dijalankan di halaman HP toko.
 * Pemulihan owner lupa password: kosongkan pw_hash dan set ganti_pw = TRUE di sheet akun.
 */
var GARAM_SESI = 'SESI';
var SESI_ADMIN_TOKO_MENIT = 10;
var TAHAN_LOGIN_OWNER_MENIT = 15;
var PESAN_SESI_HABIS = 'Sesi berakhir, silakan login lagi';

/** ---- Fungsi murni (dites oleh tesServer, tanpa sheet) ---- */

/** Password baru: minimal 8 karakter, ada huruf dan angka, bukan 123456, bukan username, bukan sama dengan password lama. */
function periksaKekuatanPassword(pw, username, lama) {
  pw = String(pw || '');
  if (pw.length < 8) { return { ok: false, pesan: 'Password minimal 8 karakter' }; }
  if (pw.length > 100) { return { ok: false, pesan: 'Password terlalu panjang' }; }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) { return { ok: false, pesan: 'Password harus berisi huruf dan angka' }; }
  if (pw === '123456') { return { ok: false, pesan: 'Password terlalu mudah ditebak' }; }
  if (username && pw.toLowerCase() === String(username).trim().toLowerCase()) { return { ok: false, pesan: 'Password tidak boleh sama dengan username' }; }
  if (lama !== undefined && lama !== null && pw === String(lama)) { return { ok: false, pesan: 'Password baru tidak boleh sama dengan password lama' }; }
  return { ok: true };
}

/** Jalur "pw_hash kosong" HANYA untuk OWNER aktif dengan ganti_pw TRUE dan pw_hash kosong. */
function jalurPasswordAwal(akun) {
  if (!akun || akun.role !== 'OWNER') { return { boleh: false, pesan: 'Jalur ini hanya untuk owner' }; }
  if (akun.aktif !== true) { return { boleh: false, pesan: 'Akun tidak aktif' }; }
  if (String(akun.pw_hash) !== '') { return { boleh: false, pesan: 'Password sudah terisi' }; }
  if (akun.ganti_pw !== true) { return { boleh: false, pesan: 'Akun tidak dalam mode atur password' }; }
  return { boleh: true };
}

/** Hitung salah password owner: 5x berturut-turut = ditahan 15 menit (bukan terkunci permanen). */
function keputusanSalahPassword(salahSebelumnya, sekarangMs) {
  const salahBaru = salahSebelumnya + 1;
  return { salahBaru: salahBaru, tahanSampai: salahBaru >= 5 ? sekarangMs + TAHAN_LOGIN_OWNER_MENIT * 60000 : null };
}

function masihDitahan(tahanSampaiMs, sekarangMs) {
  return !!tahanSampaiMs && tahanSampaiMs > sekarangMs;
}

function hitungKedaluwarsa(sekarangMs, hari) { return sekarangMs + hari * 24 * 3600000; }

function sesiMasihBerlaku(kedaluwarsaMs, sekarangMs) { return kedaluwarsaMs > sekarangMs; }

/** Kembalikan daftar sesi dengan semua sesi milik akunId dicabut (aktif=false), kecuali kecualiIdSesi. */
function cabutSesiPada(daftar, akunId, kecualiIdSesi) {
  return daftar.map(function (s) {
    const dicabut = String(s.akun) === String(akunId) && s.id_sesi !== kecualiIdSesi;
    return { id_sesi: s.id_sesi, akun: s.akun, aktif: dicabut ? false : s.aktif };
  });
}

/** Rapikan label perangkat dari client: tanpa '|' dan karakter kontrol, maksimal 60 karakter. */
function bersihkanLabel(teks) {
  return String(teks || '').replace(/[|\u0000-\u001f]/g, ' ').trim().slice(0, 60) || 'Perangkat';
}

/** ---- Akses sheet sesi ---- */

function bacaSesi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('sesi')) {
    // Sheet sesi ada di rancangan (setup_spreadsheet.gs); dibuat di sini kalau spreadsheet lama belum punya.
    const s = ss.insertSheet('sesi');
    s.getRange(1, 1, 1, 8).setValues([['id_sesi', 'akun', 'perangkat', 'token_hash', 'dibuat', 'terakhir_aktif', 'kedaluwarsa', 'aktif']]);
    s.setFrozenRows(1);
  }
  return bacaSheet('sesi');
}

function hashSesi(token) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  return hashDenganGaram(String(token), GARAM_SESI, kodeRahasia);
}

function teksWaktu(ms) { return Utilities.formatDate(new Date(ms), ZONA_ABSEN, 'yyyy-MM-dd HH:mm'); }

/** Sel tanggal+jam (Date atau teks 'yyyy-MM-dd HH:mm') jadi ms epoch. */
function msDariSel(nilai) {
  if (nilai instanceof Date) { return nilai.getTime(); }
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(nilai));
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) - 7 * 3600000 : 0;
}

function buatSesi(akunId, idPerangkat, labelPerangkat, menit) {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const sesi = bacaSesi();
  const sekarang = Date.now();
  const kedaluwarsa = sekarang + menit * 60000;
  const baris = {
    id_sesi: 'S-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12), akun: akunId,
    perangkat: idPerangkat + '|' + labelPerangkat, token_hash: hashSesi(token),
    dibuat: teksWaktu(sekarang), terakhir_aktif: teksWaktu(sekarang), kedaluwarsa: teksWaktu(kedaluwarsa), aktif: true
  };
  sesi.sheet.appendRow(sesi.header.map(function (n) { return baris[n]; }));
  return { token: token, id_sesi: baris.id_sesi, kedaluwarsa: kedaluwarsa };
}

/** Kembalikan { sesi (bacaan sheet), baris, akun } kalau tiket sesi sah (dan role cocok), kalau tidak null. */
function validasiSesi(token, role) {
  if (!token || typeof token !== 'string' || token.length < 32 || token.length > 200) { return null; }
  if (!PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA')) { return null; }
  const hash = hashSesi(token);
  const sesi = bacaSesi();
  const baris = sesi.data.find(function (r) { return r.token_hash === hash && r.aktif === true; });
  if (!baris) { return null; }
  const sekarang = Date.now();
  if (!sesiMasihBerlaku(msDariSel(baris.kedaluwarsa), sekarang)) {
    perbaruiKolom(sesi, baris, { aktif: false });
    return null;
  }
  const akun = bacaSheet('akun').data.find(function (r) { return String(r.id) === String(baris.akun) && r.aktif === true; });
  if (!akun || (role && akun.role !== role)) { return null; }
  if (sekarang - msDariSel(baris.terakhir_aktif) > 60000) {
    perbaruiKolom(sesi, baris, { terakhir_aktif: teksWaktu(sekarang) });
  }
  return { sesi: sesi, baris: baris, akun: akun };
}

/** Cabut semua sesi aktif milik satu akun (kecuali satu sesi). Kembalikan jumlah yang dicabut. */
function cabutSesiAkun(akunId, kecualiIdSesi) {
  const sesi = bacaSesi();
  let n = 0;
  sesi.data.forEach(function (r) {
    if (String(r.akun) === String(akunId) && r.aktif === true && r.id_sesi !== kecualiIdSesi) {
      perbaruiKolom(sesi, r, { aktif: false });
      n++;
    }
  });
  return n;
}

function perangkatPernahDipakai(akunId, idPerangkat) {
  return bacaSesi().data.some(function (r) {
    return String(r.akun) === String(akunId) && String(r.perangkat).indexOf(idPerangkat + '|') === 0;
  });
}

function labelDariPerangkat(teks) {
  const i = String(teks).indexOf('|');
  return i === -1 ? String(teks) : String(teks).slice(i + 1);
}

function responSesiHabis() {
  return respon({ status: 'gagal', kode: 'SESI_TIDAK_VALID', pesan: PESAN_SESI_HABIS });
}

function bersihkanIdPerangkat(id) {
  return /^[A-Za-z0-9]{8,32}$/.test(String(id || '')) ? String(id) : 'TAKDIKENAL';
}

/** Selesaikan login owner: buat sesi 7 hari, catat log kalau perangkat baru. */
function selesaikanLoginOwner(owner, d) {
  const idPerangkat = bersihkanIdPerangkat(d.id_perangkat);
  const label = bersihkanLabel(d.label);
  const baru = !perangkatPernahDipakai(owner.id, idPerangkat);
  const sesi = buatSesi(owner.id, idPerangkat, label, ambilNilaiUmum('sesi_owner_hari', 7) * 24 * 60);
  if (baru) {
    tambahLog({ jenis: 'KEAMANAN', oleh: owner.id, cabang: '', aksi: 'LOGIN_PERANGKAT_BARU', target: label, id: idPerangkat });
  }
  return respon({ status: 'ok', sesi: sesi.token, kedaluwarsa: teksWaktu(sesi.kedaluwarsa), nama: owner.nama, id: owner.id });
}

/** Catat satu password salah milik owner; 5x berturut-turut = ditahan 15 menit. */
function catatSalahOwner(akun, owner) {
  const k = keputusanSalahPassword(Number(owner.salah_login) || 0, Date.now());
  perbaruiKolom(akun, owner, { salah_login: k.salahBaru });
  if (k.tahanSampai) {
    PropertiesService.getScriptProperties().setProperty('tahan_' + owner.id, String(k.tahanSampai));
    tambahLog({
      jenis: 'KEAMANAN', oleh: owner.id, cabang: '', aksi: 'TAHAN_LOGIN_OWNER', target: 'akun', id: owner.id,
      alasan: 'Password salah 5 kali, login ditahan ' + TAHAN_LOGIN_OWNER_MENIT + ' menit'
    });
  }
  return k;
}

/** Cek penahanan login owner; kembalikan pesan kalau masih ditahan, atau '' kalau bebas (dan bersihkan penahanan lama). */
function cekTahanOwner(akun, owner) {
  const props = PropertiesService.getScriptProperties();
  const tahan = Number(props.getProperty('tahan_' + owner.id) || 0);
  const sekarang = Date.now();
  if (masihDitahan(tahan, sekarang)) {
    return 'Login owner ditahan sampai ' + Utilities.formatDate(new Date(tahan), ZONA_ABSEN, 'HH:mm') + ' karena salah password 5 kali';
  }
  if (tahan) {
    props.deleteProperty('tahan_' + owner.id);
    perbaruiKolom(akun, owner, { salah_login: 0 });
  }
  return '';
}

function cariOwner(usernameMentah) {
  const username = String(usernameMentah || '').trim().toLowerCase();
  if (!username) { return { akun: null, owner: null }; }
  const akun = bacaSheet('akun');
  const owner = akun.data.find(function (r) { return String(r.nama).trim().toLowerCase() === username && r.role === 'OWNER'; });
  return { akun: akun, owner: owner || null };
}

/** Aksi login_owner. Jalur pw_hash kosong: balas perlu_password_baru (belum login). */
function prosesLoginOwner(d) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const pesanUmum = 'Username atau password salah';
  const password = String(d.password || '');
  if (password.length > 100) { return respon({ status: 'gagal', pesan: pesanUmum }); }

  const c = cariOwner(d.username);
  if (!c.owner || c.owner.aktif !== true) { return respon({ status: 'gagal', pesan: pesanUmum }); }
  const owner = c.owner;

  const tahan = cekTahanOwner(c.akun, owner);
  if (tahan) { return respon({ status: 'gagal', kode: 'DITAHAN', pesan: tahan }); }

  if (String(owner.pw_hash) === '') {
    // Hanya owner dengan ganti_pw TRUE yang boleh mengatur password pertama kali.
    return jalurPasswordAwal(owner).boleh ? respon({ status: 'ok', perlu_password_baru: true }) : respon({ status: 'gagal', pesan: pesanUmum });
  }

  if (hashDenganGaram(password, String(owner.id), kodeRahasia) !== owner.pw_hash) {
    const k = catatSalahOwner(c.akun, owner);
    if (k.tahanSampai) {
      return respon({ status: 'gagal', kode: 'DITAHAN', pesan: 'Salah password 5 kali. Login owner ditahan ' + TAHAN_LOGIN_OWNER_MENIT + ' menit' });
    }
    return respon({ status: 'gagal', pesan: pesanUmum });
  }

  if (Number(owner.salah_login) !== 0) { perbaruiKolom(c.akun, owner, { salah_login: 0 }); }
  return selesaikanLoginOwner(owner, d);
}

/** Aksi atur_password_owner: password pertama (atau pemulihan: pw_hash dikosongkan, ganti_pw TRUE). */
function prosesAturPasswordOwner(d) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const c = cariOwner(d.username);
  const jalur = jalurPasswordAwal(c.owner);
  if (!jalur.boleh) { return respon({ status: 'gagal', pesan: 'Tidak bisa mengatur password lewat jalur ini' }); }
  const kuat = periksaKekuatanPassword(d.password_baru, c.owner.nama);
  if (!kuat.ok) { return respon({ status: 'gagal', pesan: kuat.pesan }); }

  const owner = c.owner;
  perbaruiKolom(c.akun, owner, { pw_hash: hashDenganGaram(String(d.password_baru), String(owner.id), kodeRahasia), ganti_pw: false, salah_login: 0 });
  PropertiesService.getScriptProperties().deleteProperty('tahan_' + owner.id);
  cabutSesiAkun(owner.id, '');
  tambahLog({ jenis: 'KEAMANAN', oleh: owner.id, cabang: '', aksi: 'ATUR_PASSWORD_OWNER', target: 'akun', id: owner.id, alasan: 'Password owner diatur (pertama kali atau pemulihan)' });
  return selesaikanLoginOwner(owner, d);
}

/** Aksi owner_beranda: kartu Perlu perhatian, daftar HP toko, perangkat yang sedang login. */
function prosesOwnerBeranda(sesiToken) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const semuaAkun = bacaSheet('akun').data;
  const namaDari = function (id) {
    const a = semuaAkun.find(function (r) { return String(r.id) === String(id); });
    return a ? a.nama : String(id);
  };
  const hpToko = semuaAkun
    .filter(function (r) { return r.role === 'PERANGKAT'; })
    .map(function (r) { return { id: r.id, nama: r.nama, cabang: r.cabang, aktif: r.aktif === true }; });

  // Perlu perhatian: informasi saja (7 hari terakhir), terbaru di atas.
  const batas = Date.now() - 7 * 24 * 3600000;
  const perhatian = [];
  bacaSheet('log').data.forEach(function (r) {
    const ms = msDariSel(r.waktu);
    if (ms < batas) { return; }
    if (r.jenis === 'PERANGKAT' && r.aksi === 'DAFTAR_HP_TOKO') {
      const m = /jarak ke toko (\d+) m/.exec(String(r.alasan));
      perhatian.push({
        ms: ms, tipe: 'HP_BARU', judul: 'HP toko baru: ' + r.id + ' (' + r.target + ')',
        sub: 'Cabang ' + r.cabang + ' · oleh ' + namaDari(r.oleh) + ' · ' + teksWaktu(ms),
        info: m ? m[1] + ' m dari toko' : ''
      });
    } else if (r.jenis === 'KEAMANAN' && r.aksi === 'LOGIN_PERANGKAT_BARU' && String(r.oleh) === String(s.akun.id)) {
      perhatian.push({ ms: ms, tipe: 'LOGIN_BARU', judul: 'Login owner dari perangkat baru', sub: r.target + ' · ' + teksWaktu(ms), info: '' });
    }
  });
  perhatian.sort(function (a, b) { return b.ms - a.ms; });

  const sekarang = Date.now();
  const perangkatAktif = bacaSesi().data
    .filter(function (r) { return String(r.akun) === String(s.akun.id) && r.aktif === true && sesiMasihBerlaku(msDariSel(r.kedaluwarsa), sekarang); })
    .map(function (r) {
      return { label: labelDariPerangkat(r.perangkat), terakhir_aktif: teksWaktu(msDariSel(r.terakhir_aktif)), ini: r.id_sesi === s.baris.id_sesi };
    });

  return respon({
    status: 'ok', nama: s.akun.nama, id: s.akun.id,
    perhatian: perhatian.slice(0, 20), hp_toko: hpToko, perangkat_aktif: perangkatAktif
  });
}

/** Aksi owner_nonaktifkan_hp: aktif=FALSE dan hapus cache validasi token supaya HP langsung ditolak. */
function prosesOwnerNonaktifkanHp(sesiToken, idHp) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const akun = bacaSheet('akun');
  const hp = akun.data.find(function (r) { return r.role === 'PERANGKAT' && String(r.id) === String(idHp); });
  if (!hp) { return respon({ status: 'gagal', pesan: 'HP toko tidak ditemukan' }); }
  if (hp.aktif === true) {
    perbaruiKolom(akun, hp, { aktif: false });
    CacheService.getScriptCache().remove('hp_' + hp.pw_hash);
    tambahLog({
      jenis: 'PERANGKAT', oleh: s.akun.id, cabang: hp.cabang, aksi: 'NONAKTIFKAN_HP_TOKO',
      target: hp.nama, id: hp.id, sebelum: 'aktif=TRUE', sesudah: 'aktif=FALSE'
    });
  }
  return respon({ status: 'ok', pesan: 'HP toko dinonaktifkan' });
}

/** Aksi owner_keluarkan_semua: cabut semua sesi owner (termasuk perangkat ini). */
function prosesOwnerKeluarkanSemua(sesiToken) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const n = cabutSesiAkun(s.akun.id, '');
  tambahLog({ jenis: 'KEAMANAN', oleh: s.akun.id, cabang: '', aksi: 'KELUARKAN_SEMUA_PERANGKAT', target: 'sesi', id: s.akun.id, alasan: n + ' sesi dicabut' });
  return respon({ status: 'ok', jumlah: n });
}

/** Aksi owner_ganti_password: perangkat lain otomatis keluar. */
function prosesOwnerGantiPassword(sesiToken, lama, baru) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  const akun = bacaSheet('akun');
  const owner = akun.data.find(function (r) { return String(r.id) === String(s.akun.id); });

  const tahan = cekTahanOwner(akun, owner);
  if (tahan) { return respon({ status: 'gagal', kode: 'DITAHAN', pesan: tahan }); }
  if (String(lama || '').length > 100 || hashDenganGaram(String(lama || ''), String(owner.id), kodeRahasia) !== owner.pw_hash) {
    const k = catatSalahOwner(akun, owner);
    return respon({ status: 'gagal', pesan: k.tahanSampai ? 'Salah password 5 kali. Login owner ditahan ' + TAHAN_LOGIN_OWNER_MENIT + ' menit' : 'Password lama salah' });
  }
  const kuat = periksaKekuatanPassword(baru, owner.nama, lama);
  if (!kuat.ok) { return respon({ status: 'gagal', pesan: kuat.pesan }); }

  perbaruiKolom(akun, owner, { pw_hash: hashDenganGaram(String(baru), String(owner.id), kodeRahasia), ganti_pw: false, salah_login: 0 });
  const n = cabutSesiAkun(owner.id, s.baris.id_sesi);
  tambahLog({ jenis: 'KEAMANAN', oleh: owner.id, cabang: '', aksi: 'GANTI_PASSWORD_OWNER', target: 'akun', id: owner.id, alasan: n + ' perangkat lain dikeluarkan' });
  return respon({ status: 'ok', pesan: 'Password diganti' });
}

/** Aksi login_admin_toko (wajib token HP toko): verifikasi admin cabang HP ini, sesi pendek. */
function prosesLoginAdminToko(d, hp) {
  const pesanUmum = 'Username atau password salah, atau akun bukan admin';
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const username = String(d.username || '').trim().toLowerCase();
  const password = String(d.password || '');
  if (!username || !password || password.length > 100) { return respon({ status: 'gagal', pesan: pesanUmum }); }

  const akun = bacaSheet('akun');
  const admin = akun.data.find(function (r) { return String(r.nama).trim().toLowerCase() === username && r.role === 'ADMIN'; });
  // Admin harus dari cabang HP toko ini; cabang dari server, bukan kiriman HP.
  if (!admin || admin.cabang !== hp.cabang || admin.aktif !== true || admin.terkunci === true || admin.ganti_pw === true) {
    return respon({ status: 'gagal', pesan: pesanUmum });
  }
  if (hashDenganGaram(password, String(admin.id), kodeRahasia) !== admin.pw_hash) {
    const salahBaru = (Number(admin.salah_login) || 0) + 1;
    if (salahBaru >= 5) {
      perbaruiKolom(akun, admin, { salah_login: salahBaru, terkunci: true });
      tambahLog({
        jenis: 'KEAMANAN', oleh: admin.id, cabang: admin.cabang, aksi: 'KUNCI_AKUN', target: 'akun', id: admin.id,
        sebelum: 'terkunci=FALSE', sesudah: 'terkunci=TRUE', alasan: 'Password salah 5 kali saat masuk admin di HP toko'
      });
    } else {
      perbaruiKolom(akun, admin, { salah_login: salahBaru });
    }
    return respon({ status: 'gagal', pesan: pesanUmum });
  }
  if (Number(admin.salah_login) !== 0) { perbaruiKolom(akun, admin, { salah_login: 0 }); }

  const sesi = buatSesi(admin.id, 'HPTOKO' + String(hp.id).replace(/[^A-Za-z0-9]/g, ''), 'HP toko ' + hp.id, SESI_ADMIN_TOKO_MENIT);
  return respon({ status: 'ok', sesi: sesi.token, nama: admin.nama, panggilan: admin.panggilan, cabang: admin.cabang });
}

/** Aksi logout: cabut satu sesi (owner atau admin). Selalu "ok" supaya aman dipanggil berulang. */
function prosesLogout(sesiToken) {
  if (sesiToken && typeof sesiToken === 'string' && sesiToken.length >= 32 && sesiToken.length <= 200 &&
      PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA')) {
    const hash = hashSesi(sesiToken);
    const sesi = bacaSesi();
    const baris = sesi.data.find(function (r) { return r.token_hash === hash && r.aktif === true; });
    if (baris) { perbaruiKolom(sesi, baris, { aktif: false }); }
  }
  return respon({ status: 'ok' });
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
