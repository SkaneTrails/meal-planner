/**
 * AnimatedPressable - A Pressable component with smooth hover and press animations.
 * Provides consistent button feel across the app with scale animations on hover/press.
 */

import type React from 'react';
import { useCallback, useRef } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  Platform,
  Pressable,
  type PressableProps,
  type MouseEvent as RNMouseEvent,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?:
    | StyleProp<ViewStyle>
    | ((state: { pressed: boolean; hovered: boolean }) => StyleProp<ViewStyle>);
  /** Scale when pressed (default: 0.97) */
  pressScale?: number;
  /** Scale when hovered on web (default: 1.02) */
  hoverScale?: number;
  /** Animation duration in ms (default: 150) */
  animationDuration?: number;
  /** Whether to disable animations */
  disableAnimation?: boolean;
}

export const AnimatedPressable = ({
  children,
  style,
  pressScale = 0.97,
  hoverScale = 1.02,
  animationDuration = 150,
  disableAnimation = false,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  ...props
}: AnimatedPressableProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isHovered = useRef(false);
  const isPressed = useRef(false);

  const animateTo = useCallback(
    (toValue: number, useSpring = false) => {
      if (disableAnimation) return;

      if (useSpring) {
        Animated.spring(scaleAnim, {
          toValue,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }).start();
      } else {
        Animated.timing(scaleAnim, {
          toValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      }
    },
    [scaleAnim, animationDuration, disableAnimation],
  );

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      isPressed.current = true;
      animateTo(pressScale, true);
      onPressIn?.(event);
    },
    [animateTo, pressScale, onPressIn],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      isPressed.current = false;
      animateTo(isHovered.current ? hoverScale : 1, true);
      onPressOut?.(event);
    },
    [animateTo, hoverScale, onPressOut],
  );

  const handleHoverIn = useCallback(
    (event: RNMouseEvent) => {
      isHovered.current = true;
      if (!isPressed.current) {
        animateTo(hoverScale);
      }
      onHoverIn?.(event);
    },
    [animateTo, hoverScale, onHoverIn],
  );

  const handleHoverOut = useCallback(
    (event: RNMouseEvent) => {
      isHovered.current = false;
      if (!isPressed.current) {
        animateTo(1);
      }
      onHoverOut?.(event);
    },
    [animateTo, onHoverOut],
  );

  // Extract flex-related styles that need to be on the Pressable wrapper
  // These properties affect how the component participates in parent flex layout
  const extractFlexStyle = (styleObj: StyleProp<ViewStyle>): ViewStyle => {
    // Flatten style arrays to handle style={[...styles]} properly
    const flattened = StyleSheet.flatten(styleObj);
    if (!flattened || typeof flattened !== 'object') {
      return {};
    }
    const {
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      alignSelf,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      margin,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      marginHorizontal,
      marginVertical,
    } = flattened as ViewStyle;
    return {
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      alignSelf,
      width,
      height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight,
      margin,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      marginHorizontal,
      marginVertical,
    };
  };

  const removeFlexStyle = (styleObj: StyleProp<ViewStyle>): ViewStyle => {
    // Flatten style arrays to handle style={[...styles]} properly
    const flattened = StyleSheet.flatten(styleObj);
    if (!flattened || typeof flattened !== 'object') {
      return flattened as ViewStyle;
    }
    // Keep width/height on inner view for proper sizing, only remove flex participation props
    const {
      flex,
      flexGrow,
      flexShrink,
      flexBasis,
      alignSelf,
      margin,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      marginHorizontal,
      marginVertical,
      ...rest
    } = flattened as ViewStyle;
    return rest as ViewStyle;
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={Platform.OS === 'web' ? handleHoverIn : undefined}
      onHoverOut={Platform.OS === 'web' ? handleHoverOut : undefined}
      {...props}
      style={typeof style === 'function' ? undefined : extractFlexStyle(style)}
    >
      {({ pressed }) => {
        const hovered = isHovered.current;
        const resolvedStyle =
          typeof style === 'function' ? style({ pressed, hovered }) : style;
        const innerStyle =
          typeof style === 'function'
            ? resolvedStyle
            : removeFlexStyle(resolvedStyle);

        return (
          <Animated.View
            style={[innerStyle, { transform: [{ scale: scaleAnim }] }]}
          >
            {children}
          </Animated.View>
        );
      }}
    </Pressable>
  );
};

export default AnimatedPressable;
