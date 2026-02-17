import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import {
  circleStyle,
  type IconContainerSize,
  iconContainer,
} from '@/lib/theme';

interface IconCircleProps {
  size: IconContainerSize | number;
  bg: string;
  style?: ViewStyle;
  children: ReactNode;
}

export const IconCircle = ({ size, bg, style, children }: IconCircleProps) => {
  const dimension = typeof size === 'number' ? size : iconContainer[size];

  return (
    <View
      style={[
        circleStyle(dimension),
        { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {children}
    </View>
  );
};
