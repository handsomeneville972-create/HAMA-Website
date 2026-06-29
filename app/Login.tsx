import React from 'react';
import { router } from 'expo-router';
import { LoginScreen } from '../src/screens/LoginScreen';

export default function LoginPage() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string) => {
      if (route === 'ForgotPassword') router.push('/ForgotPassword');
    },
  };

  return <LoginScreen navigation={navigation} />;
}
