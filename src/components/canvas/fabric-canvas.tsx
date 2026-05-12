"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditorStore } from "@/store/editor-store";

const RULER_SIZE = 20;

interface FabricCanvasProps {
  onCanvasReady?: (canvas: unknown) => void;
  onSelectionChange?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricInstance = any;

export function FabricCanvas({ onCanvasReady, onSelectionChange }: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<FabricInstance>(null);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const spaceDownRef = useRef(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [canvasReady, setCanvasReady] = useState(0);
  const [guides, setGuides] = useState<{ type: "h" | "v"; pos: number }[]>([]);
  const draggingGuideRef = useRef<number | null>(null);
  const rulerHRef = useRef<HTMLCanvasElement>(null);
  const rulerVRef = useRef<HTMLCanvasElement>(null);
  const { template, zoom, setZoom, snapToGrid } = useEditorStore();

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || !template) return;

    const fabric = await import("fabric").then((m) => m.fabric);

    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: template.width,
      height: template.height,
      backgroundColor: template.backgroundColor,
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = canvas;

    if (onSelectionChange) {
      canvas.on("selection:created", onSelectionChange);
      canvas.on("selection:updated", onSelectionChange);
      canvas.on("selection:cleared", onSelectionChange);
    }

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    setCanvasReady((n) => n + 1);

    return () => {
      canvas.dispose();
    };
  }, [template, onCanvasReady, onSelectionChange]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const scale = zoom;
    fabricRef.current.setZoom(scale);
    fabricRef.current.setWidth(template ? template.width * scale : 0);
    fabricRef.current.setHeight(template ? template.height * scale : 0);
    fabricRef.current.renderAll();
  }, [zoom, template]);

  // Zoom com Ctrl+scroll
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);
      setZoom(parseFloat(newZoom.toFixed(2)));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, setZoom]);

  // Pan com Espaço+arrastar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceDownRef.current) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        spaceDownRef.current = true;
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = "grab";
          fabricRef.current.hoverCursor = "grab";
          fabricRef.current.selection = false;
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDownRef.current = false;
        isPanningRef.current = false;
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = "default";
          fabricRef.current.hoverCursor = "move";
          fabricRef.current.selection = true;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const onMouseDown = (opt: { e: MouseEvent }) => {
      if (!spaceDownRef.current) return;
      isPanningRef.current = true;
      canvas.defaultCursor = "grabbing";
      lastPosRef.current = { x: opt.e.clientX, y: opt.e.clientY };
    };

    const onMouseMove = (opt: { e: MouseEvent }) => {
      if (!isPanningRef.current) return;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;
      vpt[4] += opt.e.clientX - lastPosRef.current.x;
      vpt[5] += opt.e.clientY - lastPosRef.current.y;
      canvas.requestRenderAll();
      lastPosRef.current = { x: opt.e.clientX, y: opt.e.clientY };
    };

    const onMouseUp = () => {
      isPanningRef.current = false;
      if (spaceDownRef.current) canvas.defaultCursor = "grab";
    };

    canvas.on("mouse:down", onMouseDown);
    canvas.on("mouse:move", onMouseMove);
    canvas.on("mouse:up", onMouseUp);

    return () => {
      canvas.off("mouse:down", onMouseDown);
      canvas.off("mouse:move", onMouseMove);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvasReady]);

  // Snap to grid
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const GRID = 20;

    const onMoving = (opt: { target: FabricInstance }) => {
      if (!snapToGrid) return;
      const obj = opt.target;
      obj.set({
        left: Math.round((obj.left ?? 0) / GRID) * GRID,
        top: Math.round((obj.top ?? 0) / GRID) * GRID,
      });
    };

    canvas.on("object:moving", onMoving);
    return () => canvas.off("object:moving", onMoving);
  }, [snapToGrid, canvasReady]);

  // Draw ruler ticks on a canvas element
  const drawRuler = useCallback((
    ctx: CanvasRenderingContext2D,
    length: number,
    axis: "h" | "v",
    z: number
  ) => {
    ctx.clearRect(0, 0, axis === "h" ? length : RULER_SIZE, axis === "h" ? RULER_SIZE : length);
    ctx.fillStyle = "#1c1c1c";
    ctx.fillRect(0, 0, axis === "h" ? length : RULER_SIZE, axis === "h" ? RULER_SIZE : length);

    const step = z >= 1 ? 50 : z >= 0.5 ? 100 : 200;
    const totalUnits = Math.ceil((axis === "h" ? length : length) / z / step) * step;

    ctx.fillStyle = "#888";
    ctx.font = "8px sans-serif";
    ctx.textAlign = axis === "h" ? "center" : "right";

    for (let u = 0; u <= totalUnits; u += step) {
      const px = u * z;
      const isLong = u % (step * 2) === 0;
      const tickLen = isLong ? 10 : 5;

      ctx.strokeStyle = "#555";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      if (axis === "h") {
        ctx.moveTo(px, RULER_SIZE); ctx.lineTo(px, RULER_SIZE - tickLen);
        if (isLong) ctx.fillText(String(u), px, RULER_SIZE - 12);
      } else {
        ctx.moveTo(RULER_SIZE, px); ctx.lineTo(RULER_SIZE - tickLen, px);
        if (isLong) {
          ctx.save(); ctx.translate(RULER_SIZE - 12, px); ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(u), 0, 0); ctx.restore();
        }
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    if (!showRulers || !template) return;
    const w = template.width * zoom;
    const h = template.height * zoom;
    if (rulerHRef.current) {
      const ctx = rulerHRef.current.getContext("2d");
      if (ctx) drawRuler(ctx, w, "h", zoom);
    }
    if (rulerVRef.current) {
      const ctx = rulerVRef.current.getContext("2d");
      if (ctx) drawRuler(ctx, h, "v", zoom);
    }
  }, [showRulers, template, zoom, drawRuler]);

  const handleRulerMouseDown = (e: React.MouseEvent, type: "h" | "v") => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = type === "h"
      ? (e.clientX - rect.left) / zoom
      : (e.clientY - rect.top) / zoom;
    setGuides((prev) => [...prev, { type, pos }]);
  };

  const handleGuideMouseDown = (idx: number) => {
    draggingGuideRef.current = idx;
  };

  const handleGuideMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingGuideRef.current === null) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const idx = draggingGuideRef.current;
    const g = guides[idx];
    const pos = g.type === "h"
      ? (e.clientX - rect.left) / zoom
      : (e.clientY - rect.top) / zoom;
    setGuides((prev) => prev.map((gg, i) => i === idx ? { ...gg, pos: Math.max(0, pos) } : gg));
  };

  const handleGuideMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingGuideRef.current === null) return;
    const idx = draggingGuideRef.current;
    const g = guides[idx];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const canvasW = template?.width ?? 0;
    const canvasH = template?.height ?? 0;
    const pos = g.type === "h"
      ? (e.clientX - rect.left) / zoom
      : (e.clientY - rect.top) / zoom;
    if (pos < 0 || (g.type === "h" && pos > canvasW) || (g.type === "v" && pos > canvasH)) {
      setGuides((prev) => prev.filter((_, i) => i !== idx));
    }
    draggingGuideRef.current = null;
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
        Selecione um template para começar
      </div>
    );
  }

  const cw = template.width * zoom;
  const ch = template.height * zoom;

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ width: cw + (showRulers ? RULER_SIZE : 0), height: ch + (showRulers ? RULER_SIZE : 0) }}
      onMouseMove={handleGuideMouseMove}
      onMouseUp={handleGuideMouseUp}
    >
      {/* Corner square */}
      {showRulers && (
        <div className="absolute top-0 left-0 bg-[#1c1c1c] z-30" style={{ width: RULER_SIZE, height: RULER_SIZE }} />
      )}

      {/* Horizontal ruler */}
      {showRulers && (
        <canvas
          ref={rulerHRef}
          width={cw}
          height={RULER_SIZE}
          className="absolute cursor-s-resize z-30"
          style={{ left: RULER_SIZE, top: 0 }}
          onMouseDown={(e) => handleRulerMouseDown(e, "v")}
          title="Arraste para criar guia horizontal"
        />
      )}

      {/* Vertical ruler */}
      {showRulers && (
        <canvas
          ref={rulerVRef}
          width={RULER_SIZE}
          height={ch}
          className="absolute cursor-e-resize z-30"
          style={{ left: 0, top: RULER_SIZE }}
          onMouseDown={(e) => handleRulerMouseDown(e, "h")}
          title="Arraste para criar guia vertical"
        />
      )}

      {/* Canvas */}
      <div
        className="shadow-2xl absolute"
        style={{ left: showRulers ? RULER_SIZE : 0, top: showRulers ? RULER_SIZE : 0 }}
      >
        {/* Grid overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              zIndex: 10,
            }}
          />
        )}
        <canvas ref={canvasRef} />

        {/* Guide lines */}
        {showRulers && guides.map((g, i) => (
          <div
            key={i}
            className="absolute pointer-events-auto cursor-move z-20"
            style={g.type === "v"
              ? { left: g.pos * zoom - 0.5, top: 0, width: 1, height: ch, background: "rgba(0,180,255,0.8)", borderLeft: "1px dashed #00b4ff" }
              : { top: g.pos * zoom - 0.5, left: 0, height: 1, width: cw, background: "rgba(0,180,255,0.8)", borderTop: "1px dashed #00b4ff" }
            }
            onMouseDown={() => handleGuideMouseDown(i)}
          />
        ))}
      </div>

      {/* Bottom-right controls */}
      <div
        className="absolute z-30 flex gap-1"
        style={{ bottom: 8, right: 8 }}
      >
        <button
          onClick={() => setShowRulers((v) => !v)}
          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
            showRulers ? "bg-primary/20 border-primary/40 text-primary" : "bg-black/40 border-white/10 text-white/50 hover:text-white/80"
          }`}
          title="Mostrar/ocultar réguas"
        >
          Réguas
        </button>
        {showRulers && guides.length > 0 && (
          <button
            onClick={() => setGuides([])}
            className="text-[10px] px-2 py-1 rounded border bg-black/40 border-white/10 text-white/50 hover:text-red-400 transition-colors"
            title="Limpar guias"
          >
            ✕ Guias
          </button>
        )}
        <button
          onClick={() => setShowGrid((v) => !v)}
          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
            showGrid ? "bg-primary/20 border-primary/40 text-primary" : "bg-black/40 border-white/10 text-white/50 hover:text-white/80"
          }`}
          title="Mostrar/ocultar grade"
        >
          Grid
        </button>
      </div>
    </div>
  );
}
