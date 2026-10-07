// Skrip uji (server TIRUAN, tidak menulis ke sheet): Tahap 3 akun: layar 45 (ganti password/PIN), Akun saya (44), login akun terkunci (47).
// Konteks lewat window.__KONTEKS = 'karyawan' | 'admin' | 'terkunci'. Pakai BUDGET=90000.
window.__hasil = [];
var H = window.__hasil;
var K = window.__KONTEKS || 'karyawan';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
function f(id, nama) { return document.querySelector('#' + id + ' [data-f="' + nama + '"]'); }
function teks(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
function isi(e, nilai) { e.value = nilai; e.dispatchEvent(new Event('input', { bubbles: true })); }
var panggil = [];
function terakhir(aksi) { return panggil.filter(function (x) { return x.aksi === aksi; }).pop(); }
var f0 = window.fetch;
window.fetch = function (url, opsi) {
  var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
  panggil.push(b);
  var d = null;
  var adm = K === 'admin';
  if (b.aksi === 'login_pribadi') {
    d = /terkunci/i.test(b.nama) ? { status: 'gagal', kode: 'TERKUNCI', pesan: 'Terlalu banyak percobaan salah. Akun terkunci, hubungi admin.' }
      : { status: 'ok', sesi: 'S'.repeat(40), id: adm ? 'K009' : 'K003', nama: adm ? 'Dewi Lestari' : 'Budi Santoso', panggilan: 'Budi', role: adm ? 'ADMIN' : 'KARYAWAN', cabang: 'Ngawi' };
  }
  if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false, izin_menunggu: 0, tukar_masuk: 0 }; }
  if (b.aksi === 'konfirmasi_jumlah') { d = { status: 'ok', jumlah: 0, jumlah_teks: '0' }; }
  if (b.aksi === 'laporan_saya') { d = { status: 'gagal', pesan: 'tidak ditiru' }; }
  if (b.aksi === 'pribadi_profil') { d = { status: 'ok', id: adm ? 'K009' : 'K003', nama: adm ? 'Dewi Lestari' : 'Budi Santoso', panggilan: 'Budi', role: adm ? 'ADMIN' : 'KARYAWAN', cabang: 'Ngawi', shift_teks: 'Shift 1 (07:45 – 16:30)' }; }
  if (b.aksi === 'ganti_rahasia_pribadi') {
    d = b.lama === (adm ? 'rahasia12' : '11111') ? { status: 'ok', keluar: 1 } : (b.lama === '00000' ? { status: 'gagal', kode: 'TERKUNCI', pesan: 'Terlalu banyak percobaan salah. Akun terkunci, hubungi admin.' } : { status: 'gagal', pesan: (adm ? 'Password' : 'PIN') + ' lama salah' });
  }
  if (d) { return Promise.resolve({ json: function () { return Promise.resolve(d); } }); }
  return f0(url, opsi);
};
(async function () {
  try {
    if (K === 'terkunci') {
      el('btnJenisPribadi').click(); await tunggu(150);
      el('pribNama').value = 'Akun Terkunci'; el('pribRahasia').value = '12345'; el('btnMasukPribadi').click(); await tunggu(600);
      var kotak = el('kotakTerkunciLogin');
      ok('login akun terkunci (47): kotak merah "Akun terkunci. Hubungi admin." tampil di layar login', aktif() === 'layarLoginPribadi' && kotak.style.display !== 'none' && /Akun terkunci\. Hubungi admin\./.test(kotak.textContent));
      ok('kolom Username/Password tetap ada, teks "Cukup login sekali. Lupa password? Hubungi admin." tetap tampil, pesan teks biasa kosong', !!el('pribNama') && !!el('pribRahasia') && /Cukup login sekali\. Lupa password\? Hubungi admin\./.test(el('layarLoginPribadi').textContent) && teks(el('pesanLoginPribadi')) === '');
      el('pribNama').value = 'Budi Santoso'; el('pribRahasia').value = '12345'; el('btnMasukPribadi').click(); await tunggu(700);
      ok('login nama lain yang tidak terkunci berhasil dan kotak terkunci hilang', aktif() === 'layarPribadi' && el('kotakTerkunciLogin').style.display === 'none');
    }
    if (K === 'karyawan' || K === 'admin') {
      var adm2 = K === 'admin';
      el('btnJenisPribadi').click(); await tunggu(100);
      el('pribNama').value = adm2 ? 'Dewi Lestari' : 'Budi Santoso'; el('pribRahasia').value = adm2 ? 'rahasia12' : '12345'; el('btnMasukPribadi').click(); await tunggu(900);
      el('btnMenuPribadi').click(); await tunggu(150);
      document.querySelector('#menuPribadiIsi [data-menu="akun"]').click(); await tunggu(600);
      ok('Akun saya: nama, ID, cabang dari akun; Shift bawaan dari server "Shift 1 (07:45 – 16:30)" (bukan "Segera")', aktif() === 'layarAkun' && teks(el('akunNama')) === (adm2 ? 'Dewi Lestari' : 'Budi Santoso') && teks(el('akunId')) === (adm2 ? 'K009' : 'K003') && teks(el('akunCabang')) === 'Ngawi' && teks(el('akunShift')) === 'Shift 1 (07:45 – 16:30)' && !!terakhir('pribadi_profil'));
      var gantiBtn = document.querySelector('#layarAkun [data-lb-ke="lb45"]'), pinBtn = Array.prototype.filter.call(document.querySelectorAll('#layarAkun button'), function (b) { return /Ganti PIN/.test(b.textContent); })[0];
      ok('"Ganti password" aktif; "Ganti PIN" tetap nonaktif "Segera" (belum ada layarnya di mockup)', !!gantiBtn && !gantiBtn.disabled && !!pinBtn && pinBtn.disabled && /Segera/.test(pinBtn.textContent));
      gantiBtn.click(); await tunggu(400);
      var nm = adm2 ? 'Password' : 'PIN';
      ok('layar 45: subjudul "nama · ID"; label "' + nm + ' lama / ' + nm + ' baru / Ulangi ' + nm + ' baru"; kolom isian aktif', aktif() === 'lb45' && teks(f('lb45', 'sub')) === (adm2 ? 'Dewi Lestari · K009' : 'Budi Santoso · K003') && teks(document.querySelector('#lb45 label[for="lb45_pl"]')) === nm + ' lama' && teks(document.querySelector('#lb45 label[for="lb45_pu"]')) === 'Ulangi ' + nm + ' baru' && !f('lb45', 'lama').disabled && !f('lb45', 'baru').disabled && !f('lb45', 'ulang').disabled);
      ok(adm2 ? 'admin: kolom bebas teks, maksimal 100 karakter' : 'karyawan: kolom angka, maksimal 5 karakter', adm2 ? (f('lb45', 'baru').maxLength === 100 && f('lb45', 'baru').inputMode === 'text') : (f('lb45', 'baru').maxLength === 5 && f('lb45', 'baru').inputMode === 'numeric'));
      var rows = Array.prototype.slice.call(f('lb45', 'aturan4').parentElement.children);
      ok('aturan sesuai peran dengan tanda; awalnya belum terpenuhi (•), Simpan nonaktif "Segera"', rows.length === 4 && (adm2 ? /Kata sandi minimal 8 karakter/.test(teks(rows[0])) : /PIN tepat 5 angka/.test(teks(rows[0]))) && /^•/.test(teks(rows[0])) && /^•/.test(teks(rows[3])) && f('lb45', 'simpan').disabled && /Segera/.test(teks(f('lb45', 'simpan'))));
      isi(f('lb45', 'lama'), adm2 ? 'salahlama1' : '99999');
      isi(f('lb45', 'baru'), adm2 ? 'abc' : '1234'); isi(f('lb45', 'ulang'), adm2 ? 'abc' : '1234');
      ok('baru kurang dari aturan: aturan 1 tetap •, "Kedua sama" ✓, Simpan tetap nonaktif', /^•/.test(teks(rows[0])) && /^✓/.test(teks(rows[3])) && f('lb45', 'simpan').disabled);
      isi(f('lb45', 'baru'), adm2 ? 'sandibaru8' : '55555'); isi(f('lb45', 'ulang'), adm2 ? 'sandibarux' : '55556');
      ok('aturan 1 dan 2 terpenuhi (✓) tetapi kedua isian beda: baris 4 •, Simpan nonaktif', /^✓/.test(teks(rows[0])) && /^✓/.test(teks(rows[1])) && /^•/.test(teks(rows[3])) && f('lb45', 'simpan').disabled);
      isi(f('lb45', 'ulang'), adm2 ? 'sandibaru8' : '55555');
      ok('semua terpenuhi: semua ✓, Simpan AKTIF (tanpa "Segera")', rows.every(function (r) { return /^✓/.test(teks(r)); }) && !f('lb45', 'simpan').disabled && !/Segera/.test(teks(f('lb45', 'simpan'))));
      f('lb45', 'simpan').click(); await tunggu(500);
      var g1 = terakhir('ganti_rahasia_pribadi');
      ok('Simpan mengirim ganti_rahasia_pribadi dengan sesi, lama, baru; lama salah = pesan merah "' + nm + ' lama salah", tidak ada dialog, tetap di layar 45', !!g1 && g1.sesi === 'S'.repeat(40) && g1.lama === (adm2 ? 'salahlama1' : '99999') && g1.baru === (adm2 ? 'sandibaru8' : '55555') && teks(f('lb45', 'pesan')) === nm + ' lama salah' && /merah/.test(f('lb45', 'pesan').style.color) && aktif() === 'lb45' && !el('dialog').classList.contains('tampil'));
      isi(f('lb45', 'lama'), adm2 ? 'rahasia12' : '11111');
      ok('mengetik lagi menghapus pesan galat', teks(f('lb45', 'pesan')) === '');
      f('lb45', 'simpan').click(); await tunggu(500);
      ok('berhasil: dialog "' + nm + ' diganti" menyebut perangkat lain harus masuk lagi; isian dikosongkan', /diganti/.test(el('dialog').textContent) && /Perangkat lain/.test(el('dialog').textContent) && f('lb45', 'lama').value === '' && f('lb45', 'baru').value === '');
      el('dlgOk').click(); await tunggu(400);
      ok('OK kembali ke Akun saya', aktif() === 'layarAkun');
      // akun terkunci karena salah lama 5x (server membalas TERKUNCI)
      document.querySelector('#layarAkun [data-lb-ke="lb45"]').click(); await tunggu(300);
      isi(f('lb45', 'lama'), '00000'); isi(f('lb45', 'baru'), adm2 ? 'sandibaru9' : '77777'); isi(f('lb45', 'ulang'), adm2 ? 'sandibaru9' : '77777');
      if (adm2) { isi(f('lb45', 'lama'), '00000'); }
      f('lb45', 'simpan').click(); await tunggu(600);
      ok('server membalas TERKUNCI: sesi dihapus, kembali ke layar awal dengan pesan akun terkunci', aktif() === 'layarJenis' && /terkunci/i.test(teks(el('catatanJenis'))));
    }
  } catch (e) { H.push('GALAT ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
  H.unshift(H.filter(function (x) { return /^GAGAL|^GALAT/.test(x); }).length ? 'ADA YANG GAGAL' : 'SEMUA OK');
})();
