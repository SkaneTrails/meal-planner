import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper, mockRecipe } from '@/test/helpers';

vi.mock('react-native', async () => {
  const actual = await vi.importActual<typeof import('react-native')>('react-native');
  return {
    ...actual,
    PanResponder: {
      create: vi.fn(() => ({ panHandlers: {} })),
    },
  };
});

const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

const mockPreviewRecipeMutateAsync = vi.fn();
const mockCreateRecipeMutateAsync = vi.fn();
const mockPickImage = vi.fn();

let mockSearchParams: Record<string, string | undefined> = {};

vi.mock('expo-router', () => ({
  useLocalSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => ({
    push: mockRouterPush,
    back: mockRouterBack,
  })),
}));

vi.mock('@/lib/hooks', () => ({
  usePreviewRecipe: vi.fn(() => ({
    mutateAsync: mockPreviewRecipeMutateAsync,
    isPending: false,
  })),
  useCreateRecipe: vi.fn(() => ({
    mutateAsync: mockCreateRecipeMutateAsync,
    isPending: false,
  })),
  useImagePicker: vi.fn((onPick: (uri: string) => void) => ({
    pickImage: () => {
      mockPickImage();
      onPick('file:///picked-image.jpg');
    },
  })),
}));

vi.mock('@/lib/api', () => ({
  api: {
    uploadRecipeImage: vi.fn().mockResolvedValue(undefined),
  },
  ApiClientError: class ApiClientError extends Error {
    reason?: string;
    status: number;
    constructor(message: string, status = 0, reason?: string) {
      super(message);
      this.status = status;
      this.reason = reason;
    }
  },
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'en' }),
}));

vi.mock('@/lib/alert', () => ({
  showAlert: vi.fn(),
  showNotification: vi.fn(),
}));

import { showAlert, showNotification } from '@/lib/alert';
import { api, ApiClientError } from '@/lib/api';
import { useAddRecipeActions } from '../useAddRecipeActions';

describe('useAddRecipeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = {};
  });

  const render = () =>
    renderHook(() => useAddRecipeActions(), { wrapper: createQueryWrapper() });

  describe('initial state', () => {
    it('starts with empty URL and no manual mode', () => {
      const { result } = render();
      expect(result.current.url).toBe('');
      expect(result.current.isManualMode).toBe(false);
    });

    it('initializes URL from search params', () => {
      mockSearchParams = { url: 'https://example.com/recipe' };
      const { result } = render();
      expect(result.current.url).toBe('https://example.com/recipe');
    });

    it('detects manual mode from search params', () => {
      mockSearchParams = { manual: 'true' };
      const { result } = render();
      expect(result.current.isManualMode).toBe(true);
    });

    it('starts with enhance disabled', () => {
      const { result } = render();
      expect(result.current.enhanceWithAI).toBe(false);
    });

    it('starts with no pending operations', () => {
      const { result } = render();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('URL validation', () => {
    it('shows notification for invalid URL', async () => {
      const { result } = render();
      act(() => result.current.setUrl('not-a-url'));
      await act(() => result.current.handleImport());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.invalidUrl',
        'addRecipe.invalidUrlMessage',
      );
      expect(mockPreviewRecipeMutateAsync).not.toHaveBeenCalled();
    });

    it('shows notification for ftp:// URL', async () => {
      const { result } = render();
      act(() => result.current.setUrl('ftp://example.com/recipe'));
      await act(() => result.current.handleImport());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.invalidUrl',
        'addRecipe.invalidUrlMessage',
      );
    });
  });

  describe('handleImport', () => {
    it('calls previewRecipe with URL and enhance flag', async () => {
      const preview = { original: mockRecipe({ title: 'Preview' }), enhanced: null, changes_made: [] };
      mockPreviewRecipeMutateAsync.mockResolvedValueOnce(preview);
      const { result } = render();
      act(() => result.current.setUrl('https://example.com/recipe'));
      await act(() => result.current.handleImport());
      expect(mockPreviewRecipeMutateAsync).toHaveBeenCalledWith({
        url: 'https://example.com/recipe',
        enhance: false,
      });
    });

    it('navigates to review page with preview data', async () => {
      const preview = { original: mockRecipe({ title: 'Preview' }), enhanced: null, changes_made: [] };
      mockPreviewRecipeMutateAsync.mockResolvedValueOnce(preview);
      const { result } = render();
      act(() => result.current.setUrl('https://example.com/recipe'));
      await act(() => result.current.handleImport());
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/review-recipe',
        params: { preview: JSON.stringify(preview) },
      });
    });

    it('shows blocked site error', async () => {
      const err = new ApiClientError('blocked', 0, 'blocked');
      mockPreviewRecipeMutateAsync.mockRejectedValueOnce(err);
      const { result } = render();
      act(() => result.current.setUrl('https://blocked.com/recipe'));
      await act(() => result.current.handleImport());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.importFailed',
        expect.stringContaining('addRecipe.siteBlocked'),
      );
    });

    it('shows not-supported site error', async () => {
      const err = new ApiClientError('not supported', 0, 'not_supported');
      mockPreviewRecipeMutateAsync.mockRejectedValueOnce(err);
      const { result } = render();
      act(() => result.current.setUrl('https://unknown.com/recipe'));
      await act(() => result.current.handleImport());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.importFailed',
        expect.stringContaining('addRecipe.siteNotSupported'),
      );
    });

    it('shows duplicate recipe error for 409', async () => {
      const err = new ApiClientError('exists', 409);
      mockPreviewRecipeMutateAsync.mockRejectedValueOnce(err);
      const { result } = render();
      act(() => result.current.setUrl('https://example.com/recipe'));
      await act(() => result.current.handleImport());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.importFailed',
        'addRecipe.recipeExists',
      );
    });

    it('shows generic error for unknown failures', async () => {
      mockPreviewRecipeMutateAsync.mockRejectedValueOnce(new Error('network down'));
      const { result } = render();
      act(() => result.current.setUrl('https://example.com/recipe'));
      await act(() => result.current.handleImport());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.importFailed',
        'network down',
      );
    });
  });

  describe('handleCreateManual', () => {
    it('requires title', async () => {
      const { result } = render();
      await act(() => result.current.handleCreateManual());
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'addRecipe.titleRequired',
      );
      expect(mockCreateRecipeMutateAsync).not.toHaveBeenCalled();
    });

    it('validates servings as positive integer', async () => {
      const { result } = render();
      act(() => result.current.setTitle('Test Recipe'));
      act(() => result.current.setServings('-1'));
      await act(() => result.current.handleCreateManual());
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'addRecipe.servingsInvalid',
      );
    });

    it('validates servings rejects zero', async () => {
      const { result } = render();
      act(() => result.current.setTitle('Test Recipe'));
      act(() => result.current.setServings('0'));
      await act(() => result.current.handleCreateManual());
      expect(showNotification).toHaveBeenCalledWith(
        'common.error',
        'addRecipe.servingsInvalid',
      );
    });

    it('creates recipe with parsed fields', async () => {
      mockCreateRecipeMutateAsync.mockResolvedValueOnce(
        mockRecipe({ id: 'created-1', title: 'Manual Recipe' }),
      );
      const { result } = render();
      act(() => {
        result.current.setTitle('Manual Recipe');
        result.current.setIngredients('flour\nmilk\neggs');
        result.current.setInstructions('Mix\nBake');
        result.current.setServings('4');
        result.current.setPrepTime('10');
        result.current.setCookTime('30');
      });
      await act(() => result.current.handleCreateManual());
      expect(mockCreateRecipeMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Manual Recipe',
          ingredients: ['flour', 'milk', 'eggs'],
          instructions: ['Mix', 'Bake'],
          servings: 4,
          prep_time: 10,
          cook_time: 30,
        }),
      );
    });

    it('uploads image after creating recipe', async () => {
      mockCreateRecipeMutateAsync.mockResolvedValueOnce(
        mockRecipe({ id: 'created-1', title: 'With Image' }),
      );
      const { result } = render();
      act(() => result.current.setTitle('With Image'));

      act(() => result.current.handlePickImage());
      expect(result.current.selectedImage).toBe('file:///picked-image.jpg');

      await act(() => result.current.handleCreateManual());
      expect(api.uploadRecipeImage).toHaveBeenCalledWith(
        'created-1',
        'file:///picked-image.jpg',
      );
    });

    it('shows error on creation failure', async () => {
      mockCreateRecipeMutateAsync.mockRejectedValueOnce(new Error('server error'));
      const { result } = render();
      act(() => result.current.setTitle('Fail Recipe'));
      await act(() => result.current.handleCreateManual());
      expect(showNotification).toHaveBeenCalledWith(
        'addRecipe.createFailed',
        'server error',
      );
    });
  });

  describe('image picker', () => {
    it('sets selectedImage and clears imageUrl when picking', () => {
      const { result } = render();
      act(() => result.current.handlePickImage());
      expect(result.current.selectedImage).toBe('file:///picked-image.jpg');
      expect(result.current.imageUrl).toBe('');
    });
  });

  describe('form state setters', () => {
    it('allows setting diet and meal labels', () => {
      const { result } = render();
      act(() => {
        result.current.setDietLabel('veggie');
        result.current.setMealLabel('breakfast');
      });
      expect(result.current.dietLabel).toBe('veggie');
      expect(result.current.mealLabel).toBe('breakfast');
    });
  });
});
