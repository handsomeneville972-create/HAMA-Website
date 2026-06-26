import React from 'react';
import { router } from 'expo-router';
import { ForgotPasswordScreen } from '../src/screens/ForgotPasswordScreen';

export default function ForgotPasswordPage() {
  const navigation = {
    goBack: () => router.back(),
  };

  return <ForgotPasswordScreen navigation={navigation} />;
}
