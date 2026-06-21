import { StyleSheet } from 'react-native';

import type { BoxProps } from './Box';
import { Box } from './Box';
import { spacing } from '../../constants/theme';

type HStackProps = BoxProps & {
  space?: keyof typeof spacing;
};

export function HStack({
  alignItems = 'center',
  space = 'md',
  style,
  ...props
}: HStackProps) {
  return (
    <Box
      alignItems={alignItems}
      style={[styles.hStack, { gap: spacing[space] }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  hStack: {
    flexDirection: 'row',
  },
});
