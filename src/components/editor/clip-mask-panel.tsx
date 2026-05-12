"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ClipMaskPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type MaskShape = "none" | "circle" | "ellipse" | "rounded" | "diamond" | "triangle" | "star" | "heart" | "hexagon" | "speech";

interface MaskDef {
  id: MaskShape;
  label: string;
  preview: string;
}

const MASKS: MaskDef[] = [
  { id: "none", label: "Original", preview: "□" },
  { id: "circle", label: "Círculo", preview: "○" },
  { id: "ellipse", label: "Elipse", preview: "◯" },
  { id: "rounded", label: "Arredondado", preview: "▢" },
  { id: "diamond", label: "Losango", preview: "◇" },
  { id: "triangle", label: "Triângulo", preview: "△" },
  { id: "star", label: "Estrela", preview: "☆" },
  { id: "heart", label: "Coração", preview: "♡" },
  { id: "hexagon", label: "Hexágono", preview: "⬡" },
  { id: "speech", label: "Balão", preview: "💬" },
];

async function buildClipPath(shape: MaskShape, w: number, h: number) {
  const fabric = await import("fabric").then((m) => m.fabric);
  const cx = 0, cy = 0;
  const rx = w / 2, ry = h / 2;

  switch (shape) {
    case "none":
      return null;

    case "circle": {
      const r = Math.min(rx, ry);
      return new fabric.Circle({ radius: r, left: -r, top: -r, originX: "left", originY: "top" });
    }

    case "ellipse":
      return new fabric.Ellipse({ rx, ry, left: cx - rx, top: cy - ry, originX: "left", originY: "top" });

    case "rounded":
      return new fabric.Rect({ width: w, height: h, rx: w * 0.12, ry: h * 0.12, left: -rx, top: -ry, originX: "left", originY: "top" });

    case "diamond": {
      const pts = [
        { x: cx, y: cy - ry },
        { x: cx + rx, y: cy },
        { x: cx, y: cy + ry },
        { x: cx - rx, y: cy },
      ];
      return new fabric.Polygon(pts, { left: cx - rx, top: cy - ry, originX: "left", originY: "top" });
    }

    case "triangle": {
      const pts = [
        { x: cx, y: cy - ry },
        { x: cx + rx, y: cy + ry },
        { x: cx - rx, y: cy + ry },
      ];
      return new fabric.Polygon(pts, { left: cx - rx, top: cy - ry, originX: "left", originY: "top" });
    }

    case "star": {
      const pts: { x: number; y: number }[] = [];
      const spikes = 5;
      const outerR = Math.min(rx, ry);
      const innerR = outerR * 0.42;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      return new fabric.Polygon(pts, { left: cx - outerR, top: cy - outerR, originX: "left", originY: "top" });
    }

    case "heart": {
      const s = Math.min(rx, ry) / 120;
      const path = `M ${cx} ${cy + 40 * s}
        C ${cx - 120 * s} ${cy - 30 * s}, ${cx - 180 * s} ${cy + 80 * s}, ${cx} ${cy + 160 * s}
        C ${cx + 180 * s} ${cy + 80 * s}, ${cx + 120 * s} ${cy - 30 * s}, ${cx} ${cy + 40 * s} Z`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (fabric as any).Path(path, { left: cx - rx, top: cy - ry, originX: "left", originY: "top" });
    }

    case "hexagon": {
      const pts: { x: number; y: number }[] = [];
      const r = Math.min(rx, ry);
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
      }
      return new fabric.Polygon(pts, { left: cx - r, top: cy - r, originX: "left", originY: "top" });
    }

    case "speech": {
      const br = w * 0.1;
      const tailW = w * 0.15;
      const tailH = h * 0.18;
      const bodyH = h - tailH;
      const path = `
        M ${cx - rx + br} ${cy - ry}
        L ${cx + rx - br} ${cy - ry}
        Q ${cx + rx} ${cy - ry} ${cx + rx} ${cy - ry + br}
        L ${cx + rx} ${cy - ry + bodyH - br}
        Q ${cx + rx} ${cy - ry + bodyH} ${cx + rx - br} ${cy - ry + bodyH}
        L ${cx + tailW / 2} ${cy - ry + bodyH}
        L ${cx - tailW / 2} ${cy + ry}
        L ${cx - tailW / 2} ${cy - ry + bodyH}
        L ${cx - rx + br} ${cy - ry + bodyH}
        Q ${cx - rx} ${cy - ry + bodyH} ${cx - rx} ${cy - ry + bodyH - br}
        L ${cx - rx} ${cy - ry + br}
        Q ${cx - rx} ${cy - ry} ${cx - rx + br} ${cy - ry} Z`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (fabric as any).Path(path, { left: cx - rx, top: cy - ry, originX: "left", originY: "top" });
    }

    default:
      return null;
  }
}

export function ClipMaskPanel({ fabricCanvas, selectionVersion }: ClipMaskPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [currentMask, setCurrentMask] = useState<MaskShape>("none");

  useEffect(() => {
    void selectionVersion;
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      setActive(obj ?? null);
      setCurrentMask(obj?.clipPath ? "circle" : "none");
    });
  }, [selectionVersion, fabricCanvas]);

  const applyMask = useCallback(async (shape: MaskShape) => {
    if (!active) { toast.error("Selecione um elemento primeiro"); return; }

    const w = active.getScaledWidth?.() ?? active.width ?? 100;
    const h = active.getScaledHeight?.() ?? active.height ?? 100;

    const clip = await buildClipPath(shape, w / (active.scaleX ?? 1), h / (active.scaleY ?? 1));

    active.set({ clipPath: clip });
    fabricCanvas.requestRenderAll();
    setCurrentMask(shape);

    toast.success(shape === "none" ? "Máscara removida" : `Máscara "${MASKS.find(m => m.id === shape)?.label}" aplicada`);
  }, [active, fabricCanvas]);

  if (!active) {
    return (
      <div className="p-3 text-[11px] text-zinc-500 text-center pt-8">
        Selecione um elemento para aplicar máscara
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold text-foreground">Máscara / Recorte</h3>
      <p className="text-[10px] text-zinc-500">
        Aplica um recorte em forma ao elemento selecionado
      </p>

      <div className="grid grid-cols-5 gap-1.5">
        {MASKS.map((mask) => (
          <button
            key={mask.id}
            onClick={() => applyMask(mask.id)}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded border transition-colors ${
              currentMask === mask.id
                ? "border-primary/60 bg-primary/10 text-white"
                : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            title={mask.label}
          >
            <span className="text-base leading-none">{mask.preview}</span>
            <span className="text-[8px] text-center leading-tight">{mask.label}</span>
          </button>
        ))}
      </div>

      <div className="text-[9px] text-zinc-600 text-center">
        Funciona com imagens, formas e grupos
      </div>
    </div>
  );
}
