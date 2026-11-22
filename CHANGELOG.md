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

### Diubah
- Penomoran urut pada setiap entri log peristiwa (`n`), agar Worker hanya mengirim log baru.

### Diketahui
- Pada pertengahan permainan muncul banyak politas kecil (contoh: 8 politas dan 46 permukiman pada tahun 1500). Perlu ditinjau.
- Belum ada UI, PWA, bencana alam, kepercayaan, dan mode uji berulang (lihat `docs/ROADMAP.md`).

## Aturan pencatatan

- Setiap perubahan yang terlihat pengguna atau memengaruhi hasil simulasi wajib dicatat.
- Kelompok: Ditambahkan, Diubah, Diperbaiki, Dihapus, Keamanan, Diketahui.
- Perubahan struktur simpanan wajib ditandai **[SIMPANAN]** dan menyebut versi baru.
- Perubahan konstanta model wajib ditandai **[MODEL]** dan menyebut hasil uji lintas seed.
