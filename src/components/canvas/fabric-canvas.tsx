"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditorStore } from "@/store/editor-store";

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
  const [canvasReady, setCanvasReady] = useState(0);
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

  if (!template) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
        Selecione um template para começar
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative" style={{ width: template.width * zoom, height: template.height * zoom }}>
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
      <div className="shadow-2xl">
        <canvas ref={canvasRef} />
      </div>
      {/* Grid toggle button */}
      <button
        onClick={() => setShowGrid((v) => !v)}
        className={`absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded border transition-colors z-20 ${
          showGrid ? "bg-primary/20 border-primary/40 text-primary" : "bg-black/40 border-white/10 text-white/50 hover:text-white/80"
        }`}
        title="Mostrar/ocultar grade"
      >
        Grid
      </button>
    </div>
  );
}
