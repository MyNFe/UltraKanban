import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Use your verified domain sender
// For testing, you can use: 'onboarding@resend.dev'
const getSenderEmail = () => process.env.RESEND_SENDER_EMAIL || 'contato@ultralike.com.br';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Send welcome email
    const { data, error } = await resend.emails.send({
      from: `Kanban <${getSenderEmail()}>`,
      to: email,
      subject: '🎉 Bem-vindo ao Kanban!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo ao Kanban!</title>
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

            <!-- Welcome Banner -->
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 28px;">
                🎉 Bem-vindo${name ? `, ${name}` : ''}!
              </h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                Sua conta foi criada com sucesso!
              </p>
            </div>

            <!-- Content -->
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Parabéns! Você agora faz parte do Kanban, a ferramenta perfeita para organizar suas tarefas e projetos de forma visual e colaborativa.
            </p>

            <!-- Features -->
            <div style="background: #f8fafc; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">
                ✨ O que você pode fazer agora:
              </h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 10px;">📋 <strong>Criar quadros</strong> para organizar seus projetos</li>
                <li style="margin-bottom: 10px;">📝 <strong>Adicionar cartões</strong> com tarefas e detalhes</li>
                <li style="margin-bottom: 10px;">🏷️ <strong>Usar labels</strong> para categorizar tarefas</li>
                <li style="margin-bottom: 10px;">📅 <strong>Definir prazos</strong> para suas atividades</li>
                <li style="margin-bottom: 10px;">👥 <strong>Compartilhar quadros</strong> com sua equipe</li>
                <li style="margin-bottom: 0;">🔄 <strong>Arrastar e soltar</strong> para organizar facilmente</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Começar Agora →
              </a>
            </div>

            <!-- Tips -->
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 10px 10px 0; margin-bottom: 25px;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">
                💡 Dica rápida
              </h4>
              <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">
                Comece criando seu primeiro quadro! Use colunas como "A Fazer", "Em Progresso" e "Concluído" para visualizar seu fluxo de trabalho.
              </p>
            </div>

            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Esta é uma mensagem automática. Não responda este email.
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
      console.error('Error sending welcome email:', error);
      return NextResponse.json(
        { error: 'Erro ao enviar email de boas-vindas', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Email de boas-vindas enviado com sucesso:', data?.id);

    return NextResponse.json({
      success: true,
      message: 'Email de boas-vindas enviado com sucesso',
      emailId: data?.id,
    });

  } catch (error: unknown) {
    console.error('Error in send-welcome:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
