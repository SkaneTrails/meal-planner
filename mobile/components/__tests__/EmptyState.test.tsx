import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title text', () => {
    render(<EmptyState title="No recipes found" />);
    expect(screen.getByText('No recipes found')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState title="Empty" subtitle="Try adding some recipes" />);
    expect(screen.getByText('Try adding some recipes')).toBeTruthy();
  });

  it('does not render subtitle when omitted', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText('Try adding')).toBeNull();
  });

  it('renders icon when provided', () => {
    const { container } = render(<EmptyState icon="book-outline" title="Empty" />);
    // The icon container should be present (3 nested Views: outer + icon container + icon)
    const views = container.querySelectorAll('div');
    expect(views.length).toBeGreaterThanOrEqual(2);
  });

  it('does not render icon container when icon is omitted', () => {
    render(<EmptyState title="No items" />);
    // Only the outer container and the title text should be present
    const textElements = screen.getAllByText(/./);
    expect(textElements).toHaveLength(1);
  });

  it('renders action button when provided', () => {
    const onPress = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Add Recipe', onPress }}
      />,
    );
    expect(screen.getByText('Add Recipe')).toBeTruthy();
  });

  it('calls action.onPress when button is pressed', () => {
    const onPress = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={{ label: 'Add Recipe', onPress }}
      />,
    );
    fireEvent.click(screen.getByText('Add Recipe'));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not render action button when omitted', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText('Add Recipe')).toBeNull();
  });

  it('renders all elements together', () => {
    const onPress = vi.fn();
    render(
      <EmptyState
        icon="search"
        title="No matches"
        subtitle="Try a different search"
        action={{ label: 'Clear filters', onPress }}
      />,
    );
    expect(screen.getByText('No matches')).toBeTruthy();
    expect(screen.getByText('Try a different search')).toBeTruthy();
    expect(screen.getByText('Clear filters')).toBeTruthy();
  });
});
