// Skrip uji (server TIRUAN, tidak menulis ke sheet): Fitur B jadwal dan shift (02, 55, 56, 57), tukar shift (42, 43) dan tukar shift di Konfirmasi.
// Konteks lewat window.__KONTEKS = 'admin' | 'karyawan' | 'toko' (baris pertama berkas salinan). 'toko' butuh PRA tools/pra_toko.js. Pakai BUDGET=90000.
window.__hasil = [];
var H = window.__hasil, panggil = [];
var K = window.__KONTEKS || 'admin';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function f(id, nama) { return document.querySelector('#' + id + ' [data-f="' + nama + '"]'); }
function teks(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function ubah(e, nilai) { e.value = nilai; e.dispatchEvent(new Event('change', { bubbles: true })); }
function terakhir(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }).pop(); }
function jumlah(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }).length; }
function tambahHari(t, n) { var p = t.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); }
function seninDari(t) { var p = t.split('-').map(Number); var h = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); return tambahHari(t, -((h + 6) % 7)); }
var SHIFT = [{ no: 1, nama: 'Shift 1', masuk: '07:45', pulang: '16:30' }, { no: 2, nama: 'Shift 2', masuk: '12:00', pulang: '20:30' }];
var HARI_INI = '2026-10-07';
function minggu(mulai) {
  var s = seninDari(mulai || HARI_INI);
  var baris = function (id, nama, pola, manualIdx) {
    return { id: id, nama: nama, panggilan: nama.split(' ')[0], role: id === 'K009' ? 'ADMIN' : 'KARYAWAN', sel: [0, 1, 2, 3, 4, 5].map(function (i) { var m = i === manualIdx; return { t: tambahHari(s, i), s: m ? 2 : pola, l: false, m: m }; }) };
  };
  return { status: 'ok', cabang: 'Ngawi', senin: s, hari_ini: HARI_INI, aktor: 'K009', shift: SHIFT, daftar: [baris('K003', 'Budi Santoso', 1, 4), baris('K004', 'Dina Marlina', 2, -1), baris('K009', 'Dewi Lestari', 1, -1)] };
}
var konfTukar = [{ id: 'TUKAR|IZN-2026-0014', jenis: 'TUKAR', kelompok: 'TUKAR', karyawan: 'K004', nama: 'Dina ⇄ Ari', cabang: 'Ngawi', tanggal: '2026-10-06', jam: '', shift: '', judul: 'Tukar shift · rekan setuju', rincian: 'Sel 6 Okt · Dina → Shift 1, Ari → Shift 2', ket: '', surat: false, sakit: false, telat_aju: false, role: 'KARYAWAN' }];
var tukarMasukMock = [{ id: 'IZN-2026-0020-A', dari: 'Dina Marlina', dari_panggilan: 'Dina', tanggal: '2026-10-13', hari: 'Selasa', tanggal_pendek: 'Sel 13 Okt', jenis: 'TUKAR_SHIFT', shift_saya_jadi: 2, jam_shift: '12:00', alasan: 'Antar ibu ke dokter pagi' }];
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggil.push(b);
  var d = { status: 'gagal', pesan: 'tidak ditiru' };
  if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: K === 'admin' ? 'K009' : 'K003', nama: K === 'admin' ? 'Dewi Lestari' : 'Budi Santoso', panggilan: 'Budi', role: K === 'admin' ? 'ADMIN' : 'KARYAWAN', cabang: 'Ngawi' }; }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false, izin_menunggu: 1, tukar_masuk: tukarMasukMock.length }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: konfTukar.length, jumlah_teks: String(konfTukar.length) }; }
  if (b.aksi === 'konfirmasi_daftar') { d = { status: 'ok', daftar: konfTukar.slice(), total: konfTukar.length, jumlah_teks: String(konfTukar.length), ada_lagi: false }; }
  if (b.aksi === 'konfirmasi_putuskan') { konfTukar = konfTukar.filter(function (x) { return x.id !== b.id; }); d = { status: 'ok', keputusan: 'DITERIMA' }; }
  if (b.aksi === 'jadwal_hari_ini') { d = { status: 'ok', tanggal: HARI_INI, jam: '09:00', shift: [{ no: 1, nama: 'Shift 1', masuk: '07:45', pulang: '16:30', aktif: true, karyawan: ['Ahmad', 'Budi', 'Rina', 'Siti'] }, { no: 2, nama: 'Shift 2', masuk: '12:00', pulang: '20:30', aktif: false, karyawan: ['Ari', 'Dina'] }] }; }
  if (b.aksi === 'jadwal_baca') { d = minggu(b.mulai); }
  if (b.aksi === 'jadwal_simpan') { d = { status: 'ok', berubah: b.perubahan.length }; }
  if (b.aksi === 'jadwal_salin') { d = { status: 'ok', berubah: 3 }; }
  if (b.aksi === 'jadwal_hari') { d = { status: 'ok', hari_ini: HARI_INI, daftar: [{ id: 'K003', nama: 'Budi Santoso', panggilan: 'Budi', shift: 1 }, { id: 'K004', nama: 'Dina Marlina', panggilan: 'Dina', shift: 2 }, { id: 'K005', nama: 'Ari Pratama', panggilan: 'Ari', shift: 1 }] }; }
  if (b.aksi === 'izin_input_info') { d = { status: 'ok', hari_ini: HARI_INI, jenis: [] }; }
  if (b.aksi === 'izin_info') { d = { status: 'ok', hari_ini: HARI_INI, jenis: [], jatah: 6, sisa_cuti: 4, batas_lewat_hari: 2, role: 'KARYAWAN' }; }
  if (b.aksi === 'jadwal_tukar') { d = { status: 'ok', a_ke: 1, b_ke: 2 }; }
  if (b.aksi === 'pola_baca') { d = { status: 'ok', id: 'K003', nama: 'Budi Santoso', hari_ini: HARI_INI, senin: '2026-10-05', shift: SHIFT, pola_shift: 'BERGILIR', urutan: [1, 2], shift_bawaan: 1, ganti_setiap: '1M', mulai_pola: '2026-10-05' }; }
  if (b.aksi === 'pola_pratinjau') {
    var u = (b.urutan && b.urutan.length) ? b.urutan : [1, 2];
    d = { status: 'ok', bisa: true, pesan: '', minggu: [0, 1, 2, 3].map(function (i) { return { mulai: tambahHari('2026-10-05', i * 7), selesai: tambahHari('2026-10-05', i * 7 + 5), shift: b.pola_shift === 'TETAP' ? 1 : u[i % u.length] }; }) };
  }
  if (b.aksi === 'pola_simpan') { d = { status: 'ok' }; }
  if (b.aksi === 'tukar_rekan') { d = { status: 'ok', hari_ini: HARI_INI, saya: 2, boleh: true, daftar: [{ id: 'K005', nama: 'Ari Pratama', panggilan: 'Ari', shift: 1 }] }; }
  if (b.aksi === 'tukar_pratinjau') { d = b.rekan === 'K005' ? { status: 'ok', bisa: true, pesan: '', hari: 'Sel 13 Okt', saya_ke: 1, rekan_ke: b.jenis === 'TUKAR_SHIFT' ? 2 : null, rekan_nama: 'Ari' } : { status: 'ok', bisa: false, pesan: 'Pilih rekan' }; }
  if (b.aksi === 'tukar_ajukan') { d = { status: 'ok', grup: 'IZN-2026-0021' }; }
  if (b.aksi === 'tukar_masuk') { d = { status: 'ok', daftar: tukarMasukMock.slice() }; }
  if (b.aksi === 'tukar_jawab') { tukarMasukMock = []; d = { status: 'ok' }; }
  return Promise.resolve({ json: function () { return Promise.resolve(d); } });
};
async function masukPribadi(nama) {
  el('btnJenisPribadi').click(); await tunggu(100);
  el('pribNama').value = nama; el('pribRahasia').value = K === 'admin' ? 'rahasia12' : '12345'; el('btnMasukPribadi').click(); await tunggu(800);
}
async function dariMenuAdmin(nama) {
  el('btnMenuPribadi').click(); await tunggu(150);
  Array.prototype.filter.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0].click(); await tunggu(600);
}
(async function () {
  try {
    if (K === 'toko') {
      await tunggu(300);
      document.querySelector('.label-shift').click(); await tunggu(700);
      ok('label "Shift 1 aktif" membuka jadwal hari ini (02); memanggil jadwal_hari_ini dengan token HP toko', aktif() === 'lb02' && !!terakhir('jadwal_hari_ini') && terakhir('jadwal_hari_ini').token === 'T'.repeat(40));
      var blok = document.querySelectorAll('#lb02 [data-gen="1"]');
      ok('dua blok shift dari server: "Shift 1 · aktif" 07:45 – 16:30 dan "Shift 2" 12:00 – 20:30', blok.length === 2 && teks(blok[0]).indexOf('Shift 1 · aktif') === 0 && /07:45 – 16:30/.test(teks(blok[0])) && teks(blok[1]).indexOf('Shift 2') === 0 && teks(blok[1]).indexOf('aktif') < 0 && /12:00 – 20:30/.test(teks(blok[1])));
      ok('nama panggilan karyawan terjadwal tampil per shift (Ahmad, Budi, Rina, Siti / Ari, Dina)', /Ahmad.*Budi.*Rina.*Siti/.test(teks(blok[0])) && /Ari.*Dina/.test(teks(blok[1])));
      ok('catatan "Status absen dihitung dari shift masing-masing karyawan." tetap tampil; tombol Tutup berfungsi', /Status absen dihitung dari shift masing-masing karyawan/.test(teks(document.getElementById('lb02'))) && !!document.querySelector('#lb02 [data-lb-kembali]'));
      document.querySelector('#lb02 [data-lb-kembali]').click(); await tunggu(200);
      ok('Tutup kembali ke layar utama', aktif() === 'layarUtama');
      document.querySelector('.label-shift').click(); await tunggu(600);
      ok('dibuka lagi: blok tidak menumpuk (tetap 2)', document.querySelectorAll('#lb02 [data-gen="1"]').length === 2);
    }
    if (K === 'admin') {
      await masukPribadi('Dewi Lestari');
      // ---- jadwal mingguan (55) ----
      await dariMenuAdmin('Jadwal shift');
      ok('Jadwal shift (55) terbuka dan memanggil jadwal_baca dengan sesi admin', aktif() === 'lb55' && jumlah('jadwal_baca') === 1 && terakhir('jadwal_baca').sesi === 'S'.repeat(40));
      ok('judul minggu "Minggu ini, 5 Okt – 10 Okt"; badge "Admin Ngawi"', teks(f('lb55', 'sub')) === 'Minggu ini, 5 Okt – 10 Okt' && /Admin Ngawi/.test(teks(document.getElementById('lb55'))));
      var sel = document.querySelectorAll('#lb55 button[data-sel]');
      ok('tiga karyawan x 6 hari = 18 sel; legenda "Shift 1 (07:45)", "Shift 2 (12:00)", "Libur"', sel.length === 18 && /Shift 1 \(07:45\)/.test(teks(f('lb55', 'legenda'))) && /Shift 2 \(12:00\)/.test(teks(f('lb55', 'legenda'))) && /Libur/.test(teks(f('lb55', 'legenda'))));
      var s7 = document.querySelector('#lb55 [data-sel="K003|2026-10-07"]'), s5 = document.querySelector('#lb55 [data-sel="K003|2026-10-05"]'), sAdmin = document.querySelector('#lb55 [data-sel="K009|2026-10-08"]');
      ok('tanggal lewat (5 Okt) dan baris admin sendiri tidak bisa diubah; Simpan nonaktif sebelum ada perubahan', s5.getAttribute('aria-disabled') === 'true' && sAdmin.getAttribute('aria-disabled') === 'true' && f('lb55', 'simpan').disabled);
      ok('sel perubahan manual (K003 Jumat = 2) bertanda cincin hijau', document.querySelector('#lb55 [data-sel="K003|2026-10-09"]').style.boxShadow.indexOf('--hijau') >= 0 && document.querySelector('#lb55 [data-sel="K003|2026-10-09"]').textContent === '2');
      s7.click(); await tunggu(100);
      ok('ketuk sel: Shift 1 → 2 (berbingkai hijau karena belum disimpan); Simpan aktif', document.querySelector('#lb55 [data-sel="K003|2026-10-07"]').textContent === '2' && !f('lb55', 'simpan').disabled);
      document.querySelector('#lb55 [data-sel="K003|2026-10-07"]').click(); await tunggu(100);
      ok('ketuk lagi: 2 → L (libur)', document.querySelector('#lb55 [data-sel="K003|2026-10-07"]').textContent === 'L');
      document.querySelector('#lb55 [data-sel="K003|2026-10-07"]').click(); await tunggu(100);
      ok('ketuk lagi: L → kembali ke 1 = sama dengan semula, perubahan dibatalkan, Simpan nonaktif lagi', document.querySelector('#lb55 [data-sel="K003|2026-10-07"]').textContent === '1' && f('lb55', 'simpan').disabled);
      document.querySelector('#lb55 [data-sel="K004|2026-10-08"]').click(); await tunggu(100);
      f('lb55', 'simpan').click(); await tunggu(800);
      var js = terakhir('jadwal_simpan');
      ok('Simpan mengirim hanya sel yang berubah: K004 8 Okt = L, dengan sesi admin; dialog "Jadwal tersimpan"', js.perubahan.length === 1 && js.perubahan[0].karyawan === 'K004' && js.perubahan[0].tanggal === '2026-10-08' && js.perubahan[0].nilai === 'L' && js.sesi === 'S'.repeat(40) && /Jadwal tersimpan/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(300);
      f('lb55', 'depan').click(); await tunggu(600);
      ok('"Minggu depan" memuat minggu 12 Okt dari server: judul "Minggu depan, 12 Okt – 17 Okt"', terakhir('jadwal_baca').mulai === '2026-10-12' && teks(f('lb55', 'sub')) === 'Minggu depan, 12 Okt – 17 Okt');
      f('lb55', 'lalu').click(); await tunggu(600);
      f('lb55', 'salin').click(); await tunggu(200);
      ok('Salin minggu lalu meminta konfirmasi dulu', /Salin minggu lalu\?/.test(el('dialog').textContent) && jumlah('jadwal_salin') === 0);
      el('dlgYa').click(); await tunggu(700);
      ok('Salin: jadwal_salin dengan senin minggu ini; hasil "3 sel berubah"', terakhir('jadwal_salin').senin === '2026-10-05' && /3 sel berubah/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(300);
      // ---- tukar shift satu hari (56) ----
      ok('tombol "Tukar shift" ada di layar 55 dan aktif (mockup 55 tidak punya tombol ini; lihat daftar selisih)', !!f('lb55', 'tukar') && !f('lb55', 'tukar').disabled && f('lb55', 'tukar').getAttribute('data-lb-ke') === 'lb56');
      f('lb55', 'tukar').click(); await tunggu(800);
      ok('layar 56 terbuka; tanggal awal = hari ini dari server; karyawan terjadwal dimuat (jadwal_hari)', aktif() === 'lb56' && f('lb56', 'tanggal').value === HARI_INI && jumlah('jadwal_hari') >= 1 && f('lb56', 'k1').options.length === 4);
      ok('label "Karyawan 1" dan "Karyawan 2" dipulihkan; Tukar nonaktif sebelum memilih', teks(f('lb56', 'lab1')) === 'Karyawan 1' && teks(f('lb56', 'lab2')) === 'Karyawan 2' && f('lb56', 'tukar').disabled);
      ubah(f('lb56', 'k1'), 'K004'); ubah(f('lb56', 'k2'), 'K005'); await tunggu(150);
      ok('pratinjau: "7 Okt: Dina → Shift 1, Ari → Shift 2" + catatan "Besok kembali ke pola masing-masing."; Tukar aktif', teks(f('lb56', 'preview')).indexOf('7 Okt: Dina → Shift 1, Ari → Shift 2') === 0 && /Besok kembali ke pola masing-masing/.test(teks(f('lb56', 'preview'))) && !f('lb56', 'tukar').disabled);
      ubah(f('lb56', 'k1'), 'K003'); await tunggu(100);
      ok('shift yang sama: pesan merah dan Tukar nonaktif', /sudah di shift yang sama/.test(teks(f('lb56', 'preview'))) && f('lb56', 'tukar').disabled);
      ubah(f('lb56', 'k1'), 'K004'); await tunggu(100);
      f('lb56', 'tukar').click(); await tunggu(700);
      var jt = terakhir('jadwal_tukar');
      ok('Tukar mengirim jadwal_tukar {tanggal, k1, k2} dengan sesi admin; dialog "Shift ditukar"', jt.tanggal === HARI_INI && jt.k1 === 'K004' && jt.k2 === 'K005' && jt.sesi === 'S'.repeat(40) && /Shift ditukar/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(300);
      ok('OK kembali ke jadwal (55)', aktif() === 'lb55');
      // ---- pola shift (57), dibuka dari sheet karyawan ----
      var pb = document.createElement('button'); pb.setAttribute('data-lb-ke', 'lb57'); pb.setAttribute('data-pola-id', 'K003'); pb.id = 'ujiPola'; pb.textContent = 'Pola shift'; document.body.appendChild(pb);
      pb.click(); await tunggu(800);
      ok('Pola shift (57) terbuka untuk karyawan yang diketuk (pola_baca karyawan K003); subjudul "Budi Santoso · K003"', aktif() === 'lb57' && terakhir('pola_baca').karyawan === 'K003' && teks(f('lb57', 'sub')) === 'Budi Santoso · K003');
      var chips = document.querySelectorAll('#lb57 [data-chip]');
      ok('Bergilir terpilih; urutan "Shift 1 · 07:45 → Shift 2 · 12:00"; ganti setiap 1 minggu; mulai 2026-10-05', chips.length === 2 && teks(chips[0]) === 'Shift 1 · 07:45' && teks(chips[1]) === 'Shift 2 · 12:00' && document.getElementById('lb57_gs').value === '1M' && document.getElementById('lb57_ms').value === '2026-10-05' && f('lb57', 'segBergilir').style.background.indexOf('--hitam') >= 0);
      ok('pratinjau 4 minggu dari server: 5–10 Okt Shift 1, 12–17 Okt Shift 2, 19–24 Okt Shift 1, 26–31 Okt Shift 2', Array.prototype.map.call(f('lb57', 'pratinjau').querySelectorAll('[data-gen="1"]'), function (r) { return teks(r); }).join('|') === '5–10 OktShift 1|12–17 OktShift 2|19–24 OktShift 1|26–31 OktShift 2');
      f('lb57', 'tambahShift').click(); await tunggu(500);
      ok('"+ Shift" menambah shift ketiga ke urutan (Shift 1 lagi) dan pratinjau diminta ulang dengan urutan [1,2,1]', document.querySelectorAll('#lb57 [data-chip]').length === 3 && JSON.stringify(terakhir('pola_pratinjau').urutan) === '[1,2,1]');
      document.querySelectorAll('#lb57 [data-chip]')[2].click(); await tunggu(300);
      document.querySelectorAll('#lb57 [data-chip]')[2].click(); await tunggu(300);
      ok('ketuk chip ganti shift, setelah shift terakhir ketuk lagi = hapus (kembali 2 shift)', document.querySelectorAll('#lb57 [data-chip]').length === 2);
      ubah(document.getElementById('lb57_gs'), '2M'); await tunggu(400);
      f('lb57', 'simpan').click(); await tunggu(700);
      var ps = terakhir('pola_simpan');
      ok('Simpan: pola_simpan {karyawan K003, BERGILIR, urutan [1,2], ganti 2M, mulai 2026-10-05} dengan sesi admin; dialog "Pola tersimpan"', ps.karyawan === 'K003' && ps.pola_shift === 'BERGILIR' && JSON.stringify(ps.urutan) === '[1,2]' && ps.ganti_setiap === '2M' && ps.mulai_pola === '2026-10-05' && ps.sesi === 'S'.repeat(40) && /Pola tersimpan/.test(el('dialog').textContent) && /Perubahan manual di jadwal tetap menang/.test(teks(document.getElementById('lb57'))));
      el('dlgOk').click(); await tunggu(300);
      pb.remove();
      // ---- Konfirmasi tukar shift ----
      el('btnPribMenuAdmin').click(); await tunggu(800);
      var kartu = el('daftarKonfirmasi').querySelectorAll('.kartu-konf');
      ok('Konfirmasi memuat kartu tukar: "Tukar shift · rekan setuju", "Dina ⇄ Ari", "Sel 6 Okt · Dina → Shift 1, Ari → Shift 2", hanya ACC dan Tolak', aktif() === 'layarKonfirmasi' && kartu.length === 1 && /Tukar shift · rekan setuju/.test(kartu[0].textContent) && /Dina ⇄ Ari/.test(kartu[0].textContent) && /Sel 6 Okt · Dina → Shift 1, Ari → Shift 2/.test(kartu[0].textContent) && !kartu[0].querySelector('.konf-foto') && !kartu[0].querySelector('.konf-edit'));
      kartu[0].querySelector('.tolak').click(); await tunggu(200);
      ok('Tolak tukar meminta konfirmasi "Tolak tukar shift ini?"', /Tolak tukar shift ini\?/.test(el('dialog').textContent));
      el('dlgBatal').click(); await tunggu(100);
      kartu[0].querySelector('.acc').click(); await tunggu(700);
      var pu = terakhir('konfirmasi_putuskan');
      ok('ACC tukar: konfirmasi_putuskan id TUKAR|IZN-2026-0014 ACC dengan sesi admin; pesan "Tukar shift diterima."; kartu hilang', pu.id === 'TUKAR|IZN-2026-0014' && pu.keputusan === 'ACC' && pu.sesi === 'S'.repeat(40) && /Tukar shift diterima/.test(el('konfPesan').textContent) && el('daftarKonfirmasi').querySelectorAll('.kartu-konf').length === 0);
    }
    if (K === 'karyawan') {
      await masukPribadi('Budi Santoso');
      ok('beranda: ajakan tukar yang menunggu jawaban membuka layar 43 sendiri (tukar_masuk dari server)', aktif() === 'lb43' && jumlah('tukar_masuk') === 1);
      ok('layar 43: "Dina mengajak tukar shift", "Selasa, 13 Okt", "Anda → Shift 2 (12:00)", "Alasan: Antar ibu ke dokter pagi"', teks(f('lb43', 'judul')) === 'Dina mengajak tukar shift' && teks(f('lb43', 'waktu')) === 'Selasa, 13 OktAnda → Shift 2 (12:00)' && teks(f('lb43', 'alasan')) === 'Alasan: Antar ibu ke dokter pagi' && !f('lb43', 'setuju').disabled && !f('lb43', 'tolak').disabled);
      f('lb43', 'setuju').click(); await tunggu(700);
      var tj = terakhir('tukar_jawab');
      ok('Setuju: tukar_jawab {id, jawab SETUJU} dengan sesi karyawan; kembali ke beranda', tj.id === 'IZN-2026-0020-A' && tj.jawab === 'SETUJU' && tj.sesi === 'S'.repeat(40) && aktif() === 'layarPribadi');
      // ---- ajukan tukar shift (42) ----
      el('btnPribTukar').click(); await tunggu(900);
      ok('Tukar shift (42) terbuka dari tombol beranda; tanggal = hari ini dari server; rekan dimuat dari server (tukar_rekan)', aktif() === 'lb42' && f('lb42', 'tanggal').value === HARI_INI && !!terakhir('tukar_rekan') && f('lb42', 'rekan').options.length === 2);
      ok('pilihan rekan "Ari (Shift 1)"; kirim nonaktif sebelum memilih rekan', teks(f('lb42', 'rekan').options[1]) === 'Ari (Shift 1)' && f('lb42', 'kirim').disabled);
      ubah(f('lb42', 'tanggal'), '2026-10-13'); await tunggu(400);
      ubah(f('lb42', 'rekan'), 'K005'); await tunggu(600);
      ok('pratinjau dari server: "13 Okt: Anda → Shift 1, Ari → Shift 2"; Kirim aktif', teks(kotak42()) === '13 Okt: Anda → Shift 1, Ari → Shift 2' && !f('lb42', 'kirim').disabled);
      f('lb42', 'segPindah').click(); await tunggu(600);
      ok('"Pindah shift": pratinjau hanya "Anda → Shift 1"; permintaan memakai jenis PINDAH_SHIFT', teks(kotak42()) === '13 Okt: Anda → Shift 1' && terakhir('tukar_pratinjau').jenis === 'PINDAH_SHIFT');
      f('lb42', 'segTukar').click(); await tunggu(600);
      f('lb42', 'alasan').value = 'Antar ibu'; f('lb42', 'alasan').dispatchEvent(new Event('input', { bubbles: true }));
      f('lb42', 'kirim').click(); await tunggu(700);
      var ta = terakhir('tukar_ajukan');
      ok('Kirim: tukar_ajukan {jenis TUKAR_SHIFT, tanggal, rekan K005, alasan} dengan sesi; dialog "Ajakan terkirim"', ta.jenis === 'TUKAR_SHIFT' && ta.tanggal === '2026-10-13' && ta.rekan === 'K005' && ta.alasan === 'Antar ibu' && ta.sesi === 'S'.repeat(40) && /Ajakan terkirim/.test(el('dialog').textContent) && /ACC admin/.test(el('dialog').textContent));
      el('dlgOk').click(); await tunggu(300);
      ok('OK kembali ke beranda pribadi', aktif() === 'layarPribadi');
    }
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
  function kotak42() { return document.querySelector('#lb42 [data-gen="pr"]'); }
})();
