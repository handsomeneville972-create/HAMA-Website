import React from 'react';
import { useRouter } from 'expo-router';
import { PhoneSignupScreen } from '../src/screens/PhoneSignupScreen';

export default function PhoneSignupRoute() {
  const router = useRouter();
  return (
    <PhoneSignupScreen
      navigation={{
        goBack: () => router.back(),
      }}
    />
  );
}
