import React from 'react';
import { router } from 'expo-router';
import { AboutScreen } from '../src/screens/AboutScreen';

export default function AboutPage() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <AboutScreen navigation={navigation} />;
}
