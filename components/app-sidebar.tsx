import {
  Bookmark,
  ChevronDown,
  Ellipsis,
  Home,
  LifeBuoy,
  Mail,
  Settings,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Menu items.
const items = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Bookmark,
  },
  {
    title: "Talent Pool",
    url: "/talent-pool",
    icon: Users,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Mail,
  },
];

const others = [
  {
    name: "Support",
    url: "#",
    icon: LifeBuoy,
  },
  {
    name: "Settings",
    url: "#",
    icon: Settings,
  },
];

const user = {
  name: "Olivia Rhye",
  email: "oliviarhye@hrpanda.co",
  avatar: "https://github.com/shadcn.png",
};

export function AppSidebar() {
  return (
    <Sidebar className="py-2">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="p-6 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="border py-[10px] px-[14px]"
                  size="lg"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#9600D7] text-sidebar-primary-foreground"></div>
                  <span className="text-[#101828]">Hrpanda</span>
                  <ChevronDown
                    className="ml-auto text-muted-foreground"
                    size={20}
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="justify-between py-4">
        <SidebarGroup className="">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="px-3">
                    <a href={item.url}>
                      <item.icon size={24} />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {others.map((project) => (
                <SidebarMenuItem key={project.name}>
                  <SidebarMenuButton asChild className="px-3">
                    <a href={project.url}>
                      <project.icon size={24} />
                      <span>{project.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <Ellipsis className="ml-auto" />
                </SidebarMenuButton>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
