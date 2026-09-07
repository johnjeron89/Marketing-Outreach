import { db } from '../db';
// Assuming PipelineStatus and ReplyClassification exist
// import { PipelineStatus, ReplyClassification } from './pipeline';

import { PipelineStatus } from '@prisma/client';

export type PipelineTransition = {
  from: PipelineStatus;
  to: PipelineStatus;
  trigger: string;
};

export const VALID_TRANSITIONS: PipelineTransition[] = [
  { from: 'DRAFT', to: 'READY_TO_SEND', trigger: 'ManualUpdate' },
  { from: 'READY_TO_SEND', to: 'SENT', trigger: 'EmailSent' },
  { from: 'SENT', to: 'REPLIED', trigger: 'EmailReceived' },
  { from: 'REPLIED', to: 'MEETING_BOOKED', trigger: 'ManualUpdate' },
];

export function isValidTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}

export async function transitionPipeline(investorId: string, newStatus: PipelineStatus, trigger: string, performedBy: string): Promise<void> {
  const investor = await db.investor.findUnique({ where: { id: investorId } });
  if (!investor) throw new Error('Investor not found');

  const currentStatus = investor.pipelineStatus as PipelineStatus; // Assuming status is stored

  if (!isValidTransition(currentStatus, newStatus)) {
    console.warn(`Invalid transition from ${currentStatus} to ${newStatus}`);
    // Might throw or just log depending on strictness
  }

  await db.$transaction([
    db.investor.update({
      where: { id: investorId },
      data: { pipelineStatus: newStatus },
    }),
    db.timelineEvent.create({
      data: {
        investorId,
        type: 'StatusChange',
        title: 'Status Changed',
        description: `Status changed to ${newStatus} via ${trigger}`,
        metadata: { from: currentStatus, to: newStatus, performedBy },
      }
    }),
  ]);
}

export function getStatusFromReplyClassification(classification: string): PipelineStatus {
  switch (classification) {
    case 'Bounce':
    case 'Unsubscribe':
    case 'NotNow':
    case 'Pass':
      return 'PASSED';
    case 'WantsMeeting':
      return 'MEETING_BOOKED';
    case 'Interested':
    case 'WantsDeck':
    case 'Forwarded':
    case 'OutOfOffice':
    case 'Unknown':
    default:
      return 'REPLIED';
  }
}
