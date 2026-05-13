"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectGlitchEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GlitchStyle = "chromatic" | "scanlines" | "noise" | "shift" | "rgb";

const GLITCH_STYLES: { value: GlitchStyle; label: string; desc: string }[] = [
  { value: "chromatic", label: "Cromático", desc: "Separação de canais RGB" },
  { value: "scanlines", label: "Scanlines", desc: "Linhas horizontais" },
  { value: "noise", label: "Ruído", desc: "Grão e ruído digital" },
  { value: "shift", label: "Deslocamento", desc: "Linhas deslocadas" },
  { value: "rgb", label: "RGB Split", desc: "Espalhamento de cores" },
];

export function ObjectGlitchEffectPanel({ fabricCanvas, selectionVersion }: ObjectGlitchEffectPanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [style, setStyle] = useState<GlitchStyle>("chromatic");
  const [intensity, setIntensity] = useState(30);
  const [hasEffect, setHasEffect] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isImg = !!obj && (obj.type === "image" || obj.type === "Image");
      setHasImage(isImg);
      if (isImg) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasGlitch = (obj.filters ?? []).some((f: any) =>
          f.type === "Noise" || (f.type === "Convolute" && f._glitch)
        );
        setHasEffect(hasGlitch);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getImage = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "image" || obj.type === "Image") ? obj : null;
  }, [fabricCanvas]);

  const applyGlitch = useCallback(() => {
    const obj = getImage();
    if (!obj) { toast.error("Selecione uma imagem"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingFilters: any[] = (obj.filters ?? []).filter((fl: any) =>
        fl.type && !["Noise", "Pixelate", "Blur", "Convolute", "Saturation"].includes(fl.type)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newFilters: any[] = [];
      const factor = intensity / 100;

      switch (style) {
        case "chromatic":
          // Simulate chromatic aberration with ColorMatrix shifts
          newFilters.push(new f.Image.filters.ColorMatrix({
            matrix: [
              1 + factor * 0.2, 0, 0, 0, 0,
              0, 1, 0, 0, 0,
              0, 0, 1 - factor * 0.2, 0, 0,
              0, 0, 0, 1, 0,
            ],
          }));
          newFilters.push(new f.Image.filters.Noise({ noise: intensity * 0.5 }));
          break;

        case "scanlines":
          // Scanlines via sharpening + noise
          newFilters.push(new f.Image.filters.Convolute({
            matrix: [
              0, -factor * 0.5, 0,
              0, 1, 0,
              0, factor * 0.5, 0,
            ],
          }));
          newFilters.push(new f.Image.filters.Noise({ noise: intensity * 0.3 }));
          break;

        case "noise":
          newFilters.push(new f.Image.filters.Noise({ noise: intensity * 2 }));
          newFilters.push(new f.Image.filters.Pixelate({ blocksize: Math.max(2, Math.round(intensity / 15)) }));
          break;

        case "shift":
          // Shift effect via edge detection convolute
          newFilters.push(new f.Image.filters.Convolute({
            matrix: [
              -1, -1, 0,
              -1, factor * 4 + 4, -1,
              0, -1, -1,
            ],
          }));
          newFilters.push(new f.Image.filters.Noise({ noise: intensity }));
          break;

        case "rgb":
          // RGB split simulation
          newFilters.push(new f.Image.filters.Saturation({ saturation: factor }));
          newFilters.push(new f.Image.filters.ColorMatrix({
            matrix: [
              1 + factor * 0.3, 0, 0, 0, 0,
              0, 1 - factor * 0.1, 0, 0, 0,
              0, 0, 1 + factor * 0.3, 0, 0,
              0, 0, 0, 1, 0,
            ],
          }));
          newFilters.push(new f.Image.filters.Noise({ noise: intensity * 0.8 }));
          break;
      }

      obj.filters = [...existingFilters, ...newFilters];
      obj.applyFilters();
      fabricCanvas.requestRenderAll();
      setHasEffect(true);
      toast.success(`Efeito glitch "${style}" aplicado`);
    });
  }, [getImage, style, intensity, fabricCanvas]);

  const removeEffect = useCallback(() => {
    const obj = getImage();
    if (!obj) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj.filters = (obj.filters ?? []).filter((f: any) =>
      f.type && !["Noise", "Pixelate", "Blur", "Convolute", "Saturation", "ColorMatrix"].includes(f.type)
    );
    obj.applyFilters();
    fabricCanvas.requestRenderAll();
    setHasEffect(false);
    toast.success("Efeito glitch removido");
  }, [getImage, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeito Glitch</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Zap className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem para aplicar o glitch</p>
        </div>
      ) : (
        <>
          {/* Style selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo do Glitch</span>
            <div className="flex flex-col gap-1">
              {GLITCH_STYLES.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded border text-left transition-colors ${style === s.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div className="flex-1">
                    <span className={`text-[9px] font-medium ${style === s.value ? "text-primary" : ""}`}>{s.label}</span>
                    <p className="text-[7px] text-muted-foreground">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Intensidade</span>
              <span className="text-[9px] tabular-nums">{intensity}%</span>
            </div>
            <input type="range" min={5} max={100} step={5} value={intensity}
              onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Visual preview */}
          <div className="h-8 rounded overflow-hidden border border-border relative">
            <div className="absolute inset-0 flex">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 h-full" style={{
                  backgroundColor: `hsl(${i * 30}, 80%, 50%)`,
                  filter: style === "noise" ? `contrast(${1 + intensity / 100})` : "none",
                  transform: style === "shift" && i % 3 === 0 ? `translateY(${(intensity / 100) * 4}px)` : "none",
                }} />
              ))}
            </div>
            {style === "scanlines" && (
              <div className="absolute inset-0" style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent ${Math.max(2, 8 - intensity / 20)}px, rgba(0,0,0,0.3) ${Math.max(2, 8 - intensity / 20)}px, rgba(0,0,0,0.3) ${Math.max(3, 10 - intensity / 20)}px)`,
              }} />
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasEffect && (
              <button onClick={removeEffect}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyGlitch}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasEffect ? "" : "col-span-2"}`}>
              <Zap className="w-3 h-3" /> Aplicar Glitch
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Efeito aplicado via filtros Fabric.js combinados
          </p>
        </>
      )}
    </div>
  );
}
