import { generateFilterFromPrompt } from "@/lib/ai-service";
import { useCallback, useEffect, useState } from "react";

type FilterParameter = {
  logicalOperator: string;
  name: string;
  operator: string;
  filterVariable: string;
  filterVariable2?: string;
  salaryCurr?: string;
  salaryPeriod?: string;
};

type QueryFilter = {
  filterParameters: FilterParameter[];
  query: string;
  isFavoriteApplicant: boolean;
  jobListingId: null | string;
};

type UseCommandBarProps = {
  onFilterChange: (filter: QueryFilter) => void;
};

export function useCommandBar({ onFilterChange }: UseCommandBarProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const processSearch = useCallback(
    async (value: string) => {
      if (!value.trim()) return;

      setIsProcessing(true);
      try {
        const filter = await generateFilterFromPrompt(value);
        if (filter) {
          onFilterChange(filter);
        }
      } catch (error) {
        console.error("Error processing search:", error);
      } finally {
        setIsProcessing(false);
        setOpen(false);
      }
    },
    [onFilterChange]
  );

  return {
    open,
    setOpen,
    searchTerm,
    setSearchTerm,
    isProcessing,
    processSearch,
  };
}
