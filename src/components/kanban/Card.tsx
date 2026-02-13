'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical, Trash2 } from 'lucide-react';
import { Card as CardType, LABEL_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CardProps {
  card: CardType;
  columnId: string;
  onClick: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}

export function Card({ card, columnId, onClick, onDelete, isDragging }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if card is overdue
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const isDueToday = card.dueDate && 
    new Date(card.dueDate).toDateString() === new Date().toDateString();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short' 
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking delete or drag handle
    if ((e.target as HTMLElement).closest('[data-delete]') || 
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    onClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white rounded-lg shadow-sm border border-gray-200',
        'hover:shadow-md hover:border-gray-300 transition-all duration-200',
        'cursor-pointer',
        isSortableDragging && 'opacity-50 shadow-lg ring-2 ring-blue-400',
        isDragging && 'rotate-3 scale-105',
      )}
    >
      {/* Labels strip */}
      {card.labels.length > 0 && (
        <div className="flex gap-1 px-2 pt-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className={cn(
                'h-2 w-10 rounded-full',
                LABEL_COLORS[label.color].bg,
              )}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Card content */}
      <div className="p-2 pb-3">
        {/* Drag handle */}
        <div
          data-drag-handle
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* Delete button */}
        <div
          data-delete
          className="absolute top-2 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O cartão &quot;{card.title}&quot; será permanentemente excluído.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-gray-800 mt-4 pr-14 break-words">
          {card.title}
        </p>

        {/* Footer indicators */}
        <div className="flex items-center gap-2 mt-2">
          {/* Due date */}
          {card.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                isOverdue
                  ? 'bg-red-100 text-red-700'
                  : isDueToday
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(card.dueDate)}
            </span>
          )}

          {/* Description indicator */}
          {card.description && (
            <span className="text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
