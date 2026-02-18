/**
 * ButtonGroup — groups multiple Buttons in a row.
 *
 * Light theme: `flexDirection: 'row'` with configurable gap.
 * Terminal theme: `╡ A | B ╞` — outer delimiters on the group, `|` between.
 */

import React, { createContext, useContext } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { spacing, terminal, useTheme } from '@/lib/theme';

/**
 * When `true`, child `<Button>` components skip their own `╡ ╞` delimiters
 * because the group provides the outer frame and `|` separators.
 */
export const ButtonGroupContext = createContext(false);

/** Read whether the current Button is inside a ButtonGroup. */
export const useButtonGroup = () => useContext(ButtonGroupContext);

// ── Box-drawing chars (duplicated from Button to avoid circular import) ──
const SEG = { l: '\u2561', r: '\u255E' } as const;

interface ButtonGroupProps {
  children: React.ReactNode;
  /** Gap between buttons (default: spacing.xs). */
  gap?: number;
  /** Additional outer style. */
  style?: ViewStyle;
}

export const ButtonGroup = ({
  children,
  gap = spacing.xs,
  style,
}: ButtonGroupProps) => {
  const { buttonDisplay, fonts, colors } = useTheme();
  const isSegment = buttonDisplay.wrapper === 'segment';

  if (isSegment) {
    const items = React.Children.toArray(children).filter(Boolean);
    const segTextStyle = {
      fontFamily: fonts.body,
      color: colors.content.body,
      lineHeight: terminal.charHeight,
    };

    return (
      <ButtonGroupContext.Provider value={true}>
        <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
          <Text style={segTextStyle}>{SEG.l}</Text>
          {items.map((child, i) => (
            <React.Fragment key={i}>
              {child}
              {i < items.length - 1 && <Text style={segTextStyle}>|</Text>}
            </React.Fragment>
          ))}
          <Text style={segTextStyle}>{SEG.r}</Text>
        </View>
      </ButtonGroupContext.Provider>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
};
