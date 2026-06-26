import React from 'react';
import { router } from 'expo-router';
import { SubscriptionsScreen } from '../src/screens/SubscriptionsScreen';
import { StripeWrapper } from '../src/components/StripeWrapper';

export default function Subscriptions() {
  const navigation = {
    goBack: () => router.back(),
  };

  return (
    <StripeWrapper>
      <SubscriptionsScreen navigation={navigation} />
    </StripeWrapper>
  );
}
