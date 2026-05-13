"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";

interface CanvasRulerProps {
  orientation: "horizontal" | "vertical";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  size?: number;
  guidesRef: React.MutableRefObject<{ h: number[]; v: number[] }>;
  onAddGuide: (axis: "h" | "v", value: number) => void;
}

const RULER_SIZE = 20;
const TICK_COLOR = "#555";
const LABEL_COLOR = "#888";
const GUIDE_COLOR = "#3b82f6";

export function CanvasRuler({ orientation, fabricCanvas, size = RULER_SIZE, guidesRef, onAddGuide }: CanvasRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { zoom, template } = useEditorStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fabricCanvas || !template) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isH = orientation === "horizontal";
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (isH) { ctx.moveTo(0, h); ctx.lineTo(w, h); }
    else { ctx.moveTo(w, 0); ctx.lineTo(w, h); }
    ctx.stroke();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vp = fabricCanvas.viewportTransform as any[];
    const offsetX = vp?.[4] ?? 0;
    const offsetY = vp?.[5] ?? 0;

    const step = getStep(zoom);
    const length = isH ? w : h;
    const offset = isH ? offsetX : offsetY;

    const startUnit = Math.floor(-offset / zoom / step) * step;
    const endUnit = startUnit + Math.ceil(length / zoom / step) * step + step;

    ctx.font = `9px monospace`;
    ctx.fillStyle = LABEL_COLOR;
    ctx.textBaseline = "middle";

    for (let u = startUnit; u <= endUnit; u += step) {
      const pos = u * zoom + offset;
      if (pos < 0 || pos > length) continue;
      const isMajor = u % (step * 5) === 0;

      ctx.strokeStyle = TICK_COLOR;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      if (isH) {
        const tickH = isMajor ? size * 0.6 : size * 0.3;
        ctx.moveTo(pos, h - tickH);
        ctx.lineTo(pos, h);
      } else {
        const tickW = isMajor ? size * 0.6 : size * 0.3;
        ctx.moveTo(w - tickW, pos);
        ctx.lineTo(w, pos);
      }
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = LABEL_COLOR;
        if (isH) {
          ctx.textAlign = "center";
          ctx.fillText(String(u), pos, h / 2 - 2);
        } else {
          ctx.save();
          ctx.translate(w / 2 + 1, pos);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.fillText(String(u), 0, 0);
          ctx.restore();
        }
      }
    }

    // Draw guides
    const guides = isH ? guidesRef.current.h : guidesRef.current.v;
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = 1;
    guides.forEach((g) => {
      const pos = g * zoom + offset;
      ctx.beginPath();
      if (isH) { ctx.moveTo(pos, 0); ctx.lineTo(pos, h); }
      else { ctx.moveTo(0, pos); ctx.lineTo(w, pos); }
      ctx.stroke();
    });
  }, [orientation, fabricCanvas, zoom, template, size, guidesRef]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.on("after:render", draw);
    fabricCanvas.on("viewport:transform", draw);
    return () => {
      fabricCanvas.off("after:render", draw);
      fabricCanvas.off("viewport:transform", draw);
    };
  }, [fabricCanvas, draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!fabricCanvas) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const isH = orientation === "horizontal";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vp = fabricCanvas.viewportTransform as any[];
    const offset = isH ? (vp?.[4] ?? 0) : (vp?.[5] ?? 0);
    const mouse = isH ? e.clientX - rect.left : e.clientY - rect.top;
    const unit = Math.round((mouse - offset) / zoom);
    onAddGuide(isH ? "h" : "v", unit);
    draw();
  }, [fabricCanvas, orientation, zoom, draw, onAddGuide]);

  return (
    <canvas
      ref={canvasRef}
      width={orientation === "horizontal" ? 9999 : size}
      height={orientation === "horizontal" ? size : 9999}
      style={{
        width: orientation === "horizontal" ? "100%" : size,
        height: orientation === "horizontal" ? size : "100%",
        display: "block",
        cursor: orientation === "horizontal" ? "col-resize" : "row-resize",
      }}
      onMouseDown={handleMouseDown}
      title={orientation === "horizontal" ? "Régua horizontal — clique para adicionar guia" : "Régua vertical — clique para adicionar guia"}
    />
  );
}

function getStep(zoom: number): number {
  if (zoom >= 2) return 10;
  if (zoom >= 1) return 25;
  if (zoom >= 0.5) return 50;
  return 100;
}
