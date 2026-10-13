"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useDemoActions } from "@/lib/demo/store";
import type { RecordRef } from "@/lib/demo/types";

/** Opens a record's drawer on its module page (used by search, notifications, insights and the copilot). */
export function useRecordNav() {
  const router = useRouter();
  const actions = useDemoActions();
  return useCallback(
    (record: RecordRef, href: string) => {
      actions.open(record.kind, record.id);
      router.push(href);
    },
    [actions, router],
  );
}
