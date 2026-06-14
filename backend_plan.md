# Rancangan Backend & Database Gratis 100% (B2C Aqiqah & Qurban)

Dokumen ini merancang arsitektur backend dan database gratis 100% untuk website **SAE Aqiqah (B2C)** yang dideploy di **Vercel** dan disimpan di **GitHub**.

---

## 1. Opsi A: Google Sheets sebagai CMS (Sangat Direkomendasikan)

Metode ini menggunakan Google Sheets sebagai database. Pemilik bisnis (Anda) cukup mengedit spreadsheet di HP/Laptop, dan harga di website akan terupdate otomatis secara real-time.

### Cara Kerja Arsitektur:
```
[ Google Sheets (Database) ] 
       │ (Publish as CSV)
       ▼
[ Fetch API di main.js ] ──► [ Render ke HTML (Tabel Harga) ]
```

### Langkah Setup:
1. **Buat Spreadsheet Baru:**
   Buat Google Sheet dengan kolom berikut:
   *   `id` (A, B, C, D, E, kg-jantan, kg-bundle, dll)
   *   `name` (Nama Paket, contoh: Paket A)
   *   `basePrice` (Harga Katering Saja, contoh: 2000000)
   *   `priceWithNasi` (Harga Paket Nasi Kotak, contoh: 2480000)
   *   `description` (Detail paket, contoh: Sate 200 + Gule 40P)

2. **Publish ke Web:**
   *   Di Google Sheets, klik **File** > **Share** > **Publish to web**.
   *   Pilih opsi **Link**, pilih sheet yang sesuai, lalu ganti formatnya menjadi **Comma-separated values (.csv)**.
   *   Salin tautan URL yang diberikan.

3. **Integrasi Javascript (`js/main.js`):**
   Ganti fungsi `loadPrices()` di Javascript Anda untuk mengambil data langsung dari URL CSV tersebut:
   ```javascript
   const GOOGLE_SHEET_CSV_URL = "URL_PUBLISH_GOOGLE_SHEETS_ANDA";

   function loadPrices() {
       fetch(GOOGLE_SHEET_CSV_URL)
           .then(res => res.text())
           .then(csvText => {
               const data = parseCSV(csvText);
               updateDOMWithPrices(data);
           })
           .catch(err => console.error("Gagal memuat harga dari Google Sheets:", err));
   }

   function parseCSV(text) {
       const lines = text.split("\n");
       const headers = lines[0].split(",");
       const result = [];
       for (let i = 1; i < lines.length; i++) {
           if (!lines[i]) continue;
           const obj = {};
           const currentline = lines[i].split(",");
           for (let j = 0; j < headers.length; j++) {
               obj[headers[j].trim()] = currentline[j].trim();
           }
           result.push(obj);
       }
       return result;
   }
   ```

---

## 2. Opsi B: Supabase (PostgreSQL Database Gratis)

Menggunakan database relational Supabase. Anda dapat membuat halaman admin terproteksi kata sandi di website Anda sendiri untuk mengedit harga.

### Cara Kerja Arsitektur:
```
[ Halaman Admin (/admin) ] ──► [ Supabase REST API ]
                                       │ (Simpan/Edit)
                                       ▼
[ Database Supabase ] ◄────────[ Ambil Harga ] ◄─── [ Website Pengunjung ]
```

### Langkah Setup:
1. **Buat Akun Supabase:**
   *   Daftar gratis di [supabase.com](https://supabase.com/).
   *   Buat project baru dan buat tabel bernama `aqiqah_prices` dengan skema kolom:
       *   `id` (text, primary key)
       *   `name` (text)
       *   `base_price` (integer)
       *   `price_with_nasi` (integer)
       *   `description` (text)

2. **Buat Halaman Admin di Website (`web-produkaqiqah/admin/`):**
   *   Buat `admin/login.html` dan `admin/dashboard.html` di website Anda.
   *   Gunakan **Supabase Auth** gratis untuk memproteksi halaman ini agar hanya Anda yang bisa login.
   *   Di dashboard, tampilkan form input untuk mengubah harga dasar dan harga nasi kotak pada setiap ID paket.
   *   Ketika tombol "Simpan" diklik, kirim query `UPDATE` ke database Supabase via SDK JS resmi.

3. **Ambil Harga di Website Utama:**
   *   Di `js/main.js`, inisialisasi client Supabase dengan API key publik Anda.
   *   Lakukan query untuk menampilkan data harga:
     ```javascript
     async function getPrices() {
         const { data, error } = await supabase
             .from('aqiqah_prices')
             .select('*');
         if (data) {
             updateDOMWithPrices(data);
         }
     }
     ```

---

## 3. Opsi C: Serverless API Vercel + Vercel KV (Redis)

Opsi ini menempatkan database dan endpoint API dalam satu platform Vercel.

### Cara Kerja Arsitektur:
*   Website membaca harga via API `/api/get-prices`.
*   Halaman admin mengirim update harga ke API `/api/update-prices` dengan melampirkan password admin.
*   Data disimpan di **Vercel KV** (database Redis serverless gratis).

### Langkah Setup:
1. **Buat Vercel KV Storage:**
   *   Di dasbor Vercel Anda, masuk ke tab **Storage** dan buat **KV Database** gratis. Hubungkan ke project GitHub website Anda.
2. **Buat Serverless Functions (`/api/`):**
   *   Buat folder `api` di akar direktori web Anda.
   *   Buat file `api/prices.js` untuk mengambil harga dari Vercel KV.
   *   Buat file `api/update.js` untuk menerima input harga baru (dengan validasi token password admin dari environment variable) lalu simpan ke Vercel KV.

---

## 💡 Rekomendasi Pemilihan
Untuk efisiensi operasional harian, **Opsi A (Google Sheets)** adalah yang terbaik. Anda tidak perlu membangun sistem login admin, dan Anda dapat merubah harga kapan saja secara instan melalui aplikasi Google Sheets resmi di Android/iOS Anda tanpa biaya sepeser pun.
