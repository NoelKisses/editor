"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface TextEffectsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

// Popular Google Fonts for thumbnails
const GOOGLE_FONTS = [
  "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins",
  "Raleway", "Oswald", "Source Sans Pro", "Nunito", "Ubuntu",
  "Playfair Display", "Merriweather", "PT Serif", "Libre Baskerville",
  "Bebas Neue", "Anton", "Bangers", "Black Han Sans",
  "Staatliches", "Alfa Slab One",
];

type TextEffect = "none" | "shadow" | "outline" | "glow" | "neon" | "lift" | "hollow";

const EFFECTS: { id: TextEffect; label: string; preview: string }[] = [
  { id: "none", label: "Nenhum", preview: "Aa" },
  { id: "shadow", label: "Sombra", preview: "Aa" },
  { id: "outline", label: "Contorno", preview: "Aa" },
  { id: "glow", label: "Brilho", preview: "Aa" },
  { id: "neon", label: "Neon", preview: "Aa" },
  { id: "lift", label: "Elevado", preview: "Aa" },
  { id: "hollow", label: "Vazado", preview: "Aa" },
];

const EFFECT_STYLES: Record<TextEffect, { stroke?: string; strokeWidth?: number; shadow?: string; fill?: string }> = {
  none: {},
  shadow: { shadow: "rgba(0,0,0,0.7) 4px 4px 8px" },
  outline: { stroke: "#ffffff", strokeWidth: 3 },
  glow: { shadow: "rgba(255,255,255,0.9) 0px 0px 20px" },
  neon: { stroke: "#0ff", strokeWidth: 1, shadow: "rgba(0,255,255,0.8) 0px 0px 15px" },
  lift: { shadow: "rgba(0,0,0,0.8) 6px 6px 0px" },
  hollow: { fill: "transparent", stroke: "#ffffff", strokeWidth: 3 },
};

const loadGoogleFont = (fontName: string) => {
  if (typeof document === "undefined") return;
  const id = `gf-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700;900&display=swap`;
  document.head.appendChild(link);
};

export function TextEffectsPanel({ fabricCanvas, selectionVersion }: TextEffectsPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [, forceRedraw] = useState(0);
  const [currentEffect, setCurrentEffect] = useState<TextEffect>("none");
  const [fontSearch, setFontSearch] = useState("");
  const [arcRadius, setArcRadius] = useState(200);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arcGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    const isText = obj && (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");
    const next = isText ? obj : null;
    queueMicrotask(() => setActive(next));
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(
    (props: Record<string, unknown>) => {
      if (!active) return;
      active.set(props);
      fabricCanvas.requestRenderAll();
      forceRedraw((n) => n + 1);
    },
    [active, fabricCanvas]
  );

  const applyEffect = useCallback(
    async (effect: TextEffect) => {
      if (!active) return;
      const { fabric } = await import("fabric");
      const style = EFFECT_STYLES[effect];
      setCurrentEffect(effect);

      const updates: Record<string, unknown> = {
        stroke: style.stroke ?? null,
        strokeWidth: style.strokeWidth ?? 0,
        shadow: null,
      };

      // Restore fill if hollow is being removed
      if (effect !== "hollow" && active.fill === "transparent") {
        updates.fill = "#ffffff";
      }
      if (style.fill !== undefined) {
        updates.fill = style.fill;
      }

      if (style.shadow) {
        const parts = style.shadow.match(/^(.+)\s([-\d.]+)px\s([-\d.]+)px\s([-\d.]+)px$/);
        if (parts) {
          updates.shadow = new fabric.Shadow({
            color: parts[1],
            offsetX: parseFloat(parts[2]),
            offsetY: parseFloat(parts[3]),
            blur: parseFloat(parts[4]),
          });
        }
      }

      active.set(updates);
      fabricCanvas.requestRenderAll();
      forceRedraw((n) => n + 1);
      toast.success(`Efeito "${EFFECTS.find((e) => e.id === effect)?.label}" aplicado`);
    },
    [active, fabricCanvas]
  );

  const changeFont = useCallback(
    (fontFamily: string) => {
      loadGoogleFont(fontFamily);
      // Wait for font to load before applying
      setTimeout(() => {
        set({ fontFamily });
      }, 300);
    },
    [set]
  );

  const applyArcText = useCallback(
    async (radius: number) => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj || (obj.type !== "i-text" && obj.type !== "text" && obj.type !== "textbox")) return;

      const { fabric } = await import("fabric");
      const text: string = obj.text ?? "";
      const fontSize: number = obj.fontSize ?? 36;
      const fill: string = obj.fill ?? "#ffffff";
      const fontFamily: string = obj.fontFamily ?? "Arial";
      const fontWeight: string = obj.fontWeight ?? "normal";

      if (!text.trim()) {
        toast.error("Nenhum texto para curvar");
        return;
      }

      // Remove previous arc group if any
      if (arcGroupRef.current && fabricCanvas.contains(arcGroupRef.current)) {
        fabricCanvas.remove(arcGroupRef.current);
      }

      const chars = text.split("");
      // Measure total angle needed
      const charWidth = fontSize * 0.6;
      const totalAngle = (charWidth * chars.length) / Math.abs(radius);
      const startAngle = -Math.PI / 2 - totalAngle / 2;

      const textObjects = chars.map((char, i) => {
        const angle = startAngle + (i + 0.5) * (totalAngle / chars.length);
        const x = Math.cos(angle) * Math.abs(radius);
        const y = Math.sin(angle) * Math.abs(radius) * (radius < 0 ? -1 : 1);
        const rotation = (angle + (radius < 0 ? -Math.PI / 2 : Math.PI / 2)) * (180 / Math.PI);

        return new fabric.Text(char, {
          left: x,
          top: y,
          fontSize,
          fill,
          fontFamily,
          fontWeight,
          originX: "center",
          originY: "center",
          angle: rotation,
          selectable: false,
        });
      });

      const group = new fabric.Group(textObjects, {
        left: obj.left ?? 100,
        top: obj.top ?? 100,
        selectable: true,
      });

      arcGroupRef.current = group;
      fabricCanvas.add(group);
      fabricCanvas.setActiveObject(group);
      fabricCanvas.requestRenderAll();
      toast.success("Texto em arco aplicado");
    },
    [fabricCanvas]
  );

  const filteredFonts = fontSearch
    ? GOOGLE_FONTS.filter((f) => f.toLowerCase().includes(fontSearch.toLowerCase()))
    : GOOGLE_FONTS;

  if (!active) {
    return (
      <div className="flex flex-col gap-2 pt-2 px-3">
        <h3 className="text-sm font-semibold text-foreground">Efeitos de Texto</h3>
        <p className="text-xs text-muted-foreground">Selecione um texto no canvas para editar efeitos.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-2 px-3 pb-3">
      <h3 className="text-sm font-semibold text-foreground">Efeitos de Texto</h3>

      {/* Effects grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Efeito</span>
        <div className="grid grid-cols-4 gap-1.5">
          {EFFECTS.map((effect) => (
            <button
              key={effect.id}
              onClick={() => applyEffect(effect.id)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-colors ${
                currentEffect === effect.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <span
                className="text-base font-bold leading-tight"
                style={
                  effect.id === "outline" ? { WebkitTextStroke: "1px white", color: "transparent" } :
                  effect.id === "hollow" ? { WebkitTextStroke: "1px white", color: "transparent" } :
                  effect.id === "neon" ? { color: "#0ff", textShadow: "0 0 8px cyan" } :
                  effect.id === "glow" ? { color: "white", textShadow: "0 0 8px white" } :
                  effect.id === "shadow" ? { textShadow: "2px 2px 4px rgba(0,0,0,0.8)" } :
                  effect.id === "lift" ? { textShadow: "3px 3px 0 rgba(0,0,0,0.7)" } :
                  { color: "white" }
                }
              >
                Aa
              </span>
              <span className="text-[9px] text-muted-foreground">{effect.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Google Fonts */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Google Fonts</span>
        <input
          type="text"
          placeholder="Buscar fonte..."
          value={fontSearch}
          onChange={(e) => setFontSearch(e.target.value)}
          className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-full"
        />
        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
          {filteredFonts.map((font) => {
            loadGoogleFont(font);
            return (
              <button
                key={font}
                onClick={() => changeFont(font)}
                className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                  active.fontFamily === font
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-accent text-foreground"
                }`}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Letter spacing */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Espaçamento de Letras</span>
        <div className="flex items-center gap-2">
          <Slider
            value={[active.charSpacing ?? 0]}
            min={-200} max={800} step={10}
            onValueChange={(vals) => set({ charSpacing: (vals as number[])[0] })}
            className="flex-1"
          />
          <span className="text-xs tabular-nums w-8 text-right">{active.charSpacing ?? 0}</span>
        </div>
      </div>

      {/* Line height */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Altura de Linha</span>
        <div className="flex items-center gap-2">
          <Slider
            value={[Math.round((active.lineHeight ?? 1.16) * 100)]}
            min={50} max={300} step={5}
            onValueChange={(vals) => set({ lineHeight: (vals as number[])[0] / 100 })}
            className="flex-1"
          />
          <span className="text-xs tabular-nums w-8 text-right">{((active.lineHeight ?? 1.16) * 100).toFixed(0)}%</span>
        </div>
      </div>

      <Separator />

      {/* Stroke color (when outline/neon effect active) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Cor do Contorno</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={active.stroke ?? "#ffffff"}
            onChange={(e) => set({ stroke: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-border p-0 bg-transparent"
          />
          <Slider
            value={[active.strokeWidth ?? 0]}
            min={0} max={20} step={0.5}
            onValueChange={(vals) => set({ strokeWidth: (vals as number[])[0] })}
            className="flex-1"
          />
          <span className="text-xs tabular-nums w-5">{(active.strokeWidth ?? 0).toFixed(1)}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-7"
          onClick={() => set({ linethrough: !active.linethrough })}
        >
          <span style={{ textDecoration: "line-through" }}>Tachado</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-7"
          onClick={() => set({ overline: !active.overline })}
        >
          <span style={{ textDecoration: "overline" }}>Overline</span>
        </Button>
      </div>

      <Separator />

      {/* Arc text */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Texto em Arco</span>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {arcRadius > 0 ? "Arco Superior" : "Arco Inferior"}
            </span>
            <span className="text-xs tabular-nums w-12 text-right">{arcRadius}px</span>
          </div>
          <Slider
            value={[arcRadius]}
            min={-600}
            max={600}
            step={10}
            onValueChange={(vals) => setArcRadius((vals as number[])[0])}
            className="w-full"
          />
          <div className="flex gap-1.5 mt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-7"
              onClick={() => applyArcText(arcRadius)}
              disabled={arcRadius === 0}
            >
              Aplicar Arco
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2"
              onClick={() => setArcRadius(200)}
              title="Resetar raio"
            >
              Reset
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Valores positivos = arco para cima. Negativos = arco para baixo.
          </p>
        </div>
      </div>
    </div>
  );
}
