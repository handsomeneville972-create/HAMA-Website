/**
 * HAMA Subscription Service
 *
 * Queries subscription plans and user subscriptions from Supabase.
 * Falls back to mock data when the DB tables haven't been created yet.
 */

import { supabase } from '../utils/supabaseClient';
import { executeQuery } from './supabaseService';
import { MOCK_SUBSCRIPTION_PLANS } from '../constants/data';
import type { SubscriptionPlan, UserType } from '../constants/types';

export async function getSubscriptionPlans(
  userType?: UserType,
): Promise<{ data: SubscriptionPlan[] | null; error: string | null }> {
  return executeQuery<SubscriptionPlan[]>(
    async () => {
      let query = supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (userType) {
        query = query.eq('user_type', userType);
      }

      const { data, error } = await query;
      return { data: data as SubscriptionPlan[] | null, error };
    },
    userType
      ? MOCK_SUBSCRIPTION_PLANS.filter(p => p.userType === userType)
      : MOCK_SUBSCRIPTION_PLANS,
  );
}

export async function getUserSubscription(
  userId: string,
): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:plan_id(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      return { data, error };
    },
    null,
  );
}

export async function purchaseSubscription(params: {
  userId: string;
  planId: string;
}): Promise<{ data: any; error: string | null }> {
  return executeQuery(
    async () => {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', params.planId)
        .single();

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: params.userId,
          plan_id: params.planId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: plan
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
        })
        .select()
        .single();
      return { data, error };
    },
    null,
  );
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<{ error: string | null }> {
  return executeQuery(
    async () => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', subscriptionId);
      return { data: null, error };
    },
    null,
  );
}
