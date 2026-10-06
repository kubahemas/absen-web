// Pengisi potret HP toko (dipasangkan dengan tools/pra_toko.js lewat PRA): jalankan satu alur absen dengan server TIRUAN.
// Atur dulu (baris di depan berkas ini, dibuat oleh pembuat skenario): window.__MODE = 'btnMasuk' | 'btnPulang' | 'btnLembur'; window.__absen = {respons};
// window.__TAHAN = true menahan penutupan otomatis pop-up (supaya bisa dipotret); window.__LANJUT = fungsi tambahan setelah hasil muncul.
var st0 = window.setTimeout;
var si0 = window.setInterval;
if (window.__TAHAN) { window.setInterval = function (f, ms) { return si0.call(window, f, (ms >= 200 && ms <= 1100) ? ms * 30 : ms); }; }
if (window.__TAHAN) { window.setTimeout = function (f, ms) { if (ms >= 3900 && ms <= 4100) { return 0; } return st0.apply(window, arguments); }; }
var tombol = document.getElementById(window.__MODE || 'btnMasuk');
tombol.disabled = false; tombol.click();
st0(function () { var s = document.getElementById('selectNama'); s.value = 'K002'; s.dispatchEvent(new Event('change')); }, 700);
st0(function () { ['1', '2', '3', '4', '5'].forEach(function (d) { document.querySelector('#keypad [data-digit="' + d + '"]').click(); }); }, 1000);
if (window.__LANJUT) { st0(window.__LANJUT, 1700); }
