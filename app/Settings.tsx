import React from 'react';
import { router } from 'expo-router';
import { SettingsScreen } from '../src/screens/SettingsScreen';

export default function SettingsPage() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => router.push(route as any, params),
  };

  return <SettingsScreen navigation={navigation} />;
}
