"use client";

import { useCallback, useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasColorThemePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface ColorTheme {
  name: string;
  colors: string[];
  bg: string;
}

const THEMES: ColorTheme[] = [
  { name: "Noite Profunda", colors: ["#e2e8f0", "#94a3b8", "#3b82f6"], bg: "#0f172a" },
  { name: "Aurora", colors: ["#fdf4ff", "#e879f9", "#8b5cf6"], bg: "#1e1b4b" },
  { name: "Pôr do Sol", colors: ["#fff7ed", "#fb923c", "#dc2626"], bg: "#1c1917" },
  { name: "Floresta", colors: ["#f0fdf4", "#86efac", "#15803d"], bg: "#14532d" },
  { name: "Oceano", colors: ["#f0f9ff", "#7dd3fc", "#0369a1"], bg: "#082f49" },
  { name: "Baunilha", colors: ["#1c1917", "#78716c", "#d97706"], bg: "#fef3c7" },
  { name: "Rosa Suave", colors: ["#fff1f2", "#fda4af", "#be123c"], bg: "#4c0519" },
  { name: "Cinza Pro", colors: ["#f9fafb", "#9ca3af", "#374151"], bg: "#111827" },
];

export function CanvasColorThemePanel({ fabricCanvas }: CanvasColorThemePanelProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState(["#ffffff", "#888888", "#000000"]);
  const [customBg, setCustomBg] = useState("#ffffff");

  const applyTheme = useCallback((theme: ColorTheme) => {
    if (!fabricCanvas) return;
    setSelectedTheme(theme.name);

    // Apply background
    fabricCanvas.set({ backgroundColor: theme.bg });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects();
    objs.forEach(obj => {
      const fill = obj.fill;
      if (!fill || fill === "transparent") return;

      // Map original color lightness to theme color
      let mapped = theme.colors[1]; // default mid
      if (typeof fill === "string") {
        const r = parseInt(fill.slice(1, 3), 16) || 0;
        const g = parseInt(fill.slice(3, 5), 16) || 0;
        const b = parseInt(fill.slice(5, 7), 16) || 0;
        const lum = (r * 299 + g * 587 + b * 114) / 1000;
        if (lum > 200) mapped = theme.colors[0];
        else if (lum < 80) mapped = theme.colors[2];
        else mapped = theme.colors[1];
      }
      obj.set({ fill: mapped });

      if (obj.stroke && obj.stroke !== "transparent") {
        obj.set({ stroke: theme.colors[2] });
      }
    });

    fabricCanvas.requestRenderAll();
    toast.success(`Tema "${theme.name}" aplicado`);
  }, [fabricCanvas]);

  const applyCustomTheme = useCallback(() => {
    if (!fabricCanvas) return;
    applyTheme({ name: "Personalizado", colors: customColors, bg: customBg });
  }, [fabricCanvas, applyTheme, customColors, customBg]);

  const resetColors = useCallback(() => {
    if (!fabricCanvas) return;
    // Reset background to white
    fabricCanvas.set({ backgroundColor: "#ffffff" });
    fabricCanvas.requestRenderAll();
    setSelectedTheme(null);
    toast.success("Canvas resetado (cores de fundo removidas)");
  }, [fabricCanvas]);

  const applyBgOnly = useCallback((bg: string) => {
    if (!fabricCanvas) return;
    fabricCanvas.set({ backgroundColor: bg });
    fabricCanvas.requestRenderAll();
    toast.success("Cor de fundo aplicada");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Temas de Cor</span>
        </div>
        <button onClick={resetColors}
          className="text-muted-foreground hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Preset themes */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Temas Prontos</span>
        <div className="flex flex-col gap-1">
          {THEMES.map(t => (
            <button key={t.name} onClick={() => applyTheme(t)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${selectedTheme === t.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
              {/* Color swatches */}
              <div className="flex gap-0.5 flex-shrink-0">
                <div className="w-4 h-5 rounded-sm" style={{ backgroundColor: t.bg }} />
                {t.colors.map((c, i) => (
                  <div key={i} className="w-4 h-5 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className={`text-[9px] truncate ${selectedTheme === t.name ? "text-primary font-medium" : ""}`}>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom theme */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Personalizado</span>

        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground w-10">Fundo</span>
          <input type="color" value={customBg} onChange={e => setCustomBg(e.target.value)}
            className="w-7 h-6 rounded border border-border cursor-pointer" />
          <button onClick={() => applyBgOnly(customBg)}
            className="text-[7px] text-primary hover:underline">Aplicar fundo</button>
        </div>

        {customColors.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-10">
              {i === 0 ? "Claro" : i === 1 ? "Médio" : "Escuro"}
            </span>
            <input type="color" value={c} onChange={e => setCustomColors(prev => prev.map((x, j) => j === i ? e.target.value : x))}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{c}</span>
          </div>
        ))}

        <button onClick={applyCustomTheme}
          className="flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
          <Palette className="w-3 h-3" /> Aplicar Personalizado
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Mapeia luminosidade dos objetos para a paleta escolhida
      </p>
    </div>
  );
}
