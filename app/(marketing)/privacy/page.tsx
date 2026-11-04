import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { getSiteContent } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  const { legal } = await getSiteContent();
  return { title: legal.privacy.title, description: legal.privacy.intro };
}

export default async function PrivacyPage() {
  const { legal } = await getSiteContent();
  return <LegalPage page={legal.privacy} />;
}
