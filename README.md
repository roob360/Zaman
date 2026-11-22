# Zaman

Simulator peradaban berbasis individu di peta 2D piksel. Mirip WorldBox, tetapi logikanya dibuat serealistis mungkin agar bisa dipakai menguji skenario (misalnya: orang berIQ tinggi di area gersang).

Status: dalam pengembangan (lihat `CHANGELOG.md` dan `docs/ROADMAP.md`).

## Fitur
- Sekitar 2000 individu dengan kepribadian, kebutuhan, pekerjaan, pernikahan, dan keputusan sendiri.
- Pemimpin menentukan arah negara, perang muncul dari sifat individu dan pemimpin.
- Kota berkembang otomatis dari primitif sampai modern menurut populasi dan teknologi.
- Alat dewa, simpan dan muat.
- Tahap berikutnya: bencana alam berbasis sebab, kepercayaan yang muncul sendiri, mode uji berulang.

## Menjalankan
Lokal: `python3 -m http.server 8000` lalu buka `http://localhost:8000`.

## Menayangkan di GitHub Pages
1. Buat repositori publik di GitHub, unggah seluruh isi folder ini.
2. Settings, Pages, Source: pilih branch `main` dan folder `/ (root)`.
3. Tunggu beberapa menit, alamat: `https://<nama-akun>.github.io/<nama-repo>/`.
4. Di HP atau tablet, buka alamat itu lalu pilih "Tambahkan ke layar utama" untuk memasang sebagai aplikasi.

## Dokumen
- `AGENTS.md`: panduan pengembang dan AI agent.
- `CHANGELOG.md`: riwayat perubahan.
- `docs/SIMULASI.md`: referensi model.
- `docs/ROADMAP.md`: rencana tahap.
