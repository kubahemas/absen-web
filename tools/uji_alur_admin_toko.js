// Uji server TIRUAN: admin di HP toko — beranda (mockup 49), segarkan, menu, Karyawan (58), tambah karyawan (60, 61, 63).
// Pakai: PRA="$(cat tools/pra_toko.js)" ID="" tools/potret.sh app "" hasil.png tools/uji_alur_admin_toko.js
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function hitung(aksi) { return window.__panggilan.filter(function (x) { return x.aksi === aksi; }).length; }
(async function () {
  try {
    el('btnAdmin').click(); el('admUsername').value = 'Dewi Lestari'; el('admPassword').value = 'rahasia12';
    el('btnMasukAdmin').click(); await tunggu(700);
    ok('beranda admin terbuka', aktif() === 'layarAdmin');
    var p = window.__panggilan.filter(function (x) { return x.aksi === 'beranda_hari_ini'; })[0];
    ok('beranda memanggil beranda_hari_ini dengan token HP toko + sesi admin (tanpa cabang dari client)', !!p && p.token === 'T'.repeat(40) && p.sesi === 'S'.repeat(40) && p.cabang === undefined);
    ok('subjudul tanggal dan jam dari server: "Senin, 28 September 2026 \u00b7 08:20"', el('admTanggal').textContent === 'Senin, 28 September 2026 \u00b7 08:20');
    ok("satu kartu angka dengan dropdown Shift (Semua shift, Shift 1, Shift 2); tanpa kartu yang digeser", el("admShiftPilih").options.length === 3 && el("admShiftPilih").options[0].textContent === "Semua shift" && !el("admKartu"));
    var n4 = el("admAngka").querySelectorAll(".n"), l4 = el("admAngka").querySelectorAll(".l");
    ok("angka Semua shift: 8 Tepat waktu, 2 Telat, 4 Belum absen, 1 Izin/cuti (label \"Tepat waktu\", bukan \"Hadir\")", l4[0].textContent === "Tepat waktu" && n4[0].textContent === "8" && n4[1].textContent === "2" && n4[2].textContent === "4" && n4[3].textContent === "1");
    ok("daftar Belum absen awal = semua shift, 4 nama urut abjad dengan jadwal, tanpa tombol Lihat semua (4 <= 5)", /Belum absen \(semua shift\)/.test(el("admBelum").textContent) && el("admBelum").querySelectorAll(".b").length === 4 && el("admBelum").querySelector(".nm").textContent === "Ani Yulia" && !el("admBelum").querySelector("[data-belum]"));
    var nSebelum = hitung("beranda_hari_ini");
    el("admShiftPilih").value = "1"; el("admShiftPilih").dispatchEvent(new Event("change")); await tunggu(100);
    ok("pilih Shift 1: empat angka dan daftar mengikuti pilihan (tanpa memanggil server lagi)", /Belum absen \(shift 1\)/.test(el("admBelum").textContent) && /Joko Susilo/.test(el("admBelum").textContent) && el("admAngka").querySelectorAll(".n")[2].textContent === "1" && hitung("beranda_hari_ini") === nSebelum);
    ok("\"Perlu evaluasi (BAD)\" tampil NONAKTIF persis mockup: tombol mati, tulisan Segera, tanpa angka", !!document.querySelector("#layarAdmin .btn-evaluasi[disabled]") && /Perlu evaluasi \(BAD\)/.test(el("layarAdmin").textContent) && !/orang/.test(document.querySelector("#layarAdmin .btn-evaluasi").textContent));
    ok('kotak Menunggu konfirmasi tampil dengan angka', /Menunggu konfirmasi/.test(el('btnAdminKonf').textContent) && el('admKonfJumlah').textContent === '3');
    ok('ikon segarkan ada di beranda admin', !!el('btnSegarkanAdmin'));
    var n0 = hitung('beranda_hari_ini');
    el('btnSegarkanAdmin').click();
    ok('segarkan: tombol berputar dan nonaktif selama memuat', el('btnSegarkanAdmin').disabled && el('btnSegarkanAdmin').classList.contains('memuat'));
    await tunggu(400);
    ok('segarkan: memanggil ulang server dan tombol aktif kembali', hitung('beranda_hari_ini') === n0 + 1 && !el('btnSegarkanAdmin').disabled && !el('btnSegarkanAdmin').classList.contains('memuat'));
    // menu dan Log out
    el('btnMenuAdmin').click(); await tunggu(150);
    el('btnMenuAdminLogout').click(); await tunggu(150);
    ok('dialog Log out memakai ikon lingkaran hitam (mockup 51)', !!document.querySelector('#dialog .dialog-ikon') && /Log out\?/.test(el('dialog').textContent));
    el('dlgBatal').click(); await tunggu(100);
    // Karyawan
    el('btnMenuAdmin').click(); await tunggu(150);
    el('btnMenuKaryawan').click(); await tunggu(700);
    ok('layar Karyawan terbuka, subjudul "Cabang Ngawi \u00b7 6 aktif" (4 karyawan + 2 admin)', aktif() === 'layarKaryawan' && el('kryNama').textContent === 'Cabang Ngawi \u00b7 6 aktif');
    var baris = el('daftarKaryawanAdmin').querySelectorAll('.baris-kry');
    ok('satu daftar urut abjad: 6 aktif (karyawan dan admin bercampur) lalu 1 nonaktif berlabel "Nonaktif"', baris.length === 7 && /Nonaktif/.test(baris[6].textContent) && /Karyawan/.test(baris[0].textContent) && /Admin/.test(baris[2].textContent) && /Dewi Lestari/.test(baris[2].textContent));
    ok('baris Admin HANYA BACA: tanpa ketuk (tidak ada data-kry), tanpa tombol; mengetuknya tidak membuka apa pun', baris[2].classList.contains('baca') && !baris[2].hasAttribute('data-kry') && baris[5].classList.contains('baca') && baris[2].querySelectorAll('button').length === 0);
    baris[2].click(); await tunggu(100);
    ok('mengetuk baris Admin tidak membuka sheet aksi', !el('dialog').classList.contains('tampil'));
    ok('tidak ada pemilih Aktif/Nonaktif lagi', !el('segmenKaryawan'));
    baris[0].click(); await tunggu(100);
    ok('mengetuk baris membuka sheet aksi: Reset PIN, Nonaktifkan, dan Ubah data/Daftar wajah "Segera" nonaktif, Pola shift AKTIF', /Reset PIN/.test(el('dialog').textContent) && /Nonaktifkan/.test(el('dialog').textContent) && el('dialog').querySelectorAll('.btn-nonaktif-segera[disabled]').length === 2 && !!el('dialog').querySelector('[data-lb-ke="lb59"]'));
    el('dialog').querySelector('[data-sh="tutup"]').click(); await tunggu(100);
    baris[6].click(); await tunggu(100);
    ok('baris nonaktif: sheet menawarkan "Aktifkan kembali", tanpa Reset PIN', /Aktifkan kembali/.test(el('dialog').textContent) && !/Reset PIN/.test(el('dialog').textContent));
    el('dialog').querySelector('[data-sh="tutup"]').click(); await tunggu(100);
    // Tambah karyawan
    el('btnTambahKaryawan').click(); await tunggu(150);
    ok('baris info langkah 1 persis mockup 60 dengan nilai dari server', el('infoTambahKry').textContent === 'ID otomatis: K005 \u00b7 Cabang: Ngawi \u00b7 Jatah cuti: 6 hari \u00b7 Role: Karyawan');
    ok('langkah 1 dari 4 tampil dengan dropdown shift (satu shift pun tampil)', aktif() === 'layarTambahKaryawan' && /Langkah 1 dari 4/.test(el('layarTambahKaryawan').textContent) && el('bidangShift').style.display !== 'none');
    el('kNama').value = 'Wulan Sari'; el('kPanggilan').value = 'Wulan'; el('kMulai').value = '2026-10-01';
    el('btnLanjutPin').click(); await tunggu(150);
    ok('langkah 2 dari 4: persetujuan wajah = Segera (nonaktif), PIN 5 titik', aktif() === 'layarPinBaru' && /Langkah 2 dari 4/.test(el('layarPinBaru').textContent) && el('pinBaruSetuju').querySelector('button').disabled && el('pinBaruTitik').children.length === 5);
    var kp = el('pinBaruKeypad');
    '1234512345'.split('').forEach(function (d) { kp.querySelector('[data-d="' + d + '"]').click(); });
    await tunggu(500);
    var tb = window.__panggilan.filter(function (x) { return x.aksi === 'karyawan_tambah'; })[0];
    ok('PIN dua kali sama: data + PIN dikirim dalam SATU permintaan', !!tb && tb.nama === 'Wulan Sari' && tb.panggilan === 'Wulan' && tb.pin === '12345');
    ok('langkah 4 dari 4 (Selesai): nama dan ID K005, akun HP pribadi (login PIN), uji wajah dan WA = Segera', aktif() === 'layarSelesaiKaryawan' && /Wulan Sari \u00b7 K005/.test(el('selesaiSub').textContent) && /Langkah 4 dari 4/.test(el('layarSelesaiKaryawan').textContent) && !/123456/.test(el('layarSelesaiKaryawan').textContent) && el('layarSelesaiKaryawan').querySelectorAll('button[disabled]').length === 2);
    el('btnSelesaiKaryawan').click(); await tunggu(100);
    ok('tombol Selesai kembali ke daftar Karyawan', aktif() === 'layarKaryawan');
    el('daftarKaryawanAdmin').querySelectorAll('.baris-kry')[0].click(); await tunggu(100);
    el('dialog').querySelector('[data-sh="reset"]').click(); await tunggu(150);
    ok('Reset PIN memakai layar PIN tanpa bilah langkah dan tanpa persetujuan wajah', aktif() === 'layarPinBaru' && el('pinBaruBilah').style.display === 'none' && el('pinBaruSetuju').style.display === 'none' && /Batal/.test(el('pinBaruBatal').textContent));
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
