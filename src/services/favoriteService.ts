/**
 * HAMA Favorite Service
 *
 * Manages user favorites (saved properties, products, and community posts)
 * using Supabase. Falls back to mock data.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery } from './supabaseService';
import { MOCK_SAVED_ITEMS } from '../constants/data';
import type { Property, Product, CommunityPost } from '../constants/types';

type FavoriteType = 'property' | 'product' | 'post';

export async function getUserFavorites(
  userId: string,
): Promise<{ data: { propertyIds: string[]; productIds: string[]; postIds: string[] } | null; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('item_type, item_id')
        .eq('user_id', userId);

      if (error) return { data: null, error };

      const result = { propertyIds: [] as string[], productIds: [] as string[], postIds: [] as string[] };
      data?.forEach(fav => {
        if (fav.item_type === 'property') result.propertyIds.push(fav.item_id);
        else if (fav.item_type === 'product') result.productIds.push(fav.item_id);
        else if (fav.item_type === 'post') result.postIds.push(fav.item_id);
      });

      return { data: result, error: null };
    },
    MOCK_SAVED_ITEMS[userId] ?? MOCK_SAVED_ITEMS['default'],
  );
}

export async function addFavorite(
  userId: string,
  itemType: FavoriteType,
  itemId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, item_type: itemType, item_id: itemId });
      return { data: null, error };
    },
    null,
  );
}

export async function removeFavorite(
  userId: string,
  itemType: FavoriteType,
  itemId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId);
      return { data: null, error };
    },
    null,
  );
}

export async function isFavorited(
  userId: string,
  itemType: FavoriteType,
  itemId: string,
): Promise<boolean> {
  const result = await executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .maybeSingle();
      return { data: !!data, error };
    },
    false,
  );
  return !!result.data;
}
