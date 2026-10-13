"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buildNotifications, type DemoNotification } from "@/lib/demo/notifications";
import { useMoney, useSettings } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useReadNotifications } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

const TONE = { danger: "bg-danger", warning: "bg-warning", info: "bg-info" } as const;

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const data = useDemoData();
  const settings = useSettings();
  const money = useMoney();
  const read = useReadNotifications();
  const actions = useDemoActions();

  const items = useMemo(() => buildNotifications(data, settings.notifications, money), [data, settings.notifications, money]);
  const unread = items.filter((n) => !read.includes(n.id));

  function openItem(n: DemoNotification) {
    actions.markNotificationsRead([n.id]);
    if (n.record) actions.open(n.record.kind, n.record.id);
    router.push(n.href);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications, none unread"}>
          <Bell />
          {unread.length > 0 && (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] leading-4 font-semibold text-white" aria-hidden="true">
              {unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-1.5rem))] gap-0 rounded-xl p-0 shadow-float">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <Button variant="ghost" size="xs" disabled={unread.length === 0} onClick={() => actions.markNotificationsRead(items.map((n) => n.id))}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <BellOff className="size-8 text-muted-foreground/60" aria-hidden="true" />
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">Nothing needs attention, or the relevant alerts are turned off in Settings.</p>
          </div>
        ) : (
          <ul className="scrollbar-thin max-h-[22rem] divide-y overflow-y-auto">
            {items.map((n) => {
              const isUnread = !read.includes(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", isUnread ? TONE[n.tone] : "bg-muted-foreground/30")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-[0.8125rem] leading-snug", isUnread ? "font-semibold text-foreground" : "text-muted-foreground")}>{n.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{n.detail}</span>
                    </span>
                    {isUnread && <span className="sr-only">Unread</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t px-4 py-2.5 text-xs">
          <Link href="/demo/settings" onClick={() => setOpen(false)} className="font-medium text-primary hover:underline">
            Notification preferences
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
