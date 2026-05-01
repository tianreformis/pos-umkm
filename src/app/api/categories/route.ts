import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cats = await prisma.category.findMany({ include: { _count: { select: { products: true } } } });
    return NextResponse.json(cats);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const cat = await prisma.category.create({ data });
    return NextResponse.json(cat);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}