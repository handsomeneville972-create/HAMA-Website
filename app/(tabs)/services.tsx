import React from 'react';
import { ServicesScreen } from '../../src/screens/ServicesScreen';
import { router } from 'expo-router';

export default function ServicesTab() {
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'ServiceDetail') router.push({ pathname: '/ServiceDetail', params });
    },
  };

  return <ServicesScreen navigation={navigation as any} />;
}
