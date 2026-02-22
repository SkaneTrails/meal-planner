import type { Ionicons as IoniconsType } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { GestureResponderEvent, ViewStyle } from 'react-native';
import type { ButtonTone } from '@/components/Button';
import { Button } from '@/components/Button';
import { type IconContainerSize, iconContainer, useTheme } from '@/lib/theme';

type IconName = ComponentProps<typeof IoniconsType>['name'];

interface IconButtonProps {
  icon: IconName;
  onPress: (e: GestureResponderEvent) => void;
  size?: IconContainerSize | number;
  iconSize?: number;
  tone?: ButtonTone;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  isPending?: boolean;
  disableAnimation?: boolean;
  label?: string;
  hoverScale?: number;
  pressScale?: number;
  hitSlop?:
    | number
    | { top?: number; bottom?: number; left?: number; right?: number };
  style?: ViewStyle;
  testID?: string;
}

const DEFAULT_ICON_SIZES: Record<IconContainerSize, number> = {
  xs: 20,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  '2xl': 36,
};

export const IconButton = ({
  icon,
  onPress,
  size = 'xs',
  iconSize: iconSizeProp,
  tone,
  color,
  textColor,
  disabled,
  isPending,
  disableAnimation,
  label,
  hoverScale,
  pressScale,
  hitSlop,
  style,
  testID,
}: IconButtonProps) => {
  const { circleStyle } = useTheme();

  const dimension = typeof size === 'number' ? size : iconContainer[size];
  const resolvedIconSize =
    iconSizeProp ??
    (typeof size === 'string' ? DEFAULT_ICON_SIZES[size] : undefined);

  return (
    <Button
      variant="icon"
      icon={icon}
      onPress={onPress}
      iconSize={resolvedIconSize}
      tone={tone}
      color={color}
      textColor={textColor}
      disabled={disabled}
      isPending={isPending}
      disableAnimation={disableAnimation}
      label={label}
      hoverScale={hoverScale}
      pressScale={pressScale}
      hitSlop={hitSlop}
      testID={testID}
      style={{ ...circleStyle(dimension), ...style }}
    />
  );
};
