import React from 'react';
import { router } from 'expo-router';
import { AnnouncementCenterScreen } from '../src/screens/AnnouncementCenterScreen';

export default function Announcements() {
  const navigation = { goBack: () => router.back() };
  return <AnnouncementCenterScreen navigation={navigation} />;
}
