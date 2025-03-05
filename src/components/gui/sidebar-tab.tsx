import { useConfig } from "@/context/config-provider";
import { cn } from "@/lib/utils";
import { ReactElement, useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export interface SidebarTabItem {
  key: string;
  icon: ReactElement;
  name: string;
  content?: ReactElement;
  onClick?: () => void;
}

interface SidebarTabProps {
  tabs: SidebarTabItem[];
}

export default function SidebarTab({ tabs }: Readonly<SidebarTabProps>) {
  // const { forcedTheme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedIndex, setLoadedIndex] = useState(() => {
    const a: boolean[] = new Array(tabs.length).fill(false);
    a[0] = true;
    return a;
  });

  // const searchParams = useSearchParams();
  // const disableToggle =
  //   searchParams.get("disableThemeToggle") === "1" || forcedTheme;

  const config = useConfig();

  /**
   * Adding color to help identify the database.
   * Some people have multiple databases open at the same time.
   * This will help them identify the database they are working on.
   *
   * https://github.com/outerbase/studio/issues/234
   */
  const databaseColorIndicatorClassName = useMemo(() => {
    if (config.color === "red") {
      return `border-l-8 border-red-400 dark:border-red-800`;
    } else if (config.color === "blue") {
      return `border-l-8 border-blue-400 dark:border-blue-800`;
    } else if (config.color === "green") {
      return `border-l-8 border-green-400 dark:border-green-800`;
    } else if (config.color === "yellow") {
      return `border-l-8 border-yellow-400 dark:border-yellow-800`;
    } else if (config.color === "purple") {
      return `border-l-8 border-purple-400 dark:border-purple-800`;
    } else if (config.color === "gray") {
      return `border-l-8 border-gray-400 dark:border-gray-800`;
    }

    return "";
  }, [config.color]);

  return (
    <div
      className={cn(
        "flex h-full bg-neutral-50 dark:bg-neutral-950",
        databaseColorIndicatorClassName
      )}
    >
      <div className={cn("shrink-0")}>
        <div className="flex h-full flex-col gap-4 border-r border-neutral-200 p-3 dark:border-neutral-800">

          {tabs.map(({ key, name, icon, onClick }, idx) => {
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (onClick) {
                        onClick();
                        return;
                      }

                      if (!loadedIndex[idx]) {
                        loadedIndex[idx] = true;
                        setLoadedIndex([...loadedIndex]);
                      }

                      if (idx !== selectedIndex) {
                        setSelectedIndex(idx);
                      }
                    }}
                    className={cn(
                      "cursor flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-0.5 text-neutral-400 hover:text-neutral-900 dark:text-neutral-600 dark:hover:text-neutral-100",
                      selectedIndex === idx
                        ? "rounded-xl bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                        : undefined
                    )}
                  >
                    {icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className="relative flex h-full grow overflow-hidden">
        {tabs
          .filter((tab) => tab.content)
          .map((tab, tabIndex) => {
            const selected = selectedIndex === tabIndex;

            return (
              <div
                key={tab.key}
                style={{
                  contentVisibility: selected ? "auto" : "hidden",
                  zIndex: selected ? 0 : -1,
                  position: "absolute",
                  display: "flex",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  top: 0,
                }}
              >
                {loadedIndex[tabIndex] && tab.content}
              </div>
            );
          })}
      </div>
    </div>
  );
}
