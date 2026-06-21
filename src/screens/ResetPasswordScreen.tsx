import axios from 'axios';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconIonicons } from '../components/ui';
import { colors } from '../constants/theme';
import { UserApi } from '../services/api';
import type { UserResetPasswordRequest } from '../services/api';

const backgroundImage = require('../../assets/images/background.png');
const logoImage = require('../../assets/images/logo.png');

const userApi = new UserApi();

type ResetPasswordScreenProps = {
  onBackPress: () => void;
  onResetDone: () => void;
  username: string;
};

export function ResetPasswordScreen({
  onBackPress,
  onResetDone,
  username,
}: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canSubmit = useMemo(
    () =>
      password.length > 0 &&
      confirmPassword.length > 0 &&
      !isSubmitting,
    [confirmPassword.length, isSubmitting, password.length],
  );

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (password.length < 6) {
      return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (password !== confirmPassword) {
      return 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน';
    }

    return '';
  };

  const handleResetPassword = async () => {
    const validationMessage = validateForm();

    if (validationMessage.length > 0) {
      setError(validationMessage);
      return;
    }

    const payload: UserResetPasswordRequest = {
      username,
      new_password: password,
    };

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('[ResetPassword] call api /user/reset-password', {
        ...payload,
        new_password: '***',
      });
      const response = await userApi.resetPassword(payload);
      console.log('[ResetPassword] response /user/reset-password', response);

      if (response.success === false) {
        setError(response.message ?? response.error ?? 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
        return;
      }

      setSuccess(response.message ?? 'ตั้งรหัสผ่านใหม่สำเร็จ');
      setTimeout(onResetDone, 700);
    } catch (resetPasswordError) {
      console.log('[ResetPassword] error /user/reset-password', resetPasswordError);
      setError(getErrorMessage(resetPasswordError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}
    >
      <ImageBackground
        resizeMode="cover"
        source={backgroundImage}
        style={styles.screen}
      >
        <View style={styles.backgroundWash} />
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(insets.bottom, 22),
              paddingTop: Math.max(insets.top, 18),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable
              hitSlop={10}
              onPress={onBackPress}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <IconIonicons color={colors.text} name="chevron-back" size={23} />
            </Pressable>
          </View>

          <View style={styles.brandBlock}>
            <View style={styles.logoClip}>
              <Image resizeMode="contain" source={logoImage} style={styles.logo} />
            </View>
            <Text style={styles.subtitle}>
              สร้างรหัสผ่านใหม่สำหรับบัญชีของคุณ
            </Text>
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.sectionTitle}>ตั้งรหัสผ่านใหม่</Text>
            <Text style={styles.sectionDescription}>
              กำหนดรหัสผ่านใหม่สำหรับบัญชี {username}
            </Text>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="lock-closed-outline" size={21} />
              <TextInput
                onChangeText={value => {
                  setPassword(value);
                  clearFeedback();
                }}
                placeholder="รหัสผ่านใหม่"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                value={password}
              />
              <Pressable
                hitSlop={10}
                onPress={() => setIsPasswordVisible(value => !value)}
              >
                <IconIonicons
                  color={colors.text}
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                />
              </Pressable>
            </View>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="shield-checkmark-outline" size={21} />
              <TextInput
                onChangeText={value => {
                  setConfirmPassword(value);
                  clearFeedback();
                }}
                placeholder="ยืนยันรหัสผ่านใหม่"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                value={confirmPassword}
              />
            </View>

            {error.length > 0 ? <Text style={styles.errorText}>{error}</Text> : null}
            {success.length > 0 ? <Text style={styles.successText}>{success}</Text> : null}

            <Pressable
              disabled={!canSubmit}
              onPress={handleResetPassword}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.primaryPressed,
                !canSubmit && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <IconIonicons color={colors.white} name="checkmark-circle-outline" size={20} />
                  <Text style={styles.submitButtonText}>บันทึกรหัสผ่านใหม่</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onResetDone}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
            >
              <Text style={styles.loginText}>กลับไปเข้าสู่ระบบ</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;

    return data?.message ?? data?.error ?? 'ไม่สามารถเชื่อมต่อ API ตั้งรหัสผ่านใหม่ได้';
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

const styles = StyleSheet.create({
  backgroundWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 30,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'right',
  },
  formPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(209, 213, 219, 0.78)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    shadowColor: '#0F172A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DADDE2',
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 50,
    minWidth: 0,
    padding: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#DADDE2',
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  keyboardView: {
    flex: 1,
  },
  loginButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 42,
  },
  loginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  logo: {
    height: 150,
    width: 170,
  },
  logoClip: {
    alignItems: 'center',
    height: 104,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    width: 170,
  },
  pressed: {
    opacity: 0.72,
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed,
  },
  screen: {
    flex: 1,
  },
  sectionDescription: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 2,
    textAlign: 'center',
  },
  successText: {
    color: colors.primaryPressed,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'right',
  },
});
