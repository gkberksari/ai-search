"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  sortState?: { field: string; direction: string };
  setSortState?: React.Dispatch<
    React.SetStateAction<{ field: string; direction: string }>
  >;
  isLoading?: boolean;
  error?: Error | null;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  searchTerm = "",
  setSearchTerm,
  sortState,
  setSortState,
  isLoading = false,
  error = null,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    // left: ["select", "name"],
    right: ["actions"],
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnPinning,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const bottomRef = React.useRef<HTMLTableRowElement>(null);

  React.useEffect(() => {
    if (!fetchNextPage || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          console.log("Fetching next page...");
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = bottomRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortState={sortState}
        setSortState={setSortState}
      />
      <div className="rounded-md overflow-auto xl:max-h-[calc(100vh-260px)] max-h-[calc(100vh-290px)] max-sm:max-h-[calc(100vh-480px)]">
        <Table className="text-xs">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        position: header.column.getIsPinned()
                          ? "sticky"
                          : undefined,
                        left:
                          header.column.getIsPinned() === "left"
                            ? `${header.column.getStart()}px`
                            : undefined,
                        right:
                          header.column.getIsPinned() === "right"
                            ? `${header.column.getAfter()}px`
                            : undefined,
                        zIndex: header.column.getIsPinned() ? 21 : undefined,
                        backgroundColor: header.column.getIsPinned()
                          ? "white"
                          : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="h-16">
                  {Array.from({ length: columns.length }).map(
                    (_, cellIndex) => (
                      <TableCell key={`skeleton-cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-4 w-[90%]" />
                      </TableCell>
                    )
                  )}
                </TableRow>
              ))
            ) : error || table.getRowModel().rows?.length < 1 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        position: cell.column.getIsPinned()
                          ? "sticky"
                          : undefined,
                        left:
                          cell.column.getIsPinned() === "left"
                            ? `${cell.column.getStart()}px`
                            : undefined,
                        right:
                          cell.column.getIsPinned() === "right"
                            ? `${cell.column.getAfter()}px`
                            : undefined,
                        zIndex: cell.column.getIsPinned() ? 1 : undefined,
                        backgroundColor: cell.column.getIsPinned()
                          ? "white"
                          : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {!isLoading && !error && (hasNextPage || isFetchingNextPage) && (
              <TableRow ref={bottomRef}>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-4"
                >
                  {isFetchingNextPage ? "Loading more..." : " "}
                </TableCell>
              </TableRow>
            )}
            {/* {!isLoading && (
              <TableRow className="hover:bg-muted/50 cursor-pointer">
                <TableCell colSpan={2} className="font-medium">
                  <div className="flex items-center gap-3">
                    <Plus size={20} />
                    Add Talent
                  </div>
                </TableCell>
                {Array.from({ length: columns.length - 3 }).map((_, i) => (
                  <TableCell key={i}></TableCell>
                ))}
              </TableRow>
            )} */}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
