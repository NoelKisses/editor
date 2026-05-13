"use client";

import { useCallback, useEffect, useState } from "react";
import { Spline, RotateCcw, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TextPathEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type PathEffect = "none" | "arc-up" | "arc-down" | "wave" | "circle";

const EFFECTS: { id: PathEffect; label: string; desc: string }[] = [
  { id: "none", label: "Normal", desc: "Texto reto" },
  { id: "arc-up", label: "Arco ↑", desc: "Curva para cima" },
  { id: "arc-down", label: "Arco ↓", desc: "Curva para baixo" },
  { id: "wave", label: "Onda", desc: "Formato de onda" },
  { id: "circle", label: "Círculo", desc: "Texto em anel" },
];

function buildPath(effect: PathEffect, radius: number, width: number): string {
  switch (effect) {
    case "arc-up":
      return `M -${width / 2} 0 A ${radius} ${radius} 0 0 1 ${width / 2} 0`;
    case "arc-down":
      return `M -${width / 2} 0 A ${radius} ${radius} 0 0 0 ${width / 2} 0`;
    case "wave":
      return `M -${width / 2} 0 C -${width / 4} -${radius * 0.3} ${width / 4} ${radius * 0.3} ${width / 2} 0`;
    case "circle":
      return `M 0 -${radius} A ${radius} ${radius} 0 1 1 -0.01 -${radius}`;
    default:
      return "";
  }
}

export function TextPathEffectPanel({ fabricCanvas, selectionVersion }: TextPathEffectPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [effect, setEffect] = useState<PathEffect>("none");
  const [radius, setRadius] = useState(200);
  const [offset, setOffset] = useState(0);
  const [side, setSide] = useState<"left" | "right">("left");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [textObj, setTextObj] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pathObj, setPathObj] = useState<any>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
      if (isText) {
        setTextObj(obj);
        const meta = obj.data?.textPathFx ?? {};
        setEffect(meta.effect ?? "none");
        setRadius(meta.radius ?? 200);
        setOffset(meta.offset ?? 0);
        setSide(meta.side ?? "left");
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const applyEffect = useCallback((newEffect: PathEffect, newRadius: number, newOffset: number, newSide: "left" | "right") => {
    if (!fabricCanvas || !textObj) return;

    // Remove old path if any
    if (pathObj) {
      fabricCanvas.remove(pathObj);
      setPathObj(null);
    }

    // Remove text from any existing path association
    if (textObj.path) {
      textObj.set({ path: null });
    }

    if (newEffect === "none") {
      fabricCanvas.requestRenderAll();
      toast.success("Efeito removido");
      return;
    }

    import("fabric").then(m => {
      const fabric = m.fabric;
      const w = textObj.width ?? 200;
      const pathStr = buildPath(newEffect, newRadius, w + 40);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = new (fabric as any).Path(pathStr, {
        left: textObj.left,
        top: textObj.top,
        fill: "",
        stroke: "",
        visible: false,
        selectable: false,
        evented: false,
        data: { isTextPath: true },
      });
      fabricCanvas.add(p);
      textObj.set({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path: p as any,
        pathAlign: "center",
        pathSide: newSide,
        pathStartOffset: newOffset,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { ...(textObj.data ?? {}), textPathFx: { effect: newEffect, radius: newRadius, offset: newOffset, side: newSide } } as any,
      });
      setPathObj(p);
      fabricCanvas.requestRenderAll();
      toast.success("Efeito de caminho aplicado");
    });
  }, [fabricCanvas, textObj, pathObj]);

  const handleEffectChange = (e: PathEffect) => {
    setEffect(e);
    applyEffect(e, radius, offset, side);
  };

  const handleRadiusChange = (r: number) => {
    setRadius(r);
    if (effect !== "none") applyEffect(effect, r, offset, side);
  };

  const handleOffsetChange = (o: number) => {
    setOffset(o);
    if (effect !== "none") applyEffect(effect, radius, o, side);
  };

  const handleSideChange = (s: "left" | "right") => {
    setSide(s);
    if (effect !== "none") applyEffect(effect, radius, offset, s);
  };

  const reset = useCallback(() => {
    setEffect("none");
    applyEffect("none", radius, offset, side);
    toast.success("Efeito removido");
  }, [applyEffect, radius, offset, side]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Spline className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto em Caminho</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Spline className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para aplicar efeito de caminho</p>
        </div>
      ) : (
        <>
          {/* Effect selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Efeito</span>
            <div className="flex flex-col gap-1">
              {EFFECTS.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleEffectChange(e.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${effect === e.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                >
                  <span className={`text-[10px] font-medium ${effect === e.id ? "text-primary" : "text-foreground"}`}>{e.label}</span>
                  <span className="text-[8px] text-muted-foreground">{e.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {effect !== "none" && (
            <>
              {/* Radius */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Raio da curva</span>
                  <span className="text-[9px] tabular-nums">{radius}px</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={500}
                  step={10}
                  value={radius}
                  onChange={e => handleRadiusChange(Number(e.target.value))}
                  className="w-full accent-primary h-1"
                />
              </div>

              {/* Offset */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Deslocamento</span>
                  <span className="text-[9px] tabular-nums">{offset}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={offset}
                  onChange={e => handleOffsetChange(Number(e.target.value))}
                  className="w-full accent-primary h-1"
                />
              </div>

              {/* Side */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-muted-foreground">Lado do texto</span>
                <div className="flex gap-1">
                  {(["left", "right"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => handleSideChange(s)}
                      className={`flex-1 py-1.5 rounded border text-[9px] transition-colors ${side === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {s === "left" ? "Interno" : "Externo"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply */}
              <button
                onClick={() => applyEffect(effect, radius, offset, side)}
                className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Reaplicar
              </button>
            </>
          )}

          {/* Reset */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-destructive/30 hover:text-destructive transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Remover efeito
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Requer Fabric.js com suporte a path text
          </p>
        </>
      )}
    </div>
  );
}
