/**
 * Sample dataset for the OrbitOS demo.
 *
 * Everything here is FICTIONAL and illustrative. Companies, people and figures
 * are invented; e-mail addresses use the reserved `.example` TLD.
 *
 * The dataset is built once at module load by a deterministic generator (seeded
 * PRNG, fixed "today"), so the server render and the client render always agree.
 * Relationships are real: orders point at customers, invoices at orders, order
 * lines at products, tasks at projects, and so on. Dashboard numbers and the AI
 * copilot are *computed* from these records (see `selectors.ts`), never typed in.
 *
 * ---------------------------------------------------------------------------
 * FUTURE BACKEND NOTE
 * Replace `SEED_DATA` with queries against the Drizzle schema. The selector
 * and copilot functions take a `DemoData` argument, so they keep working
 * unchanged once the same shape is loaded from a database.
 * ---------------------------------------------------------------------------
 */
import { DEMO_TODAY, addDays, diffDays, monthKey, shiftMonth, daysInMonth } from "./dates";
import type {
  Activity,
  Contact,
  DemoData,
  Expense,
  ExpenseCategory,
  Invoice,
  LineItem,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Project,
  Quotation,
  Task,
  TeamMember,
} from "./types";

/* ------------------------------------------------------------------ PRNG -- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261013);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
function pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const d = (offset: number) => addDays(DEMO_TODAY, offset);
const pad = (n: number, width = 3) => String(n).padStart(width, "0");

/* ------------------------------------------------------------------ Team -- */

const team: TeamMember[] = [
  { id: "tm-alex", name: "Alex Morgan", role: "Founder & CEO", email: "alex.morgan@meridianworkspace.example", initials: "AM", tone: "indigo" },
  { id: "tm-priya", name: "Priya Nair", role: "Head of Sales", email: "priya.nair@meridianworkspace.example", initials: "PN", tone: "violet" },
  { id: "tm-daniel", name: "Daniel Okafor", role: "Operations Lead", email: "daniel.okafor@meridianworkspace.example", initials: "DO", tone: "emerald" },
  { id: "tm-sofia", name: "Sofia Marini", role: "Finance Manager", email: "sofia.marini@meridianworkspace.example", initials: "SM", tone: "amber" },
  { id: "tm-jonas", name: "Jonas Weber", role: "Customer Success", email: "jonas.weber@meridianworkspace.example", initials: "JW", tone: "sky" },
  { id: "tm-mei", name: "Mei Tanaka", role: "Account Executive", email: "mei.tanaka@meridianworkspace.example", initials: "MT", tone: "rose" },
];

/* -------------------------------------------------------------- Products -- */

interface ProductSeed extends Omit<Product, "id"> {
  key: string;
}

const productSeeds: ProductSeed[] = [
  { key: "desk", sku: "FRN-SD-100", name: "Standing Desk Frame", category: "Furniture", stock: 34, threshold: 12, unitPrice: 549, unitCost: 318, supplier: "Kestrel Furnishings" },
  { key: "chair", sku: "FRN-CH-210", name: "Ergonomic Chair Pro", category: "Furniture", stock: 7, threshold: 15, unitPrice: 389, unitCost: 224, supplier: "Kestrel Furnishings" },
  { key: "whiteboard", sku: "FRN-WB-330", name: "Mobile Whiteboard", category: "Furniture", stock: 21, threshold: 8, unitPrice: 139, unitCost: 78, supplier: "Kestrel Furnishings" },
  { key: "cabinet", sku: "STO-FC-410", name: "Lateral Filing Cabinet", category: "Storage", stock: 16, threshold: 6, unitPrice: 199, unitCost: 112, supplier: "Harbor Storage Systems" },
  { key: "drawer", sku: "STO-DR-420", name: "Under-desk Drawer Unit", category: "Storage", stock: 28, threshold: 10, unitPrice: 119, unitCost: 64, supplier: "Harbor Storage Systems" },
  { key: "monitor", sku: "ELC-MN-110", name: "27\" 4K Monitor", category: "Electronics", stock: 26, threshold: 10, unitPrice: 429, unitCost: 281, supplier: "Pacific Components" },
  { key: "dock", sku: "ELC-DK-120", name: "USB-C Dock 12-in-1", category: "Electronics", stock: 9, threshold: 20, unitPrice: 149, unitCost: 84, supplier: "Pacific Components" },
  { key: "headset", sku: "ELC-HS-130", name: "Noise-Cancelling Headset", category: "Electronics", stock: 31, threshold: 12, unitPrice: 199, unitCost: 112, supplier: "Pacific Components" },
  { key: "webcam", sku: "ELC-WC-140", name: "HD Webcam", category: "Electronics", stock: 0, threshold: 15, unitPrice: 89, unitCost: 47, supplier: "Pacific Components" },
  { key: "arm", sku: "ACC-MA-220", name: "Dual Monitor Arm", category: "Accessories", stock: 42, threshold: 15, unitPrice: 129, unitCost: 68, supplier: "Northgate Distribution" },
  { key: "keyboard", sku: "ACC-KB-230", name: "Mechanical Keyboard", category: "Accessories", stock: 38, threshold: 15, unitPrice: 119, unitCost: 62, supplier: "Northgate Distribution" },
  { key: "mouse", sku: "ACC-MS-240", name: "Wireless Mouse", category: "Accessories", stock: 55, threshold: 20, unitPrice: 59, unitCost: 28, supplier: "Northgate Distribution" },
  { key: "stand", sku: "ACC-LS-250", name: "Laptop Stand", category: "Accessories", stock: 12, threshold: 15, unitPrice: 49, unitCost: 22, supplier: "Northgate Distribution" },
  { key: "mat", sku: "ACC-DM-260", name: "Desk Mat", category: "Accessories", stock: 64, threshold: 20, unitPrice: 39, unitCost: 16, supplier: "Northgate Distribution" },
  { key: "cables", sku: "ACC-CK-270", name: "Cable Management Kit", category: "Accessories", stock: 90, threshold: 30, unitPrice: 24, unitCost: 9, supplier: "Northgate Distribution" },
  { key: "lamp", sku: "LGT-DL-310", name: "LED Desk Lamp Pro", category: "Lighting", stock: 27, threshold: 12, unitPrice: 79, unitCost: 38, supplier: "Lumina Supply" },
];

const products: Product[] = productSeeds.map((p, i) => {
  const { key, ...rest } = p;
  void key;
  return { id: `prd-${pad(i + 1)}`, ...rest };
});
const P = Object.fromEntries(productSeeds.map((p, i) => [p.key, products[i]])) as Record<string, Product>;

function lineOf(key: string, quantity: number): LineItem {
  return { productId: P[key].id, quantity, unitPrice: P[key].unitPrice };
}
export function sumLines(lines: LineItem[]): number {
  return lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
}

/* -------------------------------------------------------------- Contacts -- */

interface ContactSeed {
  key: string;
  name: string;
  company: string;
  domain: string;
  jobTitle: string;
  stage: Contact["stage"];
  dealValue: number;
  lastContact: number; // days from today (<= 0)
  followUp: number | null; // days from today
  owner: string;
  source: string;
  notes: string;
  created: number;
}

const contactSeeds: ContactSeed[] = [
  // Customers
  { key: "northbeam", name: "Hannah Ellis", company: "Northbeam Studio", domain: "northbeam", jobTitle: "Creative Director", stage: "customer", dealValue: 0, lastContact: -6, followUp: 9, owner: "tm-priya", source: "Referral", notes: "Growing design studio. Prefers consolidated monthly delivery.", created: -310 },
  { key: "brightloop", name: "Marcus Reid", company: "Brightloop Analytics", domain: "brightloop", jobTitle: "Operations Manager", stage: "customer", dealValue: 0, lastContact: 0, followUp: 14, owner: "tm-mei", source: "Website", notes: "Fast-growing team. Onboarding project in progress.", created: -290 },
  { key: "cedar", name: "Lena Hoffmann", company: "Cedar & Pine Architects", domain: "cedarpine", jobTitle: "Office Manager", stage: "customer", dealValue: 0, lastContact: -11, followUp: 20, owner: "tm-alex", source: "Event", notes: "Net-45 payment terms agreed.", created: -280 },
  { key: "helio", name: "Arjun Mehta", company: "Helio Robotics", domain: "heliorobotics", jobTitle: "Head of Facilities", stage: "customer", dealValue: 0, lastContact: -2, followUp: 5, owner: "tm-priya", source: "Partner", notes: "Pilot rollout across a second site is being planned.", created: -240 },
  { key: "fieldstone", name: "Claire Dubois", company: "Fieldstone Legal", domain: "fieldstonelegal", jobTitle: "Practice Manager", stage: "customer", dealValue: 0, lastContact: -9, followUp: -1, owner: "tm-jonas", source: "Referral", notes: "Payment reminders needed; otherwise a reliable account.", created: -330 },
  { key: "lumen", name: "Tomasz Kowalski", company: "Lumen Learning", domain: "lumenlearning", jobTitle: "Procurement Lead", stage: "customer", dealValue: 0, lastContact: -3, followUp: 7, owner: "tm-mei", source: "Website", notes: "Seasonal buying pattern, peaks in Q3 and Q4.", created: -260 },
  { key: "orchard", name: "Amara Okoye", company: "Orchard Health Collective", domain: "orchardhealth", jobTitle: "Operations Director", stage: "customer", dealValue: 0, lastContact: -5, followUp: 12, owner: "tm-priya", source: "Outbound", notes: "Multi-location clinic group; interested in a second order wave.", created: -200 },
  { key: "pixelforge", name: "Ravi Patel", company: "Pixelforge Games", domain: "pixelforge", jobTitle: "Studio Manager", stage: "customer", dealValue: 0, lastContact: -8, followUp: 10, owner: "tm-mei", source: "Event", notes: "Orders in bursts when the studio hires.", created: -220 },
  { key: "harbor", name: "Isabel Costa", company: "Harbor & Vale Consulting", domain: "harborvale", jobTitle: "Managing Partner", stage: "customer", dealValue: 0, lastContact: -1, followUp: 18, owner: "tm-priya", source: "Referral", notes: "Net-45 terms. Considering a fit-out for a new office.", created: -180 },
  // New leads
  { key: "tidewater", name: "Gregor Lund", company: "Tidewater Logistics", domain: "tidewaterlogistics", jobTitle: "Operations Lead", stage: "new", dealValue: 12400, lastContact: -2, followUp: 1, owner: "tm-mei", source: "Website", notes: "Requested a catalog and volume pricing.", created: -3 },
  { key: "sable", name: "Nadia Farouk", company: "Sable & Co Design", domain: "sableco", jobTitle: "Founder", stage: "new", dealValue: 6800, lastContact: -1, followUp: 0, owner: "tm-priya", source: "Referral", notes: "Opening a second studio in January.", created: -2 },
  { key: "redwood", name: "Owen Blake", company: "Redwood Tech Hub", domain: "redwoodtech", jobTitle: "Community Manager", stage: "new", dealValue: 9200, lastContact: -4, followUp: 3, owner: "tm-mei", source: "Event", notes: "Coworking space expansion.", created: -5 },
  { key: "ember", name: "Talia Brooks", company: "Ember Fitness Group", domain: "emberfitness", jobTitle: "Head Office Lead", stage: "new", dealValue: 5500, lastContact: -6, followUp: -1, owner: "tm-priya", source: "Outbound", notes: "Waiting for a callback after the first call.", created: -8 },
  // Qualified
  { key: "atlas", name: "Kenji Watanabe", company: "Atlas Mobility", domain: "atlasmobility", jobTitle: "Facilities Director", stage: "qualified", dealValue: 21000, lastContact: -3, followUp: 2, owner: "tm-priya", source: "Partner", notes: "Budget confirmed for Q4. Needs delivery to two offices.", created: -21 },
  { key: "verdant", name: "Sana Qureshi", company: "Verdant Foods Ltd", domain: "verdantfoods", jobTitle: "Operations Manager", stage: "qualified", dealValue: 14750, lastContact: -7, followUp: -2, owner: "tm-mei", source: "Website", notes: "Wants a walkthrough of sit-stand options.", created: -17 },
  { key: "crestline", name: "Peter Novak", company: "Crestline Realty", domain: "crestlinerealty", jobTitle: "Regional Manager", stage: "qualified", dealValue: 8900, lastContact: -5, followUp: 6, owner: "tm-priya", source: "Outbound", notes: "Refurbishing three branch offices.", created: -14 },
  { key: "meridiandental", name: "Elise Laurent", company: "Meridian Dental Group", domain: "meridiandental", jobTitle: "Practice Operations", stage: "qualified", dealValue: 17300, lastContact: -4, followUp: 4, owner: "tm-mei", source: "Referral", notes: "Reception and back-office refresh.", created: -19 },
  // Proposal
  { key: "skyline", name: "Joaquin Reyes", company: "Skyline Media", domain: "skylinemedia", jobTitle: "Studio Operations", stage: "proposal", dealValue: 26400, lastContact: -5, followUp: 0, owner: "tm-priya", source: "Event", notes: "Quotation sent; reviewing with finance.", created: -30 },
  { key: "kestrel", name: "Freya Lindqvist", company: "Kestrel Engineering", domain: "kestrelengineering", jobTitle: "Site Manager", stage: "proposal", dealValue: 33900, lastContact: -2, followUp: 3, owner: "tm-mei", source: "Partner", notes: "Wants phased delivery over two months.", created: -26 },
  { key: "bluepeak", name: "Daniel Cho", company: "Bluepeak Capital", domain: "bluepeakcapital", jobTitle: "Chief of Staff", stage: "proposal", dealValue: 19200, lastContact: -8, followUp: -3, owner: "tm-priya", source: "Outbound", notes: "Proposal is out; no reply yet.", created: -24 },
  // Negotiation
  { key: "solstice", name: "Mira Kapoor", company: "Solstice Biotech", domain: "solsticebio", jobTitle: "VP Operations", stage: "negotiation", dealValue: 48500, lastContact: -9, followUp: -2, owner: "tm-priya", source: "Partner", notes: "Largest open deal. Negotiating volume discount and delivery schedule.", created: -45 },
  { key: "ironwood", name: "Stefan Berg", company: "Ironwood Manufacturing", domain: "ironwoodmfg", jobTitle: "Plant Administrator", stage: "negotiation", dealValue: 38000, lastContact: -2, followUp: 1, owner: "tm-mei", source: "Event", notes: "Legal review of purchase terms.", created: -40 },
  { key: "coastal", name: "Beatriz Alves", company: "Coastal Care Network", domain: "coastalcare", jobTitle: "Procurement Manager", stage: "negotiation", dealValue: 29600, lastContact: -3, followUp: 2, owner: "tm-priya", source: "Referral", notes: "Comparing two suppliers; decision expected next week.", created: -36 },
  // Lost
  { key: "paperkite", name: "Liam O'Connor", company: "Paperkite Studio", domain: "paperkite", jobTitle: "Owner", stage: "lost", dealValue: 4200, lastContact: -33, followUp: null, owner: "tm-mei", source: "Website", notes: "Went with a local supplier on price.", created: -70 },
  { key: "granite", name: "Yusuf Demir", company: "Granite Row Capital", domain: "graniterow", jobTitle: "Operations Associate", stage: "lost", dealValue: 11000, lastContact: -41, followUp: null, owner: "tm-priya", source: "Outbound", notes: "Project postponed to next fiscal year.", created: -80 },
];

const contacts: Contact[] = contactSeeds.map((c, i) => ({
  id: `ctc-${pad(i + 1)}`,
  name: c.name,
  company: c.company,
  email: `${c.name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ +/g, ".")}@${c.domain}.example`,
  phone: `+1 555 01${pad(i + 10, 2)}`,
  jobTitle: c.jobTitle,
  stage: c.stage,
  dealValue: c.dealValue,
  lastContact: d(c.lastContact),
  followUpDate: c.followUp === null ? null : d(c.followUp),
  ownerId: c.owner,
  source: c.source,
  notes: c.notes,
  createdAt: d(c.created),
}));
const C = Object.fromEntries(contactSeeds.map((c, i) => [c.key, contacts[i]])) as Record<string, Contact>;

/* --------------------------------------------------------------- Orders --- */

const customerKeys = ["northbeam", "brightloop", "cedar", "helio", "fieldstone", "lumen", "orchard", "pixelforge", "harbor"];
const customerWeights = [5, 5, 3, 3, 2, 3, 3, 3, 2];
const paymentTerms: Record<string, number> = {
  northbeam: 30, brightloop: 30, cedar: 45, helio: 30, fieldstone: 30, lumen: 30, orchard: 30, pixelforge: 30, harbor: 45,
};
const salesReps = ["tm-priya", "tm-mei", "tm-jonas"];

const qtyRange: Record<ProductCategory, [number, number]> = {
  Furniture: [3, 12],
  Electronics: [4, 16],
  Accessories: [6, 28],
  Storage: [3, 9],
  Lighting: [5, 16],
};

function randomLines(): LineItem[] {
  const n = pickWeighted([1, 2, 3], [2, 5, 3]);
  const chosen = new Set<Product>();
  while (chosen.size < n) chosen.add(pick(products));
  return [...chosen].map((p) => {
    const [lo, hi] = qtyRange[p.category];
    return { productId: p.id, quantity: randInt(lo, hi), unitPrice: p.unitPrice };
  });
}

interface RawOrder {
  customerKey: string;
  date: string;
  status: OrderStatus;
  lines: LineItem[];
  quote?: string;
  rep: string;
  /** Force the generated invoice to stay unpaid (creates overdue receivables). */
  forceUnpaid?: boolean;
  noInvoice?: boolean;
}

const rawOrders: RawOrder[] = [];

/** Monthly revenue targets (USD) for the 11 months before the current one. */
const monthlyTargets = [48000, 51000, 49000, 56000, 60000, 58000, 66000, 72000, 79000, 84000, 92000];
const thisMonth = monthKey(DEMO_TODAY);

monthlyTargets.forEach((target, i) => {
  const key = shiftMonth(thisMonth, i - monthlyTargets.length);
  const days = daysInMonth(key);
  let revenue = 0;
  while (revenue < target * 0.985) {
    const customerKey = pickWeighted(customerKeys, customerWeights);
    const lines = randomLines();
    const date = `${key}-${pad(randInt(1, days), 2)}`;
    revenue += sumLines(lines);
    const status: OrderStatus = rand() < 0.035 ? "cancelled" : "delivered";
    rawOrders.push({ customerKey, date, status, lines, rep: pick(salesReps), noInvoice: status === "cancelled" });
  }
});

// Hand-written older orders whose invoices were never paid -> overdue receivables
// (kept explicit so the "needs attention" story is meaningful, not random)
const overdueLegacyOrders: RawOrder[] = [
  { customerKey: "pixelforge", date: d(-95), status: "delivered", lines: [lineOf("keyboard", 20), lineOf("mouse", 20), lineOf("headset", 10)], rep: "tm-mei", forceUnpaid: true },
  { customerKey: "fieldstone", date: d(-52), status: "delivered", lines: [lineOf("chair", 10), lineOf("cabinet", 8)], rep: "tm-jonas", forceUnpaid: true },
  { customerKey: "lumen", date: d(-41), status: "delivered", lines: [lineOf("stand", 20), lineOf("mouse", 20), lineOf("desk", 4)], rep: "tm-mei", forceUnpaid: true },
];
rawOrders.push(...overdueLegacyOrders);

// Current month: hand-written orders so the dashboard tells a clear story.
const currentMonthOrders: RawOrder[] = [
  { customerKey: "brightloop", date: d(-12), status: "delivered", lines: [lineOf("monitor", 8), lineOf("dock", 8), lineOf("arm", 8)], rep: "tm-mei" },
  { customerKey: "cedar", date: d(-11), status: "delivered", lines: [lineOf("desk", 4), lineOf("chair", 4), lineOf("lamp", 4)], rep: "tm-jonas" },
  { customerKey: "fieldstone", date: d(-9), status: "delivered", lines: [lineOf("cabinet", 6), lineOf("chair", 6)], rep: "tm-jonas" },
  { customerKey: "pixelforge", date: d(-8), status: "shipped", lines: [lineOf("keyboard", 12), lineOf("mouse", 12), lineOf("headset", 6)], rep: "tm-mei" },
  { customerKey: "northbeam", date: d(-6), status: "shipped", lines: [lineOf("desk", 6), lineOf("arm", 6), lineOf("monitor", 6)], rep: "tm-priya", quote: "northbeam" },
  { customerKey: "orchard", date: d(-5), status: "processing", lines: [lineOf("whiteboard", 4), lineOf("mat", 20), lineOf("cables", 30)], rep: "tm-priya" },
  { customerKey: "lumen", date: d(-3), status: "processing", lines: [lineOf("stand", 15), lineOf("mouse", 15), lineOf("keyboard", 15)], rep: "tm-mei" },
  { customerKey: "helio", date: d(-2), status: "pending", lines: [lineOf("monitor", 12), lineOf("dock", 12), lineOf("headset", 12)], rep: "tm-priya", quote: "helio", noInvoice: true },
  { customerKey: "harbor", date: d(-1), status: "pending", lines: [lineOf("chair", 5), lineOf("desk", 5)], rep: "tm-priya", quote: "harbor", noInvoice: true },
  { customerKey: "brightloop", date: d(0), status: "pending", lines: [lineOf("lamp", 10), lineOf("mat", 10)], rep: "tm-mei", noInvoice: true },
];
rawOrders.push(...currentMonthOrders);

// Number orders chronologically
rawOrders.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));

const orders: Order[] = [];
const invoices: Invoice[] = [];
const quotations: Quotation[] = [];

// Quotations that were accepted and converted into orders (ids reserved first)
const quoteForOrder = new Map<RawOrder, string>();
rawOrders.forEach((raw) => {
  if (raw.quote) quoteForOrder.set(raw, `quo-${pad(quoteForOrder.size + 1)}`);
});

rawOrders.forEach((raw, i) => {
  const customer = C[raw.customerKey];
  const id = `ord-${pad(i + 1)}`;
  const order: Order = {
    id,
    number: `ORD-${1001 + i}`,
    customerId: customer.id,
    date: raw.date,
    status: raw.status,
    lines: raw.lines,
    total: sumLines(raw.lines),
    invoiceId: null,
    quotationId: quoteForOrder.get(raw) ?? null,
    createdById: raw.rep,
    notes: "",
  };
  orders.push(order);

  if (raw.noInvoice) return;
  const issueDate = addDays(raw.date, randInt(0, 2) > 1 ? 1 : 0);
  if (diffDays(issueDate, DEMO_TODAY) > 0) return;
  const terms = paymentTerms[raw.customerKey];
  const dueDate = addDays(issueDate, terms);
  let paidDate: string | null = addDays(issueDate, Math.max(6, terms + randInt(-14, 10)));
  if (raw.forceUnpaid || diffDays(paidDate, DEMO_TODAY) > 0) paidDate = null;
  const inv: Invoice = {
    id: `inv-${pad(invoices.length + 1)}`,
    number: `INV-${2001 + invoices.length}`,
    customerId: customer.id,
    orderId: id,
    issueDate,
    dueDate,
    amount: order.total,
    status: paidDate ? "paid" : "unpaid",
    paidDate,
  };
  invoices.push(inv);
  order.invoiceId = inv.id;
});

// Customers' "deal value" = lifetime sales to date (excluding cancelled orders)
for (const key of customerKeys) {
  const c = C[key];
  c.dealValue = orders.filter((o) => o.customerId === c.id && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
}

/* ------------------------------------------------------------ Quotations -- */

const orderByQuote = new Map<string, Order>();
orders.forEach((o) => o.quotationId && orderByQuote.set(o.quotationId, o));

const quoteSeeds: {
  customerKey: string;
  daysAgo: number;
  validDays: number;
  status: Quotation["status"];
  lines: LineItem[];
}[] = [
  { customerKey: "northbeam", daysAgo: 20, validDays: 30, status: "accepted", lines: [] },
  { customerKey: "helio", daysAgo: 12, validDays: 30, status: "accepted", lines: [] },
  { customerKey: "harbor", daysAgo: 9, validDays: 30, status: "accepted", lines: [] },
  { customerKey: "solstice", daysAgo: 16, validDays: 30, status: "sent", lines: [lineOf("desk", 30), lineOf("monitor", 20), lineOf("arm", 20)] },
  { customerKey: "skyline", daysAgo: 6, validDays: 30, status: "sent", lines: [lineOf("desk", 12), lineOf("lamp", 12), lineOf("mat", 20)] },
  { customerKey: "kestrel", daysAgo: 3, validDays: 21, status: "sent", lines: [lineOf("monitor", 15), lineOf("keyboard", 15), lineOf("mouse", 15)] },
  { customerKey: "ironwood", daysAgo: 11, validDays: 30, status: "sent", lines: [lineOf("cabinet", 10), lineOf("drawer", 10), lineOf("whiteboard", 4)] },
  { customerKey: "bluepeak", daysAgo: 8, validDays: 21, status: "sent", lines: [lineOf("chair", 6), lineOf("desk", 6)] },
  { customerKey: "atlas", daysAgo: 1, validDays: 30, status: "draft", lines: [lineOf("desk", 10), lineOf("arm", 10), lineOf("monitor", 8)] },
  { customerKey: "orchard", daysAgo: 4, validDays: 30, status: "draft", lines: [lineOf("headset", 12), lineOf("lamp", 10)] },
  { customerKey: "paperkite", daysAgo: 52, validDays: 30, status: "declined", lines: [lineOf("desk", 6), lineOf("chair", 6)] },
  { customerKey: "granite", daysAgo: 63, validDays: 30, status: "expired", lines: [lineOf("cabinet", 12), lineOf("drawer", 12)] },
];

quoteSeeds.forEach((q, i) => {
  const customer = C[q.customerKey];
  const quoteId = `quo-${pad(i + 1)}`;
  const linkedOrder = orderByQuote.get(quoteId);
  const lines = linkedOrder ? linkedOrder.lines : q.lines;
  const date = d(-q.daysAgo);
  quotations.push({
    id: quoteId,
    number: `QUO-${3001 + i}`,
    customerId: customer.id,
    date,
    validUntil: addDays(date, q.validDays),
    status: q.status,
    lines,
    total: sumLines(lines),
    orderId: linkedOrder?.id ?? null,
  });
});

/* ------------------------------------------------------------- Expenses --- */

const expenses: Expense[] = [];
const monthRevenue = new Map<string, number>();
for (const o of orders) {
  if (o.status === "cancelled") continue;
  const k = monthKey(o.date);
  monthRevenue.set(k, (monthRevenue.get(k) ?? 0) + o.total);
}
const suppliers = ["Kestrel Furnishings", "Pacific Components", "Northgate Distribution", "Harbor Storage Systems", "Lumina Supply"];
const addExpense = (date: string, category: ExpenseCategory, vendor: string, description: string, amount: number) => {
  if (diffDays(date, DEMO_TODAY) > 0 || amount <= 0) return;
  expenses.push({ id: "", date, category, vendor, description, amount: Math.round(amount) });
};

for (let m = -11; m <= 0; m++) {
  const key = shiftMonth(thisMonth, m);
  const rev = monthRevenue.get(key) ?? 0;
  const days = daysInMonth(key);
  addExpense(`${key}-01`, "Rent & utilities", "Foundry Row Offices", "Office and warehouse rent", 3200);
  addExpense(`${key}-${pad(Math.min(days, 12), 2)}`, "Rent & utilities", "Grid & Water Utilities", "Utilities", 380 + randInt(0, 70));
  addExpense(`${key}-${pad(Math.min(days, 28), 2)}`, "Payroll", "Payroll run", "Monthly payroll (illustrative)", 14500 + Math.max(0, m + 11) * 90);
  addExpense(`${key}-03`, "Software", "Workspace tools", "Team software subscriptions", 780);
  const purchases = Math.round(rev * (0.4 + rand() * 0.05));
  const parts = 3;
  for (let p = 0; p < parts; p++) {
    addExpense(`${key}-${pad(Math.min(days, 5 + p * 9 + randInt(0, 2)), 2)}`, "Inventory purchases", pick(suppliers), `Stock replenishment (${["Q", "R", "S"][p]}-batch)`, purchases / parts);
  }
  addExpense(`${key}-${pad(Math.min(days, 10), 2)}`, "Shipping", "SwiftFreight", "Freight & delivery", rev * (0.02 + rand() * 0.008));
  addExpense(`${key}-${pad(Math.min(days, 24), 2)}`, "Shipping", "ParcelPoint", "Parcel deliveries", rev * (0.012 + rand() * 0.008));
  addExpense(`${key}-${pad(Math.min(days, 8), 2)}`, "Marketing", pick(["Signal Ads", "Brandlane Studio", "Trade Show Co."]), "Campaigns & events", 1500 + randInt(0, 1800));
}
expenses.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? -1 : 1));
expenses.forEach((e, i) => {
  e.id = `exp-${pad(i + 1)}`;
});

/* ------------------------------------------------------------- Projects --- */

const projects: Project[] = [
  { id: "prj-001", name: "Brightloop onboarding", customerId: C.brightloop.id, ownerId: "tm-jonas", status: "active" },
  { id: "prj-002", name: "Northbeam office fit-out", customerId: C.northbeam.id, ownerId: "tm-daniel", status: "active" },
  { id: "prj-003", name: "Q4 inventory restock", customerId: null, ownerId: "tm-daniel", status: "active" },
  { id: "prj-004", name: "Helio Robotics second-site rollout", customerId: C.helio.id, ownerId: "tm-mei", status: "planning" },
  { id: "prj-005", name: "Catalog & pricing refresh", customerId: null, ownerId: "tm-priya", status: "active" },
  { id: "prj-006", name: "Receivables & month-end close", customerId: null, ownerId: "tm-sofia", status: "active" },
  { id: "prj-007", name: "Sales follow-ups", customerId: null, ownerId: "tm-priya", status: "active" },
];

interface TaskSeed {
  title: string;
  project: string;
  assignee: string;
  status: Task["status"];
  priority: Task["priority"];
  due: number;
  completed?: number;
}

const taskSeeds: TaskSeed[] = [
  { title: "Reorder Ergonomic Chair Pro from Kestrel Furnishings", project: "prj-003", assignee: "tm-daniel", status: "todo", priority: "high", due: -1 },
  { title: "Confirm USB-C dock delivery window with Pacific Components", project: "prj-003", assignee: "tm-daniel", status: "in_progress", priority: "high", due: 0 },
  { title: "Request quote for HD Webcam restock", project: "prj-003", assignee: "tm-daniel", status: "todo", priority: "medium", due: 2 },
  { title: "Cycle count: laptop stands and desk mats", project: "prj-003", assignee: "tm-daniel", status: "todo", priority: "low", due: 6 },
  { title: "Send payment reminder to Fieldstone Legal", project: "prj-006", assignee: "tm-sofia", status: "in_progress", priority: "high", due: -2 },
  { title: "Reconcile September supplier invoices", project: "prj-006", assignee: "tm-sofia", status: "done", priority: "medium", due: -6, completed: -7 },
  { title: "Review outstanding receivables with Alex", project: "prj-006", assignee: "tm-sofia", status: "todo", priority: "medium", due: 0 },
  { title: "Prepare October expense summary", project: "prj-006", assignee: "tm-sofia", status: "todo", priority: "low", due: 14 },
  { title: "Follow up with Solstice Biotech on volume discount", project: "prj-007", assignee: "tm-priya", status: "todo", priority: "high", due: 0 },
  { title: "Call Verdant Foods about walkthrough", project: "prj-007", assignee: "tm-mei", status: "todo", priority: "medium", due: -1 },
  { title: "Send revised proposal to Bluepeak Capital", project: "prj-007", assignee: "tm-priya", status: "in_progress", priority: "medium", due: 1 },
  { title: "Book site visit with Atlas Mobility", project: "prj-007", assignee: "tm-mei", status: "todo", priority: "low", due: 4 },
  { title: "Kick-off call with Brightloop team", project: "prj-001", assignee: "tm-jonas", status: "done", priority: "high", due: -10, completed: -10 },
  { title: "Set up delivery schedule for Brightloop", project: "prj-001", assignee: "tm-jonas", status: "in_progress", priority: "medium", due: 3 },
  { title: "Collect floor plans from Brightloop", project: "prj-001", assignee: "tm-jonas", status: "todo", priority: "medium", due: -3 },
  { title: "Send onboarding checklist to Brightloop", project: "prj-001", assignee: "tm-jonas", status: "done", priority: "low", due: -9, completed: -9 },
  { title: "Finalize layout plan for Northbeam fit-out", project: "prj-002", assignee: "tm-daniel", status: "in_progress", priority: "high", due: 2 },
  { title: "Schedule installation crew", project: "prj-002", assignee: "tm-daniel", status: "todo", priority: "medium", due: 5 },
  { title: "Confirm furniture delivery with Northbeam", project: "prj-002", assignee: "tm-jonas", status: "done", priority: "medium", due: -4, completed: -5 },
  { title: "Draft pilot scope for Helio second site", project: "prj-004", assignee: "tm-mei", status: "in_progress", priority: "medium", due: 4 },
  { title: "Share rollout timeline with Helio", project: "prj-004", assignee: "tm-mei", status: "todo", priority: "low", due: 8 },
  { title: "Update Q4 price list", project: "prj-005", assignee: "tm-priya", status: "done", priority: "high", due: -8, completed: -8 },
  { title: "Publish refreshed product catalog", project: "prj-005", assignee: "tm-priya", status: "in_progress", priority: "medium", due: 0 },
  { title: "Review supplier cost changes", project: "prj-005", assignee: "tm-sofia", status: "done", priority: "medium", due: -12, completed: -11 },
  { title: "Audit slow-moving SKUs", project: "prj-005", assignee: "tm-daniel", status: "todo", priority: "low", due: 10 },
  { title: "Approve Q4 supplier purchase orders", project: "prj-003", assignee: "tm-alex", status: "todo", priority: "high", due: 1 },
];

const tasks: Task[] = taskSeeds.map((t, i) => ({
  id: `tsk-${pad(i + 1)}`,
  title: t.title,
  projectId: t.project,
  assigneeId: t.assignee,
  status: t.status,
  priority: t.priority,
  dueDate: d(t.due),
  completedDate: t.status === "done" ? d(t.completed ?? t.due) : null,
}));

/* ----------------------------------------------------------- Activities --- */

const customerName = (id: string) => contacts.find((c) => c.id === id)?.company ?? "customer";
const activities: Activity[] = [];
const recentOrders = [...orders].filter((o) => diffDays(DEMO_TODAY, o.date) <= 4).reverse();
recentOrders.forEach((o, i) => {
  activities.push({
    id: "",
    at: `${o.date}T${pad(16 - i * 2, 2)}:${pad(10 + i * 7, 2)}`,
    kind: "order",
    message: `Order ${o.number} placed by ${customerName(o.customerId)}`,
    actorId: o.createdById,
    href: "/demo/orders",
  });
});
invoices
  .filter((i) => i.paidDate && diffDays(DEMO_TODAY, i.paidDate) <= 5)
  .slice(-3)
  .forEach((i, idx) => {
    activities.push({
      id: "",
      at: `${i.paidDate}T${pad(11 + idx, 2)}:${pad(20 + idx * 9, 2)}`,
      kind: "payment",
      message: `Payment recorded for ${i.number} (${customerName(i.customerId)})`,
      actorId: "tm-sofia",
      href: "/demo/finance",
    });
  });
activities.push(
  { id: "", at: `${d(-1)}T15:40`, kind: "contact", message: "Call logged with Isabel Costa (Harbor & Vale Consulting)", actorId: "tm-priya", href: "/demo/crm" },
  { id: "", at: `${d(-2)}T10:05`, kind: "quotation", message: "Quotation sent to Kestrel Engineering", actorId: "tm-mei", href: "/demo/sales" },
  { id: "", at: `${d(-1)}T09:15`, kind: "inventory", message: "Stock alert: HD Webcam is out of stock", actorId: null, href: "/demo/inventory" },
  { id: "", at: `${d(0)}T08:30`, kind: "task", message: "Task started: Publish refreshed product catalog", actorId: "tm-priya", href: "/demo/projects" },
);
activities.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
activities.splice(14);
activities.forEach((a, i) => {
  a.id = `act-${pad(activities.length - i)}`;
});

/* --------------------------------------------------------------- Export -- */

export const SEED_DATA: DemoData = {
  team,
  contacts,
  products,
  orders,
  quotations,
  invoices,
  expenses,
  projects,
  tasks,
  activities,
};
