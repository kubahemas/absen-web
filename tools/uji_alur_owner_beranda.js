// Uji server TIRUAN: beranda owner (mockup 71), dropdown Cabang + Shift, Belum absen (5 + Lihat semua), Perlu evaluasi nonaktif, Telat 7 hari, menu (72).
// Pakai: PRA="$(cat tools/pra_owner.js)" ID="" tools/potret.sh app "" hasil.png tools/uji_alur_owner_beranda.js
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function hitung(aksi) { return window.__panggilan.filter(function (x) { return x.aksi === aksi; }).length; }
(async function () {
  try {
    el('btnJenisOwner').click(); await tunggu(100);
    el('ownUsername').value = 'owner'; el('ownPassword').value = 'rahasia123';
    el('btnMasukOwner').click(); await tunggu(800);
    ok('beranda owner terbuka', aktif() === 'layarOwner');
    var p = window.__panggilan.filter(function (x) { return x.aksi === 'beranda_hari_ini'; })[0];
    ok('beranda memakai aksi beranda_hari_ini (sesi owner, cabang kosong = semua)', !!p && p.sesi === 'O'.repeat(40) && p.cabang === '');
    ok('subjudul tanggal+jam dari server (bukan "Owner \u00b7 OWN01")', el('ownerSub').textContent === 'Senin, 28 September 2026 \u00b7 08:20');
    var opsiCab = Array.prototype.map.call(el('filterCabang').options, function (o) { return o.textContent; });
    ok('dropdown Cabang SELALU tampil: Semua cabang, Ngawi, Pusat', opsiCab.join('|') === 'Semua cabang|Ngawi|Pusat' && el('filterCabang').offsetParent !== null && /Semua isi beranda mengikuti pilihan ini/.test(el('layarOwner').textContent));
    ok('satu kartu angka dengan dropdown Shift (Semua shift, Shift 1, Shift 2)', el('ownShiftPilih').options.length === 3 && !el('ownKartu'));
    var l = el('ownAngka').querySelectorAll('.l'), n = el('ownAngka').querySelectorAll('.n');
    ok('label "Tepat waktu" (bukan Hadir); angka 18 / 3 / 7 / 3', l[0].textContent === 'Tepat waktu' && n[0].textContent === '18' && n[1].textContent === '3' && n[2].textContent === '7' && n[3].textContent === '3');
    ok('Belum absen: 5 nama pertama urut abjad + tombol "Lihat semua (7)"', el('ownBelum').querySelectorAll('.b').length === 5 && el('ownBelum').querySelector('.nm').textContent === 'Ani Yulia' && /Lihat semua \(7\)/.test(el('ownBelum').textContent));
    el('ownBelum').querySelector('[data-belum]').click(); await tunggu(100);
    ok('Lihat semua membuka layar daftar penuh (7 baris, memakai kelas layar Perlu perhatian)', aktif() === 'layarBelumAbsen' && el('belumDaftar').querySelectorAll('.baris-perhatian').length === 7 && el('belumDaftar').classList.contains('kartu-perhatian'));
    el('btnKembaliBelum').click(); await tunggu(100);
    ok('Kembali ke beranda owner', aktif() === 'layarOwner');
    var n0 = hitung('beranda_hari_ini');
    el('ownShiftPilih').value = '2'; el('ownShiftPilih').dispatchEvent(new Event('change')); await tunggu(100);
    ok('pilih Shift 2: angka dan daftar berubah TANPA memanggil server (tepat 3, belum 3)', el('ownAngka').querySelectorAll('.n')[0].textContent === '3' && el('ownAngka').querySelectorAll('.n')[2].textContent === '3' && /Belum absen \(shift 2\)/.test(el('ownBelum').textContent) && hitung('beranda_hari_ini') === n0 && !el('ownBelum').querySelector('[data-belum]'));
    el('filterCabang').value = 'Pusat'; el('filterCabang').dispatchEvent(new Event('change')); await tunggu(400);
    var pc = window.__panggilan.filter(function (x) { return x.aksi === 'beranda_hari_ini' && x.cabang === 'Pusat'; });
    ok('pilih Cabang Pusat memanggil server dengan cabang "Pusat"; pilihan cabang tetap, pilihan Shift 2 dipertahankan dan isi beranda mengikuti (Pusat tidak punya orang di shift 2)', pc.length === 1 && el('filterCabang').value === 'Pusat' && el("ownAngka").querySelectorAll(".n")[2].textContent === "0");
    await tunggu(500); ok('"Perlu evaluasi (BAD)" AKTIF (Tahap 2): jumlah dari server "N orang", tanpa Segera', !document.querySelector('#layarOwner .btn-evaluasi').disabled && /\d+ orang/.test(document.querySelector('#layarOwner .btn-evaluasi').textContent) && !/Segera/.test(document.querySelector('#layarOwner .btn-evaluasi').textContent));
    ok('Telat 7 hari terakhir: 7 batang dari server, "Tertinggi: Senin (6 orang)"', el('ownTelat7').querySelectorAll('.kol').length === 7 && el('ownTertinggi').textContent === 'Tertinggi: Senin (6 orang)');
    ok('kotak Konfirmasi data admin memakai subjudul mockup', /Izin, absen luar, lupa absen milik admin/.test(el('btnOwnerKonf').textContent));
    el('btnSegarkanOwner').click();
    ok('ikon segarkan berputar dan nonaktif selama memuat', el('btnSegarkanOwner').disabled && el('btnSegarkanOwner').classList.contains('memuat'));
    await tunggu(500);
    ok('segarkan selesai: tombol aktif kembali', !el('btnSegarkanOwner').disabled);
    el('btnMenuOwner').click(); await tunggu(100);
    var m = Array.prototype.map.call(document.querySelectorAll('#menuOwner .menu-kartu button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim() + (b.disabled ? '[x]' : ''); });
    ok('menu owner urut mockup 72: ... Perangkat (HP toko), Ganti password, Keluarkan semua perangkat, Log out (tanpa "Tutup menu")', m.length === 11 && m[7] === 'Perangkat (HP toko)' && m[8] === 'Ganti password' && m[9] === 'Keluarkan semua perangkat' && m[10] === 'Log out');
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
