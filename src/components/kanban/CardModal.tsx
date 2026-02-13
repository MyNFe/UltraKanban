'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Tag,
  FileText,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import { Card as CardType, Label, LABEL_COLORS, DEFAULT_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface CardModalProps {
  card: CardType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: CardType) => void;
  onDelete: () => void;
}

// Internal modal content that handles its own state
function CardModalContent({ 
  card, 
  onClose, 
  onSave, 
  onDelete 
}: { 
  card: CardType; 
  onClose: () => void; 
  onSave: (card: CardType) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>(card.labels);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    card.dueDate ? new Date(card.dueDate) : undefined
  );
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    
    onSave({
      ...card,
      title: title.trim(),
      description,
      labels: selectedLabels,
      dueDate: dueDate ? dueDate.toISOString() : null,
    });
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) =>
      prev.find((l) => l.id === label.id)
        ? prev.filter((l) => l.id !== label.id)
        : [...prev, label]
    );
  };

  const removeDueDate = () => {
    setDueDate(undefined);
    setIsCalendarOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const isOverdue = dueDate && dueDate < new Date();
  const isDueToday = dueDate && dueDate.toDateString() === new Date().toDateString();

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          Editar Cartão
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Título
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do cartão..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Descrição
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Adicione uma descrição mais detalhada..."
            rows={5}
          />
        </div>

        {/* Labels */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Labels
          </label>
          
          {/* Selected labels display */}
          {selectedLabels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedLabels.map((label) => (
                <span
                  key={label.id}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    LABEL_COLORS[label.color].bg,
                    LABEL_COLORS[label.color].text
                  )}
                >
                  {label.name}
                  <button
                    onClick={() => toggleLabel(label)}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="h-3 w-3 inline" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <Popover open={isLabelPopoverOpen} onOpenChange={setIsLabelPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Tag className="h-4 w-4 mr-2" />
                {selectedLabels.length > 0
                  ? 'Gerenciar labels'
                  : 'Adicionar labels'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Selecione as labels</h4>
                {DEFAULT_LABELS.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all',
                      LABEL_COLORS[label.color].bg,
                      LABEL_COLORS[label.color].text,
                      LABEL_COLORS[label.color].hover,
                      selectedLabels.find((l) => l.id === label.id) &&
                        'ring-2 ring-offset-2 ring-gray-400'
                    )}
                  >
                    <span>{label.name}</span>
                    {selectedLabels.find((l) => l.id === label.id) && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data de Vencimento
          </label>

          {/* Due date display */}
          {dueDate && (
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-sm font-medium',
                isOverdue
                  ? 'bg-red-100 text-red-700'
                  : isDueToday
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700'
              )}
            >
              <Calendar className="h-4 w-4" />
              {formatDate(dueDate.toISOString())}
              {isOverdue && ' (Vencido)'}
              {isDueToday && ' (Hoje)'}
              <button
                onClick={removeDueDate}
                className="ml-2 hover:opacity-70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                {dueDate ? 'Alterar data' : 'Definir data de vencimento'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date);
                  setIsCalendarOpen(false);
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="destructive"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir Cartão
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export function CardModal({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: CardModalProps) {
  // Use a key based on card id to force remount when card changes
  const modalKey = useMemo(() => card?.id || 'no-card', [card?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {card && (
        <CardModalContent
          key={modalKey}
          card={card}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Dialog>
  );
}
