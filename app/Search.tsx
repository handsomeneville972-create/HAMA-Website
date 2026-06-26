import React from 'react';
import { router } from 'expo-router';
import { SearchScreen } from '../src/screens/SearchScreen';

export default function SearchPage() {
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string, params?: any) => {
      if (route === 'PropertyDetail') router.push({ pathname: '/PropertyDetail', params });
      else if (route === 'ProductDetail') router.push({ pathname: '/ProductDetail', params });
      else if (route === 'ServiceDetail') router.push({ pathname: '/ServiceDetail', params });
    },
  };

  return <SearchScreen navigation={navigation} />;
}
