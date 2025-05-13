"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";

import { RatingStars } from "@/components/rating-stars";
import { ResponsiveResumePreview } from "@/components/responsive-resume-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationStages } from "@/data/data";
import { Applicant } from "../../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<Applicant>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const applicant = row.original;
      const fullName = `${applicant.firstName} ${applicant.lastName}`;

      return (
        <div className="w-[200px] flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={applicant.profilePhotoUrl || ""} alt={fullName} />
            <AvatarFallback>
              {applicant.firstName[0]}
              {applicant.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="">{fullName}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[200px] truncate">{row.original.email}</span>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      const stage = applicationStages.find(
        (stage) => stage.value === row.original.activeApplication.stage.name
      );

      if (!stage) {
        return <span>{row.original.activeApplication.stage.name}</span>;
      }

      return (
        <div className="flex w-[150px] gap-2 items-center">
          <span className="rounded-full bg-[#36BFFA] w-2 h-2" />
          <Select value={stage.label}>
            <SelectTrigger
              className="border-none shadow-none text-xs"
              aria-label={`Application stage: ${stage.label}`}
            >
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={stage.label}>{stage.label}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.activeApplication.stage.name);
    },
    enableSorting: true,
  },
  {
    accessorKey: "salaryExp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Salary Exp." />
    ),
    cell: ({ row }) => {
      const application = row.original.activeApplication;
      if (!application.salaryExp) {
        return <span className="text-muted-foreground">Not specified</span>;
      }

      const salary = application.salaryExp;
      const currency = application.salaryExpCurr || "EUR";
      const period = application.salaryExpPeriod
        ? application.salaryExpPeriod.toLowerCase()
        : "monthly";

      const formattedPeriod =
        period.charAt(0).toUpperCase() + period.slice(1).toLowerCase();

      return (
        <div className="w-[150px]">
          <span>{`${salary.toLocaleString()} ${currency}/${formattedPeriod}`}</span>
        </div>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const salaryA = rowA.original.activeApplication.salaryExp || 0;
      const salaryB = rowB.original.activeApplication.salaryExp || 0;
      return salaryA - salaryB;
    },
    enableSorting: true,
  },
  {
    accessorKey: "rating",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rating" />
    ),
    cell: ({ row }) => {
      const rating = row.original.rating.averageRating || 0;
      return <RatingStars rating={rating} />;
    },
    filterFn: (row, id, value) => {
      const rating = row.original.rating.averageRating || 0;
      return value.includes(rating.toString());
    },
    enableSorting: true,
  },
  {
    accessorKey: "jobListing",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Applied Job" />
    ),
    cell: ({ row }) => {
      const jobName = row.original.activeApplication.jobListing.name;
      const jobColor = row.original.activeApplication.jobListing.color;

      return (
        <div className="flex w-[150px] items-center">
          <Badge
            className="rounded-full font-medium shadow-none"
            style={{
              backgroundColor: "#F5F3FF",
              color: "#6927DA",
              borderColor: "#C3B5FD",
            }}
          >
            {jobName}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.original.activeApplication.jobListing.name);
    },
    enableSorting: false,
  },
  {
    accessorKey: "resume",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resume" />
    ),
    cell: ({ row }) => {
      const resume = row.original.activeApplication.resume;

      if (!resume) {
        return <span></span>;
      }

      return (
        <div className="flex items-center justify-center">
          <ResponsiveResumePreview
            resumeUrl={resume.url}
            resumeName={resume.name}
          />
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = row.original.tags;

      if (tags.length === 0) {
        return <span>-</span>;
      }

      return (
        <div className="flex flex-wrap gap-1 min-w-[220px]">
          {tags.slice(0, 1).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="rounded-md text-xs "
              style={{ borderColor: tag.color, color: tag.color }}
            >
              <span className="max-w-[150px] truncate">{tag.name}</span>
            </Badge>
          ))}
          {tags.length > 1 && (
            <Badge variant="outline" className="rounded-md text-xs">
              +{tags.length - 1}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
  },
];
