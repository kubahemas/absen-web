// Uji: layar baru TIDAK memuat teks/angka CONTOH dari mockup (nama, jam, tanggal, angka), tidak ada nilai isian, dan semua kontrol isian nonaktif.
// Butuh TOKEN_CONTOH (tools/token_contoh.js, dibuat oleh tools/buat_token_contoh.pl): berkas itu ditaruh di depan skrip ini oleh pemanggil.
// Pakai: ( cat tools/token_contoh.js tools/uji_layar_baru_tanpa_contoh.js ) > salinan.js ; ID="" tools/potret.sh app "" hasil.png salinan.js
window.__hasil = [];
var H = window.__hasil;
function ok(n, c) { H.push((c ? 'OK     ' : 'GAGAL  ') + n); }
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
var LINDUNGI = [/Langkah \d dari \d/g, /[<>]\s?\d(?:\u2013\d)? jam/g, /\b\d\u2013\d jam\b/g, /\b\d (?:minggu|bulan)\b/g];
function teksNode(blok) { var w = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT), s = []; while (w.nextNode()) { var v = w.currentNode.nodeValue.replace(/\s+/g, ' ').trim(); if (v) { s.push(v); } } return s.join(' | '); }
var nomor = Object.keys(TOKEN_CONTOH);
var ada = 0, bocor = [], angka = [], isian = [], hidup = [];
nomor.forEach(function (n) {
  var blok = document.getElementById('lb' + n);
  if (!blok) { bocor.push('lb' + n + ' tidak ada'); return; }
  ada++;
  var teks = teksNode(blok);
  blok.querySelectorAll('input, textarea, select').forEach(function (e) {
    teks += ' ' + (e.getAttribute('value') || '') + ' ' + (/^(Cari|Ketik)/.test(e.getAttribute('placeholder') || '') ? '' : (e.getAttribute('placeholder') || '')) + ' ' + (e.tagName === 'TEXTAREA' ? e.textContent : '');
    if (!e.disabled) { hidup.push('lb' + n + ' ' + e.tagName); }
    if (e.getAttribute('value')) { isian.push('lb' + n + ' value=' + e.getAttribute('value')); }
    if (e.tagName === 'SELECT' && e.options.length > 1) { isian.push('lb' + n + ' select punya ' + e.options.length + ' opsi'); }
  });
  TOKEN_CONTOH[n].forEach(function (tok) {
    if (new RegExp('(?<![A-Za-z0-9])' + esc(tok) + '(?![A-Za-z0-9])').test(teks)) { bocor.push('lb' + n + ': "' + tok + '"'); }
  });
  var sisa = teks;
  LINDUNGI.forEach(function (re) { sisa = sisa.replace(re, ' '); });
  if (n !== '34') { var m = sisa.match(/\d+/g); if (m) { angka.push('lb' + n + ': ' + m.slice(0, 5).join(',')); } }
});
ok(ada + ' layar baru diperiksa (semua ada di markup)', ada === nomor.length);
ok('TIDAK ada teks/angka contoh dari mockup di layar baru' + (bocor.length ? ' -> ' + bocor.slice(0, 12).join(' | ') : ''), bocor.length === 0);
ok('tidak ada angka sama sekali di layar baru selain pola label (Langkah N dari N, <1 jam, 1 minggu/1 bulan; keypad 34)' + (angka.length ? ' -> ' + angka.slice(0, 8).join(' | ') : ''), angka.length === 0);
ok('tidak ada nilai isian awal dan dropdown hanya satu opsi' + (isian.length ? ' -> ' + isian.slice(0, 6).join(' | ') : ''), isian.length === 0);
ok('semua kontrol isian (input, textarea, select) di layar baru NONAKTIF' + (hidup.length ? ' -> ' + hidup.slice(0, 6).join(' | ') : ''), hidup.length === 0);
