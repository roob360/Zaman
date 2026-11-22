# Referensi Model Simulasi

Dokumen ini mencatat rumus, konstanta, dan asumsi di `js/sim.js`. Perbarui setiap kali model berubah. Angka di sini adalah **parameter model yang dikalibrasi agar perilaku masuk akal**, bukan data ilmiah terukur, kecuali ditandai lain.

## 1. Skala dan waktu
- Dunia 128 x 96 sel. 1 tick = 1 musim, 4 tick = 1 tahun (`S.year` bertambah di musim pertama, `S.season` 0 sampai 3, `S.tick` hitungan total). `S.stepYear()` menjalankan 4 tick.
- Musim mengikuti lintang (`SEAS` di `sim.js`): tropis = awal hujan, puncak hujan, awal kemarau, puncak kemarau. Sedang = semi, panas, gugur, dingin. Kutub = musim tanam pendek. Belahan selatan bergeser 2 fase.
- Porsi panen tahunan jatuh pada fase tertentu (contoh sedang: 0, 0.15, 0.75, 0.10). Pangan liar dan pertumbuhan stoknya dikali bobot musiman. Cuaca panen (`wth`) diundi sekali per tahun per permukiman.
- Musim dingin di lintang tinggi menaikkan kebutuhan pangan sampai 30 persen (asumsi, belum divalidasi).
- Proses cepat per musim dengan laju dibagi empat: produksi, konsumsi, lapar (naik 0.6 x (1 - rasio) x bobot dibagi 4, turun 0.35 dibagi 4), kematian (hazard tahunan diubah menjadi `1-(1-q)^(1/4)`), kelahiran (jarak minimal 3 musim antar kelahiran). Wabah berlaku satu musim dengan peluang tahunan dibagi empat.
- Proses lambat sekali setahun di musim ke-4: penuaan, pernikahan, migrasi, ekspansi, diplomasi, perang, politik, pencatatan. Penugasan pekerjaan di musim pertama.
- Ketahanan pangan `fs` dihitung tahunan: (persediaan awal tahun + produksi tahun itu) dibagi kebutuhan setahun, dihaluskan 0.6 / 0.4. Kapasitas agen default sekitar 2000.

## 2. Dunia
- Ketinggian: fbm value noise. Permukaan laut ditentukan lewat kuantil.
- Curah hujan: adveksi angin dari laut, berkurang di lee gunung (bayangan hujan).
- Suhu: fungsi lintang dan ketinggian.
- Biom: aturan mirip diagram Whittaker (suhu x curah hujan), salju bila nilai tinggi (> 0.86), gunung bila (> 0.68).
- Sungai: ditelusuri menurut penurunan terjal. Jarak ke sungai dihitung dengan BFS.
- Tutupan hutan (`cover`) memengaruhi pangan liar, kesuburan, dan (tahap B) banjir.

## 3. Pangan
- Pangan liar: stok logistik per sel. Panen dibatasi 0.2 x stok. Pencari pangan menghasilkan 2.3 x (0.3 + 0.7 x stok/kapasitas).
- Pertanian: hasil dasar 2.4, dikali faktor air (irigasi, sumur, tenaga) dan modal alat.

## 4. Demografi
- Kelahiran: `0.42 x kesuburan x clamp((fs - 0.8)/0.4, 0, 1) x (1 - lapar) x faktor usia x faktor kapasitas`. Kelahiran dibatasi keamanan pangan.
- Kematian: Gompertz `0.0004 x exp(0.088 x usia)` ditambah 0.05 untuk usia < 5, dikali pengali medis. Ditambah kematian lapar, haus, wabah, perang.
- Perkawinan menghindari kerabat dekat (cek `momId`/`dadId`). `fam` adalah rumah tangga inti.
- Kapasitas air: `140 x akses minum`, dikali sumur 2, jalan 1.5, listrik 2, sanitasi 2.

## 4a. Pekerjaan
- Enam pekerjaan: pencari pangan, petani, pengrajin, pedagang, prajurit, cendekia. Alokasi lewat utilitas marginal dengan sinyal harga pangan. Pengrajin dibatasi 12 persen dewasa.

## 5. Teknologi
- 15 teknologi dengan prasyarat dan syarat populasi. Pengetahuan bertambah `0.45 x knowAdd x pengali x (1 + 0.04 x min(10, kontak))`. Faktor 0.45 menahan laju agar era modern tidak tercapai terlalu cepat.
- Pilihan target dipengaruhi sifat pemimpin. Difusi antar tetangga. Salin saat penaklukan.

## 6. Politik dan perang
- Pemimpin dipilih lewat prestise. Kebijakan (porsi prajurit, ekspansi, kompetisi) turun dari sifat pemimpin.
- Deklarasi perang: sigmoid dari rasio kekuatan, agresi pemimpin, kebutuhan, dendam. Pertempuran dengan bobot jarak. Kelelahan perang memicu gencatan. Aliansi.
- Stabilitas rendah memicu kudeta atau pemisahan diri.

## 7. Simpan/muat
- State JSON. Array bertipe dalam base64. Agen disimpan sebagai 27 angka: `[id,age,sex,iq,ag,o,c,e,a,n,job,hunger,thirst,fam,momId,dadId,sat,sid,partnerId,jx,jy,sk0..sk5]`.
- Sifat dibulatkan saat disimpan, jadi hasil setelah muat bisa menyimpang tipis dari run tanpa simpan. Ini diterima.

## 7a. Ekspansi dan perkawinan
- Tekanan pindah = maks(1 - fs, 1.5 x haus, pop/softCap - 0.7, pop/kapasitas air - 0.6, 2.2 x lapar rata-rata, pop/(0.5 x softCap) - 0.8). Koloni bila tekanan > 0.15, pop >= 20, 10 tahun sejak koloni terakhir, peluang min(0.5, 3 x ekspansi x (0.4 + tekanan)).
- Perkawinan: utamakan pasangan sekelompok. Bila tidak ada yang cocok (kerabat atau selisih umur > 12), cari di permukiman tetangga sampai 12 sel (bukan musuh). Perempuan pindah ke permukiman suami.

## 8. Hasil kalibrasi terakhir
- Uji 6 seed, 3000 tahun, satu kelompok 80 jiwa: Neolitik tahun 113 sampai 175, Zaman Kuno 331 sampai 700, Abad Pertengahan 800 sampai 1340, Era Industri 2200 sampai 2900 (4 dari 6 seed). Era Modern belum tercapai. Populasi 1700 sampai 1850, 1 sampai 4 bangsa.
- Kecepatan Node: 3000 tahun sekitar 9 sampai 13 detik (12 ribu tick).
- Pola musiman pada kelaparan masih lemah: stok pangan liar bertindak sebagai penyangga sehingga puncak lapar per musim belum terlihat jelas. Perlu ditinjau bila ingin paceklik musiman lebih nyata.
- Skenario gurun tanpa air sama sekali: kepunahan karena haus (disengaja).

## 9. Asumsi yang belum divalidasi
- Semua konstanta di atas. Validasi terhadap data historis belum dilakukan.
