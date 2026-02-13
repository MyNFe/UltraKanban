'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Board, Card, Column, Label } from '@/types';
import { useAuth } from './AuthContext';

// Convert database board to frontend board format
const convertBoard = (dbBoard: any): Board => ({
  id: dbBoard.id,
  title: dbBoard.title,
  userId: dbBoard.userId,
  sharedWith: dbBoard.sharedWith?.map((s: any) => s.email) || [],
  columns: dbBoard.columns?.map((col: any) => ({
    id: col.id,
    title: col.title,
    cards: col.cards?.map((card: any) => ({
      id: card.id,
      title: card.title,
      description: card.description || '',
      labels: card.labels?.map((l: any) => ({
        id: l.id,
        name: l.name || '',
        color: l.color as any,
      })) || [],
      dueDate: card.dueDate || null,
      createdAt: card.createdAt,
      columnId: col.id,
    })) || [],
    createdAt: col.createdAt,
  })) || [],
  createdAt: dbBoard.createdAt,
});

interface BoardListState {
  boards: Board[];
  sharedBoards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
}

type BoardListAction =
  | { type: 'SET_BOARDS'; payload: { boards: Board[]; sharedBoards: Board[] } }
  | { type: 'SET_CURRENT_BOARD'; payload: Board | null }
  | { type: 'UPDATE_CURRENT_BOARD'; payload: Board }
  | { type: 'ADD_BOARD'; payload: Board }
  | { type: 'DELETE_BOARD'; payload: string }
  | { type: 'UPDATE_BOARD'; payload: Board };

function boardListReducer(state: BoardListState, action: BoardListAction): BoardListState {
  switch (action.type) {
    case 'SET_BOARDS':
      return { ...state, boards: action.payload.boards, sharedBoards: action.payload.sharedBoards, isLoading: false };
    case 'SET_CURRENT_BOARD':
      return { ...state, currentBoard: action.payload };
    case 'UPDATE_CURRENT_BOARD': {
      if (state.currentBoard?.id === action.payload.id) {
        return { ...state, currentBoard: action.payload };
      }
      return state;
    }
    case 'ADD_BOARD':
      return { ...state, boards: [...state.boards, action.payload] };
    case 'DELETE_BOARD':
      return {
        ...state,
        boards: state.boards.filter(b => b.id !== action.payload),
        sharedBoards: state.sharedBoards.filter(b => b.id !== action.payload),
        currentBoard: state.currentBoard?.id === action.payload ? null : state.currentBoard,
      };
    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map(b => b.id === action.payload.id ? action.payload : b),
        sharedBoards: state.sharedBoards.map(b => b.id === action.payload.id ? action.payload : b),
        currentBoard: state.currentBoard?.id === action.payload.id ? action.payload : state.currentBoard,
      };
    default:
      return state;
  }
}

interface BoardListContextType {
  state: BoardListState;
  loadBoards: () => Promise<void>;
  createBoard: (title: string) => Promise<Board>;
  deleteBoard: (boardId: string) => Promise<void>;
  updateBoardTitle: (boardId: string, title: string) => Promise<void>;
  shareBoard: (boardId: string, email: string) => Promise<{ success: boolean; warning?: string }>;
  unshareBoard: (boardId: string, email: string) => Promise<void>;
  addColumn: (boardId: string, title: string) => Promise<Column>;
  updateColumnTitle: (boardId: string, columnId: string, title: string) => Promise<void>;
  deleteColumn: (boardId: string, columnId: string) => Promise<void>;
  addCard: (boardId: string, columnId: string, title: string) => Promise<void>;
  updateCard: (boardId: string, columnId: string, card: Card) => Promise<void>;
  deleteCard: (boardId: string, columnId: string, cardId: string) => Promise<void>;
  moveCard: (boardId: string, cardId: string, sourceColumnId: string, targetColumnId: string, targetIndex: number) => Promise<void>;
  loadBoard: (boardId: string) => Promise<void>;
  refreshCurrentBoard: () => Promise<void>;
  isOwner: (board: Board) => boolean;
  getOwnerName: (ownerId: string) => Promise<string>;
}

const BoardListContext = createContext<BoardListContextType | undefined>(undefined);

export function BoardListProvider({ children }: { children: React.ReactNode }) {
  const { state: authState } = useAuth();
  const [state, dispatch] = useReducer(boardListReducer, {
    boards: [],
    sharedBoards: [],
    currentBoard: null,
    isLoading: true,
  });
  
  // Use ref to track current board id for refresh
  const currentBoardIdRef = useRef<string | null>(null);

  // Update ref when currentBoard changes
  useEffect(() => {
    currentBoardIdRef.current = state.currentBoard?.id || null;
  }, [state.currentBoard]);

  // Load boards when user changes
  const loadBoards = useCallback(async () => {
    if (!authState.user) {
      dispatch({ type: 'SET_BOARDS', payload: { boards: [], sharedBoards: [] } });
      return;
    }

    try {
      const response = await fetch(`/api/boards?userId=${authState.user.id}&userEmail=${encodeURIComponent(authState.user.email)}`);
      const data = await response.json();

      const boards = data.boards.map(convertBoard);
      const sharedBoards = data.sharedBoards.map(convertBoard);

      dispatch({ type: 'SET_BOARDS', payload: { boards, sharedBoards } });
      
      // Also update currentBoard if it exists
      const currentId = currentBoardIdRef.current;
      if (currentId) {
        const updatedBoard = [...boards, ...sharedBoards].find(b => b.id === currentId);
        if (updatedBoard) {
          dispatch({ type: 'SET_CURRENT_BOARD', payload: updatedBoard });
        }
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      dispatch({ type: 'SET_BOARDS', payload: { boards: [], sharedBoards: [] } });
    }
  }, [authState.user]);

  // Refresh current board from server using ref
  const refreshCurrentBoard = useCallback(async () => {
    const boardId = currentBoardIdRef.current;
    if (!boardId) return;
    
    try {
      const response = await fetch(`/api/boards/${boardId}`);
      const data = await response.json();
      if (data.board) {
        const board = convertBoard(data.board);
        dispatch({ type: 'SET_CURRENT_BOARD', payload: board });
      }
    } catch (error) {
      console.error('Error refreshing current board:', error);
    }
  }, []); // No dependencies - uses ref

  useEffect(() => {
    if (authState.isLoading) return;
    loadBoards();
  }, [authState.user, authState.isLoading, loadBoards]);

  const createBoard = useCallback(async (title: string): Promise<Board> => {
    if (!authState.user) throw new Error('User not authenticated');

    const response = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, userId: authState.user.id }),
    });

    const data = await response.json();
    const board = convertBoard(data.board);
    dispatch({ type: 'ADD_BOARD', payload: board });
    return board;
  }, [authState.user]);

  const deleteBoard = useCallback(async (boardId: string) => {
    await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
    dispatch({ type: 'DELETE_BOARD', payload: boardId });
  }, []);

  const updateBoardTitle = useCallback(async (boardId: string, title: string) => {
    await fetch(`/api/boards/${boardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    await loadBoards();
    await refreshCurrentBoard();
  }, [loadBoards, refreshCurrentBoard]);

  const shareBoard = useCallback(async (boardId: string, email: string): Promise<{ success: boolean; warning?: string }> => {
    if (!authState.user) return { success: false };

    const board = state.boards.find(b => b.id === boardId);
    if (!board) return { success: false };

    const response = await fetch(`/api/boards/${boardId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.success) {
      // Refresh boards to get updated sharedWith
      await loadBoards();
      await refreshCurrentBoard();
      return { success: true, warning: data.warning };
    }

    return { success: false };
  }, [authState.user, state.boards, loadBoards, refreshCurrentBoard]);

  const unshareBoard = useCallback(async (boardId: string, email: string) => {
    await fetch(`/api/boards/${boardId}/share?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    await loadBoards();
    await refreshCurrentBoard();
  }, [loadBoards, refreshCurrentBoard]);

  const addColumn = useCallback(async (boardId: string, title: string): Promise<Column> => {
    const response = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, title }),
    });
    const data = await response.json();
    await refreshCurrentBoard();
    return data.column;
  }, [refreshCurrentBoard]);

  const updateColumnTitle = useCallback(async (boardId: string, columnId: string, title: string) => {
    await fetch('/api/columns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: columnId, title }),
    });
    await refreshCurrentBoard();
  }, [refreshCurrentBoard]);

  const deleteColumn = useCallback(async (boardId: string, columnId: string) => {
    await fetch(`/api/columns?id=${columnId}`, { method: 'DELETE' });
    await refreshCurrentBoard();
  }, [refreshCurrentBoard]);

  const addCard = useCallback(async (boardId: string, columnId: string, title: string) => {
    await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId, title }),
    });
    await refreshCurrentBoard();
  }, [refreshCurrentBoard]);

  const updateCard = useCallback(async (boardId: string, columnId: string, card: Card) => {
    await fetch('/api/cards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: card.id,
        title: card.title,
        description: card.description,
        dueDate: card.dueDate,
        labels: card.labels,
      }),
    });
    await refreshCurrentBoard();
  }, [refreshCurrentBoard]);

  const deleteCard = useCallback(async (boardId: string, columnId: string, cardId: string) => {
    await fetch(`/api/cards?id=${cardId}`, { method: 'DELETE' });
    await refreshCurrentBoard();
  }, [refreshCurrentBoard]);

  const moveCard = useCallback(async (boardId: string, cardId: string, sourceColumnId: string, targetColumnId: string, targetIndex: number) => {
    await fetch('/api/cards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, targetColumnId, targetIndex }),
    });
    await refreshCurrentBoard();
  }, [refreshCurrentBoard]);

  const loadBoard = useCallback(async (boardId: string) => {
    const response = await fetch(`/api/boards/${boardId}`);
    const data = await response.json();
    if (data.board) {
      dispatch({ type: 'SET_CURRENT_BOARD', payload: convertBoard(data.board) });
    }
  }, []);

  const isOwner = useCallback((board: Board): boolean => {
    return authState.user?.id === board.userId;
  }, [authState.user]);

  const getOwnerName = useCallback(async (ownerId: string): Promise<string> => {
    if (authState.user?.id === ownerId) {
      return authState.user.name;
    }
    
    try {
      const response = await fetch(`/api/users?id=${ownerId}`);
      const data = await response.json();
      return data.user?.name || 'Usuário';
    } catch {
      return 'Usuário';
    }
  }, [authState.user]);

  const value: BoardListContextType = {
    state,
    loadBoards,
    createBoard,
    deleteBoard,
    updateBoardTitle,
    shareBoard,
    unshareBoard,
    addColumn,
    updateColumnTitle,
    deleteColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    loadBoard,
    refreshCurrentBoard,
    isOwner,
    getOwnerName,
  };

  return <BoardListContext.Provider value={value}>{children}</BoardListContext.Provider>;
}

export function useBoardList() {
  const context = useContext(BoardListContext);
  if (context === undefined) {
    throw new Error('useBoardList must be used within a BoardListProvider');
  }
  return context;
}
