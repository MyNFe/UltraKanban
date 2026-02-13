'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useBoardList } from '@/contexts/BoardListContext';
import { BoardView } from '@/components/kanban/BoardView';
import { Loader2 } from 'lucide-react';

export default function BoardPage() {
  const { state: authState } = useAuth();
  const { state: boardState, loadBoard } = useBoardList();
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  // Redirect if not logged in
  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push('/login');
    }
  }, [authState.user, authState.isLoading, router]);

  // Load the specific board (from user's boards or shared boards)
  useEffect(() => {
    if (authState.user && boardId && !boardState.isLoading) {
      loadBoard(boardId);
    }
  }, [authState.user, boardId, boardState.isLoading, loadBoard]);

  // Check if board exists (in user's boards or shared boards)
  useEffect(() => {
    if (!boardState.isLoading && boardId) {
      const boardExists = boardState.boards.some(b => b.id === boardId) || 
                          boardState.sharedBoards.some(b => b.id === boardId);
      if (!boardExists && boardState.boards.length >= 0 && boardState.sharedBoards.length >= 0) {
        // Only redirect if we've finished loading and the board doesn't exist
        const timeoutId = setTimeout(() => {
          const stillNotExists = boardState.boards.every(b => b.id !== boardId) && 
                                 boardState.sharedBoards.every(b => b.id !== boardId);
          if (stillNotExists && !boardState.currentBoard) {
            router.push('/dashboard');
          }
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [boardState.isLoading, boardState.boards, boardState.sharedBoards, boardState.currentBoard, boardId, router]);

  // Show loading state
  if (authState.isLoading || boardState.isLoading || !boardState.currentBoard) {
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

  return <BoardView />;
}
