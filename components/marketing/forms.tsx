"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Info, Loader2 } from "lucide-react";

import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BUSINESS_TYPES,
  CONTACT_TOPICS,
  contactFormSchema,
  waitlistSchema,
  type ContactFormValues,
  type WaitlistValues,
} from "@/lib/demo/schemas";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function Success({ title, children, onReset }: { title: string; children: React.ReactNode; onReset: () => void }) {
  return (
    <div role="status" className="rounded-2xl border border-success/30 bg-success-soft p-7 text-success">
      <CheckCircle2 className="size-8" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/80">{children}</div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="navy">
          <Link href="/demo">
            Explore the live demo <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" onClick={onReset}>
          Send another
        </Button>
      </div>
    </div>
  );
}

function PocNote() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      This is a proof of concept with no backend. Submitting validates the form and shows a confirmation, but nothing is stored or sent.
    </p>
  );
}

/* --------------------------------------------------------------- Contact -- */

export function ContactForm() {
  const [sent, setSent] = useState<ContactFormValues | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", company: "", topic: "Early access", message: "" },
    mode: "onTouched",
  });
  const errorCount = Object.keys(errors).length;

  async function onSubmit(values: ContactFormValues) {
    await new Promise((r) => setTimeout(r, 650));
    setSent(values);
  }

  if (sent) {
    return (
      <Success
        title={`Thanks, ${sent.name.split(" ")[0]}. That worked.`}
        onReset={() => {
          reset();
          setSent(null);
        }}
      >
        <p>
          In a production version, your message about “{sent.topic.toLowerCase()}” would reach the team and you would hear back at <strong>{sent.email}</strong>.
        </p>
        <p>In this proof of concept nothing was sent or stored.</p>
      </Success>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl border bg-card p-6 shadow-card sm:p-8" aria-label="Contact the team">
      {submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          Please fix the {errorCount} highlighted field{errorCount === 1 ? "" : "s"} and try again.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="c-name" label="Your name" error={errors.name?.message}>
          <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={describedBy("c-name", errors.name?.message)} {...register("name")} />
        </Field>
        <Field id="c-email" label="Work email" error={errors.email?.message}>
          <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={describedBy("c-email", errors.email?.message)} {...register("email")} />
        </Field>
        <Field id="c-company" label="Company" optional error={errors.company?.message}>
          <Input id="c-company" autoComplete="organization" {...register("company")} />
        </Field>
        <Field id="c-topic" label="Topic" error={errors.topic?.message}>
          <select id="c-topic" className={selectClass} {...register("topic")}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="c-message" label="How can we help?" error={errors.message?.message} hint="A sentence or two is plenty.">
        <Textarea id="c-message" rows={5} aria-invalid={!!errors.message} aria-describedby={describedBy("c-message", errors.message?.message, "hint")} {...register("message")} />
      </Field>
      <PocNote />
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send message <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------- Waitlist -- */

const TEAM_SIZES = ["1–5", "6–20", "21–100", "100+"] as const;

export function WaitlistForm() {
  const [sent, setSent] = useState<WaitlistValues | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { name: "", email: "", businessType: "Wholesale and distribution", teamSize: "6–20", interest: "" },
    mode: "onTouched",
  });
  const errorCount = Object.keys(errors).length;

  async function onSubmit(values: WaitlistValues) {
    await new Promise((r) => setTimeout(r, 650));
    setSent(values);
  }

  if (sent) {
    return (
      <Success
        title="You're on the (pretend) list"
        onReset={() => {
          reset();
          setSent(null);
        }}
      >
        <p>
          Thanks, {sent.name.split(" ")[0]}. In a real launch we would use <strong>{sent.email}</strong> to share early-access news for {sent.businessType.toLowerCase()} teams.
        </p>
        <p>In this proof of concept nothing was sent or stored.</p>
      </Success>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-2xl border bg-card p-6 shadow-card sm:p-8" aria-label="Join the waitlist">
      {submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          Please fix the {errorCount} highlighted field{errorCount === 1 ? "" : "s"} and try again.
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="w-name" label="Your name" error={errors.name?.message}>
          <Input id="w-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={describedBy("w-name", errors.name?.message)} {...register("name")} />
        </Field>
        <Field id="w-email" label="Work email" error={errors.email?.message}>
          <Input id="w-email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={describedBy("w-email", errors.email?.message)} {...register("email")} />
        </Field>
        <Field id="w-type" label="Business type" error={errors.businessType?.message}>
          <select id="w-type" className={selectClass} {...register("businessType")}>
            {BUSINESS_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm leading-none font-medium">Team size</legend>
          <div className="flex flex-wrap gap-2 pt-1">
            {TEAM_SIZES.map((s) => (
              <label
                key={s}
                className={cn(
                  "cursor-pointer rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-accent has-checked:text-accent-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                )}
              >
                <input type="radio" value={s} className="sr-only" {...register("teamSize")} />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <Field id="w-interest" label="What would you want OrbitOS to take off your plate?" optional error={errors.interest?.message}>
        <Textarea id="w-interest" rows={4} {...register("interest")} />
      </Field>
      <PocNote />
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" /> Joining…
          </>
        ) : (
          <>
            Request early access <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
