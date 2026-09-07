'use server';

import { requireWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getAuditLogs(params?: { search?: string, type?: string, days?: number }) {
  try {
    const { workspace } = await requireWorkspace();
    
    let dateFilter = undefined;
    if (params?.days) {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - params.days);
    }
    
    let typeFilter = undefined;
    if (params?.type && params.type !== 'all') {
      typeFilter = {
        contains: params.type,
        mode: 'insensitive' as const
      };
    }

    let searchFilter = undefined;
    if (params?.search) {
      searchFilter = {
        OR: [
          { action: { contains: params.search, mode: 'insensitive' as const } },
          { performedBy: { contains: params.search, mode: 'insensitive' as const } }
        ]
      };
    }

    const logs = await db.auditLog.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: dateFilter ? { gte: dateFilter } : undefined,
        entityType: typeFilter,
        ...searchFilter,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return logs;
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

export async function logAction(action: string, entityType: string, entityId: string, details: any = {}) {
  try {
    const { workspace, userId } = await requireWorkspace();
    
    await db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        action,
        entityType,
        entityId,
        details,
        performedBy: userId,
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}
