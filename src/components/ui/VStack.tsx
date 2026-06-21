import type { BoxProps } from './Box';
import { Box } from './Box';
import { spacing } from '../../constants/theme';

type VStackProps = BoxProps & {
  space?: keyof typeof spacing;
};

export function VStack({ space = 'md', style, ...props }: VStackProps) {
  return <Box style={[{ gap: spacing[space] }, style]} {...props} />;
}
