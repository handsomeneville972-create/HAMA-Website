/**
 * HAMA™ Premium Included Label
 *
 * Small "PREMIUM INCLUDED" tag displayed beside AI tools, business features,
 * analytics, and other premium capabilities during Early Access.
 * Communicates that the feature is included in the Founding Member Program.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';

interface PremiumIncludedLabelProps {
  /** Optional custom style */
  style?: ViewStyle;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Custom text override */
  text?: string;
}

export const PremiumIncludedLabel: React.FC<PremiumIncludedLabelProps> = ({
  style,
  size = 'sm',
  text = 'PREMIUM INCLUDED',
}) => {
  const { isEarlyAccessActive } = useEarlyAccess();

  if (!isEarlyAccessActive) return null;

  return (
    <View style={[styles.container, size === 'md' && styles.containerMd, style]}>
      <LinearGradient
        colors={['rgba(0, 212, 170, 0.15)', 'rgba(255, 107, 0, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, size === 'md' && styles.gradientMd]}
      >
        <Ionicons
          name="sparkles"
          size={size === 'md' ? 12 : 10}
          color={COLORS.accent}
        />
        <Text style={[styles.text, size === 'md' && styles.textMd]}>{text}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  containerMd: {
    borderRadius: RADIUS.md,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gradientMd: {
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textMd: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
