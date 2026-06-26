import React from 'react';
import { MarketplaceScreen } from '../../src/screens/MarketplaceScreen';
import { router } from 'expo-router';

export default function MarketplaceTab() {
  const navigation = {
    navigate: (route: string, params?: any) => {
      if (route === 'ProductDetail') router.push({ pathname: '/ProductDetail', params });
      else if (route === 'Storefront') router.push({ pathname: '/Storefront', params });
    },
  };

  return <MarketplaceScreen navigation={navigation as any} />;
}
