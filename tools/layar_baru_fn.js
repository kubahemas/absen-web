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

};
