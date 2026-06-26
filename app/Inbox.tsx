import React from 'react';
import { router } from 'expo-router';
import { InboxScreen } from '../src/screens/InboxScreen';

export default function InboxPage() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (route === 'Chat') router.push({ pathname: '/Chat', params });
    },
  };

  return <InboxScreen navigation={navigation} />;
}
