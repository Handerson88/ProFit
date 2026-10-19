export type UserPlanStatusKey = 'pro_active' | 'pro_expired' | 'trial' | 'none';

export interface UserPlanStatus {
  key: UserPlanStatusKey;
  label: string;
}

/**
 * Backend marks subscription_status/plano_status as "ativo" for trial users too,
 * so `has_paid` is the only reliable signal of a real paid subscription.
 */
export const getUserPlanStatus = (user: any): UserPlanStatus => {
  const now = new Date();
  const hasPaid = !!user?.has_paid;
  const expirationValue = user?.data_expiracao || user?.end_date;
  const isExpired = expirationValue ? new Date(expirationValue) < now : true;

  const createdAt = user?.created_at ? new Date(user.created_at) : null;
  const trialEndsAt = user?.trial_ends_at
    ? new Date(user.trial_ends_at)
    : (createdAt ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : null);
  const isOnTrial = !hasPaid && !!trialEndsAt && trialEndsAt > now;

  if (hasPaid && !isExpired) return { key: 'pro_active', label: 'PRO Ativo' };
  if (hasPaid && isExpired) return { key: 'pro_expired', label: 'PRO Expirado' };
  if (isOnTrial) return { key: 'trial', label: 'Em Trial' };
  return { key: 'none', label: 'Sem Plano' };
};

const CALLING_CODES: Record<string, string> = { MZ: '258', ZA: '27', AO: '244' };

/** ProFit is Mozambique-focused, so phone numbers are usually stored without the international prefix. */
export const getWhatsAppLink = (phone?: string | null, countryCode?: string | null): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  const callingCode = CALLING_CODES[countryCode || ''] || '258';
  if (digits.startsWith(callingCode)) return `https://wa.me/${digits}`;

  const localDigits = digits.replace(/^0+/, '');
  return `https://wa.me/${callingCode}${localDigits}`;
};
