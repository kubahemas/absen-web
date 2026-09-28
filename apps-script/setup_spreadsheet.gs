/**
 * SETUP AWAL SPREADSHEET ABSENSI KUBAH EMAS
 *
 * Cara pakai: jalankan fungsi setupSpreadsheet() satu kali dari editor Apps Script.
 * Aman dijalankan berkali-kali: sheet yang SUDAH ADA (apalagi sudah berisi data)
 * tidak akan disentuh sama sekali. Hanya sheet yang belum ada yang dibuat baru
 * lengkap dengan judul kolom, dan hanya sheet baru itu yang diisi data contoh.
 */

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hasil = [];

  SHEET_DEFS.forEach(function (def) {
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
 * Ubah teks jadi hash SHA-256 (hex). Dipakai untuk password_hash & pin_hash
 * supaya PIN/password asli tidak pernah tersimpan sebagai teks biasa.
 */
function hashTeks(teks) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, teks, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

const TANGGAL_HARI_INI = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+7', 'yyyy-MM-dd');

const SHEET_DEFS = [
  {
    nama: 'akun',
    kolom: ['id_karyawan', 'nama_lengkap', 'nama_panggilan', 'cabang', 'role', 'shift_bawaan',
      'password_hash', 'pin_hash', 'data_wajah', 'id_hp', 'tanggal_mulai', 'jatah_cuti', 'aktif'],
    contoh: [
      ['K001', 'Ahmad Fauzi', 'Fauzi', 'Ngawi', 'KARYAWAN', 1, hashTeks('123456'), hashTeks('1234'), '', '', TANGGAL_HARI_INI, 12, true],
      ['K002', 'Siti Rohmah', 'Siti', 'Ngawi', 'KARYAWAN', 1, hashTeks('123456'), hashTeks('1234'), '', '', TANGGAL_HARI_INI, 12, true],
      ['K003', 'Budi Santoso', 'Budi', 'Ngawi', 'KARYAWAN', 1, hashTeks('123456'), hashTeks('1234'), '', '', TANGGAL_HARI_INI, 12, true]
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
    contoh: []
  },
  {
    nama: 'absensi',
    kolom: ['tanggal', 'cabang', 'id_karyawan', 'nama_lengkap', 'nomor_shift',
      'jam_masuk_jadwal', 'jam_masuk_aktual', 'status_masuk', 'alasan_telat', 'foto_masuk',
      'jam_pulang_jadwal', 'jam_pulang_aktual', 'status_pulang', 'alasan_pulang_awal', 'foto_pulang',
      'lembur_durasi', 'lembur_status', 'penanda'],
    contoh: []
  },
  {
    nama: 'izin',
    kolom: ['id_izin', 'id_karyawan', 'nama_lengkap', 'jenis', 'tanggal_mulai', 'tanggal_selesai',
      'alasan', 'status', 'disetujui_oleh', 'tanggal_pengajuan'],
    contoh: []
  },
  {
    nama: 'rekap_bulanan',
    kolom: ['id_karyawan', 'nama_lengkap', 'cabang', 'bulan', 'tahun', 'total_hadir', 'total_telat',
      'total_alpa', 'total_izin', 'total_cuti', 'total_lembur_jam'],
    contoh: []
  },
  {
    nama: 'log',
    kolom: ['waktu', 'id_karyawan_terkait', 'aksi', 'keterangan', 'dilakukan_oleh'],
    contoh: []
  }
];
