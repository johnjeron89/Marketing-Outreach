import { TemplatesClient } from "@/components/templates/templates-client";
import { getTemplates } from "@/actions/templates";

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <TemplatesClient templates={templates} />
    </div>
  );
}
