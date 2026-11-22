# Gezenn Portfolio

Website portofolio statis Gezenn, menggunakan HTML, CSS, JavaScript, dan Supabase. Tidak membutuhkan proses build atau `npm install`.

## Struktur proyek

- `index.html` — halaman utama website.
- `style.css` — seluruh styling website.
- `app.js` — interaksi website dan koneksi Supabase.
- `supabase/schema_snapshot.sql` — snapshot skema database, RLS, policy, fungsi, dan bucket. Ini **bukan** hasil `pg_dump` dan bukan skrip yang aman untuk dijalankan ulang langsung.
- `supabase/migrations/` — file migrasi yang tersedia beserta catatan untuk dua migrasi yang SQL aslinya tidak ikut terekspor.
- `standalone/gezenn-portfolio.html` — versi satu file dengan CSS dan JavaScript inline.


## Mengunggah ke GitHub

1. Ekstrak ZIP ini.
2. Buat repository baru bernama `gezenn-portfolio` di GitHub dan pilih **Private**. Jangan centang opsi untuk membuat README, `.gitignore`, atau license baru.
3. Buka terminal pada folder hasil ekstrak, lalu jalankan perintah berikut. Ganti `USERNAME` dengan username GitHub milikmu.

```bash
git init -b main
git add .
git commit -m "Initial commit: Gezenn Portfolio"
git remote add origin https://github.com/USERNAME/gezenn-portfolio.git
git push -u origin main
```

## Menjalankan secara lokal

Buka `index.html` melalui local web server, misalnya ekstensi Live Server di VS Code. Website juga dapat dipublikasikan sebagai static site tanpa build command; document root-nya adalah folder repository ini.

## Supabase dan keamanan

- URL Supabase dan `sb_publishable_...` key berada di `app.js`. Publishable key memang dirancang untuk digunakan di browser; keamanan data tetap harus ditegakkan melalui Row Level Security (RLS), policy, dan konfigurasi Auth yang benar di Supabase.
- Jangan pernah menambahkan `service_role` key, secret key, password admin, atau file `.env` berisi rahasia ke repository. File `.gitignore` sudah mengecualikan file environment.
- Salah satu file migrasi yang tersedia mencantumkan email admin. Gunakan repository **Private** kecuali email tersebut sudah aman untuk dipublikasikan.
- Snapshot SQL hanya dokumentasi kondisi skema dan tidak boleh dianggap sebagai migrasi yang bisa diulang langsung.
- Dua file catatan di `supabase/migrations/` menjelaskan bahwa SQL asli untuk migrasi tersebut tidak tersedia dalam ekspor.

## Catatan kompatibilitas

Ekspor menyebutkan bahwa kode website belum menggunakan beberapa kolom/tabel database yang ada, termasuk `section_styles`, `software_logos`, `video_urls`, `published`, dan `sort_order`. Konfigurasi Supabase Auth juga tidak termasuk dalam ekspor.
