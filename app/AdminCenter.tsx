import React from 'react';
import { SuperAdminScreen } from '../src/screens/SuperAdminScreen';
import { useNavigation } from 'expo-router';

export default function AdminCenter() {
  const navigation = useNavigation();
  return <SuperAdminScreen navigation={navigation} />;
}
