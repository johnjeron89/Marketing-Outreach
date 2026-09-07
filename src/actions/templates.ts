"use server";

import { auth } from '@/lib/auth';
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  variables: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

async function getWorkspaceId() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const workspace = await db.workspace.findUnique({
    where: { supabaseUserId: userId },
  });
  if (!workspace) throw new Error("Workspace not found");
  return workspace.id;
}

export async function getTemplates() {
  const workspaceId = await getWorkspaceId();

  return db.emailTemplate.findMany({
    where: { workspaceId },
    orderBy: [{ isDefault: "desc" }, { type: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTemplate(id: string) {
  const workspaceId = await getWorkspaceId();

  const template = await db.emailTemplate.findFirst({
    where: { id, workspaceId },
  });
  if (!template) throw new Error("Template not found");
  return template;
}

export async function createTemplate(data: z.infer<typeof templateSchema>) {
  const workspaceId = await getWorkspaceId();
  const validated = templateSchema.parse(data);

  // Extract variables from template
  const bodyVars =
    validated.body.match(/\{\{(\w+)\}\}/g)?.map((v) => v.slice(2, -2)) ?? [];
  const subjectVars =
    validated.subject.match(/\{\{(\w+)\}\}/g)?.map((v) => v.slice(2, -2)) ?? [];
  const allVars = [...new Set([...bodyVars, ...subjectVars])];

  const template = await db.emailTemplate.create({
    data: {
      workspaceId,
      ...validated,
      variables: validated.variables ?? allVars,
    },
  });

  revalidatePath("/templates");
  return template;
}

export async function updateTemplate(
  id: string,
  data: Partial<z.infer<typeof templateSchema>>,
) {
  const workspaceId = await getWorkspaceId();

  const template = await db.emailTemplate.findFirst({
    where: { id, workspaceId },
  });
  if (!template) throw new Error("Template not found");

  // Re-extract variables if body or subject changed
  let variables = template.variables;
  if (data.body || data.subject) {
    const body = data.body ?? template.body;
    const subject = data.subject ?? template.subject;
    const bodyVars =
      body.match(/\{\{(\w+)\}\}/g)?.map((v) => v.slice(2, -2)) ?? [];
    const subjectVars =
      subject.match(/\{\{(\w+)\}\}/g)?.map((v) => v.slice(2, -2)) ?? [];
    variables = [...new Set([...bodyVars, ...subjectVars])];
  }

  await db.emailTemplate.update({
    where: { id },
    data: { ...data, variables },
  });

  revalidatePath("/templates");
  revalidatePath(`/templates/${id}`);
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const workspaceId = await getWorkspaceId();

  const template = await db.emailTemplate.findFirst({
    where: { id, workspaceId },
  });
  if (!template) throw new Error("Template not found");
  if (template.isDefault) throw new Error("Cannot delete default templates");

  await db.emailTemplate.delete({ where: { id } });

  revalidatePath("/templates");
  return { success: true };
}

export async function duplicateTemplate(id: string) {
  const workspaceId = await getWorkspaceId();

  const template = await db.emailTemplate.findFirst({
    where: { id, workspaceId },
  });
  if (!template) throw new Error("Template not found");

  const duplicate = await db.emailTemplate.create({
    data: {
      workspaceId,
      name: `${template.name} (Copy)`,
      type: template.type,
      subject: template.subject,
      body: template.body,
      variables: template.variables,
      isDefault: false,
    },
  });

  revalidatePath("/templates");
  return duplicate;
}
