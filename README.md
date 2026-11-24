# IT Live — Noutbuk nazorati va kutubxona (v3, Next.js + Vercel)

v2 (Node + Render) → Next.js (App Router) ga ko'chirilgan versiya.

## Tuzilma
- `app/api/*` — backend (login, parol, umumiy ma'lumot). Vercel serverless funksiyalari.
- `lib/core.js` — parol (scrypt), sessiya cookie, ma'lumotni birlashtirish.
- `lib/db.js` — Postgres (Neon). Jadval tuzilmasi v2 bilan bir xil.
- `components/LegacyApp.js`, `components/markup.js`, `public/app.js`, `app/legacy.css` — interfeys (v2 dagi ishlaydigan kod o'zgarishsiz ko'chirilgan).
- `public/sw.js`, `manifest.webmanifest` — telefon ilovasi (PWA).
- `qr-yorliqlar/` — QR yorliqlar (eski manzil uchun!).

## Vercel'ga joylash
1. Loyihani GitHub'ga yuklang (Private repo).
2. vercel.com → Add New → Project → repo'ni tanlang (Framework: Next.js avtomatik).
3. Deploy'dan OLDIN yoki keyin: **Storage** bo'limi → **Neon (Postgres)** → Create → loyihaga ulang. `DATABASE_URL` o'zi qo'shiladi.
   Region: Frankfurt (funksiyalar ham `vercel.json` da `fra1`).
   *Agar Render'dagi Neon bazangiz bo'lsa — o'sha `DATABASE_URL` ni Environment Variables'ga qo'ying, eski ma'lumot saqlanib qoladi.*
4. Settings → Environment Variables: `ADMIN_PASS` (kuchli parol), ixtiyoriy `ADMIN_USER`, `SESSION_SECRET`.
5. Deploy → `https://nomi.vercel.app`. Kirib, Sozlamalardan loginni o'zgartiring.
6. **QR yorliqlarni yangi manzildan qayta chop eting** (QR bo'limi → Chop etish / PDF).

CLI orqali: `npm i -g vercel && vercel --prod`.

## Kompyuterda sinash
```
npm install
DATABASE_URL=postgresql://... ADMIN_PASS=Parol npm run dev
```
http://localhost:3000 (kamera faqat HTTPS yoki localhost'da ishlaydi).

## Eslatmalar
- Vercel so'rov hajmi chegarasi ~4.5 MB (v2 da 8 MB edi). Katta "Import" fayllari uchun e'tibor bering.
- Bepul rejada "uxlab qolish" yo'q — UptimeRobot kerak emas.
