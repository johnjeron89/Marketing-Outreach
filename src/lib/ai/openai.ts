import { LLMProvider, EmailGenerationParams, GeneratedEmail } from './provider';

// Note: Requires openai package to be installed (`npm install openai`)
import OpenAI from 'openai';

export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateEmail(params: EmailGenerationParams): Promise<GeneratedEmail> {
    const prompt = `
      You are an expert founder writing an outreach email to an investor.
      Never fabricate connections, metrics, or prior conversations.
      Use only facts from the provided context. Personalization should be specific but restrained.
      
      Company Context:
      ${JSON.stringify(params.companyProfile, null, 2)}
      
      Fundraising Brief:
      ${JSON.stringify(params.fundraisingBrief, null, 2)}
      
      Investor Context:
      ${JSON.stringify(params.investor, null, 2)}
      
      Template Type: ${params.templateType}
      
      Output JSON format:
      {
        "subject": "Email subject",
        "body": "Email body (HTML format)",
        "previewText": "Preview text",
        "personalizationNotes": "Why did you choose this angle?",
        "variablesUsed": {"key": "value"}
      }
    `;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content returned from OpenAI');

    return JSON.parse(content) as GeneratedEmail;
  }

  async generateBrief(deckText: string, companyProfile: any): Promise<any> {
    const prompt = `
      Extract the following information from the pitch deck text:
      - problem
      - solution
      - market
      - traction
      - team
      - roundDetails
      
      If a piece of information is missing, mark it as 'needs confirmation'. Never invent metrics.
      
      Deck text:
      ${deckText}
    `;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content returned from OpenAI');

    return JSON.parse(content);
  }

  async classifyReply(replyText: string): Promise<{ classification: string; confidence: number; reasoning: string }> {
    const prompt = `
      Classify the investor's reply into one of the following categories:
      Bounce, OutOfOffice, Unsubscribe, Interested, WantsDeck, WantsMeeting, Pass, NotNow, Forwarded, Unknown.
      
      Reply:
      "${replyText}"
      
      Output JSON format:
      {
        "classification": "Category",
        "confidence": 0.95,
        "reasoning": "Explanation"
      }
    `;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content returned from OpenAI');

    return JSON.parse(content);
  }
}

export function createOpenAIProvider(apiKey: string, model?: string): LLMProvider {
  return new OpenAIProvider(apiKey, model);
}
