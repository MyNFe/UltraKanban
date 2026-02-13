import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { APP_URL, RESEND_SENDER_EMAIL } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured', success: false },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { email, boardTitle, ownerName, boardId } = await request.json();

    if (!email || !boardTitle || !ownerName) {
      return NextResponse.json(
        { error: 'Email, título do quadro e nome do proprietário são obrigatórios', success: false },
        { status: 400 }
      );
    }

    const registerUrl = `${APP_URL}/register`;

    console.log(`📧 Enviando email de convite para: ${email}`);
    console.log(`📧 Remetente: ${RESEND_SENDER_EMAIL}`);

    // Send invite email
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
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; line-height: 60px;">
                <span style="color: white; font-size: 28px; font-weight: bold;">K</span>
              </div>
              <h1 style="color: #1e40af; margin: 10px 0 0 0;">Kanban</h1>
            </div>

            <!-- Invite Banner -->
            <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 24px;">
                🎊 Você foi convidado!
              </h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                ${ownerName} quer compartilhar um quadro com você
              </p>
            </div>

            <!-- Board Info -->
            <div style="background: #f8fafc; border-radius: 10px; padding: 25px; text-align: center; margin-bottom: 25px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; margin: 0 auto 15px auto; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">📋</span>
              </div>
              <h3 style="color: #1e293b; margin: 0 0 5px 0; font-size: 20px;">
                ${boardTitle}
              </h3>
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                Quadro compartilhado por ${ownerName}
              </p>
            </div>

            <!-- Content -->
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Você foi convidado para colaborar no quadro <strong>"${boardTitle}"</strong> no Kanban! 
              Para aceitar o convite e começar a colaborar, você precisa criar uma conta gratuita.
            </p>

            <!-- What you can do -->
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 0 10px 10px 0; margin-bottom: 25px;">
              <h4 style="color: #166534; margin: 0 0 10px 0; font-size: 16px;">
                ✅ Após se cadastrar, você poderá:
              </h4>
              <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px;">
                <li style="margin-bottom: 5px;">Ver e editar os cartões do quadro</li>
                <li style="margin-bottom: 5px;">Adicionar novas tarefas e colunas</li>
                <li style="margin-bottom: 5px;">Colaborar em tempo real com a equipe</li>
                <li style="margin-bottom: 0;">Criar seus próprios quadros</li>
              </ul>
            </div>

            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${registerUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-right: 10px;">
                Criar Conta Grátis
              </a>
            </div>

            <p style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 25px;">
              Já tem uma conta? O quadro aparecerá automaticamente na seção "Compartilhados comigo" após o login.
            </p>

            <!-- Notice -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 0 5px 5px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                💡 <strong>Dica:</strong> Use o mesmo email do convite (${email}) ao se cadastrar para acessar o quadro automaticamente.
              </p>
            </div>

            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este convite foi enviado por ${ownerName} através do Kanban.
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 10px;">
              © 2024 Kanban - Organize suas ideias, conquiste seus objetivos.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending invite email:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Erro ao enviar email de convite', details: error, success: false },
        { status: 500 }
      );
    }

    console.log('✅ Email de convite enviado com sucesso! ID:', data?.id);

    return NextResponse.json({
      success: true,
      message: 'Email de convite enviado com sucesso',
      emailId: data?.id,
    });

  } catch (error: unknown) {
    console.error('❌ Error in send-invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage, success: false },
      { status: 500 }
    );
  }
}
