'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Board, UserSession } from '@/types';
import { Mail, X, Crown, AlertCircle, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ShareModalProps {
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onShare: (email: string) => Promise<{ success: boolean; warning?: string }>;
  onUnshare: (email: string) => void;
  ownerEmail: string;
  ownerName: string;
}

export function ShareModal({
  board,
  isOpen,
  onClose,
  onShare,
  onUnshare,
  ownerEmail,
  ownerName,
}: ShareModalProps) {
  const { findUserByEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<UserSession | null>(null);
  const [sharedUserInfos, setSharedUserInfos] = useState<Record<string, UserSession>>({});

  // Search for user when email changes
  const emailToSearch = email.trim();
  React.useEffect(() => {
    if (!emailToSearch || !emailToSearch.includes('@') || !emailToSearch.includes('.')) {
      setSearchResult(null);
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToSearch)) {
      setSearchResult(null);
      return;
    }
    
    findUserByEmail(emailToSearch).then(setSearchResult);
  }, [emailToSearch, findUserByEmail]);

  // Load user info for shared emails
  React.useEffect(() => {
    board.sharedWith.forEach(sharedEmail => {
      if (!sharedUserInfos[sharedEmail]) {
        findUserByEmail(sharedEmail).then(user => {
          if (user) {
            setSharedUserInfos(prev => ({ ...prev, [sharedEmail]: user }));
          }
        });
      }
    });
  }, [board.sharedWith, findUserByEmail, sharedUserInfos]);

  // Check if email is valid for showing search status
  const showSearchStatus = useMemo(() => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return false;
    return trimmedEmail.includes('@') && trimmedEmail.includes('.');
  }, [email]);

  const handleAddEmail = useCallback(async () => {
    setWarning(null);
    setError(null);
    
    if (!email.trim()) {
      setError('Digite um email');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Formato de email inválido');
      return;
    }
    
    // Check if already shared
    if (board.sharedWith.some(e => e.toLowerCase() === email.toLowerCase())) {
      setError('Este email já tem acesso ao quadro');
      return;
    }
    
    // Check if trying to share with owner
    if (email.toLowerCase() === ownerEmail.toLowerCase()) {
      setError('Não é possível compartilhar com o proprietário');
      return;
    }
    
    const result = await onShare(email.trim());
    if (result.success) {
      if (result.warning) {
        setWarning(result.warning);
      }
      setEmail('');
    }
  }, [email, board.sharedWith, ownerEmail, onShare]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEmail();
    }
  }, [handleAddEmail]);

  const handleClose = useCallback(() => {
    setEmail('');
    setWarning(null);
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Compartilhar Quadro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add email input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleAddEmail} className="shrink-0">
                Adicionar
              </Button>
            </div>

            {/* Search result indicator */}
            {showSearchStatus && (
              <div className="flex items-center gap-2 text-sm">
                {searchResult ? (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                    <CheckCircle className="h-3 w-3" />
                    <span>
                      <strong>{searchResult.name}</strong> encontrado!
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    <AlertCircle className="h-3 w-3" />
                    <span>Email não cadastrado no sistema</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          
          {/* Warning message */}
          {warning && (
            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {warning}
            </div>
          )}
          
          {/* People with access */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Pessoas com acesso:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Owner */}
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{ownerName}</span>
                    <span className="text-xs text-muted-foreground">{ownerEmail}</span>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Proprietário
                </Badge>
              </div>
              
              {/* Shared users */}
              {board.sharedWith.map((sharedEmail) => {
                const userInfo = sharedUserInfos[sharedEmail];
                return (
                  <div
                    key={sharedEmail}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium">
                        {userInfo ? userInfo.name.charAt(0).toUpperCase() : sharedEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        {userInfo ? (
                          <>
                            <span className="text-sm font-medium">{userInfo.name}</span>
                            <span className="text-xs text-muted-foreground">{userInfo.email}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">{sharedEmail}</span>
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Não cadastrado
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      onClick={() => onUnshare(sharedEmail)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              
              {/* Empty state for shared users */}
              {board.sharedWith.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/20 rounded-lg">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma pessoa com acesso além do proprietário</p>
                  <p className="text-xs mt-1">Digite um email acima para compartilhar</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Close button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
