'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Settings, MoreHorizontal, Star, User, Info, ArrowLeft, LogOut, LayoutDashboard, Share2 } from 'lucide-react';
import { useBoardList } from '@/contexts/BoardListContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card as CardType } from '@/types';
import { Column } from './Column';
import { CardModal } from './CardModal';
import { ShareModal } from './ShareModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function BoardView() {
  const { state: boardState, addColumn, updateColumnTitle, deleteColumn, addCard, updateCard, deleteCard, moveCard, updateBoardTitle, shareBoard, unshareBoard, isOwner, getOwnerName } = useBoardList();
  const { state: authState, logout } = useAuth();
  const router = useRouter();
  
  const board = boardState.currentBoard;
  const boardId = board?.id || '';
  const userIsOwner = board ? isOwner(board) : false;
  
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [ownerName, setOwnerName] = useState('Carregando...');

  // Fetch owner name when board changes
  useEffect(() => {
    if (board) {
      getOwnerName(board.userId).then(setOwnerName);
    }
  }, [board, getOwnerName]);

  // Sync local title with board title
  const currentBoardTitle = board?.title || '';
  if (boardTitle !== currentBoardTitle && !isEditingBoardTitle) {
    setBoardTitle(currentBoardTitle);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'card') {
      setActiveCard(activeData.card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'card') return;

    const activeCard = activeData.card;
    const activeColumnId = activeData.columnId;

    // Determine the target column and position
    let targetColumnId: string;
    let targetIndex: number;

    if (overData?.type === 'column') {
      // Dropped on a column - add to the end
      targetColumnId = overData.column.id;
      targetIndex = overData.column.cards.length;
    } else if (overData?.type === 'card') {
      // Dropped on another card
      targetColumnId = overData.columnId;
      targetIndex = board.columns
        .find((col) => col.id === targetColumnId)
        ?.cards.findIndex((c) => c.id === overData.card.id) || 0;
    } else {
      return;
    }

    // Only move if changing columns
    if (activeColumnId !== targetColumnId) {
      // Find the target column
      const targetColumn = board.columns.find((col) => col.id === targetColumnId);
      if (!targetColumn) return;

      // Move the card
      moveCard(boardId, activeCard.id, activeColumnId, targetColumnId, targetIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !board) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'card') return;

    const activeCard = activeData.card;
    const activeColumnId = activeData.columnId;

    // Handle reordering within the same column
    if (overData?.type === 'card' && overData.columnId === activeColumnId) {
      const targetColumnId = overData.columnId;
      const column = board.columns.find((col) => col.id === targetColumnId);
      
      if (column) {
        const newIndex = column.cards.findIndex((c) => c.id === overData.card.id);
        moveCard(boardId, activeCard.id, activeColumnId, targetColumnId, newIndex);
      }
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(boardId, newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleColumnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddColumn();
    } else if (e.key === 'Escape') {
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (card: CardType) => {
    updateCard(boardId, card.columnId, card);
    setSelectedCard(null);
  };

  const handleDeleteCard = () => {
    if (selectedCard) {
      deleteCard(boardId, selectedCard.columnId, selectedCard.id);
      setSelectedCard(null);
    }
  };

  const handleBoardTitleSubmit = () => {
    if (boardTitle.trim() && board && boardTitle !== board.title) {
      updateBoardTitle(boardId, boardTitle.trim());
    }
    setIsEditingBoardTitle(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleShare = (email: string) => {
    return shareBoard(boardId, email);
  };

  const handleUnshare = (email: string) => {
    unshareBoard(boardId, email);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <div className="text-white text-xl">Quadro não encontrado</div>
      </div>
    );
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
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Logo with home link */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-white to-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">K</span>
              </div>
              <span className="text-white font-semibold hidden sm:block">Kanban</span>
            </button>

            {/* Board Title */}
            <div className="flex items-center gap-2">
              {isEditingBoardTitle ? (
                <Input
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  onBlur={handleBoardTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleBoardTitleSubmit()}
                  autoFocus
                  className="h-8 w-64 bg-white/10 text-white border-white/20 placeholder:text-white/50"
                />
              ) : (
                <h1
                  className="text-white font-semibold text-lg cursor-pointer hover:bg-white/10 px-2 py-1 rounded"
                  onClick={() => {
                    setBoardTitle(board.title);
                    setIsEditingBoardTitle(true);
                  }}
                >
                  {board.title}
                </h1>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                <Star className="h-4 w-4" />
              </Button>
              
              {/* Shared badge */}
              {!userIsOwner && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartilhado
                </Badge>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Share button - only for owner */}
            {userIsOwner && (
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setIsShareModalOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
            )}
            
            {/* Back to Dashboard */}
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => router.push('/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10">
                  <Avatar className="h-7 w-7 bg-white/20">
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {getInitials(authState.user?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{authState.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{authState.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{authState.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Todos os Quadros
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Owner info for shared boards */}
      {!userIsOwner && (
        <div className="relative z-10 bg-black/10 px-4 py-2">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <User className="h-4 w-4" />
            <span>Proprietário: <strong className="text-white">{ownerName}</strong></span>
          </div>
        </div>
      )}

      {/* Board Content */}
      <main className="relative z-10 p-4 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start">
            <SortableContext
              items={board.columns.map((col) => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddCard={(title) => addCard(boardId, column.id, title)}
                  onUpdateTitle={(title) => updateColumnTitle(boardId, column.id, title)}
                  onDelete={() => deleteColumn(boardId, column.id)}
                  onCardClick={handleCardClick}
                  onDeleteCard={(cardId) => deleteCard(boardId, column.id, cardId)}
                />
              ))}
            </SortableContext>

            {/* Add Column Button */}
            <div className="flex-shrink-0">
              {isAddingColumn ? (
                <div className="w-72 bg-gray-100/90 backdrop-blur-sm rounded-xl p-3">
                  <Input
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={handleColumnKeyDown}
                    placeholder="Digite o título da lista..."
                    autoFocus
                    className="mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleAddColumn}
                      disabled={!newColumnTitle.trim()}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Adicionar lista
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNewColumnTitle('');
                        setIsAddingColumn(false);
                      }}
                      className="h-8 w-8"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="w-72 justify-start text-white/80 hover:text-white hover:bg-white/10 bg-white/5"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar outra lista
                </Button>
              )}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay adjustScale>
            {activeCard && (
              <div className="rotate-3 scale-105">
                <div className="bg-white rounded-lg shadow-xl border border-gray-300 p-3 max-w-xs">
                  <p className="text-sm font-medium text-gray-800">
                    {activeCard.title}
                  </p>
                  {activeCard.labels.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {activeCard.labels.map((label) => (
                        <span
                          key={label.id}
                          className={cn(
                            'h-2 w-8 rounded-full',
                            label.color === 'red' && 'bg-red-500',
                            label.color === 'orange' && 'bg-orange-500',
                            label.color === 'yellow' && 'bg-yellow-400',
                            label.color === 'green' && 'bg-green-500',
                            label.color === 'blue' && 'bg-blue-500',
                            label.color === 'purple' && 'bg-purple-500',
                            label.color === 'pink' && 'bg-pink-500'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Card Modal */}
      <CardModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setSelectedCard(null);
        }}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />

      {/* Share Modal */}
      {userIsOwner && board && (
        <ShareModal
          board={board}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShare={handleShare}
          onUnshare={handleUnshare}
          ownerEmail={authState.user?.email || ''}
          ownerName={authState.user?.name || ''}
        />
      )}
    </div>
  );
}
