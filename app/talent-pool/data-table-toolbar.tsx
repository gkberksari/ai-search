"use client";

import { Table } from "@tanstack/react-table";
import {
  BetweenVerticalEnd,
  ChevronDown,
  Ellipsis,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { DataTableSort } from "./data-table-sort";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  sortState?: { field: string; direction: string };
  setSortState?: React.Dispatch<
    React.SetStateAction<{ field: string; direction: string }>
  >;
}

export function DataTableToolbar<TData>({
  table,
  searchTerm = "",
  setSearchTerm,
  sortState,
  setSortState,
}: DataTableToolbarProps<TData>) {
  const isFiltered =
    table.getState().columnFilters.length > 0 || searchTerm !== "";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 px-8">
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => {
            table.resetColumnFilters();
            if (setSearchTerm) {
              setSearchTerm("");
            }
          }}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
      <div className="relative w-[140px] flex-grow md:flex-grow-0 text-gray-500">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(event) => {
            if (setSearchTerm) {
              setSearchTerm(event.target.value);
            }
          }}
          className="pl-10 h-8 "
        />
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
      </div>

      <div className="flex max-md:flex-wrap items-center justify-center gap-2">
        <DataTableSort
          table={table}
          sortState={sortState}
          setSortState={setSortState}
        />
        <DataTableViewOptions table={table} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 flex">
              <BetweenVerticalEnd className="mr-2 h-4 w-4" />
              Sheet view
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-3 pr-4">
            Sheet view
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Ellipsis className="" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem>
              <span>Options</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
