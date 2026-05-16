"use client";

import { useEffect, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasPdfPrintExportPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type PaperSize = "A4 Retrato" | "A4 Paisagem" | "Carta" | "Personalizado";
type Orientation = "Retrato" | "Paisagem";

const DPI = 96;
const MM_PER_INCH = 25.4;

function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

function getPaperDimensionsMm(
  size: string,
  orientation: string
): { width: number; height: number } {
  let width = 210;
  let height = 297;

  switch (size) {
    case "A4 Retrato":
      width = 210;
      height = 297;
      break;
    case "A4 Paisagem":
      width = 297;
      height = 210;
      break;
    case "Carta":
      width = 216;
      height = 279;
      break;
    case "Personalizado":
      width = 210;
      height = 297;
      break;
    default:
      width = 210;
      height = 297;
  }

  if (size !== "A4 Retrato" && size !== "A4 Paisagem") {
    if (orientation === "Paisagem" && height > width) {
      const tmp = width;
      width = height;
      height = tmp;
    } else if (orientation === "Retrato" && width > height) {
      const tmp = width;
      width = height;
      height = tmp;
    }
  }

  return { width, height };
}

function openPrintWindow(dataUrl: string, paperSize: string): void {
  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) {
    toast.error("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
    return;
  }

  const pageSizeCss =
    paperSize === "A4 Paisagem"
      ? "A4 landscape"
      : paperSize === "Carta"
        ? "Letter"
        : paperSize === "A4 Retrato"
          ? "A4 portrait"
          : "auto";

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Imprimir</title>
    <style>
      @page { size: ${pageSizeCss}; margin: 0; }
      html, body { margin: 0; padding: 0; background: white; }
      .wrap { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
      img { max-width: 100%; max-height: 100%; object-fit: contain; }
      @media print {
        .wrap { width: 100%; height: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <img id="printImg" src="${dataUrl}" alt="Print" />
    </div>
    <script>
      const img = document.getElementById('printImg');
      if (img.complete) {
        window.focus();
        window.print();
      } else {
        img.onload = function() {
          window.focus();
          window.print();
        };
      }
    </script>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function CanvasPdfPrintExportPanel({ fabricCanvas }: CanvasPdfPrintExportPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [paperSize, setPaperSize] = useState<PaperSize>("A4 Retrato");
  const [orientation, setOrientation] = useState<Orientation>("Retrato");
  const [customWidth, setCustomWidth] = useState<number>(210);
  const [customHeight, setCustomHeight] = useState<number>(297);
  const [margin, setMargin] = useState<number>(10);
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [quality, setQuality] = useState<number>(2);
  const [canvasDims, setCanvasDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (fabricCanvas) {
      const w = typeof fabricCanvas.getWidth === "function" ? fabricCanvas.getWidth() : 0;
      const h = typeof fabricCanvas.getHeight === "function" ? fabricCanvas.getHeight() : 0;
      queueMicrotask(() => setCanvasDims({ w, h }));
    }
  }, [fabricCanvas]);

  const paperMm =
    paperSize === "Personalizado"
      ? { width: customWidth, height: customHeight }
      : getPaperDimensionsMm(paperSize, orientation);

  const paperPx = {
    width: mmToPx(paperMm.width, DPI),
    height: mmToPx(paperMm.height, DPI),
  };

  function getCanvasDataUrl(multiplier: number): string | null {
    const c = canvasRef.current;
    if (!c || typeof c.toDataURL !== "function") {
      toast.error("Canvas não disponível.");
      return null;
    }
    try {
      const opts: {
        format: string;
        quality: number;
        multiplier: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [k: string]: any;
      } = {
        format: "png",
        quality: 1,
        multiplier,
      };
      if (!includeBackground) {
        opts.enableRetinaScaling = false;
      }
      return c.toDataURL(opts);
    } catch (err) {
      toast.error("Falha ao gerar imagem do canvas.");
      console.error(err);
      return null;
    }
  }

  function handleExportPng() {
    const url = getCanvasDataUrl(quality);
    if (!url) return;
    triggerDownload(url, `canvas-export-${quality}x.png`);
    toast.success("PNG exportado em alta resolução.");
  }

  function handlePrintNow() {
    const url = getCanvasDataUrl(quality);
    if (!url) return;
    openPrintWindow(url, paperSize);
    toast.success("Janela de impressão aberta.");
  }

  function handleSaveAsPaperSize() {
    const url = getCanvasDataUrl(quality);
    if (!url) return;

    const paperW = paperPx.width;
    const paperH = paperPx.height;
    const marginPx = mmToPx(margin, DPI);

    const off = document.createElement("canvas");
    off.width = paperW;
    off.height = paperH;
    const ctx = off.getContext("2d");
    if (!ctx) {
      toast.error("Falha ao criar canvas offscreen.");
      return;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, paperW, paperH);

    const img = new Image();
    img.onload = () => {
      const availW = paperW - marginPx * 2;
      const availH = paperH - marginPx * 2;
      const scale = Math.min(availW / img.width, availH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (paperW - drawW) / 2;
      const y = (paperH - drawH) / 2;
      ctx.drawImage(img, x, y, drawW, drawH);
      const out = off.toDataURL("image/png");
      triggerDownload(out, `canvas-paper-${paperMm.width}x${paperMm.height}mm.png`);
      toast.success("Imagem em tamanho de papel salva.");
    };
    img.onerror = () => {
      toast.error("Falha ao carregar imagem para composição.");
    };
    img.src = url;
  }

  const paperSizes: PaperSize[] = ["A4 Retrato", "A4 Paisagem", "Carta", "Personalizado"];
  const orientations: Orientation[] = ["Retrato", "Paisagem"];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Printer className="h-5 w-5" />
        <h3 className="text-base font-semibold">Exportar para PDF / Print</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Tamanho do papel</span>
        <div className="grid grid-cols-2 gap-2">
          {paperSizes.map((size) => (
            <Button
              key={size}
              type="button"
              variant={paperSize === size ? "default" : "outline"}
              size="sm"
              onClick={() => setPaperSize(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {paperSize === "Personalizado" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Dimensões personalizadas (mm)</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Largura</span>
              <Input
                type="number"
                min={10}
                max={2000}
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Altura</span>
              <Input
                type="number"
                min={10}
                max={2000}
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Orientação</span>
        <div className="grid grid-cols-2 gap-2">
          {orientations.map((o) => (
            <Button
              key={o}
              type="button"
              variant={orientation === o ? "default" : "outline"}
              size="sm"
              onClick={() => setOrientation(o)}
            >
              {o}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Margem</span>
          <span className="text-xs text-muted-foreground">{margin} mm</span>
        </div>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={margin}
          onChange={(e) => setMargin(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="include-bg"
          type="checkbox"
          checked={includeBackground}
          onChange={(e) => setIncludeBackground(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="include-bg" className="text-sm">
          Incluir fundo do canvas
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Multiplicador de qualidade</span>
          <span className="text-xs text-muted-foreground">{quality}x</span>
        </div>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-muted-foreground">
          Maior = melhor resolução de saída
        </span>
      </div>

      <div className="rounded-md border p-3 text-xs flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Canvas atual:</span>
          <span className="font-mono">
            {canvasDims.w} x {canvasDims.h} px
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Papel (mm):</span>
          <span className="font-mono">
            {paperMm.width} x {paperMm.height} mm
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Papel (px @96dpi):</span>
          <span className="font-mono">
            {paperPx.width} x {paperPx.height} px
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Margem (px):</span>
          <span className="font-mono">{mmToPx(margin, DPI)} px</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleExportPng} variant="default">
          Exportar como PNG (Alta Res)
        </Button>
        <Button type="button" onClick={handlePrintNow} variant="outline">
          Imprimir Agora
        </Button>
        <Button type="button" onClick={handleSaveAsPaperSize} variant="outline">
          Salvar como Imagem em Tamanho do Papel
        </Button>
      </div>
    </div>
  );
}
