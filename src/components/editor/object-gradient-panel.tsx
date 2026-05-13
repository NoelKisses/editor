"use client";

import { useCallback, useEffect, useState } from "react";
import { SwatchBook, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ObjectGradientPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GradientType = "linear" | "radial" | "conic";
type GradientAngle = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

interface ColorStop {
  offset: number;
  color: string;
}

const PRESETS: { label: string; stops: ColorStop[]; type: GradientType; angle: number }[] = [
  { label: "Pôr do Sol", stops: [{ offset: 0, color: "#ff6b35" }, { offset: 0.5, color: "#ff4081" }, { offset: 1, color: "#7c4dff" }], type: "linear", angle: 135 },
  { label: "Oceano", stops: [{ offset: 0, color: "#00b4db" }, { offset: 1, color: "#0083b0" }], type: "linear", angle: 90 },
  { label: "Neon", stops: [{ offset: 0, color: "#00f2fe" }, { offset: 0.5, color: "#4facfe" }, { offset: 1, color: "#f093fb" }], type: "linear", angle: 45 },
  { label: "Floresta", stops: [{ offset: 0, color: "#56ab2f" }, { offset: 1, color: "#a8e063" }], type: "linear", angle: 90 },
  { label: "Fogo", stops: [{ offset: 0, color: "#f7971e" }, { offset: 1, color: "#ffd200" }], type: "radial", angle: 0 },
  { label: "Aurora", stops: [{ offset: 0, color: "#a18cd1" }, { offset: 0.5, color: "#fbc2eb" }, { offset: 1, color: "#a1c4fd" }], type: "linear", angle: 120 },
  { label: "Noite", stops: [{ offset: 0, color: "#0f0c29" }, { offset: 0.5, color: "#302b63" }, { offset: 1, color: "#24243e" }], type: "linear", angle: 90 },
  { label: "Dourado", stops: [{ offset: 0, color: "#f7971e" }, { offset: 0.5, color: "#ffd200" }, { offset: 1, color: "#f7971e" }], type: "radial", angle: 0 },
];

const ANGLE_PRESETS: { label: string; angle: GradientAngle }[] = [
  { label: "→", angle: 0 },
  { label: "↘", angle: 45 },
  { label: "↓", angle: 90 },
  { label: "↙", angle: 135 },
  { label: "←", angle: 180 },
  { label: "↖", angle: 225 },
  { label: "↑", angle: 270 },
  { label: "↗", angle: 315 },
];

function degreesToCoords(angle: number, w: number, h: number) {
  const rad = (angle * Math.PI) / 180;
  const x1 = Math.round(w / 2 - Math.cos(rad) * w / 2);
  const y1 = Math.round(h / 2 - Math.sin(rad) * h / 2);
  const x2 = Math.round(w / 2 + Math.cos(rad) * w / 2);
  const y2 = Math.round(h / 2 + Math.sin(rad) * h / 2);
  return { x1, y1, x2, y2 };
}

export function ObjectGradientPanel({ fabricCanvas, selectionVersion }: ObjectGradientPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<ColorStop[]>([
    { offset: 0, color: "#4f46e5" },
    { offset: 1, color: "#7c3aed" },
  ]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj && obj.type !== "activeSelection");
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && obj.type !== "activeSelection" ? obj : null;
  }, [fabricCanvas]);

  const applyGradient = useCallback((type: GradientType, ang: number, colorStops: ColorStop[]) => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const w = obj.width ?? 100;
      const h = obj.height ?? 100;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let gradient: any;

      if (type === "linear") {
        const coords = degreesToCoords(ang, w, h);
        gradient = new f.Gradient({
          type: "linear",
          gradientUnits: "pixels",
          coords: { x1: coords.x1, y1: coords.y1, x2: coords.x2, y2: coords.y2 },
          colorStops: colorStops.map(s => ({ offset: s.offset, color: s.color })),
        });
      } else if (type === "radial") {
        gradient = new f.Gradient({
          type: "radial",
          gradientUnits: "pixels",
          coords: { x1: w / 2, y1: h / 2, r1: 0, x2: w / 2, y2: h / 2, r2: Math.max(w, h) / 2 },
          colorStops: colorStops.map(s => ({ offset: s.offset, color: s.color })),
        });
      } else {
        // Conic approximated as linear sweep
        gradient = new f.Gradient({
          type: "linear",
          gradientUnits: "pixels",
          coords: { x1: 0, y1: h / 2, x2: w, y2: h / 2 },
          colorStops: colorStops.map(s => ({ offset: s.offset, color: s.color })),
        });
      }

      obj.set({ fill: gradient });
      fabricCanvas.requestRenderAll();
      toast.success("Gradiente aplicado");
    });
  }, [getObject, fabricCanvas]);

  const addStop = useCallback(() => {
    if (stops.length >= 6) { toast.error("Máximo 6 paradas de cor"); return; }
    const sorted = [...stops].sort((a, b) => a.offset - b.offset);
    const last = sorted[sorted.length - 1];
    const newOffset = Math.min(1, last.offset + 0.2);
    const newStops = [...stops, { offset: parseFloat(newOffset.toFixed(2)), color: "#ffffff" }];
    setStops(newStops);
  }, [stops]);

  const removeStop = useCallback((index: number) => {
    if (stops.length <= 2) { toast.error("Mínimo 2 paradas de cor"); return; }
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
  }, [stops]);

  const updateStop = useCallback((index: number, field: keyof ColorStop, value: string | number) => {
    const newStops = stops.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setStops(newStops);
  }, [stops]);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setGradientType(preset.type);
    setAngle(preset.angle);
    setStops(preset.stops);
    applyGradient(preset.type, preset.angle, preset.stops);
    toast.success(`Preset "${preset.label}" aplicado`);
  }, [applyGradient]);

  const removeFill = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    obj.set({ fill: "transparent" });
    fabricCanvas.requestRenderAll();
    toast.success("Preenchimento removido");
  }, [getObject, fabricCanvas]);

  const TYPES: { value: GradientType; label: string }[] = [
    { value: "linear", label: "Linear" },
    { value: "radial", label: "Radial" },
    { value: "conic", label: "Cônico" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <SwatchBook className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Gradiente Avançado</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <SwatchBook className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar gradiente</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-4 gap-1">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)} title={p.label}
                  className="h-8 rounded border border-border hover:border-primary/40 transition-all overflow-hidden"
                  style={{ background: `linear-gradient(${p.angle}deg, ${p.stops.map(s => `${s.color} ${s.offset * 100}%`).join(", ")})` }}
                />
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo</span>
            <div className="grid grid-cols-3 gap-1">
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setGradientType(t.value)}
                  className={`py-1.5 rounded border text-[9px] transition-colors ${gradientType === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Angle (linear only) */}
          {gradientType === "linear" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ângulo</span>
                <span className="text-[9px] tabular-nums">{angle}°</span>
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {ANGLE_PRESETS.map(({ label, angle: a }) => (
                  <button key={a} onClick={() => setAngle(a)}
                    className={`py-1 rounded border text-[9px] transition-colors ${angle === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <input type="range" min={0} max={360} step={5} value={angle}
                onChange={e => setAngle(Number(e.target.value))} className="w-full accent-primary h-1" />
            </div>
          )}

          {/* Color stops */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Paradas de Cor</span>
              <button onClick={addStop} className="flex items-center gap-0.5 text-[8px] text-primary hover:underline">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {stops.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={stop.color}
                    onChange={e => updateStop(i, "color", e.target.value)}
                    className="w-7 h-7 rounded border border-border cursor-pointer flex-shrink-0" />
                  <div className="flex-1 flex items-center gap-1">
                    <input type="range" min={0} max={1} step={0.01} value={stop.offset}
                      onChange={e => updateStop(i, "offset", Number(e.target.value))}
                      className="flex-1 accent-primary h-1" />
                    <span className="text-[8px] tabular-nums w-8 text-right">{Math.round(stop.offset * 100)}%</span>
                  </div>
                  <button onClick={() => removeStop(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="h-6 rounded border border-border"
              style={{ background: `linear-gradient(${angle}deg, ${[...stops].sort((a, b) => a.offset - b.offset).map(s => `${s.color} ${s.offset * 100}%`).join(", ")})` }} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={removeFill}
              className="py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              Remover Fill
            </button>
            <button onClick={() => applyGradient(gradientType, angle, stops)}
              className="py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              Aplicar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
