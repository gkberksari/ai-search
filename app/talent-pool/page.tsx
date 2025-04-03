"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommandBar } from "@/hooks/use-command-bar";
import { gql, useQuery } from "@apollo/client";
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const GET_APPLICANTS = gql`
  query GetApplicants(
    $page: Int!
    $pageSize: Int
    $filter: ApplicantListFilter
    $sort: ApplicantListSort
  ) {
    getCompanyApplicantList(
      page: $page
      pageSize: $pageSize
      filter: $filter
      sort: $sort
    ) {
      applicants {
        id
        firstName
        lastName
        email
        activeApplication {
          stage {
            name
          }
          jobListing {
            name
          }
          resume {
            url
            name
          }
          salaryExp
          salaryExpCurr
          salaryExpPeriod
        }
        rating
        tags {
          id
          name
          color
        }
        profilePhotoUrl
      }
      total
      pages
    }
  }
`;

const user = {
  name: "Olivia Rhye",
  email: "oliviarhye@hrpanda.co",
  avatar: "https://github.com/shadcn.png",
};

export default function TalentPool() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortState, setSortState] = useState({
    field: "createdAt",
    direction: "desc",
  });
  const [customFilter, setCustomFilter] = useState<any>(null);

  const {
    open: commandBarOpen,
    setOpen: setCommandBarOpen,
    searchTerm: commandSearchTerm,
    setSearchTerm: setCommandSearchTerm,
    isProcessing: commandIsProcessing,
    processSearch,
  } = useCommandBar({
    onFilterChange: (filter) => {
      setCurrentPage(1);
      setCustomFilter(filter);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const variables = React.useMemo(() => {
    if (customFilter) {
      return {
        page: 1,
        pageSize: 10,
        filter: customFilter,
        sort: {
          [sortState.field]: sortState.direction,
        },
      };
    }

    return {
      page: 1,
      pageSize: 10,
      filter: {
        filterParameters: [
          {
            name: "fullName",
            operator: "contains",
            filterVariable: "",
            logicalOperator: "AND",
          },
        ],
        isFavoriteApplicant: false,
        query: debouncedSearchTerm,
      },
      sort: {
        [sortState.field]: sortState.direction,
      },
    };
  }, [debouncedSearchTerm, sortState, customFilter]);

  const { loading, error, data, fetchMore, refetch } = useQuery(
    GET_APPLICANTS,
    {
      variables,
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        if (data?.getCompanyApplicantList) {
          setHasNextPage(currentPage < data.getCompanyApplicantList.pages);
        }
      },
    }
  );

  useEffect(() => {
    setCurrentPage(1);
    refetch(variables);
  }, [debouncedSearchTerm, sortState, refetch, variables, customFilter]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasNextPage) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    fetchMore({
      variables: {
        ...variables,
        page: nextPage,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.getCompanyApplicantList?.applicants?.length) {
          setHasNextPage(false);
          return prev;
        }

        setHasNextPage(
          nextPage < fetchMoreResult.getCompanyApplicantList.pages
        );

        return {
          ...prev,
          getCompanyApplicantList: {
            ...prev.getCompanyApplicantList,
            applicants: [
              ...prev.getCompanyApplicantList.applicants,
              ...fetchMoreResult.getCompanyApplicantList.applicants,
            ],
            total: fetchMoreResult.getCompanyApplicantList.total,
            pages: fetchMoreResult.getCompanyApplicantList.pages,
          },
        };
      },
    })
      .then(() => {
        setCurrentPage(nextPage);
        setLoadingMore(false);
      })
      .catch((err) => {
        console.error("Error fetching more applicants:", err);
        setLoadingMore(false);
      });
  }, [loading, loadingMore, hasNextPage, currentPage, fetchMore, variables]);

  const applicants = data?.getCompanyApplicantList?.applicants ?? [];
  const totalApplicants = data?.getCompanyApplicantList?.total ?? 0;

  const clearAIFilter = useCallback(() => {
    setCustomFilter(null);
    setCommandSearchTerm("");
  }, [setCommandSearchTerm]);

  return (
    <SidebarInset className="overflow-x-auto py-8 max-xl:py-0">
      <header className="flex sticky top-0 h-[60px] shrink-0 items-center justify-between gap-2 md:border-b border-none px-4 xl:hidden">
        <SidebarTrigger className="xl:hidden flex" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer flex xl:hidden">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem>
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="pt-2 xl:pt-0">
        <div className="flex max-md:flex-col items-center justify-between flex-1 px-8 max-md:gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-semibold">Talent Pool</h2>
              <Badge
                variant="secondary"
                className="rounded-full text-base font-normal"
              >
                {loading && !data ? (
                  <Skeleton className="h-6 w-10 rounded-full" />
                ) : (
                  totalApplicants
                )}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Keep track of the applicants
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="lg" className="px-4 max-md:w-full">
              <Plus size={24} />
              <span>Add Talent</span>
            </Button>
          </div>
        </div>
        <Separator className="mt-4" />
        <div className="h-full flex-1 flex-col space-y-8 pt-6 max-xl:pt-3">
          <DataTable
            data={loading && !data ? [] : applicants}
            columns={columns}
            fetchNextPage={loadMore}
            hasNextPage={hasNextPage}
            isFetchingNextPage={loadingMore}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortState={sortState}
            setSortState={setSortState}
            isLoading={!error && loading && !data}
            error={error}
            isAIFiltered={!!customFilter}
            commandBarOpen={commandBarOpen}
            setCommandBarOpen={setCommandBarOpen}
            commandSearchTerm={commandSearchTerm}
            setCommandSearchTerm={setCommandSearchTerm}
            commandIsProcessing={commandIsProcessing}
            processSearch={processSearch}
            clearAIFilter={clearAIFilter}
            totalResults={totalApplicants}
          />
        </div>
      </div>
    </SidebarInset>
  );
}
