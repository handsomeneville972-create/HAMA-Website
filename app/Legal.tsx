import React from 'react';
import { router } from 'expo-router';
import { LegalScreen } from '../src/screens/LegalScreen';

export default function Legal() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <LegalScreen navigation={navigation} />;
}
