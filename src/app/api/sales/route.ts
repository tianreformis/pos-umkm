import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const auth = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token');
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
};

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const sales = await prisma.sale.findMany({
      take: limit,
      include: { user: { select: { name: true } }, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    const serialized = sales.map(s => ({
      ...s,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      amountPaid: Number(s.amountPaid),
      change: Number(s.change),
      items: s.items.map(i => ({ ...i, price: Number(i.price), subtotal: Number(i.subtotal) }))
    }));
    
    return NextResponse.json(serialized);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    const { items, discount = 0, tax = 0, paymentMethod, amountPaid } = await req.json();
    
    if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 });
    
    const saleItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      const p = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!p) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
      if (p.stock < item.quantity) return NextResponse.json({ error: `Stok ${p.name} tidak cukup` }, { status: 400 });
      
      const itemSubtotal = Number(p.price) * item.quantity;
      subtotal += itemSubtotal;
      saleItems.push({ productId: p.id, quantity: item.quantity, price: p.price, subtotal: itemSubtotal });
      
      await prisma.product.update({ where: { id: p.id }, data: { stock: { decrement: item.quantity } } });
      await prisma.stockMovement.create({ data: { productId: p.id, quantity: item.quantity, type: 'OUT', note: 'Sale' } });
    }
    
const taxAmount = (subtotal - discount) * (tax / 100);
    const total = subtotal - discount + taxAmount;
    
    const sale = await prisma.sale.create({
      data: {
        subtotal, discount, tax, total, paymentMethod,
        amountPaid, change: amountPaid - total,
        userId: user.id,
        items: { create: saleItems }
      },
      include: { items: { include: { product: true } }, user: { select: { name: true } } }
    });
    
    return NextResponse.json({
      ...sale,
      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),
      amountPaid: Number(sale.amountPaid),
      change: Number(sale.change),
      items: sale.items.map(i => ({ ...i, price: Number(i.price), subtotal: Number(i.subtotal) }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}