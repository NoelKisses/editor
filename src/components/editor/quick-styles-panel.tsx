"use client";

import { useCallback, useState } from "react";
import { Wand2, Plus } from "lucide-react";
import { toast } from "sonner";

interface QuickStylesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type StyleCategory = "badges" | "titles" | "quotes" | "labels" | "callouts" | "overlays";

interface QuickStyle {
  id: string;
  label: string;
  category: StyleCategory;
  preview: { bg: string; text: string; border?: string; shadow?: boolean };
  create: (fabric: unknown, cx: number, cy: number) => unknown;
}

const STYLE_CATEGORIES: { value: StyleCategory; label: string }[] = [
  { value: "badges", label: "Badges" },
  { value: "titles", label: "Títulos" },
  { value: "quotes", label: "Citações" },
  { value: "labels", label: "Labels" },
  { value: "callouts", label: "Callouts" },
  { value: "overlays", label: "Overlays" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeBadge(fabric: any, text: string, bg: string, textColor: string, rounded: number) {
  const txt = new fabric.IText(text, {
    fontSize: 14, fontFamily: "Arial", fontWeight: "bold",
    fill: textColor, originX: "center", originY: "center",
    left: 60, top: 20, selectable: false, evented: false,
  });
  const rect = new fabric.Rect({
    width: 120, height: 40, rx: rounded, ry: rounded,
    fill: bg, originX: "center", originY: "center",
    left: 60, top: 20, selectable: false, evented: false,
  });
  return new fabric.Group([rect, txt], { left: 100, top: 100, selectable: true, evented: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeTitle(fabric: any, title: string, sub: string, titleColor: string, subColor: string, underlineColor?: string) {
  const titleText = new fabric.IText(title, {
    fontSize: 32, fontFamily: "Georgia", fontWeight: "bold",
    fill: titleColor, left: 0, top: 0, selectable: false, evented: false,
  });
  const objects: unknown[] = [titleText];
  if (underlineColor) {
    const line = new fabric.Rect({ width: 60, height: 4, fill: underlineColor, rx: 2, left: 0, top: 38, selectable: false, evented: false });
    objects.push(line);
  }
  if (sub) {
    const subText = new fabric.IText(sub, {
      fontSize: 16, fontFamily: "Arial", fill: subColor,
      left: 0, top: underlineColor ? 50 : 40, selectable: false, evented: false,
    });
    objects.push(subText);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (fabric as any).Group(objects as any[], { left: 80, top: 80, selectable: true, evented: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeQuote(fabric: any, quote: string, author: string, accentColor: string) {
  const mark = new fabric.IText('"', { fontSize: 64, fontFamily: "Georgia", fill: accentColor, left: 0, top: -20, opacity: 0.6, selectable: false, evented: false });
  const text = new fabric.IText(quote, { fontSize: 18, fontFamily: "Georgia", fontStyle: "italic", fill: "#ffffff", left: 30, top: 20, width: 260, selectable: false, evented: false });
  const dash = new fabric.Rect({ width: 30, height: 2, fill: accentColor, left: 30, top: 90, selectable: false, evented: false });
  const auth = new fabric.IText(author, { fontSize: 12, fontFamily: "Arial", fill: accentColor, left: 68, top: 84, selectable: false, evented: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (fabric as any).Group([mark, text, dash, auth] as any[], { left: 80, top: 80, selectable: true, evented: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCallout(fabric: any, text: string, bg: string, textColor: string) {
  const rect = new fabric.Rect({ width: 200, height: 60, rx: 8, fill: bg, left: 0, top: 0, selectable: false, evented: false });
  const arrow = new fabric.Triangle({ width: 20, height: 16, fill: bg, left: 30, top: 55, selectable: false, evented: false });
  const txt = new fabric.IText(text, { fontSize: 14, fontFamily: "Arial", fill: textColor, left: 100, top: 30, originX: "center", originY: "center", selectable: false, evented: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (fabric as any).Group([rect, arrow, txt] as any[], { left: 80, top: 80, selectable: true, evented: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeLabel(fabric: any, text: string, bg: string, textColor: string, borderColor?: string) {
  const rect = new fabric.Rect({
    width: 120, height: 36, rx: 4, fill: bg,
    stroke: borderColor ?? "transparent", strokeWidth: borderColor ? 2 : 0,
    selectable: false, evented: false,
  });
  const txt = new fabric.IText(text, { fontSize: 13, fontFamily: "Arial", fontWeight: "bold", fill: textColor, left: 60, top: 18, originX: "center", originY: "center", selectable: false, evented: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (fabric as any).Group([rect, txt] as any[], { left: 100, top: 100, selectable: true, evented: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeOverlay(fabric: any, text: string, overlayBg: string, textColor: string) {
  const rect = new fabric.Rect({ width: 300, height: 80, fill: overlayBg, selectable: false, evented: false });
  const txt = new fabric.IText(text, { fontSize: 20, fontFamily: "Arial", fontWeight: "bold", fill: textColor, left: 150, top: 40, originX: "center", originY: "center", selectable: false, evented: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (fabric as any).Group([rect, txt] as any[], { left: 60, top: 100, selectable: true, evented: true });
}

const QUICK_STYLES: QuickStyle[] = [
  // Badges
  { id: "badge-primary", label: "Badge Primário", category: "badges",
    preview: { bg: "#6366f1", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeBadge(f, "NOVO", "#6366f1", "#ffffff", 20) },
  { id: "badge-success", label: "Badge Verde", category: "badges",
    preview: { bg: "#22c55e", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeBadge(f, "✓ ATIVO", "#22c55e", "#ffffff", 20) },
  { id: "badge-danger", label: "Badge Vermelho", category: "badges",
    preview: { bg: "#ef4444", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeBadge(f, "URGENTE", "#ef4444", "#ffffff", 4) },
  { id: "badge-gold", label: "Badge Dourado", category: "badges",
    preview: { bg: "#d97706", text: "#000000" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeBadge(f, "★ PRO", "#d97706", "#000000", 20) },
  { id: "badge-outline", label: "Badge Outline", category: "badges",
    preview: { bg: "transparent", text: "#6366f1", border: "#6366f1" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeBadge(f, "DEMO", "transparent", "#6366f1", 20) },
  { id: "badge-dark", label: "Badge Escuro", category: "badges",
    preview: { bg: "#1f2937", text: "#f9fafb" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeBadge(f, "BETA", "#1f2937", "#f9fafb", 6) },

  // Titles
  { id: "title-hero", label: "Título Hero", category: "titles",
    preview: { bg: "#6366f1", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeTitle(f, "TÍTULO PRINCIPAL", "Subtítulo da sua thumbnail", "#ffffff", "#94a3b8", "#6366f1") },
  { id: "title-minimal", label: "Título Minimal", category: "titles",
    preview: { bg: "transparent", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeTitle(f, "Título Limpo", "descrição simples", "#ffffff", "#9ca3af") },
  { id: "title-bold", label: "Título Negrito", category: "titles",
    preview: { bg: "#ef4444", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeTitle(f, "IMPACTO", "subtítulo de destaque", "#ef4444", "#ffffff") },

  // Quotes
  { id: "quote-blue", label: "Citação Azul", category: "quotes",
    preview: { bg: "#1e3a5f", text: "#3b82f6" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeQuote(f, "Insira sua citação aqui", "— Autor", "#3b82f6") },
  { id: "quote-gold", label: "Citação Dourada", category: "quotes",
    preview: { bg: "#451a03", text: "#d97706" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeQuote(f, "Uma frase inspiradora", "— Nome", "#d97706") },

  // Labels
  { id: "label-pill", label: "Label Pill", category: "labels",
    preview: { bg: "#1f2937", text: "#6366f1" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeLabel(f, "CATEGORIA", "#1f2937", "#6366f1", "#6366f1") },
  { id: "label-filled", label: "Label Sólida", category: "labels",
    preview: { bg: "#6366f1", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeLabel(f, "DESTAQUE", "#6366f1", "#ffffff") },

  // Callouts
  { id: "callout-dark", label: "Callout Escuro", category: "callouts",
    preview: { bg: "#1f2937", text: "#f9fafb" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeCallout(f, "Mensagem importante aqui", "#1f2937", "#f9fafb") },
  { id: "callout-primary", label: "Callout Primário", category: "callouts",
    preview: { bg: "#6366f1", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeCallout(f, "Dica ou destaque", "#6366f1", "#ffffff") },

  // Overlays
  { id: "overlay-bottom", label: "Overlay Inferior", category: "overlays",
    preview: { bg: "rgba(0,0,0,0.7)", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeOverlay(f, "Legenda ou Título", "rgba(0,0,0,0.7)", "#ffffff") },
  { id: "overlay-gradient", label: "Overlay Gradiente", category: "overlays",
    preview: { bg: "#6366f1", text: "#ffffff" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: (f: any) => makeOverlay(f, "Banner Overlay", "rgba(99,102,241,0.85)", "#ffffff") },
];

export function QuickStylesPanel({ fabricCanvas }: QuickStylesPanelProps) {
  const [category, setCategory] = useState<StyleCategory>("badges");

  const addStyle = useCallback(async (style: QuickStyle) => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const obj = style.create(fabric, 100, 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.add(obj as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.setActiveObject(obj as any);
    fabricCanvas.requestRenderAll();
    toast.success(`"${style.label}" adicionado`);
  }, [fabricCanvas]);

  const filtered = QUICK_STYLES.filter((s) => s.category === category);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Estilos Rápidos</span>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {STYLE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`text-[9px] px-2 py-1 rounded border transition-colors ${category === cat.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Style grid */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((style) => (
          <button
            key={style.id}
            onClick={() => addStyle(style)}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            {/* Color preview */}
            <div
              className="w-full h-10 rounded flex items-center justify-center text-[10px] font-bold transition-all group-hover:scale-105"
              style={{
                background: style.preview.bg,
                color: style.preview.text,
                border: style.preview.border ? `2px solid ${style.preview.border}` : "none",
              }}
            >
              {style.label.split(" ").slice(-1)[0]}
            </div>
            <div className="flex items-center gap-1">
              <Plus className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">{style.label}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground text-center">
        Clique para adicionar ao canvas — depois edite o texto e as cores
      </p>
    </div>
  );
}
