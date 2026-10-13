import { z } from "zod";
import { CONTACT_STAGES, EXPENSE_CATEGORIES, PRODUCT_CATEGORIES, TASK_PRIORITIES } from "./types";

/**
 * Form validation schemas (React Hook Form + Zod).
 * Number inputs are held as strings in the forms and converted by the
 * `.transform` so users get clear inline messages instead of NaN.
 */

const requiredText = (label: string, max = 80) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

const numberString = (label: string, opts: { min?: number; max?: number; integer?: boolean; optional?: boolean } = {}) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") {
        if (!opts.optional) ctx.addIssue({ code: "custom", message: `${label} is required` });
        return;
      }
      const n = Number(value);
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: "custom", message: `${label} must be a number` });
        return;
      }
      if (opts.integer && !Number.isInteger(n)) ctx.addIssue({ code: "custom", message: `${label} must be a whole number` });
      if (opts.min !== undefined && n < opts.min) ctx.addIssue({ code: "custom", message: `${label} must be at least ${opts.min}` });
      if (opts.max !== undefined && n > opts.max) ctx.addIssue({ code: "custom", message: `${label} must be ${opts.max} or less` });
    })
    .transform((value) => (value === "" ? 0 : Number(value)));

const isoDate = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date`);

export const contactSchema = z.object({
  name: requiredText("Name"),
  company: requiredText("Company"),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  phone: z.string().trim().max(30, "Phone number is too long"),
  jobTitle: z.string().trim().max(60),
  stage: z.enum(CONTACT_STAGES),
  dealValue: numberString("Deal value", { min: 0, max: 100_000_000, optional: true }),
  followUpDate: z.union([isoDate("Follow-up date"), z.literal("")]),
  ownerId: requiredText("Owner"),
  source: z.string().trim().max(40),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer"),
});
export type ContactFormInput = z.input<typeof contactSchema>;
export type ContactFormOutput = z.output<typeof contactSchema>;

export const productSchema = z.object({
  name: requiredText("Product name"),
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(24, "SKU must be 24 characters or fewer")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers and dashes only"),
  category: z.enum(PRODUCT_CATEGORIES),
  stock: numberString("Opening stock", { min: 0, max: 1_000_000, integer: true }),
  threshold: numberString("Stock threshold", { min: 0, max: 1_000_000, integer: true }),
  unitPrice: numberString("Unit price", { min: 0.01, max: 1_000_000 }),
  unitCost: numberString("Unit cost", { min: 0, max: 1_000_000, optional: true }),
  supplier: z.string().trim().max(60),
});
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormOutput = z.output<typeof productSchema>;

export const taskSchema = z.object({
  title: requiredText("Task title", 120),
  projectId: requiredText("Project"),
  assigneeId: requiredText("Assignee"),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: isoDate("Due date"),
});
export type TaskFormInput = z.input<typeof taskSchema>;
export type TaskFormOutput = z.output<typeof taskSchema>;

export const expenseSchema = z.object({
  date: isoDate("Date"),
  category: z.enum(EXPENSE_CATEGORIES),
  vendor: requiredText("Vendor", 60),
  description: z.string().trim().max(120),
  amount: numberString("Amount", { min: 0.01, max: 10_000_000 }),
});
export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type ExpenseFormOutput = z.output<typeof expenseSchema>;

export const stockAdjustSchema = z.object({
  delta: numberString("Adjustment", { integer: true, min: -100000, max: 100000 }).refine((n) => n !== 0, "Enter a non-zero number"),
  reason: z.string().trim().max(60),
});
export type StockAdjustInput = z.input<typeof stockAdjustSchema>;
export type StockAdjustOutput = z.output<typeof stockAdjustSchema>;

/** Marketing contact / waitlist forms (nothing is transmitted in this proof of concept). */
export const BUSINESS_TYPES = [
  "Retail and e-commerce",
  "Professional services",
  "Agency or consulting",
  "Manufacturing",
  "Wholesale and distribution",
  "Technology or SaaS",
  "Other",
] as const;

export const CONTACT_TOPICS = ["Early access", "Product demo", "Partnership", "Integration question", "Something else"] as const;

export const contactFormSchema = z.object({
  name: requiredText("Name", 80),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  company: z.string().trim().max(80),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(1000, "Please keep it under 1,000 characters"),
});
export type ContactFormValues = z.input<typeof contactFormSchema>;

export const waitlistSchema = z.object({
  name: requiredText("Name", 80),
  email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
  businessType: z.enum(BUSINESS_TYPES),
  teamSize: z.enum(["1–5", "6–20", "21–100", "100+"]),
  interest: z.string().trim().max(500, "Please keep it under 500 characters"),
});
export type WaitlistValues = z.input<typeof waitlistSchema>;
