export type ReplyClassification = 
  | 'Bounce'
  | 'OutOfOffice'
  | 'Unsubscribe'
  | 'Interested'
  | 'WantsDeck'
  | 'WantsMeeting'
  | 'Pass'
  | 'NotNow'
  | 'Forwarded'
  | 'Unknown';

const PATTERNS = {
  Bounce: /undeliverable|mailer-daemon|delivery failed|could not be delivered/i,
  OutOfOffice: /out of office|automatic reply|away from|vacation|ooo/i,
  Unsubscribe: /unsubscribe|remove me|stop emailing|opt out/i,
  Interested: /interested|love to learn more|tell me more|sounds interesting/i,
  WantsDeck: /send deck|pitch deck|send me more|materials|one-pager/i,
  WantsMeeting: /schedule|meet|calendar|catch up|let's chat|book a time/i,
  Pass: /pass|not investing|not a fit|not our focus|decline/i,
  NotNow: /not right now|circle back|next quarter|too early|come back/i,
  Forwarded: /forwarding|cc'ing|looping in|connecting you|introduced/i,
};

export async function classifyReply(
  replyText: string, 
  context?: { aiEnabled: boolean, llmApiKey?: string }
): Promise<{ classification: ReplyClassification, confidence: number, reasoning: string }> {
  
  if (context?.aiEnabled && context.llmApiKey) {
    // In a real implementation, we would call the LLM provider here.
    // For now, if AI is requested but not injected, fallback to rules.
    // E.g., const llmProvider = createOpenAIProvider(context.llmApiKey);
    // return await llmProvider.classifyReply(replyText);
  }

  return ruleBasedClassify(replyText);
}

export function ruleBasedClassify(text: string): { classification: ReplyClassification, confidence: number, reasoning: string } {
  for (const [classification, regex] of Object.entries(PATTERNS)) {
    if (regex.test(text)) {
      return {
        classification: classification as ReplyClassification,
        confidence: 0.8,
        reasoning: `Matched keyword pattern for ${classification}`,
      };
    }
  }

  return {
    classification: 'Unknown',
    confidence: 0.1,
    reasoning: 'No matching rule patterns found',
  };
}
