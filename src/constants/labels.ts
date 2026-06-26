import { UserRole } from './types';

/** Maps each UserRole to its human-readable display label. */
export const ROLE_LABELS: Record<UserRole, string> = {
  seeker: 'House Seeker',
  landlord: 'Landlord',
  seller: 'Seller',
  service_provider: 'Service Provider',
  hamisha_squad: 'Hamisha Squad',
  admin: 'Admin',
};

/** Maps verification levels to display labels */
export const VERIFICATION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  unverified: { label: 'Unverified', icon: 'close-circle-outline', color: '#FF4D6A' },
  email: { label: 'Email Verified', icon: 'mail-outline', color: '#00D4AA' },
  phone: { label: 'Phone Verified', icon: 'call-outline', color: '#4DB8FF' },
  id: { label: 'ID Verified', icon: 'id-card-outline', color: '#FFB84D' },
  business: { label: 'Business Verified', icon: 'business-outline', color: '#6C63FF' },
  full: { label: 'Fully Verified', icon: 'shield-checkmark-outline', color: '#00D4AA' },
};
