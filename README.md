# Bank Soal — Persiapan CPNS & UTBK

MVP aplikasi bank soal + pembahasan untuk persiapan ujian CPNS dan UTBK-SNBT.
Stack: **HTML/CSS/vanilla JS** (tanpa build step) + **Supabase** (Auth, Postgres, Edge Functions)
+ pembayaran langganan via **Midtrans** dan **Xendit**.

## Fitur MVP
- Autentikasi (daftar/masuk) via Supabase Auth
- Bank soal per kategori ujian (CPNS/UTBK) → subtes → soal + pembahasan
- Soal gratis vs premium, dikunci otomatis pakai Row Level Security
- Langganan berbayar (checkout Midtrans **atau** Xendit, pilih saat checkout)
- Webhook otomatis mengaktifkan/memperpanjang langganan setelah pembayaran lunas
- Riwayat transaksi & status langganan di halaman Akun

## Struktur folder
```
bank-soal-app/
├─ index.html
├─ css/style.css
├─ js/
│  ├─ config.js          # isi URL & anon key Supabase kamu di sini
│  ├─ supabaseClient.js
│  ├─ auth.js
│  ├─ soal.js
│  ├─ payment.js
│  ├─ ui.js
│  └─ app.js              # router + render halaman (hash routing)
└─ supabase/
   ├─ schema.sql           # jalankan sekali di SQL Editor Supabase
   └─ functions/
      ├─ create-payment/   # bikin transaksi & minta URL checkout
      └─ payment-webhook/  # terima notifikasi Midtrans/Xendit, aktifkan langganan
```

## 1. Setup Supabase
1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → jalankan isi `supabase/schema.sql`. Ini membuat semua tabel,
   RLS policy, trigger profil otomatis, dan seed data contoh (kategori CPNS/UTBK, subtes, 3 paket harga).
3. Salin **Project URL** dan **anon public key** dari *Settings → API*, tempel ke `js/config.js`.
4. (Opsional tapi disarankan) Nonaktifkan "Confirm email" dulu di *Authentication → Providers → Email*
   saat masih development, supaya bisa langsung login setelah daftar.

## 2. Tambahkan soal
Cara paling cepat untuk MVP: insert manual lewat **Table Editor** Supabase ke tabel `soal`.
Kolom `pilihan` berformat JSON, contoh:
```json
[
  {"kode":"A","teks":"Jawaban A"},
  {"kode":"B","teks":"Jawaban B"},
  {"kode":"C","teks":"Jawaban C"},
  {"kode":"D","teks":"Jawaban D"}
]
```
Set `is_premium = false` untuk soal yang mau digratiskan sebagai contoh/pemanasan.

## 3. Deploy Edge Functions (pembayaran)
Perlu [Supabase CLI](https://supabase.com/docs/guides/cli) terpasang.
```bash
supabase login
supabase link --project-ref <project-ref-kamu>

supabase secrets set \
  MIDTRANS_SERVER_KEY=... \
  XENDIT_SECRET_KEY=... \
  XENDIT_WEBHOOK_TOKEN=... \
  APP_URL=https://username.github.io/bank-soal-app

supabase functions deploy create-payment
supabase functions deploy payment-webhook --no-verify-jwt
```
Lalu daftarkan URL webhook ke masing-masing dashboard:
- **Midtrans**: Settings → Configuration → Payment Notification URL →
  `https://<project-ref>.supabase.co/functions/v1/payment-webhook`
- **Xendit**: Settings → Webhooks → Invoice Paid →
  `https://<project-ref>.supabase.co/functions/v1/payment-webhook`,
  lalu salin *Verification Token* Xendit ke secret `XENDIT_WEBHOOK_TOKEN`.

> Selama development, Midtrans di atas memakai endpoint **sandbox**
> (`app.sandbox.midtrans.com`). Ganti ke `app.midtrans.com` di
> `supabase/functions/create-payment/index.ts` saat sudah pakai Server Key produksi.

## 4. Jalankan lokal
Tidak perlu build step. Cukup buka `index.html` lewat live server, contoh:
```bash
npx serve .
# atau: pakai ekstensi "Live Server" di VS Code
```

## 5. Push ke GitHub & deploy
```bash
git init
git add .
git commit -m "Initial commit: MVP bank soal"
git branch -M main
git remote add origin https://github.com/<username>/bank-soal-app.git
git push -u origin main
```
Untuk hosting gratis, aktifkan **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / root),
atau hubungkan repo ke Netlify/Vercel sebagai static site (tanpa build command).

Jangan lupa update `APP_URL` di secrets Supabase dan `callbacks`/`success_redirect_url`
di Edge Function `create-payment` agar sesuai domain final kamu.

## Rencana lanjutan (di luar MVP ini)
- Halaman admin untuk kelola soal (CRUD) tanpa Table Editor
- Try-out simulasi dengan waktu & skor akhir
- Statistik progres belajar per user
- Reset password & verifikasi email yang lebih rapi di UI
