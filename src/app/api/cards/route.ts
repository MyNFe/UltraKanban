import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Create a new card
export async function POST(request: NextRequest) {
  try {
    const { columnId, title, description, dueDate } = await request.json();

    if (!columnId || !title) {
      return NextResponse.json(
        { error: 'columnId e título são obrigatórios' },
        { status: 400 }
      );
    }

    // Get max order for this column
    const maxOrder = await prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const card = await prisma.card.create({
      data: {
        title,
        description: description || '',
        columnId,
        dueDate: dueDate ? new Date(dueDate) : null,
        order: (maxOrder?.order ?? -1) + 1
      },
      include: { labels: true }
    });

    return NextResponse.json({ success: true, card });

  } catch (error: unknown) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cartão' },
      { status: 500 }
    );
  }
}

// PUT - Update a card
export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, dueDate, columnId, order, labels } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Update card basic info
    const card = await prisma.card.update({
      where: { id },
      data: { 
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(columnId !== undefined && { columnId }),
        ...(order !== undefined && { order })
      },
      include: { labels: true }
    });

    // Update labels if provided
    if (labels !== undefined) {
      // Delete existing labels
      await prisma.label.deleteMany({
        where: { cardId: id }
      });

      // Create new labels
      if (labels.length > 0) {
        await prisma.label.createMany({
          data: labels.map((label: { name: string; color: string }) => ({
            cardId: id,
            name: label.name,
            color: label.color
          }))
        });
      }

      // Refetch card with new labels
      const updatedCard = await prisma.card.findUnique({
        where: { id },
        include: { labels: true }
      });

      return NextResponse.json({ success: true, card: updatedCard });
    }

    return NextResponse.json({ success: true, card });

  } catch (error: unknown) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cartão' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a card
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

    await prisma.card.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cartão' },
      { status: 500 }
    );
  }
}

// PATCH - Move card to another column
export async function PATCH(request: NextRequest) {
  try {
    const { cardId, targetColumnId, targetIndex } = await request.json();

    if (!cardId || !targetColumnId) {
      return NextResponse.json(
        { error: 'cardId e targetColumnId são obrigatórios' },
        { status: 400 }
      );
    }

    // Get the card
    const card = await prisma.card.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      );
    }

    // Update card's column and order
    await prisma.card.update({
      where: { id: cardId },
      data: {
        columnId: targetColumnId,
        order: targetIndex ?? 0
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error moving card:', error);
    return NextResponse.json(
      { error: 'Erro ao mover cartão' },
      { status: 500 }
    );
  }
}
