import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { marked } from 'marked';
import MailComposer from 'nodemailer/lib/mail-composer';
import { EmailProvider, OAuthTokens, SendEmailParams, SendEmailResult, InboundEmail, ConnectionStatus, ConnectionCredentials } from './provider';

export class GmailProvider implements EmailProvider {
  readonly providerName = 'gmail';
  private clientId: string;
  private clientSecret: string;
  
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || '';
  }

  private createOAuthClient(redirectUri: string = ''): OAuth2Client {
    return new google.auth.OAuth2(this.clientId, this.clientSecret, redirectUri);
  }

  getAuthUrl(redirectUri: string, state: string): string {
    const oauth2Client = this.createOAuthClient(redirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      state,
      scope: [
        'https://www.googleapis.com/auth/gmail.send', 
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
    });
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const oauth2Client = this.createOAuthClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing tokens from Google OAuth');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      email: userInfo.data.email || '',
      displayName: userInfo.data.name || '',
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
      email: '', // Not strictly needed here, typically saved in DB
    };
  }

  async revokeAccess(accessToken: string): Promise<void> {
    const oauth2Client = this.createOAuthClient();
    await oauth2Client.revokeToken(accessToken);
  }

  async sendEmail(credentials: ConnectionCredentials, params: SendEmailParams): Promise<SendEmailResult> {
    if (!credentials.accessToken) throw new Error("No access token provided");
    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({ 
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken 
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const parsedHtml = await marked.parse(params.body, { breaks: true });
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; max-width: 600px;">
        ${parsedHtml}
        ${params.trackingId ? `<img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/track/open/${params.trackingId}" width="1" height="1" alt="" />` : ''}
      </div>
    `;

    const mailOptions: any = {
      to: params.to,
      subject: params.subject,
      html: htmlBody,
      textEncoding: 'base64',
    };

    if (params.inReplyTo) mailOptions.inReplyTo = params.inReplyTo;
    if (params.references) mailOptions.references = params.references;

    if (params.attachments && params.attachments.length > 0) {
      mailOptions.attachments = [];
      for (const url of params.attachments) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.error(`Failed to fetch attachment from ${url}: ${response.statusText}`);
            continue;
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          let fileName = url.split('/').pop() || 'attachment';
          
          // Remove query params from filename if any
          fileName = fileName.split('?')[0];
          // Remove timestamp prefix added during upload
          fileName = fileName.replace(/^\d+-/, '');

          mailOptions.attachments.push({
            filename: fileName,
            content: buffer
          });
        } catch (err) {
          console.error("Error processing attachment:", err);
        }
      }
    }

    const mail = new MailComposer(mailOptions);
    const messageBuffer = await mail.compile().build();
    const encodedMessage = messageBuffer.toString('base64url');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: params.threadId,
      },
    });

    const sentMessage = await gmail.users.messages.get({
      userId: 'me',
      id: res.data.id!,
      format: 'metadata',
      metadataHeaders: ['Message-ID'],
    });

    const messageIdHeader = sentMessage.data.payload?.headers?.find(h => h.name === 'Message-ID')?.value || '';

    return {
      messageId: res.data.id!,
      threadId: res.data.threadId!,
      messageIdHeader,
    };
  }

  async getNewMessages(credentials: ConnectionCredentials, historyId: string): Promise<{ messages: InboundEmail[]; newHistoryId: string }> {
    if (!credentials.accessToken) throw new Error("No access token");
    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({ 
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const messages: InboundEmail[] = [];
    let newHistoryId = historyId;

    try {
      if (!historyId) throw new Error("No historyId provided");
      
      const res = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded'],
      });

      newHistoryId = res.data.historyId || historyId;

      if (res.data.history) {
        for (const historyItem of res.data.history) {
          if (historyItem.messagesAdded) {
            for (const added of historyItem.messagesAdded) {
              if (added.message && added.message.id) {
                const msg = await this.getMessage(credentials, added.message.id);
                messages.push(msg);
              }
            }
          }
        }
      }
    } catch (err: any) {
      // If historyId is missing or expired (400), fallback to fetching recent messages
      console.log(`[Gmail] History sync failed or missing historyId (${err.message}). Falling back to recent messages.`);
      
      // Get current history ID from profile
      const profile = await gmail.users.getProfile({ userId: 'me' });
      newHistoryId = profile.data.historyId || historyId;

      // Fetch last 10 received messages to catch any replies
      const recentRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'in:inbox' // only look at inbox for replies
      });

      if (recentRes.data.messages) {
        for (const m of recentRes.data.messages) {
          if (m.id) {
            const msg = await this.getMessage(credentials, m.id);
            messages.push(msg);
          }
        }
      }
    }

    return { messages, newHistoryId };
  }

  async getMessage(credentials: ConnectionCredentials, messageId: string): Promise<InboundEmail> {
    if (!credentials.accessToken) throw new Error("No access token");
    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({ 
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = res.data.payload;
    const headers = payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('subject');
    const from = getHeader('from');
    const to = getHeader('to');
    const dateStr = getHeader('date');
    const msgIdHeader = getHeader('message-id');
    const inReplyTo = getHeader('in-reply-to');

    // Simple body extraction (real implementation needs full MIME tree traversal)
    let bodyText = '';
    if (payload?.parts) {
      const part = payload.parts.find(p => p.mimeType === 'text/plain');
      if (part?.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64url').toString('utf8');
      }
    } else if (payload?.body?.data) {
      bodyText = Buffer.from(payload.body.data, 'base64url').toString('utf8');
    }

    // Strip trailing quoted replies
    const stripEmailReply = (body: string): string => {
      const lines = body.split('\n');
      const result: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Match "On [Date], [Name] wrote:"
        if (/^On\s.+?wrote:\s*$/i.test(trimmed)) {
          break;
        }
        
        // Match multi-line "On [Date],\n[Name] wrote:"
        if (/^On\s.+?,?$/i.test(trimmed) && i + 1 < lines.length && /.*wrote:\s*$/i.test(lines[i+1].trim())) {
          break;
        }
        
        // Match standard divider lines
        if (/^-{3,}\s*Original Message\s*-{3,}/i.test(trimmed) || /^-{3,}\s*Forwarded message\s*-{3,}/i.test(trimmed)) {
          break;
        }

        // Match "From: " header block which often precedes replies
        if (/^From:\s.+@.+/i.test(trimmed) && i + 1 < lines.length && /^Date:\s/i.test(lines[i+1].trim())) {
          break;
        }

        result.push(line);
      }

      // Remove trailing empty lines and quoted lines starting with '>'
      while (result.length > 0) {
        const lastLine = result[result.length - 1].trim();
        if (lastLine.startsWith('>') || lastLine === '') {
          result.pop();
        } else {
          break;
        }
      }

      return result.join('\n').trim();
    };

    bodyText = stripEmailReply(bodyText);

    const headersRecord: Record<string, string> = {};
    headers.forEach(h => {
      if (h.name && h.value) headersRecord[h.name.toLowerCase()] = h.value;
    });

    return {
      messageId: res.data.id!,
      threadId: res.data.threadId!,
      from,
      to,
      subject,
      body: bodyText,
      date: new Date(dateStr || Date.now()),
      messageIdHeader: msgIdHeader,
      inReplyTo,
      headers: headersRecord,
    };
  }

  async validateConnection(credentials: ConnectionCredentials): Promise<ConnectionStatus> {
    if (!credentials.accessToken) return { isValid: false, email: "", error: "No token" };
    try {
      const oauth2Client = this.createOAuthClient();
      oauth2Client.setCredentials({ 
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken
      });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      return { isValid: true, email: profile.data.emailAddress || '' };
    } catch (error: any) {
      return { isValid: false, email: '', error: error.message };
    }
  }
}

export const gmailProvider = new GmailProvider();
