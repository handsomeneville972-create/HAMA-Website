import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput } from '../utils/sanitize';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/validation';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { BlurText, FadeInView } from '../components/BlurText';
import { LiquidGlass, LiquidInput } from '../components/LiquidGlass';

const BG_IMAGE = require('../../assets/login-bg.jpg');

type AuthTab = 'phone' | 'email';
type EmailMode = 'login' | 'signup';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signIn, signUp, isLoading, sendPhoneOTP, verifyPhoneOTP } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('phone');
  const [emailMode, setEmailMode] = useState<EmailMode>('login');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phoneStep, setPhoneStep] = useState<'number' | 'otp'>('number');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isValidPhone = /^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
  const isOtpComplete = otp.every(d => d.length === 1);

  const passwordValidation = emailMode === 'signup' ? validatePassword(password) : null;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = emailMode === 'login' ? password.length >= 1 : passwordValidation?.isValid ?? true;
  const doPasswordsMatch = password === confirmPassword;
  const canSubmitEmail = isValidEmail && isPasswordValid && (emailMode === 'login' || doPasswordsMatch);

  const handleSendOTP = useCallback(async () => {
    if (!isValidPhone || isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await sendPhoneOTP(phone.trim());
      setPhoneStep('otp');
      setSuccessMsg('Code sent!');
      startResendTimer();
    } catch (err: any) {
      setErrorMsg(
        err.message === 'phone_provider_disabled'
          ? 'Phone verification is not yet enabled. Please use email to sign in, or contact support.'
          : err.message?.includes('not enabled')
          ? 'Phone authentication is not enabled. Please use email instead.'
          : err.message?.includes('invalid')
          ? 'Please enter a valid phone number with country code (e.g. +254...)'
          : 'Failed to send code. Please try again.'
      );
    }
  }, [isValidPhone, isLoading, sendPhoneOTP, phone]);

  const handleVerifyOTP = useCallback(async () => {
    if (!isOtpComplete || isLoading) return;
    setErrorMsg('');
    try {
      await verifyPhoneOTP(otp.join(''), phone.trim());
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes('invalid')
          ? 'Invalid code. Please check and try again.'
          : err.message?.includes('expired')
          ? 'Code has expired. Please request a new one.'
          : 'Verification failed. Please try again.'
      );
    }
  }, [isOtpComplete, isLoading, verifyPhoneOTP, otp, phone]);

  const handleEmailSubmit = useCallback(async () => {
    if (!canSubmitEmail || isLoading) return;
    setErrorMsg('');
    try {
      if (emailMode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      const message =
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.code === 'auth/weak-password'
          ? passwordValidation?.message ?? 'Password does not meet requirements.'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : err.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : err.message?.includes('Password must contain')
          ? err.message
          : err.message || 'Something went wrong. Please try again.';
      setErrorMsg(message);
    }
  }, [emailMode, email, password, canSubmitEmail, isLoading, signIn, signUp, passwordValidation]);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.root}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
          <FadeInView delay={100} duration={600}>
            <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
              <Text style={styles.logoText}>H</Text>
            </LinearGradient>
          </FadeInView>
          <BlurText text="HAMA" variant="h1" delay={300} duration={800} />
          <BlurText text="Find. Move. Settle." variant="caption" delay={600} duration={800} color={COLORS.textSecondary} />
        </View>

        <FadeInView delay={400} duration={700} slideUp slideDistance={30} style={styles.bottomSheet}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.92)', 'rgba(0, 0, 0, 0.98)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sheetGradient}
          >
            <View style={styles.dragHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tab Switcher */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'phone' && styles.tabActive]}
                  onPress={() => switchTab('phone')}
                >
                  <Ionicons name="call-outline" size={16} color={activeTab === 'phone' ? '#fff' : COLORS.textTertiary} />
                  <Text style={[styles.tabText, activeTab === 'phone' && styles.tabTextActive]}>Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'email' && styles.tabActive]}
                  onPress={() => switchTab('email')}
                >
                  <Ionicons name="mail-outline" size={16} color={activeTab === 'email' ? '#fff' : COLORS.textTertiary} />
                  <Text style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}>Email</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'phone' ? (
                /* ======== PHONE TAB ======== */
                <>
                  {phoneStep === 'number' ? (
                    <>
                      <Text style={styles.formTitle}>Enter your phone number</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={18} color={COLORS.textTertiary} />
                        <TextInput
                          style={styles.input}
                          placeholder="+254 712 345 678"
                          placeholderTextColor={COLORS.textTertiary}
                          keyboardType="phone-pad"
                          autoCapitalize="none"
                          value={phone}
                          onChangeText={(t) => { setPhone(t); if (errorMsg) setErrorMsg(''); }}
                          editable={!isLoading}
                        />
                        {phone.length > 0 && (
                          <TouchableOpacity onPress={() => setPhone('')}>
                            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.hintText}>Include country code (e.g. +254 for Kenya)</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.formTitle}>Enter the 6-digit code</Text>
                      <Text style={styles.otpPhone}>Sent to {phone}</Text>
                      <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => { otpRefs.current[index] = ref; }}
                            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            editable={!isLoading}
                            autoFocus={index === 0}
                          />
                        ))}
                      </View>
                      <TouchableOpacity disabled={resendTimer > 0} onPress={handleSendOTP}>
                        <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Error */}
                  {errorMsg.length > 0 && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  )}

                  {/* Submit */}
                  <TouchableOpacity
                    style={[styles.submitButton, ((phoneStep === 'number' ? !isValidPhone : !isOtpComplete) || isLoading) && styles.submitButtonDisabled]}
                    onPress={phoneStep === 'number' ? handleSendOTP : handleVerifyOTP}
                    disabled={(phoneStep === 'number' ? !isValidPhone : !isOtpComplete) || isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={(phoneStep === 'number' ? isValidPhone : isOtpComplete) && !isLoading ? COLORS.gradientPremium : [COLORS.textTertiary, COLORS.textTertiary]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.submitText}>{phoneStep === 'number' ? 'Send Code' : 'Verify & Continue'}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                /* ======== EMAIL TAB ======== */
                <>
                  <Text style={styles.formTitle}>{emailMode === 'login' ? 'Welcome Back' : 'Create Account'}</Text>

                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(t) => { setEmail(sanitizeInput(t, 254)); if (errorMsg) setErrorMsg(''); }}
                      editable={!isLoading}
                    />
                    {email.length > 0 && (
                      <TouchableOpacity onPress={() => setEmail('')}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={COLORS.textTertiary}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={password}
                      onChangeText={(t) => { setPassword(sanitizeInput(t, 128, { trim: false, stripSql: false })); if (errorMsg) setErrorMsg(''); }}
                      editable={!isLoading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                  </View>

                  {emailMode === 'signup' && password.length > 0 && passwordValidation && (
                    <View style={styles.passwordRequirements}>
                      {PASSWORD_REQUIREMENTS.map((req) => {
                        const met = passwordValidation.checks[req.key];
                        return (
                          <View key={req.key} style={styles.requirementRow}>
                            <Ionicons name={met ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={met ? COLORS.success : COLORS.textTertiary} />
                            <Text style={[styles.requirementText, met && styles.requirementMet]}>{req.label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {emailMode === 'signup' && (
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={18} color={COLORS.textTertiary} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm password"
                        placeholderTextColor={COLORS.textTertiary}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={confirmPassword}
                        onChangeText={(t) => { setConfirmPassword(sanitizeInput(t, 128, { trim: false, stripSql: false })); if (errorMsg) setErrorMsg(''); }}
                        editable={!isLoading}
                      />
                      {confirmPassword.length > 0 && (
                        <Ionicons name={doPasswordsMatch ? 'checkmark-circle' : 'close-circle'} size={18} color={doPasswordsMatch ? COLORS.success : COLORS.error} />
                      )}
                    </View>
                  )}

                  {errorMsg.length > 0 && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.submitButton, (!canSubmitEmail || isLoading) && styles.submitButtonDisabled]}
                    onPress={handleEmailSubmit}
                    disabled={!canSubmitEmail || isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={canSubmitEmail && !isLoading ? COLORS.gradientPremium : [COLORS.textTertiary, COLORS.textTertiary]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.submitText}>{emailMode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {emailMode === 'login' && (
                    <TouchableOpacity style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleText}>
                      {emailMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    </Text>
                    <TouchableOpacity onPress={() => { setEmailMode(prev => prev === 'login' ? 'signup' : 'login'); setErrorMsg(''); setConfirmPassword(''); }} disabled={isLoading}>
                      <Text style={styles.toggleLink}>{emailMode === 'login' ? 'Sign Up' : 'Sign In'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </LinearGradient>
        </FadeInView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  flex: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    gap: 6,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '60%',
  },
  sheetGradient: {
    flex: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 32,
    gap: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
  },
  hintText: {
    color: COLORS.textTertiary,
    fontSize: 12,
  },
  otpPhone: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  otpInput: {
    width: 48,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  resendText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendDisabled: {
    color: COLORS.textTertiary,
    textDecorationLine: 'none',
  },
  passwordRequirements: {
    gap: 2,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  requirementMet: {
    color: COLORS.success,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotLink: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  forgotText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  toggleLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
