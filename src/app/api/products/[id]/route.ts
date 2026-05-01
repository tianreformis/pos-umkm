import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      ...product,
      price: Number(product.price),
      cost: Number(product.cost)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const data = await req.json();
    
    const updateData: any = { name: data.name };
    
    if (data.price) updateData.price = parseFloat(data.price);
    if (data.cost) updateData.cost = parseFloat(data.cost);
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.minStock) updateData.minStock = parseInt(data.minStock);
    if (data.imageUrl) updateData.imageUrl = data.imageUrl;
    if (data.categoryId) updateData.categoryId = parseInt(data.categoryId);
    
    const product = await prisma.product.update({ where: { id }, data: updateData });
    return NextResponse.json({
      ...product,
      price: Number(product.price),
      cost: Number(product.cost)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}