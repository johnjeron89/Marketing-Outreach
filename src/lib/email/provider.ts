export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
  displayName?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string; // HTML
  threadId?: string; // for replies
  inReplyTo?: string; // Message-ID header
  references?: string;
  trackingId?: string; // Database ID for open tracking
  attachments?: string[]; // Array of URLs to file attachments
}

export interface SendEmailResult {
  messageId: string; // provider message ID
  threadId: string;
  messageIdHeader: string; // RFC Message-ID
}

export interface EmailThread {
  threadId: string;
  messages: InboundEmail[];
}

export interface InboundEmail {
  messageId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  messageIdHeader: string;
  inReplyTo?: string;
  headers: Record<string, string>;
}

export interface HistoryChange {
  type: 'messageAdded' | 'messageDeleted' | 'labelAdded' | 'labelRemoved';
  messageId: string;
  threadId?: string;
  labelIds?: string[];
}

export interface ConnectionStatus {
  isValid: boolean;
  email: string;
  error?: string;
}

export interface ConnectionCredentials {
  accessToken?: string;
  refreshToken?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;
}

export interface EmailProvider {
  readonly providerName: string;
  getAuthUrl(redirectUri: string, state: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  revokeAccess(accessToken: string): Promise<void>;
  sendEmail(credentials: ConnectionCredentials, params: SendEmailParams): Promise<SendEmailResult>;
  getNewMessages(credentials: ConnectionCredentials, historyId: string): Promise<{ messages: InboundEmail[]; newHistoryId: string }>;
  getMessage(credentials: ConnectionCredentials, messageId: string): Promise<InboundEmail>;
  validateConnection(credentials: ConnectionCredentials): Promise<ConnectionStatus>;
}
