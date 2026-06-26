import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  gradient?: readonly [string, string];
  blur?: boolean;
  elevated?: boolean;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  gradient = COLORS.gradientCard,
  elevated = false,
  noPadding = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  };

  const cardContent = (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, onPress ? undefined : undefined]}>
      <View style={[styles.card, elevated && styles.elevated, style]}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          <View style={[styles.content, noPadding ? undefined : styles.padded]}>
            {children}
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.sm,
  },
  elevated: {
    ...SHADOWS.md,
  },
  gradient: {
    borderRadius: RADIUS.lg,
  },
  content: {
    borderRadius: RADIUS.lg,
  },
  padded: {
    padding: SPACING.md,
  },
});
