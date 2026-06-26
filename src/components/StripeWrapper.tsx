/**
 * StripeWrapper
 *
 * Fetches the Stripe publishable key from the HAMA backend and
 * renders a StripeProvider. This ensures the provider always has
 * a valid key before any child component calls useStripe().
 *
 * Usage: Wrap a screen that uses useStripePayment hook.
 *
 *   <StripeWrapper>
 *     <SubscriptionsContent />
 *   </StripeWrapper>
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { getStripePublishableKey } from '../services/stripeService';
import { COLORS, SPACING } from '../constants/theme';

interface StripeWrapperProps {
  children: React.ReactNode;
}

export const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchKey = async () => {
      const res = await getStripePublishableKey();
      if (!mounted) return;

      if (res.success && res.publishableKey) {
        setPublishableKey(res.publishableKey);
      } else {
        setError(res.error || 'Failed to initialize Stripe');
      }
    };

    fetchKey();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!publishableKey) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      {children as React.ReactElement}
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
