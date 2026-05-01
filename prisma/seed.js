import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@umkn.com' },
    update: {},
    create: { email: 'admin@umkn.com', password: adminPassword, name: 'Administrator', role: 'ADMIN' }
  });

  await prisma.user.upsert({
    where: { email: 'kasir@umkn.com' },
    update: {},
    create: { email: 'kasir@umkn.com', password: kasirPassword, name: 'Kasir', role: 'KASIR' }
  });

  const cat1 = await prisma.category.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Makanan Ringan', description: 'Snack dan camilan' }
  });
  const cat2 = await prisma.category.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Makanan & Minuman', description: 'Makanan dan minuman siap saji' }
  });
  const cat3 = await prisma.category.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Minuman', description: 'Minuman berbagai jenis' }
  });

  const products = [
    { name: 'Kopi Hitam', price: 5000, cost: 2000, stock: 100, minStock: 20, categoryId: cat2.id },
    { name: 'Kopi Susu', price: 7000, cost: 3000, stock: 80, minStock: 15, categoryId: cat2.id },
    { name: 'Teh Manis', price: 4000, cost: 1500, stock: 50, minStock: 10, categoryId: cat2.id },
    { name: 'Mie Goreng', price: 12000, cost: 5000, stock: 30, minStock: 10, categoryId: cat2.id },
    { name: 'Nasi Goreng', price: 15000, cost: 7000, stock: 25, minStock: 5, categoryId: cat2.id },
    { name: 'Kerupuk', price: 3000, cost: 1000, stock: 50, minStock: 10, categoryId: cat1.id },
    { name: 'Kopi Latte', price: 10000, cost: 4000, stock: 40, minStock: 10, categoryId: cat2.id },
    { name: 'Jus Jeruk', price: 8000, cost: 3500, stock: 20, minStock: 5, categoryId: cat3.id }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: products.indexOf(p) + 1 },
      update: p,
      create: p
    });
  }

  console.log('Seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());