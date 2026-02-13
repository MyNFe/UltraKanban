'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBoardList } from '@/contexts/BoardListContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Plus, Trash2, LayoutDashboard, MoreVertical, LogOut, Columns3, CreditCard, Share2, User } from 'lucide-react';

// Component to display owner name
function OwnerName({ ownerId, getOwnerName }: { ownerId: string; getOwnerName: (id: string) => Promise<string> }) {
  const [name, setName] = useState('Carregando...');
  
  useEffect(() => {
    getOwnerName(ownerId).then(setName);
  }, [ownerId, getOwnerName]);
  
  return <strong>{name}</strong>;
}

export default function DashboardPage() {
  const { state: authState, logout } = useAuth();
  const { state: boardState, createBoard, deleteBoard, getOwnerName } = useBoardList();
  const router = useRouter();
  
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push('/login');
    }
  }, [authState.user, authState.isLoading, router]);

  const handleCreateBoard = async () => {
    if (newBoardTitle.trim()) {
      const board = await createBoard(newBoardTitle.trim());
      setNewBoardTitle('');
      setIsCreatingBoard(false);
      router.push(`/board/${board.id}`);
    }
  };

  const handleDeleteBoard = () => {
    if (deleteBoardId) {
      deleteBoard(deleteBoardId);
      setDeleteBoardId(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTotalCards = (boardId: string) => {
    const board = boardState.boards.find(b => b.id === boardId) || boardState.sharedBoards.find(b => b.id === boardId);
    if (!board) return 0;
    return board.columns.reduce((acc, col) => acc + col.cards.length, 0);
  };

  const getTotalColumns = (boardId: string) => {
    const board = boardState.boards.find(b => b.id === boardId) || boardState.sharedBoards.find(b => b.id === boardId);
    return board?.columns.length || 0;
  };

  // Show loading state
  if (authState.isLoading || boardState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Don't render anything if not logged in (will redirect)
  if (!authState.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
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

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">K</span>
              </div>
              <span className="text-white font-semibold text-lg">Kanban</span>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
                    <Avatar className="h-8 w-8 bg-white/20">
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {getInitials(authState.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{authState.user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{authState.user.name}</p>
                    <p className="text-xs text-muted-foreground">{authState.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Boards Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">Meus Quadros</h2>
            <p className="text-white/70 text-sm">Quadros que você criou</p>
          </div>

          {/* Boards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Create New Board Card */}
            {isCreatingBoard ? (
              <Card className="bg-white/95 backdrop-blur-sm border-2 border-blue-400 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Novo Quadro</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Nome do quadro..."
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateBoard();
                      if (e.key === 'Escape') {
                        setNewBoardTitle('');
                        setIsCreatingBoard(false);
                      }
                    }}
                    autoFocus
                    className="mb-2"
                  />
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateBoard}
                    disabled={!newBoardTitle.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Criar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewBoardTitle('');
                      setIsCreatingBoard(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <button
                onClick={() => setIsCreatingBoard(true)}
                className="min-h-[180px] bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center gap-2 text-white/70 hover:text-white transition-all"
              >
                <Plus className="h-8 w-8" />
                <span className="font-medium">Criar novo quadro</span>
              </button>
            )}

            {/* Board Cards */}
            {boardState.boards.map((board) => (
              <Card
                key={board.id}
                className="bg-white/95 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer group"
                onClick={() => router.push(`/board/${board.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{board.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteBoardId(board.id);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir quadro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Columns3 className="h-4 w-4" />
                      <span>{getTotalColumns(board.id)} colunas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>{getTotalCards(board.id)} cartões</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-gray-400">
                  Criado em {new Date(board.createdAt).toLocaleDateString('pt-BR')}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Empty State for My Boards */}
          {boardState.boards.length === 0 && !isCreatingBoard && (
            <div className="text-center py-12">
              <LayoutDashboard className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum quadro ainda</h3>
              <p className="text-white/60 mb-4">Crie seu primeiro quadro para começar a organizar suas tarefas</p>
              <Button
                onClick={() => setIsCreatingBoard(true)}
                className="bg-white text-blue-600 hover:bg-white/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro quadro
              </Button>
            </div>
          )}
        </div>

        {/* Shared with me Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Share2 className="h-6 w-6" />
              Compartilhados comigo
            </h2>
            <p className="text-white/70 text-sm">Quadros que foram compartilhados com você</p>
          </div>

          {/* Shared Boards Grid */}
          {boardState.sharedBoards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boardState.sharedBoards.map((board) => (
                <Card
                  key={board.id}
                  className="bg-white/95 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/board/${board.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 shrink-0">
                            <Share2 className="h-3 w-3 mr-1" />
                            Compartilhado
                          </Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{board.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="truncate">
                          Proprietário: <OwnerName ownerId={board.userId} getOwnerName={getOwnerName} />
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Columns3 className="h-4 w-4" />
                        <span>{getTotalColumns(board.id)} colunas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>{getTotalCards(board.id)} cartões</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-gray-400">
                    Criado em {new Date(board.createdAt).toLocaleDateString('pt-BR')}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10">
              <Share2 className="h-10 w-10 text-white/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white/70 mb-1">Nenhum quadro compartilhado</h3>
              <p className="text-white/50 text-sm">
                Quando alguém compartilhar um quadro com você, ele aparecerá aqui
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteBoardId} onOpenChange={() => setDeleteBoardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir quadro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O quadro e todos os seus cartões serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBoard} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
