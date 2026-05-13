"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";

interface SmartGuidesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type GuideOrientation = "h" | "v";
interface Guide { id: number; orientation: GuideOrientation; position: number }

let guideIdCounter = 0;

function renderGuides(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  vpt: number[],
  cw: number,
  ch: number,
  guides: Guide[],
  snapEnabled: boolean,
  showSmartGuides: boolean
) {
  ctx.save();
  ctx.setTransform(zoom, 0, 0, zoom, vpt[4], vpt[5]);

  guides.forEach((g) => {
    ctx.strokeStyle = "rgba(236,72,153,0.8)";
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([]);
    ctx.beginPath();
    if (g.orientation === "h") {
      ctx.moveTo(0, g.position);
      ctx.lineTo(cw, g.position);
    } else {
      ctx.moveTo(g.position, 0);
      ctx.lineTo(g.position, ch);
    }
    ctx.stroke();
  });

  if (showSmartGuides) {
    // Smart guide: thirds lines
    ctx.strokeStyle = "rgba(99,102,241,0.2)";
    ctx.lineWidth = 0.5 / zoom;
    ctx.setLineDash([3 / zoom, 3 / zoom]);
    ctx.beginPath();
    ctx.moveTo(cw / 3, 0); ctx.lineTo(cw / 3, ch);
    ctx.moveTo((cw * 2) / 3, 0); ctx.lineTo((cw * 2) / 3, ch);
    ctx.moveTo(0, ch / 3); ctx.lineTo(cw, ch / 3);
    ctx.moveTo(0, (ch * 2) / 3); ctx.lineTo(cw, (ch * 2) / 3);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function SmartGuidesPanel({ fabricCanvas }: SmartGuidesPanelProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapThreshold, setSnapThreshold] = useState(8);
  const [showSmartGuides, setShowSmartGuides] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [newH, setNewH] = useState(200);
  const [newV, setNewV] = useState(200);

  const guidesRef = useRef(guides);
  const snapRef = useRef(snapEnabled);
  const snapThreshRef = useRef(snapThreshold);
  const showRef = useRef(showGuides);
  const smartRef = useRef(showSmartGuides);

  useEffect(() => { guidesRef.current = guides; }, [guides]);
  useEffect(() => { snapRef.current = snapEnabled; }, [snapEnabled]);
  useEffect(() => { snapThreshRef.current = snapThreshold; }, [snapThreshold]);
  useEffect(() => { showRef.current = showGuides; }, [showGuides]);
  useEffect(() => { smartRef.current = showSmartGuides; }, [showSmartGuides]);

  // Snap logic
  useEffect(() => {
    if (!fabricCanvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMove = (e: any) => {
      if (!snapRef.current) return;
      const obj = e.target;
      if (!obj) return;
      const threshold = snapThreshRef.current;

      const objLeft = obj.left ?? 0;
      const objTop = obj.top ?? 0;
      const objRight = objLeft + (obj.getScaledWidth?.() ?? 0);
      const objBottom = objTop + (obj.getScaledHeight?.() ?? 0);
      const objCX = objLeft + (obj.getScaledWidth?.() ?? 0) / 2;
      const objCY = objTop + (obj.getScaledHeight?.() ?? 0) / 2;

      let snappedLeft = objLeft;
      let snappedTop = objTop;

      guidesRef.current.forEach((g) => {
        if (g.orientation === "v") {
          if (Math.abs(objLeft - g.position) < threshold) snappedLeft = g.position;
          else if (Math.abs(objRight - g.position) < threshold) snappedLeft = g.position - (obj.getScaledWidth?.() ?? 0);
          else if (Math.abs(objCX - g.position) < threshold) snappedLeft = g.position - (obj.getScaledWidth?.() ?? 0) / 2;
        } else {
          if (Math.abs(objTop - g.position) < threshold) snappedTop = g.position;
          else if (Math.abs(objBottom - g.position) < threshold) snappedTop = g.position - (obj.getScaledHeight?.() ?? 0);
          else if (Math.abs(objCY - g.position) < threshold) snappedTop = g.position - (obj.getScaledHeight?.() ?? 0) / 2;
        }
      });

      if (snappedLeft !== objLeft || snappedTop !== objTop) {
        obj.set({ left: snappedLeft, top: snappedTop });
        obj.setCoords?.();
      }
    };

    fabricCanvas.on("object:moving", onMove);
    return () => { fabricCanvas.off("object:moving", onMove); };
  }, [fabricCanvas]);

  // Render guides on canvas overlay
  useEffect(() => {
    if (!fabricCanvas) return;

    const render = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = fabricCanvas as any;
      const ctx = fc.contextTop as CanvasRenderingContext2D | null;
      if (!ctx) return;
      const zoom = fc.getZoom() as number;
      const vpt = fc.viewportTransform as number[];
      const cw = (fc.getWidth() as number) / zoom;
      const ch = (fc.getHeight() as number) / zoom;
      renderGuides(ctx, zoom, vpt, cw, ch, showRef.current ? guidesRef.current : [], snapRef.current, smartRef.current);
    };

    fabricCanvas.on("after:render", render);
    fabricCanvas.on("viewport:transform", render);
    fabricCanvas.requestRenderAll();

    return () => {
      fabricCanvas.off("after:render", render);
      fabricCanvas.off("viewport:transform", render);
    };
  }, [fabricCanvas]);

  useEffect(() => {
    if (fabricCanvas) fabricCanvas.requestRenderAll();
  }, [guides, showGuides, showSmartGuides, fabricCanvas]);

  const addGuide = useCallback((orientation: GuideOrientation, position: number) => {
    const id = ++guideIdCounter;
    setGuides((prev) => [...prev, { id, orientation, position }]);
  }, []);

  const removeGuide = useCallback((id: number) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const clearAllGuides = useCallback(() => {
    setGuides([]);
  }, []);

  const canvasW = fabricCanvas ? Math.round((fabricCanvas.getWidth?.() ?? 0) / fabricCanvas.getZoom()) : 0;
  const canvasH = fabricCanvas ? Math.round((fabricCanvas.getHeight?.() ?? 0) / fabricCanvas.getZoom()) : 0;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Guias e Snap</span>
      </div>

      {/* Snap toggle */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Snap às Guias</p>
          <p className="text-[9px] text-muted-foreground">Elementos se atraem para guias</p>
        </div>
        <button
          onClick={() => setSnapEnabled((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${snapEnabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${snapEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Show guides toggle */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Mostrar Guias</p>
          <p className="text-[9px] text-muted-foreground">Linhas rosa no canvas</p>
        </div>
        <button
          onClick={() => setShowGuides((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showGuides ? "bg-pink-500" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showGuides ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Smart guides (thirds) */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <div>
          <p className="text-[11px] font-medium">Regra dos Terços</p>
          <p className="text-[9px] text-muted-foreground">Grade 3×3 de composição</p>
        </div>
        <button
          onClick={() => setShowSmartGuides((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showSmartGuides ? "bg-indigo-500" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showSmartGuides ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Snap threshold */}
      {snapEnabled && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sensibilidade do Snap</span>
            <span className="text-[10px] tabular-nums">{snapThreshold}px</span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={snapThreshold}
            onChange={(e) => setSnapThreshold(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      {/* Add guides */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Adicionar Guia</span>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-16">Horizontal</span>
            <input
              type="number"
              value={newH}
              min={0}
              max={canvasH || 2000}
              onChange={(e) => setNewH(Number(e.target.value))}
              className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1 tabular-nums"
            />
            <span className="text-[9px] text-muted-foreground">px</span>
            <button
              onClick={() => addGuide("h", newH)}
              className="px-2 py-1 text-[10px] bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-16">Vertical</span>
            <input
              type="number"
              value={newV}
              min={0}
              max={canvasW || 2000}
              onChange={(e) => setNewV(Number(e.target.value))}
              className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1 tabular-nums"
            />
            <span className="text-[9px] text-muted-foreground">px</span>
            <button
              onClick={() => addGuide("v", newV)}
              className="px-2 py-1 text-[10px] bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick add: center guides */}
        <div className="flex gap-1">
          <button
            onClick={() => { addGuide("h", Math.round(canvasH / 2)); addGuide("v", Math.round(canvasW / 2)); }}
            className="flex-1 text-[9px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            + Centro H+V
          </button>
          <button
            onClick={() => { addGuide("h", Math.round(canvasH / 3)); addGuide("h", Math.round((canvasH * 2) / 3)); }}
            className="flex-1 text-[9px] py-1.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            + Terços H
          </button>
        </div>
      </div>

      {/* Guide list */}
      {guides.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Guias Ativas ({guides.length})</span>
            <button
              onClick={clearAllGuides}
              className="text-[9px] text-destructive/70 hover:text-destructive transition-colors"
            >
              Limpar todas
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {guides.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 border border-border/50">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${g.orientation === "h" ? "border-pink-500" : "border-pink-500"}`} style={{
                    borderTop: g.orientation === "h" ? "2px solid rgb(236,72,153)" : "none",
                    borderLeft: g.orientation === "v" ? "2px solid rgb(236,72,153)" : "none",
                  }} />
                  <span className="text-[9px] text-muted-foreground">{g.orientation === "h" ? "H" : "V"}</span>
                  <span className="text-[10px] tabular-nums">{g.position}px</span>
                </div>
                <button
                  onClick={() => removeGuide(g.id)}
                  className="text-[9px] text-muted-foreground/50 hover:text-destructive transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
