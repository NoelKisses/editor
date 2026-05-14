"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricAny = any;

interface CanvasImageOverlayPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type OverlayType =
  | "sólido"
  | "gradiente-v"
  | "gradiente-h"
  | "gradiente-d"
  | "vinheta"
  | "luz";

const OVERLAY_TYPES: { value: OverlayType; label: string }[] = [
  { value: "sólido", label: "Sólido" },
  { value: "gradiente-v", label: "Gradiente ↕" },
  { value: "gradiente-h", label: "Gradiente ↔" },
  { value: "gradiente-d", label: "Gradiente ↗" },
  { value: "vinheta", label: "Vinheta" },
  { value: "luz", label: "Luz" },
];

const BLEND_MODES = [
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "soft-light", label: "Soft Light" },
  { value: "normal", label: "Normal" },
  { value: "color-burn", label: "Color Burn" },
];

function buildOverlayFill(
  type: OverlayType,
  color1: string,
  color2: string,
  w: number,
  h: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: FabricAny
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const cx = w / 2;
  const cy = h / 2;

  if (type === "sólido") {
    return color1;
  }

  if (type === "gradiente-v") {
    return new fabric.Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: 0, y2: h },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });
  }

  if (type === "gradiente-h") {
    return new fabric.Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: w, y2: 0 },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });
  }

  if (type === "gradiente-d") {
    return new fabric.Gradient({
      type: "linear",
      coords: { x1: 0, y1: h, x2: w, y2: 0 },
      colorStops: [
        { offset: 0, color: color1 },
        { offset: 1, color: color2 },
      ],
    });
  }

  if (type === "vinheta") {
    return new fabric.Gradient({
      type: "radial",
      coords: {
        x1: cx,
        y1: cy,
        x2: cx,
        y2: cy,
        r1: 0,
        r2: Math.max(w, h) / 2,
      },
      colorStops: [
        { offset: 0, color: "rgba(0,0,0,0)" },
        { offset: 1, color: "rgba(0,0,0,0.8)" },
      ],
    });
  }

  // "luz" — opposite of vinheta
  return new fabric.Gradient({
    type: "radial",
    coords: {
      x1: cx,
      y1: cy,
      x2: cx,
      y2: cy,
      r1: 0,
      r2: Math.max(w, h) / 2,
    },
    colorStops: [
      { offset: 0, color: "rgba(255,255,255,0.8)" },
      { offset: 1, color: "rgba(0,0,0,0)" },
    ],
  });
}

export function CanvasImageOverlayPanel({
  fabricCanvas,
}: CanvasImageOverlayPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [overlayType, setOverlayType] = useState<OverlayType>("sólido");
  const [color1, setColor1] = useState("#000000");
  const [color2, setColor2] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [blendMode, setBlendMode] = useState("normal");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível.");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      const w: number = canvas.getWidth();
      const h: number = canvas.getHeight();

      const fill = buildOverlayFill(overlayType, color1, color2, w, h, f);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rect = new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill,
        opacity,
        globalCompositeOperation: blendMode,
        selectable: true,
        evented: true,
        data: { imageOverlay: true },
      });

      canvas.add(rect);
      canvas.sendToBack(rect);
      canvas.renderAll();

      toast.success("Overlay aplicado!");
    });
  }

  function handleRemove() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overlays = objects.filter((o: any) => o.data?.imageOverlay === true);

    if (overlays.length === 0) {
      toast.error("Nenhum overlay encontrado.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overlays.forEach((o: any) => canvas.remove(o));
    canvas.renderAll();

    toast.success(`${overlays.length} overlay(s) removido(s).`);
  }

  const needsGradientColors =
    overlayType === "gradiente-v" ||
    overlayType === "gradiente-h" ||
    overlayType === "gradiente-d";

  const needsColor1 =
    overlayType === "sólido" || needsGradientColors;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "12px",
        fontSize: "13px",
        color: "#e5e7eb",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Layers size={16} />
        <span style={{ fontWeight: 600, fontSize: "14px" }}>
          Overlay de Imagem
        </span>
      </div>

      {/* Overlay Type Grid 2x3 */}
      <div>
        <div
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            color: "#9ca3af",
            marginBottom: "8px",
            letterSpacing: "0.05em",
          }}
        >
          Tipo de Overlay
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
          }}
        >
          {OVERLAY_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setOverlayType(value)}
              style={{
                padding: "8px 6px",
                borderRadius: "6px",
                border: overlayType === value
                  ? "2px solid #6366f1"
                  : "1px solid #374151",
                background: overlayType === value ? "#1e1b4b" : "#1f2937",
                color: overlayType === value ? "#a5b4fc" : "#d1d5db",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: overlayType === value ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Color 1 */}
      {needsColor1 && (
        <div>
          <label
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              color: "#9ca3af",
              display: "block",
              marginBottom: "6px",
              letterSpacing: "0.05em",
            }}
          >
            {overlayType === "sólido" ? "Cor" : "Cor inicial"}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="color"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                border: "1px solid #374151",
                cursor: "pointer",
                padding: "2px",
                background: "transparent",
              }}
            />
            <input
              type="text"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid #374151",
                background: "#111827",
                color: "#e5e7eb",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>
      )}

      {/* Color 2 (gradient end) */}
      {needsGradientColors && (
        <div>
          <label
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              color: "#9ca3af",
              display: "block",
              marginBottom: "6px",
              letterSpacing: "0.05em",
            }}
          >
            Cor final
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="color"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                border: "1px solid #374151",
                cursor: "pointer",
                padding: "2px",
                background: "transparent",
              }}
            />
            <input
              type="text"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid #374151",
                background: "#111827",
                color: "#e5e7eb",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>
      )}

      {/* Opacity Slider */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              color: "#9ca3af",
              letterSpacing: "0.05em",
            }}
          >
            Opacidade
          </span>
          <span style={{ fontSize: "12px", color: "#a5b4fc" }}>
            {Math.round(opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1.0}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
        />
      </div>

      {/* Blend Mode */}
      <div>
        <label
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            color: "#9ca3af",
            display: "block",
            marginBottom: "6px",
            letterSpacing: "0.05em",
          }}
        >
          Modo de Mesclagem
        </label>
        <select
          value={blendMode}
          onChange={(e) => setBlendMode(e.target.value)}
          style={{
            width: "100%",
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #374151",
            background: "#1f2937",
            color: "#e5e7eb",
            fontSize: "13px",
            cursor: "pointer",
            appearance: "auto",
          }}
        >
          {BLEND_MODES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          onClick={handleApply}
          style={{
            padding: "9px",
            borderRadius: "8px",
            border: "none",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#4338ca")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#4f46e5")
          }
        >
          Aplicar Overlay
        </button>

        <button
          onClick={handleRemove}
          style={{
            padding: "9px",
            borderRadius: "8px",
            border: "1px solid #374151",
            background: "#1f2937",
            color: "#f87171",
            fontWeight: 500,
            fontSize: "13px",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#374151")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#1f2937")
          }
        >
          Remover Overlays
        </button>
      </div>
    </div>
  );
}
