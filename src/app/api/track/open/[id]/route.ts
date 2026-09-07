import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// 1x1 transparent GIF base64 encoded
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (id && id.length > 5) {
      // Find the email message
      const message = await db.emailMessage.findUnique({
        where: { id },
        include: { campaignInvestor: { include: { campaign: true } } }
      });

      if (message) {
        // Update message open count and openedAt
        await db.emailMessage.update({
          where: { id },
          data: {
            openCount: { increment: 1 },
            openedAt: message.openedAt || new Date(),
          }
        });

        // Update campaign open count if part of a campaign
        if (message.campaignInvestor?.campaign) {
          await db.campaign.update({
            where: { id: message.campaignInvestor.campaign.id },
            data: {
              openCount: { increment: 1 }
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Fail silently to not break the image load for the user
  }

  // Always return the 1x1 transparent GIF
  return new Response(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
