// Website content self-test:  npm run test:content
//
// No database needed. Proves the built-in content is valid, that a bad save can't break
// the site, and that hiding or removing something leaves nothing pointing at it.
import { DEFAULT_CONTENT } from "../../lib/content/defaults";
import { contentFromRows } from "../../lib/content/merge";
import { bySlug, publishedContent } from "../../lib/content/published";
import { SECTION_KEYS, SECTION_SCHEMAS, isSafeHref, pricingSchema, type SectionKey } from "../../lib/content/schema";
import { SECTIONS } from "../../components/admin/website/definitions";

let failures = 0;
function check(cond: unknown, label: string, detail = "") {
  console.log(`  ${cond ? "✔" : "✖"} ${label}${!cond && detail ? ` -> ${detail}` : ""}`);
  if (!cond) failures++;
}
const section = (title: string) => console.log(`\n${title}`);

section("Built-in content");
for (const key of SECTION_KEYS) {
  const parsed = SECTION_SCHEMAS[key].safeParse(DEFAULT_CONTENT[key]);
  check(parsed.success, `The default "${key}" section is valid`, parsed.success ? "" : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
}

const slugs = new Set(DEFAULT_CONTENT.modules.map((m) => m.slug));
const broken = [...DEFAULT_CONTENT.solutions, ...DEFAULT_CONTENT.industries].flatMap((item) => item.modules.filter((slug) => !slugs.has(slug)));
check(broken.length === 0, "Every solution and industry points at a module that exists", broken.join(", "));
const tierIds = new Set(DEFAULT_CONTENT.pricing.tiers.map((t) => t.id));
check(DEFAULT_CONTENT.pricing.comparison.every((row) => row.included.every((id) => tierIds.has(id))), "The comparison table only refers to plans that exist");
check(!JSON.stringify(DEFAULT_CONTENT).match(/proof of concept|proof-of-concept|pretend|placeholder name/i), "Nothing still calls the product a proof of concept");
check(DEFAULT_CONTENT.brand.company === "The OrbiTech Solution", "The company is The OrbiTech Solution");

section("Links");
for (const good of ["/pricing", "/#faq", "#how-it-works", "https://example.com/x", "mailto:hello@example.com", "tel:+15550100"]) check(isSafeHref(good), `Allows ${good}`);
for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.example", "vbscript:x", "file:///etc/passwd", "https://a b"]) check(!isSafeHref(bad), `Refuses ${bad}`);

section("What the editor may save");
const pricing = structuredClone(DEFAULT_CONTENT.pricing);
pricing.tiers[0].price = "PKR 5,000";
check(pricingSchema.safeParse(pricing).success, "A price can be any text, such as PKR 5,000");

const dangerous = structuredClone(DEFAULT_CONTENT.pricing);
dangerous.tiers[0].ctaHref = "javascript:alert(document.cookie)";
check(!pricingSchema.safeParse(dangerous).success, "A button can't be pointed at a script");

const emptied = structuredClone(DEFAULT_CONTENT.pricing);
emptied.tiers[0].price = "   ";
check(!pricingSchema.safeParse(emptied).success, "A plan can't be saved with no price");

const twins = structuredClone(DEFAULT_CONTENT.pricing);
twins.tiers[1].id = twins.tiers[0].id;
check(!pricingSchema.safeParse(twins).success, "Two plans can't share an id");

const clash = structuredClone(DEFAULT_CONTENT.modules);
clash[1].slug = clash[0].slug;
check(!SECTION_SCHEMAS.modules.safeParse(clash).success, "Two modules can't share a page address");

const unsafeSlug = structuredClone(DEFAULT_CONTENT.modules);
unsafeSlug[0].slug = "../../etc";
check(!SECTION_SCHEMAS.modules.safeParse(unsafeSlug).success, "A page address can't contain path tricks");

const blanks = structuredClone(DEFAULT_CONTENT.pricing);
blanks.tiers[0].features = ["One", "", "  ", "Two"];
const cleaned = pricingSchema.safeParse(blanks);
check(cleaned.success && cleaned.data.tiers[0].features.join() === "One,Two", "Blank lines in a list are dropped, not refused");

const navNoLink = structuredClone(DEFAULT_CONTENT.nav);
navNoLink.items[2].href = "";
check(!SECTION_SCHEMAS.nav.safeParse(navNoLink).success, "A menu link needs somewhere to go");
check(SECTION_SCHEMAS.nav.safeParse(DEFAULT_CONTENT.nav).success, "...but a drop-down menu doesn't");

section("A bad save can't break the site");
let reported = "";
const loaded = contentFromRows(
  [
    { key: "pricing", data: { nonsense: true } },
    { key: "unknown_section", data: {} },
    { key: "brand", data: { ...DEFAULT_CONTENT.brand, productName: "Renamed" } },
  ],
  (key) => (reported = key),
);
check(loaded.pricing === DEFAULT_CONTENT.pricing && reported === "pricing", "An invalid section falls back to its default, and is reported");
check(loaded.brand.productName === "Renamed", "A valid section is used");
check(loaded.modules === DEFAULT_CONTENT.modules, "A section with no row uses its default");

section("Hiding things");
const edited = structuredClone(DEFAULT_CONTENT);
edited.modules.find((m) => m.slug === "crm")!.visible = false;
edited.solutions[1].visible = false;
edited.industries[0].visible = false;
edited.nav.items.find((i) => i.id === "pricing")!.visible = false;
edited.pricing.tiers.find((t) => t.id === "starter")!.visible = false;
edited.resources.items[0].visible = false;
const live = publishedContent(edited);

check(!bySlug(live.modules, "crm"), "A hidden module is gone");
check(!live.solutions.some((s) => s.modules.includes("crm")) && !live.industries.some((i) => i.modules.includes("crm")), "...and nothing still points at it");
check(!bySlug(live.solutions, DEFAULT_CONTENT.solutions[1].slug) && !bySlug(live.industries, DEFAULT_CONTENT.industries[0].slug), "Hidden solutions and industries are gone");
check(!live.nav.items.some((i) => i.id === "pricing"), "A hidden menu item is gone");
check(!live.pricing.tiers.some((t) => t.id === "starter") && !live.pricing.comparison.some((r) => r.included.includes("starter")), "A hidden plan leaves the plans and the comparison table");
check(live.resources.items.length === DEFAULT_CONTENT.resources.items.length - 1, "A hidden resource is gone");
check(publishedContent(DEFAULT_CONTENT).modules.length === DEFAULT_CONTENT.modules.length, "Nothing is hidden by default");

section("The editor covers everything");
const editable = new Set(SECTIONS.map((s) => s.key));
const missing = SECTION_KEYS.filter((key: SectionKey) => !editable.has(key));
check(missing.length === 0, "Every section of the website has an editing form", missing.join(", "));

/** Every key in the stored shape should have a field, or the editor would silently keep old values. */
function uncovered(value: unknown, fields: { key: string; type: string; fields?: unknown }[], path: string): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const known = new Map(fields.map((f) => [f.key, f]));
  return Object.entries(value).flatMap(([key, child]) => {
    const field = known.get(key);
    if (!field) return ["id", "kind"].includes(key) ? [] : [`${path}.${key}`];
    if (field.type === "group") return uncovered(child, field.fields as typeof fields, `${path}.${key}`);
    if (field.type === "list" && Array.isArray(child)) return child.flatMap((item, i) => uncovered(item, field.fields as typeof fields, `${path}.${key}.${i}`));
    return [];
  });
}
const gaps = SECTIONS.flatMap((s) => {
  const value = DEFAULT_CONTENT[s.key];
  if (s.list) return (value as unknown[]).flatMap((item, i) => uncovered(item, s.list!.fields, `${s.key}.${i}`));
  return uncovered(value, s.fields ?? [], s.key);
});
check(gaps.length === 0, "Every stored field can be edited", gaps.slice(0, 8).join(", "));

console.log(failures ? `\n✖ ${failures} check(s) failed.\n` : "\n✔ Website content behaves as designed.\n");
process.exit(failures ? 1 : 0);
