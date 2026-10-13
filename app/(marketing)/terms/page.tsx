import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      intro="Plain-language terms for using this proof of concept. Formal terms of service will be written before any commercial launch."
      sections={[
        { heading: "Proof of concept", body: "OrbitOS is a working placeholder name and a demonstration. It is not a commercial product, there is no service level, and features may change or disappear without notice." },
        { heading: "Simulated functionality", body: "Invoices, payments, accounting entries, emails and AI responses shown in the demo are simulated with local sample data. They must not be relied on for real business decisions, accounting or tax purposes." },
        { heading: "No purchases", body: "Pricing shown is illustrative. Nothing on this site can be purchased and no subscription is created by using it." },
        { heading: "Third-party names", body: "Names of other software products may appear in research context only. OrbitOS is not affiliated with, endorsed by or sponsored by any of them." },
      ]}
    />
  );
}
