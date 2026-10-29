"use client";

import { Link } from "@/components/demo/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, CalendarClock, FileSearch, Landmark, Plus, ReceiptText, TriangleAlert, Wallet } from "lucide-react";

import { useToast } from "@/components/demo/toast";
import { Card, DataTable, DemoNotice, DetailList, EmptyState, FilterChips, PageHeader, SearchField, SelectField, StatCard, type Column } from "@/components/demo/ui";
import { Field, describedBy } from "@/components/shared/form-field";
import { InvoiceStatusBadge } from "@/components/shared/badges";
import { RevenueTrendChart } from "@/components/shared/charts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, diffDays, formatDate, monthKey, relativeDay } from "@/lib/demo/dates";
import { expenseSchema, type ExpenseFormInput, type ExpenseFormOutput } from "@/lib/demo/schemas";
import { computeMetrics, invoiceAging, invoiceDisplayStatus, monthlyTrend, type InvoiceDisplayStatus } from "@/lib/demo/selectors";
import { useMoney } from "@/lib/demo/settings";
import { useDemoActions, useDemoData, useDemoLookups, useOpenRecord } from "@/lib/demo/store";
import { EXPENSE_CATEGORIES, type Expense, type Invoice } from "@/lib/demo/types";
import { cn } from "@/lib/utils";
import { useIsDemo, useToday } from "@/lib/workspace/context";

type StatusFilter = "all" | InvoiceDisplayStatus;

const AGING_TONE = ["bg-chart-3", "bg-chart-4", "bg-warning", "bg-danger"] as const;

export function FinanceView() {
  const data = useDemoData();
  const today = useToday();
  const demo = useIsDemo();
  const lookups = useDemoLookups();
  const money = useMoney();
  const actions = useDemoActions();
  const toast = useToast();
  const openId = useOpenRecord("invoice");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expQuery, setExpQuery] = useState("");
  const [expCategory, setExpCategory] = useState("all");
  const [expenseOpen, setExpenseOpen] = useState(false);

  const m = useMemo(() => computeMetrics(data, today), [data, today]);
  const aging = useMemo(() => invoiceAging(data, today), [data, today]);
  const agingTotal = aging.reduce((s, b) => s + b.amount, 0);
  const trend = useMemo(() => monthlyTrend(data, 12, today), [data, today]);
  const thisMonth = monthKey(today);

  const dueSoon = data.invoices.filter((i) => i.status === "unpaid" && i.dueDate >= today && i.dueDate <= addDays(today, 7));
  const collected = data.invoices.filter((i) => i.paidDate && monthKey(i.paidDate) === thisMonth).reduce((s, i) => s + i.amount, 0);
  const expensesMonth = data.expenses.filter((e) => monthKey(e.date) === thisMonth).reduce((s, e) => s + e.amount, 0);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.invoices.length, paid: 0, unpaid: 0, overdue: 0 };
    for (const i of data.invoices) c[invoiceDisplayStatus(i, today)] += 1;
    return c;
  }, [data.invoices, today]);

  const invoiceRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.invoices.filter((i) => {
      if (status !== "all" && invoiceDisplayStatus(i, today) !== status) return false;
      return !q || i.number.toLowerCase().includes(q) || (lookups.contacts.get(i.customerId)?.company.toLowerCase().includes(q) ?? false);
    });
  }, [data.invoices, lookups.contacts, query, status, today]);

  const expenseRows = useMemo(() => {
    const q = expQuery.trim().toLowerCase();
    return data.expenses.filter((e) => (expCategory === "all" || e.category === expCategory) && (!q || e.vendor.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)));
  }, [data.expenses, expQuery, expCategory]);
  const expenseTotal = expenseRows.reduce((s, e) => s + e.amount, 0);

  function pay(inv: Invoice) {
    actions.markInvoicePaid(inv.id);
    toast.success(`${inv.number} marked as paid`, demo ? "Demo only: no payment was processed and no bank was contacted." : "Recorded as paid. OrbitOS doesn't process payments or contact banks.");
  }

  const invoiceColumns: Column<Invoice>[] = [
    { key: "number", header: "Invoice", primary: true, sortValue: (i) => i.number, cell: (i) => i.number },
    { key: "customer", header: "Customer", sortValue: (i) => lookups.contacts.get(i.customerId)?.company ?? "", cell: (i) => lookups.contacts.get(i.customerId)?.company ?? "—" },
    { key: "issued", header: "Issued", hideBelow: "lg", sortValue: (i) => i.issueDate, cell: (i) => <span className="text-muted-foreground">{formatDate(i.issueDate)}</span> },
    {
      key: "due",
      header: "Due date",
      hideBelow: "sm",
      sortValue: (i) => i.dueDate,
      cell: (i) => {
        const s = invoiceDisplayStatus(i, today);
        return (
          <span className={cn("whitespace-nowrap", s === "overdue" ? "font-medium text-danger" : "text-muted-foreground")}>
            {i.status === "paid" ? formatDate(i.dueDate) : `${relativeDay(i.dueDate, today)}`}
          </span>
        );
      },
    },
    { key: "status", header: "Status", sortValue: (i) => invoiceDisplayStatus(i, today), cell: (i) => <InvoiceStatusBadge status={invoiceDisplayStatus(i, today)} /> },
    { key: "amount", header: "Amount", align: "right", sortValue: (i) => i.amount, cell: (i) => <span className="font-semibold">{money.full(i.amount)}</span> },
    {
      key: "action",
      header: "Action",
      align: "right",
      cell: (i) =>
        i.status === "unpaid" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              pay(i);
            }}
            aria-label={`Mark ${i.number} as paid`}
          >
            <BadgeCheck /> <span className="hidden sm:inline">Mark paid</span>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{i.paidDate ? `Paid ${relativeDay(i.paidDate, today).toLowerCase()}` : ""}</span>
        ),
    },
  ];

  const expenseColumns: Column<Expense>[] = [
    { key: "date", header: "Date", sortValue: (e) => e.date, cell: (e) => <span className="whitespace-nowrap">{formatDate(e.date)}</span> },
    { key: "vendor", header: "Vendor", sortValue: (e) => e.vendor, cell: (e) => <span className="font-medium">{e.vendor}</span> },
    { key: "description", header: "Description", hideBelow: "md", cell: (e) => <span className="text-muted-foreground">{e.description}</span> },
    { key: "category", header: "Category", hideBelow: "sm", sortValue: (e) => e.category, cell: (e) => <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{e.category}</span> },
    { key: "amount", header: "Amount", align: "right", sortValue: (e) => e.amount, cell: (e) => <span className="font-semibold">{money.full(e.amount)}</span> },
  ];

  const openInvoice = openId ? lookups.invoices.get(openId) : undefined;

  return (
    <>
      <PageHeader
        title="Finance"
        description="Receivables, expenses and cash trends at a glance."
        actions={
          <Button variant="outline" onClick={() => setExpenseOpen(true)}>
            <Plus /> Add expense
          </Button>
        }
      />
      {demo ? (
        <DemoNotice className="mb-6">
          <strong>Demo module with illustrative figures.</strong> No payments, bank connectivity, tax calculations or certified accounting are implemented. “Mark as paid” only changes a record in your browser.
        </DemoNotice>
      ) : (
        <p className="mb-6 rounded-xl bg-muted px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Records only.</strong> OrbitOS keeps your invoices and expenses but doesn&apos;t process payments, connect to banks or calculate tax. “Mark as paid” updates the record.
        </p>
      )}

      <section aria-label="Finance summary" className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Outstanding receivables" value={money.full(m.outstandingTotal)} hint={`${m.outstandingCount} unpaid invoices`} icon={<Wallet />} />
        <StatCard label="Overdue" value={money.full(m.overdueTotal)} hint={`${m.overdueCount} invoices`} icon={<TriangleAlert />} tone={m.overdueCount ? "danger" : "success"} />
        <StatCard label="Due in next 7 days" value={money.full(dueSoon.reduce((s, i) => s + i.amount, 0))} hint={`${dueSoon.length} invoices`} icon={<CalendarClock />} tone="warning" />
        <StatCard label="Collected this month" value={money.full(collected)} hint="Paid invoices" icon={<BadgeCheck />} tone="success" />
        <StatCard label="Expenses this month" value={money.full(expensesMonth)} hint="Month to date" icon={<ReceiptText />} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card title="Revenue vs expenses" description="Monthly booked revenue and recorded expenses. The latest month is month-to-date.">
          <RevenueTrendChart points={trend} money={money} height={260} showExpenses id="fin" />
          <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-chart-1" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed border-chart-4" /> Expenses</span>
          </div>
        </Card>

        <Card title="Receivables by age" description={`${money.full(agingTotal)} outstanding`}>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Receivables ageing: ${aging.map((b) => `${b.label} ${money.full(b.amount)}`).join(", ")}`}>
            {aging.map((b, i) => (
              <span key={b.key} className={cn("h-full", AGING_TONE[i])} style={{ width: `${agingTotal ? (b.amount / agingTotal) * 100 : 0}%` }} />
            ))}
          </div>
          <ul className="mt-5 space-y-3">
            {aging.map((b, i) => (
              <li key={b.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2.5">
                  <span className={cn("size-2.5 rounded-full", AGING_TONE[i])} aria-hidden="true" />
                  {b.label}
                  <span className="text-xs text-muted-foreground">({b.count})</span>
                </span>
                <span className="font-semibold tabular-nums">{money.full(b.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <Landmark className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Ageing is measured from each invoice&apos;s due date against {formatDate(today)}.
          </p>
        </Card>
      </div>

      <Card className="mt-6" bodyClassName="p-0">
        <Tabs defaultValue="invoices" className="gap-0">
          <div className="border-b px-4 pt-3">
            <TabsList variant="line" className="h-auto gap-4 p-0">
              <TabsTrigger value="invoices" className="h-10 flex-none px-1 data-[state=active]:text-primary data-[state=active]:after:bg-primary">
                Invoices
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[0.6875rem] tabular-nums">{data.invoices.length}</span>
              </TabsTrigger>
              <TabsTrigger value="expenses" className="h-10 flex-none px-1 data-[state=active]:text-primary data-[state=active]:after:bg-primary">
                Expenses
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[0.6875rem] tabular-nums">{data.expenses.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="invoices" className="outline-none">
            <div className="space-y-3 border-b p-4">
              <SearchField label="Search invoices" value={query} onChange={setQuery} placeholder="Search invoice number or customer…" className="sm:max-w-sm" />
              <FilterChips<StatusFilter>
                label="Filter by invoice status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "All", count: counts.all },
                  { value: "unpaid", label: "Unpaid", count: counts.unpaid },
                  { value: "overdue", label: "Overdue", count: counts.overdue },
                  { value: "paid", label: "Paid", count: counts.paid },
                ]}
              />
            </div>
            <DataTable
              key={`${query}-${status}`}
              caption="Invoices"
              columns={invoiceColumns}
              rows={invoiceRows}
              rowKey={(i) => i.id}
              onRowClick={(i) => actions.open("invoice", i.id)}
              selectedKey={openId}
              initialSort={{ key: "due", dir: "asc" }}
              empty={<EmptyState icon={<FileSearch />} title="No invoices match" description="Try a different status or search term." />}
            />
          </TabsContent>

          <TabsContent value="expenses" className="outline-none">
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
              <SearchField label="Search expenses" value={expQuery} onChange={setExpQuery} placeholder="Search vendor or description…" className="sm:max-w-sm sm:flex-1" />
              <SelectField label="Expense category" value={expCategory} onChange={setExpCategory} className="sm:w-56" options={[{ value: "all", label: "All categories" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]} />
              <p className="text-sm text-muted-foreground sm:ml-auto">
                Total: <strong className="text-foreground tabular-nums">{money.full(expenseTotal)}</strong>
              </p>
            </div>
            <DataTable
              key={`${expQuery}-${expCategory}`}
              caption="Expenses"
              columns={expenseColumns}
              rows={expenseRows}
              rowKey={(e) => e.id}
              initialSort={{ key: "date", dir: "desc" }}
              empty={<EmptyState icon={<FileSearch />} title="No expenses match" description="Try a different category or search term." />}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Invoice detail */}
      <Dialog open={!!openInvoice} onOpenChange={(o) => !o && actions.closeRecord()}>
        <DialogContent className="sm:max-w-md">
          {openInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {openInvoice.number} <InvoiceStatusBadge status={invoiceDisplayStatus(openInvoice, today)} />
                </DialogTitle>
                <DialogDescription>{lookups.contacts.get(openInvoice.customerId)?.company}</DialogDescription>
              </DialogHeader>
              <DetailList
                items={[
                  { label: "Amount", value: <span className="text-base font-semibold tabular-nums">{money.full(openInvoice.amount)}</span> },
                  { label: "Issued", value: formatDate(openInvoice.issueDate) },
                  { label: "Due", value: `${formatDate(openInvoice.dueDate)}${openInvoice.status === "unpaid" ? ` (${diffDays(openInvoice.dueDate, today) < 0 ? `${Math.abs(diffDays(openInvoice.dueDate, today))} days overdue` : relativeDay(openInvoice.dueDate, today).toLowerCase()})` : ""}` },
                  { label: "Paid", value: openInvoice.paidDate ? formatDate(openInvoice.paidDate) : "Not yet" },
                  {
                    label: "Order",
                    value: openInvoice.orderId ? (
                      <Link href="/demo/orders" onClick={() => actions.open("order", openInvoice.orderId!)} className="text-primary hover:underline">
                        {lookups.orders.get(openInvoice.orderId)?.number}
                      </Link>
                    ) : (
                      "—"
                    ),
                  },
                ]}
              />
              <DialogFooter>
                <Button variant="outline" onClick={actions.closeRecord}>
                  Close
                </Button>
                {openInvoice.status === "unpaid" && (
                  <Button onClick={() => { pay(openInvoice); actions.closeRecord(); }}>
                    <BadgeCheck /> Mark as paid
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AddExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} />
    </>
  );
}

/* ----------------------------------------------------------- Add expense -- */

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const today = useToday();
  const actions = useDemoActions();
  const toast = useToast();
  const money = useMoney();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { date: today, category: "Software", vendor: "", description: "", amount: "" },
    mode: "onTouched",
  });
  const errorCount = Object.keys(errors).length;

  function onSubmit(values: ExpenseFormOutput) {
    const r = actions.addExpense(values);
    if (!r.ok) {
      toast.error("Could not add expense", r.error);
      return;
    }
    toast.success("Expense recorded", `${r.value.vendor} · ${money.full(r.value.amount)}`);
    onDone();
  }

  const selectCls = "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Please fix the {errorCount} highlighted field{errorCount === 1 ? "" : "s"}.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ex-vendor" label="Vendor" error={errors.vendor?.message}>
          <Input id="ex-vendor" autoComplete="off" aria-invalid={!!errors.vendor} aria-describedby={describedBy("ex-vendor", errors.vendor?.message)} {...register("vendor")} />
        </Field>
        <Field id="ex-amount" label="Amount" error={errors.amount?.message}>
          <Input id="ex-amount" inputMode="decimal" aria-invalid={!!errors.amount} aria-describedby={describedBy("ex-amount", errors.amount?.message)} {...register("amount")} />
        </Field>
        <Field id="ex-category" label="Category" error={errors.category?.message}>
          <select id="ex-category" className={selectCls} {...register("category")}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field id="ex-date" label="Date" error={errors.date?.message}>
          <Input id="ex-date" type="date" {...register("date")} />
        </Field>
      </div>
      <Field id="ex-desc" label="Description" optional error={errors.description?.message}>
        <Input id="ex-desc" autoComplete="off" {...register("description")} />
      </Field>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Add expense</Button>
      </DialogFooter>
    </form>
  );
}

function AddExpenseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const demo = useIsDemo();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>{demo ? "Recorded locally in this demo. " : ""}It appears in the expense list and the trend chart.</DialogDescription>
        </DialogHeader>
        {open && <ExpenseForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
