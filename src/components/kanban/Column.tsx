'use client';

import React, { useState } from 'react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MoreHorizontal,
  Plus,
  Trash2,
  X,
  Pencil,
} from 'lucide-react';
import { Column as ColumnType, Card as CardType } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from './Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface ColumnProps {
  column: ColumnType;
  onAddCard: (title: string) => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  onCardClick: (card: CardType) => void;
  onDeleteCard: (cardId: string) => void;
}

export function Column({
  column,
  onAddCard,
  onUpdateTitle,
  onDelete,
  onCardClick,
  onDeleteCard,
}: ColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      onUpdateTitle(editedTitle.trim());
    } else {
      setEditedTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex-shrink-0 w-72 bg-gray-100/90 backdrop-blur-sm rounded-xl',
        'flex flex-col max-h-[calc(100vh-140px)]',
        isDragging && 'opacity-70 ring-2 ring-blue-400 ring-offset-2',
      )}
    >
      {/* Column Header */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between p-3 cursor-grab active:cursor-grabbing"
      >
        {isEditingTitle ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="h-7 text-sm font-semibold bg-white"
          />
        ) : (
          <h3
            className="font-semibold text-gray-700 text-sm cursor-text px-1"
            onClick={() => setIsEditingTitle(true)}
          >
            {column.title}
            <span className="ml-2 text-gray-400 font-normal">
              {column.cards.length}
            </span>
          </h3>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir lista
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-0 kanban-scrollbar">
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              columnId={column.id}
              onClick={() => onCardClick(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>

        {/* Add Card Form */}
        {isAddingCard && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite um título para este cartão..."
              className="w-full text-sm resize-none border-0 focus:outline-none focus:ring-0 min-h-[60px]"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                onClick={handleAddCard}
                disabled={!newCardTitle.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Adicionar
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNewCardTitle('');
                  setIsAddingCard(false);
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Card Button */}
      {!isAddingCard && (
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar cartão
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A lista &quot;{column.title}&quot; e todos os seus{' '}
              {column.cards.length} cartões serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
