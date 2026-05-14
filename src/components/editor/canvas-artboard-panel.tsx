"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

interface Preset {
  label: string;
  width: number;
  height: number;
}

const PRESETS: Preset[] = [
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "Instagram Post", width: 1080, height: 1080 },
  { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "Twitter Post", width: 1200, height: 675 },
  { label: "LinkedIn Post", width: 1200, height: 627 },
  { label: "TikTok Video", width: 1080, height: 1920 },
  { label: "Pinterest Pin", width: 1000, height: 1500 },
  { label: "A4 Portrait", width: 794, height: 1123 },
  { label: "A4 Landscape", width: 1123, height: 794 },
  { label: "Presentation", width: 1920, height: 1080 },
  { label: "Square", width: 800, height: 800 },
];

function applySize(canvas: FabricCanvas, w: number, h: number): void {
  canvas.setWidth(w);
  canvas.setHeight(h);
  canvas.requestRenderAll();
}

function centerObjects(canvas: FabricCanvas, w: number, h: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = canvas.getObjects().filter((obj: any) => !obj.isBackground);
  objects.forEach((obj) => {
    obj.set({
      left: w / 2,
      top: h / 2,
      originX: "center",
      originY: "center",
    });
    obj.setCoords();
  });
  canvas.requestRenderAll();
}

interface CanvasArtboardPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasArtboardPanel({ fabricCanvas }: CanvasArtboardPanelProps) {
  const canvasRef = useRef<FabricCanvas>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const syncDimensions = () => {
      queueMicrotask(() => {
        setDimensions({
          w: fabricCanvas.getWidth(),
          h: fabricCanvas.getHeight(),
        });
      });
    };

    syncDimensions();

    fabricCanvas.on("canvas:resized", syncDimensions);
    return () => {
      fabricCanvas.off("canvas:resized", syncDimensions);
    };
  }, [fabricCanvas]);

  function handlePreset(preset: Preset) {
    if (!canvasRef.current) return;
    applySize(canvasRef.current, preset.width, preset.height);
    queueMicrotask(() => {
      setDimensions({ w: preset.width, h: preset.height });
    });
    toast.success(`Prancheta: ${preset.label} (${preset.width} × ${preset.height})`);
  }

  function handleApplyCustom() {
    const w = parseInt(customW, 10);
    const h = parseInt(customH, 10);
    if (!canvasRef.current || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      toast.error("Informe dimensões válidas (largura e altura maiores que 0).");
      return;
    }
    applySize(canvasRef.current, w, h);
    queueMicrotask(() => {
      setDimensions({ w, h });
    });
    toast.success(`Prancheta personalizada: ${w} × ${h} px`);
  }

  function handleCenterObjects() {
    if (!canvasRef.current) return;
    const w = canvasRef.current.getWidth();
    const h = canvasRef.current.getHeight();
    centerObjects(canvasRef.current, w, h);
    toast.success("Objetos centralizados na prancheta.");
  }

  function handleWhiteBackground() {
    if (!canvasRef.current) return;
    canvasRef.current.set("backgroundColor", "white");
    canvasRef.current.requestRenderAll();
    toast.success("Fundo definido como branco.");
  }

  function handleTransparentBackground() {
    if (!canvasRef.current) return;
    canvasRef.current.set("backgroundColor", "");
    canvasRef.current.requestRenderAll();
    toast.success("Fundo definido como transparente.");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 shrink-0" />
        <span className="font-semibold text-sm">Prancheta (Artboard)</span>
      </div>

      {/* Current dimensions badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Tamanho atual:</span>
        <Badge variant="secondary" className="text-xs font-mono">
          {dimensions.w} × {dimensions.h}
        </Badge>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-auto flex-col py-1.5 px-2 text-left items-start gap-0"
            onClick={() => handlePreset(preset)}
          >
            <span className="text-xs font-medium leading-tight">{preset.label}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {preset.width} × {preset.height}
            </span>
          </Button>
        ))}
      </div>

      {/* Custom size */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Tamanho personalizado</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            placeholder="Largura"
            value={customW}
            onChange={(e) => setCustomW(e.target.value)}
            className="h-8 text-xs"
            min={1}
          />
          <span className="text-xs text-muted-foreground shrink-0">×</span>
          <Input
            type="number"
            placeholder="Altura"
            value={customH}
            onChange={(e) => setCustomH(e.target.value)}
            className="h-8 text-xs"
            min={1}
          />
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleApplyCustom}>
          Aplicar
        </Button>
      </div>

      {/* Utility actions */}
      <div className="flex flex-col gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleCenterObjects}
        >
          Centralizar Objetos
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleWhiteBackground}
        >
          Fundo Branco
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleTransparentBackground}
        >
          Fundo Transparente
        </Button>
      </div>
    </div>
  );
}
