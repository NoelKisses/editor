"use client";

import { useEffect, useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasSvgImportPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

const INLINE_SVG_PRESETS: Record<string, string> = {
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100"><polygon points="50,5 61,38 95,38 67,58 78,92 50,72 22,92 33,58 5,38 39,38" fill="#FFD700" stroke="#000" stroke-width="2"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100"><path d="M50 85 C 20 60, 10 40, 30 25 C 45 15, 50 30, 50 30 C 50 30, 55 15, 70 25 C 90 40, 80 60, 50 85 Z" fill="#FF3366" stroke="#000" stroke-width="2"/></svg>`,
  arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><path d="M5 30 L70 30 L70 10 L95 30 L70 50 L70 30 Z" fill="#3399FF" stroke="#000" stroke-width="2"/></svg>`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computePosition(canvas: any, obj: any, position: Position): { left: number; top: number } {
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  const ow = (obj.width ?? 0) * (obj.scaleX ?? 1);
  const oh = (obj.height ?? 0) * (obj.scaleY ?? 1);
  switch (position) {
    case "top-left":
      return { left: 10, top: 10 };
    case "top-right":
      return { left: cw - ow - 10, top: 10 };
    case "bottom-left":
      return { left: 10, top: ch - oh - 10 };
    case "bottom-right":
      return { left: cw - ow - 10, top: ch - oh - 10 };
    case "center":
    default:
      return { left: (cw - ow) / 2, top: (ch - oh) / 2 };
  }
}

function downloadSvg(svgStr: string, filename: string) {
  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CanvasSvgImportPanel({ fabricCanvas }: CanvasSvgImportPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [svgText, setSvgText] = useState<string>("");
  const [scale, setScale] = useState<number>(1.0);
  const [position, setPosition] = useState<Position>("center");
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result ?? "");
      queueMicrotask(() => setSvgText(text));
      toast.success("SVG carregado do arquivo");
    };
    reader.onerror = () => {
      toast.error("Falha ao ler o arquivo SVG");
    };
    reader.readAsText(file);
  };

  const importSvg = (svgStr: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    if (!svgStr || !svgStr.trim()) {
      toast.error("SVG vazio");
      return;
    }
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          f.loadSVGFromString(svgStr, (objects: any, options: any) => {
            if (!objects || objects.length === 0) {
              toast.error("Falha ao parsear SVG");
              return;
            }
            const grouped = f.util.groupSVGElements(objects, options);
            grouped.scaleX = scale;
            grouped.scaleY = scale;
            const pos = computePosition(canvas, grouped, position);
            grouped.left = pos.left;
            grouped.top = pos.top;
            grouped.data = { ...(grouped.data || {}), svgImport: true };
            canvas.add(grouped);
            canvas.setActiveObject(grouped);
            canvas.requestRenderAll();
            toast.success("SVG importado");
          });
        } catch (err) {
          console.error(err);
          toast.error("Erro ao importar SVG");
        }
      })
      .catch(() => {
        toast.error("Falha ao carregar fabric");
      });
  };

  const handleImportClick = () => {
    importSvg(svgText);
  };

  const handlePreset = (key: string) => {
    const preset = INLINE_SVG_PRESETS[key];
    if (preset) importSvg(preset);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    let originalBg: string | undefined;
    if (!includeBackground) {
      originalBg = canvas.backgroundColor;
      canvas.backgroundColor = "transparent";
    }
    const svg = canvas.toSVG();
    if (!includeBackground && originalBg !== undefined) {
      canvas.backgroundColor = originalBg;
      canvas.requestRenderAll();
    }
    downloadSvg(svg, `canvas-export-${Date.now()}.svg`);
    toast.success("SVG exportado");
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    let originalBg: string | undefined;
    if (!includeBackground) {
      originalBg = canvas.backgroundColor;
      canvas.backgroundColor = "transparent";
    }
    const svg = canvas.toSVG();
    if (!includeBackground && originalBg !== undefined) {
      canvas.backgroundColor = originalBg;
      canvas.requestRenderAll();
    }
    try {
      await navigator.clipboard.writeText(svg);
      toast.success("SVG copiado para área de transferência");
    } catch {
      toast.error("Falha ao copiar SVG");
    }
  };

  const handleRemoveImported = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = canvas.getObjects().filter((o: any) => o?.data?.svgImport === true);
    objs.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objs.length} SVG(s) removido(s)`);
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <FileDown className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Importar / Exportar SVG</h3>
      </div>

      <div className="space-y-3 border-t pt-3">
        <div className="text-xs font-medium text-muted-foreground">Importar SVG</div>

        <div className="space-y-1">
          <span className="text-xs">Arquivo SVG</span>
          <Input type="file" accept=".svg" onChange={handleFileChange} />
        </div>

        <div className="space-y-1">
          <span className="text-xs">Ou cole o SVG aqui</span>
          <textarea
            className="w-full min-h-[80px] rounded border border-input bg-background p-2 text-xs font-mono"
            placeholder="<svg ...>...</svg>"
            value={svgText}
            onChange={(e) => setSvgText(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Escala</span>
            <span className="text-xs text-muted-foreground">{scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <span className="text-xs">Posição</span>
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant={position === "top-left" ? "default" : "outline"}
              onClick={() => setPosition("top-left")}
            >
              ↖
            </Button>
            <span />
            <Button
              size="sm"
              variant={position === "top-right" ? "default" : "outline"}
              onClick={() => setPosition("top-right")}
            >
              ↗
            </Button>
            <span />
            <Button
              size="sm"
              variant={position === "center" ? "default" : "outline"}
              onClick={() => setPosition("center")}
            >
              ●
            </Button>
            <span />
            <Button
              size="sm"
              variant={position === "bottom-left" ? "default" : "outline"}
              onClick={() => setPosition("bottom-left")}
            >
              ↙
            </Button>
            <span />
            <Button
              size="sm"
              variant={position === "bottom-right" ? "default" : "outline"}
              onClick={() => setPosition("bottom-right")}
            >
              ↘
            </Button>
          </div>
        </div>

        <Button size="sm" className="w-full" onClick={handleImportClick}>
          Importar SVG
        </Button>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="text-xs font-medium text-muted-foreground">Presets Rápidos</div>
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" variant="outline" onClick={() => handlePreset("star")}>
            Star Inline
          </Button>
          <Button size="sm" variant="outline" onClick={() => handlePreset("heart")}>
            Heart Inline
          </Button>
          <Button size="sm" variant="outline" onClick={() => handlePreset("arrow")}>
            Flecha Inline
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <div className="text-xs font-medium text-muted-foreground">Exportar</div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={includeBackground}
            onChange={(e) => setIncludeBackground(e.target.checked)}
          />
          <span>Incluir fundo</span>
        </label>

        <Button size="sm" className="w-full" onClick={handleExport}>
          Exportar Canvas como SVG
        </Button>
        <Button size="sm" variant="outline" className="w-full" onClick={handleCopy}>
          Copiar SVG
        </Button>
      </div>

      <div className="border-t pt-3">
        <Button size="sm" variant="destructive" className="w-full" onClick={handleRemoveImported}>
          Remover SVGs Importados
        </Button>
      </div>
    </div>
  );
}
