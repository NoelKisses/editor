"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TextCursorInput, Paintbrush, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextGradientOutlinePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GradientDir = "horizontal" | "vertical" | "diagonal" | "radial";

interface GradientStop { color: string; pos: number; }

interface OutlineConfig {
  enabled: boolean;
  color: string;
  width: number;
  style: "solid" | "double" | "gradient";
  gradientColor: string;
}

const PRESETS: { label: string; stops: GradientStop[]; dir: GradientDir; outline: OutlineConfig }[] = [
  {
    label: "Fire",
    stops: [{ color: "#ff6b35", pos: 0 }, { color: "#ffd23f", pos: 50 }, { color: "#ff0000", pos: 100 }],
    dir: "vertical",
    outline: { enabled: true, color: "#ff0000", width: 2, style: "solid", gradientColor: "#ff6b35" },
  },
  {
    label: "Ocean",
    stops: [{ color: "#0093e9", pos: 0 }, { color: "#80d0c7", pos: 100 }],
    dir: "horizontal",
    outline: { enabled: true, color: "#0093e9", width: 2, style: "gradient", gradientColor: "#80d0c7" },
  },
  {
    label: "Neon",
    stops: [{ color: "#00ff9f", pos: 0 }, { color: "#00b4d8", pos: 50 }, { color: "#7209b7", pos: 100 }],
    dir: "horizontal",
    outline: { enabled: true, color: "#00ff9f", width: 3, style: "solid", gradientColor: "#00ff9f" },
  },
  {
    label: "Gold",
    stops: [{ color: "#f5d020", pos: 0 }, { color: "#f5a623", pos: 50 }, { color: "#f5d020", pos: 100 }],
    dir: "horizontal",
    outline: { enabled: true, color: "#b8860b", width: 2, style: "double", gradientColor: "#f5d020" },
  },
  {
    label: "Purple Rain",
    stops: [{ color: "#667eea", pos: 0 }, { color: "#764ba2", pos: 100 }],
    dir: "diagonal",
    outline: { enabled: false, color: "#764ba2", width: 1, style: "solid", gradientColor: "#667eea" },
  },
  {
    label: "Candy",
    stops: [{ color: "#f953c6", pos: 0 }, { color: "#b91d73", pos: 50 }, { color: "#fcb045", pos: 100 }],
    dir: "horizontal",
    outline: { enabled: true, color: "#f953c6", width: 2, style: "gradient", gradientColor: "#fcb045" },
  },
  {
    label: "Ice",
    stops: [{ color: "#a8edea", pos: 0 }, { color: "#fed6e3", pos: 100 }],
    dir: "diagonal",
    outline: { enabled: true, color: "#a8edea", width: 1, style: "solid", gradientColor: "#fed6e3" },
  },
  {
    label: "Matrix",
    stops: [{ color: "#00ff41", pos: 0 }, { color: "#008f11", pos: 100 }],
    dir: "vertical",
    outline: { enabled: true, color: "#00ff41", width: 2, style: "solid", gradientColor: "#003b00" },
  },
];

function buildFabricGradient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  stops: GradientStop[],
  dir: GradientDir,
  objW: number,
  objH: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const colorStops = sorted.map((s) => ({ offset: s.pos / 100, color: s.color }));

  if (dir === "radial") {
    return new f.Gradient({
      type: "radial",
      coords: { x1: objW / 2, y1: objH / 2, r1: 0, x2: objW / 2, y2: objH / 2, r2: Math.max(objW, objH) / 2 },
      colorStops,
    });
  }

  const coordMap: Record<GradientDir, { x1: number; y1: number; x2: number; y2: number }> = {
    horizontal: { x1: 0, y1: 0, x2: objW, y2: 0 },
    vertical: { x1: 0, y1: 0, x2: 0, y2: objH },
    diagonal: { x1: 0, y1: 0, x2: objW, y2: objH },
    radial: { x1: 0, y1: 0, x2: objW, y2: 0 },
  };

  return new f.Gradient({ type: "linear", coords: coordMap[dir], colorStops });
}

export function TextGradientOutlinePanel({ fabricCanvas, selectionVersion }: TextGradientOutlinePanelProps) {
  const [hasText, setHasText] = useState(false);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: "#6366f1", pos: 0 }, { color: "#ec4899", pos: 100 },
  ]);
  const [gradDir, setGradDir] = useState<GradientDir>("horizontal");
  const [outline, setOutline] = useState<OutlineConfig>({
    enabled: false, color: "#6366f1", width: 2, style: "solid", gradientColor: "#ec4899",
  });
  const [applyFill, setApplyFill] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = obj && (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");
      setHasText(isText);
    });
  }, [fabricCanvas, selectionVersion]);

  const updateStop = useCallback((idx: number, field: keyof GradientStop, val: string | number) => {
    setStops((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }, []);

  const addStop = useCallback(() => {
    if (stops.length >= 5) return;
    setStops((prev) => [...prev, { color: "#ffffff", pos: Math.round((prev[prev.length - 1].pos + 100) / 2) }]);
  }, [stops]);

  const removeStop = useCallback((idx: number) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((_, i) => i !== idx));
  }, [stops.length]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setStops(preset.stops);
    setGradDir(preset.dir);
    setOutline(preset.outline);
  }, []);

  const apply = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj || (obj.type !== "i-text" && obj.type !== "text" && obj.type !== "textbox")) {
      toast.error("Selecione um texto"); return;
    }

    import("fabric").then((m) => {
      const fabric = m.fabric;
      const objW = obj.getScaledWidth() || obj.width || 200;
      const objH = obj.getScaledHeight() || obj.height || 60;

      if (applyFill) {
        const gradient = buildFabricGradient(fabric, stops, gradDir, objW, objH);
        obj.set({ fill: gradient });
      }

      if (outline.enabled) {
        obj.set({
          stroke: outline.color,
          strokeWidth: outline.width,
          paintFirst: "stroke",
        });
        if (outline.style === "gradient") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const f = fabric as any;
          const outlineGrad = new f.Gradient({
            type: "linear",
            coords: { x1: 0, y1: 0, x2: objW, y2: 0 },
            colorStops: [
              { offset: 0, color: outline.color },
              { offset: 1, color: outline.gradientColor },
            ],
          });
          obj.set({ stroke: outlineGrad });
        }
      } else {
        obj.set({ stroke: null, strokeWidth: 0 });
      }

      obj.setCoords();
      cv.requestRenderAll();
      toast.success("Gradiente aplicado ao texto");
    });
  }, [stops, gradDir, outline, applyFill]);

  const reset = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) return;
    obj.set({ fill: "#000000", stroke: null, strokeWidth: 0 });
    obj.setCoords();
    cv.requestRenderAll();
    toast.success("Estilos removidos");
  }, []);

  const dirs: { value: GradientDir; label: string }[] = [
    { value: "horizontal", label: "→" },
    { value: "vertical", label: "↓" },
    { value: "diagonal", label: "↘" },
    { value: "radial", label: "⊙" },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <TextCursorInput className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Gradiente no Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <TextCursorInput className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto no canvas</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Presets</span>
            <div className="grid grid-cols-4 gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="py-1.5 rounded border border-border text-[7px] font-bold overflow-hidden transition-colors hover:border-primary/40"
                  style={{
                    background: `linear-gradient(90deg, ${p.stops.map(s => s.color).join(", ")})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gradient direction */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Direção</span>
            <div className="flex gap-1">
              {dirs.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setGradDir(d.value)}
                  className={`w-7 h-7 rounded border text-[12px] transition-colors ${
                    gradDir === d.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color stops */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-medium">Cores do gradiente</span>
              <button onClick={addStop} disabled={stops.length >= 5}
                className="text-[7px] text-primary hover:underline disabled:opacity-40">
                + Adicionar
              </button>
            </div>

            {/* Gradient preview */}
            <div
              className="h-3 rounded"
              style={{ background: `linear-gradient(90deg, ${stops.map(s => s.color).join(", ")})` }}
            />

            {stops.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input type="color" value={s.color} onChange={(e) => updateStop(i, "color", e.target.value)}
                  className="w-6 h-5 rounded border border-border cursor-pointer" />
                <input type="range" min={0} max={100} value={s.pos}
                  onChange={(e) => updateStop(i, "pos", Number(e.target.value))}
                  className="flex-1 accent-primary h-1" />
                <span className="text-[7px] tabular-nums w-6">{s.pos}%</span>
                {stops.length > 2 && (
                  <button onClick={() => removeStop(i)} className="text-[7px] text-muted-foreground hover:text-destructive">×</button>
                )}
              </div>
            ))}
          </div>

          {/* Fill toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={applyFill} onChange={(e) => setApplyFill(e.target.checked)}
              className="accent-primary w-3 h-3" />
            <span className="text-[8px]">Aplicar gradiente no preenchimento</span>
          </label>

          {/* Outline */}
          <div className="flex flex-col gap-2 p-2 rounded border border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={outline.enabled} onChange={(e) => setOutline(o => ({ ...o, enabled: e.target.checked }))}
                className="accent-primary w-3 h-3" />
              <span className="text-[9px] font-medium">Contorno</span>
            </label>

            {outline.enabled && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-muted-foreground w-10">Cor</span>
                  <input type="color" value={outline.color} onChange={(e) => setOutline(o => ({ ...o, color: e.target.value }))}
                    className="w-6 h-5 rounded border border-border cursor-pointer" />
                  <span className="text-[7px] font-mono text-muted-foreground">{outline.color}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-muted-foreground w-10">Espessura</span>
                  <input type="range" min={1} max={20} step={0.5} value={outline.width}
                    onChange={(e) => setOutline(o => ({ ...o, width: Number(e.target.value) }))}
                    className="flex-1 accent-primary h-1" />
                  <span className="text-[7px] tabular-nums">{outline.width}px</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-muted-foreground w-10">Estilo</span>
                  {(["solid", "double", "gradient"] as const).map((s) => (
                    <button key={s} onClick={() => setOutline(o => ({ ...o, style: s }))}
                      className={`flex-1 py-0.5 rounded border text-[7px] transition-colors ${outline.style === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      {s === "solid" ? "Sólido" : s === "double" ? "Duplo" : "Gradiente"}
                    </button>
                  ))}
                </div>
                {outline.style === "gradient" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-muted-foreground w-10">Cor 2</span>
                    <input type="color" value={outline.gradientColor}
                      onChange={(e) => setOutline(o => ({ ...o, gradientColor: e.target.value }))}
                      className="w-6 h-5 rounded border border-border cursor-pointer" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={apply}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Paintbrush className="w-3 h-3" /> Aplicar
            </button>
            <button onClick={reset}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Gradiente aplicado como preenchimento vectorial no objeto de texto
          </p>
        </>
      )}
    </div>
  );
}
