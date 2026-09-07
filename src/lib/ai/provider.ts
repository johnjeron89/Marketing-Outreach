export interface EmailGenerationParams {
  companyProfile: { 
    companyName: string; 
    oneLinePitch?: string; 
    industry?: string; 
    stage?: string; 
    traction?: string; 
    founderBio?: string; 
  };
  fundraisingBrief?: { 
    problem?: string; 
    solution?: string; 
    market?: string; 
    traction?: string; 
    team?: string; 
    roundDetails?: string; 
    keyProofPoints?: any; 
  };
  investor: { 
    name: string; 
    firm: string; 
    sectorThesis?: string; 
    stagePreference?: string; 
    portfolioCompanies?: string; 
    notes?: string; 
    relationshipStatus?: string; 
  };
  templateType: string;
  existingThread?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  previewText: string;
  personalizationNotes: string; // what facts informed the content
  variablesUsed: Record<string, string>;
}

export interface LLMProvider {
  generateEmail(params: EmailGenerationParams): Promise<GeneratedEmail>;
  generateBrief(deckText: string, companyProfile: any): Promise<any>;
  classifyReply(replyText: string): Promise<{ classification: string; confidence: number; reasoning: string }>;
}
