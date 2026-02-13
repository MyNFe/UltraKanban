import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Find user by email or ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { error: 'Email ou ID é obrigatório' },
        { status: 400 }
      );
    }

    let user;

    if (id) {
      user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true
        }
      });
    }

    return NextResponse.json({ user });

  } catch (error: unknown) {
    console.error('Error finding user:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    );
  }
}
