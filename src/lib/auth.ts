import { db } from './db';

import { createClient } from '@/utils/supabase/server';

export async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id || null };
}

export async function getWorkspace() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  let workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
    include: { companyProfile: true, settings: true },
  });

  if (!workspace) {
    workspace = await db.workspace.create({
      data: {
        supabaseUserId: userId,
        name: "My Workspace",
        settings: {
          create: {
            dailySendLimit: 50,
            sendWindowStart: "09:00",
            sendWindowEnd: "17:00",
          },
        },
      },
      include: {
        companyProfile: true,
        settings: true,
      },
    });
  }
  
  return { userId, workspace };
}

export async function requireWorkspace() {
  const { userId, workspace } = await getWorkspace();
  if (!workspace) throw new Error('Workspace not found');
  return { userId, workspace };
}
