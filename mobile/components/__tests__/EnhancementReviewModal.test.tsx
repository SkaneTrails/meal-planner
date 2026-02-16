import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Recipe } from '@/lib/types';
import { EnhancementReviewModal } from '../recipe-detail/EnhancementReviewModal';

const makeRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'recipe-1',
  title: 'Test Recipe',
  url: 'https://example.com/recipe',
  ingredients: ['1 cup flour'],
  instructions: ['Mix'],
  image_url: null,
  thumbnail_url: null,
  servings: 4,
  prep_time: null,
  cook_time: null,
  total_time: null,
  cuisine: null,
  category: null,
  tags: [],
  diet_label: null,
  meal_label: null,
  rating: null,
  hidden: false,
  favorited: false,
  household_id: 'household-abc',
  visibility: 'household',
  ...overrides,
});

const t = (key: string) => key;

describe('EnhancementReviewModal', () => {
  const defaultProps = {
    visible: true,
    recipe: makeRecipe({
      changes_made: ['Improved seasoning', 'Added cooking tips'],
    }),
    isReviewPending: false,
    t,
    onApprove: vi.fn(),
    onReject: vi.fn(),
  };

  it('renders changes list when recipe has changes_made', () => {
    render(<EnhancementReviewModal {...defaultProps} />);
    expect(screen.getByText('Improved seasoning')).toBeTruthy();
    expect(screen.getByText('Added cooking tips')).toBeTruthy();
    expect(screen.getByText('addRecipe.enhanced.changesLabel')).toBeTruthy();
  });

  it('shows no-changes message when changes_made is empty', () => {
    const recipe = makeRecipe({ changes_made: [] });
    render(<EnhancementReviewModal {...defaultProps} recipe={recipe} />);
    expect(
      screen.getByText('addRecipe.enhanced.noChangesListed'),
    ).toBeTruthy();
  });

  it('shows no-changes message when changes_made is undefined', () => {
    const recipe = makeRecipe();
    render(<EnhancementReviewModal {...defaultProps} recipe={recipe} />);
    expect(
      screen.getByText('addRecipe.enhanced.noChangesListed'),
    ).toBeTruthy();
  });

  it('displays recipe title', () => {
    render(<EnhancementReviewModal {...defaultProps} />);
    expect(screen.getByText('Test Recipe')).toBeTruthy();
  });

  it('calls onApprove when approve button is pressed', () => {
    const onApprove = vi.fn();
    render(<EnhancementReviewModal {...defaultProps} onApprove={onApprove} />);
    fireEvent.click(screen.getByText('recipe.approveEnhancement'));
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it('calls onReject when reject button is pressed', () => {
    const onReject = vi.fn();
    render(<EnhancementReviewModal {...defaultProps} onReject={onReject} />);
    fireEvent.click(screen.getByText('recipe.rejectEnhancement'));
    expect(onReject).toHaveBeenCalledOnce();
  });

  it('disables buttons when isReviewPending is true', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(
      <EnhancementReviewModal
        {...defaultProps}
        isReviewPending={true}
        onApprove={onApprove}
        onReject={onReject}
      />,
    );
    fireEvent.click(screen.getByText('recipe.approveEnhancement'));
    fireEvent.click(screen.getByText('recipe.rejectEnhancement'));
    expect(onApprove).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();
  });
});
