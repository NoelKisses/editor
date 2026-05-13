"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ruler, Eye, EyeOff } from "lucide-react";

function Row({ label, value, unit = "px" }: { label: string; value: number | string; unit?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className="text-[9px] tabular-nums font-mono">{value}{unit && <span className="text-muted-foreground/60 ml-0.5">{unit}</span>}</span>
    </div>
  );
}

interface SmartMeasurementPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ObjectInfo {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  scaleX: number;
  scaleY: number;
  scaledWidth: number;
  scaledHeight: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

interface Distances {
  toLeft: number;
  toRight: number;
  toTop: number;
  toBottom: number;
  toCenterH: number;
  toCenterV: number;
}

function getObjInfo(obj: unknown, cw: number, ch: number): { info: ObjectInfo; distances: Distances } | null {
  if (!obj) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = obj as any;
  const left = Math.round(o.left ?? 0);
  const top = Math.round(o.top ?? 0);
  const sw = Math.round((o.width ?? 0) * (o.scaleX ?? 1));
  const sh = Math.round((o.height ?? 0) * (o.scaleY ?? 1));

  const info: ObjectInfo = {
    left,
    top,
    width: Math.round(o.width ?? 0),
    height: Math.round(o.height ?? 0),
    angle: Math.round(o.angle ?? 0),
    scaleX: parseFloat(((o.scaleX ?? 1) * 100).toFixed(1)),
    scaleY: parseFloat(((o.scaleY ?? 1) * 100).toFixed(1)),
    scaledWidth: sw,
    scaledHeight: sh,
    right: left + sw,
    bottom: top + sh,
    centerX: Math.round(left + sw / 2),
    centerY: Math.round(top + sh / 2),
  };

  const distances: Distances = {
    toLeft: left,
    toRight: Math.round(cw - (left + sw)),
    toTop: top,
    toBottom: Math.round(ch - (top + sh)),
    toCenterH: Math.round(Math.abs(cw / 2 - (left + sw / 2))),
    toCenterV: Math.round(Math.abs(ch / 2 - (top + sh / 2))),
  };

  return { info, distances };
}

export function SmartMeasurementPanel({ fabricCanvas, selectionVersion }: SmartMeasurementPanelProps) {
  const [data, setData] = useState<ReturnType<typeof getObjInfo>>(null);
  const [showLines, setShowLines] = useState(true);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cw = useCallback(() => fabricCanvas ? Math.round(fabricCanvas.getWidth() / fabricCanvas.getZoom()) : 0, [fabricCanvas]);
  const ch = useCallback(() => fabricCanvas ? Math.round(fabricCanvas.getHeight() / fabricCanvas.getZoom()) : 0, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    const result = obj ? getObjInfo(obj, cw(), ch()) : null;
    queueMicrotask(() => setData(result));
  }, [fabricCanvas, selectionVersion, cw, ch]);

  // Draw measurement overlay on a mini preview canvas
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasW = cw();
    const canvasH = ch();
    if (!canvasW || !canvasH) return;

    const scale = Math.min(canvas.width / canvasW, canvas.height / canvasH);
    const ox = (canvas.width - canvasW * scale) / 2;
    const oy = (canvas.height - canvasH * scale) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Canvas background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(ox, oy, canvasW * scale, canvasH * scale);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox, oy, canvasW * scale, canvasH * scale);

    if (!showLines) return;

    const { info, distances } = data;
    const x = ox + info.left * scale;
    const y = oy + info.top * scale;
    const w = info.scaledWidth * scale;
    const h = info.scaledHeight * scale;

    // Object rect
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(99,102,241,0.1)";
    ctx.fillRect(x, y, w, h);

    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#f59e0b";

    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };

    const drawLabel = (text: string, lx: number, ly: number) => {
      ctx.setLineDash([]);
      ctx.fillStyle = "#f59e0b";
      ctx.font = "8px monospace";
      ctx.fillText(text, lx, ly);
      ctx.setLineDash([3, 3]);
    };

    // Left distance
    if (distances.toLeft > 2) {
      drawLine(ox, y + h / 2, x, y + h / 2);
      drawLabel(`${distances.toLeft}`, ox + 2, y + h / 2 - 2);
    }
    // Right distance
    if (distances.toRight > 2) {
      drawLine(x + w, y + h / 2, ox + canvasW * scale, y + h / 2);
      drawLabel(`${distances.toRight}`, x + w + 2, y + h / 2 - 2);
    }
    // Top distance
    if (distances.toTop > 2) {
      drawLine(x + w / 2, oy, x + w / 2, y);
      drawLabel(`${distances.toTop}`, x + w / 2 + 2, oy + distances.toTop * scale / 2);
    }
    // Bottom distance
    if (distances.toBottom > 2) {
      drawLine(x + w / 2, y + h, x + w / 2, oy + canvasH * scale);
      drawLabel(`${distances.toBottom}`, x + w / 2 + 2, y + h + distances.toBottom * scale / 2);
    }

    ctx.setLineDash([]);
    // Size label
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 8px monospace";
    ctx.fillText(`${info.scaledWidth}×${info.scaledHeight}`, x + 2, y - 2);

  }, [data, showLines, cw, ch]);

  return (
    <div className="flex flex-col gap-4 p-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Medidas do Objeto</span>
        </div>
        <button
          onClick={() => setShowLines(!showLines)}
          className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border transition-colors ${showLines ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
        >
          {showLines ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {showLines ? "Linhas" : "Oculto"}
        </button>
      </div>

      {/* Mini preview canvas */}
      <div className="rounded border border-border overflow-hidden bg-[#1a1a2e]">
        <canvas
          ref={overlayRef}
          width={220}
          height={130}
          className="w-full"
        />
      </div>

      {!data ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Ruler className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para ver as medidas</p>
        </div>
      ) : (
        <>
          {/* Position & Size */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Posição e Tamanho</span>
            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <Row label="X" value={data.info.left} />
                <Row label="Y" value={data.info.top} />
                <Row label="Centro X" value={data.info.centerX} />
                <Row label="Centro Y" value={data.info.centerY} />
              </div>
              <div>
                <Row label="Largura" value={data.info.scaledWidth} />
                <Row label="Altura" value={data.info.scaledHeight} />
                <Row label="Original L" value={data.info.width} />
                <Row label="Original A" value={data.info.height} />
              </div>
            </div>
          </div>

          {/* Transform */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Transformações</span>
            <div className="grid grid-cols-2 gap-x-4">
              <Row label="Rotação" value={data.info.angle} unit="°" />
              <Row label="Escala X" value={data.info.scaleX} unit="%" />
              <Row label="Direita" value={data.info.right} />
              <Row label="Escala Y" value={data.info.scaleY} unit="%" />
              <Row label="Base" value={data.info.bottom} />
            </div>
          </div>

          {/* Distances */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Distâncias ao Canvas</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: "← Esquerda", value: data.distances.toLeft },
                { label: "Direita →", value: data.distances.toRight },
                { label: "↑ Topo", value: data.distances.toTop },
                { label: "Base ↓", value: data.distances.toBottom },
                { label: "⊕ Centro H", value: data.distances.toCenterH },
                { label: "⊕ Centro V", value: data.distances.toCenterV },
              ].map(({ label, value }) => (
                <div key={label} className={`flex items-center justify-between px-2 py-1 rounded text-[9px] border ${value === 0 ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                  <span>{label}</span>
                  <span className="tabular-nums font-mono">{value}px</span>
                </div>
              ))}
            </div>
            {(data.distances.toCenterH === 0 || data.distances.toCenterV === 0) && (
              <p className="text-[8px] text-primary text-center mt-1">⊕ Objeto centralizado no canvas</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
