import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export const REQUIRED_FIELDS = ['name', 'firm', 'email'];
export const OPTIONAL_FIELDS = [
  'partnerTitle', 'website', 'linkedinUrl', 'location', 
  'sectorThesis', 'stagePreference', 'typicalCheckSize', 
  'portfolioCompanies', 'relationshipStatus', 'warmIntroSource', 'notes',
  'recentMilestone', 'personalConnection', 'customIcebreaker'
];

export async function parseCSV(fileContent: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => resolve(results.data as Record<string, string>[]),
      error: (error: any) => reject(error),
    });
  });
}

export async function parseXLSX(buffer: Buffer): Promise<Record<string, string>[]> {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json<Record<string, string>>(sheet);
}

export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  const rules: Record<string, string[]> = {
    'name': ['investor name', 'name', 'full name', 'first name'],
    'firm': ['firm', 'fund', 'fund name', 'company'],
    'email': ['email', 'email address'],
    'partnerTitle': ['title', 'role', 'position'],
    'website': ['website', 'url'],
    'linkedinUrl': ['linkedin', 'linkedin url', 'li'],
    'location': ['location', 'city'],
    'recentMilestone': ['milestone', 'recent event', 'highlight', 'news', 'recent milestone'],
    'personalConnection': ['connection', 'mutual', 'how we met', 'personal connection'],
    'customIcebreaker': ['icebreaker', 'custom hook', 'first sentence', 'manual hook', 'custom icebreaker'],
  };

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(rules)) {
      if (aliases.includes(normalizedHeader) && !mapping[header]) {
        mapping[header] = field;
        break;
      }
    }
  }

  return mapping;
}
