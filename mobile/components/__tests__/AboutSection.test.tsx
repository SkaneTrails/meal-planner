import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from '../settings/FooterSections';

describe('AboutSection', () => {
  it('shows the app version from the Expo config', () => {
    render(<AboutSection />);
    expect(screen.getByText('1.2.3')).toBeTruthy();
  });
});
