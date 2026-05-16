"use client";

import { useEffect, useRef, useState } from "react";
import { SprayCan } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextGraffitiSprayPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const TEXT_TYPES = ["text", "i-text", "textbox"];

const SPRAY_STYLES = [
  { id: "vermelho", label: "Spray Vermelho" },
  { id: "azul", label: "Spray Azul" },
  { id: "sombrio", label: "Spray Sombrio" },
  { id: "pichado", label: "Spray Pichado" },
  { id: "bolha", label: "Spray Bolha" },
  { id: "rua", label: "Spray Rua" },
] as const;

type SprayStyleId = (typeof SPRAY_STYLES)[number]["id"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRainbowGradient(f: any) {
  return new f.Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
    gradientUnits: "percentage",
    colorStops: [
      { offset: 0, color: "#ff0033" },
      { offset: 0.5, color: "#ffcc00" },
      { offset: 1, color: "#00aaff" },
    ],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBlueGradient(f: any) {
  return new f.Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: 0, y2: 1 },
    gradientUnits: "percentage",
    colorStops: [
      { offset: 0, color: "#003cff" },
      { offset: 1, color: "#00d4ff" },
    ],
  });
}

function addDrips(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textObj: any,
  count: number,
  color: string
) {
  const bounds = textObj.getBoundingRect
    ? textObj.getBoundingRect()
    : { left: textObj.left ?? 0, top: textObj.top ?? 0, width: textObj.width ?? 100, height: textObj.height ?? 50 };

  for (let i = 0; i < count; i++) {
    const radius = 3 + Math.random() * 6;
    const left = bounds.left + Math.random() * bounds.width;
    const top = bounds.top + bounds.height + Math.random() * 30;
    const drip = new f.Circle({
      left,
      top,
      radius,
      fill: color,
      originX: "center",
      originY: "top",
      selectable: true,
      data: { sprayDrip: true },
    });
    canvas.add(drip);
  }
  canvas.requestRenderAll();
}

export function TextGraffitiSprayPanel({ fabricCanvas }: TextGraffitiSprayPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [primaryColor, setPrimaryColor] = useState("#ff0033");
  const [secondaryColor, setSecondaryColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(10);
  const [skew, setSkew] = useState(-5);
  const [addDrip, setAddDrip] = useState(true);
  const [addShadow, setAddShadow] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<SprayStyleId>("vermelho");

  useEffect(() => {
    queueMicrotask(() => {
      canvasRef.current = fabricCanvas;
    });
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getSelectedTexts(canvas: any) {
    const active = canvas.getActiveObjects ? canvas.getActiveObjects() : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (active as any[]).filter((o) => TEXT_TYPES.includes(o.type));
  }

  function handleApplySpray() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está pronto");
      return;
    }
    const texts = getSelectedTexts(canvas);
    if (texts.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;

      texts.forEach((t) => {
        switch (selectedStyle) {
          case "vermelho":
            t.set({
              fill: primaryColor || "#ff0033",
              stroke: "#000000",
              strokeWidth: strokeWidth,
              skewX: skew,
            });
            break;
          case "azul":
            t.set({
              fill: buildBlueGradient(f),
              stroke: secondaryColor || "#ffffff",
              strokeWidth: strokeWidth,
              skewX: skew,
            });
            break;
          case "sombrio":
            t.set({
              fill: "#000000",
              stroke: primaryColor || "#ff00ff",
              strokeWidth: strokeWidth,
              skewX: skew,
              shadow: new f.Shadow({
                color: primaryColor || "#ff00ff",
                blur: 20,
                offsetX: 0,
                offsetY: 0,
              }),
            });
            break;
          case "pichado":
            t.set({
              fill: primaryColor,
              stroke: secondaryColor,
              strokeWidth: Math.max(2, strokeWidth - 4),
              skewX: skew * 1.5,
              fontStyle: "italic",
              angle: (Math.random() - 0.5) * 6,
            });
            addDrips(canvas, f, t, 4, primaryColor);
            break;
          case "bolha":
            t.set({
              fill: primaryColor,
              stroke: secondaryColor,
              strokeWidth: strokeWidth + 4,
              strokeLineJoin: "round",
              strokeLineCap: "round",
              skewX: skew / 2,
            });
            break;
          case "rua":
            t.set({
              fill: buildRainbowGradient(f),
              stroke: "#000000",
              strokeWidth: strokeWidth,
              skewX: skew,
            });
            break;
        }

        if (addShadow && selectedStyle !== "sombrio") {
          t.set({
            shadow: new f.Shadow({
              color: "rgba(0,0,0,0.6)",
              blur: 8,
              offsetX: 4,
              offsetY: 4,
            }),
          });
        }

        if (addDrip && selectedStyle !== "pichado") {
          addDrips(canvas, f, t, 3, primaryColor);
        }

        t.setCoords();
      });

      canvas.requestRenderAll();
      toast.success(`Spray aplicado em ${texts.length} texto(s)`);
    });
  }

  function handleAddDrips() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está pronto");
      return;
    }
    const texts = getSelectedTexts(canvas);
    if (texts.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      texts.forEach((t) => {
        const count = 3 + Math.floor(Math.random() * 4);
        addDrips(canvas, f, t, count, primaryColor);
      });
      toast.success("Drips adicionados");
    });
  }

  function handleRemoveEffects() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não está pronto");
      return;
    }
    const texts = getSelectedTexts(canvas);
    if (texts.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }

    texts.forEach((t) => {
      t.set({
        stroke: null,
        strokeWidth: 0,
        skewX: 0,
        shadow: null,
        fontStyle: "normal",
        angle: 0,
      });
      t.setCoords();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all = canvas.getObjects() as any[];
    const drips = all.filter((o) => o?.data?.sprayDrip === true);
    drips.forEach((d) => canvas.remove(d));

    canvas.requestRenderAll();
    toast.success("Efeitos removidos");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <SprayCan className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Texto Grafite / Spray</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SPRAY_STYLES.map((s) => (
          <Button
            key={s.id}
            variant={selectedStyle === s.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStyle(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Cor Primária</label>
        <Input
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          className="h-10 w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Cor Secundária</label>
        <Input
          type="color"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
          className="h-10 w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">
          Espessura do Contorno: {strokeWidth}px
        </label>
        <input
          type="range"
          min={3}
          max={25}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium">Inclinação: {skew}°</label>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={skew}
          onChange={(e) => setSkew(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={addDrip}
          onChange={(e) => setAddDrip(e.target.checked)}
        />
        <span>Adicionar drips</span>
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={addShadow}
          onChange={(e) => setAddShadow(e.target.checked)}
        />
        <span>Adicionar sombra</span>
      </label>

      <div className="flex flex-col gap-2">
        <Button onClick={handleApplySpray} className="w-full">
          Aplicar Spray
        </Button>
        <Button onClick={handleAddDrips} variant="outline" className="w-full">
          Adicionar Drips
        </Button>
        <Button onClick={handleRemoveEffects} variant="outline" className="w-full">
          Remover Efeitos
        </Button>
      </div>
    </div>
  );
}
