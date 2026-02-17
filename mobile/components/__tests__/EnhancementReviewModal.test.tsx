import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EnhancementReviewModal } from '../EnhancementReviewModal';

describe('EnhancementReviewModal', () => {
  const defaultProps = {
    visible: true,
    title: 'Test Recipe',
    headerLabel: 'AI Enhanced',
    changesMade: ['Improved seasoning', 'Added cooking tips'],
    changesLabel: 'Changes made:',
    noChangesLabel: 'No changes listed',
    rejectLabel: 'Reject',
    approveLabel: 'Approve',
    isReviewPending: false,
    onReview: vi.fn(),
  };

  it('renders changes list', () => {
    render(<EnhancementReviewModal {...defaultProps} />);
    expect(screen.getByText('Improved seasoning')).toBeTruthy();
    expect(screen.getByText('Added cooking tips')).toBeTruthy();
    expect(screen.getByText('Changes made:')).toBeTruthy();
  });

  it('shows no-changes message when changesMade is empty', () => {
    render(<EnhancementReviewModal {...defaultProps} changesMade={[]} />);
    expect(screen.getByText('No changes listed')).toBeTruthy();
  });

  it('displays recipe title', () => {
    render(<EnhancementReviewModal {...defaultProps} />);
    expect(screen.getByText('Test Recipe')).toBeTruthy();
  });

  it('displays header label', () => {
    render(<EnhancementReviewModal {...defaultProps} />);
    expect(screen.getByText('AI Enhanced')).toBeTruthy();
  });

  it('calls onReview with approve when approve button is pressed', () => {
    const onReview = vi.fn();
    render(<EnhancementReviewModal {...defaultProps} onReview={onReview} />);
    fireEvent.click(screen.getByText('Approve'));
    expect(onReview).toHaveBeenCalledWith('approve');
  });

  it('calls onReview with reject when reject button is pressed', () => {
    const onReview = vi.fn();
    render(<EnhancementReviewModal {...defaultProps} onReview={onReview} />);
    fireEvent.click(screen.getByText('Reject'));
    expect(onReview).toHaveBeenCalledWith('reject');
  });

  it('disables buttons when isReviewPending is true', () => {
    const onReview = vi.fn();
    render(
      <EnhancementReviewModal
        {...defaultProps}
        isReviewPending={true}
        onReview={onReview}
      />,
    );
    fireEvent.click(screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Reject'));
    expect(onReview).not.toHaveBeenCalled();
  });
});
