import axios from 'axios';
import { useEffect, useState } from 'react';
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
import * as Keychain from 'react-native-keychain';

import { AppAlertDialog, IconIonicons } from '../components/ui';
import { colors } from '../constants/theme';
import { setApiAccessToken, UserApi } from '../services/api';
import type { UserLoginRequest, UserLoginResponse } from '../services/api';
import { registerOrUpdateDeviceToken } from '../services/device/deviceTokenRegistration';

const backgroundImage = require('../../assets/images/background.png');
const logoImage = require('../../assets/images/logo.png');
const rememberLoginService = 'evpluggo.remember-login';
const userApi = new UserApi();

type LoginScreenProps = {
  onForgotPasswordPress: () => void;
  onLogin: (credentials: { password: string; userId?: number; username: string }) => boolean;
  onRegisterPress: () => void;
};

export function LoginScreen({
  onForgotPasswordPress,
  onLogin,
  onRegisterPress,
}: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('develop1');
  const [password, setPassword] = useState('0123456789');
  const [isRememberEnabled, setIsRememberEnabled] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    Keychain.getGenericPassword({ service: rememberLoginService })
      .then(savedLogin => {
        if (!isMounted || !savedLogin) {
          return;
        }

        setUsername(savedLogin.password);
        setIsRememberEnabled(true);
      })
      .catch(error => {
        console.warn('Unable to load remembered login:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    const payload: UserLoginRequest = {
      username: username.trim(),
      password,
    };

    if (payload.username.length === 0 || payload.password.length === 0) {
      setAlertMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setAlertMessage('');

    try {
      const response = await userApi.login(payload);

      if (response.success === false) {
        setAlertMessage(response.message ?? response.error ?? 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      const token = getAccessToken(response);
      if (token) {
        setApiAccessToken(token);
      }

      if (isRememberEnabled) {
        await Keychain.setGenericPassword('username', payload.username, {
          accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
          service: rememberLoginService,
        });
      } else {
        await Keychain.resetGenericPassword({ service: rememberLoginService });
      }

      try {
        await registerOrUpdateDeviceToken({
          userId: response.user?.id,
          username: payload.username,
        });
      } catch (deviceTokenError) {
        console.warn('Unable to register device token:', deviceTokenError);
      }

      onLogin({ ...payload, userId: response.user?.id });
    } catch (loginError) {
      setAlertMessage(getLoginErrorMessage(loginError));
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
              paddingBottom: Math.max(insets.bottom, 18),
              paddingTop: Math.max(insets.top, 22),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* <View style={styles.languageRow}>
            <Pressable style={({ pressed }) => [styles.languageButton, pressed && styles.pressed]}>
              <IconIonicons color={colors.text} name="globe-outline" size={17} />
              <Text style={styles.languageText}>ไทย</Text>
              <IconIonicons color={colors.text} name="chevron-down" size={16} />
            </Pressable>
          </View> */}

          <View style={styles.brandBlock}>
            <View style={styles.logoClip}>
              <Image resizeMode="contain" source={logoImage} style={styles.logo} />
            </View>
            <Text style={styles.subtitle}>
              ค้นหา จองสถานีชาร์จรถ EV{'\n'}สะดวก รวดเร็ว ทุกการเดินทาง
            </Text>
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.sectionTitle}>เข้าสู่ระบบ</Text>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="mail-outline" size={21} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={value => {
                  setUsername(value);
                  setAlertMessage('');
                }}
                placeholder="ชื่อผู้ใช้"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={username}
              />
            </View>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="lock-closed-outline" size={21} />
              <TextInput
                onChangeText={value => {
                  setPassword(value);
                  setAlertMessage('');
                }}
                placeholder="รหัสผ่าน"
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

            <View style={styles.accountOptionsRow}>
              <Pressable
                onPress={() => setIsRememberEnabled(value => !value)}
                style={({ pressed }) => [styles.rememberRow, pressed && styles.pressed]}
              >
                <View style={[styles.checkbox, isRememberEnabled && styles.checkboxChecked]}>
                  {isRememberEnabled ? (
                    <IconIonicons color={colors.white} name="checkmark" size={16} />
                  ) : null}
                </View>
                <Text style={styles.rememberText}>จดจำการเข้าใช้งาน</Text>
              </Pressable>

              <Pressable
                onPress={onForgotPasswordPress}
                style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
              >
                <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
              </Pressable>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.primaryPressed,
                isSubmitting && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.divider} />
            </View>

            <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
              <IconIonicons color="#4285F4" name="logo-google" size={24} />
              <Text style={styles.socialText}>เข้าสู่ระบบด้วย Google</Text>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>
              <IconIonicons color="#000000" name="logo-apple" size={24} />
              <Text style={styles.socialText}>เข้าสู่ระบบด้วย Apple</Text>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupMuted}>ยังไม่มีบัญชี?</Text>
              <Pressable
                onPress={onRegisterPress}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.signupLink}> สร้างบัญชี</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <AppAlertDialog
          confirmText="ตกลง"
          message={alertMessage}
          onConfirm={() => setAlertMessage('')}
          title="เข้าสู่ระบบไม่สำเร็จ"
          type="warning"
          visible={alertMessage.length > 0}
        />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function getAccessToken(response: UserLoginResponse) {
  return response.access_token ?? response.token ?? null;
}

function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;

    return data?.message ?? data?.error ?? 'ไม่สามารถเชื่อมต่อ API เข้าสู่ระบบได้';
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

const styles = StyleSheet.create({
  accountOptionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    minHeight: 36,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  backgroundWash: {
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  divider: {
    backgroundColor: '#E5E7EB',
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginTop: 22,
  },
  dividerText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#DADDE2',
    borderRadius: 6,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.62,
  },
  forgotButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  formPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(209, 213, 219, 0.72)',
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
  googleMark: {
    color: '#4285F4',
    fontSize: 22,
    fontWeight: '800',
    width: 26,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 50,
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
    paddingHorizontal: 14,
    marginTop: 12,
  },
  keyboardView: {
    flex: 1,
  },
  languageButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DADDE2',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 36,
    paddingHorizontal: 11,
  },
  languageRow: {
    alignItems: 'flex-end',
  },
  languageText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 26,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  logo: {
    height: 190,
    width: 190,
  },
  logoClip: {
    alignItems: 'center',
    height: 138,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    width: 190,
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
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    minHeight: 34,
    paddingRight: 10,
  },
  rememberText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '700',
  },
  signupLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  signupMuted: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  signupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 38,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: '#DADDE2',
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 12,
  },
  socialText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    marginTop: 4,
    textAlign: 'center',
  },
});
