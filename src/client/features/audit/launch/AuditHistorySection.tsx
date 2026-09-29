import { Link } from "@tanstack/react-router";
import type { UseQueryResult } from "@tanstack/react-query";
import { ScanSearch, Trash2 } from "lucide-react";
import type { getAuditHistory } from "@/serverFunctions/audit";
import { PortalMenu } from "@/client/components/PortalMenu";
import { QueryState } from "@/client/components/QueryState";
import { Badge } from "@/client/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { formatDate, StatusBadge } from "@/client/features/audit/shared";

type AuditHistory = Awaited<ReturnType<typeof getAuditHistory>>;

export function AuditHistorySection({
  projectId,
  historyQuery,
  onDelete,
}: {
  projectId: string;
  historyQuery: UseQueryResult<AuditHistory>;
  onDelete: (auditId: string) => void;
}) {
  return (
    <QueryState
      query={historyQuery}
      errorFallback="Failed to load audit history"
    >
      {(history) => (
        <AuditHistoryTable
          projectId={projectId}
          history={history}
          onDelete={onDelete}
        />
      )}
    </QueryState>
  );
}

function AuditHistoryTable({
  projectId,
  history,
  onDelete,
}: {
  projectId: string;
  history: AuditHistory;
  onDelete: (auditId: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center text-base-content/40 space-y-3">
          <ScanSearch className="size-12 mx-auto opacity-30" />
          <p className="text-lg font-medium">No audits yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-3">
        <h2 className="card-title text-base">Previous Audits</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Lighthouse</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((audit) => (
              <TableRow key={audit.id} className="group">
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(audit.startedAt)}
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {audit.startUrl}
                </TableCell>
                <TableCell>
                  <StatusBadge status={audit.status} />
                </TableCell>
                <TableCell>{audit.pagesTotal || audit.pagesCrawled}</TableCell>
                <TableCell>
                  {audit.ranLighthouse ? (
                    <Badge variant="outline" size="sm">
                      Yes
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>
                  <HistoryActions
                    projectId={projectId}
                    auditId={audit.id}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function HistoryActions({
  projectId,
  auditId,
  onDelete,
}: {
  projectId: string;
  auditId: string;
  onDelete: (auditId: string) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 reveal-on-hover">
      <Link
        to="/p/$projectId/audit"
        params={{ projectId }}
        search={{ auditId, tab: "pages" }}
        className="btn btn-primary btn-xs"
      >
        View
      </Link>
      <PortalMenu ariaLabel="Audit actions">
        {(close) => (
          <li>
            <button
              className="text-error"
              onClick={() => {
                close();
                onDelete(auditId);
              }}
            >
              <Trash2 className="size-3.5" />
              Delete audit
            </button>
          </li>
        )}
      </PortalMenu>
    </div>
  );
}
