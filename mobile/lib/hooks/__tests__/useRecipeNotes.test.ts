import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  noteKeys,
  useCreateRecipeNote,
  useDeleteRecipeNote,
  useRecipeNotes,
} from '@/lib/hooks/use-recipe-notes';
import { createQueryWrapper } from '@/test/helpers';
import type { RecipeNote } from '@/lib/types';

const mockGetRecipeNotes = vi.fn();
const mockCreateRecipeNote = vi.fn();
const mockDeleteRecipeNote = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    getRecipeNotes: (...args: unknown[]) => mockGetRecipeNotes(...args),
    createRecipeNote: (...args: unknown[]) => mockCreateRecipeNote(...args),
    deleteRecipeNote: (...args: unknown[]) => mockDeleteRecipeNote(...args),
  },
}));

const sampleNote: RecipeNote = {
  id: 'note-1',
  recipe_id: 'recipe-abc',
  household_id: 'household-1',
  text: 'Great with extra garlic',
  created_by: 'user@example.com',
  created_at: '2026-02-15T10:00:00Z',
};

describe('noteKeys', () => {
  it('builds list key from recipe ID', () => {
    expect(noteKeys.list('abc')).toEqual(['recipe-notes', 'abc']);
  });
});

describe('useRecipeNotes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches notes for a recipe', async () => {
    mockGetRecipeNotes.mockResolvedValue([sampleNote]);

    const { result } = renderHook(() => useRecipeNotes('recipe-abc'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleNote]);
    expect(mockGetRecipeNotes).toHaveBeenCalledWith('recipe-abc');
  });

  it('does not fetch when recipeId is empty', () => {
    renderHook(() => useRecipeNotes(''), {
      wrapper: createQueryWrapper(),
    });
    expect(mockGetRecipeNotes).not.toHaveBeenCalled();
  });
});

describe('useCreateRecipeNote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls createRecipeNote with recipeId and note body', async () => {
    mockCreateRecipeNote.mockResolvedValue(sampleNote);

    const { result } = renderHook(() => useCreateRecipeNote(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate({
      recipeId: 'recipe-abc',
      note: { text: 'Great with extra garlic' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateRecipeNote).toHaveBeenCalledWith('recipe-abc', {
      text: 'Great with extra garlic',
    });
  });
});

describe('useDeleteRecipeNote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls deleteRecipeNote with recipeId and noteId', async () => {
    mockDeleteRecipeNote.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRecipeNote(), {
      wrapper: createQueryWrapper(),
    });

    result.current.mutate({ recipeId: 'recipe-abc', noteId: 'note-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteRecipeNote).toHaveBeenCalledWith('recipe-abc', 'note-1');
  });
});
