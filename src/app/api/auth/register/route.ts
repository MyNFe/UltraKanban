import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { APP_URL, RESEND_SENDER_EMAIL } from '@/lib/config';

// Simple hash function for password (demonstration purposes)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

// Send welcome email directly
async function sendWelcomeEmail(email: string, name: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return false;
    }

    const resend = new Resend(apiKey);

    console.log(`📧 Enviando email de boas-vindas para: ${email}`);

    const { data, error } = await resend.emails.send({
      from: `Kanban <${RESEND_SENDER_EMAIL}>`,
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
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; line-height: 60px;">
                <span style="color: white; font-size: 28px; font-weight: bold;">K</span>
              </div>
              <h1 style="color: #1e40af; margin: 10px 0 0 0;">Kanban</h1>
            </div>
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <h2 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🎉 Bem-vindo, ${name}!</h2>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Sua conta foi criada com sucesso!</p>
            </div>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Parabéns! Você agora faz parte do Kanban, a ferramenta perfeita para organizar suas tarefas e projetos.
            </p>
            <div style="background: #f8fafc; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">✨ O que você pode fazer agora:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                <li style="margin-bottom: 10px;">📋 <strong>Criar quadros</strong> para organizar seus projetos</li>
                <li style="margin-bottom: 10px;">📝 <strong>Adicionar cartões</strong> com tarefas e detalhes</li>
                <li style="margin-bottom: 10px;">🏷️ <strong>Usar labels</strong> para categorizar tarefas</li>
                <li style="margin-bottom: 10px;">📅 <strong>Definir prazos</strong> para suas atividades</li>
                <li style="margin-bottom: 10px;">👥 <strong>Compartilhar quadros</strong> com sua equipe</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Começar Agora →</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© 2024 Kanban - Organize suas ideias, conquiste seus objetivos.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }

    console.log('✅ Email de boas-vindas enviado! ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error in sendWelcomeEmail:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Create user
    const hashedPassword = simpleHash(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      }
    });

    // Send welcome email directly (don't wait for it)
    sendWelcomeEmail(user.email, user.name).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error: unknown) {
    console.error('Error in register:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
