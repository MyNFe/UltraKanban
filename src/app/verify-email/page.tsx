'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() => {
    if (!token || !email) {
      return 'error';
    }
    return 'loading';
  });
  const [message, setMessage] = useState(() => {
    if (!token || !email) {
      return 'Link de verificação inválido. Verifique se o link está completo.';
    }
    return '';
  });

  useEffect(() => {
    // Skip if already in error state (no token/email)
    if (status === 'error' || !token || !email) {
      return;
    }

    let isCancelled = false;

    // Verify token
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        });

        if (isCancelled) return;

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Seu email foi verificado com sucesso!');
          
          // Update user in localStorage if exists
          const usersKey = 'kanban-users';
          const usersData = localStorage.getItem(usersKey);
          if (usersData) {
            const users = JSON.parse(usersData);
            const updatedUsers = users.map((u: { email: string; emailVerified?: boolean }) => {
              if (u.email.toLowerCase() === email.toLowerCase()) {
                return { ...u, emailVerified: true };
              }
              return u;
            });
            localStorage.setItem(usersKey, JSON.stringify(updatedUsers));
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao verificar email.');
        }
      } catch {
        if (isCancelled) return;
        setStatus('error');
        setMessage('Erro ao conectar com o servidor. Tente novamente.');
      }
    };

    verifyEmail();

    return () => {
      isCancelled = true;
    };
  }, [token, email]);

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando seu email...
            </h1>
            <p className="text-gray-600">
              Aguarde enquanto confirmamos seu endereço de email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verificado!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleGoToDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ir para o Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleGoToLogin}
                className="w-full"
              >
                Fazer Login
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erro na Verificação
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleGoToLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Voltar para Login
              </Button>
            </div>
          </>
        )}

        {/* Logo */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="text-gray-600 font-medium">Kanban</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
