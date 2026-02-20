/**
 * Themed in-app alert system.
 *
 * Replaces native Alert.alert / window.confirm with a fully themed modal
 * rendered inside the React tree. Provides both a React hook (useAlert)
 * and imperative functions (showAlert, showNotification, showConfirm)
 * that work from any context including hooks and callbacks.
 *
 * Architecture: a module-level ref is set by <AlertProvider> on mount,
 * allowing imperative callers to enqueue alerts without needing the hook.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertRequest {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextValue {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const useAlert = (): AlertContextValue => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
};

// ── Module-level ref for imperative access ──────────────────────────

let globalShowAlert: AlertContextValue['showAlert'] | null = null;

export const setGlobalAlertRef = (
  fn: AlertContextValue['showAlert'] | null,
) => {
  globalShowAlert = fn;
};

/**
 * Show a themed in-app alert dialog.
 * Works from any context — hooks, callbacks, event handlers.
 * Falls back to window.alert if AlertProvider is not yet mounted.
 */
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void => {
  if (globalShowAlert) {
    globalShowAlert(title, message, buttons);
  } else {
    // Fallback before provider mounts (should not happen in normal flow)
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined') {
      window.alert(text);
    }
  }
};

/**
 * Show a simple notification alert (single OK button).
 */
export const showNotification = (title: string, message?: string): void => {
  showAlert(title, message, [{ text: 'OK' }]);
};

/**
 * Show a confirmation dialog and return a promise.
 * Resolves to true if confirmed, false if cancelled.
 */
export const showConfirm = (
  title: string,
  message?: string,
): Promise<boolean> => {
  return new Promise((resolve) => {
    showAlert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ]);
  });
};

// ── Provider ────────────────────────────────────────────────────────

interface AlertProviderProps {
  children: React.ReactNode;
  renderAlert: (
    alert: AlertRequest | null,
    onDismiss: (button?: AlertButton) => void,
  ) => React.ReactNode;
}

export const AlertProvider = ({
  children,
  renderAlert,
}: AlertProviderProps) => {
  const [queue, setQueue] = useState<AlertRequest[]>([]);
  const currentAlert = queue[0] ?? null;
  const buttonsRef = useRef<AlertButton[] | undefined>(undefined);

  const enqueue = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setQueue((prev) => [...prev, { title, message, buttons }]);
    },
    [],
  );

  useEffect(() => {
    setGlobalAlertRef(enqueue);
    return () => setGlobalAlertRef(null);
  }, [enqueue]);

  // Keep a ref to current alert's buttons for the dismiss handler
  buttonsRef.current = currentAlert?.buttons;

  const handleDismiss = useCallback((button?: AlertButton) => {
    button?.onPress?.();
    setQueue((prev) => prev.slice(1));
  }, []);

  const ctx = useMemo(() => ({ showAlert: enqueue }), [enqueue]);

  return (
    <AlertContext.Provider value={ctx}>
      {children}
      {renderAlert(currentAlert, handleDismiss)}
    </AlertContext.Provider>
  );
};
