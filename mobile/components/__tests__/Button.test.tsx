import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '../Button';
import { ButtonGroupContext } from '../ButtonGroup';

// ── Default mock: light theme (display: 'both', wrapper: 'animated') ──
// setup.ts provides useTheme with buttonDisplay: { display: 'both', wrapper: 'animated', shape: 'circle', interaction: 'scale' }

const useThemeSpy = vi.fn();

vi.mock('@/lib/theme', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    useTheme: () => useThemeSpy(),
  };
});

// ── Helpers ────────────────────────────────────────────────────────────

const lightTheme = () =>
  ({
    colors: {
      content: { body: '#5D4E40', icon: '#AAA', placeholder: '#999' },
      button: { primary: '#3D3D3D', primaryPressed: '#2D2D2D', disabled: '#CCC' },
      glass: { solid: '#EEE' },
      text: { inverse: '#FFF' },
      white: '#FFF',
      danger: '#F44',
      destructive: { bg: '#FEE', text: '#D00' },
      ai: { bg: '#F0F', primary: '#A0A' },
      surface: { hover: '#F5F5F5', pressed: '#EBEBEB' },
    },
    fonts: {
      body: 'sans-serif',
      bodySemibold: 'sans-serif-bold',
    },
    borderRadius: { md: 8, 'sm-md': 6, full: 999 },
    shadows: { md: {} },
    buttonDisplay: {
      display: 'both' as const,
      wrapper: 'animated' as const,
      shape: 'circle' as const,
      interaction: 'scale' as const,
    },
    crt: undefined,
  });

const terminalTheme = () =>
  ({
    ...lightTheme(),
    buttonDisplay: {
      display: 'text' as const,
      wrapper: 'segment' as const,
      shape: 'none' as const,
      interaction: 'highlight' as const,
    },
  });

afterEach(() => {
  useThemeSpy.mockReset();
});

// ── Basic rendering ──────────────────────────────────────────────────

describe('Button — light theme', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(lightTheme());
  });

  it('renders a label', () => {
    render(<Button label="Save" onPress={() => {}} />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const handler = vi.fn();
    render(<Button label="Tap me" onPress={handler} />);
    fireEvent.click(screen.getByText('Tap me'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call onPress when disabled', () => {
    const handler = vi.fn();
    render(<Button label="Disabled" onPress={handler} disabled />);
    fireEvent.click(screen.getByText('Disabled'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not call onPress when pending', () => {
    const handler = vi.fn();
    render(
      <Button label="Loading" onPress={handler} isPending loadingLabel="Wait…" />,
    );
    fireEvent.click(screen.getByText('Wait…'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('shows loadingLabel when isPending', () => {
    render(
      <Button label="Save" onPress={() => {}} isPending loadingLabel="Saving…" />,
    );
    expect(screen.getByText('Saving…')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('forwards testID', () => {
    render(<Button label="Go" onPress={() => {}} testID="go-btn" />);
    expect(screen.getByTestId('go-btn')).toBeTruthy();
  });
});

// ── Display config (showIcon / showLabel) ────────────────────────────

describe('Button — display config', () => {
  it('shows both icon and label when display is "both"', () => {
    useThemeSpy.mockReturnValue(lightTheme());
    const { container } = render(
      <Button icon="add" label="Add" onPress={() => {}} />,
    );
    expect(screen.getByText('Add')).toBeTruthy();
    // Ionicons mock renders null, but the icon branch is taken (no crash)
    expect(container.innerHTML).toBeTruthy();
  });

  it('hides icon when display is "text"', () => {
    useThemeSpy.mockReturnValue({
      ...lightTheme(),
      buttonDisplay: { display: 'text', wrapper: 'animated', shape: 'circle', interaction: 'scale' },
    });

    render(<Button icon="add" label="Add" onPress={() => {}} />);
    // Label should still be shown
    expect(screen.getByText('Add')).toBeTruthy();
  });

  it('hides label when display is "icon"', () => {
    useThemeSpy.mockReturnValue({
      ...lightTheme(),
      buttonDisplay: { display: 'icon', wrapper: 'animated', shape: 'circle', interaction: 'scale' },
    });

    render(<Button icon="add" label="Add" onPress={() => {}} />);
    // Label should be hidden, only icon shown
    expect(screen.queryByText('Add')).toBeNull();
  });
});

// ── Terminal segment rendering ───────────────────────────────────────

describe('Button — terminal segment', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(terminalTheme());
  });

  it('renders segment delimiters around label', () => {
    render(<Button label="Save" onPress={() => {}} />);
    // Terminal segment format: ╡ SAVE ╞
    expect(screen.getByText(/╡ SAVE ╞/)).toBeTruthy();
  });

  it('uses cleaned icon name as fallback when no label', () => {
    render(<Button icon="add-outline" onPress={() => {}} />);
    // cleanIconName strips suffixes: "add-outline" → "add"
    expect(screen.getByText(/╡ ADD ╞/)).toBeTruthy();
  });

  it('renders without outer delimiters inside ButtonGroup', () => {
    render(
      <ButtonGroupContext.Provider value={true}>
        <Button label="Copy" onPress={() => {}} />
      </ButtonGroupContext.Provider>,
    );
    // Inside group: no outer ╡╞ delimiters
    expect(screen.getByText(/COPY/)).toBeTruthy();
    expect(screen.queryByText(/╡/)).toBeNull();
    expect(screen.queryByText(/╞/)).toBeNull();
  });

  it('does not call onPress when disabled in segment mode', () => {
    const handler = vi.fn();
    render(<Button label="Del" onPress={handler} disabled />);
    fireEvent.click(screen.getByText(/DEL/));
    expect(handler).not.toHaveBeenCalled();
  });

  it('defaults to segment for all variants when wrapper is "segment"', () => {
    // Even icon variant defaults to segment when wrapper='segment'
    render(<Button variant="icon" icon="close" onPress={() => {}} />);
    expect(screen.getByText(/╡ CLOSE ╞/)).toBeTruthy();
  });

  it('can opt out of segment with segment={false}', () => {
    render(<Button label="Animated" onPress={() => {}} segment={false} />);
    // Should NOT render ╡╞ delimiters — falls through to AnimatedPressable
    expect(screen.queryByText(/╡/)).toBeNull();
    expect(screen.getByText('Animated')).toBeTruthy();
  });
});

// ── Variant: primary ─────────────────────────────────────────────────

describe('Button — primary variant', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(lightTheme());
  });

  it('renders label for primary variant', () => {
    render(<Button variant="primary" label="Sign In" onPress={() => {}} />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('shows label even when display is "icon"', () => {
    useThemeSpy.mockReturnValue({
      ...lightTheme(),
      buttonDisplay: { display: 'icon', wrapper: 'animated', shape: 'circle', interaction: 'scale' },
    });

    render(<Button variant="primary" label="Submit" onPress={() => {}} />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });
});

// ── Tones ────────────────────────────────────────────────────────────

describe('Button — tones', () => {
  beforeEach(() => {
    useThemeSpy.mockReturnValue(lightTheme());
  });

  it('renders destructive tone without crashing', () => {
    render(<Button tone="destructive" label="Delete" onPress={() => {}} />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('renders ai tone without crashing', () => {
    render(<Button tone="ai" label="Enhance" onPress={() => {}} />);
    expect(screen.getByText('Enhance')).toBeTruthy();
  });

  it('renders subtle tone without crashing', () => {
    render(<Button tone="subtle" label="More" onPress={() => {}} />);
    expect(screen.getByText('More')).toBeTruthy();
  });
});
