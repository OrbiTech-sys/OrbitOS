"use client";

import { useCallback } from "react";
import { useDemoRouter } from "@/components/demo/link";

import { useDemoActions } from "@/lib/demo/store";
import type { RecordRef } from "@/lib/demo/types";

/** Opens a record's drawer on its module page (used by search, notifications, insights and the copilot). */
export function useRecordNav() {
  const router = useDemoRouter();
  const actions = useDemoActions();
  return useCallback(
    (record: RecordRef, href: string) => {
      actions.open(record.kind, record.id);
      router.push(href);
    },
    [actions, router],
  );
}
