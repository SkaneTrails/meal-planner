/**
 * Minimal React Native mock for Vitest/jsdom.
 * Only stubs the components and APIs used by our tested screens.
 * All style props are stripped since DOM doesn't accept RN-style objects.
 */

import React from 'react';

// Simple component factory — renders a div with the RN component name as data attribute
const mockComponent = (name: string) => {
  return React.forwardRef(({ children, testID, style, ...props }: any, ref: any) =>
    React.createElement('div', { 'data-testid': testID, 'data-component': name, ref, ...props }, children)
  );
}

// Pressable needs special handling — it accepts render-function children
const Pressable = React.forwardRef(({ children, testID, onPress, disabled, style, ...props }: any, ref: any) => {
  const resolvedChildren = typeof children === 'function' ? children({ pressed: false }) : children;
  return React.createElement(
    'button',
    { 'data-testid': testID, onClick: disabled ? undefined : onPress, disabled, ref, ...props },
    resolvedChildren,
  );
});
Pressable.displayName = 'Pressable';

// Switch mock with accessibility
const Switch = ({ value, onValueChange, disabled, testID, trackColor, thumbColor, style, ...props }: any) =>
  React.createElement('input', {
    type: 'checkbox',
    role: 'switch',
    checked: value,
    onChange: disabled ? undefined : () => onValueChange?.(!value),
    disabled,
    'data-testid': testID,
    ...props,
  });

// TextInput mock
const TextInput = React.forwardRef(({ value, onChangeText, editable = true, testID, placeholder, style, ...props }: any, ref: any) =>
  React.createElement('input', {
    type: 'text',
    value: value ?? '',
    onChange: editable ? (e: any) => onChangeText?.(e.target.value) : undefined,
    readOnly: !editable,
    disabled: !editable,
    placeholder,
    'data-testid': testID,
    ref,
    ...props,
  })
);
TextInput.displayName = 'TextInput';

export const View = mockComponent('View');
export const Text = mockComponent('Text');

// ScrollView strips RN-specific props
const ScrollView = React.forwardRef(({ children, testID, style, contentContainerStyle, keyboardShouldPersistTaps, showsVerticalScrollIndicator, ...props }: any, ref: any) =>
  React.createElement('div', { 'data-testid': testID, 'data-component': 'ScrollView', ref, ...props }, children)
);
ScrollView.displayName = 'ScrollView';

export { ScrollView };
export const ActivityIndicator = mockComponent('ActivityIndicator');
export const Platform = { OS: 'web', select: (obj: any) => obj.web ?? obj.default };
export const StyleSheet = {
  create: (styles: any) => styles,
  flatten: (style: any): any => {
    if (!style) return style;
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean).map((s: any) => StyleSheet.flatten(s)));
    }
    return style;
  },
};

// Animated mock — Value stub that stores numeric value, spring/timing are no-ops
class AnimatedValue {
  _value: number;
  constructor(value: number) {
    this._value = value;
  }
  setValue(value: number) { this._value = value; }
  interpolate(config: any) { return this; }
}

export const Animated = {
  Value: AnimatedValue,
  View: mockComponent('AnimatedView'),
  Text: mockComponent('AnimatedText'),
  Image: mockComponent('AnimatedImage'),
  spring: (_value: any, _config: any) => ({ start: (cb?: any) => cb?.({ finished: true }), stop: () => {} }),
  timing: (_value: any, _config: any) => ({ start: (cb?: any) => cb?.({ finished: true }), stop: () => {} }),
  parallel: (anims: any[]) => ({ start: (cb?: any) => cb?.({ finished: true }), stop: () => {} }),
  sequence: (anims: any[]) => ({ start: (cb?: any) => cb?.({ finished: true }), stop: () => {} }),
  loop: (anim: any) => ({ start: (cb?: any) => cb?.({ finished: true }), stop: () => {} }),
  event: () => () => {},
  createAnimatedComponent: (comp: any) => comp,
};

// Modal mock — renders children only when visible
const Modal = ({ visible, children, testID, transparent, animationType, onRequestClose, ...props }: any) =>
  visible ? React.createElement('div', { 'data-testid': testID, 'data-component': 'Modal', ...props }, children) : null;

export { Pressable, Switch, TextInput, Modal };
