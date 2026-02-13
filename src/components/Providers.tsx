'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { BoardListProvider } from '@/contexts/BoardListContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BoardListProvider>
        {children}
      </BoardListProvider>
    </AuthProvider>
  );
}
