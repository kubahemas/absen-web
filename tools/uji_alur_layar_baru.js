// Uji navigasi layar baru (tampilan saja): menu/tombol yang menuju layar baru AKTIF dan membuka layar yang benar; Kembali/Home berfungsi; tidak ada panggilan server baru.
// Konteks lewat window.__KONTEKS = 'toko' | 'pribadi' | 'pribadiadmin' | 'admin' | 'owner' (baris pertama berkas salinan). 'toko', 'admin', 'owner' butuh PRA (pra_toko.js / pra_owner.js).
window.__hasil = [];
var H = window.__hasil;
var K = window.__KONTEKS || 'owner';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var panggil = window.__panggilan || [];
window.__panggilan = panggil;
if (K === 'pribadi' || K === 'pribadiadmin') {
  window.fetch = function (url, opsi) {
    var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
    panggil.push(b);
    var d = { status: 'gagal', pesan: 'tidak ditiru' };
    if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: K === 'pribadiadmin' ? 'ADMIN' : 'KARYAWAN', cabang: 'Ngawi' }; }
    if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false }; }
    if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 0, jumlah_teks: '0' }; }
    return Promise.resolve({ json: function () { return Promise.resolve(d); } });
  };
}
function blokAktif() { return document.querySelector('.layar.aktif'); }
function tombolKembali() { var b = blokAktif(); return b.querySelector('[data-lb-kembali="kembali"]') || b.querySelector('[data-lb-kembali]'); }
async function ke(tombol, id, asal, nama) {
  tombol.click(); await tunggu(150);
  ok(nama + ' membuka ' + id, aktif() === id);
  var k = tombolKembali();
  if (k) { k.click(); await tunggu(150); }
  ok(nama + ': tombol Kembali/Home kembali ke ' + asal, aktif() === asal);
}
(async function () {
  try {
    var n0;
    if (K === 'toko') {
      await tunggu(300);
      var lab = document.querySelector('.label-shift');
      ok('label "Shift 1 aktif" menuju layar 02 (jadwal hari ini)', lab.getAttribute('data-lb-ke') === 'lb02');
      lab.click(); await tunggu(150);
      ok('layar 02 terbuka', aktif() === 'lb02');
      ok('layar 02: tombol Tutup berfungsi, tidak ada nama atau jam contoh', !!document.querySelector('#lb02 [data-lb-kembali]') && !/\d/.test(el('lb02').textContent.replace(/Shift\s*–/g, '')));
      document.querySelector('#lb02 [data-lb-kembali]').click(); await tunggu(150);
      ok('Tutup kembali ke layar utama', aktif() === 'layarUtama');
    }
    if (K === 'owner') {
      el('btnJenisOwner').click(); el('ownUsername').value = 'owner'; el('ownPassword').value = 'rahasia123'; el('btnMasukOwner').click(); await tunggu(900);
      n0 = panggil.length;
      var peta = { 'Log admin': 'lb73', 'Kunci periode': 'lb76', 'Role & admin': 'lb77', 'Pengaturan': 'lb75', 'Cabang & shift': 'lb24', 'Laporan bulanan': 'lb81', 'Data absensi': 'lb25' };
      for (var nama in peta) {
        el('btnMenuOwner').click(); await tunggu(120);
        var item = Array.prototype.filter.call(document.querySelectorAll('#menuOwner .menu-kartu button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(nama) === 0; })[0];
        ok('menu owner "' + nama + '" AKTIF (tidak lagi "Segera")', !!item && !item.disabled && !item.querySelector('.segera'));
        await ke(item, peta[nama], 'layarOwner', 'menu owner "' + nama + '"');
      }
      // Log admin -> kategori Edit absen -> layar detail, Back kembali ke 73
      el('btnMenuOwner').click(); await tunggu(120);
      Array.prototype.filter.call(document.querySelectorAll('#menuOwner .menu-kartu button'), function (b) { return /^Log admin/.test(b.textContent.trim()); })[0].click(); await tunggu(150);
      var det = Array.prototype.filter.call(el('lb73').querySelectorAll('button'), function (b) { return b.textContent.trim() === 'Detail'; });
      ok('layar 73: hanya "Detail" Edit absen yang aktif (menuju 74), 8 lainnya nonaktif', det.length === 9 && det.filter(function (b) { return !b.disabled; }).length === 1 && !det[5].disabled);
      det[5].click(); await tunggu(150);
      ok('Detail Edit absen membuka layar 74', aktif() === 'lb74');
      tombolKembali().click(); await tunggu(150);
      ok('Back dari 74 kembali ke 73 (riwayat)', aktif() === 'lb73');
      el('lb73').querySelector('[data-lb-kembali="home"]').click(); await tunggu(150);
      ok('Home dari 73 kembali ke beranda owner', aktif() === 'layarOwner');
      // tab Laporan bulanan 81 <-> 82
      el('btnMenuOwner').click(); await tunggu(120);
      Array.prototype.filter.call(document.querySelectorAll('#menuOwner .menu-kartu button'), function (b) { return /^Laporan bulanan/.test(b.textContent.trim()); })[0].click(); await tunggu(150);
      var tab = el('lb81').querySelector('[data-lb-ke="lb82"]');
      ok('layar 81: tab "Per karyawan" aktif menuju 82', !!tab);
      tab.click(); await tunggu(150);
      ok('tab membuka 82', aktif() === 'lb82');
      el('lb82').querySelector('[data-lb-ke="lb81"]').click(); await tunggu(150);
      ok('tab "Ringkasan" kembali ke 81', aktif() === 'lb81');
      el('lb81').querySelector('[data-lb-kembali="home"]').click(); await tunggu(150);
      ok('Home dari 81 kembali ke beranda owner', aktif() === 'layarOwner');
      var asing = panggil.slice(n0).filter(function (x) { return !/^(beranda_hari_ini|owner_perhatian|konfirmasi_jumlah|owner_beranda|konfirmasi_daftar)$/.test(x.aksi); }).map(function (x) { return x.aksi; });
      ok('tidak ada panggilan server baru dari layar baru (daftar aksi tidak bertambah selama membuka layar baru)' + (asing.length ? ' -> ' + asing.join(',') : ''), asing.length === 0);
    }
    if (K === 'admin') {
      el('btnAdmin').click(); el('admUsername').value = 'Dewi Lestari'; el('admPassword').value = 'rahasia12'; el('btnMasukAdmin').click(); await tunggu(900);
      n0 = panggil.length;
      var petaA = { 'Absen manual': 'lb54', 'Data absensi': 'lb64', 'Jadwal shift': 'lb55', 'Input izin': 'lb66', 'Kalender libur': 'lb67', 'Dashboard bulanan': 'lb68' };
      for (var na in petaA) {
        el('btnMenuAdmin').click(); await tunggu(120);
        var ia = Array.prototype.filter.call(document.querySelectorAll('#menuAdmin .menu-kartu button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(na) === 0; })[0];
        ok('menu admin "' + na + '" AKTIF (tidak lagi "Segera")', !!ia && !ia.disabled && !ia.querySelector('.segera'));
        await ke(ia, petaA[na], 'layarAdmin', 'menu admin "' + na + '"');
      }
      el('btnMenuAdmin').click(); await tunggu(120);
      Array.prototype.filter.call(document.querySelectorAll('#menuAdmin .menu-kartu button'), function (b) { return /^Dashboard bulanan/.test(b.textContent.trim()); })[0].click(); await tunggu(150);
      el('lb68').querySelector('[data-lb-ke="lb69"]').click(); await tunggu(150);
      ok('dashboard: tab "Per karyawan" membuka 69', aktif() === 'lb69');
      el('lb69').querySelector('[data-lb-ke="lb68"]').click(); await tunggu(150);
      ok('tab "Ringkasan" kembali ke 68', aktif() === 'lb68');
      el('lb68').querySelector('[data-lb-kembali="home"]').click(); await tunggu(150);
      ok('Home dari dashboard kembali ke beranda admin', aktif() === 'layarAdmin');
      // Karyawan -> sheet -> Pola shift -> 57 -> Back kembali ke daftar Karyawan
      el('btnMenuAdmin').click(); await tunggu(120); el('btnMenuKaryawan').click(); await tunggu(700);
      var baris = el('daftarKaryawanAdmin').querySelector('[data-kry="buka"]'); baris.click(); await tunggu(150);
      var pola = document.querySelector('#dialog [data-lb-ke="lb57"]');
      ok('sheet karyawan: "Pola shift" AKTIF dan menuju layar 57; "Daftar wajah" tetap nonaktif "Segera"', !!pola && !pola.disabled && !!Array.prototype.filter.call(document.querySelectorAll('#dialog button[disabled]'), function (b) { return /Daftar wajah/.test(b.textContent); }).length);
      pola.click(); await tunggu(150);
      ok('Pola shift membuka layar 57 dan menutup sheet', aktif() === 'lb57' && !el('dialog').classList.contains('tampil'));
      tombolKembali().click(); await tunggu(150);
      ok('Back dari 57 kembali ke daftar Karyawan', aktif() === 'layarKaryawan');
    }
    if (K === 'pribadi') {
      el('btnJenisPribadi').click(); el('pribNama').value = 'Budi Santoso'; el('pribRahasia').value = '12345'; el('btnMasukPribadi').click(); await tunggu(900);
      n0 = panggil.length;
      ok('kotak Izin/Cuti, Tukar shift, Report AKTIF (tanpa tulisan "Segera")', ['btnPribIzin', 'btnPribTukar', 'btnPribReport'].every(function (id) { return !el(id).disabled && !/Segera/.test(el(id).textContent); }));
      await ke(el('btnPribIzin'), 'lb41', 'layarPribadi', 'Izin/Cuti');
      await ke(el('btnPribTukar'), 'lb42', 'layarPribadi', 'Tukar shift');
      el('btnPribReport').click(); await tunggu(150);
      ok('Report membuka satu layar Report (36)', aktif() === 'lb36');
      var dt = Array.prototype.filter.call(el('lb36').querySelectorAll('button'), function (b) { return b.textContent.trim().indexOf('Detail') === 0; });
      ok('Report: 8 tombol Detail, hanya Telat (40) dan Lembur disetujui (39) yang aktif', dt.length === 8 && dt.filter(function (b) { return !b.disabled; }).length === 2 && dt[1].getAttribute('data-lb-ke') === 'lb40' && dt[7].getAttribute('data-lb-ke') === 'lb39');
      dt[1].click(); await tunggu(150);
      ok('Detail Telat membuka 40', aktif() === 'lb40');
      tombolKembali().click(); await tunggu(150);
      ok('Back dari 40 kembali ke Report', aktif() === 'lb36');
      dt[7].click(); await tunggu(150);
      ok('Detail Lembur membuka 39', aktif() === 'lb39');
      tombolKembali().click(); await tunggu(150);
      el('lb36').querySelector('[data-lb-kembali="home"]').click(); await tunggu(150);
      ok('Home dari Report kembali ke beranda pribadi', aktif() === 'layarPribadi');
      el('btnMenuPribadi').click(); await tunggu(150);
      document.querySelector('#menuPribadiIsi [data-menu="akun"]').click(); await tunggu(150);
      var gp = Array.prototype.filter.call(el('layarAkun').querySelectorAll('button'), function (b) { return /Ganti password/.test(b.textContent); })[0];
      ok('Akun saya: "Ganti password" AKTIF, "Ganti PIN" tetap nonaktif', !!gp && !gp.disabled && Array.prototype.some.call(el('layarAkun').querySelectorAll('button[disabled]'), function (b) { return /Ganti PIN/.test(b.textContent); }));
      gp.click(); await tunggu(150);
      ok('Ganti password membuka 45', aktif() === 'lb45');
      tombolKembali().click(); await tunggu(150);
      ok('Back dari 45 kembali ke Akun saya', aktif() === 'layarAkun');
      ok('tidak ada panggilan server baru dari layar baru', panggil.slice(n0).every(function (x) { return /^(pribadi_hari_ini|konfirmasi_jumlah)$/.test(x.aksi); }));
    }
    if (K === 'pribadiadmin') {
      el('btnJenisPribadi').click(); el('pribNama').value = 'Dewi Lestari'; el('pribRahasia').value = 'rahasia12'; el('btnMasukPribadi').click(); await tunggu(900);
      var petaP = { 'Absen manual': 'lb54', 'Data absensi': 'lb64', 'Jadwal shift': 'lb55', 'Input izin': 'lb66', 'Kalender libur': 'lb67', 'Dashboard bulanan': 'lb68' };
      for (var np in petaP) {
        el('btnMenuPribadi').click(); await tunggu(150);
        var ip = Array.prototype.filter.call(document.querySelectorAll('#menuPribadiIsi button'), function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(np) === 0; })[0];
        ok('menu admin HP pribadi "' + np + '" AKTIF', !!ip && !ip.disabled && !ip.querySelector('.segera'));
        await ke(ip, petaP[np], 'layarPribadi', 'menu admin HP pribadi "' + np + '"');
      }
    }
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
