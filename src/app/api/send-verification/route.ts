import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const getSenderEmail = () => process.env.RESEND_SENDER_EMAIL || 'contato@ultralike.com.br';

// Storage for verification tokens (in-memory for demo)
// In production, use a database
declare global {
  var verificationTokens: VerificationToken[];
}

interface VerificationToken {
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

// Initialize global tokens array
if (!global.verificationTokens) {
  global.verificationTokens = [];
}

// Get tokens
function getTokens(): VerificationToken[] {
  return global.verificationTokens || [];
}

// Save tokens
function saveTokens(tokens: VerificationToken[]) {
  global.verificationTokens = tokens;
}

// Generate random token
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

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

    // Generate verification token
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Save token
    const tokens = getTokens();
    
    // Remove old tokens for this email
    const filteredTokens = tokens.filter(t => t.email.toLowerCase() !== email.toLowerCase());
    
    // Add new token
    filteredTokens.push({
      email: email.toLowerCase(),
      token,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    
    saveTokens(filteredTokens);

    // Build verification URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `Kanban <${getSenderEmail()}>`,
      to: email,
      subject: 'Verifique seu email - Kanban',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifique seu Email</title>
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

            <!-- Greeting -->
            <h2 style="color: #333; margin-bottom: 20px;">Olá${name ? `, ${name}` : ''}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Obrigado por se cadastrar no Kanban! Para começar a usar sua conta, precisamos verificar seu endereço de email.
            </p>

            <!-- Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Verificar Email
              </a>
            </div>

            <!-- Alternative link -->
            <p style="color: #999; font-size: 14px; text-align: center;">
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </p>
            <p style="color: #3b82f6; font-size: 12px; word-break: break-all; text-align: center; background: #f3f4f6; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>

            <!-- Expiration notice -->
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 0 5px 5px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⏰ Este link expira em 24 horas.
              </p>
            </div>

            <!-- Footer -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Se você não criou uma conta no Kanban, pode ignorar este email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Erro ao enviar email de verificação', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email de verificação enviado com sucesso',
      tokenId: data?.id,
    });

  } catch (error: any) {
    console.error('Error in send-verification:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
