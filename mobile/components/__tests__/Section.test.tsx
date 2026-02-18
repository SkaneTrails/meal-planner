import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Section } from '../Section';

describe('Section', () => {
  describe('static (non-collapsible)', () => {
    it('renders title', () => {
      render(<Section title="Ingredients" />);
      expect(screen.getByText('Ingredients')).toBeDefined();
    });

    it('renders subtitle when provided', () => {
      render(
        <Section title="General" subtitle="Household name and servings" />,
      );
      expect(screen.getByText('General')).toBeDefined();
      expect(screen.getByText('Household name and servings')).toBeDefined();
    });

    it('renders children always (no collapse)', () => {
      render(
        <Section title="About">
          <span>Version 1.0</span>
        </Section>,
      );
      expect(screen.getByText('Version 1.0')).toBeDefined();
    });

    it('renders right accessory', () => {
      render(
        <Section title="Theme" rightAccessory={<span>Toggle</span>}>
          <span>Content</span>
        </Section>,
      );
      expect(screen.getByText('Toggle')).toBeDefined();
    });
  });

  describe('collapsible', () => {
    it('shows children when expanded', () => {
      render(
        <Section
          title="Dietary"
          collapsible
          expanded
          onToggle={vi.fn()}
        >
          <span>Preferences</span>
        </Section>,
      );
      expect(screen.getByText('Preferences')).toBeDefined();
    });

    it('hides children when collapsed', () => {
      render(
        <Section
          title="Dietary"
          collapsible
          expanded={false}
          onToggle={vi.fn()}
        >
          <span>Preferences</span>
        </Section>,
      );
      expect(screen.queryByText('Preferences')).toBeNull();
    });

    it('calls onToggle when header pressed', () => {
      const onToggle = vi.fn();
      render(
        <Section
          title="Dietary"
          subtitle="Food preferences"
          collapsible
          expanded={false}
          onToggle={onToggle}
        >
          <span>Content</span>
        </Section>,
      );
      fireEvent.click(screen.getByText('Dietary'));
      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('hides children when disabled', () => {
      render(
        <Section
          title="AI"
          collapsible
          expanded
          onToggle={vi.fn()}
          disabled
        >
          <span>Should not show</span>
        </Section>,
      );
      expect(screen.queryByText('Should not show')).toBeNull();
    });

    it('renders right accessory alongside chevron', () => {
      render(
        <Section
          title="AI Features"
          collapsible
          expanded
          onToggle={vi.fn()}
          rightAccessory={<span>Switch</span>}
        >
          <span>Content</span>
        </Section>,
      );
      expect(screen.getByText('Switch')).toBeDefined();
      expect(screen.getByText('Content')).toBeDefined();
    });
  });

  describe('size variants', () => {
    it('renders with size="sm" (recipe detail pattern)', () => {
      render(
        <Section title="Tips" icon="bulb-outline" size="sm">
          <span>Tip content</span>
        </Section>,
      );
      expect(screen.getByText('Tips')).toBeDefined();
      expect(screen.getByText('Tip content')).toBeDefined();
    });

    it('renders with size="md" and icon (settings pattern)', () => {
      render(
        <Section
          title="General"
          subtitle="Household settings"
          icon="home"
          size="md"
        >
          <span>Settings content</span>
        </Section>,
      );
      expect(screen.getByText('General')).toBeDefined();
      expect(screen.getByText('Household settings')).toBeDefined();
      expect(screen.getByText('Settings content')).toBeDefined();
    });

    it('renders without icon', () => {
      render(
        <Section title="No Icon Section">
          <span>Content</span>
        </Section>,
      );
      expect(screen.getByText('No Icon Section')).toBeDefined();
      expect(screen.getByText('Content')).toBeDefined();
    });
  });
});
