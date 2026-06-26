import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ServiceDetailScreen } from '../src/screens/ServiceDetailScreen';

export default function ServiceDetail() {
  const { providerId } = useLocalSearchParams();
  const navigation = {
    goBack: () => router.back(),
  };

  return (
    <ServiceDetailScreen
      route={{ params: { providerId: providerId as string } }}
      navigation={navigation}
    />
  );
}
