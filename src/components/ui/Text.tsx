import type { ReactNode } from 'react';
import type { TextProps } from 'react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { colors, typography } from '../../constants/theme';

export type AppTextProps = TextProps & {
  children: ReactNode;
  tone?: 'default' | 'danger' | 'muted';
  variant?: 'body' | 'caption' | 'eyebrow';
  weight?: 'bold' | 'regular' | 'semibold';
};

export function Text({
  children,
  style,
  tone = 'default',
  variant = 'body',
  weight = 'regular',
  ...props
}: AppTextProps) {
  return (
    <RNText
      style={[
        styles.text,
        textVariants[variant],
        textTones[tone],
        textWeights[weight],
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
});

const textTones = StyleSheet.create({
  danger: {
    color: colors.danger,
  },
  default: {
    color: colors.text,
  },
  muted: {
    color: colors.muted,
  },
});

const textVariants = StyleSheet.create({
  body: {
    fontSize: typography.body,
    lineHeight: 24,
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: 16,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
});

const textWeights = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  regular: {
    fontWeight: '400',
  },
  semibold: {
    fontWeight: '600',
  },
});
