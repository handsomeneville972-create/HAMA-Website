import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ProductDetailScreen } from '../src/screens/ProductDetailScreen';

export default function ProductDetail() {
  const { productId } = useLocalSearchParams();
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string) => { if (route === 'Inbox') router.push('/Inbox'); },
  };

  return (
    <ProductDetailScreen
      route={{ params: { productId: productId as string } }}
      navigation={navigation}
    />
  );
}
