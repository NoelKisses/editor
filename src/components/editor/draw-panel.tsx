"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Pencil, Square, Eraser } from "lucide-react";
import { toast } from "sonner";

interface DrawPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BrushType = "pencil" | "circle" | "spray" | "eraser";

const BRUSH_PRESETS: { id: BrushType; label: string; icon: string }[] = [
  { id: "pencil", label: "Lápis", icon: "✏️" },
  { id: "circle", label: "Círculo", icon: "⬤" },
  { id: "spray", label: "Spray", icon: "💨" },
  { id: "eraser", label: "Borracha", icon: "◻" },
];

const COLOR_PRESETS = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
];

export function DrawPanel({ fabricCanvas }: DrawPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cvRef = useRef<any>(null);

  useEffect(() => {
    cvRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState<BrushType>("pencil");
  const [brushSize, setBrushSize] = useState(8);
  const [brushColor, setBrushColor] = useState("#ffffff");
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [shadowEnabled, setShadowEnabled] = useState(false);

  const applyBrush = useCallback(async (
    type: BrushType,
    size: number,
    color: string,
    opacity: number,
    shadow: boolean
  ) => {
    const cv = cvRef.current;
    if (!cv) return;
    const fabric = await import("fabric").then((m) => m.fabric);

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const a = opacity / 100;
    const rgba = `rgba(${r},${g},${b},${a})`;

    if (type === "eraser") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const brush = new (fabric as any).PencilBrush(cv);
      brush.color = cv.backgroundColor || "#000000";
      brush.width = size * 2;
      cv.freeDrawingBrush = brush;
    } else if (type === "spray") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const brush = new (fabric as any).SprayBrush(cv);
      brush.color = rgba;
      brush.width = size * 4;
      brush.density = 20;
      brush.dotWidth = 2;
      brush.dotWidthVariance = 1;
      cv.freeDrawingBrush = brush;
    } else if (type === "circle") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const brush = new (fabric as any).CircleBrush(cv);
      brush.color = rgba;
      brush.width = size;
      cv.freeDrawingBrush = brush;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const brush = new (fabric as any).PencilBrush(cv);
      brush.color = rgba;
      brush.width = size;
      brush.decimate = 4;
      brush.shadow = shadow
        ? new fabric.Shadow({ blur: size * 1.5, offsetX: 0, offsetY: 0, color: rgba })
        : null;
      cv.freeDrawingBrush = brush;
    }
  }, [cvRef]);

  const toggleDrawing = useCallback(async () => {
    const cv = cvRef.current;
    if (!cv) return;
    const next = !isDrawing;
    setIsDrawing(next);
    cv.isDrawingMode = next;

    if (next) {
      await applyBrush(brushType, brushSize, brushColor, brushOpacity, shadowEnabled);
      cv.defaultCursor = "crosshair";
      toast.success("Modo desenho ativado — clique e arraste para desenhar");
    } else {
      cv.defaultCursor = "default";
      toast.success("Modo desenho desativado");
    }
  }, [cvRef, isDrawing, brushType, brushSize, brushColor, brushOpacity, shadowEnabled, applyBrush]);

  // Update brush live when settings change while drawing
  useEffect(() => {
    if (!isDrawing || !cvRef.current) return;
    applyBrush(brushType, brushSize, brushColor, brushOpacity, shadowEnabled);
  }, [brushType, brushSize, brushColor, brushOpacity, shadowEnabled, isDrawing, cvRef, applyBrush]);

  // Cleanup: exit drawing mode when panel unmounts
  useEffect(() => {
    return () => {
      const cv = cvRef.current;
      if (cv) {
        cv.isDrawingMode = false;
        cv.defaultCursor = "default";
      }
    };
  }, [cvRef]);

  const clearDrawings = useCallback(() => {
    const cv = cvRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paths = cv.getObjects().filter((o: any) => o.type === "path");
    paths.forEach((p: unknown) => cv.remove(p));
    cv.requestRenderAll();
    toast.success(`${paths.length} traço(s) removido(s)`);
  }, [cvRef]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold text-foreground">Desenho Livre</h3>

      {/* Toggle */}
      <Button
        size="sm"
        variant={isDrawing ? "default" : "outline"}
        className={`w-full gap-2 ${isDrawing ? "bg-primary text-primary-foreground" : ""}`}
        onClick={toggleDrawing}
      >
        <Pencil className="w-3.5 h-3.5" />
        {isDrawing ? "Sair do Modo Desenho" : "Ativar Modo Desenho"}
      </Button>

      {isDrawing && (
        <div className="text-[10px] text-zinc-400 text-center bg-primary/10 border border-primary/20 rounded px-2 py-1">
          Clique e arraste no canvas para desenhar
        </div>
      )}

      {/* Brush type */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">Tipo de Pincel</span>
        <div className="grid grid-cols-4 gap-1">
          {BRUSH_PRESETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBrushType(b.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded border transition-colors text-[9px] ${
                brushType === b.id
                  ? "border-primary/60 bg-primary/10 text-white"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <span className="text-sm">{b.icon}</span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      {brushType !== "eraser" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Cor</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
            />
            <div className="flex flex-wrap gap-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform hover:scale-110 ${
                    brushColor === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">Espessura</span>
          <span className="text-[10px] text-zinc-500 tabular-nums">{brushSize}px</span>
        </div>
        <Slider
          min={1} max={60} step={1}
          value={[brushSize]}
          onValueChange={(val) => setBrushSize((val as number[])[0])}
        />
        {/* Visual preview */}
        <div className="flex items-center justify-center h-8 bg-zinc-800 rounded">
          <div
            className="rounded-full"
            style={{
              width: Math.min(brushSize * 2, 60),
              height: Math.min(brushSize * 2, 60),
              backgroundColor: brushType === "eraser" ? "#555" : brushColor,
              opacity: brushOpacity / 100,
            }}
          />
        </div>
      </div>

      {/* Opacity */}
      {brushType !== "eraser" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400">Opacidade</span>
            <span className="text-[10px] text-zinc-500 tabular-nums">{brushOpacity}%</span>
          </div>
          <Slider
            min={10} max={100} step={5}
            value={[brushOpacity]}
            onValueChange={(val) => setBrushOpacity((val as number[])[0])}
          />
        </div>
      )}

      {/* Shadow/Glow for pencil */}
      {brushType === "pencil" && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-400">Efeito Brilho</span>
          <button
            role="switch"
            aria-checked={shadowEnabled}
            onClick={() => setShadowEnabled((v) => !v)}
            className={`w-9 h-5 rounded-full transition-colors ${shadowEnabled ? "bg-primary" : "bg-muted"} relative`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${shadowEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 pt-1 border-t border-zinc-800">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-7 gap-1"
          onClick={clearDrawings}
          title="Remove todos os traços desenhados"
        >
          <Eraser className="w-3 h-3" />
          Limpar Traços
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-7 gap-1"
          onClick={() => {
            const cv = cvRef.current;
            if (!cv) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const paths = cv.getObjects().filter((o: any) => o.type === "path");
            if (!paths.length) { toast.error("Nenhum traço selecionável"); return; }
            cv.setActiveObject(paths[paths.length - 1]);
            cv.requestRenderAll();
          }}
          title="Seleciona o último traço para editar"
        >
          <Square className="w-3 h-3" />
          Selec. Último
        </Button>
      </div>
    </div>
  );
}
