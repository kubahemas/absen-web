// Penanda elemen (atribut data-f) untuk layar baru yang sudah DIHIDUPKAN fungsinya (Fitur A, B, C). Dimuat oleh tools/bangun_layar_baru.sh
// di antara layar_baru_bersih.js dan layar_baru_cfg.js. Hanya menambah atribut; tampilan dan teks tidak berubah.
// Dalam HTML hasil, kode JavaScript di index.html mencari elemen lewat [data-f="nama"] di dalam #lbNN.
function cari(root, re, tag) {
  return Array.prototype.filter.call(root.querySelectorAll(tag || '*'), function (e) { var s = teksLangsung(e); return re instanceof RegExp ? re.test(s) : s === re; })[0] || null;
}
function tandai(e, nama) { if (e) { e.setAttribute('data-f', nama); } return e; }
var FN = {
  '41': function (root) {
    tandai(cari(root, /hari kerja\./), 'info');
    var lj = tandai(cari(root, /^Kelebihan/), 'lebihJudul');
    if (lj && lj.nextElementSibling) {
      var lp = tandai(lj.nextElementSibling, 'lebihPilih');
      var bt = lp.querySelectorAll('button');
      tandai(bt[0], 'lebihCuti'); tandai(bt[1], 'lebihBiasa');
      tandai(cari(bt[0], /^sisa/), 'sisaCuti');
    }
    var h = cari(root, 'Hasil pengajuan');
    if (h) { tandai(h.parentElement, 'hasil'); }
    tandai(cari(root, /^Kirim/, 'button'), 'kirim');
  },
  '23': function (root) {
    tandai(root.querySelector('select[aria-label="Jenis izin"]'), 'jenis');
    tandai(root.querySelector('input[aria-label="Mulai"]'), 'mulai');
    tandai(root.querySelector('input[aria-label="Selesai"]'), 'selesai');
    tandai(cari(root, /hari kerja$/), 'info');
    tandai(cari(root, '[Foto surat]'), 'fotoBox');
    var t = cari(root, /Surat terpasang/); tandai(t, 'terpasang');
    tandai(cari(root, /^Ganti foto/, 'button'), 'ganti');
    tandai(cari(root, /^Izin khusus\./), 'catatan');
    tandai(cari(root, /^Kirim/, 'button'), 'kirim');
  },
  '22': function (root) {
    var judul = cari(root, 'Cek surat dokter');
    if (judul && judul.nextElementSibling) { tandai(judul.nextElementSibling, 'sub'); }
    tandai(cari(root, /^\[Foto surat dokter/), 'foto');
    var t = cari(root, 'Tanggal izin'); if (t && t.nextElementSibling) { tandai(t.nextElementSibling, 'tgl'); }
    var k = cari(root, 'Keterangan'); if (k && k.nextElementSibling) { tandai(k.nextElementSibling, 'ket'); }
    tandai(cari(root, /^Surat tidak sah/, 'button'), 'tidakSah');
    tandai(cari(root, /^ACC/, 'button'), 'acc');
  },
  '66': function (root) {
    tandai(cari(root, /hari kerja$/), 'info');
    tandai(cari(root, /^Foto surat dokter/, 'button'), 'foto');
    tandai(cari(root, /^Simpan/, 'button'), 'simpan');
    tandai(cari(root, 'Langsung disetujui.'), 'catatan');
  },
  '67': function (root) {
    var judul = cari(root, 'Kalender libur'); if (judul && judul.nextElementSibling) { tandai(judul.nextElementSibling, 'sub'); }
    tandai(root.querySelector('button[role="switch"]'), 'saklar');
    var sen = cari(root, 'Sen');
    if (sen) {
      var grid = tandai(sen.parentElement, 'grid');
      var kartu = grid.parentElement;
      if (kartu && kartu.children[2]) { tandai(kartu.children[2], 'catatanTanggal'); }
    }
    tandai(cari(root, /^\+ Libur khusus/, 'button'), 'tambah');
  }  ,
  '02': function (root) {
    var aktif = cari(root, /aktif$/);
    if (aktif) { tandai(aktif.parentElement.parentElement, 'blokAktif'); }
    var lain = cari(root, /^Shift \S+$/);
    if (lain) { tandai(lain.parentElement.parentElement, 'blokBiasa'); }
  },
  '42': function (root) {
    tandai(cari(root, /^Tukar dengan rekan/, 'button'), 'segTukar');
    tandai(cari(root, 'Pindah shift', 'button'), 'segPindah');
    tandai(root.querySelector('input[aria-label="Tanggal"]'), 'tanggal');
    tandai(root.querySelector('select[aria-label="Rekan"]'), 'rekan');
    tandai(root.querySelector('input[aria-label="Alasan"]'), 'alasan');
    var lab = cari(root, 'Alasan (opsional)'); if (lab) { tandai(lab.parentElement, 'form'); }
    tandai(cari(root, /^Tukar dengan$/), 'labelRekan');
    tandai(cari(root, /^Sepakati dulu/), 'catatan');
    tandai(cari(root, /^Kirim/, 'button'), 'kirim');
  },
  '43': function (root) {
    tandai(cari(root, /mengajak tukar shift/), 'judul');
    tandai(cari(root, /^Selasa,/), 'waktu');
    tandai(cari(root, /^Alasan:/), 'alasan');
    tandai(cari(root, /^Tolak/, 'button'), 'tolak');
    tandai(cari(root, /^Setuju/, 'button'), 'setuju');
  },
  '55': function (root) {
    var j = cari(root, 'Jadwal shift'); if (j && j.nextElementSibling) { tandai(j.nextElementSibling, 'sub'); }
    tandai(cari(root, /Minggu lalu$/, 'button'), 'lalu');
    tandai(cari(root, /^Minggu depan/, 'button'), 'depan');
    var sen = cari(root, 'Sen'); if (sen) { tandai(sen.parentElement, 'header'); }
    var leg = cari(root, /^Libur$/); if (leg) { tandai(leg.parentElement, 'legenda'); }
    tandai(cari(root, /^Salin minggu lalu/, 'button'), 'salin');
    tandai(cari(root, /^Simpan/, 'button'), 'simpan');
  },
  '56': function (root) {
    tandai(root.querySelector('input[aria-label="Tanggal tukar"]'), 'tanggal');
    tandai(root.querySelector('select[aria-label="Karyawan 1"]'), 'k1');
    tandai(root.querySelector('select[aria-label="Karyawan 2"]'), 'k2');
    var lab = Array.prototype.filter.call(root.querySelectorAll('div'), function (d) { return /^Karyawan \S+$/.test(teksLangsung(d)); });
    if (lab[0]) { tandai(lab[0], 'lab1'); } if (lab[1]) { tandai(lab[1], 'lab2'); }
    var b = cari(root, /Besok kembali/); if (b) { tandai(b.parentElement, 'preview'); }
    tandai(cari(root, /^Tukar/, 'button'), 'tukar');
  },
  '57': function (root) {
    var j = cari(root, 'Pola shift'); if (j && j.nextElementSibling) { tandai(j.nextElementSibling, 'sub'); }
    tandai(cari(root, 'Tetap', 'button'), 'segTetap');
    tandai(cari(root, 'Bergilir', 'button'), 'segBergilir');
    var u = cari(root, 'Urutan shift'); if (u) { tandai(u.parentElement, 'blokUrutan'); if (u.nextElementSibling) { tandai(u.nextElementSibling, 'urutan'); } }
    tandai(cari(root, /^\+ Shift/, 'button'), 'tambahShift');
    var p = cari(root, 'Pratinjau 4 minggu'); if (p) { tandai(p.parentElement, 'pratinjau'); }
    tandai(cari(root, /^Simpan/, 'button'), 'simpan');
  }
  ,
  // ---- Fitur C: peringatan HP toko (05, 06, 07, 13, 18, 19) dan koreksi absen admin (53, 54, 64, 65) ----
  '05': function (root) {
    tandai(cari(root, /^ABSEN MASUK$/), 'header');
    tandai(cari(root, /sudah absen masuk jam/), 'judul');
    tandai(cari(root, /^\[Foto absen/), 'fotoLama');
    tandai(cari(root, /^\[Foto sekarang/), 'fotoBaru');
    tandai(cari(root, /^YA, ITU SAYA/, 'button'), 'ya');
    tandai(cari(root, /^BUKAN SAYA/, 'button'), 'bukan');
  },
  '06': function (root) {
    tandai(cari(root, /jadwal Anda Shift/), 'judul');
    tandai(cari(root, /^Jadwal: Shift/), 'pil');
    tandai(cari(root, /^\[Foto kamera/), 'foto');
    tandai(cari(root, /^Sekarang /), 'tanya');
    tandai(cari(root, /^YA, SHIFT/, 'button'), 'ya');
    tandai(cari(root, /^Tidak, saya telat/, 'button'), 'tidak');
    tandai(cari(root, /perlu konfirmasi admin/), 'catatan');
  },
  '07': function (root) {
    tandai(cari(root, /sudah absen lembur jam/), 'judul');
    tandai(cari(root, /^Lembur .*jam/), 'pil');
    tandai(cari(root, /^\[Foto sekarang/), 'fotoBaru');
    tandai(cari(root, /^\[Foto(?! sekarang)/), 'fotoLama');
    tandai(cari(root, /^Sekarang/), 'sekarang');
    tandai(cari(root, /^YA, ITU SAYA/, 'button'), 'ya');
    tandai(cari(root, /^Revisi lembur ke/, 'button'), 'revisi');
    tandai(cari(root, /^BUKAN SAYA/, 'button'), 'bukan');
  },
  '13': function (root) {
    tandai(cari(root, /^Satu lagi/), 'sapa');
    tandai(cari(root, /^Senin,/), 'pil');
    tandai(cari(root, /^MENGERTI/, 'button'), 'ok');
    tandai(cari(root, /^Menutup otomatis/), 'tutup');
  },
  '18': function (root) {
    tandai(cari(root, /^Selamat bekerja/), 'judul');
    tandai(cari(root, /^Masuk /), 'pil');
    tandai(cari(root, /^Senin,/), 'detail');
    tandai(cari(root, /^Menutup otomatis/), 'tutup');
  },
  '19': function (root) {
    tandai(cari(root, /^Terima kasih/), 'judul');
    tandai(cari(root, /^Pulang /), 'pil');
    tandai(cari(root, /^Menutup otomatis/), 'tutup');
  },
  '53': function (root) {
    var judul = cari(root, 'Konflik absen'); if (judul && judul.nextElementSibling) { tandai(judul.nextElementSibling, 'sub'); }
    tandai(cari(root, /menekan BUKAN SAYA/), 'info');
    var fotos = Array.prototype.filter.call(root.querySelectorAll('div'), function (d) { return /^\[Foto/.test(teksLangsung(d)); });
    if (fotos[0]) { tandai(fotos[0], 'fotoLama'); tandai(fotos[0].parentElement.children[2], 'ketLama'); tandai(fotos[0].parentElement.children[1], 'judulLama'); }
    if (fotos[1]) { tandai(fotos[1], 'fotoBaru'); tandai(fotos[1].parentElement.children[2], 'ketBaru'); tandai(fotos[1].parentElement.children[1], 'judulBaru'); }
    tandai(cari(root, /milik siapa\?/), 'tanya');
    tandai(root.querySelector('select[id$="_pk"]'), 'pindah');
    tandai(root.querySelector('select[id$="_al"]'), 'alasan');
    tandai(cari(root, /^Hasil:/), 'hasil');
    tandai(cari(root, /^Pindahkan$/, 'button'), 'pindahkan');
    tandai(cari(root, /^Bukan milik siapa pun/, 'button'), 'hapus');
  },
  '54': function (root) {
    tandai(root.querySelector('select[id$="_k"]'), 'karyawan');
    tandai(root.querySelector('input[id$="_t"]'), 'tanggal');
    tandai(root.querySelector('input[id$="_j"]'), 'jam');
    tandai(cari(root, 'Masuk', 'button'), 'jMasuk');
    tandai(cari(root, 'Pulang', 'button'), 'jPulang');
    tandai(cari(root, 'Lupa absen', 'button'), 'a0');
    tandai(cari(root, 'HP toko bermasalah', 'button'), 'a1');
    tandai(cari(root, /^Internet/, 'button'), 'a2');
    tandai(cari(root, 'Lainnya', 'button'), 'a3');
    tandai(cari(root, /^Status:/), 'status');
    tandai(cari(root, /^Ketuk$/, 'button'), 'fotoTombol');
    tandai(cari(root, /^Foto/), 'fotoJudul');
    tandai(cari(root, /^Ketuk kotak kamera/), 'fotoPetunjuk');
    tandai(cari(root, /^SIMPAN/, 'button'), 'simpan');
  },
  '64': function (root) {
    var ft = root.querySelector('select[id$="_ft"]'), fk = root.querySelector('select[id$="_fk"]');
    tandai(ft, 'ft'); tandai(fk, 'fk');
    var grid = ft && ft.parentElement && ft.parentElement.parentElement;
    if (grid && grid.nextElementSibling) { tandai(grid.nextElementSibling.firstElementChild, 'daftar'); }
    tandai(cari(root, /^Ketuk pensil/), 'petunjuk');
  },
  '25': function (root) {
    FN['64'](root);
    tandai(root.querySelector('select[aria-label="Cabang"]'), 'cabang');
  },
  '65': function (root) {
    var j = cari(root, 'Edit absen'); if (j && j.nextElementSibling) { tandai(j.nextElementSibling, 'sub'); }
    tandai(cari(root, 'Masuk', 'button'), 'tabMasuk');
    tandai(cari(root, 'Pulang', 'button'), 'tabPulang');
    var foto = cari(root, /^\[Foto absen/); tandai(foto, 'foto'); if (foto && foto.nextElementSibling) { tandai(foto.nextElementSibling, 'jamFoto'); }
    tandai(cari(root, /^Update foto/, 'button'), 'updateFoto');
    tandai(root.querySelector('input[id$="_em"]'), 'jam');
    tandai(root.querySelector('label[for$="_em"]'), 'labelJam');
    var sb = cari(root, /^Sebelum/); if (sb) { tandai(sb.nextElementSibling, 'ringkas'); }
    tandai(root.querySelector('input[id$="_ea"]'), 'alasan');
    tandai(cari(root, /^Simpan/, 'button'), 'simpan');
  }

};
