"use client";

import { useCallback, useState } from "react";
import { LayoutGrid, AlignCenter, AlignJustify, Rows } from "lucide-react";
import { toast } from "sonner";

interface AutoDistributePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type DistributeMode = "equal-h" | "equal-v" | "grid" | "pack-h" | "pack-v";
type AlignMode = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";

const DISTRIBUTE_MODES: { value: DistributeMode; label: string; desc: string }[] = [
  { value: "equal-h", label: "↔ Espaço H igual", desc: "Espaçamento horizontal uniforme" },
  { value: "equal-v", label: "↕ Espaço V igual", desc: "Espaçamento vertical uniforme" },
  { value: "grid", label: "⊞ Grade", desc: "Organizar em colunas e linhas" },
  { value: "pack-h", label: "⦗ Encostar H", desc: "Encostar uns nos outros (horizontal)" },
  { value: "pack-v", label: "⦘ Encostar V", desc: "Encostar uns nos outros (vertical)" },
];

export function AutoDistributePanel({ fabricCanvas, selectionVersion }: AutoDistributePanelProps) {
  void selectionVersion;
  const [cols, setCols] = useState(3);
  const [gapX, setGapX] = useState(20);
  const [gapY, setGapY] = useState(20);
  const [distributeMode, setDistributeMode] = useState<DistributeMode>("equal-h");

  const getSelectedObjects = useCallback(() => {
    if (!fabricCanvas) return [];
    const sel = fabricCanvas.getActiveObject();
    if (!sel) return [];
    if (sel.type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (sel as any).getObjects() as any[];
    }
    return [sel];
  }, [fabricCanvas]);

  const align = useCallback((mode: AlignMode) => {
    const objects = getSelectedObjects();
    if (objects.length < 2) { toast.error("Selecione 2+ objetos"); return; }

    const bounds = objects.map((o: { getBoundingRect: () => { left: number; top: number; width: number; height: number } }) => o.getBoundingRect());

    objects.forEach((obj: { set: (p: Record<string, number>) => void; setCoords: () => void; getBoundingRect: () => { left: number; top: number; width: number; height: number } }, i: number) => {
      const b = bounds[i];
      switch (mode) {
        case "left":
          obj.set({ left: Math.min(...bounds.map((bb: { left: number }) => bb.left)) });
          break;
        case "right":
          obj.set({ left: Math.max(...bounds.map((bb: { left: number; width: number }) => bb.left + bb.width)) - b.width });
          break;
        case "center-h": {
          const minL = Math.min(...bounds.map((bb: { left: number }) => bb.left));
          const maxR = Math.max(...bounds.map((bb: { left: number; width: number }) => bb.left + bb.width));
          obj.set({ left: (minL + maxR) / 2 - b.width / 2 });
          break;
        }
        case "top":
          obj.set({ top: Math.min(...bounds.map((bb: { top: number }) => bb.top)) });
          break;
        case "bottom":
          obj.set({ top: Math.max(...bounds.map((bb: { top: number; height: number }) => bb.top + bb.height)) - b.height });
          break;
        case "center-v": {
          const minT = Math.min(...bounds.map((bb: { top: number }) => bb.top));
          const maxB = Math.max(...bounds.map((bb: { top: number; height: number }) => bb.top + bb.height));
          obj.set({ top: (minT + maxB) / 2 - b.height / 2 });
          break;
        }
      }
      obj.setCoords();
    });

    fabricCanvas.requestRenderAll();
    toast.success("Alinhado");
  }, [getSelectedObjects, fabricCanvas]);

  const distribute = useCallback(() => {
    const objects = getSelectedObjects();
    if (objects.length < 2) { toast.error("Selecione 2+ objetos"); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getBR = (o: any) => o.getBoundingRect() as { left: number; top: number; width: number; height: number };

    switch (distributeMode) {
      case "equal-h": {
        const sorted = [...objects].sort((a, b) => getBR(a).left - getBR(b).left);
        const minL = getBR(sorted[0]).left;
        const lastBR = getBR(sorted[sorted.length - 1]);
        const maxR = lastBR.left + lastBR.width;
        const totalW = sorted.reduce((s, o) => s + getBR(o).width, 0);
        const gap = (maxR - minL - totalW) / (sorted.length - 1);
        let cursor = minL;
        sorted.forEach((o) => {
          const br = getBR(o);
          o.set({ left: cursor });
          o.setCoords();
          cursor += br.width + gap;
        });
        break;
      }
      case "equal-v": {
        const sorted = [...objects].sort((a, b) => getBR(a).top - getBR(b).top);
        const minT = getBR(sorted[0]).top;
        const lastBR = getBR(sorted[sorted.length - 1]);
        const maxB = lastBR.top + lastBR.height;
        const totalH = sorted.reduce((s, o) => s + getBR(o).height, 0);
        const gap = (maxB - minT - totalH) / (sorted.length - 1);
        let cursor = minT;
        sorted.forEach((o) => {
          const br = getBR(o);
          o.set({ top: cursor });
          o.setCoords();
          cursor += br.height + gap;
        });
        break;
      }
      case "grid": {
        const sorted = [...objects];
        sorted.forEach((o, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const br = getBR(o);
          o.set({ left: col * (br.width + gapX), top: row * (br.height + gapY) });
          o.setCoords();
        });
        break;
      }
      case "pack-h": {
        const sorted = [...objects].sort((a, b) => getBR(a).left - getBR(b).left);
        let cursor = getBR(sorted[0]).left;
        sorted.forEach((o) => {
          const br = getBR(o);
          o.set({ left: cursor });
          o.setCoords();
          cursor += br.width;
        });
        break;
      }
      case "pack-v": {
        const sorted = [...objects].sort((a, b) => getBR(a).top - getBR(b).top);
        let cursor = getBR(sorted[0]).top;
        sorted.forEach((o) => {
          const br = getBR(o);
          o.set({ top: cursor });
          o.setCoords();
          cursor += br.height;
        });
        break;
      }
    }

    fabricCanvas.requestRenderAll();
    toast.success("Distribuído");
  }, [getSelectedObjects, fabricCanvas, distributeMode, cols, gapX, gapY]);

  const ALIGN_BTNS: { mode: AlignMode; label: string }[] = [
    { mode: "left", label: "⬅ Esquerda" },
    { mode: "center-h", label: "⟺ Centro H" },
    { mode: "right", label: "Direita ➡" },
    { mode: "top", label: "⬆ Topo" },
    { mode: "center-v", label: "⟺ Centro V" },
    { mode: "bottom", label: "Base ⬇" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Distribuir e Alinhar</span>
      </div>

      {/* Align */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhar objetos</span>
        <div className="grid grid-cols-3 gap-1">
          {ALIGN_BTNS.map(btn => (
            <button
              key={btn.mode}
              onClick={() => align(btn.mode)}
              className="py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distribute mode */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo de distribuição</span>
        <div className="flex flex-col gap-1">
          {DISTRIBUTE_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setDistributeMode(m.value)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${distributeMode === m.value ? "bg-primary/10 border-primary" : "border-border hover:border-primary/30"}`}
            >
              <span className={`text-[10px] font-medium flex-1 ${distributeMode === m.value ? "text-primary" : ""}`}>{m.label}</span>
              <span className="text-[8px] text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid-specific controls */}
      {distributeMode === "grid" && (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Colunas</span>
              <span className="text-[9px] tabular-nums">{cols}</span>
            </div>
            <input type="range" min={1} max={8} step={1} value={cols} onChange={e => setCols(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Gap X</span>
              <span className="text-[9px] tabular-nums">{gapX}px</span>
            </div>
            <input type="range" min={0} max={200} step={5} value={gapX} onChange={e => setGapX(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Gap Y</span>
              <span className="text-[9px] tabular-nums">{gapY}px</span>
            </div>
            <input type="range" min={0} max={200} step={5} value={gapY} onChange={e => setGapY(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
        </div>
      )}

      <button
        onClick={distribute}
        className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors"
      >
        {distributeMode === "grid" ? <Rows className="w-3.5 h-3.5" /> : <AlignJustify className="w-3.5 h-3.5" />}
        {distributeMode === "equal-h" && "Distribuir Horizontalmente"}
        {distributeMode === "equal-v" && "Distribuir Verticalmente"}
        {distributeMode === "grid" && "Organizar em Grade"}
        {distributeMode === "pack-h" && "Encostar Horizontalmente"}
        {distributeMode === "pack-v" && "Encostar Verticalmente"}
      </button>

      <p className="text-[8px] text-muted-foreground/60 text-center">
        Selecione 2+ objetos para distribuir e alinhar
      </p>

      {/* Canvas align */}
      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Centralizar no canvas</span>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => {
              if (!fabricCanvas) return;
              const obj = fabricCanvas.getActiveObject();
              if (!obj) return;
              const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
              const br = obj.getBoundingRect();
              obj.set({ left: (cw - br.width) / 2 });
              obj.setCoords();
              fabricCanvas.requestRenderAll();
              toast.success("Centralizado horizontalmente");
            }}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <AlignCenter className="w-3 h-3" /> Centro H
          </button>
          <button
            onClick={() => {
              if (!fabricCanvas) return;
              const obj = fabricCanvas.getActiveObject();
              if (!obj) return;
              const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
              const br = obj.getBoundingRect();
              obj.set({ top: (ch - br.height) / 2 });
              obj.setCoords();
              fabricCanvas.requestRenderAll();
              toast.success("Centralizado verticalmente");
            }}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <AlignCenter className="w-3 h-3 rotate-90" /> Centro V
          </button>
        </div>
      </div>
    </div>
  );
}
