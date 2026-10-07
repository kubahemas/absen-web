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
  if (data.aksi === 'karyawan_aktifkan') { return prosesKaryawanAktifkan(data); }

  // Aksi owner dan logout memakai tiket sesi login (bukan token HP toko).
  if (data.aksi === 'login_owner') { return prosesLoginOwner(data); }
  if (data.aksi === 'atur_password_owner') { return prosesAturPasswordOwner(data); }
  if (data.aksi === 'owner_beranda') { return prosesOwnerBeranda(data.sesi); }
  if (data.aksi === 'owner_perhatian') { return prosesOwnerPerhatian(data.sesi); }
  if (data.aksi === 'owner_perhatian_daftar') { return prosesOwnerPerhatianDaftar(data.sesi); }
  if (data.aksi === 'owner_tandai_dibaca') { return prosesOwnerTandaiDibaca(data.sesi, data.id, data.mode); }
  if (data.aksi === 'beranda_hari_ini') { return prosesBerandaHariIni(data); }
  if (data.aksi === 'owner_hari_ini') { return prosesOwnerHariIni(data.sesi, data.cabang, data.shift); }
  if (data.aksi === 'owner_daftar_hp') { return prosesOwnerDaftarHp(data.sesi, data.cabang, data.tampilkan_nonaktif); }
  if (data.aksi === 'ubah_nama_hp') { return prosesUbahNamaHp(data); }
  if (data.aksi === 'owner_nonaktifkan_hp') { return prosesOwnerNonaktifkanHp(data.sesi, data.id_hp); }
  if (data.aksi === 'owner_keluarkan_semua') { return prosesOwnerKeluarkanSemua(data.sesi); }
  if (data.aksi === 'owner_ganti_password') { return prosesOwnerGantiPassword(data.sesi, data.lama, data.baru); }
  if (data.aksi === 'logout') { return prosesLogout(data.sesi); }
  if (data.aksi === 'login_pribadi') { return prosesLoginPribadi(data); }
  if (data.aksi === 'atur_kredensial_admin') { return prosesAturKredensialAdmin(data); }
  if (data.aksi === 'pribadi_profil') { return prosesPribadiProfil(data); }
  if (data.aksi === 'pribadi_keluarkan_semua') { return prosesPribadiKeluarkanSemua(data); }

  // Absen luar HP pribadi: sesi HP pribadi sebagai pengganti token HP toko.
  if (data.aksi === 'tiket_waktu' && !data.token) { return prosesTiketPribadi(data); }
  if (data.aksi === 'unggah_foto' && !data.token) { return prosesUnggahFotoPribadi(data); }
  if (data.aksi === 'simpan_alasan' && !data.token) { return prosesSimpanAlasanPribadi(data); }
  if (data.aksi === 'simpan_pulang' && !data.token) { return prosesSimpanPulangPribadi(data); }
  if (data.aksi === 'absen_luar_masuk') { return prosesAbsenLuarMasuk(data); }
  if (data.aksi === 'absen_luar_pulang') { return prosesAbsenLuarPulang(data); }
  if (data.aksi === 'pribadi_hari_ini') { return prosesPribadiHariIni(data); }
  if (data.aksi === 'pribadi_riwayat') { return prosesPribadiRiwayat(data); }
  if (data.aksi === "pribadi_keperluan_luar") { return prosesPribadiKeperluanLuar(data); }

  // Konfirmasi (ACC / TOLAK): owner (sesi owner), admin HP toko (token + sesi), atau admin HP pribadi (sesi).
  if (data.aksi === 'konfirmasi_jumlah') { return prosesKonfirmasiJumlah(data); }
  if (data.aksi === 'konfirmasi_daftar') { return prosesKonfirmasiDaftar(data); }
  if (data.aksi === 'konfirmasi_putuskan') { return prosesKonfirmasiPutuskan(data); }
  if (data.aksi === 'konfirmasi_edit') { return prosesKonfirmasiEdit(data); }
  if (data.aksi === 'ambil_foto') { return prosesAmbilFoto(data); }
  // Izin dan cuti (Fitur A), kalender libur
  if (data.aksi === 'izin_info') { return prosesIzinInfo(data); }
  if (data.aksi === 'izin_pratinjau') { return prosesIzinPratinjau(data); }
  if (data.aksi === 'izin_ajukan') { return prosesIzinAjukan(data); }
  if (data.aksi === 'izin_batal') { return prosesIzinBatal(data); }
  if (data.aksi === 'pengajuan_saya') { return prosesPengajuanSaya(data); }
  if (data.aksi === 'izin_unggah_surat') { return prosesIzinUnggahSurat(data); }
  if (data.aksi === 'izin_input') { return prosesIzinInput(data); }
  if (data.aksi === 'izin_input_pratinjau') { return prosesIzinInputPratinjau(data); }
  if (data.aksi === 'izin_input_info') { return prosesIzinInputInfo(data); }
  if (data.aksi === 'kalender_baca') { return prosesKalenderBaca(data); }
  if (data.aksi === 'kalender_simpan') { return prosesKalenderSimpan(data); }
  // Jadwal dan shift (Fitur B)
  if (data.aksi === 'jadwal_baca') { return prosesJadwalBaca(data); }
  if (data.aksi === 'jadwal_simpan') { return prosesJadwalSimpan(data); }
  if (data.aksi === 'jadwal_salin') { return prosesJadwalSalin(data); }
  if (data.aksi === 'jadwal_hari') { return prosesJadwalHari(data); }
  if (data.aksi === 'jadwal_tukar') { return prosesJadwalTukar(data); }
  if (data.aksi === 'pola_baca') { return prosesPolaBaca(data); }
  if (data.aksi === 'pola_pratinjau') { return prosesPolaPratinjau(data); }
  if (data.aksi === 'pola_simpan') { return prosesPolaSimpan(data); }
  if (data.aksi === 'tukar_rekan') { return prosesTukarRekan(data); }
  if (data.aksi === 'tukar_pratinjau') { return prosesTukarPratinjau(data); }
  if (data.aksi === 'tukar_ajukan') { return prosesTukarAjukan(data); }
  if (data.aksi === 'tukar_masuk') { return prosesTukarMasuk(data); }
  if (data.aksi === 'tukar_jawab') { return prosesTukarJawab(data); }
  // Koreksi absen (Fitur C)
  if (data.aksi === 'konflik_detail') { return prosesKonflikDetail(data); }
  if (data.aksi === 'konflik_pratinjau') { return prosesKonflikPratinjau(data); }
  if (data.aksi === 'konflik_putuskan') { return prosesKonflikPutuskan(data); }
  if (data.aksi === 'konflik_foto') { return prosesKonflikFoto(data); }
  if (data.aksi === 'absen_manual_info') { return prosesAbsenManualInfo(data); }
  if (data.aksi === 'absen_manual_pratinjau') { return prosesAbsenManualPratinjau(data); }
  if (data.aksi === 'absen_manual') { return prosesAbsenManual(data); }
  if (data.aksi === 'absensi_unggah_foto') { return prosesAbsensiUnggahFoto(data); }
  if (data.aksi === 'absensi_daftar') { return prosesAbsensiDaftar(data); }
  if (data.aksi === 'absensi_edit_info') { return prosesAbsensiEditInfo(data); }
  if (data.aksi === 'absensi_edit') { return prosesAbsensiEdit(data); }
  if (data.aksi === 'absensi_edit_pratinjau') { return prosesAbsensiEdit(Object.assign({}, data, { pratinjau: true })); }
  if (data.aksi === 'absensi_foto') { return prosesAbsensiFoto(data); }
  // Semua aksi lain wajib menyertakan token HP toko yang terdaftar.
  const aksiBertoken = ['daftar_karyawan', 'tiket_waktu', 'absen_masuk', 'simpan_alasan', 'absen_pulang', 'simpan_pulang', 'login_admin_toko', 'unggah_foto', 'tidak_masuk_hari_ini', 'jadwal_hari_ini', 'tukar_pengingat', 'laporkan_dobel', 'foto_dobel'];
  if (aksiBertoken.indexOf(data.aksi) !== -1) {
    const hp = validasiTokenHp(data.token);
    if (!hp) {
      return respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' });
    }
    if (data.aksi === 'daftar_karyawan') { return prosesDaftarKaryawan(hp); }
    if (data.aksi === 'tiket_waktu') { return prosesTiketWaktu(data.jenis, hp); }
    if (data.aksi === 'login_admin_toko') { return prosesLoginAdminToko(data, hp); }
    if (data.aksi === 'tidak_masuk_hari_ini') { return prosesTidakMasukHariIni(hp); }
    if (data.aksi === 'jadwal_hari_ini') { return prosesJadwalHariIni(hp); }
    if (data.aksi === 'tukar_pengingat') { return prosesTukarPengingat(data, hp); }
    if (data.aksi === 'laporkan_dobel') { return prosesLaporkanDobel(data, hp); }
    if (data.aksi === 'foto_dobel') { return prosesFotoDobel(data, hp); }
    if (data.aksi === 'unggah_foto') { return prosesUnggahFoto(data, hp); }
    if (data.aksi === 'absen_masuk') { return prosesAbsenMasuk(data.id, data.pin, hp, data.tiket, data.tanpa_foto === true, { shiftPilihan: data.shift_pilihan }); }
    if (data.aksi === 'absen_pulang') { return prosesAbsenPulang(data.id, data.pin, data.jenis, hp, data.tiket, data.tanpa_foto === true, { konfirmasiRevisi: data.konfirmasi_revisi === true }); }
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
function periksaTiket(tiket, jenis, cabang, kunci, sekarangMs, akunId) {
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
  // Tiket HP pribadi terikat ke akun (p.a); tiket HP toko tidak punya p.a. Keduanya tidak bisa saling dipakai.
  if (akunId ? p.a !== akunId : p.a) { return gagal; }
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
function prosesTiketWaktu(jenis, hp, akunId) {
  if (jenis !== 'MASUK' && jenis !== 'PULANG' && jenis !== 'LEMBUR') {
    return respon({ status: 'gagal', pesan: 'Jenis tiket tidak dikenal' });
  }
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const menit = ambilNilaiUmum('tiket_absen_menit', 3);
  const t = Date.now();
  const muatan = { j: jenis, t: t, e: t + menit * 60000, c: hp.cabang, n: Utilities.getUuid().replace(/-/g, '').slice(0, 16) };
  if (akunId) { muatan.a = akunId; } // HP pribadi: tiket terikat ke akun
  const tiket = buatTiket(muatan, kunci);
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

function prosesAbsenMasuk(id, pin, hp, tiket, tanpaFoto, ekstra) {
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const tk = periksaTiket(tiket, 'MASUK', hp.cabang, kunci, Date.now());
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }

  const cek = cekKaryawanDanPin(id, pin, hp);
  if (cek.gagal) { return cek.gagal; }
  return catatAbsenMasuk({ akun: cek.akun, tk: tk, idHp: hp.id, tanpaFoto: tanpaFoto, luar: null, tiketMentah: tiket, shiftPilihan: ekstra ? ekstra.shiftPilihan : undefined });
}

/**
 * Inti absen masuk (dipakai HP toko dan absen luar HP pribadi): status dari jam tiket, tulis baris absensi.
 * c = { akun, tk, idHp ('HPT-..' atau 'PRIBADI'), tanpaFoto, luar: null | { tujuan, keperluan, gps } }
 */
function catatAbsenMasuk(c) {
  const akunDitemukan = c.akun, tk = c.tk, id = c.akun.id, tanpaFoto = c.tanpaFoto, luar = c.luar;

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
    // HP toko: penolakan tetap, tetapi dilengkapi data peringatan (layar 05) dan kode untuk "BUKAN SAYA".
    if (c.tiketMentah && !luar) {
      const lama = cariBarisAbsensiTampil(String(id), tanggalHariIni);
      if (lama && lama.baris.masuk_teks) { return responDobel(c, 'MASUK', 'Sudah absen masuk hari ini', lama.baris); }
    }
    return respon({ status: 'gagal', pesan: 'Sudah absen masuk hari ini' });
  }
  // Baris hari ini sudah ada tanpa jam masuk (mis. pulang tanpa masuk): jangan membuat baris kembar.
  if (absensi.data.some(function (r) { return String(r.karyawan) === String(id) && sebagaiTanggalTeks(r.tanggal, zona) === tanggalHariIni; })) {
    return respon({ status: 'gagal', pesan: 'Absen hari ini sudah tercatat. Hubungi admin untuk melengkapi jam masuk.' });
  }

  // Shift hari itu = jadwal efektif (kalender, pola, tukar shift), bukan sekadar shift bawaan akun.
  const jadwalNo = shiftEfektifHariIniAman(akunDitemukan, tanggalHariIni);
  const daftarShiftCab = bacaShiftCabang(akunDitemukan.cabang);
  const jendelaAbsen = ambilNilaiUmum('jendela_absen_menit', 60);
  let noShift = jadwalNo, shiftBeda = false;
  if (c.tiketMentah && !luar && !c.lewatiDeteksiShift) {
    const pil = pilihanShiftSah(detikSekarang, jadwalNo, c.shiftPilihan, daftarShiftCab, jendelaAbsen);
    if (!pil.ok) { return respon({ status: 'gagal', pesan: pil.pesan }); }
    if (c.shiftPilihan === undefined || c.shiftPilihan === null || c.shiftPilihan === '') {
      const dt = deteksiShiftBeda(detikSekarang, jadwalNo, daftarShiftCab, jendelaAbsen);
      if (dt) {
        // Layar 06: belum ada yang tersimpan, tiket belum dipakai; HP mengirim ulang dengan shift_pilihan.
        const sJ = daftarShiftCab.find(function (x) { return nomorShift(x.no) === jadwalNo; }), sU = daftarShiftCab.find(function (x) { return nomorShift(x.no) === dt.usulan; });
        return respon({ status: 'ok', perlu_pilih_shift: true, nama: String(akunDitemukan.nama), panggilan: String(akunDitemukan.panggilan || akunDitemukan.nama), jam: jamSekarang,
          jadwal: { no: jadwalNo, nama: sJ.nama, masuk: sJ.masuk }, usulan: { no: dt.usulan, nama: sU.nama, masuk: sU.masuk } });
      }
    }
    noShift = pil.no; shiftBeda = pil.beda;
  }
  const shiftKaryawan = daftarShiftCab.find(function (sh) { return nomorShift(sh.no) === noShift; });
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
  barisBaru.shift = noShift;
  barisBaru.masuk = jamSekarang;
  barisBaru.st_masuk = telat ? 'TELAT' : 'HADIR';
  barisBaru.telat_mnt = telatMnt;
  const ketLuar = luar ? susunKetLuar(luar.keterangan, '', luar.dalamToko) : '';
  barisBaru.ket_masuk = gabungKet(telat ? 'TIDAK DIISI' : '', ketLuar);
  barisBaru.cara_masuk = luar ? 'LUAR' : 'PIN';
  barisBaru.acc_masuk = accAwalLuar(luar);
  barisBaru.id_masuk = buatIdAbsen('M', id, tk.t, c.idHp);
  if (shiftBeda) {
    // Masuk di shift yang bukan jadwalnya: menunggu konfirmasi admin (Konfirmasi), ditandai SHIFT_BEDA.
    barisBaru.tanda = 'SHIFT_BEDA';
    barisBaru.acc_masuk = 'MENUNGGU';
    barisBaru.ket_masuk = gabungKet(barisBaru.ket_masuk, 'SHIFT BEDA: jadwal Shift ' + jadwalNo);
  }
  if (tanpaFoto) { barisBaru.foto_masuk = TEKS_TANPA_FOTO; } // kamera ditolak/tidak ada: absen tetap tersimpan

  absensi.sheet.appendRow(absensi.header.map(function (nama) { return barisBaru[nama]; }));
  if (luar) { tulisTeksSel(absensi, absensi.sheet.getLastRow(), 'gps_masuk', teksGps(luar.gps)); }

  const hasil = {
    status: 'ok',
    pesan: 'Absen masuk berhasil',
    luar: !!luar,
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
  if (shiftBeda) { hasil.shift_beda = true; hasil.shift_jadwal = jadwalNo; }
  if (c.tiketMentah && !luar) {
    const bk = belumPulangKemarin(id, tanggalHariIni);
    if (bk) { hasil.belum_pulang_kemarin = bk; }
  }
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
  if (!baris || baris.cabang !== hp.cabang || String(baris.ket_masuk).indexOf('TIDAK DIISI') !== 0) {
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

  perbaruiKolom(absensi, baris, { ket_masuk: ketSetelahAlasan(baris.ket_masuk, teks ? pilihan + ': ' + teks : pilihan) });
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

  const cocokAdmin = cocokkanPassword(password, admin.id, kodeRahasia, admin.pw_hash);
  if (!cocokAdmin.cocok) {
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
  if (cocokAdmin.migrasi) { perbaruiKolom(akun, admin, { pw_hash: cocokAdmin.hashBaru }); } // migrasi ke hash huruf kecil
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
  // PIN harus tepat 5 angka (PIN lama 4 angka tidak valid); bentuk salah tidak menaikkan hitungan salah.
  if (!validasiPin(pin).ok) { return { gagal: respon({ status: 'gagal', pesan: 'Karyawan atau PIN salah' }) }; }

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
      hapusCacheSesiAkun(id);
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

function prosesAbsenPulang(id, pin, jenis, hp, tiket, tanpaFoto, ekstra) {
  if (jenis !== 'PULANG' && jenis !== 'PULANG_LEMBUR') {
    return respon({ status: 'gagal', pesan: 'Jenis absen pulang tidak dikenal' });
  }
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const tk = periksaTiket(tiket, jenis === 'PULANG_LEMBUR' ? 'LEMBUR' : 'PULANG', hp.cabang, kunci, Date.now());
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }

  const cek = cekKaryawanDanPin(id, pin, hp);
  if (cek.gagal) { return cek.gagal; }
  return catatAbsenPulang({ akun: cek.akun, tk: tk, jenis: jenis, idHp: hp.id, tanpaFoto: tanpaFoto, luar: null, tiketMentah: tiket, konfirmasiRevisi: !!(ekstra && ekstra.konfirmasiRevisi) });
}

/**
 * Inti absen pulang/lembur (dipakai HP toko dan absen luar HP pribadi).
 * c = { akun, tk, jenis, idHp, tanpaFoto, luar: null | { tujuan, keperluan, gps } }
 */
function catatAbsenPulang(c) {
  const akunDitemukan = c.akun, tk = c.tk, jenis = c.jenis, tanpaFoto = c.tanpaFoto;

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
  // Peringatan HP toko (Fitur C): absen pulang kedua dan pulang tanpa absen masuk. Penolakan server tidak berubah.
  if (!c.luar && c.tiketMentah) {
    if (kondisi.sudahPulang && jenis === 'PULANG') {
      const lama = cariBarisAbsensiTampil(String(akunDitemukan.id), tanggalHariIni);
      if (lama && lama.baris.pulang_teks) { return responDobel(c, 'PULANG', 'Sudah absen pulang hari ini', lama.baris); }
    }
    const tanpaMasuk = catatPulangTanpaMasuk(c, kondisi, w);
    if (tanpaMasuk) { return tanpaMasuk; }
  }
  const hasil = tentukanStatusPulang(detik, kondisi.shift, jenis, kondisi.sudahMasuk, kondisi.sudahPulang, kondisi.stPulang);
  if (!hasil.ok) {
    return respon({ status: 'gagal', pesan: hasil.pesan });
  }
  if (!c.luar && c.tiketMentah && hasil.perubahan === 'REVISI' && c.konfirmasiRevisi !== true) {
    // Layar 07: sudah lembur, tanyakan dulu (tetap / revisi ke sekarang / bukan saya). Belum ada yang berubah, tiket belum dipakai.
    const lama = cariBarisAbsensiTampil(String(akunDitemukan.id), tanggalHariIni);
    if (lama) { return responKonfirmasiRevisi(c, lama.baris, hasil); }
  }

  const info = {
    id: akunDitemukan.id, nama: akunDitemukan.nama, panggilan: akunDitemukan.panggilan, cabang: akunDitemukan.cabang,
    tanggal: tanggalHariIni, jam: jamSekarang, detik: detik, shift: kondisi.shift.nama,
    st_pulang: hasil.st_pulang, acc: c.luar ? accAwalLuar(c.luar) : hasil.acc, tingkat: hasil.tingkat, durasi_menit: hasil.durasi_menit,
    perubahan: hasil.perubahan || '',
    luar: !!c.luar, ket_luar: c.luar ? susunKetLuar(c.luar.keterangan, '', c.luar.dalamToko) : '', gps_teks: c.luar ? teksGps(c.luar.gps) : '',
    id_absen: buatIdAbsen(hasil.st_pulang === 'LEMBUR DI TOKO' ? 'L' : 'P', akunDitemukan.id, tk.t, c.idHp),
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
    ket_pulang: gabungKet(keterangan, info.ket_luar),
    cara_pulang: info.luar ? 'LUAR' : 'PIN',
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
  if (info.luar && info.gps_teks) { tulisTeksSel(kondisi.absensi, kondisi.baris._baris, 'gps_pulang', info.gps_teks); }
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
    perubahan: info.perubahan, id_absen: info.id_absen, luar: !!info.luar
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
  ['12345', '11111', '00000', '98765'].forEach(function (p) { ujiBebas('PIN ' + p + ' diterima (5 angka apa pun, tanpa aturan berurutan/kembar)', validasiPin(p).ok); });
  ujiBebas('PIN bukan 5 angka ditolak (termasuk PIN lama 4 angka dan 6 angka)', ['', '1234', '123456', 'abcde', '12a45', ' 1234', '12 345', '１２３４５', null, undefined, 12345, [1, 2, 3, 4, 5]].every(function (p) { return !validasiPin(p).ok; }));

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
  ujiBebas('layar Karyawan: hanya KARYAWAN aktif cabang itu (ADMIN/OWNER/HP/cabang lain tidak tampil)', saringDaftarKaryawan(akunDaftar, 'Ngawi', 'AKTIF').map(function (x) { return x.id; }).join(',') === 'K001');
  ujiBebas('layar Karyawan: kelompok Nonaktif hanya berisi K002 (satu kelompok sekaligus, tanpa ADMIN/OWNER)', saringDaftarKaryawan(akunDaftar, 'Ngawi', 'NONAKTIF').map(function (x) { return x.id; }).join(',') === 'K002' && saringDaftarKaryawan(akunDaftar, 'Ngawi', undefined).map(function (x) { return x.id; }).join(',') === 'K001');
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

  // ---- Karyawan: shift opsional dan aktifkan kembali ----
  const dasar = { nama: 'Wulan Sari', panggilan: 'Wulan', mulai_kerja: '2026-10-01' };
  const tanpaShift = validasiDataKaryawan(Object.assign({}, dasar, { shift: '' }), [1]);
  ujiBebas('shift opsional: cabang bershift tunggal otomatis memakainya', tanpaShift.ok && tanpaShift.shift === '1', JSON.stringify(tanpaShift));
  ujiBebas('shift opsional: cabang bershift banyak, tidak dipilih = shift pertama', validasiDataKaryawan(Object.assign({}, dasar, { shift: '' }), [2, 1]).shift === '2' && validasiDataKaryawan(Object.assign({}, dasar, { shift: undefined }), [1, 2]).shift === '1');
  ujiBebas('shift opsional: dipilih eksplisit tetap dihormati dan shift ngawur tetap ditolak', validasiDataKaryawan(Object.assign({}, dasar, { shift: '2' }), [1, 2]).shift === '2' && !validasiDataKaryawan(Object.assign({}, dasar, { shift: '7' }), [1, 2]).ok);
  ujiBebas('shift opsional: cabang tanpa shift sama sekali ditolak dengan pesan jelas', !validasiDataKaryawan(Object.assign({}, dasar, { shift: '' }), []).ok && validasiDataKaryawan(Object.assign({}, dasar, { shift: '' }), []).pesan.indexOf('shift') !== -1);
  const rowsAktif = [
    { id: 'K001', nama: 'Budi Santoso', role: 'KARYAWAN', cabang: 'Ngawi', aktif: false },
    { id: 'K002', nama: 'Siti Rohmah', role: 'KARYAWAN', cabang: 'Ngawi', aktif: false },
    { id: 'K009', nama: 'siti rohmah', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true },
    { id: 'K003', nama: 'Rina', role: 'KARYAWAN', cabang: 'Pusat', aktif: false },
    { id: 'K004', nama: 'Dewi', role: 'ADMIN', cabang: 'Ngawi', aktif: false },
    { id: 'OWN01', nama: 'owner', role: 'OWNER', cabang: '', aktif: false },
    { id: 'K005', nama: 'Joko', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true }
  ];
  const cari = function (id) { return rowsAktif.filter(function (r) { return r.id === id; })[0]; };
  ujiBebas('aktifkan kembali: karyawan nonaktif cabang admin boleh (ID tetap sama)', bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('K001')).boleh === true && cari('K001').id === 'K001');
  ujiBebas('aktifkan kembali: nama kembar dengan karyawan AKTIF lain ditolak (tanpa beda huruf besar/kecil)', bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('K002')).boleh === false && bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('K002')).pesan.indexOf('nama lengkap') !== -1);
  ujiBebas('aktifkan kembali: cabang lain ditolak', bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('K003')).boleh === false);
  ujiBebas('aktifkan kembali: role ADMIN/OWNER/PERANGKAT ditolak', bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('K004')).boleh === false && bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('OWN01')).boleh === false && bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', { id: 'HPT-NGW-01', role: 'PERANGKAT', cabang: 'Ngawi', aktif: false, nama: 'HP' }).boleh === false);
  ujiBebas('aktifkan kembali: yang melakukan bukan ADMIN ditolak, target tidak ada ditolak', bolehAktifkanKembali(rowsAktif, 'KARYAWAN', 'Ngawi', cari('K001')).boleh === false && bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', undefined).boleh === false);
  ujiBebas('aktifkan kembali: yang sudah aktif = tidak ada perubahan (idempoten)', bolehAktifkanKembali(rowsAktif, 'ADMIN', 'Ngawi', cari('K005')).sudahAktif === true);

  // ---- Password tidak peka huruf besar-kecil + migrasi hash lama ----
  const KODE_UJI = 'kode-rahasia-uji';
  const hashBaruAdmin = hashPasswordBaru('Admin123', 'K010', KODE_UJI);
  ujiBebas('password baru disimpan versi huruf kecil: hash "Admin123" = hash "admin123"', hashBaruAdmin === hashDenganGaram('admin123', 'K010', KODE_UJI) && hashBaruAdmin === hashPasswordBaru('ADMIN123', 'K010', KODE_UJI));
  ujiBebas('login dengan huruf besar/kecil berbeda berhasil untuk hash baru (ADMIN123, admin123, adMIN123), tanpa migrasi', ['ADMIN123', 'admin123', 'adMIN123', 'Admin123'].every(function (p) { const c = cocokkanPassword(p, 'K010', KODE_UJI, hashBaruAdmin); return c.cocok === true && c.migrasi === false; }));
  const hashLama = hashDenganGaram('Admin123', 'K010', KODE_UJI); // versi lama: persis seperti diketik
  const cLama = cocokkanPassword('Admin123', 'K010', KODE_UJI, hashLama);
  ujiBebas('hash versi lama: login dengan ketikan persis lama berhasil dan diminta migrasi ke hash huruf kecil', cLama.cocok === true && cLama.migrasi === true && cLama.hashBaru === hashBaruAdmin);
  ujiBebas('setelah migrasi (pw_hash = hash huruf kecil) semua variasi huruf berhasil', ['ADMIN123', 'admin123', 'Admin123'].every(function (p) { return cocokkanPassword(p, 'K010', KODE_UJI, cLama.hashBaru).cocok; }));
  ujiBebas('hash versi lama: ketikan dengan huruf berbeda dari yang dulu tidak cocok (tidak ada jalan masuk lain)', cocokkanPassword('admin123', 'K010', KODE_UJI, hashLama).cocok === false && cocokkanPassword('ADMIN123', 'K010', KODE_UJI, hashLama).cocok === false);
  ujiBebas('password lama yang sudah huruf kecil: cocok langsung tanpa migrasi', (function () { const h = hashDenganGaram('kubahemas2026', 'OWN01', KODE_UJI); const c = cocokkanPassword('KubahEmas2026', 'OWN01', KODE_UJI, h); return c.cocok && c.migrasi === false; })());
  const salahSekali = cocokkanPassword('salah-total1', 'K010', KODE_UJI, hashBaruAdmin);
  ujiBebas('password salah = SATU kegagalan (kedua pembandingan gagal lalu satu hasil), hitungan salah naik 1 bukan 2', salahSekali.cocok === false && keputusanSalahPassword(2, t0).salahBaru === 3);
  ujiBebas('salah password dengan id lain tidak cocok (garam id tetap berlaku)', cocokkanPassword('Admin123', 'K011', KODE_UJI, hashBaruAdmin).cocok === false);
  ujiBebas('ganti password menyimpan versi huruf kecil (hash "KubahEmas2026" = hash "kubahemas2026")', hashPasswordBaru('KubahEmas2026', 'OWN01', KODE_UJI) === hashDenganGaram('kubahemas2026', 'OWN01', KODE_UJI));
  ujiBebas('aturan password dievaluasi pada huruf kecil: OWNER123 sama dengan username owner123 ditolak; 8 karakter huruf+angka tanpa huruf besar diterima', !periksaKekuatanPassword(normalisasiPassword('OWNER123'), 'owner123').ok && periksaKekuatanPassword(normalisasiPassword('abcdefg1'), 'owner').ok && periksaKekuatanPassword(normalisasiPassword('ABCDEFG1'), 'owner').ok);
  ujiBebas('password baru yang beda hanya huruf besar/kecil dari yang lama ditolak (sama setelah normalisasi)', !periksaKekuatanPassword(normalisasiPassword('KUBAHEMAS2026'), 'owner', normalisasiPassword('kubahemas2026')).ok);
  ujiBebas('normalisasi aman untuk undefined/null/angka', normalisasiPassword(undefined) === '' && normalisasiPassword(null) === '' && normalisasiPassword(123456) === '123456');

  // ---- Gelombang 2 bagian 1: PIN 5 angka, kata sandi admin, kredensial pertama, sesi HP pribadi ----
  ujiBebas('kata sandi admin: 8 karakter bebas diterima (huruf, angka urut, campuran, simbol)', ['abcdefgh', '12345678', 'Ab1!@#$%', 'Kata sandi panjang'].every(function (p) { return validasiKataSandiAdmin(p).ok; }));
  ujiBebas('kata sandi admin: 7 karakter, 101 karakter, bukan teks ditolak; 100 karakter diterima', !validasiKataSandiAdmin('1234567').ok && !validasiKataSandiAdmin('x'.repeat(101)).ok && validasiKataSandiAdmin('x'.repeat(100)).ok && !validasiKataSandiAdmin(12345678).ok && !validasiKataSandiAdmin(null).ok && !validasiKataSandiAdmin('').ok);
  const adminBaru = { role: 'ADMIN', aktif: true, ganti_pw: true, pw_hash: '', terkunci: false };
  ujiBebas('kredensial pertama: ADMIN aktif, ganti_pw TRUE, pw_hash kosong diizinkan', jalurKredensialAwalAdmin(adminBaru).boleh === true);
  ujiBebas('kredensial pertama: HANYA ADMIN (KARYAWAN, OWNER, PERANGKAT, tidak ada ditolak)', ['KARYAWAN', 'OWNER', 'PERANGKAT'].every(function (r) { return !jalurKredensialAwalAdmin(Object.assign({}, adminBaru, { role: r })).boleh; }) && !jalurKredensialAwalAdmin(null).boleh);
  ujiBebas('kredensial pertama: ditolak kalau pw_hash sudah terisi, ganti_pw FALSE, nonaktif, atau terkunci', !jalurKredensialAwalAdmin(Object.assign({}, adminBaru, { pw_hash: 'abc' })).boleh && !jalurKredensialAwalAdmin(Object.assign({}, adminBaru, { ganti_pw: false })).boleh && !jalurKredensialAwalAdmin(Object.assign({}, adminBaru, { aktif: false })).boleh && !jalurKredensialAwalAdmin(Object.assign({}, adminBaru, { terkunci: true })).boleh);
  ujiBebas('pesan gagal login HP pribadi: satu pesan untuk nama tidak ada dan kredensial salah, pesan terkunci terpisah', PESAN_PRIBADI_GAGAL === 'Nama atau PIN/kata sandi salah' && PESAN_PRIBADI_GAGAL !== PESAN_PRIBADI_TERKUNCI);
  const cachePribadi = { d: {}, get: function (k) { return this.d[k] || null; }, put: function (k, v) { this.d[k] = v; }, remove: function (k) { delete this.d[k]; } };
  let hPribadi; for (let n = 1; n <= 4; n++) { hPribadi = catatGagalPalsu(cachePribadi, 'pribadi-xyz', t0 + n * 1000); }
  ujiBebas('nama tidak ada: 4 percobaan belum ditahan, ke-5 ditahan lewat cache (bukan Script Properties)', hPribadi.ditahan === false && catatGagalPalsu(cachePribadi, 'pribadi-xyz', t0 + 5000).ditahan === true && Object.keys(cachePribadi.d).every(function (k) { return k.indexOf('palsu_') === 0; }));
  ujiBebas('jenis sesi dari kolom perangkat: HPTOKO..=TOKO, HPP..=PRIBADI, selain itu OWNER', jenisSesi({ perangkat: 'HPTOKOHPTNGW01|HP toko HPT-NGW-01' }) === 'TOKO' && jenisSesi({ perangkat: 'HPPabc123def4567|Android · Chrome' }) === 'PRIBADI' && jenisSesi({ perangkat: 'abc123def4567890|Windows · Edge' }) === 'OWNER');
  const sesiCabut = [
    { id_sesi: 'A', akun: 'K001', aktif: true, token_hash: 'ha', perangkat: 'HPPaaaa1111|HP 1' }, { id_sesi: 'B', akun: 'K001', aktif: true, token_hash: 'hb', perangkat: 'HPPbbbb2222|HP 2' },
    { id_sesi: 'C', akun: 'K001', aktif: false, token_hash: 'hc', perangkat: 'HPPcccc3333|HP 3' }, { id_sesi: 'D', akun: 'K002', aktif: true, token_hash: 'hd', perangkat: 'HPPdddd4444|HP 4' }
  ];
  ujiBebas('pencabutan sesi (reset PIN / nonaktif / keluarkan semua): semua sesi aktif akun itu dicabut, akun lain tidak', cabutSesiPada(sesiCabut, 'K001', '').filter(function (x) { return x.akun === 'K001'; }).every(function (x) { return !x.aktif; }) && cabutSesiPada(sesiCabut, 'K001', '').filter(function (x) { return x.akun === 'K002'; })[0].aktif === true);
  ujiBebas('pencabutan sesi menghapus cache validasi: kunci sp_ + hash hanya untuk sesi AKTIF milik akun itu', JSON.stringify(kunciCacheSesi(sesiCabut, 'K001')) === JSON.stringify(['sp_ha', 'sp_hb']) && kunciCacheSesi(sesiCabut, 'K999').length === 0);
  const adminNgawi = { role: 'ADMIN', id: 'K010', cabang: 'Ngawi' };
  ujiBebas('akses admin lintas cabang ditolak (karyawan Pusat oleh admin Ngawi)', !bolehKelolaKaryawan('ADMIN', 'Ngawi', { role: 'KARYAWAN', cabang: 'Pusat' }).boleh && bolehKelolaKaryawan('ADMIN', 'Ngawi', { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh);

  // ---- Gelombang 2 bagian 2: absen luar (HP pribadi) ----
  const tiketPribadi = buatTiket({ j: 'MASUK', t: epoch('07:45:50'), e: epoch('07:45:50') + 180000, c: 'Ngawi', n: 'pribadi1', a: 'K001' }, KUNCI_UJI);
  const tp1 = periksaTiket(tiketPribadi, 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10'), 'K001');
  ujiBebas('tiket waktu dengan sesi HP pribadi: tiket terikat akun, jam dari tiket (07:45:50 + kirim 07:46:10 = HADIR)', tp1.ok && tentukanStatusMasuk(waktuDariMs(tp1.t).detik, s1, 60).st_masuk === 'HADIR');
  ujiBebas('tiket pribadi: akun lain ditolak, dan tidak bisa dipakai di HP toko (tanpa akun)', !periksaTiket(tiketPribadi, 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10'), 'K002').ok && !periksaTiket(tiketPribadi, 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10')).ok);
  ujiBebas('tiket HP toko (tanpa akun) tidak bisa dipakai di HP pribadi', !periksaTiket(bikinTiket('MASUK', '07:45:50', 3), 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:46:10'), 'K001').ok);
  ujiBebas('tiket pribadi: jenis salah, kedaluwarsa, cabang salah tetap ditolak', !periksaTiket(tiketPribadi, 'PULANG', 'Ngawi', KUNCI_UJI, epoch('07:46:10'), 'K001').ok && !periksaTiket(tiketPribadi, 'MASUK', 'Ngawi', KUNCI_UJI, epoch('07:50:00'), 'K001').ok && !periksaTiket(tiketPribadi, 'MASUK', 'Pusat', KUNCI_UJI, epoch('07:46:10'), 'K001').ok);
  ujiBebas('status absen luar = status HP toko (fungsi yang sama): masuk 07:46:00 TELAT 1 menit, pulang 16:29:59 pulang cepat, lembur 17:30:01 tingkat 2', tentukanStatusMasuk(detik('07:46:00'), s1, 60).telat_mnt === 1 && tentukanStatusPulang(detik('16:29:59'), s1, 'PULANG', true, false).st_pulang === 'PULANG CEPAT' && tentukanStatusPulang(detik('17:30:01'), s1, 'PULANG_LEMBUR', true, false).tingkat === 2);

  const gpsOk = { lat: -7.404412, lng: 111.446212, akurasi: 18.4 };
  ujiBebas('GPS disimpan "lat,lng,akurasi" (lat dan lng di awal)', teksGps(gpsOk) === '-7.404412,111.446212,18' && akurasiDariGps(teksGps(gpsOk)) === 18);
  ujiBebas('absen luar berstatus MENUNGGU (masuk dan pulang); absen HP toko tidak berubah', accAwalLuar({ tujuan: 'a' }) === 'MENUNGGU' && accAwalLuar(null) === '');
  ujiBebas('keterangan luar: "LUAR: tujuan / keperluan", digabung dengan alasan memakai " | "', susunKetLuar('Toko Madiun', 'Antar barang') === 'LUAR: Toko Madiun / Antar barang' && gabungKet('Macet', 'LUAR: a / b') === 'Macet | LUAR: a / b' && gabungKet('', 'LUAR: a / b') === 'LUAR: a / b' && gabungKet('', '') === '');
  ujiBebas('alasan telat luar: "TIDAK DIISI | LUAR: x" menjadi "Macet | LUAR: x" (bagian luar tetap)', ketSetelahAlasan('TIDAK DIISI | LUAR: a / b', 'Macet') === 'Macet | LUAR: a / b' && ketSetelahAlasan('TIDAK DIISI', 'Hujan: deras') === 'Hujan: deras');
  ujiBebas('id absen HP pribadi memakai kode perangkat P dan foto bisa dibentuk jalurnya', kodePerangkatDariHp('PRIBADI') === 'P' && buatIdAbsen('M', 'K001', epoch('07:45:12'), 'PRIBADI') === 'M-K001-261005-074512-P' && jalurFoto({ tanggal: '2026-10-05', cabang: 'Ngawi', karyawan: 'K001', nama: 'Budi', shift: 1, id_masuk: 'M-K001-261005-074512-P' }, 'MASUK').namaBerkas === '051026_MASUK1_0745.jpg');
  const barisPribadi = { tanggal: '2026-10-05', cabang: 'Ngawi', karyawan: 'K001', id_masuk: 'M-K001-261005-074512-P', foto_masuk: '' };
  ujiBebas('unggah foto sesi HP pribadi: absen milik akun itu diterima, milik orang lain ditolak', validasiUnggahFoto({ jenis: 'MASUK', id_absen: barisPribadi.id_masuk, gambar: jpegUji }, barisPribadi, { cabang: 'Ngawi', akunId: 'K001' }, '2026-10-05').ok === true && !validasiUnggahFoto({ jenis: 'MASUK', id_absen: barisPribadi.id_masuk, gambar: jpegUji }, barisPribadi, { cabang: 'Ngawi', akunId: 'K002' }, '2026-10-05').ok);
  ujiBebas('jam dari teks tampilan sel: 07:45, 7:45:00, 4:30:00 PM = 16:30, 12:05 AM = 00:05, kosong', jamDariTampilan('07:45') === '07:45' && jamDariTampilan('7:45:00') === '07:45' && jamDariTampilan('4:30:00 PM') === '16:30' && jamDariTampilan('12:05:00 AM') === '00:05' && jamDariTampilan('') === '');
  const absenAll = [
    { tanggal: '2026-10-05', karyawan: 'K001', masuk: '07:44', pulang: '16:31', st_masuk: 'HADIR', st_pulang: 'PULANG NORMAL', cara_masuk: 'PIN', cara_pulang: 'PIN', acc_masuk: '', acc_pulang: '' },
    { tanggal: '2026-10-04', karyawan: 'K001', masuk: '08:10', pulang: '', st_masuk: 'TELAT', st_pulang: '', cara_masuk: 'LUAR', cara_pulang: '', acc_masuk: 'MENUNGGU', acc_pulang: '' },
    { tanggal: '2026-10-05', karyawan: 'K002', masuk: '07:50', pulang: '', st_masuk: 'TELAT', st_pulang: '', cara_masuk: 'PIN', cara_pulang: '', acc_masuk: '', acc_pulang: '' },
    { tanggal: '2026-08-01', karyawan: 'K001', masuk: '07:40', pulang: '16:30', st_masuk: 'HADIR', st_pulang: 'PULANG NORMAL', cara_masuk: 'PIN', cara_pulang: 'PIN', acc_masuk: '', acc_pulang: '' },
    { tanggal: '2026-09-20', karyawan: 'K001', masuk: '07:41', pulang: '16:30', st_masuk: 'HADIR', st_pulang: 'PULANG NORMAL', cara_masuk: 'LUAR', cara_pulang: 'LUAR', acc_masuk: 'DITERIMA', acc_pulang: 'DITOLAK' }
  ];
  const rw = rakitRiwayat(absenAll, 'K001', '2026-09-04', 50);
  ujiBebas('riwayat hanya milik sendiri (K002 tidak ikut), 31 hari terakhir (Agustus tidak), terbaru dulu', rw.length === 3 && rw.every(function (x) { return ['2026-10-05', '2026-10-04', '2026-09-20'].indexOf(x.tanggal) !== -1; }) && rw[0].tanggal === '2026-10-05' && rw[2].tanggal === '2026-09-20');
  ujiBebas('riwayat: persetujuan hanya tampil untuk absen luar (kosong untuk HP toko), pulang membawa acc_pulang', rw[0].acc_masuk === '' && rw[0].luar === false && rw[1].acc_masuk === 'MENUNGGU' && rw[1].luar === true && rw[2].acc_masuk === 'DITERIMA' && rw[2].acc_pulang === 'DITOLAK');
  const banyakAbsen = []; for (let n = 0; n < 80; n++) { banyakAbsen.push({ tanggal: '2026-10-' + ('0' + (1 + (n % 5))).slice(-2), karyawan: 'K001', masuk: '07:45', pulang: '', st_masuk: 'HADIR', st_pulang: '', cara_masuk: 'PIN', cara_pulang: '', acc_masuk: '', acc_pulang: '' }); }
  ujiBebas('riwayat dibatasi 50 baris', rakitRiwayat(banyakAbsen, 'K001', '2026-09-01', 50).length === 50);

  // ---- Gelombang 2 bagian 3: Konfirmasi (ACC / TOLAK) ----
  const dasarAbs = { tanggal: '2026-10-05', cabang: 'Ngawi', shift: 1, jam_masuk: '', jam_pulang: '', cara_masuk: 'PIN', cara_pulang: 'PIN', acc_masuk: '', acc_pulang: '', st_masuk: 'HADIR', st_pulang: '', lembur: '', ket_masuk: '', ket_pulang: '', foto_masuk: '', foto_pulang: '', gps_masuk: '', gps_pulang: '' };
  const buatAbs = function (o) { return Object.assign({}, dasarAbs, o); };
  const barisKonf = [
    buatAbs({ karyawan: 'K001', nama: 'Budi', jam_masuk: '07:44', cara_masuk: 'LUAR', acc_masuk: 'MENUNGGU', ket_masuk: 'LUAR: Madiun / Antar', gps_masuk: '-7.4,111.4,18', foto_masuk: 'https://drive.google.com/file/d/ABCDEFGHIJ1234/view', jam_pulang: '16:31', cara_pulang: 'LUAR', acc_pulang: 'MENUNGGU', st_pulang: 'PULANG NORMAL', gps_pulang: '-7.4,111.4,350', foto_pulang: 'TANPA FOTO' }),
    buatAbs({ karyawan: 'K002', nama: 'Siti', jam_pulang: '18:35', acc_pulang: 'MENUNGGU', st_pulang: 'LEMBUR DI TOKO', lembur: '2|125', ket_pulang: 'Stok opname' }),
    buatAbs({ karyawan: 'K003', nama: 'Rina', cabang: 'Pusat', jam_pulang: '15:10', acc_pulang: 'MENUNGGU', st_pulang: 'PULANG CEPAT', ket_pulang: 'Sakit' }),
    buatAbs({ karyawan: 'K010', nama: 'Dewi (admin)', jam_masuk: '08:00', cara_masuk: 'LUAR', acc_masuk: 'MENUNGGU', ket_masuk: 'LUAR: a / b', gps_masuk: '-7.4,111.4,20' }),
    buatAbs({ karyawan: 'K004', nama: 'Joko', jam_masuk: '07:40', acc_masuk: '', jam_pulang: '16:30', st_pulang: 'PULANG NORMAL' }),
    buatAbs({ karyawan: 'K005', nama: 'Andi', jam_masuk: '07:50', cara_masuk: 'LUAR', acc_masuk: 'DITERIMA', jam_pulang: '16:30', st_pulang: 'PULANG NORMAL', acc_pulang: 'DITOLAK' })
  ];
  const petaRoleUji = { K010: 'ADMIN' };
  const itemKonf = rakitItemKonfirmasi(barisKonf, petaRoleUji);
  ujiBebas('konfirmasi: hanya yang MENUNGGU jadi item (K004 normal dan K005 yang sudah diputuskan tidak)', itemKonf.length === 5 && itemKonf.every(function (x) { return ['K001', 'K002', 'K003', 'K010'].indexOf(x.karyawan) !== -1; }), String(itemKonf.length));
  ujiBebas('konfirmasi: satu baris = dua item terpisah (masuk dan pulang K001), id "ID|tanggal|JENIS"', itemKonf.filter(function (x) { return x.karyawan === 'K001'; }).map(function (x) { return x.id; }).sort().join(',') === 'K001|2026-10-05|MASUK,K001|2026-10-05|PULANG');
  const kel = function (id) { return itemKonf.filter(function (x) { return x.id === id; })[0].kelompok; };
  ujiBebas('pengelompokan: luar (masuk dan pulang luar), lembur, pulang cepat', kel('K001|2026-10-05|MASUK') === 'LUAR' && kel('K001|2026-10-05|PULANG') === 'LUAR' && kel('K002|2026-10-05|PULANG') === 'LEMBUR' && kel('K003|2026-10-05|PULANG') === 'PULANG_CEPAT');
  const itLembur = itemKonf.filter(function (x) { return x.karyawan === 'K002'; })[0];
  ujiBebas('kartu lembur membawa tingkat dan durasi, keterangan, jam', itLembur.tingkat === 2 && itLembur.durasi_menit === 125 && itLembur.ket === 'Stok opname' && itLembur.jam === '18:35');
  const itLuarMasuk = itemKonf.filter(function (x) { return x.id === 'K001|2026-10-05|MASUK'; })[0];
  const itLuarPulang = itemKonf.filter(function (x) { return x.id === 'K001|2026-10-05|PULANG'; })[0];
  ujiBebas('kartu luar: tautan Google Maps dari lat,lng dan status foto', itLuarMasuk.maps === 'https://www.google.com/maps?q=-7.4,111.4' && itLuarMasuk.foto === 'ADA' && itLuarPulang.foto === 'TANPA' && itLuarMasuk.ket === 'LUAR: Madiun / Antar');
  ujiBebas('kartu luar: akurasi lebih dari 100 m diberi tanda (350 m ya, 18 m tidak)', itLuarPulang.akurasi_buruk === true && itLuarMasuk.akurasi_buruk === false && itLuarMasuk.akurasi === 18);
  ujiBebas('tautan Maps: format lat,lng; tidak valid = null', urlMaps('-7.404412,111.446212,18') === 'https://www.google.com/maps?q=-7.404412,111.446212' && urlMaps('rusak') === null && urlMaps('91,10,5') === null && urlMaps('1,181,5') === null && urlMaps('') === null && urlMaps(',,') === null);
  const adminK = { role: 'ADMIN', id: 'K010', cabang: 'Ngawi' };
  const lihatAdmin = saringItemKonfirmasi(itemKonf, adminK, '');
  ujiBebas('hak lihat admin: hanya cabangnya, BUKAN absen sendiri (K010 tidak), cabang lain (K003 Pusat) tidak', lihatAdmin.every(function (x) { return x.cabang === 'Ngawi' && x.karyawan !== 'K010'; }) && lihatAdmin.length === 3, String(lihatAdmin.length));
  const lihatOwner = saringItemKonfirmasi(itemKonf, { role: 'OWNER', id: 'OWN01', cabang: '' }, '');
  ujiBebas('hak lihat: KARYAWAN atau tanpa aktor tidak melihat apa pun', saringItemKonfirmasi(itemKonf, { role: 'KARYAWAN', id: 'K001', cabang: 'Ngawi' }, '').length === 0 && saringItemKonfirmasi(itemKonf, null, '').length === 0);
  ujiBebas('satu keputusan per item: hanya MENUNGGU bisa diputuskan (DITERIMA/DITOLAK/kosong tidak)', bisaDiputuskan('MENUNGGU') === true && ['DITERIMA', 'DITOLAK', '', undefined].every(function (x) { return bisaDiputuskan(x) === false; }));
  ujiBebas('id item: bentuk sah diurai, bentuk lain ditolak (injeksi, jenis salah, tanggal rusak)', JSON.stringify(parseIdItem('K001|2026-10-05|MASUK')) === JSON.stringify({ karyawan: 'K001', tanggal: '2026-10-05', jenis: 'MASUK' }) && parseIdItem('K001|2026-10-05|LAIN') === null && parseIdItem('K001|besok|MASUK') === null && parseIdItem("K001|2026-10-05|MASUK'--") === null && parseIdItem('') === null && parseIdItem(null) === null);
  const banyakItem = []; for (let n = 0; n < 45; n++) { banyakItem.push({ id: 'K' + n, kelompok: n % 3 === 0 ? 'PULANG_CEPAT' : (n % 3 === 1 ? 'LUAR' : 'LEMBUR'), tanggal: '2026-10-' + ('0' + (1 + (n % 9))).slice(-2), jam: '07:' + ('0' + (n % 60)).slice(-2) }); }
  const h1 = halamanKonfirmasi(banyakItem, 0, 20), h3 = halamanKonfirmasi(banyakItem, 40, 20);
  ujiBebas('pembatasan 20 kartu per layar: halaman 1 = 20 dan masih ada lagi; halaman 3 = 5 dan habis; total 45', h1.daftar.length === 20 && h1.ada_lagi === true && h3.daftar.length === 5 && h3.ada_lagi === false && h1.total === 45);
  ujiBebas('urutan: Absen luar dulu, lalu Lembur, lalu Pulang cepat; di dalam kelompok terbaru dulu', h1.daftar[0].kelompok === 'LUAR' && halamanKonfirmasi(banyakItem, 0, 45).daftar.map(function (x) { return x.kelompok; }).join(',').replace(/(\w+)(,\1)+/g, '$1') === 'LUAR,LEMBUR,PULANG_CEPAT' && (function () { const l = halamanKonfirmasi(banyakItem, 0, 45).daftar.filter(function (x) { return x.kelompok === 'LUAR'; }); return l[0].tanggal >= l[l.length - 1].tanggal; })());
  ujiBebas('jumlah: 99 tampil 99, 100 tampil "99+"', jumlahTeks(0) === '0' && jumlahTeks(99) === '99' && jumlahTeks(100) === '99+' && jumlahTeks(250) === '99+');
  ujiBebas('foto: ID berkas Drive dari tautan; kosong, TANPA FOTO, tautan asing = null', idBerkasDrive('https://drive.google.com/file/d/ABCDEFGHIJ1234/view?usp=drivesdk') === 'ABCDEFGHIJ1234' && idBerkasDrive('https://drive.google.com/open?id=XYZabc_123-456') === 'XYZabc_123-456' && idBerkasDrive('TANPA FOTO') === null && idBerkasDrive('') === null && idBerkasDrive('https://contoh.com/gambar.jpg') === null);
  ujiBebas('kartu Hari ini konsisten dengan Konfirmasi: menunggu ACC menghitung item masuk DAN pulang yang MENUNGGU', hitungHariIni([{ tanggal: '2026-10-05', cabang: 'Ngawi', shift: 1, masuk: '07:44', st_masuk: 'HADIR', pulang: '16:31', acc_masuk: 'MENUNGGU', acc_pulang: 'MENUNGGU' }, { tanggal: '2026-10-05', cabang: 'Ngawi', shift: 1, masuk: '07:50', st_masuk: 'TELAT', pulang: '', acc_masuk: 'DITERIMA', acc_pulang: '' }], '2026-10-05', '', '').menunggu_acc === 2);

  // ---- Paket perbaikan: absen luar ketik bebas, penanda area toko, aturan konfirmasi, edit, lembur HP pribadi ----
  const gpsToko = { lat: -7.4044, lng: 111.4462, akurasi: 10 };
  // 1) keterangan ketik bebas, wajib minimal 5 karakter (masuk, pulang, lembur: validasinya satu)
  ujiBebas('absen luar: keterangan wajib minimal 5 karakter setelah spasi dipotong (kosong, 4 huruf, spasi saja, "  ab  " ditolak; 5 huruf diterima)', ['', '   ', 'abcd', '  ab  ', '  abc  ', undefined, null].every(function (x) { return !validasiAbsenLuar({ keterangan: x, gps: gpsOk }).ok; }) && validasiAbsenLuar({ keterangan: 'abcde', gps: gpsOk }).ok === true && validasiAbsenLuar({ keterangan: '  survey  ', gps: gpsOk }).keterangan === 'survey');
  ujiBebas('absen luar: maksimal 100 karakter, karakter kontrol ditolak, tanda | diganti / (supaya tidak merusak pemisah kolom)', validasiAbsenLuar({ keterangan: 'x'.repeat(101), gps: gpsOk }).ok === false && validasiAbsenLuar({ keterangan: 'x'.repeat(100), gps: gpsOk }).ok === true && validasiAbsenLuar({ keterangan: 'abc\u0007def', gps: gpsOk }).ok === false && validasiAbsenLuar({ keterangan: 'antar | barang', gps: gpsOk }).keterangan === 'antar / barang');
  ujiBebas('absen luar: kolom tujuan/keperluan lama diabaikan (tanpa keterangan tetap ditolak)', validasiAbsenLuar({ tujuan: 'Toko Madiun', keperluan: 'Survey', gps: gpsOk }).ok === false);
  ujiBebas('absen luar: GPS tetap wajib dan divalidasi tipe/rentangnya (tanpa lokasi, teks, lat 91, lng 181, akurasi negatif, NaN ditolak)', !validasiAbsenLuar({ keterangan: 'abcde' }).ok && !validasiAbsenLuar({ keterangan: 'abcde', gps: null }).ok && !validasiAbsenLuar({ keterangan: 'abcde', gps: { lat: 1, lng: 2 } }).ok && [{ lat: '1', lng: 2, akurasi: 3 }, { lat: 91, lng: 2, akurasi: 3 }, { lat: 1, lng: 181, akurasi: 3 }, { lat: 1, lng: 2, akurasi: -1 }, { lat: NaN, lng: 2, akurasi: 3 }].every(function (g) { return !validasiAbsenLuar({ keterangan: 'abcde', gps: g }).ok; }));
  ujiBebas('akurasi buruk (350 m) tetap diterima tapi ditandai; 100 m tidak ditandai', validasiAbsenLuar({ keterangan: 'abcde', gps: { lat: 1, lng: 2, akurasi: 350 } }).ok && akurasiBuruk('1,2,350') === true && akurasiBuruk('1,2,100') === false);
  ujiBebas('keterangan disimpan "LUAR: keterangan"; data lama "LUAR: tujuan / keperluan" tetap bisa dibaca', susunKetLuar('Pasang AC rumah Bu Sri', '') === 'LUAR: Pasang AC rumah Bu Sri' && uraiKetLuar('LUAR: Madiun / Antar').teks === 'Madiun / Antar' && uraiKetLuar('LUAR: Madiun / Antar').luar === true);
  // 3) penanda di dalam area toko
  const titikToko = [{ lat: -7.4044, lng: 111.4462 }];
  const dekat50 = { lat: -7.4044 + 0.00045, lng: 111.4462 }, jauh150 = { lat: -7.4044 + 0.00135, lng: 111.4462 };
  ujiBebas('area toko: ±50 m dari toko = di dalam (radius 100), ±150 m = di luar, radius 200 membuat 150 m di dalam', dalamRadiusToko(dekat50, titikToko, 100) === true && dalamRadiusToko(jauh150, titikToko, 100) === false && dalamRadiusToko(jauh150, titikToko, 200) === true && Math.round(jarakMeter(dekat50.lat, dekat50.lng, -7.4044, 111.4462)) >= 45 && Math.round(jarakMeter(dekat50.lat, dekat50.lng, -7.4044, 111.4462)) <= 55);
  ujiBebas('area toko: tanpa titik toko = di luar; salah satu dari beberapa HP toko cukup; koordinat gps_daftar "lat,lng,akurasi" dibaca, yang rusak diabaikan', dalamRadiusToko(dekat50, [], 100) === false && dalamRadiusToko(dekat50, [{ lat: 0, lng: 0 }, titikToko[0]], 100) === true && titikDariGps('-7.4044,111.4462,18').lat === -7.4044 && titikDariGps('rusak') === null && titikDariGps('') === null && titikDariGps('91,10,5') === null && titikDariGps(',,') === null);
  ujiBebas('penanda area toko di keterangan: "LUAR [AREA TOKO]: ..." (absen tetap diterima, tanpa kolom baru), terbaca kembali, dan tidak muncul di teks keterangan', susunKetLuar('Pasang AC rumah Bu Sri', '', true) === 'LUAR [AREA TOKO]: Pasang AC rumah Bu Sri' && uraiKetLuar('Macet | LUAR [AREA TOKO]: Pasang AC').dalamToko === true && uraiKetLuar('Macet | LUAR [AREA TOKO]: Pasang AC').teks === 'Pasang AC' && uraiKetLuar('Macet | LUAR [AREA TOKO]: Pasang AC').ketBersih === 'Macet | LUAR: Pasang AC' && uraiKetLuar('LUAR: Pasang AC').dalamToko === false);
  const itTandaToko = rakitItemKonfirmasi([buatAbs({ karyawan: 'K001', nama: 'Budi', jam_masuk: '07:44', cara_masuk: 'LUAR', acc_masuk: 'MENUNGGU', ket_masuk: 'LUAR [AREA TOKO]: Pasang AC rumah' })], {})[0];
  ujiBebas('kartu Konfirmasi membawa penanda dalam_area_toko, keterangan bersih, dan tanda luar', itTandaToko.dalam_area_toko === true && itTandaToko.ket === 'LUAR: Pasang AC rumah' && itTandaToko.luar === true && itTandaToko.ket_edit === 'Pasang AC rumah');
  // 4) aturan konfirmasi: owner hanya pengajuan admin, admin hanya pengajuan karyawan dan bukan miliknya sendiri
  const ownerK = { role: 'OWNER', id: 'OWN01', cabang: '' }, adminK2 = { role: 'ADMIN', id: 'K010', cabang: 'Ngawi' };
  ujiBebas('konfirmasi: OWNER menolak pengajuan KARYAWAN (server, bukan hanya disembunyikan) dan boleh pengajuan ADMIN semua cabang', !bolehMemutuskanKonfirmasi(ownerK, { karyawan: 'K001', cabang: 'Ngawi', role: 'KARYAWAN' }).boleh && !bolehMemutuskanKonfirmasi(ownerK, { karyawan: 'K001', cabang: 'Ngawi' }).boleh && bolehMemutuskanKonfirmasi(ownerK, { karyawan: 'K010', cabang: 'Ngawi', role: 'ADMIN' }).boleh && bolehMemutuskanKonfirmasi(ownerK, { karyawan: 'K020', cabang: 'Pusat', role: 'ADMIN' }).boleh);
  ujiBebas('konfirmasi: ADMIN menolak pengajuannya sendiri (ACC, TOLAK, edit), pengajuan admin lain, dan cabang lain; boleh pengajuan karyawan cabangnya', !bolehMemutuskanKonfirmasi(adminK2, { karyawan: 'K010', cabang: 'Ngawi', role: 'ADMIN' }).boleh && !bolehMemutuskanKonfirmasi(adminK2, { karyawan: 'K011', cabang: 'Ngawi', role: 'ADMIN' }).boleh && !bolehMemutuskanKonfirmasi(adminK2, { karyawan: 'K001', cabang: 'Pusat', role: 'KARYAWAN' }).boleh && bolehMemutuskanKonfirmasi(adminK2, { karyawan: 'K001', cabang: 'Ngawi', role: 'KARYAWAN' }).boleh);
  ujiBebas('konfirmasi: KARYAWAN, PERANGKAT, tanpa aktor ditolak semuanya', ['KARYAWAN', 'PERANGKAT'].every(function (r) { return !bolehMemutuskanKonfirmasi({ role: r, id: 'K001', cabang: 'Ngawi' }, { karyawan: 'K002', cabang: 'Ngawi', role: 'KARYAWAN' }).boleh; }) && !bolehMemutuskanKonfirmasi(null, { karyawan: 'K002', cabang: 'Ngawi' }).boleh);
  const lihatOwner2 = saringItemKonfirmasi(itemKonf, ownerK, '');
  ujiBebas('konfirmasi: owner hanya MELIHAT pengajuan level admin (K010 saja), filter cabang Pusat = 0; admin melihat karyawan cabangnya tanpa miliknya', lihatOwner2.length === 1 && lihatOwner2[0].karyawan === 'K010' && saringItemKonfirmasi(itemKonf, ownerK, 'Pusat').length === 0 && saringItemKonfirmasi(itemKonf, adminK2, '').every(function (x) { return x.role === 'KARYAWAN' && x.cabang === 'Ngawi'; }));
  // 5) edit pengajuan absen luar
  const sekarang10 = epoch('10:00:00');
  const dasarEdit = { jenis: 'MASUK', tanggal: '2026-10-05', jamBaru: '07:44', keterangan: 'Pasang AC rumah Bu Sri', sekarangMs: sekarang10, jendelaMenit: 60, shift: s1, jamMasuk: '07:50', jamPulang: '', stMasuk: 'TELAT', stPulang: '', ketLama: 'TIDAK DIISI | LUAR: Pasang AC lama' };
  const edit = function (o) { return rencanaEditAbsen(Object.assign({}, dasarEdit, o)); };
  const e1 = edit({});
  ujiBebas('edit masuk: 07:50 TELAT diedit ke 07:44 = HADIR, alasan telat dibuang, tetap MENUNGGU, keterangan baru', e1.ok && e1.perubahan.st_masuk === 'HADIR' && e1.perubahan.telat_mnt === 0 && e1.perubahan.masuk === '07:44' && e1.perubahan.ket_masuk === 'LUAR: Pasang AC rumah Bu Sri' && e1.perubahan.acc_masuk === 'MENUNGGU');
  const e2 = edit({ jamBaru: '07:52', stMasuk: 'HADIR', ketLama: 'LUAR: lama sekali' });
  ujiBebas('edit masuk: HADIR diedit ke 07:52 = TELAT 7 menit (aturan sama dengan absen biasa), keterangan "TIDAK DIISI | LUAR: ..."', e2.ok && e2.perubahan.st_masuk === 'TELAT' && e2.perubahan.telat_mnt === 7 && e2.perubahan.ket_masuk === 'TIDAK DIISI | LUAR: Pasang AC rumah Bu Sri');
  ujiBebas('edit masuk: alasan telat yang sudah diisi dipertahankan selama masih telat', edit({ jamBaru: '08:00', ketLama: 'Macet | LUAR: lama' }).perubahan.ket_masuk === 'Macet | LUAR: Pasang AC rumah Bu Sri' && edit({ jamBaru: '07:45', ketLama: 'Macet | LUAR: lama' }).perubahan.st_masuk === 'HADIR');
  ujiBebas('edit masuk: 07:45:xx batas tepat (HADIR) dan 07:46 TELAT 1 menit', edit({ jamBaru: '07:45' }).perubahan.st_masuk === 'HADIR' && edit({ jamBaru: '07:46' }).perubahan.telat_mnt === 1);
  ujiBebas('edit masuk: sebelum jendela absen dibuka ditolak (06:00 sebelum 06:45)', edit({ jamBaru: '06:00' }).ok === false);
  ujiBebas('edit: keterangan hasil edit tetap minimal 5 karakter; jam salah bentuk ditolak', !edit({ keterangan: 'abcd' }).ok && !edit({ keterangan: '    ' }).ok && !edit({ jamBaru: '7:5' }).ok && !edit({ jamBaru: '24:00' }).ok && !edit({ jamBaru: '07:60' }).ok && !edit({ jamBaru: '' }).ok);
  ujiBebas('edit: jam tidak boleh melewati jam server sekarang (10:00): 10:00 boleh, 10:01 dan 23:59 ditolak; tanggal kemarin boleh jam berapa pun', edit({ jenis: 'PULANG', jamBaru: '10:00', jamMasuk: '07:00', stPulang: 'PULANG CEPAT', ketLama: 'Sakit | LUAR: a' }).ok === true && !edit({ jamBaru: '10:01' }).ok && !edit({ jamBaru: '23:59' }).ok && edit({ jamBaru: '07:44', tanggal: '2026-10-04' }).ok === true && jamTidakMelewati('2026-10-05', '10:00', sekarang10) === true && jamTidakMelewati('2026-10-05', '10:01', sekarang10) === false);
  ujiBebas('edit masuk: jam masuk harus sebelum jam pulang yang sudah ada', !edit({ jamPulang: '07:40' }).ok && edit({ jamPulang: '16:30' }).ok);
  const dasarPulang = { jenis: 'PULANG', jamMasuk: '07:44', jamPulang: '16:32', stPulang: 'PULANG NORMAL', ketLama: 'LUAR: a b c d' };
  ujiBebas('edit pulang: PULANG NORMAL diedit ke 15:00 = PULANG CEPAT (alasan "TIDAK DIISI" karena belum ada), tetap MENUNGGU', (function () { const r = edit(Object.assign({}, dasarPulang, { jamBaru: '15:00', sekarangMs: epoch('18:00:00') })); return r.ok && r.perubahan.st_pulang === 'PULANG CEPAT' && r.perubahan.ket_pulang === 'TIDAK DIISI | LUAR: Pasang AC rumah Bu Sri' && r.perubahan.acc_pulang === 'MENUNGGU' && r.perubahan.lembur === ''; })());
  const dasarLembur = Object.assign({}, dasarPulang, { stPulang: 'LEMBUR DI TOKO', ketLama: 'Stok opname | LUAR: lama', sekarangMs: epoch('21:00:00') });
  const eL = edit(Object.assign({}, dasarLembur, { jamBaru: '17:31' }));
  ujiBebas('edit lembur: tingkat dihitung ulang dari jam baru (17:31 = 61 menit = tingkat 2; 17:00 = 30 menit = tingkat 1; 19:00 = tingkat 3), alasan lama dipertahankan', eL.ok && eL.perubahan.lembur === '2|61' && eL.perubahan.st_pulang === 'LEMBUR DI TOKO' && eL.perubahan.ket_pulang === 'Stok opname | LUAR: Pasang AC rumah Bu Sri' && edit(Object.assign({}, dasarLembur, { jamBaru: '17:00' })).perubahan.lembur === '1|30' && edit(Object.assign({}, dasarLembur, { jamBaru: '19:00' })).perubahan.lembur.charAt(0) === '3');
  ujiBebas('edit lembur: jenis tidak berubah, jam sebelum lembur dibuka (16:35, batas 16:36) ditolak; jam pulang harus setelah jam masuk', !edit(Object.assign({}, dasarLembur, { jamBaru: '16:35' })).ok && edit(Object.assign({}, dasarLembur, { jamBaru: '16:36' })).ok && !edit(Object.assign({}, dasarPulang, { jamBaru: '07:40' })).ok);
  ujiBebas('edit: penanda "dalam area toko" ikut terjaga setelah edit', edit({ ketLama: 'LUAR [AREA TOKO]: lama' }).perubahan.ket_masuk === 'LUAR [AREA TOKO]: Pasang AC rumah Bu Sri');
  ujiBebas('edit: tanpa jadwal shift ditolak; catatan sebelum/sesudah untuk log berisi jam lama dan baru', !edit({ shift: null }).ok && e1.sebelum.indexOf('masuk=07:50') === 0 && e1.sesudah.indexOf('masuk=07:44') === 0);
  // 6) tombol LEMBUR HP pribadi mengikuti jam server dengan aturan yang sama dengan HP toko
  ujiBebas('lembur_boleh: 16:35:59 belum, 16:36:00 boleh (jam pulang 16:30 + toleransi 5 + 1 menit), belum absen masuk tidak boleh', lemburBolehDariJam(detik('16:35:59'), s1, true, false, '') === false && lemburBolehDariJam(detik('16:36:00'), s1, true, false, '') === true && lemburBolehDariJam(detik('18:00:00'), s1, false, false, '') === false);
  ujiBebas('lembur_boleh: setelah PULANG CEPAT tidak boleh; setelah PULANG NORMAL (ganti jadi lembur) dan LEMBUR (revisi) boleh', lemburBolehDariJam(detik('18:00:00'), s1, true, true, 'PULANG CEPAT') === false && lemburBolehDariJam(detik('18:00:00'), s1, true, true, 'PULANG NORMAL') === true && lemburBolehDariJam(detik('18:00:00'), s1, true, true, 'LEMBUR DI TOKO') === true);
  ujiBebas('lembur_boleh: shift 2 memakai jam pulangnya sendiri (22:00 + 6 menit)', lemburBolehDariJam(detik('22:05:59'), siang, true, false, '') === false && lemburBolehDariJam(detik('22:06:00'), siang, true, false, '') === true);
  ujiBebas('absen pulang luar tanpa absen masuk hari itu ditolak di server (tombol Absen Pulang hanya aktif setelah ada absen masuk)', tentukanStatusPulang(detik('17:00:00'), s1, 'PULANG', false, false, '').ok === false && tentukanStatusPulang(detik('17:00:00'), s1, 'PULANG', false, false, '').pesan === 'Belum absen masuk hari ini');

  // ---- Paket beranda: angka Hadir/Telat/Belum absen/Izin per shift (aksi beranda_hari_ini) ----
  const shiftBeranda = [{ cabang: 'Ngawi', no: 1, nama: 'Shift 1', masuk: '07:45' }, { cabang: 'Ngawi', no: 2, nama: 'Shift 2', masuk: '13:45' }, { cabang: 'Pusat', no: 1, nama: 'Shift 1', masuk: '08:00' }];
  const akB = function (id, nama, cabang, role, shift, extra) { return Object.assign({ id: id, nama: nama, panggilan: nama, cabang: cabang, role: role, shift: shift, aktif: true, pola_shift: 'TETAP', urutan_shift: '', ganti_setiap: '', mulai_pola: '' }, extra || {}); };
  const akunBeranda = [
    akB('K001', 'Budi', 'Ngawi', 'KARYAWAN', 1), akB('K002', 'Siti', 'Ngawi', 'KARYAWAN', 1), akB('K003', 'Joko', 'Ngawi', 'KARYAWAN', 1),
    akB('K004', 'Rina', 'Ngawi', 'KARYAWAN', 2), akB('K005', 'Ani', 'Ngawi', 'KARYAWAN', 1, { pola_shift: 'BERGILIR', urutan_shift: '1,2', ganti_setiap: '1M', mulai_pola: '2026-09-28' }),
    akB('K006', 'Dewi', 'Ngawi', 'KARYAWAN', 1), akB('K007', 'Lama', 'Ngawi', 'KARYAWAN', 1, { aktif: false }), akB('A01', 'Admin Ngawi', 'Ngawi', 'ADMIN', 1),
    akB('OWN01', 'owner', '', 'OWNER', ''), akB('HPT-NGW-01', 'HP toko', 'Ngawi', 'PERANGKAT', ''), akB('K101', 'Dodi', 'Pusat', 'KARYAWAN', 1)
  ];
  const absB = [
    { tanggal: '2026-10-05', karyawan: 'K001', cabang: 'Ngawi', shift: 1, masuk: '07:40', st_masuk: 'HADIR' },
    { tanggal: '2026-10-05', karyawan: 'K002', cabang: 'Ngawi', shift: 1, masuk: '07:50', st_masuk: 'TELAT' },
    { tanggal: '2026-10-05', karyawan: 'A01', cabang: 'Ngawi', shift: 1, masuk: '07:30', st_masuk: 'HADIR' },
    { tanggal: '2026-10-03', karyawan: 'K001', cabang: 'Ngawi', shift: 1, masuk: '07:50', st_masuk: 'TELAT' },
    { tanggal: '2026-10-03', karyawan: 'K002', cabang: 'Ngawi', shift: 1, masuk: '07:55', st_masuk: 'TELAT' },
    { tanggal: '2026-10-02', karyawan: 'K101', cabang: 'Pusat', shift: 1, masuk: '08:10', st_masuk: 'TELAT' }
  ];
  const izinB = [
    { karyawan: 'K006', jenis: 'Sakit', mulai: '2026-10-05', selesai: '2026-10-06', status: 'DITERIMA' },
    { karyawan: 'K003', jenis: 'Cuti', mulai: '2026-10-05', selesai: '2026-10-05', status: 'DITOLAK' },
    { karyawan: 'K004', jenis: 'TUKAR_SHIFT', mulai: '2026-10-05', selesai: '2026-10-05', status: 'SETUJU' }
  ];
  const masB = function (extra) { return Object.assign({ tanggal: '2026-10-05', jam: '08:20', cabang: 'Ngawi', akun: akunBeranda, shift: shiftBeranda, kalender: [], absensi: absB, izin: izinB, liburMingguCabang: { Ngawi: true, Pusat: false } }, extra || {}); };
  const bn = hitungBerandaHariIni(masB());
  const s1B = bn.shift.find(function (x) { return x.no === 1; }), s2B = bn.shift.find(function (x) { return x.no === 2; });
  ujiBebas('beranda: shift 1 Ngawi = Tepat waktu 2 (Budi dan admin; Siti yang telat TIDAK masuk Tepat waktu), Telat 1, Belum absen 1 (Joko; izin DITOLAK tidak dihitung), Izin/cuti 1 (Dewi)', s1B.tepat === 2 && s1B.telat === 1 && s1B.belum === 1 && s1B.izin === 1 && s1B.belum_daftar[0].nama === 'Joko' && s1B.belum_daftar[0].jadwal === '07:45');
  ujiBebas('beranda: shift 2 belum dimulai (13:45 > 08:20): Rina dan Ani (pola bergilir pekan ke-2) TIDAK dihitung belum absen; tukar shift bukan izin', s2B.belum === 0 && s2B.izin === 0 && s2B.tepat === 0 && s2B.masuk === '13:45');
  ujiBebas('beranda: "Semua shift" = jumlah semua shift; karyawan nonaktif, owner, dan HP toko tidak dihitung; cabang Pusat tidak ikut saat filter Ngawi', bn.semua.tepat === 2 && bn.semua.telat === 1 && bn.semua.belum === 1 && bn.semua.izin === 1);
  const bSemua = hitungBerandaHariIni(masB({ cabang: '' }));
  ujiBebas('beranda owner "Semua cabang": karyawan Pusat (Dodi, jam masuk 08:00 sudah lewat) ikut dihitung belum absen; shift digabung per nomor', bSemua.semua.belum === 2 && bSemua.shift.length === 2 && bSemua.shift[0].belum_daftar.length === 2);
  ujiBebas('beranda sebelum jam masuk (07:00): tidak ada yang dihitung belum absen', hitungBerandaHariIni(masB({ jam: '07:00' })).semua.belum === 0);
  ujiBebas('beranda: libur khusus di kalender (semua cabang) = Joko tidak dihitung belum absen; kalender khusus karyawan mengalahkan umum', hitungBerandaHariIni(masB({ kalender: [{ tanggal: '2026-10-05', cabang: '', karyawan: '', isi: 'LIBUR KHUSUS' }] })).semua.belum === 0 && hitungBerandaHariIni(masB({ kalender: [{ tanggal: '2026-10-05', cabang: 'Ngawi', karyawan: 'K003', isi: '2' }, { tanggal: '2026-10-05', cabang: 'Ngawi', karyawan: '', isi: 'LIBUR KHUSUS' }] })).shift[1].belum === 0);
  ujiBebas('beranda: kalender menukar Joko ke shift 2 = tidak belum absen di shift 1', hitungBerandaHariIni(masB({ kalender: [{ tanggal: '2026-10-05', cabang: 'Ngawi', karyawan: 'K003', isi: '2' }] })).shift[0].belum === 0);
  const minggu = hitungBerandaHariIni(masB({ tanggal: '2026-10-04', absensi: [] }));
  ujiBebas('beranda: hari Minggu dengan libur_minggu cabang TRUE = tidak ada yang belum absen; FALSE (Pusat) = tetap dihitung', minggu.semua.belum === 0 && hitungBerandaHariIni(masB({ tanggal: '2026-10-04', cabang: 'Pusat', absensi: [] })).semua.belum === 1);
  const ani = akunBeranda[4];
  ujiBebas('pola bergilir 1M: 28 Sep = shift 1, 4 Okt = shift 1, 5 Okt = shift 2, 12 Okt = shift 1; sebelum mulai_pola = shift pertama', shiftMenurutPola(ani, '2026-09-28') === 1 && shiftMenurutPola(ani, '2026-10-04') === 1 && shiftMenurutPola(ani, '2026-10-05') === 2 && shiftMenurutPola(ani, '2026-10-12') === 1 && shiftMenurutPola(ani, '2026-09-01') === 1);
  const bln = akB('X', 'X', 'Ngawi', 'KARYAWAN', 1, { pola_shift: 'BERGILIR', urutan_shift: '1,2', ganti_setiap: '1B', mulai_pola: '2026-08-15' });
  ujiBebas('pola bergilir 1B: 14 Sep masih periode pertama (shift 1), 15 Sep periode kedua (shift 2), 15 Okt kembali shift 1', shiftMenurutPola(bln, '2026-09-14') === 1 && shiftMenurutPola(bln, '2026-09-15') === 2 && shiftMenurutPola(bln, '2026-10-15') === 1);
  ujiBebas('pola bergilir: ganti_setiap rusak / urutan kosong memakai shift pertama atau shift akun', shiftMenurutPola(akB('Y', 'Y', 'Ngawi', 'KARYAWAN', 2, { pola_shift: 'BERGILIR', urutan_shift: '1,2', ganti_setiap: 'x', mulai_pola: '2026-08-15' }), '2026-10-05') === 1 && shiftMenurutPola(akB('Z', 'Z', 'Ngawi', 'KARYAWAN', 2, { pola_shift: 'BERGILIR' }), '2026-10-05') === 2);
  ujiBebas('telat 7 hari: tujuh hari berurutan berakhir hari ini; 3 Okt = 2, 5 Okt = 1; cabang Ngawi tidak menghitung telat Pusat; tertinggi = Sabtu (2)', bn.telat7.length === 7 && bn.telat7[6].tanggal === '2026-10-05' && bn.telat7[6].jumlah === 1 && bn.telat7[4].jumlah === 2 && bn.telat7[3].jumlah === 0 && bn.tertinggi.hari_panjang === 'Sabtu' && bn.tertinggi.jumlah === 2 && bSemua.telat7[3].jumlah === 1);
  ujiBebas('telat 7 hari: tanpa telat sama sekali = tertinggi kosong', hitungBerandaHariIni(masB({ absensi: [] })).tertinggi === null);
  ujiBebas('hak beranda: admin selalu cabangnya sendiri (cabang dari client diabaikan); owner boleh memilih cabang atau semua', cabangUntukBeranda({ role: 'ADMIN', cabang: 'Ngawi' }, 'Pusat') === 'Ngawi' && cabangUntukBeranda({ role: 'OWNER', cabang: '' }, 'Pusat') === 'Pusat' && cabangUntukBeranda({ role: 'OWNER', cabang: '' }, undefined) === '');

  ujiBebas('alasan edit pengajuan: wajib minimal 5 karakter setelah spasi dipotong (kosong, 4 huruf, spasi saja ditolak; 5 huruf diterima); maksimal 100; tanda | diganti spasi', ['', '   ', 'abcd', '  ab  ', undefined, null].every(function (x) { return validasiAlasanEdit(x).ok === false; }) && validasiAlasanEdit('  salah ketik jam  ').ok === true && validasiAlasanEdit('  salah ketik jam  ').alasan === 'salah ketik jam' && validasiAlasanEdit('x'.repeat(101)).ok === false && validasiAlasanEdit('x'.repeat(100)).ok === true && validasiAlasanEdit('salah|jam').alasan === 'salah jam');

  // ---- Paket kelompok 4: baris Admin hanya-baca dan info "ID otomatis" di karyawan_daftar ----
  const akunAdm = [
    { id: 'K001', nama: 'Budi', panggilan: 'Budi', cabang: 'Ngawi', role: 'KARYAWAN', shift: 1, aktif: true, pw_hash: 'x', pin_hash: 'y' },
    { id: 'K003', nama: 'Tono', panggilan: 'Tono', cabang: 'Ngawi', role: 'KARYAWAN', shift: 1, aktif: false },
    { id: 'A01', nama: 'Dewi', panggilan: 'Dewi', cabang: 'Ngawi', role: 'ADMIN', shift: 1, aktif: true, pw_hash: 'rahasia', pin_hash: 'rahasia2', data_wajah: 'w' },
    { id: 'A02', nama: 'Sari', panggilan: 'Sari', cabang: 'Pusat', role: 'ADMIN', shift: 2, aktif: true },
    { id: 'A03', nama: 'Amir', panggilan: 'Amir', cabang: 'Ngawi', role: 'ADMIN', shift: 2, aktif: false },
    { id: 'OWN01', nama: 'owner', panggilan: '', cabang: '', role: 'OWNER', shift: '', aktif: true },
    { id: 'HPT-NGW-01', nama: 'HP toko', panggilan: '', cabang: 'Ngawi', role: 'PERANGKAT', shift: '', aktif: true }
  ];
  const admNgw = daftarAdminCabang(akunAdm, 'Ngawi');
  ujiBebas('karyawan_daftar: baris Admin hanya akun role ADMIN di cabang itu (Dewi dan Amir nonaktif; bukan Sari cabang lain, bukan karyawan, owner, atau HP toko), urut abjad', admNgw.length === 2 && admNgw[0].nama === 'Amir' && admNgw[1].nama === 'Dewi' && admNgw[0].aktif === false && admNgw[1].aktif === true);
  ujiBebas('baris Admin hanya membawa id, nama, panggilan, shift, aktif (tanpa hash PIN/kata sandi atau data wajah)', Object.keys(admNgw[1]).sort().join(',') === 'aktif,id,nama,panggilan,shift' && JSON.stringify(admNgw).indexOf('rahasia') === -1);
  ujiBebas('daftar karyawan (yang bisa diubah) TETAP tidak memuat ADMIN: saringDaftarKaryawan aktif = hanya Budi, nonaktif = hanya Tono', saringDaftarKaryawan(akunAdm, 'Ngawi', 'AKTIF').map(function (x) { return x.id; }).join() === 'K001' && saringDaftarKaryawan(akunAdm, 'Ngawi', 'NONAKTIF').map(function (x) { return x.id; }).join() === 'K003');
  ujiBebas('ID berikutnya = nomor K terbesar di SEMUA akun (nonaktif ikut) + 1, ID admin/owner/HP toko tidak mengganggu; belum ada karyawan = K001', buatIdKaryawan(akunAdm.map(function (x) { return x.id; })) === 'K004' && buatIdKaryawan([]) === 'K001');

  // ---- FITUR A: izin dan cuti, kalender libur, kartu "Hari ini tidak masuk" ----
  const hariIniA = '2026-10-07'; // Rabu; 5 Okt = Senin, 11 Okt = Minggu
  const akunA = { id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', cabang: 'Ngawi', role: 'KARYAWAN', aktif: true, shift: 1, pola_shift: 'TETAP', urutan_shift: '', ganti_setiap: '', mulai_pola: '' };
  ujiBebas('izin: tanggal harus benar-benar ada di kalender (30 Feb, teks, kosong ditolak)', tanggalIzinSah('2026-10-07') && !tanggalIzinSah('2026-02-30') && !tanggalIzinSah('besok') && !tanggalIzinSah('') && !tanggalIzinSah(undefined));
  ujiBebas('izin: tanggal lewat maksimal H+2 (5 Okt dari 7 Okt diterima dan ditandai telat_aju; 4 Okt ditolak); tanggal depan tidak telat', validasiTanggalIzin('2026-10-05', '2026-10-05', hariIniA, 2).ok === true && validasiTanggalIzin('2026-10-05', '2026-10-05', hariIniA, 2).telat_aju === true && validasiTanggalIzin('2026-10-04', '2026-10-05', hariIniA, 2).ok === false && validasiTanggalIzin('2026-10-09', '2026-10-10', hariIniA, 2).telat_aju === false && validasiTanggalIzin('2026-10-06', '2026-10-06', hariIniA, 0).ok === false);
  ujiBebas('izin: selesai sebelum mulai ditolak; satu pengajuan maksimal 31 hari; lebih dari 1 tahun ke depan ditolak', validasiTanggalIzin('2026-10-09', '2026-10-08', hariIniA, 2).ok === false && validasiTanggalIzin('2026-10-08', '2026-11-07', hariIniA, 2).ok === true && validasiTanggalIzin('2026-10-08', '2026-11-08', hariIniA, 2).ok === false && validasiTanggalIzin('2028-01-01', '2028-01-02', hariIniA, 2).ok === false);
  const hMingguLibur = hariTerjadwalRentang(akunA, '2026-10-05', '2026-10-11', [], true), hMingguBuka = hariTerjadwalRentang(akunA, '2026-10-05', '2026-10-11', [], false);
  ujiBebas('hari = hari TERJADWAL kerja: Senin-Minggu dengan libur Minggu = 6 hari; tanpa libur Minggu = 7', hMingguLibur.length === 6 && hMingguLibur.indexOf('2026-10-11') < 0 && hMingguBuka.length === 7);
  const merah = [{ tanggal: '2026-10-07', cabang: '', karyawan: '', isi: 'LIBUR TANGGAL MERAH' }, { tanggal: '2026-10-08', cabang: 'Ngawi', karyawan: 'K001', isi: 'LIBUR KHUSUS: urusan' }, { tanggal: '2026-10-09', cabang: 'Pusat', karyawan: '', isi: 'LIBUR KHUSUS' }];
  const hKal = hariTerjadwalRentang(akunA, '2026-10-05', '2026-10-11', merah, true);
  ujiBebas('hari terjadwal: tanggal merah umum dan libur khusus milik karyawan tidak dihitung; libur cabang lain tidak berlaku', hKal.length === 4 && hKal.indexOf('2026-10-07') < 0 && hKal.indexOf('2026-10-08') < 0 && hKal.indexOf('2026-10-09') >= 0);
  ujiBebas('kalender "MASUK: ..." (Minggu masuk, mis. stok opname) mengalahkan libur Minggu walau keterangan memuat angka', hariTerjadwalRentang(akunA, '2026-10-11', '2026-10-11', [{ tanggal: '2026-10-11', cabang: 'Ngawi', karyawan: '', isi: 'MASUK: stok opname 2' }], true).length === 1 && jadwalKaryawanHari(akunA, '2026-10-11', [{ tanggal: '2026-10-11', cabang: 'Ngawi', karyawan: '', isi: 'MASUK: stok opname 2' }], true).shift === 1);
  const izinA = [
    { karyawan: 'K001', jenis: 'Cuti', kelompok: 'cuti', mulai: '2026-03-02', selesai: '2026-03-03', hari: 2, status: 'DITERIMA', grup: 'IZN-2026-0001', id: 'IZN-2026-0001-A' },
    { karyawan: 'K001', jenis: 'Cuti', kelompok: 'cuti', mulai: '2026-05-04', selesai: '2026-05-04', hari: 1, status: 'MENUNGGU', grup: 'IZN-2026-0002', id: 'IZN-2026-0002-A' },
    { karyawan: 'K001', jenis: 'Cuti', kelompok: 'cuti', mulai: '2026-06-01', selesai: '2026-06-03', hari: 3, status: 'DITOLAK', grup: 'IZN-2026-0003', id: 'IZN-2026-0003-A' },
    { karyawan: 'K001', jenis: 'Cuti', kelompok: 'cuti', mulai: '2025-12-01', selesai: '2025-12-02', hari: 2, status: 'DITERIMA', grup: 'IZN-2025-0009', id: 'IZN-2025-0009-A' },
    { karyawan: 'K002', jenis: 'Cuti', kelompok: 'cuti', mulai: '2026-04-01', selesai: '2026-04-02', hari: 2, status: 'DITERIMA', grup: 'IZN-2026-0004', id: 'IZN-2026-0004-A' },
    { karyawan: 'K001', jenis: 'Sakit', kelompok: 'biasa', mulai: '2026-10-12', selesai: '2026-10-13', hari: 2, status: 'MENUNGGU', grup: 'IZN-2026-0005', id: 'IZN-2026-0005-A', lampiran: '' }
  ];
  ujiBebas('sisa cuti = jatah 6 dikurangi cuti DITERIMA/MENUNGGU tahun itu saja (ditolak, tahun lain, orang lain tidak dihitung) = 3; jatah tidak bisa negatif', hitungSisaCuti(6, izinA, 'K001', '2026') === 3 && hitungSisaCuti(2, izinA, 'K001', '2026') === 0 && hitungSisaCuti(6, izinA, 'K002', '2026') === 4);
  ujiBebas('izin bertumpuk: pengajuan yang tumpang tindih dengan izin MENUNGGU/DITERIMA ditolak; yang ditolak/dibatalkan/tukar shift tidak menghalangi; orang lain tidak', tumpangTindihIzin(izinA, 'K001', '2026-10-13', '2026-10-14') !== null && tumpangTindihIzin(izinA, 'K001', '2026-10-14', '2026-10-15') === null && tumpangTindihIzin(izinA, 'K001', '2026-06-02', '2026-06-02') === null && tumpangTindihIzin(izinA, 'K002', '2026-10-12', '2026-10-13') === null && tumpangTindihIzin(izinA.concat([{ karyawan: 'K001', jenis: 'TUKAR_SHIFT', mulai: '2026-10-20', selesai: '2026-10-20', status: 'MENUNGGU' }]), 'K001', '2026-10-20', '2026-10-20') === null);
  ujiBebas('id grup: IZN-{tahun}-{4 angka} berikutnya per tahun, tidak pernah dipakai ulang; huruf baris A, B', buatGrupIzin(['IZN-2026-0003-A', 'IZN-2025-0009', 'IZN-2026-0002'], '2026') === 'IZN-2026-0004' && buatGrupIzin([], '2026') === 'IZN-2026-0001' && buatGrupIzin(['IZN-2025-0009'], '2026') === 'IZN-2026-0001' && hurufIzin(0) === 'A' && hurufIzin(1) === 'B');
  const harian5 = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];
  const jMenikah = { nama: 'Menikah', kelompok: 'khusus', maks: 3 }, jCuti = { nama: 'Cuti', kelompok: 'cuti', maks: 0 }, jSakit = { nama: 'Sakit', kelompok: 'biasa', maks: 0 }, jMeninggal = { nama: 'Keluarga meninggal', kelompok: 'khusus', maks: 2 };
  const dasarR = { namaBiasa: 'Keperluan pribadi', namaCuti: 'Cuti' };
  const rMenikahCuti = rencanaIzin(Object.assign({ jenis: jMenikah, hari: harian5, sisaCuti: 4, lebih: 'CUTI' }, dasarR));
  ujiBebas('Menikah 5 hari kerja (batas 3), kelebihan dari Cuti: 3 hari izin khusus + 2 hari cuti, sisa cuti jadi 2 (mockup 41)', rMenikahCuti.ok && rMenikahCuti.segmen.length === 2 && rMenikahCuti.segmen[0].kelompok === 'khusus' && rMenikahCuti.segmen[0].hari.length === 3 && rMenikahCuti.segmen[0].selesai === '2026-10-14' && rMenikahCuti.segmen[1].kelompok === 'cuti' && rMenikahCuti.segmen[1].hari.length === 2 && rMenikahCuti.segmen[1].mulai === '2026-10-15' && rMenikahCuti.sisa_setelah === 2);
  const rMenikahBiasa = rencanaIzin(Object.assign({ jenis: jMenikah, hari: harian5, sisaCuti: 4, lebih: 'BIASA' }, dasarR));
  ujiBebas('Menikah 5 hari, kelebihan diambil dari Izin biasa: segmen kedua kelompok biasa (Keperluan pribadi), sisa cuti tidak berubah', rMenikahBiasa.ok && rMenikahBiasa.segmen[1].kelompok === 'biasa' && rMenikahBiasa.segmen[1].jenis === 'Keperluan pribadi' && rMenikahBiasa.sisa_setelah === 4);
  ujiBebas('kelebihan hari tanpa pilihan: saat mengajukan (ketat) diminta memilih; di pratinjau otomatis Cuti kalau cukup, Izin biasa kalau tidak', rencanaIzin(Object.assign({ jenis: jMenikah, hari: harian5, sisaCuti: 4, ketatLebih: true }, dasarR)).butuh_pilihan === true && rencanaIzin(Object.assign({ jenis: jMenikah, hari: harian5, sisaCuti: 4 }, dasarR)).lebih === 'CUTI' && rencanaIzin(Object.assign({ jenis: jMenikah, hari: harian5, sisaCuti: 1 }, dasarR)).lebih === 'BIASA');
  ujiBebas('kelebihan dari Cuti ditolak bila sisa cuti kurang, dengan pesan Indonesia yang jelas', (function () { const r = rencanaIzin(Object.assign({ jenis: jMenikah, hari: harian5, sisaCuti: 1, lebih: 'CUTI' }, dasarR)); return r.ok === false && /Sisa cuti Anda 1 hari/.test(r.pesan); })());
  ujiBebas('Cuti: melebihi sisa ditolak; pas dengan sisa diterima dan sisa jadi 0', rencanaIzin(Object.assign({ jenis: jCuti, hari: harian5, sisaCuti: 4 }, dasarR)).ok === false && rencanaIzin(Object.assign({ jenis: jCuti, hari: harian5, sisaCuti: 5 }, dasarR)).ok === true && rencanaIzin(Object.assign({ jenis: jCuti, hari: harian5, sisaCuti: 5 }, dasarR)).sisa_setelah === 0);
  ujiBebas('izin khusus dalam batas (Keluarga meninggal 2 hari dari maks 2) = satu segmen khusus tanpa pilihan; Sakit = satu segmen biasa; tanpa hari terjadwal ditolak', rencanaIzin(Object.assign({ jenis: jMeninggal, hari: harian5.slice(0, 2), sisaCuti: 0 }, dasarR)).segmen.length === 1 && rencanaIzin(Object.assign({ jenis: jMeninggal, hari: harian5.slice(0, 2), sisaCuti: 0 }, dasarR)).segmen[0].kelompok === 'khusus' && rencanaIzin(Object.assign({ jenis: jSakit, hari: harian5.slice(0, 2), sisaCuti: 0 }, dasarR)).segmen[0].kelompok === 'biasa' && rencanaIzin(Object.assign({ jenis: jSakit, hari: [], sisaCuti: 0 }, dasarR)).ok === false);
  const barisA = susunBarisIzin(rMenikahCuti.segmen, { grup: 'IZN-2026-0007', karyawan: 'K001', ket: 'Pernikahan', waktu: '2026-10-07 08:00', telat: false });
  ujiBebas('baris sheet izin: id IZN-2026-0007-A/-B, grup sama, hari = jumlah hari terjadwal, status MENUNGGU, oleh/diputus kosong, kolom tukar shift kosong', barisA.length === 2 && barisA[0].id === 'IZN-2026-0007-A' && barisA[1].id === 'IZN-2026-0007-B' && barisA[0].grup === 'IZN-2026-0007' && barisA[0].hari === 3 && barisA[1].hari === 2 && barisA[0].status === 'MENUNGGU' && barisA[0].oleh === '' && barisA[0].rekan === '' && barisA[1].jenis === 'Cuti' && barisA[0].telat_aju === false);
  ujiBebas('keterangan izin dibersihkan: spasi dirapikan, karakter kontrol dan tanda | dibuang, maksimal 200 karakter', bersihkanKetIzin('  Demam \n tinggi | rawat ') === 'Demam tinggi rawat' && bersihkanKetIzin('x'.repeat(250)).length === 200 && bersihkanKetIzin(null) === '');
  const petaA = { K001: { nama: 'Budi Santoso', cabang: 'Ngawi', role: 'KARYAWAN' }, K009: { nama: 'Dewi Lestari', cabang: 'Ngawi', role: 'ADMIN' }, K010: { nama: 'Sari Utami', cabang: 'Pusat', role: 'ADMIN' }, K002: { nama: 'Rina Wati', cabang: 'Ngawi', role: 'KARYAWAN' }, K003: { nama: 'Andi', cabang: 'Pusat', role: 'KARYAWAN' } };
  const izinKonf = barisA.map(function (b) { return Object.assign({}, b, { mulai: String(b.mulai), selesai: String(b.selesai) }); }).concat([
    { id: 'IZN-2026-0008-A', grup: 'IZN-2026-0008', karyawan: 'K002', jenis: 'Sakit', kelompok: 'khusus', mulai: '2026-09-29', selesai: '2026-09-30', hari: 2, ket: 'Demam', lampiran: 'https://drive.google.com/file/d/abcdefghij1234/view', status: 'MENUNGGU', telat_aju: false },
    { id: 'IZN-2026-0009-A', grup: 'IZN-2026-0009', karyawan: 'K009', jenis: 'Keperluan pribadi', kelompok: 'biasa', mulai: '2026-10-02', selesai: '2026-10-02', hari: 1, ket: '', lampiran: '', status: 'MENUNGGU', telat_aju: true },
    { id: 'IZN-2026-0010-A', grup: 'IZN-2026-0010', karyawan: 'K003', jenis: 'Keperluan pribadi', kelompok: 'biasa', mulai: '2026-10-02', selesai: '2026-10-02', hari: 1, ket: '', lampiran: '', status: 'DITERIMA' },
    { id: 'IZN-2026-0011-A', grup: 'IZN-2026-0011', karyawan: 'K002', jenis: 'TUKAR_SHIFT', kelompok: '', mulai: '2026-10-08', selesai: '2026-10-08', hari: 1, status: 'MENUNGGU' }
  ]);
  const itemIzin = rakitItemIzin(izinKonf, petaA);
  ujiBebas('item Konfirmasi izin: satu item per GRUP yang masih menunggu (yang sudah diputuskan dan tukar shift tidak ikut); id "IZIN|grup"', itemIzin.length === 3 && itemIzin.map(function (x) { return x.id; }).join() === 'IZIN|IZN-2026-0007,IZIN|IZN-2026-0008,IZIN|IZN-2026-0009' && itemIzin.every(function (x) { return x.kelompok === 'IZIN'; }));
  const iMenikah = itemIzin[0], iSakit = itemIzin[1], iAdmin = itemIzin[2];
  ujiBebas('kartu izin: judul "Izin sakit dengan surat" dan rincian "29–30 Sep, 2 hari kerja, lampiran ada"; Menikah+Cuti satu kartu berisi dua bagian; izin admin berperan ADMIN', iSakit.judul === 'Izin sakit dengan surat' && iSakit.rincian === '29–30 Sep, 2 hari kerja, lampiran ada' && iSakit.surat === true && iSakit.sakit === true && /3 hari izin khusus menikah \(12–14 Okt\), 2 hari cuti \(15–16 Okt\)/.test(iMenikah.rincian) && iAdmin.role === 'ADMIN' && iAdmin.judul === 'Izin · keperluan pribadi');
  const adminNgawiA = { role: 'ADMIN', id: 'K009', cabang: 'Ngawi' }, ownerA = { role: 'OWNER', id: 'OWN01', cabang: '' };
  ujiBebas('hak izin di server: admin Ngawi hanya melihat izin KARYAWAN Ngawi (bukan miliknya sendiri = K009); owner hanya izin ADMIN (semua cabang)', saringItemKonfirmasi(itemIzin, adminNgawiA, '').map(function (x) { return x.karyawan; }).sort().join() === 'K001,K002' && saringItemKonfirmasi(itemIzin, ownerA, '').map(function (x) { return x.karyawan; }).join() === 'K009' && saringItemKonfirmasi(itemIzin, { role: 'ADMIN', id: 'K011', cabang: 'Pusat' }, '').length === 0);
  ujiBebas('izin: id item izin dikenali hanya bentuk IZIN|IZN-tahun-4 angka; id absen biasa dan teks aneh ditolak', parseIdItemIzin('IZIN|IZN-2026-0007') === 'IZN-2026-0007' && parseIdItemIzin('IZIN|IZN-2026-0007-A') === 'IZN-2026-0007-A' && parseIdItemIzin('K001|2026-10-05|MASUK') === null && parseIdItemIzin('IZIN|../x') === null && parseIdItemIzin(undefined) === null);
  ujiBebas('kartu beranda pribadi: jumlah pengajuan menunggu dihitung per grup milik sendiri', jumlahPengajuanMenunggu(izinKonf, 'K001') === 1 && jumlahPengajuanMenunggu(izinKonf, 'K002') === 2 && jumlahPengajuanMenunggu(izinKonf, 'K003') === 0);
  const barisSakit = { id: 'IZN-2026-0008-A', jenis: 'Sakit', karyawan: 'K002', status: 'MENUNGGU', oleh: '' };
  ujiBebas('surat dokter: pemilik boleh selama MENUNGGU; setelah diputuskan tidak; jenis selain Sakit tidak; admin hanya untuk izin yang ia input sendiri di cabangnya', bolehLampirSurat({ role: 'KARYAWAN', id: 'K002', cabang: 'Ngawi' }, barisSakit, { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh === true && bolehLampirSurat({ role: 'KARYAWAN', id: 'K002', cabang: 'Ngawi' }, Object.assign({}, barisSakit, { status: 'DITERIMA' }), { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh === false && bolehLampirSurat({ role: 'KARYAWAN', id: 'K002', cabang: 'Ngawi' }, Object.assign({}, barisSakit, { jenis: 'Cuti' }), { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh === false && bolehLampirSurat({ role: 'ADMIN', id: 'K009', cabang: 'Ngawi' }, Object.assign({}, barisSakit, { status: 'DITERIMA', oleh: 'K009' }), { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh === true && bolehLampirSurat({ role: 'ADMIN', id: 'K009', cabang: 'Ngawi' }, Object.assign({}, barisSakit, { status: 'DITERIMA', oleh: 'K088' }), { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh === false && bolehLampirSurat({ role: 'KARYAWAN', id: 'K003', cabang: 'Ngawi' }, barisSakit, { role: 'KARYAWAN', cabang: 'Ngawi' }).boleh === false);
  const jSurat = jalurSuratIzin({ id: 'IZN-2026-0008-A', mulai: '2026-09-29' }, { id: 'K002', nama: 'Rina Wati', cabang: 'Ngawi' }, '2026-09-30');
  ujiBebas('surat dokter: folder SURAT IZIN/Cabang/Tahun/Bulan/ID_Nama dan berkas DDMMYY_IZIN_<id izin>.jpg', JSON.stringify(jSurat.segmen) === JSON.stringify(['SURAT IZIN', 'Ngawi', '2026', '09', 'K002_Rina Wati']) && jSurat.namaBerkas === '300926_IZIN_IZN-2026-0008-A.jpg' && jalurSuratIzin({ id: 'x', mulai: 'rusak' }, { id: 'K1', nama: 'A', cabang: 'B' }, '2026-09-30') === null);
  ujiBebas('kalender: isi sel dibaca dan disusun bolak-balik (LIBUR TANGGAL MERAH, LIBUR KHUSUS: ket, MASUK: ket, kosong)', uraiIsiKalender('LIBUR KHUSUS: renovasi toko').tipe === 'KHUSUS' && uraiIsiKalender('LIBUR KHUSUS: renovasi toko').ket === 'renovasi toko' && uraiIsiKalender('LIBUR TANGGAL MERAH').tipe === 'MERAH' && uraiIsiKalender('MASUK: stok opname').ket === 'stok opname' && uraiIsiKalender('1').tipe === '' && susunIsiKalender('KHUSUS', 'renovasi toko') === 'LIBUR KHUSUS: renovasi toko' && susunIsiKalender('MERAH', '') === 'LIBUR TANGGAL MERAH' && susunIsiKalender('HAPUS', 'x') === '' && uraiIsiKalender(susunIsiKalender('MASUK', 'stok opname')).tipe === 'MASUK');
  ujiBebas('kalender: perubahan hanya hari ini dan seterusnya; "masuk" hanya untuk hari Minggu; jenis ngawur ditolak', validasiPerubahanKalender('2026-10-06', 'MERAH', hariIniA).ok === false && validasiPerubahanKalender('2026-10-07', 'MERAH', hariIniA).ok === true && validasiPerubahanKalender('2026-10-12', 'MASUK', hariIniA).ok === false && validasiPerubahanKalender('2026-10-11', 'MASUK', hariIniA).ok === true && validasiPerubahanKalender('2026-10-11', 'APA', hariIniA).ok === false && validasiPerubahanKalender('2026-02-31', 'MERAH', hariIniA).ok === false);
  const akunB = Object.assign({}, akunA, { id: 'K002', nama: 'Rina Wati', panggilan: 'Rina' }), akunC = Object.assign({}, akunA, { id: 'K003', nama: 'Ari Pratama', panggilan: 'Ari' });
  const tidakMasuk = daftarTidakMasuk({ tanggal: hariIniA, cabang: 'Ngawi', akun: [akunA, akunB, akunC, Object.assign({}, akunA, { id: 'K004', panggilan: 'Zed', aktif: false }), Object.assign({}, akunA, { id: 'K005', panggilan: 'Pusat', cabang: 'Pusat' })], liburMinggu: true,
    kalender: [{ tanggal: hariIniA, cabang: 'Ngawi', karyawan: 'K003', isi: 'LIBUR KHUSUS' }], izin: [{ karyawan: 'K002', jenis: 'Sakit', mulai: '2026-10-06', selesai: '2026-10-08', status: 'DITERIMA' }, { karyawan: 'K001', jenis: 'Cuti', mulai: '2026-10-07', selesai: '2026-10-07', status: 'DITOLAK' }, { karyawan: 'K001', jenis: 'TUKAR_SHIFT', mulai: '2026-10-07', selesai: '2026-10-07', status: 'MENUNGGU' }] });
  ujiBebas('kartu "Hari ini tidak masuk": nama panggilan karyawan yang izin/cuti (MENUNGGU/DITERIMA) atau libur sendiri, urut abjad; ditolak, tukar shift, nonaktif, cabang lain tidak', tidakMasuk.join() === 'Ari,Rina');
  ujiBebas('kartu "Hari ini tidak masuk": libur seluruh toko (Minggu / tanggal merah umum) tidak membuat semua karyawan terdaftar', daftarTidakMasuk({ tanggal: '2026-10-11', cabang: 'Ngawi', akun: [akunA, akunB], liburMinggu: true, kalender: [], izin: [] }).length === 0 && daftarTidakMasuk({ tanggal: hariIniA, cabang: 'Ngawi', akun: [akunA], liburMinggu: false, kalender: [{ tanggal: hariIniA, cabang: '', karyawan: '', isi: 'LIBUR TANGGAL MERAH' }], izin: [] }).length === 0);
  ujiBebas('judul dan rentang tanggal: "29 Sep", "29–30 Sep", "30 Sep–2 Okt"', rentangPendek('2026-09-29', '2026-09-29') === '29 Sep' && rentangPendek('2026-09-29', '2026-09-30') === '29–30 Sep' && rentangPendek('2026-09-30', '2026-10-02') === '30 Sep–2 Okt' && judulIzinKonfirmasi({ jenis: 'Cuti', kelompok: 'cuti' }) === 'Cuti' && judulIzinKonfirmasi({ jenis: 'Sakit', kelompok: 'biasa', lampiran: '' }) === 'Izin sakit');
  // ---- akhir FITUR A ----
  // ---- FITUR B: jadwal dan shift, pola shift, tukar shift ----
  (function () {
  const akB = { id: 'K003', nama: 'Budi Santoso', panggilan: 'Budi', cabang: 'Ngawi', role: 'KARYAWAN', aktif: true, shift: 1, pola_shift: 'TETAP', urutan_shift: '', ganti_setiap: '', mulai_pola: '' };
  const akD = Object.assign({}, akB, { id: 'K004', nama: 'Dina Marlina', panggilan: 'Dina', shift: 2 }), akR = Object.assign({}, akB, { id: 'K005', nama: 'Ari Pratama', panggilan: 'Ari', shift: 1 });
  ujiBebas('minggu dimulai Senin: Rabu 7 Okt, Senin 5 Okt, dan Minggu 11 Okt semuanya menghasilkan Senin 5 Okt', seninDariTanggal('2026-10-07') === '2026-10-05' && seninDariTanggal('2026-10-05') === '2026-10-05' && seninDariTanggal('2026-10-11') === '2026-10-05' && seninDariTanggal('2026-10-12') === '2026-10-12');
  ujiBebas('nilai sel jadwal sah: kosong, L, nomor shift yang ada; shift yang tidak ada di cabang / teks ngawur ditolak', nilaiJadwalSah('', [1, 2]) && nilaiJadwalSah('l', [1, 2]) && nilaiJadwalSah('2', [1, 2]) && !nilaiJadwalSah('3', [1, 2]) && !nilaiJadwalSah('x', [1, 2]) && !nilaiJadwalSah('1; drop', [1, 2]));
  const kalMing = [{ tanggal: '2026-10-07', cabang: 'Ngawi', karyawan: 'K003', isi: '2' }, { tanggal: '2026-10-08', cabang: '', karyawan: '', isi: 'LIBUR TANGGAL MERAH' }, { tanggal: '2026-10-09', cabang: 'Ngawi', karyawan: 'K003', isi: 'LIBUR' }];
  const mg = jadwalMingguan([akB, akD], '2026-10-05', kalMing, true);
  ujiBebas('jadwal mingguan: 6 sel (Senin-Sabtu) per karyawan; perubahan manual ditandai m dan menang atas pola; tanggal merah umum = libur', mg.length === 2 && mg[0].sel.length === 6 && mg[0].sel[2].s === 2 && mg[0].sel[2].m === true && mg[0].sel[0].s === 1 && mg[0].sel[0].m === false && mg[0].sel[3].l === true && mg[0].sel[3].s === null && mg[0].sel[4].l === true && mg[0].sel[4].m === true && mg[1].sel[2].s === 2 && mg[1].sel[2].m === false);
  ujiBebas('tulis kalender: nilai sama dengan jadwal sekarang = tidak ada tulisan; beda dari pola = TULIS nomor atau LIBUR', rencanaTulisKalender(akB, '2026-10-12', '1', [], true).aksi === 'TETAP' && rencanaTulisKalender(akB, '2026-10-12', '2', [], true).aksi === 'TULIS' && rencanaTulisKalender(akB, '2026-10-12', '2', [], true).isi === '2' && rencanaTulisKalender(akB, '2026-10-12', 'L', [], true).isi === 'LIBUR');
  ujiBebas('tulis kalender: mengembalikan ke pola menghapus (mengosongkan) isi milik karyawan; nilai kosong tanpa perubahan manual = tidak ada tulisan', rencanaTulisKalender(akB, '2026-10-07', '1', kalMing, true).aksi === 'HAPUS' && rencanaTulisKalender(akB, '2026-10-07', '', kalMing, true).aksi === 'HAPUS' && rencanaTulisKalender(akB, '2026-10-12', '', [], true).aksi === 'TETAP');
  ujiBebas('tulis kalender: karyawan yang dipaksa masuk pada tanggal merah umum ditulis sebagai perubahan manual; libur milik karyawan lain tidak mengganggu', rencanaTulisKalender(akB, '2026-10-08', '1', kalMing, true).aksi === 'TULIS' && rencanaTulisKalender(akB, '2026-10-12', '1', [{ tanggal: '2026-10-12', cabang: 'Ngawi', karyawan: 'K999', isi: 'LIBUR' }], true).aksi === 'TETAP');
  const ctxJ = { hariIni: '2026-10-07', cabang: 'Ngawi', aktorId: 'K009', noValid: [1, 2], akunPeta: { K003: { role: 'KARYAWAN', cabang: 'Ngawi', aktif: true }, K009: { role: 'ADMIN', cabang: 'Ngawi', aktif: true }, K020: { role: 'KARYAWAN', cabang: 'Pusat', aktif: true }, K021: { role: 'KARYAWAN', cabang: 'Ngawi', aktif: false } } };
  ujiBebas('hak jadwal di server: hanya karyawan cabang sendiri, aktif, bukan diri sendiri, hari ini dan seterusnya, shift yang ada', validasiPerubahanJadwal([{ karyawan: 'K003', tanggal: '2026-10-07', nilai: 'l' }], ctxJ).ok === true && validasiPerubahanJadwal([{ karyawan: 'K003', tanggal: '2026-10-07', nilai: 'l' }], ctxJ).daftar[0].nilai === 'L' && !validasiPerubahanJadwal([{ karyawan: 'K003', tanggal: '2026-10-06', nilai: '1' }], ctxJ).ok && !validasiPerubahanJadwal([{ karyawan: 'K020', tanggal: '2026-10-09', nilai: '1' }], ctxJ).ok && !validasiPerubahanJadwal([{ karyawan: 'K009', tanggal: '2026-10-09', nilai: '1' }], ctxJ).ok && !validasiPerubahanJadwal([{ karyawan: 'K021', tanggal: '2026-10-09', nilai: '1' }], ctxJ).ok && !validasiPerubahanJadwal([{ karyawan: 'K003', tanggal: '2026-10-09', nilai: '3' }], ctxJ).ok && !validasiPerubahanJadwal([], ctxJ).ok && !validasiPerubahanJadwal([{ karyawan: 'K999', tanggal: '2026-10-09', nilai: '1' }], ctxJ).ok && !validasiPerubahanJadwal([{ karyawan: 'K003', tanggal: '2026/10/09', nilai: '1' }], ctxJ).ok);
  const besar = []; for (let i = 0; i < 301; i++) { besar.push({ karyawan: 'K003', tanggal: '2026-10-09', nilai: '1' }); }
  ujiBebas('perubahan jadwal sekaligus dibatasi 300', !validasiPerubahanJadwal(besar, ctxJ).ok);
  const kalSalin = [{ tanggal: '2026-09-30', cabang: 'Ngawi', karyawan: 'K003', isi: '2' }, { tanggal: '2026-10-01', cabang: '', karyawan: '', isi: 'LIBUR TANGGAL MERAH' }, { tanggal: '2026-10-02', cabang: 'Ngawi', karyawan: 'K003', isi: 'LIBUR' }];
  const sl = rencanaSalinMinggu([akB], '2026-10-05', '2026-10-07', kalSalin, true);
  ujiBebas('salin minggu lalu: hanya hari ini dan seterusnya; perubahan manual minggu lalu ikut; tanggal merah umum minggu lalu (Kamis) tidak disalin ke Kamis 8 Okt', sl.length === 3 && sl.map(function (x) { return x.tanggal; }).join() === '2026-10-07,2026-10-09,2026-10-10' && sl[0].nilai === '2');
  ujiBebas('salin minggu lalu: libur individu minggu lalu ikut sebagai L; sel minggu lalu tanpa perubahan menyalin shift pola', sl[1].nilai === 'L' && sl[2].nilai === '1');
  ujiBebas('salin minggu lalu: tanggal merah umum di minggu tujuan juga dilewati', rencanaSalinMinggu([akB], '2026-10-05', '2026-10-05', [{ tanggal: '2026-10-06', cabang: '', karyawan: '', isi: 'LIBUR TANGGAL MERAH' }], true).every(function (x) { return x.tanggal !== '2026-10-06'; }));
  const tk = rencanaTukarHari(akD, akR, '2026-10-12', [], true, '2026-10-07');
  ujiBebas('tukar shift satu hari (admin): Dina (Shift 2) dan Ari (Shift 1) saling bertukar: Dina jadi Shift 1, Ari jadi Shift 2', tk.ok && tk.a_ke === 1 && tk.b_ke === 2 && tk.a_dari === 2 && tk.b_dari === 1);
  ujiBebas('tukar shift satu hari: ditolak bila tanggal lewat, orang sama, shift sama, atau salah satu libur', !rencanaTukarHari(akD, akR, '2026-10-06', [], true, '2026-10-07').ok && !rencanaTukarHari(akD, akD, '2026-10-12', [], true, '2026-10-07').ok && !rencanaTukarHari(akB, akR, '2026-10-12', [], true, '2026-10-07').ok && !rencanaTukarHari(akD, akR, '2026-10-11', [], true, '2026-10-07').ok && !rencanaTukarHari(akD, akR, '2026-10-12', [{ tanggal: '2026-10-12', cabang: 'Ngawi', karyawan: 'K005', isi: 'LIBUR' }], true, '2026-10-07').ok);
  ujiBebas('pola shift: TETAP hanya mengubah pola_shift; BERGILIR 1,2 ganti 1M mulai 5 Okt diterima dan dinormalkan', validasiPolaShift({ pola_shift: 'tetap' }, [1, 2]).ok && JSON.stringify(validasiPolaShift({ pola_shift: 'TETAP' }, [1, 2]).nilai) === '{"pola_shift":"TETAP"}' && validasiPolaShift({ pola_shift: 'BERGILIR', urutan: [1, 2], ganti_setiap: '1m', mulai_pola: '2026-10-05' }, [1, 2]).nilai.urutan_shift === '1,2' && validasiPolaShift({ pola_shift: 'BERGILIR', urutan: '2,1,2', ganti_setiap: '2M', mulai_pola: '2026-10-05' }, [1, 2]).nilai.ganti_setiap === '2M');
  ujiBebas('pola shift ditolak: urutan 1 shift / semua sama / shift tidak ada / ganti ngawur / tanpa tanggal mulai / pola ngawur', !validasiPolaShift({ pola_shift: 'BERGILIR', urutan: [1], ganti_setiap: '1M', mulai_pola: '2026-10-05' }, [1, 2]).ok && !validasiPolaShift({ pola_shift: 'BERGILIR', urutan: [1, 1], ganti_setiap: '1M', mulai_pola: '2026-10-05' }, [1, 2]).ok && !validasiPolaShift({ pola_shift: 'BERGILIR', urutan: [1, 3], ganti_setiap: '1M', mulai_pola: '2026-10-05' }, [1, 2]).ok && !validasiPolaShift({ pola_shift: 'BERGILIR', urutan: [1, 2], ganti_setiap: '5M', mulai_pola: '2026-10-05' }, [1, 2]).ok && !validasiPolaShift({ pola_shift: 'BERGILIR', urutan: [1, 2], ganti_setiap: '1M', mulai_pola: '' }, [1, 2]).ok && !validasiPolaShift({ pola_shift: 'X' }, [1, 2]).ok);
  const polaB = Object.assign({}, akB, { pola_shift: 'BERGILIR', urutan_shift: '1,2', ganti_setiap: '1M', mulai_pola: '2026-10-05' });
  ujiBebas('pratinjau 4 minggu (mockup 57): 5-10 Okt Shift 1, 12-17 Okt Shift 2, 19-24 Okt Shift 1, 26-31 Okt Shift 2; memakai shiftMenurutPola yang sama dengan jadwal', pratinjauPola(polaB, '2026-10-05', 4).map(function (x) { return x.mulai + '/' + x.selesai + '=' + x.shift; }).join() === '2026-10-05/2026-10-10=1,2026-10-12/2026-10-17=2,2026-10-19/2026-10-24=1,2026-10-26/2026-10-31=2' && pratinjauPola(akB, '2026-10-05', 2).every(function (x) { return x.shift === 1; }));
  const dasarT = { jenis: 'TUKAR_SHIFT', tanggal: '2026-10-12', hariIni: '2026-10-07', detikSekarang: detik('09:00'), pemohon: { id: 'K004', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true }, rekan: { id: 'K005', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true }, jPemohon: { libur: false, shift: 2 }, jRekan: { libur: false, shift: 1 }, masukShift: { '1': '07:45', '2': '12:00' }, izinRows: [] };
  const aju = function (o) { return validasiAjuTukar(Object.assign({}, dasarT, o)); };
  ujiBebas('ajukan tukar: Dina (Shift 2) dengan Ari (Shift 1) pada 12 Okt diterima; shift_asal 2, shift_tujuan 1', aju({}).ok && aju({}).shift_asal === 2 && aju({}).shift_tujuan === 1);
  ujiBebas('ajukan tukar ditolak: tanggal lewat, admin sebagai pemohon, rekan diri sendiri / cabang lain / admin / nonaktif, shift sama, salah satu libur, jenis ngawur', !aju({ tanggal: '2026-10-06' }).ok && !aju({ pemohon: { id: 'K009', role: 'ADMIN', cabang: 'Ngawi', aktif: true } }).ok && !aju({ rekan: { id: 'K004', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true } }).ok && !aju({ rekan: { id: 'K005', role: 'KARYAWAN', cabang: 'Pusat', aktif: true } }).ok && !aju({ rekan: { id: 'K006', role: 'ADMIN', cabang: 'Ngawi', aktif: true } }).ok && !aju({ rekan: { id: 'K005', role: 'KARYAWAN', cabang: 'Ngawi', aktif: false } }).ok && !aju({ jRekan: { libur: false, shift: 2 } }).ok && !aju({ jRekan: { libur: true, shift: null } }).ok && !aju({ jenis: 'LAIN' }).ok);
  ujiBebas('ajukan tukar hari ini: boleh sebelum jam masuk shift paling awal (07:45), ditolak sesudahnya', aju({ tanggal: '2026-10-07', detikSekarang: detik('07:00') }).ok && !aju({ tanggal: '2026-10-07', detikSekarang: detik('07:45') }).ok && !aju({ tanggal: '2026-10-07', detikSekarang: detik('13:00') }).ok);
  const baris1 = { grup: 'IZN-2026-0014', id: 'IZN-2026-0014-A', karyawan: 'K004', rekan: 'K005', jenis: 'TUKAR_SHIFT', mulai: '2026-10-12', selesai: '2026-10-12', hari: 1, status: 'MENUNGGU', status_rekan: 'MENUNGGU', shift_asal: 2, shift_tujuan: 1, ket: 'Antar ibu ke dokter pagi' };
  ujiBebas('ajukan tukar ditolak bila bentrok: tukar lain yang masih berjalan pada tanggal itu untuk salah satu orang (sebagai pemohon atau rekan) atau salah satu sedang izin/cuti; yang sudah ditolak/batal tidak menghalangi', !aju({ izinRows: [baris1] }).ok && !aju({ izinRows: [Object.assign({}, baris1, { karyawan: 'K777', rekan: 'K005' })] }).ok && aju({ izinRows: [Object.assign({}, baris1, { status_rekan: 'TOLAK', status: 'DITOLAK' })] }).ok && aju({ izinRows: [Object.assign({}, baris1, { status_rekan: 'BATAL', status: 'BATAL' })] }).ok && !aju({ izinRows: [{ karyawan: 'K005', jenis: 'Sakit', mulai: '2026-10-12', selesai: '2026-10-13', status: 'DITERIMA' }] }).ok && aju({ izinRows: [Object.assign({}, baris1, { mulai: '2026-10-13' })] }).ok);
  const jamFn = function (r) { return r.shift_asal === 2 ? detik('07:45') : null; };
  ujiBebas('batal otomatis: rekan belum menjawab sampai jam masuk shift yang ditukar (hari H sesudah jam masuk paling awal) atau tanggal sudah lewat; belum waktunya / sudah dijawab / sudah diputuskan tidak dibatalkan', tukarKedaluwarsa([Object.assign({}, baris1, { mulai: '2026-10-07' })], '2026-10-07', detik('07:46'), jamFn).length === 1 && tukarKedaluwarsa([Object.assign({}, baris1, { mulai: '2026-10-07' })], '2026-10-07', detik('07:00'), jamFn).length === 0 && tukarKedaluwarsa([Object.assign({}, baris1, { mulai: '2026-10-06' })], '2026-10-07', detik('00:01'), jamFn).length === 1 && tukarKedaluwarsa([baris1], '2026-10-07', detik('20:00'), jamFn).length === 0 && tukarKedaluwarsa([Object.assign({}, baris1, { mulai: '2026-10-06', status_rekan: 'SETUJU' })], '2026-10-07', detik('09:00'), jamFn).length === 0 && tukarKedaluwarsa([Object.assign({}, baris1, { mulai: '2026-10-06', jenis: 'Sakit' })], '2026-10-07', detik('09:00'), jamFn).length === 0 && tukarKedaluwarsa([Object.assign({}, baris1, { mulai: '2026-10-07', jenis: 'PINDAH_SHIFT' })], '2026-10-07', detik('09:00'), jamFn).length === 1);
  ujiBebas('ajakan untuk rekan: dihitung hanya yang MENUNGGU jawaban rekan itu', jumlahTukarMasuk([baris1, Object.assign({}, baris1, { status_rekan: 'SETUJU' }), Object.assign({}, baris1, { rekan: 'K088' })], 'K005') === 1 && jumlahTukarMasuk([baris1], 'K004') === 0);
  const petaT = { K004: { nama: 'Dina Marlina', panggilan: 'Dina', cabang: 'Ngawi', role: 'KARYAWAN' }, K005: { nama: 'Ari Pratama', panggilan: 'Ari', cabang: 'Ngawi', role: 'KARYAWAN' } };
  const itemT = rakitItemTukar([Object.assign({}, baris1, { mulai: '2026-10-06', status_rekan: 'SETUJU' }), baris1, Object.assign({}, baris1, { id: 'IZN-2026-0015-A', grup: 'IZN-2026-0015', jenis: 'PINDAH_SHIFT', status_rekan: 'SETUJU' })], petaT);
  ujiBebas('item Konfirmasi tukar: hanya yang rekan sudah setuju; judul "Tukar shift \u00b7 rekan setuju", nama "Dina \u21c4 Ari", rincian "Sel 6 Okt \u00b7 Dina \u2192 Shift 1, Ari \u2192 Shift 2"; pindah hanya satu orang', itemT.length === 2 && itemT[0].id === 'TUKAR|IZN-2026-0014' && itemT[0].judul === 'Tukar shift \u00b7 rekan setuju' && itemT[0].nama === 'Dina \u21c4 Ari' && itemT[0].rincian === 'Sel 6 Okt \u00b7 Dina \u2192 Shift 1, Ari \u2192 Shift 2' && itemT[1].judul === 'Pindah shift \u00b7 rekan setuju' && itemT[1].rincian === 'Sen 12 Okt \u00b7 Dina \u2192 Shift 1' && itemT[1].nama === 'Dina');
  ujiBebas('hak tukar di server: admin Ngawi melihat tukar karyawan Ngawi; owner tidak melihat tukar karyawan; admin cabang lain tidak', saringItemKonfirmasi(itemT, { role: 'ADMIN', id: 'K009', cabang: 'Ngawi' }, '').length === 2 && saringItemKonfirmasi(itemT, { role: 'OWNER', id: 'OWN01', cabang: '' }, '').length === 0 && saringItemKonfirmasi(itemT, { role: 'ADMIN', id: 'K011', cabang: 'Pusat' }, '').length === 0 && parseIdItemTukar('TUKAR|IZN-2026-0014') === 'IZN-2026-0014' && parseIdItemTukar('IZIN|IZN-2026-0014') === null && parseIdItemTukar('TUKAR|../x') === null);
  const trTukar = rencanaTerapkanTukar(baris1, { libur: false, shift: 2 }, { libur: false, shift: 1 });
  ujiBebas('ACC tukar: kalender menukar kedua karyawan (Dina jadi 1, Ari jadi 2); jadwal yang sudah berubah ditolak dengan pesan jelas; pindah hanya menulis pemohon', trTukar.ok && trTukar.tulis.length === 2 && trTukar.tulis[0].karyawan === 'K004' && trTukar.tulis[0].nilai === '1' && trTukar.tulis[1].karyawan === 'K005' && trTukar.tulis[1].nilai === '2' && !rencanaTerapkanTukar(baris1, { libur: false, shift: 1 }, { libur: false, shift: 1 }).ok && !rencanaTerapkanTukar(baris1, { libur: false, shift: 2 }, { libur: true, shift: null }).ok && /Jadwal sudah berubah/.test(rencanaTerapkanTukar(baris1, { libur: true, shift: null }, { libur: false, shift: 1 }).pesan) && rencanaTerapkanTukar(Object.assign({}, baris1, { jenis: 'PINDAH_SHIFT' }), { libur: false, shift: 2 }, null).tulis.length === 1);
  const shList = [{ no: '1', masuk: '07:45', pulang: '16:30' }, { no: '2', masuk: '12:00', pulang: '20:30' }];
  ujiBebas('shift aktif: dari 60 menit sebelum masuk sampai jam pulang; 06:30 belum, 06:50 Shift 1, 11:30 kedua shift, 17:00 hanya Shift 2, 21:00 tidak ada', shiftAktifSekarang(shList, '06:30', 60).length === 0 && shiftAktifSekarang(shList, '06:50', 60).join() === '1' && shiftAktifSekarang(shList, '11:30', 60).join() === '1,2' && shiftAktifSekarang(shList, '17:00', 60).join() === '2' && shiftAktifSekarang(shList, '21:00', 60).length === 0);
  const tp = terjadwalPerShift([akB, akD, akR, Object.assign({}, akB, { id: 'K006', panggilan: 'Cici' }), Object.assign({}, akB, { id: 'K007', panggilan: 'Ani', aktif: false }), Object.assign({}, akB, { id: 'K008', panggilan: 'Eka', role: 'ADMIN' })], '2026-10-12', [{ tanggal: '2026-10-12', cabang: 'Ngawi', karyawan: 'K006', isi: 'LIBUR' }], [{ karyawan: 'K005', jenis: 'Cuti', mulai: '2026-10-12', selesai: '2026-10-12', status: 'MENUNGGU' }, { karyawan: 'K004', jenis: 'TUKAR_SHIFT', mulai: '2026-10-12', selesai: '2026-10-12', status: 'MENUNGGU' }], true);
  ujiBebas('jadwal hari ini (layar 02): nama panggilan per shift urut abjad; yang libur, izin/cuti, nonaktif tidak tampil; tukar shift bukan izin; admin tetap tampil', JSON.stringify(tp) === '{"1":["Budi","Eka"],"2":["Dina"]}');
  ujiBebas('hari singkat: "Sel 6 Okt", "Min 11 Okt"', hariTanggalPendek('2026-10-06') === 'Sel 6 Okt' && hariTanggalPendek('2026-10-11') === 'Min 11 Okt');
  })();
  // ---- akhir FITUR B ----
  // ---- Fitur C: koreksi absen (peringatan HP toko, konflik, absen manual, data absensi, edit absen) ----
  (function () {
    const aC = { id: 'K003', nama: 'Budi Santoso', panggilan: 'Budi', cabang: 'Ngawi', role: 'KARYAWAN', aktif: true, shift: 1, pola_shift: 'TETAP', urutan_shift: '', ganti_setiap: '', mulai_pola: '' };
    const sh = [{ no: 1, masuk: '07:45', pulang: '16:30' }, { no: 2, masuk: '13:45', pulang: '22:00' }];
    const shift1 = { nama: 'Shift 1', masuk: '07:45', tutup: '16:00', pulang: '16:30', toleransi: 5 };
    const kalC = [{ tanggal: '2026-10-07', cabang: 'Ngawi', karyawan: 'K003', isi: '2' }, { tanggal: '2026-10-08', cabang: '', karyawan: '', isi: 'LIBUR TANGGAL MERAH' }];
    ujiBebas('shift efektif absen: kalender menang atas shift bawaan; libur atau tanpa jadwal memakai shift bawaan akun', shiftEfektifAbsen(aC, '2026-10-07', kalC, true) === 2 && shiftEfektifAbsen(aC, '2026-10-06', kalC, true) === 1 && shiftEfektifAbsen(aC, '2026-10-08', kalC, true) === 1);
    ujiBebas('shift tidak sesuai jadwal: jadwal Shift 1, jam 13:00 (jendela Shift 2 sudah buka, Shift 1 lewat 60 menit) = usulan Shift 2', (function () { const d = deteksiShiftBeda(detik('13:00'), 1, sh, 60); return !!d && d.usulan === 2; })());
    ujiBebas('shift tidak sesuai jadwal: dalam 60 menit sesudah jam masuk jadwal, atau sebelum jendela shift lain buka = tidak ada peringatan', deteksiShiftBeda(detik('08:30'), 1, sh, 60) === null && deteksiShiftBeda(detik('10:00'), 1, sh, 60) === null && deteksiShiftBeda(detik('17:00'), 2, sh, 60) === null);
    ujiBebas('pilihan shift: kosong atau sama jadwal = sah tanpa beda; shift lain hanya sah kalau sama dengan usulan saat itu; pilihan ngawur ditolak', pilihanShiftSah(detik('13:00'), 1, '', sh, 60).beda === false && pilihanShiftSah(detik('13:00'), 1, 1, sh, 60).beda === false && pilihanShiftSah(detik('13:00'), 1, 2, sh, 60).beda === true && pilihanShiftSah(detik('10:00'), 1, 2, sh, 60).ok === false && pilihanShiftSah(detik('13:00'), 1, 'x', sh, 60).ok === false);
    const rowsB = [{ tanggal: '2026-10-05', masuk: '07:40', pulang: '' }, { tanggal: '2026-10-06', masuk: '07:41', pulang: '16:31' }];
    ujiBebas('belum pulang sebelumnya: hanya hari TERAKHIR sebelum hari ini yang dilihat; sudah pulang = tidak ada; lebih tua dari batas hari = tidak ada', belumPulangSebelumnya(rowsB, '2026-10-07', 14) === null && belumPulangSebelumnya(rowsB.slice(0, 1), '2026-10-07', 14).tanggal === '2026-10-05' && belumPulangSebelumnya(rowsB.slice(0, 1), '2026-10-30', 14) === null && belumPulangSebelumnya([{ tanggal: '2026-10-07', masuk: '07:40', pulang: '' }], '2026-10-07', 14) === null);
    ujiBebas('tanggal panjang untuk layar peringatan: "Senin, 5 Oktober"', tanggalPanjang('2026-10-05') === 'Senin, 5 Oktober');
    ujiBebas('salinan kolom untuk log: semua jadi teks, kosong tetap kosong', JSON.stringify(salinKolom({ masuk: '07:40', telat_mnt: 0, ket_masuk: null }, ['masuk', 'telat_mnt', 'ket_masuk', 'x'])) === JSON.stringify({ masuk: '07:40', telat_mnt: '0', ket_masuk: '', x: '' }));
    const lamaC = { karyawan: 'K003', nama: 'Budi Santoso', tanggal: '2026-10-05', jenis: 'MASUK', jam: '07:40', kolom: { masuk: '07:40' } };
    const logC = [
      { waktu: '2026-10-05 07:50', aksi: 'KONFLIK_ABSEN', oleh: 'K003', cabang: 'Ngawi', id: 'M-K003-261005-074000-T1', sebelum: JSON.stringify(lamaC) },
      { waktu: '2026-10-05 08:00', aksi: 'KONFLIK_ABSEN', oleh: 'K004', cabang: 'Ngawi', id: 'M-K004-261005-075000-T1', sebelum: JSON.stringify(Object.assign({}, lamaC, { karyawan: 'K004' })) },
      { waktu: '2026-10-05 09:00', aksi: 'KONFLIK_SELESAI', oleh: 'K009', cabang: 'Ngawi', id: 'M-K004-261005-075000-T1', sebelum: '', sesudah: 'dihapus' },
      { waktu: '2026-10-05 09:10', aksi: 'KONFLIK_ABSEN', oleh: 'K005', cabang: 'Ngawi', id: 'M-K005-261005-075500-T1', sebelum: 'bukan json' }
    ];
    const terbuka = konflikTerbuka(logC);
    ujiBebas('konflik terbuka: yang sudah ada KONFLIK_SELESAI tidak ikut; baris log rusak dilewati; pelapor dan cabang terbawa', terbuka.length === 1 && terbuka[0].id === 'M-K003-261005-074000-T1' && terbuka[0].pelapor === 'K003' && terbuka[0].cabang === 'Ngawi' && terbuka[0].lama.jam === '07:40');
    const petaC = { K003: { nama: 'Budi Santoso', panggilan: 'Budi', cabang: 'Ngawi', role: 'KARYAWAN' }, K004: { nama: 'Rina Wati', panggilan: 'Rina', cabang: 'Ngawi', role: 'KARYAWAN' }, K009: { nama: 'Dewi Lestari', panggilan: 'Dewi', cabang: 'Ngawi', role: 'ADMIN' } };
    const itemKonflik = rakitItemKonflik(terbuka, petaC);
    ujiBebas('item Konfirmasi konflik: id "KONFLIK|id absen lama", kelompok KONFLIK, nama pelapor, tanpa foto', itemKonflik.length === 1 && itemKonflik[0].id === 'KONFLIK|M-K003-261005-074000-T1' && itemKonflik[0].kelompok === 'KONFLIK' && itemKonflik[0].nama === 'Budi Santoso' && itemKonflik[0].foto === 'TANPA' && /masuk 07:40/.test(itemKonflik[0].rincian));
    ujiBebas('id item konflik: hanya bentuk id absen sah; teks aneh ditolak', parseIdItemKonflik('KONFLIK|M-K003-261005-074000-T1') === 'M-K003-261005-074000-T1' && parseIdItemKonflik('KONFLIK|P-K003-261005-163100-P') === 'P-K003-261005-163100-P' && parseIdItemKonflik('KONFLIK|x') === null && parseIdItemKonflik('K003|2026-10-05|MASUK') === null && parseIdItemKonflik('KONFLIK|M-K003-261005-074000-A') === 'M-K003-261005-074000-A');
    const rowsL = [
      { tanggal: '2026-10-05', karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', shift: 1, masuk: '07:40', pulang: '' },
      { tanggal: '2026-10-05', karyawan: 'K004', nama: 'Rina Wati', cabang: 'Ngawi', shift: 1, masuk: '', pulang: '16:31' },
      { tanggal: '2026-10-05', karyawan: 'K005', nama: 'Ari', cabang: 'Ngawi', shift: 1, masuk: '07:40', pulang: '16:31' },
      { tanggal: '2026-10-07', karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', shift: 1, masuk: '07:40', pulang: '' },
      { tanggal: '2026-09-01', karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', shift: 1, masuk: '07:40', pulang: '' }
    ];
    const itemLupa = rakitItemLupaAbsen(rowsL, '2026-10-07', petaC, 14);
    ujiBebas('lupa absen: sudah masuk belum pulang = LUPA pulang; sudah pulang belum masuk = LUPA masuk; lengkap, hari ini, dan lebih tua dari batas tidak ikut', itemLupa.length === 2 && itemLupa[0].id === 'LUPA|K003|2026-10-05|PULANG' && itemLupa[1].id === 'LUPA|K004|2026-10-05|MASUK' && itemLupa[0].kelompok === 'LUPA' && itemLupa[1].nama === 'Rina Wati');
    ujiBebas('id item lupa absen: bentuk sah dikenali; yang aneh ditolak', JSON.stringify(parseIdItemLupa('LUPA|K003|2026-10-05|PULANG')) === JSON.stringify({ karyawan: 'K003', tanggal: '2026-10-05', jenis: 'PULANG' }) && parseIdItemLupa('LUPA|K003|2026-13-45|PULANG') === null && parseIdItemLupa('LUPA|K003|2026-10-05|LEMBUR') === null && parseIdItemLupa('K003|2026-10-05|MASUK') === null);
    ujiBebas('shift beda: kelompok SHIFT_BEDA hanya untuk absen masuk bertanda SHIFT_BEDA yang bukan absen luar; absen luar tetap LUAR', kelompokItem('MASUK', { tanda: 'SHIFT_BEDA', cara_masuk: 'PIN' }) === 'SHIFT_BEDA' && kelompokItem('MASUK', { tanda: 'SHIFT_BEDA', cara_masuk: 'LUAR' }) === 'LUAR' && kelompokItem('MASUK', { cara_masuk: 'LUAR' }) === 'LUAR');
    ujiBebas('status masuk manual: tepat jam masuk HADIR; 07:52 TELAT 7 menit; sebelum jendela absen tetap HADIR (admin boleh mengisi jam apa pun)', statusMasukManual(detik('07:45'), shift1, 60).st_masuk === 'HADIR' && statusMasukManual(detik('07:52'), shift1, 60).telat_mnt === 7 && statusMasukManual(detik('05:00'), shift1, 60).st_masuk === 'HADIR');
    ujiBebas('teks ringkas absen untuk log dan pratinjau', teksAbsenRingkas('MASUK', '07:52', 'TELAT', 7) === 'Masuk 07:52 (TELAT 7 mnt)' && teksAbsenRingkas('MASUK', '', '', 0) === 'Masuk kosong' && teksAbsenRingkas('PULANG', '16:31', 'PULANG NORMAL') === 'Pulang 16:31 (PULANG NORMAL)');
    const dasM = { jenis: 'MASUK', tanggal: '2026-10-05', jam: '07:52', hariIni: '2026-10-07', jamServer: '10:00', shift: shift1, baris: null, jendelaMenit: 60 };
    ujiBebas('absen manual MASUK: TELAT 7 menit dengan pratinjau "Status: TELAT 7 menit (Shift 1)"', rencanaAbsenManual(dasM).ok === true && rencanaAbsenManual(dasM).st === 'TELAT' && rencanaAbsenManual(dasM).telat_mnt === 7 && rencanaAbsenManual(dasM).tampil === 'Status: TELAT 7 menit (Shift 1)');
    ujiBebas('absen manual: jam di masa depan, tanggal lewat 31 hari, jam salah bentuk, dan jenis ngawur ditolak', rencanaAbsenManual(Object.assign({}, dasM, { tanggal: '2026-10-07', jam: '10:30' })).ok === false && rencanaAbsenManual(Object.assign({}, dasM, { tanggal: '2026-10-08' })).ok === false && rencanaAbsenManual(Object.assign({}, dasM, { tanggal: '2026-08-01' })).ok === false && rencanaAbsenManual(Object.assign({}, dasM, { jam: '7:5' })).ok === false && rencanaAbsenManual(Object.assign({}, dasM, { jenis: 'LEMBUR' })).ok === false);
    ujiBebas('absen manual: masuk yang sudah ada tidak boleh ditimpa; masuk tidak boleh sesudah jam pulang yang ada', rencanaAbsenManual(Object.assign({}, dasM, { baris: { masuk: '07:40', pulang: '' } })).ok === false && rencanaAbsenManual(Object.assign({}, dasM, { jam: '17:00', baris: { masuk: '', pulang: '16:31' } })).ok === false && rencanaAbsenManual(Object.assign({}, dasM, { jam: '07:40', baris: { masuk: '', pulang: '16:31' } })).ok === true);
    const dasP = Object.assign({}, dasM, { jenis: 'PULANG', jam: '16:31', baris: { masuk: '07:40', pulang: '' } });
    ujiBebas('absen manual PULANG: PULANG NORMAL bila masuk sudah ada; tanpa masuk ditolak; sebelum jam masuk ditolak; sudah ada pulang ditolak; sebelum jam pulang = PULANG CEPAT', rencanaAbsenManual(dasP).st_pulang === 'PULANG NORMAL' && rencanaAbsenManual(Object.assign({}, dasP, { baris: null })).ok === false && rencanaAbsenManual(Object.assign({}, dasP, { jam: '07:30' })).ok === false && rencanaAbsenManual(Object.assign({}, dasP, { baris: { masuk: '07:40', pulang: '16:40' } })).ok === false && rencanaAbsenManual(Object.assign({}, dasP, { jam: '15:00' })).st_pulang === 'PULANG CEPAT');
    const dasE = { jenis: 'MASUK', jam: '07:44', alasan: 'Salah catat jam', hariIni: '2026-10-07', tanggal: '2026-10-05', jamServer: '10:00', shift: shift1, baris: { masuk: '07:52', pulang: '16:31', st_masuk: 'TELAT', telat_mnt: 7, st_pulang: 'PULANG NORMAL', lembur: '' }, jendelaMenit: 60, terkunci: false, aktor: { role: 'ADMIN', id: 'K009' }, pemilik: { id: 'K003', role: 'KARYAWAN' } };
    const eMasuk = rencanaEditAbsenAdmin(dasE);
    ujiBebas('edit absen MASUK: status dihitung ulang (TELAT jadi HADIR), sebelum/sesudah tercatat, alasan dibersihkan', eMasuk.ok === true && eMasuk.ubah.masuk === '07:44' && eMasuk.ubah.st_masuk === 'HADIR' && eMasuk.ubah.telat_mnt === 0 && eMasuk.sebelum === 'Masuk 07:52 (TELAT 7 mnt)' && eMasuk.sesudah === 'Masuk 07:44 (HADIR)' && eMasuk.alasan === 'Salah catat jam');
    ujiBebas('edit absen: alasan kurang dari 5 karakter atau lebih dari 100 ditolak', rencanaEditAbsenAdmin(Object.assign({}, dasE, { alasan: 'abc' })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { alasan: '   ab  ' })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { alasan: 'x'.repeat(101) })).ok === false);
    ujiBebas('edit absen: admin TIDAK boleh mengedit absennya sendiri atau data admin lain; owner boleh; bulan terkunci hanya owner', rencanaEditAbsenAdmin(Object.assign({}, dasE, { pemilik: { id: 'K009', role: 'ADMIN' } })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { pemilik: { id: 'K010', role: 'ADMIN' } })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { aktor: { role: 'OWNER', id: 'OWN01' }, pemilik: { id: 'K009', role: 'ADMIN' } })).ok === true && rencanaEditAbsenAdmin(Object.assign({}, dasE, { terkunci: true })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { terkunci: true, aktor: { role: 'OWNER', id: 'OWN01' } })).ok === true);
    ujiBebas('edit absen: jam masuk harus sebelum jam pulang, jam pulang sesudah jam masuk, tidak di masa depan', rencanaEditAbsenAdmin(Object.assign({}, dasE, { jam: '17:00' })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { jenis: 'PULANG', jam: '07:00' })).ok === false && rencanaEditAbsenAdmin(Object.assign({}, dasE, { tanggal: '2026-10-07', jam: '10:30' })).ok === false);
    const eLembur = rencanaEditAbsenAdmin(Object.assign({}, dasE, { jenis: 'PULANG', jam: '18:00', baris: { masuk: '07:40', pulang: '17:00', st_masuk: 'HADIR', telat_mnt: 0, st_pulang: 'LEMBUR DI TOKO', lembur: '1|30' } }));
    ujiBebas('edit absen PULANG pada lembur: tetap lembur dan tingkat dihitung ulang (18:00 dari jam pulang 16:30 = 90 menit, tingkat 2); sebelum jam lembur dibuka ditolak', eLembur.ok === true && eLembur.ubah.st_pulang === 'LEMBUR DI TOKO' && eLembur.ubah.lembur === '2|90' && rencanaEditAbsenAdmin(Object.assign({}, dasE, { jenis: 'PULANG', jam: '16:31', baris: { masuk: '07:40', pulang: '17:00', st_masuk: 'HADIR', telat_mnt: 0, st_pulang: 'LEMBUR DI TOKO', lembur: '1|30' } })).ok === false);
    const baris64 = [
      { tanggal: '2026-10-05', karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', masuk: '07:52', pulang: '16:31', st_masuk: 'TELAT', st_pulang: 'PULANG NORMAL', tanda: '' },
      { tanggal: '2026-10-06', karyawan: 'K004', nama: 'Rina Wati', cabang: 'Ngawi', masuk: '07:40', pulang: '', st_masuk: 'HADIR', st_pulang: '', tanda: 'DIEDIT' },
      { tanggal: '2026-10-06', karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', masuk: '07:45', pulang: '18:35', st_masuk: 'HADIR', st_pulang: 'LEMBUR DI TOKO', tanda: 'SHIFT_BEDA' },
      { tanggal: '2026-10-06', karyawan: 'K099', nama: 'Orang Pusat', cabang: 'Pusat', masuk: '07:40', pulang: '16:31', st_masuk: 'HADIR', st_pulang: 'PULANG NORMAL', tanda: '' },
      { tanggal: '2026-09-20', karyawan: 'K003', nama: 'Budi Santoso', cabang: 'Ngawi', masuk: '', pulang: '16:31', st_masuk: '', st_pulang: 'PULANG NORMAL', tanda: 'LUPA_MASUK' }
    ];
    const h64 = saringDaftarAbsensi(baris64, { dari: '2026-10-05', sampai: '2026-10-11', karyawan: '', cabang: 'Ngawi', offset: 0, ukuran: 30 }, '2026-10-07');
    ujiBebas('data absensi: hanya cabang dan rentang tanggal itu, terbaru di atas (tanggal lalu jam masuk), cabang lain tidak muncul', h64.total === 3 && h64.daftar.map(function (x) { return x.karyawan + x.tanggal.slice(8); }).join() === 'K00306,K00406,K00305');
    ujiBebas('data absensi: penanda TELAT, LUPA PULANG, LEMBUR, SHIFT BEDA dan "diedit" terbawa; lupa masuk terdeteksi', h64.daftar[2].tanda.join() === 'TELAT' && h64.daftar[1].tanda.join() === 'LUPA PULANG' && h64.daftar[1].diedit === true && h64.daftar[0].tanda.join() === 'LEMBUR,SHIFT BEDA' && saringDaftarAbsensi(baris64, { dari: '', sampai: '', karyawan: 'K003', cabang: 'Ngawi' }, '2026-10-07').daftar.some(function (x) { return x.tanda.indexOf('LUPA MASUK') >= 0; }));
    ujiBebas('data absensi: filter karyawan dan paginasi (ukuran 2: halaman 1 punya lanjutan, halaman 2 tidak)', saringDaftarAbsensi(baris64, { dari: '', sampai: '', karyawan: 'K004', cabang: 'Ngawi' }, '2026-10-07').total === 1 && saringDaftarAbsensi(baris64, { dari: '', sampai: '', cabang: 'Ngawi', offset: 0, ukuran: 2 }, '2026-10-07').ada_lagi === true && saringDaftarAbsensi(baris64, { dari: '', sampai: '', cabang: 'Ngawi', offset: 2, ukuran: 2 }, '2026-10-07').ada_lagi === false);
    ujiBebas('tanda baru: ditambahkan tanpa duplikat dan tanpa menghapus tanda lain', tambahTanda('', 'DIEDIT') === 'DIEDIT' && tambahTanda('SHIFT_BEDA', 'DIEDIT') === 'SHIFT_BEDA,DIEDIT' && tambahTanda('DIEDIT', 'DIEDIT') === 'DIEDIT' && tambahTanda(null, 'MANUAL') === 'MANUAL');
    const lamaPindah = { jenis: 'MASUK', jam: '07:40' };
    const tgtOk = { id: 'K004', role: 'KARYAWAN', cabang: 'Ngawi', aktif: true };
    ujiBebas('pindah konflik MASUK: tujuan belum punya masuk = boleh, status dihitung untuk tujuan (07:40 HADIR); sudah punya masuk, pelapor sendiri, cabang lain, nonaktif ditolak', rencanaPindahKonflik(lamaPindah, tgtOk, null, shift1, 60, 'K003', 'Ngawi').st_masuk === 'HADIR' && rencanaPindahKonflik(lamaPindah, tgtOk, { masuk: '07:50', pulang: '' }, shift1, 60, 'K003', 'Ngawi').ok === false && rencanaPindahKonflik(lamaPindah, Object.assign({}, tgtOk, { id: 'K003' }), null, shift1, 60, 'K003', 'Ngawi').ok === false && rencanaPindahKonflik(lamaPindah, Object.assign({}, tgtOk, { cabang: 'Pusat' }), null, shift1, 60, 'K003', 'Ngawi').ok === false && rencanaPindahKonflik(lamaPindah, Object.assign({}, tgtOk, { aktif: false }), null, shift1, 60, 'K003', 'Ngawi').ok === false);
    ujiBebas('pindah konflik PULANG: tujuan harus sudah masuk dan belum pulang, jam pulang sesudah masuknya; hasil PULANG NORMAL', rencanaPindahKonflik({ jenis: 'PULANG', jam: '16:31' }, tgtOk, { masuk: '07:40', pulang: '' }, shift1, 60, 'K003', 'Ngawi').st_pulang === 'PULANG NORMAL' && rencanaPindahKonflik({ jenis: 'PULANG', jam: '16:31' }, tgtOk, null, shift1, 60, 'K003', 'Ngawi').ok === false && rencanaPindahKonflik({ jenis: 'PULANG', jam: '07:00' }, tgtOk, { masuk: '07:40', pulang: '' }, shift1, 60, 'K003', 'Ngawi').ok === false && rencanaPindahKonflik({ jenis: 'PULANG', jam: '16:31' }, tgtOk, { masuk: '07:40', pulang: '16:40' }, shift1, 60, 'K003', 'Ngawi').ok === false);
    ujiBebas('kode perangkat: absen manual admin = A (id absen M-K003-261005-075200-A)', kodePerangkatDariHp('MANUAL') === 'A' && kodePerangkatDariHp('PRIBADI') === 'P' && kodePerangkatDariHp('HPT-NGW-03') === 'T3');
    ujiBebas('menit lembur dari kolom: "2|75" = 75; kosong atau rusak = 0', menitLemburDariKolom('2|75') === 75 && menitLemburDariKolom('') === 0 && menitLemburDariKolom('abc') === 0);
    ujiBebas('hak Konfirmasi untuk item koreksi: admin Ngawi melihat konflik/lupa karyawan Ngawi (bukan miliknya); owner hanya milik admin', saringItemKonfirmasi(itemKonflik.concat(itemLupa), { role: 'ADMIN', id: 'K009', cabang: 'Ngawi' }, '').length === 3 && saringItemKonfirmasi(itemKonflik.concat(itemLupa), { role: 'OWNER', id: 'OWN01', cabang: '' }, '').length === 0 && saringItemKonfirmasi(itemKonflik, { role: 'ADMIN', id: 'K003', cabang: 'Ngawi' }, '').length === 0);
  })();
  // ---- Tahap 1: koreksi absen oleh owner, pengajuan sendiri yang bisa dibatalkan ----
  (function () {
    const adm = { role: 'ADMIN', id: 'K009', cabang: 'Ngawi' }, own = { role: 'OWNER', id: 'OWN01', cabang: '' };
    const kary = { id: 'K003', role: 'KARYAWAN', cabang: 'Ngawi' }, admLain = { id: 'K010', role: 'ADMIN', cabang: 'Pusat' }, karyPusat = { id: 'K050', role: 'KARYAWAN', cabang: 'Pusat' };
    ujiBebas('absen manual: admin boleh KARYAWAN cabangnya; TIDAK boleh dirinya sendiri, admin lain, atau karyawan cabang lain', bolehTargetKoreksi(adm, kary, 'MANUAL').boleh === true && bolehTargetKoreksi(adm, { id: 'K009', role: 'ADMIN', cabang: 'Ngawi' }, 'MANUAL').boleh === false && bolehTargetKoreksi(adm, admLain, 'MANUAL').boleh === false && bolehTargetKoreksi(adm, karyPusat, 'MANUAL').boleh === false);
    ujiBebas('absen manual: owner hanya untuk ADMIN (semua cabang); karyawan ditolak', bolehTargetKoreksi(own, admLain, 'MANUAL').boleh === true && bolehTargetKoreksi(own, { id: 'K009', role: 'ADMIN', cabang: 'Ngawi' }, 'MANUAL').boleh === true && bolehTargetKoreksi(own, kary, 'MANUAL').boleh === false);
    ujiBebas('lihat/foto/edit: owner boleh karyawan DAN admin di semua cabang; admin tetap hanya karyawan cabangnya (bukan miliknya)', bolehTargetKoreksi(own, kary, 'LIHAT').boleh === true && bolehTargetKoreksi(own, admLain, 'LIHAT').boleh === true && bolehTargetKoreksi(adm, kary, 'LIHAT').boleh === true && bolehTargetKoreksi(adm, admLain, 'LIHAT').boleh === false && bolehTargetKoreksi({ role: 'KARYAWAN', id: 'K003' }, kary, 'LIHAT').boleh === false && bolehTargetKoreksi(own, { id: 'X', role: 'OWNER', cabang: '' }, 'LIHAT').boleh === false);
    const dasE2 = { jenis: 'MASUK', jam: '07:44', alasan: 'Salah catat jam', hariIni: '2026-10-07', tanggal: '2026-10-05', jamServer: '10:00', shift: { nama: 'Shift 1', masuk: '07:45', tutup: '16:00', pulang: '16:30', toleransi: 5 }, baris: { masuk: '07:52', pulang: '16:31', st_masuk: 'TELAT', telat_mnt: 7, st_pulang: 'PULANG NORMAL', lembur: '' }, jendelaMenit: 60, terkunci: true, aktor: { role: 'OWNER', id: 'OWN01' }, pemilik: { id: 'K009', role: 'ADMIN' } };
    ujiBebas('edit absen owner: boleh mengedit data ADMIN dan bulan terkunci; status dihitung ulang (TELAT jadi HADIR)', rencanaEditAbsenAdmin(dasE2).ok === true && rencanaEditAbsenAdmin(dasE2).ubah.st_masuk === 'HADIR');
    const izinRows = [
      { id: 'IZN-2026-0007-A', grup: 'IZN-2026-0007', karyawan: 'K003', jenis: 'Menikah', mulai: '2026-10-12', selesai: '2026-10-13', status: 'MENUNGGU' },
      { id: 'IZN-2026-0007-B', grup: 'IZN-2026-0007', karyawan: 'K003', jenis: 'Cuti', mulai: '2026-10-14', selesai: '2026-10-14', status: 'MENUNGGU' },
      { id: 'IZN-2026-0008-A', grup: 'IZN-2026-0008', karyawan: 'K003', jenis: 'TUKAR_SHIFT', mulai: '2026-10-13', selesai: '2026-10-13', status: 'MENUNGGU' },
      { id: 'IZN-2026-0009-A', grup: 'IZN-2026-0009', karyawan: 'K003', jenis: 'Sakit', mulai: '2026-10-01', selesai: '2026-10-01', status: 'DITERIMA' },
      { id: 'IZN-2026-0010-A', grup: 'IZN-2026-0010', karyawan: 'K004', jenis: 'Sakit', mulai: '2026-10-08', selesai: '2026-10-08', status: 'MENUNGGU' }
    ];
    const saya = rakitPengajuanSaya(izinRows, 'K003');
    ujiBebas('pengajuan saya: hanya milik sendiri yang MENUNGGU, satu item per grup (izin dua bagian jadi satu), tukar shift ikut dan bertanda tukar', saya.length === 2 && saya[0].grup === 'IZN-2026-0007' && saya[0].rincian === '12–14 Okt' && saya[1].judul === 'Tukar shift' && saya[1].tukar === true && saya[0].tukar === false);
    ujiBebas('pengajuan saya: yang sudah diputuskan atau milik orang lain tidak muncul', saya.every(function (x) { return x.grup !== 'IZN-2026-0009' && x.grup !== 'IZN-2026-0010'; }) && rakitPengajuanSaya(izinRows, 'K999').length === 0);
  })();
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
  baris.push('  - Login HP pribadi: karyawan (nama + PIN 5 angka) dan admin (nama + kata sandi) masuk; salah 5x mengunci akun; nama ngawur 5x ditahan tanpa membuka petunjuk apakah nama ada');
  baris.push('  - Admin baru (pw_hash kosong, ganti_pw TRUE diisi pemilik di sheet): login pertama dengan nama saja membuka layar Buat kata sandi dan PIN; sesudahnya pw_hash dan pin_hash terisi, ganti_pw FALSE, dan sheet sesi bertambah satu baris (kolom perangkat berawalan HPP, kolom kedaluwarsa kosong)');
  baris.push('  - Reset PIN / Nonaktifkan karyawan dari HP toko atau HP pribadi admin: karyawan yang sedang masuk di HP pribadi langsung ditolak pada permintaan berikutnya (sesi di sheet jadi aktif FALSE)');
  baris.push('  - Karyawan lama dengan PIN 4 angka tidak bisa absen lagi sampai admin menjalankan Reset PIN (PIN baru 5 angka)');
  baris.push('  - Absen luar masuk di HP pribadi: isi keterangan (minimal 5 karakter), lokasi terkunci, KIRIM: baris absensi dengan cara_masuk LUAR, acc_masuk MENUNGGU, ket_masuk "LUAR: keterangan" (ketik bebas, minimal 5 karakter), gps_masuk "lat,lng,akurasi" (teks, bukan angka), id_masuk berakhiran -P, foto menyusul ke folder Drive');
  baris.push('  - Izin lokasi ditolak: absen luar tidak bisa dilanjutkan (pesan jelas, tombol Coba lagi); akurasi 350 m tetap bisa dikirim');
  baris.push('  - Telat lewat absen luar: pop-up TELAT + alasan; ket_masuk menjadi "Macet | LUAR: ..." (bagian luar tetap)');
  baris.push('  - Pulang luar setelah masuk di HP toko: form tujuan/keperluan muncul; setelah masuk luar: tanpa form; PULANG + LEMBUR mengikuti aturan jam lembur; acc_pulang MENUNGGU, cara_pulang LUAR');
  baris.push('  - Riwayat absen di HP pribadi: hanya milik sendiri, 31 hari terakhir, paling banyak 50 baris, jam masuk/pulang benar (bukan terbalik AM/PM)');
  baris.push('  - Konfirmasi: menu admin (HP toko dan HP pribadi) dan menu owner menampilkan jumlah menunggu (99+ bila lebih); isi dikelompokkan Absen luar, Lembur, Pulang cepat; ACC mengubah acc_masuk/acc_pulang jadi DITERIMA, TOLAK (dengan konfirmasi) jadi DITOLAK, tombolnya hilang; sheet log ada ACC_ABSEN / TOLAK_ABSEN');
  baris.push('  - Konfirmasi hak: admin Ngawi hanya melihat pengajuan KARYAWAN Ngawi (bukan miliknya sendiri, bukan admin lain); owner hanya melihat pengajuan ADMIN (semua cabang). Coba ACC pengajuan karyawan memakai sesi owner (harus ditolak) dan ACC pengajuan sendiri memakai sesi admin (harus ditolak)');
  baris.push('  - Edit pengajuan absen luar (Konfirmasi > Edit): ubah jam dan keterangan; status HADIR/TELAT dan tingkat lembur dihitung ulang, acc tetap MENUNGGU, log EDIT_ABSEN berisi sebelum/sesudah; pengajuan yang sudah DITERIMA/DITOLAK, milik sendiri, atau jam melewati sekarang harus ditolak');
  baris.push('  - Penanda area toko: absen luar dalam radius_tanda_toko_m (bawaan 100 m) dari HP toko cabang itu: ket_masuk/ket_pulang berawalan "LUAR [AREA TOKO]:" dan kartu Konfirmasi menampilkan "Lokasi di dalam area toko"; absen tetap MENUNGGU');
  baris.push('  - Lihat foto: foto hanya dimuat saat tombol ditekan; TANPA FOTO tampil sebagai tulisan; tautan Buka di Google Maps membuka lokasi yang benar; akurasi di atas 100 m diberi tanda');
  baris.push('  - Muat lagi: layar menampilkan 20 kartu per muatan; setelah beberapa item diputuskan, Muat lagi tidak melewatkan item');
  baris.push('  - Aktifkan kembali karyawan nonaktif: saklar Tampilkan nonaktif -> tombol Aktifkan kembali; aktif jadi TRUE dengan ID sama, pin_hash/salah_login/terkunci tidak berubah, log AKTIFKAN_KARYAWAN; nama kembar dengan karyawan aktif ditolak');
  baris.push('  - Form Tambah karyawan: cabang bershift tunggal menampilkan catatan shift otomatis (tanpa dropdown), dan form tetap bisa disimpan walau shift tidak dipilih');
  baris.push('  - Login admin/owner dengan huruf besar/kecil berbeda (ADMIN123 vs admin123) berhasil; akun lama yang berhasil login dengan ketikan persis lama: pw_hash otomatis berubah ke versi huruf kecil (kolom pw_hash berubah, salah_login tidak naik)');
  baris.push('  - Salah password admin/owner 5x: dihitung per percobaan salah (satu kesalahan per percobaan, bukan dua)');
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
  const kedaluwarsa = menit === null ? null : sekarang + menit * 60000; // null = tanpa kedaluwarsa (HP pribadi)
  const baris = {
    id_sesi: 'S-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12), akun: akunId,
    perangkat: idPerangkat + '|' + labelPerangkat, token_hash: hashSesi(token),
    dibuat: teksWaktu(sekarang), terakhir_aktif: teksWaktu(sekarang), kedaluwarsa: kedaluwarsa === null ? '' : teksWaktu(kedaluwarsa), aktif: true
  };
  sesi.sheet.appendRow(sesi.header.map(function (n) { return baris[n]; }));
  return { token: token, id_sesi: baris.id_sesi, kedaluwarsa: kedaluwarsa };
}

/** Kembalikan { sesi (bacaan sheet), baris, akun } kalau tiket sesi sah (dan role cocok), kalau tidak null. */
function validasiSesi(token, role, jenis) {
  if (!token || typeof token !== 'string' || token.length < 32 || token.length > 200) { return null; }
  if (!PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA')) { return null; }
  const hash = hashSesi(token);
  const sesi = bacaSesi();
  const baris = sesi.data.find(function (r) { return r.token_hash === hash && r.aktif === true; });
  if (!baris) { return null; }
  const sekarang = Date.now();
  const jn = jenisSesi(baris);
  if (jenis && jn !== jenis) { return null; }
  // Sesi HP pribadi tidak punya kedaluwarsa waktu (sampai Log out/dicabut); jenis lain wajib belum kedaluwarsa.
  if (jn !== 'PRIBADI' && !sesiMasihBerlaku(msDariSel(baris.kedaluwarsa), sekarang)) {
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
  const kunciCache = [];
  sesi.data.forEach(function (r) {
    if (String(r.akun) === String(akunId) && r.aktif === true && r.id_sesi !== kecualiIdSesi) {
      perbaruiKolom(sesi, r, { aktif: false });
      kunciCache.push('sp_' + r.token_hash);
      n++;
    }
  });
  // pencabutan berlaku SEKETIKA: buang cache validasi sesi HP pribadi
  if (kunciCache.length) { CacheService.getScriptCache().removeAll(kunciCache); }
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

  const cocokOwner = cocokkanPassword(password, owner.id, kodeRahasia, owner.pw_hash);
  if (!cocokOwner.cocok) {
    const k = catatSalahOwner(c.akun, owner);
    if (k.tahanSampai) {
      return respon({ status: 'gagal', kode: 'DITAHAN', pesan: 'Salah password 5 kali. Login owner ditahan ' + TAHAN_LOGIN_OWNER_MENIT + ' menit' });
    }
    return respon({ status: 'gagal', pesan: pesanUmum });
  }

  if (cocokOwner.migrasi) { perbaruiKolom(c.akun, owner, { pw_hash: cocokOwner.hashBaru }); } // migrasi ke hash huruf kecil
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
  const kuat = periksaKekuatanPassword(normalisasiPassword(d.password_baru), c.owner.nama);
  if (!kuat.ok) { return respon({ status: 'gagal', pesan: kuat.pesan }); }

  const owner = c.owner;
  perbaruiKolom(c.akun, owner, { pw_hash: hashPasswordBaru(d.password_baru, owner.id, kodeRahasia), ganti_pw: false, salah_login: 0 });
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
    // sama dengan Konfirmasi: item masuk dan item pulang yang MENUNGGU dihitung terpisah
    if (r.acc_masuk === 'MENUNGGU') { a.menunggu_acc++; }
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

/**
 * ---- Beranda admin dan owner: Hadir, Telat, Belum absen, Izin/cuti per shift ----
 * Dihitung dari jadwal (akun, shift, kalender), absensi hari ini, dan izin. Fungsi-fungsi murni di bawah
 * (tanpa Apps Script) menerima tanggal sebagai teks yyyy-MM-dd.
 */
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MAKS_BARIS_BERANDA = 3000;

function bagianTanggal(t) { const p = String(t).split('-'); return { y: Number(p[0]), m: Number(p[1]), d: Number(p[2]) }; }
function hariKeIndeks(t) { const b = bagianTanggal(t); return new Date(Date.UTC(b.y, b.m - 1, b.d)).getUTCDay(); }
function geserTanggal(t, n) { const b = bagianTanggal(t); return new Date(Date.UTC(b.y, b.m - 1, b.d) + n * 86400000).toISOString().slice(0, 10); }
function selisihHari(dari, ke) { const a = bagianTanggal(dari), b = bagianTanggal(ke); return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000); }
function nomorShift(v) { const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? null : n; }

/** Shift menurut pola akun pada satu tanggal: TETAP = akun.shift; BERGILIR = urutan_shift berganti tiap ganti_setiap (1M/2M = minggu, 1B/3B = bulan) sejak mulai_pola. */
function shiftMenurutPola(akun, tanggal) {
  if (String(akun.pola_shift).toUpperCase() !== 'BERGILIR') { return nomorShift(akun.shift); }
  const urutan = String(akun.urutan_shift === undefined || akun.urutan_shift === null ? '' : akun.urutan_shift).split(',').map(nomorShift).filter(function (x) { return x !== null; });
  if (!urutan.length) { return nomorShift(akun.shift); }
  const mulai = String(akun.mulai_pola === undefined || akun.mulai_pola === null ? '' : akun.mulai_pola);
  const m = /^(\d+)([MB])$/.exec(String(akun.ganti_setiap).toUpperCase().trim());
  if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(mulai) || tanggal < mulai || Number(m[1]) < 1) { return urutan[0]; }
  const n = Number(m[1]);
  let periode;
  if (m[2] === 'M') { periode = Math.floor(selisihHari(mulai, tanggal) / (7 * n)); }
  else {
    const a = bagianTanggal(mulai), b = bagianTanggal(tanggal);
    let bulan = (b.y * 12 + b.m) - (a.y * 12 + a.m);
    if (b.d < a.d) { bulan--; }
    periode = Math.floor(bulan / n);
  }
  return urutan[periode % urutan.length];
}

/** Jadwal satu karyawan pada satu tanggal: { libur, shift }. Kalender (khusus karyawan lebih kuat dari umum) mengalahkan libur Minggu dan pola. */
function jadwalKaryawanHari(akun, tanggal, kalender, liburMinggu) {
  const cocok = kalender.filter(function (k) {
    return k.tanggal === tanggal && (String(k.cabang) === '' || String(k.cabang) === String(akun.cabang));
  });
  const khusus = cocok.filter(function (k) { return String(k.karyawan) === String(akun.id); });
  const umum = cocok.filter(function (k) { return String(k.karyawan) === ''; });
  const e = khusus[0] || umum[0];
  if (e) {
    const isi = String(e.isi).toUpperCase().trim();
    if (isi.indexOf('LIBUR') === 0) { return { libur: true, shift: null }; }
    if (isi.indexOf('MASUK') === 0) { return { libur: false, shift: shiftMenurutPola(akun, tanggal) }; } // mis. Minggu masuk (stok opname)
    const n = nomorShift(isi);
    if (n !== null) { return { libur: false, shift: n }; }
  }
  if (liburMinggu === true && hariKeIndeks(tanggal) === 0) { return { libur: true, shift: null }; }
  return { libur: false, shift: shiftMenurutPola(akun, tanggal) };
}

/**
 * Inti angka beranda. m = { tanggal, jam 'HH:mm', cabang ('' = semua), akun[], shift[], kalender[], absensi[], izin[], liburMingguCabang { namaCabang: true/false } }.
 * Karyawan = akun aktif role KARYAWAN atau ADMIN. Tepat waktu = absen masuk berstatus HADIR; Telat dihitung terpisah (tidak masuk Tepat waktu); yang sudah absen masuk (tepat atau telat) tidak dihitung Belum absen. Belum absen = terjadwal hari ini,
 * jam masuk shiftnya sudah lewat, belum absen, tidak sedang izin/cuti. Izin/cuti = izin berstatus bukan DITOLAK/BATAL yang mencakup hari ini (bukan tukar/pindah shift).
 */
function hitungBerandaHariIni(m) {
  const cab = m.cabang || '';
  const sekarang = jamKeDetik(m.jam);
  const karyawan = m.akun.filter(function (a) { return a.aktif === true && (a.role === 'KARYAWAN' || a.role === 'ADMIN') && (!cab || a.cabang === cab); });
  const adaDiCabang = function (c) { return !cab || String(c) === cab; };
  const kolom = {};
  const kolomShift = function (no) {
    if (!kolom[no]) { kolom[no] = { no: no, nama: 'Shift ' + no, masuk: '', tepat: 0, telat: 0, belum: 0, izin: 0, belum_daftar: [] }; }
    return kolom[no];
  };
  const barisShift = function (cabangAkun, no) {
    return m.shift.find(function (s) { return String(s.cabang).trim().toLowerCase() === String(cabangAkun).trim().toLowerCase() && nomorShift(s.no) === no; });
  };
  m.shift.filter(function (s) { return adaDiCabang(s.cabang); }).forEach(function (s) {
    const k = kolomShift(nomorShift(s.no));
    if (!k.masuk || String(s.masuk) < k.masuk) { k.masuk = String(s.masuk); }
    if (s.nama) { k.nama = String(s.nama); }
  });
  const hadirId = {};
  m.absensi.forEach(function (r) {
    if (r.tanggal !== m.tanggal || !adaDiCabang(r.cabang) || (String(r.masuk) === '' && String(r.pulang) === '')) { return; }
    hadirId[String(r.karyawan)] = true; // lupa masuk (hanya ada jam pulang) tetap dihitung hadir; statusnya kosong sampai admin mengisi jam masuk
    const no = nomorShift(r.shift);
    if (no === null) { return; }
    const k = kolomShift(no);
    if (r.st_masuk === 'TELAT') { k.telat++; } else if (r.st_masuk === 'HADIR') { k.tepat++; }
  });
  const izinId = {};
  m.izin.forEach(function (z) {
    const st = String(z.status).toUpperCase();
    const jenis = String(z.jenis).toUpperCase();
    if (st === 'DITOLAK' || st === 'BATAL' || jenis === 'TUKAR_SHIFT' || jenis === 'PINDAH_SHIFT') { return; }
    if (z.mulai <= m.tanggal && m.tanggal <= z.selesai) { izinId[String(z.karyawan)] = true; }
  });
  karyawan.forEach(function (a) {
    if (hadirId[String(a.id)]) { return; }
    const j = jadwalKaryawanHari(a, m.tanggal, m.kalender, m.liburMingguCabang[a.cabang] === true);
    if (j.libur || j.shift === null) { return; }
    const k = kolomShift(j.shift);
    if (izinId[String(a.id)]) { k.izin++; return; }
    const bs = barisShift(a.cabang, j.shift);
    if (bs && String(bs.masuk) !== '' && jamKeDetik(String(bs.masuk)) <= sekarang) {
      k.belum++;
      k.belum_daftar.push({ nama: String(a.nama), panggilan: String(a.panggilan || ''), jadwal: String(bs.masuk) });
    }
  });
  const daftarShift = Object.keys(kolom).map(Number).sort(function (a, b) { return a - b; }).map(function (no) {
    const k = kolom[no];
    k.belum_daftar.sort(function (x, y) { return x.nama < y.nama ? -1 : 1; });
    return k;
  });
  const semua = { tepat: 0, telat: 0, belum: 0, izin: 0 };
  daftarShift.forEach(function (k) { semua.tepat += k.tepat; semua.telat += k.telat; semua.belum += k.belum; semua.izin += k.izin; });
  const telat7 = [];
  for (let i = 6; i >= 0; i--) {
    const t = geserTanggal(m.tanggal, -i);
    const n = m.absensi.filter(function (r) { return r.tanggal === t && adaDiCabang(r.cabang) && r.st_masuk === 'TELAT'; }).length;
    telat7.push({ tanggal: t, hari: HARI_PENDEK[hariKeIndeks(t)], hari_panjang: HARI_PANJANG[hariKeIndeks(t)], jumlah: n });
  }
  let tertinggi = telat7[0];
  telat7.forEach(function (x) { if (x.jumlah > tertinggi.jumlah) { tertinggi = x; } });
  return { semua: semua, shift: daftarShift, telat7: telat7, tertinggi: tertinggi.jumlah > 0 ? tertinggi : null };
}

/** Baca sheet kalender/izin/shift/absensi terbaru dan susun masukan hitungBerandaHariIni (tanggal dinormalkan jadi teks). */
function susunMasukanBeranda(tanggal, jam, cabang) {
  const norm = function (v) { return String(sebagaiTanggalTeks(v, ZONA_ABSEN)); };
  const pengaturan = bacaSheet('pengaturan').data;
  const kode = {};
  pengaturan.forEach(function (r) { if (r.kategori === 'CABANG') { kode[String(r.nama)] = String(r.nilai).trim(); } });
  const libur = {};
  Object.keys(kode).forEach(function (nama) {
    const p = pengaturan.find(function (r) { return r.kategori === 'UMUM' && String(r.nama) === 'libur_minggu_' + kode[nama]; });
    libur[nama] = !!p && String(p.nilai).toUpperCase() === 'TRUE';
  });
  const akun = bacaSheet('akun').data.map(function (a) { a.mulai_pola = a.mulai_pola === '' ? '' : norm(a.mulai_pola); return a; });
  const kalender = bacaSheet('kalender').data.map(function (k) { return { tanggal: norm(k.tanggal), cabang: String(k.cabang), karyawan: String(k.karyawan), isi: String(k.isi) }; });
  const izin = bacaSheet('izin').data.map(function (z) { return { karyawan: z.karyawan, jenis: z.jenis, mulai: norm(z.mulai), selesai: norm(z.selesai), status: z.status }; });
  const absensi = bacaAbsensiTerbaru(MAKS_BARIS_BERANDA).map(function (r) { r.tanggal = norm(r.tanggal); return r; });
  return { tanggal: tanggal, jam: jam, cabang: cabang, akun: akun, shift: bacaSemuaShift(), kalender: kalender, absensi: absensi, izin: izin, liburMingguCabang: libur };
}

/** Baris absensi paling bawah (terbaru), paling banyak maks baris. */
function bacaAbsensiTerbaru(maks) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('absensi');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return []; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  const awal = Math.max(2, terakhir - maks + 1);
  const v = sheet.getRange(awal, 1, terakhir - awal + 1, lebar).getValues();
  return v.map(function (baris) {
    const r = {};
    header.forEach(function (nama, idx) { r[nama] = baris[idx]; });
    return r;
  });
}

/** Fungsi murni: cabang yang dihitung. Owner: yang dipilih (kosong = semua); admin: selalu cabangnya sendiri (pilihan dari client diabaikan). */
function cabangUntukBeranda(aktor, pilihan) {
  if (aktor.role === 'OWNER') { return pilihan === undefined || pilihan === null ? '' : String(pilihan).slice(0, 60); }
  return aktor.cabang;
}

/**
 * Aksi beranda_hari_ini { sesi, token?, cabang? } untuk beranda admin (HP toko dan HP pribadi) dan owner.
 * Hak: owner boleh semua cabang (atau satu lewat `cabang`); admin selalu hanya cabangnya sendiri (cabang dari client diabaikan).
 * Hanya membaca sheet.
 */
function prosesBerandaHariIni(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return k.gagal; }
  const sekarang = new Date();
  const tanggal = Utilities.formatDate(sekarang, ZONA_ABSEN, 'yyyy-MM-dd');
  const jam = Utilities.formatDate(sekarang, ZONA_ABSEN, 'HH:mm');
  const owner = k.aktor.role === 'OWNER';
  const cabang = cabangUntukBeranda(k.aktor, d.cabang);
  const hasil = hitungBerandaHariIni(susunMasukanBeranda(tanggal, jam, cabang));
  const out = { status: 'ok', tanggal: tanggal, jam: jam, hari: HARI_PANJANG[hariKeIndeks(tanggal)], cabang: cabang, semua: hasil.semua, shift: hasil.shift, telat7: hasil.telat7, tertinggi: hasil.tertinggi };
  if (owner) {
    const daftarCabang = [];
    bacaSemuaShift().forEach(function (x) { if (daftarCabang.indexOf(x.cabang) === -1) { daftarCabang.push(x.cabang); } });
    bacaSheet('pengaturan').data.forEach(function (r) { if (r.kategori === 'CABANG' && daftarCabang.indexOf(String(r.nama)) === -1) { daftarCabang.push(String(r.nama)); } });
    out.daftar_cabang = daftarCabang;
  }
  return respon(out);
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
  if (s.akun.role === 'ADMIN' && jenisSesi(s.baris) !== 'TOKO') { return responSesiHabis(); }

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
  if (String(lama || '').length > 100 || !cocokkanPassword(String(lama || ''), owner.id, kodeRahasia, owner.pw_hash).cocok) {
    const k = catatSalahOwner(akun, owner);
    return respon({ status: 'gagal', pesan: k.tahanSampai ? 'Salah password 5 kali. Login owner ditahan ' + TAHAN_LOGIN_OWNER_MENIT + ' menit' : 'Password lama salah' });
  }
  const kuat = periksaKekuatanPassword(normalisasiPassword(baru), owner.nama, normalisasiPassword(lama));
  if (!kuat.ok) { return respon({ status: 'gagal', pesan: kuat.pesan }); }

  perbaruiKolom(akun, owner, { pw_hash: hashPasswordBaru(baru, owner.id, kodeRahasia), ganti_pw: false, salah_login: 0 });
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
  const cocokAdmin = cocokkanPassword(password, admin.id, kodeRahasia, admin.pw_hash);
  if (!cocokAdmin.cocok) {
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
  if (cocokAdmin.migrasi) { perbaruiKolom(akun, admin, { pw_hash: cocokAdmin.hashBaru }); } // migrasi ke hash huruf kecil
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
    if (baris) {
      perbaruiKolom(sesi, baris, { aktif: false });
      CacheService.getScriptCache().remove('sp_' + hash);
    }
  }
  return respon({ status: 'ok' });
}

/**
 * ---- Karyawan (dikelola admin di HP toko) ----
 * Semua aksi di bagian ini WAJIB token HP toko terdaftar + sesi admin yang valid, dan hanya
 * menyentuh karyawan (role KARYAWAN) di cabang admin itu. Baris ADMIN/OWNER tidak tampil dan tidak
 * bisa diubah lewat sini. PIN: tepat 5 angka (angka apa pun boleh). PIN tidak pernah dicatat.
 */

/** Fungsi murni: PIN harus teks TEPAT 5 angka (angka apa pun boleh). PIN lama 4 angka tidak valid lagi. */
function validasiPin(pin) {
  if (typeof pin !== 'string' || !/^\d{5}$/.test(pin)) { return { ok: false, pesan: 'PIN harus 5 angka' }; }
  return { ok: true };
}

/** Fungsi murni: admin boleh mengelola target hanya kalau target role KARYAWAN di cabang admin. */
function bolehKelolaKaryawan(roleAktor, cabangAktor, target) {
  if (roleAktor !== 'ADMIN') { return { boleh: false, pesan: 'Hanya admin yang boleh mengelola karyawan' }; }
  if (!target || target.role !== 'KARYAWAN') { return { boleh: false, pesan: 'Karyawan tidak ditemukan' }; }
  if (target.cabang !== cabangAktor) { return { boleh: false, pesan: 'Admin hanya boleh mengelola karyawan di cabangnya' }; }
  return { boleh: true };
}

/** Fungsi murni: daftar karyawan untuk layar Karyawan: hanya role KARYAWAN di cabang itu, dan hanya SATU kelompok: 'AKTIF' (bawaan) atau 'NONAKTIF'. */
function saringDaftarKaryawan(rows, cabang, kelompok) {
  const nonaktif = kelompok === 'NONAKTIF';
  return rows
    .filter(function (r) { return r.role === 'KARYAWAN' && r.cabang === cabang && ((r.aktif === true) === !nonaktif); })
    .map(function (r) {
      return { id: r.id, nama: r.nama, panggilan: r.panggilan, shift: r.shift, aktif: r.aktif === true, mulai_kerja: sebagaiTanggalTeks(r.mulai_kerja, ZONA_ABSEN) };
    })
    .sort(function (a, b) { return String(a.nama).toLowerCase() < String(b.nama).toLowerCase() ? -1 : 1; });
}

/** Fungsi murni: akun role ADMIN di cabang itu untuk baris hanya-baca di daftar Karyawan. Hanya id, nama, panggilan, shift, aktif (tanpa hash atau data lain). Tidak dipakai oleh aksi ubah/hapus apa pun. */
function daftarAdminCabang(rows, cabang) {
  return rows
    .filter(function (r) { return r.role === 'ADMIN' && r.cabang === cabang; })
    .map(function (r) { return { id: r.id, nama: r.nama, panggilan: r.panggilan, shift: r.shift, aktif: r.aktif === true }; })
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
  const nama = bersih(d.nama), panggilan = bersih(d.panggilan), mulai = bersih(d.mulai_kerja);
  let shift = bersih(d.shift);
  const aman = function (t) { return !/[\u0000-\u001f\u007f]/.test(t) && !/^[=+\-@]/.test(t); };
  if (!nama || nama.length > 60) { return { ok: false, pesan: 'Nama lengkap wajib diisi (maksimal 60 karakter)' }; }
  if (!aman(nama)) { return { ok: false, pesan: 'Nama tidak boleh diawali = + - atau @' }; }
  if (!panggilan || panggilan.length > 30) { return { ok: false, pesan: 'Nama panggilan wajib diisi (maksimal 30 karakter)' }; }
  if (!aman(panggilan)) { return { ok: false, pesan: 'Nama panggilan tidak boleh diawali = + - atau @' }; }
  // Shift TIDAK wajib: kosong = shift pertama cabang itu (cabang bershift tunggal otomatis memakainya).
  if (shift === '') {
    if (!shiftValid.length) { return { ok: false, pesan: 'Belum ada shift untuk cabang ini di sheet shift' }; }
    shift = String(shiftValid[0]);
  }
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
  // Jalur (b): sesi admin HP PRIBADI (tanpa token HP toko). Jalur (a): token HP toko + sesi admin HP toko.
  if (!d.token) {
    const p = validasiSesiPribadi(d.sesi);
    if (!p) { return { gagal: responSesiPribadiHabis() }; }
    if (p.role !== 'ADMIN') { return { gagal: respon({ status: 'gagal', pesan: 'Hanya admin yang boleh mengelola karyawan' }) }; }
    return { hp: null, s: { akun: { id: p.id, nama: p.nama, cabang: p.cabang, role: p.role } } };
  }
  const hp = validasiTokenHp(d.token);
  if (!hp) { return { gagal: respon({ status: 'gagal', kode: 'HP_TIDAK_TERDAFTAR', pesan: 'HP ini belum terdaftar atau sudah dinonaktifkan' }) }; }
  const s = validasiSesi(d.sesi, 'ADMIN', 'TOKO');
  if (!s) { return { gagal: responSesiHabis() }; }
  if (s.akun.cabang !== hp.cabang) { return { gagal: respon({ status: 'gagal', pesan: 'Admin hanya boleh mengelola karyawan di cabangnya' }) }; }
  return { hp: hp, s: s };
}

/** Aksi karyawan_daftar { token, sesi, tampilkan_nonaktif? }: karyawan cabang admin + pilihan shift untuk form tambah. */
function prosesKaryawanDaftar(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const cabang = a.s.akun.cabang;
  const semuaAkun = bacaSheet('akun').data;
  const kelompok = d.kelompok === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF';
  const daftar = saringDaftarKaryawan(semuaAkun, cabang, kelompok);
  const shifts = bacaShiftCabang(cabang).map(function (sh) { return { no: sh.no, nama: sh.nama, masuk: sh.masuk, pulang: sh.pulang }; });
  return respon({
    status: 'ok', cabang: cabang, daftar: daftar, daftar_shift: shifts, kelompok: kelompok, jumlah_aktif: saringDaftarKaryawan(semuaAkun, cabang, 'AKTIF').length,
    admin_daftar: daftarAdminCabang(semuaAkun, cabang), // HANYA BACA (tampil di daftar, tanpa aksi apa pun)
    id_berikutnya: buatIdKaryawan(semuaAkun.map(function (r) { return r.id; })), // ID yang akan dipakai karyawan baru berikutnya (info layar tambah karyawan)
    jatah_cuti: ambilNilaiUmum('jatah_cuti', 6)
  });
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
  cabutSesiAkun(target.id, ''); // semua sesi HP pribadi karyawan ini dicabut seketika
  tambahLog({ jenis: 'KARYAWAN', oleh: a.s.akun.id, cabang: target.cabang, aksi: 'RESET_PIN', target: target.nama, id: target.id, sebelum: 'salah_login/terkunci diperiksa', sesudah: 'salah_login=0; terkunci=FALSE' });
  return respon({ status: 'ok', id: target.id, nama: target.nama });
}

/**
 * Fungsi murni: boleh mengaktifkan kembali karyawan nonaktif? Hanya KARYAWAN di cabang admin, dan
 * ditolak kalau sudah ada akun AKTIF lain dengan nama lengkap yang sama (tanpa beda huruf besar/kecil).
 */
function bolehAktifkanKembali(rows, roleAktor, cabangAktor, target) {
  const izin = bolehKelolaKaryawan(roleAktor, cabangAktor, target);
  if (!izin.boleh) { return izin; }
  if (target.aktif === true) { return { boleh: true, sudahAktif: true }; }
  if (namaSudahDipakai(rows, target.nama)) { return { boleh: false, pesan: 'Sudah ada karyawan aktif dengan nama lengkap yang sama' }; }
  return { boleh: true, sudahAktif: false };
}

/** Aksi karyawan_aktifkan { token, sesi, id }: aktif=TRUE dengan ID yang sama (riwayat tetap menyambung); pin_hash, salah_login, terkunci TIDAK diubah. */
function prosesKaryawanAktifkan(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const akun = bacaSheet('akun');
  const target = akun.data.find(function (r) { return String(r.id) === String(d.id); });
  const izin = bolehAktifkanKembali(akun.data, a.s.akun.role, a.s.akun.cabang, target);
  if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }
  if (!izin.sudahAktif) {
    perbaruiKolom(akun, target, { aktif: true });
    tambahLog({ jenis: 'KARYAWAN', oleh: a.s.akun.id, cabang: target.cabang, aksi: 'AKTIFKAN_KARYAWAN', target: target.nama, id: target.id, sebelum: 'aktif=FALSE', sesudah: 'aktif=TRUE' });
  }
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
    cabutSesiAkun(target.id, ''); // akun nonaktif tidak bisa login di HP mana pun
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
  if (idHp === 'PRIBADI') { return 'P'; } // HP pribadi (absen luar)
  if (idHp === 'MANUAL') { return 'A'; } // absen manual oleh admin (Fitur C)
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
function periksaGambarJpeg(gambar, maksByte) {
  const batas = maksByte || MAKS_FOTO_BYTE;
  const teksBatas = 'maksimal ' + Math.round(batas / 1024) + ' KB';
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
  if (taksiran > batas) { return { ok: false, pesan: 'Foto terlalu besar (' + teksBatas + ')' }; }
  if (!/^[A-Za-z0-9+\/]+={0,2}$/.test(b64) || b64.length % 4 !== 0) { return { ok: false, pesan: 'Gambar tidak valid' }; }
  let bytes;
  try { bytes = Utilities.base64Decode(b64); } catch (e) { return { ok: false, pesan: 'Gambar tidak valid' }; }
  if (bytes.length > batas) { return { ok: false, pesan: 'Foto terlalu besar (' + teksBatas + ')' }; }
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
  if (hp.akunId !== undefined && String(baris.karyawan) !== String(hp.akunId)) { return { ok: false, pesan: 'Absen ini bukan milik akun ini' }; }
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
  const j = /-(\d{2})(\d{2})\d{2}-(?:T\d+|P|A)$/.exec(idAbsen);
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
  if (!/^[MPL]-[A-Za-z0-9]{1,20}-\d{6}-\d{6}-(?:T\d{1,3}|P)$/.test(idAbsen)) { return respon({ status: 'gagal', pesan: 'Id absen tidak valid' }); }
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


/**
 * ---- Password TIDAK peka huruf besar-kecil (owner dan admin) ----
 * Password dinormalisasi ke huruf kecil SEBELUM di-hash, saat dibuat/diganti maupun saat login
 * (ADMIN123, admin123, adMIN123 sama). Username sudah tidak peka; PIN hanya angka.
 * Migrasi tanpa reset massal: hash lama (password persis seperti dulu diketik) masih diterima SEKALI,
 * lalu pw_hash langsung diperbarui ke versi huruf kecil.
 */
function normalisasiPassword(pw) {
  return String(pw === undefined || pw === null ? '' : pw).toLowerCase();
}

/** Fungsi murni: hash password untuk DISIMPAN (versi huruf kecil). */
function hashPasswordBaru(pw, id, kodeRahasia) {
  return hashDenganGaram(normalisasiPassword(pw), String(id), kodeRahasia);
}

/**
 * Fungsi murni: cocokkan password yang diketik dengan hash tersimpan.
 * 1) hash versi huruf kecil; 2) kalau tidak cocok, hash password persis seperti diketik (versi lama).
 * Kembalian { cocok:false } (SATU kegagalan, setelah KEDUA pembandingan gagal) atau { cocok:true, migrasi, hashBaru }.
 */
function cocokkanPassword(password, id, kodeRahasia, hashTersimpan) {
  const hKecil = hashPasswordBaru(password, id, kodeRahasia);
  if (hKecil === hashTersimpan) { return { cocok: true, migrasi: false }; }
  const hAsli = hashDenganGaram(String(password === undefined || password === null ? '' : password), String(id), kodeRahasia);
  if (hAsli === hashTersimpan) { return { cocok: true, migrasi: true, hashBaru: hKecil }; }
  return { cocok: false };
}

/**
 * ---- Akun dan login HP PRIBADI (Gelombang 2) ----
 * KARYAWAN: PIN tepat 5 angka (angka apa pun boleh), dipakai di HP toko dan di login HP pribadi.
 * ADMIN: PIN 5 angka (absen di HP toko) DAN kata sandi minimal 8 karakter bebas (tidak peka huruf besar-kecil)
 *        untuk "Masuk sebagai Admin" di HP toko dan login HP pribadi. OWNER: tidak berubah (login terpisah).
 * Sesi HP pribadi = tiket acak, di sheet sesi hanya hash-nya (kolom perangkat berawalan "HPP"), TANPA kedaluwarsa
 * waktu (kolom kedaluwarsa kosong): berlaku sampai Log out atau dicabut (reset PIN, nonaktif, keluarkan semua
 * perangkat, atau atur ulang kata sandi). Satu akun boleh punya banyak sesi; tidak ada pengikatan akun ke HP.
 * Validasi sesi memakai cache 60 detik (kunci "sp_" + hash tiket); cache DIHAPUS saat sesi dicabut atau akun terkunci.
 */
var PESAN_PRIBADI_GAGAL = 'Nama atau PIN/kata sandi salah';
var PESAN_PRIBADI_TERKUNCI = 'Terlalu banyak percobaan salah. Akun terkunci, hubungi admin.';

/** Fungsi murni: jenis sesi dari kolom perangkat: TOKO (admin di HP toko), PRIBADI (HP pribadi), selain itu OWNER. */
function jenisSesi(barisSesi) {
  const p = String(barisSesi.perangkat);
  if (p.indexOf('HPTOKO') === 0) { return 'TOKO'; }
  if (p.indexOf('HPP') === 0) { return 'PRIBADI'; }
  return 'OWNER';
}

/** Fungsi murni: kata sandi admin minimal 8 karakter bebas (huruf/angka/campuran, angka berurutan boleh), maksimal 100. */
function validasiKataSandiAdmin(pw) {
  if (typeof pw !== 'string') { return { ok: false, pesan: 'Kata sandi wajib diisi' }; }
  if (pw.length < 8) { return { ok: false, pesan: 'Kata sandi minimal 8 karakter' }; }
  if (pw.length > 100) { return { ok: false, pesan: 'Kata sandi maksimal 100 karakter' }; }
  return { ok: true };
}

/** Fungsi murni: jalur kredensial pertama HANYA untuk ADMIN aktif, belum terkunci, ganti_pw TRUE, dan pw_hash kosong. */
function jalurKredensialAwalAdmin(akun) {
  if (!akun || akun.role !== 'ADMIN') { return { boleh: false }; }
  if (akun.aktif !== true || akun.terkunci === true) { return { boleh: false }; }
  if (String(akun.pw_hash) !== '' || akun.ganti_pw !== true) { return { boleh: false }; }
  return { boleh: true };
}

/** Fungsi murni: kunci cache validasi sesi (sp_ + hash tiket) untuk semua sesi aktif milik satu akun. */
function kunciCacheSesi(daftarSesi, akunId) {
  return daftarSesi
    .filter(function (r) { return String(r.akun) === String(akunId) && r.aktif === true; })
    .map(function (r) { return 'sp_' + r.token_hash; });
}

/**
 * Fungsi murni: boleh memutuskan (ACC/TOLAK) atau mengedit sebuah item konfirmasi?
 *  aktor = { role, id, cabang }; item = { karyawan (id pemilik pengajuan), cabang, role (role pemilik: KARYAWAN/ADMIN; kosong = KARYAWAN) }.
 *  Pembagian tugas: ADMIN hanya memutuskan pengajuan KARYAWAN di cabangnya sendiri (bukan miliknya sendiri);
 *  OWNER hanya memutuskan pengajuan level ADMIN (semua cabang). Selain itu ditolak, apa pun yang dikirim klien.
 */
function bolehMemutuskanKonfirmasi(aktor, item) {
  if (!aktor || !item) { return { boleh: false, pesan: 'Data tidak lengkap' }; }
  const rolePemilik = item.role || 'KARYAWAN';
  if (aktor.role === 'OWNER') {
    if (rolePemilik !== 'ADMIN') { return { boleh: false, pesan: 'Owner hanya memutuskan pengajuan admin. Pengajuan karyawan diputuskan oleh admin cabang.' }; }
    return { boleh: true };
  }
  if (aktor.role === 'ADMIN') {
    if (String(item.karyawan) === String(aktor.id)) { return { boleh: false, pesan: 'Admin tidak boleh memutuskan atau mengedit pengajuannya sendiri. Itu tugas owner.' }; }
    if (rolePemilik !== 'KARYAWAN') { return { boleh: false, pesan: 'Pengajuan admin diputuskan oleh owner' }; }
    if (item.cabang !== aktor.cabang) { return { boleh: false, pesan: 'Hanya boleh memutuskan pengajuan di cabang sendiri' }; }
    return { boleh: true };
  }
  return { boleh: false, pesan: 'Tidak punya hak memutuskan' };
}

/** Role pemilik sebuah pengajuan (KARYAWAN atau ADMIN) dari sheet akun; tidak ketemu = KARYAWAN (paling ketat untuk owner). */
function peranAkun(id) {
  const a = bacaSheet('akun').data.find(function (r) { return String(r.id) === String(id); });
  return a && a.role === 'ADMIN' ? 'ADMIN' : (a && a.role === 'OWNER' ? 'OWNER' : 'KARYAWAN');
}

/** Hapus cache validasi semua sesi aktif milik akun (tanpa mencabut sesi), mis. saat akun terkunci. */
function hapusCacheSesiAkun(akunId) {
  const kunci = kunciCacheSesi(bacaSesi().data, akunId);
  if (kunci.length) { CacheService.getScriptCache().removeAll(kunci); }
}

/** Sesi HP pribadi yang sah: { id, nama, panggilan, role, cabang, shift } atau null. Cache 60 detik. */
function validasiSesiPribadi(token) {
  if (!token || typeof token !== 'string' || token.length < 32 || token.length > 200) { return null; }
  if (!PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA')) { return null; }
  const cache = CacheService.getScriptCache();
  const kunci = 'sp_' + hashSesi(token);
  const ada = cache.get(kunci);
  if (ada) { return JSON.parse(ada); }
  const s = validasiSesi(token, null, 'PRIBADI');
  if (!s) { return null; }
  const a = s.akun;
  if (a.aktif !== true || a.terkunci === true || (a.role !== 'KARYAWAN' && a.role !== 'ADMIN')) { return null; }
  const hasil = { id: a.id, nama: a.nama, panggilan: a.panggilan, role: a.role, cabang: a.cabang, shift: a.shift };
  cache.put(kunci, JSON.stringify(hasil), 60);
  return hasil;
}

function responSesiPribadiHabis() {
  return respon({ status: 'gagal', kode: 'SESI_TIDAK_VALID', pesan: 'Sesi berakhir atau dicabut, silakan masuk lagi' });
}

function sidikNamaPribadi(nama) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'pribadi|' + String(nama || '').trim().toLowerCase())).slice(0, 24);
}

/** Nama tidak ada / akun tidak aktif / peran salah: pesan SAMA dengan kredensial salah; ditahan 15 menit (cache) setelah 5x. */
function gagalLoginPribadiPalsu(nama) {
  const r = catatGagalPalsu(CacheService.getScriptCache(), sidikNamaPribadi(nama), Date.now());
  return respon({ status: 'gagal', pesan: r.ditahan ? PESAN_PRIBADI_TERKUNCI : PESAN_PRIBADI_GAGAL });
}

function cariAkunPribadi(akun, namaMentah) {
  const n = String(namaMentah || '').trim().toLowerCase();
  if (!n) { return null; }
  return akun.data.find(function (r) { return String(r.nama).trim().toLowerCase() === n && (r.role === 'KARYAWAN' || r.role === 'ADMIN'); }) || null;
}

/** Cocokkan PIN (KARYAWAN) atau kata sandi (ADMIN) dengan hash tersimpan. { cocok, migrasi?, hashBaru?, tidakDihitung? } */
function cocokRahasiaPribadi(row, rahasia, kodeRahasia) {
  if (row.role === 'KARYAWAN') {
    if (!validasiPin(rahasia).ok) { return { cocok: false, tidakDihitung: true }; } // bukan 5 angka: tidak menaikkan hitungan salah
    return { cocok: hashDenganGaram(rahasia, String(row.id), kodeRahasia) === row.pin_hash };
  }
  if (String(row.pw_hash) === '' || rahasia === '') { return { cocok: false, tidakDihitung: rahasia === '' }; }
  return cocokkanPassword(rahasia, row.id, kodeRahasia, row.pw_hash);
}

function selesaikanLoginPribadi(row, d) {
  const sesi = buatSesi(row.id, 'HPP' + bersihkanIdPerangkat(d.id_perangkat), bersihkanLabel(d.label), null);
  return respon({ status: 'ok', sesi: sesi.token, id: row.id, nama: row.nama, panggilan: row.panggilan, role: row.role, cabang: row.cabang });
}

/**
 * Aksi login_pribadi { nama, rahasia, id_perangkat, label }. Server menentukan dari peran akun:
 * KARYAWAN memakai PIN 5 angka, ADMIN memakai kata sandi. Admin yang pw_hash-nya kosong dan ganti_pw TRUE
 * (diisi pemilik lewat sheet) dibalas perlu_kredensial_baru (belum login).
 */
function prosesLoginPribadi(d) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const rahasia = d.rahasia === undefined || d.rahasia === null ? '' : String(d.rahasia);
  if (rahasia.length > 100) { return respon({ status: 'gagal', pesan: PESAN_PRIBADI_GAGAL }); }
  const akun = bacaSheet('akun');
  const row = cariAkunPribadi(akun, d.nama);
  if (!row || row.aktif !== true) { return gagalLoginPribadiPalsu(d.nama); }

  if (jalurKredensialAwalAdmin(row).boleh) { return respon({ status: 'ok', perlu_kredensial_baru: true }); }
  if (row.terkunci === true) { return respon({ status: 'gagal', kode: 'TERKUNCI', pesan: PESAN_PRIBADI_TERKUNCI }); }

  const c = cocokRahasiaPribadi(row, rahasia, kodeRahasia);
  if (!c.cocok) {
    if (c.tidakDihitung) { return respon({ status: 'gagal', pesan: PESAN_PRIBADI_GAGAL }); }
    const salahBaru = (Number(row.salah_login) || 0) + 1;
    if (salahBaru >= 5) {
      perbaruiKolom(akun, row, { salah_login: salahBaru, terkunci: true });
      hapusCacheSesiAkun(row.id);
      tambahLog({ jenis: 'KEAMANAN', oleh: row.id, cabang: row.cabang, aksi: 'KUNCI_AKUN', target: 'akun', id: row.id, sebelum: 'terkunci=FALSE', sesudah: 'terkunci=TRUE', alasan: 'Salah PIN/kata sandi 5 kali saat login HP pribadi' });
      return respon({ status: 'gagal', kode: 'TERKUNCI', pesan: PESAN_PRIBADI_TERKUNCI });
    }
    perbaruiKolom(akun, row, { salah_login: salahBaru });
    return respon({ status: 'gagal', pesan: PESAN_PRIBADI_GAGAL });
  }
  const ubah = {};
  if (c.migrasi) { ubah.pw_hash = c.hashBaru; } // migrasi hash kata sandi ke huruf kecil
  if (Number(row.salah_login) !== 0) { ubah.salah_login = 0; }
  if (Object.keys(ubah).length) { perbaruiKolom(akun, row, ubah); }
  return selesaikanLoginPribadi(row, d);
}

/**
 * Aksi atur_kredensial_admin { nama, kata_sandi, pin, id_perangkat, label }: kredensial pertama ADMIN
 * (pw_hash kosong, ganti_pw TRUE; diisi pemilik lewat sheet). Kata sandi (min 8) dan PIN 5 angka dikirim
 * dalam SATU permintaan. Setelah berhasil: hash tersimpan, ganti_pw FALSE, sesi lama dicabut, sesi baru dibuat.
 */
function prosesAturKredensialAdmin(d) {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const akun = bacaSheet('akun');
  const row = cariAkunPribadi(akun, d.nama);
  if (!jalurKredensialAwalAdmin(row).boleh) { return respon({ status: 'gagal', pesan: PESAN_PRIBADI_GAGAL }); }
  const ks = validasiKataSandiAdmin(d.kata_sandi);
  if (!ks.ok) { return respon({ status: 'gagal', pesan: ks.pesan }); }
  const pin = validasiPin(d.pin);
  if (!pin.ok) { return respon({ status: 'gagal', pesan: pin.pesan }); }
  perbaruiKolom(akun, row, {
    pw_hash: hashPasswordBaru(d.kata_sandi, row.id, kodeRahasia),
    pin_hash: hashDenganGaram(d.pin, String(row.id), kodeRahasia),
    ganti_pw: false, salah_login: 0
  });
  cabutSesiAkun(row.id, '');
  tambahLog({ jenis: 'KEAMANAN', oleh: row.id, cabang: row.cabang, aksi: 'ATUR_KREDENSIAL_ADMIN', target: 'akun', id: row.id, alasan: 'Kata sandi dan PIN admin dibuat (login pertama atau pemulihan)' });
  return selesaikanLoginPribadi(row, d);
}

/** Aksi pribadi_profil { sesi }: memeriksa sesi dan mengembalikan profil singkat. */
function prosesPribadiProfil(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  return respon({ status: 'ok', id: p.id, nama: p.nama, panggilan: p.panggilan, role: p.role, cabang: p.cabang });
}

/** Aksi pribadi_keluarkan_semua { sesi }: cabut SEMUA sesi HP pribadi akun ini (termasuk yang ini). */
function prosesPribadiKeluarkanSemua(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  const n = cabutSesiAkun(p.id, '');
  tambahLog({ jenis: 'KEAMANAN', oleh: p.id, cabang: p.cabang, aksi: 'KELUARKAN_SEMUA_PERANGKAT', target: 'sesi', id: p.id, alasan: n + ' sesi dicabut' });
  return respon({ status: 'ok', jumlah: n });
}

/**
 * ---- Absen LUAR (HP pribadi) ----
 * ABSEN MASUK/PULANG di HP pribadi = absen luar. Jam dari tiket waktu (saat tombol ditekan; tiket terikat ke akun),
 * status (HADIR/TELAT, pulang cepat/normal/lembur, tingkat) memakai logika YANG SAMA dengan HP toko
 * (catatAbsenMasuk / catatAbsenPulang), shift mengikuti akun.
 * Kolom yang dipakai: cara_masuk / cara_pulang = LUAR; ket_masuk / ket_pulang = "LUAR: tujuan / keperluan"
 * (digabung dengan alasan telat / keterangan pulang dengan pemisah " | "); gps_masuk / gps_pulang = "lat,lng,akurasi";
 * acc_masuk / acc_pulang = MENUNGGU (nilai akhir: DITERIMA atau DITOLAK, diputuskan di Konfirmasi).
 * GPS WAJIB; akurasi buruk (> 100 m) tetap diterima dan hanya ditandai di Konfirmasi.
 */
var BATAS_AKURASI_TANDAI_M = 100;

/**
 * Fungsi murni: teks keterangan luar yang disimpan di kolom keterangan: "LUAR: keterangan".
 * dalamToko = true -> "LUAR [AREA TOKO]: keterangan" (penanda lokasi di dalam area toko; tanpa kolom baru).
 * Dua argumen pertama (tujuan, keperluan) tetap diterima supaya data lama "LUAR: tujuan / keperluan" bisa disusun ulang.
 */
function susunKetLuar(tujuan, keperluan, dalamToko) {
  const t = String(tujuan || '').trim(), k = String(keperluan || '').trim();
  const isi = t && k ? t + ' / ' + k : (t || k);
  if (!isi) { return ''; }
  return 'LUAR' + (dalamToko ? ' [AREA TOKO]' : '') + ': ' + isi;
}

/** Fungsi murni: uraikan potongan "LUAR..." dari kolom keterangan: { luar, dalamToko, teks (tanpa awalan), ketBersih }. */
function uraiKetLuar(ket) {
  const bagian = String(ket || '').split(' | ');
  let luar = false, dalamToko = false, teks = '';
  const sisa = [];
  bagian.forEach(function (b) {
    const m = /^LUAR( \[AREA TOKO\])?: ?([\s\S]*)$/.exec(b);
    if (m && !luar) { luar = true; dalamToko = !!m[1]; teks = m[2]; sisa.push('LUAR: ' + m[2]); } else { sisa.push(b); }
  });
  return { luar: luar, dalamToko: dalamToko, teks: teks, ketBersih: sisa.filter(function (x) { return x !== ''; }).join(' | ') };
}

/** Fungsi murni: keterangan absen luar: wajib minimal 5 karakter (setelah spasi dipotong), maksimal 100, tanpa karakter kontrol. Tanda | diganti /. */
function validasiKeteranganLuar(teks) {
  const t = String(teks === undefined || teks === null ? '' : teks).trim();
  if (t.length < 5) { return { ok: false, pesan: 'Keterangan wajib diisi, minimal 5 karakter' }; }
  if (t.length > 100) { return { ok: false, pesan: 'Keterangan maksimal 100 karakter' }; }
  if (/[\u0000-\u001f\u007f]/.test(t)) { return { ok: false, pesan: 'Keterangan mengandung karakter yang tidak boleh' }; }
  return { ok: true, teks: t.replace(/\s*\|\s*/g, ' / ') };
}

/** Fungsi murni: gabungkan potongan keterangan yang tidak kosong dengan " | ". */
function gabungKet() {
  return Array.prototype.slice.call(arguments).filter(function (x) { return String(x || '') !== ''; }).join(' | ');
}

/** Fungsi murni: ket_masuk setelah alasan telat diisi: alasan + bagian " | LUAR: ..." yang sudah ada. */
function ketSetelahAlasan(ketLama, alasanTeks) {
  const i = String(ketLama).indexOf(' | ');
  return alasanTeks + (i >= 0 ? String(ketLama).slice(i) : '');
}

/** Fungsi murni: nilai acc awal: absen luar selalu MENUNGGU. */
function accAwalLuar(luar) { return luar ? 'MENUNGGU' : ''; }

/** Fungsi murni: "lat,lng,akurasi" (lat dan lng di awal supaya mudah dibuka di peta). */
function teksGps(g) {
  return Number(g.lat.toFixed(6)) + ',' + Number(g.lng.toFixed(6)) + ',' + Math.round(g.akurasi);
}

/** Fungsi murni: akurasi (meter) dari teks "lat,lng,akurasi"; null kalau tidak terbaca. */
function akurasiDariGps(teks) {
  const p = String(teks || '').split(',');
  if (p.length < 3) { return null; }
  const a = Number(p[2]);
  return isFinite(a) ? a : null;
}

function akurasiBuruk(teks) {
  const a = akurasiDariGps(teks);
  return a !== null && a > BATAS_AKURASI_TANDAI_M;
}

/**
 * Fungsi murni: validasi absen luar (masuk, pulang, dan lembur). Keterangan WAJIB minimal 5 karakter
 * (setelah spasi dipotong) dan GPS WAJIB (tipe dan rentang divalidasi; akurasi buruk tidak menolak).
 */
function validasiAbsenLuar(d) {
  const k = validasiKeteranganLuar(d.keterangan);
  if (!k.ok) { return { ok: false, pesan: k.pesan }; }
  const g = d.gps;
  if (!g || typeof g.lat !== 'number' || typeof g.lng !== 'number' || typeof g.akurasi !== 'number' ||
      !isFinite(g.lat) || !isFinite(g.lng) || !isFinite(g.akurasi) ||
      Math.abs(g.lat) > 90 || Math.abs(g.lng) > 180 || g.akurasi < 0 || g.akurasi > 100000) {
    return { ok: false, pesan: 'Lokasi (GPS) wajib untuk absen luar' };
  }
  return { ok: true, keterangan: k.teks, gps: { lat: g.lat, lng: g.lng, akurasi: g.akurasi } };
}

/** Tulis teks ke satu sel sebagai TEKS biasa (supaya "lat,lng,akurasi" tidak dibaca Sheets sebagai angka/rumus). */
function tulisTeksSel(bacaan, nomorBaris, namaKolom, teks) {
  const kol = bacaan.header.indexOf(namaKolom) + 1;
  if (kol < 1) { return; }
  const sel = bacaan.sheet.getRange(nomorBaris, kol);
  sel.setNumberFormat('@');
  sel.setValue(teks);
}

function akunPribadiLengkap(p) {
  return bacaSheet('akun').data.find(function (r) { return String(r.id) === String(p.id) && r.aktif === true; }) || null;
}

/** Aksi tiket_waktu dengan sesi HP pribadi (tanpa token HP toko): tiket terikat ke akun. */
function prosesTiketPribadi(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  return prosesTiketWaktu(d.jenis, { cabang: p.cabang }, p.id);
}

/** Aksi absen_luar_masuk { sesi, tiket, keterangan (min. 5 karakter), gps:{lat,lng,akurasi}, tanpa_foto }. */
function prosesAbsenLuarMasuk(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const tk = periksaTiket(d.tiket, 'MASUK', p.cabang, kunci, Date.now(), p.id);
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }
  const v = validasiAbsenLuar(d);
  if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
  const akun = akunPribadiLengkap(p);
  if (!akun) { return responSesiPribadiHabis(); }
  return catatAbsenMasuk({ akun: akun, tk: tk, idHp: 'PRIBADI', tanpaFoto: d.tanpa_foto === true, luar: { keterangan: v.keterangan, gps: v.gps, dalamToko: dalamAreaTokoCabang(v.gps, p.cabang) } });
}

/** Aksi absen_luar_pulang { sesi, tiket, jenis: PULANG | PULANG_LEMBUR, keterangan (min. 5 karakter), gps, tanpa_foto }. */
function prosesAbsenLuarPulang(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  if (d.jenis !== 'PULANG' && d.jenis !== 'PULANG_LEMBUR') { return respon({ status: 'gagal', pesan: 'Jenis absen pulang tidak dikenal' }); }
  const kunci = kunciTiket();
  if (!kunci) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const tk = periksaTiket(d.tiket, d.jenis === 'PULANG_LEMBUR' ? 'LEMBUR' : 'PULANG', p.cabang, kunci, Date.now(), p.id);
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }
  const v = validasiAbsenLuar(d);
  if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
  const akun = akunPribadiLengkap(p);
  if (!akun) { return responSesiPribadiHabis(); }
  return catatAbsenPulang({ akun: akun, tk: tk, jenis: d.jenis, idHp: 'PRIBADI', tanpaFoto: d.tanpa_foto === true, luar: { keterangan: v.keterangan, gps: v.gps, dalamToko: dalamAreaTokoCabang(v.gps, p.cabang) } });
}

function prosesSimpanAlasanPribadi(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  return prosesSimpanAlasan(p.id, d.kode_alasan, d.alasan, { cabang: p.cabang });
}

function prosesSimpanPulangPribadi(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  return prosesSimpanPulang(p.id, d.kode_pending, d.keterangan, { cabang: p.cabang });
}

/** Aksi unggah_foto dengan sesi HP pribadi: hanya untuk absen milik akun itu. */
function prosesUnggahFotoPribadi(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  return prosesUnggahFoto(d, { cabang: p.cabang, akunId: p.id });
}

/** Fungsi murni: jam "HH:mm" dari teks tampilan sel (mis. "07:45", "7:45:00", "4:30:00 PM"). */
function jamDariTampilan(teks) {
  const m = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?/.exec(String(teks));
  if (!m) { return ''; }
  let h = Number(m[1]);
  const ap = m[3] ? m[3].toUpperCase() : '';
  if (ap === 'PM' && h < 12) { h += 12; }
  if (ap === 'AM' && h === 12) { h = 0; }
  return ('0' + h).slice(-2) + ':' + m[2];
}

/**
 * Fungsi murni: riwayat milik SATU akun: tanggal >= tanggalMulai, terbaru dulu, paling banyak `maks` baris.
 * rows = { tanggal 'yyyy-MM-dd', karyawan, masuk, pulang (jam teks), st_masuk, st_pulang, cara_masuk, cara_pulang, acc_masuk, acc_pulang }.
 */
function rakitRiwayat(rows, akunId, tanggalMulai, maks) {
  return rows
    .filter(function (r) { return String(r.karyawan) === String(akunId) && r.tanggal >= tanggalMulai; })
    .sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : (a.tanggal > b.tanggal ? -1 : 0); })
    .slice(0, maks)
    .map(function (r) {
      return {
        tanggal: r.tanggal, masuk: r.masuk, pulang: r.pulang, st_masuk: r.st_masuk, st_pulang: r.st_pulang,
        luar: r.cara_masuk === 'LUAR' || r.cara_pulang === 'LUAR',
        acc_masuk: r.cara_masuk === 'LUAR' ? r.acc_masuk : '', acc_pulang: r.acc_pulang
      };
    });
}

/** Baca baris absensi milik satu akun dari bawah ke atas (tidak membaca seluruh sheet): berhenti setelah lewat tanggalMulai. */
function bacaAbsensiAkun(akunId, tanggalMulai) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('absensi');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return []; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  const iMasuk = header.indexOf('masuk'), iPulang = header.indexOf('pulang');
  const hasil = [];
  let akhir = terakhir, dibaca = 0;
  while (akhir >= 2 && dibaca < 3000) {
    const awal = Math.max(2, akhir - 199);
    const rentang = sheet.getRange(awal, 1, akhir - awal + 1, lebar);
    const v = rentang.getValues(), tampil = rentang.getDisplayValues();
    let terlama = '9999-99-99';
    for (let i = v.length - 1; i >= 0; i--) {
      const r = {};
      header.forEach(function (nama, idx) { r[nama] = v[i][idx]; });
      const tgl = sebagaiTanggalTeks(r.tanggal, ZONA_ABSEN);
      if (String(tgl) < terlama) { terlama = String(tgl); }
      if (String(r.karyawan) === String(akunId)) {
        r.tanggal = String(tgl);
        r.masuk = String(r.masuk) === '' ? '' : jamDariTampilan(tampil[i][iMasuk]);
        r.pulang = String(r.pulang) === '' ? '' : jamDariTampilan(tampil[i][iPulang]);
        hasil.push(r);
      }
    }
    dibaca += v.length;
    if (terlama < tanggalMulai) { break; }
    akhir = awal - 1;
  }
  return hasil;
}

/** Aksi pribadi_hari_ini { sesi }: ringkasan absen hari ini (untuk beranda dan form pulang). */
function prosesPribadiHariIni(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  const hariIni = Utilities.formatDate(new Date(), ZONA_ABSEN, 'yyyy-MM-dd');
  const baris = bacaAbsensiAkun(p.id, hariIni).filter(function (r) { return r.tanggal === hariIni; })[0] || null;
  return respon({
    status: 'ok', tanggal: hariIni,
    sudah_masuk: !!baris && baris.masuk !== '', sudah_pulang: !!baris && baris.pulang !== '',
    jam_masuk: baris ? baris.masuk : '', jam_pulang: baris ? baris.pulang : '',
    cara_masuk: baris ? String(baris.cara_masuk) : '', st_pulang: baris ? String(baris.st_pulang) : '',
    lembur_boleh: lemburBolehPribadi(p, baris),
    izin_menunggu: jumlahIzinMenungguAman(p.id),
    tukar_masuk: jumlahTukarMasukAman(p.id)
  });
}

/** Aksi pribadi_keperluan_luar { sesi }: daftar pilihan keperluan absen luar (`KEPERLUAN_LUAR` di sheet pengaturan, urutan baris = urutan tampil). */
function prosesPribadiKeperluanLuar(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  return respon({ status: "ok", daftar: ambilDaftarPengaturan("KEPERLUAN_LUAR") });
}

/**
 * Apakah tombol LEMBUR di HP pribadi boleh aktif sekarang? Jam server + aturan yang SAMA dengan lembur HP toko
 * (tentukanStatusPulang): sudah absen masuk, sudah lewat jam pulang + toleransi + 1 menit, bukan setelah PULANG CEPAT, bukan ADMIN.
 */
function lemburBolehPribadi(p, baris) {
  try {
    if (!baris || p.role === 'ADMIN') { return false; }
    const shift = bacaShiftCabang(p.cabang).find(function (sh) { return String(sh.no) === String(baris.shift); }) || null;
    if (!shift) { return false; }
    if (shift.toleransi === null) { shift.toleransi = ambilNilaiUmum('toleransi_pulang_menit', 5); }
    return lemburBolehDariJam(waktuDariMs(Date.now()).detik, shift, String(baris.masuk) !== '', String(baris.pulang) !== '', String(baris.st_pulang));
  } catch (e) { return false; }
}

/** Fungsi murni: lembur boleh dicatat pada jam itu? (aturan yang sama dengan absen lembur HP toko). */
function lemburBolehDariJam(detik, shift, sudahMasuk, sudahPulang, stPulang) {
  return tentukanStatusPulang(detik, shift, 'PULANG_LEMBUR', sudahMasuk, sudahPulang, stPulang).ok === true;
}

/** Aksi pribadi_riwayat { sesi }: milik sendiri, 31 hari terakhir, paling banyak 50 baris. */
function prosesPribadiRiwayat(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return responSesiPribadiHabis(); }
  const mulai = Utilities.formatDate(new Date(Date.now() - 31 * 86400000), ZONA_ABSEN, 'yyyy-MM-dd');
  return respon({ status: 'ok', daftar: rakitRiwayat(bacaAbsensiAkun(p.id, mulai), p.id, mulai, 50) });
}

/**
 * ---- Konfirmasi (ACC / TOLAK) ----
 * Item = absen yang menunggu keputusan: acc_masuk = MENUNGGU (absen luar masuk) atau acc_pulang = MENUNGGU
 * (absen luar pulang, lembur, pulang cepat). Satu baris absensi bisa menghasilkan dua item (masuk dan pulang).
 * Kelompok: LUAR (absen luar masuk/pulang), LEMBUR (LEMBUR DI TOKO), PULANG_CEPAT (PULANG CEPAT).
 * Id item = "ID karyawan|yyyy-MM-dd|MASUK atau PULANG" (satu baris per karyawan per hari).
 * Hak (ditegakkan di server): ADMIN hanya cabangnya dan BUKAN absennya sendiri; OWNER semua cabang termasuk milik admin.
 * Hanya SATU keputusan per item (hanya yang masih MENUNGGU bisa diputuskan). Dicatat di log.
 * Yang dibaca hanya baris-baris terakhir sheet absensi (maksimal MAKS_BARIS_KONFIRMASI baris).
 */
var MAKS_BARIS_KONFIRMASI = 2000;
var UKURAN_HALAMAN_KONFIRMASI = 20;
var URUTAN_KELOMPOK = { LUAR: 0, LEMBUR: 1, PULANG_CEPAT: 2, IZIN: 3, TUKAR: 4, SHIFT_BEDA: 5, KONFLIK: 6, LUPA: 7 };

/** Fungsi murni: id item dipecah {karyawan, tanggal, jenis}; null kalau bentuknya tidak sah. */
function parseIdItem(id) {
  const m = /^([A-Za-z0-9]{1,20})\|(\d{4}-\d{2}-\d{2})\|(MASUK|PULANG)$/.exec(String(id || ''));
  return m ? { karyawan: m[1], tanggal: m[2], jenis: m[3] } : null;
}

/** Fungsi murni: hanya item yang MASIH menunggu yang bisa diputuskan (satu keputusan per item). */
function bisaDiputuskan(accSekarang) { return String(accSekarang) === 'MENUNGGU'; }

/** Fungsi murni: tampilan jumlah: maksimal 99, lebih dari itu "99+". */
function jumlahTeks(n) { return n > 99 ? '99+' : String(n); }

/** Fungsi murni: tautan Google Maps dari "lat,lng,akurasi"; null kalau tidak valid. */
function urlMaps(gpsTeks) {
  const p = String(gpsTeks || '').split(',');
  if (p.length < 2) { return null; }
  const lat = Number(p[0]), lng = Number(p[1]);
  if (p[0].trim() === '' || p[1].trim() === '' || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { return null; }
  return 'https://www.google.com/maps?q=' + lat + ',' + lng;
}

/** Fungsi murni: ID berkas Drive dari tautan di kolom foto; null untuk kosong / TANPA FOTO / tidak dikenal. */
function idBerkasDrive(tautan) {
  const t = String(tautan || '');
  const m = /\/d\/([A-Za-z0-9_-]{10,})/.exec(t) || /[?&]id=([A-Za-z0-9_-]{10,})/.exec(t);
  return m ? m[1] : null;
}

/** Fungsi murni: kelompok sebuah item pulang. */
function kelompokItem(jenis, baris) {
  if (jenis === 'MASUK') { return String(baris.cara_masuk) !== 'LUAR' && String(baris.tanda || '').indexOf('SHIFT_BEDA') >= 0 ? 'SHIFT_BEDA' : 'LUAR'; }
  if (String(baris.cara_pulang) === 'LUAR') { return 'LUAR'; }
  if (baris.st_pulang === 'LEMBUR DI TOKO') { return 'LEMBUR'; }
  if (baris.st_pulang === 'PULANG CEPAT') { return 'PULANG_CEPAT'; }
  return '';
}

/**
 * Fungsi murni: dari baris absensi jadi item konfirmasi (maksimal dua per baris, masuk dan pulang terpisah).
 * baris: tanggal 'yyyy-MM-dd', karyawan, nama, cabang, shift, jam_masuk, jam_pulang, cara_masuk, cara_pulang, acc_masuk, acc_pulang,
 * st_masuk, telat_mnt, st_pulang, lembur ("tingkat|menit"), ket_masuk, ket_pulang, foto_masuk, foto_pulang, gps_masuk, gps_pulang.
 */
function rakitItemKonfirmasi(rows, petaRole) {
  const items = [];
  rows.forEach(function (b) {
    const buat = function (jenis) {
      const masuk = jenis === 'MASUK';
      const gps = String((masuk ? b.gps_masuk : b.gps_pulang) || '');
      const foto = String((masuk ? b.foto_masuk : b.foto_pulang) || '');
      const kelompok = kelompokItem(jenis, b);
      if (!kelompok) { return; }
      const lem = /^(\d+)\|(\d+)$/.exec(String(b.lembur));
      const ket = uraiKetLuar(String((masuk ? b.ket_masuk : b.ket_pulang) || ''));
      items.push({
        id: b.karyawan + '|' + b.tanggal + '|' + jenis, jenis: jenis, kelompok: kelompok,
        karyawan: b.karyawan, nama: b.nama, cabang: b.cabang, tanggal: b.tanggal, shift: b.shift, tanda: String(b.tanda || ''),
        jam: masuk ? b.jam_masuk : b.jam_pulang,
        status: masuk ? b.st_masuk : b.st_pulang,
        ket: ket.ketBersih, ket_edit: ket.teks, dalam_area_toko: ket.dalamToko,
        role: (petaRole && petaRole[b.karyawan]) || 'KARYAWAN', luar: String(masuk ? b.cara_masuk : b.cara_pulang) === 'LUAR',
        tingkat: !masuk && lem ? Number(lem[1]) : 0, durasi_menit: !masuk && lem ? Number(lem[2]) : 0,
        gps: gps, akurasi: akurasiDariGps(gps), akurasi_buruk: akurasiBuruk(gps), maps: urlMaps(gps),
        foto: foto === '' ? 'BELUM' : (foto === TEKS_TANPA_FOTO ? 'TANPA' : 'ADA')
      });
    };
    if (String(b.acc_masuk) === 'MENUNGGU') { buat('MASUK'); }
    if (String(b.acc_pulang) === 'MENUNGGU') { buat('PULANG'); }
  });
  return items;
}

/** Fungsi murni: item yang boleh dilihat aktor = item yang boleh diputuskannya. ADMIN: pengajuan KARYAWAN di cabangnya (bukan miliknya sendiri);
 * OWNER: hanya pengajuan ADMIN (boleh difilter cabang). */
function saringItemKonfirmasi(items, aktor, filterCabang) {
  return items.filter(function (it) {
    if (!bolehMemutuskanKonfirmasi(aktor, { karyawan: it.karyawan, cabang: it.cabang, role: it.role }).boleh) { return false; }
    return !(aktor.role === 'OWNER' && filterCabang && it.cabang !== filterCabang);
  });
}

/** Fungsi murni: satu halaman (maksimal 20 kartu): kelompok dulu (Luar, Lembur, Pulang cepat), lalu terbaru dulu. */
function halamanKonfirmasi(items, offset, ukuran) {
  const urut = items.slice().sort(function (a, b) {
    if (URUTAN_KELOMPOK[a.kelompok] !== URUTAN_KELOMPOK[b.kelompok]) { return URUTAN_KELOMPOK[a.kelompok] - URUTAN_KELOMPOK[b.kelompok]; }
    const ka = a.tanggal + ' ' + (a.jam || ''), kb = b.tanggal + ' ' + (b.jam || '');
    return ka < kb ? 1 : (ka > kb ? -1 : 0);
  });
  const mulai = Math.max(0, Number(offset) || 0);
  return { daftar: urut.slice(mulai, mulai + ukuran), total: urut.length, ada_lagi: mulai + ukuran < urut.length };
}

/** Baca baris absensi dari bawah ke atas (maksimal MAKS_BARIS_KONFIRMASI) yang masih menunggu (masuk atau pulang). */
function bacaAbsensiMenunggu() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('absensi');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return []; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  const iMasuk = header.indexOf('masuk'), iPulang = header.indexOf('pulang');
  const hasil = [];
  let akhir = terakhir, dibaca = 0;
  while (akhir >= 2 && dibaca < MAKS_BARIS_KONFIRMASI) {
    const awal = Math.max(2, akhir - 199);
    const rentang = sheet.getRange(awal, 1, akhir - awal + 1, lebar);
    const v = rentang.getValues(), tampil = rentang.getDisplayValues();
    for (let i = v.length - 1; i >= 0; i--) {
      const r = {};
      header.forEach(function (nama, idx) { r[nama] = v[i][idx]; });
      if (String(r.acc_masuk) !== 'MENUNGGU' && String(r.acc_pulang) !== 'MENUNGGU') { continue; }
      r.tanggal = String(sebagaiTanggalTeks(r.tanggal, ZONA_ABSEN));
      r.jam_masuk = String(r.masuk) === '' ? '' : jamDariTampilan(tampil[i][iMasuk]);
      r.jam_pulang = String(r.pulang) === '' ? '' : jamDariTampilan(tampil[i][iPulang]);
      r._baris = awal + i;
      hasil.push(r);
    }
    dibaca += v.length;
    akhir = awal - 1;
  }
  return hasil;
}

/** Cari satu baris absensi (karyawan + tanggal) dari bawah ke atas; kembalikan { bacaan, baris } atau null. */
function cariBarisAbsensi(karyawan, tanggal) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('absensi');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return null; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  let akhir = terakhir, dibaca = 0;
  while (akhir >= 2 && dibaca < MAKS_BARIS_KONFIRMASI * 2) {
    const awal = Math.max(2, akhir - 199);
    const v = sheet.getRange(awal, 1, akhir - awal + 1, lebar).getValues();
    for (let i = v.length - 1; i >= 0; i--) {
      const r = {};
      header.forEach(function (nama, idx) { r[nama] = v[i][idx]; });
      if (String(r.karyawan) === String(karyawan) && String(sebagaiTanggalTeks(r.tanggal, ZONA_ABSEN)) === tanggal) {
        r._baris = awal + i;
        return { bacaan: { sheet: sheet, header: header }, baris: r };
      }
    }
    dibaca += v.length;
    akhir = awal - 1;
  }
  return null;
}

/** Siapa yang bertindak: OWNER (sesi owner), ADMIN HP toko (token + sesi), atau ADMIN HP pribadi (sesi). { aktor } atau { gagal }. */
function aktorKonfirmasi(d) {
  if (!d.token) {
    const o = validasiSesi(d.sesi, 'OWNER');
    if (o) { return { aktor: { role: 'OWNER', id: o.akun.id, cabang: '' } }; }
  }
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a; }
  return { aktor: { role: 'ADMIN', id: a.s.akun.id, cabang: a.s.akun.cabang } };
}

function itemUntukAktor(aktor, filterCabang) {
  const petaRole = {};
  bacaSheet('akun').data.forEach(function (r) { petaRole[String(r.id)] = r.role === 'ADMIN' ? 'ADMIN' : (r.role === 'OWNER' ? 'OWNER' : 'KARYAWAN'); });
  const izinSemua = bacaIzinTernormalisasi().data, petaIzin = petaAkunUntukIzin();
  const izinItems = rakitItemIzin(izinSemua, petaIzin).concat(rakitItemTukar(izinSemua, petaIzin));
  let koreksi = [];
  try { koreksi = itemKoreksiAbsen(); } catch (e) { koreksi = []; } // gagal membaca log/absensi tidak boleh mematikan Konfirmasi
  return saringItemKonfirmasi(rakitItemKonfirmasi(bacaAbsensiMenunggu(), petaRole).concat(izinItems).concat(koreksi), aktor, filterCabang);
}

/** Aksi konfirmasi_jumlah: jumlah item yang menunggu (untuk badge menu; maksimal 99+). */
function prosesKonfirmasiJumlah(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return k.gagal; }
  const n = itemUntukAktor(k.aktor, '').length;
  return respon({ status: 'ok', jumlah: n, jumlah_teks: jumlahTeks(n) });
}

/** Aksi konfirmasi_daftar { offset?, cabang? }: satu halaman (maksimal 20 kartu), hanya yang MENUNGGU. */
function prosesKonfirmasiDaftar(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return k.gagal; }
  const filter = k.aktor.role === 'OWNER' && d.cabang ? String(d.cabang).slice(0, 60) : '';
  const semua = itemUntukAktor(k.aktor, filter);
  const h = halamanKonfirmasi(semua, d.offset, UKURAN_HALAMAN_KONFIRMASI);
  return respon({ status: 'ok', daftar: h.daftar, total: h.total, jumlah_teks: jumlahTeks(h.total), ada_lagi: h.ada_lagi });
}

/** Aksi konfirmasi_putuskan { id, keputusan: ACC | TOLAK }: satu keputusan per item, dicatat di log. */
function prosesKonfirmasiPutuskan(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return k.gagal; }
  if (d.keputusan !== 'ACC' && d.keputusan !== 'TOLAK') { return respon({ status: 'gagal', pesan: 'Keputusan tidak dikenal' }); }
  if (String(d.id || '').indexOf('IZIN|') === 0) { return putuskanItemIzin(k.aktor, d); }
  if (String(d.id || '').indexOf('TUKAR|') === 0) { return putuskanItemTukar(k.aktor, d); }
  if (/^(LUPA|KONFLIK)\|/.test(String(d.id || ''))) { return respon({ status: 'gagal', pesan: 'Item ini diselesaikan lewat layar rinciannya, bukan ACC atau Tolak' }); }
  const it = parseIdItem(d.id);
  if (!it) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
  const kunciLock = LockService.getScriptLock();
  kunciLock.waitLock(10000);
  try {
    const cari = cariBarisAbsensi(it.karyawan, it.tanggal);
    if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
    const kolomAcc = it.jenis === 'MASUK' ? 'acc_masuk' : 'acc_pulang';
    const izin = bolehMemutuskanKonfirmasi(k.aktor, { karyawan: cari.baris.karyawan, cabang: cari.baris.cabang, role: peranAkun(cari.baris.karyawan) });
    if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }
    if (!bisaDiputuskan(cari.baris[kolomAcc])) { return respon({ status: 'gagal', pesan: 'Item ini sudah diputuskan' }); }
    const baru = d.keputusan === 'ACC' ? 'DITERIMA' : 'DITOLAK';
    const ubah = {}; ubah[kolomAcc] = baru;
    perbaruiKolom(cari.bacaan, cari.baris, ubah);
    tambahLog({
      jenis: 'KONFIRMASI', oleh: k.aktor.id, cabang: cari.baris.cabang, aksi: d.keputusan === 'ACC' ? 'ACC_ABSEN' : 'TOLAK_ABSEN',
      target: cari.baris.nama + ' ' + it.jenis + ' ' + it.tanggal, id: cari.baris.karyawan, sebelum: kolomAcc + '=MENUNGGU', sesudah: kolomAcc + '=' + baru
    });
    return respon({ status: 'ok', keputusan: baru });
  } finally {
    kunciLock.releaseLock();
  }
}

/**
 * ---- Penanda "di dalam area toko" untuk absen luar ----
 * Koordinat absen luar dibandingkan dengan koordinat toko cabang itu (gps_daftar semua HP toko AKTIF cabang itu saat didaftarkan,
 * ditambah titik LOKASI di sheet pengaturan bila ada). Radius = pengaturan UMUM `radius_tanda_toko_m` (bawaan 100 m).
 * Di dalam radius: absen TETAP diterima dan menunggu ACC, tetapi ditandai di kolom keterangan: "LUAR [AREA TOKO]: ...".
 */
function titikDariGps(teks) {
  const p = String(teks || '').split(',');
  if (p.length < 2 || p[0].trim() === '' || p[1].trim() === '') { return null; }
  const lat = Number(p[0]), lng = Number(p[1]);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { return null; }
  return { lat: lat, lng: lng };
}

/** Fungsi murni: apakah gps { lat, lng } berada dalam radius (meter) dari salah satu titik toko? */
function dalamRadiusToko(gps, titik, radius) {
  return (titik || []).some(function (t) { return jarakMeter(gps.lat, gps.lng, t.lat, t.lng) <= radius; });
}

function titikTokoCabang(cabang) {
  const hasil = [];
  const sama = function (x) { return String(x).trim().toLowerCase() === String(cabang).trim().toLowerCase(); };
  bacaSheet('akun').data.forEach(function (r) {
    if (r.role === 'PERANGKAT' && r.aktif === true && sama(r.cabang)) {
      const t = titikDariGps(r.gps_daftar);
      if (t) { hasil.push(t); }
    }
  });
  const lok = ambilLokasiCabang(cabang);
  if (lok) { hasil.push(lok); }
  return hasil;
}

/** Gagal membaca sheet tidak boleh menggagalkan absen: dianggap tidak di area toko. */
function dalamAreaTokoCabang(gps, cabang) {
  try {
    return dalamRadiusToko(gps, titikTokoCabang(cabang), ambilNilaiUmum('radius_tanda_toko_m', 100));
  } catch (e) { return false; }
}

/**
 * ---- Edit pengajuan absen luar di Konfirmasi ----
 * Yang boleh diubah: jam dan keterangan. Jenis (masuk/pulang/lembur) tetap. Status dan tingkat lembur dihitung ulang
 * dengan fungsi yang sama seperti absen biasa; pengajuan tetap MENUNGGU.
 */
/** Fungsi murni: jam "HH:mm" pada tanggal itu (waktu Jakarta) tidak melewati sekarangMs. */
function jamTidakMelewati(tanggal, jam, sekarangMs) {
  const ms = Date.parse(tanggal + 'T' + jam + ':00+07:00');
  return isFinite(ms) && ms <= sekarangMs;
}

/** Fungsi murni: kolom keterangan setelah edit: alasan lama (kalau masih perlu) + bagian luar yang baru. */
function ketSetelahEdit(ketLama, ketLuarBaru, perluAlasan) {
  const alasan = String(ketLama || '').split(' | ').filter(function (x) { return x !== '' && x.indexOf('LUAR') !== 0; })[0] || '';
  return gabungKet(perluAlasan ? (alasan || 'TIDAK DIISI') : '', ketLuarBaru);
}

/**
 * Fungsi murni: rencana perubahan kolom untuk satu edit.
 * p = { jenis 'MASUK'|'PULANG', tanggal, jamBaru 'HH:mm', keterangan, sekarangMs, jendelaMenit,
 *       shift { masuk, tutup, pulang, toleransi }, jamMasuk, jamPulang (jam tampilan baris sekarang, kosong kalau belum ada),
 *       stMasuk, stPulang (status sekarang), ketLama }
 * Hasil: { ok:false, pesan } atau { ok:true, perubahan:{kolom:nilai}, sebelum, sesudah }.
 */
function rencanaEditAbsen(p) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.jamBaru || ''))) { return { ok: false, pesan: 'Jam harus berbentuk JJ:MM, contoh 07:45' }; }
  const k = validasiKeteranganLuar(p.keterangan);
  if (!k.ok) { return { ok: false, pesan: k.pesan }; }
  if (!jamTidakMelewati(p.tanggal, p.jamBaru, p.sekarangMs)) { return { ok: false, pesan: 'Jam tidak boleh melewati jam sekarang' }; }
  if (!p.shift) { return { ok: false, pesan: 'Jadwal shift karyawan tidak ditemukan, hubungi admin' }; }
  const detik = jamKeDetik(p.jamBaru);
  const lama = uraiKetLuar(p.ketLama);
  const ketLuar = susunKetLuar(k.teks, '', lama.dalamToko);
  if (p.jenis === 'MASUK') {
    if (p.jamPulang && p.jamBaru >= p.jamPulang) { return { ok: false, pesan: 'Jam masuk harus sebelum jam pulang (' + p.jamPulang + ')' }; }
    const st = tentukanStatusMasuk(detik, p.shift, p.jendelaMenit);
    if (!st.ok) { return { ok: false, pesan: st.pesan }; }
    const telat = st.st_masuk === 'TELAT';
    return {
      ok: true,
      perubahan: { masuk: p.jamBaru, st_masuk: st.st_masuk, telat_mnt: st.telat_mnt, ket_masuk: ketSetelahEdit(p.ketLama, ketLuar, telat), acc_masuk: 'MENUNGGU' },
      sebelum: 'masuk=' + p.jamMasuk + '; st=' + p.stMasuk + '; ket=' + p.ketLama,
      sesudah: 'masuk=' + p.jamBaru + '; st=' + st.st_masuk + (telat ? ' ' + st.telat_mnt + ' mnt' : '') + '; ket=' + ketSetelahEdit(p.ketLama, ketLuar, telat)
    };
  }
  if (p.jenis === 'PULANG') {
    if (p.jamMasuk && p.jamBaru <= p.jamMasuk) { return { ok: false, pesan: 'Jam pulang harus setelah jam masuk (' + p.jamMasuk + ')' }; }
    const jenis = p.stPulang === 'LEMBUR DI TOKO' ? 'PULANG_LEMBUR' : 'PULANG';
    const h = tentukanStatusPulang(detik, p.shift, jenis, true, false, '');
    if (!h.ok) { return { ok: false, pesan: h.pesan }; }
    const lembur = h.st_pulang === 'LEMBUR DI TOKO' ? h.tingkat + '|' + h.durasi_menit : '';
    const ketBaru = ketSetelahEdit(p.ketLama, ketLuar, !!h.keterangan);
    return {
      ok: true,
      perubahan: { pulang: p.jamBaru, st_pulang: h.st_pulang, lembur: lembur, ket_pulang: ketBaru, acc_pulang: 'MENUNGGU' },
      sebelum: 'pulang=' + p.jamPulang + '; st=' + p.stPulang + '; ket=' + p.ketLama,
      sesudah: 'pulang=' + p.jamBaru + '; st=' + h.st_pulang + (lembur ? ' ' + lembur : '') + '; ket=' + ketBaru
    };
  }
  return { ok: false, pesan: 'Jenis tidak dikenal' };
}

/** Fungsi murni: alasan mengubah pengajuan wajib minimal 5 karakter (setelah spasi dipotong), maksimal 100; dicatat di kolom alasan sheet log. */
function validasiAlasanEdit(teks) {
  const t = String(teks === undefined || teks === null ? '' : teks).replace(/[\u0000-\u001f\u007f|]/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length < 5) { return { ok: false, pesan: 'Alasan mengubah wajib diisi minimal 5 karakter' }; }
  if (t.length > 100) { return { ok: false, pesan: 'Alasan maksimal 100 karakter' }; }
  return { ok: true, alasan: t };
}

/** Aksi konfirmasi_edit { id, jam 'HH:mm', keterangan, alasan }: edit jam dan keterangan satu pengajuan absen luar yang masih MENUNGGU. */
function prosesKonfirmasiEdit(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return k.gagal; }
  const it = parseIdItem(d.id);
  if (!it) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
  const al = validasiAlasanEdit(d.alasan);
  if (!al.ok) { return respon({ status: 'gagal', pesan: al.pesan }); }
  const kunciLock = LockService.getScriptLock();
  kunciLock.waitLock(10000);
  try {
    const cari = cariBarisAbsensi(it.karyawan, it.tanggal);
    if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
    const b = cari.baris;
    const izin = bolehMemutuskanKonfirmasi(k.aktor, { karyawan: b.karyawan, cabang: b.cabang, role: peranAkun(b.karyawan) });
    if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }
    const masuk = it.jenis === 'MASUK';
    if (!bisaDiputuskan(masuk ? b.acc_masuk : b.acc_pulang)) {
      return respon({ status: 'gagal', pesan: 'Pengajuan yang sudah diputuskan (di-ACC atau ditolak) tidak bisa diedit' });
    }
    if (String(masuk ? b.cara_masuk : b.cara_pulang) !== 'LUAR') {
      return respon({ status: 'gagal', pesan: 'Hanya pengajuan absen luar yang bisa diedit' });
    }
    const tampil = function (kolom) {
      const idx = cari.bacaan.header.indexOf(kolom);
      return idx === -1 ? '' : jamDariTampilan(cari.bacaan.sheet.getRange(b._baris, idx + 1).getDisplayValue());
    };
    const shift = bacaShiftCabang(b.cabang).find(function (sh) { return String(sh.no) === String(b.shift); }) || null;
    if (shift && shift.toleransi === null) { shift.toleransi = ambilNilaiUmum('toleransi_pulang_menit', 5); }
    const rencana = rencanaEditAbsen({
      jenis: it.jenis, tanggal: it.tanggal, jamBaru: String(d.jam || '').trim(), keterangan: d.keterangan, sekarangMs: Date.now(),
      jendelaMenit: ambilNilaiUmum('jendela_absen_menit', 60), shift: shift,
      jamMasuk: String(b.masuk) === '' ? '' : tampil('masuk'), jamPulang: String(b.pulang) === '' ? '' : tampil('pulang'),
      stMasuk: String(b.st_masuk), stPulang: String(b.st_pulang), ketLama: String(masuk ? b.ket_masuk : b.ket_pulang)
    });
    if (!rencana.ok) { return respon({ status: 'gagal', pesan: rencana.pesan }); }
    perbaruiKolom(cari.bacaan, b, rencana.perubahan);
    tambahLog({
      jenis: 'KONFIRMASI', oleh: k.aktor.id, cabang: b.cabang, aksi: 'EDIT_ABSEN',
      target: b.nama + ' ' + it.jenis + ' ' + it.tanggal, id: b.karyawan, sebelum: rencana.sebelum, sesudah: rencana.sesudah, alasan: al.alasan
    });
    return respon({ status: 'ok', pesan: 'Pengajuan diperbarui dan tetap menunggu ACC' });
  } finally {
    kunciLock.releaseLock();
  }
}

/** Aksi ambil_foto { id }: baca satu foto dari Drive (tidak publik) dan kirim sebagai base64, hanya untuk yang berhak. */
function prosesAmbilFoto(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return k.gagal; }
  if (String(d.id || '').indexOf('IZIN|') === 0) { return ambilSuratItemIzin(k.aktor, d); }
  if (String(d.id || '').indexOf('TUKAR|') === 0) { return respon({ status: 'ok', foto: null, teks: 'Tukar shift tidak memakai foto' }); }
  if (/^(LUPA|KONFLIK)\|/.test(String(d.id || ''))) { return respon({ status: 'ok', foto: null, teks: 'Tidak ada foto di sini' }); }
  const it = parseIdItem(d.id);
  if (!it) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
  const cari = cariBarisAbsensi(it.karyawan, it.tanggal);
  if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
  const izin = bolehMemutuskanKonfirmasi(k.aktor, { karyawan: cari.baris.karyawan, cabang: cari.baris.cabang, role: peranAkun(cari.baris.karyawan) }); // hak lihat = hak putuskan
  if (!izin.boleh) { return respon({ status: 'gagal', pesan: izin.pesan }); }
  const tautan = String(it.jenis === 'MASUK' ? cari.baris.foto_masuk : cari.baris.foto_pulang);
  if (tautan === '') { return respon({ status: 'ok', foto: null, teks: 'Foto belum ada' }); }
  if (tautan === TEKS_TANPA_FOTO) { return respon({ status: 'ok', foto: null, teks: TEKS_TANPA_FOTO }); }
  const idBerkas = idBerkasDrive(tautan);
  if (!idBerkas) { return respon({ status: 'ok', foto: null, teks: 'Foto tidak bisa dibuka' }); }
  try {
    const blob = DriveApp.getFileById(idBerkas).getBlob();
    const bytes = blob.getBytes();
    if (bytes.length > 400 * 1024) { return respon({ status: 'ok', foto: null, teks: 'Foto terlalu besar untuk ditampilkan' }); }
    return respon({ status: 'ok', foto: 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes) });
  } catch (e) {
    return respon({ status: 'ok', foto: null, teks: 'Foto tidak bisa dibuka' });
  }
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
    if (String(r.cabang).trim().toLowerCase() !== String(cabang).trim().toLowerCase()) continue;
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


/**
 * ======================= FITUR A: IZIN DAN CUTI =======================
 * Sheet izin: id, grup, karyawan, jenis, kelompok (biasa/khusus/cuti), mulai, selesai, hari, ket, lampiran, diajukan, telat_aju,
 * status (MENUNGGU/DITERIMA/DITOLAK/BATAL), oleh, diputus, rekan, status_rekan, shift_asal, shift_tujuan.
 * Satu pengajuan = satu grup (IZN-{tahun}-{4 angka}); tiap baris punya huruf akhir (-A, -B) bila pengajuan terbelah
 * (contoh Menikah 5 hari kerja = 3 hari izin khusus + 2 hari cuti). Semua tanggal/jam dari jam SERVER.
 * Fungsi murni di bagian ini bisa dites tanpa menyentuh sheet (lihat tesServer).
 */
var MAKS_RENTANG_IZIN_HARI = 31;
var MAKS_SURAT_BYTE = 500 * 1024;
var STATUS_IZIN_AKTIF = ['MENUNGGU', 'DITERIMA'];

/** Fungsi murni: teks tanggal yyyy-MM-dd yang benar-benar ada di kalender. */
function tanggalIzinSah(t) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(t === undefined || t === null ? '' : t));
  if (!m) { return false; }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

/**
 * Fungsi murni: tanggal pengajuan. Mundur maksimal batasLewat hari dari hari ini (bawaan 2); selesai tidak boleh sebelum mulai;
 * satu pengajuan maksimal MAKS_RENTANG_IZIN_HARI hari; maksimal 366 hari ke depan. telat_aju = mulai sudah lewat dari hari ini.
 */
function validasiTanggalIzin(mulai, selesai, hariIni, batasLewat) {
  if (!tanggalIzinSah(mulai) || !tanggalIzinSah(selesai)) { return { ok: false, pesan: 'Tanggal mulai dan selesai wajib diisi dengan benar' }; }
  if (selesai < mulai) { return { ok: false, pesan: 'Tanggal selesai tidak boleh sebelum tanggal mulai' }; }
  if (selisihHari(mulai, selesai) + 1 > MAKS_RENTANG_IZIN_HARI) { return { ok: false, pesan: 'Satu pengajuan maksimal ' + MAKS_RENTANG_IZIN_HARI + ' hari. Pecah jadi beberapa pengajuan.' }; }
  const batas = isNaN(Number(batasLewat)) ? 2 : Number(batasLewat);
  if (mulai < geserTanggal(hariIni, -batas)) { return { ok: false, pesan: 'Izin untuk tanggal yang sudah lewat hanya bisa maksimal ' + batas + ' hari ke belakang' }; }
  if (selesai > geserTanggal(hariIni, 366)) { return { ok: false, pesan: 'Tanggal terlalu jauh ke depan (maksimal 1 tahun)' }; }
  return { ok: true, telat_aju: mulai < hariIni };
}

/** Fungsi murni: daftar tanggal TERJADWAL kerja (bukan libur, ada shift) milik satu akun dalam rentang; memakai jadwalKaryawanHari. */
function hariTerjadwalRentang(akun, mulai, selesai, kalender, liburMinggu) {
  const hasil = [];
  const n = selisihHari(mulai, selesai);
  for (let i = 0; i <= n && i < 400; i++) {
    const t = geserTanggal(mulai, i);
    const j = jadwalKaryawanHari(akun, t, kalender, liburMinggu === true);
    if (!j.libur && j.shift !== null) { hasil.push(t); }
  }
  return hasil;
}

/** Fungsi murni: izin lain (MENUNGGU/DITERIMA, bukan tukar/pindah shift) milik karyawan yang bertumpuk dengan rentang; null kalau tidak ada. */
function tumpangTindihIzin(izinRows, karyawan, mulai, selesai) {
  return izinRows.find(function (r) {
    const jenis = String(r.jenis).toUpperCase();
    return String(r.karyawan) === String(karyawan) && STATUS_IZIN_AKTIF.indexOf(String(r.status).toUpperCase()) >= 0 &&
      jenis !== 'TUKAR_SHIFT' && jenis !== 'PINDAH_SHIFT' && String(r.mulai) <= selesai && mulai <= String(r.selesai);
  }) || null;
}

/** Fungsi murni: sisa cuti = jatah dikurangi hari cuti MENUNGGU/DITERIMA yang mulai di tahun itu. */
function hitungSisaCuti(jatah, izinRows, karyawan, tahun) {
  let dipakai = 0;
  izinRows.forEach(function (r) {
    if (String(r.karyawan) !== String(karyawan) || String(r.kelompok).toLowerCase() !== 'cuti') { return; }
    if (STATUS_IZIN_AKTIF.indexOf(String(r.status).toUpperCase()) < 0) { return; }
    if (String(r.mulai).slice(0, 4) !== String(tahun)) { return; }
    dipakai += Number(r.hari) || 0;
  });
  return Math.max(0, (Number(jatah) || 0) - dipakai);
}

/** Fungsi murni: grup berikutnya IZN-{tahun}-{4 angka} dari daftar grup/id yang sudah ada (tidak pernah dipakai ulang). */
function buatGrupIzin(daftarGrup, tahun) {
  let maks = 0;
  daftarGrup.forEach(function (g) {
    const m = /^IZN-(\d{4})-(\d{4})/.exec(String(g));
    if (m && m[1] === String(tahun) && Number(m[2]) > maks) { maks = Number(m[2]); }
  });
  return 'IZN-' + tahun + '-' + ('000' + (maks + 1)).slice(-4);
}

function hurufIzin(i) { return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(i); }

/**
 * Fungsi murni: rencana pengajuan. p = { jenis:{nama,kelompok,maks}, hari:[tanggal terjadwal], sisaCuti, lebih:'CUTI'|'BIASA'|undefined,
 * namaBiasa, namaCuti, ketatLebih }. Kembalian { ok, pesan, butuh_pilihan, kelebihan, segmen:[{jenis,kelompok,hari,mulai,selesai}], sisa_setelah }.
 * - cuti: tidak boleh melebihi sisa cuti; - khusus dengan maks: kelebihan diambil dari Cuti atau Izin biasa (pilihan), kalau Cuti harus cukup;
 * - biasa (termasuk Sakit tanpa surat): satu segmen.
 */
function rencanaIzin(p) {
  const hari = p.hari || [];
  const kel = String(p.jenis.kelompok).toLowerCase();
  const maks = Number(p.jenis.maks) || 0;
  const sisa = Number(p.sisaCuti) || 0;
  if (!hari.length) { return { ok: false, pesan: 'Tidak ada hari kerja terjadwal pada tanggal itu (libur atau tidak ada jadwal)', segmen: [] }; }
  const buat = function (jenis, kelompok, list) { return { jenis: jenis, kelompok: kelompok, hari: list, mulai: list[0], selesai: list[list.length - 1] }; };
  if (kel === 'cuti') {
    if (hari.length > sisa) { return { ok: false, pesan: 'Sisa cuti Anda ' + sisa + ' hari, pengajuan ini ' + hari.length + ' hari. Kurangi tanggalnya.', segmen: [] }; }
    return { ok: true, segmen: [buat(p.jenis.nama, 'cuti', hari)], sisa_setelah: sisa - hari.length, kelebihan: 0 };
  }
  if (kel === 'khusus' && maks > 0 && hari.length > maks) {
    const lebih = hari.length - maks;
    let pilih = p.lebih;
    if (pilih !== 'CUTI' && pilih !== 'BIASA') {
      if (p.ketatLebih) { return { ok: false, butuh_pilihan: true, kelebihan: lebih, pesan: 'Kelebihan ' + lebih + ' hari dari batas ' + p.jenis.nama + ' (maksimal ' + maks + ' hari): pilih diambil dari Cuti atau Izin biasa', segmen: [] }; }
      pilih = sisa >= lebih ? 'CUTI' : 'BIASA';
    }
    if (pilih === 'CUTI' && lebih > sisa) { return { ok: false, kelebihan: lebih, pesan: 'Sisa cuti Anda ' + sisa + ' hari, kelebihan ' + lebih + ' hari. Pilih Izin biasa atau kurangi tanggalnya.', segmen: [] }; }
    const a = hari.slice(0, maks), b = hari.slice(maks);
    return {
      ok: true, kelebihan: lebih, lebih: pilih,
      segmen: [buat(p.jenis.nama, 'khusus', a), pilih === 'CUTI' ? buat(p.namaCuti, 'cuti', b) : buat(p.namaBiasa, 'biasa', b)],
      sisa_setelah: pilih === 'CUTI' ? sisa - lebih : sisa
    };
  }
  return { ok: true, kelebihan: 0, segmen: [buat(p.jenis.nama, kel === 'khusus' ? 'khusus' : 'biasa', hari)], sisa_setelah: sisa };
}

/** Fungsi murni: baris sheet izin dari segmen rencana. info = { grup, karyawan, ket, waktu, telat, status, oleh, diputus }. */
function susunBarisIzin(segmen, info) {
  return segmen.map(function (s, i) {
    return {
      id: info.grup + '-' + hurufIzin(i), grup: info.grup, karyawan: info.karyawan, jenis: s.jenis, kelompok: s.kelompok,
      mulai: s.mulai, selesai: s.selesai, hari: s.hari.length, ket: info.ket || '', lampiran: '', diajukan: info.waktu,
      telat_aju: info.telat === true, status: info.status || 'MENUNGGU', oleh: info.oleh || '', diputus: info.diputus || '',
      rekan: '', status_rekan: '', shift_asal: '', shift_tujuan: ''
    };
  });
}

/** Fungsi murni: keterangan izin: dipotong, tanpa karakter kontrol dan tanda |, maksimal 200 karakter. */
function bersihkanKetIzin(teks) {
  return String(teks === undefined || teks === null ? '' : teks).replace(/[\u0000-\u001f\u007f|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
}

/** Fungsi murni: judul kartu izin di Konfirmasi (mockup 52/28): "Izin sakit dengan surat", "Izin sakit", "Cuti", "Izin - keperluan pribadi". */
function judulIzinKonfirmasi(baris) {
  const jenis = String(baris.jenis);
  if (String(baris.kelompok).toLowerCase() === 'cuti') { return 'Cuti'; }
  if (jenis.toLowerCase() === 'sakit') { return String(baris.lampiran || '') !== '' ? 'Izin sakit dengan surat' : 'Izin sakit'; }
  return 'Izin · ' + jenis.toLowerCase();
}

/** Fungsi murni: rentang tanggal pendek "29-30 Sep" / "29 Sep" / "29 Sep-2 Okt" (en dash). */
function rentangPendek(mulai, selesai) {
  const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const a = bagianTanggal(mulai), b = bagianTanggal(selesai);
  if (mulai === selesai) { return a.d + ' ' + bln[a.m - 1]; }
  if (a.m === b.m && a.y === b.y) { return a.d + '–' + b.d + ' ' + bln[a.m - 1]; }
  return a.d + ' ' + bln[a.m - 1] + '–' + b.d + ' ' + bln[b.m - 1];
}

/**
 * Fungsi murni: item Konfirmasi izin (satu item per GRUP yang masih ada baris MENUNGGU).
 * rows = baris izin (mulai/selesai teks); petaAkun = { id: { nama, cabang, role } }. Tukar/pindah shift tidak termasuk (fitur B).
 */
function rakitItemIzin(rows, petaAkun) {
  const kelompokGrup = {};
  const urut = [];
  rows.forEach(function (r) {
    const jenis = String(r.jenis).toUpperCase();
    if (jenis === 'TUKAR_SHIFT' || jenis === 'PINDAH_SHIFT') { return; }
    const g = String(r.grup || r.id);
    if (!kelompokGrup[g]) { kelompokGrup[g] = []; urut.push(g); }
    kelompokGrup[g].push(r);
  });
  const items = [];
  urut.forEach(function (g) {
    const baris = kelompokGrup[g];
    const menunggu = baris.filter(function (r) { return String(r.status).toUpperCase() === 'MENUNGGU'; });
    if (!menunggu.length) { return; }
    const pertama = menunggu[0];
    const akun = petaAkun[String(pertama.karyawan)] || {};
    const hariTotal = menunggu.reduce(function (n, r) { return n + (Number(r.hari) || 0); }, 0);
    const mulai = menunggu.reduce(function (m, r) { return String(r.mulai) < m ? String(r.mulai) : m; }, String(pertama.mulai));
    const selesai = menunggu.reduce(function (m, r) { return String(r.selesai) > m ? String(r.selesai) : m; }, String(pertama.selesai));
    const bagian = menunggu.map(function (r) {
      return (Number(r.hari) || 0) + ' hari ' + (String(r.kelompok).toLowerCase() === 'cuti' ? 'cuti' : (String(r.kelompok).toLowerCase() === 'khusus' ? 'izin khusus ' + String(r.jenis).toLowerCase() : 'izin ' + String(r.jenis).toLowerCase())) + ' (' + rentangPendek(String(r.mulai), String(r.selesai)) + ')';
    });
    const adaSurat = menunggu.some(function (r) { return String(r.lampiran || '') !== ''; });
    items.push({
      id: 'IZIN|' + g, jenis: 'IZIN', kelompok: 'IZIN', karyawan: String(pertama.karyawan), nama: akun.nama || String(pertama.karyawan),
      cabang: akun.cabang || '', role: akun.role || 'KARYAWAN', tanggal: mulai, jam: '', shift: '',
      judul: judulIzinKonfirmasi(pertama), rincian: menunggu.length > 1 ? bagian.join(', ') : rentangPendek(mulai, selesai) + ', ' + hariTotal + ' hari kerja' + (adaSurat ? ', lampiran ada' : ''),
      ket: String(pertama.ket || ''), surat: adaSurat, sakit: menunggu.some(function (r) { return String(r.jenis).toLowerCase() === 'sakit'; }),
      hari: hariTotal, mulai: mulai, selesai: selesai, telat_aju: menunggu.some(function (r) { return r.telat_aju === true; }),
      luar: false, gps: '', dalam_area_toko: false, tingkat: 0, durasi_menit: 0, foto: adaSurat ? 'ADA' : 'TANPA'
    });
  });
  return items;
}

/** Fungsi murni: id item izin "IZIN|IZN-2026-0001" -> grup; null kalau bentuknya salah. */
function parseIdItemIzin(id) {
  const m = /^IZIN\|(IZN-\d{4}-\d{4}(?:-[A-Z])?)$/.exec(String(id || ''));
  return m ? m[1] : null;
}

/** Fungsi murni: jumlah pengajuan (grup) milik karyawan yang masih MENUNGGU (kartu "N pengajuan menunggu ACC" di beranda pribadi). */
function jumlahPengajuanMenunggu(rows, karyawan) {
  const g = {};
  rows.forEach(function (r) {
    if (String(r.karyawan) === String(karyawan) && String(r.status).toUpperCase() === 'MENUNGGU') { g[String(r.grup || r.id)] = true; }
  });
  return Object.keys(g).length;
}

// ---------- akses sheet izin / kalender / jenis ----------

function normTanggalIzin(v) { return String(sebagaiTanggalTeks(v, ZONA_ABSEN)); }

function bacaIzinTernormalisasi() {
  const b = bacaSheet('izin');
  b.data.forEach(function (r) { r.mulai = normTanggalIzin(r.mulai); r.selesai = normTanggalIzin(r.selesai); });
  return b;
}

function bacaKalenderTernormalisasi() {
  const b = bacaSheet('kalender');
  b.data.forEach(function (k) { k.tanggal = normTanggalIzin(k.tanggal); k.cabang = String(k.cabang); k.karyawan = String(k.karyawan); k.isi = String(k.isi); });
  return b;
}

/** Daftar jenis izin dari pengaturan (kategori JENIS_IZIN): [{ nama, kelompok, maks }] urutan baris. */
function daftarJenisIzin() {
  return bacaSheet('pengaturan').data.filter(function (r) { return r.kategori === 'JENIS_IZIN'; }).map(function (r) {
    return { nama: String(r.nama), kelompok: String(r.kelompok || 'biasa').toLowerCase(), maks: Number(r.maks) || 0 };
  });
}

function liburMingguCabang(cabang) {
  const kode = ambilKodeCabang(cabang);
  if (!kode) { return false; }
  const p = bacaSheet('pengaturan').data.find(function (r) { return r.kategori === 'UMUM' && String(r.nama) === 'libur_minggu_' + kode; });
  return !!p && String(p.nilai).toUpperCase() === 'TRUE';
}

/** Akun aktif lengkap (mulai_pola dinormalkan) atau null. */
function akunLengkapAktif(id) {
  const a = bacaSheet('akun').data.find(function (r) { return String(r.id) === String(id) && r.aktif === true; });
  if (!a) { return null; }
  a.mulai_pola = a.mulai_pola === '' ? '' : normTanggalIzin(a.mulai_pola);
  return a;
}

function jatahCutiAkun(akun) {
  const n = Number(akun.jatah_cuti);
  return (akun.jatah_cuti !== '' && akun.jatah_cuti !== undefined && !isNaN(n)) ? n : ambilNilaiUmum('jatah_cuti', 6);
}

function tambahBarisSheet(bacaan, obj) {
  bacaan.sheet.appendRow(bacaan.header.map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
}

function waktuServerTeks() { return Utilities.formatDate(new Date(), ZONA_ABSEN, 'yyyy-MM-dd HH:mm'); }
function hariIniServer() { return Utilities.formatDate(new Date(), ZONA_ABSEN, 'yyyy-MM-dd'); }

/** Karyawan atau admin yang login di HP pribadi: { p, akun } atau { gagal }. */
function aktorIzinPribadi(d) {
  const p = validasiSesiPribadi(d.sesi);
  if (!p) { return { gagal: responSesiPribadiHabis() }; }
  const akun = akunLengkapAktif(p.id);
  if (!akun) { return { gagal: responSesiPribadiHabis() }; }
  return { p: p, akun: akun };
}

/** Hitung rencana pengajuan untuk satu akun memakai data sheet (jadwal, kalender, izin, jatah cuti). opsi = { ketatLebih }. */
function evaluasiIzin(akun, d, opsi) {
  const hariIni = hariIniServer();
  const mulai = String(d.mulai || ''), selesai = String(d.selesai || '');
  const v = validasiTanggalIzin(mulai, selesai, hariIni, ambilNilaiUmum('batas_izin_lewat_hari', 2));
  if (!v.ok) { return { ok: false, pesan: v.pesan, segmen: [] }; }
  const daftar = daftarJenisIzin();
  const jenis = daftar.find(function (j) { return j.nama === String(d.jenis || ''); });
  if (!jenis) { return { ok: false, pesan: 'Jenis izin tidak dikenal', segmen: [] }; }
  const hari = hariTerjadwalRentang(akun, mulai, selesai, bacaKalenderTernormalisasi().data, liburMingguCabang(akun.cabang));
  const izinRows = bacaIzinTernormalisasi().data;
  const tabrak = tumpangTindihIzin(izinRows, akun.id, mulai, selesai);
  if (tabrak) { return { ok: false, pesan: 'Sudah ada pengajuan izin pada tanggal itu (' + rentangPendek(String(tabrak.mulai), String(tabrak.selesai)) + ')', segmen: [] }; }
  const sisa = hitungSisaCuti(jatahCutiAkun(akun), izinRows, akun.id, mulai.slice(0, 4));
  const cuti = daftar.find(function (j) { return j.kelompok === 'cuti'; });
  const biasa = daftar.find(function (j) { return j.nama === 'Keperluan pribadi'; }) || daftar.find(function (j) { return j.kelompok === 'biasa' && j.nama.toLowerCase() !== 'sakit'; });
  const r = rencanaIzin({ jenis: jenis, hari: hari, sisaCuti: sisa, lebih: d.lebih, namaBiasa: biasa ? biasa.nama : 'Keperluan pribadi', namaCuti: cuti ? cuti.nama : 'Cuti', ketatLebih: opsi && opsi.ketatLebih === true });
  r.telat_aju = v.telat_aju; r.hari_ini = hariIni; r.sisa_cuti = sisa; r.jumlah_hari = hari.length; r.maks = jenis.maks; r.kelompok_jenis = jenis.kelompok;
  return r;
}

function segmenUntukKlien(segmen) {
  return (segmen || []).map(function (s) { return { jenis: s.jenis, kelompok: s.kelompok, hari: s.hari.length, mulai: s.mulai, selesai: s.selesai }; });
}

/** Aksi izin_info { sesi }: jenis izin, sisa cuti, batas hari lewat, hari ini (server). */
function prosesIzinInfo(d) {
  const a = aktorIzinPribadi(d);
  if (a.gagal) { return a.gagal; }
  const hariIni = hariIniServer();
  const sisa = hitungSisaCuti(jatahCutiAkun(a.akun), bacaIzinTernormalisasi().data, a.akun.id, hariIni.slice(0, 4));
  return respon({ status: 'ok', hari_ini: hariIni, jenis: daftarJenisIzin(), jatah: jatahCutiAkun(a.akun), sisa_cuti: sisa, batas_lewat_hari: ambilNilaiUmum('batas_izin_lewat_hari', 2), role: a.akun.role });
}

/** Aksi izin_pratinjau { sesi, jenis, mulai, selesai, lebih? }: hasil pengajuan tanpa menyimpan apa pun. */
function prosesIzinPratinjau(d) {
  const a = aktorIzinPribadi(d);
  if (a.gagal) { return a.gagal; }
  const e = evaluasiIzin(a.akun, d, { ketatLebih: false });
  return respon({
    status: 'ok', bisa: e.ok === true, pesan: e.pesan || '', hari: e.jumlah_hari || 0, kelebihan: e.kelebihan || 0, lebih: e.lebih || '',
    maks: e.maks || 0, sisa_cuti: e.sisa_cuti === undefined ? null : e.sisa_cuti, sisa_setelah: e.sisa_setelah === undefined ? null : e.sisa_setelah,
    segmen: segmenUntukKlien(e.segmen), telat_aju: e.telat_aju === true
  });
}

/** Aksi izin_ajukan { sesi, jenis, mulai, selesai, lebih?, ket? }: simpan pengajuan (MENUNGGU). */
function prosesIzinAjukan(d) {
  const a = aktorIzinPribadi(d);
  if (a.gagal) { return a.gagal; }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const e = evaluasiIzin(a.akun, d, { ketatLebih: true });
    if (!e.ok) { return respon({ status: 'gagal', pesan: e.pesan, butuh_pilihan: e.butuh_pilihan === true }); }
    const izin = bacaIzinTernormalisasi();
    const grup = buatGrupIzin(izin.data.map(function (r) { return r.grup || r.id; }), e.hari_ini.slice(0, 4));
    const ket = bersihkanKetIzin(d.ket);
    const baris = susunBarisIzin(e.segmen, { grup: grup, karyawan: a.akun.id, ket: ket, waktu: waktuServerTeks(), telat: e.telat_aju, status: 'MENUNGGU' });
    baris.forEach(function (b) { tambahBarisSheet(izin, b); });
    tambahLog({
      jenis: 'IZIN', oleh: a.akun.id, cabang: a.akun.cabang, aksi: 'AJUKAN_IZIN', target: a.akun.nama + ' ' + baris.map(function (b) { return b.jenis + ' ' + b.mulai + '..' + b.selesai; }).join(' + '),
      id: grup, sebelum: '', sesudah: 'MENUNGGU', alasan: ket
    });
    const sakit = baris.find(function (b) { return String(b.jenis).toLowerCase() === 'sakit'; });
    return respon({ status: 'ok', grup: grup, ids: baris.map(function (b) { return b.id; }), segmen: segmenUntukKlien(e.segmen), id_sakit: sakit ? sakit.id : '', telat_aju: e.telat_aju });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi izin_batal { sesi, grup }: karyawan membatalkan pengajuan MILIKNYA yang masih MENUNGGU (status jadi BATAL, baris tidak dihapus). */
function prosesIzinBatal(d) {
  const a = aktorIzinPribadi(d);
  if (a.gagal) { return a.gagal; }
  const grup = String(d.grup || '');
  if (!/^IZN-\d{4}-\d{4}(?:-[A-Z])?$/.test(grup)) { return respon({ status: 'gagal', pesan: 'Pengajuan tidak dikenal' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const izin = bacaIzinTernormalisasi();
    const baris = izin.data.filter(function (r) { return (String(r.grup) === grup || String(r.id) === grup) && String(r.karyawan) === String(a.akun.id); });
    if (!baris.length) { return respon({ status: 'gagal', pesan: 'Pengajuan tidak ditemukan' }); }
    const menunggu = baris.filter(function (r) { return String(r.status).toUpperCase() === 'MENUNGGU'; });
    if (!menunggu.length) { return respon({ status: 'gagal', pesan: 'Pengajuan ini sudah diputuskan, tidak bisa dibatalkan' }); }
    menunggu.forEach(function (r) {
      const ubah = { status: 'BATAL', diputus: waktuServerTeks(), oleh: a.akun.id };
      if (jenisTukar(r.jenis)) { ubah.status_rekan = 'BATAL'; }
      perbaruiKolom(izin, r, ubah);
    });
    tambahLog({ jenis: 'IZIN', oleh: a.akun.id, cabang: a.akun.cabang, aksi: 'BATAL_IZIN', target: a.akun.nama, id: String(baris[0].grup || baris[0].id), sebelum: 'MENUNGGU', sesudah: 'BATAL' });
    return respon({ status: 'ok' });
  } finally {
    kunci.releaseLock();
  }
}

/**
 * Fungsi murni: pengajuan izin/cuti dan ajakan tukar shift MILIK SENDIRI yang masih MENUNGGU (belum diputuskan admin), satu item per grup, terlama dulu.
 * rows = baris sheet izin (mulai/selesai teks). Kembalian [{ grup, judul, rincian, tukar }].
 */
function rakitPengajuanSaya(rows, karyawan) {
  const peta = {}, urut = [];
  rows.forEach(function (r) {
    if (String(r.karyawan) !== String(karyawan) || String(r.status).toUpperCase() !== 'MENUNGGU') { return; }
    const g = String(r.grup || r.id);
    if (!peta[g]) { peta[g] = { grup: g, jenis: String(r.jenis), mulai: String(r.mulai), selesai: String(r.selesai), tukar: jenisTukar(r.jenis) }; urut.push(g); }
    else if (String(r.selesai) > peta[g].selesai) { peta[g].selesai = String(r.selesai); }
  });
  return urut.map(function (g) {
    const p = peta[g];
    const judul = String(p.jenis).toUpperCase() === 'TUKAR_SHIFT' ? 'Tukar shift' : (String(p.jenis).toUpperCase() === 'PINDAH_SHIFT' ? 'Pindah shift' : p.jenis);
    return { grup: g, judul: judul, rincian: rentangPendek(p.mulai, p.selesai), tukar: p.tukar };
  }).sort(function (x, y) { return x.grup < y.grup ? -1 : 1; });
}

/** Aksi pengajuan_saya { sesi }: daftar pengajuan sendiri yang masih bisa dibatalkan (dibatalkan lewat izin_batal). */
function prosesPengajuanSaya(d) {
  const a = aktorIzinPribadi(d);
  if (a.gagal) { return a.gagal; }
  return respon({ status: 'ok', daftar: rakitPengajuanSaya(bacaIzinTernormalisasi().data, a.akun.id) });
}

/** Fungsi murni: jalur folder surat dokter di bawah folder akar + nama berkas. akun = { id, nama, cabang }; hariIni 'yyyy-MM-dd'. */
function jalurSuratIzin(baris, akun, hariIni) {
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(baris.mulai));
  const h = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(hariIni));
  if (!t || !h) { return null; }
  const orang = bersihkanNamaBerkas(String(akun.id) + '_' + (bersihkanNamaBerkas(akun.nama) || 'TANPA NAMA'));
  return {
    segmen: ['SURAT IZIN', bersihkanNamaBerkas(akun.cabang) || 'TANPA CABANG', t[1], t[2], orang],
    namaBerkas: h[3] + h[2] + h[1].slice(2) + '_IZIN_' + bersihkanNamaBerkas(baris.id) + '.jpg'
  };
}

/** Fungsi murni: siapa boleh melampirkan surat ke baris izin? aktor = { role, id, cabang }; target = { role, cabang }. */
function bolehLampirSurat(aktor, baris, target) {
  if (String(baris.jenis).toLowerCase() !== 'sakit') { return { boleh: false, pesan: 'Surat dokter hanya untuk izin sakit' }; }
  const status = String(baris.status).toUpperCase();
  if (String(baris.karyawan) === String(aktor.id)) {
    if (status !== 'MENUNGGU') { return { boleh: false, pesan: 'Surat hanya bisa ditambahkan selama pengajuan masih menunggu ACC' }; }
    return { boleh: true };
  }
  if (aktor.role !== 'ADMIN') { return { boleh: false, pesan: 'Bukan pengajuan Anda' }; }
  if (!target || target.role !== 'KARYAWAN' || target.cabang !== aktor.cabang) { return { boleh: false, pesan: 'Hanya boleh untuk karyawan di cabang sendiri' }; }
  if (String(baris.oleh) !== String(aktor.id) || status !== 'DITERIMA') { return { boleh: false, pesan: 'Admin hanya melampirkan surat pada izin yang diinputnya sendiri' }; }
  return { boleh: true };
}

/**
 * Aksi izin_unggah_surat { sesi | token+sesi, id (id baris izin), gambar }: JPEG maksimal 500 KB ke Drive (SURAT IZIN/Cabang/Tahun/Bulan/ID_Nama/),
 * tautan ke kolom lampiran, kelompok jadi khusus. Gagal unggah TIDAK membatalkan pengajuannya (bisa dicoba lagi).
 */
function prosesIzinUnggahSurat(d) {
  const idIzin = String(d.id || '');
  if (!/^IZN-\d{4}-\d{4}-[A-Z]$/.test(idIzin)) { return respon({ status: 'gagal', pesan: 'Id pengajuan tidak valid' }); }
  let aktor;
  if (d.token) {
    const a = autentikasiAdminToko(d);
    if (a.gagal) { return a.gagal; }
    aktor = { role: 'ADMIN', id: a.s.akun.id, cabang: a.s.akun.cabang };
  } else {
    const p = validasiSesiPribadi(d.sesi);
    if (!p) { return responSesiPribadiHabis(); }
    aktor = { role: p.role, id: p.id, cabang: p.cabang };
  }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const izin = bacaIzinTernormalisasi();
    const baris = izin.data.find(function (r) { return String(r.id) === idIzin; });
    if (!baris) { return respon({ status: 'gagal', pesan: 'Pengajuan tidak ditemukan' }); }
    const akunTarget = bacaSheet('akun').data.find(function (r) { return String(r.id) === String(baris.karyawan); });
    const izinHak = bolehLampirSurat(aktor, baris, akunTarget ? { role: akunTarget.role, cabang: akunTarget.cabang } : null);
    if (!izinHak.boleh) { return respon({ status: 'gagal', pesan: izinHak.pesan }); }
    const g = periksaGambarJpeg(d.gambar, MAKS_SURAT_BYTE);
    if (!g.ok) { return respon({ status: 'gagal', pesan: g.pesan }); }
    const akar = ambilFolderAkar();
    if (akar.galat) { catatGalatFolder(akar.galat); return respon({ status: 'gagal', pesan: 'Folder penyimpanan surat bermasalah. Pengajuan tetap tersimpan; coba lampirkan lagi nanti.' }); }
    const jalur = jalurSuratIzin(baris, { id: akunTarget.id, nama: akunTarget.nama, cabang: akunTarget.cabang }, hariIniServer());
    if (!jalur) { return respon({ status: 'gagal', pesan: 'Data pengajuan tidak lengkap' }); }
    let berkas;
    try {
      let folder = akar.folder;
      jalur.segmen.forEach(function (nama) { folder = ambilAtauBuatFolder(folder, nama); });
      berkas = folder.createFile(Utilities.newBlob(g.bytes, 'image/jpeg', jalur.namaBerkas));
    } catch (e) {
      catatGalatFolder('Gagal menyimpan surat izin ke Drive: ' + e.message);
      return respon({ status: 'gagal', pesan: 'Surat belum bisa disimpan. Pengajuan tetap tersimpan; coba lampirkan lagi.' });
    }
    perbaruiKolom(izin, baris, { lampiran: berkas.getUrl(), kelompok: 'khusus' });
    tambahLog({ jenis: 'IZIN', oleh: aktor.id, cabang: akunTarget.cabang, aksi: 'SURAT_IZIN', target: akunTarget.nama + ' ' + idIzin, id: idIzin, sebelum: '', sesudah: 'lampiran ada; kelompok=khusus' });
    return respon({ status: 'ok', pesan: 'Surat tersimpan' });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi izin_input { token+sesi admin | sesi admin pribadi, karyawan, jenis, mulai, selesai, ket? }: admin mengisi izin untuk karyawan cabangnya; langsung DITERIMA. */
function prosesIzinInput(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  const target = akunLengkapAktif(d.karyawan);
  if (!target || target.role !== 'KARYAWAN') { return respon({ status: 'gagal', pesan: 'Pilih karyawan yang valid' }); }
  if (String(target.id) === String(admin.id)) { return respon({ status: 'gagal', pesan: 'Admin tidak boleh mengisi izin untuk dirinya sendiri. Itu tugas owner.' }); }
  if (target.cabang !== admin.cabang) { return respon({ status: 'gagal', pesan: 'Hanya boleh untuk karyawan di cabang sendiri' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const e = evaluasiIzin(target, d, { ketatLebih: true });
    if (!e.ok) { return respon({ status: 'gagal', pesan: e.butuh_pilihan ? 'Melebihi batas hari jenis izin ini (' + e.kelebihan + ' hari berlebih). Kurangi tanggalnya.' : e.pesan }); }
    const izin = bacaIzinTernormalisasi();
    const grup = buatGrupIzin(izin.data.map(function (r) { return r.grup || r.id; }), e.hari_ini.slice(0, 4));
    const waktu = waktuServerTeks();
    const ket = bersihkanKetIzin(d.ket);
    const baris = susunBarisIzin(e.segmen, { grup: grup, karyawan: target.id, ket: ket, waktu: waktu, telat: e.telat_aju, status: 'DITERIMA', oleh: admin.id, diputus: waktu });
    baris.forEach(function (b) { tambahBarisSheet(izin, b); });
    tambahLog({ jenis: 'IZIN', oleh: admin.id, cabang: target.cabang, aksi: 'INPUT_IZIN', target: target.nama + ' ' + baris.map(function (b) { return b.jenis + ' ' + b.mulai + '..' + b.selesai; }).join(' + '), id: grup, sebelum: '', sesudah: 'DITERIMA', alasan: ket });
    const sakit = baris.find(function (b) { return String(b.jenis).toLowerCase() === 'sakit'; });
    return respon({ status: 'ok', grup: grup, ids: baris.map(function (b) { return b.id; }), segmen: segmenUntukKlien(e.segmen), id_sakit: sakit ? sakit.id : '' });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi izin_input_pratinjau { kredensial admin, karyawan, jenis, mulai, selesai }: jumlah hari kerja untuk layar Input izin. */
function prosesIzinInputPratinjau(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const target = akunLengkapAktif(d.karyawan);
  if (!target || target.role !== 'KARYAWAN' || target.cabang !== a.s.akun.cabang || String(target.id) === String(a.s.akun.id)) { return respon({ status: 'ok', bisa: false, pesan: 'Pilih karyawan', hari: 0, segmen: [] }); }
  const e = evaluasiIzin(target, d, { ketatLebih: true });
  return respon({ status: 'ok', bisa: e.ok === true, pesan: e.butuh_pilihan ? 'Melebihi batas hari jenis izin ini. Kurangi tanggalnya.' : (e.pesan || ''), hari: e.jumlah_hari || 0, segmen: segmenUntukKlien(e.segmen) });
}

/** Aksi izin_batas_input { kredensial admin }: jenis izin (untuk dropdown) dan hari ini server. */
function prosesIzinInputInfo(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  return respon({ status: 'ok', hari_ini: hariIniServer(), jenis: daftarJenisIzin() });
}

// ---------- Konfirmasi izin ----------

function petaAkunUntukIzin() {
  const peta = {};
  bacaSheet('akun').data.forEach(function (r) { peta[String(r.id)] = { nama: String(r.nama), panggilan: String(r.panggilan || ''), cabang: String(r.cabang), role: r.role === 'ADMIN' ? 'ADMIN' : (r.role === 'OWNER' ? 'OWNER' : 'KARYAWAN') }; });
  return peta;
}

/** Putuskan satu item izin (grup): aktor sudah lolos autentikasi; hak diperiksa di sini. d = { id, keputusan, surat_tidak_sah? }. */
function putuskanItemIzin(aktor, d) {
  const grup = parseIdItemIzin(d.id);
  if (!grup) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const izin = bacaIzinTernormalisasi();
    const semua = izin.data.filter(function (r) { return String(r.grup || r.id) === grup || String(r.id) === grup; });
    const menunggu = semua.filter(function (r) { return String(r.status).toUpperCase() === 'MENUNGGU'; });
    if (!semua.length) { return respon({ status: 'gagal', pesan: 'Pengajuan tidak ditemukan' }); }
    if (!menunggu.length) { return respon({ status: 'gagal', pesan: 'Item ini sudah diputuskan' }); }
    const peta = petaAkunUntukIzin();
    const pemilik = peta[String(menunggu[0].karyawan)] || { cabang: '', role: 'KARYAWAN' };
    const hak = bolehMemutuskanKonfirmasi(aktor, { karyawan: menunggu[0].karyawan, cabang: pemilik.cabang, role: pemilik.role });
    if (!hak.boleh) { return respon({ status: 'gagal', pesan: hak.pesan }); }
    const baru = d.keputusan === 'ACC' ? 'DITERIMA' : 'DITOLAK';
    const waktu = waktuServerTeks();
    const tidakSah = d.keputusan === 'ACC' && d.surat_tidak_sah === true;
    menunggu.forEach(function (r) {
      const ubah = { status: baru, oleh: aktor.id, diputus: waktu };
      if (tidakSah && String(r.jenis).toLowerCase() === 'sakit') { ubah.kelompok = 'biasa'; }
      perbaruiKolom(izin, r, ubah);
    });
    tambahLog({
      jenis: 'KONFIRMASI', oleh: aktor.id, cabang: pemilik.cabang, aksi: (d.keputusan === 'ACC' ? 'ACC_IZIN' : 'TOLAK_IZIN'), target: (pemilik.nama || '') + ' ' + grup, id: grup,
      sebelum: 'status=MENUNGGU', sesudah: 'status=' + baru, alasan: tidakSah ? 'surat tidak sah: dijadikan sakit tanpa surat' : ''
    });
    return respon({ status: 'ok', keputusan: baru });
  } finally {
    kunci.releaseLock();
  }
}

/** Ambil foto surat dokter satu grup izin (hak lihat = hak putuskan). Memakai pola prosesAmbilFoto. */
function ambilSuratItemIzin(aktor, d) {
  const grup = parseIdItemIzin(d.id);
  if (!grup) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
  const izin = bacaIzinTernormalisasi();
  const semua = izin.data.filter(function (r) { return String(r.grup || r.id) === grup || String(r.id) === grup; });
  if (!semua.length) { return respon({ status: 'gagal', pesan: 'Pengajuan tidak ditemukan' }); }
  const peta = petaAkunUntukIzin();
  const pemilik = peta[String(semua[0].karyawan)] || { cabang: '', role: 'KARYAWAN' };
  const hak = bolehMemutuskanKonfirmasi(aktor, { karyawan: semua[0].karyawan, cabang: pemilik.cabang, role: pemilik.role });
  if (!hak.boleh) { return respon({ status: 'gagal', pesan: hak.pesan }); }
  const baris = semua.find(function (r) { return String(r.lampiran || '') !== ''; });
  if (!baris) { return respon({ status: 'ok', foto: null, teks: 'Surat belum dilampirkan' }); }
  const idBerkas = idBerkasDrive(String(baris.lampiran));
  if (!idBerkas) { return respon({ status: 'ok', foto: null, teks: 'Surat tidak bisa dibuka' }); }
  try {
    const bytes = DriveApp.getFileById(idBerkas).getBlob().getBytes();
    if (bytes.length > 700 * 1024) { return respon({ status: 'ok', foto: null, teks: 'Surat terlalu besar untuk ditampilkan' }); }
    return respon({ status: 'ok', foto: 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes), mulai: String(baris.mulai), selesai: String(baris.selesai), hari: Number(baris.hari) || 0, ket: String(baris.ket || '') });
  } catch (e) {
    return respon({ status: 'ok', foto: null, teks: 'Surat tidak bisa dibuka' });
  }
}

// ---------- Kalender libur ----------

/** Fungsi murni: isi sel kalender -> { tipe: MERAH | KHUSUS | MASUK | '', ket }. */
function uraiIsiKalender(isi) {
  const t = String(isi === undefined || isi === null ? '' : isi).trim();
  const u = t.toUpperCase();
  const ket = function () { const i = t.indexOf(':'); return i >= 0 ? t.slice(i + 1).trim() : ''; };
  if (u.indexOf('LIBUR TANGGAL MERAH') === 0) { return { tipe: 'MERAH', ket: ket() }; }
  if (u.indexOf('LIBUR KHUSUS') === 0) { return { tipe: 'KHUSUS', ket: ket() }; }
  if (u.indexOf('MASUK') === 0) { return { tipe: 'MASUK', ket: ket() }; }
  return { tipe: '', ket: '' };
}

/** Fungsi murni: isi sel kalender dari tipe + keterangan; HAPUS = kosong (baris tidak dihapus). */
function susunIsiKalender(tipe, ket) {
  const k = bersihkanKetIzin(ket).slice(0, 60);
  const akhir = k ? ': ' + k : '';
  if (tipe === 'MERAH') { return 'LIBUR TANGGAL MERAH' + akhir; }
  if (tipe === 'KHUSUS') { return 'LIBUR KHUSUS' + akhir; }
  if (tipe === 'MASUK') { return 'MASUK' + akhir; }
  return '';
}

/** Fungsi murni: validasi perubahan satu tanggal kalender. Hanya hari ini dan seterusnya; MASUK hanya untuk hari Minggu. */
function validasiPerubahanKalender(tanggal, tipe, hariIni) {
  if (!tanggalIzinSah(tanggal)) { return { ok: false, pesan: 'Tanggal tidak valid' }; }
  if (tanggal < hariIni) { return { ok: false, pesan: 'Perubahan kalender hanya berlaku untuk hari ini dan seterusnya' }; }
  if (['MERAH', 'KHUSUS', 'MASUK', 'HAPUS'].indexOf(tipe) < 0) { return { ok: false, pesan: 'Jenis libur tidak dikenal' }; }
  if (tipe === 'MASUK' && hariKeIndeks(tanggal) !== 0) { return { ok: false, pesan: 'Pilihan "masuk" hanya untuk hari Minggu' }; }
  return { ok: true };
}

/** Aksi kalender_baca { kredensial admin, bulan 'yyyy-MM' }: libur Minggu cabang + tanggal merah/khusus/Minggu masuk di bulan itu. */
function prosesKalenderBaca(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const cabang = a.s.akun.cabang;
  const bulan = /^\d{4}-\d{2}$/.test(String(d.bulan || '')) ? String(d.bulan) : hariIniServer().slice(0, 7);
  const daftar = [];
  bacaKalenderTernormalisasi().data.forEach(function (k) {
    if (k.karyawan !== '' || (k.cabang !== '' && k.cabang !== cabang) || k.tanggal.slice(0, 7) !== bulan) { return; }
    const u = uraiIsiKalender(k.isi);
    if (u.tipe) { daftar.push({ tanggal: k.tanggal, tipe: u.tipe, ket: u.ket, umum: k.cabang === '' }); }
  });
  daftar.sort(function (x, y) { return x.tanggal < y.tanggal ? -1 : (x.tanggal > y.tanggal ? 1 : 0); });
  return respon({ status: 'ok', cabang: cabang, bulan: bulan, hari_ini: hariIniServer(), libur_minggu: liburMingguCabang(cabang), daftar: daftar });
}

/** Aksi kalender_simpan { kredensial admin, libur_minggu? | tanggal+tipe+ket }: ubah libur Minggu cabang atau satu tanggal. Dicatat di log. */
function prosesKalenderSimpan(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    if (typeof d.libur_minggu === 'boolean') {
      const kode = ambilKodeCabang(admin.cabang);
      if (!kode) { return respon({ status: 'gagal', pesan: 'Kode cabang belum diatur di pengaturan' }); }
      const p = bacaSheet('pengaturan');
      const nama = 'libur_minggu_' + kode;
      const baris = p.data.find(function (r) { return r.kategori === 'UMUM' && String(r.nama) === nama; });
      const sebelum = baris ? String(baris.nilai).toUpperCase() : '(belum ada)';
      if (baris) { perbaruiKolom(p, baris, { nilai: d.libur_minggu ? 'TRUE' : 'FALSE' }); }
      else { tambahBarisSheet(p, { kategori: 'UMUM', nama: nama, nilai: d.libur_minggu ? 'TRUE' : 'FALSE', kelompok: '', maks: '' }); }
      tambahLog({ jenis: 'KALENDER', oleh: admin.id, cabang: admin.cabang, aksi: 'LIBUR_MINGGU', target: nama, id: nama, sebelum: sebelum, sesudah: d.libur_minggu ? 'TRUE' : 'FALSE' });
      return respon({ status: 'ok', libur_minggu: d.libur_minggu });
    }
    const tanggal = String(d.tanggal || ''), tipe = String(d.tipe || '');
    const v = validasiPerubahanKalender(tanggal, tipe, hariIniServer());
    if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
    const kal = bacaKalenderTernormalisasi();
    const ada = kal.data.find(function (k) { return k.tanggal === tanggal && k.cabang === admin.cabang && k.karyawan === ''; });
    const isiBaru = susunIsiKalender(tipe, d.ket);
    if (ada) { perbaruiKolom(kal, ada, { isi: isiBaru }); }
    else if (tipe !== 'HAPUS') { tambahBarisSheet(kal, { tanggal: tanggal, cabang: admin.cabang, karyawan: '', isi: isiBaru }); }
    tambahLog({ jenis: 'KALENDER', oleh: admin.id, cabang: admin.cabang, aksi: 'UBAH_KALENDER', target: tanggal, id: tanggal, sebelum: ada ? String(ada.isi) : '', sesudah: isiBaru, alasan: '' });
    return respon({ status: 'ok' });
  } finally {
    kunci.releaseLock();
  }
}

// ---------- Kartu "Hari ini tidak masuk" (layar 01 HP toko) ----------

/**
 * Fungsi murni: panggilan karyawan yang HARI INI tidak masuk karena izin/cuti (MENUNGGU atau DITERIMA) atau libur milik sendiri di kalender.
 * Libur seluruh toko (Minggu / tanggal merah umum) tidak dihitung. m = { tanggal, cabang, akun[], kalender[], izin[], liburMinggu }.
 */
function daftarTidakMasuk(m) {
  const izinId = {};
  m.izin.forEach(function (z) {
    const st = String(z.status).toUpperCase(), jenis = String(z.jenis).toUpperCase();
    if (STATUS_IZIN_AKTIF.indexOf(st) < 0 || jenis === 'TUKAR_SHIFT' || jenis === 'PINDAH_SHIFT') { return; }
    if (String(z.mulai) <= m.tanggal && m.tanggal <= String(z.selesai)) { izinId[String(z.karyawan)] = true; }
  });
  const umum = m.kalender.filter(function (k) { return String(k.karyawan) === ''; });
  const hasil = [];
  m.akun.forEach(function (a) {
    if (a.aktif !== true || (a.role !== 'KARYAWAN' && a.role !== 'ADMIN') || a.cabang !== m.cabang) { return; }
    const jToko = jadwalKaryawanHari(a, m.tanggal, umum, m.liburMinggu === true);
    if (jToko.libur) { return; }
    const j = jadwalKaryawanHari(a, m.tanggal, m.kalender, m.liburMinggu === true);
    if (izinId[String(a.id)] || j.libur) { hasil.push(String(a.panggilan || a.nama)); }
  });
  hasil.sort(function (x, y) { return x.toLowerCase() < y.toLowerCase() ? -1 : (x.toLowerCase() > y.toLowerCase() ? 1 : 0); });
  return hasil;
}

/** Aksi tidak_masuk_hari_ini { token }: daftar panggilan untuk kartu di layar 01 (cabang dari HP toko, bukan kiriman HP). */
function prosesTidakMasukHariIni(hp) {
  const tanggal = hariIniServer();
  const akun = bacaSheet('akun').data.map(function (r) { r.mulai_pola = r.mulai_pola === '' ? '' : normTanggalIzin(r.mulai_pola); return r; });
  const daftar = daftarTidakMasuk({ tanggal: tanggal, cabang: hp.cabang, akun: akun, kalender: bacaKalenderTernormalisasi().data, izin: bacaIzinTernormalisasi().data, liburMinggu: liburMingguCabang(hp.cabang) });
  return respon({ status: 'ok', jumlah: daftar.length, daftar: daftar });
}

/** Jumlah pengajuan izin milik akun yang MENUNGGU; gagal membaca sheet tidak boleh mengganggu beranda (dianggap 0). */
function jumlahIzinMenungguAman(id) {
  try { return jumlahPengajuanMenunggu(bacaIzinTernormalisasi().data, id); } catch (e) { return 0; }
}


/**
 * ======================= FITUR B: JADWAL DAN SHIFT =======================
 * Prioritas jadwal: perubahan manual/tukar shift (sheet kalender, isi = nomor shift atau LIBUR, per karyawan) -> pola akun (TETAP/BERGILIR) -> shift bawaan akun.
 * Fungsi inti jadwalKaryawanHari/shiftMenurutPola dipakai apa adanya. Perubahan jadwal hanya berlaku hari ini dan seterusnya.
 * Tukar shift disimpan di sheet izin (jenis TUKAR_SHIFT / PINDAH_SHIFT; rekan, status_rekan, shift_asal, shift_tujuan).
 */
var MAKS_PERUBAHAN_JADWAL = 300;
var GANTI_SETIAP_SAH = ['1M', '2M', '1B', '3B'];

/** Fungsi murni: tanggal Senin dari minggu yang memuat tanggal itu. */
function seninDariTanggal(t) { return geserTanggal(t, -((hariKeIndeks(t) + 6) % 7)); }

/** Fungsi murni: nilai sel jadwal sah: '' (kembali ke pola), 'L' (libur), atau nomor shift yang ada. */
function nilaiJadwalSah(nilai, noValid) {
  const v = String(nilai === undefined || nilai === null ? '' : nilai).trim().toUpperCase();
  if (v === '' || v === 'L') { return true; }
  return /^\d{1,2}$/.test(v) && noValid.indexOf(Number(v)) >= 0;
}

/**
 * Fungsi murni: jadwal satu minggu (Senin-Sabtu) per akun. Sel = { t: tanggal, s: nomor shift atau null, l: libur?, m: ada perubahan manual milik karyawan? }.
 */
function jadwalMingguan(akunList, senin, kalender, liburMinggu) {
  return akunList.map(function (a) {
    const sel = [];
    for (let i = 0; i < 6; i++) {
      const t = geserTanggal(senin, i);
      const j = jadwalKaryawanHari(a, t, kalender, liburMinggu === true);
      const manual = kalender.some(function (k) {
        return k.tanggal === t && String(k.karyawan) === String(a.id) && String(k.isi).trim() !== '' && (String(k.cabang) === '' || String(k.cabang) === String(a.cabang));
      });
      sel.push({ t: t, s: j.libur ? null : j.shift, l: j.libur === true, m: manual });
    }
    return { id: a.id, nama: a.nama, panggilan: a.panggilan, role: a.role, sel: sel };
  });
}

/**
 * Fungsi murni: apa yang harus ditulis ke sheet kalender supaya jadwal satu karyawan pada satu tanggal menjadi `nilai`?
 * Kembalian { aksi: 'TETAP' | 'HAPUS' | 'TULIS', isi }. HAPUS = isi sel milik karyawan dikosongkan (kembali ke pola/umum); baris tidak dihapus.
 */
function rencanaTulisKalender(akun, tanggal, nilai, kalender, liburMinggu) {
  const v = String(nilai === undefined || nilai === null ? '' : nilai).trim().toUpperCase();
  const sekarang = jadwalKaryawanHari(akun, tanggal, kalender, liburMinggu === true);
  const tanpaMilikKaryawan = kalender.filter(function (k) { return String(k.karyawan) !== String(akun.id); });
  const dasar = jadwalKaryawanHari(akun, tanggal, tanpaMilikKaryawan, liburMinggu === true);
  const sama = function (a, b) { return a.libur === b.libur && (a.libur || a.shift === b.shift); };
  const target = v === '' ? dasar : (v === 'L' ? { libur: true, shift: null } : { libur: false, shift: Number(v) });
  if (sama(target, sekarang)) { return { aksi: 'TETAP', isi: '' }; }
  if (sama(target, dasar)) { return { aksi: 'HAPUS', isi: '' }; }
  return { aksi: 'TULIS', isi: target.libur ? 'LIBUR' : String(target.shift) };
}

/**
 * Fungsi murni: validasi daftar perubahan jadwal dari admin. ctx = { hariIni, cabang, aktorId, noValid:[nomor shift], akunPeta:{id:{role,cabang,aktif}} }.
 * Admin tidak boleh mengubah jadwalnya sendiri (urusan owner). Hanya hari ini dan seterusnya. Kembalian { ok, pesan, daftar }.
 */
function validasiPerubahanJadwal(daftar, ctx) {
  if (!Array.isArray(daftar) || !daftar.length) { return { ok: false, pesan: 'Tidak ada perubahan untuk disimpan' }; }
  if (daftar.length > MAKS_PERUBAHAN_JADWAL) { return { ok: false, pesan: 'Terlalu banyak perubahan sekaligus (maksimal ' + MAKS_PERUBAHAN_JADWAL + ')' }; }
  const hasil = [];
  for (let i = 0; i < daftar.length; i++) {
    const d = daftar[i] || {};
    const akun = ctx.akunPeta[String(d.karyawan)];
    if (!akun || akun.aktif !== true || (akun.role !== 'KARYAWAN' && akun.role !== 'ADMIN')) { return { ok: false, pesan: 'Ada karyawan yang tidak dikenal' }; }
    if (akun.cabang !== ctx.cabang) { return { ok: false, pesan: 'Hanya boleh mengatur jadwal karyawan di cabang sendiri' }; }
    if (String(d.karyawan) === String(ctx.aktorId)) { return { ok: false, pesan: 'Admin tidak mengatur jadwalnya sendiri. Itu tugas owner.' }; }
    if (!tanggalIzinSah(d.tanggal)) { return { ok: false, pesan: 'Ada tanggal yang tidak valid' }; }
    if (String(d.tanggal) < ctx.hariIni) { return { ok: false, pesan: 'Jadwal hanya bisa diubah untuk hari ini dan seterusnya' }; }
    if (!nilaiJadwalSah(d.nilai, ctx.noValid)) { return { ok: false, pesan: 'Shift yang dipilih tidak ada di cabang ini' }; }
    hasil.push({ karyawan: String(d.karyawan), tanggal: String(d.tanggal), nilai: String(d.nilai === undefined || d.nilai === null ? '' : d.nilai).trim().toUpperCase() });
  }
  return { ok: true, daftar: hasil };
}

/**
 * Fungsi murni: perubahan untuk "Salin minggu lalu". Sel minggu lalu (efektif) disalin ke minggu yang sama minggu ini hanya untuk tanggal
 * hari ini dan seterusnya; tanggal libur seluruh toko (Minggu / tanggal merah umum), di minggu asal maupun tujuan, dilewati.
 */
function rencanaSalinMinggu(akunList, seninTujuan, hariIni, kalender, liburMinggu) {
  const seninSumber = geserTanggal(seninTujuan, -7);
  const umum = kalender.filter(function (k) { return String(k.karyawan) === ''; });
  const hasil = [];
  akunList.forEach(function (a) {
    for (let i = 0; i < 6; i++) {
      const tS = geserTanggal(seninSumber, i), tT = geserTanggal(seninTujuan, i);
      if (tT < hariIni) { continue; }
      if (jadwalKaryawanHari(a, tS, umum, liburMinggu === true).libur) { continue; }
      if (jadwalKaryawanHari(a, tT, umum, liburMinggu === true).libur) { continue; }
      const src = jadwalKaryawanHari(a, tS, kalender, liburMinggu === true);
      hasil.push({ karyawan: String(a.id), tanggal: tT, nilai: src.libur ? 'L' : (src.shift === null ? '' : String(src.shift)) });
    }
  });
  return hasil;
}

/** Fungsi murni: tukar shift satu hari oleh admin (layar 56). Keduanya harus terjadwal masuk dengan shift berbeda; hasil saling bertukar. */
function rencanaTukarHari(a, b, tanggal, kalender, liburMinggu, hariIni) {
  if (!a || !b) { return { ok: false, pesan: 'Pilih dua karyawan' }; }
  if (String(a.id) === String(b.id)) { return { ok: false, pesan: 'Pilih dua karyawan yang berbeda' }; }
  if (!tanggalIzinSah(tanggal)) { return { ok: false, pesan: 'Tanggal tidak valid' }; }
  if (tanggal < hariIni) { return { ok: false, pesan: 'Jadwal hanya bisa diubah untuk hari ini dan seterusnya' }; }
  const ja = jadwalKaryawanHari(a, tanggal, kalender, liburMinggu === true), jb = jadwalKaryawanHari(b, tanggal, kalender, liburMinggu === true);
  if (ja.libur || ja.shift === null || jb.libur || jb.shift === null) { return { ok: false, pesan: 'Kedua karyawan harus terjadwal masuk pada tanggal itu' }; }
  if (ja.shift === jb.shift) { return { ok: false, pesan: 'Keduanya sudah berada di shift yang sama' }; }
  return { ok: true, a_dari: ja.shift, a_ke: jb.shift, b_dari: jb.shift, b_ke: ja.shift };
}

/**
 * Fungsi murni: validasi pola shift. p = { pola_shift:'TETAP'|'BERGILIR', urutan: [nomor] | "1,2", ganti_setiap, mulai_pola }.
 * BERGILIR: minimal 2 entri dan 2 shift berbeda, semua shift ada di cabang, ganti 1M/2M/1B/3B, tanggal mulai wajib. TETAP: hanya pola_shift berubah.
 */
function validasiPolaShift(p, noValid) {
  const pola = String(p.pola_shift || '').toUpperCase();
  if (pola === 'TETAP') { return { ok: true, nilai: { pola_shift: 'TETAP' } }; }
  if (pola !== 'BERGILIR') { return { ok: false, pesan: 'Pola harus Tetap atau Bergilir' }; }
  const mentah = Array.isArray(p.urutan) ? p.urutan : String(p.urutan === undefined || p.urutan === null ? '' : p.urutan).split(',');
  const urutan = mentah.map(function (x) { return String(x).trim(); }).filter(function (x) { return x !== ''; });
  if (urutan.length < 2 || urutan.length > 8) { return { ok: false, pesan: 'Urutan shift minimal 2 dan maksimal 8' }; }
  for (let i = 0; i < urutan.length; i++) {
    if (!/^\d{1,2}$/.test(urutan[i]) || noValid.indexOf(Number(urutan[i])) < 0) { return { ok: false, pesan: 'Ada shift di urutan yang tidak ada di cabang ini' }; }
  }
  if (urutan.every(function (x) { return x === urutan[0]; })) { return { ok: false, pesan: 'Urutan harus memuat minimal dua shift yang berbeda' }; }
  const ganti = String(p.ganti_setiap || '').toUpperCase();
  if (GANTI_SETIAP_SAH.indexOf(ganti) < 0) { return { ok: false, pesan: 'Pilih ganti setiap 1 minggu, 2 minggu, 1 bulan, atau 3 bulan' }; }
  if (!tanggalIzinSah(p.mulai_pola)) { return { ok: false, pesan: 'Tanggal mulai wajib diisi' }; }
  return { ok: true, nilai: { pola_shift: 'BERGILIR', urutan_shift: urutan.join(','), ganti_setiap: ganti, mulai_pola: String(p.mulai_pola) } };
}

/** Fungsi murni: pratinjau n minggu: [{ mulai (Senin), selesai (Sabtu), shift }]; memakai shiftMenurutPola yang sama dengan jadwal sebenarnya (nilai hari Senin). */
function pratinjauPola(akunPola, senin, nMinggu) {
  const hasil = [];
  for (let i = 0; i < nMinggu; i++) {
    const m = geserTanggal(senin, i * 7);
    hasil.push({ mulai: m, selesai: geserTanggal(m, 5), shift: shiftMenurutPola(akunPola, m) });
  }
  return hasil;
}

// ---------- Tukar shift antar karyawan ----------

function jenisTukar(jenis) { const j = String(jenis).toUpperCase(); return j === 'TUKAR_SHIFT' || j === 'PINDAH_SHIFT'; }

/** Fungsi murni: apakah salah satu id sudah punya tukar/pindah shift yang masih berjalan (MENUNGGU/DITERIMA, rekan belum menolak/batal) pada tanggal itu? */
function tukarBentrok(rows, ids, tanggal) {
  return rows.some(function (r) {
    if (!jenisTukar(r.jenis) || String(r.mulai) !== tanggal) { return false; }
    if (STATUS_IZIN_AKTIF.indexOf(String(r.status).toUpperCase()) < 0) { return false; }
    const sr = String(r.status_rekan).toUpperCase();
    if (sr === 'TOLAK' || sr === 'BATAL') { return false; }
    return ids.indexOf(String(r.karyawan)) >= 0 || ids.indexOf(String(r.rekan)) >= 0;
  });
}

/**
 * Fungsi murni: validasi pengajuan tukar/pindah shift. p = { jenis, tanggal, hariIni, detikSekarang, pemohon:{id,role,cabang,aktif}, rekan:{...},
 * jPemohon:{libur,shift}, jRekan:{libur,shift}, masukShift:{nomor:'HH:mm'}, izinRows }.
 * Admin tidak mengajukan tukar shift (jadwalnya diatur owner). Rekan harus KARYAWAN aktif di cabang yang sama. Kembalian { ok, pesan, shift_asal, shift_tujuan }.
 */
function validasiAjuTukar(p) {
  if (!jenisTukar(p.jenis)) { return { ok: false, pesan: 'Pilih tukar dengan rekan atau pindah shift' }; }
  if (!p.pemohon || p.pemohon.role !== 'KARYAWAN') { return { ok: false, pesan: 'Tukar shift diajukan oleh karyawan. Jadwal admin diatur oleh owner.' }; }
  if (!p.rekan || p.rekan.aktif !== true || p.rekan.role !== 'KARYAWAN') { return { ok: false, pesan: 'Pilih rekan karyawan yang aktif' }; }
  if (String(p.rekan.id) === String(p.pemohon.id)) { return { ok: false, pesan: 'Rekan tidak boleh diri sendiri' }; }
  if (p.rekan.cabang !== p.pemohon.cabang) { return { ok: false, pesan: 'Rekan harus di cabang yang sama' }; }
  if (!tanggalIzinSah(p.tanggal)) { return { ok: false, pesan: 'Tanggal tidak valid' }; }
  if (p.tanggal < p.hariIni) { return { ok: false, pesan: 'Tanggal yang sudah lewat tidak bisa diajukan' }; }
  if (!p.jPemohon || p.jPemohon.libur || p.jPemohon.shift === null || !p.jRekan || p.jRekan.libur || p.jRekan.shift === null) { return { ok: false, pesan: 'Anda dan rekan harus sama-sama terjadwal masuk pada tanggal itu' }; }
  if (p.jPemohon.shift === p.jRekan.shift) { return { ok: false, pesan: 'Anda dan rekan sudah di shift yang sama' }; }
  const masukA = p.masukShift[String(p.jPemohon.shift)], masukB = p.masukShift[String(p.jRekan.shift)];
  if (p.tanggal === p.hariIni) {
    const batas = [masukA, masukB].filter(function (x) { return !!x; }).map(jamKeDetik);
    if (!batas.length || p.detikSekarang >= Math.min.apply(null, batas)) { return { ok: false, pesan: 'Sudah lewat jam masuk shift pada hari itu. Ajukan untuk tanggal lain.' }; }
  }
  const ids = [String(p.pemohon.id), String(p.rekan.id)];
  if (tukarBentrok(p.izinRows, ids, p.tanggal)) { return { ok: false, pesan: 'Sudah ada tukar shift lain pada tanggal itu' }; }
  const izinBentrok = p.izinRows.some(function (r) {
    return !jenisTukar(r.jenis) && STATUS_IZIN_AKTIF.indexOf(String(r.status).toUpperCase()) >= 0 && ids.indexOf(String(r.karyawan)) >= 0 && String(r.mulai) <= p.tanggal && p.tanggal <= String(r.selesai);
  });
  if (izinBentrok) { return { ok: false, pesan: 'Anda atau rekan sedang izin/cuti pada tanggal itu' }; }
  return { ok: true, shift_asal: p.jPemohon.shift, shift_tujuan: p.jRekan.shift };
}

/**
 * Fungsi murni: baris tukar/pindah yang harus BATAL otomatis: rekan belum menjawab sampai jam masuk shift yang ditukar (paling awal dari dua shift)
 * atau tanggalnya sudah lewat. jamMasukFn(baris) -> detik jam masuk paling awal, atau null kalau tidak diketahui.
 */
function tukarKedaluwarsa(rows, hariIni, detikSekarang, jamMasukFn) {
  return rows.filter(function (r) {
    if (!jenisTukar(r.jenis) || String(r.status).toUpperCase() !== 'MENUNGGU' || String(r.status_rekan).toUpperCase() !== 'MENUNGGU') { return false; }
    const t = String(r.mulai);
    if (t < hariIni) { return true; }
    if (t === hariIni) { const j = jamMasukFn(r); return j !== null && j !== undefined && detikSekarang >= j; }
    return false;
  });
}

/** Fungsi murni: jumlah ajakan tukar yang menunggu jawaban rekan ini. */
function jumlahTukarMasuk(rows, idRekan) {
  return rows.filter(function (r) {
    return jenisTukar(r.jenis) && String(r.rekan) === String(idRekan) && String(r.status).toUpperCase() === 'MENUNGGU' && String(r.status_rekan).toUpperCase() === 'MENUNGGU';
  }).length;
}

/** Fungsi murni: "Sel 6 Okt" untuk tanggal yyyy-MM-dd. */
function hariTanggalPendek(t) {
  const b = bagianTanggal(t);
  return HARI_PENDEK[hariKeIndeks(t)] + ' ' + b.d + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][b.m - 1];
}

/**
 * Fungsi murni: item Konfirmasi tukar/pindah shift: hanya yang MENUNGGU dan rekan sudah SETUJU. petaAkun = { id: { nama, panggilan, cabang, role } }.
 * Judul "Tukar shift · rekan setuju", nama "Dina ⇄ Ari", rincian "Sel 6 Okt · Dina → Shift 1, Ari → Shift 2". Id "TUKAR|<grup>".
 */
function rakitItemTukar(rows, petaAkun) {
  const items = [];
  rows.forEach(function (r) {
    if (!jenisTukar(r.jenis) || String(r.status).toUpperCase() !== 'MENUNGGU' || String(r.status_rekan).toUpperCase() !== 'SETUJU') { return; }
    const a = petaAkun[String(r.karyawan)] || {}, b = petaAkun[String(r.rekan)] || {};
    const pa = a.panggilan || a.nama || String(r.karyawan), pb = b.panggilan || b.nama || String(r.rekan);
    const tukar = String(r.jenis).toUpperCase() === 'TUKAR_SHIFT';
    items.push({
      id: 'TUKAR|' + String(r.grup || r.id), jenis: 'TUKAR', kelompok: 'TUKAR', karyawan: String(r.karyawan), nama: tukar ? pa + ' ⇄ ' + pb : pa,
      cabang: a.cabang || '', role: a.role || 'KARYAWAN', tanggal: String(r.mulai), jam: '', shift: '',
      judul: (tukar ? 'Tukar shift' : 'Pindah shift') + ' · rekan setuju',
      rincian: hariTanggalPendek(String(r.mulai)) + ' · ' + pa + ' → Shift ' + r.shift_tujuan + (tukar ? ', ' + pb + ' → Shift ' + r.shift_asal : ''),
      ket: String(r.ket || ''), surat: false, sakit: false, hari: 1, mulai: String(r.mulai), selesai: String(r.mulai), telat_aju: false,
      luar: false, gps: '', dalam_area_toko: false, tingkat: 0, durasi_menit: 0, foto: 'TANPA'
    });
  });
  return items;
}

/** Fungsi murni: id item "TUKAR|IZN-2026-0014" -> grup; null kalau bentuknya salah. */
function parseIdItemTukar(id) {
  const m = /^TUKAR\|(IZN-\d{4}-\d{4}(?:-[A-Z])?)$/.exec(String(id || ''));
  return m ? m[1] : null;
}

/**
 * Fungsi murni: saat admin ACC, pastikan jadwal belum berubah lalu kembalikan tulisan kalender.
 * row = baris tukar; jPemohon/jRekan = jadwal efektif saat ini. TUKAR: pemohon -> shift_tujuan, rekan -> shift_asal. PINDAH: hanya pemohon -> shift_tujuan.
 */
function rencanaTerapkanTukar(row, jPemohon, jRekan) {
  const asal = Number(row.shift_asal), tujuan = Number(row.shift_tujuan);
  const tukar = String(row.jenis).toUpperCase() === 'TUKAR_SHIFT';
  const pesan = 'Jadwal sudah berubah sejak diajukan. Tolak pengajuan ini lalu minta karyawan mengajukan ulang.';
  if (!jPemohon || jPemohon.libur || jPemohon.shift !== asal) { return { ok: false, pesan: pesan }; }
  if (tukar && (!jRekan || jRekan.libur || jRekan.shift !== tujuan)) { return { ok: false, pesan: pesan }; }
  const tulis = [{ karyawan: String(row.karyawan), tanggal: String(row.mulai), nilai: String(tujuan) }];
  if (tukar) { tulis.push({ karyawan: String(row.rekan), tanggal: String(row.mulai), nilai: String(asal) }); }
  return { ok: true, tulis: tulis };
}

/** Fungsi murni: shift mana yang sedang "aktif" (jendela buka absen sampai jam pulang): [nomor]. shiftList = [{no,masuk,pulang}], jam 'HH:mm'. */
function shiftAktifSekarang(shiftList, jam, jendelaMenit) {
  const s = jamKeDetik(jam);
  return shiftList.filter(function (x) {
    if (!x.masuk || !x.pulang) { return false; }
    return s >= jamKeDetik(x.masuk) - (jendelaMenit || 0) * 60 && s <= jamKeDetik(x.pulang);
  }).map(function (x) { return nomorShift(x.no); });
}

/** Fungsi murni: jadwal hari ini per shift. akunList (aktif, cabang yang sama), kalender, izin (untuk menyingkirkan yang izin/cuti). Kembalian { nomorShift: [panggilan urut abjad] }. */
function terjadwalPerShift(akunList, tanggal, kalender, izin, liburMinggu) {
  const izinId = {};
  izin.forEach(function (z) {
    if (jenisTukar(z.jenis) || STATUS_IZIN_AKTIF.indexOf(String(z.status).toUpperCase()) < 0) { return; }
    if (String(z.mulai) <= tanggal && tanggal <= String(z.selesai)) { izinId[String(z.karyawan)] = true; }
  });
  const hasil = {};
  akunList.forEach(function (a) {
    if (a.aktif !== true || (a.role !== 'KARYAWAN' && a.role !== 'ADMIN') || izinId[String(a.id)]) { return; }
    const j = jadwalKaryawanHari(a, tanggal, kalender, liburMinggu === true);
    if (j.libur || j.shift === null) { return; }
    (hasil[j.shift] = hasil[j.shift] || []).push(String(a.panggilan || a.nama));
  });
  Object.keys(hasil).forEach(function (k) { hasil[k].sort(function (x, y) { return x.toLowerCase() < y.toLowerCase() ? -1 : (x.toLowerCase() > y.toLowerCase() ? 1 : 0); }); });
  return hasil;
}

// ---------- akses sheet untuk jadwal dan tukar shift ----------

/** Akun aktif (KARYAWAN dan ADMIN) di satu cabang, mulai_pola dinormalkan. */
function akunCabangAktif(cabang) {
  return bacaSheet('akun').data.filter(function (r) { return r.aktif === true && (r.role === 'KARYAWAN' || r.role === 'ADMIN') && r.cabang === cabang; }).map(function (a) {
    a.mulai_pola = a.mulai_pola === '' ? '' : normTanggalIzin(a.mulai_pola);
    return a;
  });
}
function nomorShiftCabang(cabang) { return bacaShiftCabang(cabang).map(function (s) { return nomorShift(s.no); }).filter(function (n) { return n !== null; }); }
function infoShiftUntukKlien(cabang) { return bacaShiftCabang(cabang).map(function (s) { return { no: nomorShift(s.no), nama: s.nama, masuk: s.masuk, pulang: s.pulang }; }); }

/** Tulis satu perubahan jadwal ke sheet kalender (milik karyawan, cabang = cabang akun) memakai rencanaTulisKalender; kal = hasil bacaKalenderTernormalisasi (diperbarui di memori). */
function terapkanPerubahanJadwal(kal, akun, tanggal, nilai, liburMinggu) {
  const r = rencanaTulisKalender(akun, tanggal, nilai, kal.data, liburMinggu);
  if (r.aksi === 'TETAP') { return 'TETAP'; }
  const ada = kal.data.find(function (k) { return k.tanggal === tanggal && k.cabang === akun.cabang && k.karyawan === String(akun.id); });
  if (ada) { perbaruiKolom(kal, ada, { isi: r.isi }); ada.isi = r.isi; }
  else if (r.aksi === 'TULIS') {
    const baris = { tanggal: tanggal, cabang: akun.cabang, karyawan: String(akun.id), isi: r.isi };
    tambahBarisSheet(kal, baris);
    kal.data.push({ tanggal: tanggal, cabang: akun.cabang, karyawan: String(akun.id), isi: r.isi });
  }
  return r.aksi;
}

/** Aksi jadwal_hari_ini { token }: daftar shift cabang HP toko + nama panggilan terjadwal hari ini (layar 02). Hanya membaca. */
function prosesJadwalHariIni(hp) {
  const sekarang = new Date();
  const tanggal = Utilities.formatDate(sekarang, ZONA_ABSEN, 'yyyy-MM-dd'), jam = Utilities.formatDate(sekarang, ZONA_ABSEN, 'HH:mm');
  const shifts = bacaShiftCabang(hp.cabang);
  const per = terjadwalPerShift(akunCabangAktif(hp.cabang), tanggal, bacaKalenderTernormalisasi().data, bacaIzinTernormalisasi().data, liburMingguCabang(hp.cabang));
  const aktif = shiftAktifSekarang(shifts, jam, ambilNilaiUmum('jendela_absen_menit', 60));
  return respon({
    status: 'ok', tanggal: tanggal, jam: jam,
    shift: shifts.map(function (s) { const n = nomorShift(s.no); return { no: n, nama: s.nama, masuk: s.masuk, pulang: s.pulang, aktif: aktif.indexOf(n) >= 0, karyawan: per[n] || [] }; })
  });
}

/** Aksi jadwal_baca { kredensial admin, mulai? }: jadwal Senin-Sabtu (minggu yang memuat `mulai`, bawaan minggu ini) seluruh karyawan cabang admin. */
function prosesJadwalBaca(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const cabang = a.s.akun.cabang;
  const hariIni = hariIniServer();
  const senin = seninDariTanggal(tanggalIzinSah(d.mulai) ? String(d.mulai) : hariIni);
  const akun = akunCabangAktif(cabang).sort(function (x, y) { return String(x.nama).toLowerCase() < String(y.nama).toLowerCase() ? -1 : 1; });
  return respon({
    status: 'ok', cabang: cabang, senin: senin, hari_ini: hariIni, aktor: String(a.s.akun.id),
    shift: infoShiftUntukKlien(cabang),
    daftar: jadwalMingguan(akun, senin, bacaKalenderTernormalisasi().data, liburMingguCabang(cabang))
  });
}

function petaAkunCabang(cabang) {
  const peta = {};
  bacaSheet('akun').data.forEach(function (r) { peta[String(r.id)] = { role: r.role, cabang: String(r.cabang), aktif: r.aktif === true }; });
  return peta;
}

/** Aksi jadwal_simpan { kredensial admin, perubahan:[{karyawan, tanggal, nilai}] }: nilai = nomor shift, "L" (libur), atau "" (kembali ke pola). Dicatat di log. */
function prosesJadwalSimpan(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const v = validasiPerubahanJadwal(d.perubahan, { hariIni: hariIniServer(), cabang: admin.cabang, aktorId: admin.id, noValid: nomorShiftCabang(admin.cabang), akunPeta: petaAkunCabang(admin.cabang) });
    if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
    const akunMap = {};
    akunCabangAktif(admin.cabang).forEach(function (x) { akunMap[String(x.id)] = x; });
    const kal = bacaKalenderTernormalisasi();
    const lm = liburMingguCabang(admin.cabang);
    let berubah = 0;
    const ringkas = [];
    v.daftar.forEach(function (p) {
      const hasil = terapkanPerubahanJadwal(kal, akunMap[p.karyawan], p.tanggal, p.nilai, lm);
      if (hasil !== 'TETAP') { berubah++; if (ringkas.length < 8) { ringkas.push(p.karyawan + ' ' + p.tanggal + '=' + (p.nilai === '' ? 'pola' : p.nilai)); } }
    });
    if (berubah) { tambahLog({ jenis: 'JADWAL', oleh: admin.id, cabang: admin.cabang, aksi: 'UBAH_JADWAL', target: berubah + ' sel', id: '', sebelum: '', sesudah: ringkas.join('; ') }); }
    return respon({ status: 'ok', berubah: berubah });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi jadwal_salin { kredensial admin, senin }: salin jadwal minggu sebelumnya ke minggu itu (hanya hari ini dan seterusnya, libur toko dilewati). */
function prosesJadwalSalin(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  if (!tanggalIzinSah(d.senin) || seninDariTanggal(String(d.senin)) !== String(d.senin)) { return respon({ status: 'gagal', pesan: 'Minggu tidak valid' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const hariIni = hariIniServer();
    const akun = akunCabangAktif(admin.cabang).filter(function (x) { return String(x.id) !== String(admin.id); });
    const kal = bacaKalenderTernormalisasi();
    const lm = liburMingguCabang(admin.cabang);
    const rencana = rencanaSalinMinggu(akun, String(d.senin), hariIni, kal.data, lm);
    const akunMap = {}; akun.forEach(function (x) { akunMap[String(x.id)] = x; });
    let berubah = 0;
    rencana.forEach(function (p) { if (terapkanPerubahanJadwal(kal, akunMap[p.karyawan], p.tanggal, p.nilai, lm) !== 'TETAP') { berubah++; } });
    tambahLog({ jenis: 'JADWAL', oleh: admin.id, cabang: admin.cabang, aksi: 'SALIN_MINGGU', target: String(d.senin), id: '', sebelum: '', sesudah: berubah + ' sel berubah' });
    return respon({ status: 'ok', berubah: berubah });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi jadwal_hari { kredensial admin, tanggal }: karyawan cabang yang terjadwal masuk pada tanggal itu (untuk layar Tukar shift 56), tanpa admin yang sedang login. */
function prosesJadwalHari(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  if (!tanggalIzinSah(d.tanggal)) { return respon({ status: 'gagal', pesan: 'Tanggal tidak valid' }); }
  const cabang = a.s.akun.cabang, tanggal = String(d.tanggal);
  const kal = bacaKalenderTernormalisasi().data, lm = liburMingguCabang(cabang);
  const daftar = [];
  akunCabangAktif(cabang).forEach(function (x) {
    if (String(x.id) === String(a.s.akun.id)) { return; }
    const j = jadwalKaryawanHari(x, tanggal, kal, lm);
    if (!j.libur && j.shift !== null) { daftar.push({ id: String(x.id), nama: String(x.nama), panggilan: String(x.panggilan || x.nama), shift: j.shift }); }
  });
  daftar.sort(function (x, y) { return x.nama.toLowerCase() < y.nama.toLowerCase() ? -1 : 1; });
  return respon({ status: 'ok', hari_ini: hariIniServer(), daftar: daftar });
}

/** Aksi jadwal_tukar { kredensial admin, tanggal, k1, k2 }: admin menukar shift dua karyawan untuk SATU hari (besok kembali ke pola). */
function prosesJadwalTukar(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const peta = {};
    akunCabangAktif(admin.cabang).forEach(function (x) { peta[String(x.id)] = x; });
    const k1 = peta[String(d.k1)], k2 = peta[String(d.k2)];
    if (!k1 || !k2) { return respon({ status: 'gagal', pesan: 'Pilih dua karyawan di cabang ini' }); }
    if (String(k1.id) === String(admin.id) || String(k2.id) === String(admin.id)) { return respon({ status: 'gagal', pesan: 'Admin tidak menukar jadwalnya sendiri. Itu tugas owner.' }); }
    const kal = bacaKalenderTernormalisasi();
    const lm = liburMingguCabang(admin.cabang);
    const r = rencanaTukarHari(k1, k2, String(d.tanggal || ''), kal.data, lm, hariIniServer());
    if (!r.ok) { return respon({ status: 'gagal', pesan: r.pesan }); }
    terapkanPerubahanJadwal(kal, k1, String(d.tanggal), String(r.a_ke), lm);
    terapkanPerubahanJadwal(kal, k2, String(d.tanggal), String(r.b_ke), lm);
    tambahLog({ jenis: 'JADWAL', oleh: admin.id, cabang: admin.cabang, aksi: 'TUKAR_SHIFT_ADMIN', target: k1.nama + ' <-> ' + k2.nama + ' ' + d.tanggal, id: String(d.tanggal), sebelum: k1.id + '=' + r.a_dari + ', ' + k2.id + '=' + r.b_dari, sesudah: k1.id + '=' + r.a_ke + ', ' + k2.id + '=' + r.b_ke });
    return respon({ status: 'ok', a_ke: r.a_ke, b_ke: r.b_ke });
  } finally {
    kunci.releaseLock();
  }
}

// ---------- pola shift (layar 57) ----------

/** Karyawan (role KARYAWAN, aktif, cabang admin) yang pola shiftnya diatur; { akun } atau { gagal }. */
function targetPola(a, id) {
  const akun = akunLengkapAktif(id);
  if (!akun || akun.role !== 'KARYAWAN') { return { gagal: respon({ status: 'gagal', pesan: 'Pilih karyawan yang valid' }) }; }
  if (akun.cabang !== a.s.akun.cabang) { return { gagal: respon({ status: 'gagal', pesan: 'Hanya boleh untuk karyawan di cabang sendiri' }) }; }
  return { akun: akun };
}

/** Aksi pola_baca { kredensial admin, karyawan }: pola saat ini + shift cabang. */
function prosesPolaBaca(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const t = targetPola(a, d.karyawan);
  if (t.gagal) { return t.gagal; }
  const ak = t.akun, hariIni = hariIniServer();
  const urutan = String(ak.urutan_shift || '').split(',').map(nomorShift).filter(function (x) { return x !== null; });
  return respon({
    status: 'ok', id: String(ak.id), nama: String(ak.nama), hari_ini: hariIni, senin: seninDariTanggal(hariIni), shift: infoShiftUntukKlien(ak.cabang),
    pola_shift: String(ak.pola_shift).toUpperCase() === 'BERGILIR' ? 'BERGILIR' : 'TETAP', urutan: urutan, shift_bawaan: nomorShift(ak.shift),
    ganti_setiap: GANTI_SETIAP_SAH.indexOf(String(ak.ganti_setiap).toUpperCase()) >= 0 ? String(ak.ganti_setiap).toUpperCase() : '1M',
    mulai_pola: tanggalIzinSah(ak.mulai_pola) ? String(ak.mulai_pola) : seninDariTanggal(hariIni)
  });
}

/** Aksi pola_pratinjau { kredensial admin, karyawan, pola_shift, urutan, ganti_setiap, mulai_pola }: 4 minggu ke depan memakai fungsi jadwal yang sama; tidak menyimpan. */
function prosesPolaPratinjau(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const t = targetPola(a, d.karyawan);
  if (t.gagal) { return t.gagal; }
  const v = validasiPolaShift(d, nomorShiftCabang(t.akun.cabang));
  if (!v.ok) { return respon({ status: 'ok', bisa: false, pesan: v.pesan, minggu: [] }); }
  const baru = Object.assign({}, t.akun, v.nilai);
  return respon({ status: 'ok', bisa: true, pesan: '', minggu: pratinjauPola(baru, seninDariTanggal(hariIniServer()), 4) });
}

/** Aksi pola_simpan { kredensial admin, karyawan, pola_shift, urutan, ganti_setiap, mulai_pola }: simpan ke akun karyawan. Dicatat di log. */
function prosesPolaSimpan(d) {
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a.gagal; }
  const t = targetPola(a, d.karyawan);
  if (t.gagal) { return t.gagal; }
  const v = validasiPolaShift(d, nomorShiftCabang(t.akun.cabang));
  if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const sheet = bacaSheet('akun');
    const baris = sheet.data.find(function (r) { return String(r.id) === String(t.akun.id); });
    const sebelum = [baris.pola_shift, baris.urutan_shift, baris.ganti_setiap, normTanggalIzin(baris.mulai_pola)].join('|');
    perbaruiKolom(sheet, baris, v.nilai);
    tambahLog({ jenis: 'JADWAL', oleh: a.s.akun.id, cabang: t.akun.cabang, aksi: 'UBAH_POLA', target: t.akun.nama, id: String(t.akun.id), sebelum: sebelum, sesudah: [v.nilai.pola_shift, v.nilai.urutan_shift || '', v.nilai.ganti_setiap || '', v.nilai.mulai_pola || ''].join('|') });
    return respon({ status: 'ok' });
  } finally {
    kunci.releaseLock();
  }
}

// ---------- tukar shift antar karyawan ----------

function detikSekarangServer() { return jamKeDetik(Utilities.formatDate(new Date(), ZONA_ABSEN, 'HH:mm')); }

/** Batalkan otomatis ajakan tukar yang melewati batas (rekan belum menjawab sampai jam masuk shift yang ditukar). Dipanggil saat data tukar dibaca. */
function bereskanTukarKedaluwarsa() {
  const izin = bacaIzinTernormalisasi();
  if (!izin.data.some(function (r) { return jenisTukar(r.jenis) && String(r.status).toUpperCase() === 'MENUNGGU' && String(r.status_rekan).toUpperCase() === 'MENUNGGU'; })) { return 0; }
  const peta = petaAkunUntukIzin();
  const cacheShift = {};
  const masuk = function (cabang, no) {
    if (!cacheShift[cabang]) { cacheShift[cabang] = {}; bacaShiftCabang(cabang).forEach(function (s) { cacheShift[cabang][String(nomorShift(s.no))] = s.masuk; }); }
    return cacheShift[cabang][String(no)] || '';
  };
  const jamMasukFn = function (r) {
    const cab = (peta[String(r.karyawan)] || {}).cabang || '';
    const jam = [masuk(cab, r.shift_asal), masuk(cab, r.shift_tujuan)].filter(function (x) { return !!x; }).map(jamKeDetik);
    return jam.length ? Math.min.apply(null, jam) : null;
  };
  const daftar = tukarKedaluwarsa(izin.data, hariIniServer(), detikSekarangServer(), jamMasukFn);
  daftar.forEach(function (r) {
    perbaruiKolom(izin, r, { status: 'BATAL', status_rekan: 'BATAL', diputus: waktuServerTeks(), oleh: 'SISTEM' });
    tambahLog({ jenis: 'IZIN', oleh: 'SISTEM', cabang: (peta[String(r.karyawan)] || {}).cabang || '', aksi: 'TUKAR_BATAL_OTOMATIS', target: String(r.karyawan) + ' -> ' + String(r.rekan) + ' ' + r.mulai, id: String(r.grup || r.id), sebelum: 'status_rekan=MENUNGGU', sesudah: 'BATAL', alasan: 'rekan belum menjawab sampai jam masuk shift' });
  });
  return daftar.length;
}

function jumlahTukarMasukAman(id) {
  try { bereskanTukarKedaluwarsa(); return jumlahTukarMasuk(bacaIzinTernormalisasi().data, id); } catch (e) { return 0; }
}

/** Karyawan HP pribadi yang boleh mengajukan/menjawab tukar: { p, akun } atau { gagal }. */
function aktorTukar(d) {
  const a = aktorIzinPribadi(d);
  if (a.gagal) { return a; }
  return a;
}

function jadwalAkunHari(akun, tanggal, kalenderData) { return jadwalKaryawanHari(akun, tanggal, kalenderData, liburMingguCabang(akun.cabang)); }

/** Aksi tukar_rekan { sesi, tanggal }: shift saya pada tanggal itu dan rekan (karyawan cabang yang terjadwal masuk dengan shift BERBEDA). */
function prosesTukarRekan(d) {
  const a = aktorTukar(d);
  if (a.gagal) { return a.gagal; }
  if (!tanggalIzinSah(d.tanggal)) { return respon({ status: 'gagal', pesan: 'Tanggal tidak valid' }); }
  const kal = bacaKalenderTernormalisasi().data;
  const saya = jadwalAkunHari(a.akun, String(d.tanggal), kal);
  const daftar = [];
  akunCabangAktif(a.akun.cabang).forEach(function (x) {
    if (x.role !== 'KARYAWAN' || String(x.id) === String(a.akun.id)) { return; }
    const j = jadwalAkunHari(x, String(d.tanggal), kal);
    if (!j.libur && j.shift !== null && j.shift !== saya.shift) { daftar.push({ id: String(x.id), nama: String(x.nama), panggilan: String(x.panggilan || x.nama), shift: j.shift }); }
  });
  daftar.sort(function (x, y) { return x.nama.toLowerCase() < y.nama.toLowerCase() ? -1 : 1; });
  return respon({ status: 'ok', hari_ini: hariIniServer(), saya: saya.libur ? null : saya.shift, daftar: daftar, boleh: a.akun.role === 'KARYAWAN' });
}

function evaluasiTukar(akun, d) {
  const rekan = akunLengkapAktif(d.rekan);
  const tanggal = String(d.tanggal || '');
  const kal = bacaKalenderTernormalisasi().data;
  const shifts = {};
  bacaShiftCabang(akun.cabang).forEach(function (s) { shifts[String(nomorShift(s.no))] = s.masuk; });
  const izinRows = bacaIzinTernormalisasi().data;
  const jP = tanggalIzinSah(tanggal) ? jadwalAkunHari(akun, tanggal, kal) : null, jR = rekan && tanggalIzinSah(tanggal) ? jadwalAkunHari(rekan, tanggal, kal) : null;
  const v = validasiAjuTukar({
    jenis: d.jenis, tanggal: tanggal, hariIni: hariIniServer(), detikSekarang: detikSekarangServer(),
    pemohon: { id: akun.id, role: akun.role, cabang: akun.cabang, aktif: akun.aktif === true },
    rekan: rekan ? { id: rekan.id, role: rekan.role, cabang: rekan.cabang, aktif: rekan.aktif === true } : null,
    jPemohon: jP, jRekan: jR, masukShift: shifts, izinRows: izinRows
  });
  v.rekanAkun = rekan;
  return v;
}

/** Aksi tukar_pratinjau { sesi, jenis, tanggal, rekan }: hasil tanpa menyimpan. */
function prosesTukarPratinjau(d) {
  const a = aktorTukar(d);
  if (a.gagal) { return a.gagal; }
  const v = evaluasiTukar(a.akun, d);
  if (!v.ok) { return respon({ status: 'ok', bisa: false, pesan: v.pesan }); }
  return respon({ status: 'ok', bisa: true, pesan: '', hari: hariTanggalPendek(String(d.tanggal)), saya_ke: v.shift_tujuan, rekan_ke: String(d.jenis).toUpperCase() === 'TUKAR_SHIFT' ? v.shift_asal : null, rekan_nama: String(v.rekanAkun.panggilan || v.rekanAkun.nama) });
}

/** Aksi tukar_ajukan { sesi, jenis: TUKAR_SHIFT | PINDAH_SHIFT, tanggal, rekan, alasan? }: simpan di sheet izin, menunggu jawaban rekan. */
function prosesTukarAjukan(d) {
  const a = aktorTukar(d);
  if (a.gagal) { return a.gagal; }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    bereskanTukarKedaluwarsa();
    const v = evaluasiTukar(a.akun, d);
    if (!v.ok) { return respon({ status: 'gagal', pesan: v.pesan }); }
    const izin = bacaIzinTernormalisasi();
    const grup = buatGrupIzin(izin.data.map(function (r) { return r.grup || r.id; }), hariIniServer().slice(0, 4));
    const baris = {
      id: grup + '-A', grup: grup, karyawan: a.akun.id, jenis: String(d.jenis).toUpperCase(), kelompok: '', mulai: String(d.tanggal), selesai: String(d.tanggal), hari: 1,
      ket: bersihkanKetIzin(d.alasan), lampiran: '', diajukan: waktuServerTeks(), telat_aju: false, status: 'MENUNGGU', oleh: '', diputus: '',
      rekan: v.rekanAkun.id, status_rekan: 'MENUNGGU', shift_asal: v.shift_asal, shift_tujuan: v.shift_tujuan
    };
    tambahBarisSheet(izin, baris);
    tambahLog({ jenis: 'IZIN', oleh: a.akun.id, cabang: a.akun.cabang, aksi: 'AJUKAN_TUKAR', target: a.akun.nama + ' -> ' + v.rekanAkun.nama + ' ' + baris.mulai, id: grup, sebelum: '', sesudah: baris.jenis + ' MENUNGGU rekan', alasan: baris.ket });
    return respon({ status: 'ok', grup: grup });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi tukar_masuk { sesi }: ajakan tukar yang menunggu jawaban saya (rekan). Ajakan yang sudah lewat batas dibatalkan dulu. */
function prosesTukarMasuk(d) {
  const a = aktorTukar(d);
  if (a.gagal) { return a.gagal; }
  bereskanTukarKedaluwarsa();
  const peta = petaAkunUntukIzin();
  const shifts = {};
  bacaShiftCabang(a.akun.cabang).forEach(function (s) { shifts[String(nomorShift(s.no))] = s.masuk; });
  const daftar = bacaIzinTernormalisasi().data.filter(function (r) {
    return jenisTukar(r.jenis) && String(r.rekan) === String(a.akun.id) && String(r.status).toUpperCase() === 'MENUNGGU' && String(r.status_rekan).toUpperCase() === 'MENUNGGU';
  }).map(function (r) {
    const dari = peta[String(r.karyawan)] || {};
    const nama = String(dari.nama || r.karyawan);
    return {
      id: String(r.id), dari: nama, dari_panggilan: nama.split(' ')[0], tanggal: String(r.mulai), hari: HARI_PANJANG[hariKeIndeks(String(r.mulai))], tanggal_pendek: hariTanggalPendek(String(r.mulai)),
      jenis: String(r.jenis).toUpperCase(), shift_saya_jadi: String(r.jenis).toUpperCase() === 'TUKAR_SHIFT' ? Number(r.shift_asal) : Number(r.shift_tujuan), jam_shift: shifts[String(String(r.jenis).toUpperCase() === 'TUKAR_SHIFT' ? r.shift_asal : r.shift_tujuan)] || '', alasan: String(r.ket || '')
    };
  });
  return respon({ status: 'ok', daftar: daftar });
}

/** Aksi tukar_jawab { sesi, id, jawab: SETUJU | TOLAK }: hanya rekan yang diajak, hanya selama menunggu. */
function prosesTukarJawab(d) {
  const a = aktorTukar(d);
  if (a.gagal) { return a.gagal; }
  if (d.jawab !== 'SETUJU' && d.jawab !== 'TOLAK') { return respon({ status: 'gagal', pesan: 'Jawaban tidak dikenal' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    bereskanTukarKedaluwarsa();
    const izin = bacaIzinTernormalisasi();
    const r = izin.data.find(function (x) { return String(x.id) === String(d.id) && jenisTukar(x.jenis); });
    if (!r) { return respon({ status: 'gagal', pesan: 'Ajakan tidak ditemukan' }); }
    if (String(r.rekan) !== String(a.akun.id)) { return respon({ status: 'gagal', pesan: 'Ajakan ini bukan untuk Anda' }); }
    if (String(r.status).toUpperCase() !== 'MENUNGGU' || String(r.status_rekan).toUpperCase() !== 'MENUNGGU') { return respon({ status: 'gagal', pesan: 'Ajakan ini sudah tidak berlaku (sudah dijawab, dibatalkan, atau lewat batas waktu)' }); }
    const ubah = d.jawab === 'SETUJU' ? { status_rekan: 'SETUJU' } : { status_rekan: 'TOLAK', status: 'DITOLAK', diputus: waktuServerTeks(), oleh: a.akun.id };
    perbaruiKolom(izin, r, ubah);
    tambahLog({ jenis: 'IZIN', oleh: a.akun.id, cabang: a.akun.cabang, aksi: d.jawab === 'SETUJU' ? 'REKAN_SETUJU' : 'REKAN_TOLAK', target: String(r.karyawan) + ' -> ' + a.akun.nama + ' ' + r.mulai, id: String(r.grup || r.id), sebelum: 'status_rekan=MENUNGGU', sesudah: 'status_rekan=' + ubah.status_rekan });
    return respon({ status: 'ok' });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi tukar_pengingat { token HP toko, id }: berapa ajakan tukar yang menunggu jawaban karyawan itu (pengingat setelah absen di HP toko). Tanpa data lain. */
function prosesTukarPengingat(d, hp) {
  const id = String(d.id || '');
  if (!/^[A-Za-z0-9]{1,20}$/.test(id)) { return respon({ status: 'gagal', pesan: 'Id tidak valid' }); }
  const akun = bacaSheet('akun').data.find(function (r) { return String(r.id) === id && r.aktif === true && r.cabang === hp.cabang; });
  if (!akun) { return respon({ status: 'ok', jumlah: 0 }); }
  return respon({ status: 'ok', jumlah: jumlahTukarMasukAman(id) });
}

// ---------- Konfirmasi tukar shift ----------

/** Putuskan satu item tukar/pindah shift (ACC menulis kalender kedua karyawan). aktor sudah lolos autentikasi; hak diperiksa di sini. */
function putuskanItemTukar(aktor, d) {
  const grup = parseIdItemTukar(d.id);
  if (!grup) { return respon({ status: 'gagal', pesan: 'Item tidak dikenal' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const izin = bacaIzinTernormalisasi();
    const r = izin.data.find(function (x) { return jenisTukar(x.jenis) && (String(x.grup) === grup || String(x.id) === grup); });
    if (!r) { return respon({ status: 'gagal', pesan: 'Pengajuan tidak ditemukan' }); }
    if (String(r.status).toUpperCase() !== 'MENUNGGU') { return respon({ status: 'gagal', pesan: 'Item ini sudah diputuskan' }); }
    if (String(r.status_rekan).toUpperCase() !== 'SETUJU') { return respon({ status: 'gagal', pesan: 'Rekan belum menyetujui pengajuan ini' }); }
    const peta = petaAkunUntukIzin();
    const pemilik = peta[String(r.karyawan)] || { cabang: '', role: 'KARYAWAN' };
    const hak = bolehMemutuskanKonfirmasi(aktor, { karyawan: r.karyawan, cabang: pemilik.cabang, role: pemilik.role });
    if (!hak.boleh) { return respon({ status: 'gagal', pesan: hak.pesan }); }
    if (String(aktor.id) === String(r.rekan)) { return respon({ status: 'gagal', pesan: 'Admin tidak boleh memutuskan pengajuan yang melibatkan dirinya sendiri' }); }
    const waktu = waktuServerTeks();
    if (d.keputusan === 'TOLAK') {
      perbaruiKolom(izin, r, { status: 'DITOLAK', oleh: aktor.id, diputus: waktu });
      tambahLog({ jenis: 'KONFIRMASI', oleh: aktor.id, cabang: pemilik.cabang, aksi: 'TOLAK_TUKAR', target: String(r.karyawan) + ' -> ' + String(r.rekan) + ' ' + r.mulai, id: grup, sebelum: 'status=MENUNGGU', sesudah: 'status=DITOLAK' });
      return respon({ status: 'ok', keputusan: 'DITOLAK' });
    }
    if (String(r.mulai) < hariIniServer()) { return respon({ status: 'gagal', pesan: 'Tanggal tukar shift sudah lewat. Tolak pengajuan ini.' }); }
    const kal = bacaKalenderTernormalisasi();
    const akunMap = {};
    akunCabangAktif(pemilik.cabang).forEach(function (x) { akunMap[String(x.id)] = x; });
    const aP = akunMap[String(r.karyawan)], aR = akunMap[String(r.rekan)];
    if (!aP || !aR) { return respon({ status: 'gagal', pesan: 'Karyawan tidak aktif lagi. Tolak pengajuan ini.' }); }
    const lm = liburMingguCabang(pemilik.cabang);
    const rn = rencanaTerapkanTukar(r, jadwalKaryawanHari(aP, String(r.mulai), kal.data, lm), jadwalKaryawanHari(aR, String(r.mulai), kal.data, lm));
    if (!rn.ok) { return respon({ status: 'gagal', pesan: rn.pesan }); }
    rn.tulis.forEach(function (p) { terapkanPerubahanJadwal(kal, akunMap[p.karyawan], p.tanggal, p.nilai, lm); });
    perbaruiKolom(izin, r, { status: 'DITERIMA', oleh: aktor.id, diputus: waktu });
    tambahLog({ jenis: 'KONFIRMASI', oleh: aktor.id, cabang: pemilik.cabang, aksi: 'ACC_TUKAR', target: aP.nama + ' <-> ' + aR.nama + ' ' + r.mulai, id: grup, sebelum: aP.id + '=' + r.shift_asal + ', ' + aR.id + '=' + r.shift_tujuan, sesudah: rn.tulis.map(function (p) { return p.karyawan + '=' + p.nilai; }).join(', ') });
    return respon({ status: 'ok', keputusan: 'DITERIMA' });
  } finally {
    kunci.releaseLock();
  }
}


/**
 * ======================= FITUR C: KOREKSI ABSEN =======================
 * Peringatan HP toko (dobel, shift tidak sesuai jadwal, revisi lembur, lupa absen kemarin), konflik absen, absen manual (admin),
 * data absensi dan edit absen. Jam selalu dari jam SERVER (tiket / jam server), tidak pernah dari HP. Fungsi murni diuji di tesServer().
 */
var KOLOM_MASUK = ['masuk', 'st_masuk', 'telat_mnt', 'ket_masuk', 'foto_masuk', 'gps_masuk', 'cara_masuk', 'acc_masuk', 'id_masuk'];
var KOLOM_PULANG = ['pulang', 'st_pulang', 'lembur', 'ket_pulang', 'foto_pulang', 'gps_pulang', 'cara_pulang', 'acc_pulang', 'id_pulang'];
var MAKS_HARI_MANUAL_MUNDUR = 31;
var MAKS_HARI_LUPA_ABSEN = 14;

/** Fungsi murni: shift yang berlaku pada satu tanggal: jadwal efektif (kalender > pola > bawaan); libur/tanpa jadwal memakai shift bawaan akun. */
function shiftEfektifAbsen(akun, tanggal, kalender, liburMinggu) {
  const j = jadwalKaryawanHari(akun, tanggal, kalender, liburMinggu === true);
  if (!j.libur && j.shift !== null) { return j.shift; }
  return nomorShift(akun.shift);
}

/**
 * Fungsi murni: "shift tidak sesuai jadwal" (layar 06). Mengembalikan { usulan: nomor shift } kalau sekarang (detik) sudah lebih dari jendela menit
 * sesudah jam masuk shift jadwal DAN jendela absen shift lain sudah terbuka dan shift itu belum selesai; kalau tidak, null.
 * daftarShift = [{ no, masuk, pulang }] (jam 'HH:mm').
 */
function deteksiShiftBeda(detik, jadwalNo, daftarShift, jendelaMenit) {
  const jadwal = daftarShift.find(function (s) { return nomorShift(s.no) === jadwalNo; });
  if (!jadwal || !jadwal.masuk) { return null; }
  if (detik < jamKeDetik(jadwal.masuk) + jendelaMenit * 60) { return null; }
  let terbaik = null;
  daftarShift.forEach(function (s) {
    const n = nomorShift(s.no);
    if (n === null || n === jadwalNo || !s.masuk || !s.pulang) { return; }
    const buka = jamKeDetik(s.masuk) - jendelaMenit * 60;
    if (detik >= buka && detik < jamKeDetik(s.pulang)) {
      if (terbaik === null || jamKeDetik(s.masuk) > jamKeDetik(terbaik.masuk)) { terbaik = s; }
    }
  });
  return terbaik ? { usulan: nomorShift(terbaik.no) } : null;
}

/** Fungsi murni: apakah pilihan shift pengguna sah? Sama dengan jadwal, atau sama dengan usulan deteksiShiftBeda pada saat itu. */
function pilihanShiftSah(detik, jadwalNo, pilihan, daftarShift, jendelaMenit) {
  if (pilihan === undefined || pilihan === null || pilihan === '') { return { ok: true, no: jadwalNo, beda: false }; }
  const n = nomorShift(pilihan);
  if (n === null) { return { ok: false, pesan: 'Pilihan shift tidak valid' }; }
  if (n === jadwalNo) { return { ok: true, no: n, beda: false }; }
  const d = deteksiShiftBeda(detik, jadwalNo, daftarShift, jendelaMenit);
  if (d && d.usulan === n) { return { ok: true, no: n, beda: true }; }
  return { ok: false, pesan: 'Pilihan shift tidak sesuai dengan waktu sekarang. Ulangi absen.' };
}

/**
 * Fungsi murni: absen terakhir SEBELUM hari ini milik satu karyawan (dalam maksHari terakhir) yang sudah masuk tetapi belum pulang.
 * rows = baris absensi karyawan itu (tanggal teks, masuk, pulang teks). Kembalian baris atau null.
 */
function belumPulangSebelumnya(rows, hariIni, maksHari) {
  let terakhir = null;
  rows.forEach(function (r) {
    const t = String(r.tanggal);
    if (t >= hariIni || selisihHari(t, hariIni) > maksHari) { return; }
    if (terakhir === null || t > String(terakhir.tanggal)) { terakhir = r; }
  });
  if (terakhir && String(terakhir.masuk) !== '' && String(terakhir.pulang) === '') { return terakhir; }
  return null;
}

/** Fungsi murni: "Senin, 28 September" untuk layar peringatan 13. */
function tanggalPanjang(t) {
  const b = bagianTanggal(t);
  return HARI_PANJANG[hariKeIndeks(t)] + ', ' + b.d + ' ' + ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][b.m - 1];
}

/** Fungsi murni: salinan kolom tertentu satu baris (untuk disimpan di log). */
function salinKolom(baris, daftarKolom) {
  const s = {};
  daftarKolom.forEach(function (k) { const v = baris[k]; s[k] = v === undefined || v === null ? '' : String(v); });
  return s;
}

/** Fungsi murni: apakah teks id log konflik/kolom JSON valid? Mengembalikan objek atau null. */
function bacaJsonAman(teks) {
  try { const o = JSON.parse(String(teks)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; }
}

/**
 * Fungsi murni: konflik absen yang MASIH terbuka dari baris log. logRows = log lama ke baru (waktu, jenis, oleh, cabang, aksi, target, id, sebelum, sesudah).
 * KONFLIK_ABSEN membawa JSON di kolom sebelum { karyawan, nama, tanggal, jenis: MASUK|PULANG, jam, kolom: {...}, shift }; KONFLIK_SELESAI dengan id yang sama menutupnya.
 */
function konflikTerbuka(logRows) {
  const selesai = {};
  logRows.forEach(function (r) { if (String(r.aksi) === 'KONFLIK_SELESAI') { selesai[String(r.id)] = true; } });
  const hasil = [];
  logRows.forEach(function (r) {
    if (String(r.aksi) !== 'KONFLIK_ABSEN' || selesai[String(r.id)]) { return; }
    const d = bacaJsonAman(r.sebelum);
    if (!d || !d.karyawan || !tanggalIzinSah(d.tanggal) || (d.jenis !== 'MASUK' && d.jenis !== 'PULANG')) { return; }
    hasil.push({ id: String(r.id), pelapor: String(r.oleh), cabang: String(r.cabang), waktu: String(r.waktu), lama: d });
  });
  return hasil;
}

/** Fungsi murni: item Konfirmasi untuk konflik terbuka. petaAkun = { id: { nama, panggilan, cabang, role } }. Id "KONFLIK|<id absen lama>". */
function rakitItemKonflik(konflik, petaAkun) {
  return konflik.map(function (k) {
    const pel = petaAkun[k.pelapor] || {};
    return {
      id: 'KONFLIK|' + k.id, jenis: 'KONFLIK', kelompok: 'KONFLIK', karyawan: k.pelapor, nama: String(pel.nama || k.lama.nama || k.pelapor), cabang: k.cabang || String(pel.cabang || ''),
      role: pel.role || 'KARYAWAN', tanggal: k.lama.tanggal, jam: k.lama.jam || '', shift: '', judul: 'Konflik absen',
      rincian: hariTanggalPendek(k.lama.tanggal) + ' · ' + (k.lama.jenis === 'MASUK' ? 'masuk ' : 'pulang ') + (k.lama.jam || '') + ' · ditolak oleh ' + String(pel.panggilan || pel.nama || k.pelapor),
      ket: '', surat: false, sakit: false, hari: 1, mulai: k.lama.tanggal, selesai: k.lama.tanggal, telat_aju: false,
      luar: false, gps: '', dalam_area_toko: false, tingkat: 0, durasi_menit: 0, foto: 'TANPA'
    };
  });
}

/** Fungsi murni: id item konflik "KONFLIK|M-K003-260928-074000-T1" -> id absen; null kalau bentuknya salah. */
function parseIdItemKonflik(id) {
  const m = /^KONFLIK\|([MPL]-[A-Za-z0-9]{1,20}-\d{6}-\d{6}-(?:T\d{1,3}|P|A))$/.exec(String(id || ''));
  return m ? m[1] : null;
}

/**
 * Fungsi murni: item "Lupa absen" dari baris absensi (jam sebagai teks). Lupa pulang = sudah masuk tetapi belum pulang pada tanggal SEBELUM hari ini;
 * lupa masuk = sudah pulang tanpa masuk. Hanya maksHari terakhir. petaAkun = { id: { nama, cabang, role } }. Id "LUPA|<karyawan>|<tanggal>|MASUK|PULANG".
 */
function rakitItemLupaAbsen(rows, hariIni, petaAkun, maksHari) {
  const items = [];
  rows.forEach(function (r) {
    const t = String(r.tanggal);
    if (!tanggalIzinSah(t) || t >= hariIni || selisihHari(t, hariIni) > maksHari) { return; }
    const ada = function (jenis) {
      const a = petaAkun[String(r.karyawan)] || {};
      const hari = selisihHari(t, hariIni);
      items.push({
        id: 'LUPA|' + r.karyawan + '|' + t + '|' + jenis, jenis: jenis, kelompok: 'LUPA', karyawan: String(r.karyawan), nama: String(a.nama || r.nama || r.karyawan),
        cabang: String(a.cabang || r.cabang || ''), role: a.role || 'KARYAWAN', tanggal: t, jam: jenis === 'PULANG' ? String(r.masuk) : String(r.pulang), shift: String(r.shift || ''),
        judul: 'Lupa absen ' + (jenis === 'PULANG' ? 'pulang' : 'masuk'),
        rincian: hariTanggalPendek(t) + ', ' + (jenis === 'PULANG' ? 'masuk ' + r.masuk : 'pulang ' + r.pulang), menunggu_hari: hari,
        ket: '', surat: false, sakit: false, hari: 1, mulai: t, selesai: t, telat_aju: false,
        luar: false, gps: '', dalam_area_toko: false, tingkat: 0, durasi_menit: 0, foto: 'TANPA'
      });
    };
    if (String(r.masuk) !== '' && String(r.pulang) === '') { ada('PULANG'); }
    else if (String(r.masuk) === '' && String(r.pulang) !== '') { ada('MASUK'); }
  });
  return items;
}

/** Fungsi murni: id item lupa absen "LUPA|K003|2026-09-26|PULANG" -> { karyawan, tanggal, jenis }; null kalau salah. */
function parseIdItemLupa(id) {
  const m = /^LUPA\|([A-Za-z0-9]{1,20})\|(\d{4}-\d{2}-\d{2})\|(MASUK|PULANG)$/.exec(String(id || ''));
  return m && tanggalIzinSah(m[2]) ? { karyawan: m[1], tanggal: m[2], jenis: m[3] } : null;
}

/** Fungsi murni: item "shift tidak sesuai jadwal" dari baris absensi dengan tanda SHIFT_BEDA dan acc_masuk MENUNGGU. Id memakai bentuk id absensi biasa (…|MASUK). */
function itemShiftBeda(item) { return item.kelompok === 'SHIFT_BEDA'; }

/** Fungsi murni: status masuk untuk absen manual / edit: sebelum jendela absen dibuka tetap HADIR (admin boleh mengisi jam apa pun). */
function statusMasukManual(detik, shift, jendelaMenit) {
  const detikMasuk = jamKeDetik(shift.masuk);
  const selisih = detik - detikMasuk;
  if (selisih >= 60) { return { st_masuk: 'TELAT', telat_mnt: Math.floor(selisih / 60) }; }
  return { st_masuk: 'HADIR', telat_mnt: 0 };
}

/** Fungsi murni: teks "Masuk 07:52 (TELAT 7 mnt)" / "Pulang 16:31 (PULANG NORMAL)" untuk log dan pratinjau. */
function teksAbsenRingkas(jenis, jam, st, telatMnt) {
  if (!jam) { return jenis === 'MASUK' ? 'Masuk kosong' : 'Pulang kosong'; }
  if (jenis === 'MASUK') { return 'Masuk ' + jam + ' (' + (st === 'TELAT' ? 'TELAT ' + telatMnt + ' mnt' : (st || 'HADIR')) + ')'; }
  return 'Pulang ' + jam + ' (' + (st || '-') + ')';
}

/**
 * Fungsi murni: rencana absen manual (admin melengkapi absen yang terlewat) dan pratinjaunya.
 * p = { jenis: MASUK|PULANG, tanggal, jam 'HH:mm', hariIni, jamServer 'HH:mm', shift: {nama, masuk, pulang, tutup, toleransi}, baris: null | { masuk, pulang, st_pulang } (jam teks), jendelaMenit }.
 * Aturan: tanggal sah, tidak di masa depan menurut jam server, maksimal MAKS_HARI_MANUAL_MUNDUR hari ke belakang; masuk tidak boleh menimpa masuk yang ada;
 * pulang butuh masuk dan harus sesudah masuk. Kembalian { ok, pesan, st, telat_mnt, tampil }.
 */
function rencanaAbsenManual(p) {
  if (p.jenis !== 'MASUK' && p.jenis !== 'PULANG') { return { ok: false, pesan: 'Pilih jenis Masuk atau Pulang' }; }
  if (!tanggalIzinSah(p.tanggal)) { return { ok: false, pesan: 'Tanggal tidak valid' }; }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.jam || ''))) { return { ok: false, pesan: 'Isi jam dengan benar (JJ:MM)' }; }
  if (p.tanggal > p.hariIni || (p.tanggal === p.hariIni && p.jam > p.jamServer)) { return { ok: false, pesan: 'Jam tidak boleh di masa depan' }; }
  if (selisihHari(p.tanggal, p.hariIni) > MAKS_HARI_MANUAL_MUNDUR) { return { ok: false, pesan: 'Absen manual maksimal ' + MAKS_HARI_MANUAL_MUNDUR + ' hari ke belakang' }; }
  if (!p.shift || !p.shift.masuk) { return { ok: false, pesan: 'Jadwal shift karyawan tidak ditemukan' }; }
  const detik = jamKeDetik(p.jam);
  const baris = p.baris;
  if (p.jenis === 'MASUK') {
    if (baris && baris.masuk) { return { ok: false, pesan: 'Absen masuk tanggal itu sudah ada. Ubah lewat Data absensi.' }; }
    if (baris && baris.pulang && p.jam >= baris.pulang) { return { ok: false, pesan: 'Jam masuk harus sebelum jam pulang (' + baris.pulang + ')' }; }
    const s = statusMasukManual(detik, p.shift, p.jendelaMenit);
    return { ok: true, st: s.st_masuk, telat_mnt: s.telat_mnt, tampil: 'Status: ' + (s.st_masuk === 'TELAT' ? 'TELAT ' + s.telat_mnt + ' menit' : 'HADIR') + ' (' + p.shift.nama + ')' };
  }
  if (!baris || !baris.masuk) { return { ok: false, pesan: 'Isi absen masuk dulu sebelum absen pulang' }; }
  if (baris.pulang) { return { ok: false, pesan: 'Absen pulang tanggal itu sudah ada. Ubah lewat Data absensi.' }; }
  if (p.jam <= baris.masuk) { return { ok: false, pesan: 'Jam pulang harus sesudah jam masuk (' + baris.masuk + ')' }; }
  const h = tentukanStatusPulang(detik, p.shift, 'PULANG', true, false, '');
  if (!h.ok) { return { ok: false, pesan: h.pesan }; }
  return { ok: true, st_pulang: h.st_pulang, tampil: 'Status: ' + h.st_pulang + ' (' + p.shift.nama + ')' };
}

/**
 * Fungsi murni: rencana edit absen oleh admin (layar 65). p = { jenis, jam, alasan, hariIni, tanggal, jamServer, shift, baris: { masuk, pulang, st_masuk, telat_mnt, st_pulang, lembur }, jendelaMenit,
 * terkunci (bulan terkunci), aktor: { role, id }, pemilik: { id, role } }.
 * Hanya owner yang boleh mengedit data admin sendiri atau bulan terkunci. Alasan wajib minimal 5 karakter. Status dihitung ulang.
 * Kembalian { ok, pesan, ubah: { kolom: nilai }, sebelum, sesudah }.
 */
function rencanaEditAbsenAdmin(p) {
  const alasan = String(p.alasan === undefined || p.alasan === null ? '' : p.alasan).replace(/[\u0000-\u001f\u007f|]/g, ' ').replace(/\s+/g, ' ').trim();
  if (alasan.length < 5) { return { ok: false, pesan: 'Alasan edit wajib diisi, minimal 5 karakter' }; }
  if (alasan.length > 100) { return { ok: false, pesan: 'Alasan edit maksimal 100 karakter' }; }
  if (p.aktor.role !== 'OWNER') {
    if (p.aktor.role !== 'ADMIN') { return { ok: false, pesan: 'Tidak punya hak mengedit absen' }; }
    if (String(p.pemilik.id) === String(p.aktor.id)) { return { ok: false, pesan: 'Admin tidak boleh mengedit absennya sendiri. Itu tugas owner.' }; }
    if (p.pemilik.role !== 'KARYAWAN') { return { ok: false, pesan: 'Data admin hanya boleh diedit owner' }; }
    if (p.terkunci) { return { ok: false, pesan: 'Bulan ini sudah dikunci. Hanya owner yang boleh mengedit.' }; }
  }
  if (p.jenis !== 'MASUK' && p.jenis !== 'PULANG') { return { ok: false, pesan: 'Pilih Masuk atau Pulang' }; }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(p.jam || ''))) { return { ok: false, pesan: 'Isi jam dengan benar (JJ:MM)' }; }
  if (p.tanggal > p.hariIni || (p.tanggal === p.hariIni && p.jam > p.jamServer)) { return { ok: false, pesan: 'Jam tidak boleh di masa depan' }; }
  if (!p.shift || !p.shift.masuk) { return { ok: false, pesan: 'Jadwal shift karyawan tidak ditemukan' }; }
  const b = p.baris, detik = jamKeDetik(p.jam);
  if (p.jenis === 'MASUK') {
    if (b.pulang && p.jam >= b.pulang) { return { ok: false, pesan: 'Jam masuk harus sebelum jam pulang (' + b.pulang + ')' }; }
    const s = statusMasukManual(detik, p.shift, p.jendelaMenit);
    return {
      ok: true, alasan: alasan, ubah: { masuk: p.jam, st_masuk: s.st_masuk, telat_mnt: s.telat_mnt },
      sebelum: teksAbsenRingkas('MASUK', b.masuk, b.st_masuk, b.telat_mnt), sesudah: teksAbsenRingkas('MASUK', p.jam, s.st_masuk, s.telat_mnt)
    };
  }
  if (b.masuk && p.jam <= b.masuk) { return { ok: false, pesan: 'Jam pulang harus sesudah jam masuk (' + b.masuk + ')' }; }
  const lembur = String(b.st_pulang) === 'LEMBUR DI TOKO';
  const h = tentukanStatusPulang(detik, p.shift, lembur ? 'PULANG_LEMBUR' : 'PULANG', true, false, '');
  if (!h.ok) { return { ok: false, pesan: h.pesan }; }
  const ubah = { pulang: p.jam, st_pulang: h.st_pulang };
  if (h.st_pulang === 'LEMBUR DI TOKO') { ubah.lembur = h.tingkat + '|' + h.durasi_menit; }
  return { ok: true, alasan: alasan, ubah: ubah, sebelum: teksAbsenRingkas('PULANG', b.pulang, b.st_pulang), sesudah: teksAbsenRingkas('PULANG', p.jam, h.st_pulang) };
}

/**
 * Fungsi murni: daftar Data absensi (layar 64). rows = baris absensi (lama ke baru, jam teks, tanggal teks). filter = { dari, sampai, karyawan, cabang, offset, ukuran }.
 * Urut tanggal terbaru dulu, lalu jam masuk terbaru. Tiap baris diberi penanda: TELAT, LUPA PULANG, LUPA MASUK, LEMBUR, PULANG CEPAT, diedit, SHIFT BEDA.
 */
function saringDaftarAbsensi(rows, filter, hariIni) {
  const baris = rows.filter(function (r) {
    if (filter.cabang && String(r.cabang) !== filter.cabang) { return false; }
    if (filter.karyawan && String(r.karyawan) !== String(filter.karyawan)) { return false; }
    const t = String(r.tanggal);
    return (!filter.dari || t >= filter.dari) && (!filter.sampai || t <= filter.sampai);
  }).sort(function (a, b) {
    if (String(a.tanggal) !== String(b.tanggal)) { return String(a.tanggal) < String(b.tanggal) ? 1 : -1; }
    const ja = String(a.masuk || a.pulang || ''), jb = String(b.masuk || b.pulang || '');
    return ja < jb ? 1 : (ja > jb ? -1 : 0);
  });
  const mulai = Math.max(0, Number(filter.offset) || 0), ukuran = filter.ukuran || 30;
  const halaman = baris.slice(mulai, mulai + ukuran).map(function (r) {
    const tanda = [];
    if (String(r.st_masuk) === 'TELAT') { tanda.push('TELAT'); }
    if (String(r.masuk) !== '' && String(r.pulang) === '' && String(r.tanggal) < hariIni) { tanda.push('LUPA PULANG'); }
    if (String(r.masuk) === '' && String(r.pulang) !== '') { tanda.push('LUPA MASUK'); }
    if (String(r.st_pulang) === 'LEMBUR DI TOKO') { tanda.push('LEMBUR'); }
    if (String(r.st_pulang) === 'PULANG CEPAT') { tanda.push('PULANG CEPAT'); }
    if (String(r.tanda).indexOf('SHIFT_BEDA') >= 0) { tanda.push('SHIFT BEDA'); }
    return { karyawan: String(r.karyawan), nama: String(r.nama), tanggal: String(r.tanggal), masuk: String(r.masuk || ''), pulang: String(r.pulang || ''), tanda: tanda, diedit: String(r.tanda).indexOf('DIEDIT') >= 0 };
  });
  return { daftar: halaman, total: baris.length, ada_lagi: mulai + ukuran < baris.length };
}

/** Fungsi murni: tanda baru untuk kolom `tanda` (kumpulan penanda dipisah koma, tanpa duplikat). */
function tambahTanda(lama, baru) {
  const p = String(lama === undefined || lama === null ? '' : lama).split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x !== ''; });
  if (p.indexOf(baru) < 0) { p.push(baru); }
  return p.join(',');
}

/**
 * Fungsi murni: rencana memindahkan absen yang jadi konflik ke karyawan lain (layar 53). lama = data log { jenis, jam, ... };
 * target = { id, role, cabang, aktif }; barisTarget = null | { masuk, pulang } (jam teks); shift = shift target hari itu; pelapor = id yang menekan BUKAN SAYA.
 * MASUK: target belum punya masuk. PULANG: target sudah masuk dan belum pulang, jam pulang sesudah masuk. Hasil status dihitung ulang untuk target.
 */
function rencanaPindahKonflik(lama, target, barisTarget, shift, jendelaMenit, pelapor, cabang) {
  if (!target || target.aktif !== true || (target.role !== 'KARYAWAN' && target.role !== 'ADMIN')) { return { ok: false, pesan: 'Pilih karyawan tujuan yang valid' }; }
  if (target.cabang !== cabang) { return { ok: false, pesan: 'Karyawan tujuan harus di cabang yang sama' }; }
  if (String(target.id) === String(pelapor)) { return { ok: false, pesan: 'Pilih karyawan lain, bukan yang menolak absen ini' }; }
  if (!shift || !shift.masuk) { return { ok: false, pesan: 'Jadwal shift karyawan tujuan tidak ditemukan' }; }
  const detik = jamKeDetik(lama.jam);
  if (lama.jenis === 'MASUK') {
    if (barisTarget && barisTarget.masuk) { return { ok: false, pesan: 'Karyawan tujuan sudah punya absen masuk hari itu' }; }
    if (barisTarget && barisTarget.pulang && lama.jam >= barisTarget.pulang) { return { ok: false, pesan: 'Jam itu tidak sebelum jam pulang karyawan tujuan' }; }
    const s = statusMasukManual(detik, shift, jendelaMenit);
    return { ok: true, st_masuk: s.st_masuk, telat_mnt: s.telat_mnt, tampil: s.st_masuk };
  }
  if (!barisTarget || !barisTarget.masuk) { return { ok: false, pesan: 'Karyawan tujuan belum punya absen masuk hari itu' }; }
  if (barisTarget.pulang) { return { ok: false, pesan: 'Karyawan tujuan sudah punya absen pulang hari itu' }; }
  if (lama.jam <= barisTarget.masuk) { return { ok: false, pesan: 'Jam pulang harus sesudah jam masuk karyawan tujuan (' + barisTarget.masuk + ')' }; }
  const h = tentukanStatusPulang(detik, shift, 'PULANG', true, false, '');
  if (!h.ok) { return { ok: false, pesan: h.pesan }; }
  return { ok: true, st_pulang: h.st_pulang, tampil: h.st_pulang };
}


// ---------- akses sheet untuk koreksi absen ----------
var ALASAN_ABSEN_MANUAL = ['Lupa absen', 'HP toko bermasalah', 'Internet / listrik mati', 'Lainnya'];

/** Jam (HH:mm) satu sel absensi dari nilai TAMPILAN (jam di sheet bisa berubah bentuk jadi Date). */
function jamTeksSel(bacaan, nomorBaris, kolom) {
  const i = bacaan.header.indexOf(kolom) + 1;
  if (i < 1) { return ''; }
  return normalisasiJam(bacaan.sheet.getRange(nomorBaris, i).getDisplayValue());
}

/** Baris absensi terbaru (maksimal `maks`) dengan tanggal teks dan masuk/pulang sebagai teks jam 'HH:mm' ('' kalau kosong). */
function bacaAbsensiTampilTerbaru(maks) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('absensi');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return []; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  const awal = Math.max(2, terakhir - maks + 1);
  const rentang = sheet.getRange(awal, 1, terakhir - awal + 1, lebar);
  const v = rentang.getValues(), tampil = rentang.getDisplayValues();
  const iM = header.indexOf('masuk'), iP = header.indexOf('pulang');
  return v.map(function (baris, i) {
    const r = {};
    header.forEach(function (nama, idx) { r[nama] = baris[idx]; });
    r.tanggal = String(sebagaiTanggalTeks(r.tanggal, ZONA_ABSEN));
    r.masuk = String(r.masuk) === '' ? '' : normalisasiJam(tampil[i][iM]);
    r.pulang = String(r.pulang) === '' ? '' : normalisasiJam(tampil[i][iP]);
    r._baris = awal + i;
    return r;
  });
}

/** Satu baris absensi (karyawan + tanggal) lengkap dengan jam teks: { bacaan, baris } atau null. */
function cariBarisAbsensiTampil(karyawan, tanggal) {
  const cari = cariBarisAbsensi(karyawan, tanggal);
  if (!cari) { return null; }
  const b = cari.baris;
  b.masuk_teks = String(b.masuk) === '' ? '' : jamTeksSel(cari.bacaan, b._baris, 'masuk');
  b.pulang_teks = String(b.pulang) === '' ? '' : jamTeksSel(cari.bacaan, b._baris, 'pulang');
  return cari;
}

/** Shift efektif satu akun pada satu tanggal dari sheet (kalender > pola > bawaan); gagal membaca = shift bawaan akun. */
function shiftEfektifHariIniAman(akun, tanggal) {
  try {
    const a = Object.assign({}, akun, { mulai_pola: akun.mulai_pola === '' || akun.mulai_pola === undefined ? '' : normTanggalIzin(akun.mulai_pola) });
    return shiftEfektifAbsen(a, tanggal, bacaKalenderTernormalisasi().data, liburMingguCabang(akun.cabang));
  } catch (e) { return nomorShift(akun.shift); }
}

function shiftCabangNomor(cabang, nomor) {
  const s = bacaShiftCabang(cabang).find(function (x) { return nomorShift(x.no) === nomor; });
  if (s && s.toleransi === null) { s.toleransi = ambilNilaiUmum('toleransi_pulang_menit', 5); }
  return s || null;
}

function teksLemburDariKolom(lembur) {
  const m = /^(\d+)\|(\d+)$/.exec(String(lembur));
  return m ? 'Lembur ' + teksDurasiMenitServer(Number(m[2])) : 'Lembur';
}
function teksDurasiMenitServer(menit) {
  const j = Math.floor(menit / 60), m = menit % 60;
  if (j > 0 && m > 0) { return j + ' jam ' + m + ' menit'; }
  return j > 0 ? j + ' jam' : m + ' menit';
}

/** Simpan kode sekali pakai untuk "BUKAN SAYA" (5 menit) bersama tiket dan jenis absen; kembalian kode. */
function buatKodeDobel(payload) {
  const kode = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  CacheService.getScriptCache().put('dobel_' + kode, JSON.stringify(payload), 300);
  return kode;
}

function bacaLogKonflik() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('log');
  const terakhir = sheet.getLastRow();
  if (terakhir < 2) { return []; }
  const lebar = sheet.getLastColumn();
  const header = sheet.getRange(1, 1, 1, lebar).getValues()[0];
  const awal = Math.max(2, terakhir - 1200 + 1);
  return sheet.getRange(awal, 1, terakhir - awal + 1, lebar).getDisplayValues().map(function (baris) {
    const r = {}; header.forEach(function (nama, idx) { r[nama] = baris[idx]; }); return r;
  }).filter(function (r) { return r.aksi === 'KONFLIK_ABSEN' || r.aksi === 'KONFLIK_SELESAI'; });
}

// ---------- Konfirmasi: item lupa absen dan konflik ----------

function itemKoreksiAbsen() {
  const peta = petaAkunUntukIzin();
  const hariIni = hariIniServer();
  const lupa = rakitItemLupaAbsen(bacaAbsensiTampilTerbaru(900), hariIni, peta, MAKS_HARI_LUPA_ABSEN);
  const konflik = rakitItemKonflik(konflikTerbuka(bacaLogKonflik()), peta);
  return lupa.concat(konflik);
}

/** Konflik terbuka milik cabang aktor (atau admin pelapor untuk owner): detail untuk layar 53. d = { id (id absen lama), + kredensial }. */
function konteksKonflik(d) {
  const k = aktorKonfirmasi(d);
  if (k.gagal) { return { gagal: k.gagal }; }
  const idLama = parseIdItemKonflik(d.id);
  if (!idLama) { return { gagal: respon({ status: 'gagal', pesan: 'Item tidak dikenal' }) }; }
  const item = konflikTerbuka(bacaLogKonflik()).find(function (x) { return x.id === idLama; });
  if (!item) { return { gagal: respon({ status: 'gagal', pesan: 'Konflik ini sudah diputuskan atau tidak ditemukan' }) }; }
  const peta = petaAkunUntukIzin();
  const pel = peta[item.pelapor] || { cabang: item.cabang, role: 'KARYAWAN', nama: item.lama.nama };
  const hak = bolehMemutuskanKonfirmasi(k.aktor, { karyawan: item.pelapor, cabang: pel.cabang, role: pel.role });
  if (!hak.boleh) { return { gagal: respon({ status: 'gagal', pesan: hak.pesan }) }; }
  return { aktor: k.aktor, item: item, pelapor: pel, cabang: pel.cabang || item.cabang };
}

function barisAbsensiRingkas(cari) {
  if (!cari) { return null; }
  return { masuk: cari.baris.masuk_teks, pulang: cari.baris.pulang_teks, st_masuk: String(cari.baris.st_masuk), telat_mnt: Number(cari.baris.telat_mnt) || 0, st_pulang: String(cari.baris.st_pulang) };
}

/** Aksi konflik_detail { id, kredensial }: absen lama (dari log), absen pelapor sekarang, dan calon tujuan pemindahan. */
function prosesKonflikDetail(d) {
  const x = konteksKonflik(d);
  if (x.gagal) { return x.gagal; }
  const lama = x.item.lama;
  const baru = cariBarisAbsensiTampil(x.item.pelapor, lama.tanggal);
  const kandidat = [];
  const akunSemua = bacaSheet('akun').data;
  akunSemua.forEach(function (a) {
    if (a.aktif !== true || a.role !== 'KARYAWAN' || a.cabang !== x.cabang || String(a.id) === x.item.pelapor || String(a.id) === String(x.aktor.id)) { return; }
    const c = cariBarisAbsensiTampil(String(a.id), lama.tanggal);
    const ringkas = barisAbsensiRingkas(c);
    if (lama.jenis === 'MASUK' && (!ringkas || !ringkas.masuk)) { kandidat.push({ id: String(a.id), nama: String(a.nama), keterangan: 'belum ada absen masuk' }); }
    if (lama.jenis === 'PULANG' && ringkas && ringkas.masuk && !ringkas.pulang) { kandidat.push({ id: String(a.id), nama: String(a.nama), keterangan: 'belum ada absen pulang' }); }
  });
  kandidat.sort(function (a, b) { return a.nama.toLowerCase() < b.nama.toLowerCase() ? -1 : 1; });
  return respon({
    status: 'ok', id: x.item.id, tanggal: lama.tanggal, hari: tanggalPanjang(lama.tanggal), jenis: lama.jenis, pelapor: x.item.pelapor, nama: String(x.pelapor.nama || lama.nama), panggilan: String(x.pelapor.panggilan || x.pelapor.nama || ''),
    lama: { jam: lama.jam, st: lama.kolom ? (lama.kolom.st_masuk || lama.kolom.st_pulang || '') : '', foto: !!idBerkasDrive(lama.kolom ? (lama.kolom.foto_masuk || lama.kolom.foto_pulang) : '') },
    baru: baru ? { jam: lama.jenis === 'MASUK' ? baru.baris.masuk_teks : baru.baris.pulang_teks, st: lama.jenis === 'MASUK' ? String(baru.baris.st_masuk) : String(baru.baris.st_pulang), foto: !!idBerkasDrive(String(lama.jenis === 'MASUK' ? baru.baris.foto_masuk : baru.baris.foto_pulang)) } : null,
    kandidat: kandidat
  });
}

function hasilPindahKonflik(x, d) {
  const lama = x.item.lama;
  const target = akunLengkapAktif(d.ke);
  const cariT = target ? cariBarisAbsensiTampil(String(target.id), lama.tanggal) : null;
  const ringkasT = barisAbsensiRingkas(cariT);
  const noShift = target ? shiftEfektifHariIniAman(target, lama.tanggal) : null;
  const shift = target ? shiftCabangNomor(target.cabang, noShift) : null;
  const r = rencanaPindahKonflik(lama, target ? { id: target.id, role: target.role, cabang: target.cabang, aktif: target.aktif === true } : null, ringkasT, shift, ambilNilaiUmum('jendela_absen_menit', 60), x.item.pelapor, x.cabang);
  return { r: r, target: target, cariT: cariT, noShift: noShift, shift: shift };
}

/** Aksi konflik_pratinjau { id, ke, kredensial }: hasil kalau dipindahkan ("Andi 07:40 HADIR · Budi 07:52 TELAT"). */
function prosesKonflikPratinjau(d) {
  const x = konteksKonflik(d);
  if (x.gagal) { return x.gagal; }
  const h = hasilPindahKonflik(x, d);
  if (!h.r.ok) { return respon({ status: 'ok', bisa: false, pesan: h.r.pesan }); }
  const baru = cariBarisAbsensiTampil(x.item.pelapor, x.item.lama.tanggal);
  const pel = String(x.pelapor.panggilan || x.pelapor.nama || x.item.pelapor);
  const bagianBaru = baru ? ' · ' + pel + ' ' + (x.item.lama.jenis === 'MASUK' ? baru.baris.masuk_teks : baru.baris.pulang_teks) + ' ' + (x.item.lama.jenis === 'MASUK' ? String(baru.baris.st_masuk) : String(baru.baris.st_pulang)) : '';
  return respon({ status: 'ok', bisa: true, pesan: '', hasil: String(h.target.panggilan || h.target.nama) + ' ' + x.item.lama.jam + ' ' + h.r.tampil + bagianBaru });
}

/** Aksi konflik_putuskan { id, tindakan: PINDAH | HAPUS, ke?, alasan (min. 5 karakter), kredensial }. Keduanya menutup konflik; semua tercatat di log. */
function prosesKonflikPutuskan(d) {
  const x = konteksKonflik(d);
  if (x.gagal) { return x.gagal; }
  const alasan = String(d.alasan === undefined || d.alasan === null ? '' : d.alasan).replace(/[\u0000-\u001f\u007f|]/g, ' ').replace(/\s+/g, ' ').trim();
  if (alasan.length < 5) { return respon({ status: 'gagal', pesan: 'Alasan wajib diisi, minimal 5 karakter' }); }
  if (alasan.length > 100) { return respon({ status: 'gagal', pesan: 'Alasan maksimal 100 karakter' }); }
  if (d.tindakan !== 'PINDAH' && d.tindakan !== 'HAPUS') { return respon({ status: 'gagal', pesan: 'Pilih Pindahkan atau hapus' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const lama = x.item.lama;
    let ringkas = 'dihapus (bukan milik siapa pun)';
    if (d.tindakan === 'PINDAH') {
      const h = hasilPindahKonflik(x, d);
      if (!h.r.ok) { return respon({ status: 'gagal', pesan: h.r.pesan }); }
      const kol = lama.kolom || {};
      if (lama.jenis === 'MASUK') {
        const ubah = { masuk: lama.jam, st_masuk: h.r.st_masuk, telat_mnt: h.r.telat_mnt, ket_masuk: 'KONFLIK: dipindahkan dari ' + String(x.pelapor.nama || x.item.pelapor), foto_masuk: kol.foto_masuk || '', cara_masuk: 'PIN', id_masuk: kol.id_masuk || x.item.id };
        if (h.cariT) { ubah.tanda = tambahTanda(h.cariT.baris.tanda, 'KONFLIK_PINDAH'); perbaruiKolom(h.cariT.bacaan, h.cariT.baris, ubah); }
        else {
          const absensi = bacaSheet('absensi');
          const baris = {}; absensi.header.forEach(function (n) { baris[n] = ''; });
          Object.assign(baris, { tanggal: lama.tanggal, karyawan: h.target.id, nama: h.target.nama, cabang: h.target.cabang, shift: h.noShift, tanda: 'KONFLIK_PINDAH' }, ubah);
          absensi.sheet.appendRow(absensi.header.map(function (n) { return baris[n]; }));
        }
      } else {
        const ubah = { pulang: lama.jam, st_pulang: h.r.st_pulang, ket_pulang: 'KONFLIK: dipindahkan dari ' + String(x.pelapor.nama || x.item.pelapor), foto_pulang: kol.foto_pulang || '', cara_pulang: 'PIN', id_pulang: kol.id_pulang || x.item.id, tanda: tambahTanda(h.cariT.baris.tanda, 'KONFLIK_PINDAH') };
        perbaruiKolom(h.cariT.bacaan, h.cariT.baris, ubah);
      }
      ringkas = 'dipindahkan ke ' + h.target.nama + ' (' + lama.jam + ' ' + h.r.tampil + ')';
    }
    tambahLog({ jenis: 'KONFIRMASI', oleh: x.aktor.id, cabang: x.cabang, aksi: 'KONFLIK_SELESAI', target: String(x.pelapor.nama || x.item.pelapor) + ' ' + lama.tanggal + ' ' + lama.jenis, id: x.item.id, sebelum: 'konflik terbuka', sesudah: ringkas, alasan: alasan });
    return respon({ status: 'ok', hasil: ringkas });
  } finally {
    kunci.releaseLock();
  }
}

/** Aksi konflik_foto { id, which: LAMA | BARU, kredensial }: foto absen lama (dari tautan di salinan log) atau absen pelapor sekarang; dimuat hanya saat ditekan. */
function prosesKonflikFoto(d) {
  const x = konteksKonflik(d);
  if (x.gagal) { return x.gagal; }
  let tautan = '';
  if (d.which === 'LAMA') { const kol = x.item.lama.kolom || {}; tautan = String(kol.foto_masuk || kol.foto_pulang || ''); }
  else { const c = cariBarisAbsensiTampil(x.item.pelapor, x.item.lama.tanggal); tautan = c ? String(x.item.lama.jenis === 'MASUK' ? c.baris.foto_masuk : c.baris.foto_pulang) : ''; }
  if (tautan === '') { return respon({ status: 'ok', foto: null, teks: 'Foto belum ada' }); }
  if (tautan === TEKS_TANPA_FOTO) { return respon({ status: 'ok', foto: null, teks: TEKS_TANPA_FOTO }); }
  const idB = idBerkasDrive(tautan);
  if (!idB) { return respon({ status: 'ok', foto: null, teks: 'Foto tidak bisa dibuka' }); }
  try {
    const bytes = DriveApp.getFileById(idB).getBlob().getBytes();
    if (bytes.length > 400 * 1024) { return respon({ status: 'ok', foto: null, teks: 'Foto terlalu besar untuk ditampilkan' }); }
    return respon({ status: 'ok', foto: 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes) });
  } catch (e) { return respon({ status: 'ok', foto: null, teks: 'Foto tidak bisa dibuka' }); }
}

// ---------- Absen manual (layar 54) ----------

function bulanTerkunci(bulan) {
  // Fitur kunci periode belum ada: baris pengaturan KUNCI_PERIODE (nama = yyyy-MM, nilai TRUE) dianggap tidak ada, jadi tidak ada yang terkunci.
  try {
    return bacaSheet('pengaturan').data.some(function (r) { return r.kategori === 'KUNCI_PERIODE' && String(r.nama) === bulan && String(r.nilai).toUpperCase() === 'TRUE'; });
  } catch (e) { return false; }
}

/**
 * Fungsi murni: siapa boleh diisi/diubah absennya? aktor = { role, id, cabang }; t = { id, role, cabang }; mode = 'MANUAL' (isi absen manual) | 'LIHAT' (lihat, foto, edit).
 * ADMIN: hanya KARYAWAN di cabangnya dan bukan dirinya. OWNER: absen manual hanya untuk ADMIN; lihat dan edit untuk KARYAWAN maupun ADMIN di semua cabang.
 */
function bolehTargetKoreksi(aktor, t, mode) {
  if (!t || (t.role !== 'KARYAWAN' && t.role !== 'ADMIN')) { return { boleh: false, pesan: 'Pilih karyawan yang valid' }; }
  if (aktor.role === 'OWNER') {
    if (mode === 'MANUAL' && t.role !== 'ADMIN') { return { boleh: false, pesan: 'Owner hanya mengisi absen manual untuk admin' }; }
    return { boleh: true };
  }
  if (aktor.role !== 'ADMIN') { return { boleh: false, pesan: 'Tidak punya hak' }; }
  if (String(t.id) === String(aktor.id)) { return { boleh: false, pesan: 'Admin tidak boleh mengubah absennya sendiri. Itu tugas owner.' }; }
  if (t.role !== 'KARYAWAN') { return { boleh: false, pesan: 'Data admin hanya boleh diubah owner' }; }
  if (t.cabang !== aktor.cabang) { return { boleh: false, pesan: 'Hanya boleh untuk karyawan di cabang sendiri' }; }
  return { boleh: true };
}

/** Kredensial koreksi absen: OWNER (sesi owner) atau ADMIN (token HP toko + sesi admin, atau sesi admin HP pribadi). Balasan: { s: { akun: { id, nama, cabang, role } } } atau { gagal }. */
function autentikasiKoreksi(d) {
  if (!d.token) {
    const o = validasiSesi(d.sesi, 'OWNER');
    if (o) { return { s: { akun: { id: o.akun.id, nama: o.akun.nama, cabang: '', role: 'OWNER' } } }; }
  }
  const a = autentikasiAdminToko(d);
  if (a.gagal) { return a; }
  return { s: { akun: { id: a.s.akun.id, nama: a.s.akun.nama, cabang: a.s.akun.cabang, role: 'ADMIN' } } };
}

/** Target koreksi dari sheet: { akun } atau { gagal }. */
function targetKoreksi(aktor, idTarget, mode) {
  const t = akunLengkapAktif(idTarget);
  const h = bolehTargetKoreksi(aktor, t, mode || 'LIHAT');
  if (!h.boleh) { return { gagal: respon({ status: 'gagal', pesan: h.pesan }) }; }
  return { akun: t };
}

/** Aksi absen_manual_info { kredensial admin }: karyawan cabang, alasan, hari ini dan jam server. */
function prosesAbsenManualInfo(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const owner = a.s.akun.role === 'OWNER';
  const daftar = bacaSheet('akun').data.filter(function (r) { return r.aktif === true && (owner ? r.role === 'ADMIN' : (r.role === 'KARYAWAN' && r.cabang === a.s.akun.cabang)); })
    .map(function (r) { return { id: String(r.id), nama: String(r.nama), panggilan: String(r.panggilan || r.nama), cabang: String(r.cabang) }; })
    .sort(function (x, y) { return x.nama.toLowerCase() < y.nama.toLowerCase() ? -1 : 1; });
  return respon({ status: 'ok', hari_ini: hariIniServer(), jam: Utilities.formatDate(new Date(), ZONA_ABSEN, 'HH:mm'), karyawan: daftar, alasan: ALASAN_ABSEN_MANUAL });
}

function rencanaManualDariData(admin, d) {
  const t = targetKoreksi(admin, d.karyawan, 'MANUAL');
  if (t.gagal) { return { gagal: t.gagal }; }
  const tanggal = String(d.tanggal || '');
  const cari = tanggalIzinSah(tanggal) ? cariBarisAbsensiTampil(String(t.akun.id), tanggal) : null;
  const no = tanggalIzinSah(tanggal) ? shiftEfektifHariIniAman(t.akun, tanggal) : null;
  const shift = no !== null ? shiftCabangNomor(t.akun.cabang, no) : null;
  const sekarang = new Date();
  const r = rencanaAbsenManual({
    jenis: String(d.jenis || ''), tanggal: tanggal, jam: String(d.jam || ''), hariIni: Utilities.formatDate(sekarang, ZONA_ABSEN, 'yyyy-MM-dd'), jamServer: Utilities.formatDate(sekarang, ZONA_ABSEN, 'HH:mm'),
    shift: shift, baris: cari ? { masuk: cari.baris.masuk_teks, pulang: cari.baris.pulang_teks, st_pulang: String(cari.baris.st_pulang) } : null, jendelaMenit: ambilNilaiUmum('jendela_absen_menit', 60)
  });
  return { r: r, akun: t.akun, cari: cari, shift: shift, no: no, tanggal: tanggal };
}

/** Aksi absen_manual_pratinjau { karyawan, tanggal, jam, jenis, kredensial admin }: teks "Status: ..." tanpa menyimpan. */
function prosesAbsenManualPratinjau(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const x = rencanaManualDariData(a.s.akun, d);
  if (x.gagal) { return respon({ status: 'ok', bisa: false, pesan: 'Pilih karyawan' }); }
  return respon({ status: 'ok', bisa: x.r.ok === true, pesan: x.r.pesan || '', tampil: x.r.tampil || '' });
}

function msDariTanggalJam(tanggal, jam) {
  const b = bagianTanggal(tanggal), p = jam.split(':').map(Number);
  return Date.UTC(b.y, b.m - 1, b.d, p[0], p[1], 0) - 7 * 3600000;
}

/**
 * Aksi absen_manual { karyawan, tanggal, jam, jenis, alasan, kredensial admin }: admin melengkapi absen yang terlewat. Alasan dari daftar wajib.
 * cara_masuk/cara_pulang = MANUAL, kode perangkat A pada id absen; status dihitung dari jam yang diisi (fungsi yang sama dengan absen biasa).
 * Pencocokan wajah DILEWATI (belum ada fitur wajah): dicatat di log "wajah belum diverifikasi". Foto menyusul lewat absensi_unggah_foto.
 */
function prosesAbsenManual(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  const alasan = String(d.alasan || '');
  if (ALASAN_ABSEN_MANUAL.indexOf(alasan) < 0) { return respon({ status: 'gagal', pesan: 'Pilih alasan' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const x = rencanaManualDariData(admin, d);
    if (x.gagal) { return x.gagal; }
    if (!x.r.ok) { return respon({ status: 'gagal', pesan: x.r.pesan }); }
    if (bulanTerkunci(x.tanggal.slice(0, 7))) { return respon({ status: 'gagal', pesan: 'Bulan ini sudah dikunci. Hanya owner yang boleh mengubah.' }); }
    const t = x.akun, ms = msDariTanggalJam(x.tanggal, String(d.jam));
    const jenis = String(d.jenis);
    const absensi = bacaSheet('absensi');
    let idAbsen;
    if (jenis === 'MASUK') {
      idAbsen = buatIdAbsen('M', t.id, ms, 'MANUAL');
      const isi = { masuk: String(d.jam), st_masuk: x.r.st, telat_mnt: x.r.telat_mnt, ket_masuk: 'MANUAL: ' + alasan, cara_masuk: 'MANUAL', id_masuk: idAbsen };
      if (x.cari) { isi.tanda = tambahTanda(x.cari.baris.tanda, 'MANUAL'); perbaruiKolom(x.cari.bacaan, x.cari.baris, isi); }
      else {
        const baris = {}; absensi.header.forEach(function (n) { baris[n] = ''; });
        Object.assign(baris, { tanggal: x.tanggal, karyawan: t.id, nama: t.nama, cabang: t.cabang, shift: x.no, tanda: 'MANUAL' }, isi);
        absensi.sheet.appendRow(absensi.header.map(function (n) { return baris[n]; }));
      }
    } else {
      idAbsen = buatIdAbsen('P', t.id, ms, 'MANUAL');
      perbaruiKolom(x.cari.bacaan, x.cari.baris, { pulang: String(d.jam), st_pulang: x.r.st_pulang, ket_pulang: 'MANUAL: ' + alasan, cara_pulang: 'MANUAL', id_pulang: idAbsen, tanda: tambahTanda(x.cari.baris.tanda, 'MANUAL') });
    }
    tambahLog({
      jenis: 'ABSENSI', oleh: admin.id, cabang: t.cabang, aksi: 'ABSEN_MANUAL', target: t.nama + ' ' + x.tanggal + ' ' + (jenis === 'MASUK' ? 'masuk ' : 'pulang ') + d.jam, id: idAbsen,
      sebelum: '', sesudah: x.r.tampil, alasan: alasan + '; wajah belum diverifikasi (pencocokan wajah dilewati)'
    });
    return respon({ status: 'ok', id_absen: idAbsen, jenis: jenis, tanggal: x.tanggal, tampil: x.r.tampil });
  } finally {
    kunci.releaseLock();
  }
}

/**
 * Aksi absensi_unggah_foto { karyawan, tanggal, jenis, gambar, kredensial admin }: foto karyawan untuk absen manual atau "Update foto" di Edit absen.
 * Foto lama TIDAK dihapus dari Drive dan tidak tampil di aplikasi; tautannya dicatat di log. Struktur folder sama dengan foto absen biasa.
 */
function prosesAbsensiUnggahFoto(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const t = targetKoreksi(a.s.akun, d.karyawan);
  if (t.gagal) { return t.gagal; }
  if (d.jenis !== 'MASUK' && d.jenis !== 'PULANG') { return respon({ status: 'gagal', pesan: 'Pilih Masuk atau Pulang' }); }
  if (!tanggalIzinSah(d.tanggal)) { return respon({ status: 'gagal', pesan: 'Tanggal tidak valid' }); }
  const g = periksaGambarJpeg(d.gambar);
  if (!g.ok) { return respon({ status: 'gagal', pesan: g.pesan }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const cari = cariBarisAbsensiTampil(String(t.akun.id), String(d.tanggal));
    if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
    const b = cari.baris;
    const adaJam = d.jenis === 'MASUK' ? b.masuk_teks : b.pulang_teks;
    if (!adaJam) { return respon({ status: 'gagal', pesan: 'Belum ada absen ' + (d.jenis === 'MASUK' ? 'masuk' : 'pulang') + ' pada tanggal itu' }); }
    if (bulanTerkunci(String(d.tanggal).slice(0, 7))) { return respon({ status: 'gagal', pesan: 'Bulan ini sudah dikunci. Hanya owner yang boleh mengubah.' }); }
    const akar = ambilFolderAkar();
    if (akar.galat) { catatGalatFolder(akar.galat); return respon({ status: 'gagal', pesan: 'Folder penyimpanan foto bermasalah. Data absen tetap tersimpan; coba unggah foto lagi.' }); }
    const jalur = jalurFoto(Object.assign({}, b, { tanggal: String(d.tanggal) }), d.jenis);
    if (!jalur) { return respon({ status: 'gagal', pesan: 'Data absen tidak lengkap untuk membentuk nama foto' }); }
    const kolom = d.jenis === 'MASUK' ? 'foto_masuk' : 'foto_pulang';
    const lama = String(b[kolom] || '');
    let berkas;
    try {
      let folder = akar.folder;
      jalur.segmen.forEach(function (nama) { folder = ambilAtauBuatFolder(folder, nama); });
      const nama = lama && lama !== TEKS_TANPA_FOTO ? jalur.namaBerkas.replace(/\.jpg$/, '_edit' + Utilities.formatDate(new Date(), ZONA_ABSEN, 'HHmmss') + '.jpg') : jalur.namaBerkas;
      berkas = folder.createFile(Utilities.newBlob(g.bytes, 'image/jpeg', nama));
    } catch (e) {
      catatGalatFolder('Gagal menyimpan foto koreksi absen ke Drive: ' + e.message);
      return respon({ status: 'gagal', pesan: 'Foto belum bisa disimpan. Coba lagi.' });
    }
    const ubah = {}; ubah[kolom] = berkas.getUrl();
    perbaruiKolom(cari.bacaan, b, ubah);
    tambahLog({ jenis: 'ABSENSI', oleh: a.s.akun.id, cabang: t.akun.cabang, aksi: 'UBAH_FOTO_ABSEN', target: t.akun.nama + ' ' + d.tanggal + ' ' + d.jenis, id: String(d.jenis === 'MASUK' ? b.id_masuk : b.id_pulang), sebelum: lama || '(kosong)', sesudah: berkas.getUrl(), alasan: 'wajah belum diverifikasi' });
    return respon({ status: 'ok' });
  } finally {
    kunci.releaseLock();
  }
}

// ---------- Data absensi (64) dan Edit absen (65) ----------

/** Aksi absensi_daftar { rentang: HARI | PEKAN | BULAN, karyawan?, offset?, kredensial admin }: absensi cabang admin, terbaru di atas, 30 baris per muatan. */
function prosesAbsensiDaftar(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const owner = a.s.akun.role === 'OWNER';
  const cabang = owner ? String(d.cabang || '').slice(0, 60) : a.s.akun.cabang; // owner: kosong = semua cabang
  const hariIni = hariIniServer();
  let dari = seninDariTanggal(hariIni), sampai = geserTanggal(dari, 6);
  if (d.rentang === 'HARI') { dari = hariIni; sampai = hariIni; }
  else if (d.rentang === 'BULAN') { dari = hariIni.slice(0, 8) + '01'; sampai = hariIni; }
  const rows = bacaAbsensiTampilTerbaru(2500);
  const h = saringDaftarAbsensi(rows, { dari: dari, sampai: sampai, karyawan: d.karyawan ? String(d.karyawan) : '', cabang: cabang, offset: d.offset, ukuran: 30 }, hariIni);
  const kar = bacaSheet('akun').data.filter(function (r) { return r.aktif === true && (owner ? ((r.role === 'KARYAWAN' || r.role === 'ADMIN') && (!cabang || r.cabang === cabang)) : (r.role === 'KARYAWAN' && r.cabang === cabang)); })
    .map(function (r) { return { id: String(r.id), nama: String(r.nama) }; }).sort(function (x, y) { return x.nama.toLowerCase() < y.nama.toLowerCase() ? -1 : 1; });
  let daftarCabang;
  if (owner) {
    daftarCabang = [];
    bacaSemuaShift().forEach(function (x) { if (daftarCabang.indexOf(x.cabang) === -1) { daftarCabang.push(x.cabang); } });
    bacaSheet('pengaturan').data.forEach(function (r) { if (r.kategori === 'CABANG' && daftarCabang.indexOf(String(r.nama)) === -1) { daftarCabang.push(String(r.nama)); } });
  }
  return respon({ status: 'ok', cabang: cabang, daftar_cabang: daftarCabang, dari: dari, sampai: sampai, hari_ini: hariIni, daftar: h.daftar, total: h.total, ada_lagi: h.ada_lagi, karyawan: kar });
}

/** Aksi absensi_edit_info { karyawan, tanggal, kredensial admin }: isi layar Edit absen. */
function prosesAbsensiEditInfo(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const t = targetKoreksi(a.s.akun, d.karyawan);
  if (t.gagal) { return t.gagal; }
  if (!tanggalIzinSah(d.tanggal)) { return respon({ status: 'gagal', pesan: 'Tanggal tidak valid' }); }
  const cari = cariBarisAbsensiTampil(String(t.akun.id), String(d.tanggal));
  if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
  const b = cari.baris;
  const jamFoto = function (id) { const m = /-(\d{2})(\d{2})(\d{2})-(?:T\d+|P|A)$/.exec(String(id)); return m ? m[1] + ':' + m[2] + ':' + m[3] : ''; };
  return respon({
    status: 'ok', karyawan: String(t.akun.id), nama: String(t.akun.nama), tanggal: String(d.tanggal), hari_ini: hariIniServer(),
    masuk: { jam: b.masuk_teks, st: String(b.st_masuk), telat_mnt: Number(b.telat_mnt) || 0, jam_foto: jamFoto(b.id_masuk), foto: !!idBerkasDrive(String(b.foto_masuk)) },
    pulang: { jam: b.pulang_teks, st: String(b.st_pulang), jam_foto: jamFoto(b.id_pulang), foto: !!idBerkasDrive(String(b.foto_pulang)) }
  });
}

/** Aksi absensi_edit { karyawan, tanggal, jenis: MASUK | PULANG, jam, alasan (min. 5), kredensial admin }: status dihitung ulang, log EDIT_ABSEN berisi sebelum/sesudah dan alasan. */
function prosesAbsensiEdit(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const admin = a.s.akun;
  const t = akunLengkapAktif(d.karyawan);
  if (!t || (t.role !== 'KARYAWAN' && t.role !== 'ADMIN')) { return respon({ status: 'gagal', pesan: 'Pilih karyawan yang valid' }); }
  if (admin.role !== 'OWNER' && t.cabang !== admin.cabang) { return respon({ status: 'gagal', pesan: 'Hanya boleh untuk karyawan di cabang sendiri' }); }
  if (!tanggalIzinSah(d.tanggal)) { return respon({ status: 'gagal', pesan: 'Tanggal tidak valid' }); }
  const kunci = LockService.getScriptLock();
  kunci.waitLock(15000);
  try {
    const cari = cariBarisAbsensiTampil(String(t.id), String(d.tanggal));
    if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
    const b = cari.baris;
    const no = nomorShift(b.shift);
    const shift = no !== null ? shiftCabangNomor(t.cabang, no) : null;
    const sekarang = new Date();
    const r = rencanaEditAbsenAdmin({
      jenis: String(d.jenis || ''), jam: String(d.jam || ''), alasan: d.pratinjau === true ? 'pratinjau' : d.alasan, hariIni: Utilities.formatDate(sekarang, ZONA_ABSEN, 'yyyy-MM-dd'), tanggal: String(d.tanggal), jamServer: Utilities.formatDate(sekarang, ZONA_ABSEN, 'HH:mm'),
      shift: shift, baris: { masuk: b.masuk_teks, pulang: b.pulang_teks, st_masuk: String(b.st_masuk), telat_mnt: Number(b.telat_mnt) || 0, st_pulang: String(b.st_pulang), lembur: String(b.lembur) },
      jendelaMenit: ambilNilaiUmum('jendela_absen_menit', 60), terkunci: bulanTerkunci(String(d.tanggal).slice(0, 7)), aktor: { role: admin.role, id: admin.id }, pemilik: { id: t.id, role: t.role }
    });
    if (d.pratinjau === true) { return respon(r.ok ? { status: 'ok', bisa: true, sebelum: r.sebelum, sesudah: r.sesudah } : { status: 'ok', bisa: false, pesan: r.pesan }); }
    if (!r.ok) { return respon({ status: 'gagal', pesan: r.pesan }); }
    const ubah = Object.assign({}, r.ubah, { tanda: tambahTanda(b.tanda, 'DIEDIT') });
    perbaruiKolom(cari.bacaan, b, ubah);
    tambahLog({ jenis: 'ABSENSI', oleh: admin.id, cabang: t.cabang, aksi: 'EDIT_ABSEN', target: t.nama + ' ' + d.tanggal, id: String(d.jenis === 'MASUK' ? b.id_masuk : b.id_pulang), sebelum: r.sebelum, sesudah: r.sesudah, alasan: r.alasan });
    return respon({ status: 'ok', sebelum: r.sebelum, sesudah: r.sesudah });
  } finally {
    kunci.releaseLock();
  }
}


// ---------- Peringatan di HP toko: dobel, revisi lembur, BUKAN SAYA, lupa absen ----------

/** Fungsi murni: durasi lembur (menit) dari isi kolom `lembur` "tingkat|menit"; 0 kalau kosong/rusak. */
function menitLemburDariKolom(lembur) {
  const m = /^(\d+)\|(\d+)$/.exec(String(lembur === undefined || lembur === null ? '' : lembur));
  return m ? Number(m[2]) : 0;
}

/**
 * Balasan "sudah absen" (layar 05): absen kedua TETAP ditolak seperti biasa (status gagal, pesan sama), ditambah data peringatan
 * dan kode sekali pakai (5 menit) untuk "BUKAN SAYA". c = konteks catat..., jenis = MASUK | PULANG, lama = baris absensi hari itu (jam teks).
 */
function responDobel(c, jenis, pesan, lama) {
  const w = waktuDariMs(c.tk.t);
  const kode = buatKodeDobel({
    hp: c.idHp, id: String(c.akun.id), jenis: jenis, jenisAbsen: c.jenis || '', tiket: c.tiketMentah,
    tanpaFoto: c.tanpaFoto === true, tanggal: w.tanggal
  });
  return respon({
    status: 'gagal', pesan: pesan, dobel: true, kode_dobel: kode, jenis_dobel: jenis,
    jam_lama: jenis === 'MASUK' ? lama.masuk_teks : lama.pulang_teks, jam_sekarang: w.jam,
    nama: String(c.akun.nama), panggilan: String(c.akun.panggilan || c.akun.nama)
  });
}

/** Balasan "revisi lembur" (layar 07): belum ada yang berubah; pilihan: tetap (YA ITU SAYA), revisi ke sekarang, atau BUKAN SAYA. */
function responKonfirmasiRevisi(c, lama, hasil) {
  const w = waktuDariMs(c.tk.t);
  const kode = buatKodeDobel({
    hp: c.idHp, id: String(c.akun.id), jenis: 'PULANG', jenisAbsen: c.jenis, tiket: c.tiketMentah,
    tanpaFoto: c.tanpaFoto === true, tanggal: w.tanggal
  });
  return respon({
    status: 'ok', perlu_konfirmasi_revisi: true, kode_dobel: kode, jenis_dobel: 'PULANG',
    jam_lama: lama.pulang_teks, durasi_lama: menitLemburDariKolom(lama.lembur), tingkat_lama: Number(String(lama.lembur).split('|')[0]) || 0,
    jam_baru: w.jam, durasi_baru: hasil.durasi_menit, tingkat_baru: hasil.tingkat, jam_sekarang: w.jam,
    nama: String(c.akun.nama), panggilan: String(c.akun.panggilan || c.akun.nama)
  });
}

/** Aksi foto_dobel { token, kode }: foto absen tadi untuk dibandingkan di layar 05/07 (dimuat terpisah supaya peringatan cepat tampil). */
function prosesFotoDobel(d, hp) {
  const kode = String(d.kode || '');
  if (!/^[a-f0-9]{16}$/.test(kode)) { return respon({ status: 'gagal', pesan: 'Kode tidak valid' }); }
  const mentah = CacheService.getScriptCache().get('dobel_' + kode);
  const p = mentah ? bacaJsonAman(mentah) : null;
  if (!p || p.hp !== hp.id) { return respon({ status: 'gagal', pesan: 'Waktu habis, tekan tombol absen lagi' }); }
  const cari = cariBarisAbsensiTampil(p.id, p.tanggal);
  if (!cari || cari.baris.cabang !== hp.cabang) { return respon({ status: 'ok', foto: null, teks: 'Foto tidak ditemukan' }); }
  return fotoDariTautan(String(p.jenis === 'MASUK' ? cari.baris.foto_masuk : cari.baris.foto_pulang));
}

/** Foto dari tautan kolom foto (Drive, tidak publik) sebagai base64; teks penjelas kalau tidak ada. */
function fotoDariTautan(tautan) {
  if (tautan === '') { return respon({ status: 'ok', foto: null, teks: 'Foto belum ada' }); }
  if (tautan === TEKS_TANPA_FOTO) { return respon({ status: 'ok', foto: null, teks: TEKS_TANPA_FOTO }); }
  const idB = idBerkasDrive(tautan);
  if (!idB) { return respon({ status: 'ok', foto: null, teks: 'Foto tidak bisa dibuka' }); }
  try {
    const bytes = DriveApp.getFileById(idB).getBlob().getBytes();
    if (bytes.length > 400 * 1024) { return respon({ status: 'ok', foto: null, teks: 'Foto terlalu besar untuk ditampilkan' }); }
    return respon({ status: 'ok', foto: 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes) });
  } catch (e) { return respon({ status: 'ok', foto: null, teks: 'Foto tidak bisa dibuka' }); }
}

/**
 * Aksi laporkan_dobel { token, kode }: karyawan menekan "BUKAN SAYA" (layar 05/07). Absen lama (milik akun itu) dikeluarkan dari baris absensi,
 * SALINANNYA disimpan di log (KONFLIK_ABSEN), lalu absen BARU dicatat memakai tiket yang sama. Kalau absen baru gagal dicatat, absen lama dikembalikan.
 * Admin memutuskan nasib absen lama di Konfirmasi > layar 53 (pindahkan ke karyawan lain atau hapus). Tidak ada yang benar-benar hilang.
 */
function prosesLaporkanDobel(d, hp) {
  const kode = String(d.kode || '');
  if (!/^[a-f0-9]{16}$/.test(kode)) { return respon({ status: 'gagal', pesan: 'Kode tidak valid' }); }
  const cache = CacheService.getScriptCache();
  const mentah = cache.get('dobel_' + kode);
  const p = mentah ? bacaJsonAman(mentah) : null;
  if (!p || p.hp !== hp.id) { return respon({ status: 'gagal', pesan: 'Waktu habis, tekan tombol absen lagi' }); }
  const kunciRahasia = kunciTiket();
  if (!kunciRahasia) { return respon({ status: 'gagal', pesan: 'Server belum siap: KODE_RAHASIA belum diisi di Script Properties.' }); }
  const jenisTiket = p.jenis === 'MASUK' ? 'MASUK' : (p.jenisAbsen === 'PULANG_LEMBUR' ? 'LEMBUR' : 'PULANG');
  const tk = periksaTiket(p.tiket, jenisTiket, hp.cabang, kunciRahasia, Date.now());
  if (!tk.ok) { return respon({ status: 'gagal', pesan: tk.pesan }); }
  const akun = bacaSheet('akun').data.find(function (r) { return String(r.id) === String(p.id) && r.cabang === hp.cabang && r.aktif === true; });
  if (!akun) { return respon({ status: 'gagal', pesan: 'Karyawan tidak ditemukan' }); }
  const w = waktuDariMs(tk.t);
  const cari = cariBarisAbsensiTampil(p.id, w.tanggal);
  if (!cari) { return respon({ status: 'gagal', pesan: 'Absen lama tidak ditemukan' }); }
  const lembar = cari.bacaan.sheet, b = cari.baris;
  const masuk = p.jenis === 'MASUK';
  const kolomLama = masuk ? KOLOM_MASUK : KOLOM_PULANG;
  const jamLama = masuk ? b.masuk_teks : b.pulang_teks;
  if (!jamLama) { return respon({ status: 'gagal', pesan: 'Absen lama tidak ditemukan' }); }
  if (masuk && b.pulang_teks) { return respon({ status: 'gagal', pesan: 'Sudah ada absen pulang hari ini. Hubungi admin.' }); }
  const salinan = salinKolom(b, kolomLama);
  const idLama = String(masuk ? b.id_masuk : b.id_pulang);
  const nilaiBaris = lembar.getRange(b._baris, 1, 1, lembar.getLastColumn()).getValues()[0];
  const fotoLama = String(masuk ? b.foto_masuk : b.foto_pulang);
  const shiftLama = String(b.shift);
  // keluarkan absen lama dari sheet absensi (salinan lengkap ada di log setelah absen baru berhasil)
  if (masuk) { lembar.deleteRow(b._baris); }
  else { const kosong = {}; KOLOM_PULANG.forEach(function (k) { kosong[k] = ''; }); perbaruiKolom(cari.bacaan, b, kosong); }
  let hasil;
  try {
    hasil = masuk
      ? catatAbsenMasuk({ akun: akun, tk: tk, idHp: hp.id, tanpaFoto: p.tanpaFoto === true, luar: null, tiketMentah: p.tiket, lewatiDeteksiShift: true })
      : catatAbsenPulang({ akun: akun, tk: tk, jenis: p.jenisAbsen, idHp: hp.id, tanpaFoto: p.tanpaFoto === true, luar: null, tiketMentah: p.tiket, konfirmasiRevisi: true });
  } catch (e) { hasil = null; }
  const balasan = hasil ? bacaJsonAman(hasil.getContent()) : null;
  if (!balasan || balasan.status !== 'ok') {
    // gagal: kembalikan absen lama persis seperti semula
    if (masuk) { lembar.appendRow(nilaiBaris); }
    else {
      const pulih = {}; kolomLama.forEach(function (k) { pulih[k] = salinan[k]; });
      const baru = cariBarisAbsensi(p.id, w.tanggal);
      if (baru) { perbaruiKolom(baru.bacaan, baru.baris, pulih); }
    }
    return hasil || respon({ status: 'gagal', pesan: 'Absen tidak bisa dicatat. Coba lagi.' });
  }
  tambahLog({
    jenis: 'ABSENSI', oleh: String(akun.id), cabang: akun.cabang, aksi: 'KONFLIK_ABSEN',
    target: akun.nama + ' ' + w.tanggal + ' ' + (masuk ? 'masuk ' : 'pulang ') + jamLama, id: idLama,
    sebelum: JSON.stringify({ karyawan: String(akun.id), nama: String(akun.nama), tanggal: w.tanggal, jenis: p.jenis, jam: jamLama, shift: shiftLama, foto: fotoLama, kolom: salinan }),
    sesudah: 'absen baru dicatat ' + w.jam, alasan: 'BUKAN SAYA'
  });
  const baru = cariBarisAbsensi(p.id, w.tanggal);
  if (baru) { perbaruiKolom(baru.bacaan, baru.baris, { tanda: tambahTanda(baru.baris.tanda, 'KONFLIK') }); }
  cache.remove('dobel_' + kode);
  balasan.konflik = true;
  return respon(balasan);
}

/**
 * Pulang TANPA absen masuk hari itu (layar 19). Hanya untuk status PULANG NORMAL (pulang cepat dan lembur tetap butuh absen masuk, seperti sebelumnya).
 * Baris absensi hari itu dibuat dengan masuk KOSONG (lupa masuk: admin mengisi jam masuk lewat Absen manual). Kembalian: respon, atau null kalau tidak berlaku.
 */
function catatPulangTanpaMasuk(c, kondisi, w) {
  if (c.luar || !c.tiketMentah || c.jenis !== 'PULANG' || kondisi.sudahMasuk || kondisi.sudahPulang || kondisi.baris) { return null; }
  const akun = c.akun;
  const no = shiftEfektifHariIniAman(akun, w.tanggal);
  const shift = no !== null ? shiftCabangNomor(akun.cabang, no) : null;
  if (!shift) { return null; }
  const h = tentukanStatusPulang(w.detik, shift, 'PULANG', true, false, '');
  if (!h.ok || h.st_pulang !== 'PULANG NORMAL') { return null; }
  if (!klaimTiketServer(c.tk.nonce)) { return respon({ status: 'gagal', pesan: PESAN_TIKET }); }
  const absensi = kondisi.absensi;
  const baris = {};
  absensi.header.forEach(function (n) { baris[n] = ''; });
  const idAbsen = buatIdAbsen('P', akun.id, c.tk.t, c.idHp);
  Object.assign(baris, {
    tanggal: w.tanggal, karyawan: akun.id, nama: akun.nama, cabang: akun.cabang, shift: no, pulang: w.jam, st_pulang: 'PULANG NORMAL', cara_pulang: 'PIN',
    id_pulang: idAbsen, tanda: 'LUPA_MASUK'
  });
  if (c.tanpaFoto === true) { baris.foto_pulang = TEKS_TANPA_FOTO; }
  absensi.sheet.appendRow(absensi.header.map(function (n) { return baris[n]; }));
  return respon({
    status: 'ok', pesan: 'Absen pulang berhasil', st_pulang: 'PULANG NORMAL', jam: w.jam, shift: shift.nama, nama: String(akun.nama), panggilan: String(akun.panggilan || akun.nama),
    acc: '', tingkat: 0, durasi_menit: 0, perubahan: '', id_absen: idAbsen, luar: false, belum_masuk_hari_ini: true, hari_ini: w.tanggal
  });
}

/** Absen terakhir SEBELUM hari ini yang sudah masuk tetapi belum pulang (layar 18/13): { tanggal, hari, shift } atau null. Gagal membaca = null (absen tidak boleh gagal karenanya). */
function belumPulangKemarin(karyawan, hariIni) {
  try {
    const rows = bacaAbsensiTampilTerbaru(400).filter(function (r) { return String(r.karyawan) === String(karyawan); });
    const r = belumPulangSebelumnya(rows, hariIni, MAKS_HARI_LUPA_ABSEN);
    return r ? { tanggal: String(r.tanggal), hari: tanggalPanjang(String(r.tanggal)), shift: String(r.shift) } : null;
  } catch (e) { return null; }
}

/** Aksi absensi_foto { karyawan, tanggal, jenis: MASUK | PULANG, kredensial admin }: foto satu absen untuk layar Edit absen (tidak publik; hanya untuk karyawan cabang admin, bukan miliknya). */
function prosesAbsensiFoto(d) {
  const a = autentikasiKoreksi(d);
  if (a.gagal) { return a.gagal; }
  const t = targetKoreksi(a.s.akun, d.karyawan);
  if (t.gagal) { return t.gagal; }
  if (d.jenis !== 'MASUK' && d.jenis !== 'PULANG') { return respon({ status: 'gagal', pesan: 'Pilih Masuk atau Pulang' }); }
  if (!tanggalIzinSah(d.tanggal)) { return respon({ status: 'gagal', pesan: 'Tanggal tidak valid' }); }
  const cari = cariBarisAbsensiTampil(String(t.akun.id), String(d.tanggal));
  if (!cari) { return respon({ status: 'gagal', pesan: 'Absen tidak ditemukan' }); }
  return fotoDariTautan(String(d.jenis === 'MASUK' ? cari.baris.foto_masuk : cari.baris.foto_pulang));
}
