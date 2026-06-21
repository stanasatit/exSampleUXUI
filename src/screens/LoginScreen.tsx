import { useState } from 'react';
import {
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

const backgroundImage = require('../../assets/images/background.png');
const logoImage = require('../../assets/images/logo.png');

type LoginScreenProps = {
  onLogin: (credentials: { password: string; username: string }) => boolean;
  onRegisterPress: () => void;
};

export function LoginScreen({ onLogin, onRegisterPress }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    const didLogin = onLogin({ password, username });

    setError(didLogin ? '' : 'กรุณากรอกข้อมูลให้ครบถ้วน');
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
                onChangeText={setUsername}
                placeholder="อีเมล หรือ เบอร์โทรศัพท์"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={username}
              />
            </View>

            <View style={styles.inputShell}>
              <IconIonicons color={colors.muted} name="lock-closed-outline" size={21} />
              <TextInput
                onChangeText={setPassword}
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

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [styles.forgotButton, pressed && styles.pressed]}
            >
              <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
            </Pressable>

            {error.length > 0 ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [styles.loginButton, pressed && styles.primaryPressed]}
            >
              <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
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
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4,
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
