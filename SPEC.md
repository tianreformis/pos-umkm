# UMKN POS - Point of Sale Application for SMEs

## Project Overview
- **Project Name**: UMKN POS
- **Type**: Full-stack Web Application (Point of Sale)
- **Core Functionality**: Complete POS system for small businesses (warung, minimart, coffee shops)
- **Target Users**: SME owners, cashiers, administrators

## Technology Stack

### Frontend
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- UI: Tailwind CSS
- State: Zustand
- Icons: Lucide React
- Charts: Recharts

### Backend
- Runtime: Node.js
- Framework: Express.js
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT (jsonwebtoken)
- Scheduler: node-cron

### Database Schema

```prisma
// User Model
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  name      String
  role      Role      @default(KASIR)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  KASIR
}

// Category Model
model Category {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// Product Model
model Product {
  id          Int           @id @default(autoincrement())
  name        String
  description String?
  price       Decimal       @db.Decimal(10, 2)
  cost        Decimal       @db.Decimal(10, 2)
  stock       Int           @default(0)
  minStock    Int           @default(10)
  imageUrl    String?
  categoryId  Int?
  category   Category?     @relation(fields: [categoryId], references: [id])
  salesItems  SaleItem[]
  stockMovements StockMovement[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// Stock Movement Model
model StockMovement {
  id          Int      @id @default(autoincrement())
  productId  Int
  product    Product  @relation(fields: [productId], references: [id])
  quantity   Int
  type       StockMovementType
  note       String?
  createdAt  DateTime  @default(now())
}

enum StockMovementType {
  IN
  OUT
  ADJUSTMENT
}

// Sale Model
model Sale {
  id            Int        @id @default(autoincrement())
  items         SaleItem[]
  subtotal      Decimal    @db.Decimal(10, 2)
  discount     Decimal    @db.Decimal(10, 2) @default(0)
  tax          Decimal    @db.Decimal(10, 2) @default(0)
  total        Decimal    @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  amountPaid   Decimal    @db.Decimal(10, 2)
  change       Decimal    @db.Decimal(10, 2)
  userId       Int
  user         User       @relation(fields: [userId], references: [id])
  createdAt    DateTime   @default(now())
}

// Sale Item Model
model SaleItem {
  id        Int     @id @default(autoincrement())
  saleId    Int
  sale     Sale    @relation(fields: [saleId], references: [id])
  productId Int
  product  Product @relation(fields: [productId], references: [id])
  quantity Int
  price    Decimal @db.Decimal(10, 2)
  subtotal Decimal @db.Decimal(10, 2)
}

enum PaymentMethod {
  CASH
  QRIS
  TRANSFER
}

// AI Recommendation Model
model AIInsight {
  id          Int       @id @default(autoincrement())
  type        AIInsightType
  title       String
  content     String
  confidence  Float
  generatedAt DateTime   @default(now())
}

enum AIInsightType {
  RESTOCK
  TREND
  FORECAST
  INSIGHT
}

// Daily Summary Model
model DailySummary {
  id          Int       @id @default(autoincrement())
  date        DateTime  @unique
  totalSales  Decimal   @db.Decimal(10, 2)
  totalItems  Int
  totalTransactions Int
  createdAt  DateTime  @default(now())
}

// Product Daily Sales (for AI processing)
model ProductDailySales {
  id          Int       @id @default(autoincrement())
  productId  Int
  product    Product   @relation(fields: [productId], references: [id])
  date       DateTime
  quantity   Int
  revenue    Decimal   @db.Decimal(10, 2)
  
  @@unique([productId, date])
}
```

## API Endpoints

### Auth
- POST /api/auth/login - Login user
- POST /api/auth/register - Register user (admin only)
- GET /api/auth/me - Get current user

### Products
- GET /api/products - Get all products
- GET /api/products/:id - Get product by id
- POST /api/products - Create product
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product
- GET /api/products/search - Search products

### Categories
- GET /api/categories - Get all categories
- POST /api/categories - Create category
- PUT /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

### Sales
- GET /api/sales - Get sales history
- GET /api/sales/:id - Get sale by id
- POST /api/sales - Create new sale
- GET /api/sales/receipt/:id - Print receipt

### Stock
- GET /api/stock/movements - Get stock movements
- POST /api/stock/adjust - Adjust stock
- GET /api/stock/low - Get low stock products

### Reports
- GET /api/reports/daily - Daily report
- GET /api/reports/weekly - Weekly report
- GET /api/reports/monthly - Monthly report
- GET /api/reports/top-products - Best selling products
- GET /api/reports/export - Export to CSV

### AI
- GET /api/ai/insights - Get AI insights
- GET /api/ai/restock - Get restock recommendations
- GET /api/ai/forecast - Get sales forecast
- POST /api/ai/generate - Generate insights (cron)

## UI Components

### Dashboard (Admin)
- Total sales today
- Low stock alerts
- Top products chart
- Recent transactions
- Quick actions

### POS / Cashier Screen
- Product grid (klik untuk tambah ke cart)
- Search bar
- Cart sidebar
- Customer display (total, diskon, pajak)
- Payment method buttons
- Receipt print

### Product Management
- Table with CRUD
- Image upload
- Category filter
- Stock status

### Reports
- Date range picker
- Sales chart
- Export button
- Product table

### Settings
- Profile update
- Dark mode toggle
- Store settings

## Feature Implementation

### 1. Product Management
- [x] CRUD operations
- [x] Category association
- [x] Auto stock update on sale
- [x] Image upload (base64/local storage)

### 2. Transaction
- [x] Click to add product
- [x] Search functionality
- [x] Cart management
- [x] Auto calculation (subtotal, diskon, pajak)
- [x] Multiple payment methods
- [x] Receipt generation (PDF)

### 3. Stock Management
- [x] Auto deduction on sale
- [x] Low stock notification (< minStock)
- [x] Stock movement history

### 4. Reports
- [x] Daily/Weekly/Monthly
- [x] Total sales
- [x] Best sellers
- [x] CSV export

### 5. User Management
- [x] JWT authentication
- [x] Role-based access (Admin/Kasir)

### 6. AI Features
- [x] Restock recommendations (based on sales velocity)
- [x] Trend analysis
- [x] Simple forecasting
- [x] Daily generation (cron)
- [x] Cache results in database

## Acceptance Criteria

1. ✅ User can login with email/password
2. ✅ Admin can manage products (CRUD)
3. ✅ Cashier can process sales transactions
4. ✅ Stock auto-updates after sale
5. ✅ Low stock shows notification
6. ✅ Reports show accurate data
7. ✅ AI insights generated daily
8. ✅ Responsive on mobile
9. ✅ Dark mode available
10. ✅ Receipt can be printed/PDF