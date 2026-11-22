# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/). Penomoran versi mengikuti [SemVer](https://semver.org/lang/id/): `MAJOR.MINOR.PATCH`. Selama versi 0.x, struktur simpanan bisa berubah.

## [Belum dirilis]

### Ditambahkan
- Inti simulasi berbasis individu (`js/sim.js`): dunia prosedural (noise, curah hujan dengan bayangan hujan, suhu, biom, sungai), agen dengan kepribadian (IQ, agresi, Big Five), kebutuhan, pekerjaan, pernikahan, kelahiran, kematian.
- Ekonomi: pangan liar, pertanian dengan faktor air, perdagangan, alokasi pekerjaan berdasarkan utilitas marginal.
- Teknologi: 15 teknologi dengan prasyarat, difusi antar tetangga, penyalinan lewat penaklukan.
- Politik: pemimpin dipilih lewat prestise, kebijakan turun dari sifat pemimpin, perang, gencatan, aliansi, kudeta, pemisahan diri, kolonisasi.
- API alat dewa: kuas medan, memunculkan kelompok, memberi/mencabut teknologi, pangan, paceklik, wabah, hukuman, ubah sifat, angkat pemimpin, bunuh, perang/damai/aliansi.
- Simpan dan muat state (JSON, array bertipe dalam base64).
- Web Worker (`js/worker.js`) dengan protokol snapshot.
- Token desain macOS 27 (`css/tokens.css`).
- Ikon aplikasi (SVG dan PNG) dan skrip pembuatnya (`tools/make_icon.py`).
- Dokumen proyek: `AGENTS.md`, `CHANGELOG.md`, `README.md`, `docs/ROADMAP.md`, `docs/SIMULASI.md`.

### Ditambahkan (UI dan PWA)
- Antarmuka adaptif macOS 27: sidebar, toolbar kaca, kanvas piksel, inspektur (layar lebar); tab bar dan bottom sheet (ponsel dan tablet kecil).
- Peta: medan dengan bayangan relief, sungai, tutupan hutan, wilayah dan batas bangsa, sprite permukiman per era, titik individu, label kota, zoom dan geser (mouse, sentuh, cubit).
- Lapisan: Normal, Biom, Suhu, Hujan, Hutan, Politik.
- Panel skenario: 7 preset, seed, hingga 4 kelompok (jumlah, IQ, agresi, lokasi, pemimpin), penempatan manual lewat peta.
- Alat dewa di UI: kuas medan, munculkan, ubah sifat, angkat pemimpin, matikan, teknologi, pangan, paceklik, wabah, murka, perang, damai, aliansi.
- Inspektur individu, kota, dan bangsa. Peringkat bangsa, grafik populasi, linimasa era, penyebab kematian, log peristiwa.
- Simpan cepat dan otomatis (IndexedDB), ekspor dan impor berkas.
- PWA: `manifest.webmanifest` dan `sw.js`.
- Skrip `tools/shot.py` untuk tangkapan layar uji.

### Diperbaiki
- Token desain: alias `{nama}` yang belum diresolusi di `css/tokens.css` kini menjadi `var(--nama)`.
- **[MODEL]** `pickSpot('sungai')` tidak lagi memilih gurun, tundra, atau gunung sebagai titik awal. Sebelumnya seed 4 punah pada tahun 124. Uji 14 seed, 600 tahun: tidak ada kepunahan pada konfigurasi dua kelompok.
- Preview Worker: koordinat titik awal dihitung berurutan (bug referensi sebelum terisi).

### Diperbaiki (populasi dan koloni)
- **[MODEL]** Tekanan pindah kini memasukkan lapar kronis dan ukuran kelompok (kelompok besar terpecah sebelum daya dukung habis), dan peluang kolonisasi dinaikkan. Sebelumnya kelompok kecil stagnan di 40 sampai 60 jiwa pada satu permukiman tanpa pernah mendirikan koloni.
- **[MODEL]** Perkawinan antar permukiman tetangga (jarak sampai 12 sel, tidak sedang perang). Sebelumnya koloni kecil kehabisan pasangan non-kerabat dan punah (rata-rata hidup sekitar 50 tahun, puncak 6 sampai 12 jiwa).
- Punahnya permukiman kini tercatat di log.
- Hasil uji 14 seed, 600 tahun, satu atau dua kelompok awal: tidak ada kepunahan, populasi mencapai sekitar 1.700 sampai 1.800. Era Neolitik tercapai sekitar tahun 110 sampai 150, Abad Pertengahan sekitar 900 sampai 1350, Era Industri sekitar 2300 sampai 3300. Era Modern belum tercapai dalam 4000 tahun pada 6 seed uji.

### Diubah
- Penomoran urut pada setiap entri log peristiwa (`n`), agar Worker hanya mengirim log baru.

### Diketahui
- Pada pertengahan permainan muncul banyak politas kecil (contoh: 8 politas dan 46 permukiman pada tahun 1500). Perlu ditinjau.
- Variasi hasil antar seed besar (kelompok kecil sering bertahan di sekitar 40 sampai 60 jiwa sebelum pertanian ditemukan). Dianggap wajar, perlu dikaji bila ingin hasil lebih stabil.
- Belum ada bencana alam, kepercayaan, dan mode uji berulang (lihat `docs/ROADMAP.md`).

## Aturan pencatatan

- Setiap perubahan yang terlihat pengguna atau memengaruhi hasil simulasi wajib dicatat.
- Kelompok: Ditambahkan, Diubah, Diperbaiki, Dihapus, Keamanan, Diketahui.
- Perubahan struktur simpanan wajib ditandai **[SIMPANAN]** dan menyebut versi baru.
- Perubahan konstanta model wajib ditandai **[MODEL]** dan menyebut hasil uji lintas seed.
