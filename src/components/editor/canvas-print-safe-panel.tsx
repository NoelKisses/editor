"use client";

import { useCallback, useState } from "react";
import { Printer, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasPrintSafePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const GUIDE_TAG = "__printguide__";

interface PrintGuideSet {
  id: string;
  label: string;
  bleed: number;
  safeMargin: number;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects: any[];
}

const PRINT_PRESETS: { name: string; bleed: number; safeMargin: number }[] = [
  { name: "Business Card", bleed: 3, safeMargin: 5 },
  { name: "A4 Standard", bleed: 3, safeMargin: 10 },
  { name: "Poster", bleed: 5, safeMargin: 15 },
  { name: "Flyer", bleed: 3, safeMargin: 8 },
  { name: "Custom", bleed: 0, safeMargin: 0 },
];

export function CanvasPrintSafePanel({ fabricCanvas }: CanvasPrintSafePanelProps) {
  const [bleed, setBleed] = useState(3);
  const [safeMargin, setSafeMargin] = useState(10);
  const [bleedColor, setBleedColor] = useState("#ff0000");
  const [safeColor, setSafeColor] = useState("#0000ff");
  const [activeGuide, setActiveGuide] = useState<PrintGuideSet | null>(null);
  const [visible, setVisible] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState("A4 Standard");
  const [unit, setUnit] = useState<"mm" | "px">("mm");

  const mmToPx = useCallback((mm: number) => Math.round(mm * 3.7795), []);
  const toPixels = useCallback((val: number) => unit === "mm" ? mmToPx(val) : val, [unit, mmToPx]);

  const clearGuides = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = fabricCanvas.getObjects().filter((o: any) => o.data?.[GUIDE_TAG]);
    toRemove.forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    setActiveGuide(null);
  }, [fabricCanvas]);

  const addGuides = useCallback(() => {
    if (!fabricCanvas) return;
    clearGuides();

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const cw = fabricCanvas.width ?? 800;
      const ch = fabricCanvas.height ?? 600;

      const bleedPx = toPixels(bleed);
      const safePx = toPixels(safeMargin);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects: any[] = [];

      // Bleed rect (outer)
      if (bleedPx > 0) {
        const bleedRect = new f.Rect({
          left: -bleedPx,
          top: -bleedPx,
          width: cw + bleedPx * 2,
          height: ch + bleedPx * 2,
          fill: "",
          stroke: bleedColor,
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          selectable: false,
          evented: false,
          data: { [GUIDE_TAG]: true, type: "bleed" },
        });
        objects.push(bleedRect);
        fabricCanvas.add(bleedRect);
      }

      // Safe margin rect (inner)
      if (safePx > 0) {
        const safeRect = new f.Rect({
          left: safePx,
          top: safePx,
          width: cw - safePx * 2,
          height: ch - safePx * 2,
          fill: "",
          stroke: safeColor,
          strokeWidth: 1,
          strokeDashArray: [8, 4],
          selectable: false,
          evented: false,
          data: { [GUIDE_TAG]: true, type: "safe" },
        });
        objects.push(safeRect);
        fabricCanvas.add(safeRect);
      }

      // Center crosshairs
      const crossSize = 20;
      const cx = cw / 2;
      const cy = ch / 2;

      const crossH = new f.Line([cx - crossSize, cy, cx + crossSize, cy], {
        stroke: "#888888",
        strokeWidth: 0.5,
        strokeDashArray: [],
        selectable: false,
        evented: false,
        data: { [GUIDE_TAG]: true, type: "cross" },
      });
      const crossV = new f.Line([cx, cy - crossSize, cx, cy + crossSize], {
        stroke: "#888888",
        strokeWidth: 0.5,
        strokeDashArray: [],
        selectable: false,
        evented: false,
        data: { [GUIDE_TAG]: true, type: "cross" },
      });
      objects.push(crossH, crossV);
      fabricCanvas.add(crossH);
      fabricCanvas.add(crossV);

      fabricCanvas.requestRenderAll();

      const guide: PrintGuideSet = {
        id: `pg-${Date.now()}`,
        label: selectedPreset,
        bleed,
        safeMargin,
        color: bleedColor,
        objects,
      };
      setActiveGuide(guide);
      setVisible(true);

      const info = `Sangria: ${bleed}${unit}, Margem segura: ${safeMargin}${unit}`;
      toast.success(`Guias de impressão adicionadas — ${info}`);
    });
  }, [fabricCanvas, clearGuides, toPixels, bleed, safeMargin, bleedColor, safeColor, selectedPreset, unit]);

  const toggleVisibility = useCallback(() => {
    if (!fabricCanvas) return;
    const next = !visible;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().filter((o: any) => o.data?.[GUIDE_TAG]).forEach((o: any) => {
      o.set({ visible: next });
    });
    fabricCanvas.requestRenderAll();
    setVisible(next);
  }, [fabricCanvas, visible]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Printer className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Área Segura para Impressão</span>
      </div>

      {/* Unit */}
      <div className="grid grid-cols-2 gap-1">
        {(["mm", "px"] as const).map(u => (
          <button key={u} onClick={() => setUnit(u)}
            className={`py-1 rounded border text-[8px] transition-colors ${unit === u ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            {u === "mm" ? "Milímetros" : "Pixels"}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets de Impressão</span>
        <div className="grid grid-cols-2 gap-1">
          {PRINT_PRESETS.map(p => (
            <button key={p.name} onClick={() => {
              setSelectedPreset(p.name);
              if (p.name !== "Custom") {
                setBleed(p.bleed);
                setSafeMargin(p.safeMargin);
              }
            }}
              className={`py-1.5 rounded border text-[8px] transition-colors ${selectedPreset === p.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bleed */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Sangria (Bleed)</span>
          <span className="text-[9px] tabular-nums">{bleed}{unit}</span>
        </div>
        <input type="range" min={0} max={unit === "mm" ? 20 : 100} step={unit === "mm" ? 1 : 5} value={bleed}
          onChange={e => { setBleed(Number(e.target.value)); setSelectedPreset("Custom"); }}
          className="w-full accent-primary h-1" />
      </div>

      {/* Safe margin */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Margem Segura</span>
          <span className="text-[9px] tabular-nums">{safeMargin}{unit}</span>
        </div>
        <input type="range" min={0} max={unit === "mm" ? 50 : 200} step={unit === "mm" ? 1 : 5} value={safeMargin}
          onChange={e => { setSafeMargin(Number(e.target.value)); setSelectedPreset("Custom"); }}
          className="w-full accent-primary h-1" />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Cor da Sangria</span>
          <div className="flex items-center gap-1">
            <input type="color" value={bleedColor} onChange={e => setBleedColor(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{bleedColor}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Cor da Margem</span>
          <div className="flex items-center gap-1">
            <input type="color" value={safeColor} onChange={e => setSafeColor(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{safeColor}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      {activeGuide && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-primary/30 bg-primary/5">
          <span className="text-[8px] text-primary">{activeGuide.label} ativo</span>
          <div className="flex items-center gap-1">
            <button onClick={toggleVisibility}
              className="text-muted-foreground hover:text-primary transition-colors">
              {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button onClick={clearGuides}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        {activeGuide && (
          <button onClick={clearGuides}
            className="py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
            Limpar Guias
          </button>
        )}
        <button onClick={addGuides}
          className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${activeGuide ? "" : "col-span-2"}`}>
          <Printer className="w-3 h-3" /> Adicionar Guias
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-2 rounded-sm border border-dashed" style={{ borderColor: bleedColor }} />
          <span className="text-[7px] text-muted-foreground">Linha de sangria — zona de impressão estendida</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-2 rounded-sm border" style={{ borderColor: safeColor, borderStyle: "dashed" }} />
          <span className="text-[7px] text-muted-foreground">Margem segura — mantenha texto dentro</span>
        </div>
      </div>
    </div>
  );
}
