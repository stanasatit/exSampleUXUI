import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GluestackAlert } from './gluestack';
import type { IconName } from './gluestack';
import { colors, spacing } from '../../constants/theme';

export type AppAlertDialogType = 'error' | 'info' | 'success' | 'warning';

type AppAlertDialogProps = {
  cancelText?: string;
  confirmText?: string;
  message: string;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  type?: AppAlertDialogType;
  visible: boolean;
};

const alertTypeConfig: Record<
  AppAlertDialogType,
  {
    badgeBackgroundColor: string;
    badgeBorderColor: string;
    buttonColor: string;
    buttonPressedColor: string;
    iconColor: string;
    iconName: IconName;
  }
> = {
  error: {
    badgeBackgroundColor: '#FEF2F2',
    badgeBorderColor: '#FECACA',
    buttonColor: colors.danger,
    buttonPressedColor: '#B91C1C',
    iconColor: colors.danger,
    iconName: 'close-circle-outline',
  },
  info: {
    badgeBackgroundColor: '#EFF6FF',
    badgeBorderColor: '#BFDBFE',
    buttonColor: colors.info,
    buttonPressedColor: '#0284C7',
    iconColor: colors.info,
    iconName: 'information-circle-outline',
  },
  success: {
    badgeBackgroundColor: colors.mutedSurface,
    badgeBorderColor: 'rgba(22, 185, 104, 0.22)',
    buttonColor: colors.success,
    buttonPressedColor: colors.primaryPressed,
    iconColor: colors.success,
    iconName: 'checkmark-circle-outline',
  },
  warning: {
    badgeBackgroundColor: '#FFF7ED',
    badgeBorderColor: '#FED7AA',
    buttonColor: colors.warning,
    buttonPressedColor: '#EA580C',
    iconColor: colors.warning,
    iconName: 'alert-circle-outline',
  },
};

export function AppAlertDialog({
  cancelText = 'ยกเลิก',
  confirmText = 'ตกลง',
  message,
  onCancel,
  onConfirm,
  title,
  type = 'info',
  visible,
}: AppAlertDialogProps) {
  const config = alertTypeConfig[type];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onConfirm}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <GluestackAlert style={styles.panel}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: config.badgeBackgroundColor,
                  borderColor: config.badgeBorderColor,
                },
              ]}
            >
              <GluestackAlert.Icon
                color={config.iconColor}
                name={config.iconName}
                size={22}
              />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              <GluestackAlert.Text style={styles.message}>
                {message}
              </GluestackAlert.Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            {onCancel ? (
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.cancelAction,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelActionText}>{cancelText}</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: config.buttonColor },
                pressed && { backgroundColor: config.buttonPressedColor },
              ]}
            >
              <Text style={styles.actionText}>{confirmText}</Text>
            </Pressable>
          </View>
        </GluestackAlert>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.xl,
    width: '100%',
  },
  actionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelAction: {
    alignItems: 'center',
    backgroundColor: colors.mutedSurface,
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  cancelActionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(209, 213, 219, 0.78)',
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 420,
    padding: spacing.lg,
    shadowColor: '#0F172A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
});
