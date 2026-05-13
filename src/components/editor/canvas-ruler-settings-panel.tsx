"use client";

import { useCallback, useState } from "react";
import { RulerIcon } from "lucide-react";
import { toast } from "sonner";

interface CanvasRulerSettingsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type RulerUnit = "px" | "cm" | "mm" | "in" | "pt";

const UNIT_OPTIONS: { value: RulerUnit; label: string; pxFactor: number }[] = [
  { value: "px", label: "Pixels (px)", pxFactor: 1 },
  { value: "cm", label: "Centímetros (cm)", pxFactor: 37.795 },
  { value: "mm", label: "Milímetros (mm)", pxFactor: 3.7795 },
  { value: "in", label: "Polegadas (in)", pxFactor: 96 },
  { value: "pt", label: "Pontos (pt)", pxFactor: 1.3333 },
];

const TICK_INTERVALS: { label: string; value: number }[] = [
  { label: "10px", value: 10 },
  { label: "25px", value: 25 },
  { label: "50px", value: 50 },
  { label: "100px", value: 100 },
];

export function CanvasRulerSettingsPanel({ fabricCanvas }: CanvasRulerSettingsPanelProps) {
  const [unit, setUnit] = useState<RulerUnit>("px");
  const [rulerColor, setRulerColor] = useState("#6366f1");
  const [showLabels, setShowLabels] = useState(true);
  const [tickInterval, setTickInterval] = useState(50);
  const [rulerSize, setRulerSize] = useState(20);
  const [showOriginMarker, setShowOriginMarker] = useState(true);
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);

  const applyOrigin = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setViewportTransform([1, 0, 0, 1, -originX, -originY]);
    fabricCanvas.requestRenderAll();
    toast.success(`Origem ajustada para (${originX}, ${originY})`);
  }, [fabricCanvas, originX, originY]);

  const resetOrigin = useCallback(() => {
    setOriginX(0);
    setOriginY(0);
    if (!fabricCanvas) return;
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.requestRenderAll();
    toast.success("Origem resetada");
  }, [fabricCanvas]);

  const getConvertedValue = useCallback((px: number) => {
    const factor = UNIT_OPTIONS.find(u => u.value === unit)?.pxFactor ?? 1;
    return (px / factor).toFixed(2);
  }, [unit]);

  const canvasW = fabricCanvas?.width ?? 800;
  const canvasH = fabricCanvas?.height ?? 600;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <RulerIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Configurações das Réguas</span>
      </div>

      {/* Canvas info */}
      <div className="grid grid-cols-2 gap-1 px-2 py-2 rounded border border-border bg-muted/10">
        <div className="flex flex-col">
          <span className="text-[8px] text-muted-foreground">Largura</span>
          <span className="text-[10px] tabular-nums">{canvasW}px = {getConvertedValue(canvasW)} {unit}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-muted-foreground">Altura</span>
          <span className="text-[10px] tabular-nums">{canvasH}px = {getConvertedValue(canvasH)} {unit}</span>
        </div>
      </div>

      {/* Unit */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Unidade de Medida</span>
        <div className="flex flex-col gap-0.5">
          {UNIT_OPTIONS.map(u => (
            <button key={u.value} onClick={() => { setUnit(u.value); toast.success(`Unidade alterada para ${u.label}`); }}
              className={`w-full py-1 rounded border text-left px-2 text-[8px] transition-colors ${unit === u.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tick interval */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Intervalo de Marcações</span>
        <div className="grid grid-cols-4 gap-1">
          {TICK_INTERVALS.map(t => (
            <button key={t.value} onClick={() => setTickInterval(t.value)}
              className={`py-1.5 rounded border text-[7px] transition-colors ${tickInterval === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ruler size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Espessura da Régua</span>
          <span className="text-[9px] tabular-nums">{rulerSize}px</span>
        </div>
        <input type="range" min={12} max={40} step={2} value={rulerSize}
          onChange={e => setRulerSize(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Cor</span>
        <input type="color" value={rulerColor} onChange={e => setRulerColor(e.target.value)}
          className="w-8 h-7 rounded border border-border cursor-pointer" />
        <span className="text-[8px] font-mono text-muted-foreground">{rulerColor.toUpperCase()}</span>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-border">
          <span className="text-[10px]">Mostrar Números</span>
          <button onClick={() => setShowLabels(v => !v)}
            className={`w-8 h-4 rounded-full transition-colors ${showLabels ? "bg-primary" : "bg-muted-foreground/30"}`}>
            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${showLabels ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-border">
          <span className="text-[10px]">Marcador de Origem</span>
          <button onClick={() => setShowOriginMarker(v => !v)}
            className={`w-8 h-4 rounded-full transition-colors ${showOriginMarker ? "bg-primary" : "bg-muted-foreground/30"}`}>
            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${showOriginMarker ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Origin offset */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deslocamento de Origem</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-muted-foreground">Origem X</span>
            <input type="number" value={originX} onChange={e => setOriginX(Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-muted-foreground">Origem Y</span>
            <input type="number" value={originY} onChange={e => setOriginY(Number(e.target.value))}
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button onClick={resetOrigin}
            className="py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
            Resetar
          </button>
          <button onClick={applyOrigin}
            className="py-1.5 rounded border border-primary text-primary text-[9px] hover:bg-primary/10 transition-colors">
            Aplicar
          </button>
        </div>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Unidade: 1 {unit} = {UNIT_OPTIONS.find(u => u.value === unit)?.pxFactor.toFixed(3)} px
      </p>
    </div>
  );
}
