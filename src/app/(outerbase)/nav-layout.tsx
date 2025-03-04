"use client";
import {
  SidebarMenuHeader,
  SidebarMenuItem,
  SidebarMenuLoadingItem,
} from "@/components/sidebar-menu";
import { Database, Plus } from "@phosphor-icons/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { PropsWithChildren } from "react";
import NavigationProfile from "./nav-profile";
import NavigationSigninBanner from "./nav-signin-banner";
import { useSession } from "./session-provider";
import { useWorkspaces } from "./workspace-provider";

export default function NavigationLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const { session } = useSession();
  const { workspaces, loading: workspaceLoading } = useWorkspaces();
  const pathname = usePathname();
  const { workspaceId } = useParams<{ workspaceId?: string }>();

  return (
    <div className="flex h-screen w-screen">
      <div className="flex w-[250px] shrink-0 flex-col overflow-hidden border-r">
        <div className="px-2 py-2">
          <NavigationProfile />
        </div>

        {/* <div className="px-2">
          <Input
            size="base"
            className="bg-secondary"
            placeholder="Search for anything"
            preText={<MagnifyingGlass className="mr-2" />}
          />
        </div> */}

        <div className="flex flex-1 flex-col overflow-scroll border-b pb-2">
          <SidebarMenuHeader text="Workspace" />
          <SidebarMenuItem
            selected={pathname === "/local"}
            text="Local Workspace"
            icon={Database}
            href="/local"
          />

          {workspaces.map((workspace) => {
            return (
              <SidebarMenuItem
                key={workspace.id}
                text={workspace.name}
                icon={Database}
                onClick={
                  workspace.short_name === workspaceId
                    ? undefined
                    : () => {
                        router.push(`/w/${workspace.short_name}`);
                      }
                }
                selected={workspace.short_name === workspaceId}
                badge={
                  !workspace.is_enterprise &&
                  workspace.subscription.plan === "starter" ? (
                    <span className="mr-2 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-sm font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                      Free
                    </span>
                  ) : undefined
                }
              />
            );
          })}

          {workspaceLoading && (
            <>
              <SidebarMenuLoadingItem />
              <SidebarMenuLoadingItem />
              <SidebarMenuLoadingItem />
            </>
          )}

          <SidebarMenuItem
            text={"New Workspace"}
            icon={Plus}
            onClick={() => {
              if (session?.user) {
                router.push("/new-workspace");
              } else {
                localStorage.setItem("continue-redirect", "/new-workspace");
                router.push("/signin");
              }
            }}
          />
        </div>

        <NavigationSigninBanner />
      </div>
      <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
        {children}
      </div>
    </div>
  );
}
