import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { createContext, forwardRef, useContext } from 'react';
import type {
  PressableProps,
  StyleProp,
  TextInputProps,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { createButton } from '@gluestack-ui/core/lib/esm/button/creator/index.jsx';
import { createInput } from '@gluestack-ui/core/lib/esm/input/creator/index.jsx';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

import { colors, spacing, typography } from '../../constants/theme';

type ColorMode = 'dark' | 'light';
type Space = keyof typeof spacing;
type IconName = ComponentProps<typeof Ionicons>['name'];
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

const ButtonTextRoot = forwardRef<
  RNText,
  TextProps & GluestackStateProps
>((props, ref) => {
  const textProps = omitGluestackStateProps(props);

  return <RNText ref={ref} {...textProps} />;
});

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

const GluestackButton = createButton({
  Group: View,
  Icon: ButtonIconRoot,
  Root: ButtonRoot,
  Spinner: ActivityIndicator,
  Text: ButtonTextRoot,
});

const GluestackInput = createInput({
  Icon: ButtonIconRoot,
  Input: InputFieldRoot,
  Root: InputRoot,
  Slot: InputSlotRoot,
});

const GluestackUIContext = createContext<{ colorMode: ColorMode }>({
  colorMode: 'light',
});

type GluestackUIProviderProps = PropsWithChildren<{
  colorMode?: ColorMode;
}>;

export function GluestackUIProvider({
  children,
  colorMode = 'light',
}: GluestackUIProviderProps) {
  return (
    <GluestackUIContext.Provider value={{ colorMode }}>
      {children}
    </GluestackUIContext.Provider>
  );
}

export function useGluestackUI() {
  return useContext(GluestackUIContext);
}

type BoxProps = ViewProps & {
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

type StackProps = BoxProps & {
  space?: Space;
};

export function VStack({ space = 'md', style, ...props }: StackProps) {
  return <Box style={[{ gap: spacing[space] }, style]} {...props} />;
}

export function HStack({
  alignItems = 'center',
  space = 'md',
  style,
  ...props
}: StackProps) {
  return (
    <Box
      alignItems={alignItems}
      style={[styles.hStack, { gap: spacing[space] }, style]}
      {...props}
    />
  );
}

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: CardProps) {
  return <Box style={[styles.card, style]}>{children}</Box>;
}

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

type AppTextProps = TextProps & {
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

type ButtonProps = PressableProps & {
  action?: 'primary' | 'secondary';
};

const ButtonContext = createContext<{ action: NonNullable<ButtonProps['action']> }>({
  action: 'primary',
});

export function Button({
  action = 'primary',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? undefined;

  return (
    <ButtonContext.Provider value={{ action }}>
      <GluestackButton
        disabled={isDisabled}
        isDisabled={isDisabled}
        style={({ pressed }) => [
          styles.button,
          buttonActions[action],
          pressed && styles.buttonPressed,
          isDisabled && styles.buttonDisabled,
          typeof style === 'function' ? style({ pressed }) : style,
        ]}
        {...props}
      >
        {children}
      </GluestackButton>
    </ButtonContext.Provider>
  );
}

export function ButtonText({ children, style, ...props }: AppTextProps) {
  const { action } = useContext(ButtonContext);

  return (
    <GluestackButton.Text
      style={[styles.buttonText, action === 'secondary' && styles.secondaryButtonText, style]}
      {...props}
    >
      {children}
    </GluestackButton.Text>
  );
}

type ButtonIconProps = {
  name: IconName;
};

export function ButtonIcon({ name }: ButtonIconProps) {
  const { action } = useContext(ButtonContext);

  return (
    <GluestackButton.Icon
      color={action === 'secondary' ? colors.text : colors.white}
      name={name}
      size={20}
    />
  );
}

type IconIoniconsProps = {
  color?: string;
  name: IconName;
  size?: number;
};

export function IconIonicons({ color = colors.text, name, size = 20 }: IconIoniconsProps) {
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

type InputProps = TextInputProps & {
  leftIcon?: IconName;
};

export function Input({ leftIcon, style, ...props }: InputProps) {
  return (
    <GluestackInput style={styles.inputShell}>
      {leftIcon ? (
        <GluestackInput.Slot>
          <GluestackInput.Icon color={colors.muted} name={leftIcon} size={20} />
        </GluestackInput.Slot>
      ) : null}
      <GluestackInput.Input
        placeholderTextColor={colors.muted}
        style={[styles.input, style]}
        {...props}
      />
    </GluestackInput>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    shadowColor: '#111827',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  heading: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  hStack: {
    flexDirection: 'row',
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    minHeight: 52,
    padding: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  text: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 24,
  },
});

const buttonActions = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.mutedSurface,
    borderColor: colors.border,
    borderWidth: 1,
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
