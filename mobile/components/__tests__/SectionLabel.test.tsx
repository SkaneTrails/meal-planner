import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SectionLabel } from '../SectionLabel';

describe('SectionLabel', () => {
  it('renders text', () => {
    render(<SectionLabel text="Category" />);
    expect(screen.getByText('Category')).toBeDefined();
  });
});
