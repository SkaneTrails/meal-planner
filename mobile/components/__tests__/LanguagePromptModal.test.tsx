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

  it('renders all language options', () => {
    render(<LanguagePromptModal {...defaultProps} />);
    expect(screen.getByText('English')).toBeTruthy();
    expect(screen.getByText('Svenska')).toBeTruthy();
    expect(screen.getByText('Italiano')).toBeTruthy();
  });

  it('defaults to English selected', () => {
    render(<LanguagePromptModal {...defaultProps} />);
    const checkmarks = screen.getAllByTestId('language-prompt-modal');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('calls onConfirm with selected language', () => {
    const onConfirm = vi.fn();
    render(<LanguagePromptModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Svenska'));
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

  it('shows loading indicator while saving', () => {
    render(<LanguagePromptModal {...defaultProps} isSaving />);
    expect(screen.getByText('Confirm')).toBeTruthy();
  });
});
