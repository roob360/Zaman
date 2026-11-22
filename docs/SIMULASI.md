# Referensi Model Simulasi

Dokumen ini mencatat rumus, konstanta, dan asumsi di `js/sim.js`. Perbarui setiap kali model berubah. Angka di sini adalah **parameter model yang dikalibrasi agar perilaku masuk akal**, bukan data ilmiah terukur, kecuali ditandai lain.

## 1. Skala
- Dunia 128 x 96 sel. 1 tick = 1 tahun. Kapasitas agen default sekitar 2000.

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

## 8. Hasil kalibrasi terakhir
- Seed uji 3000 sampai 9000 tahun: era modern tercapai sekitar tahun 3.6 ribu sampai 7.6 ribu, populasi 1300 sampai 1650.
- Kecepatan Node: sekitar 1.1 ribu tahun per detik (3000 tahun dalam 2.7 detik, populasi 1764).
- Skenario gurun tanpa air sama sekali: kepunahan karena haus (disengaja).

## 9. Asumsi yang belum divalidasi
- Semua konstanta di atas. Validasi terhadap data historis belum dilakukan.
