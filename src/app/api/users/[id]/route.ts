import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const getCurrentUser = (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const data = await req.json();
    
    const updateData: any = { name: data.name };
    
    if (data.password && data.password.trim()) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    if (data.role) {
      updateData.role = data.role;
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus diri sendiri' }, { status: 400 });
    }
    
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Tidak dapat menghapus admin' }, { status: 400 });
    }
    
    await prisma.user.delete({ where: { id } });
    
    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}