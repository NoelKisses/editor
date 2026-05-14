"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";

interface CanvasTextMaskPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface MaskPreset {
  name: string;
  label: string;
  stops: string[];
}

const MASK_PRESETS: MaskPreset[] = [
  { name: "gradiente", label: "Gradiente", stops: ["#667eea", "#764ba2"] },
  { name: "arco-iris", label: "Arco-Íris", stops: ["#ff0000", "#ff7700", "#ffff00", "#00ff00", "#0000ff", "#8b00ff"] },
  { name: "metalico", label: "Metálico", stops: ["#bdc3c7", "#2c3e50", "#bdc3c7"] },
  { name: "fogo", label: "Fogo", stops: ["#f7971e", "#ffd200", "#ff4e50"] },
  { name: "oceano", label: "Oceano", stops: ["#2193b0", "#6dd5ed", "#2193b0"] },
  { name: "aurora", label: "Aurora", stops: ["#0f2027", "#203a43", "#2c5364", "#67b26f", "#4ca2cd"] },
];

const FONT_FAMILIES = [
  "Arial",
  "Impact",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFabricGradient(fabric: any, stops: string[], width: number) {
  const colorStops = stops.map((color, i) => ({
    offset: stops.length === 1 ? 0 : i / (stops.length - 1),
    color,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (fabric as any).Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: width, y2: 0 },
    colorStops,
    gradientUnits: "pixels",
  });
}

function buildCssGradient(stops: string[]): string {
  if (stops.length === 1) return stops[0];
  const step = 100 / (stops.length - 1);
  const parts = stops.map((c, i) => `${c} ${Math.round(i * step)}%`).join(", ");
  return `linear-gradient(90deg, ${parts})`;
}

export function CanvasTextMaskPanel({ fabricCanvas }: CanvasTextMaskPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState("DESIGN");
  const [fontSize, setFontSize] = useState(80);
  const [selectedMask, setSelectedMask] = useState<string>("gradiente");
  const [fontFamily, setFontFamily] = useState("Impact");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const getPreset = (): MaskPreset => {
    return MASK_PRESETS.find((p) => p.name === selectedMask) ?? MASK_PRESETS[0];
  };

  const handleInsert = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    if (!text.trim()) {
      toast.error("Digite um texto para inserir");
      return;
    }

    try {
      const m = await import("fabric");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabric = m.fabric as any;

      const preset = getPreset();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const itext = new (fabric as any).IText(text, {
        left: 100,
        top: 100,
        fontSize,
        fontFamily,
        fontWeight: "bold",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { textMask: true } as any,
      });

      // Need width after object creation; temporarily add to measure
      const tempWidth = (fontSize / 72) * 96 * text.length * 0.6;
      const estimatedWidth = Math.max(tempWidth, 50);

      const gradient = buildFabricGradient(fabric, preset.stops, estimatedWidth);
      itext.set({ fill: gradient });

      canvas.add(itext);
      canvas.setActiveObject(itext);
      canvas.requestRenderAll();

      toast.success("Texto com máscara inserido");
    } catch (err) {
      console.error("Error inserting text mask:", err);
      toast.error("Erro ao inserir texto com máscara");
    }
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    const objects = canvas.getObjects();
    // Find the last added text mask object
    for (let i = objects.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = objects[i] as any;
      if (obj?.data?.textMask === true) {
        canvas.remove(obj);
        canvas.requestRenderAll();
        toast.success("Texto com máscara removido");
        return;
      }
    }

    toast.error("Nenhum texto com máscara encontrado");
  };

  const preset = getPreset();
  const previewGradient = buildCssGradient(preset.stops);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto com Máscara</span>
      </div>

      {/* Preview */}
      <div
        className="w-full h-12 rounded border border-border flex items-center justify-center overflow-hidden"
        style={{ background: previewGradient }}
      >
        <span
          className="font-bold select-none"
          style={{
            fontFamily,
            fontSize: "24px",
            background: previewGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {text || "DESIGN"}
        </span>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Texto</span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="DESIGN"
          className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Font size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</span>
          <span className="text-[10px] text-muted-foreground">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Font family */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Fonte</span>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Mask type */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Máscara</span>
        <div className="grid grid-cols-3 gap-1">
          {MASK_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setSelectedMask(p.name)}
              className={`relative h-9 rounded border text-[8px] font-semibold text-white overflow-hidden transition-all ${
                selectedMask === p.name
                  ? "border-primary ring-1 ring-primary scale-[1.02]"
                  : "border-border/50 hover:scale-[1.02]"
              }`}
              style={{ background: buildCssGradient(p.stops) }}
              title={p.label}
            >
              <span className="relative z-10 drop-shadow">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={handleInsert}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <Type className="w-3 h-3" />
          Inserir
        </button>
        <button
          onClick={handleRemove}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-destructive/50 hover:text-destructive transition-colors"
        >
          Remover
        </button>
      </div>
    </div>
  );
}
