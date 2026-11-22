# AGENTS.md

Panduan untuk AI agent (Claude Code, Codex, dan sejenisnya) dan pengembang yang melanjutkan proyek ini. Baca seluruh file ini sebelum mengubah kode.

## 1. Ringkasan proyek

- Nama kerja: **Zaman** (simulator peradaban, mirip WorldBox tetapi berbasis logika dunia nyata).
- Tujuan: menguji skenario ("orang pintar di area gersang", dan lain-lain) dengan simulasi berbasis individu yang sedekat mungkin dengan logika dan hukum sains.
- Platform: web app statis (HTML, CSS, JavaScript murni). Tanpa server, tanpa build tool, tanpa framework. Dihosting di GitHub Pages, bisa dipasang sebagai PWA di HP dan tablet.
- Bahasa antarmuka dan dokumen: Bahasa Indonesia profesional.
- Desain antarmuka: sistem desain macOS 27 milik pemilik proyek (token di `css/tokens.css`, sumber di `tokens.src.json` dan `ds.src.json`).

## 2. Struktur folder

| Path | Isi |
|---|---|
| `index.html` | Titik masuk aplikasi |
| `css/tokens.css` | Token desain (DIHASILKAN dari `tokens.src.json`, jangan edit manual) |
| `css/app.css` | Gaya aplikasi (tata letak lebar dan ponsel) |
| `js/sim.js` | Inti simulasi (dunia, agen, ekonomi, teknologi, perang, politik, god API, serialisasi) |
| `js/worker.js` | Web Worker: menjalankan simulasi dan mengirim snapshot ke UI |
| `js/ui.js` | Antarmuka, kanvas, alat dewa, simpan/muat |
| `icons/` | Ikon aplikasi (dihasilkan oleh `tools/make_icon.py`) |
| `tools/` | Skrip bantu (ikon, tes) |
| `docs/SIMULASI.md` | Referensi model simulasi (rumus, konstanta, asumsi) |
| `docs/ROADMAP.md` | Tahap pengembangan A sampai D dan seterusnya |
| `CHANGELOG.md` | Riwayat perubahan |
| `manifest.webmanifest`, `sw.js` | PWA |

## 3. Aturan teknis (wajib)

1. **Tanpa dependensi dan tanpa build.** Semua file bisa dibuka langsung. Jangan menambah npm, bundler, atau CDN.
2. **Inti simulasi harus deterministik.** Semua keacakan lewat RNG bersemi (seeded) di `sim.js`. Dilarang memakai `Math.random()` di dalam simulasi (boleh di UI untuk hal kosmetik).
3. **Inti simulasi tidak boleh menyentuh DOM.** `sim.js` berjalan di Worker dan di Node (untuk tes). Hanya `globalThis.WorldSim` yang diekspor.
4. **Komunikasi UI dan Worker lewat pesan** (lihat `worker.js`). Array besar dikirim sebagai transferable. UI wajib mengirim `ack` setelah menggambar snapshot.
5. **Simpan/muat harus tetap kompatibel.** Setiap perubahan struktur state wajib: (a) menaikkan `SAVE_VERSION`, (b) menambah migrasi atau menolak versi lama dengan pesan jelas, (c) dicatat di CHANGELOG.
6. **1 tick = 1 musim, 4 tick = 1 tahun.** Proses lambat (pekerjaan, migrasi, ekspansi, diplomasi, perang, politik, pernikahan, penuaan) berjalan sekali setahun pada musim ke-4. Proses musiman (produksi, konsumsi, lapar, kelahiran, kematian) berjalan tiap tick dengan laju dibagi empat. Jangan mengubah skala waktu tanpa menyesuaikan seluruh laju.
7. **Responsif.** Setiap fitur UI baru harus berfungsi di layar lebar (sidebar, toolbar, inspektur) dan ponsel (bottom sheet, tab bar). Target sentuh minimal 44 px di ponsel.
8. **Hormati `prefers-reduced-motion` dan tema gelap/terang.** Pakai variabel CSS dari token, bukan warna tertanam.
9. **Aksesibilitas dasar:** elemen interaktif punya label, fokus terlihat, kontras sesuai token.

## 4. Gaya penulisan (kode, komentar, dokumen)

- Bahasa Indonesia profesional, ringkas, langsung ke inti.
- **Jangan memakai tanda pisah panjang (em dash).** Gunakan titik, koma, titik dua, atau tanda kurung.
- Istilah yang punya padanan resmi (SNI, regulasi): pakai bahasa Indonesia. Istilah teknologi yang lazim (variable, function, commit, deploy): tetap Inggris.
- Nama variabel dalam kode boleh campuran, tetapi ikuti gaya file yang sudah ada.
- Komentar menjelaskan **alasan**, bukan mengulang apa yang kode lakukan.

## 5. Cara menjalankan dan menguji

- Jalankan lokal: sajikan folder dengan server statis apa pun (contoh `python3 -m http.server 8000`), lalu buka `http://localhost:8000`. Service worker dan Worker tidak jalan dari `file://`.
- Tes inti (Node): `node tools/test_core.js` (ketahanan populasi, simpan/muat, alat dewa). Jalankan sebelum dan sesudah mengubah `sim.js`.
- Tes sehat jangka panjang: `node tools/test_long.js 5 6000` (seed, jumlah tahun). Periksa: populasi tidak punah tanpa sebab, era modern tercapai pada skenario normal, tidak ada NaN.
- Tangkapan layar UI: Playwright (Python) di `tools/shot.py`.

## 6. Prinsip realisme (jangan dilanggar)

- Perilaku muncul dari aturan individu, bukan skrip. Dilarang menambah "jika tahun X maka perang".
- Setiap efek punya sebab terukur (contoh: banjir dari tutupan hutan rendah dan curah hujan, bukan acak murni).
- Perubahan konstanta harus diuji lintas banyak seed dan dicatat di `docs/SIMULASI.md` beserta alasannya.
- Jika tidak yakin dengan angka ilmiah, tandai sebagai asumsi di `docs/SIMULASI.md`. Jangan mengarang referensi.

## 6a. Hal yang sengaja TIDAK dibuat

Ras fantasi, 3D atau isometrik, aplikasi Android/PC native, multiplayer, suara, agen hewan terpisah, server, database, akun pengguna.

## 7. Alur kerja untuk perubahan

1. Baca `docs/ROADMAP.md` dan `docs/SIMULASI.md`.
2. Ubah sekecil mungkin. Satu perubahan, satu tujuan.
3. Jalankan tes inti dan tes jangka panjang.
4. Perbarui `CHANGELOG.md` (bagian `Belum dirilis`).
5. Jika menyentuh model, perbarui `docs/SIMULASI.md`.
6. Commit dengan pesan jelas (format di bawah).

Format commit: `jenis: ringkasan singkat` dengan jenis `fitur`, `perbaikan`, `model`, `ui`, `dokumen`, `refaktor`, `tes`.

## 8. Preferensi pemilik proyek

- Untuk tugas besar: uraikan, pahami, diskusikan, susun rencana, minta konfirmasi, baru eksekusi.
- Kerjakan hanya yang diminta. Temuan atau saran disampaikan di chat, bukan ditambahkan ke dokumen tanpa diminta.
- Jangan membenarkan secara otomatis. Pemilik proyek meminta ide yang keliru didebat.
- Kalau ragu soal angka atau fakta, katakan tidak yakin.
