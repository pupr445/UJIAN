# Panduan Setup Detail — Bank Soal CPNS/UTBK
### (100% lewat browser — GitHub + Supabase saja, tanpa terminal)

Sebelumnya saya kasih langkah pakai CLI karena itu cara paling umum di dokumentasi developer.
Tapi Supabase sekarang punya **editor Edge Functions langsung di dashboard**, dan GitHub bisa
terima file lewat **upload di web** — jadi seluruh proses ini bisa selesai tanpa buka terminal sama sekali.

---

## LANGKAH 1 — Buat project Supabase

1.1. Buka [supabase.com](https://supabase.com) → **Sign in** (bisa pakai akun GitHub).
1.2. Klik **New Project**.
1.3. Isi:
   - **Name**: `bank-soal-app` (bebas)
   - **Database Password**: buat password kuat, **simpan** di tempat aman
   - **Region**: pilih `Southeast Asia (Singapore)` biar latensi rendah dari Indonesia
1.4. Klik **Create new project**, tunggu 1–2 menit sampai provisioning selesai.

---

## LANGKAH 2 — Jalankan schema database

2.1. Di sidebar kiri project, klik **SQL Editor**.
2.2. Klik **New query**.
2.3. Buka file `supabase/schema.sql` dari paket yang saya berikan, **copy semua isinya**.
2.4. Paste ke SQL Editor Supabase.
2.5. Klik **Run** (atau `Ctrl+Enter`).
2.6. Pastikan muncul "Success. No rows returned" tanpa error merah.
2.7. Cek hasilnya: buka menu **Table Editor** di sidebar → harus muncul 8 tabel:
   `profiles, kategori_ujian, subtes, soal, paket_langganan, langganan_user, transaksi, riwayat_jawaban`.

---

## LANGKAH 3 — Isi soal contoh

3.1. Buka file `supabase/seed_soal.sql`, copy semua isinya.
3.2. **SQL Editor** → **New query** → paste → **Run**.
3.3. Cek tabel `soal` di **Table Editor** → harus ada 15 baris (3 per subtes).
> Mau tambah soal sendiri nanti tinggal klik **Insert row** di tabel `soal` lewat Table Editor — juga tanpa terminal. Format kolom `pilihan` ada di README.

---

## LANGKAH 4 — Ambil kredensial API & edit config.js

4.1. Sidebar → ikon gerigi **Project Settings** → **API**.
4.2. Salin **Project URL** dan **anon public key**.
4.3. Buka file `js/config.js` (bisa pakai editor teks apa saja, misalnya Notepad, atau editor bawaan GitHub di Langkah 8), ganti:
```js
window.APP_CONFIG = {
  SUPABASE_URL: "TEMPEL_PROJECT_URL_DI_SINI",
  SUPABASE_ANON_KEY: "TEMPEL_ANON_KEY_DI_SINI",
};
```
4.4. Simpan file.

---

## LANGKAH 5 — Matikan konfirmasi email (khusus development)

5.1. Sidebar → **Authentication** → **Providers** → klik **Email**.
5.2. Matikan toggle **Confirm email** → **Save**.
> Supaya bisa langsung login setelah daftar tanpa cek inbox. Nyalakan lagi sebelum go-live.

---

## LANGKAH 6 — Ambil kunci Midtrans (sandbox)

6.1. Daftar/masuk ke [dashboard.midtrans.com](https://dashboard.midtrans.com) (mode **Sandbox**).
6.2. Sidebar → **Settings** → **Access Keys**.
6.3. Salin **Server Key** (bentuknya `SB-Mid-server-xxxxxxxxxxxxxxxxxxxxxxx`) — dipakai di Langkah 11.

## LANGKAH 7 — Ambil kunci Xendit (test mode)

7.1. Daftar/masuk ke [dashboard.xendit.co](https://dashboard.xendit.co), pastikan mode **Test**.
7.2. Sidebar → **Settings** → **API Keys** → salin **Secret Key**.
7.3. Sidebar → **Settings** → **Webhooks** → catat **Verification Token** — dipakai di Langkah 11.

---

## LANGKAH 8 — Upload project ke GitHub (lewat web, tanpa `git push`)

8.1. Buka [github.com/new](https://github.com/new) → buat repo baru, misal nama `bank-soal-app`
   (biarkan **kosong**, jangan centang "Add a README").
8.2. Di halaman repo kosong tersebut, klik link **uploading an existing file**
   (atau menu **Add file → Upload files**).
8.3. Buka folder project di komputer kamu, **seret semua file & folder** (`index.html`, `css/`, `js/`, `supabase/`, dst)
   ke area upload GitHub. Browser modern mendukung upload folder lewat drag-and-drop.
8.4. Tulis pesan commit, misal "Initial commit", lalu klik **Commit changes**.
8.5. Refresh halaman repo → pastikan semua file & subfolder muncul dengan struktur yang sama seperti di komputer kamu.
> Kalau nanti mau edit file (misalnya `js/config.js`), klik file itu di GitHub → ikon pensil (**Edit**) → ubah langsung di browser → **Commit changes**. Tidak perlu upload ulang.

---

## LANGKAH 9 — Deploy ke GitHub Pages (hosting gratis)

9.1. Di repo GitHub → **Settings** → **Pages**.
9.2. **Source**: pilih `Deploy from a branch`.
9.3. **Branch**: pilih `main`, folder `/ (root)` → **Save**.
9.4. Tunggu 1–2 menit, URL live muncul di bagian atas halaman itu, bentuknya:
   `https://<username-kamu>.github.io/bank-soal-app/`
9.5. Buka URL itu → app sudah bisa dipakai untuk **Daftar, Masuk, dan mengerjakan soal gratis**
   (fitur pembayaran baru aktif setelah Langkah 10–12).

---

## LANGKAH 10 — Deploy Edge Functions lewat dashboard Supabase (tanpa CLI)

10.1. Di project Supabase → sidebar → **Edge Functions**.
10.2. Klik **Deploy a new function** → pilih **Via Editor**.
10.3. Beri nama function: `create-payment`.
10.4. Hapus kode contoh yang muncul, buka file `supabase/functions/create-payment/index.ts`
   dari paket kamu, **copy semua isinya**, paste ke editor dashboard.
10.5. Klik **Deploy**.
10.6. Ulangi untuk function kedua: **Deploy a new function → Via Editor** → nama `payment-webhook`
   → paste isi `supabase/functions/payment-webhook/index.ts` → **Deploy**.
10.7. Setelah dua function ter-deploy, klik masing-masing untuk melihat URL-nya, formatnya:
   - `https://<project-ref>.supabase.co/functions/v1/create-payment`
   - `https://<project-ref>.supabase.co/functions/v1/payment-webhook`

   Catat keduanya.

---

## LANGKAH 11 — Set secrets lewat dashboard (tanpa CLI)

11.1. Di halaman **Edge Functions**, cari tombol/menu **Manage secrets** (biasanya di kanan atas atau tab **Secrets**).
11.2. Tambahkan 4 secrets berikut satu per satu (klik **Add new secret** untuk masing-masing):
   - `MIDTRANS_SERVER_KEY` → Server Key dari Langkah 6.3
   - `XENDIT_SECRET_KEY` → Secret Key dari Langkah 7.2
   - `XENDIT_WEBHOOK_TOKEN` → Verification Token dari Langkah 7.3
   - `APP_URL` → URL GitHub Pages kamu dari Langkah 9.4 (contoh `https://username.github.io/bank-soal-app`)
11.3. Simpan. Secrets ini otomatis tersedia untuk kedua Edge Function tanpa perlu redeploy manual.
> Catatan: `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` yang dipakai di kode function sudah otomatis
> disediakan Supabase untuk setiap Edge Function — tidak perlu kamu tambahkan sendiri.

---

## LANGKAH 12 — Daftarkan webhook

12.1. **Midtrans**: dashboard → **Settings** → **Configuration** → isi **Payment Notification URL**
   dengan URL `payment-webhook` dari Langkah 10.7.
12.2. **Xendit**: dashboard → **Settings** → **Webhooks** → bagian **Invoice Paid** → isi dengan URL yang sama.
12.3. Simpan kedua konfigurasi.

---

## LANGKAH 13 — Tes alur pembayaran end-to-end

13.1. Buka URL GitHub Pages kamu, login, buka halaman **Langganan**.
13.2. Pilih paket → pilih gateway (Midtrans/Xendit) → klik **Pilih Paket**.
13.3. Selesaikan pembayaran di halaman checkout sandbox pakai
   [kartu test Midtrans](https://docs.midtrans.com/docs/testing-payment-on-sandbox) atau metode test Xendit.
13.4. Cek Supabase → **Table Editor** → tabel `transaksi` → status harus `paid`,
   dan tabel `langganan_user` harus punya baris baru berstatus `aktif`.
13.5. Balik ke app → halaman **Akun** harus menampilkan status Premium.

---

## Troubleshooting cepat

| Gejala | Kemungkinan penyebab |
|---|---|
| Soal tidak muncul sama sekali | `subtes_id` di tabel `soal` salah, atau belum login |
| Soal premium tidak kebuka walau sudah bayar | Cek tabel `langganan_user`: `status` harus `aktif` dan `berakhir` > waktu sekarang |
| Klik "Pilih Paket" error "Unauthorized" | Token login expired — logout/login lagi |
| Webhook tidak update status transaksi | Cek URL webhook di dashboard gateway sudah benar; lihat log di Supabase → Edge Functions → `payment-webhook` → tab **Logs** |
| Signature Midtrans invalid | `MIDTRANS_SERVER_KEY` di secrets tidak sama dengan Server Key sandbox/produksi yang aktif |
| Upload folder ke GitHub gagal / file hilang | Beberapa browser tidak mendukung drag folder — coba upload isi folder `css`, `js`, `supabase` satu per satu |

---

## Kalau nanti mau pakai terminal lagi (opsional, lebih cepat untuk iterasi)

Cara di atas 100% cukup untuk MVP. Tapi kalau suatu saat kamu install VS Code dan mau iterasi lebih cepat
(edit banyak file sekaligus, auto-deploy tiap commit, dsb), opsi CLI (`supabase` & `git`) tetap ada dan
lebih efisien untuk jangka panjang — bisa saya bantu kalau saatnya tiba.
