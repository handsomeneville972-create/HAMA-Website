import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ChatScreen } from '../src/screens/ChatScreen';

export default function ChatPage() {
  const { conversationId } = useLocalSearchParams();

  return (
    <ChatScreen
      route={{ params: { conversationId: conversationId as string } }}
      navigation={{ goBack: () => router.back() }}
    />
  );
}
