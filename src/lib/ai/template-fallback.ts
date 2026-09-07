import { LLMProvider, EmailGenerationParams, GeneratedEmail } from './provider';
import { ruleBasedClassify } from '../email/reply-classifier';
import { renderTemplate, buildMergeFields } from '../utils/merge-fields';

export class TemplateFallback implements LLMProvider {
  async generateEmail(params: EmailGenerationParams): Promise<GeneratedEmail> {
    // In a real implementation, you'd fetch a template string based on params.templateType
    const templateSubject = 'Intro: {{company_name}}';
    const templateBody = 'Hi {{investor_name}},\n\nI am the founder of {{company_name}}...';
    
    const fields = buildMergeFields(params.companyProfile, params.investor, params.fundraisingBrief);
    
    return {
      subject: renderTemplate(templateSubject, fields),
      body: renderTemplate(templateBody, fields),
      previewText: 'Fallback template preview',
      personalizationNotes: 'Generated using deterministic template engine',
      variablesUsed: fields,
    };
  }

  async generateBrief(deckText: string, companyProfile: any): Promise<any> {
    return {
      problem: null,
      solution: null,
      market: null,
      traction: null,
      team: null,
      roundDetails: null,
      missingInfo: ['problem', 'solution', 'market', 'traction', 'team', 'roundDetails']
    };
  }

  async classifyReply(replyText: string): Promise<{ classification: string; confidence: number; reasoning: string }> {
    return ruleBasedClassify(replyText);
  }
}
