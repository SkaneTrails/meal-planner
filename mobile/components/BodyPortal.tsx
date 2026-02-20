/**
 * Native BodyPortal — renders children inline (no portal needed).
 * On native, ThemedAlert uses <Modal> which handles stacking natively.
 */

import type { ReactNode } from 'react';

export const BodyPortal = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};
