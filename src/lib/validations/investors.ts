import { z } from 'zod';
import { PipelineStatus } from '@prisma/client';

export const investorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  firm: z.string().min(1, 'Firm is required'),
  email: z.string().email('Valid email required'),
  partnerTitle: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  timezone: z.string().optional(),
  sectorThesis: z.string().optional(),
  stagePreference: z.string().optional(),
  typicalCheckSize: z.string().optional(),
  portfolioCompanies: z.string().optional(),
  relationshipStatus: z.string().optional(),
  warmIntroSource: z.string().optional(),
  notes: z.string().optional(),
  pipelineStatus: z.enum([
    'DRAFT',
    'READY_TO_SEND',
    'SENT',
    'REPLIED',
    'INTERESTED',
    'MEETING_BOOKED',
    'PASSED',
    'NO_RESPONSE',
    'FOLLOW_UP_DUE',
    'DO_NOT_CONTACT',
  ]).optional(),
  tags: z.array(z.string()).optional(),
});
