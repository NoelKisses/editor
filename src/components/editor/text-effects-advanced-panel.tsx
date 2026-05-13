"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TextEffectsAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type EffectType = "none" | "neon" | "3d" | "outline-double" | "retro" | "glitch" | "metallic" | "fire" | "ice" | "rainbow";

const EFFECTS: { value: EffectType; label: string; description: string; icon: string }[] = [
  { value: "none", label: "Nenhum", description: "Sem efeito", icon: "○" },
  { value: "neon", label: "Neon", description: "Brilho colorido ao redor", icon: "✦" },
  { value: "3d", label: "3D", description: "Sombra tridimensional", icon: "◈" },
  { value: "outline-double", label: "Duplo Contorno", description: "Dois contornos empilhados", icon: "⊙" },
  { value: "retro", label: "Retro", description: "Estilo anos 80", icon: "◆" },
  { value: "glitch", label: "Glitch", description: "Efeito digital distorcido", icon: "⊞" },
  { value: "metallic", label: "Metálico", description: "Aparência de metal", icon: "◇" },
  { value: "fire", label: "Fogo", description: "Tons quentes flamejantes", icon: "🔥" },
  { value: "ice", label: "Gelo", description: "Tons frios cristalinos", icon: "❄" },
  { value: "rainbow", label: "Arco-íris", description: "Gradiente multicolorido", icon: "◉" },
];

const PRESET_COLORS = {
  neon: ["#ff00ff", "#00ffff", "#00ff00", "#ff6600", "#ffff00", "#ff0066"],
  "3d": ["#ff4444", "#4444ff", "#44ff44", "#ff8800", "#8844ff", "#ffffff"],
  retro: ["#ff6b9d", "#c44dff", "#45e5ff", "#ff8c00", "#00ff88", "#fff700"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyNeonEffect(obj: any, color: string, blur: number, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.set({ fill: "#ffffff", shadow: new (fabric as any).Shadow({ color, blur, offsetX: 0, offsetY: 0 }) });
  obj.set({ stroke: color, strokeWidth: 2 });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apply3DEffect(obj: any, color: string, depth: number, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  const origLeft = obj.left ?? 0;
  const origTop = obj.top ?? 0;
  const shadows = [];
  for (let i = 1; i <= depth; i++) {
    shadows.push(`${i}px ${i}px 0 ${color}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.set({ shadow: new (fabric as any).Shadow({ color, blur: 0, offsetX: depth, offsetY: depth }) });
  obj.set({ left: origLeft, top: origTop });
  void shadows;
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyDoubleOutline(obj: any, color1: string, color2: string, w1: number, w2: number, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  obj.set({
    stroke: color1,
    strokeWidth: w1 + w2,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: new (fabric as any).Shadow({ color: color2, blur: 0, offsetX: 0, offsetY: 0 }),
    paintFirst: "stroke",
  });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyMetallicEffect(obj: any, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  const h = obj.getScaledHeight?.() ?? 60;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gradient = new (fabric as any).Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: 0, y2: h },
    colorStops: [
      { offset: 0, color: "#ffffff" },
      { offset: 0.3, color: "#c0c0c0" },
      { offset: 0.5, color: "#808080" },
      { offset: 0.7, color: "#c0c0c0" },
      { offset: 1, color: "#404040" },
    ],
  });
  obj.set({ fill: gradient, stroke: "#606060", strokeWidth: 1 });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyRetroEffect(obj: any, color: string, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  obj.set({
    fill: "#fff700",
    stroke: color,
    strokeWidth: 4,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: new (fabric as any).Shadow({ color: "#000000", blur: 0, offsetX: 4, offsetY: 4 }),
  });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyGlitchEffect(obj: any, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  obj.set({
    fill: "#ffffff",
    stroke: "#ff0044",
    strokeWidth: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: new (fabric as any).Shadow({ color: "#00ffff", blur: 0, offsetX: -4, offsetY: 2 }),
  });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyFireEffect(obj: any, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  const w = obj.getScaledWidth?.() ?? 200;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gradient = new (fabric as any).Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: w, y2: 0 },
    colorStops: [
      { offset: 0, color: "#ff0000" },
      { offset: 0.4, color: "#ff6600" },
      { offset: 0.7, color: "#ffaa00" },
      { offset: 1, color: "#ffff00" },
    ],
  });
  obj.set({
    fill: gradient,
    stroke: "#ff3300",
    strokeWidth: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: new (fabric as any).Shadow({ color: "#ff4400", blur: 15, offsetX: 0, offsetY: 0 }),
  });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyIceEffect(obj: any, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  const w = obj.getScaledWidth?.() ?? 200;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gradient = new (fabric as any).Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: w, y2: 0 },
    colorStops: [
      { offset: 0, color: "#a8edea" },
      { offset: 0.5, color: "#ffffff" },
      { offset: 1, color: "#70c8f7" },
    ],
  });
  obj.set({
    fill: gradient,
    stroke: "#87ceeb",
    strokeWidth: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadow: new (fabric as any).Shadow({ color: "#00bfff", blur: 12, offsetX: 0, offsetY: 0 }),
  });
  canvas.requestRenderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyRainbowEffect(obj: any, canvas: any) {
  const { fabric } = await import("fabric").then((m) => m);
  const w = obj.getScaledWidth?.() ?? 200;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gradient = new (fabric as any).Gradient({
    type: "linear",
    coords: { x1: 0, y1: 0, x2: w, y2: 0 },
    colorStops: [
      { offset: 0, color: "#ff0000" },
      { offset: 0.17, color: "#ff8800" },
      { offset: 0.33, color: "#ffff00" },
      { offset: 0.5, color: "#00ff00" },
      { offset: 0.67, color: "#0088ff" },
      { offset: 0.83, color: "#4400ff" },
      { offset: 1, color: "#ff00ff" },
    ],
  });
  obj.set({ fill: gradient, stroke: "transparent", strokeWidth: 0 });
  canvas.requestRenderAll();
}

export function TextEffectsAdvancedPanel({ fabricCanvas, selectionVersion }: TextEffectsAdvancedPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [currentEffect, setCurrentEffect] = useState<EffectType>("none");
  const [effectColor, setEffectColor] = useState("#ff00ff");
  const [effectIntensity, setEffectIntensity] = useState(15);
  const [outline1Color, setOutline1Color] = useState("#000000");
  const [outline2Color, setOutline2Color] = useState("#ffffff");
  const [outline1Width, setOutline1Width] = useState(4);
  const [outline2Width, setOutline2Width] = useState(2);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = obj && (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");
      setActive(isText ? obj : null);
      if (isText && obj.data?.advancedEffect) {
        setCurrentEffect(obj.data.advancedEffect);
      } else {
        setCurrentEffect("none");
      }
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  const applyEffect = useCallback(async (effect: EffectType) => {
    if (!active || !fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);

    // Reset first
    active.set({
      fill: "#ffffff",
      stroke: "transparent",
      strokeWidth: 0,
      shadow: null,
      paintFirst: "fill",
    });

    switch (effect) {
      case "neon":
        await applyNeonEffect(active, effectColor, effectIntensity, fabricCanvas);
        break;
      case "3d":
        await apply3DEffect(active, effectColor, Math.round(effectIntensity / 3), fabricCanvas);
        break;
      case "outline-double":
        await applyDoubleOutline(active, outline1Color, outline2Color, outline1Width, outline2Width, fabricCanvas);
        break;
      case "retro":
        await applyRetroEffect(active, effectColor, fabricCanvas);
        break;
      case "glitch":
        await applyGlitchEffect(active, fabricCanvas);
        break;
      case "metallic":
        await applyMetallicEffect(active, fabricCanvas);
        break;
      case "fire":
        await applyFireEffect(active, fabricCanvas);
        break;
      case "ice":
        await applyIceEffect(active, fabricCanvas);
        break;
      case "rainbow":
        await applyRainbowEffect(active, fabricCanvas);
        break;
      default:
        // Already reset above
        void fabric;
        break;
    }

    active.set({ data: { ...(active.data ?? {}), advancedEffect: effect } });
    setCurrentEffect(effect);
    fabricCanvas.requestRenderAll();
    if (effect !== "none") toast.success(`Efeito "${EFFECTS.find((e) => e.value === effect)?.label}" aplicado`);
  }, [active, fabricCanvas, effectColor, effectIntensity, outline1Color, outline2Color, outline1Width, outline2Width]);

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground px-3">
        <Sparkles className="w-6 h-6 opacity-30" />
        <p className="text-[11px] text-center">Selecione um elemento de texto para aplicar efeitos avançados</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeitos de Texto Avançados</span>
      </div>

      {/* Effect grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {EFFECTS.map((effect) => (
          <button
            key={effect.value}
            onClick={() => applyEffect(effect.value)}
            className={`flex items-center gap-2 p-2 rounded border transition-all text-left ${currentEffect === effect.value ? "bg-primary/10 border-primary" : "border-border hover:border-primary/40 hover:bg-accent/10"}`}
          >
            <span className="text-base leading-none flex-shrink-0">{effect.icon}</span>
            <div className="flex flex-col">
              <span className={`text-[10px] font-medium ${currentEffect === effect.value ? "text-primary" : "text-foreground"}`}>{effect.label}</span>
              <span className="text-[8px] text-muted-foreground leading-tight">{effect.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Effect-specific controls */}
      {(currentEffect === "neon" || currentEffect === "3d" || currentEffect === "retro") && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor do Efeito</span>
          <div className="flex gap-1 flex-wrap">
            {(PRESET_COLORS[currentEffect as keyof typeof PRESET_COLORS] ?? []).map((c) => (
              <button
                key={c}
                onClick={() => { setEffectColor(c); applyEffect(currentEffect); }}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${effectColor === c ? "border-primary ring-2 ring-primary/30" : "border-border/40"}`}
                style={{ background: c }}
              />
            ))}
            <input type="color" value={effectColor} onChange={(e) => setEffectColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border border-border" />
          </div>

          {currentEffect === "neon" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Intensidade do Brilho</span>
                <span className="text-[9px] tabular-nums">{effectIntensity}px</span>
              </div>
              <input
                type="range" min={5} max={40} step={1}
                value={effectIntensity}
                onChange={(e) => setEffectIntensity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          {currentEffect === "3d" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Profundidade</span>
                <span className="text-[9px] tabular-nums">{Math.round(effectIntensity / 3)}px</span>
              </div>
              <input
                type="range" min={3} max={30} step={1}
                value={effectIntensity}
                onChange={(e) => setEffectIntensity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          <button
            onClick={() => applyEffect(currentEffect)}
            className="py-1.5 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded transition-colors"
          >
            Reaplicar com nova cor
          </button>
        </div>
      )}

      {currentEffect === "outline-double" && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Contornos</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground">Externo</span>
              <div className="flex items-center gap-1">
                <input type="color" value={outline1Color} onChange={(e) => setOutline1Color(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
                <input
                  type="range" min={1} max={12} step={1}
                  value={outline1Width}
                  onChange={(e) => setOutline1Width(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-[9px] tabular-nums w-6">{outline1Width}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground">Interno</span>
              <div className="flex items-center gap-1">
                <input type="color" value={outline2Color} onChange={(e) => setOutline2Color(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
                <input
                  type="range" min={1} max={8} step={1}
                  value={outline2Width}
                  onChange={(e) => setOutline2Width(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-[9px] tabular-nums w-6">{outline2Width}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => applyEffect("outline-double")}
            className="py-1.5 text-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded transition-colors"
          >
            Reaplicar
          </button>
        </div>
      )}

      <div className="bg-muted/20 rounded-lg p-2.5 border border-border">
        <p className="text-[9px] text-muted-foreground">
          Os efeitos modificam <strong className="text-foreground/70">fill, stroke e shadow</strong> do texto. Para reverter, clique em &quot;Nenhum&quot;.
        </p>
      </div>
    </div>
  );
}
