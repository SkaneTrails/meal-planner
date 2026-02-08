import React from 'react';

export const LinearGradient = ({
  children,
  ...props
}: {
  children?: React.ReactNode;
  [key: string]: any;
}) => React.createElement('div', { 'data-testid': 'linear-gradient', ...props }, children);
