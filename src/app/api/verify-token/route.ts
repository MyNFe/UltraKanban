import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const getSenderEmail = () => process.env.RESEND_SENDER_EMAIL || 'contato@ultralike.com.br';

// Storage for verification tokens (must match send-verification)
declare global {
  var verificationTokens: VerificationToken[];
  var verifiedEmails: string[];
}

interface VerificationToken {
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

// Initialize global arrays
if (!global.verificationTokens) {
  global.verificationTokens = [];
}

if (!global.verifiedEmails) {
  global.verifiedEmails = [];
}

// Get tokens
function getTokens(): VerificationToken[] {
  return global.verificationTokens || [];
}

// Get verified emails
function getVerifiedEmails(): string[] {
  return global.verifiedEmails || [];
}

// Add verified email
function addVerifiedEmail(email: string) {
  const emails = getVerifiedEmails();
  if (!emails.includes(email.toLowerCase())) {
    emails.push(email.toLowerCase());
    global.verifiedEmails = emails;
  }
}

// Remove token
function removeToken(token: string) {
  const tokens = getTokens();
  global.verificationTokens = tokens.filter(t => t.token !== token);
}

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Find token
    const tokens = getTokens();
    const verificationToken = tokens.find(
      t => t.token === token && t.email.toLowerCase() === email.toLowerCase()
    );

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token de verificação inválido' },
        { status: 400 }
      );
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = new Date(verificationToken.expiresAt);

    if (now > expiresAt) {
      // Remove expired token
      removeToken(token);
      return NextResponse.json(
        { error: 'Token de verificação expirado. Solicite um novo email de verificação.' },
        { status: 400 }
      );
    }

    // Mark email as verified
    addVerifiedEmail(email);
    
    // Remove used token
    removeToken(token);

    // Send welcome email asynchronously (don't wait for it)
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      resend.emails.send({
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
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; line-height: 60px;">
                  <span style="color: white; font-size: 28px; font-weight: bold;">K</span>
                </div>
                <h1 style="color: #1e40af; margin: 10px 0 0 0;">Kanban</h1>
              </div>
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 10px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: white; margin: 0 0 10px 0; font-size: 28px;">🎉 Bem-vindo!</h2>
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Sua conta foi verificada com sucesso!</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Começar Agora →</a>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">© 2024 Kanban - Organize suas ideias, conquiste seus objetivos.</p>
            </div>
          </body>
          </html>
        `,
      }).catch(err => console.error('Error sending welcome email:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Email verificado com sucesso!',
    });

  } catch (error: unknown) {
    console.error('Error in verify-token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to check if email is verified
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const verifiedEmails = getVerifiedEmails();
    const isVerified = verifiedEmails.includes(email.toLowerCase());

    return NextResponse.json({
      verified: isVerified,
    });

  } catch (error: unknown) {
    console.error('Error checking verification:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
