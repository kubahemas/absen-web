// Pembersih layar baru (dijalankan DI DALAM Edge tanpa kepala oleh tools/bangun_layar_baru.sh; hasilnya disalin ke index.html).
// Tugas: dari blok HTML hasil tools/mockup_ke_layar.pl -> (1) buang SEMUA angka/nama/tanggal/teks contoh dari mockup ("–"), baris tabel/daftar dibuang,
// (2) semua kontrol isian dinonaktifkan, (3) semua tombol aksi dinonaktifkan "Segera"; hanya Kembali/Home/Tutup/Batal dan navigasi yang ditetapkan berfungsi.
// Tidak ada panggilan server dan tidak ada teks baru selain pola "Segera".
var NAMA = ['Budi Santoso', 'Dewi Lestari', 'Rina Wati', 'Siti Rohmah', 'Ahmad Fauzi', 'Andi Pratama', 'Joko Susilo', 'Sari Utami', 'Dimas Saputra', 'Wulan Sari', 'Tono Wibowo',
  'Budi', 'Dewi', 'Rina', 'Siti', 'Ahmad', 'Andi', 'Joko', 'Sari', 'Dimas', 'Wulan', 'Tono', 'Ari', 'Dina', 'EMP012', 'K003', 'K005', 'HP Toko 1', 'HP Toko 2', 'Ngawi', 'Pusat', 'NGW', 'Madiun'];
var FRASA = ['Salah tekan IYA saat pengenalan wajah', 'Antar ibu ke dokter pagi', 'Pernikahan di Madiun', 'Kendaraan bermasalah', 'Melayani pelanggan', 'HP toko lambat', 'Kendala sistem', 'Koreksi jam', 'Salah tekan',
  'Pemasangan', 'Stok opname', 'bongkar muat', 'penataan barang', 'pemasangan', 'renovasi toko', 'Demam', 'Macet', 'Hujan', 'Pagi', 'Siang', 'service'];
var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Agu', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
var RE_NAMA = new RegExp('(?<![A-Za-z])(' + NAMA.concat(FRASA).sort(function (a, b) { return b.length - a.length; }).map(esc).join('|') + ')(?![A-Za-z])', 'g');
var RE_BULAN = new RegExp('(?<![A-Za-z])(' + BULAN.join('|') + ')(?![A-Za-z])', 'g');
var RE_ANGKA = /\d+(?:[.,:\/]\d+)*(?:\s*[–-]\s*\d+(?:[.,:\/]\d+)*)*%?/g;
var LINDUNGI = [/Langkah \d dari \d/g, /[<>]\s?\d(?:–\d)? jam/g, /\b\d (?:minggu|bulan)\b/g, /\b[1-3]–?\d? jam\b(?=\s*$)/g];
var AKSI = /(Simpan|SIMPAN|Kirim|KIRIM|ACC|Tolak|Setuju|Pindahkan|Tukar|YA|IYA|Ulangi|ULANGI|Ganti foto|Update foto|Ekspor|Kunci|Salin|Tambah|^\+|Hapus|Revisi|MENGERTI|BUKAN SAYA|Foto ulang|Bukan milik|Surat tidak sah)/;
var KEMBALI = /^(‹|‹ Back|‹ Kembali|Kembali|Home|Tutup|Batal|Batal, kembali ke layar utama|Batal pendaftaran.*)$/;
function bersihTeks(t, simpanAngka) {
  var simpan = [];
  LINDUNGI.forEach(function (re) { t = t.replace(re, function (m) { simpan.push(m); return '\u0001' + String.fromCharCode(96 + simpan.length) + '\u0002'; }); });
  t = t.replace(RE_NAMA, '–').replace(RE_BULAN, '–');
  if (!simpanAngka) { t = t.replace(RE_ANGKA, '–'); }
  t = t.replace(/–(?:\s+–)+/g, '–').replace(/–(?:\s*[·,]\s*–)+/g, '–');
  t = t.replace(/\u0001([a-z])\u0002/g, function (_, i) { return simpan[i.charCodeAt(0) - 97]; });
  return t;
}
function teksLangsung(el) { var s = ''; el.childNodes.forEach(function (n) { if (n.nodeType === 3) { s += n.nodeValue; } }); return s.replace(/\s+/g, ' ').trim(); }
function semuaElemen(root) { return Array.prototype.slice.call(root.querySelectorAll('*')); }
function tanda(el) { return el.tagName + '|' + (el.getAttribute('style') || ''); }
function cariPenanda(root, marker) {
  var re = marker instanceof RegExp ? marker : null;
  return semuaElemen(root).filter(function (e) { var s = teksLangsung(e); return re ? re.test(s) : s === marker; })[0] || null;
}
function naikKeBaris(el, root) {
  var x = el;
  while (x.parentElement && x.parentElement !== root) {
    var sdr = Array.prototype.filter.call(x.parentElement.children, function (c) { return tanda(c) === tanda(x); });
    if (sdr.length >= 2) { return x; }
    x = x.parentElement;
  }
  return null;
}
function hapusBaris(root, marker) {
  var e = cariPenanda(root, marker); if (!e) { return false; }
  var baris = naikKeBaris(e, root); if (!baris) { return false; }
  var t = tanda(baris), induk = baris.parentElement;
  Array.prototype.slice.call(induk.children).forEach(function (c) { if (tanda(c) === t) { c.remove(); } });
  return true;
}
function hapusSatu(root, marker) {
  var e = cariPenanda(root, marker); if (!e) { return false; }
  var baris = naikKeBaris(e, root) || e; baris.remove(); return true;
}
function hapusTeks(root, re) { var n = 0; semuaElemen(root).forEach(function (e) { if (e.isConnected && re.test(teksLangsung(e))) { e.remove(); n++; } }); return n; }
function pudar(root, re) { semuaElemen(root).forEach(function (e) { if (re.test(teksLangsung(e))) { e.classList.add('belum-aktif'); if (e.parentElement && e.parentElement.children.length <= 3 && e.parentElement !== root) { e.parentElement.classList.add('belum-aktif'); } } }); }
// Teks tren/kalimat pengganti "–": warna abu netral (keputusan pemilik 2026-10-07); bukan hijau/merah.
function netralkan(e) {
  var st = e.getAttribute('style') || '';
  e.style.color = 'var(--abu-teks)';
  if (/border/.test(st)) { e.style.borderColor = 'var(--abu-teks)'; }
  if (/background/.test(st)) { e.style.background = 'var(--krem)'; }
}
function bersih(nomor, cfg) {
  var root = document.getElementById('x' + nomor);
  var log = [];
  cfg = cfg || {};
  root.id = 'lb' + nomor;
  // id/for unik per layar
  root.querySelectorAll('[id]').forEach(function (e) { if (e !== root) { e.id = 'lb' + nomor + '_' + e.id; } });
  root.querySelectorAll('label[for]').forEach(function (e) { e.setAttribute('for', 'lb' + nomor + '_' + e.getAttribute('for')); });
  root.querySelectorAll('tbody').forEach(function (b) { b.innerHTML = ''; });
  (cfg.hapusBaris || []).forEach(function (m) { if (!hapusBaris(root, m)) { log.push('GAGAL hapusBaris ' + m); } });
  (cfg.hapusSatu || []).forEach(function (m) { if (!hapusSatu(root, m)) { log.push('GAGAL hapusSatu ' + m); } });
  (cfg.hapusTeks || []).forEach(function (re) { if (!hapusTeks(root, re)) { log.push('GAGAL hapusTeks ' + re); } });
  // teks
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), tn = [];
  while (walker.nextNode()) { tn.push(walker.currentNode); }
  tn.forEach(function (n) {
    var v = n.nodeValue; if (!v.trim()) { return; }
    var induk = n.parentElement;
    var tombolAngka = cfg.tombolAngka && /^\d$/.test(v.trim());
    if (tombolAngka) { return; }
    n.nodeValue = bersihTeks(v, false);
  });
  (cfg.ganti || []).forEach(function (p) { semuaElemen(root).forEach(function (e) { e.childNodes.forEach(function (n) { if (n.nodeType === 3 && p[0].test(n.nodeValue)) { n.nodeValue = n.nodeValue.replace(p[0], p[1]); if (p[2]) { netralkan(e); } if (p[3]) { e.classList.add('belum-aktif'); } } }); }); });
  if (cfg.fn) { cfg.fn(root, log); }
  if (cfg.pudar) { cfg.pudar.forEach(function (re) { pudar(root, re); }); }
  // kontrol isian
  root.querySelectorAll('input, textarea, select').forEach(function (e) {
    e.disabled = true; var v0 = e.getAttribute('value') || ''; e.removeAttribute('value'); e.removeAttribute('checked');
    if (/^(Cari|Ketik)|\.\.\.$/.test(v0)) { e.setAttribute('placeholder', bersihTeks(v0, false)); }
    if (e.tagName === 'TEXTAREA') { e.textContent = ''; }
    if (e.tagName === 'SELECT') { while (e.options.length > 1) { e.remove(1); } if (e.options[0]) { e.options[0].textContent = bersihTeks(e.options[0].textContent, false); e.options[0].removeAttribute('selected'); } }
    e.classList.add('belum-aktif');
  });
  // tombol
  var hitung = {};
  root.querySelectorAll('button, a').forEach(function (b) {
    var teks = (b.textContent || '').replace(/\s+/g, ' ').trim();
    var aria = b.getAttribute('aria-label') || '';
    if (b.tagName === 'A') { b.removeAttribute('href'); }
    hitung[teks] = (hitung[teks] || 0) + 1;
    var kunci = teks + '#' + (hitung[teks] - 1);
    var nav = cfg.nav && (cfg.nav[kunci] || cfg.nav[teks]);
    if (nav) {
      if (nav.ke) { b.setAttribute('data-lb-ke', nav.ke); } if (nav.ganti) { b.setAttribute('data-lb-ganti', '1'); } if (nav.aksi) { b.setAttribute('data-lb-aksi', nav.aksi); }
      b.setAttribute('type', 'button'); return;
    }
    if (aria === 'Kembali' || KEMBALI.test(teks)) { b.setAttribute('data-lb-kembali', /^Home$/.test(teks) ? 'home' : (/layar utama/.test(teks) ? 'utama' : 'kembali')); b.setAttribute('type', 'button'); return; }
    b.setAttribute('type', 'button'); b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.classList.add('belum-aktif');
    if ((AKSI.test(teks) || cfg.semuaSegera) && !(cfg.tanpaSegera && cfg.tanpaSegera.test(teks)) && !b.querySelector('.segera') && teks.length && teks.length < 60) {
      var s = document.createElement('span'); s.className = 'segera'; s.style.marginLeft = '6px'; s.textContent = 'Segera'; b.appendChild(s);
    }
  });
  root.setAttribute('data-lb-home', cfg.home || '');
  if (cfg.judulMode) { root.setAttribute('data-lb-judul-mode', '1'); }
  return log;
}
