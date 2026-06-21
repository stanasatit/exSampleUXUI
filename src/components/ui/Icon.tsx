import type { ComponentProps } from 'react';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';
import { Ionicons } from '@react-native-vector-icons/ionicons';

import type { IconName } from './gluestack';
import { colors } from '../../constants/theme';

type IconIoniconsProps = {
  color?: string;
  name: IconName;
  size?: number;
};

export function IconIonicons({
  color = colors.text,
  name,
  size = 20,
}: IconIoniconsProps) {
  return <Ionicons color={color} name={name} size={size} />;
}

export const Icon = IconIonicons;

type IconFontAwesome6Props = {
  color?: string;
  size?: number;
} & ComponentProps<typeof FontAwesome6>;

export function IconFontAwesome6({
  color = colors.text,
  size = 20,
  ...props
}: IconFontAwesome6Props) {
  return <FontAwesome6 color={color} size={size} {...props} />;
}
