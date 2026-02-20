/**
 * Web BodyPortal — portals children to document.body.
 *
 * RN Web's <Modal> renders as portal divs on document.body, all sharing
 * the same z-index. When an alert needs to appear above an already-open
 * Modal, we portal it to document.body so it appears later in DOM order
 * and with a higher z-index (set by the caller's styles).
 */

import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const BodyPortal = ({ children }: { children: ReactNode }) => {
  return createPortal(children, document.body);
};
