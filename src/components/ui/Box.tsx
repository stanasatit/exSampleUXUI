import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';

export type BoxProps = ViewProps & {
  alignItems?: ViewStyle['alignItems'];
  flex?: ViewStyle['flex'];
  justifyContent?: ViewStyle['justifyContent'];
  style?: StyleProp<ViewStyle>;
};

export function Box({
  alignItems,
  flex,
  justifyContent,
  style,
  ...props
}: BoxProps) {
  return (
    <View
      style={[{ alignItems, flex, justifyContent }, style]}
      {...props}
    />
  );
}
