import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import type {
  PressableProps,
  TextInputProps,
  TextProps,
  ViewProps,
} from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { createButton } from '@gluestack-ui/core/lib/esm/button/creator/index.jsx';
import { createInput } from '@gluestack-ui/core/lib/esm/input/creator/index.jsx';
import { createAlert } from '@gluestack-ui/core/lib/esm/alert/creator/index.jsx';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type GluestackStateProps = {
  dataSet?: Record<string, unknown>;
  states?: Record<string, unknown>;
};

function omitGluestackStateProps<Props extends GluestackStateProps>({
  dataSet: _dataSet,
  states: _states,
  ...props
}: Props) {
  return props;
}

const ButtonRoot = forwardRef<View, PressableProps & GluestackStateProps>(
  (props, ref) => {
    const pressableProps = omitGluestackStateProps(props);

    return <Pressable ref={ref} {...pressableProps} />;
  },
);

const ButtonTextRoot = forwardRef<RNText, TextProps & GluestackStateProps>(
  (props, ref) => {
    const textProps = omitGluestackStateProps(props);

    return <RNText ref={ref} {...textProps} />;
  },
);

const ButtonIconRoot = forwardRef<
  RNText,
  ComponentProps<typeof Ionicons> & GluestackStateProps
>((props, ref) => {
  const iconProps = omitGluestackStateProps(props);

  return <Ionicons ref={ref} {...iconProps} />;
});

const InputRoot = forwardRef<View, ViewProps & GluestackStateProps>(
  (props, ref) => {
    const viewProps = omitGluestackStateProps(props);

    return <View ref={ref} {...viewProps} />;
  },
);

const InputSlotRoot = forwardRef<View, PressableProps & GluestackStateProps>(
  (props, ref) => {
    const pressableProps = omitGluestackStateProps(props);

    return <Pressable ref={ref} {...pressableProps} />;
  },
);

const InputFieldRoot = forwardRef<
  TextInput,
  TextInputProps & GluestackStateProps
>((props, ref) => {
  const inputProps = omitGluestackStateProps(props);

  return <TextInput ref={ref} {...inputProps} />;
});

export const GluestackButton = createButton({
  Group: View,
  Icon: ButtonIconRoot,
  Root: ButtonRoot,
  Spinner: ActivityIndicator,
  Text: ButtonTextRoot,
});

export const GluestackInput = createInput({
  Icon: ButtonIconRoot,
  Input: InputFieldRoot,
  Root: InputRoot,
  Slot: InputSlotRoot,
});

export const GluestackAlert = createAlert({
  Icon: ButtonIconRoot,
  Root: View,
  Text: RNText,
});
