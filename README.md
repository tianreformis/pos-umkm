# UMKN POS - Point of Sale for SMEs

Aplikasi Point of Sale berbasis web untukUMKM (warung, minimart, coffee shop kecil).

## Teknologi

- **Frontend**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Neon) dengan Prisma ORM
- **State Management**: Zustand
- **UI**: Tailwind CSS + Lucide Icons
- **Charts**: Recharts
- **Authentication**: JWT

## Fitur

### 1. Manajemen Produk
- Tambah, edit, hapus produk
- Kategori produk
- Stok barang (auto update saat transaksi)
- Upload gambar produk

### 2. Transaksi Penjualan
- Input produk via klik / search
- Keranjang belanja (cart)
- Hitung total otomatis
- Diskon & pajak
- Metode pembayaran (cash, QRIS, transfer)
- Cetak struk (print / PDF)

### 3. Manajemen Stok
- Update stok otomatis saat transaksi
- Notifikasi stok menipis
- Riwayat pergerakan stok

### 4. Laporan
- Laporan harian, mingguan, bulanan
- Total penjualan
- Produk terlaris
- Export ke CSV

### 5. User Management
- Role: Admin & Kasir
- Login & authentication (JWT)

### 6. AI Features
- Rekomendasi restock barang berdasarkan penjualan
- Prediksi produk terlaris minggu depan
- Insight sederhana: "Produk A meningkat 20% minggu ini"
- Generate 1x sehari (cron job)

## Struktur Folder

```
UMKN POS/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js         # Seed data
├── src/
│   ├── app/
│   │   ├── api/        # API Routes
│   │   │   ├── auth/   # Login/Me
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── sales/
│   │   │   ├── stock/
│   │   │   ├── reports/
│   │   │   └── ai/
│   │   ├── page.tsx    # Main Dashboard & POS UI
│   │   ├── layout.tsx  # Root Layout
│   │   └── globals.css
│   ├── lib/
│   │   └── api.ts     # API utilities
│   ├── store/
│   │   └── index.ts  # Zustand stores
│   └── types/
│       └── index.ts   # TypeScript types
├── .env              # Environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

## Cara Install

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Setup Database (Neon)

1. Daftar di [neon.tech](https://neon.tech)
2. Buat project baru
3. Buat database `umkn_pos`
4. Copy connection string

### 3. Setup Environment Variables

Buat file `.env`:

```env
DATABASE_URL="postgresql://username:password@host.neon.tech/umkn_pos?sslmode=require"
JWT_SECRET="random-secret-key-min-32-characters-long"
NEXT_PUBLIC_API_URL=""
```

Ganti `username`, `password`, `host` dengan credentials Neon kamu.

### 4. Generate Prisma & Push Schema

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed Data (Opsional)

```bash
npm run db:seed
```

Akan membuat user demo dan produk sample.

### 6. Run Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Cara Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/umkn-pos.git
git push -u origin main
```

### 2. Setup di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Framework Preset: **Next.js**
4. Build Command: `next build`
5. Environment Variables:
   - `DATABASE_URL` = connection string Neon
   - `JWT_SECRET` = random string

6. Deploy!

## Login Credentials

| Role  | Email            | Password |
|-------|-----------------|----------|
|Admin  |admin@umkn.com   |admin123  |
|Kasir  |kasir@umkn.com   |kasir123   |

## API Endpoints

### Auth
- `POST /api/auth` - Login
- `GET /api/auth` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category

### Sales
- `GET /api/sales` - Get sales history
- `POST /api/sales` - Create new sale

### Stock
- `GET /api/stock` - Get low stock products
- `POST /api/stock` - Adjust stock

### Reports
- `GET /api/reports?type=daily|weekly|monthly` - Get reports

### AI
- `GET /api/ai` - Get AI insights
- `POST /api/ai` - Generate insights

## Demo Screenshots

### Dashboard
- Total penjualan hari ini
- Grafik penjualan 7 hari
- Transaksi terakhir
- Alert stok menipis

### POS Screen
- Grid produk (click untuk tambah ke cart)
- Search produk
- Cart dengan kuantitas
- Diskon & pajak
- Tombol proses transaksi

### Products Page
- Tabel produk
- Status stok (hijau/merah)
- Tombol tambah produk

### Reports Page
- Filter harian/mingguan/bulanan
- Total penjualan, transaksi, items

### AI Insights
- Rekomendasi restock
- Tren produk terlaris
- Prediksi minggu depan

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Database connection error"
- Cek DATABASE_URL di .env
- Pastikan Neon project aktif

### "Invalid token"
- Logout dan login ulang
- Cek JWT_SECRET sudah benar

## Lisensi

MIT License

## Author

UMKN POS - Point of Sale untuk UMKM