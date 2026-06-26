/**
 * HAMA Conversation & Message Service
 *
 * Queries conversations, participants, and messages from Supabase.
 * Falls back to mock data when the DB tables haven't been created yet.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery } from './supabaseService';
import { MOCK_CONVERSATIONS } from '../constants/data';
import type { Conversation, Message } from '../constants/types';

export async function getUserConversations(
  userId: string,
): Promise<{ data: Conversation[] | null; error: string | null }> {
  return executeQuery<Conversation[]>(
    async () => {
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      const conversationIds = participantData?.map(d => d.conversation_id) ?? [];

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user:user_id(*)),
          messages:messages(*)
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      return { data: data as unknown as Conversation[] | null, error };
    },
    MOCK_CONVERSATIONS.filter(c => c.participants.some(p => p.id === userId)),
  );
}

export async function getConversationById(
  conversationId: string,
): Promise<{ data: Conversation | null; error: string | null }> {
  return executeQuery<Conversation>(
    async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(user:user_id(*)),
          messages:messages(*)
        `)
        .eq('id', conversationId)
        .single();
      return { data: data as unknown as Conversation | null, error };
    },
    MOCK_CONVERSATIONS.find(c => c.id === conversationId) ?? MOCK_CONVERSATIONS[0],
  );
}

export async function getMessages(
  conversationId: string,
): Promise<{ data: Message[] | null; error: string | null }> {
  return executeQuery<Message[]>(
    async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      return { data: data as Message[] | null, error };
    },
    MOCK_CONVERSATIONS.find(c => c.id === conversationId)?.messages ?? [],
  );
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  text: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          sender_id: params.senderId,
          text: params.text,
        })
        .select()
        .single();

      if (!error) {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', params.conversationId);
      }

      return { data, error };
    },
    null,
  );
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);
      return { data: null, error };
    },
    null,
  );
}

export async function createConversation(params: {
  participantIds: string[];
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) return { data: null, error: convError };

      const participants = params.participantIds.map(userId => ({
        conversation_id: conv.id,
        user_id: userId,
      }));

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      return { data: conv, error: partError };
    },
    null,
  );
}
