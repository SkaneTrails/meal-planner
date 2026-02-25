/**
 * Grouped settings card — wraps multiple SettingsNavLink or inline rows
 * inside a SurfaceCard with separator lines between items.
 */

import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { SurfaceCard } from '@/components';
import { useTheme } from '@/lib/theme';

export const SettingsSeparator = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.surface.divider,
      }}
    />
  );
};

interface SettingsGroupProps {
  children: ReactNode;
  disabled?: boolean;
}

export const SettingsGroup = ({ children, disabled }: SettingsGroupProps) => {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <SurfaceCard style={{ opacity: disabled ? 0.5 : 1 }}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <SettingsSeparator />}
          {child}
        </React.Fragment>
      ))}
    </SurfaceCard>
  );
};
