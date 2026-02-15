/**
 * React Query hooks for recipe notes (household-scoped).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { RecipeNote, RecipeNoteCreate } from '../types';

export const noteKeys = {
  all: ['recipe-notes'] as const,
  list: (recipeId: string) => [...noteKeys.all, recipeId] as const,
};

export const useRecipeNotes = (recipeId: string) => {
  return useQuery<RecipeNote[]>({
    queryKey: noteKeys.list(recipeId),
    queryFn: () => api.getRecipeNotes(recipeId),
    enabled: !!recipeId,
  });
};

export const useCreateRecipeNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      note,
    }: {
      recipeId: string;
      note: RecipeNoteCreate;
    }) => api.createRecipeNote(recipeId, note),
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.list(recipeId) });
    },
  });
};

export const useDeleteRecipeNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      noteId,
    }: {
      recipeId: string;
      noteId: string;
    }) => api.deleteRecipeNote(recipeId, noteId),
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.list(recipeId) });
    },
  });
};
