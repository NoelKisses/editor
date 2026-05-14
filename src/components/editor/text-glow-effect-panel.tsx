"use client";

import { useCallback, useEffect, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextGlowEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GlowPreset = "none" | "neon-blue" | "neon-pink" | "neon-green" | "golden" | "fire" | "ice" | "purple" | "white";

const PRESETS: { value: GlowPreset; label: string; color: string; color2?: string }[] = [
  { value: "none", label: "Nenhum", color: "#ffffff" },
  { value: "neon-blue", label: "Neon Azul", color: "#00bfff" },
  { value: "neon-pink", label: "Neon Rosa", color: "#ff00ff" },
  { value: "neon-green", label: "Neon Verde", color: "#00ff88" },
  { value: "golden", label: "Dourado", color: "#ffd700", color2: "#ff8c00" },
  { value: "fire", label: "Fogo", color: "#ff4500", color2: "#ff8c00" },
  { value: "ice", label: "Gelo", color: "#87ceeb", color2: "#ffffff" },
  { value: "purple", label: "Roxo", color: "#9b59b6" },
  { value: "white", label: "Branco", color: "#ffffff" },
];

export function TextGlowEffectPanel({ fabricCanvas, selectionVersion }: TextGlowEffectPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [preset, setPreset] = useState<GlowPreset>("none");
  const [glowColor, setGlowColor] = useState("#00bfff");
  const [glowBlur, setGlowBlur] = useState(12);
  const [glowSpread, setGlowSpread] = useState(3);
  const [glowOpacity, setGlowOpacity] = useState(0.8);
  const [layers, setLayers] = useState(3);
  const [textFill, setTextFill] = useState("#ffffff");
  const [hasEffect, setHasEffect] = useState(false);
  const [savedShadow, setSavedShadow] = useState<unknown>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox");
      setHasText(isText);
      if (isText) {
        setHasEffect(!!obj.__glowEffect);
        setTextFill(typeof obj.fill === "string" ? obj.fill : "#ffffff");
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox") ? obj : null;
  }, [fabricCanvas]);

  const applyPreset = useCallback((p: GlowPreset) => {
    setPreset(p);
    const found = PRESETS.find(pr => pr.value === p);
    if (found && p !== "none") setGlowColor(found.color);
  }, []);

  const buildShadow = useCallback(() => {
    // Build a multi-layer shadow string that simulates glow
    // Fabric.js shadow: "blur color offsetX offsetY"
    // We stack multiple shadows by using CSS text-shadow syntax via Fabric shadow
    const blurPerLayer = glowBlur / layers;
    let shadowStr = "";
    for (let i = 1; i <= layers; i++) {
      const b = blurPerLayer * i;
      const alpha = Math.round(glowOpacity * 255 * (1 - (i - 1) / layers)).toString(16).padStart(2, "0");
      const colorWithAlpha = glowColor + alpha;
      if (i > 1) shadowStr += " ";
      // Fabric shadow format: "color blur"
      shadowStr = colorWithAlpha;
      void b;
    }
    return shadowStr;
  }, [glowColor, glowBlur, glowOpacity, layers]);

  const applyGlow = useCallback(() => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // Save original shadow
      if (!obj.__glowEffect) {
        setSavedShadow(obj.shadow ?? null);
      }

      // Apply text fill
      obj.set({ fill: textFill });

      // Build layered shadow using Fabric.js Shadow
      const shadow = new f.Shadow({
        color: glowColor + Math.round(glowOpacity * 255).toString(16).padStart(2, "0"),
        blur: glowBlur,
        offsetX: 0,
        offsetY: 0,
        affectStroke: false,
      });

      obj.set({ shadow });
      obj.__glowEffect = true;
      obj.__glowParams = { glowColor, glowBlur, glowSpread, glowOpacity, layers, textFill, preset };

      // For stronger glow: add a second stroke pass
      if (glowSpread > 0) {
        obj.set({
          stroke: glowColor + "80",
          strokeWidth: glowSpread,
          paintFirst: "stroke",
        });
      }

      obj.setCoords();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success(`Glow "${preset !== "none" ? preset : "personalizado"}" aplicado`);
    });
  }, [getTextObj, textFill, glowColor, glowBlur, glowSpread, glowOpacity, layers, preset, fabricCanvas]);

  const removeGlow = useCallback(() => {
    const obj = getTextObj();
    if (!obj) return;
    obj.set({
      shadow: savedShadow ?? null,
      stroke: null,
      strokeWidth: 0,
      paintFirst: "fill",
    });
    obj.__glowEffect = false;
    obj.__glowParams = null;
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Glow removido");
  }, [getTextObj, savedShadow, fabricCanvas]);

  void buildShadow;

  const COLORS = ["#00bfff", "#ff00ff", "#00ff88", "#ffd700", "#ff4500", "#9b59b6", "#87ceeb", "#ffffff"];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Glow / Neon no Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para aplicar glow</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Estilos prontos</span>
            <div className="grid grid-cols-3 gap-1">
              {PRESETS.filter(p => p.value !== "none").map(p => (
                <button key={p.value} onClick={() => applyPreset(p.value)}
                  style={{ borderColor: preset === p.value ? p.color : undefined, color: preset === p.value ? p.color : undefined }}
                  className={`py-1 rounded border text-[7px] transition-colors ${preset === p.value ? "bg-primary/5" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color swatches */}
          <div className="flex gap-1 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => setGlowColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${glowColor === c ? "border-white scale-110" : "border-transparent hover:border-white/40"}`}
                style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={glowColor} onChange={e => setGlowColor(e.target.value)}
              className="w-6 h-6 rounded-full border-2 border-border cursor-pointer" />
          </div>

          {/* Text fill */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">Cor do texto</span>
            <input type="color" value={textFill} onChange={e => setTextFill(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{textFill}</span>
          </div>

          {/* Blur */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Desfoque (blur)</span>
              <span className="text-[9px] tabular-nums">{glowBlur}px</span>
            </div>
            <input type="range" min={2} max={60} step={1} value={glowBlur}
              onChange={e => setGlowBlur(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Spread */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espessura (spread)</span>
              <span className="text-[9px] tabular-nums">{glowSpread}px</span>
            </div>
            <input type="range" min={0} max={15} step={1} value={glowSpread}
              onChange={e => setGlowSpread(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{Math.round(glowOpacity * 100)}%</span>
            </div>
            <input type="range" min={0.1} max={1} step={0.05} value={glowOpacity}
              onChange={e => setGlowOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Layers */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Camadas de glow</span>
              <span className="text-[9px] tabular-nums">{layers}</span>
            </div>
            <input type="range" min={1} max={5} step={1} value={layers}
              onChange={e => setLayers(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeGlow}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyGlow}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}
              style={{ boxShadow: `0 0 8px ${glowColor}60` }}>
              <Sparkles className="w-3 h-3" /> Aplicar Glow
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Usa Fabric.js Shadow + stroke para simular neon
          </p>
        </>
      )}
    </div>
  );
}
