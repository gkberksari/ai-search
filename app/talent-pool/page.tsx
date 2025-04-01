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
import { applicantSchema } from "@/data/schema";
import { promises as fs } from "fs";
import { Plus } from "lucide-react";
import path from "path";
import { z } from "zod";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const user = {
  name: "Olivia Rhye",
  email: "oliviarhye@hrpanda.co",
  avatar: "https://github.com/shadcn.png",
};

async function getApplicants() {
  const data = await fs.readFile(
    path.join(process.cwd(), "data", "applicants.json")
  );

  const applicantsData = JSON.parse(data.toString());

  if (applicantsData.applicants) {
    return z.array(applicantSchema).parse(applicantsData.applicants);
  }

  return z.array(applicantSchema).parse([]);
}

export default async function TalentPool() {
  const applicants = await getApplicants();
  return (
    <SidebarInset className="overflow-hidden xl:p-8">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 md:border-b border-none px-4 xl:hidden">
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
      <div className="pt-8 xl:pt-0">
        <div className="flex max-md:flex-col items-center justify-between flex-1 px-8 xl:px-0 max-md:gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-semibold">Talent Pool</h2>
              <Badge
                variant="secondary"
                className="rounded-full text-base font-normal"
              >
                {applicants.length}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Keep track of the applicants
            </div>
          </div>
          <Button variant="default" size="lg" className="px-4 max-md:w-full">
            <Plus size={24} />
            <span>Add Talent</span>
          </Button>
        </div>
        <Separator className="mt-4" />
        <div className="h-full flex-1 flex-col space-y-8 pt-6">
          <DataTable data={applicants} columns={columns} />
        </div>
      </div>
    </SidebarInset>
  );
}
