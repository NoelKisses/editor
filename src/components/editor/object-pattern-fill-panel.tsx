"use client";

import { useCallback, useEffect, useState } from "react";
import { Shuffle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectPatternFillPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type PatternType = "dots" | "stripes" | "grid" | "diagonal" | "chevron" | "crosshatch" | "zigzag";

const PATTERN_TYPES: { value: PatternType; label: string }[] = [
  { value: "dots", label: "Pontos" },
  { value: "stripes", label: "Listras" },
  { value: "grid", label: "Grade" },
  { value: "diagonal", label: "Diagonal" },
  { value: "chevron", label: "Chevron" },
  { value: "crosshatch", label: "Cruzado" },
  { value: "zigzag", label: "Zigzag" },
];

function buildPatternSvg(type: PatternType, fg: string, bg: string, size: number): string {
  const s = size;
  const h = s / 2;

  let content = "";
  switch (type) {
    case "dots":
      content = `<circle cx="${h}" cy="${h}" r="${h * 0.4}" fill="${fg}" />`;
      break;
    case "stripes":
      content = `<rect x="0" y="0" width="${h * 0.5}" height="${s}" fill="${fg}" />`;
      break;
    case "grid":
      content = `<rect x="0" y="0" width="${s}" height="1" fill="${fg}" /><rect x="0" y="0" width="1" height="${s}" fill="${fg}" />`;
      break;
    case "diagonal":
      content = `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${fg}" stroke-width="1.5"/>`;
      break;
    case "chevron":
      content = `<polyline points="0,${h} ${h},0 ${s},${h}" stroke="${fg}" stroke-width="1.5" fill="none"/>`;
      break;
    case "crosshatch":
      content = `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${fg}" stroke-width="1"/><line x1="0" y1="0" x2="${s}" y2="${s}" stroke="${fg}" stroke-width="1"/>`;
      break;
    case "zigzag":
      content = `<polyline points="0,${h} ${h * 0.5},0 ${h},${h} ${h * 1.5},0 ${s},${h}" stroke="${fg}" stroke-width="1.5" fill="none"/>`;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="${s}" height="${s}" fill="${bg}"/>${content}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svg.replace(/#/g, "%23").replace(/"/g, "'"))}`;
}

export function ObjectPatternFillPanel({ fabricCanvas, selectionVersion }: ObjectPatternFillPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [patternType, setPatternType] = useState<PatternType>("dots");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(16);
  const [angle, setAngle] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [hasPattern, setHasPattern] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const valid = !!obj && ["rect", "circle", "triangle", "polygon", "path", "textbox", "text", "i-text"].includes(obj.type);
      setHasObject(valid);
      if (valid) {
        setHasPattern(obj._hasPatternFill === true);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj ?? null;
  }, [fabricCanvas]);

  const applyPattern = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      const dataUrl = buildPatternSvg(patternType, fgColor, bgColor, size);

      f.Image.fromURL(dataUrl, (img: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgAny = img as any;
        const pattern = new f.Pattern({
          source: imgAny.getElement(),
          repeat: "repeat",
          offsetX: 0,
          offsetY: 0,
          patternTransform: [Math.cos(angle * Math.PI / 180), Math.sin(angle * Math.PI / 180), -Math.sin(angle * Math.PI / 180), Math.cos(angle * Math.PI / 180), 0, 0],
        });
        obj.set({ fill: pattern, opacity, _hasPatternFill: true });
        obj.setCoords();
        fabricCanvas.requestRenderAll();
        setHasPattern(true);
        toast.success(`Padrão "${patternType}" aplicado`);
      });
    });
  }, [getObject, patternType, fgColor, bgColor, size, angle, opacity, fabricCanvas]);

  const removePattern = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    obj.set({ fill: fgColor, opacity: 1, _hasPatternFill: false });
    obj.setCoords();
    fabricCanvas.requestRenderAll();
    setHasPattern(false);
    toast.success("Preenchimento padrão removido");
  }, [getObject, fgColor, fabricCanvas]);

  const previewUrl = typeof window !== "undefined" ? buildPatternSvg(patternType, fgColor, bgColor, size) : "";

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Shuffle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Preenchimento com Padrão</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Shuffle className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar um padrão</p>
        </div>
      ) : (
        <>
          {/* Pattern type grid */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Padrão</span>
            <div className="grid grid-cols-4 gap-1">
              {PATTERN_TYPES.map(p => (
                <button key={p.value} onClick={() => setPatternType(p.value)}
                  className={`py-1.5 rounded border text-[7px] transition-colors ${patternType === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor do Padrão</span>
              <div className="flex items-center gap-1">
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)}
                  className="w-7 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{fgColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor de Fundo</span>
              <div className="flex items-center gap-1">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="w-7 h-6 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho</span>
              <span className="text-[9px] tabular-nums">{size}px</span>
            </div>
            <input type="range" min={4} max={64} step={2} value={size}
              onChange={e => setSize(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Angle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Ângulo</span>
              <span className="text-[9px] tabular-nums">{angle}°</span>
            </div>
            <input type="range" min={0} max={360} step={15} value={angle}
              onChange={e => setAngle(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade</span>
              <span className="text-[9px] tabular-nums">{Math.round(opacity * 100)}%</span>
            </div>
            <input type="range" min={0.1} max={1} step={0.05} value={opacity}
              onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="h-10 rounded border border-border overflow-hidden"
              style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: `${size}px ${size}px` }} />
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            {hasPattern && (
              <button onClick={removePattern}
                className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
                <RotateCcw className="w-3 h-3" /> Remover
              </button>
            )}
            <button onClick={applyPattern}
              className={`flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors ${hasPattern ? "" : "col-span-2"}`}>
              <Shuffle className="w-3 h-3" /> Aplicar Padrão
            </button>
          </div>
        </>
      )}
    </div>
  );
}
