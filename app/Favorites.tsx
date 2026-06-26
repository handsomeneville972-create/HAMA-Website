import React from 'react';
import { router } from 'expo-router';
import { FavoritesScreen } from '../src/screens/FavoritesScreen';

export default function FavoritesPage() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (route === 'PropertyDetail') router.push({ pathname: '/PropertyDetail', params });
      else if (route === 'ProductDetail') router.push({ pathname: '/ProductDetail', params });
      else if (route === 'PostDetail') router.push({ pathname: '/PostDetail', params });
    },
  };

  return <FavoritesScreen navigation={navigation} />;
}
