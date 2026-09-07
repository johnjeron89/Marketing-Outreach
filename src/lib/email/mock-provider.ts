import { EmailProvider, OAuthTokens, SendEmailParams, SendEmailResult, InboundEmail, ConnectionStatus, ConnectionCredentials } from './provider';

export class MockProvider implements EmailProvider {
  readonly providerName = 'mock';
  private sentEmails: SendEmailParams[] = [];

  getAuthUrl(redirectUri: string, state: string): string {
    return `/api/auth/callback/google?code=mock_code&state=${encodeURIComponent(state)}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    return {
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: new Date(Date.now() + 3600 * 1000),
      email: 'mock@example.com',
      displayName: 'Mock User',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    return {
      accessToken: 'new_mock_access_token',
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      email: 'mock@example.com',
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    console.log('Mock: Revoked access for token', accessToken);
  }

  async sendEmail(credentials: ConnectionCredentials, params: SendEmailParams): Promise<SendEmailResult> {
    console.log(`[MockProvider] Sending email to ${params.to}`);
    this.sentEmails.push(params);
    const mockId = `mock_id_${Math.random().toString(36).substring(7)}`;
    return {
      messageId: mockId,
      threadId: params.threadId || `thread_${mockId}`,
      messageIdHeader: `<${mockId}@mock.mail>`,
    };
  }

  async getNewMessages(credentials: ConnectionCredentials, historyId: string): Promise<{ messages: InboundEmail[]; newHistoryId: string }> {
    console.log(`[MockProvider] Checking for new messages since ${historyId}`);
    return { messages: [], newHistoryId: 'mock_history_id_2' };
  }

  async getMessage(credentials: ConnectionCredentials, messageId: string): Promise<InboundEmail> {
    console.log(`[MockProvider] Fetching message ${messageId}`);
    return {
      messageId,
      threadId: `thread_${messageId}`,
      from: 'investor@example.com',
      to: 'mock@example.com',
      subject: 'Re: Pitch',
      body: 'Mock body text',
      date: new Date(),
      messageIdHeader: `<${messageId}@example.com>`,
      headers: {},
    };
  }

  async validateConnection(credentials: ConnectionCredentials): Promise<ConnectionStatus> {
    console.log(`[MockProvider] Validating connection`);
    return { isValid: true, email: 'mock@example.com' };
  }

  // Helper for tests
  getSentEmails() {
    return this.sentEmails;
  }
}

export const mockProvider = new MockProvider();
