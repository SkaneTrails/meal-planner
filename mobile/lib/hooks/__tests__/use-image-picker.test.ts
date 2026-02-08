import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: vi.fn(),
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('@/lib/alert', () => ({
  showAlert: vi.fn(),
  showNotification: vi.fn(),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

import * as ImagePicker from 'expo-image-picker';
import { showAlert, showNotification } from '@/lib/alert';
import { useImagePicker } from '../useImagePicker';

const mockRequestCamera = vi.mocked(ImagePicker.requestCameraPermissionsAsync);
const mockRequestLibrary = vi.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);
const mockLaunchCamera = vi.mocked(ImagePicker.launchCameraAsync);
const mockLaunchLibrary = vi.mocked(ImagePicker.launchImageLibraryAsync);
const mockShowAlert = vi.mocked(showAlert);
const mockShowNotification = vi.mocked(showNotification);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useImagePicker', () => {
  it('returns a pickImage function', () => {
    const onSelected = vi.fn();
    const { result } = renderHook(() => useImagePicker(onSelected));
    expect(result.current.pickImage).toBeInstanceOf(Function);
  });

  it('shows an alert with camera and library options', () => {
    const onSelected = vi.fn();
    const { result } = renderHook(() => useImagePicker(onSelected));

    act(() => result.current.pickImage());

    expect(mockShowAlert).toHaveBeenCalledOnce();
    const [title, message, buttons] = mockShowAlert.mock.calls[0];
    expect(title).toBe('recipe.changePhoto');
    expect(message).toBe('recipe.chooseOption');
    expect(buttons).toHaveLength(3); // camera, library, cancel
    expect(buttons![0].text).toBe('recipe.takePhoto');
    expect(buttons![1].text).toBe('recipe.chooseFromLibrary');
    expect(buttons![2].text).toBe('common.cancel');
  });

  it('includes URL option when showUrlOption is true', () => {
    const onSelected = vi.fn();
    const onUrl = vi.fn();
    const { result } = renderHook(() =>
      useImagePicker(onSelected, { showUrlOption: true, onUrlOptionSelected: onUrl }),
    );

    act(() => result.current.pickImage());

    const buttons = mockShowAlert.mock.calls[0][2]!;
    expect(buttons).toHaveLength(4); // camera, library, url, cancel
    expect(buttons[2].text).toBe('recipe.enterUrl');
    expect(buttons[3].text).toBe('common.cancel');
  });

  it('calls onUrlOptionSelected when URL button is pressed', () => {
    const onSelected = vi.fn();
    const onUrl = vi.fn();
    const { result } = renderHook(() =>
      useImagePicker(onSelected, { showUrlOption: true, onUrlOptionSelected: onUrl }),
    );

    act(() => result.current.pickImage());

    const urlButton = mockShowAlert.mock.calls[0][2]![2];
    urlButton.onPress!();
    expect(onUrl).toHaveBeenCalledOnce();
  });

  describe('camera flow', () => {
    it('requests camera permission and launches camera on grant', async () => {
      mockRequestCamera.mockResolvedValue({ status: 'granted' } as never);
      mockLaunchCamera.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg' }],
      } as never);

      const onSelected = vi.fn();
      const { result } = renderHook(() => useImagePicker(onSelected));

      act(() => result.current.pickImage());

      const cameraButton = mockShowAlert.mock.calls[0][2]![0];
      await cameraButton.onPress!();

      expect(mockRequestCamera).toHaveBeenCalledOnce();
      expect(mockLaunchCamera).toHaveBeenCalledWith({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      expect(onSelected).toHaveBeenCalledWith('file:///photo.jpg');
    });

    it('uses custom aspect ratio when provided', async () => {
      mockRequestCamera.mockResolvedValue({ status: 'granted' } as never);
      mockLaunchCamera.mockResolvedValue({ canceled: true } as never);

      const onSelected = vi.fn();
      const { result } = renderHook(() =>
        useImagePicker(onSelected, { aspect: [16, 9] }),
      );

      act(() => result.current.pickImage());
      const cameraButton = mockShowAlert.mock.calls[0][2]![0];
      await cameraButton.onPress!();

      expect(mockLaunchCamera).toHaveBeenCalledWith(
        expect.objectContaining({ aspect: [16, 9] }),
      );
    });

    it('shows notification and does not launch camera when permission denied', async () => {
      mockRequestCamera.mockResolvedValue({ status: 'denied' } as never);

      const onSelected = vi.fn();
      const { result } = renderHook(() => useImagePicker(onSelected));

      act(() => result.current.pickImage());
      const cameraButton = mockShowAlert.mock.calls[0][2]![0];
      await cameraButton.onPress!();

      expect(mockShowNotification).toHaveBeenCalledWith(
        'recipe.permissionNeeded',
        'recipe.cameraPermission',
      );
      expect(mockLaunchCamera).not.toHaveBeenCalled();
      expect(onSelected).not.toHaveBeenCalled();
    });

    it('does not call onImageSelected when camera is canceled', async () => {
      mockRequestCamera.mockResolvedValue({ status: 'granted' } as never);
      mockLaunchCamera.mockResolvedValue({ canceled: true } as never);

      const onSelected = vi.fn();
      const { result } = renderHook(() => useImagePicker(onSelected));

      act(() => result.current.pickImage());
      const cameraButton = mockShowAlert.mock.calls[0][2]![0];
      await cameraButton.onPress!();

      expect(onSelected).not.toHaveBeenCalled();
    });
  });

  describe('library flow', () => {
    it('requests library permission and launches picker on grant', async () => {
      mockRequestLibrary.mockResolvedValue({ status: 'granted' } as never);
      mockLaunchLibrary.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///gallery.jpg' }],
      } as never);

      const onSelected = vi.fn();
      const { result } = renderHook(() => useImagePicker(onSelected));

      act(() => result.current.pickImage());

      const libraryButton = mockShowAlert.mock.calls[0][2]![1];
      await libraryButton.onPress!();

      expect(mockRequestLibrary).toHaveBeenCalledOnce();
      expect(mockLaunchLibrary).toHaveBeenCalledWith({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      expect(onSelected).toHaveBeenCalledWith('file:///gallery.jpg');
    });

    it('shows notification when library permission denied', async () => {
      mockRequestLibrary.mockResolvedValue({ status: 'denied' } as never);

      const onSelected = vi.fn();
      const { result } = renderHook(() => useImagePicker(onSelected));

      act(() => result.current.pickImage());
      const libraryButton = mockShowAlert.mock.calls[0][2]![1];
      await libraryButton.onPress!();

      expect(mockShowNotification).toHaveBeenCalledWith(
        'recipe.permissionNeeded',
        'recipe.libraryPermission',
      );
      expect(mockLaunchLibrary).not.toHaveBeenCalled();
    });
  });
});
