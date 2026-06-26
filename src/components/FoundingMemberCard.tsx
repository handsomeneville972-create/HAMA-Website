/**
 * HAMA™ Founding Member Card
 *
 * Displays membership info for the user: Founding Member number,
 * referral count, premium usage score, subscription interest.
 * Designed for use in Profile, Settings, and Account Overview.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from './GlassCard';
import { FoundingMemberBadge } from './FoundingMemberBadge';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';
import { useEarlyAccess } from '../contexts/EarlyAccessContext';
import { isFoundingMemberProgramActive, formatFoundingMemberNumber } from '../config/earlyAccess';
import type { User } from '../constants/types';

interface FoundingMemberCardProps {
  user: User;
}

export const FoundingMemberCard: React.FC<FoundingMemberCardProps> = ({ user }) => {
  const { isEarlyAccessActive } = useEarlyAccess();

  if (!isEarlyAccessActive || !isFoundingMemberProgramActive()) {
    return null;
  }

  const memberNumber = user.foundingMemberNumber;
  const referralCount = user.referralCount ?? 0;
  const premiumScore = user.premiumUsageScore ?? 0;

  return (
    <GlassCard elevated>
      <LinearGradient
        colors={['rgba(255, 107, 0, 0.06)', 'rgba(255, 255, 255, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientOverlay}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={COLORS.gradientPremium}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="diamond" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>Founding Member</Text>
            <FoundingMemberBadge
              variant="pill"
              memberNumber={memberNumber}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {memberNumber ? formatFoundingMemberNumber(memberNumber) : '---'}
            </Text>
            <Text style={styles.statLabel}>Member #</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.scoreRow}>
              <View style={[styles.scoreBar, { width: `${premiumScore}%` }]} />
            </View>
            <Text style={styles.statLabel}>Premium Score</Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsList}>
          {[
            { icon: 'star', label: 'Exclusive Badge & Status', color: COLORS.warning },
            { icon: 'headset', label: 'Priority Support Access', color: COLORS.accent },
            { icon: 'rocket', label: 'Early Feature Access', color: COLORS.primaryLight },
            { icon: 'gift', label: 'Future Launch Incentives', color: COLORS.secondary },
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons name={benefit.icon as any} size={14} color={benefit.color} />
              <Text style={styles.benefitText}>{benefit.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  gradientOverlay: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  statLabel: {
    color: COLORS.textTertiary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.glassBorder,
  },
  scoreRow: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  benefitsList: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});
