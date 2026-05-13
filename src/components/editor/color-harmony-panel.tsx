"use client";

import { useCallback, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";

interface ColorHarmonyPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type HarmonyType = "complementary" | "analogous" | "triadic" | "tetradic" | "split" | "monochromatic";

const HARMONY_TYPES: { value: HarmonyType; label: string; desc: string }[] = [
  { value: "complementary", label: "Complementar", desc: "Cores opostas — alto contraste" },
  { value: "analogous", label: "Análogas", desc: "Cores adjacentes — harmônico" },
  { value: "triadic", label: "Triádica", desc: "3 cores equidistantes" },
  { value: "tetradic", label: "Tetrádica", desc: "4 cores em quadrado" },
  { value: "split", label: "Split-comp.", desc: "Dividido complementar" },
  { value: "monochromatic", label: "Monocromático", desc: "Tons da mesma cor" },
];

const CURATED_PALETTES = [
  { name: "YouTube", colors: ["#FF0000", "#282828", "#FFFFFF", "#606060", "#AAAAAA"] },
  { name: "Instagram", colors: ["#E1306C", "#F77737", "#FCAF45", "#833AB4", "#C13584"] },
  { name: "LinkedIn", colors: ["#0077B5", "#00A0DC", "#FFFFFF", "#313335", "#86888A"] },
  { name: "TikTok", colors: ["#FF0050", "#00F2EA", "#000000", "#FFFFFF", "#161823"] },
  { name: "Neon Dark", colors: ["#00FFFF", "#FF00FF", "#FFFF00", "#00FF00", "#0D0D0D"] },
  { name: "Sunset", colors: ["#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A936F"] },
  { name: "Ocean", colors: ["#05668D", "#028090", "#00B4D8", "#90E0EF", "#CAF0F8"] },
  { name: "Forest", colors: ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#95D5B2"] },
  { name: "Candy", colors: ["#FF6B9D", "#C44DFF", "#45E5FF", "#FFE566", "#FF8E53"] },
  { name: "Profissional", colors: ["#2D3748", "#4A5568", "#718096", "#E2E8F0", "#FFFFFF"] },
  { name: "Quente", colors: ["#D62828", "#F77F00", "#FCBF49", "#EAE2B7", "#003049"] },
  { name: "Pastel", colors: ["#FFB3C1", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF"] },
];

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

function generateHarmony(baseHex: string, type: HarmonyType): string[] {
  const [h, s, l] = hexToHsl(baseHex);
  switch (type) {
    case "complementary":
      return [baseHex, hslToHex((h + 180) % 360, s, l), hslToHex(h, s, Math.max(20, l - 30)), hslToHex((h + 180) % 360, s, Math.min(90, l + 20)), hslToHex(h, Math.max(10, s - 20), Math.min(90, l + 30))];
    case "analogous":
      return [hslToHex((h - 30 + 360) % 360, s, l), hslToHex((h - 15 + 360) % 360, s, l), baseHex, hslToHex((h + 15) % 360, s, l), hslToHex((h + 30) % 360, s, l)];
    case "triadic":
      return [baseHex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l), hslToHex(h, s, Math.min(90, l + 25)), hslToHex((h + 120) % 360, s, Math.min(90, l + 25))];
    case "tetradic":
      return [baseHex, hslToHex((h + 90) % 360, s, l), hslToHex((h + 180) % 360, s, l), hslToHex((h + 270) % 360, s, l), hslToHex(h, s, Math.min(90, l + 30))];
    case "split":
      return [baseHex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l), hslToHex(h, s, Math.min(90, l + 25)), hslToHex((h + 150) % 360, s, Math.min(90, l + 20))];
    case "monochromatic":
      return [hslToHex(h, s, Math.max(10, l - 40)), hslToHex(h, s, Math.max(10, l - 20)), baseHex, hslToHex(h, s, Math.min(90, l + 20)), hslToHex(h, s, Math.min(90, l + 40))];
    default:
      return [baseHex];
  }
}

export function ColorHarmonyPanel({ fabricCanvas }: ColorHarmonyPanelProps) {
  const [baseColor, setBaseColor] = useState("#6366f1");
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const [activePalette, setActivePalette] = useState<string[]>([]);

  const harmonyColors = generateHarmony(baseColor, harmonyType);

  const applyColorToSelected = useCallback((color: string) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto primeiro"); return; }
    obj.set({ fill: color });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const applyPaletteToCanvas = useCallback((colors: string[]) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = fabricCanvas.getObjects();
    if (!objects.length) { toast.error("Canvas vazio"); return; }
    objects.forEach((obj, i) => {
      const color = colors[i % colors.length];
      if (obj.type !== "image") obj.set({ fill: color });
    });
    fabricCanvas.requestRenderAll();
    toast.success("Paleta aplicada ao canvas");
  }, [fabricCanvas]);

  const copyColor = useCallback((color: string) => {
    navigator.clipboard.writeText(color).then(() => toast.success(`${color} copiado`)).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Harmonia de Cores</span>
      </div>

      {/* Base color + harmony type */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor base</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={baseColor}
                onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBaseColor(e.target.value); }}
                className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Harmony type */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo</span>
          <div className="grid grid-cols-2 gap-1">
            {HARMONY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setHarmonyType(t.value)}
                className={`text-left px-2 py-1.5 rounded border transition-colors ${harmonyType === t.value ? "bg-primary/10 border-primary" : "border-border hover:border-primary/30"}`}
              >
                <div className={`text-[10px] font-medium ${harmonyType === t.value ? "text-primary" : "text-foreground"}`}>{t.label}</div>
                <div className="text-[8px] text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated palette */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Paleta Gerada</span>
          <button
            onClick={() => applyPaletteToCanvas(harmonyColors)}
            className="text-[9px] text-primary hover:text-primary/70 transition-colors"
          >
            Aplicar ao canvas
          </button>
        </div>
        <div className="flex gap-1">
          {harmonyColors.map((color, i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5">
              <button
                onClick={() => applyColorToSelected(color)}
                onContextMenu={(e) => { e.preventDefault(); copyColor(color); }}
                className="w-full h-10 rounded border border-border/50 hover:scale-105 transition-transform"
                style={{ background: color }}
                title={`${color} — clique para aplicar, ctrl+clique para copiar`}
              />
              <span className="text-[7px] text-muted-foreground text-center truncate">{color}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] text-muted-foreground/60">Clique para aplicar ao objeto selecionado · Clique direito para copiar hex</p>
      </div>

      {/* Curated palettes */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Paletas Curadas</span>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {CURATED_PALETTES.map((p) => (
            <div
              key={p.name}
              className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-all hover:border-primary/40 ${activePalette === p.colors ? "border-primary bg-primary/5" : "border-border"}`}
              onClick={() => setActivePalette(p.colors)}
            >
              <div className="flex gap-0.5">
                {p.colors.map((c, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); applyColorToSelected(c); }}
                    className="w-5 h-5 rounded-sm border border-border/30 hover:scale-110 transition-transform"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-medium">{p.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); applyPaletteToCanvas(p.colors); }}
                className="text-[8px] text-muted-foreground hover:text-primary transition-colors px-1"
              >
                Aplicar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
