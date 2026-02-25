/**
 * Grouped settings card — wraps multiple SettingsNavLink or inline rows
 * inside a ContentCard surface variant with separator lines between items.
 */

import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { ContentCard } from '@/components';
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
    <ContentCard variant="surface" style={{ opacity: disabled ? 0.5 : 1 }}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 && <SettingsSeparator />}
          {child}
        </React.Fragment>
      ))}
    </ContentCard>
  );
};
