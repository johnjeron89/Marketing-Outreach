import { normalizeEmail } from '../utils/email-validation';

export interface ImportedInvestor {
  name: string;
  firm: string;
  email: string;
  [key: string]: any;
}

export function deduplicateByEmail(
  investors: ImportedInvestor[], 
  existingEmails: string[]
): { unique: ImportedInvestor[]; duplicates: { investor: ImportedInvestor; reason: string }[] } {
  
  const unique: ImportedInvestor[] = [];
  const duplicates: { investor: ImportedInvestor; reason: string }[] = [];
  const seenEmails = new Set<string>();

  const normalizedExistingEmails = new Set(existingEmails.map(normalizeEmail));

  for (const investor of investors) {
    if (!investor.email) {
      unique.push(investor); // Depending on policy, might reject or accept without email
      continue;
    }

    const email = normalizeEmail(investor.email);

    if (normalizedExistingEmails.has(email)) {
      duplicates.push({ investor, reason: 'Email already exists in database' });
    } else if (seenEmails.has(email)) {
      duplicates.push({ investor, reason: 'Duplicate email in import file' });
    } else {
      seenEmails.add(email);
      unique.push(investor);
    }
  }

  return { unique, duplicates };
}
