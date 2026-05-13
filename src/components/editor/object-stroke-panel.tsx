"use client";

import { useCallback, useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";

interface ObjectStrokePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type StrokeAlignment = "inside" | "outside" | "center";
type StrokeCap = "butt" | "round" | "square";
type StrokeJoin = "miter" | "round" | "bevel";

const DASH_PRESETS: { label: string; pattern: number[] }[] = [
  { label: "Sólido", pattern: [] },
  { label: "Tracejado", pattern: [8, 4] },
  { label: "Pontilhado", pattern: [2, 4] },
  { label: "Traço-Ponto", pattern: [8, 4, 2, 4] },
  { label: "Longo", pattern: [20, 5] },
  { label: "Curto Denso", pattern: [4, 2] },
];

const WIDTH_PRESETS = [0, 1, 2, 3, 5, 8, 12, 20];

export function ObjectStrokePanel({ fabricCanvas, selectionVersion }: ObjectStrokePanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [dashPattern, setDashPattern] = useState<number[]>([]);
  const [strokeCap, setStrokeCap] = useState<StrokeCap>("butt");
  const [strokeJoin, setStrokeJoin] = useState<StrokeJoin>("miter");
  const [strokeAlignment, setStrokeAlignment] = useState<StrokeAlignment>("center");
  const [strokeOpacity, setStrokeOpacity] = useState(1);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj && obj.type !== "activeSelection");
      if (obj && obj.type !== "activeSelection") {
        setStrokeColor(obj.stroke ?? "#000000");
        setStrokeWidth(obj.strokeWidth ?? 1);
        setDashPattern(obj.strokeDashArray ?? []);
        setStrokeCap((obj.strokeLineCap ?? "butt") as StrokeCap);
        setStrokeJoin((obj.strokeLineJoin ?? "miter") as StrokeJoin);
        setStrokeOpacity(obj.strokeWidth > 0 ? 1 : 0);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && obj.type !== "activeSelection" ? obj : null;
  }, [fabricCanvas]);

  const applyStroke = useCallback((
    color: string,
    width: number,
    dash: number[],
    cap: StrokeCap,
    join: StrokeJoin,
    opacity: number
  ) => {
    const obj = getObject();
    if (!obj) return;

    obj.set({
      stroke: color,
      strokeWidth: width,
      strokeDashArray: dash.length > 0 ? dash : null,
      strokeLineCap: cap,
      strokeLineJoin: join,
      strokeUniform: strokeAlignment === "outside",
      opacity: obj.opacity,
    });

    // Apply stroke opacity by modifying stroke color with alpha
    if (opacity < 1) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      obj.set({ stroke: `rgba(${r},${g},${b},${opacity})` });
    }

    fabricCanvas.requestRenderAll();
  }, [getObject, fabricCanvas, strokeAlignment]);

  const removeStroke = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    obj.set({ stroke: null, strokeWidth: 0 });
    fabricCanvas.requestRenderAll();
    setStrokeWidth(0);
    toast.success("Borda removida");
  }, [getObject, fabricCanvas]);

  const CAPS: { value: StrokeCap; label: string }[] = [
    { value: "butt", label: "Reto" },
    { value: "round", label: "Redondo" },
    { value: "square", label: "Quadrado" },
  ];

  const JOINS: { value: StrokeJoin; label: string }[] = [
    { value: "miter", label: "Miter" },
    { value: "round", label: "Redondo" },
    { value: "bevel", label: "Bisel" },
  ];

  const ALIGNMENTS: { value: StrokeAlignment; label: string }[] = [
    { value: "inside", label: "Interno" },
    { value: "center", label: "Centro" },
    { value: "outside", label: "Externo" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Borda Avançada</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <PenLine className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para configurar a borda</p>
        </div>
      ) : (
        <>
          {/* Color + width */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-8">Cor</span>
              <input type="color" value={strokeColor.startsWith("rgba") ? "#000000" : strokeColor}
                onChange={e => { setStrokeColor(e.target.value); applyStroke(e.target.value, strokeWidth, dashPattern, strokeCap, strokeJoin, strokeOpacity); }}
                className="w-8 h-7 rounded border border-border cursor-pointer" />
              <span className="text-[8px] text-muted-foreground font-mono">{strokeColor.toUpperCase().substring(0, 7)}</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Espessura</span>
                <span className="text-[9px] tabular-nums">{strokeWidth}px</span>
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {WIDTH_PRESETS.map(w => (
                  <button key={w} onClick={() => { setStrokeWidth(w); applyStroke(strokeColor, w, dashPattern, strokeCap, strokeJoin, strokeOpacity); }}
                    className={`py-1 rounded border text-[7px] transition-colors ${strokeWidth === w ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {w}
                  </button>
                ))}
              </div>
              <input type="range" min={0} max={50} step={1} value={strokeWidth}
                onChange={e => { setStrokeWidth(Number(e.target.value)); applyStroke(strokeColor, Number(e.target.value), dashPattern, strokeCap, strokeJoin, strokeOpacity); }}
                className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Dash presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo da Linha</span>
            <div className="grid grid-cols-3 gap-1">
              {DASH_PRESETS.map(d => (
                <button key={d.label} onClick={() => { setDashPattern(d.pattern); applyStroke(strokeColor, strokeWidth, d.pattern, strokeCap, strokeJoin, strokeOpacity); }}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${JSON.stringify(dashPattern) === JSON.stringify(d.pattern) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cap */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Extremidades</span>
            <div className="grid grid-cols-3 gap-1">
              {CAPS.map(c => (
                <button key={c.value} onClick={() => { setStrokeCap(c.value); applyStroke(strokeColor, strokeWidth, dashPattern, c.value, strokeJoin, strokeOpacity); }}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${strokeCap === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Join */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Junções</span>
            <div className="grid grid-cols-3 gap-1">
              {JOINS.map(j => (
                <button key={j.value} onClick={() => { setStrokeJoin(j.value); applyStroke(strokeColor, strokeWidth, dashPattern, strokeCap, j.value, strokeOpacity); }}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${strokeJoin === j.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {j.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhamento</span>
            <div className="grid grid-cols-3 gap-1">
              {ALIGNMENTS.map(a => (
                <button key={a.value} onClick={() => setStrokeAlignment(a.value)}
                  className={`py-1.5 rounded border text-[8px] transition-colors ${strokeAlignment === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade da Borda</span>
              <span className="text-[9px] tabular-nums">{Math.round(strokeOpacity * 100)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.05} value={strokeOpacity}
              onChange={e => { setStrokeOpacity(Number(e.target.value)); applyStroke(strokeColor, strokeWidth, dashPattern, strokeCap, strokeJoin, Number(e.target.value)); }}
              className="w-full accent-primary h-1" />
          </div>

          <button onClick={removeStroke}
            className="py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
            Remover Borda
          </button>
        </>
      )}
    </div>
  );
}
