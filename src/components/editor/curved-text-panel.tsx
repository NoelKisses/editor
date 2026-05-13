"use client";

import { useCallback, useState } from "react";
import { Spline, Plus } from "lucide-react";
import { toast } from "sonner";

interface CurvedTextPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const PRESETS = [
  { label: "Arco cima", diameter: 300, flipped: false },
  { label: "Arco baixo", diameter: 300, flipped: true },
  { label: "Círculo", diameter: 200, flipped: false },
  { label: "Grande", diameter: 500, flipped: false },
];

export function CurvedTextPanel({ fabricCanvas }: CurvedTextPanelProps) {
  const [text, setText] = useState("Texto em curva");
  const [diameter, setDiameter] = useState(300);
  const [flipped, setFlipped] = useState(false);
  const [fontSize, setFontSize] = useState(36);
  const [color, setColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);

  const addCurvedText = useCallback(async () => {
    if (!fabricCanvas || !text.trim()) {
      toast.error("Digite o texto");
      return;
    }
    setLoading(true);
    try {
      const fabric = await import("fabric").then((m) => m.fabric);
      const radius = diameter / 2;
      const chars = text.trim().split("");
      const charAngle = 360 / Math.max(chars.length * 1.5, 12);

      // Draw to offscreen canvas using arc technique
      const offscreen = document.createElement("canvas");
      const size = diameter + fontSize * 4;
      offscreen.width = size;
      offscreen.height = size;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;

      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cx = size / 2;
      const cy = size / 2;
      const r = radius + fontSize;

      const totalAngle = (chars.length - 1) * charAngle;
      const startAngle = flipped
        ? (Math.PI / 2) + (totalAngle * Math.PI) / 360
        : -(Math.PI / 2) - (totalAngle * Math.PI) / 360;

      for (let i = 0; i < chars.length; i++) {
        const angle = flipped
          ? startAngle - i * (charAngle * Math.PI) / 180
          : startAngle + i * (charAngle * Math.PI) / 180;

        ctx.save();
        ctx.translate(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.rotate(angle + (flipped ? -Math.PI / 2 : Math.PI / 2));
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
      }

      const dataURL = offscreen.toDataURL("image/png");
      fabric.Image.fromURL(dataURL, (img) => {
        if (!img) { toast.error("Erro ao criar texto curvo"); return; }
        img.set({ left: 60, top: 60, selectable: true });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        toast.success("Texto em curva adicionado");
      });
    } catch {
      toast.error("Erro ao gerar texto em curva");
    } finally {
      setLoading(false);
    }
  }, [fabricCanvas, text, diameter, flipped, fontSize, color]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Spline className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto em Curva</span>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => { setDiameter(p.diameter); setFlipped(p.flipped); }}
            className={`text-[10px] py-1.5 px-2 rounded border transition-colors text-left ${
              diameter === p.diameter && flipped === p.flipped
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Texto</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Texto em curva..."
          className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
        />
      </div>

      {/* Font size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</label>
          <span className="text-[10px] text-foreground tabular-nums">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={120}
          step={2}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Diameter */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Diâmetro</label>
          <span className="text-[10px] text-foreground tabular-nums">{diameter}px</span>
        </div>
        <input
          type="range"
          min={100}
          max={800}
          step={20}
          value={diameter}
          onChange={(e) => setDiameter(parseInt(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor</label>
        <div className="relative w-8 h-8 flex-shrink-0">
          <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: color }} />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
      </div>

      {/* Flip toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFlipped((v) => !v)}
          className={`flex-1 text-[11px] py-1.5 rounded border transition-colors ${
            !flipped
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          Arco Superior
        </button>
        <button
          onClick={() => setFlipped((v) => !v)}
          className={`flex-1 text-[11px] py-1.5 rounded border transition-colors ${
            flipped
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          Arco Inferior
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={addCurvedText}
        disabled={loading || !text.trim()}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {loading ? "Gerando..." : "Adicionar ao Canvas"}
      </button>
    </div>
  );
}
