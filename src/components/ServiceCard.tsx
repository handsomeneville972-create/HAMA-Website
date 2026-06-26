import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceProvider } from '../constants/types';
import { COLORS, RADIUS, SPACING, FONTS, SHADOWS } from '../constants/theme';

interface ServiceCardProps {
  provider: ServiceProvider;
  onPress?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ provider, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.card}>
        <LinearGradient colors={COLORS.gradientCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          <View style={styles.header}>
            <Image source={{ uri: provider.logo }} style={styles.logo} />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
                {provider.verified && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                )}
              </View>
              <Text style={styles.category}>{provider.subcategory}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.ratingText}>{provider.rating}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={2}>{provider.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{provider.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{provider.responseTime}</Text>
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{provider.pricing}</Text>
            </View>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  ratingText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceTag: {
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  priceText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
