"use client";

import { useCallback } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";

interface TextTemplatesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface TextTemplate {
  label: string;
  category: string;
  objects: {
    text: string;
    fontSize: number;
    fontWeight?: string;
    fontStyle?: string;
    fill: string;
    left: number;
    top: number;
    textAlign?: string;
    charSpacing?: number;
    lineHeight?: number;
    shadow?: string;
    stroke?: string;
    strokeWidth?: number;
    underline?: boolean;
  }[];
}

const TEXT_TEMPLATES: TextTemplate[] = [
  {
    label: "Título + Subtítulo",
    category: "Básico",
    objects: [
      { text: "TÍTULO AQUI", fontSize: 72, fontWeight: "bold", fill: "#ffffff", left: 80, top: 100, shadow: "rgba(0,0,0,0.5) 2px 4px 12px" },
      { text: "Subtítulo ou descrição curta aqui", fontSize: 28, fill: "#ffffff", left: 80, top: 200, fontWeight: "normal" },
    ],
  },
  {
    label: "Contagem Regressiva",
    category: "YouTube",
    objects: [
      { text: "TOP", fontSize: 40, fontWeight: "bold", fill: "#ff0000", left: 80, top: 80, charSpacing: 200 },
      { text: "10", fontSize: 160, fontWeight: "bold", fill: "#ffffff", left: 80, top: 130, shadow: "rgba(0,0,0,0.8) 4px 8px 20px" },
      { text: "RAZÕES PARA ASSISTIR", fontSize: 24, fill: "#ffffff", left: 80, top: 310, charSpacing: 80 },
    ],
  },
  {
    label: "Neon Brilhante",
    category: "Efeitos",
    objects: [
      { text: "NEON", fontSize: 96, fontWeight: "bold", fill: "#00ffff", left: 80, top: 120, shadow: "rgba(0,255,255,0.9) 0px 0px 30px", stroke: "#00ffff", strokeWidth: 1 },
      { text: "GLOW EFFECT", fontSize: 28, fill: "#ffffff", left: 80, top: 240, charSpacing: 120 },
    ],
  },
  {
    label: "Clássico Editorial",
    category: "Elegante",
    objects: [
      { text: "EDITORIAL", fontSize: 48, fontWeight: "bold", fill: "#ffffff", left: 80, top: 100, charSpacing: 300 },
      { text: "Uma linha divisora elegante e refinada", fontSize: 20, fill: "rgba(255,255,255,0.7)", left: 80, top: 165, fontStyle: "italic" },
      { text: "2025", fontSize: 80, fontWeight: "bold", fill: "rgba(255,255,255,0.15)", left: 80, top: 220 },
    ],
  },
  {
    label: "Alerta / Breaking",
    category: "YouTube",
    objects: [
      { text: "🔴 AO VIVO", fontSize: 32, fontWeight: "bold", fill: "#ff0000", left: 80, top: 80 },
      { text: "BREAKING NEWS", fontSize: 64, fontWeight: "bold", fill: "#ffffff", left: 80, top: 130, shadow: "rgba(0,0,0,0.8) 3px 3px 0px" },
      { text: "Isso vai te surpreender!", fontSize: 26, fill: "rgba(255,255,255,0.9)", left: 80, top: 210, fontStyle: "italic" },
    ],
  },
  {
    label: "Minimalista",
    category: "Elegante",
    objects: [
      { text: "MINIMAL", fontSize: 80, fontWeight: "bold", fill: "#ffffff", left: 80, top: 140, charSpacing: 400 },
      { text: "design", fontSize: 24, fill: "rgba(255,255,255,0.5)", left: 82, top: 240, charSpacing: 200 },
    ],
  },
  {
    label: "Destaque Duplo",
    category: "Básico",
    objects: [
      { text: "COMO", fontSize: 52, fontWeight: "bold", fill: "#f59e0b", left: 80, top: 80 },
      { text: "FAZER ISSO", fontSize: 52, fontWeight: "bold", fill: "#ffffff", left: 80, top: 145, shadow: "rgba(0,0,0,0.6) 2px 4px 8px" },
      { text: "em menos de 5 minutos", fontSize: 22, fill: "rgba(255,255,255,0.8)", left: 80, top: 220, fontStyle: "italic" },
    ],
  },
  {
    label: "Urgência",
    category: "YouTube",
    objects: [
      { text: "⚠️ ATENÇÃO", fontSize: 36, fontWeight: "bold", fill: "#fbbf24", left: 80, top: 70 },
      { text: "VOCÊ PRECISA\nVER ISSO!", fontSize: 58, fontWeight: "bold", fill: "#ffffff", left: 80, top: 130, shadow: "rgba(0,0,0,0.7) 3px 6px 12px", lineHeight: 1.1 },
    ],
  },
];

const CATEGORIES = ["Todos", ...Array.from(new Set(TEXT_TEMPLATES.map((t) => t.category)))];

export function TextTemplatesPanel({ fabricCanvas }: TextTemplatesPanelProps) {
  const addTemplate = useCallback(async (template: TextTemplate) => {
    if (!fabricCanvas) return;
    try {
      const fabric = await import("fabric").then((m) => m.fabric);
      for (const obj of template.objects) {
        const text = new fabric.IText(obj.text, {
          left: obj.left,
          top: obj.top,
          fontSize: obj.fontSize,
          fontWeight: obj.fontWeight ?? "normal",
          fontStyle: (obj.fontStyle as "normal" | "italic" | "oblique" | undefined) ?? "normal",
          fill: obj.fill,
          textAlign: (obj.textAlign as "left" | "center" | "right" | undefined) ?? "left",
          charSpacing: obj.charSpacing ?? 0,
          lineHeight: obj.lineHeight ?? 1.16,
          shadow: obj.shadow ?? undefined,
          stroke: obj.stroke ?? undefined,
          strokeWidth: obj.strokeWidth ?? 0,
          underline: obj.underline ?? false,
          selectable: true,
        });
        fabricCanvas.add(text);
      }
      fabricCanvas.requestRenderAll();
      toast.success(`Template "${template.label}" adicionado`);
    } catch {
      toast.error("Erro ao adicionar template");
    }
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Templates de Texto</span>
      </div>

      <p className="text-[10px] text-muted-foreground/70">
        Clique para adicionar ao canvas
      </p>

      {CATEGORIES.filter((c) => c !== "Todos").map((category) => (
        <div key={category} className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</span>
          {TEXT_TEMPLATES.filter((t) => t.category === category).map((template) => (
            <button
              key={template.label}
              onClick={() => addTemplate(template)}
              className="text-left px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group"
            >
              <span className="text-[11px] text-foreground group-hover:text-primary transition-colors font-medium">
                {template.label}
              </span>
              <div className="flex gap-1 mt-1">
                {template.objects.slice(0, 2).map((obj, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: `${obj.fill}22`, color: obj.fill === "#ffffff" ? "#aaa" : obj.fill, border: `1px solid ${obj.fill}44` }}
                  >
                    {obj.fontSize}px
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
