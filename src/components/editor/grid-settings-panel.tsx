"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Grid3X3 } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

function renderGrid(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  vpt: number[],
  cw: number,
  ch: number,
  opts: { showGrid: boolean; showCenterLines: boolean; showSafeZone: boolean; gridSize: number; gridColor: string; safeZonePercent: number }
) {
  ctx.save();
  ctx.setTransform(zoom, 0, 0, zoom, vpt[4], vpt[5]);

  if (opts.showGrid) {
    ctx.strokeStyle = opts.gridColor;
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    for (let x = 0; x <= cw; x += opts.gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, ch); }
    for (let y = 0; y <= ch; y += opts.gridSize) { ctx.moveTo(0, y); ctx.lineTo(cw, y); }
    ctx.stroke();
  }

  if (opts.showCenterLines) {
    ctx.strokeStyle = "rgba(59,130,246,0.5)";
    ctx.lineWidth = 0.5 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0); ctx.lineTo(cw / 2, ch);
    ctx.moveTo(0, ch / 2); ctx.lineTo(cw, ch / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (opts.showSafeZone) {
    const m = opts.safeZonePercent / 100;
    ctx.strokeStyle = "rgba(245,158,11,0.6)";
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([6 / zoom, 3 / zoom]);
    ctx.strokeRect(cw * m, ch * m, cw * (1 - m * 2), ch * (1 - m * 2));
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(245,158,11,0.08)";
    ctx.fillRect(cw * m, ch * m, cw * (1 - m * 2), ch * (1 - m * 2));
  }

  ctx.restore();
}

interface GridSettingsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const GRID_SIZES = [5, 10, 20, 25, 50, 100];
const GRID_COLORS = [
  { label: "Branco", value: "rgba(255,255,255,0.15)" },
  { label: "Azul", value: "rgba(59,130,246,0.25)" },
  { label: "Verde", value: "rgba(34,197,94,0.2)" },
  { label: "Vermelho", value: "rgba(239,68,68,0.2)" },
  { label: "Amarelo", value: "rgba(245,158,11,0.25)" },
  { label: "Cinza", value: "rgba(156,163,175,0.2)" },
];

export function GridSettingsPanel({ fabricCanvas }: GridSettingsPanelProps) {
  const { snapToGrid, setSnapToGrid } = useEditorStore();
  const [gridSize, setGridSize] = useState(20);
  const [gridColor, setGridColor] = useState("rgba(255,255,255,0.15)");
  const [showGrid, setShowGrid] = useState(false);
  const [showCenterLines, setShowCenterLines] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [safeZonePercent, setSafeZonePercent] = useState(10);

  // Store opts in a ref so the render callback (registered once) always sees latest values
  const optsRef = useRef({ showGrid, showCenterLines, showSafeZone, gridSize, gridColor, safeZonePercent });
  useEffect(() => {
    optsRef.current = { showGrid, showCenterLines, showSafeZone, gridSize, gridColor, safeZonePercent };
  }, [showGrid, showCenterLines, showSafeZone, gridSize, gridColor, safeZonePercent]);

  const triggerRedraw = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const render = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = fabricCanvas as any;
      const ctx = fc.contextTop as CanvasRenderingContext2D | null;
      if (!ctx) return;
      const zoom = fc.getZoom() as number;
      ctx.clearRect(0, 0, fc.getWidth() as number, fc.getHeight() as number);
      const vpt = fc.viewportTransform as number[];
      const cw = (fc.getWidth() as number) / zoom;
      const ch = (fc.getHeight() as number) / zoom;
      renderGrid(ctx, zoom, vpt, cw, ch, optsRef.current);
    };

    fabricCanvas.on("after:render", render);
    fabricCanvas.on("viewport:transform", render);
    fabricCanvas.requestRenderAll();

    return () => {
      fabricCanvas.off("after:render", render);
      fabricCanvas.off("viewport:transform", render);
    };
  }, [fabricCanvas]);

  useEffect(() => { triggerRedraw(); }, [showGrid, showCenterLines, showSafeZone, gridSize, gridColor, safeZonePercent, triggerRedraw]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Grade e Guias</span>
      </div>

      {/* Snap to grid */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Snap à Grade</p>
          <p className="text-[9px] text-muted-foreground">Elementos se encaixam na grade</p>
        </div>
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`relative w-10 h-5 rounded-full transition-colors ${snapToGrid ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${snapToGrid ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Show grid */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Mostrar Grade</p>
          <p className="text-[9px] text-muted-foreground">Grade visual no canvas</p>
        </div>
        <button
          onClick={() => setShowGrid((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showGrid ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showGrid ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Show center lines */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Linhas de Centro</p>
          <p className="text-[9px] text-muted-foreground">Eixos central H e V (azul)</p>
        </div>
        <button
          onClick={() => setShowCenterLines((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showCenterLines ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showCenterLines ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Safe zone */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Zona Segura</p>
          <p className="text-[9px] text-muted-foreground">Margem de segurança para impressão</p>
        </div>
        <button
          onClick={() => setShowSafeZone((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showSafeZone ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showSafeZone ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {showSafeZone && (
        <div className="flex flex-col gap-1.5 pl-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Margem ({safeZonePercent}%)</span>
          </div>
          <input
            type="range"
            min={5}
            max={25}
            step={1}
            value={safeZonePercent}
            onChange={(e) => setSafeZonePercent(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex gap-1">
            {[5, 10, 15, 20].map((v) => (
              <button
                key={v}
                onClick={() => setSafeZonePercent(v)}
                className={`flex-1 text-[9px] py-0.5 rounded border transition-colors ${safeZonePercent === v ? "bg-amber-500/10 border-amber-500 text-amber-500" : "border-border text-muted-foreground hover:border-amber-500/40"}`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid size */}
      {showGrid && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho da Célula</span>
          <div className="flex gap-1 flex-wrap">
            {GRID_SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setGridSize(s)}
                className={`text-[9px] px-2 py-1 rounded border transition-colors ${gridSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {s}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid color */}
      {showGrid && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor da Grade</span>
          <div className="flex gap-1.5 flex-wrap">
            {GRID_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setGridColor(c.value)}
                className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${gridColor === c.value ? "border-primary scale-110" : "border-border/40"}`}
                style={{ background: c.value.replace(/[\d.]+\)$/, "1)") }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
