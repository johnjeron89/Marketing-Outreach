export type MergeFieldMap = Record<string, string>;

export function renderTemplate(template: string, fields: MergeFieldMap): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return fields[key] !== undefined ? fields[key] : match;
  });
}

export function extractVariables(template: string): string[] {
  const matches = [...template.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)];
  return Array.from(new Set(matches.map(m => m[1])));
}

export function buildMergeFields(company: any, investor: any, brief?: any): MergeFieldMap {
  const fields: MergeFieldMap = {
    investor_name: investor?.name || '',
    firm_name: investor?.firm || '',
    company_name: company?.companyName || '',
    one_line_pitch: company?.oneLinePitch || '',
    founder_name: company?.founderBio || '', // Simple map for now
    industry: company?.industry || '',
    stage: company?.stage || '',
    amount_raising: brief?.roundDetails || '',
    traction: company?.traction || brief?.traction || '',
    calendar_link: company?.calendarLink || '', // Assumed field
    investor_thesis: investor?.sectorThesis || '',
    investor_stage_pref: investor?.stagePreference || '',
    investor_location: investor?.location || '',
    email_signature: company?.emailSignature || '', // Assumed field
  };
  return fields;
}
