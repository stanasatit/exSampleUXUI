import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text as RNText } from 'react-native';

import { colors, typography } from '../../constants/theme';

type HeadingProps = TextProps & {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function Heading({ children, style, ...props }: HeadingProps) {
  return (
    <RNText style={[styles.heading, style]} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
});
