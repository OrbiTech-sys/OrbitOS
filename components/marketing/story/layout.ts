/**
 * Art-direction tables for the pain-to-solution story.
 *
 * The scene is drawn on a fixed logical canvas and scaled to the container, so
 * it stays crisp and keeps its composition at any width. Two compositions exist:
 * `wide` (desktop/tablet) and `tall` (phones).
 */

export type Variant = "wide" | "tall";
export type CardId = "sheet" | "crm" | "invoice" | "inventory" | "notif";

export interface Pos {
  x: number;
  y: number;
  r?: number;
}

export interface StoryLayout {
  canvas: { w: number; h: number };
  frame: { x: number; y: number; w: number; h: number };
  card: { w: number; h: number };
  scattered: Record<CardId, Pos>;
  hub: Record<CardId, Pos>;
  hubCenter: { x: number; y: number };
  /** Transform applied to the connected group during the AI scene. */
  group: { s: number; x: number; y: number };
  copilot: { x: number; y: number; w: number; h: number };
  dash: {
    kpi: { x: number; y: number; w: number; h: number; cols: number; gap: number };
    chart: { x: number; y: number; w: number; h: number };
    tasks: { x: number; y: number; w: number; h: number };
    modules: { x: number; y: number; w: number };
    title: { x: number; y: number };
  };
  fragments: { x: number; y: number; label: string; tone: "red" | "amber" | "slate" | "indigo"; delay: number }[];
}

export const CARD_ORDER: CardId[] = ["sheet", "crm", "invoice", "inventory", "notif"];

export const LAYOUTS: Record<Variant, StoryLayout> = {
  wide: {
    canvas: { w: 880, h: 520 },
    frame: { x: 36, y: 26, w: 808, h: 468 },
    card: { w: 196, h: 100 },
    scattered: {
      sheet: { x: 44, y: 50, r: -3 },
      crm: { x: 336, y: 24, r: 2 },
      invoice: { x: 628, y: 62, r: -2.5 },
      inventory: { x: 96, y: 300, r: 2.5 },
      notif: { x: 452, y: 330, r: -1.5 },
    },
    hub: {
      crm: { x: 96, y: 96 },
      sheet: { x: 588, y: 96 },
      inventory: { x: 96, y: 284 },
      invoice: { x: 588, y: 284 },
      notif: { x: 342, y: 384 },
    },
    hubCenter: { x: 440, y: 240 },
    group: { s: 0.58, x: 14, y: 62 },
    copilot: { x: 488, y: 78, w: 340, h: 394 },
    dash: {
      title: { x: 64, y: 78 },
      kpi: { x: 64, y: 110, w: 176, h: 80, cols: 4, gap: 14 },
      chart: { x: 64, y: 206, w: 482, h: 204 },
      tasks: { x: 560, y: 206, w: 250, h: 204 },
      modules: { x: 64, y: 430, w: 746 },
    },
    fragments: [
      { x: 282, y: 176, label: "$4,200?", tone: "amber", delay: 0.2 },
      { x: 572, y: 214, label: "#REF!", tone: "red", delay: 0.5 },
      { x: 360, y: 238, label: "Follow up?", tone: "amber", delay: 0.8 },
      { x: 236, y: 266, label: "v3_final(2)", tone: "slate", delay: 0.35 },
      { x: 700, y: 300, label: "unpaid?", tone: "red", delay: 0.65 },
      { x: 326, y: 458, label: "SKU-204: 7?", tone: "indigo", delay: 0.95 },
      { x: 700, y: 440, label: "12 unread", tone: "slate", delay: 0.5 },
    ],
  },
  tall: {
    canvas: { w: 400, h: 560 },
    frame: { x: 8, y: 8, w: 384, h: 544 },
    card: { w: 168, h: 92 },
    scattered: {
      sheet: { x: 14, y: 36, r: -3 },
      crm: { x: 216, y: 24, r: 2.5 },
      invoice: { x: 206, y: 206, r: -2 },
      inventory: { x: 18, y: 190, r: 2 },
      notif: { x: 116, y: 392, r: -1.5 },
    },
    hub: {
      crm: { x: 24, y: 76 },
      sheet: { x: 208, y: 76 },
      inventory: { x: 24, y: 246 },
      invoice: { x: 208, y: 246 },
      notif: { x: 116, y: 352 },
    },
    hubCenter: { x: 200, y: 200 },
    group: { s: 0.42, x: 116, y: 16 },
    copilot: { x: 22, y: 214, w: 356, h: 328 },
    dash: {
      title: { x: 24, y: 56 },
      kpi: { x: 24, y: 84, w: 168, h: 78, cols: 2, gap: 16 },
      chart: { x: 24, y: 264, w: 352, h: 116 },
      tasks: { x: 24, y: 392, w: 352, h: 92 },
      modules: { x: 24, y: 500, w: 352 },
    },
    fragments: [
      { x: 188, y: 148, label: "$4,200?", tone: "amber", delay: 0.2 },
      { x: 20, y: 296, label: "v3_final(2)", tone: "slate", delay: 0.35 },
      { x: 300, y: 150, label: "#REF!", tone: "red", delay: 0.5 },
      { x: 292, y: 330, label: "unpaid?", tone: "red", delay: 0.65 },
      { x: 30, y: 490, label: "SKU-204: 7?", tone: "indigo", delay: 0.95 },
      { x: 270, y: 484, label: "12 unread", tone: "slate", delay: 0.5 },
    ],
  },
};

/** Scene timings in ms. Total ≈ 14 s. */
export const SCENES = [
  { id: "fragmented", label: "Fragmented", duration: 3400, caption: "Your business is growing. Your workload shouldn't grow with it." },
  { id: "connected", label: "Connected", duration: 3400, caption: "One connected workspace. Fewer disconnected tasks." },
  { id: "assist", label: "AI assistance", duration: 4200, caption: "Know what needs attention. Know what to do next." },
  { id: "clarity", label: "Clarity", duration: 3000, caption: "Less busywork. More control. Better decisions." },
] as const;

export const TOTAL_MS = SCENES.reduce((sum, s) => sum + s.duration, 0);
