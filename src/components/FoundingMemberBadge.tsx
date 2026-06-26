/**
 * HAMA™ Founding Member Badge
 *
 * Displays auto-incrementing Founding Member number (e.g. #000001)
 * with premium styling. Used in profiles, dashboard, settings, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SPACING, FONTS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { isFoundingMemberProgramActive, formatFoundingMemberNumber } from '../config/earlyAccess';

interface FoundingMemberBadgeProps {
  /** The founding member number (e.g. 1, 42, 1000) */
  memberNumber?: number;
  /** Badge variant */
  variant?: 'standard' | 'compact' | 'pill';
  /** Custom text override (defaults to config text) */
  text?: string;
  /** Optional custom style */
  style?: ViewStyle;
}

export const FoundingMemberBadge: React.FC<FoundingMemberBadgeProps> = ({
  memberNumber,
  variant = 'standard',
  text,
  style,
}) => {
  const { isEarlyAccessActive } = useEarlyAccess();

  if (!isEarlyAccessActive || !isFoundingMemberProgramActive()) {
    return null;
  }

  const badgeText = text || 'FOUNDING MEMBER';
  const memberDisplay = memberNumber ? formatFoundingMemberNumber(memberNumber) : null;

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons name="diamond" size={10} color={COLORS.primaryLight} />
        <Text style={styles.compactText}>
          {badgeText}{memberDisplay ? ` ${memberDisplay}` : ''}
        </Text>
      </View>
    );
  }

  if (variant === 'pill') {
    return (
      <View style={[styles.pillContainer, style]}>
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.2)', 'rgba(255, 255, 255, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillGradient}
        >
          <Ionicons name="diamond" size={12} color={COLORS.primaryLight} />
          <Text style={styles.pillText}>
            {badgeText}{memberDisplay ? ` ${memberDisplay}` : ''}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // Standard variant — premium gradient badge
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Ionicons name="diamond" size={12} color="#fff" />
        <View>
          <Text style={styles.text}>{badgeText}</Text>
          {memberDisplay && (
            <Text style={styles.memberNumber}>{memberDisplay}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  memberNumber: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  compactText: {
    color: COLORS.primaryLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pillContainer: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
