"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/components/demo/toast";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDays } from "@/lib/demo/dates";
import { contactSchema, type ContactFormInput, type ContactFormOutput } from "@/lib/demo/schemas";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import { CONTACT_STAGES } from "@/lib/demo/types";
import { stageLabel } from "@/lib/demo/selectors";
import { useIsDemo, useWorkspaceEnv } from "@/lib/workspace/context";

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive";

function Form({ onDone }: { onDone: () => void }) {
  const data = useDemoData();
  const { today, selfId, mode } = useWorkspaceEnv();
  const actions = useDemoActions();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<ContactFormInput, unknown, ContactFormOutput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      jobTitle: "",
      stage: "new",
      dealValue: "",
      followUpDate: addDays(today, 3),
      // The demo's contacts default to Priya's book; a member's own contacts default to themselves.
      ownerId: mode === "demo" ? "tm-priya" : selfId,
      source: "Manual entry",
      notes: "",
    },
    mode: "onTouched",
  });
  const errorCount = Object.keys(errors).length;

  function onSubmit(values: ContactFormOutput) {
    const result = actions.addContact({ ...values, followUpDate: values.followUpDate || null });
    if (!result.ok) {
      toast.error("Could not add contact", result.error);
      return;
    }
    toast.success(`${result.value.name} added`, `${result.value.company} is now in your CRM as a ${stageLabel(result.value.stage).toLowerCase()}.`);
    actions.open("contact", result.value.id);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          Please fix the {errorCount} highlighted field{errorCount === 1 ? "" : "s"}.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ac-name" label="Full name" error={errors.name?.message}>
          <Input id="ac-name" autoComplete="off" aria-invalid={!!errors.name} aria-describedby={describedBy("ac-name", errors.name?.message)} {...register("name")} />
        </Field>
        <Field id="ac-company" label="Company" error={errors.company?.message}>
          <Input id="ac-company" autoComplete="off" aria-invalid={!!errors.company} aria-describedby={describedBy("ac-company", errors.company?.message)} {...register("company")} />
        </Field>
        <Field id="ac-email" label="Email" error={errors.email?.message}>
          <Input id="ac-email" type="email" autoComplete="off" aria-invalid={!!errors.email} aria-describedby={describedBy("ac-email", errors.email?.message)} {...register("email")} />
        </Field>
        <Field id="ac-phone" label="Phone" optional error={errors.phone?.message}>
          <Input id="ac-phone" type="tel" autoComplete="off" {...register("phone")} />
        </Field>
        <Field id="ac-title" label="Job title" optional error={errors.jobTitle?.message}>
          <Input id="ac-title" autoComplete="off" {...register("jobTitle")} />
        </Field>
        <Field id="ac-stage" label="Lead stage" error={errors.stage?.message}>
          <select id="ac-stage" className={selectCls} {...register("stage")}>
            {CONTACT_STAGES.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ac-value" label="Deal value" optional error={errors.dealValue?.message} hint="Expected value of the opportunity">
          <Input id="ac-value" inputMode="decimal" placeholder="0" aria-invalid={!!errors.dealValue} aria-describedby={describedBy("ac-value", errors.dealValue?.message, "hint")} {...register("dealValue")} />
        </Field>
        <Field id="ac-follow" label="Follow-up date" optional error={errors.followUpDate?.message}>
          <Input id="ac-follow" type="date" {...register("followUpDate")} />
        </Field>
        <Field id="ac-owner" label="Owner" error={errors.ownerId?.message}>
          <select id="ac-owner" className={selectCls} {...register("ownerId")}>
            {data.team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="ac-source" label="Source" optional error={errors.source?.message}>
          <select id="ac-source" className={selectCls} {...register("source")}>
            {["Manual entry", "Website", "Referral", "Event", "Outbound", "Partner"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="ac-notes" label="Notes" optional error={errors.notes?.message}>
        <Textarea id="ac-notes" rows={3} {...register("notes")} />
      </Field>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Add contact
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const demo = useIsDemo();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>{demo ? "Saved locally in this demo. " : ""}Name, company and email are required.</DialogDescription>
        </DialogHeader>
        {open && <Form onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
