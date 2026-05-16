"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TextComicEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ComicPreset = {
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  angle: number;
};

const COMIC_PRESETS: ComicPreset[] = [
  { label: "POW!", fill: "#FFD400", stroke: "#D90429", strokeWidth: 4, fontWeight: "bold", fontStyle: "normal", angle: 5 },
  { label: "BOOM", fill: "#FF7A00", stroke: "#000000", strokeWidth: 3, fontWeight: "normal", fontStyle: "italic", angle: 0 },
  { label: "ZAP", fill: "#00E5FF", stroke: "#7B2CBF", strokeWidth: 4, fontWeight: "normal", fontStyle: "normal", angle: -8 },
  { label: "BANG", fill: "#E63946", stroke: "#FFD400", strokeWidth: 4, fontWeight: "bold", fontStyle: "normal", angle: 0 },
  { label: "WOW", fill: "#FF4FA3", stroke: "#FFFFFF", strokeWidth: 3, fontWeight: "normal", fontStyle: "normal", angle: 3 },
  { label: "SMASH", fill: "#2DC653", stroke: "#1B5E20", strokeWidth: 4, fontWeight: "bold", fontStyle: "normal", angle: 0 },
  { label: "CRASH", fill: "#B0B0B0", stroke: "#000000", strokeWidth: 6, fontWeight: "bold", fontStyle: "normal", angle: 0 },
  { label: "WHAM", fill: "#7B2CBF", stroke: "#FFD400", strokeWidth: 4, fontWeight: "normal", fontStyle: "italic", angle: 0 },
];

const FONT_FAMILIES = ["Impact", "Bangers", "Comic Sans MS", "Bebas Neue", "Anton"];
const TEXT_TYPES = ["text", "i-text", "textbox"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTextObject(obj: any): boolean {
  return !!obj && typeof obj.type === "string" && TEXT_TYPES.includes(obj.type);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedTextObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return active.filter((o: any) => isTextObject(o));
}

export function TextComicEffectPanel({ fabricCanvas }: TextComicEffectPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [fontFamily, setFontFamily] = useState<string>("Impact");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [angle, setAngle] = useState<number>(0);
  const [dropShadow, setDropShadow] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<ComicPreset | null>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const applyPreset = (preset: ComicPreset) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }
    queueMicrotask(() => {
      setActivePreset(preset);
      setStrokeWidth(preset.strokeWidth);
      setAngle(preset.angle);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((obj: any) => {
      obj.set({
        fill: preset.fill,
        stroke: preset.stroke,
        strokeWidth: preset.strokeWidth,
        fontWeight: preset.fontWeight,
        fontStyle: preset.fontStyle,
        angle: preset.angle,
      });
    });
    canvas.requestRenderAll?.();
    toast.success(`Preset ${preset.label} aplicado`);
  };

  const applyCurrentSettings = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targets.forEach((obj: any) => {
        const updates: Record<string, unknown> = {
          fontFamily,
          strokeWidth,
          angle,
        };
        if (activePreset) {
          updates.fill = activePreset.fill;
          updates.stroke = activePreset.stroke;
          updates.fontWeight = activePreset.fontWeight;
          updates.fontStyle = activePreset.fontStyle;
        }
        if (dropShadow && f?.Shadow) {
          updates.shadow = new f.Shadow({ color: "#000", blur: 4, offsetX: 3, offsetY: 3 });
        } else {
          updates.shadow = null;
        }
        obj.set(updates);
      });
      canvas.requestRenderAll?.();
      toast.success("Efeito aplicado");
    });
  };

  const resetEffect = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const targets = getSelectedTextObjects(canvas);
    if (targets.length === 0) {
      toast.error("Selecione um texto primeiro");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((obj: any) => {
      obj.set({
        stroke: null,
        strokeWidth: 0,
        shadow: null,
        fontStyle: "normal",
        fontWeight: "normal",
        angle: 0,
      });
    });
    canvas.requestRenderAll?.();
    queueMicrotask(() => {
      setAngle(0);
      setStrokeWidth(0);
      setDropShadow(false);
      setActivePreset(null);
    });
    toast.success("Efeito resetado");
  };

  const insertComicText = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const preset = COMIC_PRESETS[0];
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f?.IText) {
        toast.error("Fabric indisponível");
        return;
      }
      const width = canvas.getWidth?.() ?? 800;
      const height = canvas.getHeight?.() ?? 600;
      const text = new f.IText(preset.label, {
        left: width / 2,
        top: height / 2,
        originX: "center",
        originY: "center",
        fontFamily,
        fontSize: 72,
        fill: preset.fill,
        stroke: preset.stroke,
        strokeWidth: preset.strokeWidth,
        fontWeight: preset.fontWeight,
        fontStyle: preset.fontStyle,
        angle: preset.angle,
      });
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll?.();
      toast.success("Texto cômico inserido");
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h3 className="text-sm font-semibold">Efeito Cômico</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {COMIC_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium">Fonte</span>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Espessura do contorno</span>
          <span className="text-xs text-muted-foreground">{strokeWidth}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={12}
          step={1}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Ângulo</span>
          <span className="text-xs text-muted-foreground">{angle}°</span>
        </div>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={dropShadow}
          onChange={(e) => setDropShadow(e.target.checked)}
        />
        <span>Sombra projetada</span>
      </label>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={applyCurrentSettings}>
          Aplicar Efeito
        </Button>
        <Button type="button" variant="outline" onClick={resetEffect}>
          Resetar
        </Button>
        <Button type="button" variant="secondary" onClick={insertComicText}>
          Inserir Texto Cômico
        </Button>
      </div>
    </div>
  );
}
