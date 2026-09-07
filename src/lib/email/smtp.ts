import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { marked } from 'marked';
import { v4 as uuidv4 } from 'uuid';
import { EmailProvider, OAuthTokens, SendEmailParams, SendEmailResult, InboundEmail, ConnectionStatus, ConnectionCredentials } from './provider';

export class SmtpProvider implements EmailProvider {
  readonly providerName = 'smtp';

  getAuthUrl(redirectUri: string, state: string): string {
    throw new Error('SMTP does not support OAuth URLs');
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    throw new Error('SMTP does not support OAuth exchange');
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    throw new Error('SMTP does not support OAuth refresh');
  }

  async revokeAccess(accessToken: string): Promise<void> {
    // No-op for SMTP
  }

  private createTransporter(credentials: ConnectionCredentials) {
    if (!credentials.smtpHost || !credentials.smtpUsername || !credentials.smtpPassword) {
      throw new Error("Missing SMTP credentials");
    }
    return nodemailer.createTransport({
      host: credentials.smtpHost,
      port: credentials.smtpPort || 465,
      secure: (credentials.smtpPort === 465), 
      auth: {
        user: credentials.smtpUsername,
        pass: credentials.smtpPassword,
      },
    });
  }

  async sendEmail(credentials: ConnectionCredentials, params: SendEmailParams): Promise<SendEmailResult> {
    const transporter = this.createTransporter(credentials);
    
    // Parse markdown to HTML
    const parsedHtml = await marked.parse(params.body, { breaks: true });
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; max-width: 600px;">
        ${parsedHtml}
      </div>
    `;

    const messageId = `<${uuidv4()}@${credentials.smtpHost}>`;
    
    const mailOptions: any = {
      from: credentials.smtpUsername,
      to: params.to,
      subject: params.subject,
      html: htmlBody,
      text: params.body,
      messageId: messageId,
    };

    if (params.inReplyTo) {
      mailOptions.inReplyTo = params.inReplyTo;
    }
    if (params.references) {
      mailOptions.references = params.references;
    }

    const info = await transporter.sendMail(mailOptions);
    
    return {
      messageId: info.messageId, // Standard RFC message ID returned by nodemailer
      threadId: info.messageId, // Basic fallback since SMTP doesn't have inherent threads like Gmail
      messageIdHeader: info.messageId
    };
  }

  async getNewMessages(credentials: ConnectionCredentials, historyId: string): Promise<{ messages: InboundEmail[]; newHistoryId: string }> {
    if (!credentials.imapHost || !credentials.imapUsername || !credentials.imapPassword) {
      throw new Error("Missing IMAP credentials");
    }

    const client = new ImapFlow({
      host: credentials.imapHost,
      port: credentials.imapPort || 993,
      secure: true,
      auth: {
        user: credentials.imapUsername,
        pass: credentials.imapPassword
      },
      logger: false
    });

    await client.connect();
    const messages: InboundEmail[] = [];
    
    // We will use the date from historyId if it's parseable, or just fallback to last 3 days
    let since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (historyId) {
      const parsed = parseInt(historyId, 10);
      if (!isNaN(parsed) && parsed > 0) {
        since = new Date(parsed);
      }
    }

    try {
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Find messages since our last sync date
        const searchResult = await client.search({ since });
        
        if (searchResult && Array.isArray(searchResult) && searchResult.length > 0) {
          // Fetch raw emails
          for await (let msg of client.fetch(searchResult, { source: true, envelope: true })) {
            if (msg.source) {
              const parsed = await simpleParser(msg.source);
              
              const messageIdHeader = parsed.messageId || '';
              const inReplyTo = parsed.inReplyTo || undefined;
              
              // Basic header dict
              const headers: Record<string, string> = {};
              parsed.headers.forEach((value, key) => {
                headers[key] = String(value);
              });
              
              messages.push({
                messageId: msg.uid.toString(),
                threadId: parsed.messageId || msg.uid.toString(), // Basic fallback
                from: parsed.from?.value[0]?.address || '',
                to: parsed.to ? (Array.isArray(parsed.to) ? (parsed.to[0].value[0].address || '') : (parsed.to.value[0].address || '')) : '',
                subject: parsed.subject || '',
                body: parsed.text || '',
                bodyHtml: parsed.html || undefined,
                date: parsed.date || new Date(),
                messageIdHeader,
                inReplyTo,
                headers
              });
            }
          }
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }

    // Return the current timestamp as the new historyId
    return { messages, newHistoryId: Date.now().toString() };
  }

  async getMessage(credentials: ConnectionCredentials, messageId: string): Promise<InboundEmail> {
    throw new Error("IMAP sync not implemented yet");
  }

  async validateConnection(credentials: ConnectionCredentials): Promise<ConnectionStatus> {
    try {
      const transporter = this.createTransporter(credentials);
      await transporter.verify();
      return { isValid: true, email: credentials.smtpUsername || '' };
    } catch (err: any) {
      return { isValid: false, email: credentials.smtpUsername || '', error: err.message };
    }
  }
}

export const smtpProvider = new SmtpProvider();
