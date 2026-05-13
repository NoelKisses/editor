"use client";

import { useRef, useCallback, useEffect } from "react";
import { CanvasRuler } from "./canvas-ruler";
import { Ruler } from "lucide-react";

interface CanvasWithRulersProps {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  showRulers?: boolean;
  onToggleRulers?: () => void;
}

const RULER_SIZE = 20;

export function CanvasWithRulers({ children, fabricCanvas, showRulers = true, onToggleRulers }: CanvasWithRulersProps) {
  const guidesRef = useRef<{ h: number[]; v: number[] }>({ h: [], v: [] });

  const addGuide = useCallback((axis: "h" | "v", value: number) => {
    if (axis === "h") {
      guidesRef.current = { ...guidesRef.current, h: [...guidesRef.current.h, value] };
    } else {
      guidesRef.current = { ...guidesRef.current, v: [...guidesRef.current.v, value] };
    }
    if (fabricCanvas?.requestRenderAll) fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const clearGuides = useCallback(() => {
    guidesRef.current = { h: [], v: [] };
    if (fabricCanvas?.requestRenderAll) fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  // Draw guides overlay on the fabric canvas after:render
  useEffect(() => {
    if (!fabricCanvas) return;

    const drawGuides = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vp = fabricCanvas.viewportTransform as any[];
      const offsetX = vp?.[4] ?? 0;
      const offsetY = vp?.[5] ?? 0;
      const zoom = fabricCanvas.getZoom?.() ?? 1;
      const { h: guidesH, v: guidesV } = guidesRef.current;

      const ctx = fabricCanvas.contextTop ?? fabricCanvas.getSelectionContext?.();
      if (!ctx) return;
      const w = fabricCanvas.getWidth?.() ?? 0;
      const h = fabricCanvas.getHeight?.() ?? 0;

      guidesH.forEach((g) => {
        const pos = g * zoom + offsetX;
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, h);
        ctx.stroke();
        ctx.restore();
      });

      guidesV.forEach((g) => {
        const pos = g * zoom + offsetY;
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(w, pos);
        ctx.stroke();
        ctx.restore();
      });
    };

    fabricCanvas.on("after:render", drawGuides);
    return () => fabricCanvas.off("after:render", drawGuides);
  }, [fabricCanvas]);

  return (
    <div className="relative flex flex-col w-full h-full">
      {showRulers && (
        <div className="flex flex-shrink-0">
          {/* Corner — click to clear guides */}
          <button
            className="flex-shrink-0 flex items-center justify-center hover:bg-accent/40 transition-colors"
            style={{ width: RULER_SIZE, height: RULER_SIZE, background: "#1a1a1a", borderRight: "1px solid #333", borderBottom: "1px solid #333" }}
            onClick={clearGuides}
            title="Limpar guias"
          >
            <Ruler className="w-2.5 h-2.5 text-muted-foreground/50" />
          </button>
          {/* Horizontal ruler */}
          <div className="flex-1 overflow-hidden" style={{ height: RULER_SIZE }}>
            {fabricCanvas && (
              <CanvasRuler
                orientation="horizontal"
                fabricCanvas={fabricCanvas}
                size={RULER_SIZE}
                guidesRef={guidesRef}
                onAddGuide={addGuide}
              />
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {showRulers && (
          <div className="flex-shrink-0 overflow-hidden" style={{ width: RULER_SIZE }}>
            {fabricCanvas && (
              <CanvasRuler
                orientation="vertical"
                fabricCanvas={fabricCanvas}
                size={RULER_SIZE}
                guidesRef={guidesRef}
                onAddGuide={addGuide}
              />
            )}
          </div>
        )}
        {/* Canvas content */}
        <div className="flex-1 relative overflow-auto">
          {children}
        </div>
      </div>

      {/* Toggle ruler button */}
      {onToggleRulers && (
        <button
          onClick={onToggleRulers}
          className={`absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[9px] transition-colors z-10 ${
            showRulers ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
          title={showRulers ? "Ocultar réguas" : "Mostrar réguas"}
        >
          <Ruler className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
