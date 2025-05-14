import { Dices, Loader2, SparklesIcon, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const examples = [
  "Candidates with a salary expectation between 1,000 and 1,500 Euro/month",
  "Find all applicants from Germany with Salary expectation above 2,000 Euro/month",
  "Find all applicants in hired stage",
];

type AICommandBarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isProcessing: boolean;
  onSearch: (value: string) => void;
  isFiltered?: boolean;
  totalResults?: number;
  onReset?: () => void;
};

export function AICommandBar({
  open,
  setOpen,
  searchTerm,
  setSearchTerm,
  isProcessing,
  onSearch,
  isFiltered = false,
  totalResults = 0,
  onReset = () => {},
}: AICommandBarProps) {
  return (
    <>
      <Button
        variant="outline"
        className="hidden md:flex h-9 w-9 px-0 gap-2 relative group ml-1"
        onClick={() => setOpen(true)}
      >
        <SparklesIcon className="h-4 w-4" />
        <span className="sr-only">Open AI Command</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <SparklesIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <CommandInput
            placeholder="Type a natural language query..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isProcessing) {
                e.preventDefault();
                onSearch(searchTerm);
              }
            }}
            className="flex h-11 w-full rounded-md bg-transparent py-3 pr-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isProcessing && (
            <Loader2 className="mr-8 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <CommandList>
          {isFiltered ? (
            <CommandGroup heading="Filter Results">
              <div className="p-2 text-sm flex items-center justify-between">
                <span>Found {totalResults} results</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => {
                    onReset();
                    setSearchTerm("");
                  }}
                >
                  <XCircle className="h-3 w-3" />
                  Reset Filter
                </Button>
              </div>
              <CommandSeparator />
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <span>Current filter: {searchTerm}</span>
              </CommandItem>
            </CommandGroup>
          ) : (
            <>
              <CommandEmpty>
                {isProcessing ? "Asking to AI..." : "No results found."}
              </CommandEmpty>
              {searchTerm === "" && (
                <CommandGroup heading="Try asking">
                  {examples.map((example) => (
                    <CommandItem
                      key={example}
                      onSelect={() => {
                        setSearchTerm(example);
                        onSearch(example);
                      }}
                    >
                      <Dices className="mr-2 h-4 w-4" />
                      <span>{example}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
