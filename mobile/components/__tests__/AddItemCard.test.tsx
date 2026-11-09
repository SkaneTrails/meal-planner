import { render } from '@testing-library/react';
import { Platform } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddItemCard } from '../grocery/AddItemCard';

const props = {
  newItemText: '',
  onChangeText: () => {},
  onSubmit: () => {},
  onDismiss: () => {},
};

describe('AddItemCard', () => {
  afterEach(() => {
    Platform.OS = 'web';
    vi.restoreAllMocks();
  });

  it('listens for Escape and outside clicks on web', () => {
    const add = vi.spyOn(document, 'addEventListener');
    render(<AddItemCard {...props} />);
    expect(add).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('touches no DOM APIs on native, where document does not exist', () => {
    Platform.OS = 'android';
    const add = vi.spyOn(document, 'addEventListener');
    render(<AddItemCard {...props} />);
    expect(add).not.toHaveBeenCalled();
  });
});
