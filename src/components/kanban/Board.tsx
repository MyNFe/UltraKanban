'use client';

import React, { useState } from 'react';
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
import { Plus, Settings, MoreHorizontal, Star, User, Info } from 'lucide-react';
import { useBoard } from '@/contexts/BoardContext';
import { Card as CardType, Card as CardData } from '@/types';
import { Column } from './Column';
import { CardModal } from './CardModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Board() {
  const { state, addColumn, updateColumnTitle, deleteColumn, addCard, updateCard, deleteCard, moveCard } = useBoard();
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(state.board?.title || '');

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
    if (!over) return;

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
      targetIndex = state.board?.columns
        .find((col) => col.id === targetColumnId)
        ?.cards.findIndex((c) => c.id === overData.card.id) || 0;
    } else {
      return;
    }

    // Only move if changing columns
    if (activeColumnId !== targetColumnId) {
      // Find the target column
      const targetColumn = state.board?.columns.find((col) => col.id === targetColumnId);
      if (!targetColumn) return;

      // Find the current index of the card in the source column
      const sourceColumn = state.board?.columns.find((col) => col.id === activeColumnId);
      const sourceIndex = sourceColumn?.cards.findIndex((c) => c.id === activeCard.id) || 0;

      // Move the card
      moveCard(activeCard.id, activeColumnId, targetColumnId, targetIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !state.board) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'card') return;

    const activeCard = activeData.card;
    const activeColumnId = activeData.columnId;

    // Handle reordering within the same column
    if (overData?.type === 'card' && overData.columnId === activeColumnId) {
      const targetColumnId = overData.columnId;
      const column = state.board.columns.find((col) => col.id === targetColumnId);
      
      if (column) {
        const oldIndex = column.cards.findIndex((c) => c.id === activeCard.id);
        const newIndex = column.cards.findIndex((c) => c.id === overData.card.id);
        
        if (oldIndex !== newIndex) {
          const newCards = [...column.cards];
          const [movedCard] = newCards.splice(oldIndex, 1);
          newCards.splice(newIndex, 0, movedCard);
          
          // Update the order using moveCard
          moveCard(activeCard.id, activeColumnId, targetColumnId, newIndex);
        }
      }
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim());
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
    updateCard(card.columnId, card);
    setSelectedCard(null);
  };

  const handleDeleteCard = () => {
    if (selectedCard) {
      deleteCard(selectedCard.columnId, selectedCard.id);
      setSelectedCard(null);
    }
  };

  const handleBoardTitleSubmit = () => {
    if (boardTitle.trim() && state.board && boardTitle !== state.board.title) {
      // Could add updateBoardTitle action
    }
    setIsEditingBoardTitle(false);
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <div className="animate-pulse text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!state.board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <div className="text-white text-xl">Nenhum quadro encontrado</div>
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
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-blue-100 rounded flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">K</span>
              </div>
              <span className="text-white font-semibold hidden sm:block">Kanban</span>
            </div>

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
                    setBoardTitle(state.board?.title || '');
                    setIsEditingBoardTitle(true);
                  }}
                >
                  {state.board.title}
                </h1>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <User className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  Sobre
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

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
              items={state.board.columns.map((col) => col.id)}
              strategy={horizontalListSortingStrategy}
            >
              {state.board.columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onAddCard={(title) => addCard(column.id, title)}
                  onUpdateTitle={(title) => updateColumnTitle(column.id, title)}
                  onDelete={() => deleteColumn(column.id)}
                  onCardClick={handleCardClick}
                  onDeleteCard={(cardId) => deleteCard(column.id, cardId)}
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
    </div>
  );
}
