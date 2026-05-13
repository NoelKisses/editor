"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Copy, Trash2, Lock, Unlock, FlipHorizontal2, Bold, Italic, Underline, ZoomIn, ZoomOut, Maximize, Upload } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

const RULER_SIZE = 20;
const SNAP_THRESHOLD = 8; // pixels

interface FabricCanvasProps {
  onCanvasReady?: (canvas: unknown) => void;
  onSelectionChange?: () => void;
}

interface SnapLine {
  type: "v" | "h";
  pos: number; // in canvas units (pre-zoom)
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
  const [showSmartGuides, setShowSmartGuides] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [canvasReady, setCanvasReady] = useState(0);
  const [guides, setGuides] = useState<{ type: "h" | "v"; pos: number }[]>([]);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedObj, setSelectedObj] = useState<any>(null);
  const [selectionBounds, setSelectionBounds] = useState<{ left: number; top: number; width: number } | null>(null);
  const draggingGuideRef = useRef<number | null>(null);
  const rulerHRef = useRef<HTMLCanvasElement>(null);
  const rulerVRef = useRef<HTMLCanvasElement>(null);
  const showSmartGuidesRef = useRef(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const { template, zoom, setZoom, snapToGrid } = useEditorStore();

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (!files.length || !fabricRef.current) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    for (const file of files) {
      const dataURL = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      fabric.Image.fromURL(dataURL, (img: FabricInstance) => {
        if (!img || !fabricRef.current) return;
        const cw = template?.width ?? 800;
        const ch = template?.height ?? 600;
        const scale = Math.min(cw / (img.width ?? 1), ch / (img.height ?? 1), 1);
        img.set({ left: 60, top: 60, scaleX: scale, scaleY: scale, selectable: true });
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        fabricRef.current.requestRenderAll();
      });
    }
  }, [template]);

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

  // Track selection for floating toolbar
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const updateSelection = () => {
      const obj = canvas.getActiveObject();
      if (!obj || obj.type === "activeSelection") {
        setSelectedObj(null);
        setSelectionBounds(null);
        return;
      }
      setSelectedObj(obj);
      const br = obj.getBoundingRect(true);
      setSelectionBounds({ left: br.left * zoom, top: br.top * zoom, width: br.width * zoom });
    };

    const clearSelection = () => { setSelectedObj(null); setSelectionBounds(null); };

    canvas.on("selection:created", updateSelection);
    canvas.on("selection:updated", updateSelection);
    canvas.on("selection:cleared", clearSelection);
    canvas.on("object:moving", updateSelection);
    canvas.on("object:scaling", updateSelection);

    return () => {
      canvas.off("selection:created", updateSelection);
      canvas.off("selection:updated", updateSelection);
      canvas.off("selection:cleared", clearSelection);
      canvas.off("object:moving", updateSelection);
      canvas.off("object:scaling", updateSelection);
    };
  }, [canvasReady, zoom]);

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

  // Keep showSmartGuidesRef in sync
  useEffect(() => {
    showSmartGuidesRef.current = showSmartGuides;
  }, [showSmartGuides]);

  // Smart snap guides + grid snap
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !template) return;
    const GRID = 20;
    const CW = template.width;
    const CH = template.height;

    const getKeyPoints = (obj: FabricInstance) => {
      const l = obj.left ?? 0;
      const t = obj.top ?? 0;
      const w = (obj.getScaledWidth?.() ?? obj.width ?? 0);
      const h = (obj.getScaledHeight?.() ?? obj.height ?? 0);
      return {
        // vertical snap points (x positions)
        vSnaps: [l, l + w / 2, l + w],
        // horizontal snap points (y positions)
        hSnaps: [t, t + h / 2, t + h],
        l, t, w, h,
      };
    };

    const onMoving = (opt: { target: FabricInstance }) => {
      const obj = opt.target;
      const lines: SnapLine[] = [];

      if (snapToGrid) {
        obj.set({
          left: Math.round((obj.left ?? 0) / GRID) * GRID,
          top: Math.round((obj.top ?? 0) / GRID) * GRID,
        });
        setSnapLines([]);
        return;
      }

      if (!showSmartGuidesRef.current) {
        setSnapLines([]);
        return;
      }

      const { vSnaps, hSnaps, l, t } = getKeyPoints(obj);

      // Canvas boundary + center snap targets
      const canvasVTargets = [0, CW / 2, CW];
      const canvasHTargets = [0, CH / 2, CH];

      let newLeft = l;
      let newTop = t;

      // Check vertical (x) snap against canvas targets
      for (const snap of vSnaps) {
        for (const target of canvasVTargets) {
          if (Math.abs(snap - target) < SNAP_THRESHOLD / zoom) {
            const offset = snap - l;
            newLeft = target - offset;
            lines.push({ type: "v", pos: target });
          }
        }
      }

      // Check horizontal (y) snap against canvas targets
      for (const snap of hSnaps) {
        for (const target of canvasHTargets) {
          if (Math.abs(snap - target) < SNAP_THRESHOLD / zoom) {
            const offset = snap - t;
            newTop = target - offset;
            lines.push({ type: "h", pos: target });
          }
        }
      }

      // Check snap against other objects
      const others = canvas.getObjects().filter((o: FabricInstance) => o !== obj && o.visible !== false);
      for (const other of others) {
        const oPoints = getKeyPoints(other);

        for (const snap of vSnaps) {
          for (const target of oPoints.vSnaps) {
            if (Math.abs(snap - target) < SNAP_THRESHOLD / zoom) {
              const offset = snap - l;
              newLeft = target - offset;
              lines.push({ type: "v", pos: target });
            }
          }
        }

        for (const snap of hSnaps) {
          for (const target of oPoints.hSnaps) {
            if (Math.abs(snap - target) < SNAP_THRESHOLD / zoom) {
              const offset = snap - t;
              newTop = target - offset;
              lines.push({ type: "h", pos: target });
            }
          }
        }
      }

      if (lines.length > 0) {
        obj.set({ left: newLeft, top: newTop });
      }

      // Deduplicate lines
      const seen = new Set<string>();
      const unique = lines.filter((ln) => {
        const key = `${ln.type}:${ln.pos}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSnapLines(unique);
    };

    const onModified = () => setSnapLines([]);

    canvas.on("object:moving", onMoving);
    canvas.on("object:modified", onModified);
    canvas.on("mouse:up", onModified);

    return () => {
      canvas.off("object:moving", onMoving);
      canvas.off("object:modified", onModified);
      canvas.off("mouse:up", onModified);
    };
  }, [snapToGrid, canvasReady, template, zoom]);

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
      onMouseMove={(e) => {
        handleGuideMouseMove(e);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const rulerOffset = showRulers ? RULER_SIZE : 0;
        const x = Math.round((e.clientX - rect.left - rulerOffset) / zoom);
        const y = Math.round((e.clientY - rect.top - rulerOffset) / zoom);
        setCursorPos({ x, y });
      }}
      onMouseLeave={() => setCursorPos(null)}
      onMouseUp={handleGuideMouseUp}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false); }}
      onDrop={handleDrop}
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
        {/* Drag & Drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            style={{ background: "rgba(0,0,0,0.55)", border: "3px dashed rgba(99,102,241,0.85)", borderRadius: 4 }}
          >
            <Upload className="w-10 h-10 text-indigo-400 mb-2" />
            <span className="text-white font-semibold text-base">Solte a imagem aqui</span>
          </div>
        )}
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

        {/* Guide lines (manual, from rulers) */}
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

        {/* Smart snap lines (auto-appear while dragging) */}
        {snapLines.map((ln, i) => (
          <div
            key={`snap-${i}`}
            className="absolute pointer-events-none z-25"
            style={ln.type === "v"
              ? {
                  left: ln.pos * zoom - 0.5,
                  top: 0,
                  width: 1,
                  height: ch,
                  background: "rgba(255, 80, 80, 0.9)",
                  boxShadow: "0 0 3px rgba(255,80,80,0.6)",
                }
              : {
                  top: ln.pos * zoom - 0.5,
                  left: 0,
                  height: 1,
                  width: cw,
                  background: "rgba(255, 80, 80, 0.9)",
                  boxShadow: "0 0 3px rgba(255,80,80,0.6)",
                }
            }
          />
        ))}

        {/* Floating quick-action toolbar above selected object */}
        {selectedObj && selectionBounds && (
          <div
            className="absolute z-40 flex items-center gap-0.5 bg-card/95 border border-border rounded-lg shadow-xl px-1 py-0.5 pointer-events-auto"
            style={{
              left: Math.max(0, selectionBounds.left + selectionBounds.width / 2),
              top: Math.max(0, selectionBounds.top - 44),
              transform: "translateX(-50%)",
            }}
          >
            {/* Duplicate */}
            <button
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Duplicar (Ctrl+D)"
              onClick={() => {
                const canvas = fabricRef.current;
                if (!canvas || !selectedObj) return;
                selectedObj.clone((cloned: FabricInstance) => {
                  cloned.set({ left: (selectedObj.left ?? 0) + 20, top: (selectedObj.top ?? 0) + 20 });
                  canvas.add(cloned);
                  canvas.setActiveObject(cloned);
                  canvas.requestRenderAll();
                });
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Flip horizontal */}
            <button
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Espelhar horizontalmente"
              onClick={() => {
                if (!selectedObj) return;
                selectedObj.set({ flipX: !selectedObj.flipX });
                fabricRef.current?.requestRenderAll();
              }}
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
            </button>

            {/* Lock / Unlock */}
            <button
              className={`p-1.5 rounded hover:bg-accent transition-colors ${!selectedObj.selectable ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              title={!selectedObj.selectable ? "Desbloquear" : "Bloquear"}
              onClick={() => {
                if (!selectedObj) return;
                const locked = !selectedObj.selectable;
                selectedObj.set({
                  selectable: locked,
                  evented: locked,
                  lockMovementX: !locked,
                  lockMovementY: !locked,
                  lockScalingX: !locked,
                  lockScalingY: !locked,
                  lockRotation: !locked,
                });
                fabricRef.current?.discardActiveObject();
                fabricRef.current?.requestRenderAll();
                setSelectedObj(null);
                setSelectionBounds(null);
              }}
            >
              {!selectedObj.selectable ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            {/* Text formatting (only for text objects) */}
            {(selectedObj.type === "i-text" || selectedObj.type === "textbox" || selectedObj.type === "text") && (
              <>
                <div className="w-px h-4 bg-border mx-0.5" />
                <button
                  className={`p-1.5 rounded hover:bg-accent transition-colors ${selectedObj.fontWeight === "bold" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  title="Negrito (Ctrl+B)"
                  onClick={() => {
                    const isBold = selectedObj.fontWeight === "bold";
                    selectedObj.set({ fontWeight: isBold ? "normal" : "bold" });
                    fabricRef.current?.requestRenderAll();
                  }}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  className={`p-1.5 rounded hover:bg-accent transition-colors ${selectedObj.fontStyle === "italic" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  title="Itálico (Ctrl+I)"
                  onClick={() => {
                    const isItalic = selectedObj.fontStyle === "italic";
                    selectedObj.set({ fontStyle: isItalic ? "normal" : "italic" });
                    fabricRef.current?.requestRenderAll();
                  }}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  className={`p-1.5 rounded hover:bg-accent transition-colors ${selectedObj.underline ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
                  title="Sublinhado (Ctrl+U)"
                  onClick={() => {
                    selectedObj.set({ underline: !selectedObj.underline });
                    fabricRef.current?.requestRenderAll();
                  }}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <div className="relative" title="Cor do texto">
                  <div
                    className="w-5 h-5 rounded border border-border cursor-pointer"
                    style={{ backgroundColor: typeof selectedObj.fill === "string" ? selectedObj.fill : "#ffffff" }}
                  />
                  <input
                    type="color"
                    value={typeof selectedObj.fill === "string" && selectedObj.fill.startsWith("#") ? selectedObj.fill : "#ffffff"}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      selectedObj.set({ fill: e.target.value });
                      fabricRef.current?.requestRenderAll();
                    }}
                  />
                </div>
              </>
            )}

            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Opacity slider */}
            <div className="flex items-center gap-1.5 px-1" title="Opacidade">
              <span className="text-[10px] text-muted-foreground select-none">Op</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={selectedObj.opacity ?? 1}
                className="w-16 h-1 accent-primary cursor-pointer"
                onChange={(e) => {
                  if (!selectedObj) return;
                  selectedObj.set({ opacity: parseFloat(e.target.value) });
                  fabricRef.current?.requestRenderAll();
                }}
              />
              <span className="text-[10px] text-muted-foreground tabular-nums w-6 text-right">
                {Math.round((selectedObj.opacity ?? 1) * 100)}
              </span>
            </div>

            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Delete */}
            <button
              className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
              title="Excluir (Del)"
              onClick={() => {
                const canvas = fabricRef.current;
                if (!canvas || !selectedObj) return;
                canvas.remove(selectedObj);
                canvas.requestRenderAll();
                setSelectedObj(null);
                setSelectionBounds(null);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cursor position indicator */}
      {cursorPos && (
        <div
          className="absolute z-30 text-[10px] text-white/50 tabular-nums pointer-events-none select-none"
          style={{ bottom: 10, left: showRulers ? RULER_SIZE + 6 : 6 }}
        >
          {cursorPos.x}, {cursorPos.y}px
        </div>
      )}

      {/* Zoom controls (bottom-left) */}
      <div
        className="absolute z-30 flex items-center gap-1"
        style={{ bottom: 8, left: showRulers ? RULER_SIZE + 8 : 8 }}
      >
        <button
          onClick={() => setZoom(Math.max(0.1, parseFloat((zoom - 0.1).toFixed(2))))}
          className="w-6 h-6 flex items-center justify-center rounded border bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          title="Diminuir zoom"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[10px] text-white/60 tabular-nums w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(5, parseFloat((zoom + 0.1).toFixed(2))))}
          className="w-6 h-6 flex items-center justify-center rounded border bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          title="Aumentar zoom"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="w-6 h-6 flex items-center justify-center rounded border bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-black/70 transition-colors"
          title="Zoom 100%"
        >
          <Maximize className="w-3 h-3" />
        </button>
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
          onClick={() => setShowSmartGuides((v) => !v)}
          className={`text-[10px] px-2 py-1 rounded border transition-colors ${
            showSmartGuides ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-black/40 border-white/10 text-white/50 hover:text-white/80"
          }`}
          title="Guias automáticas de alinhamento (snap)"
        >
          Snap
        </button>
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
