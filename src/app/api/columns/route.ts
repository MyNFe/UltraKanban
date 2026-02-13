import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Create a new column
export async function POST(request: NextRequest) {
  try {
    const { boardId, title } = await request.json();

    if (!boardId || !title) {
      return NextResponse.json(
        { error: 'boardId e título são obrigatórios' },
        { status: 400 }
      );
    }

    // Get max order for this board
    const maxOrder = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const column = await prisma.column.create({
      data: {
        title,
        boardId,
        order: (maxOrder?.order ?? -1) + 1
      }
    });

    return NextResponse.json({ success: true, column });

  } catch (error: unknown) {
    console.error('Error creating column:', error);
    return NextResponse.json(
      { error: 'Erro ao criar coluna' },
      { status: 500 }
    );
  }
}

// PUT - Update a column
export async function PUT(request: NextRequest) {
  try {
    const { id, title, order } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const column = await prisma.column.update({
      where: { id },
      data: { 
        ...(title !== undefined && { title }),
        ...(order !== undefined && { order })
      }
    });

    return NextResponse.json({ success: true, column });

  } catch (error: unknown) {
    console.error('Error updating column:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar coluna' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a column
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.column.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error deleting column:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir coluna' },
      { status: 500 }
    );
  }
}
