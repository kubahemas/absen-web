// Uji server TIRUAN: tarik-ke-bawah untuk refresh (HP pribadi, admin HP toko, owner).
// Konteks lewat window.__KONTEKS = 'pribadi' | 'admin' | 'owner' (baris pertama berkas salinan). Admin dan owner butuh PRA (tools/pra_toko.js / pra_owner.js).
window.__hasil = [];
var H = window.__hasil;
var K = window.__KONTEKS || 'pribadi';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var panggil = window.__panggilan || [];
window.__panggilan = panggil;
if (K === 'pribadi') {
  window.fetch = function (url, opsi) {
    var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
    panggil.push(b);
    var d = { status: 'gagal', pesan: 'tidak ditiru' };
    if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: 'KARYAWAN', cabang: 'Ngawi' }; }
    if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false }; }
    return Promise.resolve({ json: function () { return Promise.resolve(d); } });
  };
}
var AKSI = K === 'pribadi' ? 'pribadi_hari_ini' : 'beranda_hari_ini';
function jumlah() { return panggil.filter(function (x) { return x.aksi === AKSI; }).length; }
function sentuh(tipe, elemen, x, y) {
  var t = new Touch({ identifier: 1, target: elemen, clientX: x, clientY: y });
  elemen.dispatchEvent(new TouchEvent(tipe, { bubbles: true, cancelable: true, touches: tipe === 'touchend' ? [] : [t], targetTouches: tipe === 'touchend' ? [] : [t], changedTouches: [t] }));
}
async function tarik(elemen, dx, dy, tunggu2) {
  sentuh('touchstart', elemen, 100, 100); sentuh('touchmove', elemen, 100 + dx / 2, 100 + dy / 2); sentuh('touchmove', elemen, 100 + dx, 100 + dy); sentuh('touchend', elemen, 100 + dx, 100 + dy);
  await tunggu(tunggu2 || 500);
}
(async function () {
  try {
    var gulir, layarBeranda;
    if (K === 'pribadi') {
      el('btnJenisPribadi').click(); el('pribNama').value = 'Budi Santoso'; el('pribRahasia').value = '12345'; el('btnMasukPribadi').click(); await tunggu(800);
      gulir = el('pbIsi'); layarBeranda = 'layarPribadi';
    } else if (K === 'admin') {
      el('btnAdmin').click(); el('admUsername').value = 'Dewi Lestari'; el('admPassword').value = 'rahasia12'; el('btnMasukAdmin').click(); await tunggu(800);
      gulir = document.querySelector('#layarAdmin .isi-gulir'); layarBeranda = 'layarAdmin';
    } else {
      el('btnJenisOwner').click(); el('ownUsername').value = 'owner'; el('ownPassword').value = 'rahasia123'; el('btnMasukOwner').click(); await tunggu(900);
      gulir = document.querySelector('#layarOwner .isi-gulir'); layarBeranda = 'layarOwner';
    }
    window.__tandaMuat = 'sama';
    ok('beranda terbuka', aktif() === layarBeranda);
    ok('tarik-ke-bawah bawaan Chrome dimatikan (overscroll-behavior-y: contain pada body)', getComputedStyle(document.body).overscrollBehaviorY === 'contain');
    var n0 = jumlah();
    await tarik(gulir, 0, 40);
    ok('tarikan PENDEK (40 px) tidak memicu refresh', jumlah() === n0);
    await tarik(gulir, 200, 120);
    ok('geseran dominan horizontal tidak memicu refresh', jumlah() === n0);
    gulir.insertAdjacentHTML('beforeend', '<div id="spacerUji" style="height:3000px;flex:none"></div>');
    gulir.scrollTop = 80; window.scrollTo(0, 80); await tunggu(150);
    await tarik(gulir, 0, 160);
    ok("tarikan jauh saat halaman TIDAK di paling atas (digulir ke bawah: scrollTop " + Math.round(gulir.scrollTop) + ", scrollY " + Math.round(window.scrollY) + ", seperti menggulir daftar) tidak memicu refresh", (gulir.scrollTop > 0 || window.scrollY > 0) && jumlah() === n0);
    gulir.scrollTop = 0; window.scrollTo(0, 0); el("spacerUji").remove(); await tunggu(150);
    if (K !== 'pribadi') {
      var menu = K === 'admin' ? el('btnMenuAdmin') : el('btnMenuOwner');
      menu.click(); await tunggu(200);
      await tarik(gulir, 0, 160);
      ok('tarikan saat menu terbuka tidak memicu refresh', jumlah() === n0);
      (K === 'admin' ? el('btnTutupMenuAdmin') : el('menuLatar')).click(); await tunggu(200);
    }
    var ikon = K === 'pribadi' ? el('btnSegarkanPribadi') : (K === 'admin' ? el('btnSegarkanAdmin') : el('btnSegarkanOwner'));
    // tarikan jauh di paling atas: tepat SEKALI, dua tarikan beruntun tidak menggandakan
    sentuh('touchstart', gulir, 100, 100); sentuh('touchmove', gulir, 100, 160); sentuh('touchmove', gulir, 100, 240); sentuh('touchend', gulir, 100, 240);
    var segeraSetelah = ikon.disabled && ikon.classList.contains('memuat');
    sentuh('touchstart', gulir, 100, 100); sentuh('touchmove', gulir, 100, 240); sentuh('touchend', gulir, 100, 240); // tarikan kedua saat masih memuat
    ok('tarikan jauh (140 px) di paling atas memicu refresh: ikon berputar dan nonaktif, penanda tarik berputar', segeraSetelah && el('penandaTarik').classList.contains('memuat'));
    await tunggu(600);
    ok('refresh terjadi tepat SEKALI (tarikan kedua saat masih memuat diabaikan; tidak ganda dengan ikon)', jumlah() === n0 + 1);
    ok('selesai: ikon dan penanda berhenti berputar, ikon aktif kembali', !ikon.disabled && !ikon.classList.contains('memuat') && !el('penandaTarik').classList.contains('memuat'));
    ok('halaman TIDAK dimuat ulang (penanda sesi window tetap ada, layar beranda tetap aktif)', window.__tandaMuat === 'sama' && aktif() === layarBeranda);
    var n1 = jumlah();
    ikon.click(); await tunggu(500);
    ok('ikon segarkan tetap bekerja sendiri (+1)', jumlah() === n1 + 1);
    // layar bukan beranda: tarik tidak memicu apa pun
    if (K === 'admin') {
      el('btnAdminKonf').click(); await tunggu(600);
      var n2 = jumlah(); var dk = document.querySelector('#layarKonfirmasi .isi-gulir');
      await tarik(dk, 0, 200);
      ok('di layar Konfirmasi tarikan jauh TIDAK memicu refresh beranda', aktif() === 'layarKonfirmasi' && jumlah() === n2);
    }
    if (K === 'owner') {
      el('ownBelum').querySelector('[data-belum]').click(); await tunggu(200);
      var n3 = jumlah(); var db = document.querySelector('#layarBelumAbsen .isi-gulir');
      await tarik(db, 0, 200);
      ok('di layar daftar Belum absen tarikan jauh TIDAK memicu refresh', aktif() === 'layarBelumAbsen' && jumlah() === n3);
    }
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
