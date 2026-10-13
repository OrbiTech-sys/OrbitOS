import { cn } from "@/lib/utils";
import type { InvoiceDisplayStatus } from "@/lib/demo/selectors";
import type { ContactStage, OrderStatus, QuotationStatus, StockStatus, TaskPriority, TaskStatus, TeamMember } from "@/lib/demo/types";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const TONES: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-accent text-accent-foreground",
};

const DOTS: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground/60",
  primary: "bg-primary",
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[1.375rem] items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", DOTS[tone])} aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------- Domain badges -- */

const ORDER: Record<OrderStatus, { tone: Tone; label: string }> = {
  pending: { tone: "warning", label: "Pending" },
  processing: { tone: "info", label: "Processing" },
  shipped: { tone: "primary", label: "Shipped" },
  delivered: { tone: "success", label: "Delivered" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};
export const orderStatusLabel = (s: OrderStatus) => ORDER[s].label;
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <StatusBadge tone={ORDER[status].tone}>{ORDER[status].label}</StatusBadge>;
}

const QUOTE: Record<QuotationStatus, { tone: Tone; label: string }> = {
  draft: { tone: "neutral", label: "Draft" },
  sent: { tone: "info", label: "Sent" },
  accepted: { tone: "success", label: "Accepted" },
  declined: { tone: "danger", label: "Declined" },
  expired: { tone: "warning", label: "Expired" },
};
export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <StatusBadge tone={QUOTE[status].tone}>{QUOTE[status].label}</StatusBadge>;
}

const INVOICE: Record<InvoiceDisplayStatus, { tone: Tone; label: string }> = {
  paid: { tone: "success", label: "Paid" },
  unpaid: { tone: "info", label: "Unpaid" },
  overdue: { tone: "danger", label: "Overdue" },
};
export function InvoiceStatusBadge({ status }: { status: InvoiceDisplayStatus }) {
  return <StatusBadge tone={INVOICE[status].tone}>{INVOICE[status].label}</StatusBadge>;
}

const STOCK: Record<StockStatus, { tone: Tone; label: string }> = {
  in_stock: { tone: "success", label: "In stock" },
  low: { tone: "warning", label: "Low stock" },
  out: { tone: "danger", label: "Out of stock" },
};
export function StockStatusBadge({ status }: { status: StockStatus }) {
  return <StatusBadge tone={STOCK[status].tone}>{STOCK[status].label}</StatusBadge>;
}

const STAGE: Record<ContactStage, { tone: Tone; label: string }> = {
  new: { tone: "neutral", label: "New lead" },
  qualified: { tone: "info", label: "Qualified" },
  proposal: { tone: "primary", label: "Proposal" },
  negotiation: { tone: "warning", label: "Negotiation" },
  customer: { tone: "success", label: "Customer" },
  lost: { tone: "danger", label: "Lost" },
};
export function StageBadge({ stage }: { stage: ContactStage }) {
  return <StatusBadge tone={STAGE[stage].tone}>{STAGE[stage].label}</StatusBadge>;
}

const PRIORITY: Record<TaskPriority, { tone: Tone; label: string }> = {
  high: { tone: "danger", label: "High" },
  medium: { tone: "warning", label: "Medium" },
  low: { tone: "neutral", label: "Low" },
};
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <StatusBadge tone={PRIORITY[priority].tone}>{PRIORITY[priority].label}</StatusBadge>;
}

const TASK: Record<TaskStatus, { tone: Tone; label: string }> = {
  todo: { tone: "neutral", label: "To do" },
  in_progress: { tone: "info", label: "In progress" },
  done: { tone: "success", label: "Done" },
};
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <StatusBadge tone={TASK[status].tone}>{TASK[status].label}</StatusBadge>;
}

/* ----------------------------------------------------------------- Avatar -- */

const AVATAR_TONES: Record<TeamMember["tone"], string> = {
  indigo: "bg-indigo-100 text-indigo-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-700",
  violet: "bg-violet-100 text-violet-700",
};

export function Avatar({
  member,
  size = "md",
  className,
}: {
  member: Pick<TeamMember, "initials" | "tone" | "name">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      title={member.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        AVATAR_TONES[member.tone],
        size === "sm" && "size-6 text-[0.625rem]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-11 text-sm",
        className,
      )}
    >
      <span aria-hidden="true">{member.initials}</span>
      <span className="sr-only">{member.name}</span>
    </span>
  );
}
