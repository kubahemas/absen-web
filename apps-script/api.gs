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
  const daftar = daftarUntukPilihNama(bacaSheet('akun').data, cabang); // hanya yang AKTIF
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

  // Kelola karyawan di HP toko: wajib token HP toko + sesi admin (dicek di dalam fungsinya).
  if (data.aksi === 'karyawan_daftar') { return prosesKaryawanDaftar(data); }
  if (data.aksi === 'karyawan_tambah') { return prosesKaryawanTambah(data); }
  if (data.aksi === 'karyawan_reset_pin') { return prosesKaryawanResetPin(data); }
  if (data.aksi === 'karyawan_nonaktif') { return prosesKaryawanNonaktif(data); }

  // Aksi owner dan logout memakai tiket sesi login (bukan token HP toko).
  if (data.aksi === 'login_owner') { return prosesLoginOwner(data); }
  if (data.aksi === 'atur_password_owner') { return prosesAturPasswordOwner(data); }
  if (data.aksi === 'owner_beranda') { return prosesOwnerBeranda(data.sesi); }
  if (data.aksi === 'owner_perhatian') { return prosesOwnerPerhatian(data.sesi); }
  if (data.aksi === 'owner_perhatian_daftar') { return prosesOwnerPerhatianDaftar(data.sesi); }
  if (data.aksi === 'owner_tandai_dibaca') { return prosesOwnerTandaiDibaca(data.sesi, data.id, data.mode); }
  if (data.aksi === 'owner_hari_ini') { return prosesOwnerHariIni(data.sesi, data.cabang, data.shift); }
  if (data.aksi === 'owner_daftar_hp') { return prosesOwnerDaftarHp(data.sesi, data.cabang, data.tampilkan_nonaktif); }
  if (data.aksi === 'ubah_nama_hp') { return prosesUbahNamaHp(data); }
  if (data.aksi === 'owner_nonaktifkan_hp') { return prosesOwnerNonaktifkanHp(data.sesi, data.id_hp); }
  if (data.aksi === 'owner_keluarkan_semua') { return prosesOwnerKeluarkanSemua(data.sesi); }
  if (data.aksi === 'owner_ganti_password') { return prosesOwnerGantiPassword(data.sesi, data.lama, data.baru); }
  if (data.aksi === 'logout') { return prosesLogout(data.sesi); }

  // Semua aksi lain wajib menyertakan token HP toko yang terdaftar.
  const aksiBertoken = ['daftar_karyawan', 'tiket_waktu', 'absen_masuk', 'simpan_alasan', 'absen_pulang', 'simpan_pulang', 'login_admin_toko', 'unggah_foto'];
  if (aksiBertoken.indexOf(data.aksi) !== -1) {
    const hp = validasiTokenHp(data.token);
    if (!hp) {
      return respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' });
    }
    if (data.aksi === 'daftar_karyawan') { return prosesDaftarKaryawan(hp); }
    if (data.aksi === 'tiket_waktu') { return prosesTiketWaktu(data.jenis, hp); }
    if (data.aksi === 'login_admin_toko') { return prosesLoginAdminToko(data, hp); }
    if (data.aksi === 'unggah_foto') { return prosesUnggahFoto(data, hp); }
    if (data.aksi === 'absen_masuk') { return prosesAbsenMasuk(data.id, data.pin, hp, data.tiket, data.tanpa_foto === true); }
    if (data.aksi === 'absen_pulang') { return prosesAbsenPulang(data.id, data.pin, data.jenis, hp, data.tiket, data.tanpa_foto === true); }
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

function prosesAbsenMasuk(id, pin, hp, tiket, tanpaFoto) {
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
  barisBaru.id_masuk = buatIdAbsen('M', id, tk.t, hp.id);
  if (tanpaFoto) { barisBaru.foto_masuk = TEKS_TANPA_FOTO; } // kamera ditolak/tidak ada: absen tetap tersimpan

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
    shift: shiftKaryawan.nama,
    id_absen: barisBaru.id_masuk
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
    baru.panggilan = ''; // HP toko tidak memakai panggilan (namanya ada di kolom nama)
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

function prosesAbsenPulang(id, pin, jenis, hp, tiket, tanpaFoto) {
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
    perubahan: hasil.perubahan || '',
    id_absen: buatIdAbsen(hasil.st_pulang === 'LEMBUR DI TOKO' ? 'L' : 'P', akunDitemukan.id, tk.t, hp.id),
    tanpa_foto: tanpaFoto === true
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
    acc_pulang: info.acc,
    id_pulang: info.id_absen
  };
  // Foto: kamera tidak ada -> TANPA FOTO; absen pulang diganti/direvisi -> kolom foto dikosongkan supaya foto baru bisa diunggah
  if (info.tanpa_foto) { perubahan.foto_pulang = TEKS_TANPA_FOTO; } else if (info.perubahan) { perubahan.foto_pulang = ''; }
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
    perubahan: info.perubahan, id_absen: info.id_absen
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

  // ---- Lebih dari satu owner ----
  const akunUji = [
    { id: 'OWN01', nama: 'owner', role: 'OWNER' }, { id: 'OWN02', nama: 'Bu Sari', role: 'OWNER' },
    { id: 'K010', nama: 'Dewi Lestari', role: 'ADMIN' }
  ];
  ujiBebas('multi-owner: username "OWNER " (huruf besar/spasi) cocok ke OWN01', (temukanOwner(akunUji, 'OWNER ') || {}).id === 'OWN01');
  ujiBebas('multi-owner: "bu sari" cocok ke OWN02, bukan OWN01', (temukanOwner(akunUji, 'bu sari') || {}).id === 'OWN02');
  ujiBebas('multi-owner: nama admin tidak dianggap owner', temukanOwner(akunUji, 'Dewi Lestari') === null);
  ujiBebas('multi-owner: username kosong / tidak ada = tidak ditemukan', temukanOwner(akunUji, '') === null && temukanOwner(akunUji, 'siapa') === null);
  ujiBebas('penahanan dihitung per akun: OWN01 salah 4x tidak menahan OWN02', keputusanSalahPassword(4, t0).tahanSampai !== null && keputusanSalahPassword(0, t0).tahanSampai === null);

  // ---- Perlu perhatian (sumber log, sama untuk semua owner, penanda dibaca per owner) ----
  const namaUji = function (id) { return ({ K010: 'Dewi', OWN01: 'owner', OWN02: 'Bu Sari' })[id] || id; };
  const logUji = [
    { waktu: '2026-10-05 07:12', jenis: 'PERANGKAT', aksi: 'DAFTAR_HP_TOKO', oleh: 'K010', cabang: 'Ngawi', target: 'HP meja kasir', id: 'HPT-NGW-03', alasan: 'akurasi 18 m, jarak ke toko 42 m' },
    { waktu: '2026-10-05 08:15', jenis: 'KEAMANAN', aksi: 'LOGIN_PERANGKAT_BARU', oleh: 'OWN02', cabang: '', target: 'Android · Chrome', id: 'abc12345' },
    { waktu: '2026-10-04 09:00', jenis: 'KEAMANAN', aksi: 'LOGIN_PERANGKAT_BARU', oleh: 'OWN01', cabang: '', target: 'Windows · Edge', id: 'def67890' },
    { waktu: '2026-10-03 10:00', jenis: 'PERANGKAT', aksi: 'DAFTAR_HP_TOKO', oleh: 'K010', cabang: 'Ngawi', target: 'HP Toko 2', id: 'HPT-NGW-02', alasan: 'akurasi 10 m, jarak ke toko 5 m' },
    { waktu: '2026-10-02 11:00', jenis: 'KEAMANAN', aksi: 'KUNCI_AKUN', oleh: 'K001', cabang: 'Ngawi', target: 'akun', id: 'K001' },
    { waktu: '2026-08-01 11:00', jenis: 'PERANGKAT', aksi: 'DAFTAR_HP_TOKO', oleh: 'K010', cabang: 'Ngawi', target: 'HP lama', id: 'HPT-NGW-01', alasan: '' }
  ];
  const batasUji = epoch('00:00:00') - 7 * 86400000;
  const itemUji = rakitPerhatian(logUji, namaUji, batasUji);
  ujiBebas('perhatian: hanya HP baru + login perangkat baru dalam 7 hari (4 item), log lain/lama diabaikan', itemUji.length === 4, itemUji.length + ' item');
  ujiBebas('perhatian: terbaru di atas', itemUji[0].tipe === 'LOGIN_BARU' && itemUji[0].sub.indexOf('2026-10-05 08:15') !== -1 && itemUji[3].judul.indexOf('HPT-NGW-02') !== -1);
  ujiBebas('perhatian: semua owner melihat item yang sama (login owner lain ikut tampil)', JSON.stringify(rakitPerhatian(logUji, namaUji, batasUji)) === JSON.stringify(itemUji) && itemUji[0].judul.indexOf('Bu Sari') !== -1 && itemUji[2].judul.indexOf('owner') !== -1);
  ujiBebas('perhatian: jarak ke toko terbaca dari log', itemUji.filter(function (x) { return x.judul.indexOf('HPT-NGW-03') !== -1; })[0].info === '42 m dari toko');
  ujiBebas('belum dibaca: penanda 0 = semua 4 item', itemBelumDibaca(itemUji, 0).length === 4);
  ujiBebas('belum dibaca: penanda 4 Okt 12:00 = 2 item', itemBelumDibaca(itemUji, epoch('12:00:00') - 86400000).length === 2);
  ujiBebas('belum dibaca: penanda = sekarang = 0 item (log tidak diubah, hanya penanda yang maju)', itemBelumDibaca(itemUji, epoch('23:59:59')).length === 0 && itemUji.length === 4);
  ujiBebas('3 item terbaru', itemUji.slice(0, 3).length === 3);

  // ---- Kartu "Hari ini" ----
  const hariUji = [
    { tanggal: '2026-10-05', cabang: 'Ngawi', shift: 1, masuk: '07:44', st_masuk: 'HADIR', pulang: '', acc_pulang: '' },
    { tanggal: '2026-10-05', cabang: 'Ngawi', shift: 1, masuk: '07:50', st_masuk: 'TELAT', pulang: '16:31', acc_pulang: '' },
    { tanggal: '2026-10-05', cabang: 'Ngawi', shift: 2, masuk: '13:50', st_masuk: 'TELAT', pulang: '22:00', acc_pulang: '' },
    { tanggal: '2026-10-05', cabang: 'Pusat', shift: 1, masuk: '07:40', st_masuk: 'HADIR', pulang: '18:35', acc_pulang: 'MENUNGGU' },
    { tanggal: '2026-10-04', cabang: 'Ngawi', shift: 1, masuk: '07:40', st_masuk: 'HADIR', pulang: '16:30', acc_pulang: 'MENUNGGU' }
  ];
  const sama = function (a, m, t, p, w) { return a.masuk === m && a.telat === t && a.pulang === p && a.menunggu_acc === w; };
  ujiBebas('hari ini: semua cabang & shift (kemarin tidak dihitung)', sama(hitungHariIni(hariUji, '2026-10-05', '', ''), 4, 2, 3, 1), JSON.stringify(hitungHariIni(hariUji, '2026-10-05', '', '')));
  ujiBebas('hari ini: filter cabang Ngawi', sama(hitungHariIni(hariUji, '2026-10-05', 'Ngawi', ''), 3, 2, 2, 0));
  ujiBebas('hari ini: filter cabang Ngawi + shift 1', sama(hitungHariIni(hariUji, '2026-10-05', 'Ngawi', '1'), 2, 1, 1, 0));
  ujiBebas('hari ini: filter cabang Pusat (lembur menunggu ACC)', sama(hitungHariIni(hariUji, '2026-10-05', 'Pusat', ''), 1, 0, 1, 1));

  // ---- Ubah nama HP ----


  // ---- Perlu perhatian: ringkasan, penanda per item / semua, batas 15, "99+", jendela 7 hari ----
  const r0 = ringkasPerhatian([], { semua_sampai: 0, item: {} });
  ujiBebas('perhatian kosong: 0 belum dibaca, tidak ada item, bukan 99+', r0.jumlah_belum === 0 && r0.jumlah_teks === '0' && r0.terbaru.length === 0 && r0.lebih === false);
  const jam0 = epoch('00:00:00');
  const buatItem = function (n) { const ms = jam0 - n * 3600000; return { ms: ms, kunci: kunciItem(ms, 'HP_BARU', 'K010', 'HPT-' + n), tipe: 'HP_BARU', judul: 'item' + n, sub: 'sub', info: '' }; };
  const lima = [1, 2, 3, 4, 5].map(buatItem); // item1 paling baru
  const kosongP = { semua_sampai: 0, item: {} };
  const rl = ringkasPerhatian(lima, kosongP);
  ujiBebas('perhatian: 3 item terbaru belum dibaca, urutan terbaru dulu, jumlah dari semua', rl.terbaru.length === 3 && rl.terbaru[0].judul === 'item1' && rl.terbaru[2].judul === 'item3' && rl.jumlah_belum === 5);
  const pSatu = tandaiSatuPenanda(kosongP, lima[0].kunci, jam0);
  const rSatu = ringkasPerhatian(lima, pSatu);
  ujiBebas('tandai satu item: item itu hilang, item berikutnya naik mengisi, jumlah turun 1', rSatu.jumlah_belum === 4 && rSatu.terbaru[0].judul === 'item2' && rSatu.terbaru[2].judul === 'item4');
  ujiBebas('tandai satu item: hanya item itu (yang lain tetap belum dibaca)', itemBelumDibaca(lima, pSatu).length === 4 && itemBelumDibaca(lima, pSatu).every(function (x) { return x.judul !== 'item1'; }));
  ujiBebas('tandai satu dengan kunci tidak sah ditolak', tandaiSatuPenanda(kosongP, 'asal', jam0) === null && tandaiSatuPenanda(kosongP, 123, jam0) === null && tandaiSatuPenanda(kosongP, 'x|y', jam0) === null);
  const pSemua = tandaiSemuaPenanda(jam0);
  ujiBebas('tandai semua: semua_sampai maju ke sekarang, tidak ada yang belum dibaca, daftar entri kosong', itemBelumDibaca(lima, pSemua).length === 0 && ringkasPerhatian(lima, pSemua).jumlah_belum === 0 && Object.keys(pSemua.item).length === 0);
  const itemBaruLagi = { ms: jam0 + 60000, kunci: kunciItem(jam0 + 60000, 'LOGIN_BARU', 'OWN02', 'abc'), tipe: 'LOGIN_BARU', judul: 'baru', sub: '', info: '' };
  ujiBebas('setelah tandai semua, item yang datang kemudian tetap muncul', itemBelumDibaca(lima.concat([itemBaruLagi]), pSemua).length === 1);

  const empatBelas = []; for (let n = 1; n <= 20; n++) { empatBelas.push(buatItem(n)); }
  const dl = daftarPerhatian(empatBelas, kosongP);
  ujiBebas('daftar lengkap dibatasi 15 item terbaru (dari 20)', dl.daftar.length === 15 && dl.daftar[0].judul === 'item1' && dl.daftar[14].judul === 'item15' && dl.jumlah_belum === 20);
  const seratus = []; for (let n = 1; n <= 120; n++) { seratus.push(buatItem(n)); }
  const r99 = ringkasPerhatian(seratus, kosongP);
  ujiBebas('lebih dari 99 belum dibaca: jumlah tampil 99 dan penanda "99+"', r99.jumlah_belum === 99 && r99.jumlah_teks === '99+' && r99.lebih === true);
  const r99pas = ringkasPerhatian(seratus.slice(0, 99), kosongP);
  ujiBebas('tepat 99 belum dibaca: tampil "99" tanpa plus', r99pas.jumlah_teks === '99' && r99pas.lebih === false);

  const tujuhHari = 7 * 86400000;
  const logTujuh = [
    { waktu: '2026-10-05 07:00', jenis: 'PERANGKAT', aksi: 'DAFTAR_HP_TOKO', oleh: 'K010', cabang: 'Ngawi', target: 'A', id: 'HPT-A', alasan: '' },
    { waktu: '2026-09-28 13:00', jenis: 'PERANGKAT', aksi: 'DAFTAR_HP_TOKO', oleh: 'K010', cabang: 'Ngawi', target: 'B', id: 'HPT-B', alasan: '' },
    { waktu: '2026-09-27 06:00', jenis: 'PERANGKAT', aksi: 'DAFTAR_HP_TOKO', oleh: 'K010', cabang: 'Ngawi', target: 'C', id: 'HPT-C', alasan: '' }
  ];
  const sekarang5 = epoch('12:00:00');
  const dalamTujuh = rakitPerhatian(logTujuh, namaUji, sekarang5 - tujuhHari);
  ujiBebas('jendela 7 hari: hanya item dalam 7 hari terakhir yang dihitung (2 dari 3)', dalamTujuh.length === 2 && dalamTujuh[1].judul.indexOf('HPT-B') !== -1);

  // pembuangan entri lama pada penanda
  const kunciTua = kunciItem(sekarang5 - 8 * 86400000, 'HP_BARU', 'K010', 'tua');
  const kunciLama = kunciItem(sekarang5 - 3 * 86400000, 'HP_BARU', 'K010', 'lama');
  const kunciSegar = kunciItem(sekarang5 - 1 * 86400000, 'HP_BARU', 'K010', 'segar');
  const pKotor = { semua_sampai: sekarang5 - 2 * 86400000, item: {} };
  pKotor.item[kunciTua] = sekarang5 - 8 * 86400000;     // lebih tua dari 7 hari -> dibuang
  pKotor.item[kunciLama] = sekarang5 - 3 * 86400000;    // lebih lama dari semua_sampai -> dibuang
  pKotor.item[kunciSegar] = sekarang5 - 1 * 86400000;   // masih relevan -> tetap
  const pBersih = bersihkanPenanda(pKotor, sekarang5);
  ujiBebas('penanda: entri lebih tua dari 7 hari dan yang tercakup semua_sampai dibuang, yang relevan tetap',
    Object.keys(pBersih.item).length === 1 && pBersih.item[kunciSegar] !== undefined && pBersih.semua_sampai === pKotor.semua_sampai);
  const banyak = { semua_sampai: 0, item: {} };
  for (let n = 0; n < 400; n++) { banyak.item[kunciItem(sekarang5 - n * 60000, 'HP_BARU', 'K010', 'x' + n)] = sekarang5 - n * 60000; }
  const pBanyak = bersihkanPenanda(banyak, sekarang5);
  ujiBebas('penanda: dibatasi ' + MAKS_ENTRI_DIBACA + ' entri dan nilai JSON jauh di bawah batas Script Properties (9 KB)', Object.keys(pBanyak.item).length === MAKS_ENTRI_DIBACA && JSON.stringify(pBanyak).length < 9000, String(JSON.stringify(pBanyak).length));

  const kunciPanjang = {};
  for (let n = 0; n < 300; n++) { kunciPanjang[kunciItem(sekarang5 - n * 60000, 'LOGIN_BARU', 'OWNER-ABCDEFGHIJ12345', 'ID-PANJANG-' + 'z'.repeat(30) + n)] = sekarang5 - n * 60000; }
  ujiBebas('penanda: kunci terpanjang pun tetap di bawah 9 KB (entri terlama dibuang)', JSON.stringify(bersihkanPenanda({ semua_sampai: 0, item: kunciPanjang }, sekarang5)).length <= MAKS_UKURAN_PENANDA);

  // ---- Reset harian salah_login ----
  const akunReset = [
    { id: 'K001', salah_login: 3, terkunci: false }, { id: 'K002', salah_login: 5, terkunci: true },
    { id: 'K003', salah_login: 0, terkunci: false }, { id: 'K004', salah_login: '', terkunci: false }, { id: 'K005', salah_login: 2, terkunci: false }
  ];
  const pilihReset = pilihBarisResetSalahLogin(akunReset);
  ujiBebas('reset harian: akun belum terkunci dengan salah_login > 0 direset (K001, K005)', pilihReset.join(',') === '0,4');
  ujiBebas('reset harian: akun terkunci (K002) TETAP terkunci dan tidak dipilih', pilihReset.indexOf(1) === -1);

  // ---- Penahanan username palsu lewat cache (bukan Script Properties) ----
  const cachePalsu = { d: {}, get: function (k) { return this.d[k] || null; }, put: function (k, v) { this.d[k] = v; }, remove: function (k) { delete this.d[k]; } };
  let hasilPalsu;
  for (let n = 1; n <= 4; n++) { hasilPalsu = catatGagalPalsu(cachePalsu, 'sidikA', t0 + n * 1000); }
  ujiBebas('username palsu: 4 percobaan belum ditahan', hasilPalsu.ditahan === false);
  hasilPalsu = catatGagalPalsu(cachePalsu, 'sidikA', t0 + 5000);
  ujiBebas('username palsu: percobaan ke-5 ditahan 15 menit (di cache)', hasilPalsu.ditahan === true && hasilPalsu.barusan === true && hasilPalsu.tahanSampai === t0 + 5000 + 15 * 60000);
  ujiBebas('username palsu: percobaan berikutnya masih ditahan, pesan tahan sama dengan akun asli', catatGagalPalsu(cachePalsu, 'sidikA', t0 + 60000).ditahan === true);
  ujiBebas('username palsu: bebas lagi setelah 15 menit dan hitungan mulai dari awal', catatGagalPalsu(cachePalsu, 'sidikA', t0 + 5000 + 15 * 60000 + 1000).ditahan === false);
  ujiBebas('username palsu lain tidak ikut ditahan (per username)', catatGagalPalsu(cachePalsu, 'sidikB', t0).ditahan === false);
  ujiBebas('penahanan palsu hanya memakai kunci cache palsu_* (tidak ada tahan_*)', Object.keys(cachePalsu.d).every(function (k) { return k.indexOf('palsu_') === 0; }));
  const hapusProp = pilihPropertiPalsuUntukDihapus(['KODE_RAHASIA', 'tahan_OWN01', 'tahan_siapa', 'palsu_salah_abc', 'dibaca_OWN01', 'tahan_OWN09'], ['OWN01']);
  ujiBebas('pembersihan properti palsu: hanya tahan_<bukan owner> dan palsu_*; KODE_RAHASIA, tahan_OWN01, dibaca_* aman',
    hapusProp.sort().join(',') === 'palsu_salah_abc,tahan_OWN09,tahan_siapa', hapusProp.join(','));

  // ---- Karyawan: PIN bebas, ID otomatis, nama, hak admin, reset PIN, daftar nama ----
  ['1234', '1111', '0000', '9876'].forEach(function (p) { ujiBebas('PIN ' + p + ' diterima (PIN bebas, tanpa aturan berurutan/kembar)', validasiPin(p).ok); });
  ujiBebas('PIN bukan 4 digit angka ditolak', ['', '123', '12345', 'abcd', '12a4', ' 123', '12 34', '１２３４', null, undefined, 1234, [1, 2, 3, 4]].every(function (p) { return !validasiPin(p).ok; }));

  const semuaIdUji = ['K001', 'K002', 'OWN01', 'HPT-NGW-01', 'K007'];
  ujiBebas('ID karyawan otomatis = K + nomor terbesar + 1 (OWN/HPT tidak dihitung)', buatIdKaryawan(semuaIdUji) === 'K008', buatIdKaryawan(semuaIdUji));
  ujiBebas('ID karyawan: nomor akun nonaktif tetap dihitung, tidak pernah dipakai ulang', buatIdKaryawan(semuaIdUji.concat(['K010'])) === 'K011' && buatIdKaryawan(['K001', 'K003']) === 'K004');
  ujiBebas('ID karyawan: akun kosong = K001; lebih dari 999 = K1000', buatIdKaryawan([]) === 'K001' && buatIdKaryawan(['K999']) === 'K1000');
  const akunNama = [
    { id: 'K001', nama: 'Budi Santoso', role: 'KARYAWAN', aktif: true }, { id: 'K002', nama: 'Siti Rohmah', role: 'KARYAWAN', aktif: false },
    { id: 'K003', nama: 'Dewi Lestari', role: 'ADMIN', aktif: true }, { id: 'HPT-NGW-01', nama: 'HP Toko 1', role: 'PERANGKAT', aktif: true }
  ];
  ujiBebas('nama kembar dengan karyawan aktif ditolak (tanpa beda huruf besar/kecil, spasi pinggir)', namaSudahDipakai(akunNama, ' budi SANTOSO ') === true && namaSudahDipakai(akunNama, 'Dewi Lestari') === true);
  ujiBebas('nama yang sama dengan akun nonaktif atau nama HP toko tidak menghalangi', namaSudahDipakai(akunNama, 'Siti Rohmah') === false && namaSudahDipakai(akunNama, 'HP Toko 1') === false && namaSudahDipakai(akunNama, 'Wulan Sari') === false);
  const dataOk = { nama: 'Wulan Sari', panggilan: 'Wulan', shift: '1', mulai_kerja: '2026-10-01' };
  ujiBebas('data karyawan valid diterima', validasiDataKaryawan(dataOk, [1, 2]).ok);
  ujiBebas('data karyawan: shift di luar daftar cabang ditolak', !validasiDataKaryawan({ nama: 'W', panggilan: 'W', shift: '9', mulai_kerja: '2026-10-01' }, [1, 2]).ok);
  ujiBebas('data karyawan: tanggal tidak valid ditolak (31 Feb, teks, kosong)', !validasiDataKaryawan({ nama: 'W', panggilan: 'W', shift: '1', mulai_kerja: '2026-02-31' }, [1]).ok && !validasiDataKaryawan({ nama: 'W', panggilan: 'W', shift: '1', mulai_kerja: 'besok' }, [1]).ok && !validasiDataKaryawan({ nama: 'W', panggilan: 'W', shift: '1', mulai_kerja: '' }, [1]).ok);
  ujiBebas('data karyawan: nama kosong, 61 karakter, atau diawali = + - @ ditolak', !validasiDataKaryawan({ nama: '', panggilan: 'W', shift: '1', mulai_kerja: '2026-10-01' }, [1]).ok && !validasiDataKaryawan({ nama: 'x'.repeat(61), panggilan: 'W', shift: '1', mulai_kerja: '2026-10-01' }, [1]).ok && !validasiDataKaryawan({ nama: '=SUM(A1)', panggilan: 'W', shift: '1', mulai_kerja: '2026-10-01' }, [1]).ok);
  const kar = { role: 'KARYAWAN', cabang: 'Ngawi' };
  ujiBebas('admin hanya karyawan cabangnya: Ngawi boleh, Pusat ditolak', bolehKelolaKaryawan('ADMIN', 'Ngawi', kar).boleh && !bolehKelolaKaryawan('ADMIN', 'Pusat', kar).boleh);
  ujiBebas('baris ADMIN/OWNER/HP toko tidak bisa diubah lewat aksi karyawan', !bolehKelolaKaryawan('ADMIN', 'Ngawi', { role: 'ADMIN', cabang: 'Ngawi' }).boleh && !bolehKelolaKaryawan('ADMIN', 'Ngawi', { role: 'OWNER', cabang: 'Ngawi' }).boleh && !bolehKelolaKaryawan('ADMIN', 'Ngawi', { role: 'PERANGKAT', cabang: 'Ngawi' }).boleh && !bolehKelolaKaryawan('ADMIN', 'Ngawi', undefined).boleh);
  ujiBebas('role lain ditolak untuk aksi karyawan (KARYAWAN, OWNER, PERANGKAT)', ['KARYAWAN', 'OWNER', 'PERANGKAT', '', undefined].every(function (r) { return !bolehKelolaKaryawan(r, 'Ngawi', kar).boleh; }));
  const rp = perubahanResetPin('hashbaru');
  ujiBebas('reset PIN membuka kunci: pin_hash baru, salah_login 0, terkunci FALSE', rp.pin_hash === 'hashbaru' && rp.salah_login === 0 && rp.terkunci === false);
  const akunDaftar = [
    { id: 'K001', nama: 'Budi', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true, panggilan: 'Budi', shift: 1, mulai_kerja: '2026-01-01' },
    { id: 'K002', nama: 'Siti', role: 'KARYAWAN', cabang: 'Ngawi', aktif: false, panggilan: 'Siti', shift: 1, mulai_kerja: '2026-01-01' },
    { id: 'K003', nama: 'Dewi', role: 'ADMIN', cabang: 'Ngawi', aktif: true, panggilan: 'Dewi', shift: 1, mulai_kerja: '2026-01-01' },
    { id: 'OWN01', nama: 'owner', role: 'OWNER', cabang: '', aktif: true, panggilan: '', shift: '', mulai_kerja: '' },
    { id: 'K004', nama: 'Rina', role: 'KARYAWAN', cabang: 'Pusat', aktif: true, panggilan: 'Rina', shift: 1, mulai_kerja: '2026-01-01' },
    { id: 'HPT-NGW-01', nama: 'HP Toko 1', role: 'PERANGKAT', cabang: 'Ngawi', aktif: true, panggilan: '', shift: '', mulai_kerja: '' }
  ];
  ujiBebas('layar Karyawan: hanya KARYAWAN aktif cabang itu (ADMIN/OWNER/HP/cabang lain tidak tampil)', saringDaftarKaryawan(akunDaftar, 'Ngawi', false).map(function (x) { return x.id; }).join(',') === 'K001');
  ujiBebas('layar Karyawan: saklar nonaktif menampilkan K002 juga, tetap tanpa ADMIN/OWNER', saringDaftarKaryawan(akunDaftar, 'Ngawi', true).map(function (x) { return x.id; }).join(',') === 'K001,K002');
  ujiBebas('daftar nama di layar pilih nama: nonaktif (K002) tidak muncul, ADMIN aktif muncul, HP/owner/cabang lain tidak', daftarUntukPilihNama(akunDaftar, 'Ngawi').map(function (x) { return x.id; }).join(',') === 'K001,K003');

  // ---- Foto absen: id absen, validasi gambar dan unggahan (tanpa menulis ke Drive/sheet) ----
  ujiBebas('kode perangkat dari ID HP toko: HPT-NGW-03 = T3, HPT-NGW-10 = T10', kodePerangkatDariHp('HPT-NGW-03') === 'T3' && kodePerangkatDariHp('HPT-NGW-10') === 'T10' && kodePerangkatDariHp('aneh') === 'T0');
  ujiBebas('id absen memakai jam tiket: M-K001-261005-074512-T3 dan L untuk lembur', buatIdAbsen('M', 'K001', epoch('07:45:12'), 'HPT-NGW-03') === 'M-K001-261005-074512-T3' && buatIdAbsen('L', 'K002', epoch('18:35:09'), 'HPT-NGW-01') === 'L-K002-261005-183509-T1', buatIdAbsen('M', 'K001', epoch('07:45:12'), 'HPT-NGW-03'));
  const jpegUji = '/9j/' + 'A'.repeat(396);
  ujiBebas('gambar JPEG kecil diterima (juga dengan awalan data:image/jpeg;base64,)', periksaGambarJpeg(jpegUji).ok && periksaGambarJpeg('data:image/jpeg;base64,' + jpegUji).ok);
  ujiBebas('gambar bukan JPEG ditolak (PNG, data URI png, GIF)', !periksaGambarJpeg('iVBO' + 'A'.repeat(396)).ok && !periksaGambarJpeg('data:image/png;base64,' + jpegUji).ok && !periksaGambarJpeg('R0lG' + 'A'.repeat(396)).ok);
  ujiBebas('gambar 300 KB pas diterima, sedikit di atasnya ditolak, 375 KB ditolak', periksaGambarJpeg('/9j/' + 'A'.repeat(409600 - 4)).ok === true && periksaGambarJpeg('/9j/' + 'A'.repeat(409600)).ok === false && periksaGambarJpeg('/9j/' + 'A'.repeat(500000)).ok === false);
  ujiBebas('gambar kosong/bukan teks/karakter aneh/terlalu pendek ditolak', !periksaGambarJpeg('').ok && !periksaGambarJpeg(null).ok && !periksaGambarJpeg(12345).ok && !periksaGambarJpeg('/9j/' + '!'.repeat(396)).ok && !periksaGambarJpeg('/9j/AAAA').ok);

  const hpFoto = { cabang: 'Ngawi' };
  const hariFoto = '2026-10-05';
  const barisFoto = { tanggal: '2026-10-05', cabang: 'Ngawi', id_masuk: 'M-K001-261005-074512-T3', foto_masuk: '', id_pulang: 'P-K001-261005-163100-T3', foto_pulang: TEKS_TANPA_FOTO };
  const pFoto = { jenis: 'MASUK', id_absen: barisFoto.id_masuk, gambar: jpegUji };
  ujiBebas('unggah foto valid diterima (baris ada, cabang sama, hari ini, kolom kosong)', validasiUnggahFoto(pFoto, barisFoto, hpFoto, hariFoto).ok === true);
  ujiBebas('unggah foto: absen tidak ada ditolak', !validasiUnggahFoto(pFoto, null, hpFoto, hariFoto).ok && cariBarisAbsen([barisFoto], 'MASUK', 'M-K999-261005-000000-T3') === null);
  ujiBebas('unggah foto: cabang beda ditolak', !validasiUnggahFoto(pFoto, barisFoto, { cabang: 'Pusat' }, hariFoto).ok);
  ujiBebas('unggah foto: bukan tanggal hari ini ditolak', !validasiUnggahFoto(pFoto, barisFoto, hpFoto, '2026-10-06').ok);
  ujiBebas('unggah foto: sudah ada foto (tautan) ditolak', !validasiUnggahFoto(pFoto, Object.assign({}, barisFoto, { foto_masuk: 'https://drive.google.com/file/d/abc' }), hpFoto, hariFoto).ok);
  ujiBebas('unggah foto: kolom berisi TANPA FOTO masih boleh diisi foto', validasiUnggahFoto({ jenis: 'PULANG', id_absen: barisFoto.id_pulang, gambar: jpegUji }, barisFoto, hpFoto, hariFoto).ok === true);
  ujiBebas('unggah foto: ukuran terlalu besar atau bukan JPEG ditolak', !validasiUnggahFoto({ jenis: 'MASUK', id_absen: barisFoto.id_masuk, gambar: '/9j/' + 'A'.repeat(500000) }, barisFoto, hpFoto, hariFoto).ok && !validasiUnggahFoto({ jenis: 'MASUK', id_absen: barisFoto.id_masuk, gambar: 'iVBO' + 'A'.repeat(396) }, barisFoto, hpFoto, hariFoto).ok);
  ujiBebas('unggah foto: jenis tidak dikenal ditolak', !validasiUnggahFoto({ jenis: 'LAIN', gambar: jpegUji }, barisFoto, hpFoto, hariFoto).ok);
  ujiBebas('unggah foto: tanda "tanpa foto" diterima tanpa gambar, tapi tetap dicek cabang dan sudah-ada-foto', validasiUnggahFoto({ jenis: 'MASUK', tanpa_foto: true }, barisFoto, hpFoto, hariFoto).tanpa === true && !validasiUnggahFoto({ jenis: 'MASUK', tanpa_foto: true }, barisFoto, { cabang: 'Pusat' }, hariFoto).ok);
  ujiBebas('cari baris absen: masuk lewat id_masuk, pulang lewat id_pulang (tidak tertukar)', cariBarisAbsen([barisFoto], 'MASUK', barisFoto.id_masuk) === barisFoto && cariBarisAbsen([barisFoto], 'MASUK', barisFoto.id_pulang) === null && cariBarisAbsen([barisFoto], 'PULANG', barisFoto.id_pulang) === barisFoto);

  // ---- Foto: jalur folder dan nama berkas, pemilihan folder akar ----
  const barisJalur = { tanggal: '2026-10-06', cabang: 'Ngawi', karyawan: 'K001', nama: 'Ahmad Fauzi', shift: 1, id_masuk: 'M-K001-261006-075512-T1', id_pulang: 'P-K001-261006-163100-T1' };
  const jm = jalurFoto(barisJalur, 'MASUK');
  ujiBebas('jalur foto contoh kesepakatan: Ngawi/2026/10/K001_Ahmad Fauzi + 061026_MASUK1_0755.jpg', jm.segmen.join('/') === 'Ngawi/2026/10/K001_Ahmad Fauzi' && jm.namaBerkas === '061026_MASUK1_0755.jpg', JSON.stringify(jm));
  const jp = jalurFoto(Object.assign({}, barisJalur, { shift: 2 }), 'PULANG');
  ujiBebas('jalur foto pulang shift 2: 061026_PULANG2_1631.jpg (jam dari id absen, nomor shift dari baris)', jp.namaBerkas === '061026_PULANG2_1631.jpg', JSON.stringify(jp));
  ujiBebas('lembur memakai kata PULANG di nama berkas (id berawalan L-)', jalurFoto(Object.assign({}, barisJalur, { id_pulang: 'L-K001-261006-183509-T1' }), 'PULANG').namaBerkas === '061026_PULANG1_1835.jpg');
  const jAkhir = jalurFoto(Object.assign({}, barisJalur, { tanggal: '2026-12-31', id_masuk: 'M-K001-261231-235959-T1' }), 'MASUK');
  ujiBebas('tahun, bulan, tanggal dari baris absensi: 31 Des 2026 jam 23:59 = 2026/12 dan 311226_MASUK1_2359.jpg', jAkhir.segmen[1] === '2026' && jAkhir.segmen[2] === '12' && jAkhir.namaBerkas === '311226_MASUK1_2359.jpg');
  ujiBebas('jalur foto: id absen tidak valid atau tanggal rusak = null (tidak menebak)', jalurFoto(Object.assign({}, barisJalur, { id_masuk: 'asal' }), 'MASUK') === null && jalurFoto(Object.assign({}, barisJalur, { tanggal: 'besok' }), 'MASUK') === null);
  ujiBebas('karakter terlarang dibuang dari nama (/ \ : * ? " < > |) dan spasi dirapikan', bersihkanNamaBerkas('  Ahmad / Fauzi: *"<x>"?|\  ') === 'Ahmad Fauzi x' && bersihkanNamaBerkas('A/B') === 'AB' && bersihkanNamaBerkas('   ') === '');
  const jKotor = jalurFoto(Object.assign({}, barisJalur, { nama: 'Ahmad/Fauzi:*?"<>|', cabang: 'Nga/wi' }), 'MASUK');
  ujiBebas('nama karyawan/cabang terlarang dibersihkan di jalur folder', jKotor.segmen[3] === 'K001_AhmadFauzi' && jKotor.segmen[0] === 'Ngawi', JSON.stringify(jKotor.segmen));
  ujiBebas('folder akar: ID terisi dipakai (dipangkas spasi)', JSON.stringify(keputusanFolderAkar('  1onHwdnNJ2_Ix-MOdZSCTros-AqexMZCV \n')) === JSON.stringify({ mode: 'ID', id: '1onHwdnNJ2_Ix-MOdZSCTros-AqexMZCV' }));
  ujiBebas('folder akar: kosong, spasi, atau baris tidak ada = jalur bawaan', keputusanFolderAkar('').mode === 'BAWAAN' && keputusanFolderAkar('   ').mode === 'BAWAAN' && keputusanFolderAkar(undefined).mode === 'BAWAAN' && keputusanFolderAkar(null).mode === 'BAWAAN');
  ujiBebas('folder akar: ID salah TIDAK fallback ke bawaan (tetap mode ID)', keputusanFolderAkar('id-ngawur').mode === 'ID' && keputusanFolderAkar(12345).mode === 'ID');
  const cacheGalat = { d: {}, get: function (k) { return this.d[k] || null; }, put: function (k, v) { this.d[k] = v; } };
  ujiBebas('galat folder dicatat paling banyak sekali per jam', perluCatatGalatFolder(cacheGalat, t0) === true && perluCatatGalatFolder(cacheGalat, t0 + 30 * 60000) === false && perluCatatGalatFolder(cacheGalat, t0 + 61 * 60000) === true);

  // ---- Daftar HP toko (owner) ----
  const akunHp = [
    { id: 'HPT-NGW-02', role: 'PERANGKAT', nama: 'HP Toko 2', cabang: 'Ngawi', aktif: true },
    { id: 'HPT-NGW-01', role: 'PERANGKAT', nama: 'HP Toko 1', cabang: 'Ngawi', aktif: false },
    { id: 'HPT-PST-01', role: 'PERANGKAT', nama: 'HP Pusat', cabang: 'Pusat', aktif: true },
    { id: 'K001', role: 'KARYAWAN', nama: 'Ahmad', cabang: 'Ngawi', aktif: true }
  ];
  const dh = saringDaftarHp(akunHp, '', false);
  ujiBebas('daftar HP: bawaan menyembunyikan yang nonaktif dan bukan-HP', dh.length === 2 && dh[0].id === 'HPT-NGW-02' && dh[1].id === 'HPT-PST-01', JSON.stringify(dh));
  ujiBebas('daftar HP: tampilkan nonaktif = 3 baris, urut ID', saringDaftarHp(akunHp, '', true).map(function (x) { return x.id; }).join(',') === 'HPT-NGW-01,HPT-NGW-02,HPT-PST-01');
  ujiBebas('daftar HP: filter cabang Pusat', saringDaftarHp(akunHp, 'Pusat', true).length === 1 && saringDaftarHp(akunHp, 'Ngawi', false).length === 1);

  // ---- Validasi nama HP & hak ubah nama ----
  ujiBebas('nama HP kosong ditolak', !validasiNamaHp('').ok && !validasiNamaHp('    ').ok && !validasiNamaHp(null).ok);
  ujiBebas('nama HP 40 karakter diterima, 41 karakter ditolak', validasiNamaHp('x'.repeat(40)).ok && !validasiNamaHp('x'.repeat(41)).ok);
  ujiBebas('nama HP dipangkas spasi sebelum dihitung (40 karakter + spasi diterima)', validasiNamaHp('  ' + 'x'.repeat(40) + '  ').ok && validasiNamaHp('  HP Kasir  ').nama === 'HP Kasir');
  ujiBebas('nama HP kembar diterima (tidak ada cek keunikan)', validasiNamaHp('HP Toko 1').ok);
  const hpNgawi = { id: 'HPT-NGW-01', role: 'PERANGKAT', cabang: 'Ngawi' };
  const hpPusat = { id: 'HPT-PST-01', role: 'PERANGKAT', cabang: 'Pusat' };
  ujiBebas('hak ubah nama: owner boleh HP mana pun', bolehUbahNamaHp('OWNER', '', hpNgawi, null).boleh && bolehUbahNamaHp('OWNER', '', hpPusat, null).boleh);
  ujiBebas('hak ubah nama: admin boleh HP yang dipegang di cabang sama', bolehUbahNamaHp('ADMIN', 'Ngawi', hpNgawi, 'HPT-NGW-01').boleh);
  ujiBebas('hak ubah nama: admin cabang lain ditolak', !bolehUbahNamaHp('ADMIN', 'Pusat', hpNgawi, 'HPT-NGW-01').boleh);
  ujiBebas('hak ubah nama: admin tidak boleh HP lain walau cabang sama', !bolehUbahNamaHp('ADMIN', 'Ngawi', { id: 'HPT-NGW-02', role: 'PERANGKAT', cabang: 'Ngawi' }, 'HPT-NGW-01').boleh);
  ujiBebas('hak ubah nama: admin tanpa token HP ditolak', !bolehUbahNamaHp('ADMIN', 'Ngawi', hpNgawi, null).boleh);
  ujiBebas('hak ubah nama: KARYAWAN/PERANGKAT ditolak', !bolehUbahNamaHp('KARYAWAN', 'Ngawi', hpNgawi, 'HPT-NGW-01').boleh && !bolehUbahNamaHp('PERANGKAT', 'Ngawi', hpNgawi, 'HPT-NGW-01').boleh);
  ujiBebas('hak ubah nama: target bukan HP toko ditolak', !bolehUbahNamaHp('OWNER', '', { id: 'K001', role: 'KARYAWAN', cabang: 'Ngawi' }, null).boleh && !bolehUbahNamaHp('OWNER', '', undefined, null).boleh);

  // ---- Dua owner terpisah, keluarkan semua hanya akun sendiri, pesan gagal login ----
  const dua = [{ id: 'OWN01', nama: 'owner', role: 'OWNER', aktif: true, pw_hash: 'h1', ganti_pw: false }, { id: 'OWN02', nama: 'Bu Sari', role: 'OWNER', aktif: true, pw_hash: '', ganti_pw: true }];
  ujiBebas('dua owner: username benar menemukan akun masing-masing', temukanOwner(dua, 'OWNER').id === 'OWN01' && temukanOwner(dua, 'bu SARI').id === 'OWN02');
  ujiBebas('dua owner: jalur login pertama hanya untuk baris yang pw_hash kosong + ganti_pw TRUE', jalurPasswordAwal(dua[0]).boleh === false && jalurPasswordAwal(dua[1]).boleh === true);
  const dua5 = keputusanSalahPassword(4, t0);
  ujiBebas('dua owner: OWN01 salah ke-5 ditahan, OWN02 (0 salah) tidak ikut ditahan', dua5.tahanSampai !== null && keputusanSalahPassword(0, t0).tahanSampai === null);
  const sesiDua = [
    { id_sesi: 'A', akun: 'OWN01', aktif: true }, { id_sesi: 'B', akun: 'OWN02', aktif: true }, { id_sesi: 'C', akun: 'OWN02', aktif: true }
  ];
  const habisOwn01 = cabutSesiPada(sesiDua, 'OWN01', '');
  ujiBebas('keluarkan semua: OWN01 menekan = hanya sesi OWN01 dicabut, sesi OWN02 tetap aktif',
    habisOwn01.filter(function (x) { return x.akun === 'OWN01'; }).every(function (x) { return !x.aktif; }) &&
    habisOwn01.filter(function (x) { return x.akun === 'OWN02'; }).every(function (x) { return x.aktif; }));
  ujiBebas('pesan gagal login owner SAMA untuk username tidak ada dan password salah', pesanLoginOwnerGagal('TIDAK_ADA') === pesanLoginOwnerGagal('PASSWORD_SALAH') && pesanLoginOwnerGagal('TIDAK_ADA') === 'Username atau password salah');

  const jumlahSkenario = baris.length;
  baris.push('');
  baris.push('TES MANUAL (butuh menulis ke sheet, jalankan sendiri di aplikasi):');
  baris.push('  - Daftar HP, kartu Hari ini, dan Perlu perhatian pada data nyata: angka sama dengan sheet absensi dan log');
  baris.push('  - Login pertama owner: isi username "owner" saja, aplikasi minta password baru, lalu masuk ke beranda owner');
  baris.push('  - sheet akun baris OWN01: pw_hash terisi dan ganti_pw jadi FALSE; sheet sesi bertambah 1 baris (aktif TRUE, kedaluwarsa 7 hari)');
  baris.push('  - Login owner dari perangkat/browser baru: sheet log ada baris LOGIN_PERANGKAT_BARU dan muncul di Perlu perhatian');
  baris.push('  - Daftarkan HP toko baru: muncul di Perlu perhatian owner (HP toko baru, oleh admin, jam, jarak)');
  baris.push('  - Tombol Nonaktifkan: kolom aktif HP jadi FALSE, log NONAKTIFKAN_HP_TOKO, HP itu langsung ditolak (HP kembali ke layar "HP ini belum terdaftar")');
  baris.push('  - Keluarkan semua perangkat: semua baris sesi OWN01 jadi aktif FALSE, perangkat lain diminta login lagi');
  baris.push('  - Salah password owner 5x: pesan "ditahan 15 menit", log TAHAN_LOGIN_OWNER; sesudah 15 menit bisa login lagi');
  baris.push('  - Dua owner (OWN01 dan OWN02): masing-masing login dengan username sendiri; keluarkan semua perangkat OWN01 tidak mengeluarkan OWN02; tahan 15 menit satu owner tidak menahan yang lain');
  baris.push('  - Username owner yang tidak ada dan password salah: pesan sama; setelah 5x username palsu juga ditahan (tes: ketik username ngawur 5x)');
  baris.push('  - Perlu perhatian: "tandai dibaca" memajukan penanda hanya untuk owner yang menekan (Script Properties dibaca_OWN01); owner lain masih melihat item sebagai baru');
  baris.push('  - Ubah nama HP: owner boleh HP mana pun; admin hanya HP yang dipegangnya dan hanya kalau cabang admin sama; hanya kolom nama yang berubah (panggilan, id, aktif, pw_hash tidak berubah); nama "=SUM(A1)" tersimpan sebagai teks; log UBAH_NAMA_HP_TOKO tercatat; label di layar utama HP ikut baru segera');
  baris.push('  - Jalankan siapkanFolderFoto sekali (setujui izin Drive): Log eksekusi menyebut nama, ID, dan tautan folder akar; dengan folder_foto_id terisi dipakai folder itu, dengan kosong dibuat/dipakai "FOTO ABSEN WEB" di folder yang sama dengan spreadsheet; ID salah = pesan GAGAL tanpa membuat folder lain');
  baris.push('  - Foto pertama sebuah cabang/bulan/orang membuat subfolder otomatis (Cabang/Tahun/Bulan/ID_Nama); foto berikutnya memakai folder yang sama (tidak kembar); nama berkas contoh 061026_MASUK1_0755.jpg');
  baris.push('  - folder_foto_id diisi ID yang salah: absen tetap tersimpan, foto = TANPA FOTO, sheet log ada satu baris FOTO_FOLDER_ERROR (maksimal sekali per jam)');
  baris.push('  - Absen masuk di HP toko dengan kamera diizinkan: absen tersimpan dan pop-up tampil DULU, beberapa detik kemudian foto_masuk berisi tautan Drive (berkas DDMMYY_MASUK<shift>_HHMM.jpg), id_masuk terisi');
  baris.push('  - Absen dengan kamera ditolak (izin kamera diblokir): absen tetap tersimpan, foto_masuk = TANPA FOTO');
  baris.push('  - Foto pulang/lembur: setelah keterangan diisi, foto_pulang berisi tautan; id_pulang berawalan P- (pulang) atau L- (lembur); revisi/ganti jadi lembur mengosongkan foto_pulang lalu mengisinya dengan foto baru');
  baris.push('  - Tambah karyawan di HP toko (admin): ID baru K + nomor terbesar + 1, cabang ikut admin, pin_hash terisi, pw_hash KOSONG, aktif TRUE; batalkan di layar PIN = tidak ada baris baru');
  baris.push('  - Tambah karyawan dengan nama yang sama dengan karyawan aktif (huruf besar/kecil beda): ditolak dengan pesan jelas');
  baris.push('  - Reset PIN: karyawan yang terkunci bisa absen lagi dengan PIN baru (terkunci FALSE, salah_login 0); Nonaktifkan: nama hilang dari layar pilih nama, baris tetap di sheet');
  baris.push('  - Karyawan, Reset PIN, Nonaktifkan tercatat di sheet log (TAMBAH_KARYAWAN, RESET_PIN, NONAKTIFKAN_KARYAWAN) tanpa PIN');
  baris.push('  - Menu owner/admin: ketuk di mana saja di luar kotak menu menutup menu (HP dan laptop), ketuk di dalam kotak tidak menutup');
  baris.push('  - Tandai dibaca per item/semua: Script Properties dibaca_OWN01 berisi JSON kecil; owner lain tidak terpengaruh');
  baris.push('  - Jalankan pasangPemicuHarian sekali: menu Pemicu di Apps Script menampilkan resetSalahLoginHarian (harian ~00:05); jalankan lagi tidak membuat pemicu ganda');
  baris.push('  - Jalankan resetSalahLoginHarian sekali: salah_login akun yang belum terkunci jadi 0, akun terkunci tetap terkunci');
  baris.push('  - Jalankan bersihkanPenahananPalsu sekali: log menyebut properti yang dihapus (biasanya 0); KODE_RAHASIA dan tahan_OWN01 tidak tersentuh');
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
  if (masihDitahan(tahan, sekarang)) { return pesanTahan(tahan); }
  if (tahan) {
    props.deleteProperty('tahan_' + owner.id);
    perbaruiKolom(akun, owner, { salah_login: 0 });
  }
  return '';
}

/** Fungsi murni: cari baris role OWNER dengan username (nama) ini, tanpa beda huruf besar/kecil. Boleh ada lebih dari satu owner. */
function temukanOwner(dataAkun, usernameMentah) {
  const username = String(usernameMentah || '').trim().toLowerCase();
  if (!username) { return null; }
  return dataAkun.find(function (r) { return String(r.nama).trim().toLowerCase() === username && r.role === 'OWNER'; }) || null;
}

function cariOwner(usernameMentah) {
  const akun = bacaSheet('akun');
  return { akun: akun, owner: temukanOwner(akun.data, usernameMentah) };
}

/** Pesan gagal login owner: SAMA untuk username tidak ada dan password salah (dites di tesServer). */
function pesanLoginOwnerGagal(kasus) {
  return 'Username atau password salah';
}

function pesanTahan(tahanMs) {
  return 'Login owner ditahan sampai ' + Utilities.formatDate(new Date(tahanMs), ZONA_ABSEN, 'HH:mm') + ' karena salah password 5 kali';
}

/**
 * Username owner yang tidak ada (atau akunnya tidak aktif) diperlakukan SAMA dengan password salah:
 * pesan yang sama, dan juga ditahan 15 menit setelah 5x (hitungan di CacheService), supaya
 * pesan login tidak membocorkan username mana yang ada.
 */
function gagalLoginOwnerPalsu(usernameMentah) {
  const sidik = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'owner|' + String(usernameMentah || '').trim().toLowerCase())).slice(0, 24);
  const r = catatGagalPalsu(CacheService.getScriptCache(), sidik, Date.now());
  if (r.ditahan) {
    return respon({
      status: 'gagal', kode: 'DITAHAN',
      pesan: r.barusan ? 'Salah password 5 kali. Login owner ditahan ' + TAHAN_LOGIN_OWNER_MENIT + ' menit' : pesanTahan(r.tahanSampai)
    });
  }
  return respon({ status: 'gagal', pesan: pesanLoginOwnerGagal('TIDAK_ADA') });
}

/**
 * Catat satu percobaan login username palsu. HANYA di cache (cache = objek dengan get/put/remove,
 * kedaluwarsa sendiri sekitar 15 menit); tidak menyentuh Script Properties maupun sheet.
 */
function catatGagalPalsu(cache, sidik, sekarangMs) {
  const ttl = TAHAN_LOGIN_OWNER_MENIT * 60;
  const tahan = Number(cache.get('palsu_tahan_' + sidik) || 0);
  if (masihDitahan(tahan, sekarangMs)) { return { ditahan: true, tahanSampai: tahan, barusan: false }; }
  const k = keputusanSalahPassword(Number(cache.get('palsu_salah_' + sidik) || 0), sekarangMs);
  if (k.tahanSampai) {
    cache.put('palsu_tahan_' + sidik, String(k.tahanSampai), ttl);
    cache.remove('palsu_salah_' + sidik);
    return { ditahan: true, tahanSampai: k.tahanSampai, barusan: true };
  }
  cache.put('palsu_salah_' + sidik, String(k.salahBaru), ttl);
  return { ditahan: false };
}

/** Aksi login_owner. Jalur pw_hash kosong: balas perlu_password_baru (belum login). */
function prosesLoginOwner(d) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const pesanUmum = pesanLoginOwnerGagal('PASSWORD_SALAH');
  const password = String(d.password || '');
  if (password.length > 100) { return respon({ status: 'gagal', pesan: pesanUmum }); }

  const c = cariOwner(d.username);
  if (!c.owner || c.owner.aktif !== true) { return gagalLoginOwnerPalsu(d.username); }
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

/** Aksi owner_beranda: nama owner dan perangkat yang sedang login (untuk dialog "Keluarkan semua perangkat"). */
function prosesOwnerBeranda(sesiToken) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const sekarang = Date.now();
  const perangkatAktif = bacaSesi().data
    .filter(function (r) { return String(r.akun) === String(s.akun.id) && r.aktif === true && sesiMasihBerlaku(msDariSel(r.kedaluwarsa), sekarang); })
    .map(function (r) {
      return { label: labelDariPerangkat(r.perangkat), terakhir_aktif: teksWaktu(msDariSel(r.terakhir_aktif)), ini: r.id_sesi === s.baris.id_sesi };
    });
  return respon({ status: 'ok', nama: s.akun.nama, id: s.akun.id, perangkat_aktif: perangkatAktif });
}

/**
 * ---- Perlu perhatian (owner) ----
 * Sumbernya log: pendaftaran HP toko baru dan login owner dari perangkat baru, HANYA 7 hari terakhir.
 * Semua owner melihat item yang sama. Penanda "dibaca" disimpan per owner di Script Properties
 * dibaca_<ID owner> sebagai JSON { semua_sampai: ms, item: { <kunci item>: ms item } }:
 *  - semua_sampai: semua item yang lebih lama/sama dengan waktu ini dianggap sudah dibaca;
 *  - item: item yang ditandai dibaca satu per satu (dibuang kalau lebih tua dari 7 hari atau
 *    sudah tercakup semua_sampai, dan dibatasi MAKS_ENTRI_DIBACA supaya nilainya kecil).
 * Data log tidak pernah diubah atau dihapus.
 */
var BATAS_PERHATIAN_HARI = 7;
var MAKS_BARIS_LOG_PERHATIAN = 1000;
var BATAS_ITEM_DAFTAR = 15;
var MAKS_ENTRI_DIBACA = 100;
var MAKS_UKURAN_PENANDA = 8000; // karakter; batas Script Properties 9 KB per nilai

function bersihNamaKunci(teks, maks) { return String(teks === undefined || teks === null ? '' : teks).replace(/\|/g, '_').slice(0, maks); }

/** Kunci stabil satu item perhatian: "ms|TIPE|oleh|id". */
function kunciItem(ms, tipe, oleh, id) { return ms + '|' + tipe + '|' + bersihNamaKunci(oleh, 20) + '|' + bersihNamaKunci(id, 40); }

/** Fungsi murni: dari baris log jadi daftar item perhatian (terbaru di atas) sejak batasMs. */
function rakitPerhatian(logRows, namaDari, batasMs) {
  const items = [];
  logRows.forEach(function (r) {
    const ms = msDariSel(r.waktu);
    if (ms < batasMs) { return; }
    if (r.jenis === 'PERANGKAT' && r.aksi === 'DAFTAR_HP_TOKO') {
      const m = /jarak ke toko (\d+) m/.exec(String(r.alasan));
      items.push({
        ms: ms, kunci: kunciItem(ms, 'HP_BARU', r.oleh, r.id), tipe: 'HP_BARU', judul: 'HP toko baru: ' + r.id + ' (' + r.target + ')',
        sub: 'Cabang ' + r.cabang + ' · oleh ' + namaDari(r.oleh) + ' · ' + teksWaktu(ms),
        info: m ? m[1] + ' m dari toko' : ''
      });
    } else if (r.jenis === 'KEAMANAN' && r.aksi === 'LOGIN_PERANGKAT_BARU') {
      items.push({
        ms: ms, kunci: kunciItem(ms, 'LOGIN_BARU', r.oleh, r.id), tipe: 'LOGIN_BARU', judul: 'Login ' + namaDari(r.oleh) + ' dari perangkat baru',
        sub: r.target + ' · ' + teksWaktu(ms), info: ''
      });
    }
  });
  items.sort(function (a, b) { return b.ms - a.ms; });
  return items;
}

/** Fungsi murni: penanda yang sudah dirapikan (entri tua/tercakup/kelebihan dibuang). */
function bersihkanPenanda(p, sekarangMs) {
  const batas = sekarangMs - BATAS_PERHATIAN_HARI * 24 * 3600000;
  const hasil = { semua_sampai: Number(p && p.semua_sampai) || 0, item: {} };
  const asal = (p && p.item) || {};
  Object.keys(asal)
    .filter(function (k) { const ms = Number(asal[k]); return ms >= batas && ms > hasil.semua_sampai; })
    .sort(function (a, b) { return Number(asal[b]) - Number(asal[a]); })
    .slice(0, MAKS_ENTRI_DIBACA)
    .forEach(function (k) { hasil.item[k] = Number(asal[k]); });
  // Jaga ukuran nilai: buang entri terlama sampai muat (kunci panjang pun tidak melewati batas).
  let kunciUrut = Object.keys(hasil.item).sort(function (a, b) { return hasil.item[a] - hasil.item[b]; });
  while (JSON.stringify(hasil).length > MAKS_UKURAN_PENANDA && kunciUrut.length) { delete hasil.item[kunciUrut.shift()]; }
  return hasil;
}

/** Fungsi murni: item yang belum dibaca. penanda boleh angka (bentuk lama: semua_sampai saja). */
function itemBelumDibaca(items, penanda) {
  const p = typeof penanda === 'number' ? { semua_sampai: penanda, item: {} } : penanda;
  return items.filter(function (it) { return it.ms > p.semua_sampai && !p.item[it.kunci]; });
}

/** Fungsi murni: tandai satu item. Kembalikan penanda baru, atau null kalau kunci tidak sah. */
function tandaiSatuPenanda(p, kunci, sekarangMs) {
  if (typeof kunci !== 'string' || !/^\d{12,14}\|[A-Z_]+\|[^|]{0,20}\|[^|]{0,40}$/.test(kunci)) { return null; }
  const ms = Number(kunci.split('|')[0]);
  const salinan = { semua_sampai: p.semua_sampai, item: {} };
  Object.keys(p.item).forEach(function (k) { salinan.item[k] = p.item[k]; });
  salinan.item[kunci] = ms;
  return bersihkanPenanda(salinan, sekarangMs);
}

/** Fungsi murni: tandai semua dibaca = majukan semua_sampai ke sekarang, daftar item dikosongkan. */
function tandaiSemuaPenanda(sekarangMs) { return { semua_sampai: sekarangMs, item: {} }; }

function itemUntukHalaman(it) { return { id: it.kunci, tipe: it.tipe, judul: it.judul, sub: it.sub, info: it.info }; }

/** Fungsi murni: jumlah belum dibaca (tampil maksimal 99, lebih dari itu "99+") dan 3 item terbaru yang belum dibaca. */
function ringkasPerhatian(items, penanda) {
  const belum = itemBelumDibaca(items, penanda);
  return {
    jumlah_belum: Math.min(belum.length, 99), jumlah_teks: belum.length > 99 ? '99+' : String(belum.length), lebih: belum.length > 99,
    terbaru: belum.slice(0, 3).map(itemUntukHalaman)
  };
}

/** Fungsi murni: daftar lengkap yang belum dibaca, maksimal 15 item terbaru. */
function daftarPerhatian(items, penanda) {
  const belum = itemBelumDibaca(items, penanda);
  return {
    jumlah_belum: Math.min(belum.length, 99), jumlah_teks: belum.length > 99 ? '99+' : String(belum.length), lebih: belum.length > 99,
    daftar: belum.slice(0, BATAS_ITEM_DAFTAR).map(itemUntukHalaman)
  };
}

function bacaPenanda(idOwner, sekarangMs) {
  const mentah = PropertiesService.getScriptProperties().getProperty('dibaca_' + idOwner);
  let p = { semua_sampai: 0, item: {} };
  if (mentah) {
    if (/^\d+$/.test(mentah)) { p.semua_sampai = Number(mentah); } // bentuk lama: hanya angka waktu
    else { try { p = JSON.parse(mentah); } catch (e) { p = { semua_sampai: 0, item: {} }; } }
  }
  return bersihkanPenanda(p, sekarangMs);
}

/**
 * Baca baris-baris TERAKHIR sheet log saja (bukan seluruh sheet): dari bawah ke atas per blok
 * 100 baris, berhenti setelah melewati batas waktu atau maksBaris baris.
 */
function bacaLogTerakhir(batasMs, maksBaris) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return []; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  const hasil = [];
  let akhir = terakhir;
  while (akhir >= 2 && hasil.length < maksBaris) {
    const awal = Math.max(2, akhir - 99);
    const nilai = sheet.getRange(awal, 1, akhir - awal + 1, lebar).getValues();
    let terlama = Infinity;
    for (let i = nilai.length - 1; i >= 0; i--) {
      const r = {};
      header.forEach(function (nama, idx) { r[nama] = nilai[i][idx]; });
      terlama = Math.min(terlama, msDariSel(r.waktu));
      hasil.push(r);
    }
    if (terlama < batasMs) { break; }
    akhir = awal - 1;
  }
  return hasil;
}

function ambilItemPerhatian(s) {
  const sekarang = Date.now();
  const batas = sekarang - BATAS_PERHATIAN_HARI * 24 * 3600000;
  const semuaAkun = bacaSheet('akun').data;
  const namaDari = function (id) {
    const a = semuaAkun.find(function (r) { return String(r.id) === String(id); });
    return a ? a.nama : String(id);
  };
  return {
    items: rakitPerhatian(bacaLogTerakhir(batas, MAKS_BARIS_LOG_PERHATIAN), namaDari, batas),
    penanda: bacaPenanda(s.akun.id, sekarang)
  };
}

/** Aksi owner_perhatian: jumlah belum dibaca (maks "99+") + 3 item terbaru yang belum dibaca. */
function prosesOwnerPerhatian(sesiToken) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const p = ambilItemPerhatian(s);
  const r = ringkasPerhatian(p.items, p.penanda);
  return respon({ status: 'ok', jumlah_belum: r.jumlah_belum, jumlah_teks: r.jumlah_teks, lebih: r.lebih, terbaru: r.terbaru });
}

/** Aksi owner_perhatian_daftar: maksimal 15 item terbaru yang belum dibaca. */
function prosesOwnerPerhatianDaftar(sesiToken) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const p = ambilItemPerhatian(s);
  const r = daftarPerhatian(p.items, p.penanda);
  return respon({ status: 'ok', jumlah_belum: r.jumlah_belum, jumlah_teks: r.jumlah_teks, lebih: r.lebih, daftar: r.daftar });
}

/** Aksi owner_tandai_dibaca { id } (satu item) atau { mode: 'semua' } (majukan semua_sampai ke sekarang). */
function prosesOwnerTandaiDibaca(sesiToken, id, mode) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(5000);
  try {
    const sekarang = Date.now();
    let baru;
    if (mode === 'semua') {
      baru = tandaiSemuaPenanda(sekarang);
    } else {
      baru = tandaiSatuPenanda(bacaPenanda(s.akun.id, sekarang), id, sekarang);
      if (!baru) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
    }
    PropertiesService.getScriptProperties().setProperty('dibaca_' + s.akun.id, JSON.stringify(baru));
  } finally {
    kunci.releaseLock();
  }
  return respon({ status: 'ok' });
}

/**
 * ---- Pemeliharaan harian ----
 * pasangPemicuHarian(): jalankan SATU KALI dari editor Apps Script; membuat pemicu harian ~00:05
 * (zona Asia/Jakarta) untuk resetSalahLoginHarian(). Tidak membuat pemicu ganda.
 * resetSalahLoginHarian(): salah_login = 0 untuk semua akun yang BELUM terkunci. Akun terkunci tetap
 * terkunci (kolom terkunci tidak disentuh).
 */
function pasangPemicuHarian() {
  const sudahAda = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'resetSalahLoginHarian'; });
  if (sudahAda) {
    Logger.log('Pemicu harian sudah ada, tidak dibuat lagi.');
    return 'Pemicu harian sudah ada';
  }
  ScriptApp.newTrigger('resetSalahLoginHarian').timeBased().everyDays(1).atHour(0).nearMinute(5).inTimezone(ZONA_ABSEN).create();
  Logger.log('Pemicu harian dibuat: resetSalahLoginHarian sekitar 00:05 WIB.');
  return 'Pemicu harian dibuat';
}

/** Fungsi murni: nomor baris (0 = baris data pertama) yang salah_login-nya harus direset: belum terkunci dan salah_login > 0. */
function pilihBarisResetSalahLogin(rows) {
  const hasil = [];
  rows.forEach(function (r, i) {
    if (r.terkunci !== true && Number(r.salah_login) > 0) { hasil.push(i); }
  });
  return hasil;
}

function resetSalahLoginHarian() {
  const akun = bacaSheet('akun');
  const kol = akun.header.indexOf('salah_login') + 1;
  if (kol === 0) { return 0; }
  const pilih = pilihBarisResetSalahLogin(akun.data);
  pilih.forEach(function (i) { akun.sheet.getRange(akun.data[i]._baris, kol).setValue(0); });
  Logger.log('resetSalahLoginHarian: ' + pilih.length + ' akun direset.');
  return pilih.length;
}

/** Fungsi murni: dari semua nama properti, mana yang boleh dihapus sebagai sisa penahanan username palsu. */
function pilihPropertiPalsuUntukDihapus(namaProperti, idOwnerAda) {
  return namaProperti.filter(function (k) {
    if (k.indexOf('palsu_') === 0) { return true; }
    if (k.indexOf('tahan_') === 0) { return idOwnerAda.indexOf(k.slice(6)) === -1; }
    return false;
  });
}

/**
 * Fungsi sekali jalan: hapus properti penahanan username palsu yang terlanjur tersimpan di Script
 * Properties (penahanan username palsu kini hanya di CacheService). Penahanan akun owner yang nyata
 * (tahan_<ID owner yang ada>), KODE_RAHASIA, dibaca_*, dan properti lain TIDAK disentuh.
 */
function bersihkanPenahananPalsu() {
  const props = PropertiesService.getScriptProperties();
  const idOwner = bacaSheet('akun').data.filter(function (r) { return r.role === 'OWNER'; }).map(function (r) { return String(r.id); });
  const hapus = pilihPropertiPalsuUntukDihapus(Object.keys(props.getProperties()), idOwner);
  hapus.forEach(function (k) { props.deleteProperty(k); });
  Logger.log('bersihkanPenahananPalsu: ' + hapus.length + ' properti dihapus' + (hapus.length ? ': ' + hapus.join(', ') : '') + '.');
  return hapus;
}

/**
 * ---- Kartu "Hari ini" (owner) ----
 * Dari sheet absensi untuk tanggal hari ini: sudah masuk, telat, sudah pulang, menunggu ACC
 * (acc_pulang = MENUNGGU). Filter cabang dan shift opsional. Tidak ada angka "belum absen".
 */
function hitungHariIni(rows, tanggal, cabang, shift) {
  const a = { masuk: 0, telat: 0, pulang: 0, menunggu_acc: 0 };
  rows.forEach(function (r) {
    if (sebagaiTanggalTeks(r.tanggal, ZONA_ABSEN) !== tanggal) { return; }
    if (cabang && r.cabang !== cabang) { return; }
    if (shift !== '' && shift !== null && shift !== undefined && String(r.shift) !== String(shift)) { return; }
    if (String(r.masuk) !== '') { a.masuk++; }
    if (r.st_masuk === 'TELAT') { a.telat++; }
    if (String(r.pulang) !== '') { a.pulang++; }
    if (r.acc_pulang === 'MENUNGGU') { a.menunggu_acc++; }
  });
  return a;
}

/** Semua baris sheet shift (jam sebagai teks tampilan). */
function bacaSemuaShift() {
  const nilai = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('shift').getDataRange().getDisplayValues();
  const header = nilai[0];
  const hasil = [];
  for (let i = 1; i < nilai.length; i++) {
    const r = {};
    header.forEach(function (nama, idx) { r[nama] = nilai[i][idx]; });
    if (r.cabang) { hasil.push({ cabang: r.cabang, no: r.no, nama: r.nama, masuk: normalisasiJam(r.masuk) }); }
  }
  return hasil;
}

/** Aksi owner_hari_ini { sesi, cabang?, shift? }. */
function prosesOwnerHariIni(sesiToken, cabang, shift) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const cab = cabang === undefined || cabang === null ? '' : String(cabang).slice(0, 60);
  const sh = shift === undefined || shift === null ? '' : String(shift).slice(0, 10);
  const tanggal = Utilities.formatDate(new Date(), ZONA_ABSEN, 'yyyy-MM-dd');
  const semuaShift = bacaSemuaShift();
  const daftarCabang = [];
  semuaShift.forEach(function (x) { if (daftarCabang.indexOf(x.cabang) === -1) { daftarCabang.push(x.cabang); } });
  bacaSheet('pengaturan').data.forEach(function (r) {
    if (r.kategori === 'CABANG' && daftarCabang.indexOf(String(r.nama)) === -1) { daftarCabang.push(String(r.nama)); }
  });
  return respon({
    status: 'ok', tanggal: tanggal,
    angka: hitungHariIni(bacaSheet('absensi').data, tanggal, cab, sh),
    daftar_cabang: daftarCabang, tampilkan_dropdown_cabang: daftarCabang.length > 1,
    daftar_shift: semuaShift
  });
}

/** Fungsi murni: HP toko (baris role PERANGKAT) tersaring: filter cabang, yang aktif=FALSE disembunyikan kecuali diminta, urut ID. */
function saringDaftarHp(rows, cabang, tampilkanNonaktif) {
  return rows
    .filter(function (r) { return r.role === 'PERANGKAT' && (!cabang || r.cabang === cabang) && (tampilkanNonaktif === true || r.aktif === true); })
    .map(function (r) { return { id: r.id, nama: r.nama, cabang: r.cabang, aktif: r.aktif === true }; })
    .sort(function (a, b) { return String(a.id) < String(b.id) ? -1 : 1; });
}

/** Aksi owner_daftar_hp { sesi, cabang?, tampilkan_nonaktif? }. */
function prosesOwnerDaftarHp(sesiToken, cabang, tampilkanNonaktif) {
  const s = validasiSesi(sesiToken, 'OWNER');
  if (!s) { return responSesiHabis(); }
  const cab = cabang === undefined || cabang === null ? '' : String(cabang).slice(0, 60);
  return respon({ status: 'ok', hp_toko: saringDaftarHp(bacaSheet('akun').data, cab, tampilkanNonaktif === true) });
}

/** Fungsi murni: nama HP 1 sampai 40 karakter setelah dipangkas spasi (karakter kontrol dianggap spasi). Nama boleh kembar. */
function validasiNamaHp(teks) {
  const t = String(teks === undefined || teks === null ? '' : teks).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  if (!t) { return { ok: false, pesan: 'Nama HP tidak boleh kosong' }; }
  if (t.length > 40) { return { ok: false, pesan: 'Nama HP maksimal 40 karakter' }; }
  return { ok: true, nama: t };
}

/**
 * Fungsi murni: siapa boleh mengubah nama HP mana.
 *  - OWNER: HP toko mana pun.
 *  - ADMIN: hanya HP toko yang sedang dipegangnya (idHpToken = id dari token HP toko) dan hanya
 *    kalau cabang admin sama dengan cabang HP itu.
 *  - role lain: ditolak.
 */
function bolehUbahNamaHp(role, cabangPelaku, hpTarget, idHpToken) {
  if (!hpTarget || hpTarget.role !== 'PERANGKAT') { return { boleh: false, pesan: 'HP toko tidak ditemukan' }; }
  if (role === 'OWNER') { return { boleh: true }; }
  if (role === 'ADMIN') {
    if (!idHpToken || String(idHpToken) !== String(hpTarget.id)) { return { boleh: false, pesan: 'Admin hanya boleh mengubah nama HP yang sedang dipegangnya' }; }
    if (cabangPelaku !== hpTarget.cabang) { return { boleh: false, pesan: 'Admin hanya boleh mengubah nama HP di cabangnya' }; }
    return { boleh: true };
  }
  return { boleh: false, pesan: 'Tidak punya hak mengubah nama HP' };
}

/**
 * Aksi ubah_nama_hp.
 *  - Owner: { sesi (owner), id_hp, nama } boleh mengubah nama HP mana pun.
 *  - Admin: { token (HP toko), sesi (admin), nama } hanya HP toko yang sedang dipegangnya (id_hp dari
 *    client diabaikan), dan hanya kalau cabang admin sama dengan cabang HP itu.
 * Yang berubah hanya kolom nama baris itu (id, token, aktif tidak tersentuh). Nama boleh kembar.
 */
function prosesUbahNamaHp(d) {
  const v = validasiNamaHp(d.nama);
  if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
  const s = validasiSesi(d.sesi, null);
  if (!s) { return responSesiHabis(); }

  let idHp, idHpToken = null;
  if (s.akun.role === 'ADMIN') {
    const hp = validasiTokenHp(d.token);
    if (!hp) { return respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' }); }
    idHp = hp.id;
    idHpToken = hp.id;
  } else {
    idHp = String(d.id_hp || '');
  }
  const akun = bacaSheet('akun');
  const hpBaris = akun.data.find(function (r) { return r.role === 'PERANGKAT' && String(r.id) === String(idHp); });
  const izin = bolehUbahNamaHp(s.akun.role, s.akun.cabang, hpBaris, idHpToken);
  if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }

  const lama = String(hpBaris.nama);
  if (lama !== v.nama) {
    // Tulis sebagai teks biasa supaya nama seperti "=SUM(A1)" tidak dibaca Sheets sebagai rumus.
    const kolNama = akun.header.indexOf('nama') + 1;
    const sel = akun.sheet.getRange(hpBaris._baris, kolNama);
    sel.setNumberFormat('@');
    sel.setValue(v.nama);
    CacheService.getScriptCache().remove('hp_' + hpBaris.pw_hash); // supaya nama di HP toko berubah langsung
    tambahLog({
      jenis: 'PERANGKAT', oleh: s.akun.id, cabang: hpBaris.cabang, aksi: 'UBAH_NAMA_HP_TOKO',
      target: v.nama, id: hpBaris.id, sebelum: lama, sesudah: v.nama
    });
  }
  return respon({ status: 'ok', id_hp: hpBaris.id, nama: v.nama });
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

/**
 * ---- Karyawan (dikelola admin di HP toko) ----
 * Semua aksi di bagian ini WAJIB token HP toko terdaftar + sesi admin yang valid, dan hanya
 * menyentuh karyawan (role KARYAWAN) di cabang admin itu. Baris ADMIN/OWNER tidak tampil dan tidak
 * bisa diubah lewat sini. PIN: 4 digit angka apa pun (1234 dan 1111 boleh). PIN tidak pernah dicatat.
 */

/** Fungsi murni: PIN harus teks 4 digit angka. */
function validasiPin(pin) {
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) { return { ok: false, pesan: 'PIN harus 4 digit angka' }; }
  return { ok: true };
}

/** Fungsi murni: admin boleh mengelola target hanya kalau target role KARYAWAN di cabang admin. */
function bolehKelolaKaryawan(roleAktor, cabangAktor, target) {
  if (roleAktor !== 'ADMIN') { return { boleh: false, pesan: 'Hanya admin yang boleh mengelola karyawan' }; }
  if (!target || target.role !== 'KARYAWAN') { return { boleh: false, pesan: 'Karyawan tidak ditemukan' }; }
  if (target.cabang !== cabangAktor) { return { boleh: false, pesan: 'Admin hanya boleh mengelola karyawan di cabangnya' }; }
  return { boleh: true };
}

/** Fungsi murni: daftar karyawan untuk layar Karyawan (hanya role KARYAWAN di cabang itu; nonaktif tersembunyi kecuali diminta). */
function saringDaftarKaryawan(rows, cabang, tampilkanNonaktif) {
  return rows
    .filter(function (r) { return r.role === 'KARYAWAN' && r.cabang === cabang && (tampilkanNonaktif === true || r.aktif === true); })
    .map(function (r) {
      return { id: r.id, nama: r.nama, panggilan: r.panggilan, shift: r.shift, aktif: r.aktif === true, mulai_kerja: sebagaiTanggalTeks(r.mulai_kerja, ZONA_ABSEN) };
    })
    .sort(function (a, b) { return String(a.nama).toLowerCase() < String(b.nama).toLowerCase() ? -1 : 1; });
}

/** Fungsi murni: daftar nama di layar "pilih nama" HP toko = karyawan dan admin AKTIF di cabang itu (nonaktif tidak muncul). */
function daftarUntukPilihNama(rows, cabang) {
  return rows
    .filter(function (r) { return r.cabang === cabang && r.aktif === true && (r.role === 'KARYAWAN' || r.role === 'ADMIN'); })
    .map(function (r) { return { id: r.id, nama: r.nama, panggilan: r.panggilan }; });
}

/** Fungsi murni: ID karyawan berikutnya = K + (nomor terbesar yang pernah ada di SEMUA akun, termasuk nonaktif) + 1. Tidak pernah dipakai ulang. */
function buatIdKaryawan(semuaId) {
  let maks = 0;
  semuaId.forEach(function (id) {
    const m = /^K(\d+)$/.exec(String(id));
    if (m) { maks = Math.max(maks, Number(m[1])); }
  });
  return 'K' + ('00' + (maks + 1)).slice(-Math.max(3, String(maks + 1).length));
}

/** Fungsi murni: nama (= username) sudah dipakai akun AKTIF lain? Tanpa beda huruf besar/kecil; HP toko tidak dihitung. */
function namaSudahDipakai(rows, nama) {
  const n = String(nama).trim().toLowerCase();
  return rows.some(function (r) { return r.role !== 'PERANGKAT' && r.aktif === true && String(r.nama).trim().toLowerCase() === n; });
}

/** Fungsi murni: validasi data karyawan baru. shiftValid = daftar nomor shift cabang itu. */
function validasiDataKaryawan(d, shiftValid) {
  const bersih = function (t) { return String(t === undefined || t === null ? '' : t).trim(); };
  const nama = bersih(d.nama), panggilan = bersih(d.panggilan), shift = bersih(d.shift), mulai = bersih(d.mulai_kerja);
  const aman = function (t) { return !/[\u0000-\u001f\u007f]/.test(t) && !/^[=+\-@]/.test(t); };
  if (!nama || nama.length > 60) { return { ok: false, pesan: 'Nama lengkap wajib diisi (maksimal 60 karakter)' }; }
  if (!aman(nama)) { return { ok: false, pesan: 'Nama tidak boleh diawali = + - atau @' }; }
  if (!panggilan || panggilan.length > 30) { return { ok: false, pesan: 'Nama panggilan wajib diisi (maksimal 30 karakter)' }; }
  if (!aman(panggilan)) { return { ok: false, pesan: 'Nama panggilan tidak boleh diawali = + - atau @' }; }
  if (shiftValid.map(String).indexOf(shift) === -1) { return { ok: false, pesan: 'Shift tidak dikenal di cabang ini' }; }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(mulai);
  const tgl = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
  if (!tgl || tgl.getUTCFullYear() !== Number(m[1]) || tgl.getUTCMonth() !== Number(m[2]) - 1 || tgl.getUTCDate() !== Number(m[3])) {
    return { ok: false, pesan: 'Tanggal mulai kerja tidak valid' };
  }
  return { ok: true, nama: nama, panggilan: panggilan, shift: shift, mulai_kerja: mulai };
}

/** Fungsi murni: perubahan baris akun saat PIN direset (membuka kunci dan menghapus hitungan salah). */
function perubahanResetPin(hashBaru) {
  return { pin_hash: hashBaru, salah_login: 0, terkunci: false, ganti_pin: false };
}

/** Wajib token HP toko + sesi admin; admin harus dari cabang HP itu. Kembalian { hp, s } atau { gagal }. */
function autentikasiAdminToko(d) {
  const hp = validasiTokenHp(d.token);
  if (!hp) { return { gagal: respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' }) }; }
  const s = validasiSesi(d.sesi, 'ADMIN');
  if (!s) { return { gagal: responSesiHabis() }; }
  if (s.akun.cabang !== hp.cabang) { return { gagal: respon({ status: 'gagal', pesan: 'Admin hanya boleh mengelola karyawan di cabangnya' }) }; }
  return { hp: hp, s: s };
}

/** Aksi karyawan_daftar { token, sesi, tampilkan_nonaktif? }: karyawan cabang admin + pilihan shift untuk form tambah. */
function prosesKaryawanDaftar(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const cabang = a.s.akun.cabang;
  const daftar = saringDaftarKaryawan(bacaSheet('akun').data, cabang, d.tampilkan_nonaktif === true);
  const shifts = bacaShiftCabang(cabang).map(function (sh) { return { no: sh.no, nama: sh.nama, masuk: sh.masuk, pulang: sh.pulang }; });
  return respon({ status: 'ok', cabang: cabang, daftar: daftar, daftar_shift: shifts, jumlah_aktif: daftar.filter(function (x) { return x.aktif; }).length });
}

/**
 * Aksi karyawan_tambah { token, sesi, nama, panggilan, shift, mulai_kerja, pin }: data dan PIN dikirim
 * dalam SATU permintaan setelah karyawan selesai mengetik PIN dua kali (dibatalkan = tidak ada yang tersimpan).
 * pw_hash dibiarkan kosong (password HP pribadi diurus gelombang berikutnya).
 */
function prosesKaryawanTambah(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const pinOk = validasiPin(d.pin);
  if (!pinOk.ok) { return respon({ status: 'gagal', pesan: pinOk.pesan }); }
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const cabang = a.s.akun.cabang;
  const v = validasiDataKaryawan(d, bacaShiftCabang(cabang).map(function (sh) { return sh.no; }));
  if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }

  const kunciLock = LockService.getScriptLock();
  kunciLock.waitLock(15000);
  try {
    const akun = bacaSheet('akun');
    if (namaSudahDipakai(akun.data, v.nama)) { return respon({ status: 'gagal', pesan: 'Nama lengkap sudah dipakai karyawan lain' }); }
    const id = buatIdKaryawan(akun.data.map(function (r) { return r.id; }));
    const baru = {};
    akun.header.forEach(function (n) { baru[n] = ''; });
    baru.id = id;
    baru.nama = v.nama;
    baru.panggilan = v.panggilan;
    baru.cabang = cabang;
    baru.role = 'KARYAWAN';
    baru.shift = isNaN(Number(v.shift)) ? v.shift : Number(v.shift);
    baru.pin_hash = hashDenganGaram(d.pin, id, kodeRahasia);
    baru.mulai_kerja = v.mulai_kerja;
    baru.jatah_cuti = ambilNilaiUmum('jatah_cuti', 6);
    baru.aktif = true;
    baru.ganti_pw = true;
    baru.ganti_pin = false;
    baru.salah_login = 0;
    baru.terkunci = false;
    baru.setuju_wajah = false;
    baru.pola_shift = 'TETAP';
    akun.sheet.appendRow(akun.header.map(function (n) { return baru[n]; }));
    tambahLog({ jenis: 'KARYAWAN', oleh: a.s.akun.id, cabang: cabang, aksi: 'TAMBAH_KARYAWAN', target: v.nama, id: id, sesudah: 'aktif=TRUE; shift=' + v.shift + '; mulai=' + v.mulai_kerja });
    return respon({ status: 'ok', id: id, nama: v.nama, panggilan: v.panggilan });
  } finally {
    kunciLock.releaseLock();
  }
}

/** Aksi karyawan_reset_pin { token, sesi, id, pin }: PIN baru diketik karyawan dua kali (tanpa PIN awal 1234). */
function prosesKaryawanResetPin(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const pinOk = validasiPin(d.pin);
  if (!pinOk.ok) { return respon({ status: 'gagal', pesan: pinOk.pesan }); }
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const akun = bacaSheet('akun');
  const target = akun.data.find(function (r) { return String(r.id) === String(d.id); });
  const izin = bolehKelolaKaryawan(a.s.akun.role, a.s.akun.cabang, target);
  if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }
  if (target.aktif !== true) { return respon({ status: 'gagal', pesan: 'Karyawan sudah nonaktif' }); }
  perbaruiKolom(akun, target, perubahanResetPin(hashDenganGaram(d.pin, String(target.id), kodeRahasia)));
  tambahLog({ jenis: 'KARYAWAN', oleh: a.s.akun.id, cabang: target.cabang, aksi: 'RESET_PIN', target: target.nama, id: target.id, sebelum: 'salah_login/terkunci diperiksa', sesudah: 'salah_login=0; terkunci=FALSE' });
  return respon({ status: 'ok', id: target.id, nama: target.nama });
}

/** Aksi karyawan_nonaktif { token, sesi, id }: aktif=FALSE, baris dan riwayat tetap. */
function prosesKaryawanNonaktif(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const akun = bacaSheet('akun');
  const target = akun.data.find(function (r) { return String(r.id) === String(d.id); });
  const izin = bolehKelolaKaryawan(a.s.akun.role, a.s.akun.cabang, target);
  if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }
  if (target.aktif === true) {
    perbaruiKolom(akun, target, { aktif: false });
    tambahLog({ jenis: 'KARYAWAN', oleh: a.s.akun.id, cabang: target.cabang, aksi: 'NONAKTIFKAN_KARYAWAN', target: target.nama, id: target.id, sebelum: 'aktif=TRUE', sesudah: 'aktif=FALSE' });
  }
  return respon({ status: 'ok', id: target.id, nama: target.nama });
}

/**
 * ---- Foto absen di HP toko ----
 * Kamera depan HP toko memotret otomatis saat PIN dikirim. Absen disimpan DULU (tanpa menunggu foto);
 * foto dikirim di latar belakang lewat aksi unggah_foto dengan id absen (id_masuk / id_pulang di sheet
 * absensi). Foto disimpan di Drive dengan struktur folder per cabang/tahun/bulan/orang (lihat bawah); folder
 * akar dari pengaturan UMUM folder_foto_id (kosong = "FOTO ABSEN WEB" di folder induk spreadsheet); tautannya
 * ditulis ke foto_masuk / foto_pulang. Folder dibuat tanpa tautan publik.
 * Kamera tidak ada/ditolak atau unggahan gagal: kolom foto diisi "TANPA FOTO" dan absen tetap sah.
 * Belum ada: penghapusan otomatis 2 bulan dan tampilan foto di aplikasi (gelombang berikutnya).
 */
var TEKS_TANPA_FOTO = 'TANPA FOTO';
var MAKS_FOTO_BYTE = 300 * 1024;

/** Fungsi murni: "HPT-NGW-03" -> "T3" (kode perangkat di id absen). */
function kodePerangkatDariHp(idHp) {
  const m = /-(\d+)$/.exec(String(idHp));
  return m ? 'T' + Number(m[1]) : 'T0';
}

/**
 * Fungsi murni: id absen = {M/P/L}-{id karyawan}-{YYMMDD}-{HHMMSS}-{kode perangkat}, dari jam di tiket
 * (saat tombol ditekan). Contoh: M-K001-260928-074512-T3. M=masuk, P=pulang, L=lembur.
 */
function buatIdAbsen(huruf, idKaryawan, ms, idHp) {
  const d = new Date(ms);
  return huruf + '-' + idKaryawan + '-' + Utilities.formatDate(d, ZONA_ABSEN, 'yyMMdd') + '-' + Utilities.formatDate(d, ZONA_ABSEN, 'HHmmss') + '-' + kodePerangkatDariHp(idHp);
}

/** Fungsi murni: cari baris absensi dari id absen untuk jenis MASUK (id_masuk) atau PULANG (id_pulang). */
function cariBarisAbsen(rows, jenis, idAbsen) {
  const kolom = jenis === 'MASUK' ? 'id_masuk' : 'id_pulang';
  return rows.find(function (r) { return String(r[kolom]) === String(idAbsen); }) || null;
}

/**
 * Fungsi murni: periksa gambar base64. Harus JPEG (cek 3 byte awal FF D8 FF), maksimal 300 KB.
 * Boleh berawalan "data:image/jpeg;base64,". Kembalian { ok, bytes } atau { ok:false, pesan }.
 */
function periksaGambarJpeg(gambar) {
  if (typeof gambar !== 'string' || !gambar) { return { ok: false, pesan: 'Gambar kosong' }; }
  let b64 = gambar.trim();
  const awalan = /^data:([^;,]*);base64,/i.exec(b64);
  if (awalan) {
    if (awalan[1].toLowerCase() !== 'image/jpeg') { return { ok: false, pesan: 'Tipe berkas harus JPEG' }; }
    b64 = b64.slice(awalan[0].length);
  }
  b64 = b64.replace(/\s+/g, '');
  if (b64.length < 100) { return { ok: false, pesan: 'Gambar terlalu kecil atau rusak' }; }
  const taksiran = Math.floor(b64.length * 3 / 4) - (b64.slice(-2) === '==' ? 2 : (b64.slice(-1) === '=' ? 1 : 0));
  if (taksiran > MAKS_FOTO_BYTE) { return { ok: false, pesan: 'Foto terlalu besar (maksimal 300 KB)' }; }
  if (!/^[A-Za-z0-9+\/]+={0,2}$/.test(b64) || b64.length % 4 !== 0) { return { ok: false, pesan: 'Gambar tidak valid' }; }
  let bytes;
  try { bytes = Utilities.base64Decode(b64); } catch (e) { return { ok: false, pesan: 'Gambar tidak valid' }; }
  if (bytes.length > MAKS_FOTO_BYTE) { return { ok: false, pesan: 'Foto terlalu besar (maksimal 300 KB)' }; }
  if (bytes.length < 3 || bytes[0] !== -1 || bytes[1] !== -40 || bytes[2] !== -1) { return { ok: false, pesan: 'Tipe berkas harus JPEG' }; }
  return { ok: true, bytes: bytes };
}

/**
 * Fungsi murni: validasi unggah foto terhadap baris absensi.
 *  p = { id_absen, jenis, gambar?, tanpa_foto? }; baris = hasil cariBarisAbsen (atau null); hp = { cabang }.
 * Kembalian { ok:true, tanpa:true } | { ok:true, bytes } | { ok:false, pesan }.
 */
function validasiUnggahFoto(p, baris, hp, tanggalHariIni) {
  if (p.jenis !== 'MASUK' && p.jenis !== 'PULANG') { return { ok: false, pesan: 'Jenis foto harus MASUK atau PULANG' }; }
  if (!baris) { return { ok: false, pesan: 'Absen tidak ditemukan' }; }
  if (baris.cabang !== hp.cabang) { return { ok: false, pesan: 'Absen ini bukan milik cabang HP ini' }; }
  if (sebagaiTanggalTeks(baris.tanggal, ZONA_ABSEN) !== tanggalHariIni) { return { ok: false, pesan: 'Foto hanya bisa diunggah di hari absen' }; }
  const sekarangIsi = String(p.jenis === 'MASUK' ? baris.foto_masuk : baris.foto_pulang);
  if (sekarangIsi !== '' && sekarangIsi !== TEKS_TANPA_FOTO) { return { ok: false, pesan: 'Absen ini sudah punya foto' }; }
  if (p.tanpa_foto === true) { return { ok: true, tanpa: true }; }
  const g = periksaGambarJpeg(p.gambar);
  return g.ok ? { ok: true, bytes: g.bytes } : g;
}

/**
 * ---- Struktur folder foto di Drive (kesepakatan) ----
 * FOTO ABSEN WEB / <Cabang> / <Tahun 4 digit> / <Bulan 2 digit> / <ID>_<Nama lengkap> / <DDMMYY>_<MASUK|PULANG><nomor shift>_<HHMM>.jpg
 * Contoh: FOTO ABSEN WEB/Ngawi/2026/10/K001_Ahmad Fauzi/061026_MASUK1_0755.jpg
 * Semua nama dibentuk di SERVER dari baris absensi yang dirujuk (tanggal baris, nomor shift di baris,
 * jam dari id absen yang berasal dari jam tiket), BUKAN dari jam unggah dan bukan dari input client.
 */

/** Fungsi murni: buang karakter terlarang di nama berkas/folder Drive ( / \ : * ? " < > | dan karakter kontrol), rapikan spasi. */
function bersihkanNamaBerkas(teks) {
  const t = String(teks === undefined || teks === null ? '' : teks)
    .replace(/[\/\\:*?"<>|\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return t.slice(0, 80).trim();
}

/**
 * Fungsi murni: jalur folder (di bawah folder akar) dan nama berkas untuk satu foto.
 * baris = baris absensi (tanggal 'yyyy-MM-dd', cabang, karyawan, nama, shift, id_masuk/id_pulang); jenis = MASUK | PULANG.
 * HHMM diambil dari id absen baris itu (jam tiket saat tombol ditekan), bukan dari waktu unggah.
 */
function jalurFoto(baris, jenis) {
  const tanggal = sebagaiTanggalTeks(baris.tanggal, ZONA_ABSEN);
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);
  const idAbsen = String(jenis === 'MASUK' ? baris.id_masuk : baris.id_pulang);
  const j = /-(\d{2})(\d{2})\d{2}-T\d+$/.exec(idAbsen);
  if (!t || !j) { return null; }
  const orang = bersihkanNamaBerkas(String(baris.karyawan) + '_' + (bersihkanNamaBerkas(baris.nama) || 'TANPA NAMA'));
  return {
    segmen: [bersihkanNamaBerkas(baris.cabang) || 'TANPA CABANG', t[1], t[2], orang],
    namaBerkas: t[3] + t[2] + t[1].slice(2) + '_' + jenis + bersihkanNamaBerkas(baris.shift) + '_' + j[1] + j[2] + '.jpg'
  };
}

/**
 * Fungsi murni: pilih folder akar dari nilai pengaturan UMUM folder_foto_id.
 *  - terisi (setelah dipangkas) -> { mode:'ID', id }: dipakai APA ADANYA; kalau tidak valid/tidak bisa diakses
 *    TIDAK ada fallback (absen tanpa foto + catat kesalahan);
 *  - kosong atau barisnya tidak ada -> { mode:'BAWAAN' }: folder "FOTO ABSEN WEB" di folder induk spreadsheet.
 */
function keputusanFolderAkar(nilai) {
  const id = nilai === undefined || nilai === null ? '' : String(nilai).trim();
  return id ? { mode: 'ID', id: id } : { mode: 'BAWAAN' };
}

/** Fungsi murni: apakah kesalahan folder perlu dicatat ke log? Paling banyak sekali per jam (cache = objek get/put). */
function perluCatatGalatFolder(cache, sekarangMs) {
  const terakhir = Number(cache.get('foto_folder_error') || 0);
  if (terakhir && sekarangMs - terakhir < 3600000) { return false; }
  cache.put('foto_folder_error', String(sekarangMs), 3600);
  return true;
}

function ambilTeksUmum(nama) {
  const baris = bacaSheet('pengaturan').data.find(function (r) { return r.kategori === 'UMUM' && r.nama === nama; });
  return baris && baris.nilai !== undefined && baris.nilai !== null ? String(baris.nilai).trim() : '';
}

var NAMA_FOLDER_AKAR_BAWAAN = 'FOTO ABSEN WEB';

/** Folder akar foto: { folder } atau { galat }. Tidak pernah membuat folder di tempat lain kalau ID terisi tapi salah. */
function ambilFolderAkar() {
  const k = keputusanFolderAkar(ambilTeksUmum('folder_foto_id'));
  if (k.mode === 'ID') {
    try {
      const f = DriveApp.getFolderById(k.id);
      f.getName(); // memastikan benar-benar bisa diakses
      return { folder: f };
    } catch (e) {
      return { galat: 'folder_foto_id tidak valid atau tidak bisa diakses: ' + k.id };
    }
  }
  try {
    const induk = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getParents();
    const folderInduk = induk.hasNext() ? induk.next() : DriveApp.getRootFolder();
    const ada = folderInduk.getFoldersByName(NAMA_FOLDER_AKAR_BAWAAN);
    return { folder: ada.hasNext() ? ada.next() : folderInduk.createFolder(NAMA_FOLDER_AKAR_BAWAAN) };
  } catch (e) {
    return { galat: 'folder akar bawaan tidak bisa disiapkan: ' + e.message };
  }
}

/** Satu anak folder bernama `nama` di `induk`: ID dicari di cache dulu, lalu di Drive, dibuat kalau belum ada (dipanggil di dalam kunci). */
function ambilAtauBuatFolder(induk, nama) {
  const cache = CacheService.getScriptCache();
  const kunci = 'fd_' + induk.getId() + '|' + nama;
  const idCache = cache.get(kunci);
  if (idCache) {
    try { return DriveApp.getFolderById(idCache); } catch (e) { /* cache usang: cari lagi */ }
  }
  const ada = induk.getFoldersByName(nama);
  const folder = ada.hasNext() ? ada.next() : induk.createFolder(nama);
  cache.put(kunci, folder.getId(), 21600);
  return folder;
}

function catatGalatFolder(pesan) {
  if (perluCatatGalatFolder(CacheService.getScriptCache(), Date.now())) {
    tambahLog({ jenis: 'KESALAHAN', oleh: 'SISTEM', cabang: '', aksi: 'FOTO_FOLDER_ERROR', target: 'folder foto', id: '', alasan: String(pesan).slice(0, 200) });
  }
}

/** Aksi unggah_foto { token, id_absen, jenis, gambar | tanpa_foto }: wajib token HP toko (dicek di doPost). */
function prosesUnggahFoto(d, hp) {
  const idAbsen = String(d.id_absen || '');
  if (!/^[MPL]-[A-Za-z0-9]{1,20}-\d{6}-\d{6}-T\d{1,3}$/.test(idAbsen)) { return respon({ status: 'gagal', pesan: 'Id absen tidak valid' }); }
  if ((d.jenis === 'MASUK' && idAbsen.charAt(0) !== 'M') || (d.jenis === 'PULANG' && idAbsen.charAt(0) === 'M')) {
    return respon({ status: 'gagal', pesan: 'Id absen tidak cocok dengan jenis foto' });
  }
  const kunciLock = LockService.getScriptLock();
  kunciLock.waitLock(15000); // juga mencegah folder kembar saat dua unggahan bersamaan
  try {
    const absensi = bacaSheet('absensi');
    const baris = cariBarisAbsen(absensi.data, d.jenis, idAbsen);
    const v = validasiUnggahFoto(d, baris, hp, Utilities.formatDate(new Date(), ZONA_ABSEN, 'yyyy-MM-dd'));
    if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
    const kolom = d.jenis === 'MASUK' ? 'foto_masuk' : 'foto_pulang';
    const tulisKolom = function (nilai) { const o = {}; o[kolom] = nilai; perbaruiKolom(absensi, baris, o); };
    if (v.tanpa) { tulisKolom(TEKS_TANPA_FOTO); return respon({ status: 'ok', pesan: 'Ditandai tanpa foto' }); }

    const akar = ambilFolderAkar();
    if (akar.galat) {
      // Folder akar bermasalah: JANGAN fallback ke tempat lain. Absen tetap sah, foto = TANPA FOTO.
      catatGalatFolder(akar.galat);
      tulisKolom(TEKS_TANPA_FOTO);
      return respon({ status: 'ok', pesan: 'Folder foto bermasalah, ditandai tanpa foto' });
    }
    const jalur = jalurFoto(baris, d.jenis);
    if (!jalur) { return respon({ status: 'gagal', pesan: 'Data absen tidak lengkap untuk membentuk nama foto' }); }
    let berkas;
    try {
      let folder = akar.folder;
      jalur.segmen.forEach(function (nama) { folder = ambilAtauBuatFolder(folder, nama); });
      berkas = folder.createFile(Utilities.newBlob(v.bytes, 'image/jpeg', jalur.namaBerkas));
    } catch (e) {
      catatGalatFolder('Gagal menyimpan foto ke Drive: ' + e.message);
      return respon({ status: 'gagal', pesan: 'Foto tidak bisa disimpan ke Drive' });
    }
    tulisKolom(berkas.getUrl());
    return respon({ status: 'ok', pesan: 'Foto tersimpan' });
  } finally {
    kunciLock.releaseLock();
  }
}

/**
 * Jalankan SATU KALI oleh pemilik dari editor Apps Script: memastikan folder akar foto sesuai pengaturan
 * (folder_foto_id; kalau kosong dipakai/dibuat "FOTO ABSEN WEB" di folder induk spreadsheet), memicu
 * persetujuan izin Drive, dan menulis nama, ID, dan tautan folder akar ke Log eksekusi.
 * Tidak membuat folder di tempat lain; kalau ID terisi tapi salah, hanya melaporkan galatnya.
 */
function siapkanFolderFoto() {
  const akar = ambilFolderAkar();
  if (akar.galat) {
    Logger.log('GAGAL: ' + akar.galat);
    return akar.galat;
  }
  const f = akar.folder;
  Logger.log('Folder akar foto: ' + f.getName() + ' | ID: ' + f.getId() + ' | ' + f.getUrl());
  return f.getUrl();
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
