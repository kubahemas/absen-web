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
 *
 * FORMAT TANGGAL & WAKTU (lihat juga CLAUDE.md):
 * - Kolom tanggal (tanpa jam): yyyy-mm-dd. Contoh: 2026-09-29.
 * - Kolom waktu (tanggal + jam): yyyy-mm-dd HH:mm. Contoh: 2026-09-29 14:05.
 * - Kolom jam-saja (tanpa tanggal, dari sheet shift/absensi): HH:mm.
 * - Kolom bulan (rekap_bulanan.bulan): yyyy-mm. Contoh: 2026-09.
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
  ss.setSpreadsheetTimeZone('Asia/Jakarta');

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

    if (def.kolomSensitif && def.kolomSensitif.length > 0) {
      const mulaiKolom = def.kolom.indexOf(def.kolomSensitif[0]) + 1;
      const jumlahKolom = def.kolomSensitif.length;
      sheet.getRange(1, mulaiKolom, sheet.getMaxRows(), jumlahKolom).shiftColumnGroupDepth(1);
      sheet.hideColumns(mulaiKolom, jumlahKolom);
    }
  });

  Logger.log(hasil.join('\n'));
  SpreadsheetApp.getUi().alert('Setup selesai:\n\n' + hasil.join('\n'));
}

/**
 * Hash PIN/password dengan garam ganda: id karyawan (beda tiap orang) +
 * KODE_RAHASIA dari Script Properties (tidak pernah ada di sheet/GitHub).
 * Dipakai juga nanti oleh skrip login/ganti-PIN supaya cara hash-nya sama persis.
 */
function hashDenganGaram(teks, id, kodeRahasia) {
  const gabungan = teks + '|' + id + '|' + kodeRahasia;
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, gabungan, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function buatDefinisiSheet(kodeRahasia) {
  const zona = 'Asia/Jakarta';
  const tanggalHariIni = Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd');

  function akun(id, nama, panggilan) {
    const pwAwalSampai = Utilities.formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000), zona, 'yyyy-MM-dd HH:mm');
    return [id, nama, panggilan, 'Ngawi', 'KARYAWAN', 1,
      hashDenganGaram('123456', id, kodeRahasia), hashDenganGaram('1234', id, kodeRahasia),
      '', '', tanggalHariIni, 6, true,
      true, false, pwAwalSampai, 0, false, '',
      'TETAP', '', '', '', ''];
  }

  return [
    {
      nama: 'akun',
      kolom: ['id', 'nama', 'panggilan', 'cabang', 'role', 'shift', 'pw_hash', 'pin_hash',
        'data_wajah', 'id_hp', 'mulai_kerja', 'jatah_cuti', 'aktif', 'ganti_pw', 'ganti_pin',
        'pw_awal_sampai', 'salah_login', 'terkunci', 'setuju_wajah',
        'pola_shift', 'urutan_shift', 'ganti_setiap', 'mulai_pola', 'gps_daftar'],
      kolomSensitif: ['pw_hash', 'pin_hash', 'data_wajah', 'id_hp'],
      contoh: [
        akun('K001', 'Ahmad Fauzi', 'Fauzi'),
        akun('K002', 'Siti Rohmah', 'Siti'),
        akun('K003', 'Budi Santoso', 'Budi')
      ]
    },
    {
      nama: 'shift',
      kolom: ['cabang', 'no', 'nama', 'masuk', 'tutup', 'pulang', 'toleransi'],
      contoh: [
        ['Ngawi', 1, 'Shift 1', '07:45', '16:00', '16:30', 5]
      ]
    },
    {
      nama: 'kalender',
      kolom: ['tanggal', 'cabang', 'karyawan', 'isi'],
      contoh: []
    },
    {
      nama: 'pengaturan',
      kolom: ['kategori', 'nama', 'nilai', 'kelompok', 'maks'],
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
        ['UMUM', 'libur_minggu_NGW', true, '', ''],
        ['UMUM', 'ukuran_panduan_wajah', 60, '', ''],
        ['UMUM', 'batas_izin_lewat_hari', 2, '', ''],
        ['UMUM', 'sesi_owner_hari', 7, '', ''],
        ['UMUM', 'sinkron_karyawan_menit', 30, '', ''],
        ['UMUM', 'tiket_absen_menit', 3, '', ''],
        ['CABANG', 'Ngawi', 'NGW', '', ''],
        ['JENIS_IZIN', 'Sakit', '', 'biasa', ''],
        ['JENIS_IZIN', 'Keperluan pribadi', '', 'biasa', ''],
        ['JENIS_IZIN', 'Menikah', '', 'khusus', 3],
        ['JENIS_IZIN', 'Keluarga meninggal', '', 'khusus', 2],
        ['JENIS_IZIN', 'Istri melahirkan', '', 'khusus', 2],
        ['JENIS_IZIN', 'Cuti', '', 'cuti', ''],
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
      kolom: ['tanggal', 'karyawan', 'nama', 'cabang', 'shift', 'masuk', 'st_masuk',
        'telat_mnt', 'ket_masuk', 'foto_masuk', 'gps_masuk', 'cara_masuk', 'acc_masuk',
        'pulang', 'st_pulang', 'lembur', 'ket_pulang', 'foto_pulang',
        'gps_pulang', 'cara_pulang', 'acc_pulang', 'st_hari', 'tanda',
        'id_masuk', 'id_pulang'],
      contoh: []
    },
    {
      nama: 'izin',
      kolom: ['id', 'grup', 'karyawan', 'jenis', 'kelompok', 'mulai',
        'selesai', 'hari', 'ket', 'lampiran', 'diajukan',
        'telat_aju', 'status', 'oleh', 'diputus',
        'rekan', 'status_rekan', 'shift_asal', 'shift_tujuan'],
      contoh: []
    },
    {
      nama: 'rekap_bulanan',
      kolom: ['bulan', 'karyawan', 'nama', 'cabang', 'hari_kerja', 'masuk', 'telat',
        'telat_mnt', 'plg_awal', 'alpha', 'izin', 'izin_khusus', 'cuti', 'sisa_cuti',
        'lembur_1', 'lembur_2', 'lembur_3', 'label'],
      contoh: []
    },
    {
      nama: 'log',
      kolom: ['waktu', 'jenis', 'oleh', 'cabang', 'aksi', 'target', 'id', 'sebelum', 'sesudah', 'alasan'],
      contoh: []
    },
    {
      nama: 'sesi',
      kolom: ['id_sesi', 'akun', 'perangkat', 'token_hash', 'dibuat', 'terakhir_aktif', 'kedaluwarsa', 'aktif'],
      contoh: []
    }
  ];
}
