import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get a specific board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          include: {
            cards: {
              include: { labels: true },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        sharedWith: true
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: 'Quadro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ board });

  } catch (error: unknown) {
    console.error('Error getting board:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar quadro' },
      { status: 500 }
    );
  }
}

// PUT - Update a board
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const board = await prisma.board.update({
      where: { id },
      data: body
    });

    return NextResponse.json({ success: true, board });

  } catch (error: unknown) {
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar quadro' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.board.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir quadro' },
      { status: 500 }
    );
  }
}
