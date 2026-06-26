import React from 'react';
import { router } from 'expo-router';
import { FounderDashboardScreen } from '../src/screens/FounderDashboardScreen';

export default function FounderDashboard() {
  const navigation = { goBack: () => router.back() };
  return <FounderDashboardScreen navigation={navigation} />;
}
