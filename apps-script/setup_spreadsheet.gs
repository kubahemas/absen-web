/**
 * SETUP AWAL SPREADSHEET ABSENSI KUBAH EMAS
 *
 * Cara pakai: jalankan fungsi setupSpreadsheet() satu kali dari editor Apps Script.
 * Aman dijalankan berkali-kali: sheet yang SUDAH ADA (apalagi sudah berisi data)
 * tidak akan disentuh sama sekali. Hanya sheet yang belum ada yang dibuat baru
 * lengkap dengan judul kolom, dan hanya sheet baru itu yang diisi data contoh.
 *
 * PENTING SEBELUM JALANKAN: isi dulu Script Properties dengan properti
 * "KODE_RAHASIA" (lihat penjelasan di bawah setupSpreadsheet). Ini dipakai
 * sebagai garam (salt) tambahan saat membuat hash PIN & password, supaya
 * hash tidak bisa ditebak hanya dari isi sheet + kode yang ada di GitHub.
 */

function setupSpreadsheet() {
  const kodeRahasia = PropertiesService.getScriptProperties().getProperty('KODE_RAHASIA');
  if (!kodeRahasia) {
    SpreadsheetApp.getUi().alert(
      'Belum bisa jalan: Script Properties "KODE_RAHASIA" belum diisi.\n\n' +
      'Caranya: klik ikon gerigi "Project Settings" di menu kiri editor ini, ' +
      'scroll ke bagian "Script Properties", klik "Add script property", ' +
      'isi Property = KODE_RAHASIA dan Value = teks rahasia bebas (contoh: kombinasi huruf-angka acak), ' +
      'lalu Save. Setelah itu jalankan lagi fungsi ini.'
    );
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetDefs = buatDefinisiSheet(kodeRahasia);
  const hasil = [];

  sheetDefs.forEach(function (def) {
    const sudahAda = ss.getSheetByName(def.nama);
    if (sudahAda) {
      hasil.push('- ' + def.nama + ': SUDAH ADA, dilewati (tidak diubah).');
      return;
    }

    const sheet = ss.insertSheet(def.nama);
    sheet.getRange(1, 1, 1, def.kolom.length).setValues([def.kolom]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, def.kolom.length).setFontWeight('bold');

    if (def.contoh && def.contoh.length > 0) {
      sheet.getRange(2, 1, def.contoh.length, def.kolom.length).setValues(def.contoh);
      hasil.push('- ' + def.nama + ': dibuat baru + ' + def.contoh.length + ' baris data contoh.');
    } else {
      hasil.push('- ' + def.nama + ': dibuat baru (kosong, siap diisi).');
    }

    sheet.autoResizeColumns(1, def.kolom.length);
  });

  Logger.log(hasil.join('\n'));
  SpreadsheetApp.getUi().alert('Setup selesai:\n\n' + hasil.join('\n'));
}

/**
 * MIGRASI: jalankan fungsi ini kalau sheet `akun` sudah dibuat SEBELUM 6 kolom
 * terakhir (wajib_ganti_password dst.) ditambahkan ke desain. Aman dijalankan
 * berkali-kali: kolom yang sudah ada tidak diulang, dan tidak ada baris atau
 * kolom lama yang dihapus/diubah.
 *
 * Nilai default untuk baris yang SUDAH ADA (akun nyata yang sudah dipakai)
 * sengaja dibuat netral (wajib_ganti_password/wajib_ganti_pin = FALSE, tidak
 * memaksa siapa pun ganti password), berbeda dari data contoh baru di
 * setupSpreadsheet() yang defaultnya TRUE karena itu akun baru dengan
 * password bawaan 123456.
 */
function tambahKolomAkunBaru() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('akun');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Sheet "akun" tidak ditemukan. Jalankan setupSpreadsheet() dulu.');
    return;
  }

  const kolomBaru = [
    { nama: 'wajib_ganti_password', default: false },
    { nama: 'wajib_ganti_pin', default: false },
    { nama: 'password_awal_berlaku_sampai', default: '' },
    { nama: 'jumlah_salah_login', default: 0 },
    { nama: 'terkunci', default: false },
    { nama: 'tanggal_setuju_wajah', default: '' }
  ];

  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const jumlahBarisData = sheet.getLastRow() - 1;
  let kolomBerikutnya = sheet.getLastColumn() + 1;
  const ditambahkan = [];

  kolomBaru.forEach(function (k) {
    if (header.indexOf(k.nama) !== -1) {
      return;
    }
    sheet.getRange(1, kolomBerikutnya).setValue(k.nama).setFontWeight('bold');
    if (jumlahBarisData > 0) {
      const nilaiDefault = new Array(jumlahBarisData).fill(k.default);
      sheet.getRange(2, kolomBerikutnya, jumlahBarisData, 1).setValues(nilaiDefault.map(function (v) { return [v]; }));
    }
    ditambahkan.push(k.nama);
    kolomBerikutnya++;
  });

  const pesan = ditambahkan.length > 0
    ? 'Kolom ditambahkan: ' + ditambahkan.join(', ')
    : 'Semua kolom sudah ada, tidak ada yang ditambahkan.';
  Logger.log(pesan);
  SpreadsheetApp.getUi().alert(pesan);
}

/**
 * Hash PIN/password dengan garam ganda: id_karyawan (beda tiap orang) +
 * KODE_RAHASIA dari Script Properties (tidak pernah ada di sheet/GitHub).
 * Dipakai juga nanti oleh skrip login/ganti-PIN supaya cara hash-nya sama persis.
 */
function hashDenganGaram(teks, idKaryawan, kodeRahasia) {
  const gabungan = teks + '|' + idKaryawan + '|' + kodeRahasia;
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, gabungan, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function buatDefinisiSheet(kodeRahasia) {
  const tanggalHariIni = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+7', 'yyyy-MM-dd');

  function akun(id, namaLengkap, namaPanggilan) {
    const berlakuSampai24Jam = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return [id, namaLengkap, namaPanggilan, 'Ngawi', 'KARYAWAN', 1,
      hashDenganGaram('123456', id, kodeRahasia), hashDenganGaram('1234', id, kodeRahasia),
      '', '', tanggalHariIni, 6, true,
      true, false, berlakuSampai24Jam, 0, false, ''];
  }

  return [
    {
      nama: 'akun',
      kolom: ['id_karyawan', 'nama_lengkap', 'nama_panggilan', 'cabang', 'role', 'shift_bawaan',
        'password_hash', 'pin_hash', 'data_wajah', 'id_hp', 'tanggal_mulai', 'jatah_cuti', 'aktif',
        'wajib_ganti_password', 'wajib_ganti_pin', 'password_awal_berlaku_sampai',
        'jumlah_salah_login', 'terkunci', 'tanggal_setuju_wajah'],
      contoh: [
        akun('K001', 'Ahmad Fauzi', 'Fauzi'),
        akun('K002', 'Siti Rohmah', 'Siti'),
        akun('K003', 'Budi Santoso', 'Budi')
      ]
    },
    {
      nama: 'shift',
      kolom: ['cabang', 'nomor_shift', 'nama_shift', 'jam_masuk', 'jam_tutup', 'jam_pulang', 'toleransi_pulang'],
      contoh: [
        ['Ngawi', 1, 'Shift 1', '07:45', '16:00', '16:30', 5]
      ]
    },
    {
      nama: 'kalender',
      kolom: ['tanggal', 'cabang', 'id_karyawan', 'isi'],
      contoh: []
    },
    {
      nama: 'pengaturan',
      kolom: ['kategori', 'nama', 'nilai', 'kelompok', 'maks_hari'],
      contoh: [
        ['UMUM', 'jatah_cuti', 6, '', ''],
        ['UMUM', 'jendela_absen_menit', 60, '', ''],
        ['UMUM', 'toleransi_pulang_menit', 5, '', ''],
        ['UMUM', 'batas_telat_bad', 5, '', ''],
        ['UMUM', 'batas_pulang_awal_bad', 5, '', ''],
        ['UMUM', 'batas_izin_biasa_bad', 3, '', ''],
        ['UMUM', 'simpan_foto_bulan', 2, '', ''],
        ['UMUM', 'simpan_absensi_bulan', 3, '', ''],
        ['UMUM', 'batas_isi_alasan_detik', 10, '', ''],
        ['JENIS_IZIN', 'Sakit', '', '', ''],
        ['JENIS_IZIN', 'Keperluan pribadi', '', '', ''],
        ['JENIS_IZIN', 'Menikah', '', '', 3],
        ['JENIS_IZIN', 'Keluarga meninggal', '', '', 2],
        ['JENIS_IZIN', 'Istri melahirkan', '', '', 2],
        ['JENIS_IZIN', 'Cuti', '', '', ''],
        ['ALASAN_TELAT', 'Macet', '', '', ''],
        ['ALASAN_TELAT', 'Hujan', '', '', ''],
        ['ALASAN_TELAT', 'Kendaraan bermasalah', '', '', ''],
        ['ALASAN_TELAT', 'Urusan keluarga', '', '', ''],
        ['ALASAN_TELAT', 'Sakit', '', '', ''],
        ['ALASAN_TELAT', 'Lainnya', '', '', ''],
        ['ALASAN_PULANG_AWAL', 'Sakit', '', '', ''],
        ['ALASAN_PULANG_AWAL', 'Urusan keluarga', '', '', ''],
        ['ALASAN_PULANG_AWAL', 'Disuruh atasan', '', '', ''],
        ['ALASAN_PULANG_AWAL', 'Lainnya', '', '', ''],
        ['KEPERLUAN_LUAR', 'Survey', '', '', ''],
        ['KEPERLUAN_LUAR', 'Pengiriman', '', '', ''],
        ['KEPERLUAN_LUAR', 'Pemasangan', '', '', ''],
        ['KEPERLUAN_LUAR', 'Service', '', '', ''],
        ['KEPERLUAN_LUAR', 'Penagihan', '', '', ''],
        ['KEPERLUAN_LUAR', 'Ketemu klien', '', '', ''],
        ['KEPERLUAN_LUAR', 'Lainnya', '', '', ''],
        ['PEKERJAAN_LEMBUR', 'Stok opname', '', '', ''],
        ['PEKERJAAN_LEMBUR', 'Bongkar muat', '', '', ''],
        ['PEKERJAAN_LEMBUR', 'Penataan barang', '', '', ''],
        ['PEKERJAAN_LEMBUR', 'Melayani pelanggan', '', '', ''],
        ['PEKERJAAN_LEMBUR', 'Menyelesaikan tugas luar', '', '', ''],
        ['PEKERJAAN_LEMBUR', 'Lainnya', '', '', '']
      ]
    },
    {
      nama: 'absensi',
      kolom: ['tanggal', 'id_karyawan', 'nama', 'cabang', 'shift', 'jam_masuk', 'status_masuk',
        'menit_telat', 'keterangan_masuk', 'foto_masuk', 'gps_masuk', 'cara_masuk', 'acc_masuk',
        'jam_pulang', 'status_pulang', 'tingkat_lembur', 'keterangan_pulang', 'foto_pulang',
        'gps_pulang', 'cara_pulang', 'acc_pulang', 'status_hari', 'penanda',
        'id_absen_masuk', 'id_absen_pulang'],
      contoh: []
    },
    {
      nama: 'izin',
      kolom: ['id_pengajuan', 'id_grup', 'id_karyawan', 'jenis', 'kelompok', 'tanggal_mulai',
        'tanggal_selesai', 'jumlah_hari_kerja', 'keterangan', 'url_lampiran', 'waktu_pengajuan',
        'terlambat_mengajukan', 'status_acc', 'diputus_oleh', 'waktu_putus'],
      contoh: []
    },
    {
      nama: 'rekap_bulanan',
      kolom: ['bulan', 'id_karyawan', 'nama', 'cabang', 'hari_kerja', 'masuk', 'telat_hari',
        'telat_menit', 'pulang_awal', 'alpha', 'izin_biasa', 'izin_khusus', 'cuti', 'sisa_cuti',
        'lembur_kurang_1jam', 'lembur_1_2jam', 'lembur_lebih_2jam', 'label'],
      contoh: []
    },
    {
      nama: 'log',
      kolom: ['waktu', 'jenis', 'oleh', 'cabang', 'aksi', 'target', 'id_target', 'sebelum', 'sesudah', 'alasan'],
      contoh: []
    }
  ];
}
