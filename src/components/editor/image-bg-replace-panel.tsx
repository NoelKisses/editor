"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageBgReplacePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Mode = "solid" | "gradient" | "image";

const PRESETS: { label: string; url: string }[] = [
  { label: "Natureza", url: "https://picsum.photos/seed/nature/1280/720" },
  { label: "Cidade", url: "https://picsum.photos/seed/city/1280/720" },
  { label: "Abstrato", url: "https://picsum.photos/seed/abstract/1280/720" },
  { label: "Espaço", url: "https://picsum.photos/seed/space/1280/720" },
  { label: "Praia", url: "https://picsum.photos/seed/beach/1280/720" },
  { label: "Montanha", url: "https://picsum.photos/seed/mountain/1280/720" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeExistingBackground(canvas: any) {
  if (!canvas) return;
  const objs = canvas.getObjects();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objs.forEach((o: any) => {
    if (o?.data?.isBackground === true) {
      canvas.remove(o);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySolid(canvas: any, color: string) {
  if (!canvas) return;
  removeExistingBackground(canvas);
  canvas.backgroundColor = color;
  canvas.requestRenderAll();
}

function angleToCoords(angle: number, w: number, h: number) {
  const rad = (angle * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.max(w, h);
  const dx = (Math.cos(rad) * len) / 2;
  const dy = (Math.sin(rad) * len) / 2;
  return {
    x1: cx - dx,
    y1: cy - dy,
    x2: cx + dx,
    y2: cy + dy,
  };
}

export function ImageBgReplacePanel({ fabricCanvas }: ImageBgReplacePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [mode, setMode] = useState<Mode>("solid");
  const [solidColor, setSolidColor] = useState("#1e293b");
  const [color1, setColor1] = useState("#ff7a18");
  const [color2, setColor2] = useState("#af002d");
  const [angle, setAngle] = useState(90);
  const [imageUrl, setImageUrl] = useState("");
  const [opacity, setOpacity] = useState(1);
  const [blur, setBlur] = useState(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function handleApplySolid() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    applySolid(canvas, solidColor);
    toast.success("Cor de fundo aplicada");
  }

  function handleApplyGradient() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      removeExistingBackground(canvas);
      const coords = angleToCoords(angle, w, h);
      const gradient = new f.Gradient({
        type: "linear",
        coords,
        colorStops: [
          { offset: 0, color: color1 },
          { offset: 1, color: color2 },
        ],
      });
      const rect = new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        selectable: false,
        evented: false,
        excludeFromExport: false,
        data: { isBackground: true },
      });
      rect.set("fill", gradient);
      canvas.add(rect);
      canvas.sendToBack(rect);
      canvas.backgroundColor = "";
      canvas.requestRenderAll();
      toast.success("Gradiente aplicado");
    });
  }

  function handleApplyImage(urlOverride?: string) {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const url = urlOverride ?? imageUrl;
    if (!url) {
      toast.error("Informe uma URL ou selecione um preset");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      f.Image.fromURL(
        url,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (img: any) => {
          if (!img) {
            toast.error("Falha ao carregar imagem");
            return;
          }
          const w = canvas.getWidth();
          const h = canvas.getHeight();
          const imgW = img.width || w;
          const imgH = img.height || h;
          const scale = Math.max(w / imgW, h / imgH);
          img.set({
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            opacity,
            data: { isBackground: true },
          });
          const filters = [];
          if (blur > 0) {
            filters.push(new f.Image.filters.Blur({ blur: blur / 100 }));
          }
          img.filters = filters;
          if (typeof img.applyFilters === "function") {
            img.applyFilters();
          }
          removeExistingBackground(canvas);
          canvas.add(img);
          canvas.sendToBack(img);
          canvas.backgroundColor = "";
          canvas.requestRenderAll();
          toast.success("Imagem de fundo aplicada");
        },
        { crossOrigin: "anonymous" }
      );
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImageUrl(result);
        handleApplyImage(result);
      }
    };
    reader.onerror = () => toast.error("Falha ao ler arquivo");
    reader.readAsDataURL(file);
  }

  function handleRemoveBg() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    removeExistingBackground(canvas);
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
    toast.success("Fundo removido");
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Substituir Fundo</h3>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <Button
          size="sm"
          variant={mode === "solid" ? "default" : "outline"}
          onClick={() => setMode("solid")}
        >
          Cor Sólida
        </Button>
        <Button
          size="sm"
          variant={mode === "gradient" ? "default" : "outline"}
          onClick={() => setMode("gradient")}
        >
          Gradiente
        </Button>
        <Button
          size="sm"
          variant={mode === "image" ? "default" : "outline"}
          onClick={() => setMode("image")}
        >
          Imagem
        </Button>
      </div>

      {mode === "solid" && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Cor de fundo</span>
          <input
            type="color"
            value={solidColor}
            onChange={(e) => setSolidColor(e.target.value)}
            className="h-9 w-full cursor-pointer rounded border"
          />
          <Button size="sm" className="w-full" onClick={handleApplySolid}>
            Aplicar Cor
          </Button>
        </div>
      )}

      {mode === "gradient" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Cor inicial</span>
            <input
              type="color"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="h-9 w-full cursor-pointer rounded border"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Cor final</span>
            <input
              type="color"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="h-9 w-full cursor-pointer rounded border"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Ângulo: {angle}°
            </span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <Button size="sm" className="w-full" onClick={handleApplyGradient}>
            Aplicar Gradiente
          </Button>
        </div>
      )}

      {mode === "image" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Arquivo local
            </span>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">URL</span>
            <Input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Presets</span>
            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setImageUrl(p.url);
                    handleApplyImage(p.url);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Opacidade: {opacity.toFixed(2)}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Desfoque: {blur}px
            </span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleApplyImage()}
          >
            Aplicar Imagem
          </Button>
        </div>
      )}

      <Button
        size="sm"
        variant="destructive"
        className="w-full"
        onClick={handleRemoveBg}
      >
        Remover Fundo Atual
      </Button>
    </div>
  );
}
