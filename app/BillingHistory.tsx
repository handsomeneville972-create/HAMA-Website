import React from 'react';
import { router } from 'expo-router';
import { BillingHistoryScreen } from '../src/screens/BillingHistoryScreen';

export default function BillingHistory() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <BillingHistoryScreen navigation={navigation} />;
}
