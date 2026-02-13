'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading) {
      if (state.user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [state.user, state.isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}
