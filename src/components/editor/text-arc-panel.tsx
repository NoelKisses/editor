"use client";

import { useCallback, useEffect, useState } from "react";
import { Spline, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextArcPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type ArcDirection = "up" | "down" | "full-circle";

const ARC_PRESETS: { label: string; radius: number; direction: ArcDirection; startAngle: number }[] = [
  { label: "Arco Suave ↑", radius: 200, direction: "up", startAngle: 0 },
  { label: "Arco Forte ↑", radius: 100, direction: "up", startAngle: 0 },
  { label: "Arco Suave ↓", radius: 200, direction: "down", startAngle: 0 },
  { label: "Arco Forte ↓", radius: 100, direction: "down", startAngle: 0 },
  { label: "Círculo Completo", radius: 120, direction: "full-circle", startAngle: -90 },
  { label: "Semi-círculo", radius: 150, direction: "up", startAngle: -30 },
];

function buildTextOnArcPath(text: string, radius: number, direction: ArcDirection, fontSize: number): string {
  const chars = text.split("");
  const charWidth = fontSize * 0.55;
  const totalWidth = chars.length * charWidth;
  const totalAngle = totalWidth / radius;
  const startAngle = -totalAngle / 2;

  const paths: string[] = [];
  chars.forEach((_, i) => {
    const angle = startAngle + (i + 0.5) * (totalAngle / chars.length);
    const rad = (angle * Math.PI) / 180;
    const cx = radius * Math.sin(rad);
    const cy = direction === "up" ? -radius * Math.cos(rad) : radius * Math.cos(rad);
    paths.push(`M ${cx} ${cy}`);
  });
  return paths.join(" ");
}

export function TextArcPanel({ fabricCanvas, selectionVersion }: TextArcPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [radius, setRadius] = useState(150);
  const [direction, setDirection] = useState<ArcDirection>("up");
  const [startAngle, setStartAngle] = useState(0);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = obj?.type === "i-text" || obj?.type === "text" || obj?.type === "textbox";
      setHasText(isText);
    });
  }, [fabricCanvas, selectionVersion]);

  const getText = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    const isText = obj?.type === "i-text" || obj?.type === "text" || obj?.type === "textbox";
    return isText ? obj : null;
  }, [fabricCanvas]);

  const applyArc = useCallback((r: number, dir: ArcDirection, sAngle: number, lSpacing: number) => {
    const obj = getText();
    if (!obj) { toast.error("Selecione um texto"); return; }

    setProcessing(true);
    const text: string = obj.text ?? "Texto";
    const fontSize: number = obj.fontSize ?? 24;
    const fill: string = obj.fill ?? "#000000";
    const fontFamily: string = obj.fontFamily ?? "Arial";
    const fontWeight: string = obj.fontWeight ?? "normal";
    const objLeft: number = obj.left ?? 0;
    const objTop: number = obj.top ?? 0;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const chars = text.split("");
      const charWidth = (fontSize * 0.55) + lSpacing;
      const totalWidth = chars.length * charWidth;
      const totalAngle = (totalWidth / r) * (180 / Math.PI);
      const baseAngle = sAngle - totalAngle / 2;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const group: any[] = [];

      chars.forEach((char, i) => {
        if (char === " ") return;
        const angle = baseAngle + (i + 0.5) * (totalAngle / chars.length);
        const rad = (angle * Math.PI) / 180;

        let cx: number, cy: number, rotAngle: number;

        if (dir === "up") {
          cx = r * Math.sin(rad);
          cy = -r * Math.cos(rad);
          rotAngle = angle;
        } else if (dir === "down") {
          cx = r * Math.sin(rad);
          cy = r * Math.cos(rad);
          rotAngle = angle + 180;
        } else {
          cx = r * Math.cos(rad);
          cy = r * Math.sin(rad);
          rotAngle = angle + 90;
        }

        const t = new f.Text(char, {
          left: cx,
          top: cy,
          fontSize,
          fill,
          fontFamily,
          fontWeight,
          originX: "center",
          originY: "center",
          angle: rotAngle,
          selectable: false,
        });
        group.push(t);
      });

      if (group.length === 0) { setProcessing(false); return; }

      const grp = new f.Group(group, {
        left: objLeft,
        top: objTop,
        originX: "center",
        originY: "center",
        data: { isTextArc: true, originalText: text },
      });

      fabricCanvas.remove(obj);
      fabricCanvas.add(grp);
      fabricCanvas.setActiveObject(grp);
      fabricCanvas.requestRenderAll();
      setProcessing(false);
      toast.success("Texto em arco criado");
    });
  }, [getText, fabricCanvas]);

  const restoreText = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj?.data?.isTextArc) { toast.error("Selecione um texto em arco"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const t = new f.IText(obj.data.originalText ?? "Texto", {
        left: obj.left,
        top: obj.top,
        fontSize: 24,
        fill: "#000000",
      });
      fabricCanvas.remove(obj);
      fabricCanvas.add(t);
      fabricCanvas.setActiveObject(t);
      fabricCanvas.requestRenderAll();
      toast.success("Texto restaurado");
    });
  }, [fabricCanvas]);

  const DIRECTIONS: { value: ArcDirection; label: string }[] = [
    { value: "up", label: "Arco ↑" },
    { value: "down", label: "Arco ↓" },
    { value: "full-circle", label: "Círculo" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Spline className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto em Arco</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Spline className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para aplicar o arco</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-2 gap-1">
              {ARC_PRESETS.map(p => (
                <button key={p.label} onClick={() => {
                  setRadius(p.radius);
                  setDirection(p.direction);
                  setStartAngle(p.startAngle);
                  applyArc(p.radius, p.direction, p.startAngle, letterSpacing);
                }}
                  className="py-1.5 rounded border border-border text-[8px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Direção</span>
            <div className="grid grid-cols-3 gap-1">
              {DIRECTIONS.map(d => (
                <button key={d.value} onClick={() => setDirection(d.value)}
                  className={`py-1.5 rounded border text-[9px] transition-colors ${direction === d.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Raio da Curva</span>
              <span className="text-[9px] tabular-nums">{radius}px</span>
            </div>
            <input type="range" min={50} max={500} step={5} value={radius}
              onChange={e => setRadius(Number(e.target.value))} className="w-full accent-primary h-1" />
            <div className="flex justify-between text-[7px] text-muted-foreground/60">
              <span>Fechado</span><span>Aberto</span>
            </div>
          </div>

          {/* Start angle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Rotação Inicial</span>
              <span className="text-[9px] tabular-nums">{startAngle}°</span>
            </div>
            <input type="range" min={-180} max={180} step={5} value={startAngle}
              onChange={e => setStartAngle(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Letter spacing */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espaçamento</span>
              <span className="text-[9px] tabular-nums">{letterSpacing}</span>
            </div>
            <input type="range" min={-5} max={20} step={1} value={letterSpacing}
              onChange={e => setLetterSpacing(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={restoreText}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <RotateCcw className="w-3 h-3" /> Restaurar
            </button>
            <button onClick={() => applyArc(radius, direction, startAngle, letterSpacing)} disabled={processing}
              className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40">
              <Spline className="w-3 h-3" /> {processing ? "Aplicando..." : "Aplicar Arco"}
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            O texto se torna um grupo após o arco ser aplicado
          </p>
        </>
      )}
    </div>
  );
}
