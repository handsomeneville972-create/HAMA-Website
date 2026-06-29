/**
 * Audit Logging Service
 *
 * Tracks security-sensitive events for compliance and fraud detection.
 * In production, logs are stored in the `audit_logs` Supabase table
 * with RLS restricting access to admin users only.
 *
 * Events tracked:
 * - Login attempts (success/failure)
 * - Password resets
 * - Account changes
 * - Property creation & edits
 * - Subscription purchases
 * - Account deletion
 * - Data export requests
 */

import { supabase } from './supabaseClient';

export type AuditEventType =
  | 'login.success'
  | 'login.failure'
  | 'logout'
  | 'signup'
  | 'password.reset_requested'
  | 'password.reset_completed'
  | 'password.changed'
  | 'email.verified'
  | 'phone.verified'
  | 'profile.updated'
  | 'account.deleted'
  | 'account.data_exported'
  | 'property.created'
  | 'property.updated'
  | 'subscription.purchased'
  | 'subscription.cancelled'
  | 'phone_login'
  | 'session.revoked_all'
  | 'suspicious_activity.detected';

interface AuditEntry {
  event_type: AuditEventType;
  user_id?: string;
  email?: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'critical';
}

/**
 * Log an audit event to Supabase.
 * Falls back to console in development if the table doesn't exist yet.
 */
export const logAuditEvent = async (entry: AuditEntry): Promise<void> => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      event_type: entry.event_type,
      user_id: entry.user_id ?? null,
      email: entry.email ?? null,
      ip_address: entry.ip_address ?? null,
      metadata: entry.metadata ?? null,
      severity: entry.severity ?? 'info',
      created_at: new Date().toISOString(),
    });

    if (error) {
      if (error.code === '42P01') {
        console.warn('[Audit] audit_logs table not found. Event not persisted:', entry.event_type);
      } else {
        console.error('[Audit] Failed to log event:', error.message);
      }
    }
  } catch {
    // Silent fail — audit should never block the main flow
  }
};

export const logLoginSuccess = (userId: string, email: string) =>
  logAuditEvent({ event_type: 'login.success', user_id: userId, email, severity: 'info' });

export const logLoginFailure = (email: string) =>
  logAuditEvent({ event_type: 'login.failure', email, severity: 'warning' });

export const logPasswordResetRequested = (email: string) =>
  logAuditEvent({ event_type: 'password.reset_requested', email, severity: 'info' });

export const logProfileUpdate = (userId: string) =>
  logAuditEvent({ event_type: 'profile.updated', user_id: userId, severity: 'info' });

export const logPropertyCreated = (userId: string, propertyId: string) =>
  logAuditEvent({
    event_type: 'property.created',
    user_id: userId,
    metadata: { property_id: propertyId },
    severity: 'info',
  });

export const logSubscriptionPurchased = (userId: string, planTier: string) =>
  logAuditEvent({
    event_type: 'subscription.purchased',
    user_id: userId,
    metadata: { tier: planTier },
    severity: 'info',
  });

export const logSuspiciousActivity = (userId: string, details: string) =>
  logAuditEvent({
    event_type: 'suspicious_activity.detected',
    user_id: userId,
    metadata: { details },
    severity: 'critical',
  });

export const logAccountDeleted = (userId: string) =>
  logAuditEvent({ event_type: 'account.deleted', user_id: userId, severity: 'critical' });
