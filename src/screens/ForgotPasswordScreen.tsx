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

import { AppAlertDialog, IconIonicons } from '../components/ui';
import { colors } from '../constants/theme';
import { UserApi } from '../services/api';
import type { UserForgotPasswordRequest } from '../services/api';

const backgroundImage = require('../../assets/images/background.png');
const logoImage = require('../../assets/images/logo.png');

const userApi = new UserApi();

type ForgotPasswordScreenProps = {
  onBackPress: () => void;
  onResetPasswordRequested: (username: string) => void;
};

export function ForgotPasswordScreen({
  onBackPress,
  onResetPasswordRequested,
}: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const canSubmit = useMemo(
    () => username.trim().length > 0 && !isSubmitting,
    [isSubmitting, username],
  );

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError('');
    setSuccess('');
  };

  const handleForgotPassword = async () => {
    const trimmedUsername = username.trim();

    if (trimmedUsername.length === 0) {
      setError('กรุณากรอกอีเมล เบอร์โทรศัพท์ หรือชื่อผู้ใช้');
      return;
    }

    const payload: UserForgotPasswordRequest = {
      username: trimmedUsername,
    };

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('[ForgotPassword] call api /user/forgot-password', payload);
      const response = await userApi.forgotPassword(payload);
      console.log('[ForgotPassword] response /user/forgot-password', response);

      if (response.success === false) {
        if (response.code === '404') {
          setAlertMessage(
            response.message ??
              response.error ??
              'ไม่พบอีเมล เบอร์โทรศัพท์ หรือชื่อผู้ใช้นี้ในระบบ',
          );
          return;
        }

        setError(response.message ?? response.error ?? 'ส่งคำขอรีเซ็ตรหัสผ่านไม่สำเร็จ');
        return;
      }

      setSuccess(
        response.message ??
          'ส่งคำขอรีเซ็ตรหัสผ่านสำเร็จ กรุณาตรวจสอบอีเมลหรือข้อความจากระบบ',
      );
      setTimeout(() => {
        onResetPasswordRequested(trimmedUsername);
      }, 500);
    } catch (forgotPasswordError) {
      if (isNotFoundError(forgotPasswordError)) {
        setAlertMessage(getErrorMessage(forgotPasswordError));
        return;
      }

      setError(getErrorMessage(forgotPasswordError));
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
              กู้คืนบัญชีของคุณเพื่อกลับมาใช้งาน EV Plug Go
            </Text>
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.sectionTitle}>ลืมรหัสผ่าน</Text>
            <Text style={styles.sectionDescription}>
              กรอกอีเมล เบอร์โทรศัพท์ หรือชื่อผู้ใช้ที่ลงทะเบียนไว้{'\n'}ระบบจะส่งขั้นตอนสำหรับรีเซ็ตรหัสผ่านให้คุณ
            </Text>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="mail-outline" size={21} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={handleUsernameChange}
                placeholder="อีเมล เบอร์โทรศัพท์ หรือชื่อผู้ใช้"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={username}
              />
            </View>

            {error.length > 0 ? <Text style={styles.errorText}>{error}</Text> : null}
            {success.length > 0 ? <Text style={styles.successText}>{success}</Text> : null}

            <Pressable
              disabled={!canSubmit}
              onPress={handleForgotPassword}
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
                  <IconIonicons color={colors.white} name="send-outline" size={19} />
                  <Text style={styles.submitButtonText}>ส่งคำขอรีเซ็ตรหัสผ่าน</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={onBackPress}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
            >
              <Text style={styles.loginText}>กลับไปเข้าสู่ระบบ</Text>
            </Pressable>
          </View>
        </ScrollView>

        <AppAlertDialog
          message={alertMessage}
          onConfirm={() => setAlertMessage('')}
          title="ไม่พบข้อมูล"
          type="warning"
          visible={alertMessage.length > 0}
        />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;

    return data?.message ?? data?.error ?? 'ไม่สามารถเชื่อมต่อ API ลืมรหัสผ่านได้';
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

const styles = StyleSheet.create({
  backgroundWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 34,
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
    borderColor: 'rgba(209, 213, 219, 0.76)',
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
    marginTop: 16,
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
    height: 160,
    width: 180,
  },
  logoClip: {
    alignItems: 'center',
    height: 112,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    width: 180,
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
    marginBottom: 2,
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
