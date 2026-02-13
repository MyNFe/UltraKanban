import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Share board with email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Check if already shared
    const existingShare = await prisma.boardShare.findUnique({
      where: {
        boardId_email: {
          boardId,
          email: email.toLowerCase()
        }
      }
    });

    if (existingShare) {
      return NextResponse.json(
        { error: 'Este email já tem acesso ao quadro' },
        { status: 400 }
      );
    }

    // Get board info for email
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { owner: true }
    });

    if (!board) {
      return NextResponse.json(
        { error: 'Quadro não encontrado' },
        { status: 404 }
      );
    }

    // Create share
    const share = await prisma.boardShare.create({
      data: {
        boardId,
        email: email.toLowerCase()
      }
    });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // If user doesn't exist, send invite email
    if (!user) {
      // Send invite email (async, don't block response)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          boardTitle: board.title,
          ownerName: board.owner.name,
          boardId: board.id
        }),
      }).catch(err => console.error('Error sending invite email:', err));
    }

    return NextResponse.json({
      success: true,
      share,
      userExists: !!user,
      warning: !user ? 'Este email não está cadastrado. Enviamos um convite para a pessoa se cadastrar.' : undefined
    });

  } catch (error: unknown) {
    console.error('Error sharing board:', error);
    return NextResponse.json(
      { error: 'Erro ao compartilhar quadro' },
      { status: 500 }
    );
  }
}

// DELETE - Unshare board with email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.boardShare.delete({
      where: {
        boardId_email: {
          boardId,
          email: email.toLowerCase()
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Error unsharing board:', error);
    return NextResponse.json(
      { error: 'Erro ao remover compartilhamento' },
      { status: 500 }
    );
  }
}

// GET - Get shared users for a board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;

    const shares = await prisma.boardShare.findMany({
      where: { boardId }
    });

    // Get user info for each shared email
    const sharedWithUsers = await Promise.all(
      shares.map(async (share) => {
        const user = await prisma.user.findUnique({
          where: { email: share.email }
        });
        return {
          email: share.email,
          name: user?.name || null,
          registered: !!user
        };
      })
    );

    return NextResponse.json({ sharedWith: sharedWithUsers });

  } catch (error: unknown) {
    console.error('Error getting shared users:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários compartilhados' },
      { status: 500 }
    );
  }
}
