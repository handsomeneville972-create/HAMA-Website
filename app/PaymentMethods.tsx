import React from 'react';
import { router } from 'expo-router';
import { PaymentMethodsScreen } from '../src/screens/PaymentMethodsScreen';

export default function PaymentMethods() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <PaymentMethodsScreen navigation={navigation} />;
}
