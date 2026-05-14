"use client";

import { useCallback, useEffect, useState } from "react";
import { Gem, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImageDuotonePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface DuotonePreset {
  name: string;
  shadow: string;
  highlight: string;
}

const DUOTONE_PRESETS: DuotonePreset[] = [
  { name: "Roxo/Laranja", shadow: "#2d1b69", highlight: "#ff6b35" },
  { name: "Azul/Rosa", shadow: "#1a1a6e", highlight: "#ff6ec7" },
  { name: "Verde/Amarelo", shadow: "#1a4731", highlight: "#f5e642" },
  { name: "Vermelho/Ciano", shadow: "#6e1a1a", highlight: "#00e5ff" },
  { name: "Escuro/Dourado", shadow: "#0d0d0d", highlight: "#ffd700" },
  { name: "Marinho/Coral", shadow: "#003366", highlight: "#ff7f7f" },
];

export function ImageDuotonePanel({ fabricCanvas, selectionVersion }: ImageDuotonePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [shadowColor, setShadowColor] = useState("#2d1b69");
  const [highlightColor, setHighlightColor] = useState("#ff6b35");
  const [intensity, setIntensity] = useState(80);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Roxo/Laranja");
  const [hasEffect, setHasEffect] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasDuotone = (obj.filters ?? []).some((f: any) => f._duotone === true);
        setHasEffect(hasDuotone);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const applyDuotone = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // Remove existing duotone filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingFilters: any[] = (obj.filters ?? []).filter((fl: any) => !fl._duotone);

      const s = hexToRgb(shadowColor);
      const h = hexToRgb(highlightColor);
      const alpha = intensity / 100;

      // Step 1: Grayscale
      const grayFilter = new f.Image.filters.Grayscale();
      grayFilter._duotone = true;

      // Step 2: Duotone via ColorMatrix
      // Maps grayscale to blend between shadow and highlight colors
      const dr = h.r - s.r;
      const dg = h.g - s.g;
      const db = h.b - s.b;

      const duotoneMatrix = new f.Image.filters.ColorMatrix({
        matrix: [
          dr * alpha, 0, 0, 0, s.r * alpha + (1 - alpha),
          dg * alpha, 0, 0, 0, s.g * alpha,
          db * alpha, 0, 0, 0, s.b * alpha,
          0, 0, 0, 1, 0,
        ],
      });
      duotoneMatrix._duotone = true;

      obj.filters = [...existingFilters, grayFilter, duotoneMatrix];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success("Efeito duotone aplicado");
    });
  }, [getImage, shadowColor, highlightColor, intensity, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) => !f._duotone);
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    setSelectedPreset(null);
    toast.success("Efeito duotone removido");
  }, [getImage, fabricCanvas]);

  const applyPreset = useCallback((preset: DuotonePreset) => {
    setShadowColor(preset.shadow);
    setHighlightColor(preset.highlight);
    setSelectedPreset(preset.name);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Gem className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Duotone / Bicolor</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Gem className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar duotone</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-2 gap-1">
              {DUOTONE_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-left transition-colors ${selectedPreset === p.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <div className="w-3 h-4 rounded-sm" style={{ backgroundColor: p.shadow }} />
                    <div className="w-3 h-4 rounded-sm" style={{ backgroundColor: p.highlight }} />
                  </div>
                  <span className={`text-[8px] truncate ${selectedPreset === p.name ? "text-primary font-medium" : ""}`}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Sombra</span>
              <div className="flex items-center gap-1">
                <input type="color" value={shadowColor} onChange={e => { setShadowColor(e.target.value); setSelectedPreset(null); }}
                  className="w-7 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{shadowColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Destaque</span>
              <div className="flex items-center gap-1">
                <input type="color" value={highlightColor} onChange={e => { setHighlightColor(e.target.value); setSelectedPreset(null); }}
                  className="w-7 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{highlightColor}</span>
              </div>
            </div>
          </div>

          {/* Intensity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{intensity}%</span>
            </div>
            <input type="range" min={20} max={100} step={5} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Visual preview */}
          <div className="h-6 rounded overflow-hidden border border-border"
            style={{ background: `linear-gradient(to right, ${shadowColor}, ${highlightColor})` }} />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeEffect}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyDuotone}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Gem className="w-3 h-3" /> Aplicar Duotone
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Grayscale + ColorMatrix para mapeamento bicolor
          </p>
        </>
      )}
    </div>
  );
}
