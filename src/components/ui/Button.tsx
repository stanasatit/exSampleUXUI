import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { PressableProps, StyleProp, TextProps, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { GluestackButton, IconName } from './gluestack';
import { colors, spacing } from '../../constants/theme';

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

type ButtonTextProps = TextProps & {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function ButtonText({ children, style, ...props }: ButtonTextProps) {
  const { action } = useContext(ButtonContext);

  return (
    <GluestackButton.Text
      style={[
        styles.buttonText,
        action === 'secondary' && styles.secondaryButtonText,
        style,
      ]}
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
  secondaryButtonText: {
    color: colors.text,
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
