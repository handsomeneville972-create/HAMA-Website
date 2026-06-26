/**
 * StripeWrapper — Web Stub
 *
 * Stripe Provider is a native-only component (iOS/Android).
 * On web, this wrapper simply renders its children without
 * any Stripe setup. Payments default to M-Pesa / Paystack.
 */

import React from 'react';

interface StripeWrapperProps {
  children: React.ReactNode;
}

export const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  return <>{children}</>;
};
