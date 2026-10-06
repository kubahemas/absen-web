// Uji server TIRUAN: menu Edit di Konfirmasi (admin HP pribadi): penanda area toko, form edit, validasi, pesan galat ramah.
window.__hasil = [];
var H = window.__hasil, panggilan = [];
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var item = function (id, kel, jenis, nama, o) { return Object.assign({ id: id, jenis: jenis, kelompok: kel, karyawan: id.split('|')[0], nama: nama, cabang: 'Ngawi', tanggal: '2026-10-06', shift: '1', jam: '08:05', status: '', ket: 'LUAR: Pasang AC lama', ket_edit: 'Pasang AC lama', tingkat: 0, durasi_menit: 0, gps: '-7.4,111.4,12', akurasi: 12, akurasi_buruk: false, maps: 'https://www.google.com/maps?q=-7.4,111.4', foto: 'ADA', luar: true, dalam_area_toko: false, role: 'KARYAWAN' }, o || {}); };
var sisa = [item('K001|2026-10-06|MASUK', 'LUAR', 'MASUK', 'Dewi Lestari', { dalam_area_toko: true }), item('K002|2026-10-05|PULANG', 'LEMBUR', 'PULANG', 'Budi Santoso', { luar: false, ket: 'Stok opname', ket_edit: '', gps: '' })];
var balasanEdit = { status: 'gagal', pesan: 'Aksi tidak dikenal: konfirmasi_edit (Exception: salah di baris 77)' };
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggilan.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K009', nama: 'Dewi Lestari', panggilan: 'Dewi', role: 'ADMIN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: sisa.length, jumlah_teks: String(sisa.length) }; }
  if (b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: sisa.slice(), total: sisa.length, jumlah_teks: String(sisa.length), ada_lagi: false }; }
  if (b.aksi === 'konfirmasi_edit') { d = balasanEdit; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
(async function () {
  try {
    el('btnJenisPribadi').click(); await tunggu(100);
    el('btnModeLogin').click(); el('pribNama').value = 'Dewi Lestari'; el('pribRahasia').value = 'rahasia12';
    el('btnMasukPribadi').click(); await tunggu(700);
    el('btnPribMenuAdmin').click(); await tunggu(200);
    document.querySelector('#menuPribadiIsi button[data-menu="konfirmasi"]').click(); await tunggu(600);
    var kartu = el('daftarKonfirmasi').querySelectorAll('.kartu-konf');
    ok('2 kartu tampil', kartu.length === 2);
    ok('penanda "Lokasi di dalam area toko" tampil hanya pada pengajuan yang ditandai server', /Lokasi di dalam area toko/.test(kartu[0].textContent) && !/Lokasi di dalam area toko/.test(kartu[1].textContent));
    ok('menu Edit hanya pada pengajuan absen luar (lembur HP toko tidak punya)', !!kartu[0].querySelector('.konf-edit') && !kartu[1].querySelector('.konf-edit'));
    kartu[0].querySelector('.konf-edit').click(); await tunggu(100);
    var form = kartu[0].querySelector('.konf-form');
    ok('form edit: jam dan keterangan terisi dari pengajuan; ACC/Tolak disembunyikan selama edit', !!form && form.querySelector('.konf-jam').value === '08:05' && form.querySelector('.konf-ket-edit').value === 'Pasang AC lama' && kartu[0].querySelector('.konf-aksi').style.display === 'none');
    ok('hanya jam dan keterangan yang bisa diubah (tidak ada pilihan jenis)', form.querySelectorAll('input, textarea, select').length === 2);
    form.querySelector('.konf-ket-edit').value = 'abc'; form.querySelector('[data-konf="simpan-edit"]').click(); await tunggu(100);
    ok('keterangan 3 huruf ditolak di HP tanpa memanggil server', /minimal 5 karakter/.test(form.querySelector('.konf-form-pesan').textContent) && !panggilan.some(function (x) { return x.aksi === 'konfirmasi_edit'; }));
    form.querySelector('.konf-ket-edit').value = 'Pasang AC rumah Bu Sri'; form.querySelector('.konf-jam').value = '07:44';
    form.querySelector('[data-konf="simpan-edit"]').click(); await tunggu(400);
    var pe = panggilan.filter(function (x) { return x.aksi === 'konfirmasi_edit'; })[0];
    ok('simpan mengirim id, jam, keterangan dengan sesi admin HP pribadi', !!pe && pe.id === 'K001|2026-10-06|MASUK' && pe.jam === '07:44' && pe.keterangan === 'Pasang AC rumah Bu Sri' && pe.sesi === 'S'.repeat(40) && !pe.token);
    ok('balasan teknis server tidak tampil mentah; diganti pesan Indonesia', /Perubahan belum bisa disimpan/.test(form.querySelector('.konf-form-pesan').textContent) && !/Exception|konfirmasi_edit/.test(form.querySelector('.konf-form-pesan').textContent));
    balasanEdit = { status: 'gagal', pesan: 'Pengajuan yang sudah diputuskan (di-ACC atau ditolak) tidak bisa diedit' };
    form.querySelector('[data-konf="simpan-edit"]').click(); await tunggu(400);
    ok('pesan penolakan Indonesia dari server (sudah di-ACC) ditampilkan apa adanya', /sudah diputuskan/.test(form.querySelector('.konf-form-pesan').textContent));
    form.querySelector('[data-konf="batal-edit"]').click(); await tunggu(50);
    ok('Batal menutup form dan mengembalikan ACC/Tolak', !kartu[0].querySelector('.konf-form') && kartu[0].querySelector('.konf-aksi').style.display !== 'none');
    kartu[0].querySelector('.konf-edit').click(); await tunggu(50);
    balasanEdit = { status: 'ok', pesan: 'Pengajuan diperbarui dan tetap menunggu ACC' };
    kartu[0].querySelector('.konf-ket-edit').value = 'Pasang AC rumah Bu Sri'; kartu[0].querySelector('[data-konf="simpan-edit"]').click(); await tunggu(700);
    ok('berhasil: daftar dimuat ulang dan pengajuan tetap tampil (menunggu ACC)', panggilan.filter(function (x) { return x.aksi === 'konfirmasi_daftar'; }).length >= 2 && el('daftarKonfirmasi').querySelectorAll('.kartu-konf').length === 2 && /Masih menunggu ACC/.test(el('konfPesan').textContent));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
