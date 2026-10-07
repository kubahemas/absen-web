// Skrip uji (server TIRUAN, tidak menulis ke sheet): Fitur A izin dan cuti, cek surat dokter, input izin admin, kalender libur, kartu "Hari ini tidak masuk".
// Konteks lewat window.__KONTEKS = 'karyawan' | 'admin' | 'toko' (baris pertama berkas salinan). 'toko' butuh PRA tools/pra_toko.js. Pakai BUDGET=40000.
window.__hasil = [];
var H = window.__hasil, panggil = [];
var K = window.__KONTEKS || 'karyawan';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function f(id, nama) { return document.querySelector('#' + id + ' [data-f="' + nama + '"]'); }
function teks(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function ubah(e, nilai) { e.value = nilai; e.dispatchEvent(new Event('change', { bubbles: true })); }
function terakhir(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }).pop(); }
function jumlah(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }).length; }
var JENIS = [{ nama: 'Sakit', kelompok: 'biasa', maks: 0 }, { nama: 'Keperluan pribadi', kelompok: 'biasa', maks: 0 }, { nama: 'Menikah', kelompok: 'khusus', maks: 3 }, { nama: 'Keluarga meninggal', kelompok: 'khusus', maks: 2 }, { nama: 'Istri melahirkan', kelompok: 'khusus', maks: 2 }, { nama: 'Cuti', kelompok: 'cuti', maks: 0 }];
var FOTO = 'data:image/jpeg;base64,/9j/' + 'A'.repeat(300);
function tambahHari(t, n) { var p = t.split('-').map(Number); var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return d.toISOString().slice(0, 10); }
function pratinjau(b) {
  if (b.mulai === '2026-12-31') { return { status: 'ok', bisa: false, pesan: 'Tidak ada hari kerja terjadwal pada tanggal itu (libur atau tidak ada jadwal)', hari: 0, segmen: [], kelebihan: 0, sisa_cuti: 4, sisa_setelah: null }; }
  var n = Math.round((Date.parse(b.selesai) - Date.parse(b.mulai)) / 86400000) + 1;
  if (b.jenis === 'Menikah' && n > 3) {
    var l = b.lebih || 'CUTI', lebih = n - 3;
    return { status: 'ok', bisa: true, pesan: '', hari: n, kelebihan: lebih, lebih: l, maks: 3, sisa_cuti: 4, sisa_setelah: l === 'CUTI' ? 4 - lebih : 4, segmen: [{ jenis: 'Menikah', kelompok: 'khusus', hari: 3, mulai: b.mulai, selesai: tambahHari(b.mulai, 2) }, { jenis: l === 'CUTI' ? 'Cuti' : 'Keperluan pribadi', kelompok: l === 'CUTI' ? 'cuti' : 'biasa', hari: lebih, mulai: tambahHari(b.mulai, 3), selesai: b.selesai }] };
  }
  return { status: 'ok', bisa: true, pesan: '', hari: n, kelebihan: 0, lebih: '', maks: 0, sisa_cuti: 4, sisa_setelah: 4, segmen: [{ jenis: b.jenis, kelompok: b.jenis === 'Cuti' ? 'cuti' : 'biasa', hari: n, mulai: b.mulai, selesai: b.selesai }] };
}
var izinSisa = [
  { id: 'IZIN|IZN-2026-0008', jenis: 'IZIN', kelompok: 'IZIN', karyawan: 'K002', nama: 'Rina Wati', cabang: 'Ngawi', tanggal: '2026-09-29', jam: '', shift: '', judul: 'Izin sakit dengan surat', rincian: '29\u201330 Sep, 2 hari kerja, lampiran ada', ket: 'Demam', surat: true, sakit: true, telat_aju: false, role: 'KARYAWAN' },
  { id: 'IZIN|IZN-2026-0012', jenis: 'IZIN', kelompok: 'IZIN', karyawan: 'K003', nama: 'Ari Pratama', cabang: 'Ngawi', tanggal: '2026-09-30', jam: '', shift: '', judul: 'Izin sakit dengan surat', rincian: '30 Sep, 1 hari kerja, lampiran ada', ket: '', surat: true, sakit: true, telat_aju: false, role: 'KARYAWAN' },
  { id: 'IZIN|IZN-2026-0009', jenis: 'IZIN', kelompok: 'IZIN', karyawan: 'K004', nama: 'Andi Pratama', cabang: 'Ngawi', tanggal: '2026-10-02', jam: '', shift: '', judul: 'Izin \u00b7 keperluan pribadi', rincian: '2 Okt, 1 hari kerja', ket: '', surat: false, sakit: false, telat_aju: true, role: 'KARYAWAN' },
  { id: 'IZIN|IZN-2026-0013', jenis: 'IZIN', kelompok: 'IZIN', karyawan: 'K005', nama: 'Joko Susilo', cabang: 'Ngawi', tanggal: '2026-10-03', jam: '', shift: '', judul: 'Cuti', rincian: '3 Okt, 1 hari kerja', ket: '', surat: false, sakit: false, telat_aju: false, role: 'KARYAWAN' }
];
var namaTidakMasuk = K === 'toko2' ? ['Siti', 'Budi', 'Rina', 'Dewi', 'Andi', 'Joko', 'Wulan', 'Tono', 'Dimas', 'Sari', 'Maya', 'Bagas', 'Lina', 'Hendra'] : ['Siti', 'Budi'];
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggil.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: K === 'admin' ? 'K009' : 'K001', nama: K === 'admin' ? 'Dewi Lestari' : 'Budi Santoso', panggilan: 'Budi', role: K === 'admin' ? 'ADMIN' : 'KARYAWAN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false, izin_menunggu: 2 }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: izinSisa.length, jumlah_teks: String(izinSisa.length) }; }
  if (b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: izinSisa.slice(), total: izinSisa.length, jumlah_teks: String(izinSisa.length), ada_lagi: false }; }
  if (b.aksi === 'konfirmasi_putuskan') { izinSisa = izinSisa.filter(function (x) { return x.id !== b.id; }); d = { status: 'ok', keputusan: 'DITERIMA' }; }
  if (b.aksi === 'ambil_foto') { d = { status: 'ok', foto: FOTO, mulai: '2026-09-29', selesai: '2026-09-30', hari: 2, ket: 'Demam' }; }
  if (b.aksi === 'izin_info') { d = { status: 'ok', hari_ini: '2026-10-07', jenis: JENIS, jatah: 6, sisa_cuti: 4, batas_lewat_hari: 2, role: 'KARYAWAN' }; }
  if (b.aksi === 'izin_pratinjau') { d = pratinjau(b); }
  if (b.aksi === 'izin_ajukan') { d = { status: 'ok', grup: 'IZN-2026-0001', ids: ['IZN-2026-0001-A'], segmen: [], id_sakit: b.jenis === 'Sakit' ? 'IZN-2026-0001-A' : '', telat_aju: false }; }
  if (b.aksi === 'izin_unggah_surat') { d = { status: 'ok', pesan: 'Surat tersimpan' }; }
  if (b.aksi === 'izin_input_info') { d = { status: 'ok', hari_ini: '2026-10-07', jenis: JENIS }; }
  if (b.aksi === 'karyawan_daftar') { d = { status: 'ok', cabang: 'Ngawi', daftar: [{ id: 'K002', nama: 'Rina Wati', panggilan: 'Rina', shift: '1', aktif: true, role: 'KARYAWAN' }, { id: 'K003', nama: 'Ari Pratama', panggilan: 'Ari', shift: '1', aktif: true, role: 'KARYAWAN' }], daftar_shift: [], kelompok: 'AKTIF', jumlah_aktif: 2, admin_daftar: [], id_berikutnya: 'K010', jatah_cuti: 6 }; }
  if (b.aksi === 'izin_input_pratinjau') { d = pratinjau(b); d.bisa = d.bisa; }
  if (b.aksi === 'izin_input') { d = { status: 'ok', grup: 'IZN-2026-0002', ids: ['IZN-2026-0002-A'], segmen: [], id_sakit: b.jenis === 'Sakit' ? 'IZN-2026-0002-A' : '' }; }
  if (b.aksi === 'kalender_baca') { d = { status: 'ok', cabang: 'Ngawi', bulan: '2026-10', hari_ini: '2026-10-07', libur_minggu: true, daftar: [{ tanggal: '2026-10-17', tipe: 'MERAH', ket: '', umum: false }, { tanggal: '2026-10-22', tipe: 'KHUSUS', ket: 'renovasi toko', umum: false }, { tanggal: '2026-10-25', tipe: 'MASUK', ket: 'stok opname', umum: false }] }; }
  if (b.aksi === 'kalender_simpan') { d = { status: 'ok' }; }
  if (b.aksi === 'tidak_masuk_hari_ini') { d = { status: 'ok', jumlah: namaTidakMasuk.length, daftar: namaTidakMasuk }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
async function masukPribadi(nama) {
  el('btnJenisPribadi').click(); await tunggu(100);
  el('pribNama').value = nama; el('pribRahasia').value = K === 'admin' ? 'rahasia12' : '12345'; el('btnMasukPribadi').click(); await tunggu(700);
}
async function dariMenuAdmin(nama, kelayar) {
  el('btnMenuPribadi').click(); await tunggu(150);
  Array.prototype.filter.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0].click(); await tunggu(500);
}
(async function () {
  try {
    if (K === 'karyawan') {
      await masukPribadi('Budi Santoso');
      var strip = el('pribStripTeks').textContent;
      ok('beranda: kartu "2 pengajuan menunggu ACC" dari server; "Lihat" tetap nonaktif (mockup tidak punya layar daftar)', strip === '2 pengajuan menunggu ACC' && !el('pribStrip').classList.contains('belum-aktif') && el('pribStripLihat').textContent === 'Lihat');
      el('btnPribIzin').click(); await tunggu(700);
      ok('tombol Izin/Cuti memuat jenis dari server (izin_info) dan membuka form Sakit (23) karena jenis pertama Sakit', jumlah('izin_info') === 1 && terakhir('izin_info').sesi === 'S'.repeat(40) && aktif() === 'lb23');
      ok('dropdown jenis berisi 6 jenis dari pengaturan, bukan tulisan tetap', f('lb23', 'jenis').options.length === 6 && !f('lb23', 'jenis').disabled && document.getElementById('lb41_jenis').options.length === 6);
      ok('tanggal awal = hari ini dari SERVER (bukan jam HP)', f('lb23', 'mulai').value === '2026-10-07' && f('lb23', 'selesai').value === '2026-10-07');
      ok('Kirim aktif setelah pratinjau server; teks "1 hari kerja"', !f('lb23', 'kirim').disabled && teks(f('lb23', 'info')) === '1 hari kerja');
      ok('Sakit tanpa surat: "Surat terpasang" dan catatan "Izin khusus" pudar (belum ada surat)', f('lb23', 'terpasang').classList.contains('belum-aktif') && f('lb23', 'catatan').classList.contains('belum-aktif'));
      window.__pilihFotoUji = FOTO;
      f('lb23', 'ganti').click(); await tunggu(200);
      ok('foto surat terpasang: pratinjau gambar tampil, "Surat terpasang" dan catatan khusus aktif', !!f('lb23', 'fotoBox').querySelector('img') && !f('lb23', 'terpasang').classList.contains('belum-aktif') && !f('lb23', 'catatan').classList.contains('belum-aktif'));
      f('lb23', 'kirim').click(); await tunggu(800);
      var aj = terakhir('izin_ajukan'), up = terakhir('izin_unggah_surat');
      ok('Kirim: izin_ajukan membawa sesi, jenis, tanggal; tanpa jam dari HP', !!aj && aj.sesi === 'S'.repeat(40) && aj.jenis === 'Sakit' && aj.mulai === '2026-10-07' && aj.selesai === '2026-10-07' && aj.waktu === undefined && aj.jam === undefined);
      ok('surat dokter diunggah SESUDAH pengajuan tersimpan (izin_unggah_surat dengan id baris Sakit dan gambar JPEG)', !!up && up.id === 'IZN-2026-0001-A' && /^data:image\/jpeg;base64,/.test(up.gambar) && panggil.indexOf(aj) < panggil.indexOf(up));
      ok('dialog "Pengajuan terkirim" tampil', /Pengajuan terkirim/.test(el('dialog').textContent) && /Menunggu persetujuan admin/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(300);
      ok('OK kembali ke beranda pribadi', aktif() === 'layarPribadi');
      el('btnPribIzin').click(); await tunggu(600);
      ok('buka lagi tidak memuat izin_info ulang; form bersih (foto dilepas)', jumlah('izin_info') === 1 && !f('lb23', 'fotoBox').querySelector('img'));
      ubah(f('lb23', 'jenis'), 'Menikah'); await tunggu(500);
      ok('ganti jenis ke Menikah: otomatis pindah ke form izin (41)', aktif() === 'lb41' && document.getElementById('lb41_jenis').value === 'Menikah');
      ubah(document.getElementById('lb41_mulai'), '2026-10-12'); ubah(document.getElementById('lb41_selesai'), '2026-10-16'); await tunggu(700);
      var pr = terakhir('izin_pratinjau');
      ok('pratinjau dikirim ke server dengan jenis dan tanggal', pr.jenis === 'Menikah' && pr.mulai === '2026-10-12' && pr.selesai === '2026-10-16' && pr.sesi === 'S'.repeat(40));
      ok('info: "5 hari kerja. Menikah maksimal 3 hari."', teks(lbF41('info')) === '5 hari kerja. Menikah maksimal 3 hari.');
      ok('kelebihan: "Kelebihan 2 hari diambil dari", pilihan Cuti (sisa 4 hari) dan Izin biasa aktif, Cuti terpilih', teks(lbF41('lebihJudul')) === 'Kelebihan 2 hari diambil dari' && !lbF41('lebihCuti').disabled && !lbF41('lebihBiasa').disabled && /sisa 4 hari/.test(teks(lbF41('lebihCuti'))) && lbF41('lebihCuti').style.background.indexOf('--abu') >= 0);
      var hasil = Array.prototype.map.call(lbF41('hasil').children, function (c) { return teks(c); });
      ok('Hasil pengajuan: "3 hari izin khusus menikah (12\u201314 Okt)", "2 hari cuti (15\u201316 Okt)", "Sisa cuti jadi 2 hari."', hasil.join(' | ') === 'Hasil pengajuan | 3 hari izin khusus menikah (12\u201314 Okt) | 2 hari cuti (15\u201316 Okt) | Sisa cuti jadi 2 hari.');
      lbF41('lebihBiasa').click(); await tunggu(500);
      var hasil2 = Array.prototype.map.call(lbF41('hasil').children, function (c) { return teks(c); });
      ok('pilih Izin biasa: pratinjau diminta dengan lebih BIASA; hasil "2 hari izin keperluan pribadi" tanpa baris sisa cuti', terakhir('izin_pratinjau').lebih === 'BIASA' && hasil2.join(' | ') === 'Hasil pengajuan | 3 hari izin khusus menikah (12\u201314 Okt) | 2 hari izin keperluan pribadi (15\u201316 Okt)');
      document.getElementById('lb41_ket').value = 'Pernikahan di Madiun'; document.getElementById('lb41_ket').dispatchEvent(new Event('input', { bubbles: true }));
      lbF41('kirim').click(); await tunggu(800);
      aj = terakhir('izin_ajukan');
      ok('Kirim Menikah: lebih BIASA dan keterangan ikut; tanpa unggah surat (bukan Sakit)', aj.jenis === 'Menikah' && aj.lebih === 'BIASA' && aj.ket === 'Pernikahan di Madiun' && jumlah('izin_unggah_surat') === 1);
      el('dlgOk').click(); await tunggu(300);
      el('btnPribIzin').click(); await tunggu(600);
      ubah(document.getElementById('lb41_mulai'), '2026-12-31'); ubah(document.getElementById('lb41_selesai'), '2026-12-31'); await tunggu(700);
      ok('pengajuan ditolak server: pesan Indonesia tampil merah di info, tombol Kirim nonaktif', /Tidak ada hari kerja terjadwal/.test(teks(lbF41('info'))) && lbF41('info').style.color.indexOf('--merah') >= 0 && lbF41('kirim').disabled);
      ok('tidak ada panggilan izin untuk jam/tanggal dari HP selain yang diketik pengguna; tidak ada panggilan admin', !panggil.some(function (x) { return /^(izin_input|kalender|konfirmasi)/.test(x.aksi) && x.aksi !== 'konfirmasi_jumlah'; }));
    }
    if (K === 'admin') {
      await masukPribadi('Dewi Lestari');
      el('btnPribMenuAdmin').click(); await tunggu(700);
      ok('Konfirmasi terbuka; 4 item izin dari server', aktif() === 'layarKonfirmasi' && jumlah('konfirmasi_daftar') >= 1);
      var chips = Array.prototype.map.call(el('konfChips').querySelectorAll('button'), function (b) { return b.textContent + (b.disabled ? '[x]' : ''); });
      ok('chip "Izin 4" AKTIF (bukan Segera); Lupa absen AKTIF (Fitur C)', chips.indexOf('Izin 4') >= 0 && chips.some(function (c) { return /^Lupa absen 0$/.test(c); }) && !chips.some(function (c) { return /^Izin.*Segera/.test(c); }));
      el('konfChips').querySelector('button[data-kel="IZIN"]').click(); await tunggu(200);
      var kartu = el('daftarKonfirmasi').querySelectorAll('.kartu-konf');
      ok('chip Izin: kartu izin tampil dengan judul, nama, rincian (maksimal 5 kartu)', kartu.length === 4 && /Izin sakit dengan surat/.test(kartu[0].textContent) && /Rina Wati/.test(kartu[0].textContent) && /29\u201330 Sep, 2 hari kerja, lampiran ada/.test(kartu[0].textContent) && /Cuti/.test(kartu[3].textContent));
      ok('kartu izin tanpa tombol Foto dan tanpa Edit (hanya ACC dan Tolak)', !kartu[0].querySelector('.konf-foto') && !kartu[0].querySelector('.konf-edit') && !!kartu[0].querySelector('.acc') && !!kartu[0].querySelector('.tolak'));
      kartu[0].querySelector('.acc').click(); await tunggu(800);
      ok('ACC izin sakit dengan surat membuka layar cek surat dokter (22), belum langsung diputuskan', aktif() === 'lb22' && jumlah('konfirmasi_putuskan') === 0);
      var ab = terakhir('ambil_foto');
      ok('surat dimuat dari server memakai id izin dan sesi admin; foto tampil, subjudul "Rina Wati \u00b7 29\u201330 Sep", tanggal dan keterangan terisi', ab.id === 'IZIN|IZN-2026-0008' && !!f('lb22', 'foto').querySelector('img') && teks(f('lb22', 'sub')) === 'Rina Wati \u00b7 29\u201330 Sep' && /29\u201330 Sep \u00b7 2 hari/.test(teks(f('lb22', 'tgl'))) && teks(f('lb22', 'ket')) === 'Demam');
      ok('tombol ACC dan "Surat tidak sah" aktif setelah surat dimuat; badge "Admin Ngawi"', !f('lb22', 'acc').disabled && !f('lb22', 'tidakSah').disabled && /Admin Ngawi/.test(teks(document.getElementById('lb22'))));
      f('lb22', 'acc').click(); await tunggu(700);
      var pu = terakhir('konfirmasi_putuskan');
      ok('ACC dari layar 22: konfirmasi_putuskan ACC id IZIN|IZN-2026-0008 tanpa surat_tidak_sah; kembali ke Konfirmasi; kartu hilang', pu.id === 'IZIN|IZN-2026-0008' && pu.keputusan === 'ACC' && !pu.surat_tidak_sah && aktif() === 'layarKonfirmasi' && el('daftarKonfirmasi').querySelectorAll('.kartu-konf').length === 3 && /Izin diterima/.test(el('konfPesan').textContent));
      kartu = el('daftarKonfirmasi').querySelectorAll('.kartu-konf');
      kartu[0].querySelector('.acc').click(); await tunggu(700);
      f('lb22', 'tidakSah').click(); await tunggu(200);
      ok('"Surat tidak sah" meminta konfirmasi dulu', /Surat tidak sah\?/.test(el('dialog').textContent) && jumlah('konfirmasi_putuskan') === 1);
      el('dlgYa').click(); await tunggu(700);
      pu = terakhir('konfirmasi_putuskan');
      ok('konfirmasi: ACC dengan surat_tidak_sah = true (dijadikan sakit tanpa surat)', pu.id === 'IZIN|IZN-2026-0012' && pu.keputusan === 'ACC' && pu.surat_tidak_sah === true && aktif() === 'layarKonfirmasi');
      kartu = el('daftarKonfirmasi').querySelectorAll('.kartu-konf');
      kartu[0].querySelector('.acc').click(); await tunggu(700);
      ok('izin tanpa surat: ACC langsung memutuskan (tanpa layar 22)', aktif() === 'layarKonfirmasi' && terakhir('konfirmasi_putuskan').id === 'IZIN|IZN-2026-0009');
      el('daftarKonfirmasi').querySelectorAll('.kartu-konf')[0].querySelector('.tolak').click(); await tunggu(200);
      ok('Tolak izin meminta konfirmasi dengan judul "Tolak izin ini?"', /Tolak izin ini\?/.test(el('dialog').textContent));
      el('dlgYa').click(); await tunggu(600);
      pu = terakhir('konfirmasi_putuskan');
      ok('Tolak izin: keputusan TOLAK, pesan "Izin ditolak."', pu.keputusan === 'TOLAK' && pu.id === 'IZIN|IZN-2026-0013' && /Izin ditolak/.test(el('konfPesan').textContent));
      el('btnKembaliKonf').click(); await tunggu(300);
      // ---- input izin (66) ----
      await dariMenuAdmin('Input izin');
      ok('Input izin (66) terbuka; karyawan cabang dan jenis dimuat dari server dengan sesi admin', aktif() === 'lb66' && jumlah('izin_input_info') === 1 && jumlah('karyawan_daftar') >= 1 && document.getElementById('lb66_ik').options.length === 3 && document.getElementById('lb66_ij').options.length === 6);
      ok('badge "Admin Ngawi"; "Simpan" nonaktif sebelum karyawan dipilih; info "Pilih karyawan"', /Admin Ngawi/.test(teks(document.getElementById('lb66'))) && f('lb66', 'simpan').disabled && teks(f('lb66', 'info')) === 'Pilih karyawan');
      ubah(document.getElementById('lb66_ik'), 'K002'); await tunggu(700);
      ok('pilih karyawan: pratinjau dihitung server (izin_input_pratinjau, kredensial admin); Simpan aktif; tombol foto aktif untuk Sakit', terakhir('izin_input_pratinjau').karyawan === 'K002' && terakhir('izin_input_pratinjau').sesi === 'S'.repeat(40) && !f('lb66', 'simpan').disabled && !f('lb66', 'foto').disabled && teks(f('lb66', 'info')) === '1 hari kerja');
      window.__pilihFotoUji = FOTO; f('lb66', 'foto').click(); await tunggu(200);
      document.getElementById('lb66_ik2').value = 'Demam';
      f('lb66', 'simpan').click(); await tunggu(900);
      var ii = terakhir('izin_input'), iu = terakhir('izin_unggah_surat');
      ok('Simpan: izin_input (karyawan, jenis, tanggal, keterangan) lalu surat diunggah dengan id baris; dialog "Langsung disetujui."', ii.karyawan === 'K002' && ii.jenis === 'Sakit' && ii.ket === 'Demam' && !!iu && iu.id === 'IZN-2026-0002-A' && /Izin tersimpan/.test(el('dialog').textContent) && /Langsung disetujui/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(300);
      ok('kembali ke beranda admin pribadi', aktif() === 'layarPribadi');
      // ---- kalender libur (67) ----
      await dariMenuAdmin('Kalender libur');
      ok('Kalender libur (67) terbuka: kalender_baca dengan sesi admin; judul "Oktober 2026 \u00b7 Cabang Ngawi"', aktif() === 'lb67' && jumlah('kalender_baca') === 1 && teks(f('lb67', 'sub')) === 'Oktober 2026 \u00b7 Cabang Ngawi');
      var sel = f('lb67', 'grid').querySelectorAll('button[data-tgl]');
      ok('31 tanggal Oktober tampil; Oktober mulai hari Kamis (3 sel kosong sebelum tanggal 1)', sel.length === 31 && f('lb67', 'grid').children.length === 7 + 3 + 31);
      var s17 = f('lb67', 'grid').querySelector('[data-tgl="2026-10-17"]'), s22 = f('lb67', 'grid').querySelector('[data-tgl="2026-10-22"]'), s25 = f('lb67', 'grid').querySelector('[data-tgl="2026-10-25"]'), s11 = f('lb67', 'grid').querySelector('[data-tgl="2026-10-11"]'), s1 = f('lb67', 'grid').querySelector('[data-tgl="2026-10-01"]');
      ok('warna: tanggal merah (merah muda), libur khusus (abu), Minggu masuk (bingkai hijau), Minggu libur (krem), tanggal lewat pudar dan tidak bisa diketuk', s17.style.background.indexOf('--merah-muda') >= 0 && s22.style.background.indexOf('--abu') >= 0 && s25.style.border.indexOf('--hijau') >= 0 && /217, 214, 204|D9D6CC/i.test(s11.style.background));
      ok('tanggal yang sudah lewat tidak bisa diketuk (hanya hari ini dan seterusnya)', s1.getAttribute('aria-disabled') === 'true');
      ok('catatan di bawah legenda: "17 Okt \u00b7 Libur tanggal merah", "22 Okt \u00b7 Libur khusus: renovasi toko", "25 Okt \u00b7 Minggu masuk (stok opname)"', /17 Okt \u00b7 Libur tanggal merah/.test(teks(document.getElementById('lb67'))) && /22 Okt \u00b7 Libur khusus: renovasi toko/.test(teks(document.getElementById('lb67'))) && /25 Okt \u00b7 Minggu masuk \(stok opname\)/.test(teks(document.getElementById('lb67'))));
      s1.click(); await tunggu(150);
      ok('mengetuk tanggal lewat tidak membuka apa pun', !el('dialog').classList.contains('tampil'));
      f('lb67', 'grid').querySelector('[data-tgl="2026-10-09"]').click(); await tunggu(150);
      ok('mengetuk tanggal depan membuka dialog ubah libur (pilihan tanggal merah, libur khusus; "Minggu masuk" hanya untuk Minggu)', /Ubah libur/.test(el('dialog').textContent) && el('kalTipe').options.length === 2);
      el('kalTipe').value = 'MERAH'; el('dlgSimpan').click(); await tunggu(500);
      var ks = terakhir('kalender_simpan');
      ok('Simpan mengirim kalender_simpan {tanggal, tipe MERAH} dengan sesi admin lalu memuat ulang', ks.tanggal === '2026-10-09' && ks.tipe === 'MERAH' && ks.sesi === 'S'.repeat(40) && jumlah('kalender_baca') === 2);
      f('lb67', 'grid').querySelector('[data-tgl="2026-10-11"]').click(); await tunggu(150);
      ok('Minggu: dialog juga menawarkan "Minggu masuk"', el('kalTipe').options.length === 3);
      el('dlgBatal').click(); await tunggu(100);
      f('lb67', 'saklar').click(); await tunggu(500);
      ok('saklar "Libur setiap Minggu": mengirim kalender_simpan {libur_minggu: false}', terakhir('kalender_simpan').libur_minggu === false);
      f('lb67', 'tambah').click(); await tunggu(150);
      ok('"+ Libur khusus" membuka dialog dengan pilihan tanggal (tidak bisa sebelum hari ini)', /Ubah libur/.test(el('dialog').textContent) && el('kalTgl').min === '2026-10-07');
      el('dlgBatal').click(); await tunggu(100);
    }
    if (K === 'toko2' || K === 'toko') {
      el('btnMasuk').click(); await tunggu(2200);
      document.querySelector('#lb08 [data-lb-kembali="utama"]').click(); await tunggu(900);
    }
    if (K === 'toko2') {
      var kt = document.querySelector('.kartu-tidak-masuk'), kn = kt.querySelector('.tm-nama');
      var anak = Array.prototype.slice.call(kn.children), batas = kn.getBoundingClientRect().top + 68 + 1;
      ok('14 nama: judul "(14)"; nama dibatasi DUA baris (tinggi maksimal 68 px) dan sisanya jadi chip "+N lainnya"', /Hari ini tidak masuk \(14\)/.test(teks(kt)) && anak.length >= 2 && /^\+\d+ lainnya$/.test(anak[anak.length - 1].textContent) && anak.every(function (c) { return c.getBoundingClientRect().bottom <= batas; }));
      var tampilN = anak.length - 1, sisaN = Number(/^\+(\d+)/.exec(anak[anak.length - 1].textContent)[1]);
      ok('jumlah nama yang tampil + angka "+N lainnya" = 14 (tidak ada nama hilang)', tampilN + sisaN === 14 && tampilN > 0);
    }
    if (K === 'toko') {
      var kartuT = document.querySelector('.kartu-tidak-masuk');
      ok('layar utama memanggil tidak_masuk_hari_ini dengan token HP toko (cabang dari server, bukan kiriman HP)', jumlah('tidak_masuk_hari_ini') >= 1 && !!terakhir('tidak_masuk_hari_ini').token && terakhir('tidak_masuk_hari_ini').cabang === undefined);
      ok('kartu "Hari ini tidak masuk (2)" menampilkan nama panggilan tanpa jenis izin; "Ketuk untuk lihat semua" dipudarkan (tidak ada tampilan daftar di mockup)', /Hari ini tidak masuk \(2\)/.test(teks(kartuT)) && /Siti/.test(teks(kartuT)) && /Budi/.test(teks(kartuT)) && !/Sakit|Cuti|izin/i.test(teks(kartuT).replace(/Hari ini tidak masuk/, '')) && kartuT.disabled);
    }
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
  function lbF41(nama) { return f('lb41', nama); }
})();
