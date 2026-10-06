// Uji: lingkaran foto kamera DIBESARKAN (usulan ~160 px; ~45% lebar pada 360 px) di layar 09 (HP toko) dan absen luar (HP pribadi), dan tidak ada yang terpotong.
// Konteks lewat window.__KONTEKS = 'toko' | 'luar' (baris pertama berkas salinan). 'toko' butuh PRA tools/pra_toko.js. Jalankan juga dengan LEBAR=360 TINGGI=640.
window.__hasil = [];
var H = window.__hasil;
var K = window.__KONTEKS || 'luar';
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + '[' + K + ' ' + window.innerWidth + 'x' + window.innerHeight + '] ' + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
if (K === 'luar') {
  window.fetch = function (url, opsi) {
    var b = {}; try { b = JSON.parse(opsi.body); } catch (e) {}
    var d = { status: 'gagal', pesan: 'tidak ditiru' };
    if (b.aksi === 'login_pribadi') { d = { status: 'ok', sesi: 'S'.repeat(40), id: 'K001', nama: 'Budi Santoso', panggilan: 'Budi', role: 'KARYAWAN', cabang: 'Ngawi' }; }
    if (b.aksi === 'pribadi_hari_ini') { d = { status: 'ok', sudah_masuk: false, sudah_pulang: false, jam_masuk: '', jam_pulang: '', cara_masuk: '', st_pulang: '', lembur_boleh: false }; }
    if (b.aksi === 'tiket_waktu') { d = { status: 'ok', tiket: 'T' }; }
    return Promise.resolve({ json: function () { return Promise.resolve(d); } });
  };
  navigator.geolocation.watchPosition = function (s) { setTimeout(function () { s({ coords: { latitude: -7.4, longitude: 111.4, accuracy: 12 } }); }, 50); return 1; };
}
(async function () {
  try {
    var lingkar, lebar = window.innerWidth;
    if (K === 'toko') {
      el('btnMasuk').click(); await tunggu(300);
      lingkar = document.querySelector('#layarPilihNama .foto-lingkar');
      ok('layar 09 terbuka', aktif() === 'layarPilihNama');
    } else {
      el('btnJenisPribadi').click(); el('pribNama').value = 'Budi Santoso'; el('pribRahasia').value = '12345'; el('btnMasukPribadi').click(); await tunggu(800);
      el('btnPribMasuk').click(); await tunggu(600);
      lingkar = el('kotakKameraLuar');
      ok('layar absen luar terbuka', aktif() === 'layarLuar');
    }
    var r = lingkar.getBoundingClientRect(), cs = getComputedStyle(lingkar);
    ok('diameter lingkaran foto 160 px (ukuran usulan baru, bukan 100/72 px lama): ' + Math.round(r.width) + ' x ' + Math.round(r.height), Math.abs(r.width - 160) <= 1 && Math.abs(r.height - 160) <= 1);
    ok('bulat sempurna (border-radius 50%)', cs.borderRadius === '50%' || parseFloat(cs.borderRadius) >= 80);
    ok('border proporsional 9 px (5,6% dari diameter)', parseFloat(cs.borderTopWidth) === 9);
    ok('sekitar 45% lebar layar: ' + Math.round(r.width / lebar * 100) + '% (360 px: 44%, 390 px: 41%)', r.width / lebar >= 0.40 && r.width / lebar <= 0.46);
    ok('tidak ada yang melebihi lebar layar (tanpa gulir mendatar)', document.documentElement.scrollWidth <= window.innerWidth + 1);
    var cek = K === 'toko' ? ['hurufDaftar', 'selectNama', 'pinTitik', 'keypad', 'btnBatalNama'] : ['luarKet', 'btnKirimMasuk', 'btnKembaliLuarMasuk'];
    var dalam = cek.every(function (id) { var b = el(id).getBoundingClientRect(); return b.left >= -1 && b.right <= window.innerWidth + 1 && b.width > 0; });
    ok('keypad/titik PIN/kolom Keterangan/tombol Kirim dan Kembali tidak terpotong di sisi kanan-kiri: ' + cek.join(', '), dalam);
    if (K === 'luar') {
      var kirim = el('btnKirimMasuk').getBoundingClientRect(), kem = el('btnKembaliLuarMasuk').getBoundingClientRect(), ket = el('luarKet').getBoundingClientRect();
      ok('di tinggi ' + window.innerHeight + ' px tombol Kirim dan Kembali tetap terlihat tanpa menggulir, tidak menimpa kolom Keterangan', kirim.bottom <= window.innerHeight + 1 && kem.bottom <= window.innerHeight + 1 && ket.bottom <= kirim.top + 1);
    } else {
      var tinggiDok = document.documentElement.scrollHeight;
      ok('layar 09 bisa digulir sampai keypad (tinggi isi ' + tinggiDok + ' px, layar ' + window.innerHeight + ' px); tidak ada yang tersembunyi permanen', el('keypad').getBoundingClientRect().bottom <= tinggiDok + 1);
      var s = el('selectNama'); s.value = s.options.length > 1 ? s.options[1].value : ''; s.dispatchEvent(new Event('change'));
      await tunggu(900);
      if (tinggiDok > window.innerHeight + 4) { ok('setelah memilih nama, halaman otomatis menggulir ke keypad (PIN langsung terlihat)', window.scrollY > 0 && el('keypad').getBoundingClientRect().bottom <= window.innerHeight + 4); }
    }
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
