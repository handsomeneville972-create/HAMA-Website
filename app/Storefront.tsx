import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { StorefrontScreen } from '../src/screens/StorefrontScreen';

export default function Storefront() {
  const { sellerId } = useLocalSearchParams();
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (route === 'ProductDetail') router.push({ pathname: '/ProductDetail', params });
    },
  };

  return (
    <StorefrontScreen
      route={{ params: { sellerId: sellerId as string } }}
      navigation={navigation}
    />
  );
}
