import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguagePromptModal } from '../LanguagePromptModal';

describe('LanguagePromptModal', () => {
  const defaultProps = {
    visible: true,
    onConfirm: vi.fn(),
    isSaving: false,
  };

  it('renders title and message when visible', () => {
    render(<LanguagePromptModal {...defaultProps} />);
    expect(screen.getByText('Choose Your Language')).toBeTruthy();
    expect(
      screen.getByText(
        'Select the language for recipe enhancement. Recipes will be translated and adapted to this language.',
      ),
    ).toBeTruthy();
  });

  it('renders all language options after expanding picker', () => {
    render(<LanguagePromptModal {...defaultProps} />);
    // Picker starts collapsed — expand it first
    fireEvent.click(screen.getByTestId('language-picker-collapsed'));
    expect(screen.getByText('English')).toBeTruthy();
    expect(screen.getByText('Svenska')).toBeTruthy();
    expect(screen.getByText('Italiano')).toBeTruthy();
  });

  it('defaults to English selected', () => {
    const onConfirm = vi.fn();
    render(<LanguagePromptModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith('en');
  });

  it('calls onConfirm with selected language', () => {
    const onConfirm = vi.fn();
    render(<LanguagePromptModal {...defaultProps} onConfirm={onConfirm} />);

    // Expand picker, select Svenska, then confirm
    fireEvent.click(screen.getByTestId('language-picker-collapsed'));
    fireEvent.click(screen.getByTestId('language-picker-option-sv'));
    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith('sv');
  });

  it('calls onConfirm with default language when no selection changed', () => {
    const onConfirm = vi.fn();
    render(<LanguagePromptModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith('en');
  });

  it('does not render close button', () => {
    render(<LanguagePromptModal {...defaultProps} />);
    expect(screen.queryByTestId('close-button')).toBeNull();
  });

  it('disables confirm button while saving', () => {
    const onConfirm = vi.fn();
    render(
      <LanguagePromptModal {...defaultProps} onConfirm={onConfirm} isSaving />,
    );

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
