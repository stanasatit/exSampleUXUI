import type { TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native';

import { GluestackInput, IconName } from './gluestack';
import { colors, spacing, typography } from '../../constants/theme';

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
});
