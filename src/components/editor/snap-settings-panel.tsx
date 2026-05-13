"use client";

import { useCallback, useState } from "react";
import { Magnet, Grid3X3, AlignCenter, Move } from "lucide-react";
import { toast } from "sonner";

interface SnapSettingsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const SNAP_PRESETS = [5, 10, 20, 25, 50];

function ToggleRow({ label, value, onChange, description }: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex flex-col">
        <span className="text-[10px]">{label}</span>
        {description && <span className="text-[8px] text-muted-foreground/60">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${value ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function SnapSettingsPanel({ fabricCanvas }: SnapSettingsPanelProps) {
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [snapToObjects, setSnapToObjects] = useState(true);
  const [snapToCenter, setSnapToCenter] = useState(true);
  const [snapToEdge, setSnapToEdge] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [tolerance, setTolerance] = useState(8);

  const applySnap = useCallback(() => {
    if (!fabricCanvas) return;

    if (snapToGrid) {
      fabricCanvas.on("object:moving", (e: { target: { left: number; top: number } }) => {
        const obj = e.target;
        obj.left = Math.round(obj.left / gridSize) * gridSize;
        obj.top = Math.round(obj.top / gridSize) * gridSize;
      });
    } else {
      fabricCanvas.off("object:moving");
    }

    fabricCanvas.requestRenderAll();
    toast.success("Configurações de snap aplicadas");
  }, [fabricCanvas, snapToGrid, gridSize]);

  const clearGuides = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guides = fabricCanvas.getObjects().filter((o: any) => o.data?.isGuide || o.data?.isSnapGuide);
    guides.forEach((g: unknown) => fabricCanvas.remove(g));
    fabricCanvas.requestRenderAll();
    toast.success("Guias removidas");
  }, [fabricCanvas]);

  const showCenterGuides = useCallback(() => {
    if (!fabricCanvas) return;
    import("fabric").then(m => {
      const fabric = m.fabric;
      const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
      const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();

      const vLine = new fabric.Line([cw / 2, 0, cw / 2, ch], {
        stroke: "#3b82f6",
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { isSnapGuide: true } as any,
      });
      const hLine = new fabric.Line([0, ch / 2, cw, ch / 2], {
        stroke: "#3b82f6",
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { isSnapGuide: true } as any,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.add(vLine as any, hLine as any);
      fabricCanvas.sendToBack(vLine as unknown as Parameters<typeof fabricCanvas.sendToBack>[0]);
      fabricCanvas.sendToBack(hLine as unknown as Parameters<typeof fabricCanvas.sendToBack>[0]);
      fabricCanvas.requestRenderAll();
      toast.success("Guias centrais exibidas");
    });
  }, [fabricCanvas]);


  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Magnet className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Snap e Guias</span>
      </div>

      {/* Snap options */}
      <div className="flex flex-col gap-1 p-2 rounded border border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Magnetismo</span>
        <ToggleRow label="Snap à grade" value={snapToGrid} onChange={setSnapToGrid} description="Alinha ao grid ao mover" />
        <ToggleRow label="Snap a objetos" value={snapToObjects} onChange={setSnapToObjects} description="Alinha às bordas de outros objetos" />
        <ToggleRow label="Snap ao centro" value={snapToCenter} onChange={setSnapToCenter} description="Alinha ao centro dos objetos" />
        <ToggleRow label="Snap às bordas" value={snapToEdge} onChange={setSnapToEdge} description="Alinha às extremidades" />
      </div>

      {/* Grid snap size */}
      {snapToGrid && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho do grid de snap</span>
          <div className="flex gap-1">
            {SNAP_PRESETS.map(s => (
              <button
                key={s}
                onClick={() => setGridSize(s)}
                className={`flex-1 py-1 rounded border text-[9px] transition-colors ${gridSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {s}px
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-muted-foreground">Personalizado</span>
            <input
              type="number"
              min={1}
              max={200}
              value={gridSize}
              onChange={e => setGridSize(Number(e.target.value))}
              className="w-16 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[9px] font-mono focus:outline-none focus:border-primary text-right"
            />
          </div>
        </div>
      )}

      {/* Tolerance */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Tolerância de snap</span>
          <span className="text-[9px] tabular-nums">{tolerance}px</span>
        </div>
        <input
          type="range"
          min={2}
          max={30}
          step={1}
          value={tolerance}
          onChange={e => setTolerance(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <p className="text-[8px] text-muted-foreground/60">Distância em que o snap ativa</p>
      </div>

      <button
        onClick={applySnap}
        className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
      >
        <Magnet className="w-3 h-3" /> Aplicar Snap
      </button>

      {/* Guide tools */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Guias Visuais</span>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={showCenterGuides}
            className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <AlignCenter className="w-3 h-3" /> Guias Centrais
          </button>
          <button
            onClick={clearGuides}
            className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/40 hover:text-destructive transition-colors"
          >
            <Grid3X3 className="w-3 h-3" /> Limpar Guias
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-2 rounded bg-muted/30 border border-border/50">
        <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
          <Move className="w-3 h-3" /> Dicas de snap
        </span>
        <p className="text-[8px] text-muted-foreground/70">• Segure <kbd className="bg-muted px-1 rounded text-[7px]">Alt</kbd> para desativar o snap temporariamente</p>
        <p className="text-[8px] text-muted-foreground/70">• Use setas do teclado para mover com precisão (1px por vez)</p>
        <p className="text-[8px] text-muted-foreground/70">• <kbd className="bg-muted px-1 rounded text-[7px]">Shift</kbd>+seta move 10px de uma vez</p>
      </div>
    </div>
  );
}
