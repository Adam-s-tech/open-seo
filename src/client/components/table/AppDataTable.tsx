import {
  flexRender,
  type Header,
  type Row,
  type Table,
} from "@tanstack/react-table";
import type { MouseEvent, ReactNode } from "react";

// The DaisyUI table, for pages that have not moved to `DataTable` yet. Each
// page port moves its tables to `DataTable`. The last port deletes this file.

export function AppDataTable<TData>({
  table,
  className = "table table-sm",
  wrapperClassName = "overflow-x-auto",
  empty,
  getRowClassName,
  getRowProps,
  getCellClassName,
  fixedLayout,
  stickyHeader,
}: {
  table: Table<TData>;
  className?: string;
  wrapperClassName?: string;
  empty?: ReactNode;
  getRowClassName?: (row: Row<TData>) => string | undefined;
  getRowProps?: (row: Row<TData>) => {
    onClick?: (event: MouseEvent<HTMLTableRowElement>) => void;
    className?: string;
  };
  getCellClassName?: (row: Row<TData>, columnId: string) => string | undefined;
  fixedLayout?: boolean;
  stickyHeader?: boolean;
}) {
  if (table.getRowModel().rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={wrapperClassName}>
      <table
        className={className}
        style={fixedLayout ? { tableLayout: "fixed" } : undefined}
      >
        {fixedLayout ? (
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => (
              <col key={column.id} style={{ width: column.getSize() }} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <HeaderCell
                  key={header.id}
                  header={header}
                  fixedLayout={fixedLayout}
                  stickyHeader={stickyHeader}
                />
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const rowProps = getRowProps?.(row);
            return (
              <tr
                key={row.id}
                onClick={rowProps?.onClick}
                className={[getRowClassName?.(row), rowProps?.className]
                  .filter(Boolean)
                  .join(" ")}
              >
                {row.getVisibleCells().map((cell) => {
                  const metaClass = cell.column.columnDef.meta?.cellClassName;
                  return (
                    <td
                      key={cell.id}
                      className={[
                        typeof metaClass === "function"
                          ? metaClass(row)
                          : metaClass,
                        getCellClassName?.(row, cell.column.id),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HeaderCell<TData>({
  header,
  fixedLayout,
  stickyHeader,
}: {
  header: Header<TData, unknown>;
  fixedLayout?: boolean;
  stickyHeader?: boolean;
}) {
  const meta = header.column.columnDef.meta;
  return (
    <th
      className={[
        stickyHeader ? "bg-base-200" : undefined,
        meta?.headerClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={fixedLayout ? { width: header.getSize() } : undefined}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
}
