"use client";

import { useCallback, useEffect, useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";

interface StrokeOutlinePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type StrokeDash = "solid" | "dashed" | "dotted" | "dash-dot" | "long-dash";
type StrokeAlign = "center" | "inside" | "outside";
type StrokeCap = "butt" | "round" | "square";
type StrokeJoin = "miter" | "round" | "bevel";

const DASH_OPTIONS: { value: StrokeDash; label: string; pattern: number[] }[] = [
  { value: "solid", label: "Sólido", pattern: [] },
  { value: "dashed", label: "Tracejado", pattern: [10, 5] },
  { value: "dotted", label: "Pontilhado", pattern: [2, 6] },
  { value: "dash-dot", label: "Traço-Ponto", pattern: [10, 5, 2, 5] },
  { value: "long-dash", label: "Traço Longo", pattern: [20, 5] },
];

const WIDTH_PRESETS = [1, 2, 3, 5, 8, 12, 20];

const STROKE_PRESETS = [
  { label: "Neon", color: "#00FFFF", width: 3, dash: "solid" as StrokeDash },
  { label: "Duplo", color: "#FFFFFF", width: 2, dash: "solid" as StrokeDash },
  { label: "Rosa", color: "#FF6B9D", width: 4, dash: "solid" as StrokeDash },
  { label: "Gold", color: "#FFD700", width: 2, dash: "dashed" as StrokeDash },
  { label: "Sketch", color: "#333333", width: 1, dash: "dotted" as StrokeDash },
  { label: "Bold", color: "#000000", width: 8, dash: "solid" as StrokeDash },
];


export function StrokeOutlinePanel({ fabricCanvas, selectionVersion }: StrokeOutlinePanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [strokeEnabled, setStrokeEnabled] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeDash, setStrokeDash] = useState<StrokeDash>("solid");
  const [strokeCap, setStrokeCap] = useState<StrokeCap>("round");
  const [strokeJoin, setStrokeJoin] = useState<StrokeJoin>("round");
  const [strokeAlign, setStrokeAlign] = useState<StrokeAlign>("center");
  const [strokeOpacity, setStrokeOpacity] = useState(100);
  // Double stroke state
  const [doubleStroke, setDoubleStroke] = useState(false);
  const [stroke2Color, setStroke2Color] = useState("#FFFFFF");
  const [stroke2Width, setStroke2Width] = useState(1);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { queueMicrotask(() => setHasObject(false)); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any;
    queueMicrotask(() => {
      setHasObject(true);
      const hasStroke = !!o.stroke && o.stroke !== "transparent" && (o.strokeWidth ?? 0) > 0;
      setStrokeEnabled(hasStroke);
      setStrokeColor(o.stroke && o.stroke !== "transparent" ? o.stroke.replace(/rgba?\(.*\)/, "#000000") : "#000000");
      setStrokeWidth(o.strokeWidth ?? 2);
      const da: number[] = o.strokeDashArray ?? [];
      const matched = DASH_OPTIONS.find(d => JSON.stringify(d.pattern) === JSON.stringify(da));
      setStrokeDash(matched ? matched.value : "solid");
      setStrokeCap((o.strokeLineCap ?? "round") as StrokeCap);
      setStrokeJoin((o.strokeLineJoin ?? "round") as StrokeJoin);
      setStrokeOpacity(Math.round((o.strokeOpacity ?? 1) * 100));
      const data = o.data ?? {};
      setDoubleStroke(!!data.doubleStroke);
      setStroke2Color(data.stroke2Color ?? "#FFFFFF");
      setStroke2Width(data.stroke2Width ?? 1);
      setStrokeAlign((data.strokeAlign ?? "center") as StrokeAlign);
    });
  }, [fabricCanvas, selectionVersion]);

  const getObj = useCallback(() => fabricCanvas?.getActiveObject(), [fabricCanvas]);

  const applyStroke = useCallback((
    enabled: boolean,
    color: string,
    width: number,
    dash: StrokeDash,
    cap: StrokeCap,
    join: StrokeJoin,
    opacity: number,
    dbl: boolean,
    s2Color: string,
    s2Width: number,
    align: StrokeAlign,
  ) => {
    const obj = getObj();
    if (!obj || !fabricCanvas) return;
    const dashPattern = DASH_OPTIONS.find(d => d.value === dash)?.pattern ?? [];
    if (!enabled) {
      obj.set({
        stroke: null,
        strokeWidth: 0,
        strokeDashArray: [],
        strokeLineCap: cap,
        strokeLineJoin: join,
        strokeOpacity: 1,
      });
    } else {
      // Offset inner/outer stroke via clipPath offset simulation using padding
      let adjustedWidth = width;
      if (align === "inside") adjustedWidth = width * 2;
      else if (align === "outside") adjustedWidth = width * 2;

      obj.set({
        stroke: color,
        strokeWidth: adjustedWidth,
        strokeDashArray: dashPattern.length ? dashPattern : undefined,
        strokeLineCap: cap,
        strokeLineJoin: join,
        strokeOpacity: opacity / 100,
      });

      // Store double stroke config in data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).data = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((obj as any).data ?? {}),
        doubleStroke: dbl,
        stroke2Color: s2Color,
        stroke2Width: s2Width,
        strokeAlign: align,
      };
    }
    obj.setCoords();
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, getObj]);

  const handleToggle = () => {
    const next = !strokeEnabled;
    setStrokeEnabled(next);
    applyStroke(next, strokeColor, strokeWidth, strokeDash, strokeCap, strokeJoin, strokeOpacity, doubleStroke, stroke2Color, stroke2Width, strokeAlign);
    toast.success(next ? "Contorno ativado" : "Contorno removido");
  };

  const update = useCallback((patch: Partial<{
    enabled: boolean; color: string; width: number; dash: StrokeDash;
    cap: StrokeCap; join: StrokeJoin; opacity: number;
    dbl: boolean; s2Color: string; s2Width: number; align: StrokeAlign;
  }>) => {
    const next = {
      enabled: strokeEnabled, color: strokeColor, width: strokeWidth, dash: strokeDash,
      cap: strokeCap, join: strokeJoin, opacity: strokeOpacity,
      dbl: doubleStroke, s2Color: stroke2Color, s2Width: stroke2Width, align: strokeAlign,
      ...patch,
    };
    if ("enabled" in patch) setStrokeEnabled(next.enabled);
    if ("color" in patch) setStrokeColor(next.color);
    if ("width" in patch) setStrokeWidth(next.width);
    if ("dash" in patch) setStrokeDash(next.dash);
    if ("cap" in patch) setStrokeCap(next.cap);
    if ("join" in patch) setStrokeJoin(next.join);
    if ("opacity" in patch) setStrokeOpacity(next.opacity);
    if ("dbl" in patch) setDoubleStroke(next.dbl);
    if ("s2Color" in patch) setStroke2Color(next.s2Color);
    if ("s2Width" in patch) setStroke2Width(next.s2Width);
    if ("align" in patch) setStrokeAlign(next.align);
    if (next.enabled) applyStroke(next.enabled, next.color, next.width, next.dash, next.cap, next.join, next.opacity, next.dbl, next.s2Color, next.s2Width, next.align);
  }, [strokeEnabled, strokeColor, strokeWidth, strokeDash, strokeCap, strokeJoin, strokeOpacity, doubleStroke, stroke2Color, stroke2Width, strokeAlign, applyStroke]);

  const applyPreset = (preset: typeof STROKE_PRESETS[0]) => {
    const next = { color: preset.color, width: preset.width, dash: preset.dash };
    setStrokeColor(next.color);
    setStrokeWidth(next.width);
    setStrokeDash(next.dash);
    setStrokeEnabled(true);
    applyStroke(true, next.color, next.width, next.dash, strokeCap, strokeJoin, strokeOpacity, doubleStroke, stroke2Color, stroke2Width, strokeAlign);
    toast.success(`Preset "${preset.label}" aplicado`);
  };

  if (!hasObject) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <PenLine className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione um objeto para adicionar contorno</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Contorno Avançado</span>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${strokeEnabled ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${strokeEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-3 gap-1">
          {STROKE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-border hover:border-primary/40 transition-all"
            >
              <div className="w-4 h-4 rounded-sm border-2 bg-transparent flex-shrink-0" style={{ borderColor: p.color, borderStyle: p.dash === "solid" ? "solid" : p.dash === "dashed" ? "dashed" : "dotted", borderWidth: Math.min(p.width, 3) }} />
              <span className="text-[9px] text-muted-foreground">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`flex flex-col gap-3 ${!strokeEnabled ? "opacity-40 pointer-events-none" : ""}`}>
        {/* Color + Width */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">Cor</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => update({ color: e.target.value })}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
              <span className="text-[9px] text-muted-foreground truncate">{strokeColor}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Largura</span>
              <span className="text-[10px] tabular-nums">{strokeWidth}px</span>
            </div>
            <input
              type="range" min={1} max={50} step={1} value={strokeWidth}
              onChange={(e) => update({ width: Number(e.target.value) })}
              className="w-full accent-primary h-1"
            />
          </div>
        </div>

        {/* Width presets */}
        <div className="flex gap-1">
          {WIDTH_PRESETS.map((w) => (
            <button key={w} onClick={() => update({ width: w })} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${strokeWidth === w ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{w}</button>
          ))}
        </div>

        {/* Opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacidade</span>
            <span className="text-[10px] tabular-nums">{strokeOpacity}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={1} value={strokeOpacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="w-full accent-primary h-1"
          />
        </div>

        {/* Dash style */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
          <div className="grid grid-cols-5 gap-1">
            {DASH_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => update({ dash: d.value })}
                className={`py-1.5 rounded border text-[7px] transition-colors ${strokeDash === d.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cap + Join */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">Terminação</span>
            <div className="flex gap-1">
              {(["butt", "round", "square"] as StrokeCap[]).map((c) => (
                <button key={c} onClick={() => update({ cap: c })} className={`flex-1 text-[7px] py-1 rounded border transition-colors capitalize ${strokeCap === c ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{c === "butt" ? "Reto" : c === "round" ? "Redondo" : "Quadrado"}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">Junção</span>
            <div className="flex gap-1">
              {(["miter", "round", "bevel"] as StrokeJoin[]).map((j) => (
                <button key={j} onClick={() => update({ join: j })} className={`flex-1 text-[7px] py-1 rounded border transition-colors ${strokeJoin === j ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{j === "miter" ? "Agudo" : j === "round" ? "Redondo" : "Chanfrado"}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Alignment */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhamento</span>
          <div className="grid grid-cols-3 gap-1">
            {(["inside", "center", "outside"] as StrokeAlign[]).map((a) => (
              <button key={a} onClick={() => update({ align: a })} className={`py-1.5 rounded border text-[9px] transition-colors ${strokeAlign === a ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                {a === "inside" ? "Interno" : a === "center" ? "Centro" : "Externo"}
              </button>
            ))}
          </div>
        </div>

        {/* Double stroke */}
        <div className="flex flex-col gap-2 p-2 rounded border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Contorno duplo</span>
            <button
              onClick={() => update({ dbl: !doubleStroke })}
              className={`relative w-8 h-4 rounded-full transition-colors ${doubleStroke ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${doubleStroke ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          {doubleStroke && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-muted-foreground">Cor 2</span>
                <input
                  type="color"
                  value={stroke2Color}
                  onChange={(e) => update({ s2Color: e.target.value })}
                  className="w-full h-6 rounded border border-border cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Largura 2</span>
                  <span className="text-[9px] tabular-nums">{stroke2Width}px</span>
                </div>
                <input
                  type="range" min={1} max={20} step={1} value={stroke2Width}
                  onChange={(e) => update({ s2Width: Number(e.target.value) })}
                  className="w-full accent-primary h-1"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => { update({ enabled: false }); setStrokeEnabled(false); toast.success("Contorno removido"); }}
          className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors text-center"
        >
          Remover contorno
        </button>
      </div>
    </div>
  );
}
