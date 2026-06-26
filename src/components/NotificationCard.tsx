import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Notification } from '../constants/types';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  'shopping-bag': 'bag-outline',
  truck: 'car-outline',
  'message-square': 'chatbubble-outline',
  'graduation-cap': 'school-outline',
  star: 'star-outline',
  'user-plus': 'person-add-outline',
  'calendar-check': 'calendar-outline',
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View style={[styles.card, !notification.read && styles.unreadCard]}>
          <LinearGradient
            colors={!notification.read ? ['rgba(255, 107, 0, 0.1)', 'rgba(255, 107, 0, 0.02)'] : COLORS.gradientCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={[styles.iconContainer, !notification.read && styles.unreadIcon]}>
              <Ionicons
                name={ICON_MAP[notification.icon] || 'notifications-outline'}
                size={20}
                color={!notification.read ? COLORS.primary : COLORS.textSecondary}
              />
            </View>
            <View style={styles.content}>
              <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
                {notification.title}
              </Text>
              <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
              <Text style={styles.time}>{notification.createdAt}</Text>
            </View>
            {!notification.read && <View style={styles.dot} />}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  card: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  unreadCard: {
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadIcon: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  unreadTitle: {
    color: COLORS.text,
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    color: COLORS.textTertiary,
    fontSize: 11,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
