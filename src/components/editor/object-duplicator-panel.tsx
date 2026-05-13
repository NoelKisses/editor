"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface ObjectDuplicatorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type DuplicateMode = "grid" | "circular" | "line" | "scatter" | "spiral";

const MODES: { value: DuplicateMode; label: string; desc: string }[] = [
  { value: "grid", label: "Grade", desc: "Linhas e colunas" },
  { value: "circular", label: "Circular", desc: "Disposição em anel" },
  { value: "line", label: "Linha", desc: "Sequência linear" },
  { value: "scatter", label: "Disperso", desc: "Posições aleatórias" },
  { value: "spiral", label: "Espiral", desc: "Padrão espiral" },
];

export function ObjectDuplicatorPanel({ fabricCanvas, selectionVersion }: ObjectDuplicatorPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [mode, setMode] = useState<DuplicateMode>("grid");
  const [count, setCount] = useState(6);
  const [cols, setCols] = useState(3);
  const [gapX, setGapX] = useState(20);
  const [gapY, setGapY] = useState(20);
  const [radius, setRadius] = useState(150);
  const [scaleVariation, setScaleVariation] = useState(0);
  const [rotateVariation, setRotateVariation] = useState(0);
  const [opacityVariation, setOpacityVariation] = useState(0);
  const [rotateEach, setRotateEach] = useState(true);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => setHasObject(!!obj));
  }, [fabricCanvas, selectionVersion]);

  const duplicate = useCallback(async () => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    const fabric = await import("fabric").then(m => m.fabric);
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();
    const cx = cw / 2;
    const cy = ch / 2;

    const positions: { x: number; y: number; angle?: number }[] = [];

    switch (mode) {
      case "grid": {
        const rows = Math.ceil(count / cols);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (positions.length >= count) break;
            positions.push({ x: c * gapX, y: r * gapY });
          }
        }
        break;
      }
      case "circular": {
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          positions.push({
            x: cx + radius * Math.cos(a),
            y: cy + radius * Math.sin(a),
            angle: rotateEach ? (a * 180) / Math.PI + 90 : 0,
          });
        }
        break;
      }
      case "line": {
        for (let i = 0; i < count; i++) {
          positions.push({ x: i * gapX, y: 0 });
        }
        break;
      }
      case "scatter": {
        for (let i = 0; i < count; i++) {
          positions.push({
            x: Math.random() * cw,
            y: Math.random() * ch,
            angle: Math.random() * 360,
          });
        }
        break;
      }
      case "spiral": {
        for (let i = 0; i < count; i++) {
          const t = i * 0.5;
          const r = t * 20;
          const a = t * 2;
          positions.push({
            x: cx + r * Math.cos(a),
            y: cy + r * Math.sin(a),
            angle: rotateEach ? (a * 180) / Math.PI : 0,
          });
        }
        break;
      }
    }

    const clones: unknown[] = [];
    for (let i = 0; i < positions.length; i++) {
      await new Promise<void>((resolve) => {
        obj.clone((cloned: { set: (props: Record<string, unknown>) => void; setCoords: () => void }) => {
          const pos = positions[i];
          const scaleF = 1 + (Math.random() - 0.5) * (scaleVariation / 100);
          const rotF = (Math.random() - 0.5) * rotateVariation;
          const opF = 1 - Math.random() * (opacityVariation / 100);
          cloned.set({
            left: pos.x,
            top: pos.y,
            angle: (pos.angle ?? 0) + rotF,
            scaleX: (obj.scaleX ?? 1) * scaleF,
            scaleY: (obj.scaleY ?? 1) * scaleF,
            opacity: Math.max(0.1, Math.min(1, (obj.opacity ?? 1) * opF)),
            evented: true,
            selectable: true,
          });
          cloned.setCoords();
          clones.push(cloned);
          resolve();
        });
      });
    }

    clones.forEach(c => fabricCanvas.add(c as Parameters<typeof fabricCanvas.add>[0]));

    // Group all clones (and original) into a selection
    if (clones.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sel = new (fabric as any).ActiveSelection([obj, ...clones], {
        canvas: fabricCanvas,
      });
      fabricCanvas.setActiveObject(sel);
    }

    fabricCanvas.requestRenderAll();
    toast.success(`${count} cópias criadas`);
  }, [fabricCanvas, mode, count, cols, gapX, gapY, radius, rotateEach, scaleVariation, rotateVariation, opacityVariation]);

  if (!hasObject) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Copy className="w-8 h-8 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">Selecione um objeto para duplicar em padrão</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Copy className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Duplicador Inteligente</span>
      </div>

      {/* Mode */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo</span>
        <div className="grid grid-cols-1 gap-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors text-left ${mode === m.value ? "bg-primary/10 border-primary" : "border-border hover:border-primary/30"}`}
            >
              <div className="flex-1">
                <span className={`text-[10px] font-medium ${mode === m.value ? "text-primary" : ""}`}>{m.label}</span>
                <span className="text-[8px] text-muted-foreground ml-1">— {m.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quantidade</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCount(Math.max(1, count - 1))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">−</button>
            <span className="text-[11px] w-6 text-center tabular-nums">{count}</span>
            <button onClick={() => setCount(Math.min(50, count + 1))} className="w-5 h-5 flex items-center justify-center border border-border rounded text-[10px]">+</button>
          </div>
        </div>
        <input type="range" min={1} max={50} step={1} value={count} onChange={e => setCount(Number(e.target.value))} className="w-full accent-primary h-1" />
        <div className="flex gap-1">
          {[3, 6, 9, 12, 16, 25].map(v => (
            <button key={v} onClick={() => setCount(v)} className={`flex-1 text-[8px] py-0.5 rounded border transition-colors ${count === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Mode-specific controls */}
      {mode === "grid" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Colunas</span>
              <span className="text-[10px] tabular-nums">{cols}</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={cols} onChange={e => setCols(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Gap X</span>
              <span className="text-[10px] tabular-nums">{gapX}px</span>
            </div>
            <input type="range" min={5} max={300} step={5} value={gapX} onChange={e => setGapX(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Gap Y</span>
              <span className="text-[10px] tabular-nums">{gapY}px</span>
            </div>
            <input type="range" min={5} max={300} step={5} value={gapY} onChange={e => setGapY(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
        </div>
      )}

      {(mode === "circular" || mode === "spiral") && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Raio</span>
              <span className="text-[10px] tabular-nums">{radius}px</span>
            </div>
            <input type="range" min={30} max={500} step={10} value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Girar cada objeto</span>
            <button
              onClick={() => setRotateEach(!rotateEach)}
              className={`relative w-8 h-4 rounded-full transition-colors ${rotateEach ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${rotateEach ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      )}

      {mode === "line" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Espaçamento</span>
            <span className="text-[10px] tabular-nums">{gapX}px</span>
          </div>
          <input type="range" min={5} max={300} step={5} value={gapX} onChange={e => setGapX(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
      )}

      {/* Variation */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Variações aleatórias</span>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Escala</span>
              <span className="text-[9px] tabular-nums">{scaleVariation}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={scaleVariation} onChange={e => setScaleVariation(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Rotação</span>
              <span className="text-[9px] tabular-nums">{rotateVariation}°</span>
            </div>
            <input type="range" min={0} max={180} step={5} value={rotateVariation} onChange={e => setRotateVariation(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade</span>
              <span className="text-[9px] tabular-nums">{opacityVariation}%</span>
            </div>
            <input type="range" min={0} max={80} step={5} value={opacityVariation} onChange={e => setOpacityVariation(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
        </div>
      </div>

      <button
        onClick={duplicate}
        className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" /> Duplicar em Padrão
      </button>
    </div>
  );
}
