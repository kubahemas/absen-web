// Uji server TIRUAN: batas MAKSIMAL 5 kartu di Konfirmasi (layar 52 admin HP toko dan 28 owner), terlama di atas, kartu berikutnya naik.
// Pakai (admin): PRA="$(cat tools/pra_toko.js)" ID="" tools/potret.sh app "" hasil.png tools/uji_alur_konfirmasi_antrean.js
// Pakai (owner): tambahkan  window.__MODE_OWNER = true;  di baris pertama berkas salinan dan pakai tools/pra_owner.js.
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function tunggu(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function aktif() { var a = document.querySelector('.layar.aktif'); return a ? a.id : ''; }
var OWNER = !!window.__MODE_OWNER;
function item(no, tanggal, jam, kel) { return { id: 'K' + no + '|' + tanggal + '|MASUK', jenis: 'MASUK', kelompok: kel, karyawan: 'K' + no, nama: 'Orang ' + no, cabang: 'Ngawi', tanggal: tanggal, shift: '1', jam: jam, status: '', ket: 'Survey', tingkat: kel === 'LEMBUR' ? 2 : 0, durasi_menit: 75, gps: '', akurasi: null, akurasi_buruk: false, maps: '', foto: 'ADA' }; }
function nama() { return Array.prototype.map.call(el('daftarKonfirmasi').querySelectorAll('.kartu-konf .konf-nama'), function (x) { return x.textContent; }); }
(async function () {
  try {
    // 8 pengajuan, dikirim server TERBARU DULU (acak antar tanggal); yang paling lama = Orang 1
    var baru = [item(8, '2026-10-06', '09:00', 'LUAR'), item(7, '2026-10-06', '08:00', 'LEMBUR'), item(6, '2026-10-05', '17:00', 'LUAR'), item(5, '2026-10-05', '09:00', 'LUAR'), item(4, '2026-10-04', '10:00', 'LEMBUR'), item(3, '2026-10-03', '16:00', 'LUAR'), item(2, '2026-10-03', '08:30', 'LUAR'), item(1, '2026-10-02', '07:50', 'LUAR')];
    window.__KONF.length = 0; baru.forEach(function (x) { window.__KONF.push(x); });
    if (OWNER) {
      el('btnJenisOwner').click(); el('ownUsername').value = 'owner'; el('ownPassword').value = 'rahasia123'; el('btnMasukOwner').click(); await tunggu(800);
      el('btnOwnerKonf').click(); await tunggu(600);
    } else {
      el('btnAdmin').click(); el('admUsername').value = 'Dewi Lestari'; el('admPassword').value = 'rahasia12'; el('btnMasukAdmin').click(); await tunggu(700);
      el('btnAdminKonf').click(); await tunggu(600);
    }
    ok('layar Konfirmasi terbuka', aktif() === 'layarKonfirmasi');
    ok('tampil MAKSIMAL 5 kartu dari 8 pengajuan', el('daftarKonfirmasi').querySelectorAll('.kartu-konf').length === 5);
    ok('urut dari yang PALING LAMA di atas: Orang 1, 2, 3, 4, 5', nama().join() === 'Orang 1,Orang 2,Orang 3,Orang 4,Orang 5');
    if (OWNER) { ok('angka total tetap seluruhnya: "8 menunggu" (bukan 5)', /8 menunggu/.test(el('konfSub').textContent)); }
    else { ok('angka total chip "Semua 8" (bukan 5)', /Semua 8/.test(el('konfChips').textContent)); }
    el('daftarKonfirmasi').querySelector('.kartu-konf .acc').click(); await tunggu(400);
    ok('setelah Orang 1 di-ACC kartu berikutnya naik: tetap 5 kartu, Orang 2..6', nama().join() === 'Orang 2,Orang 3,Orang 4,Orang 5,Orang 6');
    ok('total turun jadi 7', OWNER ? /7 menunggu/.test(el('konfSub').textContent) : /Semua 7/.test(el('konfChips').textContent));
    el('daftarKonfirmasi').querySelectorAll('.kartu-konf')[1].querySelector('.tolak').click(); await tunggu(150);
    var ya = el('dialog') && el('dlgYa') ? el('dlgYa') : null;
    if (ya) { ya.click(); await tunggu(400); }
    ok('TOLAK satu kartu (Orang 3): kartu berikutnya (Orang 7) naik, urutan terlama tetap', nama().join() === 'Orang 2,Orang 4,Orang 5,Orang 6,Orang 7');
    var ps = window.__panggilan.filter(function (x) { return x.aksi === 'konfirmasi_putuskan'; });
    ok('keputusan dikirim ke server dengan id yang benar (ACC lalu TOLAK)', ps.length === 2 && ps[0].keputusan === 'ACC' && ps[0].id === 'K1|2026-10-02|MASUK' && ps[1].keputusan === 'TOLAK' && ps[1].id === 'K3|2026-10-03|MASUK');
    el('daftarKonfirmasi').querySelector('.kartu-konf .acc').click(); await tunggu(300);
    ok('ACC lagi: Orang 8 (terakhir dalam antrean) naik; 5 kartu', nama().join() === 'Orang 4,Orang 5,Orang 6,Orang 7,Orang 8');
    el('daftarKonfirmasi').querySelector('.kartu-konf .acc').click(); await tunggu(300);
    ok('antrean habis: kartu menyusut jadi 4 tanpa kartu kosong', nama().join() === 'Orang 5,Orang 6,Orang 7,Orang 8');
    ok('tombol "Muat lagi" tidak tampil (semua sudah dimuat)', el('btnMuatLagi').style.display === 'none');
  } catch (e) { H.push('GAGAL  galat uji: ' + e.message); }
})();
