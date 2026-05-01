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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    
    const where: any = {};
    if (search) where.AND = [{ name: { contains: search, mode: 'insensitive' } }];
    if (categoryId) where.categoryId = parseInt(categoryId);
    
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    
    const serialized = products.map(p => ({
      ...p,
      price: Number(p.price),
      cost: Number(p.cost)
    }));
    
    return NextResponse.json(serialized);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await auth(req);
    
    const data = await req.json();
    
    const createData: any = {
      name: data.name,
      price: data.price ? parseFloat(data.price) : 0,
      cost: data.cost ? parseFloat(data.cost) : 0,
      stock: data.stock ? parseInt(data.stock) : 0,
      minStock: data.minStock ? parseInt(data.minStock) : 10
    };
    
    const product = await prisma.product.create({ data: createData });
    return NextResponse.json({
      ...product,
      price: Number(product.price),
      cost: Number(product.cost)
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}