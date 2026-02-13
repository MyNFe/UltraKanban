import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { APP_URL, RESEND_SENDER_EMAIL } from '@/lib/config';

// Send invite email directly
async function sendInviteEmail(email: string, boardTitle: string, ownerName: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return false;
    }

    const resend = new Resend(apiKey);
    const registerUrl = `${APP_URL}/register`;

    console.log(`📧 Enviando email de convite para: ${email}`);

    const { data, error } = await resend.emails.send({
      from: `Kanban <${RESEND_SENDER_EMAIL}>`,
      to: email,
      subject: `📋 ${ownerName} convidou você para colaborar no Kanban!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Colaborar</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; line-height: 60px;">
                <span style="color: white; font-size: 28px; font-weight: bold;">K</span>
              </div>
              <h1 style="color: #1e40af; margin: 10px 0 0 0;">Kanban</h1>
            </div>
            <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">🎊 Você foi convidado!</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">${ownerName} quer compartilhar um quadro com você</p>
            </div>
            <div style="background: #f8fafc; border-radius: 10px; padding: 25px; text-align: center; margin-bottom: 25px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">📋</span>
              </div>
              <h3 style="color: #1e293b; margin: 0 0 5px 0; font-size: 20px;">${boardTitle}</h3>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Quadro compartilhado por ${ownerName}</p>
            </div>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Você foi convidado para colaborar no quadro <strong>"${boardTitle}"</strong> no Kanban! 
              Para aceitar o convite, você precisa criar uma conta gratuita.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registerUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Criar Conta Grátis</a>
            </div>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 5px 5px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                💡 <strong>Dica:</strong> Use o mesmo email (${email}) ao se cadastrar para acessar o quadro automaticamente.
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Este convite foi enviado por ${ownerName} através do Kanban.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending invite email:', error);
      return false;
    }

    console.log('✅ Email de convite enviado! ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error in sendInviteEmail:', error);
    return false;
  }
}

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

    // If user doesn't exist, send invite email directly
    if (!user) {
      sendInviteEmail(email.toLowerCase(), board.title, board.owner.name).catch(err => 
        console.error('Failed to send invite email:', err)
      );
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
