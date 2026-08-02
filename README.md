# Galastis — Galeri Karya Magang Eksplorasi Data Statistik

Website galeri untuk menampilkan hasil karya mahasiswa magang (infografis, videografis, flyer, mini paper) dengan fitur voting oleh pegawai — tanpa perlu login, tanpa perlu server sendiri. Data disimpan di **Google Sheets**, website di-hosting gratis di **GitHub Pages**.

---

## Struktur Proyek

```
index.html          -> Halaman utama (katalog + voting + leaderboard)
admin.html           -> Halaman admin (tambah karya, seri, pegawai)
logo.ico             -> Logo/favicon situs (tambahkan sendiri file ini di folder ini)
assets/style.css      -> Tampilan (tema biru-hijau-oranye)
assets/app.js         -> Logika halaman utama
assets/app-admin.js   -> Logika halaman admin
apps-script/Code.gs   -> Backend (jembatan ke Google Sheets)
```

> **Penting:** taruh file `logo.ico` kamu tepat di folder ini (sejajar dengan `index.html`), dengan nama file **persis** `logo.ico`. Logo ini otomatis dipakai sebagai favicon tab browser dan logo di header situs (halaman utama & admin).

---

## LANGKAH 1 — Buat Google Spreadsheet

1. Buat Spreadsheet baru di Google Sheets, beri nama misalnya **"Data Galeri Karya Magang"**.
2. Buat 3 sheet (tab) dengan nama dan kolom **persis** seperti ini:

**Sheet "Konten"** (baris pertama = header)
```
ID | Kategori | Seri | Mahasiswa | EmbedLink | Thumbnail
```

**Sheet "Pegawai"**
```
Nama
```
Isi baris-baris di bawahnya dengan daftar nama pegawai BPS Babel (ini yang akan muncul di dropdown voting).

**Sheet "Votes"**
```
Timestamp | NamaPegawai | KaryaID | Kategori
```
Sheet ini dibiarkan kosong (isinya otomatis terisi saat ada yang vote).

---

## LANGKAH 2 — Pasang Backend (Apps Script)

1. Di Spreadsheet tadi, klik **Extensions > Apps Script**.
2. Hapus isi default, lalu copy-paste seluruh isi file `apps-script/Code.gs` dari folder ini.
3. Ganti baris berikut dengan password admin pilihanmu:
   ```js
   const ADMIN_SECRET = "GANTI_PASSWORD_ADMIN_DISINI";
   ```
4. Klik **Deploy > New deployment**.
5. Pilih tipe **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Klik **Deploy**, lalu **izinkan akses** saat diminta (login Google, klik Advanced > Go to project (unsafe) jika muncul warning — ini normal untuk script buatan sendiri).
7. Copy **Web app URL** yang muncul (bentuknya seperti `https://script.google.com/macros/s/XXXXXXX/exec`).

> Catatan: setiap kali kamu **mengubah kode** Code.gs, kamu perlu buat deployment baru (Deploy > Manage deployments > Edit > New version) supaya perubahan aktif.

---

## LANGKAH 3 — Hubungkan Website ke Backend

1. Buka `assets/app.js`, ganti baris:
   ```js
   const API_URL = "GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT";
   ```
   dengan URL Web App dari Langkah 2.

2. Buka `assets/app-admin.js`, ganti baris yang sama juga dengan URL yang sama.

3. Password admin yang kamu masukkan di halaman admin (admin.html) harus **sama persis** dengan `ADMIN_SECRET` di Code.gs.

---

## LANGKAH 4 — Deploy ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `galeri-karya-magang`.
2. Upload semua file & folder di proyek ini ke repository tersebut (via web upload, GitHub Desktop, atau `git push`).
3. Di repository, buka **Settings > Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu **Save**.
5. Tunggu 1-2 menit, GitHub akan memberi URL seperti:
   `https://namamu.github.io/galeri-karya-magang/`
6. Website siap dibagikan ke pegawai BPS Babel. Halaman admin ada di `.../admin.html`.

---

## Cara Kerja Fitur

- **Katalog karya**: sidebar kiri berisi 4 kategori (Infografis, Videografis, Flyer, Mini Paper) dengan ikon. Karya dikelompokkan otomatis per "Seri" sesuai yang admin input.
- **Lihat karya penuh**: klik kartu karya → muncul modal dengan embed Google Drive (iframe `/preview`), otomatis dikonversi dari link share biasa.
- **Voting**: di dalam modal, pegawai pilih namanya dari dropdown (diisi admin lewat sheet "Pegawai" atau form admin), lalu klik "Vote Karya Ini". Sistem mencegah nama yang sama vote 2x untuk karya yang sama.
- **Leaderboard**: diklik dari sidebar, menampilkan ranking karya berdasar jumlah vote, dihitung otomatis dari sheet "Votes".
- **Admin**: buka `admin.html`, masukkan password, lalu bisa menambah karya baru (pilih kategori + seri bebas + tempel link Drive), menambah nama pegawai, dan menghapus karya.

### Tips link Google Drive
Gunakan link "Anyone with the link can view" dari Drive. Untuk file (gambar/video/PDF), tempel link biasa seperti:
`https://drive.google.com/file/d/ID_FILE/view?usp=sharing`
— sistem otomatis mengubahnya jadi versi embed (`/preview`).

---

## Keamanan (penting dibaca)

Sistem admin ini menggunakan password sederhana yang dicek di sisi server (Apps Script), bukan sistem login penuh. Ini cukup aman untuk pemakaian internal kantor asalkan:
- Password admin tidak dibagikan sembarangan.
- Link `admin.html` tidak disebar ke publik luas.

Jika ingin keamanan lebih tinggi di kemudian hari, backend bisa ditingkatkan dengan autentikasi Google (misalnya membatasi hanya akun @bps.go.id yang bisa akses admin).

---

## Ubah Tema Warna

Semua warna diatur di bagian atas `assets/style.css` (variabel `--biru`, `--hijau`, `--oren`, dst) — tinggal ganti kode hex-nya jika ingin menyesuaikan.
