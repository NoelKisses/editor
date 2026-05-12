"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ColorPalettePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion?: number;
}

interface Palette {
  name: string;
  colors: string[];
  mood: string;
}

// Built-in harmony generators (no AI needed)
function generateComplementary(base: string): string[] {
  const h = hexToHsl(base);
  return [
    hslToHex(h[0], h[1], h[2]),
    hslToHex((h[0] + 180) % 360, h[1], h[2]),
    hslToHex(h[0], h[1] * 0.6, Math.min(h[2] + 20, 95)),
    hslToHex((h[0] + 180) % 360, h[1] * 0.6, Math.min(h[2] + 20, 95)),
    hslToHex(h[0], h[1] * 0.3, Math.min(h[2] + 40, 98)),
  ];
}

function generateTriadic(base: string): string[] {
  const h = hexToHsl(base);
  return [
    hslToHex(h[0], h[1], h[2]),
    hslToHex((h[0] + 120) % 360, h[1], h[2]),
    hslToHex((h[0] + 240) % 360, h[1], h[2]),
    hslToHex(h[0], h[1] * 0.5, Math.min(h[2] + 30, 95)),
    hslToHex((h[0] + 120) % 360, h[1] * 0.5, Math.min(h[2] + 30, 95)),
  ];
}

function generateAnalogous(base: string): string[] {
  const h = hexToHsl(base);
  return [
    hslToHex((h[0] - 30 + 360) % 360, h[1], h[2]),
    hslToHex((h[0] - 15 + 360) % 360, h[1], h[2]),
    hslToHex(h[0], h[1], h[2]),
    hslToHex((h[0] + 15) % 360, h[1], h[2]),
    hslToHex((h[0] + 30) % 360, h[1], h[2]),
  ];
}

function generateMonochromatic(base: string): string[] {
  const h = hexToHsl(base);
  return [
    hslToHex(h[0], h[1], Math.max(h[2] - 30, 5)),
    hslToHex(h[0], h[1], Math.max(h[2] - 15, 5)),
    hslToHex(h[0], h[1], h[2]),
    hslToHex(h[0], h[1] * 0.6, Math.min(h[2] + 15, 95)),
    hslToHex(h[0], h[1] * 0.3, Math.min(h[2] + 30, 98)),
  ];
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function extractCanvasColors(fabricCanvas: unknown): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvas = fabricCanvas as any;
  if (!canvas) return [];
  const colors = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas.getObjects().forEach((obj: any) => {
    if (obj.fill && typeof obj.fill === "string" && obj.fill.startsWith("#")) {
      colors.add(obj.fill.slice(0, 7).toLowerCase());
    }
    if (obj.stroke && typeof obj.stroke === "string" && obj.stroke.startsWith("#")) {
      colors.add(obj.stroke.slice(0, 7).toLowerCase());
    }
  });

  if (canvas.backgroundColor && typeof canvas.backgroundColor === "string" && canvas.backgroundColor.startsWith("#")) {
    colors.add(canvas.backgroundColor.slice(0, 7).toLowerCase());
  }

  return [...colors].filter((c) => /^#[0-9a-f]{6}$/.test(c)).slice(0, 6);
}

const STATIC_PALETTES: Palette[] = [
  { name: "YouTube Clássico", colors: ["#FF0000", "#282828", "#FFFFFF", "#606060", "#AAAAAA"], mood: "Impacto" },
  { name: "Noite Neon", colors: ["#0D0D0D", "#FF2079", "#00F5FF", "#7B00FF", "#F5F5F5"], mood: "Energia" },
  { name: "Natureza Viva", colors: ["#2D6A4F", "#52B788", "#B7E4C7", "#F1FAEE", "#D62828"], mood: "Fresco" },
  { name: "Pôr do Sol", colors: ["#03045E", "#0077B6", "#F77F00", "#FCBF49", "#EAE2B7"], mood: "Vibrante" },
  { name: "Minimal Dark", colors: ["#121212", "#1E1E1E", "#3D3D3D", "#BDBDBD", "#F5F5F5"], mood: "Elegante" },
  { name: "Roxo Galáctico", colors: ["#10002B", "#240046", "#7B2FBE", "#E0AAFF", "#FFFFFF"], mood: "Misterioso" },
  { name: "Terra", colors: ["#582F0E", "#7F4F24", "#936639", "#A68A64", "#E9EDC9"], mood: "Orgânico" },
  { name: "Ocean Breeze", colors: ["#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8"], mood: "Calmo" },
];

export function ColorPalettePanel({ fabricCanvas }: ColorPalettePanelProps) {
  const [generatedPalettes, setGeneratedPalettes] = useState<Palette[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"static" | "generated" | "harmony">("static");
  const [baseColor, setBaseColor] = useState("#6366f1");
  const [harmonyPalettes, setHarmonyPalettes] = useState<Palette[]>([]);

  const applyColorToSelected = useCallback((color: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = fabricCanvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um elemento primeiro");
      return;
    }
    active.set({ fill: color });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const applyPaletteToCanvas = useCallback((palette: Palette) => {
    if (!fabricCanvas) { toast.error("Canvas não disponível"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = fabricCanvas.getObjects();
    if (!objects.length) { toast.error("Nenhum elemento no canvas"); return; }

    objects.forEach((obj, i) => {
      const color = palette.colors[i % palette.colors.length];
      if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
        obj.set({ fill: color });
      } else {
        obj.set({ fill: color });
      }
    });
    fabricCanvas.setBackgroundColor(palette.colors[palette.colors.length - 1], () => {
      fabricCanvas.requestRenderAll();
    });
    toast.success(`Paleta "${palette.name}" aplicada`);
  }, [fabricCanvas]);

  const copyColor = useCallback((color: string) => {
    navigator.clipboard.writeText(color).then(() => {
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 1500);
    });
  }, []);

  const generateFromCanvas = useCallback(async () => {
    if (!fabricCanvas) { toast.error("Canvas não disponível"); return; }
    const colors = extractCanvasColors(fabricCanvas);
    if (!colors.length) { toast.error("Nenhuma cor encontrada no canvas. Adicione elementos primeiro."); return; }

    setIsGenerating(true);
    try {
      const base = colors[0];
      const palettes: Palette[] = [
        { name: "Complementar", colors: generateComplementary(base), mood: "Contraste forte" },
        { name: "Triádica", colors: generateTriadic(base), mood: "Equilíbrio vibrante" },
        { name: "Análoga", colors: generateAnalogous(base), mood: "Harmonia suave" },
        { name: "Monocromática", colors: generateMonochromatic(base), mood: "Coesão" },
      ];

      // If there are multiple colors in canvas, create a "canvas palette" too
      if (colors.length >= 3) {
        palettes.unshift({ name: "Cores do Canvas", colors: colors.slice(0, 5), mood: "Baseada no seu design" });
      }

      setGeneratedPalettes(palettes);
      setActiveTab("generated");
      toast.success(`${palettes.length} paletas geradas a partir das suas cores`);
    } finally {
      setIsGenerating(false);
    }
  }, [fabricCanvas]);

  const generateHarmonies = useCallback(() => {
    const palettes: Palette[] = [
      { name: "Complementar", colors: generateComplementary(baseColor), mood: "Contraste forte" },
      { name: "Triádica", colors: generateTriadic(baseColor), mood: "Equilíbrio dinâmico" },
      { name: "Análoga", colors: generateAnalogous(baseColor), mood: "Harmonia natural" },
      { name: "Monocromática", colors: generateMonochromatic(baseColor), mood: "Profundidade sutil" },
    ];
    setHarmonyPalettes(palettes);
    setActiveTab("harmony");
  }, [baseColor]);

  const palettesToShow =
    activeTab === "static" ? STATIC_PALETTES :
    activeTab === "generated" ? generatedPalettes :
    harmonyPalettes;

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="text-sm font-semibold text-foreground">Paletas de Cores</h3>

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-7 gap-1 border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
          onClick={generateFromCanvas}
          disabled={isGenerating}
          title="Gera harmonias baseadas nas cores do seu canvas"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Do Canvas
        </Button>
        <div className="flex items-center gap-1 flex-1">
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border border-white/10 bg-transparent"
            title="Cor base para harmonias"
          />
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-7 gap-1"
            onClick={generateHarmonies}
            title="Gera harmonias a partir de uma cor base"
          >
            <RefreshCw className="w-3 h-3" />
            Harmonias
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-black/20 rounded p-0.5">
        {(["static", "generated", "harmony"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-[10px] py-1 rounded transition-colors ${
              activeTab === tab ? "bg-primary/20 text-primary" : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab === "static" ? "Prontas" : tab === "generated" ? "Canvas" : "Harmonia"}
          </button>
        ))}
      </div>

      {/* Palette list */}
      {palettesToShow.length === 0 ? (
        <p className="text-[11px] text-zinc-500 text-center py-4">
          {activeTab === "generated"
            ? "Clique em \"Do Canvas\" para gerar paletas a partir das suas cores"
            : "Clique em \"Harmonias\" e escolha uma cor base"}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {palettesToShow.map((palette) => (
            <div key={palette.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-300 font-medium">{palette.name}</span>
                <span className="text-[9px] text-zinc-500">{palette.mood}</span>
              </div>
              <div className="flex gap-0.5 rounded overflow-hidden group/palette">
                {palette.colors.map((color) => (
                  <div
                    key={color}
                    className="flex-1 h-8 relative group/color cursor-pointer transition-transform hover:scale-y-110 hover:z-10"
                    style={{ backgroundColor: color }}
                    title={color}
                    onClick={() => applyColorToSelected(color)}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover/color:opacity-100 flex items-center justify-center bg-black/30 transition-opacity">
                      <button
                        className="p-0.5 hover:bg-white/20 rounded"
                        onClick={(e) => { e.stopPropagation(); copyColor(color); }}
                      >
                        {copiedColor === color ? (
                          <Check className="w-2.5 h-2.5 text-white" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="ml-1 text-[9px] text-zinc-400 hover:text-white px-1 opacity-0 group-hover/palette:opacity-100 transition-opacity whitespace-nowrap"
                  onClick={() => applyPaletteToCanvas(palette)}
                  title="Aplicar paleta inteira ao canvas"
                >
                  Aplicar
                </button>
              </div>
              <div className="flex gap-0.5">
                {palette.colors.map((color) => (
                  <span
                    key={color}
                    className="flex-1 text-center text-[8px] text-zinc-600 font-mono hover:text-zinc-400 cursor-pointer transition-colors"
                    onClick={() => copyColor(color)}
                  >
                    {color.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[9px] text-zinc-600 text-center mt-1">
        Clique numa cor para aplicar ao elemento selecionado
      </p>
    </div>
  );
}
