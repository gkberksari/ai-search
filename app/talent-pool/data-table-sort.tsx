"use client";

import { Table } from "@tanstack/react-table";
import { ArrowDownUp } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableSortProps<TData> {
  table: Table<TData>;
}

const sortOptions: Record<string, { label: string; value: boolean }[]> = {
  dateAdded: [
    { label: "From Newest", value: true },
    { label: "From Oldest", value: false },
  ],
  rating: [
    { label: "High to Low", value: true },
    { label: "Low to High", value: false },
  ],
  default: [
    { label: "Desc.", value: true },
    { label: "Asc.", value: false },
  ],
};

const columnDisplayNames: Record<string, { name: string; type: string }> = {
  email: { name: "Email", type: "default" },
  stage: { name: "Stage", type: "default" },
  rating: { name: "Rating", type: "rating" },
  jobListing: { name: "Applied Job", type: "default" },
  resume: { name: "Resume", type: "default" },
  tags: { name: "Tags", type: "default" },
  dateAdded: { name: "Date Added", type: "dateAdded" },
};

export function DataTableSort<TData>({ table }: DataTableSortProps<TData>) {
  const { sorting } = table.getState();

  const [selectedColumn, setSelectedColumn] = React.useState<string>(
    sorting.length > 0 ? sorting[0].id : ""
  );

  const [selectedSort, setSelectedSort] = React.useState<boolean | null>(
    sorting.length > 0 ? sorting[0].desc : null
  );

  React.useEffect(() => {
    if (sorting.length > 0) {
      setSelectedColumn(sorting[0].id);
      setSelectedSort(sorting[0].desc);
    } else {
      setSelectedColumn("");
      setSelectedSort(null);
    }
  }, [sorting]);

  const sortableColumns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.getCanSort())
      .map((column) => ({
        id: column.id,
        ...(columnDisplayNames[column.id] || {
          name: column.id,
          type: "default",
        }),
      }));
  }, [table]);

  const getSortOptionsForColumn = (columnId: string) => {
    const column = sortableColumns.find((col) => col.id === columnId);
    if (!column) return sortOptions.default;

    return sortOptions[column.type] || sortOptions.default;
  };

  const getActiveSortLabel = () => {
    if (!selectedColumn || selectedSort === null) return null;

    const options = getSortOptionsForColumn(selectedColumn);
    const option = options.find((opt) => opt.value === selectedSort);

    if (!option) return null;

    const columnName =
      sortableColumns.find((col) => col.id === selectedColumn)?.name ||
      selectedColumn;
    return `${columnName}: ${option.label}`;
  };

  const handleApplySort = (columnId: string, desc: boolean) => {
    table.getColumn(columnId)?.toggleSorting(desc);
  };

  const activeSortLabel = getActiveSortLabel();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 ${activeSortLabel ? "bg-accent" : ""}`}
        >
          <ArrowDownUp className="mr-2 h-4 w-4" />
          Sort
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex flex-col gap-4 p-4 w-96 max-md:w-80"
      >
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4">
          <div className="space-y-2">
            <Select
              value={selectedColumn}
              onValueChange={(value: string) => {
                setSelectedColumn(value);
                if (value) {
                  const defaultSort = getSortOptionsForColumn(value)[0].value;
                  setSelectedSort(defaultSort);
                  handleApplySort(value, defaultSort);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {sortableColumns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Select
              value={selectedSort?.toString()}
              onValueChange={(value: string) => {
                const desc = value === "true";
                setSelectedSort(desc);
                handleApplySort(selectedColumn, desc);
              }}
              disabled={!selectedColumn}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                {getSortOptionsForColumn(selectedColumn).map((option) => (
                  <SelectItem
                    key={option.label}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedColumn && selectedSort !== null && (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              table.resetSorting();
              setSelectedColumn("");
              setSelectedSort(null);
            }}
          >
            Reset Sort
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
