export function validateEmail(email: string): { valid: boolean; reason?: string } {
  const rfcRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!email || !rfcRegex.test(email)) {
    return { valid: false, reason: 'Invalid format' };
  }
  return { valid: true };
}

export function isSuspiciousEmail(email: string): { suspicious: boolean; reason?: string } {
  const normalized = normalizeEmail(email);
  const suspiciousPrefixes = ['noreply@', 'no-reply@', 'info@', 'support@', 'admin@', 'sales@'];
  
  for (const prefix of suspiciousPrefixes) {
    if (normalized.startsWith(prefix)) {
      return { suspicious: true, reason: `Matches suspicious prefix: ${prefix}` };
    }
  }

  // Catch-all or common generic domains check could be added here
  
  return { suspicious: false };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
