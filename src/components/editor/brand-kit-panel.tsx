"use client";

import { useState, useCallback, useEffect } from "react";
import { Palette, Plus, Trash2, Pipette, Check } from "lucide-react";
import { toast } from "sonner";

interface BrandKitPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface BrandColor {
  id: string;
  hex: string;
  name: string;
}

interface BrandPalette {
  id: string;
  name: string;
  colors: BrandColor[];
}

const STORAGE_KEY = "editor_brand_kit";
const DEFAULT_PALETTE: BrandPalette = {
  id: "default",
  name: "Minha Marca",
  colors: [
    { id: "c1", hex: "#6366f1", name: "Primária" },
    { id: "c2", hex: "#ec4899", name: "Destaque" },
    { id: "c3", hex: "#ffffff", name: "Fundo" },
    { id: "c4", hex: "#1a1a2e", name: "Escuro" },
  ],
};

function load(): BrandPalette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [DEFAULT_PALETTE];
  } catch { return [DEFAULT_PALETTE]; }
}

function save(palettes: BrandPalette[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes)); } catch { /* quota */ }
}

export function BrandKitPanel({ fabricCanvas, selectionVersion }: BrandKitPanelProps) {
  const [palettes, setPalettes] = useState<BrandPalette[]>([]);
  const [activePalette, setActivePalette] = useState(0);
  const [appliedColor, setAppliedColor] = useState<string | null>(null);
  const [newColorHex, setNewColorHex] = useState("#6366f1");
  const [newColorName, setNewColorName] = useState("");

  useEffect(() => {
    const loaded = load();
    queueMicrotask(() => setPalettes(loaded));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion; // consumed to trigger re-render

  const palette = palettes[activePalette];

  const applyColor = useCallback((hex: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = fabricCanvas.getActiveObject();
    if (!active) {
      toast("Selecione um objeto primeiro");
      return;
    }
    if (["i-text", "textbox", "text"].includes(active.type)) {
      active.set({ fill: hex });
    } else if (active.type === "group") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      active._objects?.forEach((o: any) => { if (o.set) o.set({ fill: hex }); });
    } else {
      active.set({ fill: hex });
    }
    fabricCanvas.requestRenderAll();
    setAppliedColor(hex);
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const applyStrokeColor = useCallback((hex: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = fabricCanvas.getActiveObject();
    if (!active) return;
    active.set({ stroke: hex, strokeWidth: active.strokeWidth || 2 });
    fabricCanvas.requestRenderAll();
    toast.success("Contorno aplicado");
  }, [fabricCanvas]);

  const addColor = useCallback(() => {
    if (!palette) return;
    const newColor: BrandColor = {
      id: `c-${Date.now()}`,
      hex: newColorHex,
      name: newColorName || newColorHex,
    };
    const updated = palettes.map((p, i) =>
      i === activePalette ? { ...p, colors: [...p.colors, newColor] } : p
    );
    setPalettes(updated);
    save(updated);
    setNewColorName("");
    toast.success("Cor adicionada");
  }, [palette, palettes, activePalette, newColorHex, newColorName]);

  const removeColor = useCallback((colorId: string) => {
    const updated = palettes.map((p, i) =>
      i === activePalette ? { ...p, colors: p.colors.filter((c) => c.id !== colorId) } : p
    );
    setPalettes(updated);
    save(updated);
  }, [palettes, activePalette]);

  const addPalette = useCallback(() => {
    const newPalette: BrandPalette = {
      id: `pal-${Date.now()}`,
      name: `Paleta ${palettes.length + 1}`,
      colors: [],
    };
    const updated = [...palettes, newPalette];
    setPalettes(updated);
    save(updated);
    setActivePalette(updated.length - 1);
  }, [palettes]);

  const extractFromCanvas = useCallback(() => {
    if (!fabricCanvas || !palette) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = fabricCanvas.getObjects();
    const colors = new Set<string>();
    objects.forEach((obj) => {
      if (obj.fill && typeof obj.fill === "string" && obj.fill.startsWith("#")) colors.add(obj.fill);
      if (obj.stroke && typeof obj.stroke === "string" && obj.stroke.startsWith("#")) colors.add(obj.stroke);
    });
    const newColors: BrandColor[] = Array.from(colors).slice(0, 8).map((hex, i) => ({
      id: `ex-${Date.now()}-${i}`,
      hex,
      name: `Cor ${i + 1}`,
    }));
    if (!newColors.length) { toast("Nenhuma cor encontrada no canvas"); return; }
    const updated = palettes.map((p, i) =>
      i === activePalette ? { ...p, colors: [...p.colors, ...newColors] } : p
    );
    setPalettes(updated);
    save(updated);
    toast.success(`${newColors.length} cores extraídas do canvas`);
  }, [fabricCanvas, palette, palettes, activePalette]);

  if (!palette) return null;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Kit de Marca</span>
      </div>

      {/* Palette selector */}
      <div className="flex gap-1 flex-wrap items-center">
        {palettes.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActivePalette(i)}
            className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
              i === activePalette
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={addPalette}
          className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
          title="Nova paleta"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Color grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cores da Marca</span>
        <div className="grid grid-cols-4 gap-1.5">
          {palette.colors.map((color) => (
            <div key={color.id} className="flex flex-col gap-0.5 group relative">
              <button
                onClick={() => applyColor(color.hex)}
                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 relative ${
                  appliedColor === color.hex ? "border-primary shadow-lg shadow-primary/20" : "border-border/50"
                }`}
                style={{ backgroundColor: color.hex }}
                title={`${color.name} — clique para aplicar preenchimento`}
              >
                {appliedColor === color.hex && (
                  <Check className="absolute inset-0 m-auto w-3 h-3 text-white drop-shadow" />
                )}
              </button>
              <span className="text-[8px] text-muted-foreground text-center truncate">{color.name}</span>
              <button
                onClick={() => applyStrokeColor(color.hex)}
                className="text-[8px] text-primary/60 hover:text-primary text-center hover:underline"
                title="Aplicar como contorno"
              >
                Contorno
              </button>
              <button
                onClick={() => removeColor(color.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive/80 hidden group-hover:flex items-center justify-center"
                title="Remover"
              >
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add color */}
      <div className="flex flex-col gap-2 border-t border-border pt-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Adicionar Cor</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
          />
          <input
            type="text"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-24 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground"
          />
          <input
            type="text"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            placeholder="Nome"
            className="flex-1 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground"
          />
          <button
            onClick={addColor}
            className="w-7 h-7 rounded bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
            title="Adicionar cor"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      </div>

      {/* Extract from canvas */}
      <button
        onClick={extractFromCanvas}
        className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg py-2 hover:border-primary/40 transition-colors"
      >
        <Pipette className="w-3 h-3" />
        Extrair cores do canvas
      </button>
    </div>
  );
}
