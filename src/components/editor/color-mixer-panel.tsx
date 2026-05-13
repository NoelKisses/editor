"use client";

import { useCallback, useEffect, useState } from "react";
import { Paintbrush2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ColorMixerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type ColorMode = "rgb" | "hsl";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  if (sn === 0) { const v = Math.round(ln * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1/3) * 255),
  };
}

function generateHarmony(hex: string): { label: string; color: string }[] {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const mk = (dh: number) => {
    const { r: r2, g: g2, b: b2 } = hslToRgb((h + dh + 360) % 360, s, l);
    return rgbToHex(r2, g2, b2);
  };
  return [
    { label: "Base", color: hex },
    { label: "Complementar", color: mk(180) },
    { label: "Análogo −30°", color: mk(-30) },
    { label: "Análogo +30°", color: mk(30) },
    { label: "Tríade +120°", color: mk(120) },
    { label: "Tríade +240°", color: mk(240) },
    { label: "Claro +20%", color: (() => { const c = hslToRgb(h, s, Math.min(100, l + 20)); return rgbToHex(c.r, c.g, c.b); })() },
    { label: "Escuro −20%", color: (() => { const c = hslToRgb(h, s, Math.max(0, l - 20)); return rgbToHex(c.r, c.g, c.b); })() },
  ];
}

export function ColorMixerPanel({ fabricCanvas, selectionVersion }: ColorMixerPanelProps) {
  const [mode, setMode] = useState<ColorMode>("rgb");
  const [r, setR] = useState(66);
  const [g, setG] = useState(133);
  const [b, setB] = useState(244);
  const [h, setH] = useState(0);
  const [s, setS] = useState(0);
  const [l, setL] = useState(0);
  const [hex, setHex] = useState("#4285f4");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const { h: nh, s: ns, l: nl } = rgbToHsl(r, g, b);
      setH(nh); setS(ns); setL(nl);
      setHex(rgbToHex(r, g, b));
    });
  }, [r, g, b]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (obj?.fill && typeof obj.fill === "string" && obj.fill.startsWith("#")) {
        const { r: nr, g: ng, b: nb } = hexToRgb(obj.fill);
        setR(nr); setG(ng); setB(nb);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const syncFromHsl = useCallback((nh: number, ns: number, nl: number) => {
    const { r: nr, g: ng, b: nb } = hslToRgb(nh, ns, nl);
    setR(nr); setG(ng); setB(nb);
    setH(nh); setS(ns); setL(nl);
    setHex(rgbToHex(nr, ng, nb));
  }, []);

  const applyToObject = useCallback((color: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    obj.set({ fill: color });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const copyHex = useCallback(() => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [hex]);

  const harmony = generateHarmony(hex);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Paintbrush2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Misturador de Cores</span>
      </div>

      {/* Color preview + hex */}
      <div className="flex items-center gap-2">
        <div
          className="w-12 h-12 rounded-lg border border-border flex-shrink-0 cursor-pointer"
          style={{ backgroundColor: hex }}
          onClick={() => applyToObject(hex)}
          title="Clique para aplicar ao objeto"
        />
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-foreground">{hex.toUpperCase()}</span>
            <button onClick={copyHex} className="p-0.5 rounded hover:bg-accent transition-colors">
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
            </button>
          </div>
          <button
            onClick={() => applyToObject(hex)}
            className="text-[8px] text-primary hover:underline text-left"
          >
            Aplicar ao objeto selecionado
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-1">
        {(["rgb", "hsl"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${mode === m ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* RGB sliders */}
      {mode === "rgb" && (
        <div className="flex flex-col gap-2">
          {[
            { label: "R", value: r, set: setR, color: "#ff4444" },
            { label: "G", value: g, set: setG, color: "#44ff44" },
            { label: "B", value: b, set: setB, color: "#4488ff" },
          ].map(ctrl => (
            <div key={ctrl.label} className="flex items-center gap-2">
              <span className="text-[9px] font-bold w-4" style={{ color: ctrl.color }}>{ctrl.label}</span>
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={ctrl.value}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="flex-1 h-1"
                style={{ accentColor: ctrl.color }}
              />
              <input
                type="number"
                min={0}
                max={255}
                step={1}
                value={ctrl.value}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="w-10 bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary text-center"
              />
            </div>
          ))}
        </div>
      )}

      {/* HSL sliders */}
      {mode === "hsl" && (
        <div className="flex flex-col gap-2">
          {[
            { label: "H", value: h, min: 0, max: 360, set: (v: number) => syncFromHsl(v, s, l) },
            { label: "S", value: s, min: 0, max: 100, set: (v: number) => syncFromHsl(h, v, l) },
            { label: "L", value: l, min: 0, max: 100, set: (v: number) => syncFromHsl(h, s, v) },
          ].map(ctrl => (
            <div key={ctrl.label} className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-muted-foreground w-4">{ctrl.label}</span>
              <input
                type="range"
                min={ctrl.min}
                max={ctrl.max}
                step={1}
                value={ctrl.value}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="flex-1 accent-primary h-1"
              />
              <input
                type="number"
                min={ctrl.min}
                max={ctrl.max}
                step={1}
                value={ctrl.value}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="w-10 bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary text-center"
              />
            </div>
          ))}
        </div>
      )}

      {/* Color harmony */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Harmonia de Cores</span>
        <div className="grid grid-cols-4 gap-1">
          {harmony.map(item => (
            <button
              key={item.label}
              onClick={() => {
                const { r: nr, g: ng, b: nb } = hexToRgb(item.color);
                setR(nr); setG(ng); setB(nb);
              }}
              title={`${item.label}: ${item.color}`}
              className="flex flex-col items-center gap-0.5"
            >
              <div
                className="w-full h-7 rounded border border-border hover:scale-105 transition-transform"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[6px] text-muted-foreground text-center leading-tight truncate w-full">{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hex input */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">HEX</span>
        <input
          type="text"
          value={hex}
          onChange={e => {
            const val = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
              const { r: nr, g: ng, b: nb } = hexToRgb(val);
              setR(nr); setG(ng); setB(nb);
            }
            setHex(val);
          }}
          className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] font-mono focus:outline-none focus:border-primary"
          placeholder="#000000"
          maxLength={7}
        />
        <input
          type="color"
          value={hex}
          onChange={e => {
            const { r: nr, g: ng, b: nb } = hexToRgb(e.target.value);
            setR(nr); setG(ng); setB(nb);
          }}
          className="w-8 h-7 rounded border border-border cursor-pointer"
        />
      </div>
    </div>
  );
}
