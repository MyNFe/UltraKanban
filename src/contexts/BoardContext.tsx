'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Board, Card, Column, Label } from '@/types';

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initial mock data
const createInitialBoard = (): Board => ({
  id: generateId(),
  title: 'Meu Quadro Kanban',
  userId: '', // Local board, no owner
  sharedWith: [], // Not shared
  columns: [
    {
      id: generateId(),
      title: 'A Fazer',
      createdAt: new Date().toISOString(),
      cards: [
        {
          id: generateId(),
          title: 'Configurar projeto Next.js',
          description: 'Instalar todas as dependências necessárias e configurar o ambiente de desenvolvimento.',
          labels: [{ id: 'label-2', name: 'Feature', color: 'blue' }],
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          columnId: '',
        },
        {
          id: generateId(),
          title: 'Criar componentes base',
          description: 'Desenvolver os componentes reutilizáveis para o sistema.',
          labels: [{ id: 'label-4', name: 'Melhoria', color: 'green' }],
          dueDate: null,
          createdAt: new Date().toISOString(),
          columnId: '',
        },
        {
          id: generateId(),
          title: 'Implementar autenticação',
          description: 'Sistema de login e registro de usuários.',
          labels: [{ id: 'label-1', name: 'Urgente', color: 'red' }],
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          columnId: '',
        },
      ],
    },
    {
      id: generateId(),
      title: 'Em Progresso',
      createdAt: new Date().toISOString(),
      cards: [
        {
          id: generateId(),
          title: 'Desenvolver interface do Kanban',
          description: 'Criar o quadro com drag and drop funcional.',
          labels: [
            { id: 'label-6', name: 'Design', color: 'pink' },
            { id: 'label-2', name: 'Feature', color: 'blue' },
          ],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          columnId: '',
        },
        {
          id: generateId(),
          title: 'Corrigir bug do scroll',
          description: 'O scroll não está funcionando corretamente no mobile.',
          labels: [{ id: 'label-3', name: 'Bug', color: 'orange' }],
          dueDate: new Date().toISOString(), // Due today - will show as overdue or due soon
          createdAt: new Date().toISOString(),
          columnId: '',
        },
      ],
    },
    {
      id: generateId(),
      title: 'Concluído',
      createdAt: new Date().toISOString(),
      cards: [
        {
          id: generateId(),
          title: 'Definir estrutura do projeto',
          description: 'Organizar pastas e arquivos seguindo boas práticas.',
          labels: [{ id: 'label-5', name: 'Documentação', color: 'purple' }],
          dueDate: null,
          createdAt: new Date().toISOString(),
          columnId: '',
        },
      ],
    },
  ],
  createdAt: new Date().toISOString(),
  backgroundImage: undefined,
});

// Fix column IDs in cards
const fixCardColumnIds = (board: Board): Board => ({
  ...board,
  columns: board.columns.map(column => ({
    ...column,
    cards: column.cards.map(card => ({
      ...card,
      columnId: column.id,
    })),
  })),
});

// State type
interface BoardState {
  board: Board | null;
  isLoading: boolean;
}

// Action types
type BoardAction =
  | { type: 'SET_BOARD'; payload: Board }
  | { type: 'ADD_COLUMN'; payload: string }
  | { type: 'UPDATE_COLUMN_TITLE'; payload: { columnId: string; title: string } }
  | { type: 'DELETE_COLUMN'; payload: string }
  | { type: 'ADD_CARD'; payload: { columnId: string; title: string } }
  | { type: 'UPDATE_CARD'; payload: { columnId: string; card: Card } }
  | { type: 'DELETE_CARD'; payload: { columnId: string; cardId: string } }
  | { type: 'MOVE_CARD'; payload: { cardId: string; sourceColumnId: string; targetColumnId: string; targetIndex: number } }
  | { type: 'REORDER_CARDS'; payload: { columnId: string; cards: Card[] } }
  | { type: 'UPDATE_BOARD_TITLE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer
function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_BOARD':
      return { ...state, board: action.payload, isLoading: false };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'ADD_COLUMN': {
      if (!state.board) return state;
      const newColumn: Column = {
        id: generateId(),
        title: action.payload,
        cards: [],
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        board: {
          ...state.board,
          columns: [...state.board.columns, newColumn],
        },
      };
    }
    
    case 'UPDATE_COLUMN_TITLE': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.map(col =>
            col.id === action.payload.columnId
              ? { ...col, title: action.payload.title }
              : col
          ),
        },
      };
    }
    
    case 'DELETE_COLUMN': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.filter(col => col.id !== action.payload),
        },
      };
    }
    
    case 'ADD_CARD': {
      if (!state.board) return state;
      const newCard: Card = {
        id: generateId(),
        title: action.payload.title,
        description: '',
        labels: [],
        dueDate: null,
        createdAt: new Date().toISOString(),
        columnId: action.payload.columnId,
      };
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.map(col =>
            col.id === action.payload.columnId
              ? { ...col, cards: [...col.cards, newCard] }
              : col
          ),
        },
      };
    }
    
    case 'UPDATE_CARD': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.map(col =>
            col.id === action.payload.columnId
              ? {
                  ...col,
                  cards: col.cards.map(card =>
                    card.id === action.payload.card.id ? action.payload.card : card
                  ),
                }
              : col
          ),
        },
      };
    }
    
    case 'DELETE_CARD': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.map(col =>
            col.id === action.payload.columnId
              ? { ...col, cards: col.cards.filter(card => card.id !== action.payload.cardId) }
              : col
          ),
        },
      };
    }
    
    case 'MOVE_CARD': {
      if (!state.board) return state;
      const { cardId, sourceColumnId, targetColumnId, targetIndex } = action.payload;
      
      // Find the card
      let movedCard: Card | undefined;
      for (const col of state.board.columns) {
        const card = col.cards.find(c => c.id === cardId);
        if (card) {
          movedCard = card;
          break;
        }
      }
      
      if (!movedCard) return state;
      
      const updatedCard = { ...movedCard, columnId: targetColumnId };
      
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.map(col => {
            if (col.id === sourceColumnId && sourceColumnId !== targetColumnId) {
              // Remove card from source
              return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
            }
            if (col.id === targetColumnId) {
              if (sourceColumnId === targetColumnId) {
                // Reorder within same column
                const cards = [...col.cards];
                const currentIndex = cards.findIndex(c => c.id === cardId);
                const [removed] = cards.splice(currentIndex, 1);
                cards.splice(targetIndex, 0, removed);
                return { ...col, cards };
              } else {
                // Insert into target
                const cards = [...col.cards];
                cards.splice(targetIndex, 0, updatedCard);
                return { ...col, cards };
              }
            }
            return col;
          }),
        },
      };
    }
    
    case 'REORDER_CARDS': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          columns: state.board.columns.map(col =>
            col.id === action.payload.columnId
              ? { ...col, cards: action.payload.cards }
              : col
          ),
        },
      };
    }
    
    case 'UPDATE_BOARD_TITLE': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          title: action.payload,
        },
      };
    }
    
    default:
      return state;
  }
}

// Context type
interface BoardContextType {
  state: BoardState;
  addColumn: (title: string) => void;
  updateColumnTitle: (columnId: string, title: string) => void;
  deleteColumn: (columnId: string) => void;
  addCard: (columnId: string, title: string) => void;
  updateCard: (columnId: string, card: Card) => void;
  deleteCard: (columnId: string, cardId: string) => void;
  moveCard: (cardId: string, sourceColumnId: string, targetColumnId: string, targetIndex: number) => void;
  reorderCards: (columnId: string, cards: Card[]) => void;
  updateBoardTitle: (title: string) => void;
}

// Create context
const BoardContext = createContext<BoardContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'kanban-board-data';

// Provider component
export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, {
    board: null,
    isLoading: true,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedBoard = JSON.parse(savedData) as Board;
        dispatch({ type: 'SET_BOARD', payload: fixCardColumnIds(parsedBoard) });
      } else {
        // Initialize with mock data
        const initialBoard = createInitialBoard();
        dispatch({ type: 'SET_BOARD', payload: fixCardColumnIds(initialBoard) });
      }
    } catch (error) {
      console.error('Error loading board from localStorage:', error);
      const initialBoard = createInitialBoard();
      dispatch({ type: 'SET_BOARD', payload: fixCardColumnIds(initialBoard) });
    }
  }, []);

  // Save to localStorage whenever board changes
  useEffect(() => {
    if (state.board && !state.isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.board));
    }
  }, [state.board, state.isLoading]);

  // Actions
  const addColumn = useCallback((title: string) => {
    dispatch({ type: 'ADD_COLUMN', payload: title });
  }, []);

  const updateColumnTitle = useCallback((columnId: string, title: string) => {
    dispatch({ type: 'UPDATE_COLUMN_TITLE', payload: { columnId, title } });
  }, []);

  const deleteColumn = useCallback((columnId: string) => {
    dispatch({ type: 'DELETE_COLUMN', payload: columnId });
  }, []);

  const addCard = useCallback((columnId: string, title: string) => {
    dispatch({ type: 'ADD_CARD', payload: { columnId, title } });
  }, []);

  const updateCard = useCallback((columnId: string, card: Card) => {
    dispatch({ type: 'UPDATE_CARD', payload: { columnId, card } });
  }, []);

  const deleteCard = useCallback((columnId: string, cardId: string) => {
    dispatch({ type: 'DELETE_CARD', payload: { columnId, cardId } });
  }, []);

  const moveCard = useCallback((cardId: string, sourceColumnId: string, targetColumnId: string, targetIndex: number) => {
    dispatch({ type: 'MOVE_CARD', payload: { cardId, sourceColumnId, targetColumnId, targetIndex } });
  }, []);

  const reorderCards = useCallback((columnId: string, cards: Card[]) => {
    dispatch({ type: 'REORDER_CARDS', payload: { columnId, cards } });
  }, []);

  const updateBoardTitle = useCallback((title: string) => {
    dispatch({ type: 'UPDATE_BOARD_TITLE', payload: title });
  }, []);

  const value: BoardContextType = {
    state,
    addColumn,
    updateColumnTitle,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderCards,
    updateBoardTitle,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

// Hook to use the context
export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
}
