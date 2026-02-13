export type LabelColor = 
  | 'red' 
  | 'orange' 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'pink';

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  labels: Label[];
  dueDate: string | null;
  createdAt: string;
  columnId: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  userId: string;           // ID do criador do quadro (proprietário)
  sharedWith: string[];     // Lista de emails com acesso
  columns: Column[];
  createdAt: string;
  backgroundImage?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  emailVerified?: boolean;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
}

export interface DragItem {
  type: 'card' | 'column';
  id: string;
  columnId?: string;
}

export const LABEL_COLORS: Record<LabelColor, { bg: string; text: string; hover: string }> = {
  red: { bg: 'bg-red-500', text: 'text-white', hover: 'hover:bg-red-600' },
  orange: { bg: 'bg-orange-500', text: 'text-white', hover: 'hover:bg-orange-600' },
  yellow: { bg: 'bg-yellow-400', text: 'text-gray-900', hover: 'hover:bg-yellow-500' },
  green: { bg: 'bg-green-500', text: 'text-white', hover: 'hover:bg-green-600' },
  blue: { bg: 'bg-blue-500', text: 'text-white', hover: 'hover:bg-blue-600' },
  purple: { bg: 'bg-purple-500', text: 'text-white', hover: 'hover:bg-purple-600' },
  pink: { bg: 'bg-pink-500', text: 'text-white', hover: 'hover:bg-pink-600' },
};

export const DEFAULT_LABELS: Label[] = [
  { id: 'label-1', name: 'Urgente', color: 'red' },
  { id: 'label-2', name: 'Feature', color: 'blue' },
  { id: 'label-3', name: 'Bug', color: 'orange' },
  { id: 'label-4', name: 'Melhoria', color: 'green' },
  { id: 'label-5', name: 'Documentação', color: 'purple' },
  { id: 'label-6', name: 'Design', color: 'pink' },
  { id: 'label-7', name: 'Baixa Prioridade', color: 'yellow' },
];
