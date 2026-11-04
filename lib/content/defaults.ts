import { INDUSTRIES } from "./industries";
import { MODULES } from "./modules";
import type { Brand, ContactPages, LegalContent, NavContent, ResourcesContent, SiteContent } from "./schema";
import { HOME, PRICING, SOLUTIONS } from "./site";

/**
 * The website as it ships. A section the super admin has not edited comes from
 * here, and "Reset to default" returns a section to it. Facts about the company that
 * only the business can supply (real prices, legal review) are flagged in the README.
 */

const BRAND: Brand = {
  productName: "OrbitOS",
  company: "The OrbiTech Solution",
  tagline: "The AI-powered business operating system",
  description: "OrbitOS is a simpler, modular business operating system by The OrbiTech Solution: connect operations, automate repetitive work and see what needs attention from one workspace.",
  footerBlurb: "A simpler, modular business operating system by The OrbiTech Solution.",
  copyright: "© 2026 The OrbiTech Solution. All rights reserved.",
  footerNote: "Other product names belong to their respective owners, and OrbitOS is not affiliated with them.",
  contactEmail: "",
};

const NAV: NavContent = {
  items: [
    { id: "product", kind: "modules", label: "Product", href: "", visible: true },
    { id: "solutions", kind: "solutions", label: "Solutions", href: "", visible: true },
    { id: "industries", kind: "link", label: "Industries", href: "/industries", visible: true },
    { id: "resources", kind: "link", label: "Resources", href: "/resources", visible: true },
    { id: "pricing", kind: "link", label: "Pricing", href: "/pricing", visible: true },
  ],
  productMenuNote: "Start with what you need. Expand when you're ready.",
  demo: { label: "Explore the live demo", href: "/demo", visible: true },
  signIn: { label: "Sign in", visible: true },
  cta: { label: "Get started", href: "/waitlist", visible: true },
};

const RESOURCES: ResourcesContent = {
  eyebrow: "Resources",
  title: "Guides and straight answers",
  description: "A small set of resources for getting to know OrbitOS, from a first look to what is coming next.",
  items: [
    { icon: "rocket", title: "Take the product tour", body: "See the animated story, the product preview and the connected workflow on the homepage.", href: "/#how-it-works", status: "Available", visible: true },
    { icon: "dashboard", title: "Demo guide", body: "What you can do in the live demo, step by step.", href: "/resources#demo-guide", status: "Available", visible: true },
    { icon: "alert", title: "Straight answers", body: "What is real today and what is only planned: security, AI, integrations and more.", href: "/#trust", status: "Available", visible: true },
    { icon: "file", title: "Frequently asked questions", body: "Availability, data, AI, pricing and getting started.", href: "/#faq", status: "Available", visible: true },
    { icon: "code", title: "What's coming next", body: "The next steps planned for the product.", href: "/resources#roadmap", status: "In progress", visible: true },
    { icon: "mail", title: "Talk to the team", body: "Questions, feedback or ideas for what OrbitOS should do next.", href: "/contact", status: "Available", visible: true },
  ],
  guide: {
    title: "Demo guide",
    body: "The demo runs entirely in your browser on fictional data as of 13 Oct 2026. Changes last until you refresh the page. Preferences in Settings are kept in local storage.",
    steps: [
      { title: "Overview", body: "Metrics, revenue trend, recent orders, activity and insights, all computed from the sample records." },
      { title: "CRM", body: "Search contacts, filter by stage, add or edit a contact, change a status and set follow-ups." },
      { title: "Orders", body: "Create an order and watch stock, receivables and the dashboard update." },
      { title: "Inventory", body: "Adjust stock and see warnings appear when a product falls below its own threshold." },
      { title: "Projects", body: "Add tasks and mark them complete; counts and notifications follow." },
      { title: "AI Copilot", body: "Ask the six suggested questions. Answers are generated from the dataset by a local, rule-based assistant." },
    ],
    linkLabel: "Open the live demo",
    linkHref: "/demo",
    visible: true,
  },
  roadmap: {
    title: "What's coming next",
    body: "The product is built in the open about what exists. These are the next steps planned:",
    items: [
      "Shared workspaces, so a whole team can work on the same records with their own sign-ins.",
      "Connecting the copilot to a language model, grounded in your own records.",
      "Sending quotations and invoices by email.",
      "The first integrations: accounting, payments and storefronts.",
    ],
    visible: true,
  },
};

const CONTACT_PAGES: ContactPages = {
  contact: {
    eyebrow: "Contact",
    title: "Contact the team",
    description: "Questions about access, a walkthrough of the demo, or an integration you would need? Start here.",
    notes: [
      { icon: "mail", title: "Tell us what you would want it to do", body: "The most useful thing you can share is the job you would hand to a connected workspace first." },
      { icon: "users", title: "It reaches a real person", body: "Your message goes straight to the team's inbox at The OrbiTech Solution." },
      { icon: "shield", title: "Your details stay private", body: "Only our administrators can read what you send, and it is used only to reply to you." },
    ],
    successTitle: "Thanks. Your message is with the team.",
    successBody: "We will reply to the email address you gave us.",
  },
  waitlist: {
    eyebrow: "Get started",
    title: "Request access",
    description: "Accounts are set up by an administrator. Tell us a little about your business and we will be in touch about getting you started.",
    pointsTitle: "What you get",
    points: [
      "Start with the modules you need and add more later",
      "One connected workspace instead of ten tools",
      "A copilot that answers from your own records",
      "Honest progress updates, with no inflated promises",
    ],
    successTitle: "Thanks. Your request is in.",
    successBody: "We will contact you at the email address you gave us about setting up your account.",
  },
};

const LEGAL: LegalContent = {
  privacy: {
    title: "Privacy",
    intro: "What OrbitOS collects, who can see it and what you can do about it.",
    updated: "4 November 2026",
    sections: [
      { heading: "Who we are", body: "OrbitOS is provided by The OrbiTech Solution. This notice covers this website, the live demo and signed-in workspaces." },
      { heading: "Your account", body: "To give you an account we store your name, email address and role. Passwords are held only as a one-way hash by our authentication provider; nobody can read them." },
      { heading: "Your workspace", body: "The records you add (contacts, products, orders, invoices, expenses, projects, tasks and preferences) are stored against your account and are private to it. Administrators can see how much storage you use, but not what your records contain." },
      { heading: "Website forms", body: "When you use the contact or access-request form we store what you send so we can reply. Our administrators can read it. We also keep a one-way hash of your network address for a short check against abuse; we do not store the address itself." },
      { heading: "Cookies and local storage", body: "A signed-in session uses a cookie that is strictly necessary to keep you signed in. The live demo saves display preferences in your browser's local storage. There are no analytics or advertising trackers on this site." },
      { heading: "Where it is stored", body: "Account and workspace data is stored with our database provider, Supabase, and is encrypted in transit and at rest." },
      { heading: "The live demo", body: "All records in the live demo are fictional and generated in your browser. Changes you make are held in memory and disappear when you refresh the page." },
      { heading: "Your choices", body: "You can correct your name and password in your account settings. To have your account deleted, ask your administrator or contact us; deleting an account permanently deletes its workspace with it." },
    ],
  },
  terms: {
    title: "Terms",
    intro: "Plain-language terms for using OrbitOS.",
    updated: "4 November 2026",
    sections: [
      { heading: "The service", body: "OrbitOS is a business workspace provided by The OrbiTech Solution. Accounts are created by an administrator. Features may change as the product develops." },
      { heading: "Your account", body: "Keep your password to yourself and replace any temporary password when you first sign in. You are responsible for what is done under your account. Administrators may deactivate or delete accounts." },
      { heading: "Your data", body: "What you add to your workspace remains yours. Each account has a storage limit, and when you reach it you will need to remove records or ask your administrator for more room." },
      { heading: "Records, not advice", body: "Invoices, “mark as paid” and the finance views are records only. OrbitOS does not process payments, connect to banks, calculate tax or produce certified accounts, and quotations and orders send no email. The assistant is rule-based and can be wrong; check anything important before relying on it." },
      { heading: "The live demo", body: "The live demo is a simulation on fictional data. It must not be relied on for real business decisions." },
      { heading: "Third-party names", body: "Names of other software products may appear on this site. OrbitOS is not affiliated with, endorsed by or sponsored by any of them." },
    ],
  },
};

export const DEFAULT_CONTENT: SiteContent = {
  brand: BRAND,
  nav: NAV,
  modules: MODULES,
  solutions: SOLUTIONS,
  industries: INDUSTRIES,
  pricing: PRICING,
  home: HOME,
  resources: RESOURCES,
  contact: CONTACT_PAGES,
  legal: LEGAL,
};
