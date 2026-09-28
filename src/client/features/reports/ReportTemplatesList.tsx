import { LayoutTemplate, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/client/components/EmptyState";
import { RowActionsMenu } from "@/client/components/RowActionsMenu";
import { DropdownMenuItem } from "@/client/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/client/lib/relative-time";
import type { ReportTemplate } from "@/types/schemas/report-templates";

export function ReportTemplatesList({
  templates,
  onEdit,
  onDelete,
}: {
  templates: ReportTemplate[];
  onEdit: (template: ReportTemplate) => void;
  onDelete: (template: ReportTemplate) => void;
}) {
  if (templates.length === 0) {
    return (
      <EmptyState
        icon={LayoutTemplate}
        title="No templates yet"
        description="A template is a reusable brief for a kind of report: who it is for, which sections it has, how it sounds."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-base-300">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.id} className="hover:bg-base-200">
              <td>
                <button
                  type="button"
                  className="link link-hover text-left font-medium"
                  onClick={() => onEdit(template)}
                >
                  {template.name}
                </button>
              </td>
              <td className="max-w-[420px] text-base-content/70">
                {template.description}
              </td>
              <td className="whitespace-nowrap text-base-content/70">
                {formatRelativeTime(template.updatedAt)}
              </td>
              <td className="w-10 text-right">
                <RowActionsMenu label={`Actions for ${template.name}`}>
                  <DropdownMenuItem onClick={() => onEdit(template)}>
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(template)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </RowActionsMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
