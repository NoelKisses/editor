"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PresetId = "classico" | "neon" | "duplo" | "pontilhado" | "tracejado" | "esboco";

interface OutlinePreset {
  id: PresetId;
  name: string;
  description: string;
}

const OUTLINE_PRESETS: OutlinePreset[] = [
  { id: "classico", name: "Clássico", description: "Contorno preto, preenchimento branco" },
  { id: "neon", name: "Neon Glow", description: "Contorno com brilho neon" },
  { id: "duplo", name: "Duplo", description: "Dois contornos (externo + interno)" },
  { id: "pontilhado", name: "Pontilhado", description: "Contorno pontilhado" },
  { id: "tracejado", name: "Tracejado", description: "Contorno tracejado" },
  { id: "esboco", name: "Esboço", description: "Traço grosso com leve rotação" },
];

const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTextObject(obj: any): boolean {
  return obj && typeof obj.type === "string" && TEXT_TYPES.includes(obj.type);
}

function getContrastColor(hex: string): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return "#ffffff";
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

interface TextStrokeOnlyPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function TextStrokeOnlyPanel({ fabricCanvas }: TextStrokeOnlyPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("classico");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [hollow, setHollow] = useState<boolean>(true);
  const [fillColor, setFillColor] = useState<string>("#ffffff");
  const [strokeUniform, setStrokeUniform] = useState<boolean>(true);
  const [paintStrokeFirst, setPaintStrokeFirst] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getSelectedTexts(): any[] {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const active = canvas.getActiveObjects ? canvas.getActiveObjects() : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (active as any[]).filter(isTextObject);
  }

  async function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const texts = getSelectedTexts();
    if (texts.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    setIsApplying(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fabricMod: any = null;
      if (selectedPreset === "neon") {
        fabricMod = await import("fabric");
      }

      for (const obj of texts) {
        const effectiveFill = hollow ? "" : fillColor;

        obj.set({
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          fill: effectiveFill,
          strokeUniform: strokeUniform,
          paintFirst: paintStrokeFirst ? "stroke" : "fill",
          strokeDashArray: null,
          shadow: null,
        });

        if (selectedPreset === "pontilhado") {
          obj.set({ strokeDashArray: [2, 4] });
        } else if (selectedPreset === "tracejado") {
          obj.set({ strokeDashArray: [10, 5] });
        } else if (selectedPreset === "neon" && fabricMod) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const f: any = fabricMod.fabric ?? fabricMod;
          if (f && f.Shadow) {
            obj.set({
              shadow: new f.Shadow({
                color: strokeColor,
                blur: 15,
                offsetX: 0,
                offsetY: 0,
              }),
            });
          }
        } else if (selectedPreset === "esboco") {
          obj.set({
            strokeWidth: Math.max(strokeWidth, 6),
            angle: (obj.angle || 0) + 1,
          });
        } else if (selectedPreset === "duplo") {
          if (typeof obj.clone === "function") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            obj.clone((cloned: any) => {
              const innerColor = getContrastColor(strokeColor);
              cloned.set({
                left: obj.left,
                top: obj.top,
                stroke: innerColor,
                strokeWidth: Math.max(1, Math.floor(strokeWidth / 2)),
                fill: effectiveFill,
                strokeUniform: strokeUniform,
                paintFirst: paintStrokeFirst ? "stroke" : "fill",
                selectable: true,
                evented: true,
              });
              canvas.add(cloned);
              canvas.requestRenderAll?.();
            });
          }
        }

        obj.setCoords?.();
        obj.dirty = true;
      }

      canvas.requestRenderAll?.();
      queueMicrotask(() => {
        setIsApplying(false);
      });
      toast.success("Contorno aplicado");
    } catch (error) {
      console.error("Error applying outline:", error);
      toast.error("Erro ao aplicar contorno");
      queueMicrotask(() => {
        setIsApplying(false);
      });
    }
  }

  function handleReset() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const texts = getSelectedTexts();
    if (texts.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    for (const obj of texts) {
      obj.set({
        stroke: null,
        strokeWidth: 0,
        strokeDashArray: null,
        strokeUniform: false,
        paintFirst: "fill",
        shadow: null,
        fill: fillColor || "#000000",
      });
      obj.setCoords?.();
      obj.dirty = true;
    }

    canvas.requestRenderAll?.();
    toast.success("Contorno resetado");
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Type className="h-5 w-5" />
        <h3 className="text-base font-semibold">Texto Apenas Contorno (Outline)</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Estilo do contorno</label>
        <div className="grid grid-cols-2 gap-2">
          {OUTLINE_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset.id)}
                className={
                  "flex flex-col items-start rounded-md border p-2 text-left text-xs transition-colors " +
                  (isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted")
                }
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-muted-foreground">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="stroke-color">
          Cor do contorno
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="stroke-color"
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-9 w-16 cursor-pointer p-1"
          />
          <Input
            type="text"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-9 flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="stroke-width">
          Espessura do contorno: {strokeWidth}px
        </label>
        <input
          id="stroke-width"
          type="range"
          min={1}
          max={15}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="hollow-toggle"
          type="checkbox"
          checked={hollow}
          onChange={(e) => setHollow(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="hollow-toggle" className="text-sm">
          Letras vazadas (hollow)
        </label>
      </div>

      {!hollow && (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="fill-color">
            Cor de preenchimento
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="fill-color"
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="h-9 w-16 cursor-pointer p-1"
            />
            <Input
              type="text"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="h-9 flex-1"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          id="stroke-uniform-toggle"
          type="checkbox"
          checked={strokeUniform}
          onChange={(e) => setStrokeUniform(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="stroke-uniform-toggle" className="text-sm">
          Manter espessura ao escalar
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="paint-stroke-first-toggle"
          type="checkbox"
          checked={paintStrokeFirst}
          onChange={(e) => setPaintStrokeFirst(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="paint-stroke-first-toggle" className="text-sm">
          Renderizar contorno atrás do preenchimento
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleApply} disabled={isApplying} className="flex-1">
          {isApplying ? "Aplicando..." : "Aplicar Contorno"}
        </Button>
        <Button onClick={handleReset} variant="outline" className="flex-1">
          Resetar Contorno
        </Button>
      </div>
    </div>
  );
}
