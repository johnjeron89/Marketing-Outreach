"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit } from "lucide-react";
import { TemplateEditor } from "@/components/templates/template-editor";
import { Badge } from "@/components/ui/badge";
import { deleteTemplate } from "@/actions/templates";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TemplatesClient({ templates }: { templates: any[] }) {
  const router = useRouter();
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    setIsDeleting(id);
    try {
      await deleteTemplate(id);
      toast.success("Template deleted successfully");
      if (editingTemplate?.id === id) {
        setEditingTemplate(null);
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">Manage your outreach and follow-up templates.</p>
        </div>
        <Button className="gap-2" onClick={handleCreateNew}>
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(template => (
          <div 
            key={template.id} 
            className={`border bg-card rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer flex flex-col gap-4 ${editingTemplate?.id === template.id ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => handleEdit(template)}
          >
            <div className="flex justify-between items-start">
              <Badge variant={template.type === 'Initial' ? 'default' : 'secondary'}>
                {template.type}
              </Badge>
              
              <div className="flex gap-2 items-center">
                {template.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                {!template.isDefault && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, template.id)}
                    disabled={isDeleting === template.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{template.subject}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t">
        <TemplateEditor 
          key={editingTemplate?.id || 'new'} 
          initialData={editingTemplate} 
          onCancel={editingTemplate ? () => setEditingTemplate(null) : undefined}
          onSaveSuccess={() => setEditingTemplate(null)}
        />
      </div>
    </div>
  );
}
