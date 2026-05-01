import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const lowStock = await prisma.product.findMany();
    const filtered = lowStock.filter(p => p.stock <= p.minStock);
    return NextResponse.json(filtered);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productId, quantity, type, note } = await req.json();
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    let newStock = product.stock;
    if (type === 'IN') newStock += quantity;
    else if (type === 'OUT') newStock -= quantity;
    else newStock = quantity;
    
    const updated = await prisma.product.update({ where: { id: productId }, data: { stock: newStock } });
    await prisma.stockMovement.create({ data: { productId, quantity, type, note } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}