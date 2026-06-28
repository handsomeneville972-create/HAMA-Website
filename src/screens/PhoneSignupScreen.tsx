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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

type PhoneStep = 'phone' | 'otp';

export const PhoneSignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { sendPhoneOTP, verifyPhoneOTP, isLoading } = useAuth();

  const [step, setStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const isValidPhone = /^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));
  const isOtpComplete = otp.every(d => d.length === 1);

  const handleSendOTP = useCallback(async () => {
    if (!isValidPhone || isLoading) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await sendPhoneOTP(phone.trim());
      setStep('otp');
      setSuccessMsg('OTP sent!');
      startResendTimer();
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes('timed out')
          ? 'Phone auth is not configured. Please use email signup.'
          : err.message?.includes('not enabled')
          ? 'Phone authentication is not enabled. Please use email signup.'
          : err.message?.includes('invalid')
          ? 'Please enter a valid phone number with country code (e.g. +254...)'
          : 'Failed to send OTP. Please try again.'
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
          ? 'Invalid OTP. Please check and try again.'
          : err.message?.includes('expired')
          ? 'OTP has expired. Please request a new one.'
          : 'Verification failed. Please try again.'
      );
    }
  }, [isOtpComplete, isLoading, verifyPhoneOTP, otp, phone]);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient colors={['#000000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {step === 'phone' ? 'Sign Up with Phone' : 'Enter Code'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.brandSection}>
            <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCircle}>
              <Text style={styles.logoText}>H</Text>
            </LinearGradient>
            <Text style={styles.brandName}>HAMA</Text>
            <Text style={styles.brandTagline}>Need a house homie? We've got you!</Text>
          </View>

          {step === 'phone' ? (
            <>
              <GlassCard noPadding>
                <View style={styles.formContent}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <View style={styles.inputRow}>
                      <Ionicons name="call-outline" size={18} color={COLORS.textTertiary} />
                      <TextInput
                        style={styles.input}
                        placeholder="+254 712 345 678"
                        placeholderTextColor={COLORS.textTertiary}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        value={phone}
                        onChangeText={(text) => {
                          setPhone(text);
                          if (errorMsg) setErrorMsg('');
                        }}
                        editable={!isLoading}
                      />
                      {phone.length > 0 && (
                        <TouchableOpacity onPress={() => setPhone('')}>
                          <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </GlassCard>

              <Text style={styles.hintText}>
                Include your country code (e.g. +254 for Kenya, +1 for US)
              </Text>
            </>
          ) : (
            <>
              <GlassCard>
                <View style={styles.otpSection}>
                  <Text style={styles.otpTitle}>Enter the 6-digit code sent to</Text>
                  <Text style={styles.otpPhone}>{phone}</Text>
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
                </View>
              </GlassCard>

              <TouchableOpacity
                disabled={resendTimer > 0}
                onPress={handleSendOTP}
              >
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {errorMsg.length > 0 && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {successMsg.length > 0 && step === 'phone' && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, ((step === 'phone' ? !isValidPhone : !isOtpComplete) || isLoading) && styles.submitButtonDisabled]}
            onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
            disabled={(step === 'phone' ? !isValidPhone : !isOtpComplete) || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={(step === 'phone' ? isValidPhone : isOtpComplete) && !isLoading ? COLORS.gradientPremium : [COLORS.textTertiary, COLORS.textTertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>
                  {step === 'phone' ? 'Send OTP' : 'Verify & Sign Up'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
              <Text style={styles.toggleLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.lg,
  },
  brandSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  logoText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  brandName: {
    ...FONTS.h2,
    color: COLORS.text,
    fontWeight: '800',
  },
  brandTagline: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  formContent: {
    paddingVertical: SPACING.xs,
  },
  inputGroup: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputLabel: {
    color: COLORS.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 6,
  },
  hintText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  otpSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  otpTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  otpPhone: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
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
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  resendDisabled: {
    color: COLORS.textTertiary,
    textDecorationLine: 'none',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.25)',
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
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
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  toggleLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
