"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useToast } from "@/components/demo/toast";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { productSchema, type ProductFormInput, type ProductFormOutput } from "@/lib/demo/schemas";
import { useDemoActions } from "@/lib/demo/store";
import { PRODUCT_CATEGORIES } from "@/lib/demo/types";

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function Form({ onDone }: { onDone: () => void }) {
  const actions = useDemoActions();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, submitCount },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", sku: "", category: "Accessories", stock: "", threshold: "10", unitPrice: "", unitCost: "", supplier: "" },
    mode: "onTouched",
  });
  const errorCount = Object.keys(errors).length;

  function onSubmit(values: ProductFormOutput) {
    const result = actions.addProduct(values);
    if (!result.ok) {
      setError("sku", { message: result.error });
      return;
    }
    toast.success(`${result.value.name} added`, `${result.value.stock} units in stock · threshold ${result.value.threshold}.`);
    actions.open("product", result.value.id);
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
        <div className="sm:col-span-2">
          <Field id="ap-name" label="Product name" error={errors.name?.message}>
            <Input id="ap-name" autoComplete="off" aria-invalid={!!errors.name} aria-describedby={describedBy("ap-name", errors.name?.message)} {...register("name")} />
          </Field>
        </div>
        <Field id="ap-sku" label="SKU" error={errors.sku?.message} hint="Letters, numbers and dashes">
          <Input id="ap-sku" autoComplete="off" aria-invalid={!!errors.sku} aria-describedby={describedBy("ap-sku", errors.sku?.message, "hint")} {...register("sku")} />
        </Field>
        <Field id="ap-category" label="Category" error={errors.category?.message}>
          <select id="ap-category" className={selectCls} {...register("category")}>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field id="ap-stock" label="Opening stock" error={errors.stock?.message}>
          <Input id="ap-stock" inputMode="numeric" aria-invalid={!!errors.stock} aria-describedby={describedBy("ap-stock", errors.stock?.message)} {...register("stock")} />
        </Field>
        <Field id="ap-threshold" label="Stock threshold" error={errors.threshold?.message} hint="Warn when stock falls below this">
          <Input id="ap-threshold" inputMode="numeric" aria-invalid={!!errors.threshold} aria-describedby={describedBy("ap-threshold", errors.threshold?.message, "hint")} {...register("threshold")} />
        </Field>
        <Field id="ap-price" label="Unit price" error={errors.unitPrice?.message}>
          <Input id="ap-price" inputMode="decimal" aria-invalid={!!errors.unitPrice} aria-describedby={describedBy("ap-price", errors.unitPrice?.message)} {...register("unitPrice")} />
        </Field>
        <Field id="ap-cost" label="Unit cost" optional error={errors.unitCost?.message}>
          <Input id="ap-cost" inputMode="decimal" {...register("unitCost")} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="ap-supplier" label="Supplier" optional error={errors.supplier?.message}>
            <Input id="ap-supplier" autoComplete="off" {...register("supplier")} />
          </Field>
        </div>
      </div>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Add product</Button>
      </DialogFooter>
    </form>
  );
}

export function AddProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>Adds a product to the local demo catalog.</DialogDescription>
        </DialogHeader>
        {open && <Form onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
