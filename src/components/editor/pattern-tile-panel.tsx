"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PatternTilePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type TileMode = "repeat" | "mirror-x" | "mirror-y" | "mirror-xy";

const TILE_MODES: { value: TileMode; label: string }[] = [
  { value: "repeat", label: "Repetição simples" },
  { value: "mirror-x", label: "Espelho horizontal" },
  { value: "mirror-y", label: "Espelho vertical" },
  { value: "mirror-xy", label: "Espelho duplo" },
];

export function PatternTilePanel({ fabricCanvas, selectionVersion }: PatternTilePanelProps) {
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(4);
  const [gapX, setGapX] = useState(0);
  const [gapY, setGapY] = useState(0);
  const [mode, setMode] = useState<TileMode>("repeat");
  const [hasObject, setHasObject] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => setHasObject(!!obj));
  }, [fabricCanvas, selectionVersion]);

  const generatePattern = useCallback(async () => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    const fabric = await import("fabric").then(m => m.fabric);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objW = (obj as any).getBoundingRect().width;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objH = (obj as any).getBoundingRect().height;
    const stepX = objW + gapX;
    const stepY = objH + gapY;

    const clones: unknown[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue; // keep original

        await new Promise<void>((resolve) => {
          obj.clone((cloned: { set: (p: Record<string, unknown>) => void; setCoords: () => void }) => {
            let flipX = false;
            let flipY = false;

            if (mode === "mirror-x" || mode === "mirror-xy") {
              flipX = c % 2 === 1;
            }
            if (mode === "mirror-y" || mode === "mirror-xy") {
              flipY = r % 2 === 1;
            }

            cloned.set({
              left: c * stepX + offsetX,
              top: r * stepY + offsetY,
              flipX,
              flipY,
              evented: true,
              selectable: true,
            });
            cloned.setCoords();
            clones.push(cloned);
            resolve();
          });
        });
      }
    }

    // Position original at 0,0 of pattern
    obj.set({ left: offsetX, top: offsetY });
    obj.setCoords();

    clones.forEach(c => fabricCanvas.add(c as Parameters<typeof fabricCanvas.add>[0]));

    // Select all including original
    if (clones.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sel = new (fabric as any).ActiveSelection([obj, ...clones], { canvas: fabricCanvas });
      fabricCanvas.setActiveObject(sel);
    }

    fabricCanvas.requestRenderAll();
    toast.success(`Padrão ${cols}×${rows} gerado (${clones.length + 1} objetos)`);
  }, [fabricCanvas, cols, rows, gapX, gapY, mode, offsetX, offsetY]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Repeat className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Repetição de Padrão</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Repeat className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para criar o padrão</p>
        </div>
      ) : (
        <>
          {/* Mode */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo</span>
            <div className="flex flex-col gap-1">
              {TILE_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`px-2 py-1.5 rounded border text-left text-[10px] transition-colors ${mode === m.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Colunas</span>
                <span className="text-[9px] tabular-nums">{cols}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={cols} onChange={e => setCols(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Linhas</span>
                <span className="text-[9px] tabular-nums">{rows}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={rows} onChange={e => setRows(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Gap X</span>
                <span className="text-[9px] tabular-nums">{gapX}px</span>
              </div>
              <input type="range" min={-100} max={200} step={2} value={gapX} onChange={e => setGapX(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Gap Y</span>
                <span className="text-[9px] tabular-nums">{gapY}px</span>
              </div>
              <input type="range" min={-100} max={200} step={2} value={gapY} onChange={e => setGapY(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Offset */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Posição inicial</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Offset X</span>
                  <span className="text-[9px] tabular-nums">{offsetX}px</span>
                </div>
                <input type="range" min={0} max={400} step={5} value={offsetX} onChange={e => setOffsetX(Number(e.target.value))} className="w-full accent-primary h-1" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Offset Y</span>
                  <span className="text-[9px] tabular-nums">{offsetY}px</span>
                </div>
                <input type="range" min={0} max={400} step={5} value={offsetY} onChange={e => setOffsetY(Number(e.target.value))} className="w-full accent-primary h-1" />
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-muted/40 text-[9px] text-muted-foreground text-center">
            {cols} × {rows} = {cols * rows} objetos
          </div>

          <button
            onClick={generatePattern}
            className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Gerar Padrão
          </button>

          <p className="text-[8px] text-muted-foreground/60 text-center">
            O objeto original é mantido — as cópias são adicionadas ao canvas
          </p>
        </>
      )}
    </div>
  );
}
