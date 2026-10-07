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
  }
};
