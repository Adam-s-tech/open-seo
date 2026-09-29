import { memo, useMemo } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { AppDataTable } from "@/client/components/table/AppDataTable";
import { useDataTable } from "@/client/components/table/DataTable";
import { ExternalUrlCell } from "@/client/components/table/url";
import { SortableHeader } from "@/client/components/table/SortableHeader";
import {
  formatNumber,
  formatRounded,
  toPageSortMode,
  domainSortColumn,
} from "@/client/features/domain/utils";
import type {
  DomainSortMode,
  PageRow,
  SortOrder,
} from "@/client/features/domain/types";

type Props = {
  domain: string;
  rows: PageRow[];
  sortMode: DomainSortMode;
  currentSortOrder: SortOrder;
  onSortClick: (sort: DomainSortMode) => void;
};

const pageColumnHelper = createColumnHelper<PageRow>();

function DomainPagesTableComponent({
  domain,
  rows,
  sortMode,
  currentSortOrder,
  onSortClick,
}: Props) {
  const columns = useMemo<ColumnDef<PageRow>[]>(
    () => [
      pageColumnHelper.display({
        id: "page",
        header: () => "Page",
        cell: ({ row }) => (
          <ExternalUrlCell
            value={row.original.page}
            label={row.original.relativePath ?? row.original.page}
            baseDomain={domain}
            className="link link-primary inline-flex items-center gap-1"
          />
        ),
        meta: {
          cellClassName: "max-w-[420px] truncate",
        },
      }),
      pageColumnHelper.accessor("organicTraffic", {
        header: () => (
          <SortableHeader
            label="Organic Traffic"
            column={domainSortColumn(
              toPageSortMode(sortMode) === "traffic",
              currentSortOrder,
              () => onSortClick("traffic"),
            )}
          />
        ),
        cell: ({ getValue }) => formatRounded(getValue()),
      }),
      pageColumnHelper.accessor("keywords", {
        header: () => (
          <SortableHeader
            label="Keywords"
            column={domainSortColumn(
              toPageSortMode(sortMode) === "keywords",
              currentSortOrder,
              () => onSortClick("volume"),
            )}
          />
        ),
        cell: ({ getValue }) => formatNumber(getValue()),
      }),
    ],
    [currentSortOrder, domain, onSortClick, sortMode],
  );
  // Memoized on purpose: a fresh slice every render defeats TanStack Table's
  // data-keyed memo, so _autoResetPageIndex fires each render and its setState
  // schedules another one — an unbounded render loop that freezes the tab.
  const tableData = useMemo(() => rows.slice(0, 100), [rows]);
  const table = useDataTable({
    data: tableData,
    columns,
  });
  return (
    <AppDataTable
      table={table}
      className="table table-sm"
      empty={
        <div className="py-6 text-center text-base-content/60">
          No pages match this search.
        </div>
      }
    />
  );
}

export const DomainPagesTable = memo(DomainPagesTableComponent);
