import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="How this proof of concept treats data. A full privacy notice will be published before any real service launches."
      sections={[
        { heading: "What this site collects", body: "Nothing. The forms validate input in your browser and show a confirmation, but they do not transmit or store what you type. The site has no accounts, analytics or advertising trackers." },
        { heading: "Demo data", body: "All records in the live demo are fictional and generated in your browser. Changes you make are held in memory and disappear when you refresh the page." },
        { heading: "Local storage", body: "The demo's Settings page saves display preferences (such as theme and currency) in your browser's local storage so they persist between visits. You can clear them from Settings or your browser at any time." },
        { heading: "Future service", body: "If OrbitOS becomes a real product, this notice will describe what data is collected, why, how long it is kept and how to exercise your rights." },
      ]}
    />
  );
}
