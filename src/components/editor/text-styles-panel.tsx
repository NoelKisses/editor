"use client";

import { useCallback } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";

interface TextStylesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface TextStyle {
  label: string;
  preview: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  fill: string;
  letterSpacing?: number;
  textTransform?: string;
  fontStyle?: "normal" | "italic" | "oblique";
  underline?: boolean;
  shadow?: string;
  stroke?: string;
  strokeWidth?: number;
  lineHeight?: number;
}

const TEXT_STYLES: TextStyle[] = [
  {
    label: "Título Principal",
    preview: "TÍTULO",
    fontSize: 80,
    fontWeight: "bold",
    fontFamily: "Impact",
    fill: "#ffffff",
    letterSpacing: 4,
    shadow: "rgba(0,0,0,0.8) 4px 4px 15px",
  },
  {
    label: "Subtítulo Elegante",
    preview: "Subtítulo",
    fontSize: 48,
    fontWeight: "300",
    fontFamily: "Georgia",
    fill: "#f8f8f8",
    fontStyle: "italic",
    shadow: "rgba(0,0,0,0.4) 2px 2px 8px",
  },
  {
    label: "Texto em Negrito",
    preview: "DESTAQUE",
    fontSize: 56,
    fontWeight: "bold",
    fontFamily: "Arial",
    fill: "#ffdd00",
    stroke: "#000000",
    strokeWidth: 3,
    shadow: "rgba(0,0,0,0.9) 2px 2px 0px",
  },
  {
    label: "Corpo do Texto",
    preview: "Texto de corpo",
    fontSize: 24,
    fontWeight: "normal",
    fontFamily: "Arial",
    fill: "#dddddd",
    lineHeight: 1.5,
  },
  {
    label: "Legenda",
    preview: "Legenda / Descrição",
    fontSize: 18,
    fontWeight: "normal",
    fontFamily: "Arial",
    fill: "#aaaaaa",
  },
  {
    label: "Citação",
    preview: '"Citação inspiradora"',
    fontSize: 36,
    fontWeight: "normal",
    fontFamily: "Georgia",
    fill: "#ffffff",
    fontStyle: "italic",
    letterSpacing: 1,
    lineHeight: 1.4,
  },
  {
    label: "Estilo Neon",
    preview: "NEON",
    fontSize: 72,
    fontWeight: "bold",
    fontFamily: "Arial",
    fill: "#00ffff",
    shadow: "rgba(0,255,255,0.8) 0px 0px 20px",
    stroke: "rgba(0,255,255,0.3)",
    strokeWidth: 1,
  },
  {
    label: "Estilo Retro",
    preview: "RETRO",
    fontSize: 64,
    fontWeight: "bold",
    fontFamily: "Impact",
    fill: "#ff6b35",
    stroke: "#ffdd00",
    strokeWidth: 2,
    shadow: "rgba(0,0,0,0.7) 3px 3px 0px",
  },
  {
    label: "Minimalista",
    preview: "Minimalista",
    fontSize: 40,
    fontWeight: "100",
    fontFamily: "Arial",
    fill: "#ffffff",
    letterSpacing: 8,
  },
  {
    label: "Gradient Fake",
    preview: "Degradê",
    fontSize: 56,
    fontWeight: "bold",
    fontFamily: "Arial",
    fill: "#f97316",
    shadow: "rgba(236,72,153,0.6) 0px 2px 0px",
  },
  {
    label: "Outline",
    preview: "OUTLINE",
    fontSize: 64,
    fontWeight: "bold",
    fontFamily: "Arial",
    fill: "transparent",
    stroke: "#ffffff",
    strokeWidth: 2,
  },
  {
    label: "Sombra Longa",
    preview: "Shadow",
    fontSize: 60,
    fontWeight: "bold",
    fontFamily: "Arial",
    fill: "#ffffff",
    shadow: "rgba(0,0,0,0.5) 8px 8px 0px",
  },
];

export function TextStylesPanel({ fabricCanvas }: TextStylesPanelProps) {
  const addStyledText = useCallback(async (style: TextStyle) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);

    const text = new fabric.IText(style.label, {
      left: 60,
      top: 60,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontFamily: style.fontFamily,
      fill: style.fill,
      fontStyle: style.fontStyle ?? "normal",
      underline: style.underline ?? false,
      charSpacing: (style.letterSpacing ?? 0) * 100,
      lineHeight: style.lineHeight ?? 1.16,
      ...(style.stroke ? { stroke: style.stroke, strokeWidth: style.strokeWidth ?? 1 } : {}),
      ...(style.shadow ? { shadow: style.shadow } : {}),
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.requestRenderAll();
    toast.success(`Texto "${style.label}" adicionado`);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Estilos de Texto</span>
      </div>
      <p className="text-[10px] text-muted-foreground">Clique para adicionar ao canvas</p>

      <div className="flex flex-col gap-2">
        {TEXT_STYLES.map((style) => (
          <button
            key={style.label}
            onClick={() => addStyledText(style)}
            className="flex flex-col gap-0.5 text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/20 transition-all group"
          >
            <span className="text-[9px] text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">
              {style.label}
            </span>
            <span
              className="leading-tight truncate text-foreground"
              style={{
                fontFamily: style.fontFamily,
                fontWeight: style.fontWeight,
                fontStyle: style.fontStyle ?? "normal",
                fontSize: Math.min(style.fontSize / 3, 28),
                color: style.fill === "transparent" ? "transparent" : style.fill,
                WebkitTextStroke: style.stroke ? `1px ${style.stroke}` : undefined,
                textShadow: style.shadow
                  ? style.shadow.replace(/(\d+)px (\d+)px (\d+)px/, (_, a, b, c) =>
                      `${Math.round(Number(a) / 3)}px ${Math.round(Number(b) / 3)}px ${Math.round(Number(c) / 3)}px`
                    )
                  : undefined,
                letterSpacing: style.letterSpacing ? `${style.letterSpacing / 4}px` : undefined,
              }}
            >
              {style.preview}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
