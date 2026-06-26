import React from 'react';
import { router } from 'expo-router';
import { CurrencyPickerScreen } from '../src/screens/CurrencyPickerScreen';

export default function CurrencyPickerPage() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <CurrencyPickerScreen navigation={navigation} />;
}
