import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all boards for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail');

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'userId e userEmail são obrigatórios' },
        { status: 400 }
      );
    }

    // Get user's own boards
    const ownBoards = await prisma.board.findMany({
      where: { userId },
      include: {
        columns: {
          include: {
            cards: {
              include: { labels: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        sharedWith: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get boards shared with the user
    const sharedBoards = await prisma.board.findMany({
      where: {
        sharedWith: {
          some: {
            email: userEmail.toLowerCase()
          }
        }
      },
      include: {
        columns: {
          include: {
            cards: {
              include: { labels: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        sharedWith: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      boards: ownBoards,
      sharedBoards
    });

  } catch (error: unknown) {
    console.error('Error getting boards:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar quadros' },
      { status: 500 }
    );
  }
}

// POST - Create a new board
export async function POST(request: NextRequest) {
  try {
    const { title, userId } = await request.json();

    if (!title || !userId) {
      return NextResponse.json(
        { error: 'Título e userId são obrigatórios' },
        { status: 400 }
      );
    }

    const board = await prisma.board.create({
      data: {
        title,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      board
    });

  } catch (error: unknown) {
    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Erro ao criar quadro' },
      { status: 500 }
    );
  }
}
