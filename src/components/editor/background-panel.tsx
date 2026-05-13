"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";
import { ImageIcon, Trash2 } from "lucide-react";

interface BackgroundPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BgMode = "solid" | "linear" | "radial" | "image";

const GRADIENT_PRESETS = [
  { label: "Pôr do Sol", colors: ["#f97316", "#ec4899"] },
  { label: "Oceano", colors: ["#0ea5e9", "#6366f1"] },
  { label: "Floresta", colors: ["#22c55e", "#06b6d4"] },
  { label: "Noite", colors: ["#1e1b4b", "#312e81"] },
  { label: "Fogo", colors: ["#ef4444", "#f97316"] },
  { label: "Aurora", colors: ["#8b5cf6", "#06b6d4"] },
  { label: "Rosa", colors: ["#ec4899", "#f43f5e"] },
  { label: "Ouro", colors: ["#f59e0b", "#fbbf24"] },
];

const SOLID_PRESETS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#ffffff", "#f8fafc", "#1e293b", "#0f172a",
  "#7c3aed", "#2563eb", "#059669", "#dc2626",
  "#d97706", "#0891b2", "#db2777", "#65a30d",
];

export function BackgroundPanel({ fabricCanvas }: BackgroundPanelProps) {
  const { template } = useEditorStore();
  const [mode, setMode] = useState<BgMode>("solid");
  const [solidColor, setSolidColor] = useState(template?.backgroundColor ?? "#1a1a2e");
  const [gradColor1, setGradColor1] = useState("#6366f1");
  const [gradColor2, setGradColor2] = useState("#ec4899");
  const [gradAngle, setGradAngle] = useState(135);
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);
  const [bgFit, setBgFit] = useState<"cover" | "contain" | "fill">("cover");
  const bgFileRef = useRef<HTMLInputElement>(null);

  const applySolid = useCallback(
    (color: string) => {
      if (!fabricCanvas) return;
      fabricCanvas.setBackgroundColor(color, () => fabricCanvas.requestRenderAll());
      setSolidColor(color);
      toast.success("Fundo aplicado");
    },
    [fabricCanvas]
  );

  const applyLinearGradient = useCallback(
    (c1: string, c2: string, angle: number) => {
      if (!fabricCanvas) return;
      const w: number = fabricCanvas.getWidth();
      const h: number = fabricCanvas.getHeight();
      const rad = (angle * Math.PI) / 180;
      const x1 = 0.5 - 0.5 * Math.cos(rad);
      const y1 = 0.5 - 0.5 * Math.sin(rad);
      const x2 = 0.5 + 0.5 * Math.cos(rad);
      const y2 = 0.5 + 0.5 * Math.sin(rad);

      import("fabric").then(({ fabric }) => {
        const gradient = new fabric.Gradient({
          type: "linear",
          coords: { x1: x1 * w, y1: y1 * h, x2: x2 * w, y2: y2 * h },
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 },
          ],
        });
        fabricCanvas.setBackgroundColor(gradient, () => fabricCanvas.requestRenderAll());
        toast.success("Gradiente aplicado");
      });
    },
    [fabricCanvas]
  );

  const applyRadialGradient = useCallback(
    (c1: string, c2: string) => {
      if (!fabricCanvas) return;
      const w: number = fabricCanvas.getWidth();
      const h: number = fabricCanvas.getHeight();
      const cx = w / 2, cy = h / 2;
      const r = Math.sqrt(cx * cx + cy * cy);

      import("fabric").then(({ fabric }) => {
        const gradient = new fabric.Gradient({
          type: "radial",
          coords: { x1: cx, y1: cy, r1: 0, x2: cx, y2: cy, r2: r },
          colorStops: [
            { offset: 0, color: c1 },
            { offset: 1, color: c2 },
          ],
        });
        fabricCanvas.setBackgroundColor(gradient, () => fabricCanvas.requestRenderAll());
        toast.success("Gradiente radial aplicado");
      });
    },
    [fabricCanvas]
  );

  const applyBgImage = useCallback(
    async (dataURL: string, fit: "cover" | "contain" | "fill") => {
      if (!fabricCanvas) return;
      const { fabric } = await import("fabric");
      const cw: number = fabricCanvas.getWidth() / (fabricCanvas.getZoom() || 1);
      const ch: number = fabricCanvas.getHeight() / (fabricCanvas.getZoom() || 1);

      fabric.Image.fromURL(dataURL, (img: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fi = img as any;
        if (!fi) return;
        const iw = fi.width ?? 1;
        const ih = fi.height ?? 1;

        let scaleX = 1, scaleY = 1;
        if (fit === "cover") {
          const s = Math.max(cw / iw, ch / ih);
          scaleX = s; scaleY = s;
        } else if (fit === "contain") {
          const s = Math.min(cw / iw, ch / ih);
          scaleX = s; scaleY = s;
        } else {
          scaleX = cw / iw; scaleY = ch / ih;
        }

        fi.set({ left: 0, top: 0, scaleX, scaleY, selectable: false, evented: false });
        fabricCanvas.setBackgroundImage(fi, () => fabricCanvas.requestRenderAll());
        toast.success("Fundo com imagem aplicado");
      });
    },
    [fabricCanvas]
  );

  const removeBgImage = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setBackgroundImage(null, () => fabricCanvas.requestRenderAll());
    setBgImagePreview(null);
    toast.success("Imagem de fundo removida");
  }, [fabricCanvas]);

  const handleBgFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataURL = ev.target?.result as string;
        setBgImagePreview(dataURL);
        applyBgImage(dataURL, bgFit);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [applyBgImage, bgFit]
  );

  const handleApply = () => {
    if (mode === "solid") applySolid(solidColor);
    else if (mode === "linear") applyLinearGradient(gradColor1, gradColor2, gradAngle);
    else if (mode === "radial") applyRadialGradient(gradColor1, gradColor2);
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h3 className="text-sm font-semibold text-foreground">Fundo</h3>

      {/* Mode tabs */}
      <div className="grid grid-cols-4 rounded-md overflow-hidden border border-border">
        {(["solid", "linear", "radial", "image"] as BgMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-[10px] py-1.5 transition-colors ${
              mode === m ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
            }`}
          >
            {m === "solid" ? "Sólido" : m === "linear" ? "Linear" : m === "radial" ? "Radial" : "Imagem"}
          </button>
        ))}
      </div>

      {/* Solid */}
      {mode === "solid" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
            />
            <input
              type="text"
              value={solidColor}
              onChange={(e) => setSolidColor(e.target.value)}
              className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
            />
          </div>
          <div className="grid grid-cols-8 gap-1">
            {SOLID_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => { setSolidColor(c); applySolid(c); }}
                className="w-6 h-6 rounded border border-border/50 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Linear / Radial */}
      {(mode === "linear" || mode === "radial") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">Cor 1</span>
              <div className="flex items-center gap-1.5">
                <input type="color" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0" />
                <input type="text" value={gradColor1} onChange={(e) => setGradColor1(e.target.value)}
                  className="flex-1 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground" />
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] text-muted-foreground">Cor 2</span>
              <div className="flex items-center gap-1.5">
                <input type="color" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border bg-transparent p-0" />
                <input type="text" value={gradColor2} onChange={(e) => setGradColor2(e.target.value)}
                  className="flex-1 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="w-full h-10 rounded border border-border"
            style={{
              background:
                mode === "radial"
                  ? `radial-gradient(circle, ${gradColor1}, ${gradColor2})`
                  : `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})`,
            }}
          />

          {mode === "linear" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Ângulo</span>
                <span className="text-[10px] tabular-nums">{gradAngle}°</span>
              </div>
              <input
                type="range"
                min={0} max={360} step={15}
                value={gradAngle}
                onChange={(e) => setGradAngle(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          {/* Gradient presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {GRADIENT_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setGradColor1(p.colors[0]);
                  setGradColor2(p.colors[1]);
                  if (mode === "linear") applyLinearGradient(p.colors[0], p.colors[1], gradAngle);
                  else applyRadialGradient(p.colors[0], p.colors[1]);
                }}
                className="flex flex-col items-center gap-0.5"
                title={p.label}
              >
                <div
                  className="w-full h-8 rounded border border-border/50 hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }}
                />
                <span className="text-[9px] text-muted-foreground">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image background */}
      {mode === "image" && (
        <div className="flex flex-col gap-3">
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgFileChange} />

          {bgImagePreview ? (
            <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bgImagePreview} alt="Fundo" className="w-full h-full object-cover" />
              <button
                onClick={removeBgImage}
                className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500/80 hover:bg-red-600 flex items-center justify-center"
                title="Remover imagem de fundo"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => bgFileRef.current?.click()}
              className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-lg py-6 hover:border-primary/50 hover:bg-accent/20 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Clique para escolher imagem</span>
            </button>
          )}

          {/* Fit mode */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ajuste</span>
            <div className="flex gap-1">
              {(["cover", "contain", "fill"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setBgFit(f);
                    if (bgImagePreview) applyBgImage(bgImagePreview, f);
                  }}
                  className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                    bgFit === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-accent/30"
                  }`}
                >
                  {f === "cover" ? "Cobrir" : f === "contain" ? "Conter" : "Esticar"}
                </button>
              ))}
            </div>
          </div>

          {bgImagePreview && (
            <Button size="sm" onClick={() => bgFileRef.current?.click()} variant="outline" className="w-full text-xs">
              Trocar imagem
            </Button>
          )}
        </div>
      )}

      {mode !== "image" && (
        <Button size="sm" onClick={handleApply} disabled={!fabricCanvas} className="w-full">
          Aplicar Fundo
        </Button>
      )}
    </div>
  );
}
