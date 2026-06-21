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

import { AppAlertDialog, AppDatePicker, IconIonicons } from '../components/ui';
import { colors } from '../constants/theme';
import { UserApi } from '../services/api';
import type { UserRegisterRequest } from '../services/api';

const backgroundImage = require('../../assets/images/background.png');
const logoImage = require('../../assets/images/logo.png');

const userApi = new UserApi();

type RegisterScreenProps = {
  onBackPress: () => void;
  onRegistered: () => void;
};

type RegisterForm = {
  birthday: string;
  confirmPassword: string;
  email: string;
  lineId: string;
  password: string;
  phone: string;
  username: string;
};

const initialForm: RegisterForm = {
  birthday: '',
  confirmPassword: '',
  email: '',
  lineId: '',
  password: '',
  phone: '',
  username: '',
};

export function RegisterScreen({ onBackPress, onRegistered }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(initialForm);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [errorAlertMessage, setErrorAlertMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [successAlertMessage, setSuccessAlertMessage] = useState('');

  const canSubmit = useMemo(
    () =>
      form.username.trim().length > 0 &&
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      !isSubmitting,
    [form.confirmPassword.length, form.password.length, form.username, isSubmitting],
  );

  const updateForm = (key: keyof RegisterForm) => (value: string) => {
    setForm(current => ({
      ...current,
      [key]: value,
    }));
    setErrorAlertMessage('');
    setSuccess('');
  };

  const validateForm = () => {
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (form.username.trim().length < 3) {
      return 'กรุณากรอกชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร';
    }

    if (form.password.length < 6) {
      return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (form.password !== form.confirmPassword) {
      return 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
    }

    if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (phone.length > 0 && !/^[0-9+\-\s]{8,20}$/.test(phone)) {
      return 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }

    return '';
  };

  const handleRegisterPress = () => {
    const validationMessage = validateForm();

    if (validationMessage.length > 0) {
      setErrorAlertMessage(validationMessage);
      return;
    }

    setSuccess('');
    setIsConfirmVisible(true);
  };

  const handleRegister = async () => {
    const payload: UserRegisterRequest = {
      username: form.username.trim(),
      password: form.password,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.birthday.trim() ? { birthday: form.birthday.trim() } : {}),
      ...(form.lineId.trim() ? { line_id: form.lineId.trim() } : {}),
    };

    setIsSubmitting(true);
    setIsConfirmVisible(false);
    setSuccess('');

    try {
      const response = await userApi.register(payload);

      if (response.success === false) {
        setErrorAlertMessage(response.message ?? response.error ?? 'สมัครสมาชิกไม่สำเร็จ');
        return;
      }

      setSuccessAlertMessage(response.message ?? 'สมัครสมาชิกสำเร็จ');
    } catch (registerError) {
      setErrorAlertMessage(getErrorMessage(registerError));
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
            {/* <View style={styles.languageButton}>
              <IconIonicons color={colors.text} name="globe-outline" size={17} />
              <Text style={styles.languageText}>ไทย</Text>
            </View> */}
          </View>

          <View style={styles.brandBlock}>
            <View style={styles.logoClip}>
              <Image resizeMode="contain" source={logoImage} style={styles.logo} />
            </View>
            <Text style={styles.subtitle}>
              สร้างบัญชีเพื่อเริ่มใช้งาน EV Plug Go
            </Text>
          </View>

          <View style={styles.formPanel}>
            <Text style={styles.sectionTitle}>สมัครสมาชิก</Text>
            <Text style={styles.sectionDescription}>
              กรอกข้อมูลบัญชีสำหรับจองสถานีชาร์จ
            </Text>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="person-outline" size={21} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={updateForm('username')}
                placeholder="ชื่อผู้ใช้"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.username}
                maxLength={30}
              />
            </View>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="mail-outline" size={21} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={updateForm('email')}
                placeholder="อีเมล"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.email}
                maxLength={50}
              />
            </View>

            <View style={[styles.inputShell, styles.halfInput]}>
              <IconIonicons color={colors.muted} name="call-outline" size={20} />
              <TextInput
                keyboardType="phone-pad"
                onChangeText={updateForm('phone')}
                placeholder="เบอร์โทร"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.phone}
                maxLength={10}
                inputMode="numeric"
              />
            </View>
            <AppDatePicker
              maxDate={formatDateValue(new Date())}
              onChange={updateForm('birthday')}
              placeholder="วัน-เดือน-ปี"
              value={form.birthday}
              showTodayButton={false}
            />

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="chatbubble-ellipses-outline" size={21} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={updateForm('lineId')}
                placeholder="LINE ID"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={form.lineId}
                maxLength={50}
              />
            </View>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="lock-closed-outline" size={21} />
              <TextInput
                onChangeText={updateForm('password')}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                value={form.password}
                maxLength={10}
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
              <IconIonicons color={colors.muted} name="lock-closed-outline" size={21} />
              <TextInput
                onChangeText={updateForm('confirmPassword')}
                placeholder="ยืนยันรหัสผ่าน"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                value={form.confirmPassword}
                maxLength={10}
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

            {success.length > 0 ? <Text style={styles.successText}>{success}</Text> : null}

            <Pressable
              disabled={!canSubmit}
              onPress={handleRegisterPress}
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.primaryPressed,
                !canSubmit && styles.disabledButton,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.registerButtonText}>สมัครสมาชิก</Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginMuted}>มีบัญชีแล้ว?</Text>
              <Pressable
                onPress={onBackPress}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.loginLink}> เข้าสู่ระบบ</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <AppAlertDialog
          confirmText="ตกลง"
          message={errorAlertMessage}
          onConfirm={() => setErrorAlertMessage('')}
          title="สมัครสมาชิกไม่สำเร็จ"
          type="warning"
          visible={errorAlertMessage.length > 0}
        />
        <AppAlertDialog
          cancelText="ยกเลิก"
          confirmText="ยืนยัน"
          message="กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยันการสมัครสมาชิก"
          onCancel={() => setIsConfirmVisible(false)}
          onConfirm={handleRegister}
          title="ยืนยันสมัครสมาชิก"
          type="info"
          visible={isConfirmVisible}
        />
        <AppAlertDialog
          confirmText="ตกลง"
          message={successAlertMessage}
          onConfirm={onRegistered}
          title="สมัครสมาชิกสำเร็จ"
          type="success"
          visible={successAlertMessage.length > 0}
        />
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string }
      | undefined;

    return data?.message ?? data?.error ?? 'ไม่สามารถเชื่อมต่อ API สมัครสมาชิกได้';
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}

function formatDateValue(date: Date) {
  const year = date.getFullYear() + 543;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}-${month}-${year}`;
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
    marginTop: 6,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  disabledButton: {
    opacity: 0.55,
  },
  formPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(209, 213, 219, 0.76)',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 16,
    paddingBottom: 22,
    paddingHorizontal: 16,
    paddingTop: 18,
    shadowColor: '#0F172A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  halfInput: {
    flex: 1,
    minWidth: 0,
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
    gap: 10,
    minHeight: 52,
    marginTop: 12,
    paddingHorizontal: 14,
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
  languageText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  loginMuted: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
  registerButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 20,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  screen: {
    flex: 1,
  },
  sectionDescription: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 2,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
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
    marginTop: 10,
    textAlign: 'right',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
