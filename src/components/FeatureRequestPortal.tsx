/**
 * HAMA™ Feature Request Portal
 *
 * A modal form that allows users to submit feature ideas, improvements,
 * and bug reports. Supports title, description, priority selection,
 * and category selection.
 *
 * Submissions are tracked with analytics and stored locally (AsyncStorage)
 * with a path to migrate to Supabase in production.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { useAuth } from '../contexts/AuthContext';
import { EARLY_ACCESS_CONFIG } from '../config/earlyAccess';
import { FEATURE_REQUEST_CATEGORIES, FEATURE_REQUEST_PRIORITIES } from '../constants/types';
import type { FeatureRequestCategory, FeatureRequestPriority } from '../constants/types';
import { trackFeatureRequestViewed, trackFeatureRequestSubmitted, trackFeatureRequestCancelled } from '../utils/analytics';

export const FeatureRequestPortal: React.FC = () => {
  const { isFeatureRequestVisible, hideFeatureRequest, submitFeatureRequest } = useEarlyAccess();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FeatureRequestCategory | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<FeatureRequestPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  if (!isFeatureRequestVisible || !EARLY_ACCESS_CONFIG.FEATURE_REQUEST.ENABLED) return null;

  // Track view
  React.useEffect(() => {
    trackFeatureRequestViewed('portal');
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your feature request.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a category for your feature request.');
      return;
    }
    if (title.trim().length < 5) {
      Alert.alert('Too Short', 'Please provide a more descriptive title (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeatureRequest({
        title: title.trim(),
        description: description.trim() || `${title.trim()} — suggested improvement for HAMA.`,
        priority: selectedPriority,
        category: selectedCategory,
        userId: currentUser?.id,
        userName: currentUser?.name,
        userEmail: currentUser?.email,
      });
      trackFeatureRequestSubmitted(selectedCategory, selectedPriority);
      setStep('success');
    } catch {
      Alert.alert('Error', 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    trackFeatureRequestCancelled();
    resetForm();
    hideFeatureRequest();
  };

  const handleSuccessDone = () => {
    resetForm();
    hideFeatureRequest();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedPriority('medium');
    setStep('form');
  };

  const currentCategoryInfo = FEATURE_REQUEST_CATEGORIES.find(c => c.key === selectedCategory);

  return (
    <Modal
      visible={isFeatureRequestVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <LinearGradient
              colors={['rgba(10, 10, 10, 0.99)', 'rgba(0, 0, 0, 0.99)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modal}
            >
              {/* Close */}
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* ===== SUCCESS ===== */}
                {step === 'success' && (
                  <View style={styles.successContainer}>
                    <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.successIcon}>
                      <Ionicons name="bulb" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.successTitle}>Thanks for the Idea! 💡</Text>
                    <Text style={styles.successDesc}>
                      Your feature request has been submitted. Our team reviews every suggestion
                      and the most popular requests will be prioritized on our roadmap.
                    </Text>
                    {currentCategoryInfo && (
                      <View style={[styles.successCategoryBadge, { backgroundColor: COLORS.primary + '20' }]}>
                        <Ionicons name={currentCategoryInfo.icon as any} size={16} color={COLORS.primary} />
                        <Text style={styles.successCategoryText}>{currentCategoryInfo.label}</Text>
                      </View>
                    )}
                    <Text style={styles.successVotes}>
                      Your vote has been counted. Share your request to get more votes!
                    </Text>
                    <TouchableOpacity style={styles.successButton} onPress={handleSuccessDone}>
                      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successButtonGrad}>
                        <Text style={styles.successButtonText}>Done</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ===== FORM ===== */}
                {step === 'form' && (
                  <>
                    <LinearGradient colors={COLORS.gradientPremium} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                      <Ionicons name="bulb-outline" size={28} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.title}>Suggest a Feature</Text>
                    <Text style={styles.subtitle}>
                      Help shape the future of HAMA. Share your ideas for new features,
                      improvements, or things you'd love to see.
                    </Text>

                    {/* Title */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Feature Title *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="What would you like to see?"
                        placeholderTextColor={COLORS.textTertiary}
                        value={title}
                        onChangeText={setTitle}
                        autoCapitalize="sentences"
                        maxLength={100}
                      />
                      <Text style={styles.charCount}>{title.length}/100</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Description (optional)</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your idea in more detail..."
                        placeholderTextColor={COLORS.textTertiary}
                        value={description}
                        onChangeText={setDescription}
                        autoCapitalize="sentences"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Category */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Category *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                        {FEATURE_REQUEST_CATEGORIES.map((cat) => (
                          <TouchableOpacity
                            key={cat.key}
                            style={[styles.categoryChip, selectedCategory === cat.key && styles.categoryChipActive]}
                            onPress={() => setSelectedCategory(cat.key)}
                          >
                            <Ionicons
                              name={cat.icon as any}
                              size={16}
                              color={selectedCategory === cat.key ? '#fff' : COLORS.textTertiary}
                            />
                            <Text style={[styles.categoryChipText, selectedCategory === cat.key && styles.categoryChipTextActive]}>
                              {cat.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Priority */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Priority</Text>
                      <View style={styles.priorityRow}>
                        {FEATURE_REQUEST_PRIORITIES.map((p) => (
                          <TouchableOpacity
                            key={p.key}
                            style={[styles.priorityChip, selectedPriority === p.key && { backgroundColor: p.color + '30', borderColor: p.color }]}
                            onPress={() => setSelectedPriority(p.key)}
                          >
                            <Text style={[styles.priorityChipText, selectedPriority === p.key && { color: p.color }]}>
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                      onPress={handleSubmit}
                      disabled={submitting}
                    >
                      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnGrad}>
                        {submitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="bulb" size={18} color="#fff" />
                            <Text style={styles.submitBtnText}>Submit Feature Request</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ===== Styles =====
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  container: {
    width: '100%',
    maxHeight: '100%',
  },
  modal: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 12, right: 12,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scroll: {
    padding: SPACING.xl,
    gap: 16,
  },
  iconCircle: {
    width: 56, height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    ...SHADOWS.glow,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: -4,
  },
  // Inputs
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    color: COLORS.textTertiary,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  // Category
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Priority
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  priorityChipText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  // Submit
  submitBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Success
  successContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  successIcon: {
    width: 72, height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  successTitle: {
    ...FONTS.h2,
    color: COLORS.text,
    textAlign: 'center',
  },
  successDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  successCategoryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  successVotes: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  successButton: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  successButtonGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
