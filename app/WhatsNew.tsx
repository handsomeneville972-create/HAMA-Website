import React from 'react';
import { router } from 'expo-router';
import { WhatsNewScreen } from '../src/screens/WhatsNewScreen';

export default function WhatsNew() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <WhatsNewScreen navigation={navigation} />;
}
