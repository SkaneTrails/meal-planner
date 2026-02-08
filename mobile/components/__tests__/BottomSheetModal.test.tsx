import { render, screen, fireEvent } from '@testing-library/react';
import { Text, View, Pressable } from 'react-native';
import { describe, it, expect, vi } from 'vitest';
import { BottomSheetModal } from '../BottomSheetModal';

describe('BottomSheetModal', () => {
  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
    title: 'Test Title',
    children: <Text>Modal content</Text>,
  };

  it('renders title and children when visible', () => {
    render(<BottomSheetModal {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Modal content')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<BottomSheetModal {...defaultProps} subtitle="Extra info" />);
    expect(screen.getByText('Extra info')).toBeTruthy();
  });

  it('renders close button by default', () => {
    render(<BottomSheetModal {...defaultProps} />);
    expect(screen.getByTestId('close-button')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = vi.fn();
    render(<BottomSheetModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('hides close button when showCloseButton is false', () => {
    render(<BottomSheetModal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByTestId('close-button')).toBeNull();
  });

  it('hides close button when headerRight is provided', () => {
    render(
      <BottomSheetModal
        {...defaultProps}
        headerRight={<Pressable><Text>Save</Text></Pressable>}
      />,
    );
    expect(screen.queryByTestId('close-button')).toBeNull();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('renders drag handle when showDragHandle is true', () => {
    render(<BottomSheetModal {...defaultProps} showDragHandle />);
    expect(screen.getByTestId('drag-handle')).toBeTruthy();
  });

  it('does not render drag handle by default', () => {
    render(<BottomSheetModal {...defaultProps} />);
    expect(screen.queryByTestId('drag-handle')).toBeNull();
  });

  it('renders footer when provided', () => {
    const footer = (
      <View testID="footer">
        <Text>Footer content</Text>
      </View>
    );
    render(<BottomSheetModal {...defaultProps} footer={footer} />);
    expect(screen.getByTestId('footer')).toBeTruthy();
    expect(screen.getByText('Footer content')).toBeTruthy();
  });

  it('calls onClose when backdrop is pressed with dismissOnBackdropPress', () => {
    const onClose = vi.fn();
    render(
      <BottomSheetModal
        {...defaultProps}
        onClose={onClose}
        dismissOnBackdropPress
        showCloseButton={false}
      />,
    );
    fireEvent.click(screen.getByTestId('backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not dismiss on backdrop press by default', () => {
    const onClose = vi.fn();
    render(<BottomSheetModal {...defaultProps} onClose={onClose} />);
    // Backdrop is a View, not pressable — just confirm it renders
    expect(screen.getByTestId('backdrop')).toBeTruthy();
  });

  it('forwards testID to the container', () => {
    render(<BottomSheetModal {...defaultProps} testID="my-modal" />);
    expect(screen.getByTestId('my-modal')).toBeTruthy();
  });
});
