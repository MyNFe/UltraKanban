'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showVerifyScreen, setShowVerifyScreen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { state, register, clearError } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (state.user && !state.isLoading) {
      router.push('/dashboard');
    }
  }, [state.user, state.isLoading, router]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
    }

    if (!password) {
      errors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendVerificationEmail = async (userEmail: string, userName: string) => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, name: userName }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setEmailSent(true);
        setShowVerifyScreen(true);
      } else {
        // If email fails, still show success but with a warning
        console.error('Email sending failed:', data.error);
        setShowVerifyScreen(true);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      setShowVerifyScreen(true);
    }
    setIsSendingEmail(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await register(name, email, password);
    
    if (success) {
      // Send verification email
      await sendVerificationEmail(email, name);
    }
  };

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });
      setEmailSent(true);
    } catch (error) {
      console.error('Error resending email:', error);
    }
    setIsSendingEmail(false);
  };

  if (state.isLoading || isSendingEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
        <p className="text-white">
          {isSendingEmail ? 'Enviando email de verificação...' : 'Carregando...'}
        </p>
      </div>
    );
  }

  if (state.user) {
    return null; // Will redirect
  }

  // Show verify email screen
  if (showVerifyScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 p-4">
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

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-white to-blue-100 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-2xl">K</span>
              </div>
              <span className="text-white font-bold text-2xl">Kanban</span>
            </div>
          </div>

          {/* Verify Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifique seu Email
            </h1>
            
            <p className="text-gray-600 mb-4">
              Enviamos um link de verificação para:
            </p>
            
            <p className="font-medium text-blue-600 mb-6 bg-blue-50 py-2 px-4 rounded-lg">
              {email}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Próximos passos:
              </h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Abra seu email</li>
                <li>Clique no link de verificação</li>
                <li>Faça login na sua conta</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ir para Login
              </Button>

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isSendingEmail}
                className="w-full"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Reenviar Email'
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Não recebeu o email? Verifique sua caixa de spam ou lixo eletrônico.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 p-4">
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

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-white to-blue-100 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-2xl">K</span>
            </div>
            <span className="text-white font-bold text-2xl">Kanban</span>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Criar Conta</h1>
          <p className="text-gray-500 text-center mb-6">Preencha os dados para se cadastrar</p>

          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationErrors.name) {
                      setValidationErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  className={`pl-10 ${validationErrors.name ? 'border-red-500' : ''}`}
                />
              </div>
              {validationErrors.name && (
                <p className="text-red-500 text-sm">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`pl-10 ${validationErrors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-sm">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`pl-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                />
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-sm">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationErrors.confirmPassword) {
                      setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  className={`pl-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                />
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-sm">{validationErrors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
